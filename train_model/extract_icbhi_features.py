# ===================================================================
# EXTRAÇÃO DE FEATURES - ICBHI RESPIRATORY SOUND DATABASE
# Dataset de alta qualidade com sons de estetoscópio
# ===================================================================

import numpy as np
import os
import librosa
from collections import Counter
from scipy.fftpack import dct

print("="*70)
print("PROCESSAMENTO ICBHI RESPIRATORY SOUND DATABASE")
print("="*70)

# Configurações
DATASET_PATH = r"C:\Users\USER\Downloads\Respiratory_Sound_Database\Respiratory_Sound_Database"
OUTPUT_PATH = r"C:\Users\USER\tosse\train_model\processed_icbhi_data"
SAMPLE_RATE = 22050
N_MFCC = 13

# Criar pasta de saída
os.makedirs(OUTPUT_PATH, exist_ok=True)

print(f"\n📁 Dataset path: {DATASET_PATH}")
print(f"📁 Output path: {OUTPUT_PATH}")

# ===================================================================
# FUNÇÃO DE EXTRAÇÃO DE MFCC (IDÊNTICA À EDGE FUNCTION)
# ===================================================================

def extract_mfcc_librosa_compatible(audio_path):
    """
    Extrai MFCCs de forma compatível com a Edge Function
    Usa mesma metodologia: FFT + Mel + DCT-II 'ortho'
    """
    try:
        # Carregar áudio
        y, sr = librosa.load(audio_path, sr=SAMPLE_RATE, mono=True)
        
        # Extrair MFCCs com parâmetros compatíveis
        # norm='ortho' garante compatibilidade com Edge Function
        mfccs = librosa.feature.mfcc(
            y=y, 
            sr=sr, 
            n_mfcc=N_MFCC,
            n_fft=2048,
            hop_length=512,
            dct_type=2,
            norm='ortho'  # CRÍTICO: mesmo da Edge Function
        )
        
        # Média temporal (colapsa para 13 valores)
        mfcc_mean = np.mean(mfccs, axis=1)
        
        return mfcc_mean
    except Exception as e:
        print(f"⚠️ Erro ao processar {audio_path}: {e}")
        return None

# ===================================================================
# CARREGAR METADADOS DO PACIENTE
# ===================================================================

print("\n📋 Carregando diagnósticos dos pacientes...")

# O ICBHI usa um arquivo patient_diagnosis.txt ou anotações nos .txt
# Cada arquivo .txt contém: start_time end_time crackles wheezes
# Vamos usar presença de crackles/wheezes para classificar

# Mapear baseado em anotações:
# - Crackles (1 na 3ª coluna) = Pneumonia (característica de consolidação)
# - Wheezes (1 na 4ª coluna) = Bronquite (obstrucãão das vias aéreas)
# - Nenhum (0, 0) = Normal
# - Ambos (1, 1) = Pneumonia (mais grave)

# ===================================================================
# PROCESSAR ÁUDIOS
# ===================================================================

print("\n🎵 Processando arquivos de áudio...")

features = []
labels = []
file_info = []

# Mapear diagnósticos para classes baseado em anotações
def get_class_from_annotations(annotation_file):
    """
    Lê arquivo de anotação e retorna classe baseada em crackles/wheezes
    Formato: start_time end_time crackles wheezes
    """
    if not os.path.exists(annotation_file):
        return None
    
    has_crackles = False
    has_wheezes = False
    
    try:
        with open(annotation_file, 'r') as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 4:
                    crackles = int(parts[2])
                    wheezes = int(parts[3])
                    
                    if crackles == 1:
                        has_crackles = True
                    if wheezes == 1:
                        has_wheezes = True
    except:
        return None
    
    # Classificação baseada em sintomas:
    # Crackles = Pneumonia (sons de estalo, líquido nos pulmões)
    # Wheezes = Bronquite (sibilos, obstrução)
    # Ambos = Pneumonia (mais grave)
    # Nenhum = Normal
    
    if has_crackles:
        return 2  # Pneumonia
    elif has_wheezes:
        return 0  # Bronquite
    else:
        return 1  # Normal

# Buscar todos os arquivos .wav
wav_files = []
for root, dirs, files in os.walk(DATASET_PATH):
    for file in files:
        if file.endswith('.wav'):
            wav_files.append(os.path.join(root, file))

