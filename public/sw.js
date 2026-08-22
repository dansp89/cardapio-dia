// Service worker: guarda a aplicação para funcionar sem internet.
//
// Estratégia:
//   - navegação (o HTML): rede primeiro, cache como reserva. Assim uma
//     versão nova chega assim que houver conexão, sem esperar dias.
//   - assets com hash no nome (/assets/...): cache primeiro. O nome muda a
//     cada build, então o conteúdo cacheado nunca fica errado.
//
// VERSAO é trocada a cada build pelo script de deploy; mudá-la descarta os
// caches antigos.
const VERSAO = 'v1';
const CACHE = `cardapio-dia-${VERSAO}`;

// O essencial para a primeira tela funcionar offline. Os arquivos com hash
// entram no cache conforme são pedidos.
const ESSENCIAIS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icone-192.png',
  './icone-512.png',
  './apple-touch-icon.png',
  './favicon-32.png',
];

self.addEventListener('install', evento => {
  evento.waitUntil(
    caches.open(CACHE)
      // Um arquivo ausente não pode abortar a instalação inteira.
      .then(c => Promise.allSettled(ESSENCIAIS.map(u => c.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(
        nomes.filter(n => n.startsWith('cardapio-dia-') && n !== CACHE)
             .map(n => caches.delete(n)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', evento => {
  const req = evento.request;

  // Só GET do mesmo domínio; blobs e requisições externas passam direto.
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // HTML: rede primeiro, para a atualização chegar rápido.
  if (req.mode === 'navigate') {
    evento.respondWith(
      fetch(req)
        .then(resp => {
          const copia = resp.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copia));
          return resp;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./'))),
    );
    return;
  }

  // Demais arquivos: cache primeiro (os nomes têm hash).
  evento.respondWith(
    caches.match(req).then(cacheado => {
      if (cacheado) return cacheado;
      return fetch(req).then(resp => {
        if (resp.ok && resp.type === 'basic') {
          const copia = resp.clone();
          caches.open(CACHE).then(c => c.put(req, copia));
        }
        return resp;
      });
    }),
  );
});
