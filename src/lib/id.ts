// Identificador único de prato.
//
// `crypto.randomUUID()` só existe em contexto seguro (HTTPS ou localhost).
// Servido por IP na rede local — `vite --host`, ou a VPS ainda sem
// certificado — ele é `undefined`, e chamá-lo derrubava a aplicação inteira.
// Daí os dois níveis de reserva abaixo.

function porGetRandomValues(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;   // versão 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80;   // variante RFC 4122
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-` +
         `${hex.slice(16, 20)}-${hex.slice(20)}`;
}

let contador = 0;

// Último recurso: só precisa ser único dentro desta lista, e os ids nunca
// saem do aparelho (não viajam no link nem se cruzam com os de outra sessão).
function porContador(): string {
  contador += 1;
  return `id-${Date.now().toString(36)}-${contador}-${Math.random().toString(36).slice(2, 10)}`;
}

export function novoId(): string {
  try {
    if (typeof crypto !== 'undefined') {
      if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
      if (typeof crypto.getRandomValues === 'function') return porGetRandomValues();
    }
  } catch {
    // Alguns navegadores lançam em vez de omitir a função.
  }
  return porContador();
}
