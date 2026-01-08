# 📘 Instruções para Google Colab

## 🚀 Como Usar

### Método 1: Usar o Notebook Pronto (Recomendado)

1. **Abra o Google Colab**: https://colab.research.google.com/

2. **Faça upload do notebook**:
   - Clique em `File` > `Upload notebook`
   - Selecione o arquivo: `train_model/colab_converter.ipynb`

3. **Execute as células em ordem**:
   - Cada célula tem instruções claras
   - Execute uma por vez usando `Shift + Enter`

### Método 2: Criar Notebook Manualmente

1. **Crie um novo notebook no Colab**

2. **Cole e execute este código** (célula por célula):

#### Célula 1: Instalar Dependências
```python
# Atualiza packaging para resolver conflitos
!pip install --upgrade packaging -q

# Instala tensorflowjs
!pip install tensorflowjs -q

print('✅ Dependências instaladas com sucesso!')
```

#### Célula 2: Fazer Upload do Modelo
```python
from google.colab import files
import os

# Faz upload do arquivo (selecione cough_model.h5)
uploaded = files.upload()

# Verifica se o arquivo foi enviado
for filename in uploaded.keys():
    print(f'✅ Arquivo recebido: {filename}')
    print(f'📦 Tamanho: {len(uploaded[filename]) / 1024 / 1024:.2f} MB')
```

**⚠️ IMPORTANTE**: Quando executar esta célula, aparecerá um botão "Choose Files". Clique nele e selecione o arquivo `cough_model.h5` da pasta `train_model/models/`

#### Célula 3: Converter para TensorFlow.js
```python
import tensorflow as tf
import tensorflowjs as tfjs
from pathlib import Path
import shutil

# Nome do arquivo
model_file = 'cough_model.h5'
output_dir = 'tfjs_model'

# Verifica se o arquivo existe
if not os.path.exists(model_file):
    print(f'❌ Erro: Arquivo {model_file} não encontrado!')
    print('Certifique-se de fazer o upload na célula anterior')
else:
    print(f'📂 Carregando modelo: {model_file}')
    
    # Carrega o modelo
    model = tf.keras.models.load_model(model_file)
    print('✅ Modelo carregado com sucesso')
    
    # Remove diretório de saída se existir
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    
    # Converte para TensorFlow.js
    print(f'🔄 Convertendo para TensorFlow.js...')
    tfjs.converters.save_keras_model(model, output_dir)
    
    print(f'\n✅ Conversão concluída!')
    print(f'📁 Modelo salvo em: {output_dir}/')
    print('\n📦 Arquivos gerados:')
    
    for file in sorted(Path(output_dir).glob('*')):
        size = file.stat().st_size / 1024  # KB
        print(f'   - {file.name} ({size:.2f} KB)')
```

#### Célula 4: Baixar Arquivos
```python
import zipfile
from google.colab import files

# Cria arquivo ZIP
zip_filename = 'tfjs_model.zip'

with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files_list in os.walk('tfjs_model'):
        for file in files_list:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, 'tfjs_model')
            zipf.write(file_path, arcname)

print(f'✅ Arquivo ZIP criado: {zip_filename}')
print(f'📦 Tamanho: {os.path.getsize(zip_filename) / 1024 / 1024:.2f} MB')
print('\n⬇️ Baixando arquivo...')

# Faz download do ZIP
files.download(zip_filename)

print('\n✅ Download concluído!')
print('\n📝 Próximos passos:')
print('   1. Extraia o arquivo tfjs_model.zip')
print('   2. Faça upload dos arquivos para Supabase Storage')
print('   3. Configure EXPO_PUBLIC_MODEL_URL no .env')
```

## ⚠️ Solução para o Erro de Upload

O erro que você recebeu acontece quando tenta fazer upload pela interface de arquivos do Colab. Use o método `files.upload()` do código acima, que funciona corretamente com arquivos binários.

## 📋 Checklist

- [ ] Abrir Google Colab
- [ ] Instalar tensorflowjs
- [ ] Fazer upload do `cough_model.h5` usando `files.upload()`
- [ ] Converter modelo
- [ ] Baixar arquivo ZIP
- [ ] Extrair arquivos
- [ ] Fazer upload para Supabase Storage
- [ ] Configurar `.env`

## 🎯 Após o Download

1. **Extraia o arquivo `tfjs_model.zip`**
2. **Você terá uma pasta `tfjs_model/` com:**
   - `model.json`
   - `weights_*.bin` (vários arquivos)

3. **Faça upload para Supabase** (veja `GUIA_CONVERSAO_MANUAL.md`)

