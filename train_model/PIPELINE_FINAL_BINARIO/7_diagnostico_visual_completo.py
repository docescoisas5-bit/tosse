# ===================================================================
# DIAGNÓSTICO VISUAL COMPLETO - GOOGLE COLAB
# Gera Curva ROC, Matriz de Confusão e Histograma de Probabilidades
# ===================================================================

import numpy as np
import json
import matplotlib.pyplot as plt
import seaborn as sns
from tensorflow import keras
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score, roc_curve, auc
from sklearn.model_selection import train_test_split

print("="*70)
print("📊 INICIANDO DIAGNÓSTICO VISUAL DO MODELO")
print("="*70)

# 1. Carregar Dados e Modelo
try:
    X = np.load('X.npy')
    y = np.load('y.npy')
    
    # Tenta carregar da pasta do modelo reparado ou da padrão
    import os
    model_path = 'icbhi_reparado/model.h5' if os.path.exists('icbhi_reparado/model.h5') else 'icbhi_binary_balanced/model.h5'
    info_path = 'icbhi_reparado/model_info.json' if os.path.exists('icbhi_reparado/model_info.json') else 'icbhi_binary_balanced/model_info.json'
    
    model = keras.models.load_model(model_path)
    with open(info_path, 'r') as f:
        model_info = json.load(f)
    
    scaler_mean = np.array(model_info['scaler']['mean'])
    scaler_scale = np.array(model_info['scaler']['scale'])
    # Se estiver dando apenas normal, o threshold 0.80 pode estar muito alto
    threshold_app = 0.80 
    threshold_sugerido = model_info.get('recommended_threshold', 0.5)
    
    print(f"✅ Modelo carregado: {model_path}")
    print(f"✅ Threshold sugerido no arquivo: {threshold_sugerido}")
except Exception as e:
    print(f"❌ Erro ao carregar arquivos: {e}")
    exit()

# 2. Preparar Conjunto de Teste
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
X_test_norm = (X_test - scaler_mean) / scaler_scale

# 3. Predições (Probabilidades)
print("\n🤖 Calculando probabilidades...")
y_probs = model.predict(X_test_norm, verbose=0).flatten()

# ===================================================================
# GRÁFICO 1: DISTRIBUIÇÃO DE PROBABILIDADES
# ===================================================================
plt.figure(figsize=(12, 5))

plt.subplot(1, 2, 1)
sns.histplot(y_probs[y_test == 0], color='green', label='Real: Saudável (Normal)', kde=True, stat="density", alpha=0.5)
sns.histplot(y_probs[y_test == 1], color='red', label='Real: Doente (Anormal)', kde=True, stat="density", alpha=0.5)
plt.axvline(threshold_app, color='black', linestyle='--', label=f'Threshold App ({threshold_app})')
plt.axvline(threshold_sugerido, color='blue', linestyle=':', label=f'Threshold Sugerido ({threshold_sugerido})')
plt.title('Distribuição de Probabilidades da IA')
plt.xlabel('Score de Anormalidade (0 a 1)')
plt.ylabel('Densidade')
plt.legend()

# ===================================================================
# GRÁFICO 2: CURVA ROC
# ===================================================================
fpr, tpr, thresholds = roc_curve(y_test, y_probs)
roc_auc = auc(fpr, tpr)

plt.subplot(1, 2, 2)
plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'Curva ROC (área = {roc_auc:.2f})')
plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])
plt.xlabel('Taxa de Falsos Positivos')
plt.ylabel('Taxa de Verdadeiros Positivos (Sensibilidade)')
plt.title('Curva ROC - Capacidade de Separação')
plt.legend(loc="lower right")

plt.tight_layout()
plt.show()

# ===================================================================
# MATRIZES DE CONFUSÃO (Comparação de Thresholds)
# ===================================================================
def plot_cm(y_true, y_prob, thresh, title):
    y_p = (y_prob > thresh).astype(int)
    cm = confusion_matrix(y_true, y_p)
    plt.figure(figsize=(5, 4))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=['Normal', 'Anormal'], yticklabels=['Normal', 'Anormal'])
    plt.title(f'{title}\nThreshold: {thresh}')
    plt.ylabel('Real')
    plt.xlabel('Predito')
    plt.show()
    
    acc = accuracy_score(y_true, y_p)
    rec_n = cm[0][0]/cm[0].sum() if cm[0].sum() > 0 else 0
    rec_a = cm[1][1]/cm[1].sum() if cm[1].sum() > 0 else 0
    print(f"\n📊 {title}:")
    print(f"   Acurácia: {acc*100:.1f}%")
    print(f"   Acerto Saudáveis (Normal): {rec_n*100:.1f}%")
    print(f"   Acerto Doentes (Anormal): {rec_a*100:.1f}%")

print("\n" + "="*70)
print("🔍 ANALISANDO MATRIZES DE CONFUSÃO")
print("="*70)

plot_cm(y_test, y_probs, threshold_sugerido, "MATRIZ COM THRESHOLD SUGERIDO (0.50)")
plot_cm(y_test, y_probs, threshold_app, "MATRIZ COM THRESHOLD ATUAL DO APP (0.80)")

print("\n" + "="*70)
print("💡 DIAGNÓSTICO FINAL")
print("="*70)

if roc_auc > 0.7:
    print(f"✅ O modelo é BOM (AUC = {roc_auc:.2f}). Ele consegue separar as classes.")
    if (y_probs > threshold_app).sum() == 0:
        print(f"⚠️  PROBLEMA: O threshold de {threshold_app} está muito alto!")
        print("   A maioria das predições está abaixo disso. Reduza para 0.50 no mlService.ts.")
    else:
        print("✅ O threshold parece aceitável para o conjunto de teste.")
else:
    print(f"❌ O modelo é FRACO (AUC = {roc_auc:.2f}). Precisa de mais dados ou melhor arquitetura.")

print("\n" + "="*70)
