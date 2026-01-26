import pandas as pd
import os

csv_path = r'C:\Users\USER\Downloads\archive\metadata_compiled.csv'

if not os.path.exists(csv_path):
    print(f"Erro: {csv_path} não encontrado.")
    exit()

df = pd.read_csv(csv_path)

print("--- Distribuição da Coluna 'status' ---")
print(df['status'].value_counts(dropna=False))

print("\n--- Distribuição da Coluna 'diagnosis_1' ---")
if 'diagnosis_1' in df.columns:
    print(df['diagnosis_1'].value_counts(dropna=False))

print("\n--- Verificando Bronquite e Pneumonia em todas as colunas de diagnóstico ---")
diagnosis_cols = [c for c in df.columns if 'diagnosis' in c]
for col in diagnosis_cols:
    count_pne = df[df[col] == 'pneumonia'].shape[0]
    count_bro = df[df[col] == 'bronchitis'].shape[0]
    if count_pne > 0 or count_bro > 0:
        print(f"{col}: Pneumonia={count_pne}, Bronchite={count_bro}")

# Verifica respiratory_condition
print("\n--- Distribuição da Coluna 'respiratory_condition' ---")
print(df['respiratory_condition'].value_counts(dropna=False))
