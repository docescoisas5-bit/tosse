// Importa polyfills ANTES do TensorFlow
import '../polyfills/tfjs-polyfill';
import { applyTfjsPolyfill } from '../polyfills/tfjs-polyfill';
import * as tf from '@tensorflow/tfjs';
import Constants from 'expo-constants';
import { audioPreprocessor } from './audioPreprocessor';
import { DiagnosisResult } from '../types';

/**
 * Serviço de Machine Learning para análise de tosse
 * Usa TensorFlow.js para inferência no dispositivo
 */
export class MLService {
  private model: tf.LayersModel | null = null;
  private modelLoaded: boolean = false;
  private modelUrl: string | null = null;
  private scalerMean: number[] | null = null;
  private scalerScale: number[] | null = null;

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
      // Isso é mais confiável do que depender de util.isTypedArray
      try {
        const tfEnv = (tf as any).env();
        if (tfEnv && tfEnv.platform) {
          tfEnv.platform.isTypedArray = (value: any): boolean => {
            if (!value || typeof value !== 'object') {
              return false;
            }
            return (
              value instanceof Int8Array ||
              value instanceof Uint8Array ||
              value instanceof Uint8ClampedArray ||
              value instanceof Int16Array ||
              value instanceof Uint16Array ||
              value instanceof Int32Array ||
              value instanceof Uint32Array ||
              value instanceof Float32Array ||
              value instanceof Float64Array ||
              value instanceof BigInt64Array ||
              value instanceof BigUint64Array
            );
          };
          console.log('✅ TensorFlow.js env().platform.isTypedArray configurado');
        }
      } catch (envError) {
        console.warn('⚠️ Não foi possível configurar env().platform.isTypedArray:', envError);
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
          } catch (standardError: any) {
            console.warn('⚠️ Método padrão falhou, tentando IOHandler customizado...');
            console.warn('   Erro:', standardError.message);
            
            // Fallback: IOHandler customizado
            console.log('📥 Fazendo fetch do model.json...');
            const modelJsonResponse = await fetch(finalUrl);
            if (!modelJsonResponse.ok) {
              throw new Error(`HTTP error! status: ${modelJsonResponse.status}`);
            }
            const modelJsonRaw = await modelJsonResponse.json();
            console.log('✅ model.json carregado');
            
            // Cria IOHandler customizado para React Native
            const modelBaseUrl = finalUrl.substring(0, finalUrl.lastIndexOf('/'));
            
            // Prepara o modelTopology corrigido (cópia profunda)
            const originalTopology = modelJsonRaw.modelTopology;
            const correctedModelTopology = JSON.parse(JSON.stringify(originalTopology));
            
            console.log('🔍 DEBUG - Antes da correção:');
            // Verifica ambas as estruturas possíveis
            const layersBefore = correctedModelTopology?.model_config?.layers || correctedModelTopology?.model_config?.config?.layers;
            if (layersBefore && layersBefore[0]?.config) {
              const originalConfig = layersBefore[0].config;
              console.log('   batch_shape:', originalConfig.batch_shape);
              console.log('   batchInputShape:', originalConfig.batchInputShape);
              console.log('   inputShape:', originalConfig.inputShape);
            }
            
            // Aplica correção no modelTopology corrigido
            // TensorFlow.js requer batchInputShape ou inputShape, não apenas batch_shape
            if (correctedModelTopology && correctedModelTopology.model_config) {
              const modelConfig = correctedModelTopology.model_config;
              
              // Suporta duas estruturas possíveis:
              // 1. model_config.layers (estrutura antiga)
              // 2. model_config.config.layers (estrutura nova do Keras 3.x)
              let layers: any[] | null = null;
              
              if (modelConfig.layers && Array.isArray(modelConfig.layers)) {
                layers = modelConfig.layers;
                console.log('🔍 Estrutura detectada: model_config.layers (antiga)');
              } else if (modelConfig.config && modelConfig.config.layers && Array.isArray(modelConfig.config.layers)) {
                layers = modelConfig.config.layers;
                console.log('🔍 Estrutura detectada: model_config.config.layers (nova Keras 3.x)');
              }
              
              if (layers && layers.length > 0) {
                const firstLayer = layers[0];
                console.log('🔍 Primeira camada encontrada:', firstLayer.class_name);
                
                if (firstLayer.class_name === 'InputLayer') {
                  const config = firstLayer.config;
                  console.log('🔍 Config original completo:', JSON.stringify(config));
                  
                  // SEMPRE converte batch_shape para batchInputShape
                  // TensorFlow.js requer APENAS batchInputShape OU inputShape, NÃO ambos
                  if (config.batch_shape) {
                    console.log('🔧 Convertendo batch_shape:', config.batch_shape);
                    // Cria um novo objeto config sem batch_shape e com batchInputShape
                    const correctedConfig: any = { ...config };
                    // Converte batch_shape para batchInputShape (TensorFlow.js requer isso)
                    correctedConfig.batchInputShape = Array.from(config.batch_shape);
                    // Remove batch_shape para evitar confusão
                    delete correctedConfig.batch_shape;
                    // Remove inputShape se existir (TensorFlow.js não aceita ambos)
                    delete correctedConfig.inputShape;
                    
                    // Substitui o config original pelo corrigido
                    firstLayer.config = correctedConfig;
                    
                    console.log('🔧 InputLayer corrigido:');
                    console.log('   batchInputShape:', JSON.stringify(correctedConfig.batchInputShape));
                    console.log('   inputShape: REMOVIDO (TensorFlow.js não aceita ambos)');
                    console.log('   batch_shape removido: SIM');
                    console.log('🔍 Config após correção:', JSON.stringify(correctedConfig));
                  } else if (!config.batchInputShape && !config.inputShape) {
                    // Se não tem batch_shape nem batchInputShape/inputShape, cria um padrão
                    console.warn('⚠️ InputLayer não tem batch_shape, criando batchInputShape padrão [null, 13]');
                    const correctedConfig: any = { ...config };
                    correctedConfig.batchInputShape = [null, 13];
                    // Remove inputShape se existir
                    delete correctedConfig.inputShape;
                    firstLayer.config = correctedConfig;
                  } else if (config.inputShape && !config.batchInputShape) {
                    // Se tem apenas inputShape, mantém e remove batch_shape se existir
                    console.log('✅ InputLayer já tem inputShape, mantendo e removendo batch_shape se existir');
                    const correctedConfig: any = { ...config };
                    delete correctedConfig.batch_shape;
                    // Garante que não tem batchInputShape
                    delete correctedConfig.batchInputShape;
                    firstLayer.config = correctedConfig;
                  } else if (config.batchInputShape) {
                    // Se já tem batchInputShape, apenas remove batch_shape e inputShape
                    console.log('✅ InputLayer já tem batchInputShape, removendo batch_shape e inputShape');
                    const correctedConfig: any = { ...config };
                    delete correctedConfig.batch_shape;
                    delete correctedConfig.inputShape;
                    firstLayer.config = correctedConfig;
                  } else {
                    console.log('✅ InputLayer já está configurado corretamente');
                  }
                } else {
                  console.warn('⚠️ Primeira camada não é InputLayer:', firstLayer.class_name);
                }
              } else {
                console.error('❌ Nenhuma camada encontrada no model_config');
                console.error('   modelConfig:', JSON.stringify(modelConfig, null, 2).substring(0, 500));
              }
            } else {
              console.error('❌ modelTopology ou model_config não encontrado');
            }
            
            // Serializa e deserializa novamente para garantir que a estrutura está correta
            const finalModelTopology = JSON.parse(JSON.stringify(correctedModelTopology));
            
            console.log('🔍 DEBUG - Depois da correção (após re-serialização):');
            // Verifica ambas as estruturas possíveis
            const layersAfter = finalModelTopology?.model_config?.layers || finalModelTopology?.model_config?.config?.layers;
            if (layersAfter && layersAfter[0]?.config) {
              const correctedConfig = layersAfter[0].config;
              console.log('   batchInputShape:', correctedConfig.batchInputShape);
              console.log('   inputShape:', correctedConfig.inputShape || 'REMOVIDO (TensorFlow.js não aceita ambos)');
              console.log('   batch_shape:', correctedConfig.batch_shape || 'REMOVIDO');
              
              // Verificação final: garante que tem batchInputShape OU inputShape (não ambos)
              if (!correctedConfig.batchInputShape && !correctedConfig.inputShape) {
                console.error('❌ ERRO CRÍTICO: InputLayer ainda não tem batchInputShape nem inputShape após correção!');
                console.log('   Config completo:', JSON.stringify(correctedConfig, null, 2));
                throw new Error('InputLayer não tem batchInputShape nem inputShape após correção');
              }
              
              // Verifica se tem ambos (erro)
              if (correctedConfig.batchInputShape && correctedConfig.inputShape) {
                console.error('❌ ERRO CRÍTICO: InputLayer tem AMBOS batchInputShape e inputShape! TensorFlow.js não aceita ambos.');
                console.log('   Config completo:', JSON.stringify(correctedConfig, null, 2));
                throw new Error('InputLayer tem ambos batchInputShape e inputShape - TensorFlow.js não aceita ambos');
              }
            }
            
            // Usa o modelTopology final (re-serializado)
            const correctedModelTopologyFinal = finalModelTopology;
            
            const ioHandler: tf.io.IOHandler = {
              load: async () => {
                // Garante que o polyfill está aplicado ANTES de decodificar pesos
                applyTfjsPolyfill();
                console.log('✅ Polyfill aplicado no IOHandler antes de decodificar pesos');
                
                // Carrega os pesos
                const weightsManifest = modelJsonRaw.weightsManifest || [];
                const weightSpecs: tf.io.WeightsManifestEntry[] = [];
                const weightData: ArrayBuffer[] = [];
                
                console.log(`📊 Total de manifest items: ${weightsManifest.length}`);
                
                // IMPORTANTE: Para cada manifestItem, carregamos os paths primeiro,
                // depois adicionamos os weights na mesma ordem
                for (let manifestIndex = 0; manifestIndex < weightsManifest.length; manifestIndex++) {
                  const manifestItem = weightsManifest[manifestIndex];
                  console.log(`📦 Processando manifest item ${manifestIndex + 1}/${weightsManifest.length}`);
                  console.log(`   - Paths: ${manifestItem.paths?.length || 0}`);
                  console.log(`   - Weights: ${manifestItem.weights?.length || 0}`);
                  
                  // Carrega cada arquivo de peso (shard)
                  for (let pathIndex = 0; pathIndex < (manifestItem.paths || []).length; pathIndex++) {
                    const path = manifestItem.paths[pathIndex];
                    const weightUrl = `${modelBaseUrl}/${path}`;
                    console.log(`📥 Carregando peso [${pathIndex + 1}/${manifestItem.paths.length}]: ${path}`);
                    const weightResponse = await fetch(weightUrl);
                    if (!weightResponse.ok) {
                      throw new Error(`Erro ao carregar peso ${path}: ${weightResponse.status}`);
                    }
                    const weightArrayBuffer = await weightResponse.arrayBuffer();
                    weightData.push(weightArrayBuffer);
                    console.log(`✅ Peso carregado: ${path} (${weightArrayBuffer.byteLength} bytes)`);
                  }
                  
                  // Adiciona as especificações dos pesos na mesma ordem
                  // Isso é crítico: os weights devem estar na mesma ordem dos paths
                  if (manifestItem.weights && manifestItem.weights.length > 0) {
                    // CORREÇÃO: Remove apenas o prefixo "sequential/" dos nomes
                    // O TensorFlow.js adiciona sufixos _1 automaticamente quando deserializa o modelo
                    // Mas os weightSpecs devem ter os nomes SEM o prefixo "sequential/" e SEM sufixos
                    // O TensorFlow.js fará o mapeamento automaticamente baseado na estrutura do modelo
                    const correctedWeights = manifestItem.weights.map((weight: any) => {
                      // Remove o prefixo "sequential/" se existir
                      const nameWithoutPrefix = weight.name.replace(/^sequential\//, '');
                      
                      // NÃO adiciona sufixo _1 - o TensorFlow.js faz isso automaticamente
                      // O nome deve ser exatamente como está no modelo, mas sem o prefixo "sequential/"
                      return {
                        ...weight,
                        name: nameWithoutPrefix, // Nome sem prefixo sequential/, TensorFlow.js adiciona _1 automaticamente
                        originalName: weight.name, // Mantém o nome original para referência
                      };
                    });
                    
                    weightSpecs.push(...correctedWeights);
                    console.log(`✅ Adicionados ${correctedWeights.length} weight specs (nomes corrigidos)`);
                    console.log(`   Primeiros originais:`, manifestItem.weights.slice(0, 3).map(w => w.name).join(', '));
                    console.log(`   Primeiros corrigidos:`, correctedWeights.slice(0, 3).map(w => w.name).join(', '));
                  }
                }
                
                console.log(`📊 RESUMO FINAL:`);
                console.log(`   - Total de weightSpecs: ${weightSpecs.length}`);
                console.log(`   - Total de weightData (shards): ${weightData.length}`);
                console.log(`   - Primeiros weightSpecs:`, weightSpecs.slice(0, 5).map(w => `${w.name} (${w.shape.join('x')})`));
                
                // Verifica se os números correspondem
                if (weightSpecs.length === 0) {
                  throw new Error('Nenhum weightSpec encontrado no manifest');
                }
                if (weightData.length === 0) {
                  throw new Error('Nenhum weightData carregado');
                }
                
                // Verificação final antes de retornar
                // Verifica ambas as estruturas possíveis
                const finalLayers = correctedModelTopologyFinal?.model_config?.layers || correctedModelTopologyFinal?.model_config?.config?.layers;
                const finalConfig = finalLayers?.[0]?.config;
                if (finalConfig) {
                  console.log('🔍 VERIFICAÇÃO FINAL - Config que será enviado ao TensorFlow.js:');
                  console.log('   batchInputShape:', finalConfig.batchInputShape);
                  console.log('   inputShape:', finalConfig.inputShape);
                  console.log('   batch_shape:', finalConfig.batch_shape || 'REMOVIDO');
                  
                  if (!finalConfig.batchInputShape && !finalConfig.inputShape) {
                    console.error('❌ ERRO: modelTopology ainda não tem batchInputShape nem inputShape!');
                    console.log('   Config completo:', JSON.stringify(finalConfig, null, 2));
                    throw new Error('InputLayer não tem batchInputShape nem inputShape após correção');
                  }
                }
                
                // Garante que o polyfill está aplicado ANTES de retornar os dados
                // Isso é crítico porque o TensorFlow.js vai decodificar os pesos imediatamente
                applyTfjsPolyfill();
                
                // Configura tf.env().platform.isTypedArray ANTES de retornar os dados
                // Isso é mais confiável do que depender de util.isTypedArray
                try {
                  const tfEnv = (tf as any).env();
                  if (tfEnv) {
                    if (!tfEnv.platform) {
                      tfEnv.platform = {};
                    }
                    tfEnv.platform.isTypedArray = (value: any): boolean => {
                      if (!value || typeof value !== 'object') {
                        return false;
                      }
                      return (
                        value instanceof Int8Array ||
                        value instanceof Uint8Array ||
                        value instanceof Uint8ClampedArray ||
                        value instanceof Int16Array ||
                        value instanceof Uint16Array ||
                        value instanceof Int32Array ||
                        value instanceof Uint32Array ||
                        value instanceof Float32Array ||
                        value instanceof Float64Array ||
                        value instanceof BigInt64Array ||
                        value instanceof BigUint64Array
                      );
                    };
                    console.log('✅ tf.env().platform.isTypedArray configurado no IOHandler ANTES de retornar dados');
                  }
                } catch (envError) {
                  console.warn('⚠️ Não foi possível configurar tf.env().platform.isTypedArray no IOHandler:', envError);
                }
                
                // Força a criação de util se não existir (última tentativa)
                if (typeof global !== 'undefined') {
                  if (!(global as any).util) {
                    (global as any).util = {};
                  }
                  if (typeof (global as any).util.isTypedArray !== 'function') {
                    (global as any).util.isTypedArray = (value: any): boolean => {
                      if (!value || typeof value !== 'object') {
                        return false;
                      }
                      return (
                        value instanceof Int8Array ||
                        value instanceof Uint8Array ||
                        value instanceof Uint8ClampedArray ||
                        value instanceof Int16Array ||
                        value instanceof Uint16Array ||
                        value instanceof Int32Array ||
                        value instanceof Uint32Array ||
                        value instanceof Float32Array ||
                        value instanceof Float64Array ||
                        value instanceof BigInt64Array ||
                        value instanceof BigUint64Array
                      );
                    };
                    console.log('✅ Polyfill aplicado de emergência no IOHandler (antes de retornar)');
                  }
                  
                  // Verifica se está realmente aplicado
                  if (typeof (global as any).util.isTypedArray === 'function') {
                    console.log('✅ Polyfill verificado no IOHandler: util.isTypedArray está disponível');
                  } else {
                    console.error('❌ ERRO CRÍTICO: Polyfill não está aplicado mesmo após tentativas!');
                  }
                }
                
                // Retorna os dados no formato padrão do TensorFlow.js
                // O TensorFlow.js decodifica os pesos internamente
                // IMPORTANTE: weightData deve ser um ArrayBuffer[], não um objeto
                const result = {
                  modelTopology: correctedModelTopologyFinal,
                  weightSpecs,
                  weightData, // ArrayBuffer[] - TensorFlow.js decodifica internamente
                  format: 'layers-model' as tf.io.ModelFormat,
                  generatedBy: modelJsonRaw.generatedBy,
                  convertedBy: modelJsonRaw.convertedBy,
                };
                
                // Verificação final da estrutura
                console.log('✅ Estrutura final do loadResult:');
                console.log(`   - modelTopology: ${result.modelTopology ? 'EXISTE' : 'NÃO EXISTE'}`);
                console.log(`   - weightSpecs: ${Array.isArray(result.weightSpecs) ? result.weightSpecs.length : 'NÃO É ARRAY'}`);
                console.log(`   - weightData: ${Array.isArray(result.weightData) ? result.weightData.length : 'NÃO É ARRAY'}`);
                console.log(`   - format: ${result.format}`);
                
                // Verifica se weightData é realmente um ArrayBuffer[]
                if (Array.isArray(result.weightData)) {
                  console.log(`   - weightData[0] é ArrayBuffer: ${result.weightData[0] instanceof ArrayBuffer}`);
                  console.log(`   - Tamanho do primeiro ArrayBuffer: ${result.weightData[0]?.byteLength || 'N/A'} bytes`);
                } else {
                  console.error('❌ ERRO: weightData não é um ArrayBuffer[]!');
                }
                
                return result;
              }
            };
            
            // Garante que o polyfill está aplicado ANTES de carregar o modelo
            applyTfjsPolyfill();
            
            // Verifica se o polyfill está realmente aplicado
            const utilCheck = (global as any).util?.isTypedArray;
            if (typeof utilCheck !== 'function') {
              console.error('❌ ERRO: Polyfill não está aplicado antes de tf.loadLayersModel!');
              // Tenta aplicar de emergência
              if (typeof global !== 'undefined') {
                (global as any).util = (global as any).util || {};
                (global as any).util.isTypedArray = (value: any): boolean => {
                  if (!value || typeof value !== 'object') {
                    return false;
                  }
                  return (
                    value instanceof Int8Array ||
                    value instanceof Uint8Array ||
                    value instanceof Uint8ClampedArray ||
                    value instanceof Int16Array ||
                    value instanceof Uint16Array ||
                    value instanceof Int32Array ||
                    value instanceof Uint32Array ||
                    value instanceof Float32Array ||
                    value instanceof Float64Array ||
                    value instanceof BigInt64Array ||
                    value instanceof BigUint64Array
                  );
                };
                console.log('✅ Polyfill aplicado de emergência antes de tf.loadLayersModel');
              }
            } else {
              console.log('✅ Polyfill verificado e aplicado antes de tf.loadLayersModel');
            }
            
            // Carrega o modelo usando o IOHandler customizado
            // Aplica polyfill uma última vez ANTES de chamar tf.loadLayersModel
            // Isso é crítico porque o TensorFlow.js pode criar um novo contexto
            applyTfjsPolyfill();
            
            // Força a criação de util novamente (última tentativa antes de carregar)
            if (typeof global !== 'undefined') {
              if (!(global as any).util) {
                (global as any).util = {};
              }
              (global as any).util.isTypedArray = (value: any): boolean => {
                if (!value || typeof value !== 'object') {
                  return false;
                }
                return (
                  value instanceof Int8Array ||
                  value instanceof Uint8Array ||
                  value instanceof Uint8ClampedArray ||
                  value instanceof Int16Array ||
                  value instanceof Uint16Array ||
                  value instanceof Int32Array ||
                  value instanceof Uint32Array ||
                  value instanceof Float32Array ||
                  value instanceof Float64Array ||
                  value instanceof BigInt64Array ||
                  value instanceof BigUint64Array
                );
              };
              console.log('✅ Polyfill aplicado UMA ÚLTIMA VEZ antes de tf.loadLayersModel');
              
              // Verifica novamente
              if (typeof (global as any).util.isTypedArray === 'function') {
                console.log('✅ Polyfill confirmado: util.isTypedArray está disponível');
              } else {
                console.error('❌ ERRO: Polyfill não está disponível mesmo após aplicação!');
              }
            }
            
            console.log('📥 Carregando modelo com IOHandler customizado...');
            
            // Tenta carregar o modelo
            // O TensorFlow.js vai deserializar o modelTopology e depois carregar os pesos
            try {
              // Carrega o modelo completo (topology + pesos)
              this.model = await tf.loadLayersModel(ioHandler);
              this.modelUrl = finalUrl;
              
              // Se chegou aqui, o modelo foi carregado com sucesso
              console.log('✅ Modelo carregado com sucesso (IOHandler customizado)');
          console.log('📊 Input shape:', this.model.inputs[0].shape);
          console.log('📊 Output shape:', this.model.outputs[0].shape);
              
              // Verifica os nomes das variáveis do modelo
              try {
                const trainableWeights = this.model.trainableWeights;
                const nonTrainableWeights = this.model.nonTrainableWeights;
                console.log(`📊 Trainable weights: ${trainableWeights.length}`);
                console.log(`📊 Non-trainable weights: ${nonTrainableWeights.length}`);
                
                if (trainableWeights.length > 0) {
                  console.log(`📊 Primeiros trainable weights:`, trainableWeights.slice(0, 5).map(w => w.name));
                }
                if (nonTrainableWeights.length > 0) {
                  console.log(`📊 Primeiros non-trainable weights:`, nonTrainableWeights.slice(0, 5).map(w => w.name));
                }
              } catch (weightError) {
                console.warn('⚠️ Não foi possível obter informações dos pesos:', weightError);
              }
            } catch (modelLoadError: any) {
              console.error('❌ Erro ao carregar modelo:', modelLoadError);
              console.error('❌ Mensagem:', modelLoadError.message);
              
              // Se o erro for sobre pesos, tenta diagnosticar
              if (modelLoadError.message && modelLoadError.message.includes('target variable')) {
                console.error('❌ ERRO DE PESOS: O TensorFlow.js não conseguiu encontrar os pesos no ArrayBuffer');
                console.error('   Isso pode indicar que:');
                console.error('   1. Os nomes das variáveis no modelo não correspondem aos weightSpecs');
                console.error('   2. O formato do ArrayBuffer está incorreto');
                console.error('   3. Os pesos precisam ser decodificados de forma diferente');
                
                // Tenta deserializar apenas o modelTopology para verificar os nomes das variáveis
                try {
                  console.log('🔍 Tentando deserializar apenas o modelTopology para verificar nomes...');
                  const topologyOnly = {
                    modelTopology: correctedModelTopologyFinal,
                    format: 'layers-model' as tf.io.ModelFormat,
                  };
                  
                  // Tenta criar o modelo sem pesos para verificar os nomes das variáveis
                  const modelWithoutWeights = await tf.models.modelFromJSON(topologyOnly);
                  console.log('✅ Modelo deserializado sem pesos');
                  
                  // Verifica os nomes das variáveis
                  const trainableWeights = modelWithoutWeights.trainableWeights;
                  const nonTrainableWeights = modelWithoutWeights.nonTrainableWeights;
                  console.log(`📊 Variáveis esperadas no modelo:`);
                  console.log(`   - Trainable: ${trainableWeights.length}`);
                  console.log(`   - Non-trainable: ${nonTrainableWeights.length}`);
                  
                  if (trainableWeights.length > 0) {
                    console.log(`   - Primeiros trainable:`, trainableWeights.slice(0, 5).map(w => w.name));
                  }
                  if (nonTrainableWeights.length > 0) {
                    console.log(`   - Primeiros non-trainable:`, nonTrainableWeights.slice(0, 5).map(w => w.name));
                  }
                  
                  // Compara com os weightSpecs (que estão no escopo do IOHandler)
                  // Nota: weightSpecs não está disponível aqui, então vamos apenas mostrar os nomes do modelo
                  console.log(`📊 Todos os nomes das variáveis no modelo:`);
                  const allModelWeights = [...trainableWeights, ...nonTrainableWeights];
                  const allModelWeightNames = allModelWeights.map(w => w.name);
                  console.log(`   - Total: ${allModelWeightNames.length}`);
                  console.log(`   - Todos:`, allModelWeightNames);
                  
                  modelWithoutWeights.dispose();
                } catch (topologyError) {
                  console.warn('⚠️ Não foi possível deserializar apenas o modelTopology:', topologyError);
                }
              }
              
              throw modelLoadError;
            }
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
      
      if (modelInfo.scaler && modelInfo.scaler.type === 'StandardScaler') {
        this.scalerMean = modelInfo.scaler.mean;
        this.scalerScale = modelInfo.scaler.scale;
        
        console.log('✅ Parâmetros do StandardScaler carregados:');
        console.log(`   Mean: ${this.scalerMean.length} valores`);
        console.log(`   Scale: ${this.scalerScale.length} valores`);
        console.log(`   Primeiros valores mean: [${this.scalerMean.slice(0, 3).join(', ')}, ...]`);
        console.log(`   Primeiros valores scale: [${this.scalerScale.slice(0, 3).join(', ')}, ...]`);
      } else {
        console.warn('⚠️ model_info.json não contém parâmetros do scaler');
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
      
      // Pré-processa áudio a partir da URI
      const features = await audioPreprocessor.preprocessAudioFromUri(audioUri);
      console.log('✅ Áudio processado, shape:', features.shape);

      // Prepara input para o modelo
      // Redimensiona se necessário
      let input = features;
      if (features.shape.length === 2) {
        // Se for 2D, calcula média das características
        input = tf.mean(features, 0).expandDims(0);
        features.dispose(); // Limpa imediatamente
      } else if (features.shape.length === 1) {
        input = features.expandDims(0);
      }

      // Aplica normalização StandardScaler (z-score)
      // OTIMIZADO: Reduz logs e otimiza conversões
      const inputArray = await input.array();
      const inputValues = inputArray[0] as number[];
      
      // Aplica StandardScaler (z-score normalization)
      const normalizedValues = this.applyStandardScaler(inputValues);
      
      // Cria novo tensor normalizado
      input.dispose();
      input = tf.tensor2d([normalizedValues], [1, normalizedValues.length]);

      // Faz predição
      console.log('🤖 Executando modelo de ML...');
      const prediction = this.model!.predict(input) as tf.Tensor;
      const probabilities = await prediction.array() as number[][];

      const [normal, bronchitis, pneumonia] = probabilities[0];
      const maxProb = Math.max(normal, bronchitis, pneumonia);
      
      // Determina a classe prevista
      let predictedClass: 'normal' | 'bronchitis' | 'pneumonia' = 'normal';
      if (bronchitis > normal && bronchitis > pneumonia) {
        predictedClass = 'bronchitis';
      } else if (pneumonia > normal && pneumonia > bronchitis) {
        predictedClass = 'pneumonia';
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
      const inputArray = await input.array();
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

      const [normal, bronchitis, pneumonia] = probabilities[0];
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
   * Retorna a URL do modelo carregado
   */
  getModelUrl(): string | null {
    return this.modelUrl;
  }

  /**
   * Retorna informações sobre o modelo
   */
  getModelInfo(): { loaded: boolean; url: string | null; inputShape: number[] | null; outputShape: number[] | null } {
    return {
      loaded: this.modelLoaded,
      url: this.modelUrl,
      inputShape: this.model?.inputs[0]?.shape || null,
      outputShape: this.model?.outputs[0]?.shape || null,
    };
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

