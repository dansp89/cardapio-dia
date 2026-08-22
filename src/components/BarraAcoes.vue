<script setup lang="ts">
import BotaoBase from './BotaoBase.vue';
import IconeSvg from './IconeSvg.vue';

withDefaults(defineProps<{
  vazio?: boolean;
  compartilhamentoNativo?: boolean;
  gerando?: boolean;
}>(), {
  vazio: true,
  compartilhamentoNativo: false,
  gerando: false,
});

const emit = defineEmits<{
  gerarPdf: [];
  verPdf: [];
  enviar: [];
}>();
</script>

<template>
  <!--
    Fixa no rodapé quando usada no celular (o App a esconde no desktop, onde
    uma cópia estática aparece logo abaixo do cabeçalho).

    No celular, três botões com texto somavam 427 px e estouravam a tela até
    em aparelhos largos. "Imprimir" é a ação principal e fica com o texto; as
    outras duas viram botões de ícone, com rótulo só para leitores de tela.
    A partir de sm: há espaço para todos os rótulos.
  -->
  <div
    class="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/95 backdrop-blur
           pb-segura sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:backdrop-blur-none">
    <div class="mx-auto flex max-w-2xl items-stretch gap-2 px-4 py-3 sm:px-0 sm:py-0">
      <BotaoBase
        variante="secundario" tamanho="grande"
        class="w-14 shrink-0 !px-0 sm:w-auto sm:!px-4"
        :disabled="vazio || gerando"
        aria-label="Ver as etiquetas antes de imprimir"
        title="Ver antes de imprimir"
        @click="emit('verPdf')">
        <IconeSvg nome="olho" :tamanho="21" />
        <span class="hidden sm:inline">Ver</span>
      </BotaoBase>

      <BotaoBase
        variante="primario" tamanho="grande" class="min-w-0 flex-1"
        :disabled="vazio || gerando"
        @click="emit('gerarPdf')">
        <IconeSvg nome="imprimir" :tamanho="21" />
        <span class="truncate">{{ gerando ? 'Gerando…' : 'Imprimir' }}</span>
      </BotaoBase>

      <BotaoBase
        variante="secundario" tamanho="grande"
        class="w-14 shrink-0 !px-0 sm:w-auto sm:!px-4"
        :disabled="vazio"
        :aria-label="compartilhamentoNativo ? 'Enviar o cardápio' : 'Copiar o link do cardápio'"
        :title="compartilhamentoNativo ? 'Enviar' : 'Copiar link'"
        @click="emit('enviar')">
        <IconeSvg :nome="compartilhamentoNativo ? 'enviar' : 'copiar'" :tamanho="20" />
        <span class="hidden sm:inline">
          {{ compartilhamentoNativo ? 'Enviar' : 'Copiar link' }}
        </span>
      </BotaoBase>
    </div>
  </div>
</template>
