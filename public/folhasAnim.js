/*
 * v80: as folhas do Victor da Água, da Sombra, do Taijutsu e o Sumidouro da Pedra (39 jutsus), tocadas pela FORMA do jutsu
 * no servidor: zona no chão (entra, fica girando enquanto dura, sai), anel em volta, projétil (sai da mão, voa, estoura),
 * linha até o alvo, investida/recuo (o rastro esticado do começo ao fim), escudo e buff no corpo, e as invocações.
 * Cada jutsu diz na tabela qual tipo usa e, quando precisa, os quadros de cada fase (o resto sai da ordem da folha).
 *
 * SÓ VISUAL, como o fogoAnim.js (que chama estas funções quando o jutsu não tem coreografia própria lá). Sem a folha
 * carregada nada toca e o jogo usa o desenho antigo.
 */
import { FRAMES, jutsuSpritesReady } from './vfxJutsus.js';

const ready = (s) => !!s && TIPO[s] !== undefined && jutsuSpritesReady(s);
const q = (i) => String(i).padStart(2, '0');
/** Os quadros da folha (01, 02...), na ordem. */
const quadros = (s) => [1, 2, 3, 4, 5, 6, 7, 8].map(q).filter((n) => FRAMES[`${s}_${n}`]);
const largura = (s, n) => FRAMES[`${s}_${n}`]?.casas ?? 1;
const hand = (msg, d = 0.35) => ({ x: msg.x + msg.fx * d, y: msg.y + msg.fy * d - 0.15 });

function seq(jfx, base, x, y, now, steps, common = {}) {
  for (const [n, at, ms, extra] of steps) jfx.show(`${base}_${n}`, x, y, now + at, ms, { fadeIn: 30, fadeOut: 70, ...common, ...(extra || {}) });
}
/** Os quadros um depois do outro (cada um `ms`), o último fica mais e apaga devagar. */
function corrida(fs, t0, ms, fim = 500, extra = {}) {
  return fs.map((n, i) => [n, t0 + i * ms * 0.9, i === fs.length - 1 ? fim : ms + 30, i === fs.length - 1 ? { ...extra, fadeOut: fim * 0.65 } : extra]);
}
/** Entra (intro), repete o meio (laço) até `ms` e sai (fim): zonas, escudos e buffs. */
function laco(intro, meio, fim, ms, passo = 360) {
  const st = [];
  let t = 0;
  for (const n of intro) { st.push([n, t, 170]); t += 150; }
  for (let i = 0; t < ms - 300; i++, t += passo) st.push([meio[i % meio.length], t, passo + 80]);
  fim.forEach((n, i) => st.push([n, Math.max(t, ms - 300) + i * 200, i === fim.length - 1 ? 650 : 240, i === fim.length - 1 ? { fadeOut: 450 } : {}]));
  return st;
}

/**
 * O tipo de cada jutsu e, quando a ordem da folha não basta, os quadros de cada fase.
 *   zona: ground (no chão), intro/meio/fim · anel: em volta de quem lançou · corpo: escudo/buff que acompanha
 *   proj: sai/voa/bate · linha: mão → alvo · rastro: investida ou recuo · alvo: em cima do alvo · cone · invoca · muro
 */
