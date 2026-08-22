/** Um prato do cardápio. Cada prato vira exatamente uma etiqueta. */
export interface Prato {
  id: string;
  nome: string;
  descricao: string;
}

/** Formato enxuto usado no link compartilhado: chaves curtas, sem id. */
export interface PratoNoLink {
  n: string;
  d?: string;
}

export type TomAviso = 'info' | 'ok' | 'atencao';

export interface Aviso {
  tom: TomAviso;
  texto: string;
  link?: string;
}

/** Medidas da etiqueta, em milímetros. */
export interface Tamanho {
  largura: number;
  altura: number;
}

/** Como as etiquetas se distribuem na folha A4, dado um tamanho. */
export interface Grade {
  colunas: number;
  linhas: number;
  porPagina: number;
  margemX: number;
  margemY: number;
  gradeL: number;
  gradeA: number;
}

/** Ícones disponíveis em IconeSvg.vue. */
export type NomeIcone =
  | 'imprimir' | 'enviar' | 'mais' | 'lixeira' | 'aviso' | 'ok' | 'prato' | 'copiar'
  | 'engrenagem' | 'fechar' | 'olho' | 'github' | 'qrcode' | 'offline'
  | 'instalar';
