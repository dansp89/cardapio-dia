// Geração do PDF de etiquetas. Todas as medidas em milímetros.
//
// O jsPDF (~350 kB) é carregado sob demanda, na primeira impressão: a página
// abre sem ele, o que pesa bastante no celular.
import type { jsPDF } from 'jspdf';
import type { Prato, Tamanho, Grade } from '../types';

type jsPDFTipo = InstanceType<typeof jsPDF>;

const PAGINA_L = 210;   // A4 retrato
const PAGINA_A = 297;

// Impressora doméstica não imprime até a borda: sem esta folga, a fileira
// encostada na margem sai cortada e a folha inteira se perde.
export const MARGEM_MIN = 10;

export const TAMANHO_PADRAO: Tamanho = { largura: 70, altura: 30 };

// Limites do que faz sentido imprimir e recortar à mão.
export const LIMITES = { min: 20, max: 190 } as const;

const SANGRIA = 4;        // guia de corte além da grade
const RECUO = 6;          // respiro interno da etiqueta
const PT_MM = 0.352778;   // 1 ponto tipográfico em mm
const ENTRELINHA = 1.15;
const ESPACO_DESC = 1.8;
const MOLDURA = 2.5;      // recuo da moldura até o corte

/**
 * Quantas etiquetas cabem na folha, respeitando a margem mínima, e onde a
 * grade começa. As sobras viram margem, sempre centralizada.
 */
export function calcularGrade({ largura, altura }: Tamanho): Grade {
  const colunas = Math.max(1, Math.floor((PAGINA_L - MARGEM_MIN * 2) / largura));
  const linhas = Math.max(1, Math.floor((PAGINA_A - MARGEM_MIN * 2) / altura));

  const gradeL = colunas * largura;
  const gradeA = linhas * altura;

  return {
    colunas, linhas,
    porPagina: colunas * linhas,
    margemX: (PAGINA_L - gradeL) / 2,
    margemY: (PAGINA_A - gradeA) / 2,
    gradeL, gradeA,
  };
}

/** O tamanho cabe na folha com a margem mínima? */
export function tamanhoValido({ largura, altura }: Tamanho): boolean {
  return largura >= LIMITES.min && altura >= LIMITES.min
    && largura <= PAGINA_L - MARGEM_MIN * 2
    && altura <= PAGINA_A - MARGEM_MIN * 2;
}

// A fonte do nome acompanha a altura da etiqueta: 30mm → 16pt, e proporcional
// a partir daí, limitada ao que ainda é legível de longe.
function tetoFonte(altura: number): number {
  return Math.max(9, Math.min(30, Math.round(altura * 16 / 30 * 2) / 2));
}

function ajustarNome(
  pdf: jsPDFTipo, nome: string, utilL: number, altura: number,
): { linhas: string[]; tamanho: number } {
  const teto = tetoFonte(altura);
  for (let tam = teto; tam >= 7.5; tam -= 0.5) {
    pdf.setFontSize(tam);
    const linhas = pdf.splitTextToSize(nome, utilL);
    if (linhas.length <= 2) return { linhas, tamanho: tam };
  }
  pdf.setFontSize(7.5);
  return { linhas: pdf.splitTextToSize(nome, utilL).slice(0, 2), tamanho: 7.5 };
}

function truncar(pdf: jsPDFTipo, texto: string, largura: number): string {
  if (pdf.getTextWidth(texto) <= largura) return texto;
  let corte = texto;
  while (corte.length > 1 && pdf.getTextWidth(corte + '…') > largura) {
    corte = corte.slice(0, -1);
  }
  return corte.trimEnd() + '…';
}

// Grade pontilhada: a borda entre duas etiquetas é compartilhada, de modo que
// uma única passada de tesoura corta as duas.
function desenharGrade(pdf: jsPDFTipo, t: Tamanho, g: Grade): void {
  pdf.setDrawColor(150, 150, 150);
  pdf.setLineWidth(0.1);
  pdf.setLineDashPattern([1, 1], 0);

  for (let c = 0; c <= g.colunas; c++) {
    const x = g.margemX + c * t.largura;
    pdf.line(x, g.margemY - SANGRIA, x, g.margemY + g.gradeA + SANGRIA);
  }
  for (let l = 0; l <= g.linhas; l++) {
    const y = g.margemY + l * t.altura;
    pdf.line(g.margemX - SANGRIA, y, g.margemX + g.gradeL + SANGRIA, y);
  }

  pdf.setLineDashPattern([], 0);
}

