import numpy as np
import os
import json
from sklearn.model_selection import train_test_split
from sklearn.utils import resample
import pickle

# Tenta importar tensorflow, se falhar avisa o usuário
try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    import tensorflowjs as tfjs
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("AVISO: TensorFlow ou TensorFlowJS não encontrados. Este script deve ser executado em um ambiente com Python 3.10-3.12 ou Google Colab.")

DATA_DIR = r'c:\Users\USER\tosse\train_model\processed_coughvid_data'
MODEL_OUTPUT_DIR = r'c:\Users\USER\tosse\train_model\models\coughvid_model'

def balance_data(X, y):
    print("Balanceando classes (Oversampling)...")
    unique_classes = np.unique(y)
    max_samples = max([np.sum(y == c) for c in unique_classes])
    
    X_balanced = []
    y_balanced = []
    
    for c in unique_classes:
        X_c = X[y == c]
        y_c = y[y == c]
        X_resampled, y_resampled = resample(X_c, y_c, 
                                            replace=True, 
                                            n_samples=max_samples, 
                                            random_state=42)
        X_balanced.append(X_resampled)
        y_balanced.append(y_resampled)
        
    return np.vstack(X_balanced), np.hstack(y_balanced)

def main():
    # 1. Carrega dados
    X = np.load(os.path.join(DATA_DIR, 'X.npy'))
    y = np.load(os.path.join(DATA_DIR, 'y.npy'))
    
    print(f"Dados carregados: {X.shape}")
    print(f"Distribuição original: {np.bincount(y)}")
    
    # 2. Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # 3. Balanceamento (apenas no treino)
    X_train_bal, y_train_bal = balance_data(X_train, y_train)
    print(f"Distribuição após balanceamento: {np.bincount(y_train_bal)}")
    
    # 4. Normalização (StandardScaler)
    mean = np.mean(X_train_bal, axis=0)
    std = np.std(X_train_bal, axis=0)
    X_train_norm = (X_train_bal - mean) / std
    X_test_norm = (X_test - mean) / std
    
    # Salva parâmetros de normalização
    model_info = {
        "model_name": "Cough Classifier - COUGHVID",
        "version": "1.0.0",
        "output_classes": ["Bronchitis", "Normal", "Pneumonia"],
        "scaler": {
            "type": "StandardScaler",
            "mean": mean.tolist(),
            "scale": std.tolist()
        }
    }
    
    if not os.path.exists(MODEL_OUTPUT_DIR):
        os.makedirs(MODEL_OUTPUT_DIR)
        
    with open(os.path.join(MODEL_OUTPUT_DIR, 'model_info.json'), 'w') as f:
        json.dump(model_info, f, indent=4)
    
    print(f"Metadados salvos em {MODEL_OUTPUT_DIR}")
    
    if not TF_AVAILABLE:
        print("\nPara treinar o modelo:")
        print("1. Vá para https://colab.research.google.com")
        print("2. Faça upload de X.npy e y.npy da pasta processed_coughvid_data")
        print("3. Rode o código de treinamento (posso gerar para você se desejar)")
        return

    # 5. Define Modelo
    model = keras.Sequential([
        layers.Input(shape=(13,)),
        layers.Dense(256, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.4),
        layers.Dense(128, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(3, activation='softmax')
    ])
    
    model.compile(optimizer='adam',
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])
    
    # 6. Treino
    print("\nIniciando treinamento...")
    history = model.fit(X_train_norm, y_train_bal, 
                        epochs=100, 
                        batch_size=32, 
                        validation_data=(X_test_norm, y_test),
                        verbose=1)
    
    # 7. Avaliação
    loss, acc = model.evaluate(X_test_norm, y_test)
    print(f"\nAcurácia final no teste: {acc:.4f}")
    
    # 8. Exportar
    print("\nExportando para TensorFlow.js...")
    # Salva modelo Keras primeiro
    h5_path = os.path.join(MODEL_OUTPUT_DIR, 'coughvid_model.h5')
    model.save(h5_path)
    
    # Converte para TFJS
    tfjs.converters.save_keras_model(model, os.path.join(MODEL_OUTPUT_DIR, 'tfjs_model'))
    
    print(f"\n✅ Modelo treinado e exportado para {MODEL_OUTPUT_DIR}")

if __name__ == "__main__":
    main()
