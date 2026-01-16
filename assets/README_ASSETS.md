# 📁 Assets do Projeto

## ⚠️ Arquivos de Assets Opcionais

Os seguintes arquivos de assets são **opcionais** e podem ser adicionados posteriormente:

### Ícones e Imagens

- `icon.png` - Ícone do aplicativo (1024x1024 px)
- `splash.png` - Imagem de splash screen (1242x2436 px)
- `adaptive-icon.png` - Ícone adaptativo para Android (1024x1024 px)
- `favicon.png` - Favicon para web (48x48 px)

### Nota

O Expo usa **ícones padrão** se esses arquivos não forem fornecidos. Você pode adicionar esses assets posteriormente se desejar personalizar a aparência do aplicativo.

### Como Adicionar Assets

1. Crie os arquivos de imagem na pasta `assets/`
2. Adicione as referências no `app.json`:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

3. Execute `npx expo prebuild --clean` para regenerar os diretórios nativos

### Recursos para Criar Assets

- [Expo Asset Generator](https://www.favicon-generator.org/)
- [App Icon Generator](https://appicon.co/)
- [Splash Screen Generator](https://www.figma.com/community/plugin/781924659552835350/expo-splash-screen)

---

**Última atualização**: Janeiro 2025

