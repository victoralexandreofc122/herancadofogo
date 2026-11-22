import re, os, numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi
R='/home/user/Servidor-missoes'; V=R+'/public/assets/vfx'; S=os.path.dirname(os.path.abspath(__file__))
CASAS={m.group(1):float(m.group(2)) for m in re.finditer(r'(\w+): \{"casas": ([\d.]+)',open(R+'/public/vfxFogo.js').read())}
F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',15)
T=32*2   # a casa no jogo (32 px) em 2x

def tonaliza(im, rampa, contorno):
    """Silhueta branca lisa -> 3 tons da rampa (claro no meio, médio e sombra perto da borda, luz de cima) e contorno de 1 px."""
    a=np.array(im.convert('RGBA')); op=a[:,:,3]>128
    op=np.pad(op,1); out=np.zeros(op.shape+(4,),np.uint8)
    dist=ndi.distance_transform_edt(op)
    yy=np.arange(op.shape[0])[:,None].repeat(op.shape[1],1)
    cy=yy[op].mean() if op.any() else 0
    for lim,cor in [(99,rampa[0]),(2,rampa[1]),(1,rampa[2])]:
        m=op&(dist<=lim); out[m]=cor+(255,)
    sombra=op&(dist<=2)&(yy>cy); out[sombra]=rampa[2]+(255,)   # a luz vem de cima: a borda de baixo mais escura
    borda=ndi.binary_dilation(op)&~op; out[borda]=contorno+(255,)
    return Image.fromarray(out)

def limpa(im, n=14):
    """Granulado (ruído do gerador ou do jpeg) -> paleta de n cores, alfa de 2 níveis."""
    a=im.convert('RGBA'); al=np.array(a)[:,:,3]
    q=a.convert('RGB').quantize(n, method=Image.Quantize.MEDIANCUT).convert('RGBA')
    q=np.array(q); q[:,:,3]=np.where(al>110,255,0); return Image.fromarray(q)

def alfa_duro(im):
    a=np.array(im.convert('RGBA')); al=a[:,:,3].astype(int)
    a[:,:,3]=np.select([al<70,al<170],[0,170],255); return Image.fromarray(a)

def tela(im, casas):
    """Do jeito que aparece no jogo (2x): a largura em casas x 64 px, sem borrar."""
    w=max(1,round(casas*T)); h=max(1,round(im.height*w/im.width))
    return im.resize((w,h),Image.NEAREST)

linhas=[]
RAMPA_TAI=[(252,236,200),(244,178,92),(206,112,44)]; CONT_TAI=(58,26,12)
for k,q in [('taijutsu_3','03'),('taijutsu','03'),('weapons_corte','03')]:
    n=f'{k}_{q}'; im=Image.open(f'{V}/{n}.png')
    linhas.append((f'{k}: silhueta branca lisa -> 3 tons + contorno (a paleta do Taijutsu desenhado)', [tela(im,CASAS[n])], [tela(tonaliza(im,RAMPA_TAI,CONT_TAI),CASAS[n])]))
for k in ['heal_milagre','rubro_chamas','lightning_maos','weapons_polida']:
    n=f'{k}_04'; a=Image.open(f'{V}/{n}.png'); b=Image.open(f'{S}/vfx/{n}.png')
    linhas.append((f'{k}: pixel fora do tamanho do jogo -> recortado de novo a 33 px por casa', [tela(a,CASAS[n])], [tela(b,CASAS[n])]))
for k in ['lightning_rede','illusion_4','weapons_arsenal']:
    n=f'{k}_04'; im=Image.open(f'{V}/{n}.png')
    linhas.append((f'{k}: granulado -> paleta limpa de 14 cores', [tela(im,CASAS[n]*1.6)], [tela(limpa(im),CASAS[n]*1.6)]))
for k in ['heal_disturbio','heal_4']:
    n=f'{k}_04'; im=Image.open(f'{V}/{n}.png')
    linhas.append((f'{k}: brilho borrado -> alfa em 2 níveis (o brilho vem das partículas de código)', [tela(im,CASAS[n])], [tela(alfa_duro(im),CASAS[n])]))
for i in range(0,len(linhas),4):
    grupo=linhas[i:i+4]
    W=1400; H=sum(30+max(max(x.height for x in a),max(x.height for x in b))+16 for _,a,b in grupo)
    o=Image.new('RGB',(W,H),(52,58,70)); d=ImageDraw.Draw(o); y=0
    for t,a,b in grupo:
        d.text((8,y+4),t,font=F,fill=(255,230,160)); y+=30
        x=8; d.text((x,y),'ANTES',font=F,fill=(240,160,120))
        for im in a: o.paste(im,(x+70,y),im); x+=70+im.width+30
        d.text((700,y),'DEPOIS',font=F,fill=(140,230,140))
        for im in b: o.paste(im,(780,y),im)
        y+=max(max(x.height for x in a),max(x.height for x in b))+16
    o.save(f'{S}/previa_{i//4+1}.png'); print(o.size)
