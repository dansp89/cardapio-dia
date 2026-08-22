import { ref, computed, watch, type Ref, type ComputedRef } from 'vue';
import { calcularGrade, tamanhoValido, TAMANHO_PADRAO, LIMITES } from '../lib/pdf';
import type { Tamanho, Grade } from '../types';

const CHAVE = 'etiquetas.tamanho';
const CHAVE_ANTIGA = 'dangelo.tamanho';   // ver migrarChaves() em useCardapio

/** Medidas oferecidas com um toque. A primeira é o padrão. */
export const PREDEFINIDOS: readonly { rotulo: string; tamanho: Tamanho }[] = [
  { rotulo: '7 × 3 cm', tamanho: { largura: 70, altura: 30 } },
  { rotulo: '5 × 3 cm', tamanho: { largura: 50, altura: 30 } },
  { rotulo: '9 × 5 cm', tamanho: { largura: 90, altura: 50 } },
] as const;

export interface UsoTamanho {
  tamanho: Ref<Tamanho>;
  grade: ComputedRef<Grade>;
  ehPredefinido: ComputedRef<boolean>;
  definir: (novo: Tamanho) => boolean;
}

export function useTamanho(): UsoTamanho {
  const tamanho = ref<Tamanho>({ ...TAMANHO_PADRAO });

  try {
    // useCardapio.iniciar() migra as chaves, mas este composable lê antes dele.
    const bruto = localStorage.getItem(CHAVE) ?? localStorage.getItem(CHAVE_ANTIGA);
    if (bruto) {
      const salvo: unknown = JSON.parse(bruto);
      const t = salvo as Partial<Tamanho>;
      const candidato = { largura: Number(t?.largura), altura: Number(t?.altura) };
      if (tamanhoValido(candidato)) tamanho.value = candidato;
    }
  } catch (erro) {
    console.error('Falha ao ler o tamanho salvo:', erro);
  }

  watch(tamanho, novo => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(novo));
    } catch {
      // Sem espaço: o tamanho vale só nesta sessão.
    }
  }, { deep: true });

  /** Aplica o tamanho se for válido; devolve se aceitou. */
  function definir(novo: Tamanho): boolean {
    const limpo = {
      largura: Math.round(novo.largura * 10) / 10,
      altura: Math.round(novo.altura * 10) / 10,
    };
    if (!tamanhoValido(limpo)) return false;
    tamanho.value = limpo;
    return true;
  }

  const grade = computed(() => calcularGrade(tamanho.value));

  const ehPredefinido = computed(() => PREDEFINIDOS.some(
    p => p.tamanho.largura === tamanho.value.largura
      && p.tamanho.altura === tamanho.value.altura));

  return { tamanho, grade, ehPredefinido, definir };
}

export { LIMITES };
