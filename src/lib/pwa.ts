// Registro do service worker e estado da conexão.

/**
 * O Chrome guarda o evento de instalação e só o oferece pelo menu, que muita
 * gente não encontra. Capturá-lo permite mostrar um botão no próprio app.
 *
 * Precisa ser registrado o quanto antes: o evento dispara logo no carregamento
 * e não se repete.
 */
interface EventoInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let convite: EventoInstalacao | null = null;
const ouvintes = new Set<(disponivel: boolean) => void>();

function avisar(): void {
  ouvintes.forEach(fn => fn(convite !== null));
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', evento => {
    evento.preventDefault();   // impede o banner automático do navegador
    convite = evento as EventoInstalacao;
    avisar();
  });

  window.addEventListener('appinstalled', () => {
    convite = null;
    avisar();
  });
}

/** Já está rodando como app instalado? */
export function estaInstalado(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    // iOS usa uma propriedade própria, fora do padrão.
    || (window.navigator as { standalone?: boolean }).standalone === true;
}

/** Observa se há convite de instalação disponível. */
export function observarInstalacao(aoMudar: (disponivel: boolean) => void): () => void {
  ouvintes.add(aoMudar);
  aoMudar(convite !== null);
  return () => { ouvintes.delete(aoMudar); };
}

/** Abre o diálogo de instalação. Devolve se o usuário aceitou. */
export async function instalar(): Promise<boolean> {
  if (!convite) return false;
  try {
    await convite.prompt();
    const { outcome } = await convite.userChoice;
    // O evento é de uso único; recusado, o navegador oferece de novo depois.
    convite = null;
    avisar();
    return outcome === 'accepted';
  } catch (erro) {
    console.error('Falha ao abrir a instalação:', erro);
    return false;
  }
}

/** Registra o service worker; sem ele o app só não funciona offline. */
export function registrarSw(): void {
  if (!('serviceWorker' in navigator)) return;
  // O SW exige contexto seguro; em HTTP na rede local ele simplesmente não roda.
  if (!window.isSecureContext) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(new URL('sw.js', document.baseURI).href, { scope: './' })
      .catch(erro => console.error('Service worker não registrado:', erro));
  });
}

/**
 * Observa a conexão e chama de volta a cada mudança.
 *
 * `navigator.onLine` só garante que existe uma interface de rede ativa — ele
 * segue `true` num Wi-Fi sem saída para a internet, o que é comum.
 * Por isso uma sondagem leve confirma o estado de tempos em tempos.
 */
export function observarConexao(aoMudar: (online: boolean) => void): () => void {
  let ultimo: boolean | null = null;

  function anunciar(valor: boolean): void {
    if (valor === ultimo) return;
    ultimo = valor;
    aoMudar(valor);
  }

  async function sondar(): Promise<void> {
    if (!navigator.onLine) { anunciar(false); return; }
    try {
      // Um arquivo pequeno do próprio site, sem cache. O erro no console
      // quando está offline é esperado — é assim que se detecta a queda.
      await fetch('./favicon-16.png', { method: 'HEAD', cache: 'no-store' });
      anunciar(true);
    } catch {
      anunciar(false);
    }
  }

  let timer: ReturnType<typeof setTimeout> | undefined;

  // Offline, sonda de 3 em 3 segundos para o aviso sumir logo que a rede
  // voltar; online, de 30 em 30, só para perceber uma queda silenciosa.
  function agendar(): void {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      await sondar();
      agendar();
    }, ultimo === false ? 3_000 : 30_000);
  }

  const aoEvento = () => { void sondar().then(agendar); };
  window.addEventListener('online', aoEvento);
  window.addEventListener('offline', aoEvento);
  void sondar().then(agendar);

  return () => {
    window.removeEventListener('online', aoEvento);
    window.removeEventListener('offline', aoEvento);
    clearTimeout(timer);
  };
}
