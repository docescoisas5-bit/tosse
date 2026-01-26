# ===================================================================
# TREINO BINÁRIO BALANCEADO - ICBHI (Normal vs Anormal)
# Com undersampling de Anormal + SMOTE em Normal
# ===================================================================

# !pip install tensorflowjs scikit-learn imbalanced-learn

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, recall_score
from imblearn.under_sampling import RandomUnderSampler
from imblearn.over_sampling import SMOTE
import tensorflowjs as tfjs
import os, json

print("="*70)
print("TREINO BINÁRIO BALANCEADO - ICBHI")
print("="*70)

# Carregar dados
X = np.load('X.npy')
y = np.load('y.npy')

print(f"\n📥 Dados originais:")
print(f"   Normal: {np.sum(y==0)} ({np.sum(y==0)/len(y)*100:.1f}%)")
print(f"   Anormal: {np.sum(y==1)} ({np.sum(y==1)/len(y)*100:.1f}%)")

# 1. Split ANTES de balancear
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"\n📊 Train set original:")
print(f"   Normal: {np.sum(y_train==0)}")
print(f"   Anormal: {np.sum(y_train==1)}")

# 2. Undersampling de Anormal para 2x Normal
count_normal = np.sum(y_train == 0)
target_anormal = int(count_normal * 2)  # Anormal = 2x Normal

rus = RandomUnderSampler(
    sampling_strategy={1: target_anormal},
    random_state=42
)
X_train_under, y_train_under = rus.fit_resample(X_train, y_train)

print(f"\n📊 Após Undersampling:")
print(f"   Normal: {np.sum(y_train_under==0)}")
print(f"   Anormal: {np.sum(y_train_under==1)}")

# 3. SMOTE em Normal para balancear 1:1
smote = SMOTE(random_state=42, k_neighbors=5)
X_train_balanced, y_train_balanced = smote.fit_resample(X_train_under, y_train_under)

print(f"\n📊 Após SMOTE (balanceado):")
print(f"   Normal: {np.sum(y_train_balanced==0)}")
print(f"   Anormal: {np.sum(y_train_balanced==1)}")

# 4. Normalização
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
X_train_norm = scaler.fit_transform(X_train_balanced)
X_test_norm = scaler.transform(X_test)

# 5. Modelo SIMPLES (evita overfit)
print("\n🔧 Construindo modelo...")
model = keras.Sequential([
    layers.Input(shape=(13,)),
    
    layers.Dense(128, activation='relu'),
    layers.Dropout(0.4),
    
    layers.Dense(64, activation='relu'),
    layers.Dropout(0.3),
    
    layers.Dense(1, activation='sigmoid')
])

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss='binary_crossentropy',
    metrics=['accuracy']
)

model.summary()

# 6. Early Stopping
early_stop = EarlyStopping(
    monitor='val_loss',
    patience=20,
    restore_best_weights=True,
    verbose=1
)

# 7. Treinar
print("\n🚀 Iniciando treino...")
print("="*70)

history = model.fit(
    X_train_norm, y_train_balanced,
    validation_data=(X_test_norm, y_test),
    epochs=100,
    batch_size=32,
    callbacks=[early_stop],
    verbose=1
)

# 8. Avaliar
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

# Análise detalhada
falsos_positivos = cm[0][1]  # Normal → Anormal
falsos_negativos = cm[1][0]  # Anormal → Normal

print(f"\n📊 Análise de Erros:")
print(f"   Falsos Positivos (Normal → Anormal): {falsos_positivos}/{cm[0].sum()} ({(falsos_positivos/cm[0].sum())*100:.1f}%)")
print(f"   Falsos Negativos (Anormal → Normal): {falsos_negativos}/{cm[1].sum()} ({(falsos_negativos/cm[1].sum())*100:.1f}%)")

print("\n" + "="*70)
print("📊 CLASSIFICATION REPORT")
print("="*70)
print(classification_report(y_test, y_pred, target_names=['Normal', 'Anormal']))

# 9. Testar thresholds
print("\n" + "="*70)
print("🎯 ANÁLISE DE THRESHOLD")
print("="*70)

for threshold in [0.3, 0.4, 0.5, 0.6, 0.7]:
    y_pred_thresh = (y_pred_prob > threshold).astype(int).flatten()
    recall_normal_t = recall_score(y_test, y_pred_thresh, pos_label=0)
    recall_anormal_t = recall_score(y_test, y_pred_thresh, pos_label=1)
    acc_t = (y_pred_thresh == y_test).mean()
    
    print(f"Threshold {threshold:.1f}:")
    print(f"  Acc={acc_t*100:.1f}%, Recall Normal={recall_normal_t*100:.1f}%, Recall Anormal={recall_anormal_t*100:.1f}%")

# 10. Validar se está equilibrado
if recall_normal < 0.5 or recall_anormal < 0.5:
    print("\n❌ AVISO: Modelo ainda desequilibrado!")
    print("   Uma das classes tem <50% de recall")
else:
    print("\n✅ Modelo balanceado! Ambas classes >50% recall")

# 11. Salvar
print("\n💾 Salvando modelo...")
os.makedirs('icbhi_binary_balanced', exist_ok=True)

model.save('icbhi_binary_balanced/model.h5')

model_info = {
    "output_classes": ["Normal", "Anormal"],
    "scaler": {
        "mean": scaler.mean_.tolist(),
        "scale": scaler.scale_.tolist()
    },
    "binary_classification": True,
    "training_info": {
        "test_accuracy": float(test_acc),
        "recall_normal": float(recall_normal),
        "recall_anormal": float(recall_anormal),
        "balanced_training": True
    }
}

with open('icbhi_binary_balanced/model_info.json', 'w') as f:
    json.dump(model_info, f, indent=2)

tfjs.converters.save_keras_model(model, 'icbhi_binary_balanced/tfjs_model')

import shutil
shutil.make_archive('icbhi_binary_balanced', 'zip', 'icbhi_binary_balanced')

print("\n" + "="*70)
print("✅ TREINO CONCLUÍDO!")
print("="*70)
print(f"\n📊 Métricas Finais:")
print(f"   Accuracy: {test_acc*100:.1f}%")
print(f"   Recall Normal: {recall_normal*100:.1f}%")
print(f"   Recall Anormal: {recall_anormal*100:.1f}%")
print(f"\n📥 Baixe: icbhi_binary_balanced.zip")
print("\n" + "="*70)
