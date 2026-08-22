// Compartilhamento do cardápio pela própria URL.
//
// Os pratos viajam dentro do fragmento (#c=...), que o navegador nunca envia
// ao servidor — o cardápio não aparece em log de acesso algum, e funciona
// também quando a página é aberta direto do sistema de arquivos.
import type { Prato, PratoNoLink, Tamanho } from '../types';
import { novoId } from './id';

/** O que um link carrega: os pratos e, opcionalmente, o tamanho da etiqueta. */
export interface ConteudoLink {
  pratos: Prato[];
  tamanho?: Tamanho;
}

// Acima disso muitos aplicativos de mensagem e clientes de e-mail truncam a URL.
export const LIMITE_URL = 2000;

function paraBase64Url(texto: string): string {
  const bytes = new TextEncoder().encode(texto);   // UTF-8: preserva acentos
  let binario = '';
  bytes.forEach((b: number) => { binario += String.fromCharCode(b); });
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deBase64Url(codigo: string): string {
  const base = codigo.replace(/-/g, '+').replace(/_/g, '/');
  const binario = atob(base + '='.repeat((4 - base.length % 4) % 4));
  return new TextDecoder().decode(Uint8Array.from(binario, (c: string) => c.charCodeAt(0)));
}

// Chaves curtas (p, t) e sem os ids: 36 caracteres por prato que não têm
// serventia para quem recebe. Quem abre o link recebe ids novos.
export function montarLink(pratos: Prato[], tamanho?: Tamanho): string {
  const enxuto: PratoNoLink[] = pratos.map(p =>
    p.descricao ? { n: p.nome, d: p.descricao } : { n: p.nome });
  // O tamanho viaja junto para quem recebe imprimir no formato escolhido por
  // quem enviou, e não no que estiver salvo no aparelho dele.
  const carga = tamanho
    ? { p: enxuto, t: [tamanho.largura, tamanho.altura] }
    : { p: enxuto };
  return location.href.split('#')[0] + '#c=' + paraBase64Url(JSON.stringify(carga));
}

function lerPratos(bruto: unknown): Prato[] {
  if (!Array.isArray(bruto)) return [];
  return (bruto as PratoNoLink[])
    .filter(p => p && typeof p.n === 'string' && p.n.trim())
    .map(p => ({
      id: novoId(),
      nome: String(p.n).slice(0, 60),
      descricao: String(p.d || '').slice(0, 80),
    }));
}

export function lerLink(): ConteudoLink | null {
  const marca = location.hash.match(/[#&]c=([^&]+)/);
  if (!marca) return null;
  try {
    const dados: unknown = JSON.parse(deBase64Url(marca[1]));

    // Formato antigo: um array de pratos, sem tamanho. Links já enviados
    // continuam funcionando.
    if (Array.isArray(dados)) {
      const pratos = lerPratos(dados);
      return pratos.length ? { pratos } : null;
    }

    const carga = dados as { p?: unknown; t?: unknown };
    const pratos = lerPratos(carga.p);
    if (!pratos.length) return null;

    let tamanho: Tamanho | undefined;
    if (Array.isArray(carga.t) && carga.t.length === 2) {
      const [largura, altura] = carga.t.map(Number);
      if (Number.isFinite(largura) && Number.isFinite(altura)) {
        tamanho = { largura, altura };
      }
    }
    return { pratos, tamanho };
  } catch (erro) {
    console.error('Link de cardápio inválido:', erro);
    return null;
  }
}

export function limparHash(): void {
  history.replaceState(null, '', location.href.split('#')[0]);
}

// navigator.clipboard exige contexto seguro: em file:// e servido por IP na
// rede local ele não existe, daí o execCommand como reserva.
export async function copiar(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch { /* cai no método antigo */ }

  try {
    const campo = document.createElement('textarea');
    campo.value = texto;
    campo.style.position = 'fixed';
    campo.style.opacity = '0';
    document.body.appendChild(campo);
    campo.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(campo);
    return ok;
  } catch {
    return false;
  }
}

// Em celular, o menu nativo de compartilhamento é bem mais direto que copiar
// e colar — o sistema oferece os aplicativos instalados. Só existe em HTTPS.
export function podeCompartilhar(): boolean {
  return typeof navigator.share === 'function' && window.isSecureContext;
}

/**
 * Fora de HTTPS o navegador esconde a área de transferência e o
 * compartilhamento nativo. Vale avisar, porque o sintoma (botão que não faz
 * nada de útil) não explica a causa.
 */
export function contextoInseguro(): boolean {
  return !window.isSecureContext;
}

export async function compartilhar(link: string): Promise<boolean> {
  try {
    await navigator.share({ title: 'Cardápio do Dia', text: 'Cardápio para imprimir:', url: link });
    return true;
  } catch {
    return false;   // inclui o caso de o usuário cancelar
  }
}
