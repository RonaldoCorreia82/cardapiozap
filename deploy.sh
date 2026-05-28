#!/bin/bash
# ============================================================
# Script de deploy — CardápioZap
# Execute no servidor após subir os arquivos:  bash deploy.sh
# ============================================================

set -e

echo "🚀 Iniciando deploy do CardápioZap..."

# 1. Instala dependências
echo "📦 Instalando dependências..."
npm install --production=false

# 2. Gera o build de produção
echo "🔨 Gerando build..."
npm run build

# 3. Copia arquivos estáticos para o standalone
echo "📁 Copiando arquivos estáticos..."
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

# 4. Inicia ou reinicia com PM2
echo "⚡ Iniciando servidor com PM2..."
if pm2 list | grep -q "cardapiozap"; then
  pm2 restart cardapiozap
else
  pm2 start ecosystem.config.js
  pm2 save
fi

echo ""
echo "✅ Deploy concluído! Aplicação rodando na porta 3000."
echo "   Configure seu nginx/apache para fazer proxy para localhost:3000"
