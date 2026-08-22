<script setup lang="ts">
import { computed } from 'vue';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo';
type Tamanho = 'medio' | 'grande';

const props = withDefaults(defineProps<{
  variante?: Variante;
  tamanho?: Tamanho;
}>(), {
  variante: 'primario',
  tamanho: 'medio',
});

const variantes: Record<Variante, string> = {
  primario:   'bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-700 shadow-sm',
  secundario: 'border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 active:bg-zinc-100 shadow-sm',
  fantasma:   'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900',
  perigo:     'text-zinc-400 hover:bg-red-50 hover:text-red-600',
};

// Alvos de toque de 44px ou mais: abaixo disso o erro de toque cresce muito.
const tamanhos: Record<Tamanho, string> = {
  medio:  'min-h-11 px-4 text-sm gap-2',
  grande: 'min-h-14 px-5 text-base gap-2.5',
};

const classes = computed(() => [
  'inline-flex items-center justify-center rounded-xl font-semibold',
  'transition select-none',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-inherit',
  variantes[props.variante],
  tamanhos[props.tamanho],
]);
</script>

<template>
  <button :class="classes" type="button">
    <!-- O fallback evita um slot nulo quando todo o conteúdo é condicional. -->
    <slot><span class="sr-only">Ação</span></slot>
  </button>
</template>
