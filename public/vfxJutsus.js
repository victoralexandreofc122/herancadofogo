/*
 * Sprites desenhados pelo Victor para 6 jutsus (Academia e Fogo T1), 3 quadros cada, em public/assets/vfx/<nome>_0N.png:
 *
 *   quadro 1: o lançamento (na mão de quem lançou)
 *   quadro 2: o golpe ativo (o projétil voando, o cone, a linha, a nuvem, a fumaça)
 *   quadro 3: o fim (explosão, brasas apagando, o tronco no chão)
 *
 * SÓ VISUAL, como o vfx.js: o servidor decide quem acerta; aqui só se toca o quadro certo na hora certa. Cada sprite
 * tem o tamanho em CASAS (o mesmo em qualquer tela) e um modo de mistura: 'glow' desenha normal e soma um brilho por
 * cima (fogo, faísca); 'screen' clareia (fumaça, névoa); o resto é normal. Faltou carregar: quem chamou desenha o antigo.
 * As partículas (brasas no voo, fumaça e faíscas no impacto) continuam vindo do particles.js.
 */

import { FOGO_FRAMES } from './vfxFogo.js';
import { VFX_CAMADAS } from './vfxCamadas.js';

/** Os quadros: [largura em casas, âncora x, âncora y (em pixels da imagem; null = centro), mistura]. */
export const FRAMES = {
  fogo_01: { casas: 0.75, blend: 'glow' },
  fogo_02: { casas: 1.25, ancora: [41, 7], arte: -0.675, blend: 'glow' },     // a arte aponta para cima e à direita
  fogo_03: { casas: 2.6, blend: 'glow' },
  sopro_01: { casas: 0.5, blend: 'glow' },
  sopro_02: { casas: 3, ancora: [0, 44], arte: 0, blend: 'glow' },           // cone com a ponta na mão
  sopro_03: { casas: 2.4, ancora: [0, 22], arte: 0, blend: 'screen' },
  nevoa_01: { casas: 4.4, blend: 'screen', alpha: 0.85 },
  nevoa_02: { casas: 4.4, blend: 'screen', alpha: 0.95 },
  nevoa_03: { casas: 5.6, blend: 'glow' },
  linha_01: { casas: 0.35, blend: 'glow' },
  linha_02: { casas: 2.2, blend: 'glow', pe: true },                          // em pé, repetida ao longo da linha
  linha_03: { casas: 1.8, blend: 'screen', pe: true },
  teleporte_01: { casas: 0.7, blend: 'screen' },
  teleporte_02: { casas: 1.6, blend: 'screen' },
  teleporte_03: { casas: 2.1, blend: 'lighter' },
  substituicao_01: { casas: 2.3, blend: 'normal' },
  substituicao_02: { casas: 2, blend: 'normal' },
  substituicao_03: { casas: 1.8, blend: 'normal', pe: true },
  // v73: os 10 jutsus de Fogo desenhados pelo Victor (6 quadros cada; a tabela sai do arte/jutsus-vfx/recortar.py)
  ...FOGO_FRAMES,
  // v78: as camadas que complementam as folhas (PixelFX recolorido; arte/pixelfx/camadas.mjs): folhas em grade, quadro a quadro
  ...VFX_CAMADAS,
};

const imgs = {};
let loading = null;

/** Preload: todos os quadros, uma vez (o jogo segue enquanto chegam). */
export function loadJutsuSprites() {
  if (loading) return loading;
  loading = Promise.all(Object.keys(FRAMES).map((name) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { imgs[name] = img; resolve(); };
    img.onerror = () => resolve();
    img.src = `/assets/vfx/${name}.png`;
  })));
  return loading;
}

/** Os quadros daquele jutsu chegaram? (v56: os 3 de cada; v73: todos os de um jutsu de Fogo, ex. 'fire_ryuka') */
export const jutsuSpritesReady = (base) => (FOGO_BASES.has(base)
  ? Object.keys(FOGO_FRAMES).filter((n) => n.replace(/_0\d\w?$/, '') === base).every((n) => imgs[n])
  : [1, 2, 3].every((i) => imgs[`${base}_0${i}`]));
