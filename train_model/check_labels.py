import pandas as pd
import os

csv_path = r'C:\Users\USER\Downloads\archive\metadata_compiled.csv'
df = pd.read_csv(csv_path)

diagnosis_cols = [c for c in df.columns if 'diagnosis' in c]
all_labels = set()
for col in diagnosis_cols:
    unique_vals = df[col].dropna().unique()
    print(f"\nLabels em {col}:")
    print(unique_vals)
    for v in unique_vals:
        all_labels.add(v)

print("\n--- Todos os Labels Únicos detectados ---")
print(sorted(list(all_labels)))
