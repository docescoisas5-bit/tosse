-- Migration: Adicionar política RLS para upload de fotos de perfil
-- Execute este script no Supabase SQL Editor

-- Política para upload de fotos de perfil: usuários podem fazer upload apenas em suas próprias pastas
CREATE POLICY "Users can upload own profile photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cough-recordings' AND
    (storage.foldername(name))[1] = 'profile-photos' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Política para visualizar fotos de perfil: usuários podem ver suas próprias fotos
CREATE POLICY "Users can view own profile photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'cough-recordings' AND
    (storage.foldername(name))[1] = 'profile-photos' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Política para deletar fotos de perfil: usuários podem deletar suas próprias fotos
CREATE POLICY "Users can delete own profile photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cough-recordings' AND
    (storage.foldername(name))[1] = 'profile-photos' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Política para admins verem todas as fotos de perfil
CREATE POLICY "Admins can view all profile photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'cough-recordings' AND
    (storage.foldername(name))[1] = 'profile-photos' AND
    public.is_admin() = true
  );

