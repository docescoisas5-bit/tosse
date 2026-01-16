// Importa polyfills ANTES de qualquer coisa do TensorFlow
import '../polyfills/tfjs-polyfill';

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import 'react-native-get-random-values';
import { initTensorFlow } from '../utils/tfInit';

export default function RootLayout() {
  const [tfReady, setTfReady] = useState(false);

  useEffect(() => {
    // Inicializa TensorFlow.js no início do app
    const initializeTF = async () => {
      try {
        await initTensorFlow();
        setTfReady(true);
      } catch (error) {
        console.error('Erro ao inicializar TensorFlow:', error);
        // Continua mesmo se falhar, mas pode haver problemas depois
        setTfReady(true);
      }
    };

    initializeTF();
  }, []);

  // Mostra loading enquanto inicializa TensorFlow
  if (!tfReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#4A90E2',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen 
            name="(auth)/login" 
            options={{ 
              title: 'Login',
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="(auth)/register" 
            options={{ 
              title: 'Registro',
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="home" 
            options={{ 
              title: 'Análise de Tosse',
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="results" 
            options={{ 
              title: 'Resultados',
              headerShown: true,
            }} 
          />
          <Stack.Screen 
            name="history" 
            options={{ 
              title: 'Histórico',
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="admin" 
            options={{ 
              title: 'Painel Admin',
              headerShown: true,
            }} 
          />
          <Stack.Screen 
            name="stats" 
            options={{ 
              title: 'Estatísticas',
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="tutorial" 
            options={{ 
              title: 'Como Usar',
              headerShown: true,
            }} 
          />
          <Stack.Screen 
            name="about" 
            options={{ 
              title: 'Sobre',
              headerShown: true,
            }} 
          />
          <Stack.Screen 
            name="profile" 
            options={{ 
              title: 'Meu Perfil',
              headerShown: false,
            }} 
          />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

