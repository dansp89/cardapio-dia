<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import BotaoBase from './BotaoBase.vue';
import IconeSvg from './IconeSvg.vue';
import { PREDEFINIDOS } from '../composables/useTamanho';
import { calcularGrade, tamanhoValido, LIMITES } from '../lib/pdf';
import type { Tamanho } from '../types';

const props = defineProps<{
  aberto: boolean;
  tamanho: Tamanho;
  /** Quantos pratos já existem — o demo substitui a lista. */
  totalAtual: number;
}>();

const emit = defineEmits<{
  fechar: [];
  aplicar: [tamanho: Tamanho];
  demo: [tamanho: Tamanho, quantidade: number];
}>();

// Em centímetros na interface: milímetro é unidade de quem desenha, não de
// quem está decidindo o tamanho de uma etiqueta.
const PASSO = 0.5;

const larguraCm = ref<number | null>(7);
const alturaCm = ref<number | null>(3);
const painel = ref<HTMLElement | null>(null);

const demoPendente = ref(false);

watch(() => props.aberto, async abriu => {
  if (!abriu) return;
  larguraCm.value = props.tamanho.largura / 10;
  alturaCm.value = props.tamanho.altura / 10;
  demoPendente.value = false;
  await nextTick();
  painel.value?.focus();
});

const escolhido = computed<Tamanho>(() => ({
  largura: Math.round((larguraCm.value ?? NaN) * 10),
  altura: Math.round((alturaCm.value ?? NaN) * 10),
}));

const valido = computed(() =>
  Number.isFinite(escolhido.value.largura)
  && Number.isFinite(escolhido.value.altura)
  && tamanhoValido(escolhido.value));

const previa = computed(() => valido.value ? calcularGrade(escolhido.value) : null);

const limitesCm = {
  min: LIMITES.min / 10,
  maxL: 19,
  maxA: 27.7,
};

function selecionar(t: Tamanho): void {
  larguraCm.value = t.largura / 10;
  alturaCm.value = t.altura / 10;
}

/** Ajusta um campo pelo passo, mantendo-o dentro dos limites. */
function ajustar(campo: 'largura' | 'altura', direcao: 1 | -1): void {
  const alvo = campo === 'largura' ? larguraCm : alturaCm;
  const teto = campo === 'largura' ? limitesCm.maxL : limitesCm.maxA;
  const atual = alvo.value ?? limitesCm.min;
  // Um valor digitado fora da grade (7,3) vai para o múltiplo de 0,5 seguinte
  // na direção do clique: 7,3 + vira 7,5, e 7,3 − vira 7,0.
  const passos = direcao > 0
    ? Math.floor(atual / PASSO) + 1
    : Math.ceil(atual / PASSO) - 1;
  const bruto = passos * PASSO;
  alvo.value = Math.min(teto, Math.max(limitesCm.min, Math.round(bruto * 10) / 10));
}

function ehAtual(t: Tamanho): boolean {
  return t.largura === escolhido.value.largura && t.altura === escolhido.value.altura;
}

function confirmar(): void {
  if (!valido.value) return;
  emit('aplicar', escolhido.value);
  emit('fechar');
}

// O demo substitui a lista, então confirma antes quando há algo a perder.
function pedirDemo(): void {
  if (!valido.value) return;
  if (props.totalAtual > 0) {
    demoPendente.value = true;
    return;
  }
  gerarDemo();
}