print(f"📊 Total de arquivos encontrados: {len(wav_files)}")

# Processar cada arquivo
processed_count = 0
skipped_count = 0

for wav_path in wav_files:
    # Extrair nome base sem extensão
    filename = os.path.basename(wav_path)
    base_name = filename.replace('.wav', '')
    
    # Buscar arquivo de anotação correspondente
    annotation_file = wav_path.replace('.wav', '.txt')
    
    # Obter classe baseada em anotações
    class_label = get_class_from_annotations(annotation_file)
    
    if class_label is None:
        # Pular áudios sem anotação
        skipped_count += 1
        continue
    
    # Extrair MFCCs
    mfcc = extract_mfcc_librosa_compatible(wav_path)
    
    if mfcc is not None:
        features.append(mfcc)
        labels.append(class_label)
        
        class_name = ['Bronquite', 'Normal', 'Pneumonia'][class_label]
        file_info.append({
            'file': filename,
            'class': class_label,
            'class_name': class_name
        })
        processed_count += 1
        
        if processed_count % 100 == 0:
            print(f"   Processados: {processed_count}/{len(wav_files)}")

print(f"\n✅ Processamento concluído!")
print(f"   Áudios processados: {processed_count}")
print(f"   Áudios pulados: {skipped_count}")

# ===================================================================
# SALVAR DADOS
# ===================================================================

X = np.array(features)
y = np.array(labels)

print(f"\n📊 Estatísticas finais:")
print(f"   X shape: {X.shape}")
print(f"   y shape: {y.shape}")
print(f"   Distribuição de classes: {Counter(y)}")
print(f"     0 (Bronquite): {np.sum(y==0)}")
print(f"     1 (Normal): {np.sum(y==1)}")
print(f"     2 (Pneumonia): {np.sum(y==2)}")

# Salvar arrays
np.save(os.path.join(OUTPUT_PATH, 'X.npy'), X)
np.save(os.path.join(OUTPUT_PATH, 'y.npy'), y)

# Salvar informações dos arquivos
import json
with open(os.path.join(OUTPUT_PATH, 'file_info.json'), 'w') as f:
    json.dump(file_info, f, indent=2)

print(f"\n💾 Dados salvos em: {OUTPUT_PATH}")
print(f"   - X.npy: {X.shape}")
print(f"   - y.npy: {y.shape}")
print(f"   - file_info.json: {len(file_info)} registros")

# ===================================================================
# ANÁLISE DE QUALIDADE DOS DADOS
# ===================================================================

print("\n" + "="*70)
print("📊 ANÁLISE DE QUALIDADE")
print("="*70)

from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from scipy.spatial.distance import euclidean

# Normalizar
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# PCA
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

print(f"\nVariância explicada (PCA 2D): {pca.explained_variance_ratio_.sum()*100:.1f}%")

# Distâncias entre classes
class_means = []
for class_id in [0, 1, 2]:
    if np.sum(y == class_id) > 0:
        class_means.append(X[y == class_id].mean(axis=0))
    else:
        class_means.append(None)

print("\nDistâncias entre classes:")
class_names = ['Bronquite', 'Normal', 'Pneumonia']
for i in range(3):
    for j in range(i+1, 3):
        if class_means[i] is not None and class_means[j] is not None:
            dist = euclidean(class_means[i], class_means[j])
            print(f"  {class_names[i]} <-> {class_names[j]}: {dist:.2f}")

# Estatísticas por classe
print("\nEstatísticas por classe (MFCC[0] - energia):")
for class_id, class_name in enumerate(class_names):
    if np.sum(y == class_id) > 0:
        X_class = X[y == class_id]
        print(f"  {class_name}: mean={X_class[:, 0].mean():.2f}, std={X_class[:, 0].std():.2f}")

print("\n" + "="*70)
print("✅ PROCESSAMENTO CONCLUÍDO!")
print("="*70)
print(f"\n📤 Próximos passos:")
print(f"1. Fazer upload de X.npy e y.npy para o Google Colab")
print(f"2. Executar script de treino otimizado")
print(f"3. Comparar métricas com modelo COUGHVID")
print("\n" + "="*70)