const FOGO_BASES = new Set(Object.keys(FOGO_FRAMES).map((n) => n.replace(/_0\d\w?$/, '')));

/**
 * v85: PROFUNDIDADE: o que fica em volta do corpo ou nos pés (anéis, escudos, auras, prisões) é desenhado em duas partes:
 * a de cima do ponto de apoio (o lado de trás) por baixo do boneco, a de baixo (o lado da frente) por cima dele. Sem isso o
 * anel inteiro ficava na frente (ou inteiro atrás) do ninja. Vale para todos os quadros desses jutsus que estejam na camada
 * de cima; o que já está no chão continua no chão.
 */
export const PROFUNDIDADE = new Set([
  'stone_3', 'illusion_emprestimo', 'umbra_forma', 'bastiao_muralha', 'bastiao_guarda', 'bastiao_juramento', 'aspide_constricao', 'zefiro_veu',   // v90
  'rubro_olho', 'rubro_guardiao', 'rubro_completo', 'umbra_faminta', 'water_corpo', 'heal_aura', 'taijutsu_chave',   // v89
  'illusion_4', 'illusion_3', 'illusion_noite', 'illusion_espelho', 'illusion_kai', 'illusion_reflexo', 'illusion_veu',   // v88: a Ilusão
  'fire_coroa', 'heal', 'heal_casca', 'heal_4', 'heal_desintox', 'heal_banho', 'heal_santuario', 'heal_disturbio',
  'lightning_armadura', 'lightning_fluxo', 'lightning_correntes', 'lightning_maos',
  'stone', 'stone_4', 'stone_couraca', 'stone_resposta', 'stone_pisao', 'stone_pilares', 'stone_punho',
  'water_casulo', 'water_2', 'water_onda', 'water_3', 'water_nevoa',
  'shadow_veu', 'shadow_ciranda', 'shadow_agarre', 'shadow_estrangular', 'shadow_4',
  'taijutsu_2', 'taijutsu_folego', 'taijutsu_portoes', 'taijutsu_bloqueio',
  'wind_pulso', 'wind_veu', 'wind_espelho', 'wind_leve', 'wind_olho',
  'weapons_2', 'weapons_4', 'weapons_polida', 'weapons_laco',
  // as camadas do PixelFX que ficam em volta de alguém
  'pfx_cura_corpo', 'pfx_cura_cruzes', 'pfx_raio_faiscas', 'pfx_fogo_brasas', 'pfx_pedra_poeira',
  // os anéis com altura (chamas, raios, cruzes subindo): a frente deles passa por cima de quem está dentro
  'pfx_fogo_anel', 'pfx_cura_anel', 'pfx_raio_estalo',
]);
/** v85: as bolhas e escudos em volta do corpo: a metade da frente translúcida (o ninja aparece dentro, como num vidro). */
const FRENTE = { bastiao_guarda: 0.6, bastiao_muralha: 0.75, zefiro_veu: 0.55, aspide_constricao: 0.8, rubro_olho: 0.6, rubro_guardiao: 0.65, water_corpo: 0.6, heal_aura: 0.6, umbra_faminta: 0.75, illusion_kai: 0.5, illusion_espelho: 0.6, illusion_veu: 0.55, illusion_noite: 0.7, illusion_reflexo: 0.75, water_casulo: 0.5, heal_casca: 0.55, stone_4: 0.6, stone: 0.65, stone_couraca: 0.6, wind_veu: 0.55, wind_espelho: 0.5,
  wind_olho: 0.55, shadow_veu: 0.55, water_3: 0.55, lightning_armadura: 0.8, taijutsu_bloqueio: 0.7 };
const baseDe = (name) => name.replace(/_0\d\w?$/, '');

