<script setup lang="ts">
import IconeSvg from './IconeSvg.vue';
</script>

<template>
  <div class="rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-6 py-10 text-center">
    <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
      <IconeSvg nome="prato" :tamanho="24" />
    </div>
    <p class="font-semibold text-zinc-700">Nenhum prato no cardápio</p>
    <p class="mx-auto mt-1 max-w-xs text-sm text-zinc-500">
      Escreva o nome do primeiro prato acima. Cada prato vira uma etiqueta de 7 × 3 cm.
    </p>
  </div>
</template>
