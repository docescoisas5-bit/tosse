# 🎯 Passo a Passo: Upload do Modelo

## 📍 Localização dos Arquivos

Seus arquivos estão em:
```
train_model/models/saved_model/
├── model.json              ← Arquivo principal
└── group1-shard1of1.bin    ← Arquivo de pesos
```

## 🚀 Passos para Upload

### 1️⃣ Acesse o Supabase Storage

**Link direto**: https://supabase.com/dashboard/project/gorslmmmivhbjrczsoie/storage/buckets

### 2️⃣ Criar Bucket (se necessário)

- Clique em **"New bucket"**
- Nome: `ml-models`
- ✅ Marque **"Public bucket"**
- Clique em **"Create bucket"**

### 3️⃣ Criar Pasta

- Dentro de `ml-models`, clique em **"New folder"**
- Nome: `cough-model`
- Clique em **"Create folder"**

### 4️⃣ Fazer Upload

1. Entre na pasta `cough-model`
2. Clique em **"Upload file"**
3. Selecione os **2 arquivos**:
   - `train_model/models/saved_model/model.json`
   - `train_model/models/saved_model/group1-shard1of1.bin`

### 5️⃣ Configurar .env

Adicione esta linha no arquivo `.env`:

```env
EXPO_PUBLIC_MODEL_URL=https://gorslmmmivhbjrczsoie.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json
```

### 6️⃣ Reiniciar App

```bash
npx expo start -c
```

## ✅ Pronto!

O modelo real será carregado automaticamente! 🎉

