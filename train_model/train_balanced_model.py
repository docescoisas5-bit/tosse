"""
Script para treinar o modelo balanceado usando o dataset do Kaggle
Usa Oversampling para corrigir o desbalanceamento das classes
"""

import numpy as np
import pickle
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.utils import resample
import os
import json

def load_data():
    print("Carregando dados processados do Kaggle...")
    X_train = np.load("processed_kaggle_data/X_train.npy")
    X_test = np.load("processed_kaggle_data/X_test.npy")
    y_train = np.load("processed_kaggle_data/y_train.npy")
    y_test = np.load("processed_kaggle_data/y_test.npy")
    
    with open("processed_kaggle_data/label_encoder.pkl", "rb") as f:
        le = pickle.load(f)
        
    return X_train, X_test, y_train, y_test, le

def balance_data(X, y):
    """Aplica oversampling simples para balancear as classes"""
    print("\nBalanceando classes (Oversampling)...")
    unique_classes = np.unique(y)
    max_samples = max([np.sum(y == c) for c in unique_classes])
    
    X_balanced = []
    y_balanced = []
    
    for c in unique_classes:
        X_c = X[y == c]
        y_c = y[y == c]
        
        # Faz o resample da classe para atingir o número da classe majoritária
        X_resampled, y_resampled = resample(X_c, y_c, 
                                            replace=True, 
                                            n_samples=max_samples, 
                                            random_state=42)
        X_balanced.append(X_resampled)
        y_balanced.append(y_resampled)
        
    return np.vstack(X_balanced), np.hstack(y_balanced)

def create_model(input_shape, num_classes):
    model = keras.Sequential([
        layers.Input(shape=input_shape),
        layers.Dense(256, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.4),
        layers.Dense(128, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(num_classes, activation='softmax'),
    ])
    
    model.compile(optimizer='adam',
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])
    return model

def main():
    X_train, X_test, y_train, y_test, le = load_data()
    
    # Balanceia apenas o treino
    X_train_bal, y_train_bal = balance_data(X_train, y_train)
    
    print(f"Distribuição após balanceamento: {np.bincount(y_train_bal)}")
    
    # Normalização
    mean = np.mean(X_train_bal, axis=0)
    std = np.std(X_train_bal, axis=0)
    
    X_train_norm = (X_train_bal - mean) / std
    X_test_norm = (X_test - mean) / std
    
    # Modelo
    model = create_model((X_train.shape[1],), len(le.classes_))
    model.summary()
    
    print("\nIniciando treinamento...")
    history = model.fit(X_train_norm, y_train_bal,
                        validation_data=(X_test_norm, y_test),
                        epochs=100,
                        batch_size=32,
                        verbose=1)
    
    # Avaliação
    print("\nAvaliação no conjunto de teste (original):")
    loss, acc = model.evaluate(X_test_norm, y_test)
    print(f"Acurácia: {acc:.4f}")
    
    # Salva
    os.makedirs("models", exist_ok=True)
    model.save("models/kaggle_balanced_model.h5")
    
    model_info = {
        'classes': le.classes_.tolist(),
        'normalization_params': {
            'mean': mean.tolist(),
            'std': std.tolist()
        }
    }
    
    with open("models/kaggle_model_info.json", "w") as f:
        json.dump(model_info, f, indent=2)
        
    print("\n✅ Modelo salvo em models/kaggle_balanced_model.h5")
    print("✅ Metadados salvos em models/kaggle_model_info.json")

if __name__ == "__main__":
    main()
