"""
Script para Google Colab - Converter Modelo Keras para TensorFlow.js
Copie e cole cada seção em células separadas no Colab
"""

# ============================================================================
# CÉLULA 1: Instalar Dependências
# ============================================================================
# Atualiza packaging para resolver conflitos de dependências
!pip install --upgrade packaging -q

# Instala tensorflowjs
!pip install tensorflowjs -q

print('✅ Dependências instaladas com sucesso!')

# ============================================================================
# CÉLULA 2: Fazer Upload do Modelo
# ============================================================================
from google.colab import files
import os

# Faz upload do arquivo (selecione cough_model.h5)
# ⚠️ IMPORTANTE: Quando executar, aparecerá um botão "Choose Files"
# Clique nele e selecione o arquivo cough_model.h5
uploaded = files.upload()

# Verifica se o arquivo foi enviado
for filename in uploaded.keys():
    print(f'✅ Arquivo recebido: {filename}')
    print(f'📦 Tamanho: {len(uploaded[filename]) / 1024 / 1024:.2f} MB')

# ============================================================================
# CÉLULA 3: Converter para TensorFlow.js
# ============================================================================
import tensorflow as tf
import tensorflowjs as tfjs
from pathlib import Path
import shutil

# Nome do arquivo (ajuste se necessário)
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
    print(f'📊 Input shape: {model.input_shape}')
    print(f'📊 Output shape: {model.output_shape}')
    
    # Remove diretório de saída se existir
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    
    # Converte para TensorFlow.js
    print(f'\n🔄 Convertendo para TensorFlow.js...')
    tfjs.converters.save_keras_model(model, output_dir)
    
    print(f'\n✅ Conversão concluída!')
    print(f'📁 Modelo salvo em: {output_dir}/')
    print('\n📦 Arquivos gerados:')
    
    total_size = 0
    for file in sorted(Path(output_dir).glob('*')):
        size = file.stat().st_size / 1024  # KB
        total_size += size
        print(f'   - {file.name} ({size:.2f} KB)')
    
    print(f'\n📊 Tamanho total: {total_size / 1024:.2f} MB')

# ============================================================================
# CÉLULA 4: Baixar Arquivos Convertidos
# ============================================================================
import zipfile
from google.colab import files

# Cria arquivo ZIP com todos os arquivos do modelo
zip_filename = 'tfjs_model.zip'

print('📦 Criando arquivo ZIP...')
with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files_list in os.walk('tfjs_model'):
        for file in files_list:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, 'tfjs_model')
            zipf.write(file_path, arcname)
            print(f'   ✅ Adicionado: {file}')

print(f'\n✅ Arquivo ZIP criado: {zip_filename}')
print(f'📦 Tamanho: {os.path.getsize(zip_filename) / 1024 / 1024:.2f} MB')
print('\n⬇️ Baixando arquivo...')

# Faz download do ZIP
files.download(zip_filename)

print('\n✅ Download concluído!')
print('\n' + '='*60)
print('📝 PRÓXIMOS PASSOS:')
print('='*60)
print('1. Extraia o arquivo tfjs_model.zip')
print('2. Acesse: https://supabase.com/dashboard/project/gorslmmmivhbjrczsoie/storage/buckets')
print('3. Crie bucket público: ml-models')
print('4. Crie pasta: cough-model')
print('5. Faça upload de TODOS os arquivos de tfjs_model/')
print('6. Configure no .env:')
print('   EXPO_PUBLIC_MODEL_URL=https://gorslmmmivhbjrczsoie.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json')
print('='*60)

