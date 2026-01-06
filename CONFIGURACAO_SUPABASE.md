# Configuração do Supabase - Projeto appcolera

## ID do Projeto
`gorslmmmivhbjrczsoie`

## Passo 1: Obter Credenciais

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione o projeto **appcolera**
3. Vá em **Settings** > **API**
4. Copie:
   - **Project URL**: `https://gorslmmmivhbjrczsoie.supabase.co`
   - **anon/public key**: (chave anônima)

## Passo 2: Configurar Banco de Dados

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo completo do arquivo `supabase-setup.sql`
4. Clique em **Run** para executar

Isso criará:
- Tabela `analyses` para armazenar análises
- Índices para performance
- Políticas RLS (Row Level Security)
- Políticas de Storage

## Passo 3: Criar Bucket de Storage

1. No Supabase Dashboard, vá em **Storage**
2. Clique em **New bucket**
3. Configure:
   - **Name**: `cough-recordings`
   - **Public bucket**: ❌ **DESMARCADO** (privado)
4. Clique em **Create bucket**

## Passo 4: Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` e adicione suas credenciais:
```
EXPO_PUBLIC_SUPABASE_URL=https://gorslmmmivhbjrczsoie.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

## Passo 5: Verificar Configuração

Execute o aplicativo:
```bash
npm start
```

O aplicativo deve conectar ao Supabase automaticamente.

## Troubleshooting

### Erro: "relation does not exist"
- Certifique-se de que executou o script SQL completo
- Verifique se a tabela `analyses` foi criada em **Table Editor**

### Erro: "bucket does not exist"
- Verifique se o bucket `cough-recordings` foi criado em **Storage**
- Confirme que está marcado como privado

### Erro: "permission denied"
- Verifique se as políticas RLS estão ativas
- Confirme que está autenticado ao testar

## Estrutura Criada

### Tabela: `analyses`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → auth.users)
- `audio_url` (TEXT)
- `diagnosis` (JSONB)
- `created_at` (TIMESTAMP)

### Bucket: `cough-recordings`
- Privado
- Estrutura: `{user_id}/{timestamp}.m4a`

### Políticas RLS
- Usuários só podem ver suas próprias análises
- Usuários só podem inserir suas próprias análises
- Usuários só podem deletar suas próprias análises

### Políticas Storage
- Upload apenas na própria pasta do usuário
- Download apenas dos próprios arquivos
- Delete apenas dos próprios arquivos

