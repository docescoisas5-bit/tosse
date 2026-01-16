# 🔐 Configuração de Credenciais EAS

Este guia explica como configurar as credenciais (keystore Android e certificados iOS) para builds do EAS.

## ⚠️ Problema: "Generating a new Keystore is not supported in --non-interactive mode"

Este erro ocorre quando você tenta fazer um build em CI/CD (modo não-interativo) mas as credenciais Android ainda não foram geradas.

## 🔧 Solução: Configurar Credenciais Antes do Primeiro Build

### Android (Keystore)

#### Opção 1: Gerar e Salvar no EAS (Recomendado)

Execute localmente:

```bash
eas credentials --platform android
```

Quando solicitado:
1. Escolha **"Set up a new keystore"** ou **"Generate a new keystore"**
2. Escolha **"Save credentials to EAS servers"** (não salve localmente)
3. O keystore será gerado e salvo automaticamente no EAS

**Vantagem**: As credenciais ficam seguras no EAS e podem ser usadas em CI/CD.

#### Opção 2: Gerar Localmente e Fazer Upload

Se você já tem um keystore:

```bash
eas credentials --platform android
```

Escolha:
1. **"Upload existing keystore"**
2. Forneça o caminho do seu keystore
3. Forneça a senha
4. Escolha **"Save credentials to EAS servers"**

#### Opção 3: Usar Credenciais Existentes do Google Play

Se você já publicou o app no Google Play:

```bash
eas credentials --platform android
```

Escolha:
1. **"Use existing credentials from Google Play Console"**
2. Siga as instruções para conectar sua conta

### iOS (Certificados e Provisioning Profiles)

Para iOS, você precisa configurar certificados de desenvolvimento e distribuição:

```bash
eas credentials --platform ios
```

O EAS pode:
- Gerar certificados automaticamente (recomendado)
- Usar certificados existentes da sua conta Apple Developer
- Configurar perfis de provisionamento automaticamente

## 🔍 Verificar Credenciais Configuradas

### Ver Todas as Credenciais

```bash
# Ver credenciais Android
eas credentials --platform android

# Ver credenciais iOS
eas credentials --platform ios
```

### Listar Credenciais no Dashboard

1. Acesse https://expo.dev/accounts/[seu-usuario]/projects/[projeto]/credentials
2. Veja todas as credenciais configuradas

## 📱 Versionamento

### Remover versionCode do app.json

Se você está usando `appVersionSource: "remote"` no `eas.json`, remova `versionCode` do `app.json`:

**Antes**:
```json
{
  "expo": {
    "android": {
      "versionCode": 1
    }
  }
}
```

**Depois**:
```json
{
  "expo": {
    "android": {
      // versionCode removido - gerenciado remotamente
    }
  }
}
```

O mesmo se aplica ao `buildNumber` do iOS se estiver usando versionamento remoto.

## 🔄 Após Configurar Credenciais

Após configurar as credenciais, você pode fazer builds em CI/CD:

```bash
# Build Android (deve funcionar agora)
eas build --platform android --profile production --non-interactive
```

## ⚠️ Segurança

### ✅ Boas Práticas

- ✅ **Salvar credenciais no EAS** (não localmente)
- ✅ **Nunca commitar keystores** no repositório
- ✅ **Usar EAS Secrets** para variáveis sensíveis
- ✅ **Rotacionar credenciais** periodicamente

### ❌ Evitar

- ❌ Commitar arquivos `.keystore` ou `.jks`
- ❌ Compartilhar senhas de keystore
- ❌ Salvar credenciais em variáveis de ambiente do CI/CD
- ❌ Usar credenciais locais em CI/CD

## 🔍 Troubleshooting

### Erro: "No credentials found"

**Solução**: Execute `eas credentials --platform android` para gerar.

### Erro: "Keystore password is required"

**Solução**: Se você salvou credenciais localmente, precisa fornecer a senha. Melhor: salve no EAS.

### Erro: "Credentials already exist"

**Solução**: O EAS pergunta se deseja substituir. Escolha conforme necessário.

### Erro: "Invalid keystore format"

**Solução**: Verifique se o arquivo é um keystore válido. Gere um novo se necessário.

## 📚 Próximos Passos

Após configurar credenciais:

1. **Fazer Primeiro Build**: Teste localmente primeiro
2. **Verificar Build**: Certifique-se de que funciona
3. **CI/CD**: Configure workflows CI/CD (agora funcionará)

## 🔗 Links Úteis

- [EAS Credentials](https://docs.expo.dev/app-signing/managed-credentials/)
- [Android Keystore](https://docs.expo.dev/app-signing/app-credentials/#android-keystore)
- [iOS Certificates](https://docs.expo.dev/app-signing/app-credentials/#ios-certificates)

---

**Última atualização**: Janeiro 2025

