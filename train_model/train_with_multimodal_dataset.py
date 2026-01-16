"""
Script para treinar modelo com o dataset multimodal de tosse
Dataset: Audio-IMU multimodal cough dataset using wearables
https://doi.org/10.5061/dryad.mkkwh717r

Este script processa o dataset e treina um modelo para classificação de tosse.
"""

import os
import json
import numpy as np
import librosa
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.utils.class_weight import compute_class_weight
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import warnings
warnings.filterwarnings('ignore')

# Configurações
SAMPLE_RATE = 16000  # Taxa de amostragem padrão
DURATION = 3.0  # Duração em segundos para cada segmento
HOP_LENGTH = 512
N_MELS = 40
N_MFCC = 13
MAX_LEN = int(SAMPLE_RATE * DURATION)

def load_audio_file(file_path, sr=SAMPLE_RATE):
    """Carrega arquivo de áudio e retorna o sinal"""
    try:
        y, sr = librosa.load(file_path, sr=sr, duration=DURATION)
        # Preenche ou corta para ter exatamente MAX_LEN amostras
        if len(y) < MAX_LEN:
            y = np.pad(y, (0, MAX_LEN - len(y)), mode='constant')
        else:
            y = y[:MAX_LEN]
        return y, sr
    except Exception as e:
        print(f"Erro ao carregar {file_path}: {e}")
        return None, None

def extract_mfcc_features(audio, sr=SAMPLE_RATE, n_mfcc=N_MFCC):
    """Extrai features MFCC do áudio"""
    try:
        # Extrai MFCC
        mfccs = librosa.feature.mfcc(
            y=audio, 
            sr=sr, 
            n_mfcc=n_mfcc,
            n_mels=N_MELS,
            hop_length=HOP_LENGTH
        )
        # Calcula média ao longo do tempo para ter um vetor fixo
        mfccs_mean = np.mean(mfccs, axis=1)
        return mfccs_mean
    except Exception as e:
        print(f"Erro ao extrair MFCC: {e}")
        return None

def load_annotations(annotation_file):
    """Carrega as anotações do dataset"""
    with open(annotation_file, 'r') as f:
        annotations = json.load(f)
    return annotations

def process_dataset(dataset_path):
    """
    Processa o dataset multimodal de tosse
    
    Estrutura esperada:
    MultimodalCoughDataset/
    ├── DataAnnotation.json
    ├── 005/
    │   ├── Trial_1_No_Talking/
    │   │   ├── 005_Talking_In.wav
    │   │   └── 005_Talking_Out.wav
    │   └── sync_time.txt
    └── ...
    """
    print("📂 Carregando dataset...")
    
    annotation_file = os.path.join(dataset_path, 'DataAnnotation.json')
    if not os.path.exists(annotation_file):
        print(f"❌ Arquivo de anotações não encontrado: {annotation_file}")
        return None, None
    
    # Carrega anotações
    annotations = load_annotations(annotation_file)
    print(f"✅ Carregadas {len(annotations)} anotações")
    
    features = []
    labels = []
    
    # Processa cada anotação
    for annotation in annotations:
        try:
            # Extrai informações da anotação
            label = annotation.get('label', '').lower()
            file_path = annotation.get('file_path', '')
            start_time = annotation.get('start_time', 0)
            end_time = annotation.get('end_time', 0)
            
            # Filtra apenas tosse (cough) para começar
            # Você pode expandir para outras classes depois
            if 'cough' not in label:
                continue
            
            # Constrói caminho completo do arquivo
            full_path = os.path.join(dataset_path, file_path)
            if not os.path.exists(full_path):
                # Tenta com _In.wav ou _Out.wav
                base_path = full_path.replace('_In.wav', '').replace('_Out.wav', '')
                in_path = base_path + '_In.wav'
                out_path = base_path + '_Out.wav'
                
                if os.path.exists(in_path):
                    full_path = in_path
                elif os.path.exists(out_path):
                    full_path = out_path
                else:
                    continue
            
            # Carrega áudio
            audio, sr = load_audio_file(full_path)
            if audio is None:
                continue
            
            # Extrai features
            mfcc_features = extract_mfcc_features(audio, sr)
            if mfcc_features is None:
                continue
            
            # Para este exemplo, vamos classificar como "pneumonia" se for tosse
            # Você pode adaptar isso baseado nas labels reais do dataset
            # Por enquanto, vamos usar apenas "cough" como classe positiva
            features.append(mfcc_features)
            labels.append('cough')
            
        except Exception as e:
            print(f"⚠️ Erro ao processar anotação: {e}")
            continue
    
    print(f"✅ Processados {len(features)} exemplos")
    return np.array(features), np.array(labels)

