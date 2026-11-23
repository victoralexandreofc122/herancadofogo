// v96 (pedido do Victor, 23/11): a interface desenhada (tema Laca e Brasa) ganha vida com o gráfico no máximo.
// Os quadros saem da própria arte do Victor, aqui no aparelho (nada novo para baixar), com as técnicas clássicas da pixel art:
//  - FOGO: ciclo de paleta (cada pixel da chama anda uma casa na rampa de calor, numa onda que sobe), a ponta da chama
//    pisca (some e volta, um pixel por vez) e de vez em quando uma faísca sobe acima dela e apaga;
//  - OURO: o reflexo de luz (uma faixa diagonal de 2 pixels mais claros) varre o bronze e o ouro de vez em quando,
//    com uma pausa longa entre uma passada e outra (o brilho chama atenção se for raro).
// Tudo a 10 quadros por segundo, em passos (steps), sem misturar quadros: é pixel art, nada de borrar.
// Os quadros viram data: URLs (a CSP aceita) e entram numa folha de estilo construída (CSSOM, sem <style> inline):
// uma @keyframes por peça trocando o border-image-source, ligada no seletor de ANIMADAS.

const FPS = 10;
/** A rampa do calor (do mais frio ao mais quente): a chama anda nela. */
const RAMPA = [[122, 30, 10], [200, 56, 26], [240, 112, 42], [255, 176, 64], [255, 229, 138]];
const BRILHO = [255, 248, 220];

const hsv = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, mx ? d / mx : 0, mx / 255];
};
const eFogo = (r, g, b) => r > 190 && b < 110 && r - g > 55;
const eOuro = (r, g, b) => { const [h, s, v] = hsv(r, g, b); return h >= 20 && h <= 52 && s >= 0.28 && s <= 0.85 && v >= 0.42; };
const nivel = (r, g, b) => { let best = 0, bd = 1e9; RAMPA.forEach((c, i) => { const d = (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2; if (d < bd) { bd = d; best = i; } }); return best; };

/** Os quadros de uma peça: { urls, ms } (ou null, se ela não tem fogo nem ouro). Puro: recebe e devolve ImageData. */
export function quadrosDe(img, W, H, criar, opc = {}) {
  const px = img.data;
  const fogo = new Uint8Array(W * H), ouro = new Uint8Array(W * H), lv = new Int8Array(W * H);
  let nf = 0, no = 0;
  for (let i = 0; i < W * H; i++) {
    if (px[i * 4 + 3] < 128) continue;
    const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
    if (eFogo(r, g, b)) { fogo[i] = 1; lv[i] = nivel(r, g, b); nf++; } else if (eOuro(r, g, b)) { ouro[i] = 1; no++; }
  }
  // a chama é uma mancha pequena (as chamas dos cantos, as do anel): uma linha longa da mesma cor é o bronze aceso da
  // moldura, que não pode pegar fogo. Manchas maiores que 16 pixels ou compridas (4 vezes mais longas que largas) saem.
  // (a faixa de fogo da barra dos selos é toda chama: lá a mancha grande é fogo mesmo, opc.chamaGrande)
  if (!opc.chamaGrande) {
    const visto = new Uint8Array(W * H);
    for (let i0 = 0; i0 < W * H; i0++) {
      if (!fogo[i0] || visto[i0]) continue;
      const pilha = [i0], mancha = [];
      visto[i0] = 1;
      let x0 = W, x1 = 0, y0 = H, y1 = 0;
      while (pilha.length) {
        const i = pilha.pop(), x = i % W, y = (i / W) | 0;
        mancha.push(i);
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        for (const j of [i - 1, i + 1, i - W, i + W]) {
          if (j < 0 || j >= W * H || visto[j] || !fogo[j] || Math.abs((j % W) - x) > 1) continue;
          visto[j] = 1; pilha.push(j);
        }
      }
      const w = x1 - x0 + 1, h = y1 - y0 + 1;
      if (w > 16 || h > 16 || Math.max(w, h) > 4 * Math.min(w, h)) {
        for (const i of mancha) { fogo[i] = 0; nf--; const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2]; if (eOuro(r, g, b) || r > 150) { ouro[i] = 1; no++; } }
      }
    }
  }
  if (nf < 3 && no < 12) return null;
  // as pontas da chama (sem chama em cima) e o topo de cada coluna de fogo (para as faíscas)
  const ponta = [];
  for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (fogo[i] && !fogo[i - W]) ponta.push(i); }
  const brilho = no >= 12;
  const G = brilho ? Math.max(8, Math.min(18, Math.round((W + H) / 10))) : 0;   // quadros da passada do reflexo
  const N = Math.max(16, G + 16);   // o laço: a passada e depois a pausa (o fogo segue o tempo todo)
  const frames = [];
  for (let f = 0; f < N; f++) {
    const out = criar(W, H), o = out.data;
    o.set(px);
    const k = f % 4;
    if (nf >= 3) {
      for (let i = 0; i < W * H; i++) {
        if (!fogo[i]) continue;
        const y = (i / W) | 0, x = i % W;
        const d = [0, 1, 0, -1][(y + k + ((x >> 2) & 1)) % 4];   // a onda de calor subindo (cada 4 colunas com outra fase)
        const c = RAMPA[Math.max(0, Math.min(RAMPA.length - 1, lv[i] + d))];
        o[i * 4] = c[0]; o[i * 4 + 1] = c[1]; o[i * 4 + 2] = c[2];
      }
      for (const i of ponta) {   // a ponta pisca: em metade dos quadros alguns pixels da ponta somem
        const x = i % W;
        if ((x + k) % 3 === 0) {
          const cima = i - W;
          if (px[cima * 4 + 3] >= 128) { o[i * 4] = px[cima * 4]; o[i * 4 + 1] = px[cima * 4 + 1]; o[i * 4 + 2] = px[cima * 4 + 2]; }
          else o[i * 4 + 3] = 0;
        }
      }
      // a faísca: a cada 8 quadros, sobe 3 pixels acima de uma ponta e apaga (amarela, laranja, vermelha)
      const s = f % 8;
      if (s < 3 && ponta.length) {
        const i0 = ponta[(Math.floor(f / 8) * 7) % ponta.length];
        const y = ((i0 / W) | 0) - 1 - s, x = i0 % W;
        if (y >= 0) {
          const j = y * W + x, c = RAMPA[4 - s];
          if (!fogo[j]) { o[j * 4] = c[0]; o[j * 4 + 1] = c[1]; o[j * 4 + 2] = c[2]; o[j * 4 + 3] = 255; }
        }
      }
    }
    if (brilho && f < G) {   // o reflexo: a faixa diagonal (x + y = c) varre a peça de cima à esquerda para baixo à direita
      const c = -4 + ((W + H + 8) * f) / (G - 1);
      for (let i = 0; i < W * H; i++) {
        if (!ouro[i]) continue;
        const y = (i / W) | 0, x = i % W, dd = Math.abs(x + y - c);
        const a = dd < 1 ? 0.7 : dd < 2.2 ? 0.35 : 0;
        if (a) for (let ch = 0; ch < 3; ch++) o[i * 4 + ch] = Math.round(o[i * 4 + ch] + (BRILHO[ch] - o[i * 4 + ch]) * a);
      }
    }
    frames.push(out);
  }
  return { frames, ms: N * (1000 / FPS) };
}

