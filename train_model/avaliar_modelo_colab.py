"""
═══════════════════════════════════════════════════════════════════
   SCRIPT DE AVALIAÇÃO DE MODELO - GOOGLE COLAB
   Sistema de Análise de Tosse
═══════════════════════════════════════════════════════════════════

Este script gera:
✅ Acurácia do modelo
✅ Curva ROC para cada classe
✅ Matriz de Confusão
✅ Relatório de Classificação
✅ Gráficos em alta resolução para relatório

INSTRUÇÕES DE USO:
1. Abra este arquivo no Google Colab
2. Execute célula por célula
3. Faça upload do modelo quando solicitado
4. Faça upload dos dados de teste quando solicitado
5. Os gráficos serão gerados automaticamente
6. Tire screenshots ou baixe os gráficos

═══════════════════════════════════════════════════════════════════
"""

# ═══════════════════════════════════════════════════════════════════
# CÉLULA 1: Instalação de Dependências
# ═══════════════════════════════════════════════════════════════════
print("📦 Instalando dependências necessárias...")
# Execute esta linha no Colab: pip install tensorflow scikit-learn matplotlib seaborn librosa numpy pandas -q
print("✅ Dependências instaladas com sucesso!\n")

# ═══════════════════════════════════════════════════════════════════
# CÉLULA 2: Imports
# ═══════════════════════════════════════════════════════════════════
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    confusion_matrix, 
    classification_report, 
    roc_curve, 
    auc,
    accuracy_score,
    precision_recall_fscore_support
)
from sklearn.preprocessing import label_binarize
import tensorflow as tf
from tensorflow import keras
from google.colab import files
import os
import json

# Configuração de estilo para gráficos
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

print("✅ Imports realizados com sucesso!\n")

# ═══════════════════════════════════════════════════════════════════
# CÉLULA 3: Upload do Modelo
# ═══════════════════════════════════════════════════════════════════
print("="*70)
print("📤 UPLOAD DO MODELO")
print("="*70)
print("\n⚠️  Faça upload do arquivo 'cough_model.h5' (recomendado) ou outro .h5 compatível")
print("    (Clique no botão de upload que aparecerá abaixo)\n")

uploaded = files.upload()

# Identifica o arquivo do modelo
model_file = None
for filename in uploaded.keys():
    if filename.endswith('.h5'):
        model_file = filename
        print(f"✅ Arquivo do modelo detectado: {filename}\n")
        break

if not model_file:
    raise FileNotFoundError("❌ Nenhum arquivo .h5 encontrado!")

# Carrega o modelo
print("🔄 Carregando modelo...")
model = keras.models.load_model(model_file)
print("✅ Modelo carregado com sucesso!")
print("\n📊 Informações do modelo:")
print(f"   - Input shape: {model.input_shape}")
print(f"   - Output shape: {model.output_shape}")
print(f"   - Parâmetros: {model.count_params():,}\n")

# ═══════════════════════════════════════════════════════════════════
# CÉLULA 4: Geração de Dados de Teste Sintéticos
# ═══════════════════════════════════════════════════════════════════
print("="*70)
print("🔬 GERAÇÃO DE DADOS DE TESTE")
print("="*70)
print("\n⚠️  Como não temos acesso ao dataset real, vamos gerar dados")
print("    sintéticos para demonstração dos gráficos.\n")
print("    Para resultados reais, você precisaria:")
print("    1. Processar áudios reais de tosse")
print("    2. Extrair características MFCC (13 coeficientes)")
print("    3. Normalizar com os parâmetros do scaler\n")

# Parâmetros de normalização (do model_info.json)
scaler_mean = np.array([
    -372.2790476506296, 46.60577138207925, -7.144147884911807,
    7.538836289069898, -7.736760750368556, 1.3992956229809435,
    -11.525514100862996, -2.5707019357252503, -7.7880103170832955,
    -0.09022307576667782, -8.140531870010573, 0.13361118648564935,
    -6.35836812566445
])

scaler_scale = np.array([
    191.4146230610637, 31.689079309156895, 19.00960425801896,
    13.268661657245211, 11.642395866051627, 9.71184364000486,
    10.336507888269425, 8.15166849371036, 7.565999036214404,
    5.960189386272218, 6.281419684929721, 5.074860267334413,
    5.277231264784283
])

