# 🚀 Solução Rápida - Google Colab

## ⚠️ Sobre os Avisos de Dependências

Os avisos que você viu são **não críticos**. O modelo ainda funcionará, mas podemos resolver atualizando o `packaging`.

## 📋 Código Completo para Colar no Colab

### Célula 1: Instalar Dependências (Atualizado)
```python
# Atualiza packaging para resolver conflitos
!pip install --upgrade packaging -q

# Instala tensorflowjs
!pip install tensorflowjs -q

print('✅ Dependências instaladas!')
```

### Célula 2: Fazer Upload do Modelo
```python
from google.colab import files
import os

# ⚠️ IMPORTANTE: Aparecerá um botão "Choose Files"
# Clique e selecione: cough_model.h5
uploaded = files.upload()

for filename in uploaded.keys():
    print(f'✅ Arquivo: {filename}')
    print(f'📦 Tamanho: {len(uploaded[filename]) / 1024 / 1024:.2f} MB')
```

### Célula 3: Converter para TensorFlow.js
```python
import tensorflow as tf
import tensorflowjs as tfjs
from pathlib import Path
import shutil

model_file = 'cough_model.h5'
output_dir = 'tfjs_model'

if not os.path.exists(model_file):
    print('❌ Arquivo não encontrado! Faça upload na célula anterior.')
else:
    print('📂 Carregando modelo...')
    model = tf.keras.models.load_model(model_file)
    print('✅ Modelo carregado!')
    
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    
    print('🔄 Convertendo para TensorFlow.js...')
    tfjs.converters.save_keras_model(model, output_dir)
    
    print('\n✅ Conversão concluída!')
    print('\n📦 Arquivos gerados:')
    for file in sorted(Path(output_dir).glob('*')):
        size = file.stat().st_size / 1024
        print(f'   - {file.name} ({size:.2f} KB)')
```

### Célula 4: Baixar Arquivos
```python
import zipfile
from google.colab import files

zip_filename = 'tfjs_model.zip'
with zipfile.ZipFile(zip_filename, 'w') as zipf:
    for root, dirs, files_list in os.walk('tfjs_model'):
        for file in files_list:
            zipf.write(os.path.join(root, file), file)

print(f'✅ ZIP criado: {zip_filename}')
files.download(zip_filename)
print('✅ Download concluído!')
```

## ✅ Pronto!

Após o download, extraia o ZIP e faça upload para o Supabase Storage.

