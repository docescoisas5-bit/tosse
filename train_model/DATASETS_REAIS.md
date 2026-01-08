# 📦 Guia para Obter Datasets Reais de Tosse

Este guia explica como obter e organizar datasets reais para treinar o modelo de classificação de tosse.

## 🎯 Datasets Recomendados

### 1. Coswara Dataset
**Descrição**: Dataset de sons respiratórios coletados durante a pandemia de COVID-19

**Como obter**:
1. Acesse: https://github.com/iiscleap/Coswara-Data
2. Clone o repositório ou baixe os dados
3. Organize os arquivos por classe (normal, bronchitis, pneumonia)

**Estrutura esperada**:
```
data/
  normal/
    audio1.wav
    audio2.wav
  bronchitis/
    audio1.wav
  pneumonia/
    audio1.wav
```

### 2. Sound-Dr Dataset
**Descrição**: Dataset com sons de tosse, respiração bucal e nasal com metadados clínicos

**Como obter**:
1. Acesse: https://github.com/ankitaggarwal011/Sound-Dr
2. Baixe o dataset
3. Organize por classe conforme metadados

### 3. CoughVid Dataset
**Descrição**: Dataset de tosse com COVID-19

**Como obter**:
1. Acesse: https://coughvid.epfl.ch/
2. Registre-se no site
3. Baixe o dataset
4. Organize por classe

### 4. AudioSet (Google)
**Descrição**: Dataset grande com vários tipos de áudio, incluindo tosse

**Como obter**:
1. Acesse: https://research.google.com/audioset/
2. Use a API para baixar clips de tosse
3. Organize por classe

## 📁 Organização dos Dados

Após baixar os datasets, organize-os da seguinte forma:

```
train_model/
  data/
    normal/
      normal_001.wav
      normal_002.wav
      ...
    bronchitis/
      bronchitis_001.wav
      bronchitis_002.wav
      ...
    pneumonia/
      pneumonia_001.wav
      pneumonia_002.wav
      ...
```

## ⚖️ Balanceamento de Classes

**IMPORTANTE**: O script `train_with_real_data.py` automaticamente:
- Balanceia o dataset (usa a classe com menos amostras como referência)
- Faz oversampling se necessário
- Garante distribuição igual de classes

**Recomendação**: Tente ter pelo menos 100-200 amostras de cada classe para um bom treinamento.

## 🔧 Pré-processamento

O script automaticamente:
- Converte todos os áudios para 16kHz (sample rate padrão)
- Normaliza o volume
- Extrai características MFCC (13 coeficientes)
- Normaliza as features (z-score)

## 🚀 Como Usar

1. **Organize os dados** conforme estrutura acima
2. **Execute o script de treinamento**:
   ```bash
   cd train_model
   python train_with_real_data.py
   ```
3. **Aguarde o treinamento** (pode levar várias horas dependendo do tamanho do dataset)
4. **Converta para TensorFlow.js**:
   ```bash
   python convert_to_tfjs.py
   ```
5. **Faça upload para Supabase Storage**

## 📊 Validação

O script divide os dados em:
- **70% Treino**: Para treinar o modelo
- **15% Validação**: Para ajustar hiperparâmetros
- **15% Teste**: Para avaliar performance final

## ⚠️ Considerações Importantes

1. **Qualidade dos Dados**: Certifique-se de que os áudios são de boa qualidade
2. **Duração**: Áudios muito curtos (< 1 segundo) podem não funcionar bem
3. **Ruído**: Áudios com muito ruído de fundo podem prejudicar o treinamento
4. **Ética**: Use apenas datasets públicos ou com permissão adequada

## 🔗 Links Úteis

- [Librosa Documentation](https://librosa.org/doc/latest/index.html)
- [TensorFlow Guide](https://www.tensorflow.org/guide)
- [Audio Classification Tutorial](https://www.tensorflow.org/tutorials/audio/simple_audio)

## 📝 Notas

- O script suporta formatos: `.wav`, `.mp3`, `.m4a`, `.flac`, `.ogg`
- Áudios são automaticamente convertidos para 16kHz
- Cada áudio é processado para 2 segundos de duração
- Features MFCC são calculadas e normalizadas automaticamente

