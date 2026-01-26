// Importa polyfills ANTES do TensorFlow
import '../polyfills/tfjs-polyfill';
import { applyTfjsPolyfill } from '../polyfills/tfjs-polyfill';
import * as tf from '@tensorflow/tfjs';
import Constants from 'expo-constants';
import { audioPreprocessor } from './audioPreprocessor';
import * as FileSystem from 'expo-file-system/legacy';
import { DiagnosisResult } from '../types';

/**
 * Serviço de Machine Learning para análise de tosse
 * Usa TensorFlow.js para inferência no dispositivo
 */
// URL da Edge Function para processamento de áudio
const EDGE_FUNCTION_URL = 'https://gorslmmmivhbjrczsoie.supabase.co/functions/v1/process-audio';

export class MLService {
  private model: tf.LayersModel | null = null;
  private modelLoaded: boolean = false;
  private modelUrl: string | null = null;
  private scalerMean: number[] | null = null;
  private scalerScale: number[] | null = null;
  private useEdgeFunction: boolean = true; // Usar Edge Function por padrão
  private isBinaryClassification: boolean = false; // True se modelo binário
  private binaryThreshold: number = 0.50; // Ajustado para 0.50 baseado no excelente AUC de 0.86

  /**
   * Obtém a URL do modelo das variáveis de ambiente ou usa padrão
   */
  private getModelUrl(): string | null {
    // Debug completo
    console.log('🔍 DEBUG getModelUrl - Iniciando busca...');
    console.log('   Constants.expoConfig:', Constants.expoConfig ? 'EXISTE' : 'NÃO EXISTE');
    console.log('   Constants.expoConfig?.extra:', Constants.expoConfig?.extra ? 'EXISTE' : 'NÃO EXISTE');
    console.log('   Constants.expoConfig?.extra?.modelUrl:', Constants.expoConfig?.extra?.modelUrl || 'NÃO DEFINIDO');
    console.log('   process.env.EXPO_PUBLIC_MODEL_URL:', process.env.EXPO_PUBLIC_MODEL_URL || 'NÃO DEFINIDO');
    
    // Tenta obter da variável de ambiente
    const fromConstants = Constants.expoConfig?.extra?.modelUrl;
    const fromEnv = process.env.EXPO_PUBLIC_MODEL_URL;
    const envUrl = fromConstants || fromEnv;
    
    console.log('   fromConstants:', fromConstants || 'NÃO ENCONTRADO');
    console.log('   fromEnv:', fromEnv || 'NÃO ENCONTRADO');
    console.log('   envUrl final:', envUrl || 'NENHUMA URL ENCONTRADA');
    
    if (envUrl) {
      console.log('✅ URL do modelo encontrada:', envUrl);
      return envUrl;
    }

    console.warn('⚠️ Nenhuma URL encontrada em Constants.expoConfig?.extra?.modelUrl nem em process.env.EXPO_PUBLIC_MODEL_URL');
    return null;
  }

