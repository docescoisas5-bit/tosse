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
uuids_counted = set()

diagnosis_cols = [c for c in df.columns if 'diagnosis' in c]

for idx, row in df.iterrows():
    uuid = row['uuid']
    if uuid in uuids_counted: continue
    
    # Verifica se algum expert deu diagnóstico
    labels_found = set()
    for col in diagnosis_cols:
        val = row[col]
        if val in mapping:
            labels_found.add(mapping[val])
    
    if labels_found:
        # Se houver conflito, priorizamos um (ou ignoramos)
        # Para contagem simples, vamos ver se conseguimos Bronchitis
        if 'Bronchitis' in labels_found:
            target = 'Bronchitis'
        elif 'Pneumonia' in labels_found:
            target = 'Pneumonia'
        else:
            target = 'Normal'
            
        webm_path = os.path.join(base_dir, f"{uuid}.webm")
        if os.path.exists(webm_path):
            counts[target] += 1
            uuids_counted.add(uuid)

print("--- Amostras disponíveis (Considerando todos os diagnósticos experts) ---")
print(counts)
