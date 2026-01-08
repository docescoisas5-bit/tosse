# 📤 Guia: Fazer Upload do Modelo para Supabase

## ✅ Arquivos Prontos

Você já tem os arquivos convertidos em:
- `train_model/models/saved_model/model.json`
- `train_model/models/saved_model/group1-shard1of1.bin`

## 🚀 Passo a Passo

### 1. Acessar Supabase Storage

Acesse: https://supabase.com/dashboard/project/gorslmmmivhbjrczsoie/storage/buckets

### 2. Criar Bucket (se ainda não existe)

1. Clique em **"New bucket"**
2. Configure:
   - **Name**: `ml-models`
   - **Public bucket**: ✅ **MARCADO** (muito importante!)
3. Clique em **"Create bucket"**

### 3. Criar Pasta no Bucket

1. Dentro do bucket `ml-models`, clique em **"New folder"**
2. Nome da pasta: `cough-model`
3. Clique em **"Create folder"**

### 4. Fazer Upload dos Arquivos

1. Entre na pasta `cough-model`
2. Clique em **"Upload file"** ou arraste os arquivos
3. Faça upload de **AMBOS** os arquivos:
   - ✅ `model.json`
   - ✅ `group1-shard1of1.bin`

**⚠️ IMPORTANTE**: Ambos os arquivos devem estar na mesma pasta (`cough-model`)

### 5. Verificar URL Pública

Após o upload, a URL do modelo será:
```
https://gorslmmmivhbjrczsoie.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json
```

Você pode testar abrindo essa URL no navegador - deve mostrar um JSON.

### 6. Configurar no .env

Abra o arquivo `.env` na raiz do projeto e adicione:

```env
EXPO_PUBLIC_MODEL_URL=https://gorslmmmivhbjrczsoie.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json
```

### 7. Reiniciar o App

```bash
cd /Users/mac/Downloads/tosse-main
npx expo start -c
```

## ✅ Verificação

Após reiniciar, você deve ver no console:
```
✅ Modelo real carregado: https://gorslmmmivhbjrczsoie.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json
```

Em vez de:
```
⚠️ Usando modelo placeholder para desenvolvimento
```

## 📋 Checklist

- [ ] Bucket `ml-models` criado e público
- [ ] Pasta `cough-model` criada
- [ ] Arquivo `model.json` enviado
- [ ] Arquivo `group1-shard1of1.bin` enviado
- [ ] URL testada no navegador
- [ ] `.env` configurado
- [ ] App reiniciado

## ❓ Problemas Comuns

### "Failed to load model"
- Verifique se o bucket é público
- Verifique se ambos os arquivos estão na mesma pasta
- Teste a URL no navegador

### "Cannot find weights file"
- Certifique-se de que `group1-shard1of1.bin` está na mesma pasta que `model.json`

### Modelo não carrega
- Verifique o console do Expo para erros
- Confirme que a URL está correta no `.env`

