"""
v96 (pedido do Victor, 23/11): recorta as peças da interface geradas no Flow (tema Laca e Brasa).

  python3 arte/ui/recortar_ui.py [--debug pasta] [ids...]

Para cada folha em arte/ui/flow/folhas/<id>.jpg:
  1. acha a cor do fundo (o magenta do canto) e tira o fundo;
  2. acha a grade de pixels (o tamanho do pixel da arte e o deslocamento), pelas bordas entre as cores;
  3. reduz cada célula da grade a 1 pixel (a mediana do miolo da célula: tira o borrado do jpeg e o ruído do gerador);
  4. separa as versões (estados, raridades) pelas peças soltas, da esquerda para a direita e de cima para baixo;
  5. salva em public/assets/ui/<id>.png (uma versão) ou <id>_<n>.png (várias), e o mapa em public/uiArte.js.
O miolo das molduras (9 fatias) vira uma cor lisa: é o que estica no meio do painel.
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, '..', '..'))
FOLHAS = os.path.join(AQUI, 'flow', 'folhas')
SAIDA = os.path.join(RAIZ, 'public', 'assets', 'ui')

# fatia: a largura (pixels de arte) de cada borda da moldura de 9 fatias [cima, direita, baixo, esquerda]; None = peça inteira.
# versoes: quantas versões a folha tem (as que sobrarem são variações do gerador e ficam de fora).
PECAS = {
    'ui_painel': {'fatia': [18, 18, 18, 18], 'miolo': (48, 48)},
    'ui_cartao_entrada': {'fatia': [18, 18, 18, 18], 'miolo': (48, 48)},
    'ui_painel_pequeno': {'fatia': [16, 16, 16, 16], 'miolo': (44, 44)},
    'ui_pergaminho': {'fatia': [18, 17, 21, 7], 'miolo': (48, 48)},
    'ui_dica': {'fatia': [13, 13, 13, 13], 'miolo': (30, 20)},
    'ui_divisor': {},
    'ui_aba': {'versoes': 2, 'fatia': [7, 7, 7, 7], 'miolo': (25, 14)},
    'ui_botao_principal': {'versoes': 3, 'fatia': [12, 8, 10, 8], 'miolo': (13, 40)},
    'ui_botao_secundario': {'versoes': 3, 'girar': 90, 'encurtar': (7, 17), 'fatia': [7, 10, 7, 10], 'miolo': (30, 10)},
    'ui_botao_perigo': {'versoes': 2, 'fatia': [8, 8, 9, 8], 'miolo': (20, 13)},
    'ui_botao_redondo': {'versoes': 2, 'vazar': True},
    'ui_botao_fechar': {},
    'ui_check': {'versoes': 2},
    'ui_slider': {'knob': True},
    'ui_jutsu': {'versoes': 3, 'vazar': True},
    'ui_ataque': {'vazar': True},
    # v97: as 4 do HUD (folhas do Victor de 23/11)
    'ui_joystick': {'versoes': 2},                    # 1 = a base, 2 = a manopla
    'ui_minimapa': {'vazar': True},                   # o mapa aparece pelo meio
    'ui_retrato': {'versoes': 4, 'vazar': True},      # 1 = você, 2 = o inimigo, 3 e 4 = as plaquinhas do nível
    'ui_selos': {'selos': True, 'fatia': [3, 3, 3, 3]},                      # o trilho vazio e a faixa de fogo que enche
}

def fundo(a):
    """A cor do fundo: a mediana dos 4 cantos; o fundo é o que fica perto dela (e o magenta puro de qualquer jeito)."""
    c = np.concatenate([a[:24, :24].reshape(-1, 3), a[:24, -24:].reshape(-1, 3), a[-24:, :24].reshape(-1, 3), a[-24:, -24:].reshape(-1, 3)])
    bg = np.median(c, 0)
    d = np.abs(a.astype(int) - bg).sum(-1)
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    mag = (r > 150) & (b > 150) & (g < 110) & (np.abs(r - b) < 80)
    return (d < 75) | mag


def grade(a, bgm):
    """O tamanho do pixel e o deslocamento: as bordas entre cores (dentro do desenho) caem nas linhas da grade."""
    lum = a.astype(float).mean(-1)
    dx = np.abs(np.diff(lum, axis=1)) > 28
    dy = np.abs(np.diff(lum, axis=0)) > 28
    xs = np.nonzero(dx & ~bgm[:, 1:] & ~bgm[:, :-1])[1] + 1.0
    ys = np.nonzero(dy & ~bgm[1:, :] & ~bgm[:-1, :])[0] + 1.0
    melhor = None
    res = []
    for p in np.arange(17, 24, 0.0625):   # o Flow desenha as folhas de 2048 px com o pixel perto de 20,5 (100 pixels de arte)
        e = 0
        fases = []
        for v in (xs, ys):
            ang = 2 * np.pi * (v % p) / p
            m = np.hypot(np.cos(ang).mean(), np.sin(ang).mean())   # 1 = todas as bordas na mesma fase
            fases.append((np.arctan2(np.sin(ang).mean(), np.cos(ang).mean()) % (2 * np.pi)) * p / (2 * np.pi))
            e += m
        res.append((p, e / 2, fases))
    top = max(r[1] for r in res)
    p, e, (fx, fy) = max(res, key=lambda r: r[1])
    return p, fx, fy, e


def reduz(a, bgm, p, fx, fy):
    H, W = bgm.shape
    xs = np.arange(fx, W, p)
    ys = np.arange(fy, H, p)
    out = np.zeros((len(ys) - 1, len(xs) - 1, 4), np.uint8)
    q = p * 0.25
    for j in range(len(ys) - 1):
        y0, y1 = int(ys[j] + q), int(ys[j + 1] - q)
        for i in range(len(xs) - 1):
            x0, x1 = int(xs[i] + q), int(xs[i + 1] - q)
            m = bgm[y0:y1, x0:x1]
            if m.size == 0 or m.mean() > 0.5:
                continue
            cel = a[y0:y1, x0:x1][~m]
            out[j, i, :3] = np.median(cel, 0)
            out[j, i, 3] = 255
    return out


def pecas(low, n):
    """As peças soltas (8 vizinhos), na ordem de leitura; só as n maiores, se houver mais."""
    op = low[..., 3] > 0
    lab, k = ndi.label(op, structure=np.ones((3, 3)))
    caixas = [s for s in ndi.find_objects(lab)]
    tam = [(lab[s] == i + 1).sum() for i, s in enumerate(caixas)]
    grandes = [(caixas[i], i + 1) for i in range(k) if tam[i] >= max(12, 0.06 * max(tam))]
    if n and len(grandes) > n:
        grandes = sorted(grandes, key=lambda c: -(lab[c[0]] == c[1]).sum())[:n]
    # ordem de leitura: fileiras pela altura do topo (com folga de meia peça), depois da esquerda para a direita
    alt = np.median([s[0].stop - s[0].start for s, _ in grandes])
    grandes.sort(key=lambda c: (round(c[0][0].start / max(1, alt * 0.6)), c[0][1].start))
    out = []
    for s, i in grandes:
        sub = low[s].copy()
        sub[lab[s] != i] = 0
        out.append(sub)
    return out


def fatia_auto(img):
    """As bordas da moldura: do lado de fora até onde a cor para de mudar (o miolo liso). Limite: 40% do lado."""
    rgb = img[..., :3].astype(int)
    H, W = rgb.shape[:2]
    cy, cx = H // 2, W // 2
    miolo = np.median(rgb[cy - 1:cy + 2, cx - 1:cx + 2].reshape(-1, 3), 0)
    liso = (np.abs(rgb - miolo).sum(-1) < 40) & (img[..., 3] > 0)
    def corte(linhas):   # a primeira linha/coluna (de fora para dentro) que é quase toda miolo, no trecho do meio
        for k, ln in enumerate(linhas):
            if ln.mean() > 0.92:
                return k
        return len(linhas)
    mh, mw = slice(int(H * 0.3), int(H * 0.7)), slice(int(W * 0.3), int(W * 0.7))
    top = corte([liso[y, mw] for y in range(0, int(H * 0.45))])
    bot = corte([liso[H - 1 - y, mw] for y in range(0, int(H * 0.45))])
    lef = corte([liso[mh, x] for x in range(0, int(W * 0.45))])
    rig = corte([liso[mh, W - 1 - x] for x in range(0, int(W * 0.45))])
    f = [min(top, int(H * 0.4)), min(rig, int(W * 0.4)), min(bot, int(H * 0.4)), min(lef, int(W * 0.4))]
    # o miolo vira cor lisa (o ruído e as manchas do gerador somem do que estica)
    img[f[0]:H - f[2], f[3]:W - f[1], :3] = miolo
    img[f[0]:H - f[2], f[3]:W - f[1], 3] = 255
    return [int(v) for v in f]


def selos(v):
    """A barra dos selos veio com o fogo enchendo a metade da esquerda: sai o trilho vazio (o fogo vira o fundo escuro
    do trilho, a coluna vazia da direita) e a faixa de fogo (ui_selos_fogo), que o jogo repete na largura que encheu.
    O cravo do meio da borda sai (esticaria junto); os das pontas ficam."""
    rgb = v[..., :3].astype(int)
    H, W = v.shape[:2]
    quente = (rgb[..., 0] > 190) & (rgb[..., 2] < 170) & (v[..., 3] > 0)
    fogo = quente & (rgb[..., 0] - rgb[..., 1] > 70)
    fogo[:4] = False; fogo[H - 4:] = False   # o fogo fica dentro do trilho (as linhas de ouro da borda não são fogo)
    cols = np.nonzero(fogo.sum(0) >= 2)[0]
    x0, x1 = cols.min(), cols.max() + 1
    y0, y1 = 3, H - 3   # o miolo do trilho (fatia 3 em cima e embaixo)
    faixa = v[y0:y1, x0:x1].copy()
    dentro = quente[y0:y1, x0:x1].copy()
    dentro[:1] = False
    faixa[~dentro, 3] = 0   # entre as chamas: transparente (o escuro do trilho aparece por trás)
    Image.fromarray(faixa, 'RGBA').save(os.path.join(SAIDA, 'ui_selos_fogo.png'))
    ref = int(W * 0.8)
    vazia = v[:, ref].copy()   # uma coluna do trilho vazio (o escuro de dentro e as bordas)
    for x in range(x0, x1):
        v[3:H - 3, x] = vazia[3:H - 3]
    # o cravo do meio (em cima e embaixo) esticaria junto: as colunas dele viram a coluna vazia
    meio = [x for x in range(int(W * 0.3), int(W * 0.7)) if rgb[1, x].sum() > 300 or rgb[H - 2, x].sum() > 300]
    if meio:
        viz = v[:, min(meio) - 3].copy()   # a coluna logo antes do cravo (a borda de ouro continua igual)
        for x in range(min(meio) - 2, max(meio) + 3):
            v[:, x] = viz
    print('  selos: fogo x', x0, x1, '| cravo', (min(meio), max(meio)) if meio else None)
    return v


def acabamento(nome, k, v, cfg):
    """Os ajustes de cada peça depois da redução."""
    if cfg.get('girar'):
        v = np.rot90(v, 1).copy()   # o Flow desenhou o botão em pé: deitado (a luz fica à esquerda, perto da de cima)
    if cfg.get('encurtar'):
        # as pontas do botão deitado ficaram largas (o Flow fez os rolos grandes): tira as colunas lisas do meio de cada ponta
        a, b = cfg['encurtar']
        W0 = v.shape[1]
        manter = [x for x in range(W0) if not (a <= x < b or W0 - b <= x < W0 - a)]
        v = v[:, manter].copy()
    H, W = v.shape[:2]
    if cfg.get('fatia') and cfg.get('miolo'):
        t, r, b, l = cfg['fatia']
        mx, my = cfg['miolo']
        cor = v[min(my, H - 1), min(mx, W - 1)].copy()
        v[t:H - b, l:W - r] = cor   # o miolo que estica: uma cor lisa (sem manchas nem ruído do gerador)
    if cfg.get('vazar') and not (nome == 'ui_retrato' and k >= 2):
        # o disco escuro do meio fica transparente: a cor do botão (o elemento do jutsu) aparece por baixo do anel
        rgb = v[..., :3].astype(int)
        cy, cx = H // 2, W // 2
        cor = rgb[cy, cx]
        perto = (np.abs(rgb - cor).sum(-1) < 70) & (v[..., 3] > 0)
        lab, _ = ndi.label(perto)
        if lab[cy, cx]:
            v[lab == lab[cy, cx], 3] = 0
    if nome == 'ui_aba' and k == 1:
        # a chama no meio da borda de cima esticaria junto: sai daqui e vira uma peça própria (ui_aba_chama), por cima
        rgb = v[..., :3].astype(int)
        fogo = (rgb[..., 0] > 200) & (rgb[..., 2] < 110) & (rgb[..., 0] - rgb[..., 1] > 55) & (v[..., 3] > 0)
        fogo[:, :W // 3] = False; fogo[:, 2 * W // 3:] = False
        lab, n = ndi.label(ndi.binary_dilation(fogo))
        if n:
            maior = max(range(1, n + 1), key=lambda i: (lab == i).sum())
            m = (lab == maior) & (v[..., 3] > 0)
            ys, xs = np.nonzero(m)
            y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
            chama = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
            chama[m[y0:y1, x0:x1]] = v[y0:y1, x0:x1][m[y0:y1, x0:x1]]
            Image.fromarray(chama, 'RGBA').save(os.path.join(SAIDA, 'ui_aba_chama.png'))
            for y, x in zip(ys, xs):   # no lugar da chama, a borda da aba (a mesma linha, uma coluna antes)
                v[y, x] = v[y, x0 - 2]
    if cfg.get('selos'):
        v = selos(v)
    if cfg.get('knob'):
        # o puxador redondo do meio (o que passa da altura da barra) vira o polegar do controle; a barra, o trilho
        a = v[..., 3] > 0
        alto = np.nonzero(a[0] | a[-1])[0]
        if alto.size:
            x0, x1 = alto.min() - 1, alto.max() + 2
            Image.fromarray(v[:, x0:x1].copy(), 'RGBA').save(os.path.join(SAIDA, 'ui_slider_polegar.png'))
            trilho = np.concatenate([v[:, :8], v[:, x1:]], 1)   # a ponta da esquerda com a parte escura (vazia)
            Image.fromarray(trilho, 'RGBA').save(os.path.join(SAIDA, 'ui_slider_trilho.png'))
    return v


def main():
    debug = sys.argv[sys.argv.index('--debug') + 1] if '--debug' in sys.argv else None
    so = [x for x in sys.argv[1:] if not x.startswith('-') and x != debug]
    os.makedirs(SAIDA, exist_ok=True)
    mapa_p = os.path.join(AQUI, 'uiArte.json')
    mapa = json.load(open(mapa_p)) if os.path.exists(mapa_p) else {}
    for nome, cfg in PECAS.items():
        if so and nome not in so:
            continue
        a = np.array(Image.open(os.path.join(FOLHAS, nome + '.jpg')).convert('RGB'))
        bgm = fundo(a)
        p, fx, fy, e = grade(a, bgm)
        low = reduz(a, bgm, p, fx, fy)
        vs = pecas(low, cfg.get('versoes', 1))
        info = {'pixel': round(float(p), 3), 'versoes': []}
        for k, v in enumerate(vs):
            arq = nome if len(vs) == 1 else f'{nome}_{k + 1}'
            v = acabamento(nome, k, v, cfg)
            f = cfg.get('fatia')   # marcadas à mão, olhando a peça na grade (cima, direita, baixo, esquerda)
            Image.fromarray(v, 'RGBA').save(os.path.join(SAIDA, arq + '.png'))
            info['versoes'].append({'arquivo': arq, 'w': v.shape[1], 'h': v.shape[0], **({'fatia': f} if f else {})})
            if debug:
                os.makedirs(debug, exist_ok=True)
                Image.fromarray(v, 'RGBA').resize((v.shape[1] * 6, v.shape[0] * 6), Image.NEAREST).save(os.path.join(debug, arq + '.png'))
        mapa[nome] = info
        print(nome, f'pixel {p:.2f} (alinha {e:.2f})', [(x['arquivo'], x['w'], x['h'], x.get('fatia')) for x in info['versoes']])
    json.dump(mapa, open(mapa_p, 'w'), ensure_ascii=False, indent=1)
    linhas = []
    for f in sorted(os.listdir(SAIDA)):
        if f.endswith('.png'):
            im = Image.open(os.path.join(SAIDA, f))
            fat = next((v.get('fatia') for m in mapa.values() for v in m['versoes'] if v['arquivo'] == f[:-4] and v.get('fatia')), None)
            linhas.append(f'  {f[:-4]}: {json.dumps({"w": im.width, "h": im.height, **({"fatia": fat} if fat else {})})},')
    js = ('/* GERADO por arte/ui/recortar_ui.py (não editar à mão): as peças da interface (tema Laca e Brasa, v96).\n'
          ' * w x h = pixels de arte; fatia = as bordas da moldura de 9 fatias [cima, direita, baixo, esquerda]. */\n'
          'export const UI_ARTE = {\n' + '\n'.join(linhas) + '\n};\n')
    open(os.path.join(RAIZ, 'public', 'uiArte.js'), 'w').write(js)
    print('uiArte.js:', len(linhas), 'peças')


if __name__ == '__main__':
    main()
