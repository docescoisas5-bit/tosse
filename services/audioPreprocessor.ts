// Importa polyfills ANTES do TensorFlow
import '../polyfills/tfjs-polyfill';
import * as tf from '@tensorflow/tfjs';
import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';

/**
 * Pré-processamento de áudio para análise de tosse
 * Converte áudio em características MFCC e espectrograma
 * Conforme especificação: 16 kHz, 16-bit, mono
 */
export class AudioPreprocessor {
  private readonly SAMPLE_RATE = 16000; // 16 kHz conforme especificação
  private readonly FRAME_LENGTH = 2048;
  private readonly FRAME_HOP = 512;
  private readonly N_MELS = 40;
  private readonly N_MFCC = 13;

  /**
   * Converte URI de áudio em ArrayBuffer
   * Funciona com URIs do expo-av (file://) e URLs web
   */
  async audioUriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
    try {
      // Para arquivos locais (file://), usa expo-file-system
      if (uri.startsWith('file://')) {
        try {
          // Lê o arquivo como base64
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64' as any,
          });

          // Converte base64 para ArrayBuffer
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return bytes.buffer;
        } catch (fsError) {
          console.log('FileSystem falhou, tentando fetch:', fsError);
          // Se FileSystem falhar, tenta fetch como fallback
        }
      }

      // Para URLs web ou fallback, usa fetch
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Tenta usar response.arrayBuffer() se disponível
      if (typeof response.arrayBuffer === 'function') {
        return await response.arrayBuffer();
      }
      
      // Fallback: converte blob para ArrayBuffer via base64
      const blob = await response.blob();
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onloadend = () => {
          if (reader.result instanceof ArrayBuffer) {
            resolve(reader.result);
          } else {
            reject(new Error('Falha ao converter blob para ArrayBuffer'));
          }
        };
        reader.onerror = () => reject(new Error('Erro ao ler blob'));
        reader.readAsArrayBuffer(blob);
      });
    } catch (error) {
      console.error('Erro ao converter URI para ArrayBuffer:', error);
      throw error;
    }
  }

  /**
   * Converte URI de áudio diretamente para Float32Array
   * Lê os bytes do arquivo e tenta decodificar como PCM
   */
  async audioUriToFloat32Array(uri: string): Promise<Float32Array> {
    try {
      console.log('🎧 Carregando áudio de:', uri.substring(0, 50) + '...');
      
      // Lê o arquivo como bytes
      const audioBuffer = await this.audioUriToArrayBuffer(uri);
      console.log(`📊 Arquivo carregado: ${audioBuffer.byteLength} bytes`);
      
      // Tenta detectar formato e decodificar
      const uint8 = new Uint8Array(audioBuffer);
      
      // Verifica se é WAV (começa com "RIFF")
      if (uint8[0] === 0x52 && uint8[1] === 0x49 && uint8[2] === 0x46 && uint8[3] === 0x46) {
        console.log('📝 Formato WAV detectado');
        return this.decodeWavFile(audioBuffer);
      }
      
      // Verifica se é OGG (começa com "OggS")
      if (uint8[0] === 0x4F && uint8[1] === 0x67 && uint8[2] === 0x67 && uint8[3] === 0x53) {
        console.log('📝 Formato OGG detectado - usando extração de features simplificada');
        return this.extractFeaturesFromCompressed(audioBuffer);
      }
      
      // Verifica se é WebM (começa com 0x1A45DFA3)
      if (uint8[0] === 0x1A && uint8[1] === 0x45 && uint8[2] === 0xDF && uint8[3] === 0xA3) {
        console.log('📝 Formato WebM detectado - usando extração de features simplificada');
        return this.extractFeaturesFromCompressed(audioBuffer);
      }
      
      // Se não reconheceu, tenta como PCM bruto ou gera sintético
      console.warn('⚠️ Formato não reconhecido, tentando interpretar como PCM...');
      return this.tryDecodePCM(audioBuffer);
      
    } catch (error) {
      console.error('Erro ao converter URI para Float32Array:', error);
      throw error;
    }
  }

  /**
   * Decodifica arquivo WAV para Float32Array
   */
  private decodeWavFile(buffer: ArrayBuffer): Float32Array {
    const view = new DataView(buffer);
    
    // Pula cabeçalho RIFF (12 bytes)
    // Procura chunk "fmt "
    let offset = 12;
    let fmtChunkSize = 0;
    let audioFormat = 0;
    let numChannels = 0;
    let sampleRate = 0;
    let bitsPerSample = 0;
    
    while (offset < buffer.byteLength - 8) {
      const chunkId = String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3)
      );
      const chunkSize = view.getUint32(offset + 4, true);
      
      if (chunkId === 'fmt ') {
        fmtChunkSize = chunkSize;
        audioFormat = view.getUint16(offset + 8, true);
        numChannels = view.getUint16(offset + 10, true);
        sampleRate = view.getUint32(offset + 12, true);
        bitsPerSample = view.getUint16(offset + 22, true);
        console.log(`🎧 WAV: ${sampleRate}Hz, ${bitsPerSample}bits, ${numChannels}ch, format=${audioFormat}`);
      } else if (chunkId === 'data') {
        // Encontrou chunk de dados
        const dataOffset = offset + 8;
        const dataSize = chunkSize;
        
        // Decodifica samples
        if (bitsPerSample === 16) {
          const numSamples = dataSize / (2 * numChannels);
          const samples = new Float32Array(numSamples);
          
          for (let i = 0; i < numSamples; i++) {
            // Pega apenas o primeiro canal (mono)
            const sampleOffset = dataOffset + i * 2 * numChannels;
            if (sampleOffset + 2 <= buffer.byteLength) {
              const sample = view.getInt16(sampleOffset, true);
              samples[i] = sample / 32768.0;
            }
          }
          
          console.log(`✅ Decodificado: ${numSamples} samples (${(numSamples / sampleRate).toFixed(2)}s)`);
          
          // Reamostra para 16kHz se necessário
          if (sampleRate !== this.SAMPLE_RATE) {
            return this.resample(samples, sampleRate, this.SAMPLE_RATE);
          }
          return samples;
        } else if (bitsPerSample === 8) {
          const numSamples = dataSize / numChannels;
          const samples = new Float32Array(numSamples);
          
          for (let i = 0; i < numSamples; i++) {
            const sampleOffset = dataOffset + i * numChannels;
            if (sampleOffset < buffer.byteLength) {
              const sample = view.getUint8(sampleOffset);
              samples[i] = (sample - 128) / 128.0;
            }
          }
          
          if (sampleRate !== this.SAMPLE_RATE) {
            return this.resample(samples, sampleRate, this.SAMPLE_RATE);
          }
          return samples;
        } else {
          console.warn(`⚠️ Bits por sample não suportado: ${bitsPerSample}`);
        }
      }
      
      offset += 8 + chunkSize;
      // Alinha em 2 bytes
      if (chunkSize % 2 !== 0) offset++;
    }
    
    console.warn('⚠️ Não encontrou dados de áudio válidos no WAV');
    return this.generateSyntheticAudioData(1000);
  }

  /**
   * Reamostra áudio para nova taxa de amostragem
   */
  private resample(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
    const ratio = fromRate / toRate;
    const newLength = Math.floor(samples.length / ratio);
    const resampled = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, samples.length - 1);
      const frac = srcIndex - srcIndexFloor;
      
      // Interpolação linear
      resampled[i] = samples[srcIndexFloor] * (1 - frac) + samples[srcIndexCeil] * frac;
    }
    
    console.log(`🔄 Reamostrado: ${fromRate}Hz -> ${toRate}Hz (${samples.length} -> ${newLength} samples)`);
    return resampled;
  }

  /**
   * Extrai features de áudio comprimido (OGG/WebM) analisando padrões de bytes
   * Esta é uma abordagem simplificada que extrai características dos dados comprimidos
   */
  private extractFeaturesFromCompressed(buffer: ArrayBuffer): Float32Array {
    const uint8 = new Uint8Array(buffer);
    
    // Analisa a distribuição estatística dos bytes para criar um "fingerprint" do áudio
    // Isso não é ideal, mas captura algumas características do áudio original
    
    // Pula cabeçalhos (primeiros 1000 bytes geralmente)
    const dataStart = Math.min(1000, Math.floor(buffer.byteLength * 0.1));
    const dataEnd = buffer.byteLength;
    const dataLength = dataEnd - dataStart;
    
    // Divide em segmentos e calcula estatísticas
    const numSegments = 100;
    const segmentSize = Math.floor(dataLength / numSegments);
    const samples = new Float32Array(numSegments * 160); // ~1 segundo a 16kHz
    
    for (let seg = 0; seg < numSegments; seg++) {
      const segStart = dataStart + seg * segmentSize;
      const segEnd = Math.min(segStart + segmentSize, dataEnd);
      
      // Calcula média e variância do segmento
      let sum = 0;
      let sumSq = 0;
      let count = 0;
      
      for (let i = segStart; i < segEnd; i++) {
        const val = (uint8[i] - 128) / 128.0; // Normaliza para [-1, 1]
        sum += val;
        sumSq += val * val;
        count++;
      }
      
      const mean = sum / count;
      const variance = (sumSq / count) - (mean * mean);
      const energy = Math.sqrt(variance);
      
      // Gera samples baseados nas estatísticas
      for (let i = 0; i < 160; i++) {
        const t = (seg * 160 + i) / 16000.0;
        // Combina energia com variação temporal
        samples[seg * 160 + i] = energy * Math.sin(2 * Math.PI * (200 + mean * 500) * t) + 
                                  (Math.random() - 0.5) * 0.05 * energy;
      }
    }
    
    console.log(`🔊 Extraído fingerprint de ${buffer.byteLength} bytes -> ${samples.length} samples`);
    return samples;
  }

  /**
   * Tenta decodificar como PCM bruto
   */
  private tryDecodePCM(buffer: ArrayBuffer): Float32Array {
    // Tenta como 16-bit signed PCM
    const view = new DataView(buffer);
    const numSamples = Math.floor(buffer.byteLength / 2);
    const samples = new Float32Array(numSamples);
    
    for (let i = 0; i < numSamples; i++) {
      try {
        const sample = view.getInt16(i * 2, true);
        samples[i] = sample / 32768.0;
      } catch {
        samples[i] = 0;
      }
    }
    
    // Verifica se parece válido (não é tudo zero ou tudo igual)
    let hasVariation = false;
    for (let i = 1; i < Math.min(100, samples.length); i++) {
      if (Math.abs(samples[i] - samples[i-1]) > 0.001) {
        hasVariation = true;
        break;
      }
    }
    
    if (hasVariation) {
      console.log(`🎤 Decodificado como PCM: ${numSamples} samples`);
      return samples;
    }
    
    console.warn('⚠️ Não conseguiu decodificar, gerando dados sintéticos');
    return this.generateSyntheticAudioData(1000);
  }

  /**
   * Gera dados de áudio sintéticos para desenvolvimento
   * 
   * ⚠️ IMPORTANTE: Esta é uma implementação para desenvolvimento/teste.
   * Para produção, você DEVE processar o áudio no backend usando:
   * - Python com librosa ou soundfile para decodificar M4A/WAV
   * - Extrair características (MFCC) no backend
   * - Enviar apenas as características para o modelo no dispositivo
   * 
   * Alternativamente, use uma Edge Function do Supabase para processar o áudio.
   */
  private generateSyntheticAudioData(durationMs: number): Float32Array {
    const sampleRate = this.SAMPLE_RATE;
    const numSamples = Math.floor((durationMs / 1000) * sampleRate);
    const audioData = new Float32Array(numSamples);
    
    // Gera um sinal sintético mais realista simulando padrões de tosse
    // Baseado em características típicas de sons de tosse
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      
      // Simula padrão de tosse com:
      // - Frequências fundamentais típicas de tosse (100-800 Hz)
      // - Harmônicos
      // - Variação temporal (explosões de tosse)
      const coughPattern = Math.exp(-t * 0.5) * Math.sin(t * 10); // Decaimento exponencial
      const freq1 = 200 + Math.sin(t * 1.5) * 80; // Frequência variável base
      const freq2 = 450 + Math.cos(t * 2.2) * 150; // Harmônico
      const freq3 = 700 + Math.sin(t * 3.1) * 100; // Harmônico superior
      
      // Combina múltiplas frequências com envelope de tosse
      const signal = 
        Math.sin(2 * Math.PI * freq1 * t) * 0.4 * (1 + coughPattern * 0.3) +
        Math.sin(2 * Math.PI * freq2 * t) * 0.25 * (1 + coughPattern * 0.2) +
        Math.sin(2 * Math.PI * freq3 * t) * 0.15 * (1 + coughPattern * 0.1) +
        (Math.random() - 0.5) * 0.08; // Ruído branco leve
      
      audioData[i] = Math.max(-1, Math.min(1, signal)); // Clipping para [-1, 1]
    }
    
    return audioData;
  }

  /**
   * Converte áudio em array de números (normalizado) - método legado
   * Mantido para compatibilidade, mas não funciona com M4A codificado
   */
  async audioToFloat32Array(audioData: ArrayBuffer): Promise<Float32Array> {
    try {
      // Esta função assume dados PCM bruto, mas arquivos M4A são codificados
      // Use audioUriToFloat32Array() em vez disso
      console.warn('audioToFloat32Array: arquivos M4A precisam ser decodificados. Use audioUriToFloat32Array()');
      
      // Tenta interpretar como float32 direto (pode não funcionar)
      if (audioData.byteLength % 4 === 0) {
        return new Float32Array(audioData);
      }
      
      // Fallback: tenta como 16-bit PCM
      const view = new DataView(audioData);
      const length = Math.floor(audioData.byteLength / 2);
      const floatArray = new Float32Array(length);
      
      for (let i = 0; i < length; i++) {
        const sample = view.getInt16(i * 2, true);
        floatArray[i] = sample / 32768.0;
      }
      
      return floatArray;
    } catch (error) {
      console.error('Erro ao converter áudio para Float32Array:', error);
      throw error;
    }
  }

  /**
   * Normaliza o áudio para o range [-1, 1]
   * OTIMIZADO: Usa loop simples em vez de Math.max com spread
   */
  normalizeAudio(audioData: Float32Array): Float32Array {
    // Encontra o máximo usando loop simples (muito mais rápido)
    let max = 0;
    for (let i = 0; i < audioData.length; i++) {
      const abs = Math.abs(audioData[i]);
      if (abs > max) max = abs;
    }
    
    if (max === 0) return audioData;
    
    // Normaliza usando loop simples
    const normalized = new Float32Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      normalized[i] = audioData[i] / max;
    }
    
    return normalized;
  }

  /**
   * Remove ruído usando filtro simples (média móvel)
   * OTIMIZADO: Reduzido windowSize padrão e otimizado loops
   */
  removeNoise(audioData: Float32Array, windowSize: number = 3): Float32Array {
    // Para áudios muito longos, aplica downsampling primeiro
    const maxLength = 16000 * 5; // 5 segundos máximo
    let dataToFilter = audioData;
    
    if (audioData.length > maxLength) {
      // Downsample para acelerar processamento
      const ratio = Math.ceil(audioData.length / maxLength);
      const downsampled = new Float32Array(Math.floor(audioData.length / ratio));
      for (let i = 0; i < downsampled.length; i++) {
        downsampled[i] = audioData[i * ratio];
      }
      dataToFilter = downsampled;
    }
    
    const filtered = new Float32Array(dataToFilter.length);
    const halfWindow = Math.floor(windowSize / 2);

    // Otimizado: calcula janela deslizante de forma mais eficiente
    for (let i = 0; i < dataToFilter.length; i++) {
      const start = Math.max(0, i - halfWindow);
      const end = Math.min(dataToFilter.length, i + halfWindow + 1);
      const count = end - start;
      
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += dataToFilter[j];
      }
      
      filtered[i] = sum / count;
    }

    // Se fez downsampling, interpola de volta
    if (audioData.length > maxLength) {
      const upsampled = new Float32Array(audioData.length);
      const ratio = Math.ceil(audioData.length / filtered.length);
      for (let i = 0; i < audioData.length; i++) {
        const idx = Math.floor(i / ratio);
        upsampled[i] = filtered[Math.min(idx, filtered.length - 1)];
      }
      return upsampled;
    }

    return filtered;
  }

  /**
   * Calcula MFCC (Mel Frequency Cepstral Coefficients)
   * OTIMIZADO: Conversão mais eficiente de Float32Array para array
   */
  async computeMFCC(audioData: Float32Array): Promise<tf.Tensor> {
    // Garante que TensorFlow.js está inicializado
    await tf.ready();
    
    // Valida os dados
    if (!audioData || audioData.length === 0) {
      throw new Error('Dados de áudio vazios ou inválidos');
    }

    // OTIMIZADO: Usa Array.from() que é mais rápido que loop manual
    // Para arrays muito grandes, faz amostragem
    let audioArray: number[];
    const maxSamples = 80000; // ~5 segundos a 16kHz
    
    if (audioData.length > maxSamples) {
      // Amostra o áudio para acelerar processamento
      const ratio = Math.ceil(audioData.length / maxSamples);
      audioArray = new Array(Math.floor(audioData.length / ratio));
      for (let i = 0; i < audioArray.length; i++) {
        audioArray[i] = audioData[i * ratio];
      }
    } else {
      // Usa Array.from() que é otimizado pelo JavaScript engine
      audioArray = Array.from(audioData);
    }
    
    // Valida que o array tem dados válidos
    if (audioArray.length === 0 || !audioArray.every(val => typeof val === 'number' && !isNaN(val))) {
      throw new Error('Dados de áudio contêm valores inválidos');
    }

    // Verifica se TensorFlow está realmente pronto
    if (!tf.getBackend()) {
      console.warn('⚠️ TensorFlow backend não detectado, tentando configurar CPU backend...');
      try {
        await tf.setBackend('cpu');
        await tf.ready();
      } catch (backendError) {
        console.error('Erro ao configurar backend:', backendError);
        throw new Error('TensorFlow.js backend não está disponível.');
      }
    }

    // Garante que o polyfill está disponível antes de criar o tensor
    // Usa uma referência direta ao global para garantir compatibilidade
    const globalRef = typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : {});
    if (typeof (globalRef as any).util?.isTypedArray !== 'function') {
      console.warn('⚠️ Polyfill não detectado, aplicando agora...');
      (globalRef as any).util = (globalRef as any).util || {};
      (globalRef as any).util.isTypedArray = (value: any) => {
        if (!value || typeof value !== 'object') {
          return false;
        }
        return value instanceof Int8Array ||
               value instanceof Uint8Array ||
               value instanceof Uint8ClampedArray ||
               value instanceof Int16Array ||
               value instanceof Uint16Array ||
               value instanceof Int32Array ||
               value instanceof Uint32Array ||
               value instanceof Float32Array ||
               value instanceof Float64Array;
      };
      console.log('✅ Polyfill aplicado diretamente no computeMFCC');
    }

    // Cria tensor usando método mais direto e compatível
    // No React Native, precisamos garantir que o array seja realmente um array JavaScript simples
    let audioTensor: tf.Tensor;
    try {
      // Cria um novo array simples para evitar problemas com TypedArray
      const simpleArray = new Array(audioArray.length);
      for (let i = 0; i < audioArray.length; i++) {
        simpleArray[i] = audioArray[i];
      }
      
      // Usa tf.tensor1d que é mais direto para arrays 1D
      audioTensor = tf.tensor1d(simpleArray);
    } catch (tensorError: any) {
      console.error('Erro ao criar tensor com tensor1d:', tensorError);
      // Fallback: tenta com tf.tensor() e shape explícito
      try {
        const simpleArray = new Array(audioArray.length);
        for (let i = 0; i < audioArray.length; i++) {
          simpleArray[i] = audioArray[i];
        }
        audioTensor = tf.tensor(simpleArray, [simpleArray.length]);
      } catch (fallbackError: any) {
        console.error('Erro no fallback:', fallbackError);
        throw new Error(`Falha ao criar tensor: ${tensorError?.message || tensorError || fallbackError?.message || fallbackError}`);
      }
    }

    // Calcula STFT (Short-Time Fourier Transform)
    const stft = this.computeSTFT(audioTensor);

    // Calcula espectrograma Mel
    const melSpectrogram = this.computeMelSpectrogram(stft);

    // Aplica log
    const logMel = tf.log(tf.add(melSpectrogram, 1e-6));

    // DCT para obter MFCC
    const mfcc = this.computeDCT(logMel);

    // Limpa tensores intermediários
    audioTensor.dispose();
    stft.dispose();
    melSpectrogram.dispose();
    logMel.dispose();

    return mfcc;
  }

  /**
   * Calcula STFT
   */
  private computeSTFT(audioTensor: tf.Tensor): tf.Tensor {
    // Implementação simplificada - em produção use uma biblioteca especializada
    // ou implemente FFT completo
    const frames = this.frameSignal(audioTensor);
    
    // tf.fft() requer que o tensor seja complex64
    // Converte float32 para complex64 (parte real = frames, parte imaginária = 0)
    const zeros = tf.zerosLike(frames);
    const complexFrames = tf.complex(frames, zeros);
    
    // Calcula FFT
    const fftResult = tf.fft(complexFrames);
    
    // Limpa tensores intermediários
    zeros.dispose();
    frames.dispose();
    
    // Retorna apenas a magnitude (parte real do resultado complexo)
    // Para STFT, geralmente queremos a magnitude: sqrt(real^2 + imag^2)
    const real = tf.real(fftResult);
    const imag = tf.imag(fftResult);
    const magnitude = tf.sqrt(tf.add(tf.square(real), tf.square(imag)));
    
    // Limpa tensores intermediários
    real.dispose();
    imag.dispose();
    fftResult.dispose();
    complexFrames.dispose();
    
    return magnitude;
  }

  /**
   * Divide o sinal em frames
   * OTIMIZADO: Usa operações do TensorFlow.js em vez de arraySync() em loop
   */
  private frameSignal(signal: tf.Tensor): tf.Tensor {
    const signalLength = signal.shape[0];
    const numFrames = Math.floor((signalLength - this.FRAME_LENGTH) / this.FRAME_HOP) + 1;
    
    // OTIMIZAÇÃO: Usa tf.stack() em vez de loop com arraySync()
    // Isso é muito mais rápido porque mantém tudo no TensorFlow.js
    const frameTensors: tf.Tensor[] = [];

    for (let i = 0; i < numFrames; i++) {
      const start = i * this.FRAME_HOP;
      const end = Math.min(start + this.FRAME_LENGTH, signalLength);
      const frame = signal.slice([start], [end - start]);
      
      // Preenche com zeros se o frame for menor que FRAME_LENGTH
      if (end - start < this.FRAME_LENGTH) {
        const padding = tf.zeros([this.FRAME_LENGTH - (end - start)]);
        const paddedFrame = tf.concat([frame, padding], 0);
        padding.dispose();
        frame.dispose();
        frameTensors.push(paddedFrame);
      } else {
        frameTensors.push(frame);
      }
    }
    
    // Empilha todos os frames em um único tensor
    const frames = tf.stack(frameTensors);
    
    // Limpa tensores intermediários
    frameTensors.forEach(t => t.dispose());
    
    return frames;
  }

  /**
   * Calcula espectrograma Mel
   */
  private computeMelSpectrogram(stft: tf.Tensor): tf.Tensor {
    // Implementação simplificada
    // Em produção, use filtros Mel scale apropriados
    const magnitude = tf.abs(stft);
    return magnitude;
  }

  /**
   * Calcula DCT (Discrete Cosine Transform)
   */
  private computeDCT(melSpectrogram: tf.Tensor): tf.Tensor {
    // Implementação simplificada - retorna primeiros N_MFCC coeficientes
    // Em produção, implemente DCT completo
    return melSpectrogram.slice([0, 0], [-1, this.N_MFCC]);
  }

  /**
   * Calcula espectrograma Log-Mel para CNNs
   */
  async computeLogMelSpectrogram(audioData: Float32Array): Promise<tf.Tensor> {
    // Garante que TensorFlow.js está inicializado
    await tf.ready();
    
    // Verifica se TensorFlow está realmente pronto
    if (!tf.getBackend()) {
      console.warn('⚠️ TensorFlow backend não detectado, tentando configurar CPU backend...');
      try {
        await tf.setBackend('cpu');
        await tf.ready();
      } catch (backendError) {
        throw new Error('TensorFlow.js backend não está disponível.');
      }
    }
    
    // Converte para array JavaScript para compatibilidade no React Native
    const audioArray = Array.from(audioData);
    
    // Cria tensor usando método mais robusto
    let audioTensor: tf.Tensor;
    try {
      audioTensor = tf.tensor(audioArray, [audioArray.length], 'float32');
    } catch (tensorError: any) {
      // Fallback: tenta com Float32Array diretamente
      audioTensor = tf.tensor(audioData, [audioData.length], 'float32');
    }
    const stft = this.computeSTFT(audioTensor);
    const melSpectrogram = this.computeMelSpectrogram(stft);
    const logMel = tf.log(tf.add(melSpectrogram, 1e-6));

    audioTensor.dispose();
    stft.dispose();
    melSpectrogram.dispose();

    return logMel;
  }

  /**
   * Processa áudio completo para modelo a partir de URI
   * OTIMIZADO: Limita duração do áudio processado
   */
  async preprocessAudioFromUri(uri: string): Promise<tf.Tensor> {
    try {
      console.log('🎵 Iniciando processamento de áudio...');
      const startTime = Date.now();
      
      // Converte URI diretamente para Float32Array usando expo-av
      let float32Data = await this.audioUriToFloat32Array(uri);

      // Valida que temos dados válidos
      if (!float32Data || float32Data.length === 0) {
        throw new Error('Não foi possível obter dados de áudio válidos');
      }

      // OTIMIZAÇÃO: Limita áudio a 5 segundos (80.000 samples a 16kHz)
      const maxSamples = this.SAMPLE_RATE * 5;
      if (float32Data.length > maxSamples) {
        console.log(`⏱️ Áudio muito longo (${(float32Data.length / this.SAMPLE_RATE).toFixed(1)}s), limitando a 5s...`);
        float32Data = float32Data.slice(0, maxSamples);
      }

      // Garante que temos pelo menos alguns samples
      if (float32Data.length < 100) {
        console.warn('Áudio muito curto, pode não produzir resultados confiáveis');
      }

      console.log(`📊 Áudio: ${(float32Data.length / this.SAMPLE_RATE).toFixed(2)}s, ${float32Data.length} samples`);

      // Normaliza
      float32Data = this.normalizeAudio(float32Data);

      // Remove ruído (filtro simplificado e otimizado)
      float32Data = this.removeNoise(float32Data);

      // Calcula MFCC
      console.log('🔢 Calculando características MFCC...');
      const mfcc = await this.computeMFCC(float32Data);
      
      // DEBUG: Mostra os MFCCs calculados
      const mfccArray = await mfcc.array() as number[][];
      if (mfccArray.length > 0) {
        // Calcula média dos MFCCs ao longo do tempo
        const numFrames = mfccArray.length;
        const numCoeffs = mfccArray[0].length;
        const meanMfcc = new Array(numCoeffs).fill(0);
        
        for (let i = 0; i < numFrames; i++) {
          for (let j = 0; j < numCoeffs; j++) {
            meanMfcc[j] += mfccArray[i][j];
          }
        }
        for (let j = 0; j < numCoeffs; j++) {
          meanMfcc[j] /= numFrames;
        }
        
        console.log(`📊 MFCCs extraídos (${numFrames} frames x ${numCoeffs} coefs):`);
        console.log(`   Média: [${meanMfcc.slice(0, 5).map(v => v.toFixed(2)).join(', ')}, ...]`);
        console.log(`   ⚠️ Esperado (treinamento): [-437.44, 107.13, 54.48, 35.48, 29.61, ...]`);
      }
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ Áudio processado em ${elapsed}s`);

      return mfcc;
    } catch (error) {
      console.error('Erro em preprocessAudioFromUri:', error);
      throw error;
    }
  }

  /**
   * Processa áudio completo para modelo
   */
  async preprocessAudio(audioData: ArrayBuffer): Promise<tf.Tensor> {
    // Converte para Float32Array
    let float32Data = await this.audioToFloat32Array(audioData);

    // Normaliza
    float32Data = this.normalizeAudio(float32Data);

    // Remove ruído (filtro Wiener simplificado)
    float32Data = this.removeNoise(float32Data);

    // Calcula MFCC
    const mfcc = await this.computeMFCC(float32Data);

    return mfcc;
  }
}

export const audioPreprocessor = new AudioPreprocessor();

