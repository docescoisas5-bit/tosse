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

  /**
   * Obtém a URL do modelo das variáveis de ambiente ou usa padrão
   */
  private getModelUrl(): string | null {
    // Tenta obter da variável de ambiente
    const envUrl = 
      Constants.expoConfig?.extra?.modelUrl || 
      process.env.EXPO_PUBLIC_MODEL_URL;
    
    if (envUrl) {
      return envUrl;
    }

    // URL padrão do modelo (pode ser Supabase Storage, CDN, etc.)
    // Exemplo: 'https://seu-projeto.supabase.co/storage/v1/object/public/models/cough-model/model.json'
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

      // Inicializa TensorFlow.js
      await tf.ready();

      // Determina URL do modelo
      const urlToLoad = modelUrl || this.getModelUrl();

      if (urlToLoad) {
        console.log('Carregando modelo de:', urlToLoad);
        try {
          // Carrega modelo de URL (Supabase Storage, CDN, etc.)
          this.model = await tf.loadLayersModel(urlToLoad);
          this.modelUrl = urlToLoad;
          console.log('✅ Modelo carregado com sucesso de:', urlToLoad);
          console.log('📊 Input shape:', this.model.inputs[0].shape);
          console.log('📊 Output shape:', this.model.outputs[0].shape);
        } catch (loadError) {
          console.error('❌ Erro ao carregar modelo de URL:', loadError);
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
      await this.loadModel();
    }

    try {
      // Pré-processa áudio a partir da URI
      const features = await audioPreprocessor.preprocessAudioFromUri(audioUri);

      // Prepara input para o modelo
      // Redimensiona se necessário
      let input = features;
      if (features.shape.length === 2) {
        // Se for 2D, precisa fazer reshape ou média
        input = tf.mean(features, 0).expandDims(0);
      } else if (features.shape.length === 1) {
        input = features.expandDims(0);
      }

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

