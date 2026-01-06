import * as tf from '@tensorflow/tfjs';

/**
 * Inicializa TensorFlow.js para React Native
 * Deve ser chamado antes de usar qualquer funcionalidade do TensorFlow
 */
export async function initTensorFlow(): Promise<void> {
  try {
    // Aguarda TensorFlow estar pronto
    await tf.ready();
    
    // Configura backend
    // No React Native, o backend será determinado automaticamente
    // ou pode ser configurado manualmente se necessário
    console.log('TensorFlow.js inicializado com sucesso');
    console.log('Backend:', tf.getBackend());
  } catch (error) {
    console.error('Erro ao inicializar TensorFlow.js:', error);
    throw error;
  }
}

