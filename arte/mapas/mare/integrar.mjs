// Execute na raiz do checkout exclusivo da Mare. Sem --apply, nao grava nada.
// Revisar e coordenar com a frente da Academia/lojas antes de aplicar.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(process.cwd());
const apply=process.argv.includes('--apply');
const changes={
  'public/game.js':[
    ["import { chamaReady, drawVillageObject, villageGround, villageObjects } from './chamaArt.js';", "import { chamaReady, drawVillageObject, villageGround, villageObjects } from './chamaArt.js';\nimport { mareArtReady, mareWaterImage } from './mareArt.js';"],
    ["      g.drawImage(mini, 0, 0, c.width, c.height);\n      if (map.art === 'folha')", "      const mareMini = map.art === 'nevoa' && modularMareReady() ? mareWaterImage(mini, 0, 0, mini.naturalWidth / map.width) : mini;\n      g.drawImage(mareMini, 0, 0, c.width, c.height);\n      if (map.art === 'folha')"],
    ["function modularChamaReady() {\n  return chamaReady(() => { chunkCache.clear(); minimap.mapId = null; });\n}", "function modularChamaReady() {\n  return chamaReady(() => { chunkCache.clear(); minimap.mapId = null; });\n}\nfunction modularMareReady() {\n  return mareArtReady(() => { chunkCache.clear(); minimap.mapId = null; });\n}"],
    ["    g.drawImage(p.img, (p.x - cx * CHUNK) * U, (p.y - cy * CHUNK) * U, p.img.naturalWidth / ART, p.img.naturalHeight / ART);", "    const marePiece = p.r.art === 'nevoa' && modularMareReady()\n      ? mareWaterImage(p.img, p.x - p.r.x, p.y - p.r.y, ART * U) : p.img;\n    g.drawImage(marePiece, (p.x - cx * CHUNK) * U, (p.y - cy * CHUNK) * U, p.img.naturalWidth / ART, p.img.naturalHeight / ART);"]
  ],
  'src/web/staticFiles.ts':[
    ["  { route: '/chamaArt.js', file: 'chamaArt.js', contentType: 'text/javascript; charset=utf-8' },", "  { route: '/chamaArt.js', file: 'chamaArt.js', contentType: 'text/javascript; charset=utf-8' },\n  { route: '/mareArt.js', file: 'mareArt.js', contentType: 'text/javascript; charset=utf-8' },\n  { route: '/mapas/pecas/mare/agua.png', file: 'mapas/pecas/mare/agua.png', contentType: 'image/png', binary: true },"]
    , ["  { route: '/mapas/pecas/mare/agua.png', file: 'mapas/pecas/mare/agua.png', contentType: 'image/png', binary: true },", "  { route: '/mapas/pecas/mare/agua.png', file: 'mapas/pecas/mare/agua.png', contentType: 'image/png', binary: true },\n  { route: '/mapas/pecas/mare/margem-norte.png', file: 'mapas/pecas/mare/margem-norte.png', contentType: 'image/png', binary: true },"]
  ]
};
const pending=[];
for(const [path, pairs] of Object.entries(changes)){
  const file=resolve(root,path); let content=readFileSync(file,'utf8');
  for(const [from,to] of pairs){
    if(content.includes(to))continue;
    if(content.split(from).length!==2)throw new Error(`Ancora ausente ou ambigua: ${path}: ${from.slice(0,90)}. Rebase/revise sem sobrescrever outras frentes.`);
    content=content.replace(from,to);
  }
  pending.push({file,content});
}
if(apply)for(const {file,content} of pending)writeFileSync(file,content);
console.log(apply?'Integracao aplicada ao checkout local. Rode npm run verify e teste a travessia.':'Ancoras conferidas; nenhum arquivo alterado.');
