// Aldeia da Chama Eterna. Retângulos do atlas em pixels; posições da cena em casas.
const frames = {
  poco:[0,0,78,53], banco:[80,0,96,51], lanterna:[178,0,37,82], vaso:[217,0,48,46],
  shop_weapon:[267,0,164,160], shop_cloth:[433,0,164,158], shop_scroll:[599,0,164,163],
  portao:[0,165,220,174], ponte:[222,165,55,100], sakura:[279,165,151,140], tree:[432,165,151,147],
  leader:[0,341,310,253], academy:[312,341,284,310], hospital:[598,341,222,126],
  home:[0,679,147,100], hut:[149,653,136,125], muralha:[287,653,128,73], pillar:[417,653,44,78],
  caixotes:[463,653,70,52], penhasco:[535,653,230,105], rocha:[767,653,68,44],
  cerca:[0,781,96,42], grade:[98,781,84,50], grama:[184,781,96,96], terra:[282,781,96,96],
  pedra:[380,781,96,96], flor:[478,781,96,96],
  campinas:[576,781,48,22], petalas:[626,781,42,36], juncos:[670,781,41,48], estandarte:[713,781,91,96],
};
let atlas, ready = false;
const patterns = {};
const scenes = new WeakMap();

export function chamaReady(invalidate) {
  if (!atlas) {
    atlas = new Image();
    atlas.onload = () => {
      for (const name of ['grama','terra','pedra']) {
        const c = document.createElement('canvas'); c.width = c.height = 192;
        const g = c.getContext('2d');
        // Os quatro cantos espelhados mantêm o tom e as bordas contínuos entre blocos.
        for (const flipX of [false, true]) {
          for (const flipY of [false, true]) {
            g.save();
            g.translate(flipX ? 192 : 0, flipY ? 192 : 0);
            g.scale(flipX ? -1 : 1, flipY ? -1 : 1);
            g.drawImage(atlas, ...frames[name], 0, 0, 96, 96);
            g.restore();
          }
        }
        patterns[name] = g.createPattern(c,'repeat');
        patterns[name].setTransform(new DOMMatrix().scale(1/24));
      }
      const water = document.createElement('canvas');
      water.width = water.height = 96;
      const ink = water.getContext('2d');
      ink.fillStyle='#387782';ink.fillRect(0,0,96,96);
      for (let i=0;i<41;i++) {
        const x=(i*37+7)%96, y=(i*53+11)%96, width=2+(i*7)%11;
        ink.fillStyle=i%3?'#42838a':'#72a6a4';
        for (const offset of [0,-96]) ink.fillRect(x+offset,y,width,1);
      }
      patterns.agua=ink.createPattern(water,'repeat');
      patterns.agua.setTransform(new DOMMatrix().scale(1/24));
      ready = true;
      invalidate();
    };
    atlas.onerror = () => { setTimeout(() => { atlas = null; }, 8000); };
    atlas.src = '/mapas/pecas/chama.webp';
  }
  return ready;
}

function stamp(g, name, x, y, w, h, turn = false) {
  if (turn) {
    g.save(); g.translate(x+w/2,y+h/2); g.rotate(Math.PI/2);
    g.drawImage(atlas,...frames[name],-h/2,-w/2,h,w); g.restore();
  } else g.drawImage(atlas,...frames[name],x,y,w,h);
}

