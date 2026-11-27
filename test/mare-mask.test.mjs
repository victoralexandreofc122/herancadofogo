import assert from 'node:assert/strict';
import { blendMarePixels, mareWaterWeight, MARE_REACH } from '../public/mareArt.js';
const W=768,H=384,S=48, X=40,Y=24;
const water=new Uint8ClampedArray(96*96*4);
for(let y=0;y<96;y++)for(let x=0;x<96;x++){let i=(y*96+x)*4;water.set([119+(x+y)%7,155+(x+y)%7,170+(x+y)%7,255],i);}
const base=new Uint8ClampedArray(W*H*4);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const worldX=X+(x+.5)/S,worldY=Y+(y+.5)/S;
 let c=[163,159,137,255];
 if(worldY>=27.36&&worldY<=29.5&&worldX>42.98)c=[145,180,200,255];
 if(worldX>43.6&&worldX<44.2&&worldY>27.7&&worldY<29.6)c=[83,119,75,255];
 if(worldX>50&&worldY>28.8)c=[39,62,71,255];
 if(worldX>48&&worldX<48.3&&worldY>27.6&&worldY<27.9)c=[230,238,240,255];
 base.set(c,(y*W+x)*4);
}
const full=base.slice(); const count=blendMarePixels(full,W,H,X,Y,S,water);assert(count>0);
const split=base.slice();
for(let chunk=0;chunk<2;chunk++){
 const sub=new Uint8ClampedArray(384*H*4);
 for(let y=0;y<H;y++)sub.set(base.subarray((y*W+chunk*384)*4,(y*W+chunk*384+384)*4),y*384*4);
 blendMarePixels(sub,384,H,X+chunk*8,Y,S,water);
 for(let y=0;y<H;y++)split.set(sub.subarray(y*384*4,(y+1)*384*4),(y*W+chunk*384)*4);
}
assert.deepEqual(split,full,'chunk seam changed pixels');
const at=(a,x,y)=>a.slice((Math.floor((y-Y)*S)*W+Math.floor((x-X)*S))*4,(Math.floor((y-Y)*S)*W+Math.floor((x-X)*S))*4+4);
for(const p of [[44,28],[52,29],[48.1,27.7],[43,26],[55.5,28],[42,28]])assert.deepEqual(at(full,...p),at(base,...p),`protected ${p}`);
assert.notDeepEqual(at(full,46,28),at(base,46,28));
assert.equal(mareWaterWeight(145,180,200,MARE_REACH.x,28),0);
assert.equal(blendMarePixels(full,W,H,X,Y,0,water),0);
console.log(JSON.stringify({changedPixels:count,chunkEqual:true,protectedSamples:6,waterChanged:true,invalidScaleRejected:true}));
