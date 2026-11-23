import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

/*
 * v104 (pedido do Victor, 23/11: o celular esquentava): o desenho não passa dos quadros escolhidos (24, 30 ou 60), cai
 * para 30 com a tela parada, volta na hora ao mexer, e o contador de FPS aparece junto do ping (opção).
 * O laço de verdade (frame, telaParada, agitar) sai do game.js e roda aqui contra um relógio de tela de 60 e de 120 Hz.
 */
const read = (f: string) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const game = read('public/game.js');
const html = read('public/index.html');

function fnSource(name: string): string {
  const start = game.indexOf(`function ${name}(`);
  assert.ok(start >= 0, name);
  return game.slice(start, game.indexOf('\n}\n', start) + 2);
}

interface Laco {
  rodar(hz: number, ms: number): number;
  uiPref: { fps: number; showFps: boolean };
  dir: { x: number; y: number };
  particulas: number;
  agitar(now: number, ms?: number): void;
  medido(): number;
  agora(): number;
}

/** Monta o laço com o resto do jogo de mentira; `rodar` simula a tela pedindo quadros e conta os quadros desenhados. */
function montar(): Laco {
  const src = `
    const uiPref = { fps: 60, showFps: false };
    const quadros = { proximo: 0, agitoAte: 0, contados: 0, desde: 0, medido: 0 };
    const dir = { x: 0, y: 0 };
    const joy = { pointerId: null };
    const mapFade = { to: null };
    const state = { effects: [] };
    const vfx = { list: [] }, jfx = { list: [] };
    const particles = { n: 0, get count() { return this.n; } };
    let lastFrame = 0, desenhados = 0, relogio = 0;
    const pedidos = [];
    function requestAnimationFrame(f) { pedidos.push(f); }
    function update() {}
    function draw() { desenhados += 1; }
    function updateOnline() {}
    ${fnSource('agitar')}
    ${fnSource('telaParada')}
    ${fnSource('frame')}
    return {
      uiPref, dir, agitar,
      get particulas() { return particles.n; }, set particulas(v) { particles.n = v; },
      medido: () => quadros.medido,
      agora: () => relogio,
      rodar(hz, ms) {
        const antes = desenhados;
        const fim = relogio + ms;
        if (!pedidos.length) pedidos.push(frame);
        while (relogio < fim) {
          relogio += 1000 / hz;
          const f = pedidos.splice(0)[0];
          if (f) f(relogio);
        }
        return desenhados - antes;
      },
    };`;
  return new Function(src)() as Laco;
}

describe('v104: quadros por segundo', () => {
  it('numa tela de 120 Hz o desenho para em 60 (antes ia a 120)', () => {
    const l = montar();
    l.rodar(120, 200);
    l.agitar(l.agora(), 5000);            // mexendo: o máximo escolhido
    const n = l.rodar(120, 2000);
    assert.ok(n >= 118 && n <= 122, `quadros em 2 s: ${n}`);
  });

  it('o jogador escolhe 24, 30 ou 60, e o contador mede certo', () => {
    for (const fps of [24, 30, 60]) {
      const l = montar();
      l.uiPref.fps = fps;
      l.rodar(60, 200);
      l.agitar(l.agora(), 5000);
      const n = l.rodar(60, 3000);
      assert.ok(Math.abs(n / 3 - fps) <= 1.5, `${fps} fps escolhido, desenhou ${n / 3}/s`);
      assert.ok(Math.abs(l.medido() - fps) <= 2, `contador ${l.medido()} para ${fps}`);
    }
  });

  it('com nada se mexendo cai para 30, e volta a 60 na hora ao andar ou com partícula', () => {
    const l = montar();
    l.rodar(60, 1000);
    const parado = l.rodar(60, 2000);
    assert.ok(parado >= 58 && parado <= 62, `parado: ${parado / 2}/s`);
    l.dir.x = 1;                          // andou
    const andando = l.rodar(60, 1000);
    assert.ok(andando >= 58, `andando: ${andando}/s`);
    l.dir.x = 0;
    l.particulas = 5;                     // jutsu explodindo
    assert.ok(l.rodar(60, 1000) >= 58);
    l.particulas = 0;
    l.agitar(l.agora(), 300);             // um toque: volta e depois descansa
    assert.ok(l.rodar(60, 1000) <= 50);
  });

  it('no 24 escolhido a tela parada fica no 24 (não sobe para 30)', () => {
    const l = montar();
    l.uiPref.fps = 24;
    l.rodar(60, 500);
    const n = l.rodar(60, 3000);
    assert.ok(Math.abs(n / 3 - 24) <= 1.5, `${n / 3}/s`);
  });

  it('a escolha fica nas Configurações (Visual → Desempenho) e é guardada', () => {
    assert.match(html, /<legend>Desempenho<\/legend>[\s\S]*id="pref-fps"[\s\S]*value="60"[\s\S]*value="30"[\s\S]*value="24"/);
    assert.match(html, /id="pref-show-fps" type="checkbox"/);
    assert.match(game, /const FPS_OPCOES = \[24, 30, 60\]/);
    assert.match(game, /fps: 60, showFps: false/);
    assert.match(game, /if \(FPS_OPCOES\.includes\(raw\.fps\)\) out\.fps = raw\.fps;/);
    assert.match(game, /' · \$\{quadros\.medido\} fps'|` · \$\{quadros\.medido\} fps`/);
  });

  it('toque, tecla, alguém andando e monstro andando acordam o desenho', () => {
    assert.match(game, /\['pointerdown', 'pointermove', 'keydown', 'wheel'\]/);
    assert.ok((game.match(/agitar\(now\)/g) ?? []).length >= 2, 'jogadores e monstros');
  });
});
