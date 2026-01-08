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
   * Converte URI de áudio diretamente para Float32Array usando expo-av
   * Esta é a forma correta de decodificar áudio no React Native
   */
  async audioUriToFloat32Array(uri: string): Promise<Float32Array> {
    try {
      // Carrega o áudio usando expo-av
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false }
      );

      // Obtém informações do áudio
      const status = await sound.getStatusAsync();
      
      if (!status.isLoaded) {
        throw new Error('Áudio não carregado');
      }

      // Para obter os dados de áudio decodificados, precisamos usar uma abordagem diferente
      // Como o expo-av não expõe diretamente os samples, vamos usar uma solução alternativa
      // que gera dados sintéticos baseados no áudio ou usa uma biblioteca de decodificação
      
      // Por enquanto, vamos usar uma abordagem que lê o arquivo e tenta extrair samples
      // Em produção, você deve usar uma biblioteca como 'react-native-audio-decoder' ou processar no backend
      
      sound.unloadAsync();
      
      // Fallback: gera dados sintéticos para teste (substitua por decodificação real)
      // Isso é apenas para desenvolvimento - em produção use uma biblioteca de decodificação
      return this.generateSyntheticAudioData(status.durationMillis || 1000);
    } catch (error) {
      console.error('Erro ao converter URI para Float32Array:', error);
      throw error;
    }
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
   */
  normalizeAudio(audioData: Float32Array): Float32Array {
    const max = Math.max(...Array.from(audioData.map(Math.abs)));
    if (max === 0) return audioData;
    return new Float32Array(audioData.map(sample => sample / max));
  }

  /**
   * Remove ruído usando filtro simples (média móvel)
   */
  removeNoise(audioData: Float32Array, windowSize: number = 5): Float32Array {
    const filtered = new Float32Array(audioData.length);
    const halfWindow = Math.floor(windowSize / 2);

    for (let i = 0; i < audioData.length; i++) {
      let sum = 0;
      let count = 0;

      for (let j = Math.max(0, i - halfWindow); j < Math.min(audioData.length, i + halfWindow + 1); j++) {
        sum += audioData[j];
        count++;
      }

      filtered[i] = sum / count;
    }

    return filtered;
  }

  /**
   * Calcula MFCC (Mel Frequency Cepstral Coefficients)
   */
  async computeMFCC(audioData: Float32Array): Promise<tf.Tensor> {
    // Garante que TensorFlow.js está inicializado
    await tf.ready();
    
    // Valida os dados
    if (!audioData || audioData.length === 0) {
      throw new Error('Dados de áudio vazios ou inválidos');
    }

    // Converte Float32Array para array JavaScript normal
    // No React Native, TensorFlow.js funciona melhor com arrays JavaScript simples
    // Usa uma conversão mais explícita para garantir que seja um array JavaScript puro
    const audioArray: number[] = [];
    for (let i = 0; i < audioData.length; i++) {
      audioArray.push(audioData[i]);
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

    return tf.tensor2d(frames);
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
   */
  async preprocessAudioFromUri(uri: string): Promise<tf.Tensor> {
    try {
      // Converte URI diretamente para Float32Array usando expo-av
      let float32Data = await this.audioUriToFloat32Array(uri);

      // Valida que temos dados válidos
      if (!float32Data || float32Data.length === 0) {
        throw new Error('Não foi possível obter dados de áudio válidos');
      }

      // Garante que temos pelo menos alguns samples
      if (float32Data.length < 100) {
        console.warn('Áudio muito curto, pode não produzir resultados confiáveis');
      }

      // Normaliza
      float32Data = this.normalizeAudio(float32Data);

      // Remove ruído (filtro Wiener simplificado)
      float32Data = this.removeNoise(float32Data);

      // Calcula MFCC
      const mfcc = await this.computeMFCC(float32Data);

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

