"""
Script para treinar modelo de classificação de tosse
Classes: Normal, Bronquite, Pneumonia
"""

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import os
import json
from pathlib import Path

# Configurações
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)
tf.random.set_seed(RANDOM_SEED)

# Parâmetros de áudio
SAMPLE_RATE = 16000
N_MFCC = 13
NUM_SAMPLES = 1000  # Número de amostras sintéticas por classe
NUM_CLASSES = 3  # normal, bronquite, pneumonia

def generate_synthetic_cough_features(class_type, num_samples=1000):
    """
    Gera características MFCC sintéticas baseadas em padrões de tosse
    
    Args:
        class_type: 'normal', 'bronchitis', ou 'pneumonia'
        num_samples: número de amostras a gerar
    
    Returns:
        Array de características MFCC (num_samples, 13)
    """
    features = []
    
    for _ in range(num_samples):
        # Gera 13 coeficientes MFCC baseados no tipo de tosse
        mfcc = np.zeros(13)
        
        if class_type == 'normal':
            # Tosse normal: frequências mais suaves, menos variação
            mfcc[0] = np.random.normal(-5, 2)  # Energia
            mfcc[1:4] = np.random.normal(0, 1, 3)  # Primeiros coeficientes
            mfcc[4:8] = np.random.normal(0, 0.8, 4)  # Coeficientes médios
            mfcc[8:] = np.random.normal(0, 0.5, 5)  # Coeficientes altos
            
        elif class_type == 'bronchitis':
            # Bronquite: frequências médias mais altas, mais variação
            mfcc[0] = np.random.normal(-3, 2.5)  # Mais energia
            mfcc[1:4] = np.random.normal(1, 1.5, 3)  # Coeficientes mais altos
            mfcc[4:8] = np.random.normal(0.5, 1.2, 4)  # Variação média
            mfcc[8:] = np.random.normal(0, 0.8, 5)  # Mais ruído
            
        elif class_type == 'pneumonia':
            # Pneumonia: padrão mais irregular, frequências mais altas
            mfcc[0] = np.random.normal(-2, 3)  # Alta energia variável
            mfcc[1:4] = np.random.normal(1.5, 2, 3)  # Coeficientes muito altos
            mfcc[4:8] = np.random.normal(1, 1.5, 4)  # Alta variação
            mfcc[8:] = np.random.normal(0.5, 1, 5)  # Ruído significativo
        
        features.append(mfcc)
    
    return np.array(features)

def create_dataset():
    """
    Cria dataset sintético com características de tosse
    """
    print("📊 Gerando dataset sintético...")
    
    # Gera dados para cada classe
    normal_data = generate_synthetic_cough_features('normal', NUM_SAMPLES)
    bronchitis_data = generate_synthetic_cough_features('bronchitis', NUM_SAMPLES)
    pneumonia_data = generate_synthetic_cough_features('pneumonia', NUM_SAMPLES)
    
    # Combina dados
    X = np.vstack([normal_data, bronchitis_data, pneumonia_data])
    
    # Cria labels (one-hot encoding)
    y_normal = np.array([[1, 0, 0]] * NUM_SAMPLES)
    y_bronchitis = np.array([[0, 1, 0]] * NUM_SAMPLES)
    y_pneumonia = np.array([[0, 0, 1]] * NUM_SAMPLES)
    y = np.vstack([y_normal, y_bronchitis, y_pneumonia])
    
    # Embaralha dados
    indices = np.random.permutation(len(X))
    X = X[indices]
    y = y[indices]
    
    print(f"✅ Dataset criado: {len(X)} amostras, {X.shape[1]} features")
    print(f"   - Normal: {NUM_SAMPLES} amostras")
    print(f"   - Bronquite: {NUM_SAMPLES} amostras")
    print(f"   - Pneumonia: {NUM_SAMPLES} amostras")
    
    return X, y

