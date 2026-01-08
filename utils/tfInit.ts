// Importa polyfills ANTES do TensorFlow
import '../polyfills/tfjs-polyfill';
import * as tf from '@tensorflow/tfjs';

/**
 * Inicializa TensorFlow.js para React Native
 * Deve ser chamado antes de usar qualquer funcionalidade do TensorFlow
 */
export async function initTensorFlow(): Promise<void> {
  try {
    // Configura o TensorFlow.js para usar nosso polyfill ANTES de tf.ready()
    // Isso é crítico porque o TensorFlow.js pode cachear referências durante a inicialização
    try {
      // Tenta configurar ANTES de tf.ready()
      const tfEnv = (tf as any).env();
      if (tfEnv) {
        // Garante que platform existe
        if (!tfEnv.platform) {
          tfEnv.platform = {};
        }
        
        // Configura isTypedArray
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
        console.log('✅ TensorFlow.js env().platform.isTypedArray configurado ANTES de tf.ready()');
      } else {
        console.warn('⚠️ tf.env() não está disponível antes de tf.ready()');
      }
    } catch (envError) {
      console.warn('⚠️ Não foi possível configurar env().platform.isTypedArray antes de tf.ready():', envError);
    }
    
    // Aguarda TensorFlow estar pronto
    await tf.ready();
    
    // Configura novamente DEPOIS de tf.ready() para garantir
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
        console.log('✅ TensorFlow.js env().platform.isTypedArray configurado DEPOIS de tf.ready()');
      }
    } catch (envError) {
      console.warn('⚠️ Não foi possível configurar env().platform.isTypedArray depois de tf.ready():', envError);
    }
    
    // Verifica se já há um backend configurado
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
    // Usa uma abordagem mais simples para evitar problemas com isTypedArray
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

