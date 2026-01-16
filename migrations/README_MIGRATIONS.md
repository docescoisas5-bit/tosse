# Migrations - Adicionar Campos ao Perfil

## Executar Migration

Para adicionar os campos `name`, `photo_url` e `address` à tabela `user_profiles` e permitir upload de fotos de perfil, execute o seguinte script no Supabase SQL Editor:

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Vá para o seu projeto
3. Clique em "SQL Editor" no menu lateral
4. Cole o conteúdo do arquivo `add_profile_fields.sql`
5. Clique em "Run" para executar

## O que a migration faz:

- Adiciona as colunas `name`, `photo_url` e `address` à tabela `user_profiles`
- Cria uma política RLS para permitir que usuários atualizem seu próprio perfil
- Adiciona políticas RLS para permitir upload, visualização e exclusão de fotos de perfil no storage
- Adiciona comentários descritivos às colunas

## Verificar se funcionou:

Após executar a migration, você pode verificar se as colunas foram adicionadas executando:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles';
```

Você deve ver as novas colunas: `name`, `photo_url` e `address`.

Para verificar as políticas de storage:

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%profile%';
```

## Nota sobre fotos de perfil:

As fotos de perfil são armazenadas no bucket `cough-recordings` no caminho `profile-photos/{user_id}/{timestamp}.jpg`. As políticas RLS garantem que:
- Usuários só podem fazer upload de fotos em suas próprias pastas
- Usuários só podem ver suas próprias fotos
- Admins podem ver todas as fotos de perfil

