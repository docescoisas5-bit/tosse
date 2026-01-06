# Script para configurar autenticação Git para GitHub

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuração de Autenticação Git" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se está no diretório correto
if (-not (Test-Path ".git")) {
    Write-Host "❌ Erro: Não é um repositório Git" -ForegroundColor Red
    exit 1
}

Write-Host "Escolha o método de autenticação:" -ForegroundColor Yellow
Write-Host "1. Personal Access Token (HTTPS)" -ForegroundColor White
Write-Host "2. SSH Key" -ForegroundColor White
Write-Host "3. GitHub CLI" -ForegroundColor White
Write-Host ""

$opcao = Read-Host "Digite o número da opção (1-3)"

switch ($opcao) {
    "1" {
        Write-Host ""
        Write-Host "📝 Personal Access Token (PAT)" -ForegroundColor Green
        Write-Host ""
        Write-Host "1. Acesse: https://github.com/settings/tokens" -ForegroundColor Yellow
        Write-Host "2. Clique em 'Generate new token (classic)'" -ForegroundColor Yellow
        Write-Host "3. Dê um nome (ex: 'tosse-app')" -ForegroundColor Yellow
        Write-Host "4. Selecione escopo: repo (marcar checkbox)" -ForegroundColor Yellow
        Write-Host "5. Clique em 'Generate token'" -ForegroundColor Yellow
        Write-Host "6. COPIE o token (você só verá uma vez!)" -ForegroundColor Yellow
        Write-Host ""
        
        $token = Read-Host "Cole o token aqui" -AsSecureString
        $tokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($token))
        
        if ($tokenPlain) {
            git remote set-url origin "https://$tokenPlain@github.com/docescoisas5-bit/tosse.git"
            Write-Host ""
            Write-Host "✅ Remote configurado com token" -ForegroundColor Green
            Write-Host ""
            Write-Host "Tentando fazer push..." -ForegroundColor Yellow
            git push -u origin main
        } else {
            Write-Host "❌ Token não fornecido" -ForegroundColor Red
        }
    }
    
    "2" {
        Write-Host ""
        Write-Host "🔐 SSH Key" -ForegroundColor Green
        Write-Host ""
        Write-Host "Verificando se SSH key existe..." -ForegroundColor Yellow
        
        if (Test-Path "$env:USERPROFILE\.ssh\id_rsa.pub") {
            Write-Host "✅ SSH key encontrada" -ForegroundColor Green
            Write-Host ""
            Write-Host "Sua chave pública:" -ForegroundColor Yellow
            Get-Content "$env:USERPROFILE\.ssh\id_rsa.pub"
            Write-Host ""
            Write-Host "Se ainda não adicionou ao GitHub:" -ForegroundColor Yellow
            Write-Host "1. Acesse: https://github.com/settings/keys" -ForegroundColor White
            Write-Host "2. Clique em 'New SSH key'" -ForegroundColor White
            Write-Host "3. Cole a chave acima" -ForegroundColor White
            Write-Host ""
            
            $continuar = Read-Host "Já adicionou a chave ao GitHub? (s/n)"
            if ($continuar -eq "s" -or $continuar -eq "S") {
                git remote set-url origin "git@github.com:docescoisas5-bit/tosse.git"
                Write-Host ""
                Write-Host "✅ Remote configurado para SSH" -ForegroundColor Green
                Write-Host ""
                Write-Host "Tentando fazer push..." -ForegroundColor Yellow
                git push -u origin main
            }
        } else {
            Write-Host "❌ SSH key não encontrada" -ForegroundColor Red
            Write-Host ""
            Write-Host "Para criar uma SSH key:" -ForegroundColor Yellow
            Write-Host "ssh-keygen -t ed25519 -C 'seu-email@example.com'" -ForegroundColor White
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "🛠️ GitHub CLI" -ForegroundColor Green
        Write-Host ""
        
        # Verifica se GitHub CLI está instalado
        $ghInstalled = Get-Command gh -ErrorAction SilentlyContinue
        if ($ghInstalled) {
            Write-Host "✅ GitHub CLI encontrado" -ForegroundColor Green
            Write-Host ""
            Write-Host "Autenticando..." -ForegroundColor Yellow
            gh auth login
            Write-Host ""
            Write-Host "Tentando fazer push..." -ForegroundColor Yellow
            git push -u origin main
        } else {
            Write-Host "❌ GitHub CLI não instalado" -ForegroundColor Red
            Write-Host ""
            Write-Host "Para instalar:" -ForegroundColor Yellow
            Write-Host "winget install GitHub.cli" -ForegroundColor White
            Write-Host "Ou baixe em: https://cli.github.com" -ForegroundColor White
        }
    }
    
    default {
        Write-Host "❌ Opção inválida" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

