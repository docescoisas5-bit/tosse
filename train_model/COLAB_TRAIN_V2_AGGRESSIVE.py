# ===================================================================
# SCRIPT DE TREINO V2 - AJUSTES AGRESSIVOS
# Execute no Google Colab após fazer upload de X.npy e y.npy
# ===================================================================

# !pip install tensorflowjs scikit-learn imbalanced-learn

import numpy as np
import os
import json
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
import tensorflowjs as tfjs
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.utils import class_weight
from imblearn.over_sampling import SMOTE
from imblearn.combine import SMOTETomek
from collections import Counter

print("="*70)
print("TREINO V2 - AJUSTES AGRESSIVOS")
print("="*70)

# Carregar dados
print("\n📥 Carregando dados...")
X = np.load('X.npy')
y = np.load('y.npy')

print(f"✅ Dados carregados: X={X.shape}, y={y.shape}")
print(f"📊 Distribuição original: {Counter(y)}")

# Split com mais dados de treino
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.15, random_state=42, stratify=y
)

print(f"\n📊 Train: {Counter(y_train)}")
print(f"📊 Test: {Counter(y_test)}")

# Balanceamento mais agressivo com SMOTETomek
print("\n⚖️ Aplicando SMOTETomek (SMOTE + Tomek Links)...")
smt = SMOTETomek(random_state=42, smote=SMOTE(k_neighbors=3))
X_train_balanced, y_train_balanced = smt.fit_resample(X_train, y_train)

print(f"✅ Após SMOTETomek: {Counter(y_train_balanced)}")

# Normalização robusta
print("\n📐 Aplicando normalização robusta...")
from sklearn.preprocessing import RobustScaler
scaler = RobustScaler()
X_train_norm = scaler.fit_transform(X_train_balanced)
X_test_norm = scaler.transform(X_test)

# Salvar parâmetros do scaler
mean = scaler.center_
scale = scaler.scale_

print(f"   Center: [{', '.join([f'{m:.2f}' for m in mean[:5]])}...]")
print(f"   Scale: [{', '.join([f'{s:.2f}' for s in scale[:5]])}...]")

# Class Weights mais agressivos
class_weights = class_weight.compute_class_weight(
    'balanced',
    classes=np.unique(y_train_balanced),
    y=y_train_balanced
)
# Aumenta penalidade para Bronquite (classe mais difícil)
class_weights[0] *= 1.5
class_weights_dict = {i: class_weights[i] for i in range(len(class_weights))}
print(f"\n⚖️ Class weights (ajustados): {class_weights_dict}")

# Modelo mais profundo e complexo
print("\n🔧 Construindo modelo mais profundo...")
model = keras.Sequential([
    layers.Input(shape=(13,)),
    
    # Bloco 1 - Aumentado
    layers.Dense(512, activation='relu', 
                 kernel_regularizer=keras.regularizers.l2(0.002)),
    layers.BatchNormalization(),
    layers.Dropout(0.6),
    
    # Bloco 2
    layers.Dense(256, activation='relu',
                 kernel_regularizer=keras.regularizers.l2(0.002)),
    layers.BatchNormalization(),
    layers.Dropout(0.5),
    
    # Bloco 3
    layers.Dense(128, activation='relu',
                 kernel_regularizer=keras.regularizers.l2(0.001)),
    layers.BatchNormalization(),
    layers.Dropout(0.4),
    
    # Bloco 4 - Adicional
    layers.Dense(64, activation='relu',
                 kernel_regularizer=keras.regularizers.l2(0.001)),
    layers.Dropout(0.3),
    
    # Output
    layers.Dense(3, activation='softmax')
])

