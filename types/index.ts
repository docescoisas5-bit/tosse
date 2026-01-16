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

export interface UserProfile {
  id: string;
  email: string;
  role: 'user' | 'admin';
  name?: string;
  photo_url?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  total_users: number;
  total_analyses: number;
  total_admins: number;
  users_with_analyses: number;
  avg_confidence: number;
}

export interface AudioRecording {
  uri: string;
  duration?: number;
  fileSize?: number;
}

export type DiagnosisClass = 'normal' | 'bronchitis' | 'pneumonia';

