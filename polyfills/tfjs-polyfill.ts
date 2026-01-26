/**
 * Polyfills necessários para TensorFlow.js funcionar no React Native
 * Este arquivo deve ser importado ANTES de qualquer importação do TensorFlow.js
 */

// Função helper para verificar se é TypedArray
const isTypedArrayCheck = (value: any): boolean => {
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

// Polyfill para util.isTypedArray que o TensorFlow.js usa internamente
const applyPolyfill = () => {
  if (typeof global !== 'undefined') {
    // Cria objeto util se não existir
    if (!(global as any).util) {
      (global as any).util = {};
    }

    // Adiciona isTypedArray se não existir
    (global as any).util.isTypedArray = isTypedArrayCheck;

    // Polyfill para TextEncoder/TextDecoder se não existir (necessário para pesos)
    if (typeof (global as any).TextEncoder === 'undefined') {
      console.log('🔧 Adicionando polyfill TextEncoder');
      (global as any).TextEncoder = class TextEncoder {
        encode(str: string) {
          const arr = new Uint8Array(str.length);
          for (let i = 0; i < str.length; i++) {
            arr[i] = str.charCodeAt(i);
          }
          return arr;
        }
      };
    }
    
    if (typeof (global as any).TextDecoder === 'undefined') {
      console.log('🔧 Adicionando polyfill TextDecoder');
      (global as any).TextDecoder = class TextDecoder {
        decode(arr: Uint8Array) {
          return String.fromCharCode.apply(null, Array.from(arr));
        }
      };
    }

    // Polyfill para process.env que pode ser necessário
    if (typeof (global as any).process === 'undefined') {
      (global as any).process = { env: {} };
    } else if (!(global as any).process.env) {
      (global as any).process.env = {};
    }
  }
};

// Aplica imediatamente
applyPolyfill();

// Polyfill para window se não existir
if (typeof global !== 'undefined' && typeof (global as any).window === 'undefined') {
  (global as any).window = global;
}

// Verifica se foi aplicado corretamente (apenas em modo de desenvolvimento)
if (__DEV__) {
  const utilCheck = (global as any).util?.isTypedArray;
  if (typeof utilCheck === 'function') {
    console.log('✅ Polyfill util.isTypedArray carregado com sucesso');
  } else {
    console.warn('⚠️ Polyfill util.isTypedArray pode não ter sido aplicado corretamente');
  }
}

// Exporta função para aplicar manualmente se necessário
export const applyTfjsPolyfill = applyPolyfill;

