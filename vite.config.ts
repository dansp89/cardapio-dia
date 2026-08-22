import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  base: './',                 // permite abrir o build direto do sistema de arquivos
  build: {
    target: 'es2020',
    cssCodeSplit: false,      // um único CSS: menos requisições no celular
    rollupOptions: {
      // Dependências opcionais do jsPDF para rasterizar HTML — o app só desenha
      // vetores e texto, então elas seriam ~230 kB de peso morto.
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
});
