<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useCardapio } from './composables/useCardapio';
import { useTamanho } from './composables/useTamanho';
import { gerarPdf, visualizarPdf, liberarPdf } from './lib/pdf';
import { montarLink, copiar, compartilhar, podeCompartilhar, contextoInseguro,
         LIMITE_URL } from './lib/link';

import FormularioPrato from './components/FormularioPrato.vue';
import ItemPrato from './components/ItemPrato.vue';
import ListaVazia from './components/ListaVazia.vue';
import BarraAcoes from './components/BarraAcoes.vue';
import AvisoCaixa from './components/AvisoCaixa.vue';
import BotaoBase from './components/BotaoBase.vue';
import IconeSvg from './components/IconeSvg.vue';
import ModalTamanho from './components/ModalTamanho.vue';
import ModalPreview from './components/ModalPreview.vue';
import ModalQrCode from './components/ModalQrCode.vue';
import { observarConexao } from './lib/pwa';
import { cardapioDemo } from './lib/demo';
import type { Aviso, Tamanho } from './types';

const { tamanho, grade, definir } = useTamanho();
const porPagina = computed(() => grade.value.porPagina);

// O link carrega o tamanho de quem o gerou: quem recebe imprime no formato
// certo sem precisar configurar nada.
const { pratos, veioDeLink, total, folhas, vazio, temAnterior,
        iniciar, adicionar, remover, editar, limpar, substituir,
        duplicado, arquivar, repetirAnterior } = useCardapio(porPagina, definir);

const aviso = ref<Aviso | null>(null);
const nativo = ref(false);
const configAberta = ref(false);
const semHttps = ref(false);
const previaUrl = ref<string | null>(null);
const previaPaginas = ref(1);
const ano = new Date().getFullYear();
// Vive em public/, fora do bundler: resolvido em relação ao documento para
// funcionar tanto na raiz quanto num subdiretório.
const iconeUrl = new URL('icone.svg', document.baseURI).href;
const qrLink = ref<string | null>(null);
const online = ref(true);
let pararDeObservar: (() => void) | undefined;

function aplicarTamanho(novo: Tamanho): void {
  if (!definir(novo)) return;
  const g = grade.value;
  aviso.value = {
    tom: 'ok',
    texto: `Etiqueta de ${novo.largura / 10} × ${novo.altura / 10} cm — ` +
           `${g.porPagina} por folha A4.`,
  };
}

onMounted(() => {
  iniciar();
  nativo.value = podeCompartilhar();
  semHttps.value = contextoInseguro();
  pararDeObservar = observarConexao(v => { online.value = v; });
});

onUnmounted(() => pararDeObservar?.());

// O QR carrega o cardápio noutro aparelho sem depender de rede — útil quando
// os aparelhos não estão na mesma conexão.
function mostrarQr(): void {
  if (vazio.value) return;
  qrLink.value = montarLink(pratos.value, tamanho.value);
}

const gerando = ref(false);

// Mostra o PDF na própria página, sem salvar arquivo nem depender de
// pop-up (bloqueado por padrão em boa parte dos celulares).
async function ver(): Promise<void> {
  if (vazio.value || gerando.value) return;
  gerando.value = true;
  try {
    fecharPrevia();
    const { url, paginas } = await visualizarPdf(pratos.value, tamanho.value);
    previaUrl.value = url;
    previaPaginas.value = paginas;
    aviso.value = null;
  } catch (erro) {
    console.error('Falha ao abrir o PDF:', erro);
    aviso.value = { tom: 'atencao', texto: 'Não foi possível abrir o PDF. Tente de novo.' };
  } finally {
    gerando.value = false;
  }
}

function fecharPrevia(): void {
  liberarPdf(previaUrl.value);
  previaUrl.value = null;
}

// "Baixar para imprimir", de dentro da pré-visualização.
async function imprimirDaPrevia(): Promise<void> {
  fecharPrevia();
  await imprimir();
}

async function imprimir(): Promise<void> {
  if (vazio.value || gerando.value) return;
  gerando.value = true;
  try {
    await gerarPdf(pratos.value, tamanho.value);
    arquivar();   // este vira "o cardápio anterior" para o próximo dia
    aviso.value = {
      tom: 'ok',
      texto: 'PDF salvo. Imprima em tamanho real (100%), sem "ajustar à página", ' +
             'e recorte pelas linhas pontilhadas.',
    };
  } catch (erro) {
    console.error('Falha ao gerar o PDF:', erro);
    aviso.value = { tom: 'atencao', texto: 'Não foi possível gerar o PDF. Tente de novo.' };
  } finally {
    gerando.value = false;
  }
}

async function enviar(): Promise<void> {
  if (vazio.value) return;
  const link = montarLink(pratos.value, tamanho.value);

  if (link.length > LIMITE_URL) {
    aviso.value = {
      tom: 'atencao',
      texto: 'O cardápio está longo demais para enviar por link — alguns aplicativos ' +
             'cortam endereços grandes. Use "Imprimir" e envie o PDF.',
    };
    return;
  }

  if (nativo.value && await compartilhar(link)) return;

  if (await copiar(link)) {
    aviso.value = { tom: 'ok', texto: 'Link copiado. Agora é só colar onde quiser enviar.' };
  } else {
    aviso.value = { tom: 'atencao', texto: 'Copie o endereço abaixo para enviar:', link };
  }
}

