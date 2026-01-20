# 🔧 Troubleshooting: App Fecha ao Abrir

## ❌ Problema: App fecha imediatamente ao abrir

### Sintomas
- App instala corretamente
- Ao clicar no ícone, o app fecha imediatamente
- Não aparece nenhuma mensagem de erro

### Causa
O app está crashando na inicialização porque as **variáveis de ambiente não estão configuradas** no build do EAS. O código verifica essas variáveis ao iniciar e lança um erro se não estiverem configuradas.

## ✅ Solução: Configurar Variáveis de Ambiente no EAS

### Passo 1: Configurar EAS Secrets

Execute os seguintes comandos para configurar as variáveis de ambiente no EAS:

```bash
# 1. Fazer login no EAS (se ainda não fez)
eas login

# 2. Configurar URL do Supabase
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://gorslmmmivhbjrczsoie.supabase.co"

# 3. Configurar chave anônima do Supabase (OBRIGATÓRIO)
# IMPORTANTE: Substitua "sua_chave_anon_aqui" pela chave real do seu projeto Supabase
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "sua_chave_anon_aqui"

# 4. Configurar URL do modelo ML (opcional)
eas secret:create --scope project --name EXPO_PUBLIC_MODEL_URL --value "https://gorslmmmivhbjrczsoie.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json"
```

### Passo 2: Obter a Chave Anônima do Supabase

1. Acesse: https://supabase.com/dashboard/project/gorslmmmivhbjrczsoie/settings/api
2. Copie a chave **"anon public"** (não a service_role)
3. Use essa chave no comando acima

### Passo 3: Verificar Configuração

```bash
# Listar todas as variáveis de ambiente configuradas (comando atualizado)
eas env:list

# OU (comando antigo, ainda funciona mas está deprecated)
eas secret:list
```

Você deve ver:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_MODEL_URL` (opcional)

### Passo 4: Fazer Novo Build

Após configurar os secrets, faça um novo build:

```bash
eas build --platform android --profile production --non-interactive
```

## 🔍 Verificação Adicional

### ✅ Variáveis Já Configuradas?

Se você já configurou as variáveis e o app ainda crasha, o problema pode ser:

1. **Build antigo**: O build foi feito ANTES de configurar as variáveis
   - **Solução**: Faça um novo build após configurar as variáveis

2. **Valor vazio**: A variável está configurada mas com valor vazio
   - **Solução**: Verifique os valores com `eas env:list` e reconfigura se necessário

3. **Erro diferente**: Pode ser outro erro não relacionado às variáveis
   - **Solução**: Verifique os logs do app (veja abaixo)

### Verificar Logs do App

**IMPORTANTE**: Os logs mostram o erro real que está causando o crash.

**Android (via ADB):**
```bash
# Conectar dispositivo via USB e habilitar USB Debugging
# Depois execute:

# Ver todos os erros
adb logcat *:E

# Filtrar por termos específicos
adb logcat | grep -i "cough\|supabase\|error\|exception\|crash"

# Ver logs do React Native
adb logcat | grep -i "ReactNativeJS"

# Ver logs completos e salvar em arquivo
adb logcat > app_logs.txt
```

**Procurar por:**
- `Variáveis do Supabase não configuradas`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY está vazia`
- `Error:` ou `Exception:`
- `FATAL EXCEPTION`

### Verificar se Variáveis Estão Sendo Passadas

O código verifica as variáveis nesta ordem:
1. `Constants.expoConfig?.extra?.supabaseUrl` (app.json)
2. `process.env.EXPO_PUBLIC_SUPABASE_URL` (EAS Secrets)
3. Valor padrão (hardcoded)

Se nenhuma estiver configurada, o app lança um erro e fecha.

## 📝 Notas Importantes

### ⚠️ EAS Secrets vs app.json

- **EAS Secrets** (recomendado): Variáveis são injetadas durante o build
- **app.json extra**: Pode ser usado, mas não é recomendado para valores sensíveis

### 🔐 Segurança

- **NUNCA** commite a chave anônima no repositório
- Use EAS Secrets para valores sensíveis
- A chave anônima pode ser exposta no cliente (é pública), mas ainda assim é melhor usar secrets

## 🚀 Comandos Rápidos

```bash
# Configurar todas as variáveis de uma vez
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://gorslmmmivhbjrczsoie.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "SUA_CHAVE_AQUI"
eas secret:create --scope project --name EXPO_PUBLIC_MODEL_URL --value "https://gorslmmmivhbjrczsoie.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json"

# Verificar (comando atualizado)
eas env:list

# OU (comando antigo)
eas secret:list

# Fazer build (IMPORTANTE: faça DEPOIS de configurar as variáveis)
eas build --platform android --profile production --non-interactive
```

## 📚 Recursos

- [EAS Secrets Documentation](https://docs.expo.dev/build/variables/)
- [Supabase API Keys](https://supabase.com/docs/guides/api/api-keys)
- [CONFIGURAR_EAS.md](./CONFIGURAR_EAS.md) - Guia completo de configuração

---

**Última atualização**: Janeiro 2025