// Planta de circulação: uma rua comercial sinuosa, uma alameda entre as pontes
// e um eixo mineral que leva do portão ao mosaico, depois à Academia.
const paths = [
  [3.6,'M2 22 Q10 25 18 24.6 T39 24 Q51 24.8 58 24.3 T76 23'],
  [3.45,'M5 37.2 Q12 41.9 18 39.4 Q22 36.1 28 36.2 Q34 35.9 39 36.8 Q46 36.4 51 36.7 T69.2 36.4'],
  [4.6,'M39 60 L39 49 Q38.1 42 39.2 36 L39.1 25.8 Q39.4 22.6 38.9 19.8'],
  [2.5,'M18.4 24.5 L18.4 29.3 Q17.6 35 20.2 37.8'],
  [2.6,'M69.1 23.8 L69.2 35.7 Q70 37.5 72 38.4'],
  [2.8,'M49.7 45.8 Q54 45.2 59.5 47.4'],
  [2.0,'M7.2 21.2 Q8.2 18 6.4 14 M22.9 20.4 L22.9 24.2 M57.5 21.1 L57.5 24.3'],
  [1.9,'M23 50 Q14.8 51.3 8.4 47.5 M6 36.9 L6.7 39.2'],
].map(([width,path])=>({width,path:new Path2D(path)}));
const plaza = new Path2D('M24 38.05 L53.8 38.05 55.65 39.85 55.65 50.8 53.8 52.6 24 52.6 22.28 50.85 22.28 39.85 Z');
const river = { top: 26.85, bottom: 29.32, armLeft: 11.9, armRight: 15.6 };
const canal = new Path2D(
  `M1 ${river.top} H76.7 V${river.bottom} H${river.armRight} V54.9 H${river.armLeft} V${river.bottom} H1 Z`,
);
const canalEdge = .38;
// As pontas dos postes ultrapassam o tablado do atlas. Alinhe a madeira útil,
// não a caixa externa do sprite, à borda seca de ambas as margens.
const bridgeDeckStart = .14, bridgeDeckEnd = .94;
const bridgeBankOverlap = canalEdge / 2 + .025;
function drawBridge(g, b) {
  const turn = b.y > river.bottom;
  const from = (turn ? river.armLeft : river.top) - bridgeBankOverlap;
  const to = (turn ? river.armRight : river.bottom) + bridgeBankOverlap;
  const length = (to - from) / (bridgeDeckEnd - bridgeDeckStart);
  if (turn) {
    // A rotação leva o topo do recorte ao lado direito do braço do rio.
    stamp(g, 'ponte', to - (1 - bridgeDeckStart) * length, b.y, length, b.h, true);
  } else stamp(g, 'ponte', b.x, from - bridgeDeckStart * length, b.w, length);
}
const plazaFrieze = new Path2D('M24.4 38.65 H53.55 L55 40.1 V50.5 L53.55 52 H24.35 L22.92 50.6 V40.15 Z');
const riverJuncos = [[3,26.8],[5,26.75],[9.3,29.35],[15.4,32.7],[15.4,36.1],[11.9,45.2],
  [11.9,48.4],[15.4,51.8],[22,26.75],[27.3,29.3],[33.1,26.8],[43.5,26.85],[47.4,26.82],
  [56.3,29.33],[64.3,26.83],[72.9,29.32],[74.3,29.31]];
const meadows = [[3.4,19.5],[8.9,18.5],[11.7,13.4],[16.5,15.9],[17.1,21.8],[28.3,21.6],
  [43.9,23.1],[47.6,23.1],[65.5,18.9],[68.4,21.8],[73,25.1],[9.7,30.3],[10.8,35.4],
  [16.6,30.6],[19.9,32.6],[32.8,34.5],[41.3,33.8],[53.8,34.1],[66.1,32.5],[70.5,39.5],
  [55.9,39.5],[55.8,48.5],[16,44.1],[19.1,49.1],[8.6,50.9],[24.3,53.4],[51.2,53.6],[72.2,53.5]];
