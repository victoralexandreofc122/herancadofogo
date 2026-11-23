"""Monta a Aldeia da Chama Eterna de novo, com as peças do Flow (arte/mapas/pecas/), e fatia nos blocos do jogo.

  npx tsx -e "import {WORLD_MAPS} from './src/realtime/maps.ts'; console.log(JSON.stringify(WORLD_MAPS['map_1']))" > /tmp/map1.json
  python3 arte/mapas/montar_chama.py /tmp/map1.json [--saida public/mapas/chama] [--previa previa.png]

A planta (onde fica cada prédio, o rio, as ruas, a praça e o portão) é a de hoje: as colisões do servidor continuam
valendo. O chão é todo refeito com as peças novas:
- grama: a cor de base do gramado do Flow, manchas nos dois tons de sombra (com pontilhado na borda) e os tufos e flores
  da imagem espalhados como carimbos (sorteio com semente: sai igual toda vez);
- terra: o miolo da trilha do Flow, repetido e espelhado, com a beira escura onde encosta na grama;
- praça: o calçamento do Flow, com o mosaico da flor de chama no meio;
- água: desenhada aqui (o Canal de água ainda não chegou), com a borda de pedra.
As casas que já chegaram (pequena, média e cabana de palha) entram no lugar das casas de morar. O que ainda não chegou
(sede, hospital, Academia, lojas, árvores, muralha, montanha, pontes e os miúdos) fica provisório: recortado da arte de
hoje (arte/vilas/folha_ampliada.jpg) sem o chão em volta, por cima do chão novo. Cada peça que chegar sai dessa lista.
As árvores antigas são o caso difícil: o alto da copa tem a cor da grama e não tem contorno, então vêm num oval macio
com os verdes passados para o tom da grama nova (copa_redonda e verde_novo). Tudo ganha a sombra no chão (para baixo e
à direita, a luz vem do alto à esquerda), menos as árvores antigas, que já trazem a delas pintada.

Imprime as paredes novas das casas trocadas (para FOLHA_ART em src/realtime/maps.ts) e as luzes das janelas.
"""
import argparse
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.join(AQUI, '..', '..')
PECAS = os.path.join(AQUI, 'pecas')
PX = 48            # pixels por casa (a tela)
G = 3              # a grade de pixels do Flow na tela (3 px por pixel)
CHUNK = 8

# As casas de morar trocadas pelas peças novas: (peça, centro x em casas, base y em casas). A caixa antiga sai.
CASAS = [
    ('chama_casa_media', 6.0, 13.4), ('chama_casa_pequena', 6.0, 20.6),       # as duas da esquerda, em cima
    ('chama_casa_palha', 13.4, 10.6),                                         # a cabana de cima
    ('chama_casa_pequena', 67.2, 11.0), ('chama_casa_media', 72.0, 13.9), ('chama_casa_palha', 72.5, 20.9),
    ('chama_casa_media', 5.7, 36.6), ('chama_casa_pequena', 6.2, 47.2),
]
# As casas de morar da arte antiga (FOLHA_ART em maps.ts): saem do desenho e da colisão.
CASAS_VELHAS = [(3.2, 6.5, 5.5, 14.3), (10.5, 5.8, 5.8, 4.9), (62.6, 5.8, 6.65, 5.3), (69.25, 6.8, 5.55, 7.2),
                (70, 14, 5, 7), (2.9, 29.4, 5.6, 7.35), (2.9, 40, 6.7, 7.3)]
MOSAICO = ('chama_mosaico', 38.8, 45.4)
# As janelas de cada casa (fração da largura e da altura da peça): de noite o jogo acende a luz nelas.
JANELAS = {'chama_casa_media': [(0.17, 0.62), (0.83, 0.62)], 'chama_casa_pequena': [(0.26, 0.6)]}     # centro, em casas (o lugar do mosaico de hoje)


def rgba(nome):
    return np.asarray(Image.open(os.path.join(PECAS, nome + '.png')).convert('RGBA'))


