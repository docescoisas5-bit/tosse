-- Migration: Adicionar campos nome, foto e endereço ao user_profiles
-- Execute este script no Supabase SQL Editor

-- Adicionar colunas ao user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Comentários
COMMENT ON COLUMN user_profiles.name IS 'Nome completo do usuário';
COMMENT ON COLUMN user_profiles.photo_url IS 'URL da foto de perfil do usuário';
COMMENT ON COLUMN user_profiles.address IS 'Endereço do usuário';

-- Política: usuários podem atualizar seu próprio perfil
-- Remove a política se já existir antes de criar
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Políticas RLS para fotos de perfil no storage
-- Política para upload de fotos de perfil: usuários podem fazer upload apenas em suas próprias pastas
DROP POLICY IF EXISTS "Users can upload own profile photos" ON storage.objects;
CREATE POLICY "Users can upload own profile photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cough-recordings' AND
    (storage.foldername(name))[1] = 'profile-photos' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Política para visualizar fotos de perfil: usuários podem ver suas próprias fotos
DROP POLICY IF EXISTS "Users can view own profile photos" ON storage.objects;
CREATE POLICY "Users can view own profile photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'cough-recordings' AND
    (storage.foldername(name))[1] = 'profile-photos' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Política para deletar fotos de perfil: usuários podem deletar suas próprias fotos
DROP POLICY IF EXISTS "Users can delete own profile photos" ON storage.objects;
CREATE POLICY "Users can delete own profile photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cough-recordings' AND
    (storage.foldername(name))[1] = 'profile-photos' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Política para admins verem todas as fotos de perfil
DROP POLICY IF EXISTS "Admins can view all profile photos" ON storage.objects;
CREATE POLICY "Admins can view all profile photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'cough-recordings' AND
    (storage.foldername(name))[1] = 'profile-photos' AND
    public.is_admin() = true
  );

