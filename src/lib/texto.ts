// Formatação de texto em lote, para padronizar o cardápio de uma vez.

export type Formato = 'maiusculas' | 'minusculas' | 'titulo' | 'frase' | 'espacos';

export interface OpcaoFormato {
  valor: Formato;
  rotulo: string;
  exemplo: string;
}

export const FORMATOS: readonly OpcaoFormato[] = [
  { valor: 'titulo', rotulo: 'Cada Palavra', exemplo: 'Feijoada com Couve' },
  { valor: 'maiusculas', rotulo: 'MAIÚSCULAS', exemplo: 'FEIJOADA COM COUVE' },
  { valor: 'minusculas', rotulo: 'minúsculas', exemplo: 'feijoada com couve' },
  { valor: 'frase', rotulo: 'Como frase', exemplo: 'Feijoada com couve' },
  { valor: 'espacos', rotulo: 'Só limpar espaços', exemplo: 'sem mexer nas letras' },
] as const;

// Em nome de prato, estas não sobem para maiúscula quando estão no meio.
const MINUSCULAS = new Set([
  'a', 'ao', 'aos', 'as', 'à', 'às',
  'com', 'da', 'das', 'de', 'do', 'dos', 'e', 'em',
  'na', 'nas', 'no', 'nos', 'o', 'os', 'ou', 'para', 'por', 'sem',
]);

/** Espaços duplicados e nas pontas atrapalham a medição do texto no PDF. */
function limparEspacos(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim();
}

function maiuscularInicial(palavra: string): string {
  if (!palavra) return palavra;
  // O locale importa: sem ele, "i" em turco viraria "İ".
  return palavra[0].toLocaleUpperCase('pt-BR') + palavra.slice(1);
}

/**
 * Cada palavra em maiúscula, exceto preposições curtas no meio — a primeira
 * e a última palavra sobem sempre, como manda a convenção de títulos.
 */
function paraTitulo(texto: string): string {
  const palavras = limparEspacos(texto).toLocaleLowerCase('pt-BR').split(' ');
  return palavras
    .map((palavra, i) => {
      const ultima = i === palavras.length - 1;
      if (i > 0 && !ultima && MINUSCULAS.has(palavra)) return palavra;
      // Em compostos hifenizados as partículas também ficam em minúscula:
      // "bife-a-cavalo", e não "Bife-A-Cavalo".
      return palavra
        .split('-')
        .map((parte, j) => (j > 0 && MINUSCULAS.has(parte) ? parte : maiuscularInicial(parte)))
        .join('-');
    })
    .join(' ');
}

function paraFrase(texto: string): string {
  const limpo = limparEspacos(texto).toLocaleLowerCase('pt-BR');
  return maiuscularInicial(limpo);
}

export function formatar(texto: string, formato: Formato): string {
  const limpo = limparEspacos(texto);
  if (!limpo) return limpo;

  switch (formato) {
    case 'maiusculas': return limpo.toLocaleUpperCase('pt-BR');
    case 'minusculas': return limpo.toLocaleLowerCase('pt-BR');
    case 'titulo': return paraTitulo(limpo);
    case 'frase': return paraFrase(limpo);
    case 'espacos': return limpo;
  }
}
