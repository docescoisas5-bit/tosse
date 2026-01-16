import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabase';
import { BottomTabNavigator } from '../components/BottomTabNavigator';
import { Analysis, DiagnosisClass } from '../types';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalyses();
  }, [user]);

  const loadAnalyses = async () => {
    if (!user) return;

    try {
      const data = await supabaseService.getAnalyses(user.id);
      setAnalyses(data);
    } catch (error: any) {
      console.error('Erro ao carregar análises:', error);
      Alert.alert('Erro', 'Não foi possível carregar o histórico');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalyses();
  };

  const handleDelete = async (analysisId: string) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir esta análise?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabaseService.deleteAnalysis(analysisId);
              setAnalyses(analyses.filter((a) => a.id !== analysisId));
            } catch (error: any) {
              Alert.alert('Erro', 'Não foi possível excluir a análise');
            }
          },
        },
      ]
    );
  };

  const getClassLabel = (cls: DiagnosisClass | undefined): string => {
    switch (cls) {
      case 'normal':
        return 'Normal';
      case 'bronchitis':
        return 'Bronquite';
      case 'pneumonia':
        return 'Pneumonia';
      default:
        return 'Indeterminado';
    }
  };

  const getClassColor = (cls: DiagnosisClass | undefined): string => {
    switch (cls) {
      case 'normal':
        return '#28A745';
      case 'bronchitis':
        return '#FFC107';
      case 'pneumonia':
        return '#DC3545';
      default:
        return '#6C757D';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Carregando histórico...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {analyses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma análise encontrada</Text>
          <Text style={styles.emptySubtext}>
            Faça sua primeira gravação na tela principal
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/home')}
          >
            <Text style={styles.emptyButtonText}>Nova Análise</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.title}>
            Histórico de Análises ({analyses.length})
          </Text>

          {analyses.map((analysis) => {
            const diagnosis = analysis.diagnosis as any;
            const predictedClass = diagnosis.predictedClass || 'normal';
            const confidence = (diagnosis.confidence * 100).toFixed(1);
            const date = new Date(analysis.created_at);

            return (
              <View key={analysis.id} style={styles.analysisCard}>
                <View style={styles.analysisHeader}>
                  <View style={styles.analysisInfo}>
                    <Text style={styles.analysisDate}>
                      {date.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    <View
                      style={[
                        styles.analysisBadge,
                        { backgroundColor: getClassColor(predictedClass) },
                      ]}
                    >
                      <Text style={styles.analysisBadgeText}>
                        {getClassLabel(predictedClass)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(analysis.id)}
                  >
                    <Text style={styles.deleteButtonText}>×</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.analysisDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Confiança:</Text>
                    <Text style={styles.detailValue}>{confidence}%</Text>
                  </View>

                  <View style={styles.probabilities}>
                    <View style={styles.probabilityItem}>
                      <Text style={styles.probabilityLabel}>Normal</Text>
                      <Text style={styles.probabilityValue}>
                        {(diagnosis.normal * 100).toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.probabilityItem}>
                      <Text style={styles.probabilityLabel}>Bronquite</Text>
                      <Text style={styles.probabilityValue}>
                        {(diagnosis.bronchitis * 100).toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.probabilityItem}>
                      <Text style={styles.probabilityLabel}>Pneumonia</Text>
                      <Text style={styles.probabilityValue}>
                        {(diagnosis.pneumonia * 100).toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </>
      )}
      </ScrollView>
      <BottomTabNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 100, // Espaço para a barra de navegação inferior
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  analysisCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  analysisInfo: {
    flex: 1,
  },
  analysisDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  analysisBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  analysisBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8D7DA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 24,
    color: '#DC3545',
    lineHeight: 28,
  },
  analysisDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  probabilities: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  probabilityItem: {
    alignItems: 'center',
  },
  probabilityLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  probabilityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

