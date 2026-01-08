# 🚀 Instruções Rápidas - Conversão Manual

## 1️⃣ Converter Modelo (Escolha uma opção)

### Opção A: Ambiente Python Limpo
```bash
python3 -m venv venv_tfjs
source venv_tfjs/bin/activate
pip install tensorflow tensorflowjs
cd train_model
python3 convert_to_tfjs.py
```

### Opção B: Online
- Acesse: https://convertmodel.com/
- Faça upload: `train_model/models/cough_model.h5`
- Baixe o modelo convertido

## 2️⃣ Upload para Supabase

1. Acesse: https://supabase.com/dashboard/project/gorslmmmivhbjrczsoie/storage/buckets
2. Crie bucket público: `ml-models`
3. Crie pasta: `cough-model`
4. Faça upload de TODOS os arquivos de `tfjs_model/`:
   - model.json
   - weights_*.bin (todos)

## 3️⃣ Configurar .env

Adicione no arquivo `.env`:
```
EXPO_PUBLIC_MODEL_URL=https://gorslmmmivhbjrczsoie.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json
```

## 4️⃣ Reiniciar App

```bash
npx expo start -c
```

✅ Pronto! O modelo real será carregado automaticamente.