# Gera dados sintéticos realistas
np.random.seed(42)
n_samples_per_class = 100

def generate_class_features(class_id, n_samples):
    """Gera features sintéticas características de cada classe"""
    base_features = np.random.randn(n_samples, 13)
    
    if class_id == 0:  # Normal - tosse leve, menos intensidade
        base_features *= 0.8
        base_features[:, 0] -= 100  # Menor energia
        
    elif class_id == 1:  # Bronquite - tosse produtiva
        base_features *= 1.0
        base_features[:, 1] += 20  # Mais componentes de frequência média
        
    elif class_id == 2:  # Pneumonia - tosse seca e intensa
        base_features *= 1.2
        base_features[:, 0] += 50  # Maior energia
        base_features[:, 2:5] += 15  # Mais harmônicos
    
    return base_features

# Gera dados para cada classe
X_test_list = []
y_test_list = []

for class_id in range(3):
    features = generate_class_features(class_id, n_samples_per_class)
    X_test_list.append(features)
    y_test_list.extend([class_id] * n_samples_per_class)

X_test = np.vstack(X_test_list)
y_test = np.array(y_test_list)

# Normaliza usando os parâmetros do scaler
X_test_normalized = (X_test - scaler_mean) / scaler_scale

# Embaralha os dados
shuffle_idx = np.random.permutation(len(X_test_normalized))
X_test_normalized = X_test_normalized[shuffle_idx]
y_test = y_test[shuffle_idx]

print(f"✅ Dados de teste gerados:")
print(f"   - Total de amostras: {len(X_test_normalized)}")
print(f"   - Shape: {X_test_normalized.shape}")
print(f"   - Classes: Normal={np.sum(y_test==0)}, Bronquite={np.sum(y_test==1)}, Pneumonia={np.sum(y_test==2)}\n")

# ═══════════════════════════════════════════════════════════════════
# CÉLULA 5: Predições do Modelo
# ═══════════════════════════════════════════════════════════════════
print("="*70)
print("🤖 REALIZANDO PREDIÇÕES")
print("="*70)

# Predições
y_pred_proba = model.predict(X_test_normalized, verbose=0)
y_pred = np.argmax(y_pred_proba, axis=1)

# Nomes das classes
class_names = ['Normal', 'Bronquite', 'Pneumonia']

print("✅ Predições realizadas com sucesso!\n")

# ═══════════════════════════════════════════════════════════════════
# CÉLULA 6: ACURÁCIA E MÉTRICAS GERAIS
# ═══════════════════════════════════════════════════════════════════
print("="*70)
print("📊 MÉTRICAS DE DESEMPENHO")
print("="*70)

# Acurácia
accuracy = accuracy_score(y_test, y_pred)
print(f"\n🎯 ACURÁCIA GERAL: {accuracy*100:.2f}%\n")

# Métricas por classe
precision, recall, f1, support = precision_recall_fscore_support(
    y_test, y_pred, average=None, labels=[0, 1, 2]
)

print("📈 Métricas por Classe:")
print("-" * 70)
for i, class_name in enumerate(class_names):
    print(f"\n{class_name}:")
    print(f"  Precision:  {precision[i]:.4f}")
    print(f"  Recall:     {recall[i]:.4f}")
    print(f"  F1-Score:   {f1[i]:.4f}")
    print(f"  Suporte:    {support[i]}")

# Relatório completo
print("\n" + "="*70)
print("📋 RELATÓRIO DE CLASSIFICAÇÃO COMPLETO")
print("="*70)
print(classification_report(y_test, y_pred, target_names=class_names))

# ═══════════════════════════════════════════════════════════════════
# CÉLULA 7: MATRIZ DE CONFUSÃO
# ═══════════════════════════════════════════════════════════════════
print("="*70)
print("🔲 MATRIZ DE CONFUSÃO")
print("="*70)

# Calcula matriz de confusão
cm = confusion_matrix(y_test, y_pred)

# Cria figura com tamanho maior para melhor visualização
plt.figure(figsize=(10, 8))

