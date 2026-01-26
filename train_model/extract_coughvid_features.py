import pandas as pd
import numpy as np
import librosa
import os
import subprocess
import json
from scipy.fftpack import dct as scipy_dct

# Configurações
CSV_PATH = r'C:\Users\USER\Downloads\archive\metadata_compiled.csv'
BASE_DIR = r'C:\Users\USER\Downloads\archive'
OUTPUT_DIR = r'c:\Users\USER\tosse\train_model\processed_coughvid_data'
SAMPLE_RATE = 16000
N_MFCC = 13

# Mapeamento de labels
MAPPING = {
    'healthy_cough': 1,      # Normal
    'lower_infection': 2,    # Pneumonia
    'obstructive_disease': 0 # Bronchitis
}

# Parâmetros MFCC (para bater com a Edge Function)
FFT_SIZE = 2048
HOP_LENGTH = 512
N_MELS = 40

def extract_features_like_js(audio_path):
    """
    Extrai MFCCs tentando emular a matemática da Edge Function
    """
    try:
        # Carrega áudio (librosa usa ffmpeg para webm)
        y, sr = librosa.load(audio_path, sr=SAMPLE_RATE, mono=True)
        
        # Emula o processamento do JS:
        # 1. FFT + Potência
        # No JS: power[i] = (real*real + imag*imag) / paddedSize
        S = np.abs(librosa.stft(y, n_fft=FFT_SIZE, hop_length=HOP_LENGTH, window='hann', center=False))**2
        S = S / FFT_SIZE # Normalização do FFT
        
        # 2. Banco de filtros Mel
        mel_basis = librosa.filters.mel(sr=SAMPLE_RATE, n_fft=FFT_SIZE, n_mels=N_MELS, fmin=0, fmax=SAMPLE_RATE/2)
        mel_spec = np.dot(mel_basis, S)
        
        # 3. Power to DB (10 * log10)
        mel_db = 10.0 * np.log10(np.maximum(mel_spec, 1e-10))
        
        # 4. DCT-II orthonorm
        # Usando scipy.fftpack.dct para garantir compatibilidade
        mfcc = scipy_dct(mel_db, type=2, axis=0, norm='ortho')[:N_MFCC]
        
        # 5. Média temporal
        mfcc_mean = np.mean(mfcc, axis=1)
        
        return mfcc_mean
    except Exception as e:
        print(f"Erro ao processar {audio_path}: {e}")
        return None

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    df = pd.read_csv(CSV_PATH)
    diagnosis_cols = [c for c in df.columns if 'diagnosis' in c]
    
    X = []
    y = []
    uuids = []
    
    print("Iniciando extração de características...")
    
    # Filtra e processa
    for idx, row in df.iterrows():
        if idx % 100 == 0:
            print(f"Processando {idx}/{df.shape[0]}...")
        uuid = row['uuid']
        
        # Identifica label (Prioridade: Bronquite > Pneumonia > Normal)
        labels_found = set()
        for col in diagnosis_cols:
            val = row[col]
            if val in MAPPING:
                labels_found.add(MAPPING[val])
        
        if not labels_found: continue
        
        if 0 in labels_found: target_label = 0
        elif 2 in labels_found: target_label = 2
        else: target_label = 1
        
        audio_path = os.path.join(BASE_DIR, f"{uuid}.webm")
        if os.path.exists(audio_path):
            features = extract_features_like_js(audio_path)
            if features is not None:
                X.append(features)
                y.append(target_label)
                uuids.append(uuid)

    X = np.array(X)
    y = np.array(y)
    
    print(f"\nExtração concluída!")
    print(f"Dataset Shape: {X.shape}")
    print(f"Distribuição de classes: {np.bincount(y)}")
    
    # Salva os dados
    np.save(os.path.join(OUTPUT_DIR, 'X.npy'), X)
    np.save(os.path.join(OUTPUT_DIR, 'y.npy'), y)
    
    # Salva metadados dos labels
    label_info = {
        '0': 'Bronchitis',
        '1': 'Normal',
        '2': 'Pneumonia'
    }
    with open(os.path.join(OUTPUT_DIR, 'labels.json'), 'w') as f:
        json.dump(label_info, f)
        
    print(f"Dados salvos em {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