/**
 * v95 (OK do Victor, 22/11: "usar os estilos de lugar no corpo em todos os jutsus desse tipo"): o lugar de cada arte que fica
 * no corpo de alguém, qualquer que seja o caminho que a toca (fogoAnim.js ou folhasAnim.js). Vale só para o quadro que
 * acompanha alguém (follow) na camada de cima e que ainda não veio com o encaixe (apoio). Os 4 estilos:
 *  - torso: do pescoço ao quadril, sem cobrir a cabeça (escudos no peito);
 *  - corpo + tras: sobe dos pés e cobre o boneco; a parte de trás (acima do corte) fica atrás dele, a cabeça na frente;
 *  - corpo sem tras: a bolha em volta, inteira por cima e translúcida (o ninja dentro);
 *  - pes: o círculo deitado no chão, em volta dos pés (a metade de trás atrás do boneco).
 * O tamanho sai de um quadro de referência (ref, o cheio) e vale para todos, para os quadros pequenos (a faísca da entrada)
 * não esticarem até a altura do corpo. O boneco: pés +0,42, quadril +0,18, pescoço -0,22, topo da cabeça -0,88 (casas).
 */
export const LUGAR = {
  // tronco
  stone: { lugar: 'torso', alto: 0.62 }, stone_resposta: { lugar: 'torso', alto: 0.62 }, shadow_estrangular: { lugar: 'torso', alto: 0.5, dy: -0.12 },
  // corpo com a metade de trás (anéis e redemoinhos em volta, chamas e portões que sobem dos pés)
  lightning_armadura: { lugar: 'corpo', tras: true, alto: 1.45 }, wind_veu: { lugar: 'corpo', tras: true, alto: 1.4 },
  wind_olho: { lugar: 'corpo', tras: true, alto: 1.5 }, water_corpo: { lugar: 'corpo', tras: true, alto: 1.45 },
  zefiro_veu: { lugar: 'corpo', tras: true, alto: 1.75, dy: -0.06, corte: -0.95 },   // v95: cobre a cabeça também (marcação do Victor) weapons_2: { lugar: 'corpo', tras: true, alto: 1.3 },
  heal_4: { lugar: 'corpo', tras: true, alto: 1.3 }, taijutsu_portoes: { lugar: 'corpo', tras: true, alto: 1.4, corte: -0.3 },
  bastiao_juramento: { lugar: 'corpo', tras: true, alto: 1.6, corte: -0.2 }, aspide_constricao: { lugar: 'corpo', tras: true, alto: 1.2, corte: -0.3 },
  rubro_completo: { lugar: 'corpo', tras: true, alto: 2.1, corte: 0 },   // o guerreiro inteiro atrás do ninja
  // bolha por cima (o ninja dentro, translúcido)
  wind_espelho: { lugar: 'corpo', alto: 1.45, alpha: 0.6 }, illusion_kai: { lugar: 'corpo', alto: 1.45, alpha: 0.6 },
  heal_casca: { lugar: 'corpo', alto: 1.45, alpha: 0.55 }, stone_4: { lugar: 'corpo', alto: 1.45, alpha: 0.6 },
  stone_couraca: { lugar: 'corpo', alto: 1.3, alpha: 0.65 }, shadow_veu: { lugar: 'corpo', alto: 1.4, alpha: 0.6 },
  water_3: { lugar: 'corpo', alto: 1.45, alpha: 0.6 }, heal: { lugar: 'corpo', alto: 1.3, alpha: 0.75 },
  heal_desintox: { lugar: 'corpo', alto: 1.35, alpha: 0.65 }, taijutsu_bloqueio: { lugar: 'corpo', alto: 1.35, alpha: 0.7 },   // v95: a guarda em bolha   // v95: a folha refeita é uma cúpula
  // no chão, em volta dos pés
  illusion_veu: { lugar: 'pes', largura: 1.6, sy: 0.7 },
  // v95 (marcação do Victor): o anel vermelho do Fôlego nos pés, deitado em perspectiva como a Forma Umbral
  taijutsu_folego: { lugar: 'pes', largura: 1.6, sy: 0.6 },
};
/** O encaixe do LUGAR para um quadro (null = sem mudança: falta a imagem de referência). */
function lugarDe(base, L, opts) {
  const ref = [L.ref, '04', '03', '05', '02', '01'].map((n) => n && `${base}_${n}`).find((n) => n && imgs[n] && FRAMES[n] && !FRAMES[n].quadros);
  if (!ref) return null;
  const im = imgs[ref], fm = FRAMES[ref];
  const pelaAltura = (alto) => (alto * im.width) / (im.height * fm.casas);
  if (L.lugar === 'pes') return { y: L.y ?? 0.42, scale: (L.largura ?? 1.5) / fm.casas, split: true, ...(L.sy ? { sy: L.sy } : {}) };
  if (L.lugar === 'torso') return { y: -0.02 + (L.dy ?? 0), apoio: 'centro', scale: pelaAltura(L.alto ?? 0.5), split: false };
  // com a metade de trás, a frente fica no mesmo tom da de trás (sem a costura clara entre as duas: o pedido do Victor na Forma Umbral)
  // v95 (marcações do Victor): o meio da arte no meio do corpo, assim os quadros pequenos da entrada também ficam centrados no
  // ninja (antes ficavam pelos pés); o corte da metade de trás continua no pescoço (0,47 + corte, contado do pé)
  const alto = L.alto ?? 1.45, yc = 0.47 - alto / 2 + (L.dy ?? 0);
  return { y: yc, apoio: 'centro', scale: pelaAltura(alto), split: !!L.tras, corte: 0.47 + (L.corte ?? -0.69) - yc,
    ...(L.tras ? { frente: 1 } : { alpha: (opts.alpha ?? 1) * (L.alpha ?? 0.62) }) };
}