def rng(semente):
    return np.random.default_rng(semente)


# ------------------------------------------------------------------ a planta do chão, medida na arte de hoje

def classes_do_chao(old, L):
    """Grama (0), terra (1), pedra da praça (2), água (3) em blocos de 1/4 de casa; o que é objeto pega o vizinho."""
    W, H = L['width'], L['height']
    bl = np.asarray(Image.fromarray(old).resize((W * 4, H * 4), Image.BOX)).astype(int)
    r, g, b = bl[..., 0], bl[..., 1], bl[..., 2]
    mx, mn = bl.max(axis=2), bl.min(axis=2)
    cls = np.full((H * 4, W * 4), -1)
    cls[(g >= r + 4) & (g > b + 8)] = 0
    cls[(r > g + 10) & (g > b + 6) & (mx > 95)] = 1
    yy, xx = np.mgrid[0:H * 4, 0:W * 4] / 4.0
    praca = ((xx >= 22.3) & (xx < 55.7) & (yy >= 38) & (yy < 52.7)) | ((xx >= 36.3) & (xx < 41.6) & (yy >= 52.7))
    cls[(mx - mn < 30) & (mx > 90) & (mx < 205) & praca] = 2
    cls[(b > g + 8) & (b > r + 35)] = -1
    cls[cls == 3] = -1                         # a água vem só das áreas do servidor (o capacho azul não é poça)
    for a in L['areas']:                       # as áreas do servidor mandam onde existem
        if a['g'] in ('water', 'stone', 'arena'):
            k = {'water': 3, 'stone': 2, 'arena': 1}[a['g']]
            sel = (xx >= a['x']) & (xx < a['x'] + a['w']) & (yy >= a['y']) & (yy < a['y'] + a['h'])
            if k == 3:
                cls[sel] = 3
            elif k == 2:
                cls[sel & (cls != 3)] = 2
            else:
                cls[sel] = 1
        if a['g'] == 'bridge':
            sel = (xx >= a['x']) & (xx < a['x'] + a['w']) & (yy >= a['y']) & (yy < a['y'] + a['h'])
            cls[sel] = 3
    obj = cls < 0
    _, (iy, ix) = ndimage.distance_transform_edt(obj, return_indices=True)
    cls = cls[iy, ix]
    # bordas redondas, na grade de 3 px: cada classe vira um campo suave e ganha a maior
    Wg, Hg = W * PX // G, H * PX // G
    campos = []
    for k in range(4):
        m = Image.fromarray(((cls == k) * 255).astype(np.uint8)).resize((Wg, Hg), Image.BILINEAR)
        campos.append(ndimage.gaussian_filter(np.asarray(m).astype(float), 2.2))
    return np.argmax(np.stack(campos), axis=0)          # (Hg, Wg)


# ------------------------------------------------------------------ o chão novo

