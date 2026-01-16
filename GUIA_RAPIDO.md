# 🚀 Guia Rápido - Aplicação de Análise de Tosse

## ⚡ Início Rápido

### Instalação em 3 Passos

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente (.env)
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui

# 3. Iniciar aplicação
npm start
```

## 📱 Comandos Principais

```bash
# Desenvolvimento
npm start                    # Inicia servidor Expo
npm run android             # Abre no Android
npm run ios                  # Abre no iOS
npm run web                  # Abre no navegador

# EAS Build (Recomendado)
eas build:configure         # Configura EAS Build
eas build --platform android # Build para Android
eas build --platform ios    # Build para iOS
eas build --platform all    # Build para ambas plataformas

# EAS Update (OTA)
eas update --branch production # Publicar atualização OTA
```

## 🔑 Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | ✅ Sim |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase | ✅ Sim |
| `EXPO_PUBLIC_MODEL_URL` | URL do modelo ML | ❌ Não (usa placeholder) |

### Configurar para EAS Build

```bash
# Usar secrets do EAS (recomendado)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://seu-projeto.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "sua_chave_aqui"
```

Ou configure no arquivo `.env` para desenvolvimento local.

## 📂 Estrutura de Arquivos Principais

```
app/                    # Páginas (Expo Router)
├── (auth)/            # Autenticação
├── home.tsx           # Gravação de áudio
├── results.tsx        # Resultados
└── history.tsx        # Histórico

services/               # Lógica de negócio
├── mlService.ts       # Machine Learning
├── supabase.ts        # Backend
└── audioPreprocessor.ts # Processamento de áudio

components/            # Componentes reutilizáveis
contexts/              # Contextos React (Auth)
```

## 🔧 Configuração do Supabase

### 1. Criar Tabelas
Execute `supabase-setup.sql` no SQL Editor

### 2. Criar Bucket
- Storage > New bucket
- Nome: `cough-recordings`
- Privado: ✅ Sim

### 3. Configurar RLS
Execute `corrigir-politicas-rls.sql`

## 🧠 Modelo de Machine Learning

### Carregar Modelo
```typescript
import { mlService } from './services/mlService';

await mlService.loadModel();
```

### Analisar Áudio
```typescript
const result = await mlService.analyzeCoughFromUri(audioUri);
console.log(result.predictedClass); // 'normal' | 'bronchitis' | 'pneumonia'
```

## 🔐 Autenticação

### Login
```typescript
const { signIn } = useAuth();
await signIn('email@example.com', 'password');
```

### Registrar
```typescript
const { signUp } = useAuth();
await signUp('email@example.com', 'password');
```

### Logout
```typescript
const { signOut } = useAuth();
await signOut();
```

## 📊 Fluxo de Análise

1. **Gravar** → `AudioRecorder` grava áudio
2. **Processar** → `audioPreprocessor` extrai MFCC
3. **Analisar** → `mlService` executa modelo
4. **Salvar** → `supabaseService` salva resultado

## 🐛 Troubleshooting

### Erro: "Variáveis não configuradas"
- Verifique arquivo `.env` na raiz
- Reinicie servidor Expo

### Erro: "Modelo não carregado"
- Verifique `EXPO_PUBLIC_MODEL_URL`
- App usa placeholder se não encontrar

### Erro: "Permissão negada"
- Android: Configurações > Apps > Expo Go > Permissões
- iOS: Configurações > Privacidade > Microfone

### Erro: "Failed to read /eas.json"
- O arquivo `eas.json` já foi criado no projeto
- Se ainda aparecer o erro, execute: `eas build:configure`
- Ou instale EAS CLI: `npm install -g eas-cli`

## 📚 Documentação Completa

Para informações detalhadas, consulte:
- **[DOCUMENTACAO_COMPLETA.md](./DOCUMENTACAO_COMPLETA.md)** - Documentação completa do projeto
- **[README.md](./README.md)** - Documentação básica
- **[CONFIGURAR_RESET_SENHA.md](./CONFIGURAR_RESET_SENHA.md)** - Configuração de reset de senha

## 🔗 Links Úteis

- [Expo Docs](https://docs.expo.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [TensorFlow.js](https://www.tensorflow.org/js)

---

**Última atualização**: Janeiro 2025

