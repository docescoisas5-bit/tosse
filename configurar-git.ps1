# Script PowerShell para configurar Git e fazer push para GitHub
# Uso: .\configurar-git.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuração Git para GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se está no diretório correto
if (-not (Test-Path ".git")) {
    Write-Host "❌ Erro: Este não é um repositório Git!" -ForegroundColor Red
    Write-Host "   Execute este script na raiz do projeto." -ForegroundColor Yellow
    exit 1
}

# Verifica se há commits
$commits = git log --oneline 2>$null
if (-not $commits) {
    Write-Host "❌ Erro: Nenhum commit encontrado!" -ForegroundColor Red
    Write-Host "   Execute: git add . && git commit -m 'Initial commit'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Repositório Git encontrado" -ForegroundColor Green
Write-Host ""

# Verifica remote
$remote = git remote get-url origin 2>$null
if ($remote) {
    Write-Host "📡 Remote configurado: $remote" -ForegroundColor Green
} else {
    Write-Host "⚠️  Remote não configurado" -ForegroundColor Yellow
    git remote add origin https://github.com/docescoisas5-bit/tosse.git
    Write-Host "✅ Remote adicionado" -ForegroundColor Green
}

Write-Host ""
Write-Host "Escolha o método de autenticação:" -ForegroundColor Cyan
Write-Host "1. Personal Access Token (PAT) - Recomendado" -ForegroundColor White
Write-Host "2. GitHub CLI (gh)" -ForegroundColor White
Write-Host "3. SSH" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Digite sua escolha (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "📝 Personal Access Token (PAT)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Acesse: https://github.com/settings/tokens" -ForegroundColor Yellow
        Write-Host "2. Clique em 'Generate new token (classic)'" -ForegroundColor Yellow
        Write-Host "3. Dê um nome (ex: 'tosse-app')" -ForegroundColor Yellow
        Write-Host "4. Selecione escopo: repo (acesso completo)" -ForegroundColor Yellow
        Write-Host "5. Clique em 'Generate token'" -ForegroundColor Yellow
        Write-Host "6. COPIE o token (você só verá uma vez!)" -ForegroundColor Yellow
        Write-Host ""
        
        $token = Read-Host "Cole seu Personal Access Token" -AsSecureString
        $tokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
        )
        
        if ($tokenPlain) {
            Write-Host ""
            Write-Host "🔧 Configurando remote com token..." -ForegroundColor Cyan
            git remote set-url origin "https://${tokenPlain}@github.com/docescoisas5-bit/tosse.git"
            Write-Host "✅ Remote configurado" -ForegroundColor Green
        } else {
            Write-Host "❌ Token inválido" -ForegroundColor Red
            exit 1
        }
    }
    "2" {
        Write-Host ""
        Write-Host "🔧 GitHub CLI" -ForegroundColor Cyan
        
        # Verifica se gh está instalado
        $ghInstalled = Get-Command gh -ErrorAction SilentlyContinue
        if (-not $ghInstalled) {
            Write-Host "⚠️  GitHub CLI não encontrado" -ForegroundColor Yellow
            Write-Host "   Instalando via winget..." -ForegroundColor Yellow
            winget install GitHub.cli
        }
        
        Write-Host "🔐 Autenticando com GitHub CLI..." -ForegroundColor Cyan
        gh auth login
    }
    "3" {
        Write-Host ""
        Write-Host "🔧 SSH" -ForegroundColor Cyan
        Write-Host "Alterando remote para SSH..." -ForegroundColor Yellow
        git remote set-url origin git@github.com:docescoisas5-bit/tosse.git
        Write-Host "✅ Remote alterado para SSH" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  Certifique-se de ter configurado SSH key no GitHub" -ForegroundColor Yellow
        Write-Host "   Guia: https://docs.github.com/en/authentication/connecting-to-github-with-ssh" -ForegroundColor Yellow
    }
    default {
        Write-Host "❌ Opção inválida" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🚀 Fazendo push para GitHub..." -ForegroundColor Cyan
Write-Host ""

try {
    git push -u origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  ✅ Push realizado com sucesso!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "📦 Repositório atualizado:" -ForegroundColor Cyan
        Write-Host "   https://github.com/docescoisas5-bit/tosse" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ Erro ao fazer push" -ForegroundColor Red
        Write-Host "   Verifique suas credenciais e permissões" -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "❌ Erro: $_" -ForegroundColor Red
}

Write-Host ""

