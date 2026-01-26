"""
Script para retreinar o modelo com o dataset ICBHI 2017 real
Substitui o modelo antigo (com dados sintéticos) por um novo com dados reais
"""

import numpy as np
import pickle
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.model_selection import train_test_split
import os

def load_processed_data():
    """
    Carrega os dados processados do ICBHI
    """
    print("Carregando dados processados do ICBHI...")
    
    # Carrega os dados
    X_train = np.load("processed_icbhi_data/X_train.npy")
    X_test = np.load("processed_icbhi_data/X_test.npy")
    y_train = np.load("processed_icbhi_data/y_train.npy")
    y_test = np.load("processed_icbhi_data/y_test.npy")
    
    # Carrega o label encoder
    with open("processed_icbhi_data/label_encoder.pkl", "rb") as f:
        label_encoder = pickle.load(f)
    
    print(f"Dados de treino: {X_train.shape}")
    print(f"Dados de teste: {X_test.shape}")
    print(f"Classes: {label_encoder.classes_}")
    
    return X_train, X_test, y_train, y_test, label_encoder

def create_model(input_shape, num_classes):
    """
    Cria o modelo de classificação
    """
    model = keras.Sequential([
        layers.Input(shape=input_shape),
        layers.Dense(128, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.4),
        layers.Dense(64, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(32, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(num_classes, activation='softmax'),
    ])
    
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def train_model():
    """
    Função principal para treinar o modelo com dados reais
    """
    print("=" * 60)
    print("RETRAINING MODEL WITH REAL ICBHI DATA")
    print("=" * 60)
    
    # Carrega os dados
    X_train, X_test, y_train, y_test, label_encoder = load_processed_data()
    
    # Normaliza os dados (usando os mesmos parâmetros do modelo original se disponíveis)
    # ou calcula novos parâmetros
    mean_vals = np.mean(X_train, axis=0)
    std_vals = np.std(X_train, axis=0)
    
    # Normaliza os dados
    X_train_norm = (X_train - mean_vals) / std_vals
    X_test_norm = (X_test - mean_vals) / std_vals
    
    # Cria o modelo
    num_classes = len(label_encoder.classes_)
    model = create_model((X_train.shape[1],), num_classes)
    
    print(f"\nModel architecture:")
    model.summary()
    
    # Treina o modelo
    print(f"\nStarting training with {num_classes} classes...")
    history = model.fit(
        X_train_norm, y_train,
        validation_data=(X_test_norm, y_test),
        epochs=50,
        batch_size=32,
        verbose=1
    )
    
    # Avalia o modelo
    print("\nEvaluating model on test set...")
    test_loss, test_accuracy = model.evaluate(X_test_norm, y_test, verbose=0)
    print(f"Test Accuracy: {test_accuracy:.4f}")
    print(f"Test Loss: {test_loss:.4f}")
    
    # Salva o modelo
    model.save("models/icbhi_trained_model.h5")
    print(f"\nModel saved as: models/icbhi_trained_model.h5")
    
    # Salva os parâmetros de normalização
    normalization_params = {
        'mean': mean_vals,
        'std': std_vals,
        'label_encoder': label_encoder
    }
    
    with open("models/icbhi_normalization_params.pkl", "wb") as f:
        pickle.dump(normalization_params, f)
    
    print("Normalization parameters saved as: models/icbhi_normalization_params.pkl")
    
    # Salva informações do modelo
    model_info = {
        'input_shape': [None, X_train.shape[1]],
        'output_shape': [None, num_classes],
        'n_mfcc': X_train.shape[1],
        'sample_rate': 16000,
        'duration': 2.0,
        'classes': label_encoder.classes_.tolist(),
        'normalization_params': {
            'mean': mean_vals.tolist(),
            'std': std_vals.tolist()
        }
    }
    
    import json
    with open("models/icbhi_model_info.json", "w", encoding="utf-8") as f:
        json.dump(model_info, f, indent=2, ensure_ascii=False)
    
    print("Model info saved as: models/icbhi_model_info.json")
    
    return model, history

def main():
    # Garante que o diretório models existe
    os.makedirs("models", exist_ok=True)
    
    # Treina o modelo
    model, history = train_model()
    
    print("\n" + "=" * 60)
    print("MODEL TRAINING COMPLETED SUCCESSFULLY")
    print("=" * 60)
    print("Next steps:")
    print("1. Test the model with the evaluation script")
    print("2. Convert to TensorFlow.js format if needed")
    print("3. Update the app to use the new model")

if __name__ == "__main__":
    main()