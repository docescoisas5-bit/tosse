# 📱 Como Testar o App no Android sem Fazer Build

Existem várias formas de testar o app em um dispositivo Android sem precisar fazer um novo build. Escolha a opção mais adequada para você:

## 🚀 Opção 1: Expo Go (Mais Rápida e Simples)

**Recomendado para:** Testes rápidos, desenvolvimento de UI, funcionalidades básicas

### Passos:

1. **Instale o Expo Go no seu dispositivo Android:**
   - Baixe na [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm start
   ```
   ou
   ```bash
   npx expo start
   ```

3. **Conecte o dispositivo:**
   - **Opção A - QR Code (Recomendado):**
     - Abra o Expo Go no celular
     - Toque em "Scan QR Code"
     - Escaneie o QR code que aparece no terminal
   
   - **Opção B - Mesma rede Wi-Fi:**
     - Certifique-se de que o celular e o computador estão na mesma rede Wi-Fi
     - No Expo Go, toque em "Enter URL manually"
     - Digite o endereço que aparece no terminal (ex: `exp://192.168.1.100:8081`)

4. **Pronto!** O app carregará no Expo Go e você verá as mudanças em tempo real.

### ⚠️ Limitações do Expo Go:
- Algumas dependências nativas podem não funcionar
- Performance pode ser diferente de um build nativo
- Alguns plugins customizados podem não estar disponíveis

---

## 🔧 Opção 2: Development Build via USB (Recomendado para Funcionalidades Completas)

**Recomendado para:** Testar todas as funcionalidades, incluindo dependências nativas

### Pré-requisitos:
- Android Studio instalado (para ter o Android SDK)
- USB Debugging habilitado no dispositivo
- Dispositivo conectado via USB

### Passos:

1. **Habilite o USB Debugging no Android:**
   - Vá em **Configurações** > **Sobre o telefone**
   - Toque 7 vezes em **Número da versão** (para ativar Modo Desenvolvedor)
   - Volte para **Configurações** > **Opções do desenvolvedor**
   - Ative **Depuração USB**
   - Conecte o dispositivo ao computador via USB

2. **Verifique se o dispositivo está conectado:**
   ```bash
   adb devices
   ```
   Você deve ver seu dispositivo listado.

3. **Inicie o servidor e abra no dispositivo:**
   ```bash
   npm run android
   ```
   ou
   ```bash
   npx expo start --android
   ```

4. **O app será instalado e aberto automaticamente no dispositivo!**

### 💡 Dica: Se o `adb` não for encontrado:
- Instale o Android SDK Platform Tools
- Ou adicione ao PATH do sistema
- Ou use: `npx expo start --android` (o Expo tenta encontrar automaticamente)

---

## 🌐 Opção 3: Tunnel (Para Redes Diferentes)

**Recomendado para:** Quando o dispositivo e computador estão em redes Wi-Fi diferentes

### Passos:

1. **Inicie com tunnel:**
   ```bash
   npx expo start --tunnel
   ```

2. **Escaneie o QR code com Expo Go** (mesmo que estejam em redes diferentes)

### ⚠️ Nota:
- O tunnel pode ser mais lento
- Requer conexão com internet estável

---

## 📋 Opção 4: Development Build (Se já tiver um build de desenvolvimento)

Se você já fez um **development build** anteriormente, pode reutilizá-lo:

1. **Instale o APK de desenvolvimento no dispositivo** (se ainda não tiver)

2. **Inicie o servidor:**
   ```bash
   npm start
   ```

3. **Abra o app de desenvolvimento no dispositivo** - ele se conectará automaticamente ao servidor

---

## 🎯 Qual Opção Escolher?

| Opção | Velocidade | Funcionalidades | Complexidade |
|-------|-----------|-----------------|--------------|
| **Expo Go** | ⚡⚡⚡ Muito Rápido | ⚠️ Limitado | ✅ Muito Simples |
| **USB Debugging** | ⚡⚡ Rápido | ✅ Completo | ⚠️ Média |
| **Tunnel** | ⚡ Lento | ⚠️ Limitado | ✅ Simples |
| **Dev Build** | ⚡⚡ Rápido | ✅ Completo | ⚠️ Requer build inicial |

## 🔍 Troubleshooting

### Problema: "Unable to connect to Metro"
- Verifique se o dispositivo e computador estão na mesma rede Wi-Fi
- Tente usar `--tunnel`: `npx expo start --tunnel`
- Verifique o firewall do Windows

### Problema: "Device not found" (USB)
- Verifique se o USB Debugging está ativado
- Execute `adb devices` para verificar conexão
- Tente outra porta USB ou cabo

### Problema: "Expo Go não carrega o app"
- Verifique se as variáveis de ambiente estão configuradas no `.env`
- Reinicie o servidor: `npm start`
- Limpe o cache: `npx expo start -c`

### Problema: "QR Code não aparece"
- Pressione `s` no terminal para mostrar o QR code
- Ou use `npx expo start --web` para ver no navegador

## 🚀 Comandos Úteis

```bash
# Iniciar servidor
npm start

# Iniciar e abrir no Android (USB)
npm run android

# Iniciar com tunnel
npx expo start --tunnel

# Limpar cache e iniciar
npx expo start -c

# Ver logs do dispositivo
npx expo start --android --log

# Verificar dispositivos conectados
adb devices
```

## ✅ Recomendação Final

Para desenvolvimento diário, use:
1. **Expo Go** para testes rápidos de UI
2. **USB Debugging** (`npm run android`) para testes completos de funcionalidades

Isso permite testar rapidamente sem precisar fazer builds!