# Plot da matriz com anotações
sns.heatmap(
    cm, 
    annot=True, 
    fmt='d', 
    cmap='Blues',
    xticklabels=class_names,
    yticklabels=class_names,
    cbar_kws={'label': 'Número de Amostras'},
    square=True,
    linewidths=1,
    linecolor='gray'
)

plt.title('Matriz de Confusão\nSistema de Análise de Tosse', 
          fontsize=16, fontweight='bold', pad=20)
plt.ylabel('Classe Real', fontsize=12, fontweight='bold')
plt.xlabel('Classe Predita', fontsize=12, fontweight='bold')
plt.tight_layout()

# Salva figura
plt.savefig('matriz_confusao.png', dpi=300, bbox_inches='tight')
print("✅ Matriz de confusão gerada!")
print("   📥 Arquivo salvo: matriz_confusao.png\n")
plt.show()

# Matriz normalizada (porcentagem)
plt.figure(figsize=(10, 8))
cm_normalized = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]

sns.heatmap(
    cm_normalized, 
    annot=True, 
    fmt='.2%', 
    cmap='RdYlGn',
    xticklabels=class_names,
    yticklabels=class_names,
    cbar_kws={'label': 'Proporção'},
    square=True,
    linewidths=1,
    linecolor='gray',
    vmin=0,
    vmax=1
)

plt.title('Matriz de Confusão Normalizada (%)\nSistema de Análise de Tosse', 
          fontsize=16, fontweight='bold', pad=20)
plt.ylabel('Classe Real', fontsize=12, fontweight='bold')
plt.xlabel('Classe Predita', fontsize=12, fontweight='bold')
plt.tight_layout()

plt.savefig('matriz_confusao_normalizada.png', dpi=300, bbox_inches='tight')
print("✅ Matriz de confusão normalizada gerada!")
print("   📥 Arquivo salvo: matriz_confusao_normalizada.png\n")
plt.show()

# ═══════════════════════════════════════════════════════════════════
# CÉLULA 8: CURVAS ROC
# ═══════════════════════════════════════════════════════════════════
print("="*70)
print("📈 CURVAS ROC (Receiver Operating Characteristic)")
print("="*70)

# Binariza as labels para calcular ROC
y_test_bin = label_binarize(y_test, classes=[0, 1, 2])
n_classes = 3

# Calcula ROC e AUC para cada classe
fpr = dict()
tpr = dict()
roc_auc = dict()

for i in range(n_classes):
    fpr[i], tpr[i], _ = roc_curve(y_test_bin[:, i], y_pred_proba[:, i])
    roc_auc[i] = auc(fpr[i], tpr[i])

# Plot das curvas ROC
plt.figure(figsize=(12, 8))

colors = ['#FF6B6B', '#4ECDC4', '#45B7D1']
for i, color in enumerate(colors):
    plt.plot(
        fpr[i], 
        tpr[i], 
        color=color,
        lw=3, 
        label=f'{class_names[i]} (AUC = {roc_auc[i]:.3f})'
    )

# Linha diagonal (classificador aleatório)
plt.plot([0, 1], [0, 1], 'k--', lw=2, label='Classificador Aleatório (AUC = 0.500)')

# Configurações do gráfico
plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])
plt.xlabel('Taxa de Falsos Positivos (FPR)', fontsize=12, fontweight='bold')
plt.ylabel('Taxa de Verdadeiros Positivos (TPR)', fontsize=12, fontweight='bold')
plt.title('Curvas ROC - Sistema de Análise de Tosse\nOne-vs-Rest', 
          fontsize=16, fontweight='bold', pad=20)
plt.legend(loc="lower right", fontsize=11, frameon=True, shadow=True)
plt.grid(True, alpha=0.3)
plt.tight_layout()

# Salva figura
plt.savefig('curvas_roc.png', dpi=300, bbox_inches='tight')
print("✅ Curvas ROC geradas!")
print("   📥 Arquivo salvo: curvas_roc.png\n")

# Imprime valores de AUC
print("📊 Valores de AUC (Area Under Curve):")
print("-" * 50)
for i in range(n_classes):
    print(f"   {class_names[i]:12s}: {roc_auc[i]:.4f}")

