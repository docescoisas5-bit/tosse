import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Analysis, DiagnosisResult } from '../types';

// Obtém variáveis de ambiente do Expo
const supabaseUrl = 
  Constants.expoConfig?.extra?.supabaseUrl || 
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://gorslmmmivhbjrczsoie.supabase.co';

const supabaseAnonKey = 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  '';

// Validação das variáveis antes de criar o cliente
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = '⚠️ Variáveis do Supabase não configuradas.\n\n' +
    'Configure as seguintes variáveis de ambiente:\n' +
    '- EXPO_PUBLIC_SUPABASE_URL\n' +
    '- EXPO_PUBLIC_SUPABASE_ANON_KEY\n\n' +
    'Crie um arquivo .env na raiz do projeto com:\n' +
    'EXPO_PUBLIC_SUPABASE_URL=https://gorslmmmivhbjrczsoie.supabase.co\n' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui\n\n' +
    'Ou configure em app.json na seção extra.\n\n' +
    'Para obter a chave anônima, acesse:\n' +
    'https://supabase.com/dashboard/project/gorslmmmivhbjrczsoie/settings/api';
  
  console.error(errorMessage);
  throw new Error('Variáveis do Supabase não configuradas. Verifique o console para mais detalhes.');
}

// Valida se a chave não está vazia
if (!supabaseAnonKey.trim()) {
  const errorMessage = '⚠️ EXPO_PUBLIC_SUPABASE_ANON_KEY está vazia.\n\n' +
    'Configure a chave anônima do Supabase no arquivo .env ou app.json.\n\n' +
    'Para obter a chave, acesse:\n' +
    'https://supabase.com/dashboard/project/gorslmmmivhbjrczsoie/settings/api';
  
  console.error(errorMessage);
  throw new Error('Chave anônima do Supabase não configurada.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Serviço para gerenciar análises no Supabase
 */
export class SupabaseService {
  /**
   * Faz upload de áudio para o Supabase Storage
   * CORRIGIDO: Usa expo-file-system para ler arquivos locais corretamente
   */
  async uploadAudio(audioUri: string, userId: string): Promise<string> {
    try {
      console.log('📤 Iniciando upload de áudio:', audioUri);
      
      // Obtém a extensão correta
      const extension = audioUri.split('.').pop() || 'wav';
      
      // Gera nome único para o arquivo mantendo a extensão original
      const timestamp = Date.now();
      const fileName = `${userId}/${timestamp}.${extension}`;
      console.log('📝 Nome do arquivo:', fileName);
      
      let fileData: Uint8Array;
      
      // No React Native, ler como base64 e converter para Uint8Array é o mais seguro para o Supabase Storage
      console.log('📁 Lendo arquivo para Uint8Array...');
      const base64 = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Converte base64 para Uint8Array
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      fileData = bytes;
      console.log('✅ Dados lidos, tamanho:', fileData.length, 'bytes');
      
      // Determina o content type
      const contentType = audioUri.endsWith('.wav') ? 'audio/wav' : 
                          audioUri.endsWith('.mp3') ? 'audio/mpeg' : 
                          audioUri.endsWith('.m4a') ? 'audio/mp4' : 
                          'audio/mpeg';
      
      console.log('📤 Fazendo upload para Supabase (Content-Type:', contentType, ')...');
      
      // Faz upload
      const { data, error } = await supabase.storage
        .from('cough-recordings')
        .upload(fileName, fileData, {
          contentType: contentType,
          upsert: false,
        });

      if (error) {
        console.error('❌ Erro no upload:', error);
        throw error;
      }

      console.log('✅ Upload concluído:', data.path);

      // Obtém URL assinada (melhor para arquivos privados)
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('cough-recordings')
        .createSignedUrl(fileName, 31536000); // 1 ano de validade

      if (urlError) {
        console.warn('⚠️ Erro ao criar URL assinada, usando URL pública:', urlError);
        // Fallback para URL pública
      const { data: urlData } = supabase.storage
        .from('cough-recordings')
        .getPublicUrl(fileName);
      return urlData.publicUrl;
      }

      console.log('✅ URL assinada gerada');
      return signedUrlData.signedUrl;
    } catch (error) {
      console.error('❌ Erro ao fazer upload do áudio:', error);
      throw error;
    }
  }

  /**
   * Salva análise no banco de dados
   */
  async saveAnalysis(
    userId: string,
    audioUrl: string,
    diagnosis: DiagnosisResult
  ): Promise<Analysis> {
    try {
      console.log('💾 Salvando análise para usuário:', userId);
      console.log('📁 URL do áudio:', audioUrl);
      console.log('📊 Diagnóstico:', {
        normal: diagnosis.normal,
        bronchitis: diagnosis.bronchitis,
        pneumonia: diagnosis.pneumonia,
        confidence: diagnosis.confidence,
        predictedClass: diagnosis.predictedClass
      });
      
      const { data, error } = await supabase
        .from('analyses')
        .insert({
          user_id: userId,
          audio_url: audioUrl,
          diagnosis: {
            normal: diagnosis.normal,
            bronchitis: diagnosis.bronchitis,
            pneumonia: diagnosis.pneumonia,
            confidence: diagnosis.confidence,
            timestamp: diagnosis.timestamp.toISOString(),
            predictedClass: diagnosis.predictedClass,
          },
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar análise:', error);
        throw error;
      }

      console.log('✅ Análise salva com sucesso, ID:', data?.id);
      return data as Analysis;
    } catch (error) {
      console.error('Erro ao salvar análise:', error);
      throw error;
    }
  }

  /**
   * Obtém todas as análises do usuário
   */
  async getAnalyses(userId: string): Promise<Analysis[]> {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao obter análises:', error);
        throw error;
      }

      console.log('📊 Total de análises do usuário encontradas:', data?.length || 0);
      return (data || []) as Analysis[];
    } catch (error) {
      console.error('Erro ao obter análises:', error);
      throw error;
    }
  }

  /**
   * Deleta uma análise
   */
  async deleteAnalysis(analysisId: string): Promise<void> {
    try {
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
   * Atualiza o perfil do usuário
   */
  async updateProfile(
    userId: string,
    updates: {
      name?: string;
      photo_url?: string;
      address?: string;
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  /**
   * Atualiza a senha do usuário
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      throw error;
    }
  }

  /**
   * Faz upload de foto de perfil
   */
  async uploadProfilePhoto(userId: string, photoUri: string): Promise<string> {
    try {
      console.log('📤 Iniciando upload de foto de perfil:', photoUri);
      
      // Obtém a extensão correta
      const extension = photoUri.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const fileName = `profile-photos/${userId}/${timestamp}.${extension}`;
      console.log('📝 Nome do arquivo:', fileName);
      
      // Lê como base64 e converte para Uint8Array (mais seguro para React Native)
      console.log('📁 Lendo foto para Uint8Array...');
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const fileData = bytes;
      console.log('✅ Dados lidos, tamanho:', fileData.length, 'bytes');
      
      // Determina o content type
      const contentType = photoUri.endsWith('.png') ? 'image/png' : 'image/jpeg';
      
      // Faz upload
      const { data, error } = await supabase.storage
        .from('cough-recordings')
        .upload(fileName, fileData, {
          contentType: contentType,
          upsert: false,
        });

      if (error) {
        console.error('❌ Erro no upload:', error);
        throw error;
      }

      console.log('✅ Upload concluído:', data.path);

      // Obtém URL assinada
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('cough-recordings')
        .createSignedUrl(fileName, 31536000); // 1 ano de validade

      if (urlError) {
        console.warn('⚠️ Erro ao criar URL assinada, usando URL pública:', urlError);
        // Fallback para URL pública
        const { data: urlData } = supabase.storage
          .from('cough-recordings')
          .getPublicUrl(fileName);
        return urlData.publicUrl;
      }

      console.log('✅ URL assinada gerada');
      return signedUrlData.signedUrl;
    } catch (error) {
      console.error('❌ Erro ao fazer upload da foto:', error);
      throw error;
    }
  }
}

export const supabaseService = new SupabaseService();

