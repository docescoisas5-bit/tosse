# ===================================================================
# EXTRAÇÃO BINÁRIA - ICBHI (NORMAL vs ANORMAL)
# Classificação simplificada e clinicamente útil
# ===================================================================

import numpy as np
import os
from collections import Counter

print("="*70)
print("CONVERSÃO PARA CLASSIFICAÇÃO BINÁRIA")
print("="*70)

# Carregar dados processados
INPUT_PATH = r"C:\Users\USER\tosse\train_model\processed_icbhi_data"
OUTPUT_PATH = r"C:\Users\USER\tosse\train_model\processed_icbhi_binary"

os.makedirs(OUTPUT_PATH, exist_ok=True)

print(f"\n📥 Carregando dados de: {INPUT_PATH}")

X = np.load(os.path.join(INPUT_PATH, 'X.npy'))
y = np.load(os.path.join(INPUT_PATH, 'y.npy'))

print(f"✅ Dados carregados:")
print(f"   X shape: {X.shape}")
print(f"   y shape: {y.shape}")
print(f"\n📊 Distribuição original (3 classes):")
print(f"   0 (Bronquite): {np.sum(y==0)}")
print(f"   1 (Normal): {np.sum(y==1)}")
print(f"   2 (Pneumonia): {np.sum(y==2)}")

# Converter para binário:
# 0 = Normal
# 1 = Anormal (Bronquite ou Pneumonia)
y_binary = np.where(y == 1, 0, 1)

print(f"\n📊 Distribuição binária:")
print(f"   0 (Normal): {np.sum(y_binary==0)} ({np.sum(y_binary==0)/len(y_binary)*100:.1f}%)")
print(f"   1 (Anormal): {np.sum(y_binary==1)} ({np.sum(y_binary==1)/len(y_binary)*100:.1f}%)")

# Salvar
np.save(os.path.join(OUTPUT_PATH, 'X.npy'), X)
np.save(os.path.join(OUTPUT_PATH, 'y.npy'), y_binary)

print(f"\n💾 Dados binários salvos em: {OUTPUT_PATH}")
print(f"   - X.npy: {X.shape}")
print(f"   - y.npy: {y_binary.shape}")

# Análise rápida
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from scipy.spatial.distance import euclidean

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

print(f"\n📊 Análise de separabilidade:")
print(f"   Variância explicada (PCA 2D): {pca.explained_variance_ratio_.sum()*100:.1f}%")

# Distância entre classes
normal_mean = X[y_binary == 0].mean(axis=0)
anormal_mean = X[y_binary == 1].mean(axis=0)
dist = euclidean(normal_mean, anormal_mean)

print(f"   Distância Normal ↔ Anormal: {dist:.2f}")

if dist > 15:
    print(f"   ✅ Classes bem separadas! (distância > 15)")
else:
    print(f"   ⚠️ Classes próximas (distância < 15)")

print("\n" + "="*70)
print("✅ CONVERSÃO CONCLUÍDA!")
print("="*70)
print("\n📤 Próximos passos:")
print("1. Fazer upload de X.npy e y.npy para o Google Colab")
print("2. Executar treino com classificação binária")
print("3. Expectativa: 75-90% accuracy")
print("\n" + "="*70)
