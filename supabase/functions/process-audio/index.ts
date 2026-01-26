// Supabase Edge Function para processar áudio e extrair MFCCs
// Usa implementação compatível com librosa

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Parâmetros MFCC compatíveis com librosa
const SAMPLE_RATE = 16000;
const N_FFT = 2048;
const HOP_LENGTH = 512;
const N_MELS = 40;
const N_MFCC = 13;
const F_MIN = 0;
const F_MAX = 8000;

// Parâmetros de normalização do modelo treinado
const SCALER_MEAN = [
  -437.44, 107.13, 54.48, 35.48, 29.61,
  25.84, 18.68, 15.43, 14.40, 14.23,
  10.49, 9.06, 8.18
];
const SCALER_SCALE = [
  96.71, 26.81, 15.81, 13.66, 9.60,
  8.29, 7.18, 5.94, 4.93, 4.24,
  4.21, 3.64, 3.36
];

// Função para converter Hz para Mel scale
function hzToMel(hz: number): number {
  return 2595 * Math.log10(1 + hz / 700);
}

// Função para converter Mel para Hz
function melToHz(mel: number): number {
  return 700 * (Math.pow(10, mel / 2595) - 1);
}

// Criar banco de filtros Mel
function createMelFilterbank(
  numFilters: number,
  fftSize: number,
  sampleRate: number,
  fMin: number,
  fMax: number
): number[][] {
  const melMin = hzToMel(fMin);
  const melMax = hzToMel(fMax);
  const melPoints = new Array(numFilters + 2);
  
  for (let i = 0; i < numFilters + 2; i++) {
    melPoints[i] = melMin + (i * (melMax - melMin)) / (numFilters + 1);
  }
  
  const hzPoints = melPoints.map(melToHz);
  const binPoints = hzPoints.map(hz => 
    Math.floor((fftSize + 1) * hz / sampleRate)
  );
  
  const filterbank: number[][] = [];
  const numBins = Math.floor(fftSize / 2) + 1;
  
  for (let i = 0; i < numFilters; i++) {
    const filter = new Array(numBins).fill(0);
    const start = binPoints[i];
    const center = binPoints[i + 1];
    const end = binPoints[i + 2];
    
    // Rampa ascendente
    for (let j = start; j < center; j++) {
      if (j >= 0 && j < numBins) {
        filter[j] = (j - start) / (center - start);
      }
    }
    
    // Rampa descendente
    for (let j = center; j < end; j++) {
      if (j >= 0 && j < numBins) {
        filter[j] = (end - j) / (end - center);
      }
    }
    
    filterbank.push(filter);
  }
  
  return filterbank;
}

// Aplicar janela Hann
function hannWindow(size: number): number[] {
  const window = new Array(size);
  for (let i = 0; i < size; i++) {
    window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
  }
  return window;
}

// FFT simples (Cooley-Tukey)
function fft(real: number[], imag: number[]): void {
  const n = real.length;
  if (n <= 1) return;
  
  // Bit reversal
  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
    let k = n >> 1;
    while (k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }
  
  // FFT
  for (let len = 2; len <= n; len <<= 1) {
    const halfLen = len >> 1;
    const theta = -2 * Math.PI / len;
    const wReal = Math.cos(theta);
    const wImag = Math.sin(theta);
    
    for (let i = 0; i < n; i += len) {
      let uReal = 1, uImag = 0;
      
      for (let k = 0; k < halfLen; k++) {
        const evenIdx = i + k;
        const oddIdx = i + k + halfLen;
        
        const tReal = uReal * real[oddIdx] - uImag * imag[oddIdx];
        const tImag = uReal * imag[oddIdx] + uImag * real[oddIdx];
        
        real[oddIdx] = real[evenIdx] - tReal;
        imag[oddIdx] = imag[evenIdx] - tImag;
        real[evenIdx] = real[evenIdx] + tReal;
        imag[evenIdx] = imag[evenIdx] + tImag;
        
        const newUReal = uReal * wReal - uImag * wImag;
        uImag = uReal * wImag + uImag * wReal;
        uReal = newUReal;
      }
    }
  }
}

