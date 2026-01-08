# Como Criar uma Conta de Admin

## Passo 1: Executar Script SQL (OBRIGATÓRIO)

⚠️ **IMPORTANTE**: Você DEVE executar o script SQL antes de tentar criar um admin!

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Execute primeiro o arquivo `supabase-setup.sql` (se ainda não executou)
5. **Execute o arquivo `supabase-admin-setup.sql` COMPLETO** para criar:
   - Tabela `user_profiles` com roles
   - Políticas RLS para admins
   - Funções helper
   - View de estatísticas

### Como executar o script:

1. Abra o arquivo `supabase-admin-setup.sql` no seu editor
2. Copie TODO o conteúdo do arquivo
3. No Supabase Dashboard → SQL Editor → New Query
4. Cole o conteúdo completo
5. Clique em **Run** (ou pressione Ctrl+Enter)
6. Aguarde a mensagem de sucesso

**Se você receber erro "relation user_profiles does not exist"**, significa que o script ainda não foi executado. Execute o script primeiro!

## Passo 2: Criar Usuário Admin

### Opção A: Criar via Dashboard (Recomendado)

1. No Supabase Dashboard, vá em **Authentication** → **Users**
2. Clique em **Add User**
3. Preencha:
   - **Email**: `admin@exemplo.com` (ou o email que você quiser)
   - **Password**: `200220` (ou a senha que você quiser)
   - **Auto Confirm User**: ✅ **MARQUE ESTA OPÇÃO**
4. Clique em **Create User**

### Opção B: Criar via App

1. Abra o app e vá em **Registrar**
2. Crie uma conta com email e senha desejados
3. Faça login

### Passo 3: Tornar Admin via SQL

Depois de criar o usuário (por qualquer método acima), execute este SQL:

```sql
-- Substitua 'SEU_EMAIL@exemplo.com' pelo email que você criou
UPDATE user_profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'SEU_EMAIL@exemplo.com';
```

**Exemplo com senha 200220:**
```sql
-- Se você criou com email admin@exemplo.com e senha 200220:
UPDATE user_profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'admin@exemplo.com';
```

### Opção 2: Via Table Editor

1. No Supabase Dashboard, vá em **Table Editor**
2. Selecione a tabela `user_profiles`
3. Encontre o usuário pelo email
4. Edite a linha e altere o campo `role` de `user` para `admin`
5. Salve

## Passo 3: Verificar

1. Faça login no app com a conta que você tornou admin
2. Você deve ver o botão **"Painel Admin"** na tela home
3. Clique no botão para acessar o painel administrativo

## Funcionalidades do Painel Admin

O painel admin permite:

- **Estatísticas**: Ver estatísticas gerais do sistema
- **Usuários**: Ver todos os usuários, alterar roles, ver análises de cada usuário
- **Análises**: Ver todas as análises, deletar análises
- **Áudios**: Listar todos os áudios gravados, obter URLs para ouvir

## Criar Mais Admins

Para criar mais admins, você pode:

1. **Via Painel Admin** (se já for admin):
   - Acesse o painel admin
   - Vá na aba "Usuários"
   - Clique em "Tornar Admin" no usuário desejado

2. **Via SQL**:
   ```sql
   UPDATE user_profiles
   SET role = 'admin', updated_at = NOW()
   WHERE email = 'NOVO_ADMIN@exemplo.com';
   ```

## Segurança

- Apenas usuários com `role = 'admin'` podem acessar o painel
- As políticas RLS garantem que apenas admins podem ver dados de outros usuários
- Admins podem gerenciar roles de outros usuários
- Admins podem deletar análises e acessar áudios de qualquer usuário

