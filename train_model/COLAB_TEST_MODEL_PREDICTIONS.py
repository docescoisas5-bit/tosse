# ===================================================================
# TESTE DE PREDIÇÕES DO MODELO BINÁRIO - GOOGLE COLAB
# Cole este código no Colab APÓS treinar o modelo
# ===================================================================

import numpy as np
import json
from tensorflow import keras

print("="*70)
print("TESTE DE PREDIÇÕES - MODELO BINÁRIO")
print("="*70)

# Carregar modelo (.h5 já existe no Colab após treino)
MODEL_PATH = 'icbhi_binary_balanced/model.h5'
print(f"\n📥 Carregando modelo: {MODEL_PATH}")

model = keras.models.load_model(MODEL_PATH)
print("✅ Modelo carregado com sucesso!")

# Carregar scaler
MODEL_INFO_PATH = 'icbhi_binary_balanced/model_info.json'
with open(MODEL_INFO_PATH, 'r') as f:
    model_info = json.load(f)

scaler_mean = np.array(model_info['scaler']['mean'])
scaler_scale = np.array(model_info['scaler']['scale'])
threshold = model_info.get('recommended_threshold', 0.59)

print(f"✅ Scaler carregado (threshold: {threshold})")

# Função para normalizar
def normalize(mfccs):
    return (mfccs - scaler_mean) / scaler_scale

# ===================================================================
# TESTE 1: Dados reais do dataset
# ===================================================================
print("\n" + "="*70)
print("TESTE 1: DADOS REAIS DO DATASET")
print("="*70)

X_test = np.load('X.npy')
y_test = np.load('y.npy')

# Pegar 10 amostras de cada classe
normal_indices = np.where(y_test == 0)[0][:10]
anormal_indices = np.where(y_test == 1)[0][:10]

print(f"\n📊 Normal samples (10):")
for i, idx in enumerate(normal_indices):
    sample = X_test[idx]
    normalized = normalize(sample)
    pred = model.predict(normalized.reshape(1, -1), verbose=0)[0][0]
    result = "✅ Normal" if pred <= threshold else "❌ Anormal"
    print(f"   Sample {i+1}: {pred:.4f} → {result}")

print(f"\n📊 Anormal samples (10):")
for i, idx in enumerate(anormal_indices):
    sample = X_test[idx]
    normalized = normalize(sample)
    pred = model.predict(normalized.reshape(1, -1), verbose=0)[0][0]
    result = "✅ Anormal" if pred > threshold else "❌ Normal"
    print(f"   Sample {i+1}: {pred:.4f} → {result}")

# Estatísticas
normal_samples = X_test[y_test == 0][:100]
anormal_samples = X_test[y_test == 1][:100]

normal_preds = model.predict(normalize(normal_samples), verbose=0).flatten()
anormal_preds = model.predict(normalize(anormal_samples), verbose=0).flatten()

print("\n📈 Estatísticas (100 amostras de cada):")
print(f"   Normal - Mean: {normal_preds.mean():.4f}, Min: {normal_preds.min():.4f}, Max: {normal_preds.max():.4f}")
print(f"   Anormal - Mean: {anormal_preds.mean():.4f}, Min: {anormal_preds.min():.4f}, Max: {anormal_preds.max():.4f}")

normal_correct = (normal_preds <= threshold).sum()
anormal_correct = (anormal_preds > threshold).sum()

print(f"\n✅ Accuracy:")
print(f"   Normal: {normal_correct}/{len(normal_samples)} ({normal_correct/len(normal_samples)*100:.1f}%)")
print(f"   Anormal: {anormal_correct}/{len(anormal_samples)} ({anormal_correct/len(anormal_samples)*100:.1f}%)")

# ===================================================================
# TESTE 2: Dados sintéticos
# ===================================================================
print("\n" + "="*70)
print("TESTE 2: DADOS SINTÉTICOS")
print("="*70)

# Usar estatísticas reais das classes
normal_real_mean = X_test[y_test == 0].mean(axis=0)
anormal_real_mean = X_test[y_test == 1].mean(axis=0)

print("\n📊 Teste com média de Normal real:")
normalized = normalize(normal_real_mean)
pred = model.predict(normalized.reshape(1, -1), verbose=0)[0][0]
result = "✅ Normal" if pred <= threshold else "❌ Anormal"
print(f"   Predição: {pred:.4f} → {result}")

print("\n📊 Teste com média de Anormal real:")
normalized = normalize(anormal_real_mean)
pred = model.predict(normalized.reshape(1, -1), verbose=0)[0][0]
result = "✅ Anormal" if pred > threshold else "❌ Normal"
print(f"   Predição: {pred:.4f} → {result}")

# ===================================================================
# TESTE 3: Distribuição completa
# ===================================================================
print("\n" + "="*70)
print("TESTE 3: DISTRIBUIÇÃO DE PREDIÇÕES NO DATASET COMPLETO")
print("="*70)

X_all_norm = normalize(X_test)
y_pred_all = model.predict(X_all_norm, verbose=0, batch_size=128).flatten()

