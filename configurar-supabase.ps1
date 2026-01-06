# Script PowerShell para configurar o Supabase
# Execute este script após fornecer o ID do projeto

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId
)

Write-Host "Configurando projeto Supabase: $ProjectId" -ForegroundColor Green

# Lê o script SQL
$sqlScript = Get-Content -Path "supabase-setup.sql" -Raw

Write-Host "Script SQL carregado. Execute manualmente no SQL Editor do Supabase Dashboard." -ForegroundColor Yellow
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Acesse o Supabase Dashboard"
Write-Host "2. Vá em SQL Editor"
Write-Host "3. Cole o conteúdo do arquivo supabase-setup.sql"
Write-Host "4. Execute o script"
Write-Host "5. Vá em Storage e crie o bucket 'cough-recordings' (privado)"
Write-Host ""
Write-Host "ID do Projeto: $ProjectId" -ForegroundColor Green