/** Quadros por segundo da tremida (o mesmo quadro espelhado e balançando, para o fogo não ficar parado). */
export const FLICKER_FPS = 12;

export class JutsuSprites {
  constructor() {
    /** { name, x, y, angle, scale, start, end, fadeIn, fadeOut, flicker, layer } */
    this.list = [];
    /** projéteis com sprite: id -> { name, x, y, fx, fy, speed, range, start, until } */
    this.shots = new Map();
  }

  clear() { this.list.length = 0; this.shots.clear(); }

  /** Toca um quadro em (x, y) (casas) de `start` até `start + ms`. */
  show(name, x, y, start, ms, opts = {}) {
    if (!imgs[name]) return false;
    // v95: o lugar no corpo (LUGAR) para quem acompanha alguém e ainda não veio encaixado
    const L = LUGAR[baseDe(name)];
    if (L && opts.follow && !opts.cabeca && !opts.apoio && (opts.layer ?? 'top') === 'top') {
      const o = lugarDe(baseDe(name), L, opts);
      if (o) { y = o.y; opts = { ...opts, ...o }; }
    }
    // v85: auditoria (arte/jutsus-vfx/auditar.ts): o tamanho desenhado de cada quadro, para comparar com a área do servidor
    if (globalThis.__jfxLog) globalThis.__jfxLog.push({ name, x, y, scale: opts.scale ?? 1, grow: opts.grow ?? 0, len: opts.len ?? 0, casas: FRAMES[name]?.casas ?? 0, eixo: !!FRAMES[name]?.eixoPx, arte: FRAMES[name]?.arte !== undefined, follow: !!opts.follow, layer: opts.layer ?? 'top' });
    this.list.push({ name, x, y, start, end: start + ms, angle: opts.angle ?? 0, scale: opts.scale ?? 1, fadeIn: opts.fadeIn ?? 60, fadeOut: opts.fadeOut ?? 120,
      flicker: opts.flicker ?? false, grow: opts.grow ?? 0, layer: opts.layer ?? 'top',
      len: opts.len ?? 0, follow: opts.follow ?? null, tag: opts.tag ?? null, rate: opts.rate ?? 1, alpha: opts.alpha ?? 1,
      // v85: split = metade de trás por baixo do boneco; spin = gira (rad/s); pop = entra crescendo (ms);
      // sombra = mancha no chão (raio em casas) que cresce quando a coisa cai; luz = poça de luz no chão [cor, raio em casas]
      split: opts.split ?? ((opts.layer ?? 'top') === 'top' && PROFUNDIDADE.has(baseDe(name))), spin: opts.spin ?? 0, pop: opts.pop ?? 0,
      sombra: opts.sombra ?? 0, luz: opts.luz ?? null,
      // v94: piso = o chão de dentro da arte pintado de uma cor translúcida [cor, raio em casas, achatado] (a base da Aura de Regeneração)
      piso: opts.piso ?? null,
      // v91: o encaixe no corpo: apoio 'base' = o pé da arte no ponto (sobe dos pés), 'centro' = o meio da arte no ponto;
      // alto = a altura da arte em casas (o corpo inteiro, só o tronco); corte = onde a metade de trás acaba (casas, a partir do ponto)
      apoio: opts.apoio ?? null, alto: opts.alto ?? 0, corte: opts.corte ?? 0,
      // v92: ícone em cima da cabeça de alguém (o id): o jogo põe os ícones ativos lado a lado (drawCabeca)
      cabeca: opts.cabeca ?? null,
      // v93: achata na vertical (o círculo perfeito vira elipse em perspectiva: deitado no chão ou em volta do corpo)
      sy: opts.sy ?? 1,
      // v95: a transparência da frente (1 = igual à de trás; sem ela vale a do FRENTE)
      frente: opts.frente ?? null });
    return true;
  }

