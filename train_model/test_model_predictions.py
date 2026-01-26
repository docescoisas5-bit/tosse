# ===================================================================
# TESTE DE PREDIÇÕES DO MODELO BINÁRIO
# Verifica se o modelo consegue prever Normal e Anormal corretamente
# ===================================================================

import numpy as np
import json
from tensorflow import keras

print("="*70)
print("TESTE DE PREDIÇÕES - MODELO BINÁRIO")
print("="*70)

# Carregar modelo
MODEL_PATH = r"C:\Users\USER\tosse\train_model\icbhi_binary_balanced\model.h5"
print(f"\n📥 Carregando modelo: {MODEL_PATH}")

try:
    model = keras.models.load_model(MODEL_PATH)
    print("✅ Modelo carregado com sucesso!")
    model.summary()
except Exception as e:
    print(f"❌ Erro ao carregar modelo: {e}")
    exit(1)

# Carregar scaler
MODEL_INFO_PATH = r"C:\Users\USER\tosse\train_model\icbhi_binary_balanced\model_info.json"
print(f"\n📥 Carregando scaler: {MODEL_INFO_PATH}")

with open(MODEL_INFO_PATH, 'r') as f:
    model_info = json.load(f)

scaler_mean = np.array(model_info['scaler']['mean'])
scaler_scale = np.array(model_info['scaler']['scale'])
threshold = model_info.get('recommended_threshold', 0.59)

print(f"✅ Scaler carregado (threshold: {threshold})")
print(f"   Mean: [{scaler_mean[0]:.2f}, {scaler_mean[1]:.2f}, ...]")
print(f"   Scale: [{scaler_scale[0]:.2f}, {scaler_scale[1]:.2f}, ...]")

# Função para normalizar
def normalize(mfccs):
    return (mfccs - scaler_mean) / scaler_scale

# ===================================================================
# TESTE 1: Dados do conjunto de teste (se disponível)
# ===================================================================
print("\n" + "="*70)
print("TESTE 1: DADOS REAIS DO CONJUNTO DE TESTE")
print("="*70)

try:
    X_test = np.load(r'C:\Users\USER\tosse\train_model\processed_icbhi_binary\X.npy')
    y_test = np.load(r'C:\Users\USER\tosse\train_model\processed_icbhi_binary\y.npy')
    
    # Pegar 10 amostras de cada classe
    normal_samples = X_test[y_test == 0][:10]
    anormal_samples = X_test[y_test == 1][:10]
    
    print(f"\n📊 Normal samples: {len(normal_samples)}")
    for i, sample in enumerate(normal_samples):
        normalized = normalize(sample)
        pred = model.predict(normalized.reshape(1, -1), verbose=0)[0][0]
        result = "✅ Normal" if pred <= threshold else "❌ Anormal"
        print(f"   Sample {i+1}: {pred:.4f} → {result}")
    
    print(f"\n📊 Anormal samples: {len(anormal_samples)}")
    for i, sample in enumerate(anormal_samples):
        normalized = normalize(sample)
        pred = model.predict(normalized.reshape(1, -1), verbose=0)[0][0]
        result = "✅ Anormal" if pred > threshold else "❌ Normal"
        print(f"   Sample {i+1}: {pred:.4f} → {result}")
    
    # Estatísticas
    print("\n📈 Estatísticas:")
    normal_preds = model.predict(normalize(normal_samples), verbose=0).flatten()
    anormal_preds = model.predict(normalize(anormal_samples), verbose=0).flatten()
    
    print(f"   Normal - Mean: {normal_preds.mean():.4f}, Min: {normal_preds.min():.4f}, Max: {normal_preds.max():.4f}")
    print(f"   Anormal - Mean: {anormal_preds.mean():.4f}, Min: {anormal_preds.min():.4f}, Max: {anormal_preds.max():.4f}")
    
    normal_correct = (normal_preds <= threshold).sum()
    anormal_correct = (anormal_preds > threshold).sum()
    
    print(f"\n✅ Accuracy:")
    print(f"   Normal: {normal_correct}/{len(normal_samples)} ({normal_correct/len(normal_samples)*100:.1f}%)")
    print(f"   Anormal: {anormal_correct}/{len(anormal_samples)} ({anormal_correct/len(anormal_samples)*100:.1f}%)")

except Exception as e:
    print(f"⚠️ Não foi possível carregar dados de teste: {e}")

# ===================================================================
# TESTE 2: Dados sintéticos típicos
# ===================================================================
print("\n" + "="*70)
print("TESTE 2: DADOS SINTÉTICOS")
print("="*70)

# Normal típico (valores próximos da média, baixa energia)
print("\n📊 Teste com Normal típico (baixa energia):")
normal_typical = scaler_mean.copy()
normal_typical[0] -= 50  # Energia mais baixa que média
normalized = normalize(normal_typical)
pred = model.predict(normalized.reshape(1, -1), verbose=0)[0][0]
result = "✅ Normal" if pred <= threshold else "❌ Anormal"
print(f"   Input: [{normal_typical[0]:.2f}, {normal_typical[1]:.2f}, ...]")
print(f"   Predição: {pred:.4f} → {result}")

# Anormal típico (energia alta, MFCCs diferentes)
print("\n📊 Teste com Anormal típico (alta energia):")
anormal_typical = scaler_mean.copy()
anormal_typical[0] += 100  # Energia mais alta
anormal_typical[1:] += 20  # Outros coeficientes alterados
normalized = normalize(anormal_typical)
pred = model.predict(normalized.reshape(1, -1), verbose=0)[0][0]
result = "✅ Anormal" if pred > threshold else "❌ Normal"
print(f"   Input: [{anormal_typical[0]:.2f}, {anormal_typical[1]:.2f}, ...]")
print(f"   Predição: {pred:.4f} → {result}")

# ===================================================================
# TESTE 3: Range de predições
# ===================================================================
print("\n" + "="*70)
print("TESTE 3: DISTRIBUIÇÃO DE PREDIÇÕES NO DATASET COMPLETO")
print("="*70)

try:
    # Predições em todo o dataset
    X_all_norm = normalize(X_test)
    y_pred_all = model.predict(X_all_norm, verbose=0).flatten()
    
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
    
    # Verificar se modelo está saturado
    very_low = (y_pred_all < 0.1).sum()
    very_high = (y_pred_all > 0.9).sum()
    
    print(f"\n⚠️ Análise de saturação:")
    print(f"   Predições < 0.1: {very_low} ({very_low/len(y_pred_all)*100:.1f}%)")
    print(f"   Predições > 0.9: {very_high} ({very_high/len(y_pred_all)*100:.1f}%)")
    
    if very_high > len(y_pred_all) * 0.5:
        print(f"   ❌ MODELO SATURADO! Mais de 50% das predições > 0.9")
        print(f"   Isso indica viés severo para ANORMAL")
    elif very_low > len(y_pred_all) * 0.5:
        print(f"   ❌ MODELO SATURADO! Mais de 50% das predições < 0.1")
        print(f"   Isso indica viés severo para NORMAL")
    else:
        print(f"   ✅ Modelo não saturado")

except Exception as e:
    print(f"⚠️ Erro no teste 3: {e}")

print("\n" + "="*70)
print("FIM DOS TESTES")
print("="*70)
