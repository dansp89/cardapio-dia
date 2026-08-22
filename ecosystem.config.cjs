// Configuração do PM2. Extensão .cjs porque o package.json declara
// "type": "module", e o PM2 lê este arquivo como CommonJS.
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

// Lê o .env sem depender de pacote: o PM2 roda este arquivo com o Node do
// sistema, que pode ser mais antigo que o process.loadEnvFile.
function lerEnv() {
  const caminho = join(__dirname, '.env');
  if (!existsSync(caminho)) return {};

  return readFileSync(caminho, 'utf8')
    .split('\n')
    .reduce((acc, linha) => {
      const limpa = linha.trim();
      if (!limpa || limpa.startsWith('#')) return acc;
      const sinal = limpa.indexOf('=');
      if (sinal < 1) return acc;
      const chave = limpa.slice(0, sinal).trim();
      // Aspas em volta do valor são opcionais e não fazem parte dele.
      const valor = limpa.slice(sinal + 1).trim().replace(/^["']|["']$/g, '');
      // Chave sem valor equivale a não declarada: usa-se o padrão.
      if (valor) acc[chave] = valor;
      return acc;
    }, {});
}

const env = lerEnv();

module.exports = {
  apps: [
    {
      name: 'cardapio-dia',
      script: './server.mjs',
      cwd: __dirname,

      // Conteúdo estático não justifica mais de uma instância; se o tráfego
      // crescer, troque para 'max' e o PM2 distribui entre os núcleos.
      instances: 1,
      exec_mode: 'fork',

      env: {
        NODE_ENV: 'production',
        // Porta fora das faixas comuns e do range efêmero do Linux
        // (32768-60999); ajustável pelo .env.
        PORT: env.PORT || 27381,
        HOST: env.HOST || '0.0.0.0',
      },

      // Reinício automático, com trava contra laço de falha: se cair 10 vezes
      // seguidas antes de completar 10s de pé, o PM2 desiste em vez de ficar
      // reiniciando para sempre.
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 2000,

      // O servidor mal usa memória; passar disso indica vazamento.
      max_memory_restart: '150M',

      // Não observar arquivos: o deploy chama `pm2 reload` explicitamente.
      watch: false,

      error_file: './logs/erro.log',
      out_file: './logs/saida.log',
      merge_logs: true,
      log_date_format: 'DD/MM/YYYY HH:mm:ss',

      kill_timeout: 5000,
    },
  ],
};