  /**
   * v78: toca uma CAMADA (folha em grade do vfxCamadas.js) do começo ao fim, no tempo dela (`rate` acelera; `ms` corta
   * ou, num laço, diz quanto tempo fica). As outras opções são as do `show` (follow, tag, scale, angle, layer...).
   */
  layer(name, x, y, start, opts = {}) {
    const f = FRAMES[name];
    if (!f?.quadros) return false;
    const natural = (f.quadros * f.ms) / (opts.rate ?? 1);
    return this.show(name, x, y, start, opts.ms ?? (f.laco ? 1000 : natural), { fadeIn: 0, fadeOut: f.laco ? 250 : Math.min(400, natural * 0.3), ...opts });   // o fim cortado (ate) apaga suave
  }

  /** v85: só a sombra e/ou a luz no chão em (x, y), sem desenho por cima (o meteoro que vem do céu, o clarão da explosão). */
  marca(x, y, start, ms, { sombra = 0, luz = null, tag = null, fadeIn = 80, fadeOut = 200 } = {}) {
    this.list.push({ name: null, x, y, start, end: start + ms, angle: 0, scale: 1, fadeIn, fadeOut, flicker: false, grow: 0, layer: 'ground',
      len: 0, follow: null, tag, rate: 1, alpha: 1, split: false, spin: 0, pop: 0, sombra, luz });
    return true;
  }

  /** v92: os ícones de cabeça ativos de alguém agora, um por jutsu (a etiqueta), do mais antigo para o mais novo. */
  cabecaDe(key, now) {
    const g = new Map();
    for (const s of this.list) {
      if (s.cabeca !== key || now < s.start || now >= s.end) continue;
      const t = s.tag || s.name, o = g.get(t);
      // o quadro novo só entra quando já apareceu (o fadeIn): na troca do laço o ícone não pisca
      const pronto = (x) => now - x.start >= x.fadeIn;
      if (!o || (pronto(s) && (!pronto(o) || s.start >= o.start)) || (!pronto(o) && s.start < o.start)) g.set(t, s);
    }
    return [...g.values()].sort((a, b) => (a.tag || '').localeCompare(b.tag || ''));
  }

