// Configuração do PM2 para produção
// Instale o PM2: npm install -g pm2
// Inicie: pm2 start ecosystem.config.js
// Salve para reiniciar automaticamente: pm2 save && pm2 startup

module.exports = {
  apps: [
    {
      name: 'cardapiozap',
      script: '.next/standalone/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
    },
  ],
}