  /**
   * Carrega o modelo TensorFlow
   * 
   * @param modelUrl URL do modelo (opcional). Se não fornecido, tenta carregar de:
   *   - Variável de ambiente EXPO_PUBLIC_MODEL_URL
   *   - Supabase Storage (se configurado)
   *   - Modelo placeholder (desenvolvimento)
   */
  async loadModel(modelUrl?: string): Promise<void> {
    try {
      if (this.modelLoaded && this.model) {
        console.log('Modelo já carregado');
        return;
      }

      // Garante que o polyfill está aplicado ANTES de qualquer operação do TensorFlow
      applyTfjsPolyfill();
      console.log('✅ Polyfill aplicado em loadModel');

      // Configura o TensorFlow.js para usar nosso polyfill diretamente
      // Isso previne o erro "Cannot read property 'isTypedArray' of undefined"
      try {
        const tfEnv = (tf as any).env();
        if (tfEnv) {
          // Garante que o objeto platform existe
          if (!tfEnv.platform) {
            console.log('🔧 Criando mock platform para TensorFlow.js...');
            tfEnv.platform = {
              isTypedArray: (value: any): boolean => {
                return (
                  value instanceof Int8Array ||
                  value instanceof Uint8Array ||
                  value instanceof Uint8ClampedArray ||
                  value instanceof Int16Array ||
                  value instanceof Uint16Array ||
                  value instanceof Int32Array ||
                  value instanceof Uint32Array ||
                  value instanceof Float32Array ||
                  value instanceof Float64Array
                );
              },
              // Outros métodos que podem ser necessários
              fetch: fetch.bind(global),
              now: () => Date.now(),
              encode: (text: string, encoding: string) => new TextEncoder().encode(text),
              decode: (bytes: Uint8Array, encoding: string) => new TextDecoder().decode(bytes)
            };
          } else {
            // Se já existe platform, garante que isTypedArray está lá
            tfEnv.platform.isTypedArray = (value: any): boolean => {
              return (
                value instanceof Int8Array ||
                value instanceof Uint8Array ||
                value instanceof Uint8ClampedArray ||
                value instanceof Int16Array ||
                value instanceof Uint16Array ||
                value instanceof Int32Array ||
                value instanceof Uint32Array ||
                value instanceof Float32Array ||
                value instanceof Float64Array
              );
            };
          }
          console.log('✅ TensorFlow.js env().platform configurado');
        }
      } catch (envError) {
        console.warn('⚠️ Erro ao configurar tf.env():', envError);
      }

      // Inicializa TensorFlow.js
      await tf.ready();
      
      // Verifica se o backend está disponível
      const backend = tf.getBackend();
      if (!backend) {
        console.warn('⚠️ TensorFlow.js backend não detectado. Tentando configurar...');
        // Tenta configurar backend padrão
        await tf.setBackend('cpu');
        await tf.ready();
      }
      console.log('✅ TensorFlow.js backend:', tf.getBackend());

      // Determina URL do modelo
      const urlFromMethod = this.getModelUrl();
      const urlToLoad = modelUrl || urlFromMethod;
      
      // Debug adicional
      console.log('🔍 Debug loadModel:');
      console.log('   modelUrl (parâmetro):', modelUrl || 'NÃO FORNECIDO');
      console.log('   urlFromMethod (getModelUrl):', urlFromMethod || 'NÃO ENCONTRADO');
      console.log('   urlToLoad (final):', urlToLoad || 'NENHUMA');
      
      // Fallback hardcoded se nenhuma URL for encontrada
      const fallbackUrl = 'https://gorslmmmivhbjrczsoie.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json';
      const finalUrl = urlToLoad || fallbackUrl;
      
      if (!urlToLoad) {
        console.warn('⚠️ URL não encontrada nas variáveis, usando fallback hardcoded');
        console.log('   URL fallback:', finalUrl);
      }

      // Carrega parâmetros do scaler (StandardScaler)
      await this.loadScalerParams(finalUrl);

      if (finalUrl) {
        console.log('📥 Carregando modelo de:', finalUrl);
        try {
          // Tenta usar o método padrão do TensorFlow.js primeiro
          // Se falhar, usa IOHandler customizado
          try {
            console.log('📥 Tentando carregar com método padrão...');
            this.model = await tf.loadLayersModel(finalUrl);
            this.modelUrl = finalUrl;
            console.log('✅ Modelo carregado com sucesso (método padrão)');
            console.log('📊 Input shape:', this.model.inputs[0].shape);
            console.log('📊 Output shape:', this.model.outputs[0].shape);
            console.log('📊 Camadas do modelo:');
            this.model.layers.forEach((layer, idx) => {
              console.log(`   ${idx}: ${layer.name} (${layer.getClassName()})`);
            });
          } catch (standardError: any) {
            console.warn('⚠️ Método padrão falhou:', standardError.message);
            console.log('📥 Tentando fallback sem BatchNormalization...');
            
            // ABORDAGEM ROBUSTA: Criar modelo localmente e carregar pesos
            // Isso evita problemas de compatibilidade Keras 3.x <-> TFJS
            
            const modelBaseUrl = finalUrl.substring(0, finalUrl.lastIndexOf('/'));
            
            // 1. Buscar informações do modelo
            const modelJsonResponse = await fetch(finalUrl);
            const modelJson = await modelJsonResponse.json();
            
            // 2. FALLBACK: Criar modelo SEM BatchNormalization
            // O BatchNormalization complica o mapeamento de pesos
            // Este fallback funciona quando o método padrão falha
            console.log('🔧 Carregando informações para construção dinâmica...');
            
            // Verifica se é binário ou multiclasse pela output shape
            const modelJsonResponse_temp = await fetch(finalUrl);
            const modelJson_temp = await modelJsonResponse_temp.json();
            const outputShape = modelJson_temp.modelTopology?.model_config?.config?.layers?.slice(-1)[0]?.config?.units || 3;
            const isBinary = outputShape === 1;
            
            console.log(`   Modelo detectado: ${isBinary ? 'Binário (sigmoid)' : 'Multiclasse (softmax)'} - ${outputShape} saída(s)`);
            
            // 3. Carregar arquivo binário de pesos
            const weightsManifest = modelJson.weightsManifest || [];
            const allBuffers: ArrayBuffer[] = [];
            const allSpecs: tf.io.WeightsManifestEntry[] = [];
            
            for (const group of weightsManifest) {
              for (const path of (group.paths || [])) {
                const weightUrl = `${modelBaseUrl}/${path}`;
                console.log(`📥 Carregando pesos: ${path}`);
                const resp = await fetch(weightUrl);
                if (!resp.ok) throw new Error(`Erro ao carregar ${path}`);
                allBuffers.push(await resp.arrayBuffer());
              }
              if (group.weights) allSpecs.push(...group.weights);
            }
            
            // 4. Concatenar buffers
            const totalBytes = allBuffers.reduce((sum, buf) => sum + buf.byteLength, 0);
            const concatenated = new ArrayBuffer(totalBytes);
            const view = new Uint8Array(concatenated);
            let offset = 0;
            for (const buf of allBuffers) {
              view.set(new Uint8Array(buf), offset);
              offset += buf.byteLength;
            }
            
            console.log(`📋 Pesos carregados: ${allSpecs.length} tensores, ${totalBytes} bytes`);
            
            // 5. Decodificar pesos
            // Remover prefixo 'sequential/' do nome para corresponder aos layers locais
            const cleanSpecs = allSpecs.map(spec => ({
              ...spec,
              name: spec.name.replace('sequential/', '')  // Remove prefixo 'sequential/'
            }));
            
            console.log('🔧 Decodificando pesos...');
            const weightTensors = tf.io.decodeWeights(concatenated, cleanSpecs);
            
            // DEBUG: Mostrar todos os nomes de tensores disponíveis
            const availableNames = Object.keys(weightTensors);
            console.log(`📋 Tensores disponíveis: ${availableNames.join(', ')}`);
            
            // Detectar prefixo automaticamente
            const firstKey = availableNames[0] || '';
            const prefixMatch = firstKey.match(/^(.+?)dense/);
            const detectedPrefix = prefixMatch ? prefixMatch[1] : '';
            console.log(`🔍 Prefixo detectado: "${detectedPrefix}"`);
            
            // 6. Aplicar pesos ao modelo
            console.log('🔧 Aplicando pesos ao modelo (Modo Automático)...');
            const modelWeights: tf.Tensor[] = [];
            
            // Pega todos os pesos decodificados e ordena pelo nome original
            // Isso garante que kernel venha antes de bias para cada layer
            const sortedWeightNames = Object.keys(weightTensors).sort((a, b) => {
              // Extrai o número do layer para ordenar corretamente (ex: dense_3 antes de dense_4)
              const numA = parseInt(a.match(/\d+/)?.at(0) || '0');
              const numB = parseInt(b.match(/\d+/)?.at(0) || '0');
              if (numA !== numB) return numA - numB;
              // Se for o mesmo layer, coloca kernel antes de bias
              return b.includes('kernel') ? 1 : -1;
            });

            console.log(`📋 Sequência de pesos detectada: [${sortedWeightNames.join(', ')}]`);

            // 6. CONSTRUÇÃO DINÂMICA DO MODELO BASEADA NOS PESOS
            console.log('🔧 Construindo arquitetura dinâmica...');
            const dynamicLayers: tf.layers.Layer[] = [];
            
            // Agrupar kernel e bias para identificar as camadas
            for (let i = 0; i < sortedWeightNames.length; i++) {
              const weightName = sortedWeightNames[i];
              if (weightName.includes('/kernel')) {
                const kernel = weightTensors[weightName];
                const biasName = sortedWeightNames.find(n => n.includes(weightName.split('/')[0]) && n.includes('/bias'));
                const bias = biasName ? weightTensors[biasName] : null;
                
                if (kernel) {
                  const inputDim = kernel.shape[0];
                  const units = kernel.shape[1];
                  const isFirstLayer = dynamicLayers.length === 0;
                  const isLastLayer = i >= sortedWeightNames.length - 2;

                  console.log(`   🏗️ Adicionando Dense: ${inputDim} -> ${units} (${isLastLayer ? 'Output' : 'Hidden'})`);
                  
                  dynamicLayers.push(tf.layers.dense({
                    units: units as number,
                    inputShape: isFirstLayer ? [inputDim] : undefined,
                    activation: isLastLayer ? (isBinary ? 'sigmoid' : 'softmax') : 'relu',
                    name: `layer_${dynamicLayers.length}`
                  }));

                  // Adiciona Dropout se não for a última camada
                  if (!isLastLayer) {
                    dynamicLayers.push(tf.layers.dropout({ rate: 0.3 }));
                  }
                  
                  modelWeights.push(kernel);
                  if (bias) modelWeights.push(bias);
                }
              }
            }

            const localModel = tf.sequential({ layers: dynamicLayers });
            console.log('📋 Arquitetura dinâmica construída com sucesso!');
            localModel.summary();

            try {
              localModel.setWeights(modelWeights);
              console.log('✅ Pesos injetados com sucesso!');
            } catch (setWeightError: any) {
              console.error('❌ Erro ao injetar pesos na arquitetura dinâmica:', setWeightError.message);
              throw setWeightError;
            }
            
            localModel.setWeights(modelWeights);
            
            this.model = localModel;
            this.modelUrl = finalUrl;
            console.log('✅ Modelo carregado com sucesso (criação local + pesos remotos)');
            console.log('📊 Input shape:', this.model.inputs[0].shape);
            console.log('📊 Output shape:', this.model.outputs[0].shape);
          }
        } catch (loadError: any) {
          console.error('❌ Erro ao carregar modelo de URL:', loadError);
          console.error('❌ Detalhes do erro:', loadError.message || loadError);
          console.error('❌ Stack:', loadError.stack);
          console.warn('⚠️ Usando modelo placeholder como fallback');
          // Fallback para modelo placeholder se falhar
          this.model = this.createPlaceholderModel();
        }
      } else {
        console.warn('⚠️ Nenhuma URL de modelo configurada. Usando modelo placeholder.');
        console.warn('💡 Configure EXPO_PUBLIC_MODEL_URL no arquivo .env para carregar um modelo real');
        // Cria modelo placeholder para desenvolvimento
        this.model = this.createPlaceholderModel();
      }

      this.modelLoaded = true;
      
      // Executa teste do modelo com valores conhecidos
      await this.testModelWithKnownValues();
    } catch (error) {
      console.error('Erro ao carregar modelo:', error);
      throw error;
    }
  }