// Uma escala de catálogo, nunca inferida da caixa de colisão de uma instância.
// Árvores compartilham altura; a largura difere só conforme a espécie desenhada.
const catalog = {
  home: {width: 5.84}, hut: {width: 6.04},
  caixotes: {width: 2.5}, vaso: {width: 1.45},
  tree: {height: 4.3}, sakura: {height: 4.3},
  campinas: {height: .65}, petalas: {height: .74}, juncos: {height: 1.08},
};
function nativeSize(name, width, height) {
  const [, , sourceW, sourceH] = frames[name];
  if (height !== undefined) return [height * sourceW / sourceH, height];
  return [width, width * sourceH / sourceW];
}
function catalogSize(name) {
  const {width, height} = catalog[name];
  return nativeSize(name, width, height);
}
function gardenPiece(g, name, cx, bottom) {
  const [w,h] = catalogSize(name);
  stamp(g, name, cx - w/2, bottom - h, w, h);
}
function riverGarden(g, objects) {
  for (const [x,y] of riverJuncos) gardenPiece(g, 'juncos', x+.16, y+.08);
  meadows.forEach(([x,y], i) => {
    // A densidade varia pela quantidade, jamais esticando a mesma flor.
    gardenPiece(g, 'campinas', x+.7, y+.72);
    if (i % 3 === 1) gardenPiece(g, 'campinas', x-.32, y+.78);
  });
  for (const tree of objects) {
    if (tree.name !== 'sakura') continue;
    gardenPiece(g, 'petalas', tree.x + tree.w*.41, tree.y+.37);
    gardenPiece(g, 'petalas', tree.x + tree.w*.67, tree.y+.17);
  }
}
function stroke(g,path,paint,width) {g.strokeStyle=paint;g.lineWidth=width;g.stroke(path);}
function fill(g,path,paint) {g.fillStyle=paint;g.fill(path);}
function ellipse(g,color,x,y,rx,ry) {
  g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();
}

function furniture(w) {
  if ((w.x === 33.4 || w.x === 43.2) && w.y >= 38) return 'lanterna';
  if (w.y >= 38 && w.x >= 25 && w.x < 53) return w.w > 3 ? 'banco' : 'vaso';
  if (w.x >= 32 && w.x <= 45 && w.y < 22) return 'lanterna';
  return w.w > 7 ? 'banco' : 'caixotes';
}
export function villageObjects(map) {
  if (scenes.has(map)) return scenes.get(map);
  const out=[];
  function add(name,x,top,w,h,turn=false) {out.push({name,x,top,w,h,y:top+h,turn});}
  function addAtBase(name, centerX, baseY, width) {
    const [w,h] = nativeSize(name, width);
    add(name, centerX - w / 2, baseY - h, w, h);
  }
  function addCatalog(name, centerX, baseY) {
    const [w,h] = catalogSize(name);
    add(name, centerX - w / 2, baseY - h, w, h);
  }
  for (const b of map.walls) {
    const {x,y,w,h,k,s}=b;
    if (k === 'house') {
      const house = Object.hasOwn(frames, s) ? s : 'home';
      if (s === 'home' && h > 2*w) addCatalog('hut', x + w / 2, y + h * .53);
      if (s === 'hospital') {
        // Pátio clínico atrás da fachada, dentro do mesmo terreno fechado.
        add('cerca', x, y + .12, w, 1.2);
        addCatalog('campinas', x + 1.45, y + 2.25);
        addCatalog('campinas', x + w - 1.75, y + 2.37);
      }
      // Casa comum e cabana repetidas têm uma única escala por modelo. Os
      // marcos únicos e as três lojas conservam a largura autoral aprovada.
      if (house === 'home' || house === 'hut') addCatalog(house, x + w / 2, y + h);
      else addAtBase(house, x + w / 2, y + h, w + .24);
    } else if (k === 'tree') {
      const fullWidth = w / .60, fullHeight = h / .55;
      const name = s === 'sakura' ? 'sakura' : 'tree';
      // A caixa histórica só identifica centro, apoio e a segunda árvore do
      // retângulo duplo. Não regula mais as dimensões de uma copa.
      const oldHeight = Math.min(fullHeight, fullWidth * 1.26);
      if (fullHeight > oldHeight * 1.5) addCatalog(name, x + w / 2 - .38, y + h - fullHeight + oldHeight);
      addCatalog(name, x + w / 2, y + h);
    } else if (k === 'wall' || k === 'fence') {
      const vertical=h > w, length=vertical?h:w;
      const count=Math.max(1,Math.round(length/(k==='wall'?5.3:2.8)));
      for(let i=0;i<count;i++) add(k==='wall'?'muralha':'cerca',
        x+(vertical?0:i*w/count), y+(vertical?i*h/count:0),
        vertical?w:w/count+.02, vertical?h/count+.02:h,vertical);
    } else if (k === 'rock' && w > 8) {
      const count=Math.max(1,Math.round(w/7));
      for(let i=0;i<count;i++) add('penhasco',x+i*w/count-.25,y-1.1,w/count+.5,h+1.1);
    } else if (k === 'rock' || k === 'pillar' || k === 'furniture') {
      if (k === 'furniture' && s === undefined && w > 8) {
        const panel = w / 3;
        for (let i = 0; i < 3; i++) add('estandarte', x + panel*i, y + h - 3, panel - .15, 3);
        continue;
      }
      const well=k==='rock' && x===47.3 && y===43.8;
      const name=well?'poco':k==='furniture'?furniture(b):k==='pillar'?'pillar':'rocha';
      if (name === 'vaso' || name === 'caixotes') {
        if (name === 'vaso' && h > w * 1.75) addCatalog(name, x + w / 2, y + w * 1.1);
        addCatalog(name, x + w / 2, y + h);
      } else if (name === 'banco' || name === 'poco') {
        addAtBase(name, x + w / 2, y + h, name === 'banco' ? 2.75 : 2.35);
      } else add(name, x, y, w, h);
    }
  }
  add('portao',33.8,52.9,10.8,6.7);
  out.sort((a,b)=>a.y-b.y);
  scenes.set(map,out);
  return out;
}

