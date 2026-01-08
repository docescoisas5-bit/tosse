import { supabase } from './supabase';
import { UserProfile, Analysis, AdminStats } from '../types';

/**
 * Serviço para gerenciamento administrativo
 * Apenas usuários com role 'admin' podem usar estas funções
 */
export class AdminService {
  /**
   * Verifica se o usuário atual é admin
   */
  async isAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !data) return false;
      return data.role === 'admin';
    } catch (error) {
      console.error('Erro ao verificar se é admin:', error);
      return false;
    }
  }

  /**
   * Obtém perfil do usuário atual
   */
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao obter perfil:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      return null;
    }
  }

  /**
   * Obtém todos os usuários (apenas admin)
   */
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        throw new Error('Acesso negado: apenas administradores podem ver todos os usuários');
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as UserProfile[];
    } catch (error) {
      console.error('Erro ao obter usuários:', error);
      throw error;
    }
  }

  /**
   * Obtém todas as análises (apenas admin)
   */
  async getAllAnalyses(): Promise<Analysis[]> {
    try {
      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        throw new Error('Acesso negado: apenas administradores podem ver todas as análises');
      }

      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as Analysis[];
    } catch (error) {
      console.error('Erro ao obter análises:', error);
      throw error;
    }
  }

  /**
   * Obtém análises de um usuário específico (apenas admin)
   */
  async getUserAnalyses(userId: string): Promise<Analysis[]> {
    try {
      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        throw new Error('Acesso negado: apenas administradores podem ver análises de outros usuários');
      }

      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as Analysis[];
    } catch (error) {
      console.error('Erro ao obter análises do usuário:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas do sistema (apenas admin)
   */
  async getStats(): Promise<AdminStats> {
    try {
      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        throw new Error('Acesso negado: apenas administradores podem ver estatísticas');
      }

      // Tenta usar a view se existir, senão calcula manualmente
      let statsData: AdminStats | null = null;
      try {
        const { data, error } = await supabase
          .from('admin_stats')
          .select('*')
          .single();
        
        if (!error && data) {
          statsData = data as AdminStats;
        }
      } catch (viewError) {
        // View não existe ou erro ao acessar, calcula manualmente
        console.log('View admin_stats não encontrada, calculando manualmente...');
      }

      if (!statsData) {
        // Calcula manualmente
        const [users, analyses, profiles] = await Promise.all([
          supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
          supabase.from('analyses').select('id', { count: 'exact', head: true }),
          supabase.from('user_profiles').select('*'),
        ]);

        const totalUsers = users.count || 0;
        const totalAnalyses = analyses.count || 0;
        const allProfiles = (profiles.data || []) as UserProfile[];
        const totalAdmins = allProfiles.filter(p => p.role === 'admin').length;

        // Obtém análises para calcular média de confiança
        const { data: analysesData } = await supabase
          .from('analyses')
          .select('diagnosis');

        let avgConfidence = 0;
        if (analysesData && analysesData.length > 0) {
          const confidences = analysesData
            .map(a => (a.diagnosis as any)?.confidence || 0)
            .filter(c => c > 0);
          avgConfidence = confidences.length > 0
            ? confidences.reduce((a, b) => a + b, 0) / confidences.length
            : 0;
        }

        // Conta usuários únicos com análises
        const { data: uniqueUsers } = await supabase
          .from('analyses')
          .select('user_id');
        const usersWithAnalyses = new Set(uniqueUsers?.map(a => a.user_id) || []).size;

        statsData = {
          total_users: totalUsers,
          total_analyses: totalAnalyses,
          total_admins: totalAdmins,
          users_with_analyses: usersWithAnalyses,
          avg_confidence: avgConfidence,
        };
      }

      return statsData;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  /**
   * Atualiza role de um usuário (apenas admin)
   */
  async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<void> {
    try {
      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        throw new Error('Acesso negado: apenas administradores podem atualizar roles');
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      throw error;
    }
  }

  /**
   * Deleta uma análise (apenas admin)
   */
  async deleteAnalysis(analysisId: string): Promise<void> {
    try {
      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        throw new Error('Acesso negado: apenas administradores podem deletar análises');
      }

      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('id', analysisId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao deletar análise:', error);
      throw error;
    }
  }

  /**
   * Obtém URL assinada para download de áudio (apenas admin)
   * Aceita tanto URLs completas quanto caminhos relativos
   */
  async getAudioUrl(audioPath: string): Promise<string> {
    try {
      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        throw new Error('Acesso negado: apenas administradores podem acessar áudios');
      }

      let filePath: string;

      // Verifica se é uma URL completa ou apenas o caminho
      if (audioPath.includes('cough-recordings/')) {
        // É uma URL completa, extrai o caminho
        const pathMatch = audioPath.match(/cough-recordings\/(.+)$/);
        if (!pathMatch) {
          throw new Error('URL de áudio inválida');
        }
        filePath = pathMatch[1];
      } else if (audioPath.includes('http://') || audioPath.includes('https://')) {
        // É uma URL completa de outro formato, tenta extrair
        const urlParts = audioPath.split('/');
        const recordingsIndex = urlParts.findIndex(part => part === 'cough-recordings');
        if (recordingsIndex >= 0 && recordingsIndex < urlParts.length - 1) {
          filePath = urlParts.slice(recordingsIndex + 1).join('/');
        } else {
          throw new Error('URL de áudio inválida: não encontrou caminho do arquivo');
        }
      } else {
        // É apenas o caminho relativo (ex: "userId/timestamp.m4a")
        filePath = audioPath;
      }

      // Remove barras iniciais se houver
      filePath = filePath.replace(/^\/+/, '');

      if (!filePath || filePath.trim() === '') {
        throw new Error('Caminho do arquivo inválido');
      }

      console.log('📥 Gerando URL assinada para:', filePath);

      const { data, error } = await supabase.storage
        .from('cough-recordings')
        .createSignedUrl(filePath, 3600); // URL válida por 1 hora

      if (error) {
        console.error('Erro ao criar URL assinada:', error);
        throw error;
      }

      console.log('✅ URL assinada gerada com sucesso');
      return data.signedUrl;
    } catch (error) {
      console.error('Erro ao obter URL do áudio:', error);
      throw error;
    }
  }

  /**
   * Cria um novo usuário (apenas admin)
   * Nota: Usa signUp do Supabase que envia email de confirmação
   * Para criar sem confirmação, seria necessário usar Admin API (service_role key)
   */
  async createUser(email: string, password: string, role: 'user' | 'admin' = 'user'): Promise<UserProfile> {
    try {
      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        throw new Error('Acesso negado: apenas administradores podem criar usuários');
      }

      // Cria o usuário via signUp
      // Nota: Isso enviará um email de confirmação ao usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Não redireciona
        },
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Falha ao criar usuário');
      }

      // Aguarda um pouco para o trigger criar o perfil
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Atualiza o perfil com o role desejado
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ 
          role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.warn('Aviso: Não foi possível atualizar role do perfil:', profileError);
      }

      // Obtém o perfil criado
      const { data: profile, error: getError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (getError || !profile) {
        throw new Error('Falha ao obter perfil do usuário criado');
      }

      return profile as UserProfile;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  /**
   * Deleta um usuário e todos os seus dados (apenas admin)
   * Nota: Isso deleta o usuário do auth.users e todos os dados relacionados (cascade)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        throw new Error('Acesso negado: apenas administradores podem deletar usuários');
      }

      // Verifica se não está tentando deletar a si mesmo
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id === userId) {
        throw new Error('Você não pode deletar sua própria conta');
      }

      // Deleta o perfil (isso deve acionar cascade para deletar o usuário do auth.users)
      // Mas como não temos acesso direto ao auth.users, vamos deletar o perfil
      // e as análises serão deletadas automaticamente (CASCADE)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        throw profileError;
      }

      // Nota: O usuário em auth.users será deletado automaticamente pelo CASCADE
      // ou você precisará usar uma Edge Function com service_role key para deletar do auth.users
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      throw error;
    }
  }

  /**
   * Lista todos os áudios no storage (apenas admin)
   */
  async listAllAudios(): Promise<Array<{ path: string; size: number; created_at: string }>> {
    try {
      const isAdmin = await this.isAdmin();
      if (!isAdmin) {
        throw new Error('Acesso negado: apenas administradores podem listar áudios');
      }

      const { data, error } = await supabase.storage
        .from('cough-recordings')
        .list('', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        throw error;
      }

      // Lista recursivamente todas as pastas
      const allFiles: Array<{ path: string; size: number; created_at: string }> = [];
      
      const listRecursive = async (folder: string = '') => {
        const { data: folderData } = await supabase.storage
          .from('cough-recordings')
          .list(folder, {
            limit: 1000,
            sortBy: { column: 'created_at', order: 'desc' },
          });

        if (folderData) {
          for (const item of folderData) {
            if (item.id === null) {
              // É uma pasta, lista recursivamente
              await listRecursive(folder ? `${folder}/${item.name}` : item.name);
            } else {
              // É um arquivo
              allFiles.push({
                path: folder ? `${folder}/${item.name}` : item.name,
                size: item.metadata?.size || 0,
                created_at: item.created_at || '',
              });
            }
          }
        }
      };

      await listRecursive();
      return allFiles;
    } catch (error) {
      console.error('Erro ao listar áudios:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();

