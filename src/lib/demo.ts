// Cardápio de exemplo para testar impressão e recorte sem digitar nada.
//
// Os nomes variam de propósito entre curtos, longos e com acentos: é assim
// que se vê, no papel, o ajuste de fonte e a quebra em duas linhas.
import type { Prato } from '../types';
import { novoId } from './id';

const EXEMPLOS: readonly { nome: string; descricao: string }[] = [
  { nome: 'Feijoada Completa', descricao: 'acompanha couve e farofa' },
  { nome: 'Picanha na Chapa', descricao: 'com vinagrete' },
  { nome: 'Escondidinho de Carne Seca', descricao: 'gratinado no forno' },
  { nome: 'Frango Grelhado', descricao: 'com legumes no vapor' },
  { nome: 'Moqueca de Peixe', descricao: 'arroz e pirão' },
  { nome: 'Strogonoff de Frango', descricao: 'batata palha crocante' },
  { nome: 'Bife Acebolado', descricao: '' },
  { nome: 'Coração de Galinha ao Alho', descricao: 'porção individual' },
  { nome: 'Lasanha à Bolonhesa', descricao: 'massa fresca' },
  { nome: 'Costelinha ao Barbecue', descricao: 'assada lentamente' },
  { nome: 'Peixe Frito', descricao: 'com limão siciliano' },
  { nome: 'Virado à Paulista', descricao: 'linguiça, ovo e couve' },
  { nome: 'Galinhada Caipira', descricao: '' },
  { nome: 'Baião de Dois', descricao: 'queijo coalho' },
  { nome: 'Carne de Panela', descricao: 'no caldo próprio' },
  { nome: 'Parmegiana de Frango', descricao: 'arroz e fritas' },
  { nome: 'Tutu de Feijão', descricao: 'torresmo e couve' },
  { nome: 'Vaca Atolada', descricao: 'mandioca cozida' },
  { nome: 'Rabada com Agrião', descricao: '' },
  { nome: 'Panqueca de Carne', descricao: 'molho de tomate caseiro' },
  { nome: 'Salmão ao Molho de Maracujá', descricao: 'arroz de brócolis' },
  { nome: 'Filé de Tilápia', descricao: 'grelhado na manteiga' },
  { nome: 'Cupim Assado', descricao: 'no bafo' },
  { nome: 'Yakisoba de Legumes', descricao: 'opção vegetariana' },
  { nome: 'Arroz de Forno', descricao: 'com calabresa' },
  { nome: 'Bobó de Camarão', descricao: 'creme de mandioca' },
  { nome: 'Dobradinha', descricao: 'com feijão branco' },
] as const;

/**
 * Monta um cardápio de exemplo com exatamente `quantidade` pratos, repetindo
 * a lista quando a folha comporta mais etiquetas do que há exemplos.
 */
export function cardapioDemo(quantidade: number): Prato[] {
  return Array.from({ length: Math.max(0, quantidade) }, (_, i) => {
    const base = EXEMPLOS[i % EXEMPLOS.length];
    // Numera as repetições para não parecerem duplicatas acidentais.
    const volta = Math.floor(i / EXEMPLOS.length);
    return {
      id: novoId(),
      nome: volta ? `${base.nome} ${volta + 1}` : base.nome,
      descricao: base.descricao,
    };
  });
}