  /** v92: desenha um ícone de cabeça em (sx, sy) da tela, com `w` px de largura. */
  drawCabeca(g, s, sx, sy, w, T, now) {
    const im = imgs[s.name], fm = FRAMES[s.name];
    if (!im || !fm) return;
    const k = Math.min(1, (now - s.start) / Math.max(1, s.fadeIn), (s.end - now) / Math.max(1, s.fadeOut));
    const bob = Math.sin(now / 320) * T * 0.03;
    // o selo redondo claro com borda escura atrás do ícone: a arte escura (a boca da Sombra Faminta) aparece em qualquer chão
    g.save(); g.globalAlpha = Math.max(0, k);
    g.fillStyle = 'rgba(244, 238, 255, 0.88)'; g.strokeStyle = '#1a1424'; g.lineWidth = Math.max(1.5, w * 0.06);
    g.beginPath(); g.arc(sx, sy + bob, w * 0.52, 0, Math.PI * 2); g.fill(); g.stroke(); g.restore();
    drawSprite(g, s.name, sx, sy + bob, T, 0, (w * 0.86) / (fm.casas * T), Math.max(0, k) * s.alpha, 0, 0, now - s.start, 'centro');
  }

  /** v73: tira os quadros de uma etiqueta (a marca que detonou antes da hora, o buff que acabou). */
  drop(tag) { this.list = this.list.filter((s) => s.tag !== tag); }

  launch(id, name, x, y, fx, fy, speed, range, start, tail = 400) {
    if (!imgs[name]) return false;
    this.shots.set(id, { name, x, y, fx, fy, speed, range, start, until: start + (range / Math.max(0.1, speed)) * 1000 + tail });
    return true;
  }

  /** Onde o projétil está agora (para a explosão sair do lugar certo se o impacto não trouxer posição). */
  land(id) { this.shots.delete(id); }

