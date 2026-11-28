import { frames, scenes } from './sedeLayout.js';

let atlas;
export function civicScene(id) {
  return id === 'gabinete_chama' ? scenes.kage : id === 'missoes_chama' ? scenes.missoes : null;
}
export function civicReady(refresh) {
  if (!atlas) {
    atlas = new Image();
    atlas.onload = refresh;
    atlas.src = '/mapas/pecas/sede.webp';
  }
  return atlas.complete && atlas.naturalWidth > 0;
}
export function civicPaint(g, pieces, x, y, tile) {
  const unit = tile / 16;
  g.save();
  g.imageSmoothingEnabled = false;
  for (const [name, px, py] of pieces) {
    const frame = frames[name];
    g.drawImage(atlas, ...frame, x+px*unit, y+py*unit, frame[2]*unit, frame[3]*unit);
  }
  g.restore();
}
export function civicSideDoor(g,x,y,tile) {
  g.save();
  g.imageSmoothingEnabled = false;
  g.drawImage(atlas,...frames.entrada,x,y,2.3*tile,2.65*tile);
  g.restore();
}
