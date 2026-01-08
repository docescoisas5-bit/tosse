# Guia: Atualizar Repositório GitHub

O código foi commitado localmente, mas precisa ser enviado (push) para o GitHub.

## 🚀 Solução Rápida

Execute o script de configuração:
```powershell
.\configurar-git.ps1
```

O script irá guiá-lo através do processo de autenticação.

## ✅ Status Atual

- ✅ Repositório Git inicializado
- ✅ Remote configurado: `https://github.com/docescoisas5-bit/tosse.git`
- ✅ Arquivos commitados localmente
- ⚠️ Push pendente (requer autenticação)

## 🔐 Opção 1: Push com Autenticação (Recomendado)

### Usando Personal Access Token (PAT)

1. **Crie um Personal Access Token no GitHub:**
   - Acesse: https://github.com/settings/tokens
   - Clique em "Generate new token (classic)"
   - Dê um nome (ex: "tosse-app")
   - Selecione escopo: `repo` (acesso completo a repositórios)
   - Clique em "Generate token"
   - **Copie o token** (você só verá uma vez!)

2. **Configure o Git para usar o token:**
```bash
git remote set-url origin https://SEU_TOKEN@github.com/docescoisas5-bit/tosse.git
```

   Ou use seu username:
```bash
git remote set-url origin https://docescoisas5-bit@github.com/docescoisas5-bit/tosse.git
```

3. **Faça o push:**
```bash
git push -u origin main
```

   Quando pedir senha, use o **Personal Access Token** (não sua senha do GitHub).

### Usando GitHub CLI

1. **Instale GitHub CLI** (se não tiver):
   - Windows: `winget install GitHub.cli`
   - Ou baixe: https://cli.github.com

2. **Autentique:**
```bash
gh auth login
```

3. **Faça o push:**
```bash
git push -u origin main
```

## 🔐 Opção 2: SSH (Alternativa)

1. **Configure SSH key no GitHub:**
   - Siga: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

2. **Altere o remote para SSH:**
```bash
git remote set-url origin git@github.com:docescoisas5-bit/tosse.git
```

3. **Faça o push:**
```bash
git push -u origin main
```

## 📋 Comandos Rápidos

Se já configurou autenticação, execute:

```bash
cd c:\Users\kenil\cough-analysis-app
git push -u origin main
```

## 🔄 Atualizações Futuras

Para atualizar o repositório no futuro:

```bash
git add .
git commit -m "Descrição das mudanças"
git push
```

## ✅ Verificar

Após o push, verifique no GitHub:
- https://github.com/docescoisas5-bit/tosse

Você deve ver todos os arquivos do projeto!

## 🐛 Problemas Comuns

### Erro: "Permission denied"
- Verifique se tem acesso ao repositório
- Use Personal Access Token em vez de senha
- Confirme que o token tem escopo `repo`

### Erro: "Repository not found"
- Verifique se o repositório existe
- Confirme que você tem permissão de escrita

### Erro: "Authentication failed"
- Use Personal Access Token (não senha)
- Verifique se o token não expirou
- Tente usar GitHub CLI: `gh auth login`

## 📝 Nota

O arquivo `.env` está no `.gitignore` e **não será enviado** (por segurança). Certifique-se de criar um `.env` localmente com suas credenciais.

