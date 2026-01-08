import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { AnimatedCard } from '../components/AnimatedCard';
import { AnimatedButton } from '../components/AnimatedButton';

export default function TutorialScreen() {
  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>❓ Como Usar</Text>

        <AnimatedCard delay={0}>
          <Text style={styles.sectionTitle}>🎤 1. Gravar a Tosse</Text>
          <Text style={styles.sectionText}>
            • Toque no botão de gravação{'\n'}
            • Tussa naturalmente por 2-3 segundos{'\n'}
            • Mantenha o celular a 20-30cm da boca{'\n'}
            • Toque novamente para parar a gravação
          </Text>
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <Text style={styles.sectionTitle}>🤖 2. Análise Automática</Text>
          <Text style={styles.sectionText}>
            • O sistema processa o áudio automaticamente{'\n'}
            • Utiliza inteligência artificial avançada{'\n'}
            • Analisa características acústicas (MFCC, STFT){'\n'}
            • Gera probabilidades para cada diagnóstico
          </Text>
        </AnimatedCard>

        <AnimatedCard delay={200}>
          <Text style={styles.sectionTitle}>📊 3. Ver Resultados</Text>
          <Text style={styles.sectionText}>
            • Visualize as probabilidades de cada diagnóstico{'\n'}
            • Veja a confiança da análise{'\n'}
            • Baixe um PDF com os detalhes completos{'\n'}
            • Acesse o histórico de todas as análises
          </Text>
        </AnimatedCard>

        <AnimatedCard delay={300} style={styles.tipsCard}>
          <Text style={styles.sectionTitle}>💡 Dicas para Melhor Resultado</Text>
          <Text style={styles.sectionText}>
            ✓ Grave em ambiente silencioso{'\n'}
            ✓ Tussa naturalmente, sem forçar{'\n'}
            ✓ Mantenha distância adequada do celular{'\n'}
            ✓ Grave por pelo menos 2-3 segundos{'\n'}
            ✓ Evite ruídos de fundo
          </Text>
        </AnimatedCard>

        <AnimatedCard delay={400} style={styles.warningCard}>
          <Text style={styles.sectionTitle}>⚠️ Aviso Importante</Text>
          <Text style={styles.sectionText}>
            Esta aplicação é uma ferramenta auxiliar e não substitui o diagnóstico médico profissional. Sempre consulte um médico para avaliação adequada, especialmente se apresentar sintomas persistentes.
          </Text>
        </AnimatedCard>

        <AnimatedCard delay={500}>
          <Text style={styles.sectionTitle}>🔬 Sobre a Tecnologia</Text>
          <Text style={styles.sectionText}>
            O sistema utiliza:{'\n'}
            • Processamento de sinal de áudio (STFT){'\n'}
            • Extração de características (MFCC){'\n'}
            • Modelo de deep learning treinado{'\n'}
            • Análise de padrões acústicos
          </Text>
        </AnimatedCard>

        <AnimatedButton
          title="← Voltar"
          onPress={() => router.back()}
          variant="secondary"
          style={styles.backButton}
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
    paddingBottom: 32,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  tipsCard: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  warningCard: {
    backgroundColor: '#FFF9E6',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  backButton: {
    marginTop: 24,
    marginBottom: 32,
  },
});

