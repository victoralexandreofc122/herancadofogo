import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const hud = readFileSync(new URL('../public/hud.css', import.meta.url), 'utf8');
const game = readFileSync(new URL('../public/game.js', import.meta.url), 'utf8');
const mapArt = readFileSync(new URL('../public/mapArt.js', import.meta.url), 'utf8');

describe('v100 (pedido do Victor, 23/11): o chat é um botão; a barra da arena desce para a doca; a lanterna na frente', () => {
  it('o 💬 fica na doca de baixo, em qualquer mapa, com o contador das mensagens novas; o chat antigo some', () => {
    assert.match(html, /<div id="hud-dock" class="hud-dock">\s*<button id="chat-open" class="round-btn chat-open"[^>]*aria-controls="history-panel"/);
    assert.match(html, /id="chat-unread" class="menu-badge chat-unread" hidden/);
    assert.match(hud, /#chat-box \{ display: none !important; \}/);
    assert.match(game, /if \(ui\.historyPanel\.hidden && e\.playerId !== state\.meId\) setChatUnread\(chatUnread \+ 1\)/);
  });
  it('o painel do chat tem as abas (Tudo, Local, Global, Sussurros) e a linha de digitar dentro dele', () => {
    const painel = html.slice(html.indexOf('id="history-panel"'), html.indexOf('</section>', html.indexOf('id="history-panel"')));
    for (const f of ['all', 'local', 'global', 'whisper']) assert.ok(painel.includes(`data-filter="${f}"`), f);
    assert.match(painel, /<form id="chat" class="chat-bar"[\s\S]*id="chat-input"/);
    assert.match(hud, /\.history-panel \.chat-bar \{\s*position: static;/);
    assert.match(game, /function openChat\(\) \{\s*if \(ui\.historyPanel\.hidden\) openHistory\(\);/);
    assert.match(game, /state\.chatHistory\.push\(\{ channel: 'system', message: text, at: Date\.now\(\) \}\)/);   // as respostas do admin aparecem
  });
  it('a barra da arena fica na doca: o Desafio à vista e o resto no "Arena", com 44 px de toque', () => {
    const doca = html.slice(html.indexOf('id="hud-dock"'), html.indexOf('<!-- v29 (migração v15)'));
    assert.match(doca, /<div id="duel-bar" class="duel-bar" hidden>\s*<button id="duel-btn"/);
    assert.match(doca, /id="arena-more-btn"[\s\S]*<div id="arena-more" class="arena-more" hidden>/);
    for (const id of ['jounin-btn', 'duel-watch-btn', 'champion-btn', 'team3-btn', 'trio-btn', 'arenas-btn', 'duel-board-btn', 'mode-switch-btn']) {
      assert.ok(doca.slice(doca.indexOf('id="arena-more"')).includes(`id="${id}"`), id);
    }
    assert.match(hud, /\.hud-dock \.duel-bar \.duel-btn \{ min-height: 44px;/);
    assert.match(hud, /\.chat-open \{ position: relative; flex: none; width: 46px; height: 46px; \}/);
  });
  it('as lanternas da mureta são objetos com altura (pela linha do pé): quem passa atrás fica atrás delas', () => {
    assert.match(mapArt, /export function fenceLanternProps\(wall\)/);
    assert.match(mapArt, /'statue', 'lanterna_mureta'\]\)/);
    assert.match(mapArt, /case 'lanterna_mureta': return drawLantern\(g, x \+ w \/ 2, y \+ h\);/);
    assert.ok(!/drawLantern\(g, lx, \(w >= h \? y \+ h : ly \+ 4\)\)/.test(mapArt), 'a mureta não desenha mais a lanterna no chão');
    assert.match(game, /flatMap\(fenceLanternProps\)/);
  });
});

describe('v101 (pedido do Victor, 23/11): a borda de baixo do painel e o painel que rolava', () => {
  const css = readFileSync(new URL('../public/hud.css', import.meta.url), 'utf8');
  const anim = readFileSync(new URL('../public/uiAnim.js', import.meta.url), 'utf8');
  const py = readFileSync(new URL('../arte/ui/recortar_ui.py', import.meta.url), 'utf8');
  it('o bronze da moldura não vira fogo (só o laranja forte das chamas); as bordas lisas e a linha de baixo mais grossa', async () => {
    assert.match(anim, /const eFogo = \(r, g, b\) => r > 200 && b < 110 && r - g > 75;/);
    const { quadrosDe } = await import(new URL('../public/uiAnim.js', import.meta.url).href);
    const W = 12, H = 6, data = new Uint8ClampedArray(W * H * 4);
    for (let x = 0; x < W; x++) data.set([0xc0, 0x88, 0x48, 255], (2 * W + x) * 4);   // o bronze aceso (c0 88 48)
    const r = quadrosDe({ data }, W, H, (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }));
    assert.ok(!r || r.frames.every((f: { data: Uint8ClampedArray }) => (f.data[(2 * W + 3) * 4 + 1] ?? 0) >= 0x88 - 1), 'o bronze não anda na rampa do fogo');
    assert.match(py, /'ui_painel': \{[^}]*'bordas_lisas': True, 'bronze_baixo': True\}/);
  });
  it('o ranking e o Torneio não rolam: duas colunas, só a tabela rola quando a lista cresce', () => {
    assert.match(html, /<section id="ranked-panel"[\s\S]*?<div class="ranked-cols">\s*<div class="ranked-info">[\s\S]*?<div class="ranked-scroll">\s*<table class="ranked-table">/);
    assert.match(html, /<section id="jounin-panel"[\s\S]*?<div class="ranked-cols">[\s\S]*?<div class="ranked-scroll">/);
    assert.match(css, /#ranked-panel, #jounin-panel \{\s*display: flex; flex-direction: column; overflow: hidden;/);
    assert.match(css, /\.ranked-info, \.ranked-scroll \{ min-height: 0; overflow-y: auto;/);
  });
});
