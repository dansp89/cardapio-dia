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

// Nem todo navegador de celular renderiza PDF em <iframe>: alguns mostram
// uma área em branco. Sem evento confiável para detectar isso, oferecemos
// desde já o caminho alternativo de abrir em nova aba.
const carregando = ref(true);
const demorou = ref(false);
let relogio: ReturnType<typeof setTimeout> | undefined;

watch(() => props.url, u => {
  clearTimeout(relogio);
  demorou.value = false;
  if (!u) return;
  carregando.value = true;
  // Se o iframe não carregar, o aparelho provavelmente não exibe PDF embutido.
  relogio = setTimeout(() => { if (carregando.value) demorou.value = true; }, 3500);
});

function abrirEmAba(): void {
  if (props.url) window.open(props.url, '_blank');
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
          <div
            v-if="carregando"
            class="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <p class="text-sm text-zinc-400">
              {{ demorou ? 'Este aparelho não abre PDF dentro do app.' : 'Abrindo o PDF…' }}
            </p>
            <BotaoBase v-if="demorou" variante="secundario" @click="abrirEmAba">
              <IconeSvg nome="olho" :tamanho="18" />
              Abrir em nova aba
            </BotaoBase>
          </div>
          <!-- O type ajuda navegadores que decidem o visualizador pelo MIME. -->
          <iframe
            :src="url" title="Etiquetas em PDF" type="application/pdf"
            class="relative h-full w-full border-0 bg-zinc-700"
            @load="carregando = false"></iframe>
        </div>

        <div class="flex items-stretch gap-2 bg-zinc-800 px-4 py-3 pb-segura">
          <BotaoBase
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
