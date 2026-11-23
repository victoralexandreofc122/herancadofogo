// v105: o clima e o ar com as texturas desenhadas no Flow (public/assets/clima, recortadas por
// arte/mapas/recortar_pecas.py). A chuva e a névoa são texturas que correm pela tela; pétalas, folhas, vaga-lumes,
// brasas e poeira são partículas com o desenho de cada pedaço. Enquanto a imagem não carrega, o jogo usa o desenho
// por código de antes (game.js). Só visual: o servidor não muda.
import { CLIMA_ARTE } from './climaData.js';
import { MAPA_ANIM } from './mapaAnim.js';

/** A arte está a 48 px por casa (a densidade do chão); `T` é quantos px de tela tem uma casa agora. */
const PX = 48;
const imgs = new Map();

/** A imagem de um efeito (carrega na primeira vez); null enquanto não está pronta. */
export function climaImg(id) {
  if (!(id in CLIMA_ARTE)) return null;
  let e = imgs.get(id);
  if (!e) {
    e = { img: new Image(), ok: false, pat: null, patCtx: null };
    e.img.onload = () => { e.ok = true; };
    e.img.src = `/assets/clima/${id}.png`;
    imgs.set(id, e);
  }
  return e.ok ? e : null;
}

/** Os quadros da tira de partículas de um efeito ([x, y, w, h] cada). */
export function climaQuadros(id) { return CLIMA_ARTE[id] || null; }

function padrao(ctx, e) {
  if (e.patCtx !== ctx) { e.pat = ctx.createPattern(e.img, 'repeat'); e.patCtx = ctx; }
  return e.pat;
}

/**
 * Uma textura que corre: cobre a tela inteira repetindo a imagem, na escala do mapa (`k` vezes) e deslocada por
 * (dx, dy) px de tela. Devolve false se a imagem ainda não carregou.
 */
export function camadaCorrendo(ctx, id, viewW, viewH, T, dx, dy, alpha, k = 1) {
  const e = climaImg(id);
  if (!e || typeof DOMMatrix === 'undefined') return false;
  const p = padrao(ctx, e);
  if (!p || !p.setTransform) return false;
  const s = (T / PX) * k;
  const W = e.img.width * s, H = e.img.height * s;
  p.setTransform(new DOMMatrix().translate(((dx % W) + W) % W - W, ((dy % H) + H) % H - H).scale(s));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p;
  ctx.fillRect(0, 0, viewW, viewH);
  ctx.restore();
  return true;
}

/**
 * Uma partícula desenhada: o quadro `q` da tira de `id`, centrado em (sx, sy), girado `ang` e com `escala` em relação
 * ao tamanho do desenho no mapa. Devolve false se a imagem não carregou.
 */
export function particula(ctx, id, q, sx, sy, T, escala, ang, alpha) {
  const e = climaImg(id), Q = CLIMA_ARTE[id];
  if (!e || !Q || !Q.length) return false;
  const [x, y, w, h] = Q[((q % Q.length) + Q.length) % Q.length];
  const s = (T / PX) * escala;
  ctx.globalAlpha = alpha;
  if (ang) {
    ctx.save();
    ctx.translate(sx, sy); ctx.rotate(ang);
    ctx.drawImage(e.img, x, y, w, h, -w * s / 2, -h * s / 2, w * s, h * s);
    ctx.restore();
  } else {
    ctx.drawImage(e.img, x, y, w, h, Math.round(sx - w * s / 2), Math.round(sy - h * s / 2), Math.round(w * s), Math.round(h * s));
  }
  return true;
}

// ------------------------------------------------------------------ v106: o que anda no chão dos mapas em imagem

const tiras = new Map();
function tira(arquivo) {
  let e = tiras.get(arquivo);
  if (!e) { e = { img: new Image(), ok: false }; e.img.onload = () => { e.ok = true; }; e.img.src = `/assets/mapas/${arquivo}`; tiras.set(arquivo, e); }
  return e.ok ? e.img : null;
}

/**
 * A água do Canal (os 4 quadros do Flow) correndo nos rios dos mapas em imagem. `arts`: os mapas à vista
 * ({ art, x, y } em casas); o quadro 0 já está pintado no chão, e aqui entram os outros por cima, no tempo.
 */
export function drawMapaAnim(ctx, arts, toScreenX, toScreenY, T, now, viewW, viewH) {
  const k = T / PX;
  for (const r of arts) {
    const A = MAPA_ANIM[r.art];
    if (!A) continue;
    const q = Math.floor(now / A.ms);
    for (const t of A.agua) {
      const meta = A.tiras[t.o];
      const img = meta && tira(meta.arquivo);
      if (!img) continue;
      const sx = toScreenX(r.x + t.x), sy = toScreenY(r.y + t.y), sw = t.w * T, sh = t.h * T;
      if (sx > viewW || sy > viewH || sx + sw < 0 || sy + sh < 0) continue;
      const f = q % meta.quadros, n = meta.n, L = 288;            // n: a largura do rio na folha; L: o comprimento do quadro
      ctx.save();
      ctx.beginPath(); ctx.rect(Math.round(sx), Math.round(sy), Math.ceil(sw), Math.ceil(sh)); ctx.clip();
      ctx.imageSmoothingEnabled = false;
      if (t.o === 'h') {
        const y0 = toScreenY(r.y) + Math.round(t.y * PX) * k;     // o rio começa na linha da área (a folha cobre a largura dele)
        for (let X = Math.floor(t.x * PX / L) * L; X < (t.x + t.w) * PX; X += L) {
          ctx.drawImage(img, 0, f * n, L, n, toScreenX(r.x) + X * k, y0, L * k, n * k);
        }
      } else {
        const x0 = toScreenX(r.x) + Math.round(t.x * PX) * k;
        for (let Y = Math.floor(t.y * PX / L) * L; Y < (t.y + t.h) * PX; Y += L) {
          ctx.drawImage(img, f * n, 0, n, L, x0, toScreenY(r.y) + Y * k, n * k, L * k);
        }
      }
      ctx.restore();
    }
  }
}
