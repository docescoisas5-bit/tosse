# Instruções Completas para Criar Admin com Senha

## Método 1: Via Supabase Dashboard (Mais Fácil)

### Passo 1: Criar o Usuário

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Authentication** → **Users**
4. Clique em **Add User** (ou **Invite User**)
5. Preencha:
   - **Email**: `admin@exemplo.com` (ou o email que você quiser)
   - **Password**: `200220`
   - **Auto Confirm User**: ✅ **MARQUE ESTA OPÇÃO** (importante!)
6. Clique em **Create User**

### Passo 2: Tornar Admin

1. No Supabase Dashboard, vá em **SQL Editor**
2. Execute este SQL (substitua o email pelo que você usou):

```sql
-- Substitua 'admin@exemplo.com' pelo email que você criou
UPDATE user_profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'admin@exemplo.com';
```

3. Verifique se funcionou:

```sql
-- Lista todos os admins
SELECT id, email, role, created_at
FROM user_profiles
WHERE role = 'admin';
```

### Passo 3: Testar no App

1. Abra o app
2. Faça login com:
   - **Email**: O email que você criou
   - **Senha**: `200220`
3. Você deve ver o botão **"Painel Admin"** na tela home

---

## Método 2: Via App + SQL

### Passo 1: Criar Conta Normal

1. Abra o app
2. Vá em **Registrar** (ou **Register**)
3. Crie uma conta com:
   - **Email**: `admin@exemplo.com` (ou o email que você quiser)
   - **Senha**: `200220`
4. Faça login

### Passo 2: Tornar Admin via SQL

1. No Supabase Dashboard, vá em **SQL Editor**
2. Execute este SQL (substitua o email):

```sql
UPDATE user_profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'admin@exemplo.com';
```

3. **Faça logout e login novamente** no app
4. O botão "Painel Admin" deve aparecer

---

## Método 3: Script SQL Completo (Avançado)

Se você já tem o usuário criado, execute o arquivo `criar-admin-usuario.sql`:

1. Abra `criar-admin-usuario.sql`
2. Altere a linha com o email: `user_email_var TEXT := 'admin@exemplo.com';`
3. Cole no SQL Editor do Supabase
4. Execute

---

## Verificação Final

Execute este SQL para verificar se está tudo certo:

```sql
-- Verifica se o admin foi criado
SELECT 
  up.id,
  up.email,
  up.role,
  up.created_at,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE up.role = 'admin'
ORDER BY up.created_at DESC;
```

Você deve ver:
- ✅ Email do admin
- ✅ Role = 'admin'
- ✅ Email confirmado

---

## Troubleshooting

### Erro: "relation user_profiles does not exist"
- **Solução**: Execute o arquivo `supabase-admin-setup.sql` primeiro!

### Erro: "Usuário não encontrado"
- **Solução**: Crie o usuário primeiro via Dashboard ou app

### Botão "Painel Admin" não aparece
- **Solução**: 
  1. Verifique se o role está como 'admin' no SQL
  2. Faça logout e login novamente
  3. Verifique os logs do app para erros

### Senha não funciona
- **Solução**: 
  1. No Dashboard → Authentication → Users
  2. Encontre o usuário
  3. Clique em "..." → "Reset Password"
  4. Ou use "Update User" para definir nova senha

---

## Credenciais Sugeridas

Para facilitar, você pode usar:

- **Email**: `admin@tosse.app` (ou qualquer email válido)
- **Senha**: `200220`

Depois de criar, execute:

```sql
UPDATE user_profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'admin@tosse.app';
```

