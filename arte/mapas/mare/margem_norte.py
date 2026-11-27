"""Single original repeating north-bank tile, 96 x 30 px (4 x 1.25 cells)."""
from PIL import Image, ImageDraw
from pathlib import Path
import random

W,H=96,30
rng=random.Random(37)
im=Image.new('RGBA',(W,H))
# Work on a three-repeat canvas, then crop the centre; joints wrap across ends.
work=Image.new('RGBA',(W*3,H)); d=ImageDraw.Draw(work)
cap=['#a5ad9d','#b0b6a5','#a8b2a2','#a0aa9b','#abb1a1']
face=['#77877e','#829189','#89968c','#798980','#8d9a90']
low=['#687b74','#70847c','#758982','#62766f']
# Stone boundaries selected independently for the cap and two courses.
for base in [-96,0,96,192,288]:
    off=base+96
    # Irregular bevel, cap top in y 2-11 (y 26.25-26.67 in map coordinates).
    for i,(x,w,t) in enumerate([(0,18,2),(18,20,1),(38,17,3),(55,23,2),(78,18,1)]):
        x+=off
        d.polygon([(x,t+2),(x+2,t),(x+w-3,t),(x+w-1,t+2),(x+w-1,10),(x+w-3,12),(x+1,12),(x,10)],fill=cap[i])
        d.line([(x+2,t+1),(x+w-4,t+1)],fill='#bfc3ae',width=1)
        d.line([(x+1,t+3),(x+1,9)],fill='#a3ad9c')
        d.line([(x+2,11),(x+w-3,11)],fill='#84948a')
        d.line([(x+w-1,t+3),(x+w-1,11)],fill='#7f9085')
    # Facing courses: staggered joints, dark at waterline, softly lit bevel.
    d.rectangle((off,12,off+95,27),fill='#667970')
    for i,(x,w) in enumerate([(-8,23),(15,17),(32,24),(56,20),(76,12),(88,23)]):
        x+=off
        col=face[i%len(face)]
        d.polygon([(x+1,13),(x+w-2,13),(x+w-1,15),(x+w-2,20),(x+2,20),(x,18)],fill=col)
        d.line([(x+2,13),(x+w-3,13)],fill='#a0a99a')
        d.line([(x+2,20),(x+w-3,20)],fill='#647970')
    for i,(x,w) in enumerate([(0,10),(10,22),(32,16),(48,25),(73,23)]):
        x+=off
        d.polygon([(x+1,22),(x+w-2,22),(x+w-1,24),(x+w-2,26),(x+1,26),(x,24)],fill=low[i%len(low)])
        d.line([(x+2,22),(x+w-3,22)],fill='#85968a')
    d.line([(off,27),(off+95,27)],fill='#526f68')
    d.line([(off,28),(off+95,28)],fill=(63,103,100,150))
    d.line([(off,29),(off+95,29)],fill=(69,120,118,60))
im=work.crop((96,0,192,H));d=ImageDraw.Draw(im)
# Small hand-placed weathering and moss; no vegetation sprite or lighting baked in.
for x,y,w,h,c in [(5,5,5,1,'#a0a99b'),(13,8,3,2,'#939f8e'),(25,4,6,1,'#a0ad99'),(44,8,4,1,'#b5bbaa'),(62,5,7,1,'#9da995'),(82,7,5,2,'#93a18d'),(20,16,5,1,'#697e70'),(38,18,7,1,'#839a83'),(59,17,4,1,'#708676'),(78,15,3,1,'#788e7b'),(6,24,3,1,'#597467'),(45,25,5,1,'#5d796b'),(85,24,5,1,'#597569')]:
    d.rectangle((x,y,x+w-1,y+h-1),fill=c)
for x,y in [(17,10),(18,9),(19,10),(20,11),(21,11),(53,10),(54,9),(55,10),(56,11),(57,11),(57,12),(75,9),(76,10),(77,11),(78,11),(79,12),(8,20),(9,21),(10,20),(33,20),(34,21),(35,20),(74,21),(75,20)]:
    d.point((x,y),fill=rng.choice(['#73886c','#839579','#6f836c']))
# Repeat at exactly the same phase. All art remains independent from ground/water.
if __name__=='__main__':
    out=Path(__file__).resolve().parents[3]/'public/mapas/pecas/mare/margem-norte.png'
    out.parent.mkdir(parents=True,exist_ok=True);im.save(out,optimize=True)
