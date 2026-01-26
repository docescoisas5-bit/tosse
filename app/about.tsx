import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedCard } from '../components/AnimatedCard';
import { BottomTabNavigator } from '../components/BottomTabNavigator';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Sobre</Text>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 24,
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


