# 🚀 Guia Rápido: Treinar e Usar Modelo

## Passo a Passo Rápido

### 1️⃣ Instalar Dependências
```bash
cd train_model
pip install -r requirements.txt
```

### 2️⃣ Treinar Modelo
```bash
python train_cough_model.py
```
⏱️ Tempo: ~2-5 minutos

### 3️⃣ Converter para TensorFlow.js
```bash
python convert_to_tfjs.py
```

### 4️⃣ Fazer Upload para Supabase

1. Acesse: Supabase Dashboard > Storage
2. Crie bucket `ml-models` (público)
3. Faça upload da pasta `models/tfjs_model/` inteira

### 5️⃣ Configurar no App

Adicione no arquivo `.env` (raiz do projeto):
```env
EXPO_PUBLIC_MODEL_URL=https://seu-projeto.supabase.co/storage/v1/object/public/ml-models/tfjs_model/model.json
```

### 6️⃣ Testar

Execute o app:
```bash
npm start
```

O modelo será carregado automaticamente! 🎉

## ✅ Verificar se Funcionou

No console do app, você verá:
```
✅ Modelo real carregado: https://...
📊 Input shape: [null, 13]
📊 Output shape: [null, 3]
```

## 🐛 Problemas?

- **Erro ao instalar**: Use `pip3` em vez de `pip`
- **Erro ao converter**: Verifique se treinou o modelo primeiro
- **Modelo não carrega**: Verifique a URL no `.env`

## 📝 Nota

O modelo treinado usa **dados sintéticos** para desenvolvimento. Para produção, substitua por dados reais (veja `README.md` no diretório `train_model`).

