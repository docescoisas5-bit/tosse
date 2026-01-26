# ===================================================================
# TREINO BINÁRIO OTIMIZADO - ICBHI (Normal vs Anormal)
# Com foco em minimizar falsos negativos (casos Anormais classificados como Normal)
# ===================================================================

# !pip install tensorflowjs scikit-learn

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, recall_score
from sklearn.utils import class_weight
import tensorflowjs as tfjs
import os, json

print("="*70)
print("TREINO BINÁRIO OTIMIZADO - ICBHI")
print("="*70)

# Carregar dados
X = np.load('X.npy')
y = np.load('y.npy')

print(f"\n📥 Dados carregados:")
print(f"   X shape: {X.shape}")
print(f"   y shape: {y.shape}")
print(f"   Normal: {np.sum(y==0)} ({np.sum(y==0)/len(y)*100:.1f}%)")
print(f"   Anormal: {np.sum(y==1)} ({np.sum(y==1)/len(y)*100:.1f}%)")

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Normalização
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
X_train_norm = scaler.fit_transform(X_train)
X_test_norm = scaler.transform(X_test)

# Class Weights - Penalizar MUITO mais falsos negativos (Anormal → Normal)
class_weights = class_weight.compute_class_weight(
    'balanced',
    classes=np.unique(y_train),
    y=y_train
)
# Aumentar peso da classe Anormal
class_weights[1] *= 1.5
class_weights_dict = {i: class_weights[i] for i in range(len(class_weights))}
print(f"\n⚖️ Class weights: {class_weights_dict}")

# Modelo mais profundo
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
    layers.Dense(1, activation='sigmoid')
])

# Compilar
optimizer = keras.optimizers.Adam(learning_rate=0.0005)
model.compile(
    optimizer=optimizer,
    loss='binary_crossentropy',
    metrics=['accuracy', 
             keras.metrics.Precision(name='precision'),
             keras.metrics.Recall(name='recall')]
)

model.summary()

# Callbacks
early_stop = EarlyStopping(
    monitor='val_recall',  # Foca em maximizar Recall (detectar Anormais)
    patience=30,
    restore_best_weights=True,
    verbose=1,
    mode='max'
)

reduce_lr = ReduceLROnPlateau(
    monitor='val_recall',
    factor=0.5,
    patience=15,
    min_lr=1e-6,
    verbose=1,
    mode='max'
)

# Treinar
print("\n🚀 Iniciando treino...")
print("="*70)

history = model.fit(
    X_train_norm, y_train,
    validation_data=(X_test_norm, y_test),
    epochs=150,
    batch_size=32,
    class_weight=class_weights_dict,
    callbacks=[early_stop, reduce_lr],
    verbose=1
)

# Avaliar
print("\n" + "="*70)
print("📊 AVALIAÇÃO FINAL")
print("="*70)

y_pred_prob = model.predict(X_test_norm)
y_pred = (y_pred_prob > 0.5).astype(int).flatten()

test_acc = (y_pred == y_test).mean()
recall_normal = recall_score(y_test, y_pred, pos_label=0)
recall_anormal = recall_score(y_test, y_pred, pos_label=1)

print(f"\n✅ Test Accuracy: {test_acc*100:.2f}%")
print(f"✅ Recall Normal: {recall_normal*100:.1f}%")
print(f"✅ Recall Anormal: {recall_anormal*100:.1f}%")

print("\n" + "="*70)
print("📊 CONFUSION MATRIX")
print("="*70)
cm = confusion_matrix(y_test, y_pred)
print("\nLinhas = Real | Colunas = Predito")
print("         [Normal] [Anormal]")
print(f"Normal  : {cm[0]}")
print(f"Anormal : {cm[1]}")

# Análise de falsos negativos (CRÍTICO)
falsos_negativos = cm[1][0]
total_anormais = cm[1].sum()
taxa_fn = (falsos_negativos / total_anormais) * 100

print(f"\n⚠️  Falsos Negativos (Anormal → Normal): {falsos_negativos}/{total_anormais} ({taxa_fn:.1f}%)")
if taxa_fn > 30:
    print("   ❌ ALTO! Risco clínico - pacientes doentes classificados como saudáveis")
else:
    print("   ✅ ACEITÁVEL")

print("\n" + "="*70)
print("📊 CLASSIFICATION REPORT")
print("="*70)
print(classification_report(y_test, y_pred, target_names=['Normal', 'Anormal']))

# Testar diferentes thresholds
print("\n" + "="*70)
print("🎯 OTIMIZAÇÃO DE THRESHOLD")
print("="*70)

best_threshold = 0.5
best_recall_anormal = recall_anormal

for threshold in [0.3, 0.4, 0.5, 0.6, 0.7]:
    y_pred_thresh = (y_pred_prob > threshold).astype(int).flatten()
    recall_anormal_thresh = recall_score(y_test, y_pred_thresh, pos_label=1)
    acc_thresh = (y_pred_thresh == y_test).mean()
    
    print(f"Threshold {threshold:.1f}: Acc={acc_thresh*100:.1f}%, Recall Anormal={recall_anormal_thresh*100:.1f}%")
    
    if recall_anormal_thresh > best_recall_anormal:
        best_recall_anormal = recall_anormal_thresh
        best_threshold = threshold

print(f"\n✅ Melhor threshold para Recall Anormal: {best_threshold}")

# Salvar modelo
print("\n💾 Salvando modelo...")
os.makedirs('icbhi_binary_optimized', exist_ok=True)

model.save('icbhi_binary_optimized/model.h5')

model_info = {
    "output_classes": ["Normal", "Anormal"],
    "scaler": {
        "mean": scaler.mean_.tolist(),
        "scale": scaler.scale_.tolist()
    },
    "binary_classification": True,
    "recommended_threshold": float(best_threshold),
    "training_info": {
        "test_accuracy": float(test_acc),
        "recall_normal": float(recall_normal),
        "recall_anormal": float(recall_anormal),
        "false_negative_rate": float(taxa_fn)
    }
}

with open('icbhi_binary_optimized/model_info.json', 'w') as f:
    json.dump(model_info, f, indent=2)

print("\n🔄 Convertendo para TensorFlow.js...")
tfjs.converters.save_keras_model(model, 'icbhi_binary_optimized/tfjs_model')

print("\n📦 Criando arquivo ZIP...")
import shutil
shutil.make_archive('icbhi_binary_optimized', 'zip', 'icbhi_binary_optimized')

print("\n" + "="*70)
print("✅ TREINO CONCLUÍDO!")
print("="*70)
print(f"\n📊 Métricas Finais:")
print(f"   Accuracy: {test_acc*100:.1f}%")
print(f"   Recall Normal: {recall_normal*100:.1f}%")
print(f"   Recall Anormal: {recall_anormal*100:.1f}%")
print(f"   Taxa de Falsos Negativos: {taxa_fn:.1f}%")
print(f"\n📥 Baixe o arquivo: icbhi_binary_optimized.zip")
print("\n" + "="*70)
