import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../services/supabase';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Tela de callback para processar o link de redefinição de senha do Supabase
 * Esta tela é chamada quando o usuário clica no link do email
 */
export default function ResetPasswordCallbackScreen() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processResetLink = async () => {
      try {
        // Extrai o token do URL (pode vir de diferentes formas)
        const accessToken = params.access_token as string;
        const refreshToken = params.refresh_token as string;
        const type = params.type as string;

        // Verifica se é um link de redefinição de senha
        if (type === 'recovery' && accessToken) {
          // O Supabase já processou o link e criou uma sessão temporária
          // Redireciona para a tela de redefinição de senha
          router.replace({
            pathname: '/(auth)/reset-password',
            params: { 
              fromLink: 'true',
              accessToken,
            },
          });
        } else {
          setError('Link inválido ou expirado');
        }
      } catch (err: any) {
        console.error('Erro ao processar link:', err);
        setError(err.message || 'Erro ao processar link de redefinição');
      } finally {
        setLoading(false);
      }
    };

    processResetLink();
  }, [params]);

  if (loading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2', '#1a237e']}
        style={styles.container}
      >
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.text}>Processando link...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2', '#1a237e']}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.errorText}>{error}</Text>
          <Text 
            style={styles.linkText}
            onPress={() => router.replace('/(auth)/forgot-password')}
          >
            Solicitar novo link
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  linkText: {
    color: '#fff',
    fontSize: 16,
    textDecorationLine: 'underline',
    marginTop: 16,
  },
});

