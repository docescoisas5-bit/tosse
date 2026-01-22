# Scripts de Administração

## Alterar Senha de Usuários

Script para alterar a senha de um ou múltiplos usuários no Supabase (incluindo admin).

### Pré-requisitos

1. **Service Role Key do Supabase**: Você precisa da service role key (não a anon key) para ter privilégios administrativos.

   Para obter:
   - Acesse: https://supabase.com/dashboard/project/gorslmmmivhbjrczsoie/settings/api
   - Copie a **service_role key** (secret)

2. **Instalar dependências**:
   ```bash
   npm install
   ```

### Configuração

Crie um arquivo `.env` na raiz do projeto com:

```env
SUPABASE_URL=https://gorslmmmivhbjrczsoie.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
ADMIN_EMAIL=maurosawilala@gmail.com
```

**⚠️ IMPORTANTE**: 
- NUNCA commite o arquivo `.env` no Git (já está no .gitignore)
- A service role key tem privilégios totais - mantenha-a segura!

### Uso

#### Alterar senha do admin padrão (maurosawilala@gmail.com)

```bash
npm run alterar-senha-admin <nova-senha>
```

Exemplo:
```bash
npm run alterar-senha-admin MinhaNovaSenha123
```

#### Alterar senha de um usuário específico

```bash
npm run alterar-senha-admin <nova-senha> <email>
```

Exemplo:
```bash
npm run alterar-senha-admin MinhaNovaSenha123 ferreiramauro331@gmail.com
```

#### Alterar senha de múltiplos usuários

```bash
npm run alterar-senha-admin <nova-senha> <email1> <email2> <email3> ...
```

Exemplo:
```bash
npm run alterar-senha-admin MinhaNovaSenha123 ferreiramauro331@gmail.com lizender@gmail.com maurosawilala@gmail.com
```

#### Via variável de ambiente

```bash
export NEW_PASSWORD=MinhaNovaSenha123
npm run alterar-senha-admin
```

### Exemplos Completos

```bash
# 1. Configure o .env (apenas uma vez)
echo "SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui" >> .env

# 2. Alterar senha do admin padrão
npm run alterar-senha-admin NovaSenhaSegura123

# 3. Alterar senha de um usuário específico
npm run alterar-senha-admin NovaSenhaSegura123 ferreiramauro331@gmail.com

# 4. Alterar senha de múltiplos usuários de uma vez
npm run alterar-senha-admin NovaSenhaSegura123 ferreiramauro331@gmail.com lizender@gmail.com maurosawilala@gmail.com
```

### Validações

- A senha deve ter pelo menos 6 caracteres
- O(s) email(s) do(s) usuário(s) deve(m) existir no Supabase
- A service role key deve estar correta
- O script mostra um resumo com sucessos e falhas ao processar múltiplos usuários

### Troubleshooting

**Erro: "SUPABASE_SERVICE_ROLE_KEY não configurada"**
- Verifique se o arquivo `.env` existe na raiz do projeto
- Verifique se a variável está escrita corretamente

**Erro: "Usuário não encontrado"**
- Verifique se o email está correto
- Verifique se o usuário existe no Supabase Dashboard

**Erro: "JWT" ou "Invalid API key"**
- Verifique se está usando a **service_role key** (não a anon key)
- A service role key é diferente e tem privilégios administrativos

