# 🔍 Diagnóstico do Modelo de ML

## Problema Reportado
O modelo está sempre retornando "pneumonia" para todas as pessoas testadas.

## Possíveis Causas

### 1. Modelo Não Treinado Corretamente
- **Sintoma**: Modelo sempre retorna a mesma classe
- **Causa**: Overfitting, desbalanceamento de classes, ou modelo não treinado
- **Solução**: Retreinar o modelo com dataset balanceado

### 2. Problema no Pré-processamento
- **Sintoma**: Features MFCC não estão sendo calculadas corretamente
- **Causa**: Normalização incorreta, cálculo de média errado, ou formato de input incorreto
- **Solução**: Verificar logs de debug e ajustar pré-processamento

### 3. Formato de Input Incorreto
- **Sintoma**: Modelo recebe features em formato diferente do esperado
- **Causa**: Shape do tensor não corresponde ao esperado pelo modelo
- **Solução**: Verificar shape do input e ajustar

## Logs de Debug Adicionados

Os seguintes logs foram adicionados para diagnóstico:

1. **Input shape**: Mostra a forma do tensor de entrada
2. **Input valores**: Primeiros 10 valores do input
3. **Probabilidades brutas**: Valores exatos de normal, bronquite, pneumonia
4. **Soma das probabilidades**: Deve ser ~1.0 (softmax)
5. **Classe prevista**: Qual classe foi selecionada

## Como Verificar

1. **Execute uma análise** e verifique os logs no console
2. **Verifique as probabilidades**:
   - Se todas são muito próximas (ex: 0.33, 0.33, 0.34), o modelo não está discriminando
   - Se uma é sempre muito maior (ex: 0.95, 0.03, 0.02), pode ser overfitting
3. **Verifique o input**:
   - Valores devem estar normalizados (entre -1 e 1 ou 0 e 1)
   - Shape deve ser [1, 13] para o modelo atual

## Próximos Passos

1. **Verificar logs** após análise para ver valores exatos
2. **Comparar com modelo original** usado no treinamento
3. **Verificar dataset de treinamento** - pode estar desbalanceado
4. **Considerar retreinar** o modelo com dataset balanceado

## Análise dos Logs Atuais

Com base nos logs fornecidos:

```
Input valores: [1.79, 1.89, 1.92, 2.13, 2.17, 2.22, 2.24, 2.36, 2.38, 2.45]
Probabilidades:
  Normal: 1.39e-20 (praticamente zero)
  Bronquite: 8.80e-7 (praticamente zero)
  Pneumonia: 0.999999 (quase 100%)
```

### Problemas Identificados:

1. **Valores de Input Muito Altos**: Os valores de MFCC estão entre 1.79 e 2.45, o que é incomum. Normalmente, MFCC após normalização deveria estar entre -1 e 1 ou 0 e 1.

2. **Modelo Extremamente Enviesado**: As probabilidades mostram que o modelo está praticamente sempre retornando pneumonia, independente do input.

3. **Possíveis Causas**:
   - Modelo foi treinado com dados normalizados de forma diferente
   - Dataset de treinamento estava desbalanceado (muitos casos de pneumonia)
   - Modelo sofre de overfitting severo
   - Pré-processamento durante treinamento era diferente

### Correções Aplicadas:

1. **Normalização Automática**: Adicionada normalização min-max [0, 1] quando valores estão muito altos
2. **Logs Detalhados**: Adicionados logs para verificar valores antes e depois da normalização

## Recomendações

### Se o Modelo Estiver Mal Treinado:
1. **Coletar mais dados** de cada classe (normal, bronquite, pneumonia)
2. **Balancear o dataset** (mesma quantidade de cada classe)
3. **Usar técnicas de data augmentation**
4. **Validar com dataset de teste separado**
5. **Considerar retreinar o modelo** com dataset balanceado

### Se o Pré-processamento Estiver Incorreto:
1. **Verificar normalização**: O modelo pode ter sido treinado com dados normalizados de forma diferente
2. **Comparar com treinamento**: Verificar exatamente como os dados foram pré-processados durante o treinamento
3. **Ajustar normalização**: Testar diferentes métodos (z-score, min-max, etc.)
4. **Verificar cálculo de MFCC**: Garantir que está igual ao usado no treinamento

### Se o Problema For no Modelo:
1. **Verificar dataset de treinamento**: Pode estar desbalanceado (muitos casos de pneumonia)
2. **Retreinar com dataset balanceado**: Usar mesma quantidade de cada classe
3. **Validar modelo**: Testar com dados conhecidos antes de usar em produção
4. **Considerar modelo pré-treinado**: Usar um modelo de confiança validado

## Ação Imediata

**O modelo atual NÃO está pronto para produção** porque:
- Sempre retorna pneumonia
- Não discrimina entre classes
- Provavelmente foi treinado com dataset desbalanceado

**Recomendação**: Retreinar o modelo com dataset balanceado antes de usar em produção.

