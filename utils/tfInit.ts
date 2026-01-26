// Importa polyfills ANTES do TensorFlow
import '../polyfills/tfjs-polyfill';
import * as tf from '@tensorflow/tfjs';

/**
 * Inicializa TensorFlow.js para React Native
 * Deve ser chamado antes de usar qualquer funcionalidade do TensorFlow
 */
export async function initTensorFlow(): Promise<void> {
  try {
    // Aplica o polyfill antes de tudo
    const { applyTfjsPolyfill } = await import('../polyfills/tfjs-polyfill');
    applyTfjsPolyfill();
    
    // Verifica se o backend está disponível
    let backend = tf.getBackend();
    
    // Se não houver backend, tenta configurar CPU
    if (!backend) {
      console.log('⚠️ Backend não detectado, configurando CPU backend...');
      try {
        await tf.setBackend('cpu');
        await tf.ready();
        backend = tf.getBackend();
      } catch (backendError) {
        console.error('Erro ao configurar backend CPU:', backendError);
        // Tenta continuar mesmo sem backend explícito
      }
    }
    
    console.log('✅ TensorFlow.js inicializado com sucesso');
    console.log('📊 Backend:', backend || 'automático');
    
    // Verifica se o backend está funcionando criando um tensor de teste
    try {
      // Cria um array JavaScript simples
      const testArray = [1, 2, 3];
      const testTensor = tf.tensor1d(testArray);
      testTensor.dispose();
      console.log('✅ Backend funcionando corretamente');
    } catch (testError) {
      console.warn('⚠️ Aviso: Backend pode não estar funcionando corretamente:', testError);
      // Não lança erro aqui, apenas avisa, pois pode funcionar depois
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar TensorFlow.js:', error);
    throw error;
  }
}