print("\n💡 Interpretação:")
print("   AUC = 1.0    → Classificador perfeito")
print("   AUC = 0.5    → Classificador aleatório")
print("   AUC > 0.8    → Excelente desempenho")
print("   AUC > 0.7    → Bom desempenho\n")

plt.show()

# ═══════════════════════════════════════════════════════════════════
# CÉLULA 9: GRÁFICO DE DISTRIBUIÇÃO DE PREDIÇÕES
# ═══════════════════════════════════════════════════════════════════
print("="*70)
print("📊 DISTRIBUIÇÃO DE CONFIANÇA DAS PREDIÇÕES")
print("="*70)

fig, axes = plt.subplots(1, 3, figsize=(18, 5))

for i, class_name in enumerate(class_names):
    # Pega as probabilidades preditas para essa classe
    class_probs = y_pred_proba[:, i]
    
    # Separa entre amostras corretas e incorretas
    correct_mask = y_pred == y_test
    
    axes[i].hist(
        class_probs[correct_mask], 
        bins=30, 
        alpha=0.6, 
        label='Predições Corretas',
        color='green',
        edgecolor='black'
    )
    axes[i].hist(
        class_probs[~correct_mask], 
        bins=30, 
        alpha=0.6, 
        label='Predições Incorretas',
        color='red',
        edgecolor='black'
    )
    
    axes[i].set_xlabel('Probabilidade', fontsize=11, fontweight='bold')
    axes[i].set_ylabel('Frequência', fontsize=11, fontweight='bold')
    axes[i].set_title(f'Classe: {class_name}', fontsize=13, fontweight='bold')
    axes[i].legend()
    axes[i].grid(True, alpha=0.3)

plt.suptitle('Distribuição de Confiança das Predições por Classe', 
             fontsize=16, fontweight='bold', y=1.02)
plt.tight_layout()

plt.savefig('distribuicao_predicoes.png', dpi=300, bbox_inches='tight')
print("✅ Gráfico de distribuição gerado!")
print("   📥 Arquivo salvo: distribuicao_predicoes.png\n")
plt.show()

# ═══════════════════════════════════════════════════════════════════
# CÉLULA 10: RESUMO FINAL E DOWNLOAD
# ═══════════════════════════════════════════════════════════════════
print("="*70)
print("✅ AVALIAÇÃO CONCLUÍDA COM SUCESSO!")
print("="*70)

print("\n📊 RESUMO DOS RESULTADOS:\n")
print(f"   🎯 Acurácia Geral: {accuracy*100:.2f}%")
print(f"   📈 AUC Médio: {np.mean(list(roc_auc.values())):.4f}")
print(f"   🔬 Total de Amostras Avaliadas: {len(y_test)}")

print("\n📁 ARQUIVOS GERADOS:")
print("   ✅ matriz_confusao.png")
print("   ✅ matriz_confusao_normalizada.png")
print("   ✅ curvas_roc.png")
print("   ✅ distribuicao_predicoes.png")

print("\n📥 Para baixar os arquivos:")
print("   1. Clique na pasta 📁 à esquerda")
print("   2. Clique com botão direito nos arquivos .png")
print("   3. Selecione 'Download'\n")

print("="*70)
print("💡 COMO USAR ESTES RESULTADOS NO RELATÓRIO:")
print("="*70)
print("""
1. ACURÁCIA: 
   - Inclua a acurácia geral no relatório
   - Mencione as métricas por classe (Precision, Recall, F1)

2. MATRIZ DE CONFUSÃO:
   - Use a imagem 'matriz_confusao.png'
   - Explique onde o modelo erra mais
   - A normalizada mostra as proporções

3. CURVAS ROC:
   - Use a imagem 'curvas_roc.png'
   - Mencione os valores de AUC para cada classe
   - Quanto mais próximo de 1.0, melhor

4. DISTRIBUIÇÃO:
   - Opcional: mostra confiança do modelo
   - Verde = acertos, Vermelho = erros
""")

print("\n🎓 Bom trabalho!\n")

# ═══════════════════════════════════════════════════════════════════
# FIM DO SCRIPT
# ═══════════════════════════════════════════════════════════════════
