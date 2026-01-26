"""
Script para processar o dataset Respiratory Sound Database do Kaggle
Mapeia diagnósticos REAIS para as classes: Normal, Bronquite, Pneumonia
"""

import os
import pandas as pd
import numpy as np
import librosa
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import pickle

def extract_mfcc_features(audio_path, n_mfcc=13):
    """Extrai características MFCC de um arquivo de áudio"""
    try:
        # Carrega áudio (16kHz mono)
        y, sr = librosa.load(audio_path, sr=16000, mono=True)
        # Extrai MFCC
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
        # Média temporal
        mfcc_mean = np.mean(mfcc, axis=1)
        return mfcc_mean
    except Exception as e:
        print(f"Erro ao processar {audio_path}: {e}")
        return None

def main():
    # Caminhos do dataset do Kaggle
    base_path = r"C:\Users\USER\Downloads\Respiratory_Sound_Database\Respiratory_Sound_Database\Respiratory_Sound_Database"
    diagnosis_file = os.path.join(base_path, "patient_diagnosis.csv")
    audio_folder = os.path.join(base_path, "audio_and_txt_files")
    
    print(f"Lendo diagnósticos de: {diagnosis_file}")
    
    # Carrega diagnósticos (sem cabeçalho no arquivo do Kaggle)
    df_diag = pd.read_csv(diagnosis_file, header=None, names=['PatientID', 'Diagnosis'])
    
    # Mapeamento para nossas 3 classes
    # Healthy -> Normal
    # Pneumonia, LRTI -> Pneumonia
    # COPD, Bronchiolitis, URTI, Bronchiectasis, Asthma -> Bronquite
    mapping = {
        'Healthy': 'Normal',
        'Pneumonia': 'Pneumonia',
        'LRTI': 'Pneumonia',
        'COPD': 'Bronquite',
        'Bronchiolitis': 'Bronquite',
        'URTI': 'Bronquite',
        'Bronchiectasis': 'Bronquite',
        'Asthma': 'Bronquite'
    }
    
    df_diag['TargetClass'] = df_diag['Diagnosis'].map(mapping)
    print("\nDistribuição de Diagnósticos Reais por Paciente:")
    print(df_diag['Diagnosis'].value_counts())
    print("\nMapeamento para Classes do Projeto:")
    print(df_diag['TargetClass'].value_counts())
    
    # Dicionário para busca rápida: PatientID -> TargetClass
    patient_map = dict(zip(df_diag['PatientID'], df_diag['TargetClass']))
    
    X, y = [], []
    
    print("\nProcessando arquivos de áudio...")
    files = [f for f in os.listdir(audio_folder) if f.lower().endswith('.wav')]
    total = len(files)
    
    for i, filename in enumerate(files):
        # O nome do arquivo começa com o ID do paciente (ex: 101_...)
        try:
            patient_id = int(filename.split('_')[0])
            target = patient_map.get(patient_id)
            
            if target:
                audio_path = os.path.join(audio_folder, filename)
                features = extract_mfcc_features(audio_path)
                
                if features is not None:
                    X.append(features)
                    y.append(target)
            
            if (i + 1) % 100 == 0:
                print(f"Progresso: {i+1}/{total} arquivos processados")
                
        except Exception as e:
            continue

    X = np.array(X)
    y = np.array(y)
    
    print(f"\nTotal processado com sucesso: {len(X)}")
    unique, counts = np.unique(y, return_counts=True)
    print(f"Distribuição final das amostras: {dict(zip(unique, counts))}")
    
    # Codificação
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    
    # Salva
    output_dir = "processed_kaggle_data"
    os.makedirs(output_dir, exist_ok=True)
    
    np.save(os.path.join(output_dir, "X_train.npy"), X_train)
    np.save(os.path.join(output_dir, "X_test.npy"), X_test)
    np.save(os.path.join(output_dir, "y_train.npy"), y_train)
    np.save(os.path.join(output_dir, "y_test.npy"), y_test)
    
    with open(os.path.join(output_dir, "label_encoder.pkl"), "wb") as f:
        pickle.dump(le, f)
        
    print(f"\n✅ Dados salvos em: {output_dir}")
    print(f"Treino: {len(X_train)} | Teste: {len(X_test)}")
    print(f"Classes: {le.classes_}")

if __name__ == "__main__":
    main()
