// Reescreve dist/sw.js com a lista real de arquivos do build.
//
// Sem isto, os pedaços carregados sob demanda (jsPDF, QR Code) só entrariam
// no cache depois de usados uma vez — e gerar um PDF offline falharia para
// quem nunca imprimiu com internet.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;

function listar(dir, prefixo = '') {
  return readdirSync(dir).flatMap(nome => {
    const caminho = join(dir, nome);
    return statSync(caminho).isDirectory()
      ? listar(caminho, `${prefixo}${nome}/`)
      : [`${prefixo}${nome}`];
  });
}

const arquivos = listar(DIST)
  .filter(f => f !== 'sw.js')             // o próprio worker não se cacheia
  .filter(f => !f.endsWith('.map'))
  .map(f => `./${f}`);

// A versão muda quando qualquer arquivo muda: os nomes têm hash, então o
// conjunto ordenado já serve de impressão digital do build.
const versao = arquivos.join('|').length.toString(36)
  + '-' + arquivos.filter(f => f.includes('/assets/')).length;

const sw = readFileSync(join(DIST, '..', 'public', 'sw.js'), 'utf8')
  .replace(/^const VERSAO = '.*';$/m, `const VERSAO = '${versao}';`)
  .replace(
    /^const ESSENCIAIS = \[[\s\S]*?\];$/m,
    `const ESSENCIAIS = ${JSON.stringify(arquivos, null, 2)};`,
  );

writeFileSync(join(DIST, 'sw.js'), sw);

const kb = (arquivos.reduce((t, f) =>
  t + statSync(join(DIST, f.slice(2))).size, 0) / 1024).toFixed(0);
console.log(`sw.js: ${arquivos.length} arquivos pré-cacheados (${kb} kB), versão ${versao}`);
