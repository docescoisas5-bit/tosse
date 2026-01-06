-- Script SQL para configurar o banco de dados Supabase

-- Tabela para armazenar análises
CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  diagnosis JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS analyses_user_id_idx ON analyses(user_id);
CREATE INDEX IF NOT EXISTS analyses_created_at_idx ON analyses(created_at DESC);

-- RLS (Row Level Security) Policies
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver suas próprias análises
CREATE POLICY "Users can view own analyses"
  ON analyses FOR SELECT
  USING (auth.uid() = user_id);

-- Política: usuários só podem inserir suas próprias análises
CREATE POLICY "Users can insert own analyses"
  ON analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: usuários só podem deletar suas próprias análises
CREATE POLICY "Users can delete own analyses"
  ON analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Criar bucket de storage para áudios (execute no Supabase Dashboard > Storage)
-- Nome do bucket: cough-recordings
-- Público: Não (privado)
-- Política de storage (execute no SQL Editor):

-- Política para upload: usuários podem fazer upload apenas em suas próprias pastas
CREATE POLICY "Users can upload own recordings"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cough-recordings' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política para download: usuários podem baixar apenas seus próprios arquivos
CREATE POLICY "Users can download own recordings"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'cough-recordings' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política para delete: usuários podem deletar apenas seus próprios arquivos
CREATE POLICY "Users can delete own recordings"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cough-recordings' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