// Calcular espectro de potência
function powerSpectrum(samples: number[], fftSize: number): number[] {
  const paddedSize = Math.pow(2, Math.ceil(Math.log2(fftSize)));
  const real = new Array(paddedSize).fill(0);
  const imag = new Array(paddedSize).fill(0);
  const window = hannWindow(fftSize);
  
  // Aplicar janela
  for (let i = 0; i < Math.min(samples.length, fftSize); i++) {
    real[i] = samples[i] * window[i];
  }
  
  fft(real, imag);
  
  // Calcular magnitude ao quadrado (potência) com normalização
  const numBins = Math.floor(paddedSize / 2) + 1;
  const power = new Array(numBins);
  const norm = 1.0 / paddedSize;
  
  for (let i = 0; i < numBins; i++) {
    // Normaliza os coeficientes para bater com o librosa
    power[i] = (real[i] * real[i] + imag[i] * imag[i]) * norm;
  }
  
  return power;
}

// DCT-II (para converter mel-spectrogram em MFCCs) - Versão Orto-normalizada
function dct(input: number[], numCoeffs: number): number[] {
  const n = input.length;
  const output = new Array(numCoeffs);
  
  for (let k = 0; k < numCoeffs; k++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += input[i] * Math.cos(Math.PI * k * (2 * i + 1) / (2 * n));
    }
    // Fator de escala 'ortho' do librosa
    const factor = k === 0 ? Math.sqrt(1 / n) : Math.sqrt(2 / n);
    output[k] = sum * factor;
  }
  
  return output;
}

// Extrair MFCCs de um frame
function extractMfccFrame(
  samples: number[],
  filterbank: number[][],
  numMfcc: number
): number[] {
  // Calcular espectro de potência
  const power = powerSpectrum(samples, N_FFT);
  
  // Aplicar banco de filtros Mel
  const melEnergies = filterbank.map(filter => {
    let energy = 0;
    for (let i = 0; i < Math.min(filter.length, power.length); i++) {
      energy += filter[i] * power[i];
    }
    
    // Converte para escala DB (log-mel)
    // O valor 1e-10 é o 'amin' padrão do librosa
    return 10.0 * Math.log10(Math.max(energy, 1e-10));
  });
  
  // Aplicar DCT para obter MFCCs
  return dct(melEnergies, numMfcc);
}

// Extrair MFCCs de todo o áudio
function extractMfccs(audioData: Float32Array): number[] {
  const filterbank = createMelFilterbank(N_MELS, N_FFT, SAMPLE_RATE, F_MIN, F_MAX);
  const numFrames = Math.floor((audioData.length - N_FFT) / HOP_LENGTH) + 1;
  
  if (numFrames <= 0) {
    throw new Error("Áudio muito curto para extração de MFCCs");
  }
  
  // Extrair MFCCs para cada frame
  const allMfccs: number[][] = [];
  
  for (let i = 0; i < numFrames; i++) {
    const start = i * HOP_LENGTH;
    const frame = Array.from(audioData.slice(start, start + N_FFT));
    
    // Pad se necessário
    while (frame.length < N_FFT) {
      frame.push(0);
    }
    
    const mfccs = extractMfccFrame(frame, filterbank, N_MFCC);
    allMfccs.push(mfccs);
  }
  
  // Calcular média temporal (como no treinamento)
  const meanMfccs = new Array(N_MFCC).fill(0);
  
  for (let i = 0; i < N_MFCC; i++) {
    for (let j = 0; j < allMfccs.length; j++) {
      meanMfccs[i] += allMfccs[j][i];
    }
    meanMfccs[i] /= allMfccs.length;
  }
  
  return meanMfccs;
}