print(f"\n📊 Distribuição de predições (N={len(y_pred_all)}):")
print(f"   Min: {y_pred_all.min():.4f}")
print(f"   Max: {y_pred_all.max():.4f}")
print(f"   Mean: {y_pred_all.mean():.4f}")
print(f"   Median: {np.median(y_pred_all):.4f}")

# Histograma
bins = [0, 0.3, 0.59, 0.8, 1.0]
labels = ['Muito Normal (<0.3)', 'Normal (0.3-0.59)', 'Anormal (0.59-0.8)', 'Muito Anormal (>0.8)']

print(f"\n📊 Histograma:")
for i in range(len(bins)-1):
    count = ((y_pred_all >= bins[i]) & (y_pred_all < bins[i+1])).sum()
    pct = count / len(y_pred_all) * 100
    bar = '█' * int(pct / 2)
    print(f"   {labels[i]:25s}: {count:4d} ({pct:5.1f}%) {bar}")

# Análise por classe real
print(f"\n📊 Distribuição por classe REAL:")
normal_preds_all = y_pred_all[y_test == 0]
anormal_preds_all = y_pred_all[y_test == 1]

print(f"\n   Normal (N={len(normal_preds_all)}):")
print(f"     < 0.59: {(normal_preds_all <= threshold).sum()} ({(normal_preds_all <= threshold).mean()*100:.1f}%)")
print(f"     > 0.59: {(normal_preds_all > threshold).sum()} ({(normal_preds_all > threshold).mean()*100:.1f}%)")

print(f"\n   Anormal (N={len(anormal_preds_all)}):")
print(f"     < 0.59: {(anormal_preds_all <= threshold).sum()} ({(anormal_preds_all <= threshold).mean()*100:.1f}%)")
print(f"     > 0.59: {(anormal_preds_all > threshold).sum()} ({(anormal_preds_all > threshold).mean()*100:.1f}%)")

# Verificar saturação
very_low = (y_pred_all < 0.1).sum()
very_high = (y_pred_all > 0.9).sum()

print(f"\n⚠️ Análise de saturação:")
print(f"   Predições < 0.1: {very_low} ({very_low/len(y_pred_all)*100:.1f}%)")
print(f"   Predições > 0.9: {very_high} ({very_high/len(y_pred_all)*100:.1f}%)")

if very_high > len(y_pred_all) * 0.5:
    print(f"   ❌ MODELO SATURADO PARA ANORMAL!")
    print(f"   🔧 Solução: Aumentar threshold ou retreinar com mais dropout")
elif very_low > len(y_pred_all) * 0.5:
    print(f"   ❌ MODELO SATURADO PARA NORMAL!")
    print(f"   🔧 Solução: Reduzir threshold ou retreinar")
else:
    print(f"   ✅ Modelo balanceado")

# ===================================================================
# TESTE 4: Exemplos extremos
# ===================================================================
print("\n" + "="*70)
print("TESTE 4: EXEMPLOS MAIS EXTREMOS DE CADA CLASSE")
print("="*70)

# Encontrar as amostras mais "certas" de cada classe
normal_preds_with_idx = [(i, pred) for i, pred in enumerate(y_pred_all) if y_test[i] == 0]
anormal_preds_with_idx = [(i, pred) for i, pred in enumerate(y_pred_all) if y_test[i] == 1]

# Ordenar Normal (quanto menor, mais Normal)
normal_sorted = sorted(normal_preds_with_idx, key=lambda x: x[1])
print(f"\n📊 Top 5 amostras MAIS NORMAIS:")
for idx, pred in normal_sorted[:5]:
    print(f"   Índice {idx}: {pred:.4f}")

# Ordenar Anormal (quanto maior, mais Anormal)
anormal_sorted = sorted(anormal_preds_with_idx, key=lambda x: x[1], reverse=True)
print(f"\n📊 Top 5 amostras MAIS ANORMAIS:")
for idx, pred in anormal_sorted[:5]:
    print(f"   Índice {idx}: {pred:.4f}")

print("\n" + "="*70)
print("CONCLUSÃO:")
print("="*70)

# Calcular accuracy geral
y_pred_binary = (y_pred_all > threshold).astype(int)
accuracy = (y_pred_binary == y_test).mean()
print(f"\n✅ Accuracy geral: {accuracy*100:.1f}%")

# Verificar se modelo consegue prever Normal
normal_recall = (normal_preds_all <= threshold).mean()
if normal_recall < 0.3:
    print(f"\n❌ PROBLEMA: Modelo raramente prevê Normal ({normal_recall*100:.1f}%)")
    print(f"   Suas gravações podem ser realmente anormais OU")
    print(f"   O threshold 0.59 está muito baixo para áudios de celular")
    print(f"\n💡 SUGESTÕES:")
    print(f"   1. Testar com threshold 0.7 ou 0.75")
    print(f"   2. Verificar qualidade das gravações (ruído de fundo)")
    print(f"   3. Retreinar com áudios de celular em vez de estetoscópio")
else:
    print(f"\n✅ Modelo consegue prever Normal: {normal_recall*100:.1f}% das vezes")

print("\n" + "="*70)
