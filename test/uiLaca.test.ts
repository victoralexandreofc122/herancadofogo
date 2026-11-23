import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { UI_ARTE } from '../src/web/staticFiles.js';
const UI_MAPA = await import(new URL('../public/uiArte.js', import.meta.url).href);

// v96: a interface desenhada no Flow (tema Laca e Brasa) e a animação do fogo e do ouro (arte/ui/LEIAME.md)
describe('v96: interface desenhada (Laca e Brasa)', () => {
  const css = readFileSync(new URL('../public/uiLaca.css', import.meta.url), 'utf8');
  it('cada peça do uiArte.js existe em public/assets/ui e o servidor serve todas', () => {
    assert.ok(UI_ARTE.length >= 29);
    for (const n of UI_ARTE) assert.ok(existsSync(new URL(`../public/assets/ui/${n}.png`, import.meta.url)), n);
  });
  it('toda peça que o CSS usa está no mapa (nada de imagem quebrada)', () => {
    for (const m of css.matchAll(/assets\/ui\/(ui_\w+)\.png/g)) assert.ok(UI_ARTE.includes(m[1]!), m[1]);
  });
  it('as fatias do CSS batem com as do recorte', async () => {
    const { UI_ARTE: mapa } = await import(new URL('../public/uiArte.js', import.meta.url).href);
    for (const [nome, f] of [['ui_painel', '18'], ['ui_pergaminho', '18 17 21 7'], ['ui_botao_principal_1', '12 8 10 8'], ['ui_botao_secundario_1', '7 10 7 10']] as const) {
      assert.ok(css.includes(`${nome}.png) ${f} `), nome);
      assert.ok(mapa[nome].fatia, nome);
    }
  });
  it('tudo é pixelated e fica atrás da classe .ui-laca (dá para desligar no ⚙️)', () => {
    assert.match(css, /image-rendering: pixelated/);
    for (const linha of css.split('\n').filter((l) => /^\.[a-z]/.test(l) && !l.startsWith('.ui-laca'))) assert.fail(`regra sem .ui-laca: ${linha}`);
  });
  it('a animação: o fogo anda na rampa e o ouro brilha; só com o gráfico no máximo e sem reduzir movimento', async () => {
    const { quadrosDe, ANIMADAS } = await import(new URL('../public/uiAnim.js', import.meta.url).href);
    const W = 20, H = 20, data = new Uint8ClampedArray(W * H * 4);
    const pinta = (x: number, y: number, c: number[]) => data.set([...c, 255], (y * W + x) * 4);
    for (let y = 8; y < 14; y++) for (let x = 8; x < 11; x++) pinta(x, y, [240, 112, 42]);   // uma chama
    for (let x = 0; x < W; x++) { pinta(x, 0, [184, 137, 63]); pinta(x, 19, [184, 137, 63]); }   // o bronze (linha longa)
    const r = quadrosDe({ data, width: W, height: H }, W, H, (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }));
    assert.ok(r && r.frames.length >= 16);
    const cor = (f: { data: Uint8ClampedArray }, x: number, y: number) => [...f.data.slice((y * W + x) * 4, (y * W + x) * 4 + 3)].join();
    assert.ok(new Set(r.frames.map((f: { data: Uint8ClampedArray }) => cor(f, 9, 10))).size > 1, 'a chama muda de cor');
    assert.ok(r.frames.every((f: { data: Uint8ClampedArray }) => { const [rr, g] = cor(f, 10, 0).split(',').map(Number); return rr! - g! < 80; }), 'o bronze não pega fogo');
    assert.ok(Object.keys(ANIMADAS).length >= 8);
    const game = readFileSync(new URL('../public/game.js', import.meta.url), 'utf8');
    assert.match(game, /particles\.quality === 'full' && !calmo/);
  });
});

