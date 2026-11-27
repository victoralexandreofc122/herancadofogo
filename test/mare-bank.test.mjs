import assert from 'node:assert/strict';
import {blendMareBankPixels,MARE_BANK_REACH,MARE_BANK_PX} from '../public/mareArt.js';
const bank=new Uint8ClampedArray(MARE_BANK_PX.w*MARE_BANK_PX.h*4);
for(let y=0;y<MARE_BANK_PX.h;y++)for(let x=0;x<MARE_BANK_PX.w;x++)bank.set([110+x%23,140-y,130-y, y===0?0:255],(y*MARE_BANK_PX.w+x)*4);
for(const S of [48,4]){
 const W=16*S,H=8*S,X=40,Y=24,base=new Uint8ClampedArray(W*H*4);
 for(let i=0;i<base.length;i+=4)base.set([151,159,157,255],i);
 const full=base.slice(),split=base.slice();const n=blendMareBankPixels(full,W,H,X,Y,S,bank);assert(n>0);
 for(let c=0;c<2;c++){const sub=new Uint8ClampedArray(8*S*H*4);for(let y=0;y<H;y++)sub.set(base.subarray((y*W+c*8*S)*4,(y*W+(c+1)*8*S)*4),y*8*S*4);blendMareBankPixels(sub,8*S,H,X+c*8,Y,S,bank);for(let y=0;y<H;y++)split.set(sub.subarray(y*8*S*4,(y+1)*8*S*4),(y*W+c*8*S)*4);}
 assert.deepEqual(split,full);let changed=0;const a=MARE_BANK_REACH;
 for(let i=0;i<base.length;i+=4){if(base[i]===full[i]&&base[i+1]===full[i+1]&&base[i+2]===full[i+2])continue;const j=i/4,x=X+(j%W+.5)/S,y=Y+(Math.floor(j/W)+.5)/S;assert(x>a.x&&x<a.x+a.w&&y>=a.y&&y<a.y+a.h);assert.equal(full[i+3],255);changed++;}
 console.log(JSON.stringify({scale:S,changed,chunkEqual:true,outsideChanged:0}));
}
