# Recursos para Modelos Pré-treinados de Análise de Tosse

## 🔍 Onde Encontrar Modelos

Infelizmente, **não há muitos modelos pré-treinados prontos** especificamente para classificação de tosse (normal/bronquite/pneumonia). A maioria dos pesquisadores treina seus próprios modelos. Aqui estão os melhores recursos:

## 📚 Repositórios GitHub com Modelos e Código

### 1. **COUGHVID Dataset e Modelos**
- **Repositório**: [EPFL - COUGHVID](https://github.com/iiscleap/CoughVID)
- **Descrição**: Dataset de tosse com código para treinamento
- **Modelos**: Geralmente não incluem modelos pré-treinados, mas código para treinar
- **Link**: https://github.com/iiscleap/CoughVID

### 2. **Coswara Dataset**
- **Repositório**: [Coswara - COVID-19 Sound Analysis](https://github.com/iiscleap/Coswara-Data)
- **Descrição**: Dataset de sons respiratórios incluindo tosse
- **Modelos**: Código de exemplo para treinamento

### 3. **ICBHI Respiratory Sound Database**
- **Site**: [ICBHI Challenge](https://www.kaggle.com/datasets/vbookshelf/respiratory-sound-database)
- **Descrição**: Base de dados clássica com sons de bronquite, pneumonia, asma
- **Modelos**: Pesquisadores compartilham modelos no Kaggle

### 4. **Repositórios de Pesquisa Acadêmica**

#### Deep Learning para Classificação de Tosse
- **Paper**: "Deep Neural Network Based Respiratory Pathology Classification Using Cough Sounds"
- **ArXiv**: https://arxiv.org/abs/2106.12174
- **Código**: Geralmente disponível nos repositórios dos autores

#### COVID-19 Cough Classification
- **GitHub**: Procure por "cough classification", "respiratory sound classification"
- **Exemplos**:
  - https://github.com/search?q=cough+classification+deep+learning
  - https://github.com/search?q=respiratory+sound+classification

## 🎯 Modelos Genéricos de Áudio (Transfer Learning)

Você pode usar modelos pré-treinados de áudio e fazer fine-tuning:

### 1. **YAMNet (TensorFlow Hub)**
- **Link**: https://tfhub.dev/google/yamnet/1
- **Descrição**: Modelo pré-treinado para classificação de sons
- **Uso**: Pode ser adaptado para tosse com fine-tuning
- **Código de exemplo**:
```python
import tensorflow_hub as hub
model = hub.load("https://tfhub.dev/google/yamnet/1")
```

### 2. **VGGish (Audio Classification)**
- **Link**: https://github.com/tensorflow/models/tree/master/research/audioset/vggish
- **Descrição**: Modelo pré-treinado no AudioSet
- **Uso**: Extração de features para classificação de áudio

### 3. **Wav2Vec 2.0 (Hugging Face)**
- **Link**: https://huggingface.co/models?search=wav2vec
- **Descrição**: Modelos de processamento de áudio
- **Uso**: Pode ser adaptado para classificação

## 🏋️ Treinar Seu Próprio Modelo

Como não há muitos modelos pré-treinados prontos, a melhor opção é treinar seu próprio:

### Opção 1: Usar Notebooks do Kaggle

1. **Acesse Kaggle**: https://www.kaggle.com
2. **Procure por**: "cough classification", "respiratory sound"
3. **Notebooks populares**:
   - ICBHI Respiratory Sound Database notebooks
   - COUGHVID analysis notebooks
4. **Adapte o código** para suas classes (normal/bronquite/pneumonia)

### Opção 2: Código de Exemplo Python

```python
import tensorflow as tf
from tensorflow import keras
import librosa
import numpy as np

# Carrega e processa dados
def load_audio(file_path):
    y, sr = librosa.load(file_path, sr=16000, mono=True)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    return np.mean(mfcc, axis=1)  # Média temporal

# Define modelo
model = keras.Sequential([
    keras.layers.Dense(64, activation='relu', input_shape=(13,)),
    keras.layers.Dropout(0.3),
    keras.layers.Dense(32, activation='relu'),
    keras.layers.Dense(3, activation='softmax')  # normal, bronquite, pneumonia
])

model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Treina (substitua com seus dados)
# model.fit(X_train, y_train, epochs=50, validation_data=(X_val, y_val))

# Salva
model.save('cough_model.h5')

# Converte para TensorFlow.js
import tensorflowjs as tfjs
tfjs.converters.save_keras_model(model, 'cough_model_js')
```

## 📦 Modelos Prontos para Download (Limitados)

### Kaggle Competitions
- **ICBHI Challenge**: https://www.kaggle.com/competitions
- Procure por competições de classificação de sons respiratórios
- Participantes frequentemente compartilham modelos vencedores

### Papers with Code
- **Site**: https://paperswithcode.com
- **Busque**: "cough classification", "respiratory sound"
- Alguns papers incluem links para modelos treinados

## 🚀 Solução Rápida: Modelo Simples para Teste

Se você precisa de algo rápido para testar, aqui está um modelo simples que você pode treinar rapidamente:

### Dataset Mínimo
1. Baixe alguns exemplos de cada classe
2. Use augmentation de dados para aumentar o dataset
3. Treine um modelo simples (pode levar algumas horas)

### Script Rápido de Treinamento
```python
# train_simple_model.py
import tensorflow as tf
import librosa
import numpy as np
import os

# Função para extrair features
def extract_features(file_path):
    y, sr = librosa.load(file_path, sr=16000, mono=True, duration=2)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    return np.mean(mfcc, axis=1)

# Carrega dados (ajuste os caminhos)
def load_data(data_dir):
    X, y = [], []
    classes = ['normal', 'bronchitis', 'pneumonia']
    
    for class_idx, class_name in enumerate(classes):
        class_dir = os.path.join(data_dir, class_name)
        for file in os.listdir(class_dir):
            if file.endswith('.wav') or file.endswith('.m4a'):
                features = extract_features(os.path.join(class_dir, file))
                X.append(features)
                y.append(class_idx)
    
    return np.array(X), tf.keras.utils.to_categorical(y, 3)

# Treina modelo
X, y = load_data('seu_dataset/')
model = tf.keras.Sequential([...])  # Use o modelo acima
model.fit(X, y, epochs=50, validation_split=0.2)
```

## 📝 Recomendações

1. **Para Desenvolvimento Rápido**:
   - Use o modelo placeholder atual (já implementado)
   - Foque em testar a interface e fluxo da aplicação

2. **Para Produção**:
   - Treine seu próprio modelo com dados reais
   - Use datasets como COUGHVID, Coswara, ou ICBHI
   - Valide com profissionais de saúde

3. **Transfer Learning**:
   - Use YAMNet ou VGGish como base
   - Faça fine-tuning com dados de tosse
   - Geralmente produz melhores resultados

## 🔗 Links Úteis

- **TensorFlow Hub**: https://tfhub.dev
- **Hugging Face Models**: https://huggingface.co/models
- **Kaggle Datasets**: https://www.kaggle.com/datasets
- **Papers with Code**: https://paperswithcode.com
- **GitHub Search**: https://github.com/search?q=cough+classification

## ⚠️ Nota Importante

Modelos pré-treinados para classificação médica específica (pneumonia/bronquite) são raros porque:
- Requerem validação clínica
- Dados médicos são sensíveis
- Cada aplicação precisa de validação específica

**Recomendação**: Para um projeto acadêmico, treine um modelo simples com dados públicos. Para uso clínico real, consulte profissionais de saúde e órgãos reguladores.

