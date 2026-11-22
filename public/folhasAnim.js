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
/** v86: rajada de golpes (Cem Golpes, Punho do Céu): [desvio, escala] de cada soco, fixos para a captura sair igual. */
const JIT = [[-0.5, 0.9], [0.4, 1], [-0.1, 0.85], [0.55, 0.95], [-0.35, 1.05], [0.15, 0.9], [-0.55, 1], [0.3, 0.88]];
/** v86: com a folha de rajada desenhada (<id>_rajada, os punhos), o laço usa os quadros dela; senão, os da folha base. */
const rajadaDe = (s, fr) => (jutsuSpritesReady(`${s}_rajada`) ? ['01', '02', '03', '04', '05', '06'].map((n) => `rajada_${n}`).filter((n) => FRAMES[`${s}_${n}`]) : fr);
/** Os quadros um depois do outro (cada um `ms`), o último fica mais e apaga devagar. */
function corrida(fs, t0, ms, fim = 500, extra = {}) {
  return fs.map((n, i) => [n, t0 + i * ms * 0.9, i === fs.length - 1 ? fim : ms + 30, i === fs.length - 1 ? { ...extra, fadeOut: fim * 0.65 } : i === 0 ? { pop: 90, ...extra } : extra]);   // v85: o 1º entra crescendo
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
  stone_sumidouro: { t: 'zona', gira: 0.8, chao: true, intro: ['01', '02'], meio: ['03', '04', '05'], fim: ['06'] },
  water_xarope: { t: 'zona', chao: true, intro: ['01', '02'], meio: ['03', '04', '05'], fim: ['06'] },
  water_4: { t: 'zona', gira: 1.2, chao: true, intro: ['01', '02'], meio: ['03', '04', '05'], fim: ['06'] },
  water_nevoa: { t: 'zona', intro: ['01', '02'], meio: ['03', '04'], fim: ['05'] },
  shadow_armadilha: { t: 'zona', chao: true, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
  shadow_4: { t: 'zona', chao: true, intro: ['01', '02'], meio: ['03', '05'], fim: ['04', '06'] },
  shadow_mancha: { t: 'zona', chao: true, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
  water_2: { t: 'anel' }, water_onda: { t: 'anel' }, shadow_ciranda: { t: 'anel' }, taijutsu_2: { t: 'anel' },
  water_casulo: { t: 'corpo', lugar: 'corpo', alpha: 0.62, alto: 1.5, intro: ['01', '02', '03', '04'], meio: ['05', '06'], fim: ['07', '08'] },
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
  taijutsu_4: { t: 'ao_longo', fr: [['01', 0.2], ['02', 0], ['03', 0], ['04', 0.35], ['05', 0.85], ['06', 0.85]], rajada: { fr: ['03', '04'], n: 6, ms: 75, p: 0.4 } },
  taijutsu_queda: { t: 'aviso', avisa: ['01', '02'], cai: ['03', '04', '05'], bate: ['06', '07'] },
  wind: { t: 'cone', meio: ['01', '02', '03', '04', '05'], resto: ['06'] },
  wind_salto: { t: 'rastro', saida: ['01', '02'], estica: ['03', '04'], chegada: ['05'], chao: ['06'] },
  wind_shuriken: { t: 'proj', sai: ['01', '02'], voa: '03', bate: ['05', '06'] },
  wind_2: { t: 'proj', sai: ['01', '02', '03'], gira: true, voa: '04b', bate: ['05b', '06b'] },
  wind_veu: { t: 'corpo', gira: 1.5, escudo: true, intro: ['02', '03'], meio: ['04', '05'], fim: ['06'] },
  wind_espelho: { t: 'corpo', escudo: true, dur: 'reflectMs', intro: ['02', '03'], meio: ['03', '04'], fim: ['05', '06'] },
  wind_arco: { t: 'lamina', fixo: true },
  wind_leve: { t: 'corpo', chao: true, intro: ['01', '02', '03'], meio: ['03', '05'], fim: ['04', '06'] },
  wind_pulso: { t: 'anel' },
  wind_3: { t: 'aviso', avisa: ['01', '02'], cai: ['03', '04'], bate: ['05', '06'] },
  wind_asa: { t: 'rastro', saida: ['01', '02'], voa: '03', estica: [], chegada: ['05', '06'] },
  // v82: o resto do Vento e as Armas
  wind_vortice: { t: 'zona', gira: 1.6, chao: true, intro: ['01', '02'], meio: ['03', '04', '05'], fim: ['06'] },
  wind_cadeia: { t: 'entre', mao: ['01'] },
  wind_4: { t: 'proj', sai: ['01', '02'], voa: '04', bate: ['05', '06'] },
  wind_fenda: { t: 'ao_longo', fr: [['01', 0], ['02', 0.25], ['04', 0.45], ['03', 0.65], ['05', 0.8], ['06', 0.85]] },
  weapons: { t: 'proj', sai: ['01', '02'], voa: '04b', bate: ['05b', '07'] },
  weapons_multi: { t: 'proj', sai: ['01', '02'], voa: '03b', bate: ['05b', '06b'] },
  weapons_corte: { t: 'linha', mao: ['01'], estica: ['02', '03', '04'], fimLinha: ['05'] },
  weapons_pregos: { t: 'zona', chao: true, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
  weapons_peconha: { t: 'proj', sai: ['01', '02'], voa: '03', bate: ['05b', '06'] },
  weapons_2: { t: 'zona', gira: 2.5, intro: ['01', '02'], meio: ['03', '04', '05'], fim: ['06'] },
  weapons_gigante: { t: 'proj', sai: ['01', '02'], voa: '03', bate: ['02'] },
  weapons_serrilhada: { t: 'proj', sai: ['01', '02'], voa: '03', bate: ['05', '06'] },
  weapons_polida: { t: 'corpo', mao: true, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
  weapons_arco: { t: 'lamina', fixo: true },
  weapons_3: { t: 'rastro', saida: ['01', '02'], estica: ['03', '04'], chegada: ['05', '06'] },
  weapons_kunai: { t: 'aviso', ref: '05', avisa: ['01', '02'], cai: ['03'], bate: ['04', '05', '06'] },
  // v83: as Armas completas
  weapons_4: { t: 'zona', gira: 3, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
  weapons_dragoes: { t: 'aviso', unico: true, avisa: ['01'], cai: ['02', '03', '04'], bate: ['05', '06'], bateEscala: 0.7 },   // as lâminas passavam 57% da área
  weapons_ceu: { t: 'chuva' },
  weapons_laco: { t: 'corrente' },
  weapons_arsenal: { t: 'invoca', circulo: '01' },
  // v84: mais do Taijutsu e o Olho da Tempestade
  taijutsu_3: { t: 'cone', meio: ['01', '02', '03', '04', '05'], resto: ['06'], rajada: { fr: ['02', '03'], n: 8, ms: 65 } },   // v86: a rajada de socos
  taijutsu_pressao: { t: 'proj', sai: ['01', '02'], voa: '03', bate: ['05'] },
  taijutsu_bloqueio: { t: 'escudo', curto: true, monta: ['01'], quebra: ['01'] },
  taijutsu_ascendente: { t: 'rastro', saida: ['01'], estica: [], chegada: ['02', '03', '04', '05', '06'] },
  wind_olho: { t: 'corpo', gira: 2, escudo: true, intro: ['01', '02', '03'], meio: ['04', '05'], fim: [], golpe: ['07', '08'] },   // o 06 tem duas espirais cortadas pela divisória da folha
  // v88: a Ilusão (as 15 primeiras folhas; a Estaca tem também a folha para baixo)
  illusion: { t: 'anel', chao: true, gira: 2.2 },
  illusion_coro: { t: 'anel', chao: true },
  illusion_2: { t: 'linha', mao: ['01'], estica: ['02', '03', '04', '05', '06'] },
  illusion_estaca: { t: 'linha', mao: ['01'], estica: ['02', '03', '04', '05', '06'] },
  illusion_ninar: { t: 'linha', mao: ['01'], estica: ['02', '03', '04', '05', '06'] },
  // o cliente não recebe a duração dos efeitos (só durationMs): ms = a do servidor (rootMs, darkMs, invertMs)
  illusion_3: { t: 'alvo', ms: 1900, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
  illusion_noite: { t: 'alvo', ms: 3000, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
  illusion_espelho: { t: 'alvo', ms: 1300, esc: 0.95, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
  illusion_kai: { t: 'corpo', escudo: true, ms: 1100, intro: ['01', '02', '03'], meio: ['04'], fim: ['05', '06'] },
  illusion_templo: { t: 'zona', chao: true, intro: ['01', '02'], meio: ['03', '04', '05'], fim: ['06'] },
  illusion_veu: { t: 'zona', intro: ['01', '02'], meio: ['03', '04', '05'], fim: ['06'] },
  illusion_olho: { t: 'proj', sai: ['01'], voa: '03', bate: ['05', '06'] },
  illusion_passo: { t: 'rastro', recuo: true, saida: ['01'], estica: ['02', '03'], chegada: ['04', '05', '06'] },
  illusion_colapso: { t: 'aviso', ref: '01', avisa: ['01'], cai: ['02', '03'], bate: ['04', '05', '06'] },
  illusion_reflexo: { t: 'invoca', sobe: ['01', '02', '03', '04', '05', '06'] },
  // v89: o Clã Rubro completo, 3 do Clã Umbra, e mais Água, Taijutsu, Vento e Cura
  rubro_olho: { t: 'escudo', cabeca: true, monta: ['01', '02', '03', '04'], quebra: ['05', '06'] },
  rubro_transe: { t: 'linha', mao: ['01'], estica: ['02', '03', '04', '05', '06'] },
  rubro_chamas: { t: 'linha', mao: [], estica: ['01', '02', '03', '04', '05', '06'] },
  rubro_lua: { t: 'linha', mao: ['01'], estica: ['02', '03', '04', '05', '06'] },
  rubro_guardiao: { t: 'corpo', lugar: 'torso', alto: 0.62, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
  // o colosso fica atrás do ninja (apoio nos pés) e, no fim, corta à frente e se desfaz
  rubro_completo: { t: 'corpo', pes: true, intro: ['01', '02'], meio: ['03', '04'], fim: [], golpe: ['05', '06'] },
  umbra_deslize: { t: 'rastro', saida: ['01'], estica: ['02', '03'], chegada: ['04', '05', '06'] },
  umbra_faminta: { t: 'alvo', cabeca: true, ms: 6000, esc: 0.6, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },   // markMs
  umbra_noite: { t: 'zona', chao: true, gira: 0.6, sy: 0.6, intro: ['01', '02'], meio: ['03', '04', '05'], fim: ['06'] },
  water_corpo: { t: 'corpo', escudo: true, intro: ['01'], meio: ['02', '03', '04'], fim: [], golpe: ['05', '06'] },
  water_coluna: { t: 'aviso', ref: '01', avisa: ['01'], cai: ['02', '03'], bate: ['04', '05', '06'] },
  wind_milcortes: { t: 'aviso', ref: '04', avisa: ['01'], cai: ['02', '03'], bate: ['04', '05', '06'] },   // uma lâmina por golpe
  taijutsu_impacto: { t: 'anel', chao: true },
  taijutsu_chave: { t: 'alvo', ms: 1300, esc: 0.55, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },   // rootMs
  // o F1 da folha traz um ninja desenhado: fica de fora (o jogo já desenha o boneco)
  taijutsu_lotus: { t: 'rastro', saida: ['02'], estica: [], chegada: ['03', '04', '05', '06'] },
  heal_aura: { t: 'zona', lugar: 'pes', submerso: true, alpha: 0.6, piso: ['rgba(100, 225, 115, 0.58)', 0.97, 0.3, -0.05],   // v94: o chão de dentro verde
  intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
  // v90: os clãs Bastião, Áspide, Garra e Zéfiro, a Forma Umbral, a Faísca Rasante, o Esmagamento, a Segunda Voz e o Empréstimo
  lightning: { t: 'linha', mao: ['01'], estica: ['02', '03', '04', '05', '06'] },
  stone_3: { t: 'alvo', ms: 1600, esc: 1.1, intro: ['01', '02', '03'], meio: ['04', '05'], fim: ['06'] },   // rootMs
  illusion_voz: { t: 'invoca', sobe: ['01', '02', '03', '04'] },   // o clone é o próprio boneco (como o Reflexo)
  illusion_emprestimo: { t: 'alvo', ms: 1200, esc: 0.75, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
  // v94 (pedido do Victor, 22/11): a Forma Umbral na altura dos pés (o redemoinho em volta deles), opaca: a parte clara saiu
  umbra_forma: { t: 'corpo', lugar: 'pes', largura: 1.7, sy: 0.62, gira: 0, ms: 5000, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
  bastiao_muralha: { t: 'corpo', lugar: 'corpo', tras: true, alto: 1.2, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
  bastiao_guarda: { t: 'corpo', lugar: 'corpo', tras: true, corte: -0.69, alpha: 0.8, alto: 1.5, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
  bastiao_resposta: { t: 'corpo', lugar: 'pes', y: 0.34, largura: 1.6, dur: 'durationMs', intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
  bastiao_juramento: { t: 'corpo', pes: true, ms: 10_000, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },   // os escudos atrás do ninja
  aspide_cuspe: { t: 'proj', sai: ['01'], voa: '02', bate: ['05', '06'] },
  aspide_nevoa: { t: 'zona', intro: ['01', '02'], meio: ['03', '04', '05'], fim: ['06'] },
  aspide_constricao: { t: 'alvo', ms: 1500, esc: 0.75, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },   // rootMs
  aspide_ninho: { t: 'invoca', circulo: '01' },   // as serpentes da folha vieram com um quadrado de grama embaixo: ficam as de código
  garra_matilha: { t: 'invoca', sobe: ['01'] },
  garra_rei: { t: 'invoca', sobe: ['01'] },
  garra_uivo: { t: 'linha', mao: [], estica: ['01', '02', '03', '04', '05', '06'] },
  garra_troca: { t: 'clan' }, zefiro_eco: { t: 'clan' }, zefiro_mil: { t: 'clan' },   // tocam no clan_fx (os pontos do caminho)
  zefiro_passo: { t: 'rastro', saida: ['01'], estica: ['02', '03'], chegada: ['04', '05', '06'] },
  zefiro_veu: { t: 'corpo', escudo: true, gira: 1, intro: ['01', '02'], meio: ['03', '04'], fim: ['05', '06'] },
};
/** Avisos que vêm em ondas no mesmo lugar (a Ascensão Dupla): o desenho toca uma vez só. */
const ONDA = new Map();
const ONDA_N = new Map();   // v86: quantas ondas já bateram em cada ponto

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
      seq(jfx, s, msg.x, msg.y + 0.1, now, corrida(fs, 0, 120, 600), { scale: sc, spin: k.gira ?? 0, ...(k.chao ? { layer: 'ground' } : {}) });   // v88: chao/gira (a espiral da Ilusão)
      return true;
    }
    case 'clan': return true;   // v90: o desenho vem com o clan_fx
    case 'corpo': {
      const dur = k.ms ?? info[k.dur ?? 'durationMs'] ?? 4000, tag = `folha:${s}:${msg.playerId}`;   // v88: ms fixo (a Dissipação: um estouro só)
      jfx.drop(tag);
      // escudo: em volta do corpo; pes: a aura sobe dos pés (o apoio é a base do desenho); chao: o redemoinho deitado no chão
      // v91 (pedido do Victor, 22/11): o lugar no corpo. torso = do pescoço ao quadril, sem cobrir a cabeça; corpo = sobe dos
      // pés e cobre o boneco inteiro (tras: com a metade de trás atrás do boneco; sem: tudo por cima); pes = o círculo no chão,
      // em volta dos pés. O boneco: pés +0,42, quadril +0,18, pescoço -0,22, topo da cabeça -0,88 (casas, do centro do ninja).
      if (k.lugar) {
        const L = {
          torso: { y: -0.02, o: { apoio: 'centro', alto: k.alto ?? 0.5, split: false } },
          // corte: onde a parte de trás acaba (casas, a partir dos pés); -0,69 = o pescoço (a cabeça fica na frente da arte)
          corpo: { y: 0.47, o: { apoio: 'base', alto: k.alto ?? 1.45, split: !!k.tras, corte: k.corte ?? -0.3 } },
          pes: { y: k.y ?? 0.42, o: { scale: (k.largura ?? 1.5) / largura(s, k.meio[0]), split: true } },
        }[k.lugar];
        seq(jfx, s, 0, L.y, now, laco(k.intro, k.meio, k.fim, dur), { ...me, tag, spin: k.gira ?? 0, ...L.o, ...(k.alpha ? { alpha: k.alpha } : {}), ...(k.sy ? { sy: k.sy } : {}) });
        return true;
      }
      const y = k.escudo ? -0.5 : k.pes ? 0.32 : k.chao ? 0.15 : -0.35;
      const extra = k.escudo || k.pes ? {} : k.chao ? { layer: 'ground' } : k.mao ? {} : { scale: 1.1, alpha: 0.85 };
      seq(jfx, s, k.mao ? msg.fx * 0.4 : 0, k.mao ? -0.35 : y, now, laco(k.intro, k.meio, k.fim, dur), { ...me, tag, spin: k.gira ?? 0, ...extra });
      return true;
    }
    case 'escudo': {
      const tag = `escudo:${msg.playerId}`;
      jfx.drop(tag);
      ESCUDO.set(msg.playerId, s);
      // o escudo fica (no último quadro) até um golpe bater nele, ou some sozinho em 10 s
      // v92: cabeca = o ícone em cima da cabeça (o Olhar Rubro ativo), em laço, ao lado dos outros ícones
      if (k.cabeca) seq(jfx, s, 0, 0, now, laco(k.monta.slice(0, 2), k.monta.slice(2), [], 10_000, 260), { tag, cabeca: msg.playerId });
      else seq(jfx, s, 0, -0.5, now, corrida(k.monta, 0, 150, k.curto ? 650 : 10_000), { ...me, tag, ...(k.curto ? { scale: 0.7 } : {}) });
      return true;
    }
    case 'proj':
      seq(jfx, s, h.x, h.y - 0.05, now, corrida(k.sai, 0, 90, 140), k.gira ? { angle, scale: 0.7 } : { scale: 0.7 });
      return true;
    case 'cone': {
      const range = info.range ?? 3;
      const meio = k.meio ?? fs.slice(0, 4), resto = k.resto ?? fs.slice(4);
      const sc = range / largura(s, meio[meio.length - 1]);
      const esc = s === 'water' || s === 'wind' || s === 'taijutsu_3' ? sc : Math.max(0.6, sc * 0.6);
      let t0 = 0;
      if (k.rajada) {
        // v86: os quadros dos golpes alternam rápido, cada soco num ângulo e tamanho um pouco diferente dentro do cone,
        // para parecer muitos socos em pouco tempo; depois o fecho (os anéis e a onda)
        const { n = 8, ms = 65, abre = 0.5 } = k.rajada, fr = rajadaDe(s, k.rajada.fr);
        const st = [[meio[0], 0, 130]];
        for (let i = 0; i < n; i++) {
          const [j, e] = JIT[i % JIT.length];
          st.push([fr[i % fr.length], 90 + i * ms, ms + 30, { angle: angle + j * abre, scale: esc * e, fadeIn: 0, fadeOut: 40 }]);
        }
        seq(jfx, s, h.x, h.y, now, st, { angle, scale: esc });
        t0 = 90 + n * ms;
        seq(jfx, s, h.x, h.y, now, corrida(meio.filter((f) => f !== meio[0] && !k.rajada.fr.includes(f)), t0, 110, 220), { angle, scale: esc });
      } else seq(jfx, s, h.x, h.y, now, corrida(meio, 0, 110, 220), { angle, scale: esc });
      const p = { x: h.x + msg.fx * range * 0.7, y: h.y + msg.fy * range * 0.7 + 0.1 };
      seq(jfx, s, p.x, p.y, now, corrida(resto, 420 + t0, 150, 600), { scale: 0.7 });
      return true;
    }
    case 'linha': {
      // sem `estica`, os quadros da mão são o jato inteiro: a ponta (o apoio) fica no alvo e ele estica até a mão
      if (k.estica) seq(jfx, s, h.x, h.y, now, corrida(k.mao, 0, 110, 160));
      else seq(jfx, s, end.x, end.y - 0.3, now, corrida(k.mao, 0, 110, 160, { angle: a, len: d }));
      // v88: quadro com o apoio na esquerda (a Estaca, o olhar da Ilusão) sai da mão e cresce até o alvo; o da direita fica no alvo
      if (k.estica) for (const [f, at, ms, ex] of corrida(k.estica, 120, 110, 220, { angle: a, len: d })) {
        const pe = FRAMES[`${s}_${f}`]?.ancora?.[0] === 0;
        seq(jfx, s, pe ? h.x : end.x, pe ? h.y - 0.05 : end.y - 0.3, now, [[f, at, ms, { angle: a, len: d, ...ex }]]);
      }
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
      const poe = (f, p, at, ms, extra = {}, lado = 0) => {
        const x = h.x + msg.fx * range * p - msg.fy * lado, y = h.y + msg.fy * range * p + msg.fx * lado;
        seq(jfx, s, x, y, now, [[f, at, ms, extra]], { angle: FRAMES[`${s}_${f}`]?.arte !== undefined ? a0 : 0, scale: 1.3 });
      };
      if (k.rajada) {
        // v86: a rajada (Punho do Céu): os socos alternam no meio do caminho, cada um um pouco para um lado, e o estouro na ponta
        const { fr: base, n = 6, ms = 75, p: rp = 0.4 } = k.rajada, fr = rajadaDe(s, base);
        const i0 = k.fr.findIndex(([f]) => base.includes(f)), i1 = k.fr.length - 1 - [...k.fr].reverse().findIndex(([f]) => base.includes(f));
        const antes = k.fr.slice(0, i0), depois = k.fr.slice(i1 + 1);   // a ordem da folha: o que vem antes e depois dos socos
        let t = 0;
        for (const [f, p] of antes) { poe(f, p, t, 150); t += 110; }
        for (let i = 0; i < n; i++) {
          const [j, e] = JIT[i % JIT.length];
          poe(fr[i % fr.length], rp + j * 0.12, t + i * ms, ms + 30, { fadeIn: 0, fadeOut: 40, scale: 1.3 * e }, j * 0.45);
        }
        t += n * ms;
        depois.forEach(([f, p], i) => poe(f, p, t + i * 110, i === depois.length - 1 ? 500 : 150, i === depois.length - 1 ? { fadeOut: 330 } : {}));
        return true;
      }
      k.fr.forEach(([f, p], i) => poe(f, p, i * 110, i === k.fr.length - 1 ? 500 : 150, i === k.fr.length - 1 ? { fadeOut: 330 } : {}));
      return true;
    }
    case 'alvo': {
      const id = msg.tx !== undefined ? whoAt(end.x, end.y) : null;
      const o = id ? { follow: () => follow(id) } : {};
      if (k.cabeca && id) {   // v92: a marca vira um ícone em cima da cabeça do alvo enquanto dura (a Sombra Faminta)
        seq(jfx, s, 0, 0, now, laco(k.intro, k.meio, k.fim, k.ms ?? 1500, 300), { tag: `marca:${s}:${id}`, cabeca: id });
        return true;
      }
      if (k.meio) {   // v88: fica no alvo o tempo do efeito (as Raízes prendem, a Noite escurece, o Espelho embaralha)
        seq(jfx, s, id ? 0 : end.x, id ? -0.3 : end.y - 0.3, now, laco(k.intro, k.meio, k.fim, k.ms ?? info[k.dur] ?? 1500, 300), { ...o, scale: k.esc ?? 0.7 });
        return true;
      }
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

/** v90: Troca Instintiva, Eco do Vento e Mil Passos (mensagem clan_fx, com os pontos do caminho). */
export function folhaClanFx(jfx, msg, now) {
  const s = { troca: 'garra_troca', eco: 'zefiro_eco', mil_passos: 'zefiro_mil' }[msg.kind];
  const pts = msg.pts || [];
  if (!s || !ready(s) || pts.length < 2) return false;
  const P = ([x, y]) => ({ x, y });
  const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  if (msg.kind === 'mil_passos') {
    seq(jfx, s, pts[0][0], pts[0][1] - 0.3, now, [['01', 0, 200, { fadeOut: 120 }]], { scale: 0.8 });
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], t = 60 + (i - 1) * 130, m = { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 };
      seq(jfx, s, m.x, m.y - 0.3, now, [['03', t, 110, { angle: ang(a, b), fadeIn: 0 }]], { scale: 0.9 });
      seq(jfx, s, b[0], b[1] - 0.3, now, [['04', t + 70, 160, { fadeIn: 0 }], ['05', t + 200, 260, { fadeOut: 200 }]], { scale: 0.75 });
    }
    return true;
  }
  const [a, b] = pts, m = { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 };
  seq(jfx, s, a[0], a[1] - 0.3, now, [['01', 0, 260, { fadeOut: 160 }]], { scale: 0.8 });
  seq(jfx, s, m.x, m.y - 0.3, now, [['02', 90, 130, { angle: ang(a, b) }], ['03', 200, 130, { angle: ang(a, b) }]], { scale: 0.9 });
  seq(jfx, s, b[0], b[1] - 0.3, now, corrida(['04', '05', '06'], 300, 180, 520), { scale: 0.8 });
  return true;
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
    // v91: a zona que anda com o ninja e é um círculo no chão (lugar 'pes') fica nos pés dele, com a metade de trás atrás
    // submerso (a Aura de Regeneração): o ninja fica dentro da arte, que vai inteira por cima, translúcida
    const x0 = msg.follow ? 0 : msg.x, y0 = msg.follow ? (k.lugar === 'pes' ? 0.42 : 0) : msg.y;
    seq(jfx, s, x0, y0, now, laco(k.intro, k.meio, k.fim, ms), { ...o, scale: sc, tag: `zona:${msg.id}`, spin: k.gira ?? 0, ...(k.chao ? { layer: 'ground' } : {}),
      ...(k.lugar === 'pes' ? { split: !k.submerso } : {}), ...(k.submerso ? { alpha: k.alpha ?? 0.6 } : {}), ...(k.sy ? { sy: k.sy } : {}),
      ...(k.piso ? { piso: [k.piso[0], r * k.piso[1], k.piso[2], k.piso[3]] } : {}) });
    return true;
  }
  if (k.t === 'chuva') return msg.kind === 'aviso';   // o desenho veio no lançamento
  if (k.golpe && msg.kind === 'aviso') {   // o fim da transformação: o golpe cai no ponto avisado (o Olho da Tempestade)
    const sc = (2 * r) / largura(s, k.golpe[0]);
    seq(jfx, s, msg.x, msg.y, now, corrida(k.golpe, ms - 80, 220, 800), { scale: sc });
    return true;
  }   // o desenho veio no lançamento
  if (k.t === 'aviso' && msg.kind === 'aviso' && k.unico) {
    const key = `${s}:${Math.round(msg.x * 2)}:${Math.round(msg.y * 2)}`;
    if (now - (ONDA.get(key) ?? -1e9) < 2500) {
      // v86: as ondas seguintes (Ascensão Dupla: 4 ondas, 250 ms entre elas) batem de novo, menores e um pouco ao lado
      const n = (ONDA_N.get(key) ?? 0) + 1;
      ONDA_N.set(key, n);
      const sc = ((2 * r) / largura(s, k.ref ?? k.avisa[0])) * (k.bateEscala ?? 1) * (0.8 + (n % 2) * 0.1);
      const [j] = JIT[n % JIT.length];
      seq(jfx, s, msg.x + j * r * 0.3, msg.y - j * r * 0.15, now, [[k.bate[0], ms, 280, { fadeIn: 0, fadeOut: 160, scale: sc }]]);
      return true;
    }
    ONDA.set(key, now);
    ONDA_N.set(key, 0);
  }
  if (k.t === 'aviso' && msg.kind === 'aviso') {   // o aviso no chão, a queda no fim (o punho, o meteoro, o tornado), o golpe e o rastro
    const sc = (2 * r) / largura(s, k.ref ?? k.avisa[0]);   // ref: o quadro do anel (o tamanho da área)
    const st = [[k.avisa[0], 0, ms * 0.55, { layer: 'ground', fadeIn: 120 }]];
    k.avisa.slice(1).forEach((f, i) => st.push([f, ms * (0.45 + i * 0.1), ms * 0.55 - i * ms * 0.1, { layer: 'ground' }]));
    const queda = Math.min(360, ms * 0.6);
    k.cai.forEach((f, i) => st.push([f, ms - queda + (i * queda) / k.cai.length, queda / k.cai.length + 40]));
    // v85: a sombra do que cai cresce no chão até o impacto
    jfx.marca(msg.x, msg.y, now + ms - queda - 120, queda + 160, { sombra: r * 0.45, fadeIn: 120, fadeOut: 60 });
    const be = k.bateEscala ? { scale: sc * k.bateEscala } : {};
    k.bate.forEach((f, i) => st.push([f, ms + i * 300, i === k.bate.length - 1 ? 900 : 340, i === k.bate.length - 1 ? { fadeOut: 600, ...be } : be]));
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
  if (TIPO[s].cabeca) seq(jfx, s, 0, 0, now, TIPO[s].quebra.map((n, i) => [n, i * 140, 300, { fadeOut: 220 }]), { tag: `escudo:${id}`, cabeca: id });   // v92: some no ícone
  else seq(jfx, s, 0, -0.5, now, TIPO[s].quebra.map((n, i) => [n, i * 120, 650, { fadeOut: 450 }]), { follow: () => follow(id) });
  return true;
}

/** Invocações desenhadas: o quadro parado e o do golpe (o desenho de código fica de reserva). */
export const SUMMON_FRAMES = {
  clone_agua: { skill: 'water_clone', parado: 'water_clone_01', golpe: 'water_clone_01' },
  sentinela_sombra: { skill: 'shadow_sentinela', parado: 'shadow_sentinela_04', golpe: 'shadow_sentinela_05', some: 'shadow_sentinela_06' },
  // v90: as feras do Clã Garra andam (dois passos) e mordem; o Rei tem as folhas de frente e de costas
  fera_garra: { skill: 'garra_matilha', parado: 'garra_matilha_02', anda: ['garra_matilha_03', 'garra_matilha_04'], golpe: 'garra_matilha_05', some: 'garra_matilha_06' },
  fera_rei: { skill: 'garra_rei', parado: 'garra_rei_02', anda: ['garra_rei_03', 'garra_rei_04'], golpe: 'garra_rei_05', some: 'garra_rei_06' },
};
export const summonFrames = (kind) => (SUMMON_FRAMES[kind] && jutsuSpritesReady(SUMMON_FRAMES[kind].skill) ? SUMMON_FRAMES[kind] : null);
