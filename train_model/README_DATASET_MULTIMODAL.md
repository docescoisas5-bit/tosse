# Treinamento com Dataset Multimodal de Tosse

## Dataset

**Nome:** Audio-IMU multimodal cough dataset using wearables  
**DOI:** https://doi.org/10.5061/dryad.mkkwh717r  
**Fonte:** Dryad Digital Repository

## Descrição do Dataset

Este dataset contém:

- **13 participantes** com gravações de áudio
- **Dois microfones** por participante (in-microphone e out-microphone)
- **Dados IMU** (Acelerômetro, Giroscópio, Magnetômetro)
- **Labels categorizados:**
  - Cough (Tosse)
  - Speech (Fala)
  - Sneeze (Espirro)
  - Deep Breath (Respiração Profunda)
  - Groan (Gemido)
  - Laugh (Risada)
  - Speech (far) - Fala de pessoas próximas
  - Other Sounds - Ruídos ambientais e silêncio

## Estrutura do Dataset

```
MultimodalCoughDataset/
├── DataAnnotation.json          # Anotações com timestamps
├── 005/
│   ├── Trial_1_No_Talking/
│   │   ├── 005_Talking_In.wav   # Microfone interno
│   │   ├── 005_Talking_Out.wav  # Microfone externo
│   │   ├── Accelerometer.csv
│   │   ├── Gyroscope.csv
│   │   └── Magnetometer.csv
│   ├── Trial_2_Talking/
│   ├── Trial_3_Nonverbal/
│   └── sync_time.txt
├── 006/
└── ...
```

## Como Usar

### 1. Baixar o Dataset

1. Acesse: https://doi.org/10.5061/dryad.mkkwh717r
2. Baixe o arquivo `MultimodalCoughDataset.zip`
3. Extraia em uma pasta acessível

### 2. Instalar Dependências

```bash
pip install librosa tensorflow scikit-learn numpy
```

### 3. Executar Treinamento

```bash
cd train_model
python train_with_multimodal_dataset.py
```

Quando solicitado, digite o caminho completo para a pasta `MultimodalCoughDataset`.

### 4. Processo de Treinamento

O script irá:

1. **Carregar anotações** do `DataAnnotation.json`
2. **Processar arquivos de áudio** WAV
3. **Extrair features MFCC** (13 coeficientes)
4. **Criar labels sintéticas** (normal, bronchitis, pneumonia)
   - ⚠️ **Nota:** O script atual usa heurísticas simples. Para produção, você precisa de labels médicas reais.
5. **Treinar modelo** de classificação
6. **Salvar modelo** treinado em `trained_model/`

## Limitações Atuais

⚠️ **Importante:** O script atual cria labels sintéticas baseadas em heurísticas simples. Para um modelo de produção, você precisa:

1. **Labels médicas reais** - Classificação médica de cada gravação (normal, bronchitis, pneumonia)
2. **Validação médica** - Revisão por profissionais de saúde
3. **Mais dados** - O dataset atual tem apenas 13 participantes

## Melhorias Futuras

1. **Usar dados IMU** - Integrar dados de movimento para melhorar precisão
2. **Transfer Learning** - Usar modelos pré-treinados (ex: MobileNet mencionado no paper)
3. **Multimodal** - Combinar áudio + IMU para melhor detecção
4. **OOD Detection** - Detectar inputs fora da distribuição (como no paper original)

## Referências

- **Paper:** "Multimodal Cough Detection with Out-of-Distribution Detection" (EMBS 2024)
- **Código Original:** 
  - https://github.com/ARoS-NCSU/OOD-Multimodal-CoughDet
  - https://github.com/ARoS-NCSU/Optimized-OOD-Multimodal-CoughDet

## Resultados Esperados

Segundo o paper original:
- **Acurácia in-subject:** 92.59% (sem OOD) / 91.97% (com OOD)
- **Acurácia cross-subject:** 90.79% (sem OOD) / 90.31% (com OOD)

## Próximos Passos

1. Obter labels médicas reais para as gravações
2. Expandir dataset com mais participantes
3. Implementar detecção OOD
4. Integrar dados IMU no modelo
5. Converter modelo para TensorFlow.js para uso no app

