# 🚀 Configuração Inicial do EAS Build

Este guia explica como configurar o EAS Build pela primeira vez.

## 📋 Pré-requisitos

1. **Conta Expo**: Crie uma conta em https://expo.dev
2. **EAS CLI**: Instale globalmente
   ```bash
   npm install -g eas-cli
   ```

## 🔧 Passo a Passo

### 1. Login no EAS

```bash
eas login
```

Você será redirecionado para o navegador para fazer login.

### 2. Inicializar Projeto EAS

```bash
eas init
```

Este comando irá:
- Criar um projeto EAS vinculado à sua conta Expo
- Configurar o projeto no Expo Dashboard
- Gerar um ID único para o projeto

**Nota**: Se você já tem um projeto Expo, o comando irá vinculá-lo. Se não, criará um novo.

### 3. Configurar Variáveis de Ambiente (Secrets)

Configure as variáveis de ambiente usando EAS Secrets:

```bash
# URL do Supabase
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://seu-projeto.supabase.co"

# Chave anônima do Supabase
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "sua_chave_anon_aqui"

# URL do modelo ML (opcional)
eas secret:create --scope project --name EXPO_PUBLIC_MODEL_URL --value "https://seu-projeto.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json"
```

**Alternativa**: Você também pode configurar no arquivo `app.json` na seção `extra`, mas usar secrets é mais seguro.

### 4. Verificar Configuração

```bash
# Verificar configuração do projeto
eas project:info

# Listar secrets configurados
eas secret:list
```

### 5. Configurar Credenciais (OBRIGATÓRIO para Primeiro Build)

**⚠️ IMPORTANTE**: Você precisa configurar as credenciais (keystore Android) antes do primeiro build:

```bash
# Configurar credenciais Android
eas credentials --platform android
```

Escolha:
1. **"Set up a new keystore"** ou **"Generate a new keystore"**
2. **"Save credentials to EAS servers"** (não salve localmente)

Isso permite que builds em CI/CD funcionem em modo não-interativo.

**📖 Guia Completo**: Consulte [CONFIGURAR_CREDENCIAIS.md](./CONFIGURAR_CREDENCIAIS.md) para instruções detalhadas.

### 6. Fazer Primeiro Build

#### Android (APK para testes)
```bash
eas build --platform android --profile preview
```

#### Android (AAB para produção)
```bash
eas build --platform android --profile production
```

#### iOS (Simulador)
```bash
eas build --platform ios --profile preview
```

#### iOS (App Store)
```bash
eas build --platform ios --profile production
```

## 📱 Versionamento

O projeto está configurado para usar versionamento remoto (`appVersionSource: "remote"`), o que significa que o EAS gerencia automaticamente os números de versão.

### Versionamento Manual (Opcional)

Se preferir controlar manualmente, edite `app.json`:

```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 1
    },
    "ios": {
      "buildNumber": "1"
    }
  }
}
```

E altere `eas.json`:

```json
{
  "cli": {
    "appVersionSource": "local"
  }
}
```

## 🔍 Troubleshooting

### Erro: "EAS project not configured"

**Solução**: Execute `eas init` para configurar o projeto.

### Erro: "Must configure EAS project"

**Solução**: 
1. Verifique se você está logado: `eas whoami`
2. Execute `eas init` se ainda não configurou
3. Verifique se o projeto está vinculado: `eas project:info`

**⚠️ Para CI/CD**: Se você está configurando para CI/CD, consulte [EAS_CI_CD.md](./EAS_CI_CD.md) para instruções específicas.

### Erro: "appVersionSource is not set"

**Solução**: O arquivo `eas.json` já está configurado com `appVersionSource: "remote"`. Se ainda aparecer o erro, verifique se o arquivo está salvo corretamente.

### Erro: Variáveis de ambiente não encontradas

**Solução**: 
1. Configure via secrets: `eas secret:create`
2. Ou configure no `app.json` na seção `extra`
3. Verifique se estão configuradas: `eas secret:list`

## 📚 Próximos Passos

Após configurar o EAS:

1. **Fazer Build**: Use `eas build` para criar builds
2. **Submeter para Lojas**: Use `eas submit` (requer configuração adicional)
3. **Atualizações OTA**: Use `eas update` para atualizações sem rebuild

## 🔄 Builds em CI/CD

Se você está configurando builds em ambientes CI/CD (GitHub Actions, GitLab CI, etc.), consulte:

- **[EAS_CI_CD.md](./EAS_CI_CD.md)** - Guia completo para configurar EAS Build em CI/CD

**Importante**: O projeto EAS **deve ser configurado localmente primeiro** com `eas init` antes de fazer builds em CI/CD.

## 🔗 Links Úteis

- [Documentação EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Secrets](https://docs.expo.dev/build-reference/variables/)
- [Versionamento de Apps](https://docs.expo.dev/build-reference/app-versions/)
- [EAS Build em CI/CD](https://docs.expo.dev/build/building-on-ci/)

---

**Última atualização**: Janeiro 2025

