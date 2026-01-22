# Script para gerar APK com todas as variáveis de ambiente
# Uso: .\gerar-apk.ps1

Write-Host "📱 Gerador de APK - Configuração Automática" -ForegroundColor Cyan
Write-Host ""

# Verifica se está logado no EAS
Write-Host "🔍 Verificando login no EAS..." -ForegroundColor Yellow
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Você não está logado no EAS!" -ForegroundColor Red
    Write-Host "Execute: eas login" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Logado no EAS" -ForegroundColor Green
Write-Host ""

# Variáveis padrão
$SUPABASE_URL = "https://gorslmmmivhbjrczsoie.supabase.co"
$MODEL_URL = "https://gorslmmmivhbjrczsoie.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json"

# Solicita a chave anônima do Supabase
Write-Host "🔑 Configuração de Variáveis de Ambiente" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para obter a chave anônima do Supabase:" -ForegroundColor Yellow
Write-Host "1. Acesse: https://supabase.com/dashboard/project/gorslmmmivhbjrczsoie/settings/api" -ForegroundColor Yellow
Write-Host "2. Copie a chave 'anon public' (não a service_role)" -ForegroundColor Yellow
Write-Host ""
$SUPABASE_ANON_KEY = Read-Host "Cole a chave anônima do Supabase aqui"

if ([string]::IsNullOrWhiteSpace($SUPABASE_ANON_KEY)) {
    Write-Host "❌ Chave anônima não fornecida!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📝 Configurando variáveis de ambiente no EAS..." -ForegroundColor Yellow

# Configura EXPO_PUBLIC_SUPABASE_URL
Write-Host "  - Configurando EXPO_PUBLIC_SUPABASE_URL..." -ForegroundColor Gray
$result1 = eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value $SUPABASE_URL 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "    ✅ EXPO_PUBLIC_SUPABASE_URL configurada" -ForegroundColor Green
} else {
    # Pode já existir, tenta atualizar
    Write-Host "    ⚠️  Variável pode já existir, tentando atualizar..." -ForegroundColor Yellow
    eas secret:delete --scope project --name EXPO_PUBLIC_SUPABASE_URL 2>&1 | Out-Null
    eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value $SUPABASE_URL 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ EXPO_PUBLIC_SUPABASE_URL atualizada" -ForegroundColor Green
    }
}

# Configura EXPO_PUBLIC_SUPABASE_ANON_KEY
Write-Host "  - Configurando EXPO_PUBLIC_SUPABASE_ANON_KEY..." -ForegroundColor Gray
$result2 = eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value $SUPABASE_ANON_KEY 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "    ✅ EXPO_PUBLIC_SUPABASE_ANON_KEY configurada" -ForegroundColor Green
} else {
    # Pode já existir, tenta atualizar
    Write-Host "    ⚠️  Variável pode já existir, tentando atualizar..." -ForegroundColor Yellow
    eas secret:delete --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY 2>&1 | Out-Null
    eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value $SUPABASE_ANON_KEY 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ EXPO_PUBLIC_SUPABASE_ANON_KEY atualizada" -ForegroundColor Green
    }
}

# Configura EXPO_PUBLIC_MODEL_URL
Write-Host "  - Configurando EXPO_PUBLIC_MODEL_URL..." -ForegroundColor Gray
$result3 = eas secret:create --scope project --name EXPO_PUBLIC_MODEL_URL --value $MODEL_URL 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "    ✅ EXPO_PUBLIC_MODEL_URL configurada" -ForegroundColor Green
} else {
    # Pode já existir, tenta atualizar
    Write-Host "    ⚠️  Variável pode já existir, tentando atualizar..." -ForegroundColor Yellow
    eas secret:delete --scope project --name EXPO_PUBLIC_MODEL_URL 2>&1 | Out-Null
    eas secret:create --scope project --name EXPO_PUBLIC_MODEL_URL --value $MODEL_URL 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ EXPO_PUBLIC_MODEL_URL atualizada" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Todas as variáveis configuradas!" -ForegroundColor Green
Write-Host ""

# Verifica variáveis configuradas
Write-Host "📋 Variáveis configuradas:" -ForegroundColor Cyan
eas env:list
Write-Host ""

# Pergunta se deseja gerar o build
Write-Host "🚀 Deseja gerar o APK agora?" -ForegroundColor Cyan
$response = Read-Host "Digite 's' para sim ou 'n' para não"

if ($response -eq 's' -or $response -eq 'S') {
    Write-Host ""
    Write-Host "📦 Iniciando build do APK..." -ForegroundColor Yellow
    Write-Host "   Isso pode levar 10-20 minutos..." -ForegroundColor Gray
    Write-Host ""
    
    # Pergunta qual perfil usar
    Write-Host "Escolha o perfil de build:" -ForegroundColor Cyan
    Write-Host "1. Production (APK para produção)" -ForegroundColor Yellow
    Write-Host "2. Preview (APK para testes)" -ForegroundColor Yellow
    $profileChoice = Read-Host "Digite 1 ou 2"
    
    if ($profileChoice -eq "1") {
        $profile = "production"
    } else {
        $profile = "preview"
    }
    
    Write-Host ""
    Write-Host "🔨 Gerando APK com perfil: $profile" -ForegroundColor Cyan
    Write-Host ""
    
    eas build --platform android --profile $profile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Build iniciado com sucesso!" -ForegroundColor Green
        Write-Host "📧 Você receberá um email quando o build estiver pronto" -ForegroundColor Yellow
        Write-Host "🔗 Acesse o dashboard do EAS para acompanhar o progresso" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "❌ Erro ao iniciar o build" -ForegroundColor Red
        Write-Host "Verifique os logs acima para mais detalhes" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "✅ Variáveis configuradas! Execute o build quando quiser:" -ForegroundColor Green
    Write-Host "   eas build --platform android --profile production" -ForegroundColor Yellow
    Write-Host "   ou" -ForegroundColor Gray
    Write-Host "   eas build --platform android --profile preview" -ForegroundColor Yellow
}

Write-Host ""

