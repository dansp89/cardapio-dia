![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1.3-000000?style=for-the-badge&logo=bun&logoColor=white)
![jsPDF](https://img.shields.io/badge/jsPDF-2.5-FF6B6B?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-offline-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![Licença MIT](https://img.shields.io/badge/Licença-MIT-green?style=for-the-badge)

# Etiquetas de Cardápio

Gera um PDF pronto para imprimir e recortar com os nomes dos pratos do dia.
Monte a lista no celular ou no computador, envie por link ou QR Code, e
imprima onde estiver a impressora.

Funciona inteiro no navegador: **não há servidor, banco de dados nem cadastro**.

## Como funciona

1. Digite os pratos do dia.
2. Toque em **Enviar** para compartilhar o link, ou mostre o **QR Code**.
3. Em outro aparelho, o link abre o cardápio já preenchido.
4. Um clique em **Imprimir** gera o PDF; é só imprimir e recortar.

Os passos 2 e 3 são opcionais: dá para montar e imprimir no mesmo aparelho.

O cardápio inteiro viaja dentro do próprio link, no fragmento da URL
(`#c=...`) — a parte que o navegador nunca envia ao servidor. Por isso
funciona sem backend e nada é registrado em lugar nenhum.

## Recursos

- **Etiqueta de tamanho livre** — 7×3, 5×3, 9×5 cm ou qualquer medida, com
  passo de 0,5 cm. O app calcula sozinho quantas cabem na folha A4.
- **Linhas pontilhadas de recorte** — a borda entre duas etiquetas é
  compartilhada, então uma passada de tesoura corta as duas.
- **Pré-visualização sem baixar** — confira o resultado dentro do app; nenhum
  arquivo é salvo no aparelho até você pedir.
- **Folha de exemplo** — preenche a página inteira com pratos fictícios para
  testar tamanho e recorte antes de valer.
- **Repetir o último cardápio** — repõe os pratos da última impressão.
- **Aviso de prato repetido** — compara ignorando acentos e maiúsculas.
- **Salva sozinho** — o cardápio fica no navegador; recarregar não perde nada.
- **QR Code** — mostre na tela e outro aparelho lê o cardápio inteiro pela
  câmera, sem rede nenhuma no meio.
- **Instalável (PWA)** — "adicionar à tela de início" e o app abre em tela
  cheia, com ícone próprio e splash.
- **Funciona sem internet** — depois da primeira visita tudo fica em cache,
  inclusive a geração de PDF. Um aviso aparece quando a conexão cai.

## Rodando o projeto

O projeto usa [Bun](https://bun.sh) — a instalação de dependências leva
poucos segundos, contra bem mais tempo com npm.

```bash
# instale o Bun, se ainda não tiver
curl -fsSL https://bun.sh/install | bash

# clone e entre na pasta
git clone https://github.com/dansp89/cardapio-dia.git
cd cardapio-dia

# instale as dependências
bun install

# opcional: ajuste portas e domínios
cp .env.example .env

# rode em modo de desenvolvimento
bun run dev
```

Abra <http://localhost:27382>. O dev server já escuta em `0.0.0.0`, então o
endereço de rede aparece no terminal — é por ele que se acessa do celular.

### Configuração (.env)

Tudo é opcional; sem `.env` valem os padrões. Variáveis do ambiente têm
precedência sobre o arquivo.

| Variável | Padrão | Para que serve |
|---|---|---|
| `PORT` | `27381` | Porta do servidor de produção |
| `HOST` | `0.0.0.0` | Interface do servidor de produção |
| `VITE_DEV_PORT` | `27382` | Porta do dev server |
| `VITE_PREVIEW_PORT` | `27384` | Porta do `bun run preview` |
| `VITE_DEV_HOST` | `0.0.0.0` | Interface do dev server |
| `VITE_ALLOWED_HOSTS` | vazio | Domínios extras aceitos pelo dev server |

As portas são altas de propósito: ficam fora das faixas usadas por serviços
comuns e fora do range efêmero do Linux (32768–60999), que o sistema aloca
sozinho para conexões de saída.

`VITE_ALLOWED_HOSTS` só é necessário ao acessar o dev server por um domínio
— `meuapp.local`, um túnel, um proxy. O Vite recusa `Host` desconhecido
como proteção contra DNS rebinding; `localhost` e IPs da rede local já são
aceitos por padrão. Vários domínios separados por vírgula:

```
VITE_ALLOWED_HOSTS=meuapp.local,dev.meudominio.com.br
```

Outros comandos:

```bash
bun run typecheck   # checagem de tipos
bun run build       # gera dist/ (roda typecheck antes)
bun run preview     # serve o build já compilado, na porta 27384
```

`dev` e `preview` já rodam com `--host`, então o endereço de rede aparece
no terminal — é por ele que se acessa do celular na mesma Wi-Fi.

## PWA e uso offline

Um service worker guarda a aplicação inteira no primeiro acesso — os 20
arquivos do build, incluindo o pedaço do jsPDF. Assim é possível montar o
cardápio e **gerar o PDF sem internet**, mesmo que o aparelho nunca tenha
impresso antes.

- **HTML**: rede primeiro, cache como reserva — uma versão nova chega assim
  que houver conexão.
- **Arquivos com hash** (`/assets/…`): cache primeiro; o nome muda a cada
  build, então nada fica desatualizado.

`scripts/gerar-sw.mjs` roda ao final do build e escreve no service worker a
lista real de arquivos, com uma versão derivada deles. Sem isso, os pedaços
carregados sob demanda só entrariam no cache depois de usados uma vez.

O service worker exige HTTPS (ou `localhost`). Em HTTP na rede local o app
funciona normalmente, mas sem cache offline.

### Transportar o cardápio pelo QR Code

O botão **Mostrar QR Code** desenha o link inteiro — cardápio incluído — na
tela. Outro aparelho aponta a câmera e abre a lista já preenchida, sem rede
em comum nem envio por aplicativo. O limite prático é de cerca de 2.900
caracteres; acima disso o app avisa e sugere copiar o link.

## Publicando

O build é estático — `dist/` pode ser servido de duas formas.

### Com PM2

Há um servidor mínimo (`server.mjs`, sem dependências) e a configuração do
PM2 pronta. Útil quando não se quer instalar nem configurar Nginx.

```bash
# na VPS, com o repositório clonado
bun install
bun run build

pm2 start ecosystem.config.cjs   # sobe o app
pm2 save                          # grava a lista de processos
pm2 startup                       # gera o comando para subir no boot
```

Comandos do dia a dia:

| Comando | O que faz |
|---|---|
| `bun run pm2:start` | Sobe o app |
| `bun run pm2:status` | Mostra o estado |
| `bun run pm2:logs` | Acompanha os logs |
| `bun run pm2:reload` | Recarrega sem derrubar |
| `bun run pm2:restart` | Reinicia |
| `bun run pm2:stop` | Para |
| `bun run pm2:delete` | Remove do PM2 |
| `bun run deploy` | Instala, compila e recarrega |

A porta padrão é **27381**, definida no `.env`. O servidor já aplica os
cabeçalhos de cache corretos: eterno para `/assets/` (nomes com hash),
nenhum para `sw.js`, o manifesto e o HTML — sem isso a atualização nunca
chegaria a quem já visitou.

Para expor na internet com HTTPS, ponha um proxy reverso na frente:

```nginx
server {
    listen 443 ssl;
    server_name etiquetas.seudominio.com.br;

    # ssl_certificate ... (use o certbot)

    location / {
        proxy_pass http://127.0.0.1:27381;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Só com Nginx

Mais eficiente para conteúdo estático, e dispensa processo Node:

```bash
bun run build
rsync -av --delete dist/ usuario@servidor:/var/www/etiquetas/
```

Exemplo de configuração no Nginx:

```nginx
server {
    listen 80;
    server_name etiquetas.seudominio.com.br;
    root /var/www/etiquetas;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Arquivos em assets/ têm hash no nome: podem ser cacheados para sempre.
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Use HTTPS.** Sem ele o navegador esconde algumas APIs — o app continua
funcionando, mas o botão de enviar copia o link em vez de abrir o menu de
compartilhamento do sistema. Um aviso na tela explica isso ao usuário.

## Desempenho

| | Comprimido |
|---|---|
| Carregamento inicial (HTML + CSS + JS) | ~48 kB |
| jsPDF, só ao gerar o primeiro PDF | ~115 kB |

O Tailwind é compilado no build — nenhum CSS é gerado no navegador. O jsPDF
fica num pedaço separado, carregado apenas quando alguém imprime.

## Medidas do PDF

Padrão de 70 × 30 mm, o que rende 18 etiquetas por folha A4 (2 colunas × 9
linhas). Qualquer tamanho é derivado assim:

```
colunas = ⌊(210 − 20) / largura⌋
linhas  = ⌊(297 − 20) / altura⌋
```

Os 20 mm são a margem mínima de 10 mm por lado: impressora doméstica não
imprime até a borda, e a fileira encostada na margem sairia cortada.

| Etiqueta | Por folha |
|---|---|
| 7 × 3 cm | 18 (2 × 9) |
| 5 × 3 cm | 27 (3 × 9) |
| 9 × 5 cm | 10 (2 × 5) |
| 6 × 4 cm | 18 (3 × 6) |

Cada folha traz, na margem inferior, a data e hora em que foi gerada — some
quando as etiquetas são recortadas.

> **Ao imprimir**, escolha tamanho real (100%) e desmarque "ajustar à
> página". Vale medir a primeira folha com régua para conferir.

## Estrutura

```
src/
  components/     BotaoBase, IconeSvg, FormularioPrato, ItemPrato,
                  BarraAcoes, AvisoCaixa, ListaVazia,
                  ModalTamanho, ModalPreview
  composables/
    useCardapio.ts   estado dos pratos, persistência, importação do link
    useTamanho.ts    tamanho da etiqueta e cálculo da grade
  lib/
    pdf.ts           layout do PDF, em milímetros
    link.ts          cardápio codificado na URL
    demo.ts          cardápio de exemplo
    id.ts            identificador com reserva para contexto sem HTTPS
  types.ts
```

## Decisões de projeto

- **Sem diálogos nativos** — nada de `alert`, `confirm` ou `prompt`: são
  feios e o usuário clica OK sem ler. Toda confirmação acontece na interface.
- **Alvos de toque de 44 px ou mais** — o app é usado com o dedo.
- **Sem `crypto.randomUUID` direto** — ele não existe fora de HTTPS, e a
  aplicação quebraria inteira ao ser servida por IP na rede local.
- **PDF em vetor, não imagem** — o texto sai nítido em qualquer impressora, e
  o arquivo tem poucos kilobytes.

## Licença

[MIT](LICENSE) — use, altere e distribua à vontade.

---

&copy; 2026 [sellvex.com.br](https://sellvex.com.br)
