<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import BotaoBase from './BotaoBase.vue';
import IconeSvg from './IconeSvg.vue';

const props = defineProps<{
  /** Link a codificar; null mantém o modal fechado. */
  link: string | null;
  totalPratos: number;
}>();

const emit = defineEmits<{ fechar: [] }>();

const canvas = ref<HTMLCanvasElement | null>(null);
const erro = ref('');
const gerando = ref(false);

watch(() => props.link, async link => {
  erro.value = '';
  if (!link) return;

  gerando.value = true;
  await nextTick();
  try {
    // Carregado sob demanda: a maioria das impressões nunca abre o QR.
    const { default: QRCode } = await import('qrcode');
    if (!canvas.value) return;
    await QRCode.toCanvas(canvas.value, link, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'L',   // menor correção = menos módulos = QR mais legível
      color: { dark: '#18181b', light: '#ffffff' },
    });
  } catch (e) {
    console.error('Falha ao gerar o QR Code:', e);
    // O limite prático do formato é ~2.900 caracteres nesta correção.
    erro.value = 'O cardápio é longo demais para caber num QR Code. '
      + 'Use o botão de copiar o link.';
  } finally {
    gerando.value = false;
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150" leave-active-class="transition duration-150"
      enter-from-class="opacity-0" leave-to-class="opacity-0">
      <div
        v-if="link"
        class="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 p-0 sm:items-center sm:p-4"
        role="dialog" aria-modal="true" aria-labelledby="titulo-qr"
        @click.self="emit('fechar')">
        <div
          class="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-white
                 p-5 shadow-xl pb-segura sm:rounded-2xl sm:p-6">

          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 id="titulo-qr" class="text-lg font-bold">Aponte a câmera</h2>
              <p class="mt-0.5 text-sm text-zinc-500">
                {{ totalPratos }} {{ totalPratos === 1 ? 'prato' : 'pratos' }} ·
                abre o cardápio no outro aparelho
              </p>
            </div>
            <button
              type="button" aria-label="Fechar"
              class="-mr-1.5 -mt-1.5 flex h-10 w-10 shrink-0 items-center justify-center
                     rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              @click="emit('fechar')">
              <IconeSvg nome="fechar" :tamanho="20" />
            </button>
          </div>

          <div
            v-if="erro"
            class="mb-4 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3
                   text-sm text-amber-900">
            <IconeSvg nome="aviso" :tamanho="18" class="mt-0.5" />
            <span>{{ erro }}</span>
          </div>

          <div v-else class="mb-4 flex justify-center rounded-2xl border border-zinc-200 bg-white p-3">
            <canvas
              ref="canvas"
              class="h-auto w-full max-w-[280px]"
              :class="gerando ? 'opacity-0' : 'opacity-100 transition-opacity'"></canvas>
          </div>

          <p v-if="!erro" class="mb-4 text-center text-xs text-zinc-400">
            Funciona sem internet: o cardápio está dentro do próprio código.
          </p>

          <BotaoBase variante="secundario" tamanho="grande" class="w-full" @click="emit('fechar')">
            Fechar
          </BotaoBase>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
