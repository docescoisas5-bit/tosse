import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import { AudioRecording } from '../types';
import { PulseAnimation } from './PulseAnimation';

interface AudioRecorderProps {
  onRecordingComplete: (recording: AudioRecording) => void;
  onError?: (error: Error) => void;
}

const { width } = Dimensions.get('window');
const BUTTON_SIZE = Math.min(width * 0.5, 220);

export function AudioRecorder({ onRecordingComplete, onError }: AudioRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Animações
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonOpacity = useRef(new Animated.Value(1)).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

  useEffect(() => {
    if (isRecording) {
      // Animação de pulso contínuo durante gravação
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(rippleScale, {
              toValue: 1.5,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(rippleOpacity, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(rippleScale, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(rippleOpacity, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      rippleScale.setValue(0);
      rippleOpacity.setValue(0);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);

      // Animação de início
      Animated.parallel([
        Animated.spring(buttonScale, {
          toValue: 1.1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();

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
      
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      // Animação de parada
      Animated.parallel([
        Animated.spring(buttonScale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();

      if (!uri) {
        throw new Error('URI da gravação não disponível');
      }

      const audioRecording: AudioRecording = {
        uri,
        duration: status.durationMillis ? status.durationMillis / 1000 : duration,
        fileSize: status.durationMillis,
      };

      setRecording(null);
      setIsRecording(false);
      setDuration(0);
      buttonOpacity.setValue(1);
      
      onRecordingComplete(audioRecording);
    } catch (error) {
      console.error('Erro ao parar gravação:', error);
      Alert.alert('Erro', 'Não foi possível finalizar a gravação');
      onError?.(error as Error);
      buttonOpacity.setValue(1);
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
            <PulseAnimation color="#FF3B30" size={14} />
            <Text style={styles.recordingText}>Gravando...</Text>
          </View>
        )}
        <Animated.Text
          style={[
            styles.duration,
            {
              transform: [{ scale: isRecording ? 1.05 : 1 }],
            },
          ]}
        >
          {formatDuration(duration)}
        </Animated.Text>
      </View>

      <View style={styles.buttonContainer}>
        {/* Ripple effect durante gravação */}
        {isRecording && (
          <Animated.View
            style={[
              styles.ripple,
              {
                transform: [{ scale: rippleScale }],
                opacity: rippleOpacity,
              },
            ]}
          />
        )}

        <Animated.View
          style={[
            {
              transform: [{ scale: buttonScale }],
              opacity: buttonOpacity,
            },
          ]}
        >
      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording && styles.recordButtonActive,
          isProcessing && styles.recordButtonDisabled,
        ]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
            activeOpacity={0.8}
      >
        {isProcessing ? (
              <ActivityIndicator color="#fff" size="large" />
        ) : (
              <View style={styles.buttonContent}>
                {isRecording ? (
                  <View style={styles.stopIcon} />
                ) : (
                  <View style={styles.playIcon} />
                )}
              </View>
        )}
      </TouchableOpacity>
        </Animated.View>
      </View>

      <Text style={styles.instruction}>
        {isRecording
          ? 'Toque para parar a gravação'
          : 'Toque no botão para começar a gravar'}
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
    marginBottom: 32,
    minHeight: 80,
    justifyContent: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 20,
  },
  recordingText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
    marginLeft: 8,
  },
  duration: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#4A90E2',
    letterSpacing: 2,
  },
  buttonContainer: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  ripple: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#FF3B30',
    opacity: 0.3,
  },
  recordButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  recordButtonActive: {
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
  },
  recordButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 20,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderLeftColor: '#fff',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 4,
  },
  stopIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  instruction: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 22,
    fontWeight: '500',
  },
});