describe('v97: o HUD desenhado (joystick, minimapa, retratos e a barra dos selos)', () => {
  const css = readFileSync(new URL('../public/uiLaca.css', import.meta.url), 'utf8');
  const game = readFileSync(new URL('../public/game.js', import.meta.url), 'utf8');
  it('as peças novas saíram do recorte e estão no lugar delas', () => {
    for (const n of ['ui_joystick_1', 'ui_joystick_2', 'ui_minimapa', 'ui_retrato_1', 'ui_retrato_2', 'ui_retrato_3', 'ui_selos', 'ui_selos_fogo']) assert.ok(UI_ARTE.includes(n), n);
    assert.match(css, /\.minimap::after[^}]*ui_minimapa\.png/);
    assert.match(css, /\.portrait::after[^}]*ui_retrato_1\.png/);
    assert.match(css, /\.portrait\.foe::after \{ background-image: url\(\/assets\/ui\/ui_retrato_2\.png\)/);
    assert.match(css, /\.level-badge \{[^}]*ui_retrato_3\.png/);
    assert.match(css, /ui_selos\.png\) 3 fill/);
    assert.match(css, /\.cast-bar \.fill \{[^}]*ui_selos_fogo\.png[^}]*repeat-x/);
  });
  it('o joystick (desenhado no canvas) usa a base e a manopla, sem borrar, e volta ao círculo sem a interface', () => {
    assert.match(game, /ui_joystick_1/);
    assert.match(game, /ui_joystick_2/);
    assert.match(game, /const arte = uiPref\.uiDesenhada && joyArte\(\)/);
    assert.match(game, /ctx\.imageSmoothingEnabled = liso/);
  });
  it('o retrato em pé: o canvas fica alto com a interface desenhada', () => {
    assert.match(game, /const alto = uiPref\.uiDesenhada \? 218 : 128/);
    assert.match(game, /c\.height > c\.width \? 2\.6 : 2/);
  });
  it('a faixa de fogo dos selos anima inteira (a mancha grande ali é fogo, não bronze)', async () => {
    const { quadrosDe, ANIMADAS } = await import(new URL('../public/uiAnim.js', import.meta.url).href);
    assert.equal(ANIMADAS.ui_selos_fogo.prop, 'background-image');
    const W = 30, H = 8, data = new Uint8ClampedArray(W * H * 4);
    for (let y = 2; y < H; y++) for (let x = 0; x < W; x++) data.set([240, 112, 42, 255], (y * W + x) * 4);
    const criar = (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h });
    const comFogo = quadrosDe({ data }, W, H, criar, { chamaGrande: true });
    const semOpcao = quadrosDe({ data }, W, H, criar);
    const muda = (r: any) => r.frames.some((f: any) => f.data[(4 * W + 5) * 4 + 1] !== 112);
    assert.ok(comFogo && muda(comFogo), 'a faixa queima');
    assert.ok(!semOpcao || !muda(semOpcao) || semOpcao.frames.every((f: any) => f.data[(4 * W + 5) * 4] >= 200), 'sem a opção, a faixa comprida não vira fogo');
    for (const n of ['ui_retrato_1', 'ui_minimapa']) assert.ok(ANIMADAS[n], n);
  });
});

