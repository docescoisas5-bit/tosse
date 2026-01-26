"""
SCRIPT FINAL DE AVALIAÇÃO - GOOGLE COLAB
Este script gera a Matriz de Confusão e a Curva ROC usando os dados reais do Kaggle.
"""

# CÉLULA 1: Instalação de dependências
# !pip install "numpy<2.0" "tensorflow==2.15.0" "keras==2.15.0" "tensorflow-model-optimization==0.8.0" scikit-learn matplotlib seaborn pandas -q

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, roc_curve, auc, accuracy_score
from sklearn.preprocessing import label_binarize
import tensorflow as tf
from tensorflow import keras
from google.colab import files
import json
import pickle

# CÉLULA 2: Upload e Geração de Gráficos
def avaliar_modelo_final():
    print("Por favor, faça upload dos arquivos: kaggle_balanced_model.h5, kaggle_model_info.json, X_test.npy, y_test.npy")
    uploaded = files.upload()

    # Carregar metadados
    with open('kaggle_model_info.json', 'r') as f:
        info = json.load(f)

    scaler_mean = np.array(info['normalization_params']['mean'])
    scaler_std = np.array(info['normalization_params']['std'])
    class_names = info['classes']

    # Carregar Modelo e Dados
    model = keras.models.load_model('kaggle_balanced_model.h5')
    X_test = np.load('X_test.npy')
    y_test = np.load('y_test.npy')

    # Normalizar e Predizer
    X_test_norm = (X_test - scaler_mean) / scaler_std
    y_pred_proba = model.predict(X_test_norm)
    y_pred = np.argmax(y_pred_proba, axis=1)

    # 1. Matriz de Confusão
    cm = confusion_matrix(y_test, y_pred)
    cm_norm = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm_norm, annot=True, fmt='.2%', cmap='Blues', xticklabels=class_names, yticklabels=class_names)
    plt.title('Matriz de Confusão REAL (Dataset Kaggle)', fontsize=16, fontweight='bold')
    plt.show()

    # 2. Curvas ROC
    y_test_bin = label_binarize(y_test, classes=[0, 1, 2])
    plt.figure(figsize=(12, 8))
    for i in range(3):
        fpr, tpr, _ = roc_curve(y_test_bin[:, i], y_pred_proba[:, i])
        plt.plot(fpr, tpr, lw=3, label=f'{class_names[i]} (AUC = {auc(fpr, tpr):.3f})')
    plt.plot([0, 1], [0, 1], 'k--')
    plt.title('Curvas ROC REAIS - Desempenho Clínico', fontsize=16, fontweight='bold')
    plt.legend()
    plt.show()

    print(f"\n✅ Acurácia Real: {accuracy_score(y_test, y_pred)*100:.2f}%")

if __name__ == "__main__":
    avaliar_modelo_final()
