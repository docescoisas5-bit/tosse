"""
Script para converter modelo treinado com dataset multimodal para TensorFlow.js
"""

import os
import sys

def convert_model():
    """Converte modelo Keras para TensorFlow.js"""
    try:
        import tensorflow as tf
        from tensorflow import keras
        
        # Tenta importar tensorflowjs
        try:
            import tensorflowjs as tfjs
        except ImportError:
            print("❌ tensorflowjs não está instalado.")
            print("📦 Instalando tensorflowjs...")
            os.system(f"{sys.executable} -m pip install tensorflowjs --quiet")
            import tensorflowjs as tfjs
        
        print("=" * 60)
        print("🔄 Convertendo modelo para TensorFlow.js")
        print("=" * 60)
        
        # Caminhos
        model_path = 'trained_model/cough_classifier.h5'
        output_dir = 'trained_model/tfjs_model'
        
        if not os.path.exists(model_path):
            print(f"❌ Modelo não encontrado: {model_path}")
            print("   Execute o treinamento primeiro!")
            return False
        
        print(f"📂 Carregando modelo: {model_path}")
        model = keras.models.load_model(model_path)
        
        print(f"📊 Arquitetura do modelo:")
        model.summary()
        
        # Cria diretório de saída
        os.makedirs(output_dir, exist_ok=True)
        
        print(f"\n🔄 Convertendo para TensorFlow.js...")
        print(f"📁 Diretório de saída: {output_dir}")
        
        # Converte modelo
        tfjs.converters.save_keras_model(model, output_dir)
        
        print(f"\n✅ Conversão concluída!")
        print(f"📁 Modelo TensorFlow.js salvo em: {output_dir}")
        print(f"\n📝 Arquivos gerados:")
        
        # Lista arquivos gerados
        for file in os.listdir(output_dir):
            file_path = os.path.join(output_dir, file)
            size = os.path.getsize(file_path)
            print(f"   - {file} ({size / 1024:.1f} KB)")
        
        print(f"\n💡 Próximos passos:")
        print(f"   1. Faça upload da pasta '{output_dir}' para Supabase Storage")
        print(f"   2. Configure EXPO_PUBLIC_MODEL_URL no app")
        print(f"   3. O modelo está pronto para uso no app!")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro durante conversão: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    convert_model()

