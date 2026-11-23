import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { UI_ARTE } from '../src/web/staticFiles.js';

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

describe('v96: o servidor serve as peças da interface como PNG', () => {
  it('cada /assets/ui/<peça>.png é image/png em bytes', async () => {
    const { loadPublicFiles } = await import('../src/web/staticFiles.js');
    const ui = loadPublicFiles().filter((f) => f.route.startsWith('/assets/ui/'));
    assert.deepEqual(ui.map((f) => f.route).sort(), UI_ARTE.map((n) => `/assets/ui/${n}.png`).sort());
    for (const f of ui) { assert.equal(f.contentType, 'image/png'); assert.ok(Buffer.isBuffer(f.body)); }
  });
});
