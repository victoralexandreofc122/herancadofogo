// Chão, paredes e tecidos da Academia são camadas independentes.
// Tudo é pintado no cache de chunks, nunca a cada quadro. O layout e as colisões continuam no servidor.
const ROOMS = [
  { wood: ['#694330', '#704834', '#754d36', '#684531'], cloth: '#73382e', edge: '#ac6b43', light: '#c48b5b', mini: '#735041' },
  { wood: ['#4c4840', '#554c41', '#594f42', '#51483e'], cloth: '#47575b', edge: '#7b9390', light: '#a3aaa0', mini: '#57554a' },
  { wood: ['#594133', '#614636', '#664b39', '#5e4536'], cloth: '#524657', edge: '#87738a', light: '#b1949c', mini: '#645045' },
  { wood: ['#5e4231', '#654833', '#6a4a35', '#654634'], cloth: '#645036', edge: '#a38350', light: '#c4a169', mini: '#6f5240' },
];
const ROOM = 16;

function roomAt(cellX) {
  return ROOMS[Math.floor(cellX / ROOM)];
}
function box(g, color, x, y, w, h) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}
function hash(a, b) {
  const x = Math.imul(a + 31, 0x45d9f3b) ^ Math.imul(b + 47, 0x27d4eb2d);
  return (x ^ (x >>> 16)) >>> 0;
}

export function academyMiniFloor(x, y) {
  return y >= 0 && y < ROOM ? roomAt(x)?.mini : undefined;
}

/** As emendas das tábuas usam coordenadas do mundo, para não denunciar a divisão dos chunks. */
export function drawAcademyFloor(g, cx, cy, cells, u) {
  for (let ty = 0; ty < cells; ty++) {
    const wy = cy * cells + ty;
    if (wy < 0 || wy >= ROOM) continue;
    for (let tx = 0; tx < cells; tx++) {
      const wx = cx * cells + tx, room = roomAt(wx);
      if (!room) continue;
      const x = tx * u, y = ty * u, unit = u / 16;
      for (let plank = 0; plank < 2; plank++) {
        const row = wy * 2 + plank;
        const seam = (row * 3) % 5;
        const h = hash(Math.floor((wx + seam) / 5), row);
        const py = y + plank * 8 * unit;
        box(g, room.wood[h & 3], x, py, u, 8 * unit);
        box(g, '#2d211d', x, py + 7.5 * unit, u, 0.5 * unit);
        box(g, '#ffffff0d', x, py, u, 0.5 * unit);
        if ((wx + seam) % 5 === 0) {
          box(g, '#2d211d', x, py, 0.5 * unit, 7.5 * unit);
          box(g, '#382820', x + 2 * unit, py + 2 * unit, 0.75 * unit, 0.75 * unit);
          box(g, '#382820', x + 2 * unit, py + 5 * unit, 0.75 * unit, 0.75 * unit);
        }
        const grain = hash(wx, row);
        box(g, grain & 1 ? '#ffffff0b' : '#2517142c', x + ((grain >>> 6) % 7 + 2) * unit,
          py + ((grain >>> 9) % 4 + 2) * unit, 4 * unit, 0.5 * unit);
      }
      const localX = wx % ROOM;
      // Sombra da base da parede. A rota central permanece livre de marcações fortes.
      if (wy === 2) box(g, '#19151a44', x, y, u, u / 3);
      if (localX === 1) box(g, '#19151a33', x, y, u / 4, u);
      if (localX === ROOM - 2) box(g, '#19151a33', x + 0.75 * u, y, u / 4, u);
    }
  }
}

function diamond(g, color, x, y, r) {
  for (let dy = -r + 1; dy < r; dy++) {
    const span = r - Math.abs(dy);
    box(g, color, x - span + 1, y + dy, span * 2 - 1, 1);
  }
}

/** Decoração somente visual, restrita às caixas que já existem no layout. */
export function drawAcademyDeco(g, deco, x, y, w, h) {
  const room = roomAt(deco.x);
  if (!room) return false;
  if (deco.k === 'board') {
    box(g, '#241d1c', x, y, w, h);
    box(g, '#725039', x + 2, y + 2, w - 4, h - 4);
    box(g, '#292623', x + 4, y + 4, w - 8, h - 8);
    for (let i = 0; i < 3; i++) {
      const ix = x + w / 2 + (i - 1) * 12;
      diamond(g, room.light, ix, Math.round(y + h / 2), i === 1 ? 4 : 2);
    }
    return true;
  }
  if (deco.k === 'cushion') {
    box(g, '#201b1c70', x + 2, y + h - 6, w - 4, 6);
    box(g, '#29373b', x + 2, y + 2, w - 4, h - 5);
    box(g, room.cloth, x + 4, y + 3, w - 8, h - 8);
    box(g, room.edge, x + 5, y + 4, w - 10, 1);
    diamond(g, room.light, Math.round(x + w / 2), Math.round(y + h / 2 - 1), 2);
    return true;
  }
  if (deco.k !== 'rug') return false;
  box(g, '#2a1d1c', x, y, w, h);
  box(g, room.cloth, x + 3, y + 2, w - 6, h - 4);
  for (let j = 4; j < h - 3; j += 3) {
    box(g, '#20191e22', x + 4, y + j, w - 8, 1);
  }
  for (const sy of [y + 4, y + h - 6]) box(g, room.edge, x + 4, sy, w - 8, 1);
  for (const sx of [x + 4, x + w - 5]) box(g, room.edge, sx, y + 4, 1, h - 9);
  for (const sx of [x + 10, x + w - 10]) {
    for (let sy = y + 10; sy < y + h - 7; sy += 9) diamond(g, room.edge, sx, Math.round(sy), 2);
  }
  const mx = Math.round(x + w / 2), my = Math.round(y + h / 2);
  diamond(g, room.edge, mx, my, 8);
  diamond(g, room.cloth, mx, my, 6);
  diamond(g, room.light, mx, my - 1, 3);
  return true;
}

/** Parede em painéis de papel, madeira escura e faixa de verniz por sala. */
export function drawAcademyWall(g, wall, x, y, w, h, u) {
  const room = roomAt(wall.x);
  if (wall.k !== 'iwall' || !room) return false;
  box(g, '#2b201e', x, y, w, h);
  if (w > h && h >= 2 * u) {
    box(g, '#503227', x, y + 2, w, 3);
    box(g, '#43352c', x + 2, y + 5, w - 4, h - 8);
    const panel = 2 * u;
    for (let px = 5; px < w - 7; px += panel) {
      const pw = Math.min(panel - 6, w - px - 5);
      box(g, '#a48a65', x + px, y + 7, pw, h - 16);
      box(g, '#b49a71', x + px + 1, y + 8, pw - 2, h - 19);
      box(g, '#826749', x + px + pw / 2, y + 8, 1, h - 17);
      box(g, '#826749', x + px, y + Math.floor(h / 2), pw, 1);
    }
    box(g, '#654339', x, y + h - 8, w, 5);
    box(g, room.edge, x, y + h - 8, w, 1);
  } else {
    box(g, '#56392c', x + 1, y + 1, w - 2, h - 2);
    box(g, '#77513d', x + 2, y + 2, w - 4, w > h ? 2 : h - 4);
    if (w <= h) box(g, '#55372d', x + 5, y + 2, w - 8, h - 4);
  }
  return true;
}
