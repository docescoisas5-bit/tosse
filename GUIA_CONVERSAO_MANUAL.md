# Guia: Conversão Manual do Modelo para TensorFlow.js

Este guia explica como converter o modelo treinado para TensorFlow.js e fazer upload para o Supabase Storage.

## 📋 Pré-requisitos

1. Modelo treinado (já está pronto em `train_model/models/cough_model.h5`)
2. Python 3.8+ instalado
3. Acesso ao Supabase Dashboard

## 🔄 Passo 1: Converter Modelo para TensorFlow.js

### Opção A: Usar Ambiente Python Limpo (Recomendado)

```bash
# 1. Crie um ambiente virtual limpo
python3 -m venv venv_tfjs
source venv_tfjs/bin/activate  # No macOS/Linux
# ou
venv_tfjs\Scripts\activate  # No Windows

# 2. Instale apenas as dependências necessárias
pip install tensorflow tensorflowjs

# 3. Navegue até a pasta do projeto
cd /Users/mac/Downloads/tosse-main/train_model

# 4. Execute a conversão
python3 convert_to_tfjs.py
```

### Opção B: Converter Online

1. Acesse: https://convertmodel.com/
2. Faça upload do arquivo: `train_model/models/cough_model.h5`
3. Selecione o formato de saída: **TensorFlow.js**
4. Baixe os arquivos convertidos
5. Extraia em uma pasta chamada `tfjs_model`

### Opção C: Usar Google Colab

1. Acesse: https://colab.research.google.com/
2. Crie um novo notebook
3. Execute:

```python
!pip install tensorflowjs

import tensorflow as tf
import tensorflowjs as tfjs

# Faça upload do arquivo cough_model.h5
# (use o menu Files > Upload)

# Converta
tfjs.converters.save_keras_model(
    'cough_model.h5',
    'tfjs_model'
)

# Baixe os arquivos
from google.colab import files
import shutil
shutil.make_archive('tfjs_model', 'zip', 'tfjs_model')
files.download('tfjs_model.zip')
```

## 📤 Passo 2: Fazer Upload para Supabase Storage

### 2.1 Criar Bucket no Supabase

1. Acesse o Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/gorslmmmivhbjrczsoie/storage/buckets
   ```

2. Clique em **"New bucket"**

3. Configure:
   - **Name**: `ml-models`
   - **Public bucket**: ✅ **MARCADO** (deve ser público)
   - Clique em **"Create bucket"**

### 2.2 Fazer Upload dos Arquivos

1. No bucket `ml-models`, clique em **"Upload file"** ou **"New folder"**

2. Crie uma pasta chamada `cough-model` (ou `tfjs_model`)

3. Faça upload de **TODOS** os arquivos da pasta `tfjs_model`:
   - `model.json` (obrigatório)
   - `weights_*.bin` (todos os arquivos de pesos)
   - Exemplo: `weights_1.bin`, `weights_2.bin`, etc.

4. **Importante**: Todos os arquivos devem estar na mesma pasta no Supabase

### 2.3 Obter a URL Pública

Após o upload, a URL do modelo será:
```
https://gorslmmmivhbjrczsoie.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json
```

Ou se você usou a pasta `tfjs_model`:
```
https://gorslmmmivhbjrczsoie.supabase.co/storage/v1/object/public/ml-models/tfjs_model/model.json
```

## ⚙️ Passo 3: Configurar no Aplicativo

1. Abra o arquivo `.env` na raiz do projeto

2. Adicione ou descomente a linha:
   ```env
   EXPO_PUBLIC_MODEL_URL=https://gorslmmmivhbjrczsoie.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json
   ```

3. Salve o arquivo

4. Reinicie o servidor Expo:
   ```bash
   npx expo start -c
   ```

## ✅ Verificação

Após configurar, você deve ver no console:
```
✅ Modelo real carregado: https://gorslmmmivhbjrczsoie.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json
```

Em vez de:
```
⚠️ Usando modelo placeholder para desenvolvimento
```

## 🔍 Estrutura de Arquivos Esperada

Após a conversão, você deve ter:

```
tfjs_model/
├── model.json          (arquitetura do modelo)
├── weights_1.bin       (pesos - pode ter vários)
├── weights_2.bin       (pesos - pode ter vários)
└── ...                 (outros arquivos de pesos)
```

## ❓ Troubleshooting

### Erro: "Failed to load model"
- Verifique se a URL está correta
- Verifique se o bucket é público
- Verifique se todos os arquivos foram enviados

### Erro: "Cannot find weights file"
- Certifique-se de que todos os arquivos `.bin` estão na mesma pasta que `model.json`
- Verifique se os nomes dos arquivos estão corretos

### Modelo não carrega
- Verifique o console do navegador/Expo para erros
- Teste a URL diretamente no navegador (deve mostrar JSON)
- Verifique as permissões do bucket no Supabase

## 📝 Notas Importantes

1. **Bucket Público**: O bucket `ml-models` DEVE ser público para o app acessar
2. **Mesma Pasta**: Todos os arquivos do modelo devem estar na mesma pasta
3. **Cache**: Após fazer upload, pode levar alguns segundos para ficar disponível
4. **Tamanho**: Modelos grandes podem demorar para carregar no dispositivo

## 🎯 Resumo Rápido

1. ✅ Converter `cough_model.h5` → TensorFlow.js
2. ✅ Criar bucket público `ml-models` no Supabase
3. ✅ Fazer upload dos arquivos para `ml-models/cough-model/`
4. ✅ Configurar `EXPO_PUBLIC_MODEL_URL` no `.env`
5. ✅ Reiniciar o app

