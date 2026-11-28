import { frames } from './hospitalFrames.js';

let atlas;
const floor = [];
export const hospitalFurniture = [];
function group(x, y, foot, pieces) {
  hospitalFurniture.push({ hospital: pieces, x: x/16, top: y/16, y: foot/16 });
}
for (let y=32; y<192; y+=64) for (let x=0; x<256; x+=64) {
  floor.push([y===160 ? 'piso_meio' : 'piso',x,y]);
}
for (let x=0; x<256; x+=64) floor.push(['reboco',x,8],['rodape',x,32]);
for (let x=0; x<256; x+=32) floor.push(['viga',x,0]);
for (const x of [0,246]) floor.push(['pilar',x,0]);
for (const x of [57,170]) floor.push(['janela_fundo',x+2,7],['janela_moldura',x,5]);
floor.push(['placa',112,8]);
for (let x=0; x<256; x+=16) if(x<112||x>=144) floor.push(['friso',x,176]);
floor.push(['batente',104,169],['batente',144,169]);
for (const x of [20,206]) {
  floor.push(['cama_sombra',x,82]);
  group(x,76,121,[['cama_estrutura',0,0],['cama_colchao',4,10],['cama_travesseiro',6,11],['cama_manta',4,22],['cama_peseira',0,34]]);
}
// Na lateral do leito, o tecido recolhido permite enxergar a cabeceira.
for (const x of [51,173]) group(x,70,105,[['biombo_ia01_trilho',0,0],['biombo_ia01_poste',0,0],['biombo_ia01_tecido',3,3]]);
floor.push(['balcao_sombra',97,61],['armario_sombra',11,45],['caixa_sombra',219,58],['banco_sombra',11,153],['vaso_sombra',220,151]);
group(98,47,72,[['balcao',0,0],['livro',20,2],['halo',32,-20],['luminaria',45,-9]]);
group(12,13,55,[['armario_vazio',0,0],['prateleira',3,19],['prateleira',3,32],['frasco_00',4,6,7,13],['frasco_01',13,6,7,13],['frasco_02',22,6,7,13],['toalha',5,25,13,7]]);
group(220,47,67,[['caixa',0,0]]);
group(12,145,162,[['banco',0,0]]);
group(221,129,160,[['vaso',0,16],['folhagem',-2,0]]);

function paint(g,pieces,x,y,s) {
  g.save();g.imageSmoothingEnabled=false;
  for(const [name,dx,dy,width,height] of pieces){
    const frame=frames[name];
    g.drawImage(atlas,...frame,x+dx*s,y+dy*s,(width??frame[2])*s,(height??frame[3])*s);
  }
  g.restore();
}
export function hospitalReady(refresh) {
  if(!atlas){atlas=new Image();atlas.onload=refresh;atlas.src='/mapas/pecas/hospital.webp';}
  return atlas.complete && atlas.naturalWidth>0;
}
export function hospitalGround(g,x,y,unit){paint(g,floor,x,y,unit/16);}
export function hospitalObject(g,obj,x,y,tile){paint(g,obj.hospital,x,y,tile/16);}
