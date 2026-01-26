import os
import sys
import json
import subprocess
import shutil

def export_model():
    # Caminhos
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "models", "kaggle_balanced_model.h5")
    info_path = os.path.join(base_dir, "models", "kaggle_model_info.json")
    output_dir = os.path.join(base_dir, "supabase_export")
    
    if not os.path.exists(model_path):
        print(f"❌ Erro: Modelo não encontrado em {model_path}")
        return

    # Criar pasta de exportação
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir)

    # 1. Copiar o modelo .h5 para a pasta de exportação
    print("📦 Copiando modelo .h5...")
    shutil.copy2(model_path, os.path.join(output_dir, "kaggle_balanced_model.h5"))

    # 2. Gerar model_info.json compatível com o App
    print("📝 Gerando model_info.json compatível...")
    with open(info_path, 'r') as f:
        old_info = json.load(f)

    new_info = {
        "scaler": {
            "type": "StandardScaler",
            "mean": old_info["normalization_params"]["mean"],
            "scale": old_info["normalization_params"]["std"]
        },
        "classes": old_info["classes"],
        "metadata": {
            "name": "Kaggle Balanced Model",
            "version": "1.0",
            "accuracy": "95.92%",
            "dataset": "Kaggle Respiratory Sound Database"
        }
    }

    with open(os.path.join(output_dir, "model_info.json"), "w") as f:
        json.dump(new_info, f, indent=2)

    print(f"✨ Tudo pronto! Os arquivos para upload estão em: {output_dir}")
    print("\n⚠️ IMPORTANTE: Devido a limitações do Windows com TensorFlowJS, use o Google Colab para a conversão final.")
    print("Arquivos gerados:")
    for f in os.listdir(output_dir):
        print(f" - {f}")

if __name__ == "__main__":
    export_model()
