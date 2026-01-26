# Treinamento de Modelo de Tosse (COUGHVID) para Google Colab
# 1. Faça upload dos arquivos X.npy e y.npy gerados na pasta train_model/processed_coughvid_data

import numpy as np
import os
import json
from sklearn.model_selection import train_test_split
from sklearn.utils import resample

# Instala dependências necessárias no Colab
!pip install tensorflowjs

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import tensorflowjs as tfjs

# Configurações
DATA_DIR = '.' # Onde você fez upload dos arquivos
MODEL_OUTPUT_DIR = 'coughvid_model'

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
if not os.path.exists(MODEL_OUTPUT_DIR):
    os.makedirs(MODEL_OUTPUT_DIR)

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
with open(os.path.join(MODEL_OUTPUT_DIR, 'model_info.json'), 'w') as f:
    json.dump(model_info, f, indent=4)

# Salva modelo Keras
model.save(os.path.join(MODEL_OUTPUT_DIR, 'coughvid_model.h5'))

# Converte para TFJS
tfjs.converters.save_keras_model(model, os.path.join(MODEL_OUTPUT_DIR, 'tfjs_model'))

# Zip para download
!zip -r coughvid_model.zip coughvid_model/

print(f"\n✅ Modelo treinado e exportado! Baixe o arquivo coughvid_model.zip")