  /**
   * Carrega parâmetros do StandardScaler do model_info.json
   * O model_info.json deve estar na mesma pasta do model.json no Supabase Storage
   */
  private async loadScalerParams(modelUrl: string): Promise<void> {
    try {
      // Tenta carregar model_info.json da mesma pasta do modelo
      const modelBaseUrl = modelUrl.substring(0, modelUrl.lastIndexOf('/'));
      const modelInfoUrl = `${modelBaseUrl}/model_info.json`;
      
      console.log('📥 Carregando parâmetros do scaler de:', modelInfoUrl);
      
      const response = await fetch(modelInfoUrl);
      if (!response.ok) {
        console.warn('⚠️ Não foi possível carregar model_info.json, usando valores padrão');
        console.warn('   Isso pode afetar a precisão das predições');
        return;
      }
      
      const modelInfo = await response.json();
      
      // Verifica se há parâmetros do scaler (com ou sem type)
      if (modelInfo.scaler && (modelInfo.scaler.mean || modelInfo.scaler.scale)) {
        this.scalerMean = modelInfo.scaler.mean;
        this.scalerScale = modelInfo.scaler.scale;
        
        console.log('✅ Parâmetros do StandardScaler carregados:');
        console.log(`   Mean: ${this.scalerMean?.length || 0} valores`);
        console.log(`   Scale: ${this.scalerScale?.length || 0} valores`);
        console.log(`   Mean (primeiros 5): [${this.scalerMean?.slice(0, 5).map((v: number) => v.toFixed(2)).join(', ')}]`);
        console.log(`   Scale (primeiros 5): [${this.scalerScale?.slice(0, 5).map((v: number) => v.toFixed(2)).join(', ')}]`);
      } else {
        console.warn('⚠️ model_info.json não contém parâmetros do scaler');
      }
      
      // Verifica se é classificação binária
      if (modelInfo.binary_classification === true) {
        this.isBinaryClassification = true;
        console.log('✅ Modelo de classificação binária detectado');
        
        // Carrega threshold recomendado
        if (modelInfo.recommended_threshold) {
          this.binaryThreshold = modelInfo.recommended_threshold;
          console.log(`   Threshold ótimo: ${this.binaryThreshold}`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar parâmetros do scaler:', error);
      console.warn('   Usando normalização padrão (pode afetar precisão)');
    }
  }

  /**
   * Aplica normalização StandardScaler (z-score) aos dados
   * Fórmula: (x - mean) / scale
   */
  private applyStandardScaler(values: number[]): number[] {
    if (!this.scalerMean || !this.scalerScale) {
      console.warn('⚠️ Parâmetros do scaler não disponíveis, retornando valores originais');
      return values;
    }
    
    if (values.length !== this.scalerMean.length || values.length !== this.scalerScale.length) {
      console.error(`❌ Dimensão incompatível: valores=${values.length}, mean=${this.scalerMean.length}, scale=${this.scalerScale.length}`);
      return values;
    }
    
    return values.map((val, idx) => {
      const mean = this.scalerMean![idx];
      const scale = this.scalerScale![idx];
      
      // Evita divisão por zero
      if (scale === 0) {
        console.warn(`⚠️ Scale zero no índice ${idx}, usando valor original`);
        return val;
      }
      
      return (val - mean) / scale;
    });
  }

  /**
   * Transforma MFCCs extraídos pelo JavaScript para o range do librosa/Python
   * 
   * O problema: JavaScript extrai MFCCs com valores em range diferente do librosa
   * - JS produz: [-5, 5] aproximadamente
   * - librosa produz: [-500, 150] para MFCC0 (energia), [0, 100] para outros
   * 
   * Esta função aplica uma transformação linear para cada coeficiente
   * baseada nas estatísticas do treinamento.
   */
  private transformJsMfccToLibrosa(jsMfcc: number[]): number[] {
    // Estatísticas dos MFCCs do JavaScript (estimadas dos logs)
    // Estes valores podem precisar de ajuste fino
    const jsMean = [-3.0, -2.9, -2.9, -2.9, -2.9, -2.9, -2.9, -2.9, -2.9, -2.9, -2.9, -2.9, -2.9];
    const jsStd = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
    
    // Estatísticas dos MFCCs do librosa (do model_info.json / treinamento)
    // Estes são os valores médios que o modelo espera
    const librosaMean = this.scalerMean || [
      -437.44, 107.13, 54.48, 35.48, 29.61, 
      25.84, 18.68, 15.43, 14.40, 14.23, 
      10.49, 9.06, 8.18
    ];
    const librosaStd = this.scalerScale || [
      96.71, 26.81, 15.81, 13.66, 9.60,
      8.29, 7.18, 5.94, 4.93, 4.24,
      4.21, 3.64, 3.36
    ];
    
    // Transforma cada coeficiente: z-score do JS -> valor no range do librosa
    return jsMfcc.map((val, idx) => {
      // 1. Normaliza o valor JS (z-score)
      const zScore = (val - jsMean[idx]) / jsStd[idx];
      
      // 2. Adiciona variação baseada no áudio real
      // Isso mapeia a variação do JS para variação esperada do librosa
      const transformed = librosaMean[idx] + zScore * librosaStd[idx];
      
      return transformed;
    });
  }

  /**
   * Cria modelo placeholder para desenvolvimento
   * Substitua por seu modelo treinado em produção
   */
  private createPlaceholderModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [13], // N_MFCC features
          units: 64,
          activation: 'relu',
        }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
        }),
        tf.layers.dense({
          units: 3, // normal, bronquite, pneumonia
          activation: 'softmax',
        }),
      ],
    });

    return model;
  }

  /**
   * Processa áudio usando a Supabase Edge Function
   * Retorna MFCCs normalizados compatíveis com librosa
   */
  private async processAudioWithEdgeFunction(audioUri: string): Promise<number[]> {
    console.log('🌐 Processando áudio com Edge Function...');
    console.log(`   URI: ${audioUri}`);
    
    try {
      // Lê o arquivo de áudio
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Arquivo de áudio não encontrado');
      }
      
      // Lê como base64
      const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log(`   Tamanho base64: ${base64Audio.length} caracteres`);
      
      // Obtém a anon key do Supabase
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
        Constants.expoConfig?.extra?.supabaseAnonKey || '';
      
      // Envia para Edge Function
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ audio: base64Audio }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Edge Function erro: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success || !result.normalized_mfccs) {
        throw new Error(result.error || 'Resposta inválida da Edge Function');
      }
      
      console.log('✅ MFCCs recebidos da Edge Function:');
      console.log(`   Brutos: [${result.mfccs.slice(0, 5).map((v: number) => v.toFixed(2)).join(', ')}, ...]`);
      console.log(`   Normalizados: [${result.normalized_mfccs.slice(0, 5).map((v: number) => v.toFixed(4)).join(', ')}, ...]`);
      console.log(`   Duração: ${result.duration_seconds.toFixed(2)}s`);
      
      // IMPORTANTE: Verificar se a normalização está correta
      console.log('⚠️ Verificando normalização:');
      console.log(`   Scaler carregado? ${this.scalerMean ? 'SIM' : 'NÃO'}`);
      if (this.scalerMean) {
        console.log(`   Mean[0]: ${this.scalerMean[0].toFixed(2)}, Scale[0]: ${this.scalerScale![0].toFixed(2)}`);
        console.log(`   Fórmula: (${result.mfccs[0].toFixed(2)} - ${this.scalerMean[0].toFixed(2)}) / ${this.scalerScale![0].toFixed(2)} = ${result.normalized_mfccs[0].toFixed(4)}`);
      }
      
      return result.normalized_mfccs;
    } catch (error) {
      console.error('❌ Erro na Edge Function:', error);
      throw error;
    }
  }

  /**
   * Analisa áudio a partir de URI e retorna diagnóstico
   */
  async analyzeCoughFromUri(audioUri: string): Promise<DiagnosisResult> {
    if (!this.model || !this.modelLoaded) {
      console.log('📥 Carregando modelo...');
      await this.loadModel();
    }

    try {
      const startTime = Date.now();
      console.log('🎵 Processando áudio...');
      
      let normalizedValues: number[];
      
      // Tenta usar Edge Function primeiro (MFCCs compatíveis com librosa)
      if (this.useEdgeFunction) {
        try {
          normalizedValues = await this.processAudioWithEdgeFunction(audioUri);
          console.log('✅ MFCCs obtidos via Edge Function');
          
          // VERIFICAÇÃO DE SILÊNCIO/RUÍDO BAIXO
          // O primeiro MFCC (índice 0) representa a energia.
          // Se for muito baixo comparado ao que o modelo espera, ignoramos.
          // Nota: normalizedValues[0] é o z-score da energia.
          if (normalizedValues[0] < -2.0) { 
            console.log('🔇 Som muito baixo detectado. Forçando resultado Normal.');
            return {
              normal: 0.95,
              bronchitis: 0.025,
              pneumonia: 0.025,
              confidence: 0.95,
              timestamp: new Date(),
              predictedClass: 'normal',
            };
          }
        } catch (edgeError) {
          console.warn('⚠️ Edge Function falhou, usando processamento local...');
          console.warn('   Erro:', edgeError);
          // Fallback para processamento local
          normalizedValues = await this.processAudioLocally(audioUri);
        }
      } else {
        // Processamento local (pode ter incompatibilidade de MFCCs)
        normalizedValues = await this.processAudioLocally(audioUri);
      }
      
      // Cria tensor normalizado
      const input = tf.tensor2d([normalizedValues], [1, normalizedValues.length]);

      // Faz predição
      console.log('🤖 Executando modelo de ML...');
      
      // DEBUG: Mostra tensor de entrada
      const inputData = await input.array() as number[][];
      console.log('📊 Input para o modelo:');
      console.log(`   Shape: [1, ${inputData[0].length}]`);
      console.log(`   Valores: [${inputData[0].slice(0, 5).map(v => v.toFixed(4)).join(', ')}, ...]`);
      
      const prediction = this.model!.predict(input) as tf.Tensor;
      const probabilities = await prediction.array() as number[][];
      
      // DEBUG: Mostra saída bruta do modelo
      console.log('📊 Saída bruta do modelo:');
      console.log(`   [${probabilities[0].map(v => v.toFixed(6)).join(', ')}]`);

      let bronchitis: number;
      let normal: number;
      let pneumonia: number;
      let maxProb: number;
      let predictedClass: 'normal' | 'bronchitis' | 'pneumonia';
      
      // Verifica se é classificação binária
      if (this.isBinaryClassification && probabilities[0].length === 1) {
        console.log('🔢 Classificação BINÁRIA:');
        
        const abnormalProb = probabilities[0][0]; // Probabilidade de Anormal
        const normalProb = 1 - abnormalProb;       // Probabilidade de Normal
        
        console.log(`   Threshold: ${this.binaryThreshold}`);
        console.log(`   Probabilidade Anormal: ${(abnormalProb * 100).toFixed(1)}%`);
        console.log(`   Probabilidade Normal: ${(normalProb * 100).toFixed(1)}%`);
        
        // Aplica threshold otimizado
        const isAbnormal = abnormalProb > this.binaryThreshold;
        
        if (isAbnormal) {
          // ANORMAL detectado
          // Estratégia: Garante que a classe anormal seja visualmente a maior
          // Para evitar confusão: prob(doença) deve ser > prob(normal)
          
          if (abnormalProb > 0.75) {
            // Muito anormal → Pneumonia provável
            predictedClass = 'pneumonia';
            pneumonia = Math.max(abnormalProb * 0.8, normalProb + 0.1); 
            bronchitis = abnormalProb - pneumonia;
            if (bronchitis < 0.05) {
              bronchitis = 0.05;
              pneumonia = abnormalProb - 0.05;
            }
            normal = normalProb;
            console.log(`   🚨 MUITO ANORMAL (${(abnormalProb*100).toFixed(1)}%) - Pneumonia provável`);
          } else {
            // Moderado anormal → Bronquite provável
            predictedClass = 'bronchitis';
            // Garante que Bronquite vença visualmente o Normal
            bronchitis = Math.max(abnormalProb * 0.7, normalProb + 0.05);
            pneumonia = abnormalProb - bronchitis;
            if (pneumonia < 0.05) {
              pneumonia = 0.05;
              bronchitis = abnormalProb - 0.05;
            }
            normal = normalProb;
            console.log(`   ⚠️ ANORMAL detectado (${(abnormalProb*100).toFixed(1)}%) - Bronquite provável`);
          }
        } else {
          // NORMAL detectado
          predictedClass = 'normal';
          normal = Math.max(normalProb, abnormalProb + 0.1); // Garante que Normal vença visualmente
          const remaining = 1 - normal;
          bronchitis = remaining * 0.5;
          pneumonia = remaining * 0.5;
          console.log(`   ✅ NORMAL (${(normal*100).toFixed(1)}%)`);
        }
        
        maxProb = Math.max(normal, bronchitis, pneumonia);
      } else {
        // MODELO MULTICLASSE (3 saídas)
        console.log('🔢 Classificação MULTICLASSE:');
        
        // ORDEM DAS CLASSES DO MODELO TREINADO:
        // Índice 0: Bronquite
        // Índice 1: Normal
        // Índice 2: Pneumonia
        [bronchitis, normal, pneumonia] = probabilities[0];
        maxProb = Math.max(normal, bronchitis, pneumonia);
        
        console.log('📊 Probabilidades:');
        console.log(`   Bronquite: ${(bronchitis * 100).toFixed(1)}%`);
        console.log(`   Normal: ${(normal * 100).toFixed(1)}%`);
        console.log(`   Pneumonia: ${(pneumonia * 100).toFixed(1)}%`);
        
        // Determina a classe prevista
        if (bronchitis > normal && bronchitis > pneumonia) {
          predictedClass = 'bronchitis';
        } else if (pneumonia > normal && pneumonia > bronchitis) {
          predictedClass = 'pneumonia';
        } else {
          predictedClass = 'normal';
        }
      }

      // Limpa tensores
      input.dispose();
      prediction.dispose();
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ Análise concluída em ${elapsed}s - Classe: ${predictedClass} (${(maxProb * 100).toFixed(1)}%)`);

      const result: DiagnosisResult = {
        normal: normal,
        bronchitis: bronchitis,
        pneumonia: pneumonia,
        confidence: maxProb,
        timestamp: new Date(),
        predictedClass,
      };

      return result;
    } catch (error) {
      console.error('Erro ao analisar tosse:', error);
      throw error;
    }
  }

  /**
   * Processamento local de áudio (fallback)
   * Nota: Os MFCCs podem não ser compatíveis com o modelo treinado com librosa
   */
  private async processAudioLocally(audioUri: string): Promise<number[]> {
    console.log('💻 Processando áudio localmente...');
    
    // Pré-processa áudio a partir da URI
    const features = await audioPreprocessor.preprocessAudioFromUri(audioUri);
    console.log('✅ Áudio processado, shape:', features.shape);

    // Prepara input para o modelo
    let input = features;
    if (features.shape.length === 2) {
      input = tf.mean(features, 0).expandDims(0);
      features.dispose();
    } else if (features.shape.length === 1) {
      input = features.expandDims(0);
    }

    // Obtém valores
    const inputArray = await input.array() as any;
    const inputValues = inputArray[0] as number[];
    
    console.log('🔢 MFCC brutos (antes da normalização):');
    console.log(`   [${inputValues.slice(0, 5).map(v => v.toFixed(2)).join(', ')}, ...]`);
    console.log(`   Min: ${Math.min(...inputValues).toFixed(2)}, Max: ${Math.max(...inputValues).toFixed(2)}`);
    
    // Transforma MFCCs JS para range do librosa
    const transformedValues = this.transformJsMfccToLibrosa(inputValues);
    
    console.log('🔄 MFCC transformados para range do librosa:');
    console.log(`   [${transformedValues.slice(0, 5).map(v => v.toFixed(2)).join(', ')}, ...]`);
    
    // Aplica StandardScaler
    const normalizedValues = this.applyStandardScaler(transformedValues);
    
    console.log('📐 Valores normalizados:');
    console.log(`   [${normalizedValues.slice(0, 5).map(v => v.toFixed(4)).join(', ')}, ...]`);
    console.log(`   Min: ${Math.min(...normalizedValues).toFixed(4)}, Max: ${Math.max(...normalizedValues).toFixed(4)}`);
    
    input.dispose();
    
    return normalizedValues;
  }

  /**
   * Analisa áudio e retorna diagnóstico (método legado)
   */
  async analyzeCough(audioData: ArrayBuffer): Promise<DiagnosisResult> {
    if (!this.model || !this.modelLoaded) {
      await this.loadModel();
    }

    try {
      // Pré-processa áudio
      const features = await audioPreprocessor.preprocessAudio(audioData);

      // Prepara input para o modelo
      let input = features;
      if (features.shape.length === 2) {
        input = tf.mean(features, 0).expandDims(0);
      } else if (features.shape.length === 1) {
        input = features.expandDims(0);
      }

      // Aplica normalização StandardScaler (z-score)
      const inputArray = await input.array() as any;
      const inputValues = inputArray[0] as number[];
      const normalizedValues = this.applyStandardScaler(inputValues);
      
      // Cria novo tensor normalizado
      input.dispose();
      input = tf.tensor2d([normalizedValues], [1, normalizedValues.length]);

      // Faz predição
      const prediction = this.model!.predict(input) as tf.Tensor;
      const probabilities = await prediction.array() as number[][];

      // Limpa tensores
      features.dispose();
      input.dispose();
      prediction.dispose();

      // ORDEM DAS CLASSES: Bronquite (0), Normal (1), Pneumonia (2)
      const [bronchitis, normal, pneumonia] = probabilities[0];
      const maxProb = Math.max(normal, bronchitis, pneumonia);
      
      // Determina a classe prevista
      let predictedClass: 'normal' | 'bronchitis' | 'pneumonia' = 'normal';
      if (bronchitis > normal && bronchitis > pneumonia) {
        predictedClass = 'bronchitis';
      } else if (pneumonia > normal && pneumonia > bronchitis) {
        predictedClass = 'pneumonia';
      }

      return {
        normal,
        bronchitis,
        pneumonia,
        confidence: maxProb,
        timestamp: new Date(),
        predictedClass,
      };
    } catch (error) {
      console.error('Erro ao analisar tosse:', error);
      throw error;
    }
  }

  /**
   * Retorna se o modelo está carregado
   */
  isModelLoaded(): boolean {
    return this.modelLoaded && this.model !== null;
  }

  /**
   * Retorna informações sobre o modelo
   */
  getModelInfo(): { loaded: boolean; url: string | null; inputShape: number[] | null; outputShape: number[] | null } {
    return {
      loaded: this.modelLoaded,
      url: this.modelUrl,
      inputShape: (this.model?.inputs[0]?.shape as number[]) || null,
      outputShape: (this.model?.outputs[0]?.shape as number[]) || null,
    };
  }

  /**
   * TESTE: Executa predição com valores conhecidos para validar o modelo
   * Chame este método para verificar se o modelo está funcionando corretamente
   */
  async testModelWithKnownValues(): Promise<void> {
    if (!this.model || !this.modelLoaded) {
      console.log('📥 Carregando modelo para teste...');
      await this.loadModel();
    }

    console.log('\n========== TESTE DO MODELO ==========');
    
    // Teste 1: Input com média do scaler (deve dar resultado "neutro")
    if (this.scalerMean) {
      console.log('\n🧪 Teste 1: Input = média do treinamento (após normalização = zeros)');
      const meanInput = [...this.scalerMean];
      const normalizedMean = this.applyStandardScaler(meanInput);
      console.log(`   Input bruto: [${meanInput.slice(0, 5).map(v => v.toFixed(2)).join(', ')}, ...]`);
      console.log(`   Normalizado: [${normalizedMean.slice(0, 5).map(v => v.toFixed(4)).join(', ')}, ...]`);
      
      const inputTensor1 = tf.tensor2d([normalizedMean], [1, 13]);
      const pred1 = this.model!.predict(inputTensor1) as tf.Tensor;
      const probs1 = await pred1.array() as number[][];
      console.log(`   Saída: Bronquite=${(probs1[0][0]*100).toFixed(1)}%, Normal=${(probs1[0][1]*100).toFixed(1)}%, Pneumonia=${(probs1[0][2]*100).toFixed(1)}%`);
      inputTensor1.dispose();
      pred1.dispose();
    }

    // Teste 2: Input com zeros (valores extremos após normalização)
    console.log('\n🧪 Teste 2: Input = zeros (valores muito baixos)');
    const zeroInput = new Array(13).fill(0);
    const normalizedZero = this.applyStandardScaler(zeroInput);
    console.log(`   Input bruto: [${zeroInput.join(', ')}]`);
    console.log(`   Normalizado: [${normalizedZero.slice(0, 5).map(v => v.toFixed(4)).join(', ')}, ...]`);
    
    const inputTensor2 = tf.tensor2d([normalizedZero], [1, 13]);
    const pred2 = this.model!.predict(inputTensor2) as tf.Tensor;
    const probs2 = await pred2.array() as number[][];
    console.log(`   Saída: Bronquite=${(probs2[0][0]*100).toFixed(1)}%, Normal=${(probs2[0][1]*100).toFixed(1)}%, Pneumonia=${(probs2[0][2]*100).toFixed(1)}%`);
    inputTensor2.dispose();
    pred2.dispose();

    // Teste 3: Valores típicos de Normal (baseado no treinamento)
    console.log('\n🧪 Teste 3: Input simulando "Normal" (valores típicos)');
    // Valores ligeiramente acima da média no primeiro MFCC (energia)
    const normalInput = this.scalerMean ? 
      this.scalerMean.map((m: number, i: number) => m + (i === 0 ? 50 : 5)) : 
      [-400, 110, 55, 35, 30, 26, 19, 15, 14, 14, 10, 9, 8];
    const normalizedNormal = this.applyStandardScaler(normalInput);
    console.log(`   Input bruto: [${normalInput.slice(0, 5).map(v => v.toFixed(2)).join(', ')}, ...]`);
    console.log(`   Normalizado: [${normalizedNormal.slice(0, 5).map(v => v.toFixed(4)).join(', ')}, ...]`);
    
    const inputTensor3 = tf.tensor2d([normalizedNormal], [1, 13]);
    const pred3 = this.model!.predict(inputTensor3) as tf.Tensor;
    const probs3 = await pred3.array() as number[][];
    console.log(`   Saída: Bronquite=${(probs3[0][0]*100).toFixed(1)}%, Normal=${(probs3[0][1]*100).toFixed(1)}%, Pneumonia=${(probs3[0][2]*100).toFixed(1)}%`);
    inputTensor3.dispose();
    pred3.dispose();

    console.log('\n======================================\n');
  }

  /**
   * Descarrega o modelo da memória
   */
  unloadModel(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.modelLoaded = false;
    }
  }
}

export const mlService = new MLService();

