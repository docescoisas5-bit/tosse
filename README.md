# Aplicação de Análise de Tosse

Aplicação móvel desenvolvida com React Native e Expo para análise de sons de tosse e auxílio na identificação de pneumonia e bronquite, conforme especificação do Projeto Prático 1 - Engenharia do Conhecimento 2025/2026.

## 📚 Documentação

- **[📖 Documentação Completa](./DOCUMENTACAO_COMPLETA.md)** - Documentação técnica completa com todas as propriedades de engenharia de software
- **[🚀 Guia Rápido](./GUIA_RAPIDO.md)** - Guia rápido de referência para desenvolvedores
- **[🔐 Configurar Reset de Senha](./CONFIGURAR_RESET_SENHA.md)** - Guia de configuração de redefinição de senha
- **[⚙️ Configurar EAS Build](./CONFIGURAR_EAS.md)** - Guia de configuração inicial do EAS Build

## 🎯 Funcionalidades

- ✅ **Autenticação de Usuários**: Login e registro com Supabase Auth
- ✅ **Gravação de Áudio**: Gravação de sons de tosse usando expo-av
- ✅ **Pré-processamento de Áudio**: 
  - Normalização (16 kHz, 16-bit, mono)
  - Remoção de ruído (filtro Wiener simplificado)
  - Extração de características MFCC (Mel Frequency Cepstral Coefficients)
  - Geração de espectrogramas Log-Mel
- ✅ **Análise com Machine Learning**: 
  - Modelo TensorFlow.js rodando no dispositivo
  - Classificação: Normal, Bronquite, Pneumonia
  - Probabilidades e confiança
- ✅ **Armazenamento**: 
  - Upload de áudios para Supabase Storage
  - Histórico de análises no banco de dados
- ✅ **Interface Completa**:
  - Página de gravação
  - Visualização de resultados
  - Histórico de análises
  - Avisos médicos apropriados

## 🛠️ Tecnologias

- **Frontend**: React Native, Expo SDK 54.0.0
- **Navegação**: Expo Router
- **Machine Learning**: TensorFlow.js
- **Backend**: Supabase (Auth, Storage, Database)
- **Áudio**: expo-av
- **Linguagem**: TypeScript

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase
- Expo CLI (instalado globalmente ou via npx)

## 🚀 Instalação

1. **Clone o repositório e instale as dependências:**
```bash
npm install
```

2. **Configure as variáveis de ambiente:**
   - Crie um arquivo `.env` na raiz do projeto
   - Adicione suas credenciais do Supabase:
```
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
EXPO_PUBLIC_MODEL_URL=https://seu-projeto.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json
```
   - **Nota**: `EXPO_PUBLIC_MODEL_URL` é opcional. Se não configurado, será usado um modelo placeholder para desenvolvimento.

3. **Configure o Supabase:**
   - Siga as instruções em `CONFIGURACAO_SUPABASE.md`
   - Execute o script SQL em `supabase-setup.sql`
   - Crie o bucket `cough-recordings` no Storage

4. **Inicie o aplicativo:**
```bash
npm start
```

## 📱 Estrutura do Projeto

```
cough-analysis-app/
├── app/                    # Páginas (Expo Router)
│   ├── (auth)/            # Páginas de autenticação
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── _layout.tsx        # Layout raiz
│   ├── index.tsx          # Roteamento inicial
│   ├── home.tsx           # Página principal (gravação)
│   ├── results.tsx        # Página de resultados
│   └── history.tsx        # Histórico de análises
├── components/            # Componentes reutilizáveis
│   └── AudioRecorder.tsx  # Componente de gravação
├── contexts/              # Contextos React
│   └── AuthContext.tsx    # Contexto de autenticação
├── services/              # Serviços
│   ├── audioPreprocessor.ts  # Pré-processamento de áudio
│   ├── mlService.ts       # Serviço de ML
│   └── supabase.ts       # Serviço Supabase
├── types/                 # Tipos TypeScript
│   └── index.ts
└── utils/                # Utilitários
    └── tfInit.ts         # Inicialização TensorFlow
```