const TIPO = {
  stone_sumidouro: { t: 'zona', chao: true, intro: ['01', '02'], meio: ['03', '04', '05'], fim: ['06'] },
  water_xarope: { t: 'zona', chao: true, intro: ['01', '02'], meio: ['03', '04', '05'], fim: ['06'] },
  water_4: { t: 'zona', chao: true, intro: ['01', '02'], meio: ['03', '04', '05'], fim: ['06'] },
  water_nevoa: { t: 'zona', intro: ['01', '02'], meio: ['03', '04'], fim: ['05'] },
  shadow_armadilha: { t: 'zona', chao: true, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
  shadow_4: { t: 'zona', chao: true, intro: ['01', '02'], meio: ['03', '05'], fim: ['04', '06'] },
  shadow_mancha: { t: 'zona', chao: true, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
  water_2: { t: 'anel' }, water_onda: { t: 'anel' }, shadow_ciranda: { t: 'anel' }, taijutsu_2: { t: 'anel' },
  water_casulo: { t: 'corpo', intro: ['01', '02', '03', '04'], meio: ['05', '06'], fim: ['07', '08'], escudo: true },
  shadow_veu: { t: 'escudo', monta: ['01', '02', '03', '04', '05', '06'], quebra: ['07'] },
  taijutsu_folego: { t: 'corpo', intro: ['01', '02', '03'], meio: ['04', '05'], fim: ['06'] },
  water_dragao: { t: 'proj', sai: ['01'], voa: '03', bate: ['05', '06'] },
  water_tromba: { t: 'proj', sai: ['01', '02'], voa: '03', bate: ['05', '06'], chao: true },
  shadow_3: { t: 'proj', sai: ['01'], voa: '03', bate: ['05', '06'] },
  shadow_espinho: { t: 'proj', sai: ['01', '02'], voa: '03', bate: ['05', '06'] },
  water_gotas: { t: 'proj', sai: ['01', '02', '03'], gira: true, voa: '03b', bate: ['05b', '06b'] },
  shadow_2: { t: 'proj', sai: ['02', '03', '04'], gira: true, voa: '03b', bate: ['05b', '06b'] },
  water: { t: 'cone' }, taijutsu_rasteira: { t: 'cone' },
  water_3: { t: 'linha', mao: ['01', '02'], alvo: ['03', '04', '05', '06'], preso: 'rootMs' },
  water_laco: { t: 'laco' },
  shadow_beijo: { t: 'linha', mao: ['01'], estica: ['02', '03', '04', '05'], fimLinha: ['06'] },
  shadow: { t: 'prende' },
  water_lamina: { t: 'lamina' },
  shadow_mergulho: { t: 'rastro', saida: ['01', '02'], estica: ['03'], chegada: ['04', '05'], chao: ['06'] },
  shadow_recuo: { t: 'rastro', saida: ['01', '02'], estica: ['03', '04'], chegada: ['05'], recuo: true },
  taijutsu_esquiva: { t: 'rastro', saida: ['01'], estica: ['02', '03', '04'], chegada: ['05', '06'] },
  taijutsu: { t: 'rastro', saida: ['01'], estica: ['02', '03'], chegada: ['04', '05', '06'] },
  shadow_estrangular: { t: 'alvo' },
  shadow_troca: { t: 'entre' }, shadow_saltadora: { t: 'entre', mao: ['01'] },
  shadow_agarre: { t: 'agarre' },
  shadow_punho: { t: 'aviso', avisa: ['01', '02'], cai: ['03', '04'], bate: ['05', '06'] },
  water_clone: { t: 'invoca' }, shadow_sentinela: { t: 'invoca', sobe: ['01', '02', '03'] },
  water_muro: { t: 'muro' },
  // v81: o resto do Taijutsu e o Vento
  taijutsu_portoes: { t: 'corpo', pes: true, intro: ['01', '02', '03'], meio: ['04', '05'], fim: ['06'] },
  taijutsu_flecha: { t: 'rastro', saida: ['01'], estica: ['02', '03', '04'], chegada: ['05'], trilha: ['06'] },
  taijutsu_furia: { t: 'rastro', saida: ['01', '02'], estica: ['03', '04'], chegada: ['05', '06'] },
  taijutsu_4: { t: 'ao_longo', fr: [['01', 0.2], ['02', 0], ['03', 0], ['04', 0.35], ['05', 0.85], ['06', 0.85]] },
  taijutsu_queda: { t: 'aviso', avisa: ['01', '02'], cai: ['03', '04', '05'], bate: ['06', '07'] },
  wind: { t: 'cone', meio: ['01', '02', '03', '04', '05'], resto: ['06'] },
  wind_salto: { t: 'rastro', saida: ['01', '02'], estica: ['03', '04'], chegada: ['05'], chao: ['06'] },
  wind_shuriken: { t: 'proj', sai: ['01', '02'], voa: '03', bate: ['05', '06'] },
  wind_2: { t: 'proj', sai: ['01', '02', '03'], gira: true, voa: '04b', bate: ['05b', '06b'] },
  wind_veu: { t: 'corpo', escudo: true, intro: ['02', '03'], meio: ['04', '05'], fim: ['06'] },
  wind_espelho: { t: 'corpo', escudo: true, dur: 'reflectMs', intro: ['02', '03'], meio: ['03', '04'], fim: ['05', '06'] },
  wind_arco: { t: 'lamina', fixo: true },
  wind_leve: { t: 'corpo', chao: true, intro: ['01', '02', '03'], meio: ['03', '05'], fim: ['04', '06'] },
  wind_pulso: { t: 'anel' },
  wind_3: { t: 'aviso', avisa: ['01', '02'], cai: ['03', '04'], bate: ['05', '06'] },
  wind_asa: { t: 'rastro', saida: ['01', '02'], voa: '03', estica: [], chegada: ['05', '06'] },
  // v82: o resto do Vento e as Armas
  wind_vortice: { t: 'zona', chao: true, intro: ['01', '02'], meio: ['03', '04', '05'], fim: ['06'] },
  wind_cadeia: { t: 'entre', mao: ['01'] },
  wind_4: { t: 'proj', sai: ['01', '02'], voa: '04', bate: ['05', '06'] },
  wind_fenda: { t: 'ao_longo', fr: [['01', 0], ['02', 0.25], ['04', 0.45], ['03', 0.65], ['05', 0.8], ['06', 0.85]] },
  weapons: { t: 'proj', sai: ['01', '02'], voa: '04b', bate: ['05b', '07'] },
  weapons_multi: { t: 'proj', sai: ['01', '02'], voa: '03b', bate: ['05b', '06b'] },
  weapons_corte: { t: 'linha', mao: ['01'], estica: ['02', '03', '04'], fimLinha: ['05'] },
  weapons_pregos: { t: 'zona', chao: true, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
  weapons_peconha: { t: 'proj', sai: ['01', '02'], voa: '03', bate: ['05b', '06'] },
  weapons_2: { t: 'zona', intro: ['01', '02'], meio: ['03', '04', '05'], fim: ['06'] },
  weapons_gigante: { t: 'proj', sai: ['01', '02'], voa: '03', bate: ['02'] },
  weapons_serrilhada: { t: 'proj', sai: ['01', '02'], voa: '03', bate: ['05', '06'] },
  weapons_polida: { t: 'corpo', mao: true, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
  weapons_arco: { t: 'lamina', fixo: true },
  weapons_3: { t: 'rastro', saida: ['01', '02'], estica: ['03', '04'], chegada: ['05', '06'] },
  weapons_kunai: { t: 'aviso', ref: '05', avisa: ['01', '02'], cai: ['03'], bate: ['04', '05', '06'] },
  // v83: as Armas completas
  weapons_4: { t: 'zona', intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
  weapons_dragoes: { t: 'aviso', unico: true, avisa: ['01'], cai: ['02', '03', '04'], bate: ['05', '06'] },
  weapons_ceu: { t: 'chuva' },
  weapons_laco: { t: 'corrente' },
  weapons_arsenal: { t: 'invoca', circulo: '01' },
};
/** Avisos que vêm em ondas no mesmo lugar (a Ascensão Dupla): o desenho toca uma vez só. */
const ONDA = new Map();

/** O jutsu tem a folha desta leva (para o fogoAnim saber se chama). */
export const folhaPronta = ready;

/** O lançamento (mensagem `cast`). */
export function folhaCast(jfx, msg, info, lineEnd, now, follow, whoAt = () => null, near = () => []) {
  const s = msg.skill;
  if (!ready(s)) return false;
  const k = TIPO[s], fs = quadros(s);
  const angle = Math.atan2(msg.fy, msg.fx);
  const h = hand(msg);
  const end = msg.tx !== undefined ? { x: msg.tx, y: msg.ty } : { x: lineEnd.tx, y: lineEnd.ty };
  const d = Math.max(0.6, Math.hypot(end.x - h.x, end.y - h.y));
  const a = Math.atan2(end.y - h.y, end.x - h.x);
  const me = { follow: () => follow(msg.playerId) };
  switch (k.t) {
    case 'zona': case 'invoca': case 'muro':
      // o desenho vem com a `ground`, a `summon` ou a `barrier`; aqui só a sentinela sobe do círculo de runas
      if (k.circulo) {   // o círculo de invocação no chão, girando devagar, onde a invocação aparece
        const p = { x: msg.x + msg.fx * 1.5, y: msg.y + msg.fy * 1.5 };
        seq(jfx, s, p.x, p.y + 0.2, now, [[k.circulo, 0, 1400, { layer: 'ground', fadeIn: 200, fadeOut: 600, scale: 2.6 / largura(s, k.circulo), grow: 0.15 }]]);
      }
      if (k.sobe) {
        const p = { x: msg.x + msg.fx * 1.5, y: msg.y + msg.fy * 1.5 };
        seq(jfx, s, p.x, p.y + 0.3, now, corrida(k.sobe, 0, 220, 380), { scale: 0.9 });
      }
      return true;
    case 'anel': {
      const r = info.radius ?? 2;
      const sc = (2 * r) / Math.max(...fs.map((n) => largura(s, n)));   // o maior quadro do tamanho da área
      seq(jfx, s, msg.x, msg.y + 0.1, now, corrida(fs, 0, 120, 600), { scale: sc });
      return true;
    }
    case 'corpo': {
      const dur = info[k.dur ?? 'durationMs'] ?? 4000, tag = `folha:${s}:${msg.playerId}`;
      jfx.drop(tag);
      // escudo: em volta do corpo; pes: a aura sobe dos pés (o apoio é a base do desenho); chao: o redemoinho deitado no chão
      const y = k.escudo ? -0.5 : k.pes ? 0.32 : k.chao ? 0.15 : -0.35;
      const extra = k.escudo || k.pes ? {} : k.chao ? { layer: 'ground' } : k.mao ? {} : { scale: 1.1, alpha: 0.85 };
      seq(jfx, s, k.mao ? msg.fx * 0.4 : 0, k.mao ? -0.35 : y, now, laco(k.intro, k.meio, k.fim, dur), { ...me, tag, ...extra });
      return true;
    }
    case 'escudo': {
      const tag = `escudo:${msg.playerId}`;
      jfx.drop(tag);
      ESCUDO.set(msg.playerId, s);
      // o escudo fica (no último quadro) até um golpe bater nele, ou some sozinho em 10 s
      seq(jfx, s, 0, -0.5, now, corrida(k.monta, 0, 150, 10_000), { ...me, tag });
      return true;
    }
    case 'proj':
      seq(jfx, s, h.x, h.y - 0.05, now, corrida(k.sai, 0, 90, 140), k.gira ? { angle, scale: 0.7 } : { scale: 0.7 });
      return true;
    case 'cone': {
      const range = info.range ?? 3;
      const meio = k.meio ?? fs.slice(0, 4), resto = k.resto ?? fs.slice(4);
      const sc = range / largura(s, meio[meio.length - 1]);
      seq(jfx, s, h.x, h.y, now, corrida(meio, 0, 110, 220), { angle, scale: s === 'water' || s === 'wind' ? sc : Math.max(0.6, sc * 0.6) });
      const p = { x: h.x + msg.fx * range * 0.7, y: h.y + msg.fy * range * 0.7 + 0.1 };
      seq(jfx, s, p.x, p.y, now, corrida(resto, 420, 150, 600), { scale: 0.7 });
      return true;
    }
    case 'linha': {
      // sem `estica`, os quadros da mão são o jato inteiro: a ponta (o apoio) fica no alvo e ele estica até a mão
      if (k.estica) seq(jfx, s, h.x, h.y, now, corrida(k.mao, 0, 110, 160));
      else seq(jfx, s, end.x, end.y - 0.3, now, corrida(k.mao, 0, 110, 160, { angle: a, len: d }));
      if (k.estica) seq(jfx, s, end.x, end.y - 0.3, now, corrida(k.estica, 120, 110, 220, { angle: a, len: d }));
      if (k.fimLinha) seq(jfx, s, end.x, end.y - 0.3, now, corrida(k.fimLinha, 560, 150, 500));
      if (k.alvo) {
        const id = whoAt(end.x, end.y), hold = info[k.preso] ?? 1600;
        const o = id ? { follow: () => follow(id), tag: `preso:${id}` } : {};
        const x0 = id ? 0 : end.x, y0 = id ? -0.45 : end.y - 0.45;
        const [entra, ...fica] = k.alvo;
        const st = [[entra, 220, 200]];
        for (let t = 400, i = 0; t < 220 + hold; t += 380, i++) st.push([fica[i % (fica.length - 1)], t, 440]);
        st.push([fica[fica.length - 1], 220 + hold, 520, { fadeOut: 360 }]);
        seq(jfx, s, x0, y0, now, st, { ...o, scale: 0.8 });
      }
      return true;
    }
    case 'laco': {   // Laço da Correnteza: o redemoinho na mão, o jato até o alvo, enrola nele, puxa de volta e espirra na chegada
      seq(jfx, s, h.x, h.y - 0.2, now, [['01', 0, 120, { scale: 0.45 }], ['02', 100, 120, { scale: 0.45 }]]);
      seq(jfx, s, end.x, end.y - 0.3, now, [['03', 200, 160, { angle: a, len: d }], ['04', 340, 240, { scale: 0.7 }]]);
      seq(jfx, s, h.x + msg.fx * 0.6, h.y + msg.fy * 0.6, now, [['05', 560, 220, { angle: a + Math.PI, len: d }]]);
      seq(jfx, s, h.x + msg.fx * 0.8, h.y + msg.fy * 0.8 + 0.2, now, [['06', 760, 600, { scale: 0.6, fadeOut: 400 }]]);
      return true;
    }
    case 'prende': {   // Sombra: a mancha nos pés, a sombra corre até o alvo, a espiral, os espinhos o prendem e a mancha fica
      seq(jfx, s, msg.x, msg.y + 0.3, now, [['01', 0, 160, { layer: 'ground', scale: 0.6 }], ['02', 120, 220, { angle: a, len: d, layer: 'ground' }]]);
      const id = msg.tx !== undefined ? whoAt(end.x, end.y) : null;
      const o = id ? { follow: () => follow(id) } : {};
      seq(jfx, s, id ? 0 : end.x, id ? 0.25 : end.y + 0.25, now, [['03', 320, 220, { layer: 'ground' }], ['04', 520, 360], ['05', 860, 700],
        ['06', 1540, 700, { layer: 'ground', fadeOut: 500 }]], { ...o, scale: 0.7 });
      return true;
    }
    case 'lamina': {   // Lâmina d'Água: o fio na mão, a lâmina corre a faixa até o fim, bate, e as gotas caem lá
      const n = ['02', '03', '04', '05'], w = (info.radius ?? 1.5) * 2;
      seq(jfx, s, h.x, h.y, now, [['01', 0, 140, { angle: a, len: Math.min(d, 2) }]]);
      n.forEach((f, i) => {
        const t = (i + 1) / n.length;
        seq(jfx, s, h.x + (end.x - h.x) * t, h.y + (end.y - h.y) * t, now, [[f, 100 + i * 90, 130, { angle: a, scale: k.fixo ? 1 : w / largura(s, f) }]]);
      });
      seq(jfx, s, end.x, end.y - 0.2, now, [['06', 520, 600, { fadeOut: 400 }]]);
      return true;
    }
    case 'rastro': {   // investida ou recuo: a saída, o rastro esticado do começo ao fim e a chegada
      const dist = Math.abs(info.dash ?? info.range ?? 3);
      const fim = msg.tx !== undefined && !k.recuo ? end : { x: msg.x + msg.fx * dist * (k.recuo ? -1 : 1), y: msg.y + msg.fy * dist * (k.recuo ? -1 : 1) };
      const dd = Math.max(0.6, Math.hypot(fim.x - msg.x, fim.y - msg.y)), aa = Math.atan2(fim.y - msg.y, fim.x - msg.x);
      seq(jfx, s, msg.x, msg.y + 0.2, now, corrida(k.saida, 0, 110, 260), { layer: 'ground', scale: 0.7 });
      k.estica.forEach((f, i) => {
        const pe = FRAMES[`${s}_${f}`]?.ancora && FRAMES[`${s}_${f}`].ancora[0] === 0;   // apoio na esquerda: o começo do rastro
        const p = pe ? msg : fim;
        seq(jfx, s, p.x, p.y - 0.1, now, [[f, 160 + i * 100, 140, { angle: aa, len: dd }]]);
      });
      let t1 = 160 + k.estica.length * 100;
      if (k.voa) {   // o desenho voa inteiro do começo ao fim (a ave da Asa Cortante), sem esticar
        const v = 22, voo = (dd / v) * 1000;
        jfx.launch(`folha:${s}:${msg.playerId}:${now}`, `${s}_${k.voa}`, msg.x, msg.y - 0.3, Math.cos(aa), Math.sin(aa), v, dd, now + 140, 60);
        t1 = 140 + voo;
      }
      seq(jfx, s, fim.x, fim.y - 0.1, now, corrida(k.chegada, t1, 150, 500), { scale: 0.7 });
      if (k.trilha) seq(jfx, s, fim.x, fim.y + 0.15, now, corrida(k.trilha, t1 + 120, 200, 900, { angle: aa, len: dd, layer: 'ground' }));
      if (k.chao) seq(jfx, s, fim.x, fim.y + 0.2, now, corrida(k.chao, 520 + k.chegada.length * 130, 200, 900), { layer: 'ground', scale: 0.7 });
      return true;
    }
    case 'chuva': {   // Céu de Lâminas: a folha inteira tem os 5 alvos: toca uma vez no centro da área, no tempo dos avisos
      if (msg.tx === undefined) return false;
      const sc = (2 * (info.radius ?? 4) * 0.8) / largura(s, '01'), d0 = info.durationMs ?? 800;
      seq(jfx, s, msg.tx, msg.ty, now, [['01', 0, d0 * 0.5, { layer: 'ground', fadeIn: 120 }], ['02', d0 * 0.45, d0 * 0.45, { layer: 'ground' }],
        ['03', d0 * 0.8, 160], ['04', d0 * 0.95, 180], ['05', d0 + 120, 500], ['06', d0 + 600, 900, { fadeOut: 600 }]], { scale: sc });
      return true;
    }
    case 'corrente': {   // Laço de Ferro: a corrente enrolada na mão, voa, prende os alvos (esticada até eles), brilha, quebra e cai
      const hit = near(h.x, h.y, end.x, end.y, 1.2, [msg.playerId]).slice(0, info.targets ?? 2);
      const alvo = hit.length ? hit.map((id) => follow(id)).filter(Boolean) : [end];
      const c = { x: alvo.reduce((t, p) => t + p.x, 0) / alvo.length, y: alvo.reduce((t, p) => t + p.y, 0) / alvo.length - 0.3 };
      const dd = Math.max(0.8, Math.hypot(c.x - h.x, c.y - h.y)), aa = Math.atan2(c.y - h.y, c.x - h.x), hold = info.rootMs ?? 1300;
      seq(jfx, s, h.x, h.y - 0.1, now, [['01', 0, 160, { scale: 0.5 }], ['02', 130, 160, { angle: aa, scale: 0.6 }]]);
      const st = [['03', 280, 220, { angle: aa, len: dd }]];
      for (let t = 480, i = 0; t < 280 + hold; t += 260, i++) st.push([i % 2 ? '03' : '04', t, 300, { angle: aa, len: dd }]);
      seq(jfx, s, h.x, h.y - 0.1, now, st);
      seq(jfx, s, c.x, c.y, now, [['05', 280 + hold, 260, { scale: 0.6 }], ['06', 520 + hold, 700, { scale: 0.6, fadeOut: 450 }]]);
      return true;
    }
    case 'ao_longo': {   // os quadros em pontos do caminho até o alcance (o Punho do Céu: o soco sai da mão e estoura na ponta)
      const range = info.range ?? 3, a0 = angle;
      k.fr.forEach(([f, p], i) => {
        const x = h.x + msg.fx * range * p, y = h.y + msg.fy * range * p;
        seq(jfx, s, x, y, now, [[f, i * 110, i === k.fr.length - 1 ? 500 : 150, i === k.fr.length - 1 ? { fadeOut: 330 } : {}]], { angle: FRAMES[`${s}_${f}`]?.arte !== undefined ? a0 : 0, scale: 1.3 });
      });
      return true;
    }
    case 'alvo': {
      const id = msg.tx !== undefined ? whoAt(end.x, end.y) : null;
      const o = id ? { follow: () => follow(id) } : {};
      seq(jfx, s, id ? 0 : end.x, id ? -0.45 : end.y - 0.45, now, corrida(fs, 0, 170, 500), { ...o, scale: 0.7 });
      return true;
    }
    case 'entre': {   // Passo Trocado e Sombra Saltadora: o desenho tem as duas pontas: vai de quem lançou até o alvo
      if (k.mao) seq(jfx, s, h.x, h.y - 0.1, now, [[k.mao[0], 0, 140, { scale: 0.5 }]]);
      const resto = fs.filter((f) => !(k.mao || []).includes(f));
      const mid = { x: (msg.x + end.x) / 2, y: (msg.y + end.y) / 2 - 0.2 };
      const dm = Math.max(1, Math.hypot(end.x - msg.x, end.y - msg.y));
      seq(jfx, s, mid.x, mid.y, now, corrida(resto, k.mao ? 120 : 0, 170, 600), { angle: Math.atan2(end.y - msg.y, end.x - msg.x), scale: dm / (largura(s, resto[1]) * 0.72) });
      return true;
    }
    case 'agarre': {   // Rede de Sombra: a ponta sai da mão, a rede abre e cai nos alvos, segura enquanto prende e se desfaz
      const hit = near(h.x, h.y, end.x, end.y, 1.2, [msg.playerId]).slice(0, info.targets ?? 2);
      seq(jfx, s, h.x, h.y, now, [['01', 0, 200, { scale: 0.6 }]]);
      const hold = info.rootMs ?? 1600;
      const alvos = hit.length ? hit : [null];
      for (const id of alvos) {
        const o = id ? { follow: () => follow(id), tag: `rede:${id}` } : {};
        const x0 = id ? 0 : end.x, y0 = id ? -0.4 : end.y - 0.4;
        const st = [['02', 160, 160], ['03', 300, 180]];
        for (let t = 460, i = 0; t < 460 + hold; t += 300, i++) st.push([i % 2 ? '05' : '04', t, 340]);
        st.push(['06', 460 + hold, 600, { fadeOut: 420 }]);
        seq(jfx, s, x0, y0, now, st, { ...o, scale: 0.9 });
      }
      return true;
    }
    default:
      return false;
  }
}

/** O projétil que voa (ou null). */
export function folhaProjetil(msg) {
  const k = TIPO[msg.skill];
  return k?.t === 'proj' && ready(msg.skill) && FRAMES[`${msg.skill}_${k.voa}`] ? `${msg.skill}_${k.voa}` : null;
}

/** O projétil bateu. */
export function folhaImpacto(jfx, msg, skill, now) {
  const k = TIPO[skill];
  if (k?.t !== 'proj' || !ready(skill)) return false;
  const sc = msg.r > 0 ? Math.max(0.6, (2 * msg.r) / largura(skill, k.bate[0])) : 0.7;
  seq(jfx, skill, msg.x, msg.y - (k.chao ? 0 : 0.3), now, corrida(k.bate, 0, 200, 600), { scale: sc });
  return true;
}

/** Zona e aviso no chão (mensagem `ground`). */
export function folhaChao(jfx, msg, now, follow = () => null) {
  const s = msg.skill, k = TIPO[s];
  if (!ready(s)) return false;
  const r = msg.r ?? 2, ms = msg.ms ?? 3000;
  if (k.t === 'zona' && msg.kind !== 'aviso') {
    const fs = quadros(s);
    const sc = (2 * r) / largura(s, k.meio[0] ?? fs[2]);
    const o = msg.follow ? { follow: () => follow(msg.follow) } : {};
    const x0 = msg.follow ? 0 : msg.x, y0 = msg.follow ? 0 : msg.y;
    seq(jfx, s, x0, y0, now, laco(k.intro, k.meio, k.fim, ms), { ...o, scale: sc, tag: `zona:${msg.id}`, ...(k.chao ? { layer: 'ground' } : {}) });
    return true;
  }
  if (k.t === 'chuva') return msg.kind === 'aviso';   // o desenho veio no lançamento
  if (k.t === 'aviso' && msg.kind === 'aviso' && k.unico) {
    const key = `${s}:${Math.round(msg.x * 2)}:${Math.round(msg.y * 2)}`;
    if (now - (ONDA.get(key) ?? -1e9) < 2500) return true;
    ONDA.set(key, now);
  }
  if (k.t === 'aviso' && msg.kind === 'aviso') {   // o aviso no chão, a queda no fim (o punho, o meteoro, o tornado), o golpe e o rastro
    const sc = (2 * r) / largura(s, k.ref ?? k.avisa[0]);   // ref: o quadro do anel (o tamanho da área)
    const st = [[k.avisa[0], 0, ms * 0.55, { layer: 'ground', fadeIn: 120 }]];
    k.avisa.slice(1).forEach((f, i) => st.push([f, ms * (0.45 + i * 0.1), ms * 0.55 - i * ms * 0.1, { layer: 'ground' }]));
    const queda = Math.min(360, ms * 0.6);
    k.cai.forEach((f, i) => st.push([f, ms - queda + (i * queda) / k.cai.length, queda / k.cai.length + 40]));
    k.bate.forEach((f, i) => st.push([f, ms + i * 300, i === k.bate.length - 1 ? 900 : 340, i === k.bate.length - 1 ? { fadeOut: 600 } : {}]));
    seq(jfx, s, msg.x, msg.y, now, st, { scale: sc });
    return true;
  }
  return false;
}

/** v80: o Muro de Água (mensagem `barrier`, kind 'agua'): a gota, o jato sobe, o muro fica até o fim. */
export function folhaMuro(jfx, msg, now) {
  if (msg.kind !== 'agua' || !jutsuSpritesReady('water_muro')) return false;
  const len = Math.max(msg.w, msg.h), cx = msg.x + msg.w / 2, cy = msg.y + msg.h / 2;
  const angle = msg.w >= msg.h ? 0 : Math.PI / 2, sc = len / largura('water_muro', '03');
  const ms = msg.ms ?? 3000;
  seq(jfx, 'water_muro', cx, cy, now, [['01', 0, 140, { scale: 0.8, angle: 0 }], ['02', 120, 160, { scale: 0.8, angle: 0 }]]);
  const st = [];
  for (let t = 260, i = 0; t < ms - 150; t += 320, i++) st.push([['03', '04', '05', '04'][i % 4], t, 360]);
  seq(jfx, 'water_muro', cx, cy, now, st, { angle, scale: sc, tag: `muroAgua:${msg.id}` });
  return true;
}
export function folhaMuroFim(jfx, b, now) {
  if (!b || b.kind !== 'agua' || !jutsuSpritesReady('water_muro')) return false;
  jfx.drop(`muroAgua:${b.id}`);
  seq(jfx, 'water_muro', b.x + b.w / 2, b.y + b.h / 2, now, [['06', 0, 700, { fadeOut: 450, scale: Math.max(b.w, b.h) / largura('water_muro', '06') }]]);
  return true;
}

/** Escudos desta leva quebrando no golpe (o Véu Sombrio se desfaz em pó). */
const ESCUDO = new Map();
export function folhaEscudoHit(jfx, id, now, follow) {
  const s = ESCUDO.get(id);
  if (!s || !ready(s)) return false;
  ESCUDO.delete(id);
  jfx.drop(`escudo:${id}`);
  seq(jfx, s, 0, -0.5, now, TIPO[s].quebra.map((n, i) => [n, i * 120, 650, { fadeOut: 450 }]), { follow: () => follow(id) });
  return true;
}

/** Invocações desenhadas: o quadro parado e o do golpe (o desenho de código fica de reserva). */
export const SUMMON_FRAMES = {
  clone_agua: { skill: 'water_clone', parado: 'water_clone_01', golpe: 'water_clone_01' },
  sentinela_sombra: { skill: 'shadow_sentinela', parado: 'shadow_sentinela_04', golpe: 'shadow_sentinela_05', some: 'shadow_sentinela_06' },
};
export const summonFrames = (kind) => (SUMMON_FRAMES[kind] && jutsuSpritesReady(SUMMON_FRAMES[kind].skill) ? SUMMON_FRAMES[kind] : null);
