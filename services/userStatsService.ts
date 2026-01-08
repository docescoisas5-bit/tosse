import { supabase } from './supabase';
import { Analysis } from '../types';

export interface UserStats {
  totalAnalyses: number;
  avgConfidence: number;
  mostCommonDiagnosis: string;
  lastAnalysisDate: string | null;
  normalCount: number;
  bronchitisCount: number;
  pneumoniaCount: number;
}

/**
 * Serviço para estatísticas pessoais do usuário
 */
export class UserStatsService {
  /**
   * Obtém estatísticas do usuário atual
   */
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const { data: analyses, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const analysesList = (analyses || []) as Analysis[];

      if (analysesList.length === 0) {
        return {
          totalAnalyses: 0,
          avgConfidence: 0,
          mostCommonDiagnosis: 'Nenhuma',
          lastAnalysisDate: null,
          normalCount: 0,
          bronchitisCount: 0,
          pneumoniaCount: 0,
        };
      }

      // Calcula estatísticas
      const confidences = analysesList
        .map(a => (a.diagnosis as any)?.confidence || 0)
        .filter(c => c > 0);
      const avgConfidence = confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
        : 0;

      // Conta diagnósticos
      const diagnosisCounts = {
        normal: 0,
        bronchitis: 0,
        pneumonia: 0,
      };

      analysesList.forEach(analysis => {
        const predictedClass = (analysis.diagnosis as any)?.predictedClass;
        if (predictedClass === 'normal') diagnosisCounts.normal++;
        else if (predictedClass === 'bronchitis') diagnosisCounts.bronchitis++;
        else if (predictedClass === 'pneumonia') diagnosisCounts.pneumonia++;
      });

      // Encontra diagnóstico mais comum
      const maxCount = Math.max(
        diagnosisCounts.normal,
        diagnosisCounts.bronchitis,
        diagnosisCounts.pneumonia
      );
      let mostCommon = 'Nenhuma';
      if (maxCount > 0) {
        if (diagnosisCounts.normal === maxCount) mostCommon = 'Normal';
        else if (diagnosisCounts.bronchitis === maxCount) mostCommon = 'Bronquite';
        else if (diagnosisCounts.pneumonia === maxCount) mostCommon = 'Pneumonia';
      }

      const lastAnalysis = analysesList[0];
      const lastAnalysisDate = lastAnalysis?.created_at || null;

      return {
        totalAnalyses: analysesList.length,
        avgConfidence: avgConfidence,
        mostCommonDiagnosis: mostCommon,
        lastAnalysisDate: lastAnalysisDate,
        normalCount: diagnosisCounts.normal,
        bronchitisCount: diagnosisCounts.bronchitis,
        pneumoniaCount: diagnosisCounts.pneumonia,
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas do usuário:', error);
      throw error;
    }
  }
}

export const userStatsService = new UserStatsService();

