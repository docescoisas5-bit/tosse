"""
Script para converter modelo Keras para TensorFlow.js no Google Colab
Copie e cole este código em uma célula do Colab
"""

# ============================================
# PASSO 1: Instalar dependências
# ============================================
print("📦 Instalando dependências...")
!pip install tensorflowjs -q

# ============================================
# PASSO 2: Fazer upload do modelo
# ============================================
print("\n📤 Faça upload do arquivo cough_model.h5")
print("   (Execute a célula e clique em 'Escolher arquivos')")

from google.colab import files
import os

# Cria diretório se não existir
os.makedirs('models', exist_ok=True)

# Upload do arquivo
uploaded = files.upload()

# Move arquivo para models/ se necessário
for filename in uploaded.keys():
    if filename.endswith('.h5'):
        if not filename.startswith('models/'):
            os.rename(filename, f'models/{filename}')
        print(f"✅ Arquivo carregado: models/{filename}")

# ============================================
# PASSO 3: Carregar e converter modelo
# ============================================
print("\n🔄 Convertendo modelo para TensorFlow.js...")

import tensorflowjs as tfjs
from tensorflow import keras

# Encontra o arquivo do modelo
model_files = [f for f in os.listdir('models') if f.endswith('.h5')]
if not model_files:
    raise FileNotFoundError("❌ Nenhum arquivo .h5 encontrado em models/")

model_path = f'models/{model_files[0]}'
print(f"📂 Carregando modelo: {model_path}")

# Carrega modelo
model = keras.models.load_model(model_path)
print(f"✅ Modelo carregado!")
print(f"   Input shape: {model.input_shape}")
print(f"   Output shape: {model.output_shape}")

# Converte para TensorFlow.js
output_dir = 'models/tfjs_model'
print(f"\n🔄 Convertendo para TensorFlow.js...")
tfjs.converters.save_keras_model(model, output_dir)

print(f"\n✅ Conversão concluída!")
print(f"📁 Modelo TensorFlow.js salvo em: {output_dir}")

# ============================================
# PASSO 4: Listar arquivos gerados
# ============================================
print("\n📦 Arquivos gerados:")
import os
for file in sorted(os.listdir(output_dir)):
    file_path = os.path.join(output_dir, file)
    size = os.path.getsize(file_path) / 1024  # KB
    print(f"   - {file} ({size:.2f} KB)")

# ============================================
# PASSO 5: Baixar modelo convertido
# ============================================
print("\n📥 Preparando download...")

# Cria arquivo ZIP
import zipfile
import shutil

zip_path = 'tfjs_model.zip'
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(output_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, output_dir)
            zipf.write(file_path, arcname)

print(f"✅ ZIP criado: {zip_path}")
print(f"\n📥 Baixando arquivo...")
files.download(zip_path)

print("\n" + "="*60)
print("✅ CONVERSÃO CONCLUÍDA!")
print("="*60)
print("\n📝 Próximos passos:")
print("   1. Extraia o arquivo tfjs_model.zip")
print("   2. Faça upload da pasta 'tfjs_model' para Supabase Storage")
print("   3. Configure EXPO_PUBLIC_MODEL_URL no .env do app")
print("   4. URL exemplo: https://seu-projeto.supabase.co/storage/v1/object/public/ml-models/tfjs_model/model.json")