  draw(g, layer, toX, toY, T, now) {
    let alive = 0;
    for (const s of this.list) {
      if (now >= s.end) continue;
      this.list[alive++] = s;
      if (now < s.start) continue;
      if (s.cabeca) continue;   // v92: desenhado na fileira de cima da cabeça (drawCabeca)
      const extras = layer === 'ground' && (s.sombra || s.luz || s.piso);
      if (s.layer !== layer && !(s.split && (layer === 'ground' || layer === 'top')) && !extras) continue;
      const k = Math.min(1, (now - s.start) / Math.max(1, s.fadeIn), (s.end - now) / Math.max(1, s.fadeOut));
      const life = (now - s.start) / Math.max(1, s.end - s.start);
      // v73: quadro que acompanha alguém (a marca no alvo, a lâmina na mão); sumiu do mapa = o quadro some
      const at = s.follow ? s.follow() : s;
      if (!at) continue;
      const px = toX(at.x + (s.follow ? s.x : 0)), py = toY(at.y + (s.follow ? s.y : 0));
      const alpha = Math.max(0, k) * s.alpha;
      if (extras) {   // v85: a sombra e a luz no chão (embaixo de tudo), no pé do desenho
        let gy = s.follow ? toY(at.y) + 0.42 * T : py;   // os pés de quem a coisa acompanha, ou o próprio ponto
        if (s.sombra) {
          const r = s.sombra * T * (0.6 + 0.4 * life);
          g.save(); g.globalAlpha = 0.32 * alpha * (0.5 + 0.5 * life); g.fillStyle = '#000';
          g.beginPath(); g.ellipse(px, gy, r, r * 0.45, 0, 0, Math.PI * 2); g.fill(); g.restore();
        }
        if (s.piso) {   // v94: cor lisa e translúcida, com a borda suave (não clareia: pinta por cima do chão)
          const [cor, raio, achata = 0.42, dy = 0] = s.piso, r = raio * T;
          const gy0 = gy; gy += dy * T;
          const gr = g.createRadialGradient(px, gy, 0, px, gy, r);
          gr.addColorStop(0, cor); gr.addColorStop(0.78, cor); gr.addColorStop(1, 'rgba(0,0,0,0)');
          g.save(); g.globalAlpha = alpha; g.fillStyle = gr; g.translate(px, gy); g.scale(1, achata); g.translate(-px, -gy);
          g.beginPath(); g.arc(px, gy, r, 0, Math.PI * 2); g.fill(); g.restore();
          gy = gy0;
        }
        if (s.luz) {
          const [cor, raio] = s.luz, r = raio * T;
          const gr = g.createRadialGradient(px, gy, 0, px, gy, r);
          gr.addColorStop(0, cor); gr.addColorStop(1, 'rgba(0,0,0,0)');
          g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.45 * alpha; g.fillStyle = gr;
          g.beginPath(); g.ellipse(px, gy, r, r * 0.6, 0, 0, Math.PI * 2); g.fill(); g.restore();
        }
        if (s.layer !== layer && !s.split) continue;
      }
      const pop = s.pop ? 0.7 + 0.3 * Math.min(1, (now - s.start) / s.pop) : 1;
      const ang = s.angle + (s.spin ? (s.spin * (now - s.start)) / 1000 : 0);
      if (s.split) {   // v85: a metade de trás (acima do apoio) no chão, por baixo do boneco; a da frente por cima
        const cy = py + s.corte * T;   // v91: a linha do corte pode ficar acima do apoio (a cintura de quem a arte cobre)
        g.save(); g.beginPath();
        if (layer === 'ground') g.rect(-1e5, -1e5, 2e5, 1e5 + cy); else g.rect(-1e5, cy, 2e5, 1e5);
        g.clip();
      }
      const fr = s.split && layer === 'top' ? s.frente ?? FRENTE[baseDe(s.name)] ?? 1 : 1;   // a frente das bolhas, translúcida
      // v91: com `alto`, a escala sai da altura da imagem (a arte do tamanho do corpo, qualquer que seja a folha)
      const im = imgs[s.name], fm = FRAMES[s.name];
      const base = s.alto && im && fm && !fm.quadros ? (s.alto * im.width) / (im.height * fm.casas) : s.scale;
      const achata = s.sy !== 1;
      if (achata) { g.save(); g.translate(px, py); g.scale(1, s.sy); g.translate(-px, -py); }
      drawSprite(g, s.name, px, py, T, ang, base * (1 + s.grow * life) * pop, alpha * fr, s.flicker ? now : 0, s.len, ((now - s.start) * s.rate), s.apoio);
      if (achata) g.restore();
      if (s.split) g.restore();
    }
    this.list.length = alive;
    if (layer !== 'top') return;
    for (const [id, p] of this.shots) {
      if (now > p.until) { this.shots.delete(id); continue; }
      if (now < p.start) continue;   // v74: projétil com hora marcada (o meteoro cai no fim do aviso, a agulha sai da mão)
      const d = Math.min(p.range, (p.speed * Math.max(0, now - p.start)) / 1000);
      drawSprite(g, p.name, toX(p.x + p.fx * d), toY(p.y + p.fy * d), T, Math.atan2(p.fy, p.fx), 1, 1, now);
    }
  }
}

/** v79: desenha um quadro direto (o Golem desenhado no lugar do boneco de código). flip: vira para a esquerda. */
/** v86: o mesmo quadro na folha de outra direção (<id>_baixo_0N ou <id>_cima_0N), se ela já carregou; senão, o próprio. */
export function variante(name, dir) {
  if (!dir) return name;
  const alt = name.replace(/(_0\d\w?)$/, `_${dir}$1`);
  return alt !== name && imgs[alt] && FRAMES[alt] ? alt : name;
}

export function drawJutsuFrame(g, name, sx, sy, T, { scale = 1, alpha = 1, flip = false, dir = null } = {}) {
  // v86: dir 'baixo' ou 'cima': a invocação andando de frente ou de costas usa a folha daquela direção
  if (dir) { const alt = variante(name, dir); if (alt !== name) { name = alt; flip = false; } }
  if (!imgs[name] || !FRAMES[name]) return false;
  if (!flip) { drawSprite(g, name, sx, sy, T, 0, scale, alpha, 0); return true; }
  g.save(); g.translate(sx, sy); g.scale(-1, 1); drawSprite(g, name, 0, 0, T, 0, scale, alpha, 0); g.restore();
  return true;
}

