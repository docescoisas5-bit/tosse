/**
 * Tipos TypeScript para a aplicação de análise de tosse
 */

export interface DiagnosisResult {
  normal: number;
  bronchitis: number;
  pneumonia: number;
  confidence: number;
  timestamp: Date;
  predictedClass?: 'normal' | 'bronchitis' | 'pneumonia';
}

export interface Analysis {
  id: string;
  user_id: string;
  audio_url: string;
  diagnosis: DiagnosisResult;
  created_at: string;
}

export interface User {
  id: string;
  email?: string;
  created_at?: string;
}

export interface AudioRecording {
  uri: string;
  duration?: number;
  fileSize?: number;
}

export type DiagnosisClass = 'normal' | 'bronchitis' | 'pneumonia';