## 🧠 Modelo de Machine Learning

### Treinar Seu Próprio Modelo

O projeto inclui scripts prontos para treinar um modelo:

1. **Entre no diretório de treinamento:**
```bash
cd train_model
```

2. **Instale dependências:**
```bash
pip install -r requirements.txt
```

3. **Treine o modelo:**
```bash
python train_cough_model.py
```

4. **Converta para TensorFlow.js:**
```bash
python convert_to_tfjs.py
```

5. **Faça upload e configure:**
   - Faça upload da pasta `models/tfjs_model/` para Supabase Storage
   - Configure `EXPO_PUBLIC_MODEL_URL` no arquivo `.env`

**📖 Guias completos:**
- `train_model/README.md` - Instruções detalhadas de treinamento
- `GUIA_MODELO_TENSORFLOW.md` - Como carregar modelos no app
- `RECURSOS_MODELOS_PRE_TREINADOS.md` - Onde encontrar modelos e datasets

### Modelo Placeholder

Por padrão, o app usa um **modelo placeholder** para desenvolvimento. Após treinar seu modelo, ele será carregado automaticamente se `EXPO_PUBLIC_MODEL_URL` estiver configurado.

## 📊 Fluxo de Análise

1. **Gravação**: Usuário grava o som da tosse
2. **Pré-processamento**:
   - Conversão para Float32Array
   - Normalização [-1, 1]
   - Remoção de ruído
   - Extração de MFCC (13 coeficientes)
3. **Inferência**: Modelo TensorFlow.js faz predição
4. **Resultado**: Probabilidades para cada classe
5. **Armazenamento**: Áudio e resultado salvos no Supabase

## ⚠️ Avisos Importantes

- **Este aplicativo é uma ferramenta auxiliar** e não substitui diagnóstico médico profissional
- **Sempre consulte um médico** para avaliação adequada
- O modelo atual é um placeholder - resultados não são clinicamente válidos
- **Decodificação de áudio**: A aplicação atualmente usa dados sintéticos para desenvolvimento. Para produção, é necessário processar o áudio no backend (veja `NOTA_DECODIFICACAO_AUDIO.md`)
- Para uso em produção, é necessário:
  - Treinar um modelo com dados reais validados
  - Implementar decodificação real de áudio (backend recomendado)

## 📝 Especificações Técnicas

Conforme o PDF do projeto:

- **Formato de áudio**: 16 kHz, 16-bit, mono
- **Características**: MFCC (13 coeficientes), Espectrogramas Log-Mel
- **Modelo**: CNN leve (MobileNetV2 Audio) ou similar
- **Output**: Softmax com 3 classes (normal, bronquite, pneumonia)
- **Processamento**: No dispositivo (TensorFlow Lite / TensorFlow.js)

## 🔒 Privacidade e Segurança

- Áudios armazenados de forma privada no Supabase Storage
- Row Level Security (RLS) ativado
- Usuários só acessam seus próprios dados
- Autenticação segura com Supabase Auth

## 📚 Referências

- [Expo Documentation](https://docs.expo.dev/)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [Supabase Documentation](https://supabase.com/docs)
- [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/)

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais como parte do Projeto Prático 1 - Engenharia do Conhecimento 2025/2026.

## 👨‍💻 Desenvolvimento

Para contribuir ou reportar problemas:

1. Verifique os logs do console para erros
2. Certifique-se de que todas as variáveis de ambiente estão configuradas
3. Verifique se o Supabase está configurado corretamente
4. Teste em dispositivo físico para melhor performance de áudio

---

**Nota**: Este é um projeto acadêmico. Para uso clínico real, são necessários:
- Modelo treinado com dados validados clinicamente
- Aprovação de órgãos reguladores
- Validação com profissionais de saúde
- Testes extensivos em ambientes reais