function desenharEtiqueta(
  pdf: jsPDFTipo, prato: Prato, indice: number, t: Tamanho, g: Grade,
): void {
  const col = indice % g.colunas;
  const lin = Math.floor(indice / g.colunas);
  const x = g.margemX + col * t.largura;
  const y = g.margemY + lin * t.altura;
  const centroX = x + t.largura / 2;

  // Em etiquetas pequenas o recuo fixo comeria o espaço útil.
  const recuo = Math.min(RECUO, t.largura * 0.09);
  const utilL = t.largura - recuo * 2;
  const moldura = Math.min(MOLDURA, t.altura * 0.09);

  pdf.setDrawColor(70, 70, 70);
  pdf.setLineWidth(0.35);
  pdf.roundedRect(x + moldura, y + moldura,
                  t.largura - moldura * 2, t.altura - moldura * 2, 1.5, 1.5, 'S');

  pdf.setFont('helvetica', 'bold');
  const { linhas, tamanho } = ajustarNome(pdf, prato.nome, utilL, t.altura);
  const temDescricao = prato.descricao.length > 0;

  // jsPDF posiciona pela baseline; o bloco vai do topo das maiúsculas até a
  // base da última linha, e os descendentes (p, ç, g) descem além dela.
  const corpoDesc = Math.max(6, Math.min(10, tamanho * 0.5));
  const passoNome = tamanho * ENTRELINHA * PT_MM;
  const alturaNome = linhas.length * passoNome;
  const alturaDesc = temDescricao ? ESPACO_DESC * 2 + corpoDesc * PT_MM : 0;
  const alturaTotal = alturaNome + alturaDesc;

  const descendente = (temDescricao ? corpoDesc : tamanho) * 0.42 * PT_MM;
  const topoBloco = y + (t.altura - alturaTotal - descendente) / 2 + descendente;
  let cursorY = topoBloco + tamanho * 0.72 * PT_MM;

  pdf.setTextColor(0, 0, 0);
  linhas.forEach((linha: string) => {
    pdf.text(linha, centroX, cursorY, { align: 'center' });
    cursorY += passoNome;
  });

  if (temDescricao) {
    const yFilete = topoBloco + alturaNome + ESPACO_DESC * 0.6;
    pdf.setDrawColor(150, 150, 150);
    pdf.setLineWidth(0.2);
    const fileteL = Math.min(14, utilL * 0.35);
    pdf.line(centroX - fileteL / 2, yFilete, centroX + fileteL / 2, yFilete);

    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(corpoDesc);
    pdf.setTextColor(90, 90, 90);
    const baseDesc = topoBloco + alturaNome + ESPACO_DESC * 2 + corpoDesc * 0.72 * PT_MM;
    pdf.text(truncar(pdf, prato.descricao, utilL), centroX, baseDesc, { align: 'center' });
  }
}

/**
 * Carimbo na margem inferior, fora da grade: identifica a folha sem ocupar
 * espaço nas etiquetas, e desaparece quando elas são recortadas.
 */
function desenharRodape(pdf: jsPDFTipo, g: Grade, quando: string,
                        pagina: number, total: number): void {
  const y = g.margemY + g.gradeA + SANGRIA + 3.5;
  if (y > PAGINA_A - 3) return;   // margem apertada: não cabe

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Gerado em ${quando}`, g.margemX, y);
  if (total > 1) {
    pdf.text(`Folha ${pagina} de ${total}`, g.margemX + g.gradeL, y, { align: 'right' });
  }
}

async function montar(pratos: Prato[], tamanho: Tamanho): Promise<jsPDFTipo> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const grade = calcularGrade(tamanho);
  const quando = carimbo(new Date());
  const folhas = Math.max(1, Math.ceil(pratos.length / grade.porPagina));

  desenharGrade(pdf, tamanho, grade);
  desenharRodape(pdf, grade, quando, 1, folhas);

  pratos.forEach((prato, i) => {
    if (i > 0 && i % grade.porPagina === 0) {
      pdf.addPage();
      desenharGrade(pdf, tamanho, grade);
      desenharRodape(pdf, grade, quando, Math.floor(i / grade.porPagina) + 1, folhas);
    }
    desenharEtiqueta(pdf, prato, i % grade.porPagina, tamanho, grade);
  });

  return pdf;
}

/**
 * Nome do arquivo com data e hora locais: é comum reimprimir no mesmo dia, e
 * só a data faria o navegador numerar as versões — "(1)", "(2)" — sem dizer
 * qual é a mais recente.
 *
 * Hora local, não UTC: às 22h no Brasil o `toISOString()` já marcaria o dia
 * seguinte.
 */
export function nomeArquivo(agora = new Date()): string {
  const d = (n: number) => String(n).padStart(2, '0');
  return `etiquetas-${agora.getFullYear()}-${d(agora.getMonth() + 1)}-` +
         `${d(agora.getDate())}-${d(agora.getHours())}h${d(agora.getMinutes())}.pdf`;
}

/** Data e hora por extenso, como aparecem carimbadas na folha. */
function carimbo(agora: Date): string {
  const d = (n: number) => String(n).padStart(2, '0');
  return `${d(agora.getDate())}/${d(agora.getMonth() + 1)}/${agora.getFullYear()} ` +
         `às ${d(agora.getHours())}:${d(agora.getMinutes())}`;
}

/** Baixa o arquivo — o PDF fica salvo no aparelho. */
export async function gerarPdf(
  pratos: Prato[], tamanho: Tamanho = TAMANHO_PADRAO,
): Promise<void> {
  const pdf = await montar(pratos, tamanho);
  pdf.save(nomeArquivo());
}

/**
 * Devolve o PDF como URL de blob, para exibir dentro da própria página.
 *
 * Não abre aba nem baixa arquivo: `window.open()` é bloqueado por padrão em
 * boa parte dos navegadores de celular, e navegar direto para um blob
 * `application/pdf` faz o navegador BAIXAR em vez de exibir. Quem chama
 * mostra a URL num <iframe> e depois libera com `liberarPdf()`.
 */
export async function visualizarPdf(
  pratos: Prato[], tamanho: Tamanho = TAMANHO_PADRAO,
): Promise<{ url: string; paginas: number }> {
  const pdf = await montar(pratos, tamanho);
  const { porPagina } = calcularGrade(tamanho);
  return {
    url: URL.createObjectURL(pdf.output('blob')),
    paginas: Math.max(1, Math.ceil(pratos.length / porPagina)),
  };
}

export function liberarPdf(url: string | null): void {
  if (url) URL.revokeObjectURL(url);
}
