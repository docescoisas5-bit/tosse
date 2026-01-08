# 📤 Como Atualizar o Repositório Git

## ✅ Status Atual

O commit foi criado com sucesso! Agora você precisa fazer o push para o GitHub.

## 🚀 Opções para Fazer Push

### Opção 1: Usando Credenciais no Terminal (Recomendado)

```bash
cd /Users/mac/Downloads/tosse-main
git push origin main
```

Quando solicitado:
- **Username**: `docescoisas5-bit`
- **Password**: Use um **Personal Access Token** (não sua senha do GitHub)

### Opção 2: Usando Personal Access Token

1. **Crie um Personal Access Token no GitHub**:
   - Acesse: https://github.com/settings/tokens
   - Clique em "Generate new token (classic)"
   - Dê um nome (ex: "tosse-app")
   - Selecione escopo: `repo` (acesso completo aos repositórios)
   - Clique em "Generate token"
   - **Copie o token** (você só verá uma vez!)

2. **Use o token como senha**:
   ```bash
   git push origin main
   ```
   - Username: `docescoisas5-bit`
   - Password: cole o token que você copiou

### Opção 3: Configurar SSH (Mais Seguro)

1. **Gere uma chave SSH** (se ainda não tiver):
   ```bash
   ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
   ```

2. **Adicione a chave ao GitHub**:
   - Copie a chave pública: `cat ~/.ssh/id_ed25519.pub`
   - Acesse: https://github.com/settings/keys
   - Clique em "New SSH key"
   - Cole a chave e salve

3. **Altere o remote para SSH**:
   ```bash
   git remote set-url origin git@github.com:docescoisas5-bit/tosse.git
   git push origin main
   ```

### Opção 4: Usando GitHub CLI

Se você tem o GitHub CLI instalado:

```bash
gh auth login
git push origin main
```

## 📝 O que foi Commitado

O commit inclui:
- ✅ Correções no upload de áudio (expo-file-system/legacy)
- ✅ Melhorias no modelo ML (normalização e logs)
- ✅ Correções no pré-processamento de áudio

## ⚠️ Arquivos Não Rastreados

Alguns arquivos novos podem não estar no commit:
- Novos arquivos em `app/` (stats.tsx, tutorial.tsx, profile.tsx)
- Novos arquivos em `train_model/` (train_with_real_data.py, etc.)
- Novos componentes e serviços

Para adicionar tudo:

```bash
git add .
git commit -m "feat: Adiciona novas funcionalidades e melhorias"
git push origin main
```

## 🔍 Verificar Status

Para ver o que ainda precisa ser commitado:

```bash
git status
```

Para ver o histórico de commits:

```bash
git log --oneline -10
```

## 📚 Referências

- [GitHub Authentication](https://docs.github.com/en/authentication)
- [Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [SSH Keys](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

