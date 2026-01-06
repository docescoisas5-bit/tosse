import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { AudioRecording } from '../types';

interface AudioRecorderProps {
  onRecordingComplete: (recording: AudioRecording) => void;
  onError?: (error: Error) => void;
}

export function AudioRecorder({ onRecordingComplete, onError }: AudioRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Solicita permissão ao montar
    (async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch (error) {
        console.error('Erro ao configurar áudio:', error);
      }
    })();

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Para qualquer gravação anterior
      if (recording) {
        await recording.stopAndUnloadAsync();
      }

      // Configura modo de áudio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Inicia nova gravação
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);

      // Atualiza duração a cada segundo
      durationInterval.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      Alert.alert('Erro', 'Não foi possível iniciar a gravação');
      onError?.(error as Error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsProcessing(true);
      
      // Para o intervalo de duração
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      // Para a gravação
      await recording.stopAndUnloadAsync();
      
      // Obtém URI e informações
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();

      if (!uri) {
        throw new Error('URI da gravação não disponível');
      }

      // Prepara objeto de gravação
      const audioRecording: AudioRecording = {
        uri,
        duration: status.durationMillis ? status.durationMillis / 1000 : duration,
        fileSize: status.durationMillis, // Aproximação
      };

      setRecording(null);
      setIsRecording(false);
      setDuration(0);
      
      onRecordingComplete(audioRecording);
    } catch (error) {
      console.error('Erro ao parar gravação:', error);
      Alert.alert('Erro', 'Não foi possível finalizar a gravação');
      onError?.(error as Error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.recordingInfo}>
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Gravando...</Text>
          </View>
        )}
        <Text style={styles.duration}>{formatDuration(duration)}</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording && styles.recordButtonActive,
          isProcessing && styles.recordButtonDisabled,
        ]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.recordButtonText}>
            {isRecording ? 'Parar' : 'Iniciar Gravação'}
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.instruction}>
        {isRecording
          ? 'Toque em "Parar" quando terminar de tossir'
          : 'Toque no botão para começar a gravar o som da tosse'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
  },
  recordingInfo: {
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 60,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  duration: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  recordButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 50,
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recordButtonActive: {
    backgroundColor: '#FF3B30',
  },
  recordButtonDisabled: {
    opacity: 0.6,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});

