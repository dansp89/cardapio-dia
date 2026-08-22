import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

// Porta fora das faixas comuns e do range efêmero do Linux (32768-60999),
// para não esbarrar em outro serviço da máquina nem em portas que o sistema
// aloca sozinho.
const PORTA_DEV_PADRAO = 27382;
const PORTA_PREVIEW_PADRAO = 27384;

export default defineConfig(({ mode }) => {
  // '' como prefixo carrega todas as variáveis do .env, não só as VITE_*:
  // PORT e HOST são lidas aqui para o dev seguir o mesmo .env do servidor.
  const env = loadEnv(mode, process.cwd(), '');

  const porta = Number(env.VITE_DEV_PORT) || PORTA_DEV_PADRAO;
  // Porta própria, e não derivada da de dev: somar 1 tornava impossível
  // escolher a porta do preview pelo .env.
  const portaPreview = Number(env.VITE_PREVIEW_PORT) || PORTA_PREVIEW_PADRAO;
  const host = env.VITE_DEV_HOST || '0.0.0.0';

  // Lista separada por vírgula; vazia mantém o padrão do Vite.
  const permitidos = (env.VITE_ALLOWED_HOSTS || '')
    .split(',')
    .map(h => h.trim())
    .filter(Boolean);

  return {
    plugins: [vue(), tailwindcss()],
    base: './',                 // permite hospedar também em subdiretório

    server: {
      port: porta,
      host,
      strictPort: true,         // avisa em vez de mudar de porta silenciosamente
      ...(permitidos.length ? { allowedHosts: permitidos } : {}),
    },

    preview: {
      port: portaPreview,
      host,
      strictPort: true,
      ...(permitidos.length ? { allowedHosts: permitidos } : {}),
    },

    build: {
      target: 'es2020',
      cssCodeSplit: false,      // um único CSS: menos requisições no celular
      rollupOptions: {
        // Dependências opcionais do jsPDF para rasterizar HTML — o app só
        // desenha vetores e texto, então elas seriam ~230 kB de peso morto.
        external: ['html2canvas', 'dompurify', 'canvg'],
        output: {
          paths: {
            html2canvas: 'data:text/javascript,export default undefined',
            dompurify: 'data:text/javascript,export default undefined',
            canvg: 'data:text/javascript,export default undefined',
          },
        },
      },
    },
  };
});
