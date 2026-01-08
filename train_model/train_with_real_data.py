"""
Script para treinar modelo de classificação de tosse com datasets reais
Suporta múltiplos datasets públicos e garante balanceamento de classes
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from pathlib import Path
import json
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import librosa
import warnings
warnings.filterwarnings('ignore')

# Configurações
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)
tf.random.set_seed(RANDOM_SEED)

# Parâmetros de áudio
SAMPLE_RATE = 16000
N_MFCC = 13
DURATION = 2.0  # segundos
HOP_LENGTH = 512
N_FFT = 2048

def download_datasets():
    """
    Instruções para baixar datasets reais
    Retorna lista de datasets disponíveis
    """
    datasets = {
        'coswara': {
            'url': 'https://github.com/iiscleap/Coswara-Data',
            'description': 'Dataset Coswara - Sons respiratórios com COVID-19',
            'instructions': 'Clone o repositório e organize os arquivos por classe'
        },
        'sound_dr': {
            'url': 'https://github.com/ankitaggarwal011/Sound-Dr',
            'description': 'Sound-Dr - Sons de tosse, respiração com pneumonia/COVID-19',
            'instructions': 'Baixe o dataset e organize por classe'
        },
        'coughvid': {
            'url': 'https://coughvid.epfl.ch/',
            'description': 'CoughVid - Dataset de tosse com COVID-19',
            'instructions': 'Registre-se e baixe o dataset'
        }
    }
    
    print("=" * 70)
    print("📦 DATASETS DISPONÍVEIS PARA TREINAMENTO")
    print("=" * 70)
    for name, info in datasets.items():
        print(f"\n🔹 {name.upper()}")
        print(f"   Descrição: {info['description']}")
        print(f"   URL: {info['url']}")
        print(f"   Instruções: {info['instructions']}")
    print("\n" + "=" * 70)
    
    return datasets

def load_audio_file(file_path, target_sr=SAMPLE_RATE, duration=DURATION):
    """
    Carrega arquivo de áudio e retorna array normalizado
    """
    try:
        # Carrega áudio
        audio, sr = librosa.load(file_path, sr=target_sr, duration=duration)
        
        # Se o áudio for mais curto que duration, preenche com zeros
        target_length = int(target_sr * duration)
        if len(audio) < target_length:
            audio = np.pad(audio, (0, target_length - len(audio)), mode='constant')
        else:
            audio = audio[:target_length]
        
        # Normaliza
        if np.max(np.abs(audio)) > 0:
            audio = audio / np.max(np.abs(audio))
        
        return audio
    except Exception as e:
        print(f"⚠️ Erro ao carregar {file_path}: {e}")
        return None

def extract_mfcc_features(audio, n_mfcc=N_MFCC, sr=SAMPLE_RATE):
    """
    Extrai características MFCC do áudio
    Retorna média das features ao longo do tempo (vetor de 13 dimensões)
    """
    try:
        # Calcula MFCC
        mfccs = librosa.feature.mfcc(
            y=audio,
            sr=sr,
            n_mfcc=n_mfcc,
            n_fft=N_FFT,
            hop_length=HOP_LENGTH
        )
        
        # Calcula média ao longo do tempo (reduz de [13, frames] para [13])
        mfcc_mean = np.mean(mfccs, axis=1)
        
        return mfcc_mean
    except Exception as e:
        print(f"⚠️ Erro ao extrair MFCC: {e}")
        return None

def load_dataset_from_directory(data_dir, class_name, class_label):
    """
    Carrega dataset de um diretório específico
    Estrutura esperada:
    data_dir/
        normal/
            audio1.wav
            audio2.wav
        bronchitis/
            audio1.wav
        pneumonia/
            audio1.wav
    """
    class_dir = Path(data_dir) / class_name
    
    if not class_dir.exists():
        print(f"⚠️ Diretório não encontrado: {class_dir}")
        return [], []
    
    features = []
    labels = []
    
    # Extensões de áudio suportadas
    audio_extensions = ['.wav', '.mp3', '.m4a', '.flac', '.ogg']
    
    audio_files = []
    for ext in audio_extensions:
        audio_files.extend(list(class_dir.glob(f'*{ext}')))
        audio_files.extend(list(class_dir.glob(f'*{ext.upper()}')))
    
    if len(audio_files) == 0:
        print(f"⚠️ Nenhum arquivo de áudio encontrado em {class_dir}")
        return [], []
    
    print(f"📂 Carregando {len(audio_files)} arquivos de {class_name}...")
    
    for i, audio_file in enumerate(audio_files):
        if (i + 1) % 50 == 0:
            print(f"   Processando {i + 1}/{len(audio_files)}...")
        
        # Carrega áudio
        audio = load_audio_file(str(audio_file))
        if audio is None:
            continue
        
        # Extrai features
        mfcc = extract_mfcc_features(audio)
        if mfcc is None:
            continue
        
        features.append(mfcc)
        labels.append(class_label)
    
    print(f"✅ Carregados {len(features)} exemplos de {class_name}")
    return features, labels

def load_balanced_dataset(data_dir):
    """
    Carrega dataset balanceado de todas as classes
    """
    print("\n" + "=" * 70)
    print("📦 CARREGANDO DATASET")
    print("=" * 70)
    
    # Carrega cada classe
    normal_features, normal_labels = load_dataset_from_directory(data_dir, 'normal', 0)
    bronchitis_features, bronchitis_labels = load_dataset_from_directory(data_dir, 'bronchitis', 1)
    pneumonia_features, pneumonia_labels = load_dataset_from_directory(data_dir, 'pneumonia', 2)
    
    # Combina todos os dados
    all_features = normal_features + bronchitis_features + pneumonia_features
    all_labels = normal_labels + bronchitis_labels + pneumonia_labels
    
    if len(all_features) == 0:
        raise ValueError("❌ Nenhum dado foi carregado! Verifique o diretório de dados.")
    
    print(f"\n📊 Estatísticas do Dataset:")
    print(f"   Normal: {len(normal_features)} amostras")
    print(f"   Bronquite: {len(bronchitis_features)} amostras")
    print(f"   Pneumonia: {len(pneumonia_features)} amostras")
    print(f"   Total: {len(all_features)} amostras")
    
    # Balanceia o dataset (usa a classe com menos amostras como referência)
    min_samples = min(len(normal_features), len(bronchitis_features), len(pneumonia_features))
    
    if min_samples == 0:
        raise ValueError("❌ Pelo menos uma classe está vazia! Verifique os dados.")
    
    print(f"\n⚖️ Balanceando dataset para {min_samples} amostras por classe...")
    
    # Seleciona amostras aleatórias de cada classe
    np.random.seed(RANDOM_SEED)
    
    balanced_features = []
    balanced_labels = []
    
    for features_list, label in [
        (normal_features, 0),
        (bronchitis_features, 1),
        (pneumonia_features, 2)
    ]:
        if len(features_list) > min_samples:
            indices = np.random.choice(len(features_list), min_samples, replace=False)
            selected = [features_list[i] for i in indices]
        else:
            # Se tiver menos amostras, usa todas e faz oversampling
            selected = features_list
            while len(selected) < min_samples:
                selected.append(features_list[np.random.randint(len(features_list))])
        
        balanced_features.extend(selected)
        balanced_labels.extend([label] * len(selected))
    
    print(f"✅ Dataset balanceado: {len(balanced_features)} amostras ({min_samples} por classe)")
    
    # Converte para numpy arrays
    X = np.array(balanced_features)
    y = np.array(balanced_labels)
    
    # Normaliza features (z-score)
    scaler = StandardScaler()
    X = scaler.fit_transform(X)
    
    print(f"✅ Features normalizadas (média: {X.mean():.4f}, std: {X.std():.4f})")
    
    # One-hot encoding para labels
    y_onehot = keras.utils.to_categorical(y, num_classes=3)
    
    return X, y_onehot, scaler

def build_model(input_shape=(13,)):
    """
    Constrói modelo de classificação
    """
    model = keras.Sequential([
        keras.layers.Dense(128, activation='relu', input_shape=input_shape),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(64, activation='relu'),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(32, activation='relu'),
        keras.layers.Dropout(0.2),
        keras.layers.Dense(3, activation='softmax')
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy', 'top_k_categorical_accuracy']
    )
    
    return model

def train_model(data_dir='data'):
    """
    Treina o modelo com dados reais
    """
    print("\n" + "=" * 70)
    print("🚀 INICIANDO TREINAMENTO COM DADOS REAIS")
    print("=" * 70)
    
    # Carrega dataset
    X, y, scaler = load_balanced_dataset(data_dir)
    
    # Divide em treino, validação e teste
    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, test_size=0.15, random_state=RANDOM_SEED, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=0.15, random_state=RANDOM_SEED, stratify=y_temp
    )
    
    print(f"\n📊 Divisão dos dados:")
    print(f"   Treino: {len(X_train)} amostras")
    print(f"   Validação: {len(X_val)} amostras")
    print(f"   Teste: {len(X_test)} amostras")
    
    # Constrói modelo
    model = build_model()
    
    print("\n📐 Arquitetura do modelo:")
    model.summary()
    
    # Callbacks
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=20,
            restore_best_weights=True,
            verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1
        ),
        keras.callbacks.ModelCheckpoint(
            'models/best_model.h5',
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        )
    ]
    
    # Treina
    print("\n🏋️ Treinando modelo...\n")
    
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=200,
        batch_size=32,
        callbacks=callbacks,
        verbose=1
    )
    
    # Avalia no conjunto de teste
    print("\n📊 Avaliando no conjunto de teste...")
    test_loss, test_accuracy, test_top_k = model.evaluate(X_test, y_test, verbose=0)
    
    print(f"\n✅ Resultados finais:")
    print(f"   Loss: {test_loss:.4f}")
    print(f"   Accuracy: {test_accuracy:.4f}")
    print(f"   Top-K Accuracy: {test_top_k:.4f}")
    
    # Matriz de confusão
    y_pred = model.predict(X_test)
    y_pred_classes = np.argmax(y_pred, axis=1)
    y_test_classes = np.argmax(y_test, axis=1)
    
    from sklearn.metrics import classification_report, confusion_matrix
    
    print("\n📊 Matriz de Confusão:")
    cm = confusion_matrix(y_test_classes, y_pred_classes)
    print(cm)
    
    print("\n📊 Relatório de Classificação:")
    print(classification_report(y_test_classes, y_pred_classes, 
                                target_names=['Normal', 'Bronquite', 'Pneumonia']))
    
    return model, scaler, history

def save_model_and_scaler(model, scaler, output_dir='models'):
    """
    Salva modelo e scaler
    """
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    # Salva modelo Keras
    model_path = output_path / 'cough_model.h5'
    model.save(str(model_path))
    print(f"\n✅ Modelo salvo: {model_path}")
    
    # Salva scaler (importante para normalização)
    import pickle
    scaler_path = output_path / 'scaler.pkl'
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
    print(f"✅ Scaler salvo: {scaler_path}")
    
    # Salva informações do modelo
    info = {
        'input_shape': model.input_shape,
        'output_shape': model.output_shape,
        'n_mfcc': N_MFCC,
        'sample_rate': SAMPLE_RATE,
        'duration': DURATION,
        'classes': ['normal', 'bronchitis', 'pneumonia']
    }
    
    info_path = output_path / 'model_info.json'
    with open(info_path, 'w') as f:
        json.dump(info, f, indent=2)
    print(f"✅ Model info: {info_path}")
    
    return model_path

def main():
    """
    Função principal
    """
    print("=" * 70)
    print("🎯 TREINAMENTO DE MODELO COM DATASETS REAIS")
    print("=" * 70)
    
    # Mostra datasets disponíveis
    download_datasets()
    
    # Verifica se o diretório de dados existe
    data_dir = 'data'
    if not os.path.exists(data_dir):
        print(f"\n❌ Diretório de dados não encontrado: {data_dir}")
        print("\n📝 Para usar este script:")
        print("   1. Crie o diretório 'data' na raiz do projeto")
        print("   2. Organize os dados da seguinte forma:")
        print("      data/")
        print("        normal/")
        print("          audio1.wav")
        print("          audio2.wav")
        print("        bronchitis/")
        print("          audio1.wav")
        print("        pneumonia/")
        print("          audio1.wav")
        print("   3. Execute novamente este script")
        return
    
    try:
        # Treina modelo
        model, scaler, history = train_model(data_dir)
        
        # Salva modelo
        model_path = save_model_and_scaler(model, scaler)
        
        print("\n" + "=" * 70)
        print("✅ TREINAMENTO CONCLUÍDO!")
        print("=" * 70)
        print(f"\n📁 Modelo salvo em: {model_path.absolute()}")
        print("\n📝 Próximos passos:")
        print("   1. Execute: python convert_to_tfjs.py")
        print("   2. Faça upload do modelo para Supabase Storage")
        print("   3. Configure EXPO_PUBLIC_MODEL_URL no arquivo .env")
        print()
        
    except Exception as e:
        print(f"\n❌ Erro durante treinamento: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()