/**
 * Um quadro. angle: para onde o golpe vai (radianos; a arte é girada a partir da direção em que foi desenhada).
 * flickerNow: > 0 faz o fogo "respirar" (escala e espelho a FLICKER_FPS), já que cada fase tem um quadro só.
 */
function drawSprite(g, name, sx, sy, T, angle, scale, alpha, flickerNow, len = 0, age = 0, apoio = null) {
  // v86: indo para baixo ou para cima, usa a folha desenhada naquela direção (<id>_baixo_0N, <id>_cima_0N), se existir,
  // em vez de deitar de lado a arte desenhada para a direita (o que tem volume: estaca, olho, chamas, onda)
  if (FRAMES[name]?.arte !== undefined && Math.abs(Math.sin(angle)) > 0.75) name = variante(name, Math.sin(angle) > 0 ? 'baixo' : 'cima');
  const img = imgs[name];
  const f = FRAMES[name];
  if (!img || !f || alpha <= 0) return;
  // v78: camada em grade: o quadro da hora (o laço repete; o resto para no último) e a grade da luz embaixo
  let src = null;
  if (f.quadros) {
    const n = Math.floor(Math.max(0, age) / f.ms), i = f.laco ? n % f.quadros : Math.min(f.quadros - 1, n);
    const [fw, fh] = f.quadro, rows = Math.ceil(f.quadros / f.cols);
    src = { x: (i % f.cols) * fw, y: Math.floor(i / f.cols) * fh, w: fw, h: fh, luz: rows * fh };
  }
  const iw = src ? src.w : img.width, ih = src ? src.h : img.height;
  const w = f.casas * T * scale;
  const k = w / iw;
  const h = ih * k;
  const [ax, ay] = apoio === 'base' ? [iw / 2, ih] : apoio === 'centro' ? [iw / 2, ih / 2] : f.ancora ?? [iw / 2, f.pe ? ih : ih / 2];   // v91
  let sxk = 1, syk = 1;
  if (flickerNow) {
    const step = Math.floor(flickerNow / (1000 / FLICKER_FPS));
    syk = 1 + ((step % 3) - 1) * 0.06;
    sxk = 1 - ((step % 3) - 1) * 0.03;
  }
  g.save();
  g.imageSmoothingEnabled = false;
  g.translate(sx, sy);
  if (f.arte !== undefined) {
    // v73: esticada no eixo da arte (o raio, a lança, o cometa vão até onde o golpe chega; a grossura fica)
    const stretch = len > 0 && f.eixoPx ? (len * T) / (f.eixoPx * k) : 1;
    g.rotate(angle);
    if (stretch !== 1) g.scale(stretch, 1);
    // apontando para a esquerda: espelha em vez de ficar de cabeça para baixo
    if (Math.cos(angle) < -0.01 && f.arte === 0) g.scale(1, -1);
    g.rotate(-f.arte);
  }
  g.scale(sxk, syk * (f.sy ?? 1));   // v78: f.sy estica na vertical os anéis de chão das camadas
  const pass = (mode, a, dy = 0) => {
    g.globalCompositeOperation = mode;
    g.globalAlpha = Math.min(1, a);
    if (src) g.drawImage(img, src.x, src.y + dy, src.w, src.h, -ax * k, -ay * k, w, h);
    else g.drawImage(img, -ax * k, -ay * k, w, h);
  };
  const a = alpha * (f.alpha ?? 1);
  if (src) {   // a cor por cima normal, a luz somada (clareia o chão, não suja)
    pass('source-over', a);
    if (f.luz) pass('lighter', a * f.luz, src.luz);
    g.restore();
    return;
  }
  if (f.blend === 'glow') { pass('source-over', a); pass('lighter', a * 0.35); }
  else if (f.blend === 'screen') pass('screen', a);
  else if (f.blend === 'lighter') pass('lighter', a);
  else pass('source-over', a);
  g.restore();
}