// Decodificar WAV
function decodeWav(buffer: ArrayBuffer): Float32Array {
  const view = new DataView(buffer);
  
  // Verificar header RIFF
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (riff !== 'RIFF') {
    throw new Error('Formato inválido: não é WAV');
  }
  
  // Encontrar chunk "data"
  let offset = 12;
  let dataOffset = 0;
  let dataSize = 0;
  let channels = 1;
  let bitsPerSample = 16;
  let sampleRate = 16000;
  
  while (offset < buffer.byteLength - 8) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
    const chunkSize = view.getUint32(offset + 4, true);
    
    if (chunkId === 'fmt ') {
      channels = view.getUint16(offset + 10, true);
      sampleRate = view.getUint32(offset + 12, true);
      bitsPerSample = view.getUint16(offset + 22, true);
    } else if (chunkId === 'data') {
      dataOffset = offset + 8;
      dataSize = chunkSize;
      break;
    }
    
    offset += 8 + chunkSize;
  }
  
  if (dataOffset === 0) {
    throw new Error('Chunk de dados não encontrado');
  }
  
  // Decodificar samples
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = Math.floor(dataSize / bytesPerSample / channels);
  const samples = new Float32Array(numSamples);
  
  for (let i = 0; i < numSamples; i++) {
    const sampleOffset = dataOffset + i * bytesPerSample * channels;
    
    if (bitsPerSample === 16) {
      const sample = view.getInt16(sampleOffset, true);
      samples[i] = sample / 32768;
    } else if (bitsPerSample === 8) {
      const sample = view.getUint8(sampleOffset);
      samples[i] = (sample - 128) / 128;
    }
  }
  
  // Reamostrar se necessário
  if (sampleRate !== SAMPLE_RATE) {
    const ratio = sampleRate / SAMPLE_RATE;
    const newLength = Math.floor(numSamples / ratio);
    const resampled = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const srcIdx = Math.floor(i * ratio);
      resampled[i] = samples[srcIdx];
    }
    
    return resampled;
  }
  
  return samples;
}

// Normalizar MFCCs usando parâmetros do scaler
function normalizeMfccs(mfccs: number[]): number[] {
  return mfccs.map((val, idx) => (val - SCALER_MEAN[idx]) / SCALER_SCALE[idx]);
}

// Handler principal
serve(async (req: Request) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers, status: 204 });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido" }),
      { headers, status: 405 }
    );
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let audioBuffer: ArrayBuffer;

    if (contentType.includes("multipart/form-data")) {
      // Receber arquivo via FormData
      const formData = await req.formData() as any;
      const audioFile = formData.get("audio") as File;
      
      if (!audioFile) {
        return new Response(
          JSON.stringify({ error: "Arquivo de áudio não fornecido" }),
          { headers, status: 400 }
        );
      }
      
      audioBuffer = await audioFile.arrayBuffer();
    } else if (contentType.includes("application/octet-stream")) {
      // Receber bytes diretamente
      audioBuffer = await req.arrayBuffer();
    } else {
      // Tentar como JSON com base64
      const body = await req.json();
      
      if (!body.audio) {
        return new Response(
          JSON.stringify({ error: "Dados de áudio não fornecidos" }),
          { headers, status: 400 }
        );
      }
      
      // Decodificar base64
      const binaryString = atob(body.audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      audioBuffer = bytes.buffer;
    }

    console.log(`📊 Recebido áudio: ${audioBuffer.byteLength} bytes`);

    // Decodificar WAV
    const audioData = decodeWav(audioBuffer);
    console.log(`🎧 Decodificado: ${audioData.length} samples`);

    // Extrair MFCCs
    const rawMfccs = extractMfccs(audioData);
    console.log(`📊 MFCCs extraídos: [${rawMfccs.slice(0, 5).map(v => v.toFixed(2)).join(", ")}, ...]`);

    // Normalizar
    const normalizedMfccs = normalizeMfccs(rawMfccs);
    console.log(`📐 MFCCs normalizados: [${normalizedMfccs.slice(0, 5).map(v => v.toFixed(4)).join(", ")}, ...]`);

    return new Response(
      JSON.stringify({
        success: true,
        mfccs: rawMfccs,
        normalized_mfccs: normalizedMfccs,
        num_samples: audioData.length,
        duration_seconds: audioData.length / SAMPLE_RATE,
      }),
      { headers, status: 200 }
    );

  } catch (error) {
    console.error("Erro ao processar áudio:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Erro ao processar áudio",
        details: error instanceof Error ? error.message : String(error)
      }),
      { headers, status: 500 }
    );
  }
});
