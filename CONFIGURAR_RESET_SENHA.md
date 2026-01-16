# 🔐 Configuração de Redefinição de Senha com Código OTP

## ✅ Funcionalidade Implementada

O sistema de redefinição de senha foi implementado com as seguintes telas:

1. **forgot-password.tsx** - Solicita redefinição de senha
2. **verify-code.tsx** - Insere código de 6 dígitos recebido por email
3. **reset-password.tsx** - Define nova senha após verificação

## ⚙️ Configuração do Supabase

### ✅ Código OTP Implementado

O código agora usa `signInWithOtp` que **envia código OTP de 6 dígitos** por email automaticamente.

### Configuração Necessária no Supabase

1. **Acesse o Dashboard do Supabase**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Configure Authentication Settings**
   - Vá em **Authentication** > **Settings**
   - Role até a seção **Email Auth**
   - Ative **"Enable email confirmations"** se ainda não estiver ativo
   - Verifique se **"Enable email signup"** está ativo

3. **Configure Email Templates (Opcional)**
   - Vá em **Authentication** > **Email Templates**
   - Selecione o template **"Magic Link"** (usado para OTP)
   - Você pode personalizar o template para melhorar a aparência do email
   - O código OTP será incluído automaticamente no email

4. **Verificar Configuração de Email**
   - Certifique-se de que o email está configurado corretamente
   - Se estiver usando SMTP customizado, verifique as configurações
   - O Supabase envia o código OTP automaticamente quando `signInWithOtp` é chamado

### Opção 2: Usar Magic Link (Padrão)

Se o Supabase estiver configurado para enviar links (padrão):

1. O usuário receberá um link no email
2. Ao clicar no link, será redirecionado para o app
3. O app pode capturar o token do link e processar

## 🔧 Ajustes Necessários

### Se o Supabase Enviar Links em vez de Códigos

Se o Supabase estiver enviando links em vez de códigos, você tem duas opções:

#### Opção A: Configurar Email Template Personalizado

1. No Dashboard do Supabase, vá em **Authentication** > **Email Templates**
2. Edite o template **"Reset Password"**
3. Personalize para incluir um código de 6 dígitos
4. Use variáveis do Supabase para gerar o código

#### Opção B: Usar Deep Link

1. Configure o deep link `tosse://reset-password` no app
2. O link do email redireciona para o app
3. O app extrai o token do link e processa

## 📱 Fluxo do Usuário

1. **Usuário esquece a senha**
   - Clica em "Esqueceu sua senha?" na tela de login
   - Digita o email na tela de redefinição
   - Clica em "Enviar Código"

2. **Recebe código por email**
   - Supabase envia email com código de 6 dígitos
   - Usuário verifica a caixa de entrada

3. **Insere código**
   - Usuário digita o código de 6 dígitos
   - Clica em "Verificar Código"

4. **Define nova senha**
   - Após verificação, usuário define nova senha
   - Confirma a senha
   - Clica em "Redefinir Senha"

5. **Login automático**
   - Após redefinir, usuário é redirecionado para login
   - Pode fazer login com a nova senha

## 🐛 Troubleshooting

### Erro: "Email não enviado"

- Verifique se o email está cadastrado no sistema
- Verifique as configurações de email do Supabase
- Verifique se há limites de rate limiting

### Erro: "Código inválido"

- O código expira após alguns minutos
- Solicite um novo código
- Verifique se digitou todos os 6 dígitos corretamente

### Erro: "Sessão não criada"

- O código pode ter expirado
- Solicite um novo código
- Verifique a conexão com internet

## 📝 Notas

- O código OTP expira após alguns minutos (configurável no Supabase)
- O usuário pode solicitar reenvio do código
- A senha deve ter pelo menos 6 caracteres
- O sistema valida se as senhas coincidem antes de salvar

## 🔗 Links Úteis

- [Documentação Supabase Auth](https://supabase.com/docs/guides/auth)
- [Email Templates do Supabase](https://supabase.com/docs/guides/auth/auth-email-templates)
- [OTP Authentication](https://supabase.com/docs/guides/auth/auth-otp)

