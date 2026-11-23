"""Recorta as imagens do Flow (texturas dos mapas) nas peças que o montador e o jogo usam.

  python3 arte/mapas/recortar_pecas.py            # todas as de arte/mapas/flow/recebidas/
  python3 arte/mapas/recortar_pecas.py chama_casa_media fx_chuva

Entrada: arte/mapas/flow/recebidas/<id>.jpg (a imagem do Flow como o Victor mandou, 2000 x 2000).
Saída:
- arte/mapas/pecas/<id>.png: a peça na grade do mapa (48 px por casa, a densidade do chão na tela), fundo transparente.
  Cada "pixel" do Flow tem ~20,5 px na imagem de 2000 (~97 pixels de lado); a imagem vira 288 px (6 casas), 3 px de
  tela por pixel do Flow. É a mesma conta para todas as peças, que assim combinam entre si, e deixa as casas com ~5
  casas de largura (a escala do ninja e das construções de hoje).
- chão (k: tile): arte/mapas/pecas/<id>.png é o ladrilho inteiro (288 x 288) e, quando a imagem não repete sozinha,
  arte/mapas/pecas/<id>_carimbos.png guarda os detalhes soltos (tufos, flores, pedrinhas) e <id>.json a cor de base.
- efeitos (fx_*): public/assets/clima/<id>.png (o preto vira transparente) e, para os de partículas, os pedaços soltos
  lado a lado numa tira; public/climaData.js (gerado) diz onde cada pedaço está (o jogo lê em public/clima.js).
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.join(AQUI, '..', '..')
REC = os.path.join(AQUI, 'flow', 'recebidas')
PECAS = os.path.join(AQUI, 'pecas')
CLIMA = os.path.join(RAIZ, 'public', 'assets', 'clima')
# Efeitos que voltaram para o Flow (a refazer): ficam em arte/mapas/flow/recebidas, mas não vão para o jogo.
FORA_DO_JOGO = {'fx_respingo', 'chama_muralha_canto', 'chama_ponte', 'chama_grade_canal', 'chama_lanterna_poste',
                'floresta_placa_seta', 'floresta_kunais_chao', 'chama_banco'}
# Tamanho de cada peça: a imagem inteira de 2000 px vira N px (288 = 6 casas, 3 px de tela por pixel do Flow). O poço é
# pequeno (144: 1,5 px por pixel do Flow); os prédios grandes (Academia, Salão, portão e muralha) dobram com o Scale2x
# (6 px por pixel do Flow, as diagonais lisas): é o tamanho que o cartão pede para eles no mapa.
ESCALA = {'chama_poco': 144, 'chama_lanterna_pedra': 144, 'chama_banco': 192, 'chama_vaso': 96, 'chama_barril': 96,
          'chama_caixotes': 96, 'chama_placa': 96, 'chama_cerca': 192, 'chama_pilar_treino': 96,
          'floresta_fogueira': 96, 'floresta_fogueira_apagada': 96, 'floresta_saco_dormir': 96}
# Da altura (fração da peça) para baixo, só fica a madeira (os mastros, os postes): o chão em volta sai.
SO_MADEIRA = {'chama_estandarte': 0.72, 'chama_cerca': 0.66}
DOBRO = {'chama_academia', 'chama_salao', 'chama_portao', 'chama_muralha'}
# Peças que vieram com um pedaço de chão (grama e terra) em volta: o chão sai, a construção fica.
TIRA_CHAO = {'chama_armaria': 0.5, 'chama_academia': 0.78, 'chama_portao': 0.5, 'chama_barril': 0.6, 'chama_estandarte': 0.7,
             'chama_cerca': 0.6, 'chama_cerejeira': 0.75}   # de que altura para baixo pode ter chão
N = 288          # 6 casas a 48 px (3 px por pixel do Flow)
F = N / 192      # as medidas abaixo foram tiradas na grade de 192


def amostra(img, n=N):
    """Reduz pela grade: filtro de mediana (tira o ruído do JPEG) e um ponto no meio de cada célula (sem borrar)."""
    a = np.asarray(img.filter(ImageFilter.MedianFilter(5)))
    h, w = a.shape[:2]
    iy = ((np.arange(n) + 0.5) * h / n).astype(int)
    ix = ((np.arange(n) + 0.5) * w / n).astype(int)
    return a[iy][:, ix]


def maioria(mask, n=N):
    """Máscara booleana grande -> a fração de cada célula (média em blocos)."""
    m = Image.fromarray((mask * 255).astype(np.uint8)).resize((n, n), Image.BOX)
    return np.asarray(m) / 255.0


def magenta(a):
    a = a.astype(np.int32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return (r > 150) & (b > 150) & (g < 120) & (np.abs(r - b) < 90)


def corta(rgba):
    """Corta a peça pela caixa do que não é transparente."""
    al = rgba[..., 3] > 0
    ys, xs = np.where(al)
    if not len(ys):
        return rgba
    return rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def objeto(id_, img, n=N):
    """Objeto sobre magenta: tira o fundo, reduz para a grade e limpa a franja rosa."""
    big = np.asarray(img)
    fundo = magenta(big)
    fundo = ndimage.binary_dilation(fundo, iterations=3)       # a franja do JPEG em volta
    cor = amostra(img, n)
    frac = maioria(~fundo, n)
    alfa = frac > 0.5
    # um pixel de cor ainda rosado na borda vira o vizinho de dentro mais próximo
    rosa = magenta(cor) | (alfa & (frac < 0.85))
    if rosa.any():
        dentro = alfa & ~rosa
        _, (iy, ix) = ndimage.distance_transform_edt(~dentro, return_indices=True)
        cor = cor[iy, ix]
    alfa = ndimage.binary_opening(alfa, iterations=1) | (alfa & (frac > 0.9))
    if id_ in TIRA_CHAO:
        alfa &= ~chao_em_volta(cor, alfa, TIRA_CHAO[id_])
        alfa = ndimage.binary_opening(alfa, iterations=1)
        lab, n = ndimage.label(alfa)                         # sobras soltas do chão (pétalas, tufos) saem
        if n > 1:
            tam = ndimage.sum(alfa, lab, range(1, n + 1))
            alfa = np.isin(lab, 1 + np.where(tam >= tam.max() * 0.02)[0])
    if id_ in SO_MADEIRA:
        ys = np.where(alfa.any(axis=1))[0]
        y0 = int(ys.min() + (ys.max() - ys.min()) * SO_MADEIRA[id_])
        c = cor[y0:].astype(int)
        madeira = (c[..., 0] > c[..., 1] + 20) & (c[..., 1] > c[..., 2]) & (c[..., 1] < 130)
        alfa[y0:] &= madeira
        alfa = ndimage.binary_opening(alfa, iterations=1) | (alfa & ~np.isin(np.arange(len(alfa))[:, None], range(y0, len(alfa))))
        lab, n = ndimage.label(alfa)                         # a beirada escura do chão que sobrou, solta, sai
        if n > 1:
            tam = ndimage.sum(alfa, lab, range(1, n + 1))
            alfa = np.isin(lab, 1 + np.where(tam >= tam.max() * 0.05)[0])
    rgba = np.dstack([cor, (alfa * 255).astype(np.uint8)])
    rgba = corta(rgba)
    if id_ == 'chama_cerca':
        rgba = periodo_cerca(rgba)
    return rgba


def periodo_cerca(rgba):
    """A cerca repete: do começo do 1º poste ao começo do 3º (dois vãos), que é o que se ladrilha."""
    topo = rgba[:4, :, 3].any(axis=0)
    lab, n = ndimage.label(topo)
    esq = [ndimage.find_objects(lab)[i][0].start for i in range(n)]
    if n < 3:
        return rgba
    return rgba[:, esq[0]:esq[2]]


def chao_em_volta(cor, alfa, desde=0.5):
    """O chão que veio em volta da construção: grama (verde-amarelado, sem o azul do telhado de jade), terra clara e o
    contorno escuro da beirada, ligados ao fundo transparente por fora."""
    c = cor.astype(int)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    grama = (g > r + 35) & (g > b + 55)
    terra = (r > g + 20) & (r < g + 65) & (g > 140) & (g > b + 35) & (r > 170)   # a terra clara (o reboco e a porta não)
    petala = (r > 200) & (b > 150) & (g < 190)
    beira = (c.max(axis=2) < 95) & (g >= r)                                     # o contorno esverdeado do chão
    # só da altura `desde` para baixo (o telhado verde de cima nunca é chão)
    ys = np.where(alfa.any(axis=1))[0]
    baixo = np.zeros_like(alfa)
    if len(ys):
        baixo[int(ys.min() + (ys.max() - ys.min()) * desde):] = True
    chao = (grama | terra | petala | beira) & alfa & baixo
    lab, _ = ndimage.label(chao | ~alfa)
    fora = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    return np.isin(lab, fora[fora > 0]) & chao


def scale2x(rgba):
    """Scale2x (EPX): dobra o pixel art sem borrar, arredondando as diagonais."""
    a = rgba
    P = np.pad(a, ((1, 1), (1, 1), (0, 0)), mode='edge')
    B, D, F, H = P[:-2, 1:-1], P[1:-1, :-2], P[1:-1, 2:], P[2:, 1:-1]
    eq = lambda x, y: (x == y).all(axis=2)
    E = a
    e0 = np.where((eq(D, B) & ~eq(B, F) & ~eq(D, H))[..., None], D, E)
    e1 = np.where((eq(B, F) & ~eq(B, D) & ~eq(F, H))[..., None], F, E)
    e2 = np.where((eq(D, H) & ~eq(D, B) & ~eq(H, F))[..., None], D, E)
    e3 = np.where((eq(H, F) & ~eq(D, H) & ~eq(B, F))[..., None], F, E)
    h, w = a.shape[:2]
    out = np.zeros((h * 2, w * 2, a.shape[2]), a.dtype)
    out[0::2, 0::2], out[0::2, 1::2], out[1::2, 0::2], out[1::2, 1::2] = e0, e1, e2, e3
    return out


def canal(img):
    """Um quadro do Canal de água: a água (as 132 linhas entre as margens) e as duas margens de pedra (sem a grama)."""
    cor = amostra(img)
    agua = cor[89:221]
    def margem(a, b):
        m = cor[a:b].astype(int)
        grama = (m[..., 1] > m[..., 0] + 30) & (m[..., 1] > m[..., 2] + 20)
        return np.dstack([cor[a:b], ((~grama) * 255).astype(np.uint8)])
    return agua, margem(69, 89), margem(221, 240)


def muralha(rgba):
    """A muralha veio em duas faixas: o alto (só as telhas da cobertura, visto de cima) e a frente (telhado, reboco e
    pedra). Separa pela linha vazia do meio."""
    linhas = rgba[..., 3].any(axis=1)
    lab, n = ndimage.label(linhas)
    partes = [rgba[ndimage.find_objects(lab)[i][0]] for i in range(n)]
    partes.sort(key=lambda p: p.shape[0])
    return partes[-1], partes[0]          # a frente (a mais alta) e o alto


def mosaico(img):
    """Decalque redondo (o mosaico da praça): acha o anel escuro de fora e guarda só o círculo."""
    cor = amostra(img)
    lum = cor.astype(int).sum(axis=2) / 3
    escuro = (lum < 70) & ~magenta(cor)
    yy, xx = np.mgrid[0:N, 0:N]
    best = None
    for cy in range(int(86 * F), int(106 * F)):
        for cx in range(int(86 * F), int(106 * F)):
            d = np.hypot(yy - cy, xx - cx)
            for r in range(int(70 * F), int(92 * F)):
                anel = np.abs(d - r) < 1.0
                s = escuro[anel].mean()
                if best is None or s > best[0]:
                    best = (s, cy, cx, r)
    _, cy, cx, r = best
    d = np.hypot(yy - cy, xx - cx)
    alfa = d <= r + 1.2
    rgba = np.dstack([cor, (alfa * 255).astype(np.uint8)])
    return corta(rgba)


def carimbos(cor, base, raio_cor=26, max_area=200, recorte=None):
    """Tira os detalhes soltos de um chão (tufos, flores, pedrinhas): o que foge da cor de base, em pedaços pequenos."""
    dif = np.abs(cor.astype(int) - np.array(base)).sum(axis=2) > raio_cor
    if recorte is not None:
        dif &= recorte
    lab, n = ndimage.label(ndimage.binary_dilation(dif, iterations=1))
    out = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        if sl is None:
            continue
        m = (lab[sl] == i) & dif[sl]
        h, w = m.shape
        if m.sum() < 6 or m.sum() > max_area or h > 24 or w > 24:
            continue
        rgba = np.dstack([cor[sl], (m * 255).astype(np.uint8)])
        out.append(rgba)
    return out


def tira(pedacos, gap=1):
    """Junta os pedaços numa tira horizontal e devolve as caixas."""
    H = max(p.shape[0] for p in pedacos)
    W = sum(p.shape[1] + gap for p in pedacos)
    t = np.zeros((H, W, 4), np.uint8)
    caixas, x = [], 0
    for p in pedacos:
        h, w = p.shape[:2]
        t[:h, x:x + w] = p
        caixas.append([x, 0, w, h])
        x += w + gap
    return t, caixas


def moda(cor, recorte=None):
    q = (cor // 4).reshape(-1, 3) if recorte is None else (cor[recorte] // 4)
    v, c = np.unique(q, axis=0, return_counts=True)
    return [int(x) * 4 + 2 for x in v[c.argmax()]]


def chao(id_, img):
    cor = amostra(img)
    Image.fromarray(cor).save(os.path.join(PECAS, id_ + '.png'))
    if id_ == 'chama_grama':
        # a imagem é uma clareira com sebes nas bordas: o meio vira a base e os tufos e flores viram carimbos
        meio = np.zeros((N, N), bool)
        meio[int(20 * F):int(150 * F), int(22 * F):int(170 * F)] = True
        base = moda(cor, meio)
        pal = [base]
        # os outros dois tons do gramado (sombra pontilhada e grama clara), para as manchas
        q = (cor[meio] // 4)
        v, c = np.unique(q, axis=0, return_counts=True)
        ordem = [list(map(int, v[i] * 4 + 2)) for i in np.argsort(-c)]
        for o in ordem:
            if all(np.abs(np.array(o) - np.array(p)).sum() > 30 for p in pal):
                pal.append(o)
            if len(pal) == 4:
                break
        cs = carimbos(cor, base, recorte=meio)
        t, cx = tira(cs)
        Image.fromarray(t).save(os.path.join(PECAS, id_ + '_carimbos.png'))
        json.dump({'base': base, 'tons': pal[1:], 'carimbos': cx}, open(os.path.join(PECAS, id_ + '.json'), 'w'))
    elif id_ == 'chama_trilha':
        # a faixa de terra tem a beira escura dos dois lados: o miolo (x 20..172) repete na vertical, e na horizontal
        # o montador espelha uma cópia sim, outra não; a beira é desenhada na borda do caminho
        a0, a1 = int(20 * F), int(172 * F)
        miolo = cor[:, a0:a1]
        Image.fromarray(miolo).save(os.path.join(PECAS, id_ + '.png'))
        beira = cor[:, int(2 * F):a0]
        json.dump({'base': moda(miolo), 'beira': [list(map(int, beira[N // 2, i])) for i in range(0, beira.shape[1], 3)]},
                  open(os.path.join(PECAS, id_ + '.json'), 'w'))


def efeito(id_, img):
    os.makedirs(CLIMA, exist_ok=True)
    cor = amostra(img)
    mx = cor.max(axis=2).astype(float)
    if id_ in ('fx_chuva', 'fx_nevoa'):
        # textura que corre: o brilho vira a opacidade (o preto some)
        a = np.clip((mx - 18) / 150, 0, 1)
        rgba = np.dstack([cor, (a * 255).astype(np.uint8)])
        Image.fromarray(rgba).save(os.path.join(CLIMA, id_ + '.png'))
        return
    # partículas: cada pedaço solto vira um quadro da tira
    alfa = mx > 34
    lab, n = ndimage.label(ndimage.binary_dilation(alfa, iterations=2))
    peds = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        m = (lab[sl] == i) & alfa[sl]
        if m.sum() < 3:
            continue
        rgba = np.dstack([cor[sl], (m * 255).astype(np.uint8)])
        peds.append((m.sum(), rgba))
    peds.sort(key=lambda p: -p[0])
    grandes = [p for s, p in peds if s >= 25][:16] or [p for _, p in peds[:8]]
    t, caixas = tira(grandes)
    Image.fromarray(t).save(os.path.join(CLIMA, id_ + '.png'))
    json.dump({'quadros': caixas}, open(os.path.join(PECAS, id_ + '.json'), 'w'))


def gera_js():
    """public/climaData.js: as texturas do clima e os quadros de cada tira de partículas."""
    dados = {}
    for f in sorted(os.listdir(CLIMA)):
        if f.endswith('.png'):
            id_ = f[:-4]
            j = os.path.join(PECAS, id_ + '.json')
            dados[id_] = json.load(open(j))['quadros'] if os.path.exists(j) else None
    linhas = ['// Gerado por arte/mapas/recortar_pecas.py (não editar à mão): as texturas do clima desenhadas no Flow.',
              '// null = textura inteira que corre (chuva, névoa); lista = os quadros [x, y, w, h] da tira de partículas.',
              'export const CLIMA_ARTE = {']
    linhas += [f'  {k}: {json.dumps(v)},' for k, v in dados.items()]
    linhas.append('};')
    open(os.path.join(RAIZ, 'public', 'climaData.js'), 'w').write('\n'.join(linhas) + '\n')


def main():
    os.makedirs(PECAS, exist_ok=True)
    ids = sys.argv[1:] or sorted(f[:-4] for f in os.listdir(REC) if f.endswith('.jpg'))
    for id_ in ids:
        img = Image.open(os.path.join(REC, id_ + '.jpg')).convert('RGB')
        if id_ in FORA_DO_JOGO:
            for d, ext in ((CLIMA, '.png'), (PECAS, '.json')):
                if os.path.exists(os.path.join(d, id_ + ext)):
                    os.remove(os.path.join(d, id_ + ext))
            print('fora do jogo (a refazer):', id_)
            continue
        if id_.startswith('fx_'):
            efeito(id_, img)
        elif id_ in ('chama_grama', 'chama_trilha', 'chama_calcamento'):
            chao(id_, img)
        elif id_.startswith('chama_mosaico'):
            Image.fromarray(mosaico(img)).save(os.path.join(PECAS, id_ + '.png'))
        elif id_.startswith('chama_canal_agua_'):
            continue                                   # os 4 quadros juntos, abaixo
        else:
            p = objeto(id_, img, ESCALA.get(id_, N))
            if id_ in DOBRO:
                p = scale2x(p)
            if id_ == 'chama_muralha':
                frente, alto = muralha(p)
                Image.fromarray(alto).save(os.path.join(PECAS, 'chama_muralha_alto.png'))
                p = frente
            Image.fromarray(p).save(os.path.join(PECAS, id_ + '.png'))
        print('ok', id_)
    quadros = sorted(f for f in os.listdir(REC) if f.startswith('chama_canal_agua_'))
    if quadros and (not sys.argv[1:] or any(i.startswith('chama_canal_agua') for i in sys.argv[1:])):
        partes = [canal(Image.open(os.path.join(REC, f)).convert('RGB')) for f in quadros]
        # a água: os quadros um embaixo do outro; as margens são as do primeiro (iguais nos quatro)
        Image.fromarray(np.concatenate([p[0] for p in partes])).save(os.path.join(PECAS, 'chama_canal_agua.png'))
        Image.fromarray(partes[0][1]).save(os.path.join(PECAS, 'chama_canal_margem_cima.png'))
        Image.fromarray(partes[0][2]).save(os.path.join(PECAS, 'chama_canal_margem_baixo.png'))
        print('ok chama_canal_agua (', len(partes), 'quadros )')
    gera_js()


if __name__ == '__main__':
    main()
