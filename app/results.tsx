import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { DiagnosisResult, DiagnosisClass } from '../types';

export default function ResultsScreen() {
  const params = useLocalSearchParams();
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);

  useEffect(() => {
    if (params.diagnosis) {
      try {
        const parsed = JSON.parse(params.diagnosis as string);
        // Converte timestamp de string para Date se necessário
        if (typeof parsed.timestamp === 'string') {
          parsed.timestamp = new Date(parsed.timestamp);
        }
        setDiagnosis(parsed);
      } catch (error) {
        console.error('Erro ao parsear diagnóstico:', error);
      }
    }
  }, [params.diagnosis]);

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

  const predictedClass = diagnosis.predictedClass || 'normal';
  const confidence = (diagnosis.confidence * 100).toFixed(1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Resultados da Análise</Text>
        <Text style={styles.subtitle}>
          {new Date(diagnosis.timestamp).toLocaleString('pt-BR')}
        </Text>
      </View>

      <View style={[styles.resultCard, { borderLeftColor: getClassColor(predictedClass) }]}>
        <Text style={styles.resultLabel}>Resultado Previsto</Text>
        <Text style={[styles.resultValue, { color: getClassColor(predictedClass) }]}>
          {getClassLabel(predictedClass)}
        </Text>
        <Text style={styles.confidenceText}>
          Confiança: {confidence}%
        </Text>
      </View>

      <View style={styles.probabilitiesCard}>
        <Text style={styles.probabilitiesTitle}>Probabilidades</Text>
        
        <View style={styles.probabilityRow}>
          <Text style={styles.probabilityLabel}>Normal</Text>
          <View style={styles.probabilityBarContainer}>
            <View
              style={[
                styles.probabilityBar,
                { width: `${diagnosis.normal * 100}%`, backgroundColor: '#28A745' },
              ]}
            />
          </View>
          <Text style={styles.probabilityValue}>
            {(diagnosis.normal * 100).toFixed(1)}%
          </Text>
        </View>

        <View style={styles.probabilityRow}>
          <Text style={styles.probabilityLabel}>Bronquite</Text>
          <View style={styles.probabilityBarContainer}>
            <View
              style={[
                styles.probabilityBar,
                { width: `${diagnosis.bronchitis * 100}%`, backgroundColor: '#FFC107' },
              ]}
            />
          </View>
          <Text style={styles.probabilityValue}>
            {(diagnosis.bronchitis * 100).toFixed(1)}%
          </Text>
        </View>

        <View style={styles.probabilityRow}>
          <Text style={styles.probabilityLabel}>Pneumonia</Text>
          <View style={styles.probabilityBarContainer}>
            <View
              style={[
                styles.probabilityBar,
                { width: `${diagnosis.pneumonia * 100}%`, backgroundColor: '#DC3545' },
              ]}
            />
          </View>
          <Text style={styles.probabilityValue}>
            {(diagnosis.pneumonia * 100).toFixed(1)}%
          </Text>
        </View>
      </View>

      <View style={styles.recommendationCard}>
        <Text style={styles.recommendationTitle}>Recomendação</Text>
        <Text style={styles.recommendationText}>
          {getRecommendation(predictedClass)}
        </Text>
      </View>

      <View style={styles.warningCard}>
        <Text style={styles.warningText}>
          ⚠️ Este resultado é apenas uma análise auxiliar e não substitui o
          diagnóstico médico profissional.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/home')}
        >
          <Text style={styles.buttonText}>Nova Análise</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.push('/history')}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Ver Histórico
          </Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 14,
    color: '#666',
  },
  probabilitiesCard: {
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
  probabilitiesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  probabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  probabilityLabel: {
    fontSize: 14,
    color: '#333',
    width: 100,
  },
  probabilityBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#E9ECEF',
    borderRadius: 12,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  probabilityBar: {
    height: '100%',
    borderRadius: 12,
  },
  probabilityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 50,
    textAlign: 'right',
  },
  recommendationCard: {
    backgroundColor: '#E7F3FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  warningCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFC107',
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
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  secondaryButtonText: {
    color: '#4A90E2',
  },
  errorText: {
    fontSize: 16,
    color: '#DC3545',
    textAlign: 'center',
    marginTop: 32,
  },
});

