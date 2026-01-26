#!/bin/bash
# Script de pré-instalação para resolver problemas comuns de build do TensorFlow.js no Android

echo "🔧 Configurando ambiente de build para TensorFlow.js..."

# Aumentar memória do heap para o Gradle
echo "org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError" >> android/gradle.properties

# Configurar o ambiente Node.js
export NODE_OPTIONS="--max-old-space-size=4096"

echo "✅ Configurações aplicadas com sucesso!"