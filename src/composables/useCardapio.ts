import { ref, computed, watch, type Ref, type ComputedRef } from 'vue';
import { lerLink, limparHash } from '../lib/link';
import type { Prato, Tamanho } from '../types';
import { novoId } from '../lib/id';

const CHAVE = 'etiquetas.cardapio';
const CHAVE_ANTERIOR = 'etiquetas.cardapio.anterior';

// As chaves mudaram de nome quando o projeto deixou de ser específico de um
// restaurante. Quem já tinha cardápio salvo não pode perdê-lo na atualização.
const CHAVES_ANTIGAS: Record<string, string> = {
  'dangelo.cardapio': CHAVE,
  'dangelo.cardapio.anterior': CHAVE_ANTERIOR,
  'dangelo.tamanho': 'etiquetas.tamanho',
};

function migrarChaves(): void {
  try {
    for (const [antiga, nova] of Object.entries(CHAVES_ANTIGAS)) {
      const valor = localStorage.getItem(antiga);
      if (valor !== null && localStorage.getItem(nova) === null) {
        localStorage.setItem(nova, valor);
      }
      if (valor !== null) localStorage.removeItem(antiga);
    }
  } catch {
    // Sem acesso ao armazenamento: nada a migrar.
  }
}

/** Compara nomes ignorando acentos, caixa e espaços repetidos. */
function normalizar(nome: string): string {
  return nome
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

export interface Cardapio {
  pratos: Ref<Prato[]>;
  veioDeLink: Ref<boolean>;
  total: ComputedRef<number>;
  folhas: ComputedRef<number>;
  vazio: ComputedRef<boolean>;
  temAnterior: ComputedRef<boolean>;
  iniciar: () => void;
  adicionar: (nome: string, descricao?: string) => void;
  remover: (id: string) => void;
  editar: (id: string, campo: 'nome' | 'descricao', valor: string) => void;
  limpar: () => void;
  substituir: (novos: Prato[]) => void;
  duplicado: (nome: string) => boolean;
  arquivar: () => void;
  repetirAnterior: () => number;
}

/**
 * porPagina vem do tamanho escolhido, por isso é injetado. aoReceberTamanho
 * é chamado quando um link traz o tamanho de quem o gerou.
 */
export function useCardapio(
  porPagina: Ref<number> | ComputedRef<number>,
  aoReceberTamanho?: (t: Tamanho) => void,
): Cardapio {
  const pratos = ref<Prato[]>([]);
  const veioDeLink = ref(false);
  const anterior = ref<Prato[]>([]);

  function carregarDe(chave: string): Prato[] {
    try {
      const bruto = localStorage.getItem(chave);
      if (!bruto) return [];
      const dados: unknown = JSON.parse(bruto);
      if (!Array.isArray(dados)) return [];
      return (dados as Partial<Prato>[])
        .filter(p => p && typeof p.nome === 'string')
        .map(p => ({
          id: p.id || novoId(),
          nome: String(p.nome),
          descricao: String(p.descricao || ''),
        }));
    } catch (erro) {
      console.error('Falha ao ler o cardápio salvo:', erro);
      return [];
    }
  }

  const carregar = (): Prato[] => carregarDe(CHAVE);

  function salvar(): void {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(pratos.value));
    } catch {
      // Sem espaço ou aba privativa: a sessão continua em memória.
    }
  }

  // Um cardápio recebido por link não substitui o que está salvo até que
  // quem recebeu de fato mexa na lista.
  function aplicarLink(): boolean {
    const conteudo = lerLink();
    if (conteudo && conteudo.pratos.length) {
      pratos.value = conteudo.pratos;
      veioDeLink.value = true;
      if (conteudo.tamanho) aoReceberTamanho?.(conteudo.tamanho);
      return true;
    }
    return false;
  }

  function iniciar(): void {
    migrarChaves();
    if (!aplicarLink()) pratos.value = carregar();
    anterior.value = carregarDe(CHAVE_ANTERIOR);

    // Colar um link novo numa aba já aberta troca só o fragmento, sem recarregar.
    window.addEventListener('hashchange', aplicarLink);
  }

  function marcarComoLocal(): void {
    if (!veioDeLink.value) return;
    veioDeLink.value = false;
    limparHash();
  }

  function adicionar(nome: string, descricao = ''): void {
    marcarComoLocal();
    pratos.value.push({
      id: novoId(),
      nome: nome.trim().slice(0, 60),
      descricao: descricao.trim().slice(0, 80),
    });
  }

  function remover(id: string): void {
    marcarComoLocal();
    pratos.value = pratos.value.filter(p => p.id !== id);
  }

  function editar(id: string, campo: 'nome' | 'descricao', valor: string): void {
    const prato = pratos.value.find(p => p.id === id);
    if (!prato) return;
    const limpo = valor.trim().slice(0, campo === 'nome' ? 60 : 80);
    if (campo === 'nome' && !limpo) return;   // nome vazio: mantém o anterior
    if (prato[campo] === limpo) return;
    marcarComoLocal();
    prato[campo] = limpo;
  }

  function limpar(): void {
    marcarComoLocal();
    pratos.value = [];
  }

  /** Troca a lista inteira de uma vez (usado pelo cardápio de exemplo). */
  function substituir(novos: Prato[]): void {
    marcarComoLocal();
    pratos.value = novos;
  }

  /** Já existe um prato com este nome? Ignora acentos e caixa. */
  function duplicado(nome: string): boolean {
    const alvo = normalizar(nome);
    return pratos.value.some(p => normalizar(p.nome) === alvo);
  }

  /** Guarda o cardápio atual como "o de ontem". Chamado ao imprimir. */
  function arquivar(): void {
    if (!pratos.value.length) return;
    try {
      localStorage.setItem(CHAVE_ANTERIOR, JSON.stringify(pratos.value));
      anterior.value = pratos.value.map(p => ({ ...p }));
    } catch {
      // Sem espaço: seguir sem arquivar.
    }
  }

  /** Repõe o cardápio guardado, sem duplicar o que já está na lista. */
  function repetirAnterior(): number {
    const novos = anterior.value.filter(p => !duplicado(p.nome));
    if (!novos.length) return 0;
    marcarComoLocal();
    pratos.value.push(...novos.map(p => ({ ...p, id: novoId() })));
    return novos.length;
  }

  watch(pratos, salvar, { deep: true });

  const total = computed(() => pratos.value.length);
  const folhas = computed(() => Math.ceil(total.value / porPagina.value) || 0);
  const vazio = computed(() => total.value === 0);
  const temAnterior = computed(() =>
    anterior.value.length > 0 && anterior.value.some(p => !duplicado(p.nome)));

  return {
    pratos, veioDeLink, total, folhas, vazio, temAnterior,
    iniciar, adicionar, remover, editar, limpar, substituir,
    duplicado, arquivar, repetirAnterior,
  };
}