# Learning rate menor e mais estável
optimizer = keras.optimizers.Adam(learning_rate=0.0001)
model.compile(
    optimizer=optimizer,
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# Callbacks mais agressivos
early_stop = EarlyStopping(
    monitor='val_accuracy',  # Mudado para accuracy
    patience=30,
    restore_best_weights=True,
    verbose=1,
    mode='max'
)

reduce_lr = ReduceLROnPlateau(
    monitor='val_accuracy',
    factor=0.3,
    patience=15,
    min_lr=1e-7,
    verbose=1,
    mode='max'
)

# Treinar com mais epochs
print("\n🚀 Iniciando treino...")
print("="*70)

history = model.fit(
    X_train_norm, y_train_balanced,
    validation_data=(X_test_norm, y_test),
    epochs=300,
    batch_size=16,  # Batch menor para melhor convergência
    class_weight=class_weights_dict,
    callbacks=[early_stop, reduce_lr],
    verbose=1
)

# Avaliar
print("\n" + "="*70)
print("📊 AVALIAÇÃO FINAL")
print("="*70)

test_loss, test_acc = model.evaluate(X_test_norm, y_test, verbose=0)
print(f"\n✅ Test Accuracy: {test_acc*100:.2f}%")
print(f"✅ Test Loss: {test_loss:.4f}")

from sklearn.metrics import classification_report, confusion_matrix, recall_score

y_pred = np.argmax(model.predict(X_test_norm), axis=1)

print("\n" + "="*70)
print("📊 CONFUSION MATRIX")
print("="*70)
print("\nLinhas = Real | Colunas = Predito")
print("         [Bronquite] [Normal] [Pneumonia]")
print("")
cm = confusion_matrix(y_test, y_pred)
for i, row_name in enumerate(['Bronquite', 'Normal   ', 'Pneumonia']):
    print(f"{row_name}: {cm[i]}")

print("\n" + "="*70)
print("📊 MÉTRICAS POR CLASSE")
print("="*70)
print(classification_report(y_test, y_pred, 
                          target_names=['Bronchitis', 'Normal', 'Pneumonia']))

recall_per_class = recall_score(y_test, y_pred, average=None)
print("\n" + "="*70)
print("🎯 ACCURACY POR CLASSE (Recall)")
print("="*70)
for i, class_name in enumerate(['Bronquite', 'Normal', 'Pneumonia']):
    print(f"  {class_name}: {recall_per_class[i]*100:.1f}%")
print("\n" + "="*70)

# Verificar se vale a pena salvar
if test_acc < 0.65:
    print("\n" + "="*70)
    print("⚠️  AVISO: Accuracy muito baixa!")
    print("="*70)
    print("\nO modelo não atingiu 65% de accuracy.")
    print("Sugestões:")
    print("  1. Verificar qualidade dos dados (ruído, duplicatas)")
    print("  2. Usar mais dados de treinamento")
    print("  3. Feature engineering nos MFCCs")
    print("\nDeseja salvar mesmo assim? (s/n): ")
    resposta = input()
    if resposta.lower() != 's':
        print("❌ Modelo NÃO salvo. Encerrando...")
        exit()

print("\n" + "="*70)
print("⚠️  REVISE AS MÉTRICAS ACIMA")
print("="*70)
print("\nPressione ENTER para salvar o modelo...")
input()

# Salvar modelo
print("\n💾 Salvando modelo...")
os.makedirs('coughvid_v2', exist_ok=True)

model.save('coughvid_v2/coughvid_model.h5')

model_info = {
    "output_classes": ["Bronchitis", "Normal", "Pneumonia"],
    "scaler": {
        "mean": mean.tolist(),
        "scale": scale.tolist(),
        "type": "RobustScaler"
    },
    "training_info": {
        "final_test_accuracy": float(test_acc),
        "final_test_loss": float(test_loss),
        "epochs_trained": len(history.history['loss']),
        "smote_tomek_applied": True,
        "aggressive_class_weights": True,
        "model_architecture": "deeper_network_512-256-128-64"
    }
}

with open('coughvid_v2/model_info.json', 'w') as f:
    json.dump(model_info, f, indent=2)

print("\n🔄 Convertendo para TensorFlow.js...")
tfjs.converters.save_keras_model(model, 'coughvid_v2/tfjs_model')

print("\n📦 Criando arquivo ZIP...")
import shutil
shutil.make_archive('coughvid_v2', 'zip', 'coughvid_v2')

print("\n" + "="*70)
print("✅ TREINO CONCLUÍDO!")
print("="*70)
print(f"\n📊 Accuracy Final: {test_acc*100:.2f}%")
print(f"📥 Baixe o arquivo: coughvid_v2.zip")
print("\n" + "="*70)