/**
 * Onde cada peça animada aparece (o seletor do estado em que ela fica parada no CSS de uiLaca.css). Peças sem fogo
 * nem ouro, ou que estão em outro estado (apertado, desligado, em recarga), ficam paradas.
 */
export const ANIMADAS = {
  ui_painel: '.mission-panel',
  ui_cartao_entrada: '.card',
  ui_pergaminho: '.scroll-paper',
  ui_dica: '.hint-card',
  ui_aviso: '.toast',
  ui_aba_2: '.tab.active, .tab[aria-selected="true"], .creator-tab[aria-selected="true"]',
  ui_botao_principal_1: 'button.primary:not(:active):not(:disabled)',
  ui_jutsu_1: '.cbtn.skill:not(.cooling):not(.empty)',
  ui_ataque: '.cbtn.attack',
  ui_botao_redondo_1: '.round-btn:not(:active)',
  // v97: o HUD. Estas ficam no fundo (background-image) de um pseudo-elemento ou da própria peça.
  ui_retrato_1: { sel: '.hud-me .portrait::after', prop: 'background-image' },
  ui_retrato_2: { sel: '.target-window .portrait.foe::after', prop: 'background-image' },
  ui_minimapa: { sel: '.minimap::after', prop: 'background-image' },
  ui_selos_fogo: { sel: '.cast-bar .fill', prop: 'background-image', chamaGrande: true },
  // v98: o lote 4 (a caixa da fala, o aviso grande e o emblema da entrada)
  ui_dialogo: '.dialog',
  ui_aviso_grande: '.duel-banner',
  ui_aviso_grande_selo: { sel: '.duel-banner::before', prop: 'background-image' },
  ui_slot_lendario: '.eq-cell[data-raridade="lendario"]',
  // v99: a faixa do título e a barra do chefe
  ui_titulo: '.mission-head h2',
  ui_barra_chefe: '.boss-track',
};

/** Liga a animação nas peças (só com o gráfico no máximo: quem chama decide). Devolve a função que desliga. */
export async function ligarAnimacao(pecas = ANIMADAS) {
  if (typeof CSSStyleSheet === 'undefined' || !('adoptedStyleSheets' in document)) return () => {};
  const regras = [];
  for (const [nome, peca] of Object.entries(pecas)) {
    const { sel: seletor, prop = 'border-image-source', ...opc } = typeof peca === 'string' ? { sel: peca } : peca;
    try {
      const img = await new Promise((ok, falha) => { const im = new Image(); im.onload = () => ok(im); im.onerror = falha; im.src = `/assets/ui/${nome}.png`; });
      const cv = document.createElement('canvas');
      cv.width = img.width; cv.height = img.height;
      const g = cv.getContext('2d');
      g.drawImage(img, 0, 0);
      const r = quadrosDe(g.getImageData(0, 0, img.width, img.height), img.width, img.height, (w, h) => g.createImageData(w, h), opc);
      if (!r) continue;
      const urls = r.frames.map((fr) => { g.clearRect(0, 0, cv.width, cv.height); g.putImageData(fr, 0, 0); return cv.toDataURL('image/png'); });
      const passo = 100 / urls.length;
      regras.push(`@keyframes uia-${nome} {${urls.map((u, i) => `${(i * passo).toFixed(3)}% { ${prop}: url("${u}"); }`).join(' ')}}`);
      const sel = seletor.split(',').map((x) => `.ui-laca.ui-anim ${x.trim()}`).join(', ');
      regras.push(`${sel} { animation: uia-${nome} ${r.ms}ms step-end infinite; }`);
    } catch { /* sem a imagem: a peça fica parada */ }
  }
  const folha = new CSSStyleSheet();
  folha.replaceSync(regras.join('\n'));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, folha];
  document.documentElement.classList.add('ui-anim');
  return () => {
    document.documentElement.classList.remove('ui-anim');
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== folha);
  };
}