describe('v98: o lote 4 (o painel de fundo que vazou fica de fora; ícones, insígnias e espaços)', () => {
  const css = readFileSync(new URL('../public/uiLaca.css', import.meta.url), 'utf8');
  const game = readFileSync(new URL('../public/game.js', import.meta.url), 'utf8');
  const py = readFileSync(new URL('../arte/ui/recortar_ui.py', import.meta.url), 'utf8');
  it('o recorte tira o painel de fundo (área e o roxo) e corta as folhas de ícones por célula', () => {
    assert.match(py, /'area': \[\(0, 0\.43, 1, 0\.575\)\], 'tirar_roxo': True/);
    assert.match(py, /def celulas\(low, cols, rows\)/);
    for (const n of ['ui_icones_menu_tela_cheia', 'ui_campo_texto_1', 'ui_campo_texto_2', 'ui_aviso', 'ui_dialogo', 'ui_dialogo_nome', 'ui_dialogo_rosto',
      'ui_dialogo_seta', 'ui_balao_chat', 'ui_balao_chat_ponta', 'ui_aviso_grande', 'ui_aviso_grande_selo', 'ui_logo', 'ui_slot_lendario', 'ui_slot_equip_mascara',
      'ui_faixas_lenda', 'ui_patentes_kage', 'ui_emblemas_aldeias_rocha', 'ui_icones_classes_armas', 'ui_icones_estados_invertido', 'ui_icones_recursos_ryo',
      'ui_icones_aviso_travado']) assert.ok(UI_ARTE.includes(n), n);
  });
  it('os 14 ícones do menu ☰ estão no seu botão', () => {
    for (const [id, n] of [['inv-toggle', 'mochila'], ['status-toggle', 'perfil'], ['missions-toggle', 'missoes'], ['vinculo-toggle', 'vinculo'],
      ['settings-toggle', 'config'], ['village-toggle', 'aldeia'], ['history-toggle', 'historico'], ['chat-toggle', 'chat'], ['manual-toggle', 'manual'],
      ['feedback-toggle', 'feedback'], ['admin-toggle', 'admin'], ['ranked-toggle', 'rankeado'], ['fullscreen-toggle', 'tela_cheia'], ['logout', 'sair']]) {
      assert.ok(css.includes(`#${id} .ico-svg { background-image: url(/assets/ui/ui_icones_menu_${n}.png)`), id);
    }
  });
  it('as molduras: aviso, campos de texto, caixa da fala, aviso grande e as medalhas das faixas', () => {
    assert.match(css, /\.toast \{[^}]*ui_aviso\.png\) 5 6 5 24 fill/);
    assert.match(css, /#chat-input:focus[^{]*\{\s*border-image-source: url\(\/assets\/ui\/ui_campo_texto_2\.png\)/);
    assert.match(css, /\.dialog \{[^}]*ui_dialogo\.png\) 9 10 10 fill/);
    assert.match(css, /\.duel-banner::before \{[^}]*ui_aviso_grande_selo\.png/);
    for (const t of ['bronze', 'prata', 'ouro', 'diamante', 'lenda']) assert.ok(css.includes(`.tier-seal.tier-${t} { background-image: url(/assets/ui/ui_faixas_${t}.png)`), t);
  });
  it('no canvas: o balão do chat de 9 fatias com a ponta e os ícones de estado desenhados (com o desenho antigo de reserva)', () => {
    assert.match(game, /function desenha9\(g, im, \[t, r, b, l\]/);
    assert.match(game, /if \(!balaoDesenhado\(ctx, x - 6, y - 6, w \+ 12, h \+ 12\)\)/);
    assert.match(game, /const ESTADO_ICONE = \{ queimadura: 'queimando'/);
    assert.match(game, /return uiPref\.uiDesenhada && im\.complete && im\.naturalWidth \? im : null/);
    assert.match(game, /b\.dataset\.raridade = rar/);
  });
});

describe('v99: as 4 últimas do catálogo (título, cores das barras, barra do chefe, marcador do alvo)', () => {
  const css = readFileSync(new URL('../public/uiLaca.css', import.meta.url), 'utf8');
  const game = readFileSync(new URL('../public/game.js', import.meta.url), 'utf8');
  it('recortadas sem o painel de fundo, e as cores das barras viram tiras de cima para baixo', () => {
    for (const n of ['ui_titulo', 'ui_barra_chefe', 'ui_alvo_1', 'ui_barra_cores_vida', 'ui_barra_cores_chakra', 'ui_barra_cores_xp', 'ui_barra_cores_inimigo', 'ui_barra_cores_escudo']) assert.ok(UI_ARTE.includes(n), n);
    const { UI_ARTE: mapa } = UI_MAPA;
    assert.ok(mapa.ui_barra_cores_vida.w === 4 && mapa.ui_barra_cores_vida.h >= 10, 'a tira tem 4 colunas e o corte inteiro');
  });
  it('no lugar: a faixa do título, as barras (vida, chakra, XP, inimigo), a barra do chefe e o anel do alvo no chão', () => {
    assert.match(css, /\.mission-head h2 \{[^}]*ui_titulo\.png\) 4 12 fill/);
    assert.match(css, /\.bar-hp \.fill[^{]*\{ background: url\(\/assets\/ui\/ui_barra_cores_vida\.png\) left top \/ auto 100% repeat-x/);
    assert.match(css, /\.boss-track \{[^}]*ui_barra_chefe\.png\) 10 14 9 22 fill/);
    assert.match(game, /const alvo = !ally && part !== 'arrow' && uiImg\('ui_alvo_1'\)/);
  });
});

describe('v96: o servidor serve as peças da interface como PNG', () => {
  it('cada /assets/ui/<peça>.png é image/png em bytes', async () => {
    const { loadPublicFiles } = await import('../src/web/staticFiles.js');
    const ui = loadPublicFiles().filter((f) => f.route.startsWith('/assets/ui/'));
    assert.deepEqual(ui.map((f) => f.route).sort(), UI_ARTE.map((n) => `/assets/ui/${n}.png`).sort());
    for (const f of ui) { assert.equal(f.contentType, 'image/png'); assert.ok(Buffer.isBuffer(f.body)); }
  });
});