// Preenche a folha inteira com exemplos, para testar impressão e recorte.
function usarDemo(novo: Tamanho, quantidade: number): void {
  definir(novo);
  substituir(cardapioDemo(quantidade));
  aviso.value = {
    tom: 'ok',
    texto: `Folha de exemplo pronta: ${quantidade} etiquetas de ` +
           `${novo.largura / 10} × ${novo.altura / 10} cm. ` +
           'Toque em Ver para conferir sem baixar nada.',
  };
}

function repetir(): void {
  const n = repetirAnterior();
  aviso.value = n
    ? { tom: 'ok', texto: `${n} ${n === 1 ? 'prato foi reposto' : 'pratos foram repostos'} do último cardápio impresso.` }
    : { tom: 'atencao', texto: 'Todos os pratos do último cardápio já estão na lista.' };
}

const limpezaPendente = ref(false);

function confirmarLimpeza(): void {
  limpezaPendente.value = false;
  limpar();
  aviso.value = null;
}
</script>

<template>
  <div class="min-h-dvh bg-zinc-50 text-zinc-900">
    <!-- pb-40 reserva o espaço da barra fixa no celular. O topo fica sem
         padding porque o header, colado no alto, traz o seu próprio. -->
    <div class="mx-auto max-w-2xl px-4 pb-40 sm:px-6 sm:pb-16">

      <header
        class="sticky top-0 z-30 -mx-4 mb-5 border-b border-zinc-200/80 bg-zinc-50/85
               px-4 pb-3 pt-3 backdrop-blur-md sm:-mx-6 sm:px-6 sm:pb-4">
        <div class="flex items-center gap-3">
          <img
            :src="iconeUrl" alt="" width="40" height="40"
            class="h-10 w-10 shrink-0 rounded-xl shadow-sm sm:h-11 sm:w-11">

          <div class="min-w-0 flex-1">
            <h1 class="truncate text-lg font-bold leading-tight tracking-tight sm:text-xl">Cardápio do Dia</h1>
            <p class="mt-0.5 truncate text-xs text-zinc-500 sm:text-sm">
              <!-- Mesmo sem pratos o tamanho aparece: quem acabou de mudá-lo
                   precisa ver a confirmação em algum lugar. -->
              <template v-if="vazio">
                Etiqueta de
                <span class="tabular-nums font-semibold text-zinc-700">{{ tamanho.largura / 10 }}×{{ tamanho.altura / 10 }} cm</span>
                <span class="px-0.5 text-zinc-300">&#32;·</span>
                {{ grade.porPagina }} por folha
              </template>
              <template v-else>
                <span class="font-semibold text-zinc-700">{{ total }}</span>
                {{ total === 1 ? 'etiqueta' : 'etiquetas' }}
                <span class="px-0.5 text-zinc-300">·</span>
                {{ folhas }} {{ folhas === 1 ? 'folha' : 'folhas' }}
                <span class="px-0.5 text-zinc-300">·&#32;</span>
                <span class="tabular-nums">{{ tamanho.largura / 10 }}×{{ tamanho.altura / 10 }} cm</span>
              </template>
            </p>
          </div>

          <span
            v-if="!online"
            class="hidden items-center gap-1.5 rounded-lg bg-amber-100 px-2.5 py-1.5
                   text-xs font-medium text-amber-800 sm:flex"
            title="Sem internet — o app continua funcionando">
            <IconeSvg nome="offline" :tamanho="14" />
            Offline
          </span>

          <button
            type="button" aria-label="Configurar tamanho da etiqueta"
            title="Tamanho da etiqueta"
            class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl
                   border border-zinc-200 bg-white text-zinc-500 shadow-sm transition
                   hover:bg-zinc-50 hover:text-zinc-900 active:scale-95
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
            @click="configAberta = true">
            <IconeSvg nome="engrenagem" :tamanho="20" />
            <!-- No celular o rótulo "Offline" não cabe; um ponto no canto avisa. -->
            <span
              v-if="!online"
              class="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2
                     border-zinc-50 bg-amber-500 sm:hidden"
              aria-hidden="true"></span>
          </button>
        </div>
      </header>

      <AvisoCaixa v-if="semHttps" tom="atencao" class="mb-5">
        <strong class="font-semibold">Endereço sem HTTPS.</strong>
        Tudo funciona, mas o botão de enviar copia o link em vez de abrir o
        menu de compartilhamento. Com HTTPS, o envio fica em um toque.
      </AvisoCaixa>

      <AvisoCaixa v-if="veioDeLink" tom="info" class="mb-5">
        <strong class="font-semibold">Cardápio recebido por link.</strong>
        Confira os pratos e clique em <strong class="font-semibold">Imprimir</strong>.
        Se precisar, pode corrigir a lista antes.
      </AvisoCaixa>

      <!-- No desktop as ações ficam aqui, sempre à vista; no celular elas
           moram na barra fixa do rodapé. -->
      <BarraAcoes
        class="mb-5 hidden sm:block"
        :vazio="vazio" :compartilhamento-nativo="nativo" :gerando="gerando"
        @gerar-pdf="imprimir" @ver-pdf="ver" @enviar="enviar" />

      <FormularioPrato class="mb-5" :eh-duplicado="duplicado" @adicionar="adicionar" />

      <!-- Só aparece quando há algo do último cardápio que ainda não está na lista. -->
      <div v-if="temAnterior" class="mb-5 flex justify-center sm:justify-start">
        <BotaoBase variante="secundario" @click="repetir">
          <IconeSvg nome="prato" :tamanho="17" />
          Repetir o último cardápio
        </BotaoBase>
      </div>

      <ListaVazia v-if="vazio" />

      <ul v-else class="space-y-2.5">
        <ItemPrato
          v-for="(prato, i) in pratos" :key="prato.id"
          :prato="prato" :posicao="i + 1"
          @editar="editar" @remover="remover" />
      </ul>

      <AvisoCaixa v-if="aviso" :tom="aviso.tom" class="mt-5">
        {{ aviso.texto }}
        <textarea
          v-if="aviso.link" readonly rows="3" :value="aviso.link"
          class="mt-2 w-full rounded-lg border border-amber-300 bg-white p-2 font-mono text-xs"
          @focus="($event.target as HTMLTextAreaElement).select()" />
      </AvisoCaixa>

      <div v-if="!vazio" class="mt-6">
        <!-- Confirmação em bloco próprio: numa única linha os rótulos
             quebravam e os três elementos ficavam espremidos no celular. -->
        <div
          v-if="limpezaPendente"
          class="rounded-2xl border border-red-200 bg-red-50/70 p-4">
          <div class="flex gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
                     bg-red-100 text-red-600">
              <IconeSvg nome="lixeira" :tamanho="19" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-red-900">
                Apagar todo o cardápio?
              </p>
              <p class="mt-0.5 text-sm text-red-700/80">
                {{ total }} {{ total === 1 ? 'prato será removido' : 'pratos serão removidos' }}.
                Não dá para desfazer.
              </p>
            </div>
          </div>

          <div class="mt-4 flex gap-2.5">
            <BotaoBase
              variante="secundario" tamanho="grande" class="flex-1"
              @click="limpezaPendente = false">
              Cancelar
            </BotaoBase>
            <BotaoBase
              variante="perigo" tamanho="grande"
              class="flex-1 !bg-red-600 !text-white shadow-sm hover:!bg-red-700"
              @click="confirmarLimpeza">
              Apagar tudo
            </BotaoBase>
          </div>
        </div>

        <div v-else class="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <BotaoBase variante="secundario" @click="mostrarQr">
            <IconeSvg nome="qrcode" :tamanho="16" />
            Mostrar QR Code
          </BotaoBase>
          <BotaoBase variante="fantasma" @click="limpezaPendente = true">
            <IconeSvg nome="lixeira" :tamanho="16" />
            Apagar cardápio
          </BotaoBase>
        </div>
      </div>

      <footer class="mt-8 space-y-2 text-center text-xs text-zinc-400 sm:text-left">
        <p>
          {{ grade.porPagina }} etiquetas por folha A4, com linhas pontilhadas
          para recorte.
        </p>
        <p class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 sm:justify-start">
          <span>
            &copy; {{ ano }}
            <a
              href="https://sellvex.com.br" target="_blank" rel="noopener noreferrer"
              class="rounded font-medium text-zinc-500 underline underline-offset-2
                     transition hover:text-zinc-900 focus-visible:outline-none
                     focus-visible:ring-2 focus-visible:ring-zinc-900">
              sellvex.com.br
            </a>
          </span>

          <a
            href="https://github.com/dansp89/cardapio-dia"
            target="_blank" rel="noopener noreferrer"
            title="Ver o código no GitHub"
            class="inline-flex items-center gap-1.5 rounded text-zinc-500 transition
                   hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-zinc-900">
            <IconeSvg nome="github" :tamanho="15" />
            Código no GitHub
          </a>
        </p>
      </footer>

      <BarraAcoes
        class="sm:hidden"
        :vazio="vazio" :compartilhamento-nativo="nativo" :gerando="gerando"
        @gerar-pdf="imprimir" @ver-pdf="ver" @enviar="enviar" />

      <ModalTamanho
        :aberto="configAberta" :tamanho="tamanho" :total-atual="total"
        @fechar="configAberta = false" @aplicar="aplicarTamanho" @demo="usarDemo" />

      <ModalPreview
        :url="previaUrl" :paginas="previaPaginas"
        @fechar="fecharPrevia" @imprimir="imprimirDaPrevia" />

      <ModalQrCode
        :link="qrLink" :total-pratos="total"
        @fechar="qrLink = null" />
    </div>
  </div>
</template>
