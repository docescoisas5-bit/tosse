/**
 * Script para alterar a senha de usuários
 * 
 * Uso:
 *   node scripts/alterar-senha-admin.js <nova-senha> [email1] [email2] ...
 * 
 * Exemplos:
 *   # Alterar senha do admin padrão (maurosawilala@gmail.com)
 *   node scripts/alterar-senha-admin.js MinhaSenha123
 * 
 *   # Alterar senha de um usuário específico
 *   node scripts/alterar-senha-admin.js MinhaSenha123 ferreiramauro331@gmail.com
 * 
 *   # Alterar senha de múltiplos usuários
 *   node scripts/alterar-senha-admin.js MinhaSenha123 ferreiramauro331@gmail.com lizender@gmail.com
 * 
 * Ou configure as variáveis de ambiente:
 *   SUPABASE_URL=https://gorslmmmivhbjrczsoie.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
 *   USER_EMAIL=email@exemplo.com (opcional, padrão: maurosawilala@gmail.com)
 *   NEW_PASSWORD=nova-senha
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurações
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gorslmmmivhbjrczsoie.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DEFAULT_EMAIL = process.env.ADMIN_EMAIL || 'maurosawilala@gmail.com';

// Obtém a nova senha e emails dos argumentos da linha de comando
const args = process.argv.slice(2);
const NEW_PASSWORD = args[0] || process.env.NEW_PASSWORD || '';
const USER_EMAILS = args.length > 1 ? args.slice(1) : [process.env.USER_EMAIL || DEFAULT_EMAIL];

// Validações
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não configurada!');
  console.error('\nConfigure a variável de ambiente:');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key');
  console.error('\nOu crie um arquivo .env na raiz do projeto com:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key');
  console.error('\nPara obter a service role key:');
  console.error('  https://supabase.com/dashboard/project/gorslmmmivhbjrczsoie/settings/api');
  process.exit(1);
}

if (!NEW_PASSWORD) {
  console.error('❌ Erro: Nova senha não fornecida!');
  console.error('\nUso:');
  console.error('  node scripts/alterar-senha-admin.js <nova-senha> [email1] [email2] ...');
  console.error('\nExemplos:');
  console.error('  node scripts/alterar-senha-admin.js MinhaSenha123');
  console.error('  node scripts/alterar-senha-admin.js MinhaSenha123 ferreiramauro331@gmail.com');
  console.error('  node scripts/alterar-senha-admin.js MinhaSenha123 email1@exemplo.com email2@exemplo.com');
  console.error('\nOu configure a variável de ambiente:');
  console.error('  export NEW_PASSWORD=nova-senha');
  process.exit(1);
}

if (NEW_PASSWORD.length < 6) {
  console.error('❌ Erro: A senha deve ter pelo menos 6 caracteres!');
  process.exit(1);
}

// Cria cliente Supabase com service role key (privilégios administrativos)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Altera a senha de um usuário específico
 */
async function alterarSenhaUsuario(userEmail) {
  try {
    // 1. Busca o usuário pelo email
    const { data: users, error: searchError } = await supabase.auth.admin.listUsers();
    
    if (searchError) {
      throw new Error(`Erro ao buscar usuários: ${searchError.message}`);
    }

    const user = users.users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());

    if (!user) {
      throw new Error(`Usuário com email ${userEmail} não encontrado`);
    }

    // 2. Atualiza a senha usando a API Admin
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: NEW_PASSWORD }
    );

    if (updateError) {
      throw new Error(`Erro ao atualizar senha: ${updateError.message}`);
    }

    return {
      success: true,
      email: updatedUser.user.email,
      id: updatedUser.user.id,
      updatedAt: updatedUser.user.updated_at
    };
  } catch (error) {
    return {
      success: false,
      email: userEmail,
      error: error.message
    };
  }
}

/**
 * Função principal que altera senha de um ou múltiplos usuários
 */
async function alterarSenhas() {
  try {
    console.log('🔐 Iniciando alteração de senha(s)...');
    console.log(`📧 Usuário(s): ${USER_EMAILS.join(', ')}`);
    console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
    console.log('');

    const results = [];
    
    // Processa cada email
    for (const email of USER_EMAILS) {
      console.log(`\n🔄 Processando: ${email}`);
      const result = await alterarSenhaUsuario(email);
      results.push(result);
      
      if (result.success) {
        console.log(`✅ Senha alterada com sucesso para ${result.email}`);
        console.log(`   ID: ${result.id}`);
      } else {
        console.log(`❌ Erro ao alterar senha para ${result.email}: ${result.error}`);
      }
    }

    // Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO');
    console.log('='.repeat(60));
    
    const sucessos = results.filter(r => r.success);
    const falhas = results.filter(r => !r.success);
    
    console.log(`✅ Sucessos: ${sucessos.length}`);
    sucessos.forEach(r => {
      console.log(`   - ${r.email}`);
    });
    
    if (falhas.length > 0) {
      console.log(`\n❌ Falhas: ${falhas.length}`);
      falhas.forEach(r => {
        console.log(`   - ${r.email}: ${r.error}`);
      });
    }
    
    console.log('\n🔐 As senhas alteradas estão ativas. Os usuários podem fazer login agora.');

    // Retorna código de saída baseado no resultado
    if (falhas.length > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('');
    console.error('❌ Erro ao alterar senha(s):');
    console.error(`   ${error.message}`);
    console.error('');
    
    if (error.message.includes('JWT')) {
      console.error('💡 Dica: Verifique se a SUPABASE_SERVICE_ROLE_KEY está correta.');
      console.error('   A service role key é diferente da anon key.');
    }
    
    process.exit(1);
  }
}

// Executa o script
alterarSenhas();

