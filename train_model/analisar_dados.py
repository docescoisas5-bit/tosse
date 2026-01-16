"""Analisa quantos arquivos têm diagnósticos válidos"""
import json
from pathlib import Path

data_dir = Path('../datasets reais')
json_files = list(data_dir.glob('*.json'))

valid = 0
invalid = 0
sem_audio = 0

for json_file in json_files:
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Verifica diagnóstico
    diagnosis = None
    for key in ['expert_labels_1', 'expert_labels_2', 'expert_labels_3']:
        if key in data and isinstance(data[key], dict):
            if 'diagnosis' in data[key]:
                diagnosis = data[key]['diagnosis']
                break
    
    status = data.get('status')
    respiratory_condition = data.get('respiratory_condition')
    
    # Verifica se tem mapeamento válido
    tem_diagnostico = diagnosis or status or respiratory_condition
    
    # Verifica se tem arquivo de áudio
    base_name = json_file.stem
    tem_audio = False
    for ext in ['.webm', '.ogg', '.wav', '.mp3', '.m4a', '.flac']:
        if (json_file.parent / f"{base_name}{ext}").exists():
            tem_audio = True
            break
    
    if tem_audio and tem_diagnostico:
        valid += 1
    elif not tem_audio:
        sem_audio += 1
    else:
        invalid += 1

print(f"Total de arquivos JSON: {len(json_files)}")
print(f"Validos (tem audio + diagnostico): {valid}")
print(f"Invalidos (sem diagnostico valido): {invalid}")
print(f"Sem arquivo de audio: {sem_audio}")