def ruido(shape, escala, semente):
    r = rng(semente).random((shape[0] // escala + 3, shape[1] // escala + 3))
    m = Image.fromarray((r * 255).astype(np.uint8)).resize(((shape[1] // escala + 3) * escala, (shape[0] // escala + 3) * escala), Image.BICUBIC)
    return np.asarray(m).astype(float)[:shape[0], :shape[1]] / 255.0


def borda(mask, n):
    """Células de `mask` a até n células de fora dela."""
    return mask & ndimage.binary_dilation(~mask, iterations=n)


def chao(cls):
    Hg, Wg = cls.shape
    gram = json.load(open(os.path.join(PECAS, 'chama_grama.json')))
    trilha = json.load(open(os.path.join(PECAS, 'chama_trilha.json')))
    out = np.zeros((Hg, Wg, 3), np.uint8)
    yy, xx = np.mgrid[0:Hg, 0:Wg]
    xadrez = (xx + yy) % 2 == 0
    # grama: base, manchas e pontilhado
    base, escuro, medio = np.array(gram['base']), np.array(gram['tons'][0]), np.array(gram['tons'][1])
    out[:] = base
    n = ruido((Hg, Wg), 40, 7) * 0.7 + ruido((Hg, Wg), 13, 8) * 0.3
    out[(n > 0.60) | ((n > 0.57) & xadrez)] = medio
    out[(n > 0.70) | ((n > 0.675) & xadrez)] = escuro
    # terra: o miolo da trilha (na grade de 3 px), espelhado uma coluna sim, outra não
    t = rgba('chama_trilha')[1::G, 1::G, :3]
    th, tw = t.shape[:2]
    col = (xx // tw) % 2
    tx = np.where(col == 0, xx % tw, tw - 1 - xx % tw)
    terra = t[yy % th, tx]
    # praça: o calçamento
    c = rgba('chama_calcamento')[1::G, 1::G, :3]
    pedra = c[yy % c.shape[0], xx % c.shape[1]]
    out[cls == 1] = terra[cls == 1]
    out[cls == 2] = pedra[cls == 2]
    # água: azul com riscos de luz e o fundo mais escuro perto da margem de cima
    agua = cls == 3
    out[agua] = (54, 98, 170)
    r = rng(11)
    for _ in range(int(agua.sum() / 90)):
        y, x = r.integers(0, Hg), r.integers(0, Wg)
        L = r.integers(2, 6)
        if agua[y, x:x + L].all():
            out[y, x:x + L] = (126, 178, 228) if r.random() < 0.5 else (88, 140, 206)
    sombra_agua = agua & ndimage.binary_dilation(~agua, structure=np.array([[0, 1, 0], [0, 0, 0], [0, 0, 0]]), iterations=2)
    out[sombra_agua] = (36, 70, 128)
    # bordas: a beira escura da terra, a guia da praça e a margem de pedra do rio
    out[borda(cls == 1, 1) & ~(cls == 2) & ~agua] = trilha['beira'][0]
    out[ndimage.binary_dilation(cls == 1, iterations=1) & (cls == 0)] = trilha['beira'][1]
    guia = borda(cls == 2, 2) & (cls == 2)
    out[guia] = (98, 96, 102)
    out[borda(cls == 2, 1)] = (52, 44, 46)
    margem = ndimage.binary_dilation(agua, iterations=2) & ~agua
    out[margem] = np.where(((xx // 6 + (yy // 2) % 2) % 3 == 0)[margem][:, None], (70, 64, 62), (138, 134, 126))
    out[ndimage.binary_dilation(agua, iterations=3) & ~ndimage.binary_dilation(agua, iterations=2)] = (52, 44, 46)
    # carimbos (tufos e flores) na grama, longe das bordas
    tira = rgba('chama_grama_carimbos')
    longe = ndimage.binary_erosion(cls == 0, iterations=6)
    r = rng(23)
    img = np.repeat(np.repeat(out, G, axis=0), G, axis=1)
    for _ in range(int(longe.sum() / 260)):
        y, x = r.integers(0, Hg), r.integers(0, Wg)
        if not longe[y, x]:
            continue
        bx, by, bw, bh = gram['carimbos'][r.integers(0, len(gram['carimbos']))]
        if bw >= 19 and r.random() < 0.6:
            continue                            # os tufos grandes, mais raros
        s = tira[by:by + bh, bx:bx + bw]
        Y, X = y * G, x * G
        if Y + bh > img.shape[0] or X + bw > img.shape[1]:
            continue
        a = s[..., 3:4] / 255.0
        img[Y:Y + bh, X:X + bw] = (img[Y:Y + bh, X:X + bw] * (1 - a) + s[..., :3] * a).astype(np.uint8)
    return img


# ------------------------------------------------------------------ o que ainda é provisório (da arte de hoje)

def caixa_px(b, m=0.0):
    return (max(0, int((b['x'] - m) * PX)), max(0, int((b['y'] - m) * PX)), int((b['x'] + b['w'] + m) * PX), int((b['y'] + b['h'] + m) * PX))


def copa(w):
    """A caixa da árvore inteira a partir da parede (crown() em maps.ts: 60% da largura, 55% de baixo)."""
    W, H = w['w'] / 0.6, w['h'] / 0.55
    return {'x': w['x'] - 0.2 * W, 'y': w['y'] - 0.45 * H, 'w': W, 'h': H}


def fundo_local(sub, lados='tblr'):
    """O chão em volta de um objeto: as cores da borda da caixa (4 bits por canal) que se ligam à borda."""
    q = (sub >> 4).astype(int)
    k = q[..., 0] * 256 + q[..., 1] * 16 + q[..., 2]
    tiras = {'t': k[0], 'b': k[-1], 'l': k[:, 0], 'r': k[:, -1]}
    v, c = np.unique(np.concatenate([tiras[x] for x in lados]), return_counts=True)
    cand = np.isin(k, v[c >= 4])
    lab, _ = ndimage.label(cand)
    sem = np.unique(np.concatenate([{'t': lab[0], 'b': lab[-1], 'l': lab[:, 0], 'r': lab[:, -1]}[x] for x in lados]))
    return np.isin(lab, sem[sem > 0])


def chao_antigo(old):
    """Pixel de chão na arte antiga, pela cor: verde de grama, terra, pedra clara da praça ou água."""
    a = old.astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(axis=2), a.min(axis=2)
    grama = (g >= r + 2) & (g > b + 4) & (mx > 60)
    terra = (r > g + 6) & (g > b + 4) & (mx > 120) & (mx - mn < 120)
    agua = (b > g + 4) & (b > r + 30)
    pedra = (mx - mn < 26) & (mx > 105) & (mx < 200)
    return grama | terra | agua | pedra


def fundo_global(sub_chao, lados):
    lab, _ = ndimage.label(sub_chao)
    sem = np.unique(np.concatenate([{'t': lab[0], 'b': lab[-1], 'l': lab[:, 0], 'r': lab[:, -1]}[x] for x in lados]))
    return np.isin(lab, sem[sem > 0])


def copa_redonda(shape, nucleo):
    """Árvore da arte antiga: o alto da copa tem a mesma cor da grama e não tem contorno (a cor não separa os dois).
    Vem um oval macio em volta da árvore (a copa, o tronco e a sombra pintada), e os verdes passam para o tom da
    grama nova (verde_novo): a beirada de grama antiga some no gramado novo. Opacidade de 0 a 1."""
    x0, y0, x1, y1 = nucleo
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2 - 0.15 * (y1 - y0)
    rx, ry = (x1 - x0) / 2 + 1.0 * PX, (y1 - y0) / 2 + 1.1 * PX
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]]
    d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
    return np.clip((1.12 - d) / 0.22, 0, 1)


# A grama antiga e a nova (a cor de base): a árvore provisória passa os verdes dela para o tom novo, e assim a beirada
# de grama antiga que vem junto com a copa some no gramado novo.
GRAMA_VELHA = np.array([107.0, 128.0, 60.0])


def verde_novo(pix, m):
    gram = json.load(open(os.path.join(PECAS, 'chama_grama.json')))
    k = np.array(gram['base'], float) / GRAMA_VELHA
    c = pix.astype(float)
    verde = (c[..., 1] >= c[..., 0] - 2) & (c[..., 1] > c[..., 2]) & (m > 0)
    c[verde] = np.clip(c[verde] * k, 0, 255)
    return c.astype(np.uint8)


def provisorios(old, L, trocadas):
    """Uma máscara por objeto provisório: o recorte da arte antiga sem o chão que se liga à borda da caixa."""
    Hp, Wp = old.shape[:2]
    chao = chao_antigo(old)
    regs = []
    for w in L['walls']:
        k, s = w['k'], w.get('s')
        if (k == 'house' and s in ('home', 'hut')) or k == 'water':
            continue
        if k == 'tree' and s == 'sakura':        # a cerejeira é rosa: o recorte pela cor basta
            regs.append((caixa_px(copa(w), 0.8), 'tblr', w['y'] + w['h'], None))
        elif k == 'tree':
            b = {'x': w['x'] - 2, 'y': w['y'] - 4, 'w': w['w'] + 4, 'h': w['h'] + 5.5}
            regs.append((caixa_px(b), 'copa', w['y'] + w['h'], caixa_px(w)))
        elif k in ('wall', 'gatepost'):
            regs.append((caixa_px(w), '', w['y'] + w['h'], None))
        else:
            regs.append((caixa_px(w, 0.7), 'tblr', w['y'] + w['h'], None))
    for a in L['areas']:
        if a['g'] == 'bridge':           # a ponte inteira (as tábuas são da cor da terra: o recorte pela cor a apagaria)
            b = {'x': a['x'] - 0.1, 'y': a['y'] - 0.35, 'w': a['w'] + 0.2, 'h': a['h'] + 0.7}
            regs.append((caixa_px(b), '', a['y'] + a['h'], None))
    # a montanha atrás da sede (o chão só embaixo e dos lados) e a muralha de baixo com o portão (o chão só em cima)
    regs.append(((int(19 * PX), int(4 * PX), int(59 * PX), int(13 * PX)), 'blr', 9.0, None))
    regs.append(((0, int(53.6 * PX), Wp, Hp), 't', 60.0, None))
    out = []
    for (x0, y0, x1, y1), lados, base, nucleo in regs:
        x1, y1 = min(Wp, x1), min(Hp, y1)
        if x1 <= x0 or y1 <= y0:
            continue
        if lados == 'copa':
            m = copa_redonda((y1 - y0, x1 - x0), (nucleo[0] - x0, nucleo[1] - y0, nucleo[2] - x0, nucleo[3] - y0))
        elif lados:
            # dois jeitos de achar o chão em volta (pela cor de chão da arte toda e pelas cores da borda da caixa):
            # fica objeto o que algum dos dois diz que é objeto (a copa verde escapa de um, o telhado do outro)
            m = ~(fundo_local(old[y0:y1, x0:x1], lados) & fundo_global(chao[y0:y1, x0:x1], lados))
            m = ndimage.binary_opening(m, iterations=2)
            m = ndimage.binary_fill_holes(m)
        else:
            m = np.ones((y1 - y0, x1 - x0), bool)
        for t in trocadas:                                  # a casa antiga que saiu não volta por aqui
            tx0, ty0, tx1, ty1 = caixa_px(t, 0.6)
            m[max(0, ty0 - y0):max(0, ty1 - y0), max(0, tx0 - x0):max(0, tx1 - x0)] = False
        pix = old[y0:y1, x0:x1]
        if lados == 'copa':
            c = pix.astype(int)
            verde = (c[..., 1] >= c[..., 0] - 2) & (c[..., 1] > c[..., 2])
            m = np.where(~verde & (m < 0.99), 0, m)    # na beirada macia só entra verde (nada de muro ou terra antiga)
            pix = verde_novo(pix, m)
        out.append(((x0, y0), m, base, pix, lados != 'copa'))
    return out


# ------------------------------------------------------------------ juntar

def sombra(img_alpha, dx=9, dy=6):
    return np.roll(np.roll(img_alpha, dy, axis=0), dx, axis=1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('layout')
    ap.add_argument('--saida', default=os.path.join(RAIZ, 'public', 'mapas', 'chama'))
    ap.add_argument('--previa')
    a = ap.parse_args()
    L = json.load(open(a.layout))
    W, H = L['width'], L['height']
    Wp, Hp = W * PX, H * PX
    old = np.asarray(Image.open(os.path.join(RAIZ, 'arte', 'vilas', 'folha_ampliada.jpg')).convert('RGB').resize((Wp, Hp), Image.LANCZOS))

    cls = classes_do_chao(old, L)
    img = chao(cls).astype(np.float32)

    # o mosaico da praça
    nome, mx_, my_ = MOSAICO
    m = rgba(nome).astype(np.float32)
    x0, y0 = int(mx_ * PX - m.shape[1] / 2) // G * G, int(my_ * PX - m.shape[0] / 2) // G * G
    al = m[..., 3:4] / 255
    img[y0:y0 + m.shape[0], x0:x0 + m.shape[1]] = img[y0:y0 + m.shape[0], x0:x0 + m.shape[1]] * (1 - al) + m[..., :3] * al

    # as casas trocadas: a caixa antiga de cada uma (para sair do provisório e da colisão)
    velhas = [{'x': x, 'y': y, 'w': w, 'h': h} for x, y, w, h in CASAS_VELHAS]
    objetos = []                                      # (base y em casas, x0, y0, rgba, faz sombra)
    paredes, luzes = [], []
    for nome, cx, base in CASAS:
        p = rgba(nome)
        h, w = p.shape[:2]
        X = int(cx * PX - w / 2) // G * G
        Y = int(base * PX - h) // G * G
        objetos.append((base, X, Y, p.astype(np.float32), True))
        # colisão: a casa inteira (não há camada por cima do ninja), menos uma beirada de 0,2 casa em volta
        paredes.append({'x': round(X / PX + 0.2, 2), 'y': round(Y / PX + 0.3, 2), 'w': round(w / PX - 0.4, 2), 'h': round(h / PX - 0.45, 2), 'nome': nome})
        for fx_, fy_ in JANELAS.get(nome, []):
            luzes.append({'x': round((X + fx_ * w) / PX, 1), 'y': round((Y + fy_ * h) / PX, 1)})

    for (x0, y0), mk, base, pix, sombreia in provisorios(old, L, velhas):
        p = np.dstack([pix.astype(np.float32), mk.astype(np.float32) * 255])
        objetos.append((base, x0, y0, p, sombreia))

    # a sombra de tudo no chão, depois os objetos de cima para baixo
    somb = np.zeros((Hp, Wp), np.float32)
    for base, X, Y, p, sombreia in objetos:
        if not sombreia:                   # a árvore antiga já traz a sombra pintada
            continue
        h, w = p.shape[:2]
        somb[Y:Y + h, X:X + w] = np.maximum(somb[Y:Y + h, X:X + w], p[..., 3] / 255)
    s = np.clip(sombra(somb) - somb, 0, 1) * 0.32
    img = img * (1 - s[..., None]) + np.array([16, 26, 20]) * s[..., None]
    for base, X, Y, p, _ in sorted(objetos, key=lambda o: o[0]):
        h, w = p.shape[:2]
        h, w = min(h, Hp - Y), min(w, Wp - X)
        al = p[:h, :w, 3:4] / 255
        img[Y:Y + h, X:X + w] = img[Y:Y + h, X:X + w] * (1 - al) + p[:h, :w, :3] * al
    full = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))

    if a.previa:
        full.resize((Wp // 2, Hp // 2), Image.BOX).save(a.previa)
    os.makedirs(a.saida, exist_ok=True)
    for f in os.listdir(a.saida):
        if f.endswith('.webp'):
            os.remove(os.path.join(a.saida, f))
    n = 0
    for cy in range((H + CHUNK - 1) // CHUNK):
        for cx in range((W + CHUNK - 1) // CHUNK):
            box = (cx * CHUNK * PX, cy * CHUNK * PX, min(W, (cx + 1) * CHUNK) * PX, min(H, (cy + 1) * CHUNK) * PX)
            full.crop(box).save(os.path.join(a.saida, f'{cx}_{cy}.webp'), 'WEBP', quality=90, method=6)
            n += 1
    full.resize((W * 4, H * 4), Image.LANCZOS).save(os.path.join(a.saida, 'mini.webp'), 'WEBP', quality=85)
    print(f'{n} blocos em {a.saida}')
    print('paredes das casas novas:')
    for p in paredes:
        print(f"    wall('house', {p['x']}, {p['y']}, {p['w']}, {p['h']}, 'home'),   // {p['nome']}")
    print('luzes das janelas:', json.dumps(luzes))


if __name__ == '__main__':
    main()
