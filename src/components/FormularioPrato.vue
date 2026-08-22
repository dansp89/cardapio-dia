<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import BotaoBase from './BotaoBase.vue';
import IconeSvg from './IconeSvg.vue';

const props = defineProps<{
  /** Informa se o nome digitado já existe na lista. */
  ehDuplicado?: (nome: string) => boolean;
}>();

const emit = defineEmits<{
  adicionar: [nome: string, descricao: string];
}>();

const nome = ref('');
const descricao = ref('');
const erro = ref(false);
const campoNome = ref<HTMLInputElement | null>(null);

// Avisa em vez de bloquear: pode haver motivo real para dois nomes iguais.
const repetido = computed(() =>
  !!nome.value.trim() && !!props.ehDuplicado?.(nome.value));

function submeter(): void {
  if (!nome.value.trim()) {
    erro.value = true;
    campoNome.value?.focus();
    return;
  }
  emit('adicionar', nome.value, descricao.value);
  nome.value = '';
  descricao.value = '';
  erro.value = false;
  nextTick(() => campoNome.value?.focus());
}

const campoClasses =
  'w-full rounded-xl border bg-white px-4 py-3 text-base outline-none transition ' +
  'placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-900/10';
</script>

<template>
  <form
    class="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
    @submit.prevent="submeter">
    <div class="space-y-3">
      <div>
        <label for="nome" class="mb-1.5 block text-sm font-semibold text-zinc-700">
          Nome do prato
        </label>
        <input
          id="nome" ref="campoNome" v-model="nome" type="text" maxlength="60"
          enterkeyhint="done" autocomplete="off"
          placeholder="Ex.: Feijoada Completa"
          :class="[campoClasses,
                   erro ? 'border-red-400 focus:border-red-500'
                   : repetido ? 'border-amber-400 focus:border-amber-500'
                   : 'border-zinc-300 focus:border-zinc-900']"
          @input="erro = false">
        <p v-if="erro" class="mt-1.5 flex items-center gap-1.5 text-sm text-red-600">
          <IconeSvg nome="aviso" :tamanho="15" />
          Escreva o nome do prato.
        </p>
        <p v-else-if="repetido" class="mt-1.5 flex items-center gap-1.5 text-sm text-amber-700">
          <IconeSvg nome="aviso" :tamanho="15" />
          Este prato já está no cardápio — vai sair uma etiqueta repetida.
        </p>
      </div>

      <div>
        <label for="descricao" class="mb-1.5 block text-sm font-semibold text-zinc-700">
          Descrição
          <span class="font-normal text-zinc-400">— opcional</span>
        </label>
        <input
          id="descricao" v-model="descricao" type="text" maxlength="80"
          enterkeyhint="done" autocomplete="off"
          placeholder="Ex.: acompanha couve e farofa"
          :class="[campoClasses, 'border-zinc-300 focus:border-zinc-900']">
      </div>

      <BotaoBase type="submit" variante="primario" tamanho="grande" class="w-full">
        <IconeSvg nome="mais" :tamanho="20" />
        Adicionar ao cardápio
      </BotaoBase>
    </div>
  </form>
</template>
