"""
Script para converter modelo Keras para TensorFlow.js
"""

try:
    import tensorflowjs as tfjs
except ImportError:
    print("❌ tensorflowjs não está instalado. Instalando...")
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "tensorflowjs", "--quiet"])
import tensorflowjs as tfjs

from pathlib import Path
import json
import shutil

def convert_model():
    """
    Converte modelo Keras para TensorFlow.js
    """
    print("=" * 60)
    print("🔄 Conversão de Modelo para TensorFlow.js")
    print("=" * 60)
    print()
    
    # Caminhos
    models_dir = Path('models')
    keras_model_path = models_dir / 'cough_model.h5'
    tfjs_output_dir = models_dir / 'tfjs_model'
    
    if not keras_model_path.exists():
        print(f"❌ Erro: Modelo não encontrado em {keras_model_path}")
        print("   Execute primeiro: python train_cough_model.py")
        return
    
    print(f"📂 Modelo Keras: {keras_model_path}")
    print(f"📂 Output TensorFlow.js: {tfjs_output_dir}")
    print()
    
    # Limpa diretório de saída se existir
    if tfjs_output_dir.exists():
        shutil.rmtree(tfjs_output_dir)
        print("🧹 Diretório de saída limpo")
    
    print("🔄 Convertendo modelo...")
    
    try:
        # Converte modelo
        tfjs.converters.save_keras_model(
            str(keras_model_path),
            str(tfjs_output_dir)
        )
        
        print(f"\n✅ Conversão concluída!")
        print(f"📁 Modelo TensorFlow.js salvo em: {tfjs_output_dir.absolute()}")
        print()
        print("📦 Arquivos gerados:")
        for file in sorted(tfjs_output_dir.glob('*')):
            size = file.stat().st_size / 1024  # KB
            print(f"   - {file.name} ({size:.2f} KB)")
        
        # Verifica se model.json existe
        model_json = tfjs_output_dir / 'model.json'
        if model_json.exists():
            print(f"\n✅ model.json encontrado: {model_json}")
            print(f"\n📝 Para usar no app:")
            print(f"   1. Faça upload da pasta '{tfjs_output_dir.name}' para Supabase Storage")
            print(f"   2. Configure EXPO_PUBLIC_MODEL_URL no .env:")
            print(f"      EXPO_PUBLIC_MODEL_URL=https://seu-projeto.supabase.co/storage/v1/object/public/ml-models/tfjs_model/model.json")
        
    except Exception as e:
        print(f"\n❌ Erro na conversão: {e}")
        print("\n💡 Dica: Instale tensorflowjs:")
        print("   pip install tensorflowjs")

if __name__ == '__main__':
    convert_model()

