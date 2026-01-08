import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Linking,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { AudioRecorder } from '../components/AudioRecorder';
import { AnimatedCard } from '../components/AnimatedCard';
import { AnimatedButton } from '../components/AnimatedButton';
import { mlService } from '../services/mlService';
import { supabaseService } from '../services/supabase';
import { userStatsService } from '../services/userStatsService';
import { AudioRecording, DiagnosisResult } from '../types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, isAdmin, signOut } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const loadModel = async () => {
      try {
        await mlService.loadModel();
        setModelLoaded(true);
        
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

  useEffect(() => {
    const loadUserStats = async () => {
      if (!user) return;
      try {
        const stats = await userStatsService.getUserStats(user.id);
        setUserStats(stats);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      }
    };

    loadUserStats();
  }, [user]);

  const handleRecordingComplete = async (recording: AudioRecording) => {
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }

    setIsAnalyzing(true);

    try {
      const diagnosis = await mlService.analyzeCoughFromUri(recording.uri);
      const audioUrl = await supabaseService.uploadAudio(recording.uri, user.id);
      await supabaseService.saveAnalysis(user.id, audioUrl, diagnosis);

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

  const handleViewStats = () => {
    router.push('/stats');
  };

  const handleViewTutorial = () => {
    router.push('/tutorial');
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Baixe o app de Análise de Tosse - Use IA para auxiliar na identificação de problemas respiratórios!',
        title: 'Análise de Tosse',
      });
    } catch (error: any) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const handleViewInfo = () => {
    Alert.alert(
      'Sobre o Modelo',
      'Este aplicativo utiliza inteligência artificial treinada com milhares de gravações de tosse para auxiliar na identificação de possíveis sinais de pneumonia ou bronquite.\n\nO modelo analisa características acústicas do som da tosse usando técnicas avançadas de processamento de sinal (MFCC, STFT) e deep learning.\n\n⚠️ Lembre-se: Este é um auxiliar e não substitui o diagnóstico médico profissional.',
      [{ text: 'Entendi', style: 'default' }]
    );
  };

  const handleViewProfile = () => {
    router.push('/profile');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.welcomeText}>Olá! 👋</Text>
            <Text style={styles.emailText}>{user?.email}</Text>
          </Animated.View>

          <AnimatedCard delay={100}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>🎤 Análise de Tosse</Text>
              {modelLoaded && (
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Pronto</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardDescription}>
              Grave o som da tosse para análise inteligente. O sistema utiliza
              inteligência artificial para auxiliar na identificação de possíveis
              sinais de pneumonia ou bronquite.
            </Text>

            {!modelLoaded && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#667eea" />
                <Text style={styles.loadingText}>Carregando modelo...</Text>
              </View>
            )}

            {isAnalyzing ? (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
                <Text style={styles.analyzingText}>
                  Analisando gravação...
                </Text>
                <Text style={styles.analyzingSubtext}>
                  Processando com IA, aguarde alguns segundos
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
          </AnimatedCard>

          {/* Estatísticas Rápidas */}
          {userStats && userStats.totalAnalyses > 0 && (
            <AnimatedCard delay={200} style={styles.statsCard}>
              <Text style={styles.statsTitle}>📈 Suas Estatísticas</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userStats.totalAnalyses}</Text>
                  <Text style={styles.statLabel}>Análises</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {(userStats.avgConfidence * 100).toFixed(0)}%
                  </Text>
                  <Text style={styles.statLabel}>Confiança Média</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userStats.mostCommonDiagnosis}</Text>
                  <Text style={styles.statLabel}>Mais Comum</Text>
                </View>
              </View>
            </AnimatedCard>
          )}

          {/* Cards Informativos */}
          <AnimatedCard delay={250} style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 Dicas para Melhor Análise</Text>
            <Text style={styles.infoText}>
              • Grave em ambiente silencioso{'\n'}
              • Tussa naturalmente, sem forçar{'\n'}
              • Mantenha o celular a 20-30cm da boca{'\n'}
              • Grave por pelo menos 2-3 segundos
            </Text>
          </AnimatedCard>

          <AnimatedCard delay={300} style={styles.warningCard}>
            <Text style={styles.warningTitle}>⚠️ Aviso Importante</Text>
            <Text style={styles.warningText}>
              Esta aplicação é uma ferramenta auxiliar e não substitui o
              diagnóstico médico profissional. Sempre consulte um médico para
              avaliação adequada.
            </Text>
          </AnimatedCard>

          {/* Grid de Ações */}
          <View style={styles.actionsGrid}>
            <AnimatedButton
              title="📊 Histórico"
              onPress={handleViewHistory}
              variant="secondary"
              style={styles.gridButton}
            />
            <AnimatedButton
              title="📈 Estatísticas"
              onPress={handleViewStats}
              variant="secondary"
              style={styles.gridButton}
            />
            <AnimatedButton
              title="👤 Perfil"
              onPress={handleViewProfile}
              variant="secondary"
              style={styles.gridButton}
            />
            <AnimatedButton
              title="❓ Ajuda"
              onPress={handleViewTutorial}
              variant="secondary"
              style={styles.gridButton}
            />
            <AnimatedButton
              title="ℹ️ Sobre"
              onPress={handleViewInfo}
              variant="secondary"
              style={styles.gridButton}
            />
            <AnimatedButton
              title="📤 Compartilhar"
              onPress={handleShareApp}
              variant="secondary"
              style={styles.gridButton}
            />
          </View>

          {/* Botões Principais */}
          <View style={styles.actions}>
            {isAdmin && (
              <AnimatedButton
                title="⚙️ Painel Admin"
                onPress={() => router.push('/admin')}
                variant="warning"
                style={styles.actionButton}
              />
            )}

            <AnimatedButton
              title="🚪 Sair"
              onPress={handleSignOut}
              variant="danger"
              style={styles.actionButton}
            />
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  emailText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  cardDescription: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 12,
    color: '#666',
    fontSize: 14,
  },
  analyzingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  analyzingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  analyzingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  warningCard: {
    backgroundColor: '#FFF9E6',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  statsCard: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#F3E5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B1FA2',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  gridButton: {
    flex: 1,
    minWidth: '30%',
    marginBottom: 8,
  },
  actions: {
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    marginBottom: 8,
  },
});
