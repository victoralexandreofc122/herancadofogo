import { frames, shelves } from './scrollRoomFrames.js';

// Coordenadas da planta em pixels de edição (16 px/casa), anteriores ao recorte dos chunks.
const layers = [];
function piece(name, x, y, mirror = false, scale = 1) {
  const [sx, sy, w, h] = frames[name];
  layers.push({ sx, sy, w, h, x, y, mirror, scale });
}

function repeat(name, x, y, width, height, mirror = false) {
  const [sx, sy, w, h] = frames[name];
  for (let dy = 0; dy < height; dy += h) {
    for (let dx = 0; dx < width; dx += w) {
      layers.push({ sx, sy, w: Math.min(w, width-dx), h: Math.min(h, height-dy),
        x: x+dx, y: y+dy, mirror, scale: 1 });
    }
  }
}

// A base contínua também cobre o mobiliário antigo gravado na imagem da loja.
repeat('Piso-cedro', 5, 35, 262, 157);
repeat('Parede-cedro', 7, 5, 258, 36);
repeat('Rodape-cedro', 8, 33, 256, 8);
for (const [i, x] of [26, 71, 157].entries()) {
  piece('Estante-corpo', x, 10);
  for (const [item, dx, bottom] of shelves[i]) {
    const name = 'Estante-acervo-' + item;
    piece(name, x + dx, 10 + bottom - frames[name][3]);
  }
}
repeat('Viga-cedro', 8, 0, 256, 9);
repeat('Remate-lateral', 0, 0, 8, 197);
repeat('Remate-lateral', 264, 0, 8, 197, true);
piece('Balcao-corpo-esquerda', 5, 68);
repeat('Balcao-corpo-miolo', 33, 68, 185, 24);
piece('Balcao-corpo-direita', 218, 68);
piece('Tapete-central', 78, 101);
piece('Capacho', 112, 160);
piece('Mesa-Tampo', 188, 152);
for (const [name, dx, dy] of [['Mesa-Papeis-Consulta',7,7], ['Mesa-Papeis-Maco',41,7],
  ['Mesa-Papeis-Caderno',24,15], ['Mesa-Rolo',40,19]]) piece(name,188+dx,152+dy);

for (const [x, mirror, items] of [[8,false,['Rolo','Maco','Livretos']], [249,true,['Livretos','Rolo','Maco']]]) {
  piece('Estante-lateral', x, 92, mirror);
  items.forEach((item, i) => {
    const name = 'Lateral-acervo-' + item;
    const [, , w, h] = frames[name];
    piece(name, x + (mirror ? 15-6-w : 6), 92 + [32,54,79][i] - h, mirror);
  });
}
for (const [x,y] of [[11,10],[132,10],[251,10],[3,42],[260,42],[3,123],[260,123]]) piece('Luminaria',x,y);

// Arquivo 4 mantém os 2 pixels de backing por pixel do sprite e a origem (600,60).
for (const [name,dx,dy] of [['Arquivo4-01-armario',0,0],['Estojo',7,20],['Arquivo4-03-pergaminho',15,25]]) {
  piece(name, 200+dx*2/3, 20+dy*2/3, false, 2/3);
}
repeat('Viga-cedro', 8, 189, 103, 9);
repeat('Viga-cedro', 161, 189, 103, 9);
piece('Porta-folha',119,192);
piece('Soleira',119,187);
piece('Batente',111,184);
piece('Batente',153,184,true);

let atlas;
export function drawScrollRoom(g, originX, originY, tile, refresh) {
  if (!atlas) {
    atlas = new Image();
    atlas.onload = refresh;
    atlas.src = '/mapas/pecas/pergaminhos-chama.png';
  }
  if (!atlas.complete || !atlas.naturalWidth) return;
  g.save();
  g.translate(originX, originY);
  g.scale(tile/16,tile/16);
  // Abaixo da parede sul só o vão (x=345..469 no backing antigo) pertence à sala.
  g.beginPath();
  g.rect(0, 0, 272, 198);
  g.rect(115, 198, 125/3, 10);
  g.clip();
  // Limpa o fundo provisório nas quatro bordas inferiores; as peças originais são pintadas depois.
  g.clearRect(118, 207, 2, 1);
  g.clearRect(152, 207, 2, 1);
  g.imageSmoothingEnabled = false;
  for (const { sx, sy, w, h, x, y, mirror, scale } of layers) {
    if (mirror) {
      g.save();
      g.translate(x + w*scale, y);
      g.scale(-1,1);
      g.drawImage(atlas,sx,sy,w,h,0,0,w*scale,h*scale);
      g.restore();
    } else {
      g.drawImage(atlas,sx,sy,w,h,x,y,w*scale,h*scale);
    }
  }
  g.restore();
}
