-- Script SQL para configurar sistema de admin
-- Execute este script no Supabase SQL Editor após o supabase-setup.sql

-- 1. Adicionar coluna 'role' na tabela auth.users (via função)
-- Nota: Não podemos modificar auth.users diretamente, então criamos uma tabela de perfis

-- Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índice para busca rápida por role
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles(role);

-- Função para criar perfil automaticamente quando um usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS para user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Política: admins podem ver todos os perfis
-- CORREÇÃO: Usa a função is_admin() para evitar recursão infinita
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (public.is_admin() = true);

-- Política: admins podem atualizar perfis
-- CORREÇÃO: Usa a função is_admin() para evitar recursão infinita
CREATE POLICY "Admins can update profiles"
  ON user_profiles FOR UPDATE
  USING (public.is_admin() = true);

-- 2. Políticas RLS para admins na tabela analyses

-- Política: admins podem ver todas as análises
-- CORREÇÃO: Usa a função is_admin() para evitar recursão infinita
CREATE POLICY "Admins can view all analyses"
  ON analyses FOR SELECT
  USING (public.is_admin() = true);

-- Política: admins podem deletar qualquer análise
-- CORREÇÃO: Usa a função is_admin() para evitar recursão infinita
CREATE POLICY "Admins can delete any analysis"
  ON analyses FOR DELETE
  USING (public.is_admin() = true);

-- 3. Políticas de storage para admins

-- Política: admins podem ver todos os áudios
-- CORREÇÃO: Usa a função is_admin() para evitar recursão infinita
CREATE POLICY "Admins can view all recordings"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'cough-recordings' AND
    public.is_admin() = true
  );

-- Política: admins podem deletar qualquer áudio
-- CORREÇÃO: Usa a função is_admin() para evitar recursão infinita
CREATE POLICY "Admins can delete any recording"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cough-recordings' AND
    public.is_admin() = true
  );

-- 4. Função helper para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. View para estatísticas do admin
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM analyses) as total_analyses,
  (SELECT COUNT(*) FROM user_profiles WHERE role = 'admin') as total_admins,
  (SELECT COUNT(DISTINCT user_id) FROM analyses) as users_with_analyses,
  (SELECT AVG((diagnosis->>'confidence')::float) FROM analyses) as avg_confidence;

-- 6. Comentários
COMMENT ON TABLE user_profiles IS 'Perfis de usuário com roles (user/admin)';
COMMENT ON FUNCTION public.is_admin() IS 'Verifica se o usuário atual é admin';
COMMENT ON VIEW admin_stats IS 'Estatísticas gerais do sistema para admins';

