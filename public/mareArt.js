// Maré Oculta: superfície estática, independente da margem, ponte e colisão.
export const MARE_WATER_PX = 96;
export const MARE_ART_PX_PER_CELL = 24;
export const MARE_WATER_URL = '/mapas/pecas/mare/agua.png';
// A máscara é obrigatória: a arte antiga contém bambus, margens e telhados fundidos.
// ox/oy = origem do mapa no contexto de destino, em casas; scale = unidades/casa.
// clip é um Path2D em coordenadas locais do mapa, validado pelo integrador.
export function drawMareWater(g, image, clip, ox, oy, scale, bounds) {
  if (!image || image.naturalWidth !== MARE_WATER_PX || image.naturalHeight !== MARE_WATER_PX || !clip) return false;
  const pattern = g.createPattern(image, 'repeat');
  if (!pattern) return false;
  pattern.setTransform(new DOMMatrix().scale(1 / MARE_ART_PX_PER_CELL));
  g.save();
  try {
    g.translate(ox * scale, oy * scale);
    g.scale(scale, scale);
    g.imageSmoothingEnabled = false;
    g.clip(clip);
    g.fillStyle = pattern;
    g.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  } finally { g.restore(); }
  return true;
}

// A arte anterior tem a margem e a vegetacao fundidas. Esta e uma substituicao
// de superficie restrita ao canal, nao uma mudanca do mapa ou de colisao.
// Faixa visual medida nos chunks 5_3/6_3; a caixa de agua do servidor e maior.
export const MARE_REACH = Object.freeze({ x: 42.98, y: 27.36, w: 12.02, h: 1.77 });
const smooth = (lo, hi, v) => { const t = Math.max(0, Math.min(1, (v-lo)/(hi-lo))); return t*t*(3-2*t); };
const mod = (a, n) => ((a % n) + n) % n;
let tile, tilePixels, loading = false;
const patched = new WeakMap();

export function mareArtReady(invalidate) {
  if (tilePixels) return true;
  if (!loading) {
    loading = true;
    tile = new Image();
    tile.onload = () => {
      if (tile.naturalWidth !== MARE_WATER_PX || tile.naturalHeight !== MARE_WATER_PX) { loading = false; return; }
      const c = document.createElement('canvas'); c.width = c.height = MARE_WATER_PX;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(tile, 0, 0); tilePixels = g.getImageData(0, 0, c.width, c.height).data;
      invalidate();
    };
    tile.onerror = () => { setTimeout(() => { loading = false; }, 8000); };
    tile.src = MARE_WATER_URL;
  }
  return false;
}

// A mascara usa apenas a cor do pixel original e a coordenada global; nao
// depende da borda do chunk. As margens, reflexos brancos, contornos escuros
// e bambu verde permanecem intocados. O teste visual em jogo ainda e necessario.
export function mareWaterWeight(r, g, b, x, y) {
  const a = MARE_REACH;
  if (x <= a.x || x >= a.x+a.w || y <= a.y || y >= a.y+a.h) return 0;
  const geometry = smooth(0,.44,x-a.x)*smooth(0,.64,a.x+a.w-x)*smooth(0,.13,y-a.y)*smooth(0,.18,a.y+a.h-y);
  const color = smooth(5,18,g-r)*smooth(2,12,b-g)*smooth(113,143,g)*smooth(133,165,b)*(1-smooth(218,241,b))*(1-smooth(191,215,r));
  return .78 * geometry * color;
}

// Puro: pode ser testado com RGBA de uma imagem inteira ou de chunks.
// Retorna a quantidade de pixels que receberam composicao. Alpha nao muda.
export function blendMarePixels(rgba, width, height, sourceX, sourceY, pxPerCell, waterRgba) {
  if (!Number.isFinite(pxPerCell) || pxPerCell <= 0 || waterRgba?.length !== MARE_WATER_PX*MARE_WATER_PX*4 || rgba.length !== width*height*4) return 0;
  const a = MARE_REACH;
  const x0 = Math.max(0, Math.floor((a.x-sourceX)*pxPerCell));
  const y0 = Math.max(0, Math.floor((a.y-sourceY)*pxPerCell));
  const x1 = Math.min(width, Math.ceil((a.x+a.w-sourceX)*pxPerCell));
  const y1 = Math.min(height, Math.ceil((a.y+a.h-sourceY)*pxPerCell));
  let changed = 0;
  for (let py=y0; py<y1; py++) for (let px=x0; px<x1; px++) {
    const x = sourceX+(px+.5)/pxPerCell, y = sourceY+(py+.5)/pxPerCell;
    const i = (py*width+px)*4;
    if (rgba[i+3] !== 255) continue;
    const w = mareWaterWeight(rgba[i],rgba[i+1],rgba[i+2],x,y);
    if (w <= .001) continue;
    const tx = mod(Math.floor(x*MARE_ART_PX_PER_CELL+1e-8),MARE_WATER_PX);
    const ty = mod(Math.floor(y*MARE_ART_PX_PER_CELL+1e-8),MARE_WATER_PX);
    const j = (ty*MARE_WATER_PX+tx)*4;
    for (let k=0;k<3;k++) rgba[i+k] = Math.round(rgba[i+k]*(1-w)+waterRgba[j+k]*w);
    changed++;
  }
  return changed;
}

// Chunks de arte existentes continuam como base apenas durante a transicao.
// Esta camada independe deles: e possivel retirar a mascara quando a margem
// e os objetos forem reconstruidos. Cache por imagem, sem trabalho por frame.
export function mareWaterImage(original, sourceX, sourceY, pxPerCell) {
  if (!tilePixels || !original?.naturalWidth || !original?.naturalHeight || !Number.isFinite(pxPerCell) || pxPerCell <= 0) return original;
  const a = MARE_REACH, width = original.naturalWidth, height = original.naturalHeight;
  if (sourceX >= a.x+a.w || sourceY >= a.y+a.h || sourceX+width/pxPerCell <= a.x || sourceY+height/pxPerCell <= a.y) return original;
  let cache = patched.get(original);
  if (!cache) { cache = new Map(); patched.set(original, cache); }
  const key = `${sourceX},${sourceY},${pxPerCell}`;
  if (cache.has(key)) return cache.get(key);
  let result = original;
  try {
    const c = document.createElement('canvas'); c.width=width; c.height=height;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(original,0,0);
    const pixels = g.getImageData(0,0,width,height);
    if (blendMarePixels(pixels.data,width,height,sourceX,sourceY,pxPerCell,tilePixels)) {
      g.putImageData(pixels,0,0); result = c;
    }
  } catch { /* original remains visible if readback is not available */ }
  cache.set(key,result);
  return result;
}
