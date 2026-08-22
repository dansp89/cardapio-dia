<script setup lang="ts">
import { ref, nextTick } from 'vue';
import IconeSvg from './IconeSvg.vue';
import type { Prato } from '../types';

const props = defineProps<{
  prato: Prato;
  posicao: number;
}>();

const emit = defineEmits<{
  editar: [id: string, campo: 'nome' | 'descricao', valor: string];
  remover: [id: string];
}>();

// Campos de texto reais em vez de contenteditable: teclado e seleção se
// comportam de forma previsível no celular.
function aoEditar(campo: 'nome' | 'descricao', evento: Event): void {
  const alvo = evento.target as HTMLInputElement;
  emit('editar', props.prato.id, campo, alvo.value);
  // O pai pode recusar o valor (nome vazio) ou aparar espaços; sem isto o
  // campo continuaria mostrando algo diferente do que foi de fato salvo.
  nextTick(() => {
    const atual = props.prato[campo];
    if (alvo.value !== atual) alvo.value = atual;
  });
}

// Confirmação no próprio card: um confirm() nativo é fácil de descartar
// sem ler, e no celular abre uma caixa fora do contexto da lista.
const confirmando = ref(false);

function pedirConfirmacao(): void {
  confirmando.value = true;
}

function confirmar(): void {
  confirmando.value = false;
  emit('remover', props.prato.id);
}
</script>

<template>
  <!-- Ao confirmar, o card inteiro vira a pergunta: espremer os botões ao
       lado do nome truncava o prato e deixava ambíguo o que seria apagado. -->
  <li
    v-if="confirmando"
    class="rounded-2xl border border-red-200 bg-red-50/70 p-3 sm:p-4">
    <div class="flex items-start gap-3">
      <span
        class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
               bg-red-100 text-xs font-bold text-red-600 tabular-nums">
        {{ posicao }}
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-sm text-red-700/80">Apagar este prato?</p>
        <p class="mt-0.5 font-semibold text-red-900">{{ prato.nome }}</p>
      </div>
    </div>

    <div class="mt-3 flex gap-2">
      <button
        type="button"
        class="min-h-11 flex-1 rounded-xl border border-zinc-300 bg-white px-4 text-sm
               font-semibold text-zinc-700 transition hover:bg-zinc-50
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        @click="confirmando = false">
        Cancelar
      </button>
      <button
        type="button"
        class="min-h-11 flex-1 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white
               shadow-sm transition hover:bg-red-700 focus-visible:outline-none
               focus-visible:ring-2 focus-visible:ring-red-500"
        @click="confirmar">
        Apagar
      </button>
    </div>
  </li>

  <li
    v-else
    class="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm
           transition hover:border-zinc-300 sm:p-4">
    <span
      class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
             bg-zinc-100 text-xs font-bold text-zinc-500 tabular-nums"
      :aria-label="`Etiqueta ${posicao}`">
      {{ posicao }}
    </span>

    <div class="min-w-0 flex-1">
      <input
        :value="prato.nome" type="text" maxlength="60" enterkeyhint="done"
        class="w-full truncate rounded-lg bg-transparent px-1.5 py-1 -mx-1.5 text-base font-semibold
               text-zinc-900 outline-none transition focus:bg-zinc-50 focus:ring-2 focus:ring-zinc-900/10"
        aria-label="Nome do prato"
        @change="aoEditar('nome', $event)"
        @keydown.enter="($event.target as HTMLInputElement).blur()">
      <input
        :value="prato.descricao" type="text" maxlength="80" enterkeyhint="done"
        placeholder="+ descrição"
        class="w-full truncate rounded-lg bg-transparent px-1.5 py-1 -mx-1.5 text-sm text-zinc-500
               outline-none transition placeholder:text-zinc-300 focus:bg-zinc-50
               focus:ring-2 focus:ring-zinc-900/10"
        aria-label="Descrição do prato"
        @change="aoEditar('descricao', $event)"
        @keydown.enter="($event.target as HTMLInputElement).blur()">
    </div>

    <button
      type="button"
      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-300
             transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none
             focus-visible:ring-2 focus-visible:ring-red-500"
      :aria-label="`Remover ${prato.nome}`"
      @click="pedirConfirmacao">
      <IconeSvg nome="lixeira" :tamanho="19" />
    </button>
  </li>
</template>
