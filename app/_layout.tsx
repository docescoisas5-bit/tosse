import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import 'react-native-get-random-values';

export default function RootLayout() {
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
              headerShown: true,
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
              headerShown: true,
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
});

