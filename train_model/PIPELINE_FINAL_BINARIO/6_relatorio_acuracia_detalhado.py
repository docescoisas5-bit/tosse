# ===================================================================
# RELATÓRIO DE ACURÁCIA DETALHADO - GOOGLE COLAB
# Use este script para validar o desempenho do modelo binário
# ===================================================================

import numpy as np
import json
import matplotlib.pyplot as plt
import seaborn as sns
from tensorflow import keras
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score, balanced_accuracy_score
from sklearn.model_selection import train_test_split

print("="*70)
print("📊 INICIANDO AVALIAÇÃO DE ACURÁCIA")
print("="*70)

# 1. Carregar Dados e Modelo
try:
    X = np.load('X.npy')
    y = np.load('y.npy')
    model = keras.models.load_model('icbhi_binary_balanced/model.h5')
    
    with open('icbhi_binary_balanced/model_info.json', 'r') as f:
        model_info = json.load(f)
    
    scaler_mean = np.array(model_info['scaler']['mean'])
    scaler_scale = np.array(model_info['scaler']['scale'])
    threshold = model_info.get('recommended_threshold', 0.59)
    
    print("✅ Dados e Modelo carregados com sucesso!")
except Exception as e:
    print(f"❌ Erro ao carregar arquivos: {e}")
    print("Certifique-se de que X.npy, y.npy e a pasta icbhi_binary_balanced/ estão no Colab.")
    exit()

# 2. Preparar Conjunto de Teste (Mesmo split do treino)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 3. Normalização
X_test_norm = (X_test - scaler_mean) / scaler_scale

# 4. Predições
print("\n🤖 Executando predições...")
y_pred_prob = model.predict(X_test_norm, verbose=0).flatten()
y_pred = (y_pred_prob > threshold).astype(int)

# 5. Cálculo de Métricas
acc = accuracy_score(y_test, y_pred)
balanced_acc = balanced_accuracy_score(y_test, y_pred)
cm = confusion_matrix(y_test, y_pred)

print("\n" + "="*70)
print("🎯 RESULTADOS GERAIS")
print("="*70)
print(f"✅ ACURÁCIA GERAL: {acc*100:.2f}%")
print(f"✅ ACURÁCIA BALANCEADA: {balanced_acc*100:.2f}%")
print(f"✅ LIMIAR UTILIZADO: {threshold:.2f}")

print("\n" + "="*70)
print("📊 MATRIZ DE CONFUSÃO")
print("="*70)
print("Linhas = Real | Colunas = Predito")
print(f"          [Normal]  [Anormal]")
print(f"Normal  : {cm[0]}")
print(f"Anormal : {cm[1]}")

# Acurácia por Classe (Recall)
recall_normal = cm[0][0] / cm[0].sum()
recall_anormal = cm[1][1] / cm[1].sum()

print("\n" + "="*70)
print("🎯 ACURÁCIA POR CLASSE (Capacidade de acerto)")
print("="*70)
print(f"🟢 Saudáveis (Normal) : {recall_normal*100:.1f}%")
print(f"🔴 Doentes (Anormal)  : {recall_anormal*100:.1f}%")

print("\n" + "="*70)
print("📋 RELATÓRIO DE CLASSIFICAÇÃO")
print("="*70)
print(classification_report(y_test, y_pred, target_names=['Normal', 'Anormal']))

# 6. Visualização Gráfica (Opcional no Colab)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=['Normal', 'Anormal'], 
            yticklabels=['Normal', 'Anormal'])
plt.title('Matriz de Confusão - Modelo Binário ICBHI')
plt.xlabel('Predito')
plt.ylabel('Real')
plt.show()

print("\n" + "="*70)
print("✅ AVALIAÇÃO CONCLUÍDA")
print("="*70)
