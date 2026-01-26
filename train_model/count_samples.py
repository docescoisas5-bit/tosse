import pandas as pd
import os

csv_path = r'C:\Users\USER\Downloads\archive\metadata_compiled.csv'
base_dir = r'C:\Users\USER\Downloads\archive'
df = pd.read_csv(csv_path)

# Mapeamento
mapping = {
    'healthy_cough': 'Normal',
    'lower_infection': 'Pneumonia',
    'obstructive_disease': 'Bronchitis'
}

counts = {'Normal': 0, 'Pneumonia': 0, 'Bronchitis': 0}

for idx, row in df.iterrows():
    uuid = row['uuid']
    label_raw = row['diagnosis_1'] # Usando o primeiro diagnóstico expert
    
    if label_raw in mapping:
        # Verifica se o arquivo webm existe
        webm_path = os.path.join(base_dir, f"{uuid}.webm")
        if os.path.exists(webm_path):
            counts[mapping[label_raw]] += 1

print("--- Amostras disponíveis (com arquivo .webm) ---")
print(counts)
