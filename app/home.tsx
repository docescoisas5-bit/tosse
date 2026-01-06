import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { AudioRecorder } from '../components/AudioRecorder';
import { mlService } from '../services/mlService';
import { supabaseService } from '../services/supabase';
import { AudioRecording, DiagnosisResult } from '../types';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
    // Carrega o modelo ao montar
    const loadModel = async () => {
      try {
        // Tenta carregar modelo real (da URL configurada ou variável de ambiente)
        // Se não encontrar, usa modelo placeholder
        await mlService.loadModel();
        setModelLoaded(true);
        
        // Log informações do modelo
        const modelInfo = mlService.getModelInfo();
        if (modelInfo.url) {
          console.log('✅ Modelo real carregado:', modelInfo.url);
        } else {
          console.log('⚠️ Usando modelo placeholder para desenvolvimento');
        }
      } catch (error) {
        console.error('Erro ao carregar modelo:', error);
        Alert.alert(
          'Aviso',
          'Não foi possível carregar o modelo. A análise pode não funcionar corretamente.'
        );
      }
    };

    loadModel();
  }, []);

  const handleRecordingComplete = async (recording: AudioRecording) => {
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Analisa o áudio
      const diagnosis = await mlService.analyzeCoughFromUri(recording.uri);

      // Faz upload do áudio para o Supabase
      const audioUrl = await supabaseService.uploadAudio(recording.uri, user.id);

      // Salva a análise no banco de dados
      await supabaseService.saveAnalysis(user.id, audioUrl, diagnosis);

      // Navega para a página de resultados
      router.push({
        pathname: '/results',
        params: {
          diagnosis: JSON.stringify(diagnosis),
        },
      });
    } catch (error: any) {
      console.error('Erro ao processar gravação:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível processar a gravação. Tente novamente.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleViewHistory = () => {
    router.push('/history');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível fazer logout');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Bem-vindo!</Text>
        <Text style={styles.emailText}>{user?.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Análise de Tosse</Text>
        <Text style={styles.cardDescription}>
          Grave o som da tosse para análise. O sistema irá auxiliar na
          identificação de possíveis sinais de pneumonia ou bronquite.
        </Text>

        {!modelLoaded && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4A90E2" />
            <Text style={styles.loadingText}>Carregando modelo...</Text>
          </View>
        )}

        {isAnalyzing ? (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.analyzingText}>
              Analisando gravação...
            </Text>
            <Text style={styles.analyzingSubtext}>
              Isso pode levar alguns segundos
            </Text>
          </View>
        ) : (
          <AudioRecorder
            onRecordingComplete={handleRecordingComplete}
            onError={(error) => {
              Alert.alert('Erro', error.message || 'Erro ao gravar áudio');
            }}
          />
        )}
      </View>

      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>⚠️ Aviso Importante</Text>
        <Text style={styles.warningText}>
          Esta aplicação é uma ferramenta auxiliar e não substitui o
          diagnóstico médico profissional. Sempre consulte um médico para
          avaliação adequada.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={handleViewHistory}
        >
          <Text style={styles.historyButtonText}>Ver Histórico</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingTop: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
  },
  analyzingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  analyzingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  analyzingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  warningCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  historyButton: {
    backgroundColor: '#6C757D',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  historyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#DC3545',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