// g está na escala da grade; os objetos altos têm a linha de profundidade nos pés.
export function drawVillageObject(g, obj, x, top, scale) {
  stamp(g,obj.name,x,top,obj.w*scale,obj.h*scale,obj.turn);
}
export function villageGround(g,map,ox,oy,scale) {
  g.save();
  g.translate(ox*scale,oy*scale); g.scale(scale,scale);
  g.beginPath();g.rect(0,0,map.width,map.height);g.clip();
  g.imageSmoothingEnabled=false;
  g.fillStyle=patterns.grama;g.fillRect(0,0,map.width,map.height);
  g.lineCap='round';g.lineJoin='round';
  for(const road of paths) stroke(g,road.path,'#907943',road.width+.18);
  for(const road of paths) stroke(g,road.path,patterns.terra,road.width);
  fill(g,plaza,patterns.pedra);stroke(g,plaza,'#6c675c',.28);stroke(g,plaza,'#c8bda7',.11);
  stroke(g,plazaFrieze,'#96816a',.075);
  ellipse(g,'#97887a',39,45.55,2.23,2.23);ellipse(g,'#c7b8a1',39,45.55,2.13,2.13);
  stamp(g,'flor',37,43.55,4,4);
  const arena=map.arenas[0];
  g.fillStyle=patterns.terra;g.fillRect(arena.x,arena.y,arena.w,arena.h);
  g.strokeStyle='#c0a279';g.lineWidth=.10;
  g.strokeRect(arena.x+.8,arena.y+.8,arena.w-1.6,arena.h-1.6);
  g.beginPath();g.ellipse(arena.x+arena.w/2,arena.y+arena.h/2,3.4,2.65,0,0,2*Math.PI);g.stroke();
  fill(g,canal,patterns.agua);stroke(g,canal,'#585953',canalEdge);stroke(g,canal,'#aa9f88',.13);
  for (const b of map.areas) if (b.g === 'bridge') drawBridge(g, b);
  stamp(g,'grade',11.9,50.6,3.7,1.75);
  const objects = villageObjects(map);
  riverGarden(g, objects);
  for(const p of objects){
    if(p.name==='muralha' || p.name==='cerca') continue;
    ellipse(g,'rgba(49,43,36,.18)',p.x+p.w*.55,p.y-.02,Math.max(.25,p.w*.47),Math.min(.49,p.h*.10));
  }
  g.restore();
}
