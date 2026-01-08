# Nota sobre Decodificação de Áudio

## ⚠️ Situação Atual

A aplicação atualmente usa **dados sintéticos** para simular o processamento de áudio. Isso permite testar o fluxo completo da aplicação, mas **não fornece análises reais**.

## 🔧 Por que dados sintéticos?

Arquivos de áudio gravados pelo `expo-av` (M4A, WAV) são **codificados** e não podem ser lidos diretamente como dados PCM brutos no React Native sem bibliotecas nativas de decodificação.

Bibliotecas disponíveis como `react-native-audio-decoder` são antigas e incompatíveis com React 19 e Expo SDK 54.

## ✅ Soluções para Produção

### Opção 1: Processamento no Backend (Recomendado)

Processe o áudio no backend antes de enviar para o modelo:

1. **Upload do áudio** para Supabase Storage
2. **Edge Function do Supabase** ou API separada processa o áudio:
   ```python
   # Exemplo com Python/FastAPI
   import librosa
   import numpy as np
   
   def extract_features(audio_file):
       # Carrega e converte para 16kHz, mono
       y, sr = librosa.load(audio_file, sr=16000, mono=True)
       
       # Extrai MFCC
       mfcc = librosa.feature.mfcc(
           y=y, 
           sr=sr, 
           n_mfcc=13,
           n_fft=2048,
           hop_length=512
       )
       
       # Retorna média dos MFCC (ou toda a matriz)
       return np.mean(mfcc, axis=1)
   ```
3. **Envia apenas as características** (MFCC) para o dispositivo
4. **Modelo no dispositivo** processa as características

**Vantagens:**
- ✅ Decodificação precisa
- ✅ Processamento mais rápido
- ✅ Menos carga no dispositivo
- ✅ Fácil de atualizar algoritmos

### Opção 2: Edge Function do Supabase

Crie uma Edge Function que processa o áudio:

```typescript
// supabase/functions/process-audio/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { audioUrl } = await req.json()
  
  // Baixa o áudio
  const audioResponse = await fetch(audioUrl)
  const audioBuffer = await audioResponse.arrayBuffer()
  
  // Processa com biblioteca de áudio (ex: ffmpeg via subprocess)
  // Extrai MFCC
  // Retorna características
  
  return new Response(JSON.stringify({ features: [...] }))
})
```

### Opção 3: Biblioteca Nativa (Avançado)

Crie um módulo nativo para decodificar áudio:

- **Android**: Use `MediaCodec` ou `FFmpeg`
- **iOS**: Use `AVAudioFile` ou `FFmpeg`

Requer desenvolvimento nativo e não é recomendado para este projeto.

## 📝 Implementação Atual

A função `generateSyntheticAudioData()` gera dados que simulam padrões de tosse:
- Frequências típicas (200-800 Hz)
- Harmônicos
- Variação temporal
- Ruído

Isso permite testar:
- ✅ Fluxo completo da aplicação
- ✅ Interface de usuário
- ✅ Integração com Supabase
- ✅ Visualização de resultados
- ✅ Histórico de análises

## 🚀 Próximos Passos

Para usar em produção:

1. **Implemente Edge Function** ou API para processar áudio
2. **Modifique `audioPreprocessor.ts`** para chamar a API em vez de gerar dados sintéticos
3. **Teste com áudios reais** de tosse
4. **Valide resultados** com profissionais de saúde

## 📚 Recursos

- [Librosa Documentation](https://librosa.org/doc/latest/index.html)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [TensorFlow.js Audio](https://www.tensorflow.org/js/tutorials/audio/transfer_learning_audio)

