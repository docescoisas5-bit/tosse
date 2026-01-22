# 📱 Gerar APK com Todas as Variáveis de Ambiente

Este guia mostra como gerar um APK com todas as variáveis de ambiente configuradas.

## 🔑 Variáveis Necessárias

As seguintes variáveis de ambiente precisam estar configuradas no EAS:

1. **EXPO_PUBLIC_SUPABASE_URL** - URL do projeto Supabase
2. **EXPO_PUBLIC_SUPABASE_ANON_KEY** - Chave anônima do Supabase (OBRIGATÓRIO)
3. **EXPO_PUBLIC_MODEL_URL** - URL do modelo ML (opcional, já está no app.json)

## 📋 Passo a Passo

### 1. Fazer Login no EAS (se necessário)

```bash
eas login
```

### 2. Configurar Variáveis de Ambiente no EAS

Execute os seguintes comandos para configurar as variáveis:

```bash
# URL do Supabase
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://gorslmmmivhbjrczsoie.supabase.co"

# Chave anônima do Supabase (OBRIGATÓRIO)
# IMPORTANTE: Substitua "SUA_CHAVE_ANON_AQUI" pela chave real
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "SUA_CHAVE_ANON_AQUI"

# URL do modelo ML (opcional, mas recomendado)
eas secret:create --scope project --name EXPO_PUBLIC_MODEL_URL --value "https://gorslmmmivhbjrczsoie.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json"
```

### 3. Obter a Chave Anônima do Supabase

1. Acesse: https://supabase.com/dashboard/project/gorslmmmivhbjrczsoie/settings/api
2. Copie a chave **"anon public"** (não a service_role)
3. Use essa chave no comando acima

### 4. Verificar Variáveis Configuradas

```bash
eas env:list
```

Você deve ver as 3 variáveis listadas.

### 5. Gerar o APK

```bash
# Build para produção (APK)
eas build --platform android --profile production

# OU build preview (APK para testes)
eas build --platform android --profile preview
```

### 6. Baixar o APK

Após o build completar, você receberá um link para baixar o APK. O build leva aproximadamente 10-20 minutos.

## ⚠️ Notas Importantes

- A chave anônima do Supabase é **OBRIGATÓRIA** - sem ela o app não funcionará
- O build pode levar 10-20 minutos
- Você receberá um email quando o build estiver pronto
- O APK estará disponível para download por 30 dias

## 🔍 Troubleshooting

### Erro: "Variáveis não configuradas"
- Verifique se executou os comandos `eas secret:create`
- Verifique se as variáveis estão listadas com `eas env:list`

### Erro: "Chave anônima inválida"
- Certifique-se de copiar a chave **anon public** (não service_role)
- A chave deve começar com `eyJ...`

### Build falha
- Verifique os logs do build no dashboard do EAS
- Certifique-se de que todas as dependências estão instaladas

