import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { DiagnosisResult, DiagnosisClass } from '../types';
import { AnimatedCard } from '../components/AnimatedCard';
import { AnimatedButton } from '../components/AnimatedButton';
import { pdfService } from '../services/pdfService';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function ResultsScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const progressAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    if (params.diagnosis) {
      try {
        const parsed = JSON.parse(params.diagnosis as string);
        if (typeof parsed.timestamp === 'string') {
          parsed.timestamp = new Date(parsed.timestamp);
        }
        setDiagnosis(parsed);
      } catch (error) {
        console.error('Erro ao parsear diagnóstico:', error);
      }
    }
  }, [params.diagnosis]);

  useEffect(() => {
    if (diagnosis) {
      // Anima as barras de progresso
      Animated.stagger(200, [
        Animated.spring(progressAnims[0], {
          toValue: diagnosis.normal,
          tension: 50,
          friction: 7,
          useNativeDriver: false,
        }),
        Animated.spring(progressAnims[1], {
          toValue: diagnosis.bronchitis,
          tension: 50,
          friction: 7,
          useNativeDriver: false,
        }),
        Animated.spring(progressAnims[2], {
          toValue: diagnosis.pneumonia,
          tension: 50,
          friction: 7,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [diagnosis]);

  if (!diagnosis) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Diagnóstico não disponível</Text>
      </View>
    );
  }

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

  const getRecommendation = (cls: DiagnosisClass | undefined): string => {
    switch (cls) {
      case 'normal':
        return 'O som da tosse parece normal. Continue monitorando e consulte um médico se os sintomas persistirem.';
      case 'bronchitis':
        return 'Possíveis sinais de bronquite detectados. Recomenda-se consultar um médico para avaliação adequada.';
      case 'pneumonia':
        return 'Possíveis sinais de pneumonia detectados. É altamente recomendado consultar um médico imediatamente.';
      default:
        return 'Não foi possível determinar com precisão. Consulte um médico para avaliação.';
    }
  };

  const getIcon = (cls: DiagnosisClass | undefined): string => {
    switch (cls) {
      case 'normal':
        return '✅';
      case 'bronchitis':
        return '⚠️';
      case 'pneumonia':
        return '🚨';
      default:
        return '❓';
    }
  };

  const predictedClass = diagnosis.predictedClass || 'normal';
  const confidence = (diagnosis.confidence * 100).toFixed(1);
  const classColor = getClassColor(predictedClass);

  const handleDownloadPDF = async () => {
    if (!diagnosis) return;

    setGeneratingPDF(true);
    try {
      const pdfUri = await pdfService.generatePDF(diagnosis, user?.email);
      await pdfService.sharePDF(pdfUri);
      
      Alert.alert(
        'Sucesso',
        'PDF gerado com sucesso! O arquivo foi aberto para compartilhamento.'
      );
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível gerar o PDF. Tente novamente.'
      );
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>📊 Resultados da Análise</Text>
        <Text style={styles.subtitle}>
          {new Date(diagnosis.timestamp).toLocaleString('pt-BR')}
        </Text>
      </View>

      <AnimatedCard delay={0}>
        <View style={[styles.resultHeader, { borderLeftColor: classColor }]}>
          <Text style={styles.resultIcon}>{getIcon(predictedClass)}</Text>
          <View style={styles.resultContent}>
        <Text style={styles.resultLabel}>Resultado Previsto</Text>
            <Text style={[styles.resultValue, { color: classColor }]}>
          {getClassLabel(predictedClass)}
        </Text>
            <View style={styles.confidenceContainer}>
              <View style={[styles.confidenceBar, { backgroundColor: classColor }]}>
        <Text style={styles.confidenceText}>
                  {confidence}% de confiança
        </Text>
      </View>
            </View>
          </View>
        </View>
      </AnimatedCard>

      <AnimatedCard delay={100}>
        <Text style={styles.probabilitiesTitle}>📈 Probabilidades Detalhadas</Text>
        
        <View style={styles.probabilityRow}>
          <View style={styles.probabilityHeader}>
            <Text style={styles.probabilityLabel}>✅ Normal</Text>
            <Text style={styles.probabilityValue}>
              {(diagnosis.normal * 100).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.probabilityBarContainer}>
            <Animated.View
              style={[
                styles.probabilityBar,
                {
                  width: progressAnims[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: '#28A745',
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.probabilityRow}>
          <View style={styles.probabilityHeader}>
            <Text style={styles.probabilityLabel}>⚠️ Bronquite</Text>
            <Text style={styles.probabilityValue}>
              {(diagnosis.bronchitis * 100).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.probabilityBarContainer}>
            <Animated.View
              style={[
                styles.probabilityBar,
                {
                  width: progressAnims[1].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: '#FFC107',
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.probabilityRow}>
          <View style={styles.probabilityHeader}>
            <Text style={styles.probabilityLabel}>🚨 Pneumonia</Text>
            <Text style={styles.probabilityValue}>
              {(diagnosis.pneumonia * 100).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.probabilityBarContainer}>
            <Animated.View
              style={[
                styles.probabilityBar,
                {
                  width: progressAnims[2].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: '#DC3545',
                },
              ]}
            />
          </View>
        </View>
      </AnimatedCard>

      <AnimatedCard delay={200} style={styles.recommendationCard}>
        <Text style={styles.recommendationTitle}>💡 Recomendação</Text>
        <Text style={styles.recommendationText}>
          {getRecommendation(predictedClass)}
        </Text>
      </AnimatedCard>

      <AnimatedCard delay={300} style={styles.warningCard}>
        <Text style={styles.warningText}>
          ⚠️ Este resultado é apenas uma análise auxiliar e não substitui o
          diagnóstico médico profissional.
        </Text>
      </AnimatedCard>

      <View style={styles.actions}>
        <AnimatedButton
          title={generatingPDF ? "⏳ Gerando PDF..." : "📄 Baixar PDF"}
          onPress={handleDownloadPDF}
          variant="primary"
          style={styles.actionButton}
          disabled={generatingPDF}
        />

        {generatingPDF && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#667eea" />
            <Text style={styles.loadingText}>Gerando relatório PDF...</Text>
          </View>
        )}

        <AnimatedButton
          title="🔄 Nova Análise"
          onPress={() => router.push('/home')}
          variant="secondary"
          style={styles.actionButton}
        />

        <AnimatedButton
          title="📋 Ver Histórico"
          onPress={() => router.push('/history')}
          variant="secondary"
          style={styles.actionButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    paddingLeft: 16,
  },
  resultIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  resultContent: {
    flex: 1,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  confidenceContainer: {
    marginTop: 8,
  },
  confidenceBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  confidenceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  probabilitiesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  probabilityRow: {
    marginBottom: 20,
  },
  probabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  probabilityLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  probabilityValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  probabilityBarContainer: {
    height: 28,
    backgroundColor: '#E9ECEF',
    borderRadius: 14,
    overflow: 'hidden',
  },
  probabilityBar: {
    height: '100%',
    borderRadius: 14,
  },
  recommendationCard: {
    backgroundColor: '#E7F3FF',
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  warningCard: {
    backgroundColor: '#FFF9E6',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  actions: {
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#DC3545',
    textAlign: 'center',
    marginTop: 32,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});
