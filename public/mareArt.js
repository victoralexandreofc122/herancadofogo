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
