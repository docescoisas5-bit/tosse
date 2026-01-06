# Guia Rápido - Configuração Supabase

## ✅ Passos Rápidos

### 1. Obter Chave Anônima
1. Acesse: https://supabase.com/dashboard/project/gorslmmmivhbjrczsoie/settings/api
2. Copie a **anon public** key
3. Cole no arquivo `.env` (substitua `cole_sua_chave_anon_aqui`)

### 2. Executar SQL
1. Acesse: https://supabase.com/dashboard/project/gorslmmmivhbjrczsoie/sql/new
2. Abra o arquivo `supabase-setup.sql`
3. Cole todo o conteúdo no SQL Editor
4. Clique em **Run**

### 3. Criar Bucket
1. Acesse: https://supabase.com/dashboard/project/gorslmmmivhbjrczsoie/storage/buckets
2. Clique em **New bucket**
3. Nome: `cough-recordings`
4. **NÃO** marque como público
5. Clique em **Create bucket**

### 4. Testar
```bash
npm start
```

## 📝 Arquivos Importantes

- `.env` - Credenciais do Supabase (já configurado com URL)
- `supabase-setup.sql` - Script SQL completo
- `CONFIGURACAO_SUPABASE.md` - Guia detalhado

## 🔗 Links Úteis

- **Dashboard**: https://supabase.com/dashboard/project/gorslmmmivhbjrczsoie
- **SQL Editor**: https://supabase.com/dashboard/project/gorslmmmivhbjrczsoie/sql/new
- **Storage**: https://supabase.com/dashboard/project/gorslmmmivhbjrczsoie/storage/buckets
- **API Settings**: https://supabase.com/dashboard/project/gorslmmmivhbjrczsoie/settings/api

