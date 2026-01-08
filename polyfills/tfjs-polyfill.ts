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
// Aplica de forma mais agressiva para garantir que funcione
const applyPolyfill = () => {
  if (typeof global !== 'undefined') {
    // Cria objeto util se não existir
    if (!(global as any).util) {
      (global as any).util = {};
    }

    // Adiciona isTypedArray se não existir (sempre sobrescreve para garantir)
    (global as any).util.isTypedArray = isTypedArrayCheck;

    // Também adiciona diretamente no global como fallback
    (global as any).isTypedArray = isTypedArrayCheck;

    // Polyfill para process.env que pode ser necessário
    if (typeof (global as any).process === 'undefined') {
      (global as any).process = { env: {} };
    } else if (!(global as any).process.env) {
      (global as any).process.env = {};
    }
    
    // Tenta também injetar em outros objetos globais comuns
    if (typeof (global as any).globalThis !== 'undefined') {
      if (!(global as any).globalThis.util) {
        (global as any).globalThis.util = {};
      }
      (global as any).globalThis.util.isTypedArray = isTypedArrayCheck;
    }
    
    // Tenta injetar em window se existir
    if (typeof (global as any).window !== 'undefined') {
      if (!(global as any).window.util) {
        (global as any).window.util = {};
      }
      (global as any).window.util.isTypedArray = isTypedArrayCheck;
    }
  }
};

// Aplica imediatamente
applyPolyfill();

// Polyfill para window se não existir (alguns módulos podem precisar)
if (typeof global !== 'undefined' && typeof (global as any).window === 'undefined') {
  (global as any).window = global;
}

// Garante que o polyfill seja executado imediatamente
// Verifica se foi aplicado corretamente
const utilCheck = (global as any).util?.isTypedArray;
if (typeof utilCheck === 'function') {
  console.log('✅ Polyfill util.isTypedArray carregado com sucesso');
} else {
  console.warn('⚠️ Polyfill util.isTypedArray pode não ter sido aplicado corretamente');
  // Tenta aplicar novamente se falhou
  applyPolyfill();
}

// Força a aplicação do polyfill múltiplas vezes para garantir
// Isso é necessário porque o TensorFlow.js pode tentar acessar util em momentos diferentes
try {
  // Aplica imediatamente
  applyPolyfill();
  
  // Aplica após um pequeno delay
  setTimeout(() => {
    applyPolyfill();
    console.log('✅ Polyfill reaplicado via timeout');
  }, 0);
  
  // Aplica após um delay maior (para casos onde o TensorFlow carrega assincronamente)
  setTimeout(() => {
    applyPolyfill();
    console.log('✅ Polyfill reaplicado via timeout (delay maior)');
  }, 100);
} catch (e) {
  console.warn('⚠️ Erro ao aplicar polyfill via timeout:', e);
}

// Tenta interceptar require('util') se possível (React Native pode não suportar)
// Mas garantimos que util esteja sempre disponível no global
if (typeof global !== 'undefined') {
  // Garante que util esteja sempre disponível
  if (!(global as any).util) {
    (global as any).util = {};
  }
  
  // Adiciona isTypedArray sempre (sempre sobrescreve para garantir)
  (global as any).util.isTypedArray = isTypedArrayCheck;
  
  // Tenta criar um módulo fake para require('util') se possível
  try {
    // No React Native, require pode não ser modificável, mas tentamos
    const originalRequire = (global as any).require;
    if (typeof originalRequire === 'function') {
      // Cria um cache de módulos se não existir
      if (!(global as any).__requireCache) {
        (global as any).__requireCache = {};
      }
      
      // Intercepta require('util')
      (global as any).__requireCache['util'] = {
        isTypedArray: isTypedArrayCheck,
        // Adiciona outras funções comuns do util se necessário
        inspect: (obj: any) => JSON.stringify(obj),
        format: (...args: any[]) => args.join(' '),
      };
    }
  } catch (e) {
    // Ignora se não conseguir interceptar require
    console.log('ℹ️ Não foi possível interceptar require, usando polyfill global');
  }
  
  // Tenta também injetar diretamente no módulo do TensorFlow.js se possível
  // Isso é uma tentativa de última instância para garantir que funcione
  try {
    // Tenta acessar o módulo do TensorFlow.js e injetar util lá
    if ((global as any).__tfjsModules) {
      (global as any).__tfjsModules.util = {
        isTypedArray: isTypedArrayCheck,
      };
    }
  } catch (e) {
    // Ignora se não conseguir
  }
  
  // Garante que util esteja disponível em todos os contextos possíveis
  // Define propriedade não configurável para garantir que não seja sobrescrita
  try {
    Object.defineProperty((global as any), 'util', {
      value: {
        isTypedArray: isTypedArrayCheck,
        inspect: (obj: any) => JSON.stringify(obj),
        format: (...args: any[]) => args.join(' '),
      },
      writable: true,
      configurable: true,
      enumerable: true,
    });
  } catch (e) {
    // Se não conseguir definir como propriedade, apenas atribui normalmente
    (global as any).util = {
      isTypedArray: isTypedArrayCheck,
      inspect: (obj: any) => JSON.stringify(obj),
      format: (...args: any[]) => args.join(' '),
    };
  }
}

// Exporta função para aplicar manualmente se necessário
export const applyTfjsPolyfill = applyPolyfill;

export {};

