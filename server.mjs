// Servidor estático do build, para rodar sob o PM2.
//
// Sem dependências: o `node:http` dá conta de servir alguns arquivos, e
// qualquer pacote a mais seria peso para manter numa VPS.
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const RAIZ = resolve(new URL('./dist', import.meta.url).pathname);

// Lê o .env quando existir; nativo desde o Node 20, sem dependência.
try {
  process.loadEnvFile(new URL('./.env', import.meta.url).pathname);
} catch {
  // Sem .env: seguem os padrões abaixo. Variáveis do ambiente (as que o PM2
  // injeta, por exemplo) continuam valendo e têm precedência.
}

// Porta fora das faixas comuns e do range efêmero do Linux (32768-60999).
const PORTA = Number(process.env.PORT) || 27381;
const HOST = process.env.HOST || '0.0.0.0';

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * Arquivos em /assets/ têm hash no nome: mudam de nome a cada build, então
 * podem ser cacheados para sempre. O service worker e o HTML precisam do
 * oposto — se ficarem presos no cache, a atualização nunca chega.
 */
function cacheDe(caminho) {
  if (caminho.startsWith('/assets/')) return 'public, max-age=31536000, immutable';
  if (caminho.endsWith('sw.js') || caminho.endsWith('.webmanifest')) return 'no-cache';
  if (caminho.endsWith('.html') || caminho === '/') return 'no-cache';
  return 'public, max-age=86400';   // ícones e splashes
}

function resolverCaminho(url) {
  const semQuery = decodeURIComponent(url.split('?')[0].split('#')[0]);
  // normalize + prefixo obrigatório barram travessia de diretório (../).
  const relativo = normalize(semQuery).replace(/^(\.\.[/\\])+/, '');
  const absoluto = resolve(join(RAIZ, relativo));
  if (!absoluto.startsWith(RAIZ)) return null;
  return absoluto;
}

const servidor = createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Allow': 'GET, HEAD' }).end('Método não permitido');
    return;
  }

  let caminho = resolverCaminho(req.url || '/');
  if (!caminho) {
    res.writeHead(403).end('Acesso negado');
    return;
  }

  if (existsSync(caminho) && statSync(caminho).isDirectory()) {
    caminho = join(caminho, 'index.html');
  }

  if (!existsSync(caminho)) {
    const querHtml = (req.headers.accept || '').includes('text/html');
    const temExtensao = extname(caminho) !== '';

    // Um .js ou .css ausente precisa devolver 404: servir HTML no lugar de um
    // script deixa a página em branco com um erro de MIME pouco explicativo.
    if (!querHtml || temExtensao) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
         .end('Arquivo não encontrado');
      return;
    }

    // O app não tem rotas: tudo o que ele guarda vive no fragmento da URL,
    // que o navegador preserva no redirecionamento. Mandar para a raiz evita
    // servir o index.html sob um caminho onde os assets relativos quebrariam.
    res.writeHead(302, { Location: '/', 'Cache-Control': 'no-store' }).end();
    return;
  }

  const rel = '/' + caminho.slice(RAIZ.length + 1).replace(/\\/g, '/');
  const tipo = TIPOS[extname(caminho).toLowerCase()] || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': tipo,
    'Cache-Control': cacheDe(rel),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'no-referrer',
  });

  if (req.method === 'HEAD') { res.end(); return; }

  createReadStream(caminho)
    .on('error', () => { res.writeHead(500).end('Erro ao ler o arquivo'); })
    .pipe(res);
});

servidor.listen(PORTA, HOST, () => {
  console.log(`Cardápio do Dia servindo ${RAIZ} em http://${HOST}:${PORTA}`);
});

// O PM2 envia SIGINT/SIGTERM ao reiniciar; encerrar limpo evita conexões presas.
for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, () => servidor.close(() => process.exit(0)));
}
