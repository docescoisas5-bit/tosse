# 🚀 Treinamento Rápido com Datasets Reais

## Passo a Passo Rápido

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

### 3. Baixar e Organizar Datasets

**Opção A: Usar Coswara (Recomendado)**
```bash
# Clone o repositório
git clone https://github.com/iiscleap/Coswara-Data.git
# Organize os arquivos por classe em data/
```

**Opção B: Usar seus próprios dados**
- Coloque arquivos de áudio em `data/normal/`, `data/bronchitis/`, `data/pneumonia/`
- Formatos suportados: `.wav`, `.mp3`, `.m4a`, `.flac`, `.ogg`

### 4. Treinar Modelo

```bash
python train_with_real_data.py
```

O script irá:
- ✅ Carregar e balancear os dados automaticamente
- ✅ Extrair features MFCC
- ✅ Treinar o modelo com validação
- ✅ Salvar modelo e scaler

### 5. Converter para TensorFlow.js

```bash
python convert_to_tfjs.py
```

### 6. Fazer Upload

1. Acesse Supabase Dashboard > Storage
2. Crie bucket `ml-models` (público)
3. Faça upload da pasta `models/tfjs_model/`

### 7. Configurar no App

Adicione no `.env`:
```env
EXPO_PUBLIC_MODEL_URL=https://seu-projeto.supabase.co/storage/v1/object/public/ml-models/tfjs_model/model.json
```

## ⚠️ Requisitos Mínimos

- **Mínimo**: 50 amostras por classe
- **Recomendado**: 200+ amostras por classe
- **Ideal**: 500+ amostras por classe

## 📊 Tempo Estimado

- **Dataset pequeno** (150 amostras): 10-30 minutos
- **Dataset médio** (600 amostras): 1-2 horas
- **Dataset grande** (2000+ amostras): 3-6 horas

## ✅ Verificação

Após o treinamento, verifique:
- ✅ Accuracy de validação > 70%
- ✅ Matriz de confusão balanceada
- ✅ Modelo salvo em `models/cough_model.h5`
- ✅ Scaler salvo em `models/scaler.pkl`

