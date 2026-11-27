"""Maré Oculta: fonte original do tile de água, 4 x 4 casas, 24 px/casa."""
from pathlib import Path
from PIL import Image
import math

N = 96
BASE = (119, 155, 170)
DEEP = (114, 150, 165)
MID = (123, 159, 173)
RIPPLE = (134, 169, 181)
SHADOW = (111, 147, 162)
# Ondulações baixas e horizontais: leitura de água calma sob céu encoberto.
# Todas as marcas são desenhadas no toro, sem costura na repetição.

def generate():
    im = Image.new('RGB', (N, N), BASE)
    for y in range(N):
        for x in range(N):
            v = (math.sin(2*math.pi*(x/96+y/24)) +
                 0.7*math.sin(2*math.pi*(x/96-y/19.2)) +
                 0.35*math.cos(2*math.pi*(x/48+y/32)))
            if v < -1.20:
                im.putpixel((x, y), DEEP)
            elif v > 1.24:
                im.putpixel((x, y), MID)
    # [x, y, comprimento, curva]: composição manual, não ruído aleatório.
    marks = [(91,9,12,1),(23,5,10,0),(47,17,16,1),(71,24,9,0),
             (6,31,15,1),(31,39,11,0),(60,43,17,1),(86,48,12,0),
             (14,55,9,0),(42,65,18,1),(76,67,13,1),(93,79,9,0),
             (24,85,14,1),(55,91,12,0),(69,4,6,0),(2,69,7,0)]
    def put(x,y,c):
        im.putpixel((x%N,y%N),c)
    for k,(x,y,length,bend) in enumerate(marks):
        for i in range(length):
            yy = y + (1 if bend and i >= length-3 else 0)
            put(x+i,yy,RIPPLE if 1 <= i < length-1 else MID)
        # Reflexo inferior curto, sem branco especular ou espuma de borda.
        if k%3 != 1:
            for i in range(2,length-3):
                put(x+i,y+2,SHADOW)
    return im

if __name__ == '__main__':
    out = Path(__file__).resolve().parents[3] / 'public/mapas/pecas/mare/agua.png'
    out.parent.mkdir(parents=True, exist_ok=True)
    generate().save(out, optimize=True)
    print(out)
