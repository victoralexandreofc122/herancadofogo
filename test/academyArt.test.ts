import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
// @ts-expect-error O mesmo módulo JS que é entregue ao navegador.
import { academyMiniFloor, drawAcademyDeco, drawAcademyFloor, drawAcademyWall } from '../public/academyArt.js';
import { loadPublicFiles } from '../src/web/staticFiles.js';

function canvas() {
  const marks: [string, number, number, number, number][] = [];
  const g = {
    fillStyle: '',
    fillRect(x: number, y: number, w: number, h: number) {
      marks.push([this.fillStyle, x, y, w, h]);
    },
  };
  return { g, marks };
}

describe('arte modular da Academia', () => {
  it('é servida pelo mesmo cliente do jogo', () => {
    const result = loadPublicFiles();
    assert.ok(result.some((f) => f.route === '/academyArt.js'));
  });

  it('diferencia as quatro salas no minimapa e não colore fora do mapa', () => {
    assert.equal(new Set([0, 16, 32, 48].map((x) => academyMiniFloor(x, 8))).size, 4);
    for (const [x, y] of [[-1, 8], [64, 8], [12, -1], [12, 16]] as const) {
      assert.equal(academyMiniFloor(x, y), undefined);
      const { g, marks } = canvas();
      drawAcademyFloor(g, Math.floor(x / 8), Math.floor(y / 8), 8, 16);
      assert.equal(marks.length, 0);
    }
  });

  it('calcula tábuas e emendas nas coordenadas do mundo, não nas do chunk', () => {
    const a = canvas(), b = canvas();
    drawAcademyFloor(a.g, 0, 0, 16, 16);
    drawAcademyFloor(b.g, 1, 1, 8, 16);
    assert.deepEqual(b.marks, a.marks.filter(([, x, y]) => x >= 128 && y >= 128)
      .map(([c, x, y, w, h]) => [c, x - 128, y - 128, w, h]));
  });

  it('deixa vão, porta e equipamentos no renderer existente', () => {
    const { g, marks } = canvas();
    assert.equal(drawAcademyWall(g, { k: 'pit', x: 33 }, 0, 0, 224, 32, 16), false);
    assert.equal(drawAcademyWall(g, { k: 'furniture', x: 50 }, 0, 0, 58, 35, 16), false);
    assert.equal(drawAcademyDeco(g, { k: 'door', x: 55 }, 0, 0, 48, 16), false);
    assert.equal(marks.length, 0);
  });
});
