-- Script para corrigir políticas RLS que causam recursão infinita
-- Execute este script no Supabase SQL Editor

-- Remove as políticas antigas que causam recursão
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all analyses" ON analyses;
DROP POLICY IF EXISTS "Admins can delete any analysis" ON analyses;
DROP POLICY IF EXISTS "Admins can view all recordings" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete any recording" ON storage.objects;

-- Recria as políticas usando a função is_admin() para evitar recursão
-- Política: admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (public.is_admin() = true);

-- Política: admins podem atualizar perfis
CREATE POLICY "Admins can update profiles"
  ON user_profiles FOR UPDATE
  USING (public.is_admin() = true);

-- Política: admins podem ver todas as análises
CREATE POLICY "Admins can view all analyses"
  ON analyses FOR SELECT
  USING (public.is_admin() = true);

-- Política: admins podem deletar qualquer análise
CREATE POLICY "Admins can delete any analysis"
  ON analyses FOR DELETE
  USING (public.is_admin() = true);

-- Política: admins podem ver todos os áudios
CREATE POLICY "Admins can view all recordings"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'cough-recordings' AND
    public.is_admin() = true
  );

-- Política: admins podem deletar qualquer áudio
CREATE POLICY "Admins can delete any recording"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cough-recordings' AND
    public.is_admin() = true
  );

-- Verifica se a função is_admin() existe (deve ter sido criada no script principal)
-- Se não existir, cria aqui
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS corrigidas com sucesso!';
END $$;

