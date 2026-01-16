# 🔧 Troubleshooting de Builds

Este documento contém soluções para problemas comuns durante builds do EAS.

## ❌ Erro: "AAPT: error: file failed to compile" - respiratory-background.png

### Problema
```
ERROR: /home/expo/workingdir/build/android/app/build/generated/res/createBundleReleaseJsAndAssets/drawable-mdpi/assets_images_respiratorybackground.png: AAPT: error: file failed to compile.
```

### Causa
O Android Resource Compiler (AAPT) está tentando processar o arquivo `respiratory-background.png` como um recurso drawable, mas está falhando. Isso pode ocorrer por:
- Nome do arquivo com hífen (não recomendado para recursos Android)
- Arquivo corrompido ou formato inválido
- Problemas de encoding do arquivo

### Soluções

#### Solução 1: Renomear o arquivo (Recomendado)

Renomeie o arquivo para não ter hífen:

```bash
# Localmente
mv assets/images/respiratory-background.png assets/images/respiratory_background.png
```

E atualize as referências no código:

```typescript
// app/(auth)/login.tsx e register.tsx
backgroundImage = require('../../assets/images/respiratory_background.png');
```

#### Solução 2: Excluir do Bundle Android

Se você não precisa da imagem no Android, pode excluí-la do bundle:

Atualize `app.json`:

```json
{
  "expo": {
    "assetBundlePatterns": [
      "**/*",
      "!assets/images/respiratory-background.png"
    ]
  }
}
```

#### Solução 3: Mover para pasta diferente

Mova o arquivo para uma pasta que não seja processada como recurso:

```bash
mv assets/images/respiratory-background.png assets/respiratory-background.png
```

E atualize as referências no código.

#### Solução 4: Usar URI remota

Em vez de usar `require()`, use uma URL remota:

```typescript
const backgroundImage = { uri: 'https://seu-servidor.com/respiratory-background.png' };
```

### Verificação

Após aplicar a solução, execute:

```bash
# Limpar cache e rebuild
npx expo prebuild --clean
eas build --platform android --profile production --non-interactive
```

## ⚠️ Avisos Comuns (Não são Erros)

### Warnings de Deprecação Kotlin

Warnings como:
```
'kotlinOptions(...)' is deprecated. Please migrate to the compilerOptions DSL.
```

**Solução**: Esses são avisos das dependências (não do seu código). Podem ser ignorados, mas serão corrigidos quando as dependências forem atualizadas.

### Warnings de AndroidManifest.xml

Warnings sobre `package` em AndroidManifest.xml:
```
Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported
```

**Solução**: Esses são avisos das dependências. Não afetam o build e serão corrigidos quando as dependências forem atualizadas.

## 🔍 Outros Problemas Comuns

### Erro: "NODE_ENV environment variable is required"

**Solução**: Este é apenas um aviso. O EAS Build define automaticamente o NODE_ENV. Pode ser ignorado.

### Erro: "Deprecated Gradle features"

**Solução**: Aviso sobre features deprecadas do Gradle. Não afeta o build, mas pode ser resolvido atualizando as dependências no futuro.

## 📚 Recursos

- [Expo Build Troubleshooting](https://docs.expo.dev/build/troubleshooting/)
- [Android Resource Naming](https://developer.android.com/guide/topics/resources/providing-resources#ResourceNaming)
- [EAS Build Logs](https://docs.expo.dev/build/building-on-ci/#viewing-build-logs)

---

**Última atualização**: Janeiro 2025

