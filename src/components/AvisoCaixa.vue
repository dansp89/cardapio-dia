<script setup lang="ts">
import IconeSvg from './IconeSvg.vue';
import type { TomAviso, NomeIcone } from '../types';

withDefaults(defineProps<{ tom?: TomAviso }>(), { tom: 'info' });

const tons: Record<TomAviso, { caixa: string; icone: NomeIcone }> = {
  info:     { caixa: 'border-amber-200 bg-amber-50 text-amber-900',       icone: 'aviso' },
  ok:       { caixa: 'border-emerald-200 bg-emerald-50 text-emerald-900', icone: 'ok' },
  atencao:  { caixa: 'border-amber-200 bg-amber-50 text-amber-900',       icone: 'aviso' },
};
</script>

<template>
  <div :class="['flex gap-2.5 rounded-2xl border px-4 py-3 text-sm', tons[tom].caixa]">
    <IconeSvg :nome="tons[tom].icone" :tamanho="18" class="mt-0.5" />
    <div class="min-w-0 flex-1"><slot /></div>
  </div>
</template>
