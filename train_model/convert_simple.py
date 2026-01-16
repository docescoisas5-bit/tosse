"""
Script simplificado para converter modelo para TensorFlow.js
Usa apenas TensorFlow sem dependências problemáticas
"""

import os
import sys

# Tenta importar tensorflowjs diretamente sem outras dependências
try:
    import tensorflow as tf
    from tensorflow import keras
    
    # Tenta usar o conversor diretamente
    print("=" * 60)
    print("🔄 Convertendo modelo para TensorFlow.js")
    print("=" * 60)
    
    model_path = 'trained_model/cough_classifier.h5'
    output_dir = 'trained_model/tfjs_model'
    
    if not os.path.exists(model_path):
        print(f"❌ Modelo não encontrado: {model_path}")
        sys.exit(1)
    
    print(f"📂 Carregando modelo: {model_path}")
    model = keras.models.load_model(model_path)
    
    print(f"📊 Arquitetura do modelo:")
    model.summary()
    
    # Cria diretório de saída
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"\n🔄 Convertendo para TensorFlow.js...")
    
    # Tenta usar o conversor do TensorFlow.js diretamente
    # Ignora erros de importação de outras bibliotecas
    import subprocess
    import json
    
    # Salva o modelo em formato SavedModel primeiro
    saved_model_dir = 'trained_model/saved_model_temp'
    print(f"📦 Salvando como SavedModel...")
    model.save(saved_model_dir)
    
    # Tenta converter usando CLI do tensorflowjs
    print(f"🔄 Convertendo usando tensorflowjs_converter...")
    
    cmd = f"tensorflowjs_converter --input_format=tf_saved_model --output_format=tfjs_graph_model {saved_model_dir} {output_dir}"
    
    result = os.system(cmd)
    
    if result == 0:
        print(f"\n✅ Conversão concluída!")
        print(f"📁 Modelo TensorFlow.js salvo em: {output_dir}")
        
        # Lista arquivos gerados
        if os.path.exists(output_dir):
            print(f"\n📝 Arquivos gerados:")
            for file in os.listdir(output_dir):
                file_path = os.path.join(output_dir, file)
                size = os.path.getsize(file_path) / 1024
                print(f"   - {file} ({size:.1f} KB)")
    else:
        print(f"\n⚠️ Conversão via CLI falhou. Tentando método alternativo...")
        print(f"💡 Você pode usar Google Colab para converter:")
        print(f"   1. Faça upload do arquivo '{model_path}' para Colab")
        print(f"   2. Execute: tensorflowjs_converter --input_format=keras {model_path} {output_dir}")
        print(f"   3. Baixe a pasta {output_dir}")
    
    # Remove diretório temporário
    import shutil
    if os.path.exists(saved_model_dir):
        shutil.rmtree(saved_model_dir)
        
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc()

