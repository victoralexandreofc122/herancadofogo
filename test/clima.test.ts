/**
 * v105: os mapas refeitos com as texturas do Flow (a Aldeia da Chama em public/mapas/chama) e o clima desenhado
 * (public/clima.js, public/climaData.js e public/assets/clima). Só visual: o servidor serve os arquivos e as colisões
 * das casas novas seguem o desenho.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { CLIMA_ARTE, MAPA_ANIM_TIRAS, MAP_ART_CHUNK, loadPublicFiles } from '../src/web/staticFiles.js';
import { WORLD_MAPS } from '../src/realtime/maps.js';

const { CLIMA_ARTE: dados } = await import(new URL('../public/climaData.js', import.meta.url).href);
const { MAPA_ANIM } = await import(new URL('../public/mapaAnim.js', import.meta.url).href);

/** Largura e altura de um PNG (o cabeçalho IHDR). */
function pngSize(path: URL): [number, number] {
  const b = readFileSync(path);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

describe('v105: clima desenhado no Flow', () => {
  it('cada efeito dos dados tem a imagem, e o servidor serve todas como image/png (e nada a mais)', () => {
    assert.deepEqual(CLIMA_ARTE, Object.keys(dados));
    const files = loadPublicFiles();
    const served = files.filter((f) => f.route.startsWith('/assets/clima/')).map((f) => f.route).sort();
    assert.deepEqual(served, CLIMA_ARTE.map((n) => `/assets/clima/${n}.png`).sort());
    for (const f of files.filter((x) => x.route.startsWith('/assets/clima/'))) assert.equal(f.contentType, 'image/png', f.route);
    for (const route of ['/clima.js', '/climaData.js']) assert.ok(files.some((f) => f.route === route), route);
  });

  it('os quadros das partículas cabem na tira; chuva e névoa são texturas inteiras', () => {
    for (const [id, quadros] of Object.entries<any>(dados)) {
      const [W, H] = pngSize(new URL(`../public/assets/clima/${id}.png`, import.meta.url));
      if (quadros === null) { assert.ok(['fx_chuva', 'fx_nevoa'].includes(id), id); continue; }
      assert.ok(quadros.length > 0, id);
      for (const [x, y, w, h] of quadros) assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= W && y + h <= H, `${id}: ${x},${y},${w},${h}`);
    }
  });

  it('o efeito que voltou para o Flow (respingo) não vai para o jogo', () => {
    assert.ok(!('fx_respingo' in dados));
  });

  it('as partículas do ar (ATMOS em game.js) só usam efeitos que existem', () => {
    const game = readFileSync(new URL('../public/game.js', import.meta.url), 'utf8');
    const usados = [...game.matchAll(/sprite: '(fx_\w+)'/g)].map((m) => m[1]!);
    assert.ok(usados.length >= 4);
    for (const u of usados) assert.ok(u in dados, u);
    assert.match(game, /camadaCorrendo\(ctx, 'fx_chuva'/);
    assert.match(game, /camadaCorrendo\(ctx, 'fx_nevoa'/);
  });
});

describe('v105: Aldeia da Chama refeita com as peças', () => {
  const VILA = WORLD_MAPS.map_1;
  it('o mapa usa a arte nova e todos os blocos (e o minimapa) existem', () => {
    assert.equal(VILA.art, 'chama');
    for (let cy = 0; cy * MAP_ART_CHUNK < VILA.height; cy++) {
      for (let cx = 0; cx * MAP_ART_CHUNK < VILA.width; cx++) assert.ok(existsSync(new URL(`../public/mapas/chama/${cx}_${cy}.webp`, import.meta.url)), `${cx}_${cy}`);
    }
    assert.ok(existsSync(new URL('../public/mapas/chama/mini.webp', import.meta.url)));
  });

  it('as casas de morar são as peças novas: 8 caixas menores que as antigas, dentro da muralha, sem cobrir lojas nem a Academia', () => {
    const casas = VILA.walls.filter((w) => w.k === 'house' && (w.s === 'home' || w.s === 'hut'));
    assert.equal(casas.length, 8);
    const grandes = VILA.walls.filter((w) => w.k === 'house' && w.s !== 'home' && w.s !== 'hut');
    const cruza = (a: any, b: any) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    for (const c of casas) {
      assert.ok(c.w < 5 && c.h < 5, `casa ${c.x},${c.y} maior que a peça`);
      assert.ok(c.x > 1.5 && c.x + c.w < VILA.width - 1.5 && c.y >= 5.5 && c.y + c.h < 54.7, `casa ${c.x},${c.y} fora da aldeia`);
      for (const g of grandes) assert.ok(!cruza(c, g), `casa ${c.x},${c.y} em cima de ${g.s}`);
    }
  });

  it('as janelas das casas novas acendem de noite (luzes do mapa perto das casas)', () => {
    const casas = VILA.walls.filter((w) => w.k === 'house' && w.s === 'home');
    const perto = (l: { x: number; y: number }) => casas.some((c) => l.x >= c.x - 0.5 && l.x <= c.x + c.w + 0.5 && l.y >= c.y && l.y <= c.y + c.h + 0.5);
    assert.ok((VILA.lights ?? []).filter(perto).length >= 8);
  });
});

describe('v106: as peças grandes do Flow na Aldeia da Chama', () => {
  const VILA = WORLD_MAPS.map_1;
  it('o Salão, a Academia, o hospital, as três lojas e o poço são as peças novas, e as portas seguem a planta nova', () => {
    for (const s of ['leader', 'academy', 'hospital', 'shop_weapon', 'shop_cloth', 'shop_scroll']) {
      const w = VILA.walls.filter((x) => x.k === 'house' && x.s === s);
      assert.equal(w.length, 1, s);
    }
    const arm = VILA.walls.find((x) => x.s === 'shop_weapon')!;
    assert.ok(arm.w < 5, 'a armaria nova é a peça do Flow (menor que a antiga)');
    const porta = VILA.doors.find((d) => d.map === 'interior_weapons')!;
    assert.ok(Math.abs(porta.y - (arm.y + arm.h)) < 0.01, 'a porta fica embaixo da fachada nova');
  });

  it('a água do canal anda: os trechos do rio são a colisão de água, e as folhas dos quadros são servidas', () => {
    const A = MAPA_ANIM.chama;
    const agua = VILA.walls.filter((w) => w.k === 'water');
    assert.equal(A.agua.length, agua.length);
    for (const t of A.agua) assert.ok(agua.some((w) => w.x === t.x && w.y === t.y && w.w === t.w && t.h <= w.h), JSON.stringify(t));
    const files = loadPublicFiles();
    for (const n of MAPA_ANIM_TIRAS) {
      assert.ok(existsSync(new URL(`../public/assets/mapas/${n}`, import.meta.url)), n);
      assert.equal(files.find((f) => f.route === `/assets/mapas/${n}`)?.contentType, 'image/png', n);
    }
    assert.deepEqual(Object.values<any>(A.tiras).map((t) => t.quadros), [4, 4]);
  });
});
