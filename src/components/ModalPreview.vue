<script setup lang="ts">
import { ref, watch } from 'vue';
import BotaoBase from './BotaoBase.vue';
import IconeSvg from './IconeSvg.vue';

const props = defineProps<{
  /** URL de blob do PDF; null fecha o modal. */
  url: string | null;
  paginas: number;
}>();

const emit = defineEmits<{
  fechar: [];
  imprimir: [];
}>();

// Chrome no Android não renderiza PDF embutido: mostra um cartão com o nome
// do arquivo e um botão "Abrir". O iframe até dispara `load`, então esperar
// pelo evento não detecta nada — `pdfViewerEnabled` responde de antemão.
const exibeEmbutido = ref(true);
const carregando = ref(true);

watch(() => props.url, u => {
  if (!u) return;
  carregando.value = true;
  exibeEmbutido.value = navigator.pdfViewerEnabled !== false;
});

// Um <a target="_blank"> clicado pelo próprio usuário passa pelo bloqueador
// de pop-up, ao contrário de window.open() chamado por script.
function abrirEmAba(): void {
  if (!props.url) return;
  const elo = document.createElement('a');
  elo.href = props.url;
  elo.target = '_blank';
  elo.rel = 'noopener';
  document.body.appendChild(elo);
  elo.click();
  elo.remove();
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150" leave-active-class="transition duration-150"
      enter-from-class="opacity-0" leave-to-class="opacity-0">
      <div
        v-if="url"
        class="fixed inset-0 z-50 flex flex-col bg-zinc-900"
        role="dialog" aria-modal="true" aria-label="Pré-visualização das etiquetas">

        <div class="flex items-center justify-between gap-3 bg-zinc-800 px-4 py-3 text-white">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold">Pré-visualização</p>
            <p class="truncate text-xs text-zinc-400">
              {{ paginas }} {{ paginas === 1 ? 'folha' : 'folhas' }} · nada foi salvo no aparelho
            </p>
          </div>
          <button
            type="button" aria-label="Fechar pré-visualização"
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl
                   text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
            @click="emit('fechar')">
            <IconeSvg nome="fechar" :tamanho="22" />
          </button>
        </div>

        <div class="relative flex-1 overflow-hidden">
          <!-- Sem visualizador embutido, o iframe renderizaria um cartão
               genérico do sistema; melhor oferecer a ação direta. -->
          <div
            v-if="!exibeEmbutido"
            class="flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-700 text-zinc-300">
              <IconeSvg nome="imprimir" :tamanho="30" />
            </div>
            <div>
              <p class="font-semibold text-zinc-100">Etiquetas prontas</p>
              <p class="mx-auto mt-1 max-w-xs text-sm text-zinc-400">
                Este navegador abre o PDF numa aba separada.
              </p>
            </div>
            <BotaoBase variante="primario" tamanho="grande" @click="abrirEmAba">
              <IconeSvg nome="olho" :tamanho="20" />
              Abrir o PDF
            </BotaoBase>
          </div>

          <template v-else>
            <div
              v-if="carregando"
              class="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
              Abrindo o PDF…
            </div>
            <iframe
              :src="url" title="Etiquetas em PDF" type="application/pdf"
              class="relative h-full w-full border-0 bg-zinc-700"
              @load="carregando = false"></iframe>
          </template>
        </div>

        <div class="flex items-stretch gap-2 bg-zinc-800 px-4 py-3 pb-segura">
          <!-- Sem visualizador embutido o corpo do modal já traz "Abrir o
               PDF"; repetir a ação aqui só ocuparia espaço. -->
          <BotaoBase
            v-if="exibeEmbutido"
            variante="secundario" tamanho="grande"
            class="w-14 shrink-0 !px-0 sm:w-auto sm:!px-4"
            aria-label="Abrir o PDF numa aba do navegador"
            title="Abrir em nova aba"
            @click="abrirEmAba">
            <IconeSvg nome="olho" :tamanho="20" />
            <span class="hidden sm:inline">Nova aba</span>
          </BotaoBase>
          <BotaoBase
            variante="primario" tamanho="grande" class="min-w-0 flex-1"
            @click="emit('imprimir')">
            <IconeSvg nome="imprimir" :tamanho="20" />
            <span class="truncate">Baixar para imprimir</span>
          </BotaoBase>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
