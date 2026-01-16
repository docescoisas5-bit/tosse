# 🔄 EAS Build em CI/CD

Este guia explica como configurar builds do EAS em ambientes CI/CD (GitHub Actions, GitLab CI, etc.).

## ⚠️ Problema: "EAS project not configured"

Em ambientes CI/CD, o comando `eas init` não pode ser executado porque requer interação. O projeto EAS **deve ser configurado localmente primeiro**.

## 🔧 Solução: Configurar Projeto Localmente

### Passo 1: Configurar Projeto Localmente (Uma vez)

Execute estes comandos **localmente** (não no CI/CD):

```bash
# 1. Login no EAS
eas login

# 2. Inicializar projeto (cria vínculo com Expo)
eas init

# 3. Verificar que está configurado
eas project:info
```

Isso criará um arquivo `.easrc` (ou atualizará o `app.json`) com o ID do projeto EAS.

### Passo 2: Verificar Arquivo de Configuração

Após executar `eas init`, verifique se foi criado:

- **Arquivo `.easrc`** (na raiz do projeto) - contém o ID do projeto
- Ou o **`app.json`** foi atualizado com `extra.eas.projectId`

**⚠️ IMPORTANTE**: O arquivo `.easrc` deve ser **commitado no repositório** para que o CI/CD funcione.

### Passo 3: Configurar Credenciais Android/iOS

**⚠️ IMPORTANTE**: As credenciais (keystore Android e certificados iOS) devem ser geradas antes do primeiro build em CI/CD.

#### Android (Keystore)

Gere o keystore localmente:

```bash
# Gerar credenciais Android (executa interativamente e salva no EAS)
eas credentials
```

Ou configure manualmente:

```bash
# Configurar credenciais Android
eas credentials --platform android
```

Escolha a opção para gerar um novo keystore e salvá-lo no EAS (recomendado).

#### iOS (Certificados)

Para iOS, você também precisa configurar:

```bash
# Configurar credenciais iOS
eas credentials --platform ios
```

### Passo 4: Configurar Secrets no EAS

Configure os secrets no EAS (não no CI/CD):

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://seu-projeto.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "sua_chave_aqui"
eas secret:create --scope project --name EXPO_PUBLIC_MODEL_URL --value "https://seu-projeto.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json"
```

## 🚀 Configuração para CI/CD

### GitHub Actions

Exemplo de workflow `.github/workflows/build.yml`:

```yaml
name: EAS Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    name: Build Android
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Android
        run: eas build --platform android --profile production --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

### Variáveis Necessárias no CI/CD

Configure estas variáveis como secrets no seu CI/CD:

1. **EXPO_TOKEN**: Token de acesso do Expo
   - Obtenha em: https://expo.dev/accounts/[seu-usuario]/settings/access-tokens
   - Crie um token com permissões de build

### Comandos para CI/CD

Use a flag `--non-interactive` em todos os comandos:

```bash
# Build
eas build --platform android --profile production --non-interactive

# Update
eas update --branch production --non-interactive
```

## 🔍 Verificação

### Verificar se Projeto está Configurado

```bash
# Localmente
eas project:info

# Deve mostrar:
# - Project ID
# - Project name
# - Owner
```

### Verificar Secrets

```bash
# Listar secrets configurados
eas secret:list
```

## ⚠️ Troubleshooting

### Erro: "Generating a new Keystore is not supported in --non-interactive mode"

**Causa**: As credenciais Android não foram configuradas no EAS.

**Solução**:
1. Execute localmente: `eas credentials --platform android`
2. Escolha a opção para gerar um novo keystore
3. Salve no EAS (não localmente)
4. Agora o CI/CD poderá usar as credenciais remotas

**Comando rápido**:
```bash
eas credentials --platform android
```

### Erro: "EAS project not configured" no CI/CD

**Causa**: O projeto não foi inicializado localmente.

**Solução**:
1. Execute `eas init` localmente
2. Commit o arquivo `.easrc` (se foi criado)
3. Ou verifique se `app.json` tem `extra.eas.projectId`
4. Execute o build novamente no CI/CD

### Erro: "Must configure EAS project by running 'eas init'"

**Causa**: O arquivo `.easrc` não está no repositório ou o `app.json` não tem o `projectId`.

**Solução**:
1. Execute `eas init` localmente
2. Verifique se `.easrc` foi criado
3. Adicione `.easrc` ao git (se não estiver no `.gitignore`)
4. Commit e push
5. Ou adicione `projectId` manualmente no `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "seu-project-id-aqui"
      }
    }
  }
}
```

### Como Obter o Project ID

```bash
# Opção 1: Via comando
eas project:info

# Opção 2: Via Expo Dashboard
# Acesse: https://expo.dev/accounts/[seu-usuario]/projects/[projeto]
# O ID está na URL ou nas configurações do projeto
```

## 📝 Checklist para CI/CD

- [ ] Executou `eas init` localmente
- [ ] Arquivo `.easrc` foi commitado (ou `projectId` no `app.json`)
- [ ] **Credenciais Android configuradas** (`eas credentials --platform android`)
- [ ] **Credenciais iOS configuradas** (se necessário, `eas credentials --platform ios`)
- [ ] Secrets configurados no EAS (`eas secret:create`)
- [ ] Token do Expo configurado como secret no CI/CD
- [ ] Workflow CI/CD usa flag `--non-interactive`
- [ ] Workflow CI/CD tem `EXPO_TOKEN` configurado
- [ ] `versionCode` removido do `app.json` (se usando versionamento remoto)

## 🔗 Links Úteis

- [EAS Build em CI/CD](https://docs.expo.dev/build/building-on-ci/)
- [Expo GitHub Action](https://github.com/expo/expo-github-action)
- [EAS Tokens](https://docs.expo.dev/accounts/programmatic-access/)

---

**Última atualização**: Janeiro 2025

