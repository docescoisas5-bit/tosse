-- Script para criar usuário admin diretamente
-- Execute este script no Supabase SQL Editor

-- IMPORTANTE: Substitua 'admin@exemplo.com' pelo email desejado
-- IMPORTANTE: A senha será definida via Supabase Auth API, não via SQL
-- Use o método abaixo para criar o usuário

-- Método 1: Criar usuário via Supabase Dashboard (RECOMENDADO)
-- 1. Vá em Authentication > Users > Add User
-- 2. Preencha:
--    - Email: admin@exemplo.com (ou o email que você quiser)
--    - Password: 200220
--    - Auto Confirm User: ✅ (marcado)
-- 3. Clique em "Create User"
-- 4. Depois execute o SQL abaixo para tornar admin:

-- Método 2: Criar perfil admin para usuário existente
-- Se você já criou o usuário, execute apenas este SQL:

-- Primeiro, verifique se o usuário existe e obtenha o ID
-- (Substitua 'SEU_EMAIL@exemplo.com' pelo email do admin)
DO $$
DECLARE
  user_id_var UUID;
  user_email_var TEXT := 'maurosawilala@gmail.com'; -- ALTERE AQUI O EMAIL
BEGIN
  -- Busca o ID do usuário pelo email
  SELECT id INTO user_id_var
  FROM auth.users
  WHERE email = user_email_var;
  
  IF user_id_var IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado. Crie o usuário primeiro via Dashboard ou app.', user_email_var;
  END IF;
  
  -- Cria ou atualiza o perfil como admin
  INSERT INTO user_profiles (id, email, role, created_at, updated_at)
  VALUES (user_id_var, user_email_var, 'admin', NOW(), NOW())
  ON CONFLICT (id) 
  DO UPDATE SET 
    role = 'admin',
    updated_at = NOW(),
    email = user_email_var;
  
  RAISE NOTICE 'Usuário % tornou-se admin com sucesso!', user_email_var;
END $$;

-- Verificação: Lista todos os admins
SELECT id, email, role, created_at
FROM user_profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

