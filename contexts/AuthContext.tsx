import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { adminService } from '../services/adminService';
import { UserProfile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string, type: 'recovery') => Promise<void>;
  updatePasswordWithOtp: (email: string, token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carrega perfil do usuário quando a sessão muda
  const loadUserProfile = async (userId: string | undefined) => {
    if (!userId) {
      setUserProfile(null);
      setIsAdmin(false);
      return;
    }

    try {
      const profile = await adminService.getCurrentUserProfile();
      setUserProfile(profile);
      setIsAdmin(profile?.role === 'admin' || false);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setUserProfile(null);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Verifica sessão atual
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      await loadUserProfile(session?.user?.id);
      setLoading(false);
    });

    // Escuta mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      await loadUserProfile(session?.user?.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    setSession(data.session);
    setUser(data.user);
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    setSession(data.session);
    setUser(data.user);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setSession(null);
    setUser(null);
  };

  const refreshUserProfile = async () => {
    await loadUserProfile(user?.id);
  };

  /**
   * Envia email com link de redefinição de senha
   * O Supabase envia um magic link que pode ser processado no app
   */
  const resetPassword = async (email: string) => {
    // Usa resetPasswordForEmail que envia um link
    // O link será processado pela tela reset-password-callback
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'coughanalysis://reset-password-callback', // Deep link para o app
    });

    if (error) {
      throw error;
    }
  };

  /**
   * Verifica o código OTP recebido por email
   * O código é enviado quando o usuário solicita reset de senha via signInWithOtp
   */
  const verifyOtp = async (email: string, token: string, type: 'recovery') => {
    // Para OTP enviado via signInWithOtp, usamos type 'email'
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email', // signInWithOtp usa type 'email'
    });

    if (error) {
      throw error;
    }

    // Atualiza sessão após verificação
    if (data.session) {
      setSession(data.session);
      setUser(data.user);
    }
  };

  /**
   * Atualiza a senha usando o código OTP verificado
   */
  const updatePasswordWithOtp = async (email: string, token: string, newPassword: string) => {
    // Primeiro verifica o OTP (type 'email' para signInWithOtp)
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email', // signInWithOtp usa type 'email'
    });

    if (verifyError) {
      throw verifyError;
    }

    // Se a verificação foi bem-sucedida, atualiza a senha
    if (verifyData.session) {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      // Atualiza sessão
      setSession(verifyData.session);
      setUser(verifyData.user);
    } else {
      throw new Error('Sessão não criada após verificação do código');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userProfile,
        isAdmin,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUserProfile,
        resetPassword,
        verifyOtp,
        updatePasswordWithOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

