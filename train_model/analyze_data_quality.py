# ===================================================================
# ANÁLISE DE QUALIDADE DOS DADOS - COUGHVID
# Execute no Google Colab ou localmente
# ===================================================================

import numpy as np
from collections import Counter
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE

print("="*70)
print("ANÁLISE DE QUALIDADE DOS DADOS")
print("="*70)

# Carregar dados
print("\n📥 Carregando dados...")
X = np.load('X.npy')
y = np.load('y.npy')

print(f"✅ X shape: {X.shape}")
print(f"✅ y shape: {y.shape}")
print(f"📊 Distribuição de classes: {Counter(y)}")

# 1. Verificar valores NaN ou Inf
print("\n" + "="*70)
print("🔍 VERIFICANDO VALORES INVÁLIDOS")
print("="*70)
nan_count = np.isnan(X).sum()
inf_count = np.isinf(X).sum()
print(f"NaN values: {nan_count}")
print(f"Inf values: {inf_count}")

if nan_count > 0 or inf_count > 0:
    print("⚠️ ALERTA: Dados contêm valores inválidos!")
    print("   Isso pode causar problemas no treinamento.")

# 2. Estatísticas por classe
print("\n" + "="*70)
print("📊 ESTATÍSTICAS POR CLASSE")
print("="*70)

for class_id, class_name in enumerate(['Bronquite', 'Normal', 'Pneumonia']):
    X_class = X[y == class_id]
    print(f"\n{class_name} (n={len(X_class)}):")
    print(f"  Mean MFCC[0]: {X_class[:, 0].mean():.2f} ± {X_class[:, 0].std():.2f}")
    print(f"  Min: {X_class.min():.2f}, Max: {X_class.max():.2f}")
    print(f"  Range: {X_class.max() - X_class.min():.2f}")

# 3. Verificar separabilidade com PCA
print("\n" + "="*70)
print("🔬 ANÁLISE DE SEPARABILIDADE (PCA)")
print("="*70)

from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

print(f"Variância explicada: {pca.explained_variance_ratio_}")
print(f"Variância total (2 componentes): {pca.explained_variance_ratio_.sum()*100:.1f}%")

# Plotar PCA
plt.figure(figsize=(10, 6))
colors = ['red', 'green', 'blue']
labels = ['Bronquite', 'Normal', 'Pneumonia']

for class_id, color, label in zip([0, 1, 2], colors, labels):
    mask = y == class_id
    plt.scatter(X_pca[mask, 0], X_pca[mask, 1], 
                c=color, label=label, alpha=0.5, s=30)

plt.xlabel('PC1')
plt.ylabel('PC2')
plt.title('PCA - Separabilidade das Classes')
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('pca_analysis.png', dpi=150, bbox_inches='tight')
print("\n✅ Gráfico PCA salvo: pca_analysis.png")

# 4. Calcular distâncias inter-classe
print("\n" + "="*70)
print("📏 DISTÂNCIAS ENTRE CLASSES")
print("="*70)

from scipy.spatial.distance import euclidean

class_means = []
for class_id in [0, 1, 2]:
    class_means.append(X[y == class_id].mean(axis=0))

for i, name_i in enumerate(['Bronquite', 'Normal', 'Pneumonia']):
    for j, name_j in enumerate(['Bronquite', 'Normal', 'Pneumonia']):
        if i < j:
            dist = euclidean(class_means[i], class_means[j])
            print(f"{name_i} <-> {name_j}: {dist:.2f}")

# 5. Avaliar overlap entre classes
print("\n" + "="*70)
print("⚠️ AVALIAÇÃO DE OVERLAP")
print("="*70)

# Calcular quantos pontos de cada classe estão "perto" de outras classes
from sklearn.neighbors import NearestNeighbors

knn = NearestNeighbors(n_neighbors=10)
knn.fit(X_scaled)

overlap_count = {0: 0, 1: 0, 2: 0}

for class_id in [0, 1, 2]:
    X_class = X_scaled[y == class_id]
    for point in X_class[:50]:  # Amostra de 50 pontos
        distances, indices = knn.kneighbors([point])
        neighbor_classes = y[indices[0]]
        # Se os vizinhos são de classes diferentes, há overlap
        if len(np.unique(neighbor_classes)) > 1:
            overlap_count[class_id] += 1

print("Pontos com overlap (de 50 amostras):")
for class_id, name in enumerate(['Bronquite', 'Normal', 'Pneumonia']):
    percentage = (overlap_count[class_id] / 50) * 100
    print(f"  {name}: {overlap_count[class_id]}/50 ({percentage:.1f}%)")
    if percentage > 70:
        print(f"    ⚠️ ALERTA: {name} tem muito overlap!")

# 6. Conclusão
print("\n" + "="*70)
print("📋 DIAGNÓSTICO FINAL")
print("="*70)

issues = []

if pca.explained_variance_ratio_.sum() < 0.8:
    issues.append("⚠️ PCA explica < 80% da variância (dados muito complexos)")

# Verificar se distâncias são muito pequenas
min_dist = float('inf')
for i in range(3):
    for j in range(i+1, 3):
        dist = euclidean(class_means[i], class_means[j])
        min_dist = min(min_dist, dist)

if min_dist < 50:
    issues.append(f"⚠️ Distância mínima entre classes é muito pequena ({min_dist:.2f})")

if any(overlap_count[i] > 35 for i in [0, 1, 2]):
    issues.append("⚠️ Overlap alto entre classes (> 70%)")

if issues:
    print("\n❌ PROBLEMAS ENCONTRADOS:")
    for issue in issues:
        print(f"  {issue}")
    print("\n💡 RECOMENDAÇÕES:")
    print("  1. Usar dataset diferente (ex: ESC-50, AudioSet)")
    print("  2. Extrair mais features (Delta-MFCCs, Spectral features)")
    print("  3. Usar modelos mais complexos (CNN, Transformers)")
else:
    print("\n✅ Dados parecem adequados para treinamento")

print("\n" + "="*70)
print("Análise concluída! Verifique o gráfico PCA.")
print("="*70)
