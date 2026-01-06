import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variáveis do Supabase não configuradas. Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env');
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
   */
  async uploadAudio(audioUri: string, userId: string): Promise<string> {
    try {
      // Lê o arquivo
      const response = await fetch(audioUri);
      const blob = await response.blob();
      
      // Gera nome único para o arquivo
      const timestamp = Date.now();
      const fileName = `${userId}/${timestamp}.m4a`;
      
      // Faz upload
      const { data, error } = await supabase.storage
        .from('cough-recordings')
        .upload(fileName, blob, {
          contentType: 'audio/m4a',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Obtém URL pública (ou assinada se for privado)
      const { data: urlData } = supabase.storage
        .from('cough-recordings')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload do áudio:', error);
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
        throw error;
      }

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
        throw error;
      }

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
}

export const supabaseService = new SupabaseService();

