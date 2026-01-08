# Treinamento de Modelo de Classificação de Tosse

Este diretório contém scripts para treinar e converter um modelo de classificação de tosse para uso no aplicativo.

## 📋 Pré-requisitos

1. **Python 3.8+**
2. **pip** (gerenciador de pacotes Python)

## 🚀 Instalação

1. **Instale as dependências:**
```bash
pip install -r requirements.txt
```

Ou instale manualmente:
```bash
pip install tensorflow tensorflowjs numpy
```

## 🏋️ Treinar o Modelo

Execute o script de treinamento:

```bash
python train_cough_model.py
```

Isso irá:
- ✅ Gerar dataset sintético com características de tosse
- ✅ Treinar modelo de classificação (Normal, Bronquite, Pneumonia)
- ✅ Salvar modelo em formato Keras (.h5)
- ✅ Salvar informações do modelo (model_info.json)

**Tempo estimado**: 2-5 minutos (dependendo do hardware)

## 🔄 Converter para TensorFlow.js

Após treinar, converta para TensorFlow.js:

```bash
python convert_to_tfjs.py
```

Isso irá:
- ✅ Converter modelo Keras para TensorFlow.js
- ✅ Gerar arquivos `model.json` e `weights_*.bin`
- ✅ Criar pasta `models/tfjs_model/` pronta para upload

## 📤 Fazer Upload do Modelo

### Opção 1: Supabase Storage (Recomendado)

1. **Crie bucket no Supabase:**
   - Acesse: Supabase Dashboard > Storage
   - Crie bucket `ml-models` (público)

2. **Faça upload:**
   - Faça upload da pasta `models/tfjs_model/` inteira
   - Ou faça upload dos arquivos individualmente

3. **Obtenha URL:**
   ```
   https://seu-projeto.supabase.co/storage/v1/object/public/ml-models/tfjs_model/model.json
   ```

### Opção 2: CDN ou Servidor Web

Faça upload para qualquer servidor web acessível.

## ⚙️ Configurar no App

Adicione no arquivo `.env`:

```env
EXPO_PUBLIC_MODEL_URL=https://seu-projeto.supabase.co/storage/v1/object/public/ml-models/tfjs_model/model.json
```

## 📊 Sobre o Modelo

### Arquitetura
- **Input**: 13 características MFCC
- **Camadas**:
  - Dense(128) + BatchNorm + Dropout(0.4)
  - Dense(64) + BatchNorm + Dropout(0.3)
  - Dense(32) + Dropout(0.2)
  - Dense(3) + Softmax
- **Output**: 3 classes (normal, bronquite, pneumonia)

### Dados de Treinamento

⚠️ **Nota**: O modelo atual é treinado com **dados sintéticos** para desenvolvimento.

Para produção:
1. Substitua `generate_synthetic_cough_features()` por carregamento de dados reais
2. Use datasets como COUGHVID, Coswara, ou ICBHI
3. Valide com profissionais de saúde

### Melhorar o Modelo

Para usar dados reais, modifique `train_cough_model.py`:

```python
def load_real_data(data_dir):
    """Carrega dados reais de áudio"""
    import librosa
    import os
    
    X, y = [], []
    classes = ['normal', 'bronchitis', 'pneumonia']
    
    for class_idx, class_name in enumerate(classes):
        class_dir = os.path.join(data_dir, class_name)
        for file in os.listdir(class_dir):
            if file.endswith(('.wav', '.m4a', '.mp3')):
                # Carrega áudio
                y_audio, sr = librosa.load(
                    os.path.join(class_dir, file),
                    sr=16000,
                    mono=True
                )
                # Extrai MFCC
                mfcc = librosa.feature.mfcc(
                    y=y_audio,
                    sr=sr,
                    n_mfcc=13
                )
                # Média temporal
                mfcc_mean = np.mean(mfcc, axis=1)
                X.append(mfcc_mean)
                y.append(class_idx)
    
    return np.array(X), tf.keras.utils.to_categorical(y, 3)
```

## 🐛 Troubleshooting

### Erro: "tensorflowjs not found"
```bash
pip install tensorflowjs
```

### Erro: "CUDA out of memory"
- Reduza `NUM_SAMPLES` no script
- Reduza `batch_size` no treinamento

### Modelo muito grande
- Use quantização: `tfjs.converters.save_keras_model(..., quantization_dtype='uint8')`
- Reduza número de neurônios nas camadas

## 📝 Estrutura de Arquivos

```
train_model/
├── train_cough_model.py    # Script de treinamento
├── convert_to_tfjs.py      # Script de conversão
├── requirements.txt         # Dependências Python
├── README.md               # Este arquivo
└── models/                 # Gerado após treinamento
    ├── cough_model.h5      # Modelo Keras
    ├── saved_model/        # SavedModel format
    ├── model_info.json     # Informações do modelo
    └── tfjs_model/         # Modelo TensorFlow.js
        ├── model.json
        └── weights_*.bin
```

## 🔗 Referências

- [TensorFlow.js Converter](https://www.tensorflow.org/js/guide/conversion)
- [Keras Documentation](https://keras.io/)
- [Librosa MFCC](https://librosa.org/doc/latest/generated/librosa.feature.mfcc.html)