def create_synthetic_labels(features, labels):
    """
    Cria labels sintéticas para normal, bronchitis e pneumonia
    baseado nas características do áudio
    """
    print("🔄 Criando labels sintéticas...")
    
    # Para este exemplo, vamos usar heurísticas simples
    # Em produção, você precisaria de labels médicas reais
    
    new_labels = []
    for i, feature in enumerate(features):
        # Heurística simples baseada em características MFCC
        # Valores mais altos em certas frequências podem indicar diferentes condições
        
        # Calcula energia em diferentes bandas de frequência
        energy_low = np.mean(feature[:4])  # Baixas frequências
        energy_mid = np.mean(feature[4:8])  # Médias frequências
        energy_high = np.mean(feature[8:])  # Altas frequências
        
        # Classificação heurística (você deve substituir por labels reais)
        if energy_high > 0.5:
            new_labels.append('pneumonia')
        elif energy_mid > 0.3:
            new_labels.append('bronchitis')
        else:
            new_labels.append('normal')
    
    return np.array(new_labels)

def train_model(X_train, y_train, X_val, y_val, num_classes=3):
    """Treina o modelo de classificação"""
    print("🤖 Treinando modelo...")
    
    # Normaliza features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    
    # Calcula pesos das classes para balanceamento
    class_weights = compute_class_weight(
        'balanced',
        classes=np.unique(y_train),
        y=y_train
    )
    class_weight_dict = {i: weight for i, weight in enumerate(class_weights)}
    
    # Cria modelo
    model = keras.Sequential([
        layers.Dense(128, activation='relu', input_shape=(X_train_scaled.shape[1],)),
        layers.Dropout(0.3),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(32, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # Callbacks
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7
        )
    ]
    
    # Treina modelo
    history = model.fit(
        X_train_scaled, y_train,
        validation_data=(X_val_scaled, y_val),
        epochs=100,
        batch_size=32,
        class_weight=class_weight_dict,
        callbacks=callbacks,
        verbose=1
    )
    
    return model, scaler, history

def main():
    """Função principal"""
    print("=" * 60)
    print("🚀 Treinamento com Dataset Multimodal de Tosse")
    print("=" * 60)
    
    # Caminho do dataset (ajuste conforme necessário)
    dataset_path = input("Digite o caminho para o dataset MultimodalCoughDataset: ").strip()
    
    if not os.path.exists(dataset_path):
        print(f"❌ Caminho não encontrado: {dataset_path}")
        return
    
    # Processa dataset
    features, labels = process_dataset(dataset_path)
    
    if features is None or len(features) == 0:
        print("❌ Nenhum dado processado. Verifique o caminho do dataset.")
        return
    
    # Cria labels sintéticas (substitua por labels reais se disponíveis)
    labels = create_synthetic_labels(features, labels)
    
    # Codifica labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(labels)
    
    print(f"\n📊 Distribuição de classes:")
    unique, counts = np.unique(labels, return_counts=True)
    for label, count in zip(unique, counts):
        print(f"  {label}: {count}")
    
    # Divide dados
    X_train, X_test, y_train, y_test = train_test_split(
        features, y_encoded,
        test_size=0.2,
        random_state=42,
        stratify=y_encoded
    )
    
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train,
        test_size=0.2,
        random_state=42,
        stratify=y_train
    )
    
    print(f"\n📦 Divisão dos dados:")
    print(f"  Treino: {len(X_train)}")
    print(f"  Validação: {len(X_val)}")
    print(f"  Teste: {len(X_test)}")
    
    # Treina modelo
    num_classes = len(np.unique(y_encoded))
    model, scaler, history = train_model(X_train, y_train, X_val, y_val, num_classes)
    
    # Avalia no conjunto de teste
    X_test_scaled = scaler.transform(X_test)
    test_loss, test_accuracy = model.evaluate(X_test_scaled, y_test, verbose=0)
    print(f"\n✅ Acurácia no teste: {test_accuracy:.4f}")
    
    # Salva modelo
    model_dir = 'trained_model'
    os.makedirs(model_dir, exist_ok=True)
    
    model_path = os.path.join(model_dir, 'cough_classifier.h5')
    scaler_path = os.path.join(model_dir, 'scaler.pkl')
    
    model.save(model_path)
    import pickle
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
    
    # Salva label encoder
    label_encoder_path = os.path.join(model_dir, 'label_encoder.pkl')
    with open(label_encoder_path, 'wb') as f:
        pickle.dump(label_encoder, f)
    
    print(f"\n💾 Modelo salvo em: {model_path}")
    print(f"💾 Scaler salvo em: {scaler_path}")
    print(f"💾 Label encoder salvo em: {label_encoder_path}")
    
    print("\n✅ Treinamento concluído!")

if __name__ == '__main__':
    main()

