# 🔄 Como Reiniciar o Expo Corretamente

## ⚠️ IMPORTANTE

O Expo precisa ser **completamente reiniciado** para ler mudanças no `app.json`.

## 📋 Passos para Reiniciar

### 1. Pare o Servidor Atual
- Pressione `Ctrl + C` no terminal onde o Expo está rodando
- Aguarde até ver "Process terminated"

### 2. Limpe o Cache e Reinicie
```bash
cd /Users/mac/Downloads/tosse-main
npx expo start -c
```

O flag `-c` limpa o cache completamente.

### 3. Se Ainda Não Funcionar

Tente também:
```bash
# Limpar cache do Metro bundler
rm -rf .expo
rm -rf node_modules/.cache
npx expo start -c
```

## ✅ O Que Você Deve Ver

Após reiniciar, procure por estas mensagens no console:

```
🔍 Debug - Buscando URL do modelo:
   Constants.expoConfig?.extra?.modelUrl: https://gorslmmmivhbjrczsoie.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json
   URL encontrada: https://gorslmmmivhbjrczsoie.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json
📥 Carregando modelo de: https://gorslmmmivhbjrczsoie.supabase.co/storage/v1/object/public/ml-models/cough-model/model.json
✅ Modelo carregado com sucesso de: ...
```

Se você ainda ver:
```
⚠️ Nenhuma URL de modelo configurada
```

Isso significa que o Expo não leu o `app.json`. Tente:
1. Verificar se o `app.json` está salvo corretamente
2. Fechar completamente o terminal e abrir um novo
3. Executar `npx expo start -c` novamente
