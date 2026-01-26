# ===================================================================
# SCRIPT DE TREINO OTIMIZADO - COUGHVID DATASET
# Execute no Google Colab após fazer upload de X.npy e y.npy
# ===================================================================

# 1. Instalar dependências
# Execute no Colab: !pip install tensorflowjs scikit-learn imbalanced-learn

import numpy as np
import os
import json
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
import tensorflowjs as tfjs
from sklearn.model_selection import train_test_split
from sklearn.utils import class_weight
from imblearn.over_sampling import SMOTE
from collections import Counter

print("="*70)
print("TREINO OTIMIZADO - MODELO COUGHVID")
print("="*70)

# 2. Carregar dados
print("\n📥 Carregando dados...")
X = np.load('X.npy')
y = np.load('y.npy')

print(f"✅ Dados carregados: X={X.shape}, y={y.shape}")
print(f"📊 Distribuição original: {Counter(y)}")

# 3. Split train/test ANTES do balanceamento
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"\n📊 Train: {Counter(y_train)}")
print(f"📊 Test: {Counter(y_test)}")

# 4. Balanceamento com SMOTE (mais sofisticado que oversampling simples)
print("\n⚖️ Aplicando SMOTE para balanceamento...")
smote = SMOTE(random_state=42, k_neighbors=5)
X_train_balanced, y_train_balanced = smote.fit_resample(X_train, y_train)

print(f"✅ Após SMOTE: {Counter(y_train_balanced)}")

# 5. Normalização (StandardScaler)
print("\n📐 Calculando normalização...")
mean = np.mean(X_train_balanced, axis=0)
std = np.std(X_train_balanced, axis=0)

# Evita divisão por zero
std[std == 0] = 1.0

X_train_norm = (X_train_balanced - mean) / std
X_test_norm = (X_test - mean) / std

print(f"   Mean: [{', '.join([f'{m:.2f}' for m in mean[:5]])}...]")
print(f"   Std: [{', '.join([f'{s:.2f}' for s in std[:5]])}...]")

# 6. Class Weights (reforço adicional para classes minoritárias)
class_weights = class_weight.compute_class_weight(
    'balanced',
    classes=np.unique(y_train_balanced),
    y=y_train_balanced
)
class_weights_dict = {i: class_weights[i] for i in range(len(class_weights))}
print(f"\n⚖️ Class weights: {class_weights_dict}")

# 7. Criar modelo com Batch Normalization e Regularização
print("\n🔧 Construindo modelo...")
model = keras.Sequential([
    layers.Input(shape=(13,)),
    
    # Bloco 1
    layers.Dense(256, activation='relu', 
                 kernel_regularizer=keras.regularizers.l2(0.001)),
    layers.BatchNormalization(),
    layers.Dropout(0.5),
    
    # Bloco 2
    layers.Dense(128, activation='relu',
                 kernel_regularizer=keras.regularizers.l2(0.001)),
    layers.BatchNormalization(),
    layers.Dropout(0.4),
    
    # Bloco 3
    layers.Dense(64, activation='relu',
                 kernel_regularizer=keras.regularizers.l2(0.001)),
    layers.Dropout(0.3),
    
    # Output
    layers.Dense(3, activation='softmax')
])

# 8. Compilar com learning rate personalizado
optimizer = keras.optimizers.Adam(learning_rate=0.0005)
model.compile(
    optimizer=optimizer,
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# 9. Callbacks
early_stop = EarlyStopping(
    monitor='val_loss',
    patience=20,
    restore_best_weights=True,
    verbose=1
)

reduce_lr = ReduceLROnPlateau(
    monitor='val_loss',
    factor=0.5,
    patience=10,
    min_lr=1e-6,
    verbose=1
)

# 10. Treinar
print("\n🚀 Iniciando treino...")
print("="*70)

history = model.fit(
    X_train_norm, y_train_balanced,
    validation_data=(X_test_norm, y_test),
    epochs=200,
    batch_size=32,
    class_weight=class_weights_dict,
    callbacks=[early_stop, reduce_lr],
    verbose=1
)

# 11. Avaliar
print("\n" + "="*70)
print("📊 AVALIAÇÃO FINAL")
print("="*70)

test_loss, test_acc = model.evaluate(X_test_norm, y_test, verbose=0)
print(f"\n✅ Test Accuracy: {test_acc*100:.2f}%")
print(f"✅ Test Loss: {test_loss:.4f}")

# Matriz de confusão
from sklearn.metrics import classification_report, confusion_matrix

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

# Calcular accuracy por classe
from sklearn.metrics import recall_score
recall_per_class = recall_score(y_test, y_pred, average=None)
print("\n" + "="*70)
print("🎯 ACCURACY POR CLASSE (Recall)")
print("="*70)
for i, class_name in enumerate(['Bronquite', 'Normal', 'Pneumonia']):
    print(f"  {class_name}: {recall_per_class[i]*100:.1f}%")
print("\n" + "="*70)

# 12. PAUSA PARA VISUALIZAÇÃO
print("\n" + "="*70)
print("⚠️  REVISE AS MÉTRICAS ACIMA ANTES DE CONTINUAR")
print("="*70)
print("\nSe a accuracy estiver baixa (<70%), considere:")
print("  - Aumentar epochs")
print("  - Ajustar learning rate")
print("  - Verificar qualidade dos dados")
print("\nPressione ENTER para salvar o modelo...")
input()

# 13. Salvar modelo
print("\n💾 Salvando modelo...")
os.makedirs('coughvid_optimized', exist_ok=True)

# Salvar .h5
model.save('coughvid_optimized/coughvid_model.h5')

# Salvar model_info.json
model_info = {
    "output_classes": ["Bronchitis", "Normal", "Pneumonia"],
    "scaler": {
        "mean": mean.tolist(),
        "scale": std.tolist()
    },
    "training_info": {
        "final_test_accuracy": float(test_acc),
        "final_test_loss": float(test_loss),
        "epochs_trained": len(history.history['loss']),
        "smote_applied": True,
        "class_weights_used": True
    }
}

with open('coughvid_optimized/model_info.json', 'w') as f:
    json.dump(model_info, f, indent=2)

# Converter para TensorFlow.js
print("\n🔄 Convertendo para TensorFlow.js...")
tfjs.converters.save_keras_model(model, 'coughvid_optimized/tfjs_model')

# Criar ZIP
print("\n📦 Criando arquivo ZIP...")
import shutil
shutil.make_archive('coughvid_optimized', 'zip', 'coughvid_optimized')

print("\n" + "="*70)
print("✅ TREINO CONCLUÍDO COM SUCESSO!")
print("="*70)
print("\n📥 Baixe o arquivo: coughvid_optimized.zip")
print("📤 Faça upload dos arquivos para o Supabase Storage:")
print("   - tfjs_model/model.json")
print("   - tfjs_model/group1-shard1of1.bin")
print("   - model_info.json")
print("\n" + "="*70)
