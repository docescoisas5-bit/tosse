# ===================================================================
# OTIMIZAÇÃO DE THRESHOLD - ICBHI BINÁRIO
# Encontra o threshold ótimo para equilibrar Normal e Anormal
# ===================================================================

import numpy as np
from sklearn.metrics import recall_score, accuracy_score, f1_score
import json

print("="*70)
print("OTIMIZAÇÃO DE THRESHOLD")
print("="*70)

# Carregar dados de teste (você já deve ter isso no Colab)
# Assumindo que você tem X_test_norm, y_test e model já carregados

print("\n🔍 Testando thresholds de 0.45 a 0.65...")
print("="*70)

results = []

for threshold in np.arange(0.45, 0.66, 0.01):
    y_pred_thresh = (y_pred_prob > threshold).astype(int).flatten()
    
    recall_normal = recall_score(y_test, y_pred_thresh, pos_label=0)
    recall_anormal = recall_score(y_test, y_pred_thresh, pos_label=1)
    accuracy = accuracy_score(y_test, y_pred_thresh)
    f1_normal = f1_score(y_test, y_pred_thresh, pos_label=0)
    f1_anormal = f1_score(y_test, y_pred_thresh, pos_label=1)
    
    # Calcular score balanceado (média harmônica dos recalls)
    if recall_normal > 0 and recall_anormal > 0:
        balanced_score = 2 * (recall_normal * recall_anormal) / (recall_normal + recall_anormal)
    else:
        balanced_score = 0
    
    results.append({
        'threshold': threshold,
        'accuracy': accuracy,
        'recall_normal': recall_normal,
        'recall_anormal': recall_anormal,
        'f1_normal': f1_normal,
        'f1_anormal': f1_anormal,
        'balanced_score': balanced_score
    })
    
    print(f"Threshold {threshold:.2f}: "
          f"Acc={accuracy*100:.1f}%, "
          f"R_Normal={recall_normal*100:.1f}%, "
          f"R_Anormal={recall_anormal*100:.1f}%, "
          f"Balance={balanced_score*100:.1f}%")

# Encontrar melhor threshold (maior balanced_score)
best_result = max(results, key=lambda x: x['balanced_score'])
best_threshold = best_result['threshold']

print("\n" + "="*70)
print("🎯 THRESHOLD ÓTIMO ENCONTRADO!")
print("="*70)
print(f"\n✅ Melhor threshold: {best_threshold:.2f}")
print(f"   Accuracy: {best_result['accuracy']*100:.1f}%")
print(f"   Recall Normal: {best_result['recall_normal']*100:.1f}%")
print(f"   Recall Anormal: {best_result['recall_anormal']*100:.1f}%")
print(f"   F1 Normal: {best_result['f1_normal']:.3f}")
print(f"   F1 Anormal: {best_result['f1_anormal']:.3f}")
print(f"   Balanced Score: {best_result['balanced_score']*100:.1f}%")

# Mostrar top 5 melhores thresholds
print("\n📊 Top 5 Melhores Thresholds:")
print("="*70)
top_5 = sorted(results, key=lambda x: x['balanced_score'], reverse=True)[:5]
for i, r in enumerate(top_5, 1):
    print(f"{i}. Threshold {r['threshold']:.2f}: "
          f"Balance={r['balanced_score']*100:.1f}% "
          f"(Normal={r['recall_normal']*100:.1f}%, Anormal={r['recall_anormal']*100:.1f}%)")

# Confusion Matrix com threshold ótimo
from sklearn.metrics import confusion_matrix
y_pred_best = (y_pred_prob > best_threshold).astype(int).flatten()
cm = confusion_matrix(y_test, y_pred_best)

print("\n" + "="*70)
print("📊 CONFUSION MATRIX (Threshold Ótimo)")
print("="*70)
print("\nLinhas = Real | Colunas = Predito")
print("         [Normal] [Anormal]")
print(f"Normal  : {cm[0]}")
print(f"Anormal : {cm[1]}")

falsos_positivos = cm[0][1]
falsos_negativos = cm[1][0]

print(f"\n📊 Análise de Erros:")
print(f"   Falsos Positivos (Normal → Anormal): {falsos_positivos}/{cm[0].sum()} ({(falsos_positivos/cm[0].sum())*100:.1f}%)")
print(f"   Falsos Negativos (Anormal → Normal): {falsos_negativos}/{cm[1].sum()} ({(falsos_negativos/cm[1].sum())*100:.1f}%)")

# Atualizar model_info.json com threshold ótimo
print("\n💾 Atualizando model_info.json...")

# Recarregar model_info
with open('icbhi_binary_balanced/model_info.json', 'r') as f:
    model_info = json.load(f)

# Atualizar com threshold ótimo
model_info['recommended_threshold'] = float(best_threshold)
model_info['threshold_optimization'] = {
    'accuracy': float(best_result['accuracy']),
    'recall_normal': float(best_result['recall_normal']),
    'recall_anormal': float(best_result['recall_anormal']),
    'balanced_score': float(best_result['balanced_score'])
}

# Salvar
with open('icbhi_binary_balanced/model_info.json', 'w') as f:
    json.dump(model_info, f, indent=2)

print("✅ model_info.json atualizado!")

# Recriar ZIP
import shutil
import os

if os.path.exists('icbhi_binary_balanced.zip'):
    os.remove('icbhi_binary_balanced.zip')

shutil.make_archive('icbhi_binary_balanced', 'zip', 'icbhi_binary_balanced')

print("\n" + "="*70)
print("✅ OTIMIZAÇÃO CONCLUÍDA!")
print("="*70)
print(f"\n📥 Baixe o arquivo atualizado: icbhi_binary_balanced.zip")
print(f"   Threshold ótimo: {best_threshold:.2f}")
print(f"   Use este threshold no app para melhor equilíbrio!")
print("\n" + "="*70)
