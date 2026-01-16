import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedCard } from '../components/AnimatedCard';
import { BottomTabNavigator } from '../components/BottomTabNavigator';

export default function AboutScreen() {
  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>ℹ️ Sobre</Text>

        <AnimatedCard delay={0}>
          <Text style={styles.cardTitle}>O que este app faz</Text>
          <Text style={styles.text}>
            Este aplicativo usa inteligência artificial para analisar o som da tosse e estimar
            probabilidades entre classes (ex.: normal/bronquite/pneumonia).{'\n\n'}
            ⚠️ Importante: é uma ferramenta auxiliar e não substitui avaliação médica.
          </Text>
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <Text style={styles.cardTitle}>Como funciona</Text>
          <Text style={styles.text}>
            A análise extrai características acústicas (ex.: MFCC/STFT) do áudio e executa um modelo
            de ML no dispositivo para gerar as probabilidades.
          </Text>
        </AnimatedCard>

        <AnimatedCard delay={200}>
          <Text style={styles.cardTitle}>Privacidade</Text>
          <Text style={styles.text}>
            Os áudios podem ser enviados para armazenamento seguro para histórico e relatórios, de
            acordo com as permissões do usuário e as políticas de acesso.
          </Text>
        </AnimatedCard>
      </ScrollView>
      <BottomTabNavigator />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});