function gerarDemo(): void {
  if (!previa.value) return;
  emit('demo', escolhido.value, previa.value.porPagina);
  emit('fechar');
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150" leave-active-class="transition duration-150"
      enter-from-class="opacity-0" leave-to-class="opacity-0">
      <div
        v-if="aberto"
        class="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 p-0 sm:items-center sm:p-4"
        role="dialog" aria-modal="true" aria-labelledby="titulo-tamanho"
        @click.self="emit('fechar')">
        <div
          ref="painel" tabindex="-1"
          class="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white
                 p-5 shadow-xl outline-none pb-segura sm:rounded-2xl sm:p-6"
          @keydown.esc="emit('fechar')">

          <div class="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id="titulo-tamanho" class="text-lg font-bold">Tamanho da etiqueta</h2>
              <p class="mt-0.5 text-sm text-zinc-500">Vale para as próximas impressões.</p>
            </div>
            <button
              type="button" aria-label="Fechar"
              class="-mr-1.5 -mt-1.5 flex h-10 w-10 shrink-0 items-center justify-center
                     rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              @click="emit('fechar')">
              <IconeSvg nome="fechar" :tamanho="20" />
            </button>
          </div>

          <div class="mb-5 grid grid-cols-3 gap-2">
            <button
              v-for="opcao in PREDEFINIDOS" :key="opcao.rotulo"
              type="button"
              :class="['rounded-xl border px-2 py-3 text-center transition',
                       ehAtual(opcao.tamanho)
                         ? 'border-zinc-900 bg-zinc-900 text-white'
                         : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50']"
              @click="selecionar(opcao.tamanho)">
              <span class="block text-sm font-semibold">{{ opcao.rotulo }}</span>
              <span
                :class="['mt-0.5 block text-xs',
                         ehAtual(opcao.tamanho) ? 'text-zinc-300' : 'text-zinc-400']">
                {{ calcularGrade(opcao.tamanho).porPagina }}/folha
              </span>
            </button>
          </div>

          <p class="mb-2 text-sm font-semibold text-zinc-700">Outro tamanho</p>
          <div class="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label for="larg" class="mb-1 block text-xs font-medium text-zinc-500">
                Largura (cm)
              </label>
              <!-- Botões próprios: as setinhas nativas do campo numérico são
                   pequenas demais para o dedo. -->
              <div class="flex items-stretch rounded-xl border border-zinc-300 bg-white
                          focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-900/10">
                <button
                  type="button" aria-label="Diminuir largura"
                  class="flex w-11 shrink-0 items-center justify-center rounded-l-xl text-lg
                         text-zinc-500 transition hover:bg-zinc-50 active:bg-zinc-100"
                  @click="ajustar('largura', -1)">−</button>
                <input
                  id="larg" v-model.number="larguraCm" type="number"
                  :step="PASSO" :min="limitesCm.min" :max="limitesCm.maxL" inputmode="decimal"
                  class="campo-num w-full min-w-0 border-x border-zinc-200 bg-transparent px-1 py-2.5
                         text-center text-base outline-none">
                <button
                  type="button" aria-label="Aumentar largura"
                  class="flex w-11 shrink-0 items-center justify-center rounded-r-xl text-lg
                         text-zinc-500 transition hover:bg-zinc-50 active:bg-zinc-100"
                  @click="ajustar('largura', 1)">+</button>
              </div>
            </div>

            <div>
              <label for="alt" class="mb-1 block text-xs font-medium text-zinc-500">
                Altura (cm)
              </label>
              <div class="flex items-stretch rounded-xl border border-zinc-300 bg-white
                          focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-900/10">
                <button
                  type="button" aria-label="Diminuir altura"
                  class="flex w-11 shrink-0 items-center justify-center rounded-l-xl text-lg
                         text-zinc-500 transition hover:bg-zinc-50 active:bg-zinc-100"
                  @click="ajustar('altura', -1)">−</button>
                <input
                  id="alt" v-model.number="alturaCm" type="number"
                  :step="PASSO" :min="limitesCm.min" :max="limitesCm.maxA" inputmode="decimal"
                  class="campo-num w-full min-w-0 border-x border-zinc-200 bg-transparent px-1 py-2.5
                         text-center text-base outline-none">
                <button
                  type="button" aria-label="Aumentar altura"
                  class="flex w-11 shrink-0 items-center justify-center rounded-r-xl text-lg
                         text-zinc-500 transition hover:bg-zinc-50 active:bg-zinc-100"
                  @click="ajustar('altura', 1)">+</button>
              </div>
            </div>
          </div>

          <div
            v-if="previa"
            class="mb-5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            <strong class="font-semibold text-zinc-900">{{ previa.porPagina }}</strong>
            {{ previa.porPagina === 1 ? 'etiqueta' : 'etiquetas' }} por folha A4
            <span class="text-zinc-400">
              ({{ previa.colunas }} × {{ previa.linhas }})
            </span>
          </div>
          <div
            v-else
            class="mb-5 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3
                   text-sm text-amber-900">
            <IconeSvg nome="aviso" :tamanho="17" class="mt-0.5" />
            <span>
              Use medidas entre {{ limitesCm.min }} e {{ limitesCm.maxL }} cm de largura
              e {{ limitesCm.min }} a {{ limitesCm.maxA }} cm de altura.
            </span>
          </div>

          <div class="mb-5 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-4">
            <p class="text-sm font-semibold text-zinc-700">Testar a impressão</p>
            <p class="mt-0.5 mb-3 text-sm text-zinc-500">
              Preenche a folha inteira com pratos de exemplo, para conferir o
              tamanho e o recorte antes de valer.
            </p>

            <div v-if="demoPendente" class="space-y-2.5">
              <p class="text-sm text-amber-800">
                Isto vai apagar
                <strong class="font-semibold">
                  {{ totalAtual }} {{ totalAtual === 1 ? 'prato' : 'pratos' }}
                </strong>
                da lista. Continuar?
              </p>
              <div class="flex gap-2">
                <BotaoBase
                  variante="perigo" class="!bg-amber-600 !text-white hover:!bg-amber-700"
                  @click="gerarDemo">
                  Sim, usar exemplos
                </BotaoBase>
                <BotaoBase variante="fantasma" @click="demoPendente = false">
                  Não
                </BotaoBase>
              </div>
            </div>

            <BotaoBase
              v-else variante="secundario" class="w-full"
              :disabled="!valido" @click="pedirDemo">
              <IconeSvg nome="prato" :tamanho="17" />
              Preencher folha com exemplos<template v-if="previa"> ({{ previa.porPagina }})</template>
            </BotaoBase>
          </div>

          <div class="flex gap-2.5">
            <BotaoBase
              variante="primario" tamanho="grande" class="flex-1"
              :disabled="!valido" @click="confirmar">
              Aplicar
            </BotaoBase>
            <BotaoBase variante="secundario" tamanho="grande" @click="emit('fechar')">
              Cancelar
            </BotaoBase>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* As setinhas nativas duplicariam os botões −/+ e são pequenas demais. */
.campo-num::-webkit-outer-spin-button,
.campo-num::-webkit-inner-spin-button {
  appearance: none;
  margin: 0;
}
.campo-num {
  appearance: textfield;
  -moz-appearance: textfield;
}
</style>
