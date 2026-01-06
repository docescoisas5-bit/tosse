# Guia: Carregando Modelo TensorFlow Real

Este guia explica como carregar um modelo TensorFlow.js real na aplicação.

## 📋 Pré-requisitos

1. Um modelo TensorFlow/Keras treinado
2. Modelo convertido para TensorFlow.js
3. Modelo hospedado em um servidor acessível (Supabase Storage, CDN, etc.)

## 📥 Onde Obter Modelos Pré-treinados

**⚠️ Nota**: Modelos pré-treinados específicos para classificação de tosse (normal/bronquite/pneumonia) são raros. Veja `RECURSOS_MODELOS_PRE_TREINADOS.md` para opções.

**Opções**:
1. **Treinar seu próprio modelo** (recomendado)
2. **Usar modelos genéricos de áudio** (YAMNet, VGGish) e fazer fine-tuning
3. **Buscar em repositórios GitHub** de pesquisas acadêmicas

## 🔧 Passo 1: Converter Modelo para TensorFlow.js

Se você tem um modelo treinado em Python (Keras/TensorFlow):

```python
import tensorflow as tf
import tensorflowjs as tfjs

# Carrega seu modelo treinado
model = tf.keras.models.load_model('seu_modelo.h5')

# Converte para TensorFlow.js
tfjs.converters.save_keras_model(model, 'model_output')

# Isso criará:
# - model_output/model.json (arquitetura)
# - model_output/weights_*.bin (pesos)
```

## 📤 Passo 2: Fazer Upload do Modelo

### Opção A: Supabase Storage (Recomendado)

1. **Crie um bucket público para modelos:**
   - Acesse Supabase Dashboard > Storage
   - Crie bucket `ml-models` (público)
   
2. **Faça upload dos arquivos:**
   - `model.json`
   - Todos os arquivos `weights_*.bin`

3. **Obtenha a URL pública:**
   ```
   https://seu-projeto.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json
   ```

### Opção B: CDN ou Servidor Web

Faça upload para qualquer servidor web acessível:
- GitHub Pages
- AWS S3
- Google Cloud Storage
- Netlify/Vercel

## ⚙️ Passo 3: Configurar no Aplicativo

### Método 1: Variável de Ambiente (Recomendado)

Adicione no arquivo `.env`:

```env
EXPO_PUBLIC_MODEL_URL=https://seu-projeto.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json
```

### Método 2: Código Direto

No arquivo `app/home.tsx`, modifique:

```typescript
useEffect(() => {
  const loadModel = async () => {
    try {
      // Carrega modelo real da URL
      await mlService.loadModel('https://sua-url.com/model.json');
      setModelLoaded(true);
    } catch (error) {
      console.error('Erro ao carregar modelo:', error);
    }
  };
  loadModel();
}, []);
```

## 🎯 Passo 4: Verificar Carregamento

O aplicativo irá:
1. Tentar carregar o modelo da URL configurada
2. Se falhar, usar modelo placeholder como fallback
3. Logs no console mostrarão o status

Verifique os logs:
```
✅ Modelo carregado com sucesso de: https://...
📊 Input shape: [null, 13]
📊 Output shape: [null, 3]
```

## 📐 Formato Esperado do Modelo

O modelo deve ter:

- **Input**: Array de características MFCC
  - Shape: `[batch_size, 13]` ou `[batch_size, time_steps, 13]`
  - Valores normalizados (float32)

- **Output**: Probabilidades para 3 classes
  - Shape: `[batch_size, 3]`
  - Softmax activation
  - Classes: `[normal, bronchitis, pneumonia]`

## 🔍 Exemplo de Modelo Compatível

```python
import tensorflow as tf
from tensorflow import keras

# Define modelo compatível
model = keras.Sequential([
    keras.layers.Dense(64, activation='relu', input_shape=(13,)),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(32, activation='relu'),
    keras.layers.Dense(3, activation='softmax')  # 3 classes
])

# Compila
model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Treina com seus dados...
# model.fit(X_train, y_train, ...)

# Salva
model.save('cough_model.h5')

# Converte para TensorFlow.js
import tensorflowjs as tfjs
tfjs.converters.save_keras_model(model, 'cough_model_js')
```

## 🚨 Troubleshooting

### Erro: "Failed to fetch model"
- Verifique se a URL está correta
- Confirme que o servidor permite CORS
- Verifique se todos os arquivos (model.json + weights) estão acessíveis

### Erro: "Model input shape mismatch"
- Verifique se o pré-processamento gera características no formato esperado
- O modelo espera 13 features MFCC (ou outro formato conforme treinado)

### Modelo não carrega
- Verifique os logs no console
- O aplicativo usará modelo placeholder como fallback
- Verifique se o formato do modelo é compatível (LayersModel)

## 📝 Notas Importantes

1. **Tamanho do Modelo**: Modelos grandes podem demorar para carregar
   - Considere quantização (INT8) para reduzir tamanho
   - Use modelos leves para dispositivos móveis

2. **Performance**: 
   - Modelos grandes podem ser lentos em dispositivos móveis
   - Considere usar TensorFlow Lite para melhor performance

3. **Atualizações**:
   - Para atualizar o modelo, apenas substitua os arquivos no servidor
   - O aplicativo carregará a nova versão na próxima inicialização

## 🔗 Recursos Úteis

- [TensorFlow.js Converter](https://www.tensorflow.org/js/guide/conversion)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [TensorFlow.js Models](https://www.tensorflow.org/js/models)

