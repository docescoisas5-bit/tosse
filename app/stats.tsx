import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { userStatsService } from '../services/userStatsService';
import { AnimatedCard } from '../components/AnimatedCard';
import { AnimatedButton } from '../components/AnimatedButton';

export default function StatsScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await userStatsService.getUserStats(user.id);
      setStats(data);
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as estatísticas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Carregando estatísticas...</Text>
      </View>
    );
  }

  if (!stats || stats.totalAnalyses === 0) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.emptyContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={styles.emptyTitle}>📊 Estatísticas</Text>
          <Text style={styles.emptyText}>
            Você ainda não realizou nenhuma análise.
          </Text>
          <Text style={styles.emptySubtext}>
            Faça sua primeira gravação para ver suas estatísticas aqui!
          </Text>
          <AnimatedButton
            title="🎤 Nova Análise"
            onPress={() => router.push('/home')}
            variant="primary"
            style={styles.emptyButton}
          />
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>📊 Suas Estatísticas</Text>

        <AnimatedCard delay={0}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalAnalyses}</Text>
            <Text style={styles.statLabel}>Total de Análises</Text>
          </View>
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {(stats.avgConfidence * 100).toFixed(1)}%
            </Text>
            <Text style={styles.statLabel}>Confiança Média</Text>
          </View>
        </AnimatedCard>

        <AnimatedCard delay={200}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.mostCommonDiagnosis}</Text>
            <Text style={styles.statLabel}>Diagnóstico Mais Comum</Text>
          </View>
        </AnimatedCard>

        <AnimatedCard delay={300} style={styles.distributionCard}>
          <Text style={styles.distributionTitle}>Distribuição de Diagnósticos</Text>
          <View style={styles.distributionGrid}>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionBar, { backgroundColor: '#4CAF50' }]}>
                <Text style={styles.distributionValue}>{stats.normalCount}</Text>
              </View>
              <Text style={styles.distributionLabel}>Normal</Text>
            </View>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionBar, { backgroundColor: '#FFC107' }]}>
                <Text style={styles.distributionValue}>{stats.bronchitisCount}</Text>
              </View>
              <Text style={styles.distributionLabel}>Bronquite</Text>
            </View>
            <View style={styles.distributionItem}>
              <View style={[styles.distributionBar, { backgroundColor: '#F44336' }]}>
                <Text style={styles.distributionValue}>{stats.pneumoniaCount}</Text>
              </View>
              <Text style={styles.distributionLabel}>Pneumonia</Text>
            </View>
          </View>
        </AnimatedCard>

        {stats.lastAnalysisDate && (
          <AnimatedCard delay={400}>
            <Text style={styles.lastAnalysisText}>
              Última análise: {new Date(stats.lastAnalysisDate).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </AnimatedCard>
        )}

        <AnimatedButton
          title="📊 Ver Histórico Completo"
          onPress={() => router.push('/history')}
          variant="secondary"
          style={styles.actionButton}
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  emptyText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 32,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statCard: {
    alignItems: 'center',
    padding: 20,
  },
  statValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  distributionCard: {
    marginTop: 16,
  },
  distributionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  distributionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  distributionItem: {
    alignItems: 'center',
    flex: 1,
  },
  distributionBar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  distributionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  distributionLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  lastAnalysisText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 12,
  },
  actionButton: {
    marginTop: 24,
    marginBottom: 32,
  },
});