def build_model(input_shape=(13,)):
    """
    Constrói modelo de classificação
    """
    model = keras.Sequential([
        layers.Dense(128, activation='relu', input_shape=input_shape, name='dense_1'),
        layers.BatchNormalization(name='bn_1'),
        layers.Dropout(0.4, name='dropout_1'),
        
        layers.Dense(64, activation='relu', name='dense_2'),
        layers.BatchNormalization(name='bn_2'),
        layers.Dropout(0.3, name='dropout_2'),
        
        layers.Dense(32, activation='relu', name='dense_3'),
        layers.Dropout(0.2, name='dropout_3'),
        
        layers.Dense(NUM_CLASSES, activation='softmax', name='output')
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def train_model():
    """
    Treina o modelo
    """
    print("\n🚀 Iniciando treinamento do modelo...\n")
    
    # Cria dataset
    X, y = create_dataset()
    
    # Divide em treino e validação
    split_idx = int(len(X) * 0.8)
    X_train, X_val = X[:split_idx], X[split_idx:]
    y_train, y_val = y[:split_idx], y[split_idx:]
    
    print(f"📦 Divisão dos dados:")
    print(f"   - Treino: {len(X_train)} amostras")
    print(f"   - Validação: {len(X_val)} amostras\n")
    
    # Constrói modelo
    model = build_model()
    
    print("📐 Arquitetura do modelo:")
    model.summary()
    print()
    
    # Callbacks
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=15,
            restore_best_weights=True
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-6
        )
    ]
    
    # Treina
    print("🏋️ Treinando modelo...\n")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=100,
        batch_size=32,
        callbacks=callbacks,
        verbose=1
    )
    
    # Avalia
    print("\n📊 Avaliando modelo...")
    val_loss, val_accuracy = model.evaluate(X_val, y_val, verbose=0)
    
    print(f"\n✅ Resultados finais:")
    print(f"   - Loss: {val_loss:.4f}")
    print(f"   - Accuracy: {val_accuracy:.4f}\n")
    
    return model, history

def save_model(model, output_dir='models'):
    """
    Salva o modelo em diferentes formatos
    """
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    print(f"💾 Salvando modelo em {output_path}...")
    
    # Salva modelo Keras (.h5)
    keras_path = output_path / 'cough_model.h5'
    model.save(str(keras_path))
    print(f"   ✅ Keras model: {keras_path}")
    
    # Salva modelo SavedModel
    savedmodel_path = output_path / 'saved_model'
    model.save(str(savedmodel_path))
    print(f"   ✅ SavedModel: {savedmodel_path}")
    
    # Salva informações do modelo
    info = {
        'input_shape': model.input_shape,
        'output_shape': model.output_shape,
        'num_classes': NUM_CLASSES,
        'classes': ['normal', 'bronchitis', 'pneumonia'],
        'features': N_MFCC,
        'sample_rate': SAMPLE_RATE
    }
    
    info_path = output_path / 'model_info.json'
    with open(info_path, 'w') as f:
        json.dump(info, f, indent=2)
    print(f"   ✅ Model info: {info_path}")
    
    return output_path

def main():
    """
    Função principal
    """
    print("=" * 60)
    print("🎯 Treinamento de Modelo de Classificação de Tosse")
    print("=" * 60)
    print()
    
    # Treina modelo
    model, history = train_model()
    
    # Salva modelo
    output_dir = save_model(model)
    
    print("\n" + "=" * 60)
    print("✅ Treinamento concluído!")
    print("=" * 60)
    print(f"\n📁 Modelo salvo em: {output_dir.absolute()}")
    print("\n📝 Próximos passos:")
    print("   1. Execute: python convert_to_tfjs.py")
    print("   2. Faça upload do modelo para Supabase Storage ou CDN")
    print("   3. Configure EXPO_PUBLIC_MODEL_URL no arquivo .env")
    print()

if __name__ == '__main__':
    main()

