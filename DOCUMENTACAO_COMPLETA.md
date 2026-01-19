# 📚 Documentação Completa do Projeto - Aplicação de Análise de Tosse

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Requisitos e Especificações](#3-requisitos-e-especificações)
4. [Estrutura do Projeto](#4-estrutura-do-projeto)
5. [Instalação e Configuração](#5-instalação-e-configuração)
6. [Documentação de APIs](#6-documentação-de-apis)
7. [Fluxos de Dados](#7-fluxos-de-dados)
8. [Modelo de Machine Learning](#8-modelo-de-machine-learning)
9. [Segurança e Privacidade](#9-segurança-e-privacidade)
10. [Testes](#10-testes)
11. [Deploy e Distribuição](#11-deploy-e-distribuição)
12. [Manutenção e Suporte](#12-manutenção-e-suporte)
13. [Contribuição](#13-contribuição)
14. [Referências](#14-referências)

---

## 1. Visão Geral

### 1.1 Descrição do Projeto

A **Aplicação de Análise de Tosse** é um aplicativo móvel desenvolvido com React Native e Expo que utiliza técnicas de Machine Learning para analisar sons de tosse e auxiliar na identificação de condições respiratórias como pneumonia e bronquite.

**Projeto**: Projeto Prático 1 - Engenharia do Conhecimento 2025/2026

### 1.2 Objetivos

- Fornecer uma ferramenta auxiliar para análise de tosse usando IA
- Processar áudio de tosse em tempo real no dispositivo móvel
- Classificar tosse em categorias: Normal, Bronquite, Pneumonia
- Armazenar histórico de análises para acompanhamento
- Fornecer interface intuitiva e acessível

### 1.3 Público-Alvo

- Usuários que desejam monitorar sua saúde respiratória
- Profissionais de saúde (como ferramenta auxiliar)
- Pesquisadores em saúde digital

### 1.4 Avisos Importantes

⚠️ **Este aplicativo é uma ferramenta auxiliar e NÃO substitui diagnóstico médico profissional. Sempre consulte um médico para avaliação adequada.**

---

## 2. Arquitetura do Sistema

### 2.1 Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                    APLICATIVO MÓVEL (React Native/Expo)      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │   Services   │  │   Contexts   │      │
│  │   (App)      │  │              │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│  ┌──────▼─────────────────▼─────────────────▼───────┐      │
│  │           Camada de Negócio                        │      │
│  │  - Autenticação                                    │      │
│  │  - Processamento de Áudio                         │      │
│  │  - Machine Learning                                │      │
│  │  - Gerenciamento de Dados                          │      │
│  └────────────────────────────────────────────────────┘      │
│                                                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS/REST API
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    SUPABASE (Backend as a Service)            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth       │  │  Database    │  │   Storage    │      │
│  │   (JWT)      │  │  (PostgreSQL)│  │   (S3-like)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Stack Tecnológica

#### Frontend
- **React Native**: Framework para desenvolvimento mobile multiplataforma
- **Expo SDK 54.0.0**: Plataforma e ferramentas para React Native
- **TypeScript**: Linguagem de programação tipada
- **Expo Router**: Sistema de roteamento baseado em arquivos

#### Machine Learning
- **TensorFlow.js 4.15.0**: Biblioteca para ML no JavaScript
- **Modelo CNN**: Rede neural convolucional para classificação de áudio

#### Backend
- **Supabase**: Backend as a Service (BaaS)
  - **Auth**: Autenticação e autorização
  - **PostgreSQL**: Banco de dados relacional
  - **Storage**: Armazenamento de arquivos (áudios)

#### Processamento de Áudio
- **expo-av**: Biblioteca para gravação e reprodução de áudio
- **MFCC**: Mel Frequency Cepstral Coefficients (extração de características)

### 2.3 Padrões de Arquitetura

- **Arquitetura em Camadas**: Separação clara entre apresentação, lógica de negócio e dados
- **Service Layer Pattern**: Serviços isolados para funcionalidades específicas
- **Context API**: Gerenciamento de estado global (autenticação)
- **Repository Pattern**: Abstração de acesso a dados via Supabase

---

## 3. Requisitos e Especificações

### 3.1 Requisitos Funcionais

#### RF01 - Autenticação de Usuários
- **RF01.1**: Sistema de registro de novos usuários
- **RF01.2**: Sistema de login com email e senha
- **RF01.3**: Recuperação de senha via email (OTP)
- **RF01.4**: Gerenciamento de sessão (persistência)
- **RF01.5**: Perfil de usuário (nome, foto, endereço)

#### RF02 - Gravação de Áudio
- **RF02.1**: Gravação de áudio de tosse
- **RF02.2**: Visualização de duração da gravação
- **RF02.3**: Reprodução do áudio gravado
- **RF02.4**: Cancelamento de gravação

#### RF03 - Processamento de Áudio
- **RF03.1**: Normalização de áudio (16 kHz, 16-bit, mono)
- **RF03.2**: Remoção de ruído (filtro Wiener)
- **RF03.3**: Extração de características MFCC (13 coeficientes)
- **RF03.4**: Geração de espectrogramas Log-Mel

#### RF04 - Análise com Machine Learning
- **RF04.1**: Carregamento de modelo TensorFlow.js
- **RF04.2**: Classificação de tosse (Normal/Bronquite/Pneumonia)
- **RF04.3**: Exibição de probabilidades por classe
- **RF04.4**: Exibição de confiança da predição

#### RF05 - Armazenamento
- **RF05.1**: Upload de áudios para Supabase Storage
- **RF05.2**: Salvamento de análises no banco de dados
- **RF05.3**: Histórico de análises por usuário
- **RF05.4**: Exclusão de análises

#### RF06 - Interface do Usuário
- **RF06.1**: Tela de gravação com feedback visual
- **RF06.2**: Tela de resultados com visualização de probabilidades
- **RF06.3**: Tela de histórico com lista de análises
- **RF06.4**: Tela de perfil do usuário
- **RF06.5**: Tela de estatísticas (admin)
- **RF06.6**: Tela de tutorial

#### RF07 - Administração
- **RF07.1**: Painel administrativo
- **RF07.2**: Estatísticas gerais (usuários, análises)
- **RF07.3**: Gerenciamento de usuários
- **RF07.4**: Visualização de análises de todos os usuários

### 3.2 Requisitos Não Funcionais

#### RNF01 - Performance
- **RNF01.1**: Análise de áudio deve completar em menos de 5 segundos
- **RNF01.2**: Interface deve responder em menos de 100ms
- **RNF01.3**: Modelo ML deve carregar em menos de 10 segundos

#### RNF02 - Segurança
- **RNF02.1**: Autenticação via JWT (Supabase Auth)
- **RNF02.2**: Row Level Security (RLS) no banco de dados
- **RNF02.3**: Áudios armazenados de forma privada
- **RNF02.4**: Senhas criptografadas (bcrypt via Supabase)

#### RNF03 - Usabilidade
- **RNF03.1**: Interface intuitiva e acessível
- **RNF03.2**: Feedback visual durante operações
- **RNF03.3**: Mensagens de erro claras
- **RNF03.4**: Suporte a múltiplos idiomas (português)

#### RNF04 - Compatibilidade
- **RNF04.1**: Suporte para Android e iOS
- **RNF04.2**: Requer Android 6.0+ ou iOS 13.0+
- **RNF04.3**: Funciona offline para análise (após carregar modelo)

#### RNF05 - Escalabilidade
- **RNF05.1**: Suporte a múltiplos usuários simultâneos
- **RNF05.2**: Armazenamento escalável (Supabase Storage)
- **RNF05.3**: Banco de dados escalável (PostgreSQL)

### 3.3 Especificações Técnicas

#### Áudio
- **Formato**: 16 kHz, 16-bit, mono
- **Codec**: M4A (iOS) / AAC (Android)
- **Duração máxima**: Sem limite (recomendado: 5-10 segundos)

#### Machine Learning
- **Modelo**: CNN (Rede Neural Convolucional)
- **Input**: 13 coeficientes MFCC
- **Output**: 3 classes (Normal, Bronquite, Pneumonia)
- **Formato**: TensorFlow.js (JSON + binários)
- **Tamanho**: ~2-5 MB (modelo comprimido)

#### Banco de Dados
- **SGBD**: PostgreSQL (via Supabase)
- **Tabelas principais**:
  - `user_profiles`: Perfis de usuários
  - `analyses`: Análises de tosse
  - `auth.users`: Usuários de autenticação (Supabase)

#### Storage
- **Provedor**: Supabase Storage (S3-compatible)
- **Bucket**: `cough-recordings`
- **Estrutura**: `{userId}/{timestamp}.m4a`

---

## 4. Estrutura do Projeto

### 4.1 Organização de Diretórios

```
tosse/
├── app/                          # Páginas da aplicação (Expo Router)
│   ├── (auth)/                   # Grupo de rotas de autenticação
│   │   ├── forgot-password.tsx   # Solicitar redefinição de senha
│   │   ├── login.tsx             # Tela de login
│   │   ├── register.tsx          # Tela de registro
│   │   ├── reset-password.tsx    # Definir nova senha
│   │   ├── reset-password-callback.tsx  # Callback de reset
│   │   └── verify-code.tsx      # Verificar código OTP
│   ├── _layout.tsx               # Layout raiz da aplicação
│   ├── index.tsx                 # Roteamento inicial
│   ├── about.tsx                 # Sobre o aplicativo
│   ├── admin.tsx                 # Painel administrativo
│   ├── history.tsx               # Histórico de análises
│   ├── home.tsx                  # Página principal (gravação)
│   ├── profile.tsx               # Perfil do usuário
│   ├── results.tsx               # Resultados da análise
│   ├── stats.tsx                 # Estatísticas
│   └── tutorial.tsx             # Tutorial de uso
│
├── assets/                       # Recursos estáticos
│   └── images/                   # Imagens
│       └── respiratory-background.png
│
├── components/                    # Componentes reutilizáveis
│   ├── AnimatedButton.tsx        # Botão animado
│   ├── AnimatedCard.tsx          # Card animado
│   ├── AudioRecorder.tsx         # Componente de gravação
│   ├── BottomTabNavigator.tsx    # Navegação inferior
│   └── PulseAnimation.tsx        # Animação de pulso
│
├── contexts/                     # Contextos React
│   └── AuthContext.tsx           # Contexto de autenticação
│
├── migrations/                    # Migrações do banco de dados
│   ├── add_profile_fields.sql
│   ├── add_profile_photo_storage_policy.sql
│   └── README_MIGRATIONS.md
│
├── polyfills/                    # Polyfills para compatibilidade
│   └── tfjs-polyfill.ts          # Polyfill para TensorFlow.js
│
├── services/                     # Serviços de negócio
│   ├── adminService.ts           # Serviço administrativo
│   ├── audioPreprocessor.ts     # Pré-processamento de áudio
│   ├── mlService.ts              # Serviço de Machine Learning
│   ├── pdfService.ts             # Geração de PDFs
│   ├── supabase.ts               # Cliente Supabase
│   └── userStatsService.ts       # Estatísticas de usuário
│
├── train_model/                  # Scripts de treinamento ML
│   ├── analisar_dados.py
│   ├── colab_converter.py
│   ├── convert_multimodal_to_tfjs.py
│   ├── convert_simple.py
│   ├── models/                   # Modelos treinados
│   ├── requirements.txt
│   └── README.md
│
├── types/                        # Definições de tipos TypeScript
│   └── index.ts
│
├── utils/                        # Utilitários
│   └── tfInit.ts                 # Inicialização TensorFlow
│
├── app.json                      # Configuração do Expo
├── babel.config.js               # Configuração Babel
├── package.json                  # Dependências do projeto
├── tsconfig.json                 # Configuração TypeScript
├── README.md                     # Documentação básica
├── CONFIGURAR_RESET_SENHA.md    # Guia de configuração
└── DOCUMENTACAO_COMPLETA.md      # Esta documentação
```

### 4.2 Convenções de Código

#### Nomenclatura
- **Arquivos**: camelCase para componentes (`AudioRecorder.tsx`), kebab-case para páginas (`forgot-password.tsx`)
- **Componentes**: PascalCase (`AudioRecorder`, `AnimatedCard`)
- **Funções**: camelCase (`analyzeCough`, `preprocessAudio`)
- **Constantes**: UPPER_SNAKE_CASE (`EXPO_PUBLIC_SUPABASE_URL`)
- **Tipos/Interfaces**: PascalCase (`DiagnosisResult`, `UserProfile`)

#### Estrutura de Componentes
```typescript
// 1. Imports
import React from 'react';
import { View, Text } from 'react-native';

// 2. Types/Interfaces
interface Props {
  title: string;
}

// 3. Component
export function MyComponent({ title }: Props) {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Effects
  useEffect(() => {}, []);
  
  // 6. Handlers
  const handlePress = () => {};
  
  // 7. Render
  return <View>...</View>;
}

// 8. Styles
const styles = StyleSheet.create({});
```

#### Comentários
- Use JSDoc para funções públicas
- Comentários explicativos para lógica complexa
- Evite comentários óbvios

---

## 5. Instalação e Configuração

### 5.1 Pré-requisitos

#### Software Necessário
- **Node.js**: Versão 18.0 ou superior
- **npm**: Versão 9.0 ou superior (ou yarn)
- **Git**: Para controle de versão
- **Expo CLI**: Instalado globalmente ou via npx

#### Contas Necessárias
- **Conta Supabase**: Para backend e banco de dados
- **Conta Expo**: Para desenvolvimento (opcional)

#### Dispositivos
- **Android**: Dispositivo físico ou emulador (Android 6.0+)
- **iOS**: Dispositivo físico ou simulador (iOS 13.0+)

### 5.2 Instalação

#### Passo 1: Clonar Repositório
```bash
git clone <url-do-repositorio>
cd tosse
```

#### Passo 2: Instalar Dependências
```bash
npm install
```

#### Passo 3: Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui

# Modelo de Machine Learning (opcional)
EXPO_PUBLIC_MODEL_URL=https://seu-projeto.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json
```

**Como obter as credenciais do Supabase:**
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie `URL` e `anon public` key

#### Passo 4: Configurar Supabase

##### 4.1 Executar Scripts SQL

Execute os scripts SQL na ordem:

1. **Criar estrutura do banco:**
```bash
# Execute no SQL Editor do Supabase
# Arquivo: supabase-setup.sql
```

2. **Criar políticas RLS:**
```bash
# Arquivo: corrigir-politicas-rls.sql
```

3. **Criar usuário admin (opcional):**
```bash
# Arquivo: criar-admin-usuario.sql
```

##### 4.2 Criar Bucket de Storage

1. Acesse **Storage** no dashboard do Supabase
2. Clique em **New bucket**
3. Nome: `cough-recordings`
4. **Público**: Desmarcado (privado)
5. Clique em **Create bucket**

##### 4.3 Configurar Políticas de Storage

Execute o script SQL:
```sql
-- Arquivo: migrations/add_profile_photo_storage_policy.sql
```

### 5.3 Executar Aplicação

#### Modo Desenvolvimento
```bash
npm start
```

Isso abrirá o Expo Dev Tools. Escaneie o QR code com:
- **Android**: Expo Go app
- **iOS**: Camera app (abre no Expo Go)

#### Modo Produção
```bash
# Build para Android
npx expo build:android

# Build para iOS
npx expo build:ios
```

### 5.4 Troubleshooting

#### Erro: "Variáveis do Supabase não configuradas"
- Verifique se o arquivo `.env` existe na raiz
- Verifique se as variáveis começam com `EXPO_PUBLIC_`
- Reinicie o servidor Expo (`npm start`)

#### Erro: "Modelo não carregado"
- Verifique se `EXPO_PUBLIC_MODEL_URL` está correto
- Verifique se o modelo está acessível publicamente
- O app usará um modelo placeholder se não encontrar

#### Erro: "Permissão de microfone negada"
- Android: Vá em **Configurações** > **Apps** > **Expo Go** > **Permissões** > **Microfone**
- iOS: Vá em **Configurações** > **Privacidade** > **Microfone** > **Expo Go**

---

## 6. Documentação de APIs

### 6.1 Serviços Principais

#### 6.1.1 MLService (`services/mlService.ts`)

Serviço responsável pelo carregamento e execução do modelo de Machine Learning.

##### Métodos Públicos

###### `loadModel(modelUrl?: string): Promise<void>`
Carrega o modelo TensorFlow.js.

**Parâmetros:**
- `modelUrl` (opcional): URL do modelo. Se não fornecido, usa variável de ambiente.

**Retorna:** `Promise<void>`

**Exemplo:**
```typescript
await mlService.loadModel();
```

###### `analyzeCoughFromUri(audioUri: string): Promise<DiagnosisResult>`
Analisa áudio a partir de uma URI e retorna diagnóstico.

**Parâmetros:**
- `audioUri`: URI do arquivo de áudio (file:// ou URL)

**Retorna:** `Promise<DiagnosisResult>`

**Exemplo:**
```typescript
const result = await mlService.analyzeCoughFromUri('file:///path/to/audio.m4a');
console.log(result.predictedClass); // 'normal' | 'bronchitis' | 'pneumonia'
```

###### `isModelLoaded(): boolean`
Verifica se o modelo está carregado.

**Retorna:** `boolean`

###### `getModelInfo(): ModelInfo`
Retorna informações sobre o modelo.

**Retorna:**
```typescript
{
  loaded: boolean;
  url: string | null;
  inputShape: number[] | null;
  outputShape: number[] | null;
}
```

#### 6.1.2 SupabaseService (`services/supabase.ts`)

Serviço para interação com Supabase (Storage e Database).

##### Métodos Públicos

###### `uploadAudio(audioUri: string, userId: string): Promise<string>`
Faz upload de áudio para Supabase Storage.

**Parâmetros:**
- `audioUri`: URI do arquivo de áudio
- `userId`: ID do usuário

**Retorna:** `Promise<string>` (URL do áudio)

**Exemplo:**
```typescript
const url = await supabaseService.uploadAudio(audioUri, userId);
```

###### `saveAnalysis(userId: string, audioUrl: string, diagnosis: DiagnosisResult): Promise<Analysis>`
Salva análise no banco de dados.

**Parâmetros:**
- `userId`: ID do usuário
- `audioUrl`: URL do áudio no Storage
- `diagnosis`: Resultado do diagnóstico

**Retorna:** `Promise<Analysis>`

###### `getAnalyses(userId: string): Promise<Analysis[]>`
Obtém todas as análises do usuário.

**Parâmetros:**
- `userId`: ID do usuário

**Retorna:** `Promise<Analysis[]>`

###### `deleteAnalysis(analysisId: string): Promise<void>`
Deleta uma análise.

**Parâmetros:**
- `analysisId`: ID da análise

**Retorna:** `Promise<void>`

#### 6.1.3 AuthContext (`contexts/AuthContext.tsx`)

Contexto React para gerenciamento de autenticação.

##### Métodos Disponíveis

###### `signIn(email: string, password: string): Promise<void>`
Faz login do usuário.

**Parâmetros:**
- `email`: Email do usuário
- `password`: Senha do usuário

**Retorna:** `Promise<void>`

**Exemplo:**
```typescript
const { signIn } = useAuth();
await signIn('user@example.com', 'password123');
```

###### `signUp(email: string, password: string): Promise<void>`
Registra novo usuário.

**Parâmetros:**
- `email`: Email do usuário
- `password`: Senha do usuário

**Retorna:** `Promise<void>`

###### `signOut(): Promise<void>`
Faz logout do usuário.

**Retorna:** `Promise<void>`

###### `resetPassword(email: string): Promise<void>`
Envia email com código OTP para redefinição de senha.

**Parâmetros:**
- `email`: Email do usuário

**Retorna:** `Promise<void>`

###### `verifyOtp(email: string, token: string, type: 'recovery'): Promise<void>`
Verifica código OTP recebido por email.

**Parâmetros:**
- `email`: Email do usuário
- `token`: Código OTP de 6 dígitos
- `type`: Tipo de OTP ('recovery')

**Retorna:** `Promise<void>`

### 6.2 Tipos TypeScript

#### `DiagnosisResult`
```typescript
interface DiagnosisResult {
  normal: number;              // Probabilidade de tosse normal (0-1)
  bronchitis: number;          // Probabilidade de bronquite (0-1)
  pneumonia: number;           // Probabilidade de pneumonia (0-1)
  confidence: number;          // Confiança da predição (0-1)
  timestamp: Date;            // Data/hora da análise
  predictedClass?: 'normal' | 'bronchitis' | 'pneumonia';
}
```

#### `Analysis`
```typescript
interface Analysis {
  id: string;                  // ID único da análise
  user_id: string;             // ID do usuário
  audio_url: string;           // URL do áudio no Storage
  diagnosis: DiagnosisResult;  // Resultado do diagnóstico
  created_at: string;         // Data de criação (ISO 8601)
}
```

#### `UserProfile`
```typescript
interface UserProfile {
  id: string;                  // ID do usuário
  email: string;               // Email do usuário
  role: 'user' | 'admin';     // Papel do usuário
  name?: string;              // Nome do usuário
  photo_url?: string;          // URL da foto de perfil
  address?: string;           // Endereço do usuário
  created_at: string;         // Data de criação
  updated_at: string;         // Data de atualização
}
```

---

## 7. Fluxos de Dados

### 7.1 Fluxo de Análise de Tosse

```
┌─────────────┐
│   Usuário   │
│  Grava Tosse│
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ AudioRecorder   │
│ (expo-av)       │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ audioPreprocessor│
│ - Normalização  │
│ - MFCC          │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   mlService     │
│ - Carrega Modelo│
│ - Predição      │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ DiagnosisResult │
│ - Probabilidades│
│ - Classe        │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ supabaseService │
│ - Upload Áudio  │
│ - Salva Análise │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Supabase      │
│ - Storage       │
│ - Database      │
└─────────────────┘
```

### 7.2 Fluxo de Autenticação

```
┌─────────────┐
│   Usuário   │
│  Faz Login  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  AuthContext    │
│  signIn()       │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Supabase Auth │
│ - Valida Cred.  │
│ - Gera JWT      │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  AuthContext    │
│ - Atualiza State│
│ - Carrega Perfil│
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   App Logado    │
└─────────────────┘
```

### 7.3 Fluxo de Redefinição de Senha

```
┌─────────────┐
│   Usuário   │
│ Esquece Pwd │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ forgot-password │
│ - Digita Email  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  resetPassword() │
│ - Envia OTP     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Email OTP     │
│ (6 dígitos)     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  verify-code    │
│ - Digita Código │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  verifyOtp()    │
│ - Valida Código │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ reset-password  │
│ - Nova Senha    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ updatePassword() │
│ - Atualiza Pwd  │
└─────────────────┘
```

---

## 8. Modelo de Machine Learning

### 8.1 Arquitetura do Modelo

O modelo é uma **Rede Neural Convolucional (CNN)** otimizada para classificação de áudio.

#### Especificações
- **Input**: 13 coeficientes MFCC (Mel Frequency Cepstral Coefficients)
- **Output**: 3 classes (Normal, Bronquite, Pneumonia)
- **Ativação de saída**: Softmax
- **Formato**: TensorFlow.js (JSON + binários)

#### Estrutura (Placeholder)
```
Input Layer:  [13] (MFCC features)
    ↓
Dense Layer:  [64] (ReLU)
    ↓
Dropout:      0.3
    ↓
Dense Layer:  [32] (ReLU)
    ↓
Output Layer: [3] (Softmax)
```

### 8.2 Pré-processamento de Áudio

#### Etapas
1. **Normalização**: Conversão para 16 kHz, 16-bit, mono
2. **Remoção de Ruído**: Filtro Wiener simplificado
3. **Extração MFCC**: 13 coeficientes
4. **Normalização StandardScaler**: (x - mean) / scale

### 8.3 Treinamento do Modelo

#### Requisitos
- Python 3.8+
- TensorFlow 2.x
- Librosa (processamento de áudio)
- Dataset de áudios de tosse

#### Processo
1. **Preparar Dataset**: Organizar áudios por classe
2. **Extrair Features**: MFCC de cada áudio
3. **Treinar Modelo**: Usar `train_model/train_cough_model.py`
4. **Converter para TF.js**: Usar `train_model/convert_to_tfjs.py`
5. **Upload para Supabase**: Fazer upload da pasta `models/tfjs_model/`

#### Scripts Disponíveis
- `train_model/train_cough_model.py`: Treina o modelo
- `train_model/convert_to_tfjs.py`: Converte para TensorFlow.js
- `train_model/analisar_dados.py`: Análise exploratória dos dados

### 8.4 Carregamento do Modelo

O modelo é carregado automaticamente na inicialização do app:

```typescript
// app/_layout.tsx
useEffect(() => {
  initTensorFlow();
}, []);

// services/mlService.ts
await mlService.loadModel();
```

**Ordem de busca da URL:**
1. Parâmetro `modelUrl` (se fornecido)
2. `EXPO_PUBLIC_MODEL_URL` (variável de ambiente)
3. `app.json` > `extra.modelUrl`
4. Fallback hardcoded (desenvolvimento)

### 8.5 Normalização StandardScaler

O modelo foi treinado com normalização StandardScaler (z-score). Os parâmetros (`mean` e `scale`) são carregados de `model_info.json`:

```json
{
  "scaler": {
    "type": "StandardScaler",
    "mean": [0.0, 0.0, ...],
    "scale": [1.0, 1.0, ...]
  }
}
```

---

## 9. Segurança e Privacidade

### 9.1 Autenticação

- **JWT Tokens**: Supabase Auth gera tokens JWT
- **Refresh Tokens**: Renovação automática de tokens
- **Persistência**: Tokens armazenados em AsyncStorage (criptografado)

### 9.2 Autorização

#### Row Level Security (RLS)
Políticas RLS garantem que usuários só acessem seus próprios dados:

```sql
-- Exemplo de política RLS
CREATE POLICY "Users can view own analyses"
ON analyses FOR SELECT
USING (auth.uid() = user_id);
```

#### Roles
- **user**: Usuário comum (acesso apenas aos próprios dados)
- **admin**: Administrador (acesso a todos os dados)

### 9.3 Privacidade de Dados

#### Áudios
- Armazenados em bucket **privado** no Supabase Storage
- URLs assinadas com expiração (1 ano)
- Acesso apenas via autenticação

#### Dados Pessoais
- Email: Armazenado no Supabase Auth (criptografado)
- Perfil: Armazenado em `user_profiles` (RLS ativado)
- Análises: Associadas ao `user_id` (RLS ativado)

### 9.4 Boas Práticas Implementadas

- ✅ Senhas nunca são armazenadas em texto plano
- ✅ Tokens JWT com expiração
- ✅ HTTPS para todas as comunicações
- ✅ Validação de entrada no frontend e backend
- ✅ Sanitização de dados antes de salvar

---

## 10. Testes

### 10.1 Estratégia de Testes

#### Testes Unitários
- **Serviços**: Testar lógica de negócio isoladamente
- **Utilitários**: Testar funções auxiliares
- **Componentes**: Testar renderização e interações

#### Testes de Integração
- **Fluxos completos**: Autenticação, gravação, análise
- **APIs**: Integração com Supabase

#### Testes End-to-End
- **Cenários de uso**: Fluxo completo do usuário

### 10.2 Ferramentas Recomendadas

- **Jest**: Framework de testes
- **React Native Testing Library**: Testes de componentes
- **Detox**: Testes E2E (opcional)

### 10.3 Exemplo de Teste

```typescript
// __tests__/mlService.test.ts
import { mlService } from '../services/mlService';

describe('MLService', () => {
  it('should load model successfully', async () => {
    await mlService.loadModel();
    expect(mlService.isModelLoaded()).toBe(true);
  });

  it('should analyze cough audio', async () => {
    const result = await mlService.analyzeCoughFromUri('test-audio.m4a');
    expect(result).toHaveProperty('normal');
    expect(result).toHaveProperty('bronchitis');
    expect(result).toHaveProperty('pneumonia');
    expect(result.confidence).toBeGreaterThan(0);
  });
});
```

---

## 11. Deploy e Distribuição

### 11.1 Configuração Inicial do EAS Build

O projeto utiliza **EAS Build** (Expo Application Services) para builds de produção. O arquivo `eas.json` contém as configurações necessárias.

#### Instalar EAS CLI
```bash
npm install -g eas-cli
```

#### Login no EAS
```bash
eas login
```

#### Inicializar Projeto EAS (OBRIGATÓRIO)
```bash
eas init
```

**⚠️ IMPORTANTE**: Este comando é obrigatório na primeira vez. Ele:
- Cria um projeto EAS vinculado à sua conta Expo
- Configura o projeto no Expo Dashboard
- Gera um ID único para o projeto

**Nota**: Se você já tem um projeto Expo, o comando irá vinculá-lo. Se não, criará um novo.

#### Verificar Configuração
```bash
# Verificar informações do projeto
eas project:info

# Listar secrets configurados
eas secret:list
```

**📖 Guia Completo**: Consulte [CONFIGURAR_EAS.md](./CONFIGURAR_EAS.md) para instruções detalhadas.

### 11.2 Build para Produção

#### Android

##### Build APK (Preview/Teste)
```bash
# Build APK para testes internos
eas build --platform android --profile preview
```

##### Build APK (Produção/Testes)
```bash
# Build APK para produção
eas build --platform android --profile production
```

**Nota**: O perfil `production` está configurado para gerar APK. Se precisar de AAB para Google Play Store, altere `buildType` para `"app-bundle"` no `eas.json` na seção `production.android`.

#### iOS

##### Build para Simulador (Preview)
```bash
# Build para simulador iOS
eas build --platform ios --profile preview
```

##### Build IPA (App Store)
```bash
# Build IPA para produção (requer conta Apple Developer)
eas build --platform ios --profile production
```

#### Build para Ambas as Plataformas
```bash
# Build para Android e iOS simultaneamente
eas build --platform all --profile production
```

### 11.3 Configuração de Variáveis de Ambiente

Para produção, configure as variáveis de duas formas:

#### Opção 1: Secrets do EAS (Recomendado)
```bash
# Configurar secrets do EAS (mais seguro)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://seu-projeto.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "sua_chave_aqui"
eas secret:create --scope project --name EXPO_PUBLIC_MODEL_URL --value "https://seu-projeto.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json"
```

**Nota**: Secrets do EAS são mais seguros e não aparecem no código. Se preferir usar `eas.json`, adicione as variáveis apenas quando tiver valores válidos (não deixe vazias).

#### Opção 2: Arquivo `app.json`
```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://seu-projeto.supabase.co",
      "supabaseAnonKey": "sua_chave_aqui",
      "modelUrl": "https://seu-projeto.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json"
    }
  }
}
```

**Nota**: 
- Secrets do EAS têm prioridade sobre `app.json` durante builds
- Não deixe variáveis vazias no `eas.json` (causa erro de validação)
- Use `eas secret:create` para variáveis sensíveis

### 11.4 Versionamento de Apps

O projeto está configurado para usar **versionamento remoto** (`appVersionSource: "remote"`), o que significa que o EAS gerencia automaticamente os números de versão durante os builds.

#### Configuração Atual
- **appVersionSource**: `"remote"` (gerenciado pelo EAS)
- **version**: `"1.0.0"` (no `app.json`)
- **android.versionCode**: `1` (inicial)
- **ios.buildNumber**: `"1"` (inicial)

O EAS incrementa automaticamente `versionCode` (Android) e `buildNumber` (iOS) a cada build.

#### Versionamento Manual (Opcional)

Se preferir controlar manualmente, altere `eas.json`:

```json
{
  "cli": {
    "appVersionSource": "local"
  }
}
```

E atualize manualmente `versionCode` e `buildNumber` no `app.json` antes de cada build.

### 11.5 Perfis de Build no EAS

O arquivo `eas.json` define três perfis de build:

#### `development`
- Build com development client
- Distribuição interna
- Debug habilitado
- Usado para desenvolvimento e testes

#### `preview`
- Build para testes internos
- Android: APK
- iOS: Simulador
- Distribuição interna

#### `production`
- Build para lojas de aplicativos
- Android: AAB (Google Play)
- iOS: IPA (App Store)
- Otimizado para produção

### 11.6 Distribuição

#### Google Play Store
1. Crie conta de desenvolvedor
2. Faça upload do AAB
3. Preencha informações do app
4. Submeta para revisão

#### Apple App Store
1. Crie conta Apple Developer
2. Configure certificados e perfis
3. Faça upload via Xcode ou Transporter
4. Submeta para revisão

### 11.7 Atualizações OTA (Over-The-Air)

Com EAS Update, é possível atualizar o app sem reenviar para as lojas:

#### Publicar Atualização
```bash
# Publicar atualização para produção
eas update --branch production --message "Correção de bugs"

# Publicar atualização para preview
eas update --branch preview --message "Nova feature"
```

#### Configurar Canais de Atualização
```bash
# Criar canal de atualização
eas channel:create production

# Publicar no canal
eas update --channel production
```

**Limitações:**
- Não pode alterar código nativo
- Não pode alterar dependências nativas
- Apenas atualizações de JavaScript
- Requer EAS Update configurado no projeto

---

## 12. Manutenção e Suporte

### 12.1 Monitoramento

#### Logs
- **Expo Logs**: `npx expo logs`
- **Supabase Logs**: Dashboard > Logs
- **Console do App**: React Native Debugger

#### Métricas
- **Supabase Dashboard**: Estatísticas de uso
- **Analytics**: Integrar Firebase Analytics (opcional)

### 12.2 Manutenção Regular

#### Semanal
- Verificar logs de erro
- Monitorar uso de storage
- Revisar políticas de segurança

#### Mensal
- Atualizar dependências
- Revisar performance
- Backup do banco de dados

### 12.3 Troubleshooting Comum

#### Problema: Modelo não carrega
**Solução:**
1. Verificar URL do modelo
2. Verificar conectividade
3. Verificar formato do modelo

#### Problema: Upload de áudio falha
**Solução:**
1. Verificar permissões do bucket
2. Verificar políticas RLS
3. Verificar tamanho do arquivo

#### Problema: Análise retorna erro
**Solução:**
1. Verificar formato do áudio
2. Verificar se modelo está carregado
3. Verificar logs do console

---

## 13. Contribuição

### 13.1 Como Contribuir

1. **Fork** o repositório
2. **Crie** uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. **Push** para a branch (`git push origin feature/nova-feature`)
5. **Abra** um Pull Request

### 13.2 Padrões de Código

- Siga as convenções de nomenclatura
- Adicione testes para novas funcionalidades
- Documente funções públicas com JSDoc
- Mantenha o código limpo e legível

### 13.3 Processo de Code Review

- Todas as mudanças requerem aprovação
- Testes devem passar
- Código deve seguir os padrões
- Documentação deve ser atualizada

---

## 14. Referências

### 14.1 Documentação Oficial

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
- [Supabase Documentation](https://supabase.com/docs)

### 14.2 Artigos e Tutoriais

- [MFCC Feature Extraction](https://en.wikipedia.org/wiki/Mel-frequency_cepstrum)
- [Audio Classification with TensorFlow.js](https://www.tensorflow.org/js/tutorials)
- [React Native Best Practices](https://reactnative.dev/docs/performance)

### 14.3 Recursos de Machine Learning

- [Audio Classification Datasets](https://www.kaggle.com/datasets)
- [TensorFlow.js Models](https://www.tensorflow.org/js/models)
- [Audio Preprocessing Techniques](https://librosa.org/doc/latest/index.html)

### 14.4 Licença

Este projeto foi desenvolvido para fins educacionais como parte do Projeto Prático 1 - Engenharia do Conhecimento 2025/2026.

---

## 📝 Changelog

### Versão 1.0.0 (2025)
- ✅ Implementação inicial
- ✅ Autenticação com Supabase
- ✅ Gravação e análise de áudio
- ✅ Modelo de Machine Learning
- ✅ Interface completa
- ✅ Sistema de administração

---

## 👥 Autores

Desenvolvido como parte do Projeto Prático 1 - Engenharia do Conhecimento 2025/2026.

---

## 📧 Contato

Para questões, sugestões ou problemas:
- Abra uma issue no repositório
- Consulte a documentação do Supabase
- Verifique os logs do aplicativo

---

**Última atualização**: Janeiro 2025

