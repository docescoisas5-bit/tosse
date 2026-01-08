# Como Verificar se o Setup Admin Foi Executado Corretamente

## Verificação Rápida

Execute este SQL no Supabase SQL Editor para verificar se tudo está configurado:

```sql
-- Verifica se a tabela user_profiles existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
) as tabela_existe;

-- Verifica se há usuários na tabela
SELECT COUNT(*) as total_usuarios FROM user_profiles;

-- Lista todos os usuários e seus roles
SELECT id, email, role, created_at 
FROM user_profiles 
ORDER BY created_at DESC;
```

## Se a Tabela Não Existe

Se a verificação mostrar que a tabela não existe, execute o script completo:

1. Abra o arquivo `supabase-admin-setup.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Execute (Run)

## Se Houver Erros ao Executar o Script

### Erro: "relation already exists"
- Isso significa que algumas partes já foram criadas
- Você pode ignorar esses erros ou usar `CREATE OR REPLACE` / `DROP IF EXISTS`

### Erro: "permission denied"
- Verifique se você está usando a conta de administrador do Supabase
- Algumas operações podem precisar de privilégios especiais

### Erro: "function already exists"
- Use `CREATE OR REPLACE FUNCTION` em vez de `CREATE FUNCTION`

## Script de Correção

Se você já executou parte do script e está tendo problemas, execute este script de limpeza e depois execute o script completo novamente:

```sql
-- CUIDADO: Este script remove tudo relacionado ao admin
-- Use apenas se precisar recomeçar do zero

-- Remove políticas
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all analyses" ON analyses;
DROP POLICY IF EXISTS "Admins can delete any analysis" ON analyses;
DROP POLICY IF EXISTS "Admins can view all recordings" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any recording" ON storage.objects;

-- Remove função
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Remove trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remove view
DROP VIEW IF EXISTS admin_stats;

-- Remove tabela (CUIDADO: isso apaga todos os dados!)
-- DROP TABLE IF EXISTS user_profiles CASCADE;
```

Depois de limpar, execute o `supabase-admin-setup.sql` completo novamente.

