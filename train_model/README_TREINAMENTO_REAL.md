# 🎯 Treinamento com Datasets Reais - Guia Completo

## 📋 Visão Geral

Este guia explica como treinar o modelo de classificação de tosse usando datasets reais, garantindo melhor precisão e performance.

## 🚀 Início Rápido

### 1. Instalar Dependências

```bash
cd train_model
pip install -r requirements.txt
```

### 2. Organizar Dados

Crie a estrutura de diretórios:

```bash
mkdir -p data/normal
mkdir -p data/bronchitis
mkdir -p data/pneumonia
```

### 3. Baixar Datasets

Veja `DATASETS_REAIS.md` para links e instruções de download.

### 4. Treinar

```bash
python train_with_real_data.py
```

## 📊 O que o Script Faz

1. **Carrega dados** de `data/normal/`, `data/bronchitis/`, `data/pneumonia/`
2. **Balanceia automaticamente** o dataset (mesma quantidade por classe)
3. **Extrai features MFCC** (13 coeficientes)
4. **Normaliza features** (z-score)
5. **Divide em treino/validação/teste** (70%/15%/15%)
6. **Treina modelo** com early stopping e learning rate reduction
7. **Avalia performance** com matriz de confusão e relatório de classificação
8. **Salva modelo e scaler** para uso posterior

## ⚖️ Balanceamento Automático

O script automaticamente:
- Identifica a classe com menos amostras
- Balanceia todas as classes para esse número
- Faz oversampling se necessário (repetindo amostras aleatórias)

**Exemplo**: Se você tiver:
- Normal: 500 amostras
- Bronquite: 200 amostras
- Pneumonia: 300 amostras

O script usará 200 amostras de cada classe (balanceado).

## 📈 Métricas de Avaliação

Após o treinamento, você verá:

1. **Loss e Accuracy** no conjunto de teste
2. **Matriz de Confusão** mostrando acertos/erros por classe
3. **Relatório de Classificação** com:
   - Precision (precisão)
   - Recall (recuperação)
   - F1-score
   - Support (número de amostras)

## 🔧 Configurações

### Parâmetros de Áudio (no script)

```python
SAMPLE_RATE = 16000  # Taxa de amostragem
N_MFCC = 13          # Número de coeficientes MFCC
DURATION = 2.0       # Duração do áudio (segundos)
```

### Arquitetura do Modelo

- **Input**: 13 features MFCC
- **Camadas**: Dense(128) → Dropout → Dense(64) → Dropout → Dense(32) → Dropout → Dense(3)
- **Output**: 3 classes (normal, bronchitis, pneumonia)
- **Ativação final**: Softmax

## 📁 Arquivos Gerados

Após o treinamento:

```
models/
  ├── cough_model.h5      # Modelo Keras
  ├── scaler.pkl          # Scaler para normalização (IMPORTANTE!)
  └── model_info.json     # Informações do modelo
```

## ⚠️ Importante: Scaler

O arquivo `scaler.pkl` é **ESSENCIAL** porque:
- O modelo foi treinado com features normalizadas
- Você precisa usar o mesmo scaler no app
- Sem o scaler, as predições serão incorretas

**Nota**: Atualmente o app não usa o scaler. Será necessário atualizar o código do app para usar o scaler salvo.

## 🔄 Próximos Passos

1. **Converter para TensorFlow.js**:
   ```bash
   python convert_to_tfjs.py
   ```

2. **Fazer upload para Supabase Storage**

3. **Atualizar o app** para usar o scaler (se necessário)

4. **Testar** com dados reais

## 📊 Requisitos de Dados

### Mínimo
- 50 amostras por classe
- Áudios de pelo menos 1 segundo
- Qualidade razoável (sem muito ruído)

### Recomendado
- 200+ amostras por classe
- Áudios de 2-5 segundos
- Boa qualidade de áudio

### Ideal
- 500+ amostras por classe
- Áudios de 2-5 segundos
- Alta qualidade, sem ruído de fundo

## 🐛 Troubleshooting

### Erro: "Nenhum dado foi carregado"
- Verifique se os diretórios `data/normal/`, `data/bronchitis/`, `data/pneumonia/` existem
- Verifique se há arquivos de áudio nesses diretórios
- Formatos suportados: `.wav`, `.mp3`, `.m4a`, `.flac`, `.ogg`

### Erro: "Pelo menos uma classe está vazia"
- Certifique-se de ter pelo menos alguns arquivos em cada classe
- Verifique se os arquivos não estão corrompidos

### Accuracy muito baixa (< 50%)
- Verifique a qualidade dos dados
- Certifique-se de que os áudios estão corretamente classificados
- Tente aumentar o número de amostras

### Modelo sempre retorna a mesma classe
- Dataset pode estar desbalanceado (mas o script balanceia automaticamente)
- Features podem não estar discriminando bem
- Tente aumentar o número de amostras ou melhorar a qualidade dos dados

## 📚 Referências

- [Librosa MFCC](https://librosa.org/doc/latest/generated/librosa.feature.mfcc.html)
- [TensorFlow Guide](https://www.tensorflow.org/guide)
- [Scikit-learn StandardScaler](https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.StandardScaler.html)

