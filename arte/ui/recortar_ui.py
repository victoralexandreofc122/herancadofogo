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
    'ui_selos': {'selos': True, 'fatia': [3, 3, 3, 3]},
    # v98: o lote 4 (16 folhas do Victor de 23/11). "area" tira o pedaço do painel de fundo que vazou na folha.
    'ui_campo_texto': {'celulas': (2, 1), 'area': [(0, 0.43, 1, 0.575)], 'tirar_roxo': True, 'nomes': ['1', '2'],
                       'fatia': [4, 4, 4, 4], 'miolo': (24, 7)},   # 1 = normal, 2 = com o foco
    'ui_logo': {},
    'ui_balao_chat': {'area': [(0, 0, 1, 0.80), (0.40, 0, 0.60, 0.835)], 'fatia': [13, 12, 12, 12], 'miolo': (47, 30)},
    'ui_aviso_grande': {'fatia': [24, 29, 26, 29], 'miolo': (48, 35)},
    'ui_aviso': {'area': [(0, 0.40, 1, 0.61)], 'tirar_roxo': True, 'reparar_topo': 4, 'fatia': [5, 6, 5, 24], 'miolo': (50, 10)},
    'ui_dialogo': {'area': [(0, 0.30, 1, 0.675)], 'fatia': [9, 10, 10, 10], 'miolo': (50, 15)},
    'ui_emblemas_aldeias': {'celulas': (2, 2), 'nomes': ['chama', 'mare', 'vento', 'rocha']},
    'ui_patentes': {'celulas': (4, 3), 'nomes': ['academia', 'genin', 'chunin', 'jonin', 'anbu', 'kage']},
    'ui_faixas': {'celulas': (5, 1), 'area': [(0, 0.38, 1, 0.81)], 'nomes': ['bronze', 'prata', 'ouro', 'diamante', 'lenda']},
    'ui_icones_aviso': {'celulas': (3, 3), 'nomes': ['alerta', 'ok', 'info', 'novo', 'nao_lido', 'travado']},
    'ui_icones_estados': {'celulas': (4, 4), 'nomes': ['atordoado', 'queimando', 'veneno', 'lento', 'preso', 'silencio', 'sono',
                                                     'escudo', 'dano_mais', 'defesa_menos', 'cego', 'invertido']},
    'ui_icones_classes': {'celulas': (4, 3), 'area': [(0, 0, 1, 0.735)],
                          'nomes': ['fogo', 'agua', 'raio', 'pedra', 'vento', 'cura', 'sombra', 'ilusao', 'taijutsu', 'armas']},
    'ui_icones_recursos': {'celulas': (4, 3), 'nomes': ['ryo', 'xp', 'chakra', 'vida', None, 'fragmento', 'shuriken', None,
                                                      'pergaminho', None, None, 'recarga']},
    'ui_icones_menu': {'celulas': (4, 4), 'nomes': ['mochila', 'perfil', 'missoes', 'vinculo', 'config', 'aldeia', 'historico',
                                                  'chat', 'manual', 'feedback', 'rankeado', 'tela_cheia', 'sair', 'admin']},
    'ui_slot': {'celulas': (5, 1), 'area': [(0, 0.39, 1, 0.61)], 'nomes': ['vazio', 'comum', 'raro', 'epico', 'lendario'],
                'fatia': [4, 4, 4, 4], 'miolo': (9, 9)},
    # v99: as 4 últimas do catálogo (folhas do Victor de 23/11)
    'ui_barra_chefe': {'area': [(0, 0.36, 1, 0.63)], 'tirar_roxo': True, 'fatia': [10, 14, 9, 22], 'miolo': (50, 13)},
    'ui_barra_cores': {'celulas': (5, 1), 'area': [(0, 0.23, 1, 0.745)], 'nomes': ['vida', 'chakra', 'xp', 'inimigo', 'escudo'], 'perfil': True},
    'ui_titulo': {'area': [(0, 0.40, 1, 0.575)], 'tirar_roxo': True, 'fatia': [4, 12, 4, 12], 'miolo': (48, 8)},
    'ui_alvo': {'celulas': (1, 1), 'nomes': ['1']},
    'ui_slot_equip': {'celulas': (3, 3), 'passo': (9.5, 11), 'nomes': ['arma', 'capa', 'pes', 'acessorio', 'pergaminho', None,
                                                                    None, None, 'mascara']},                      # o trilho vazio e a faixa de fogo que enche
}

def fundo(a):
    """A cor do fundo: a mediana dos 4 cantos; o fundo é o que fica perto dela (e o magenta puro de qualquer jeito)."""
    c = np.concatenate([a[:24, :24].reshape(-1, 3), a[:24, -24:].reshape(-1, 3), a[-24:, :24].reshape(-1, 3), a[-24:, -24:].reshape(-1, 3)])
    bg = np.median(c, 0)
    d = np.abs(a.astype(int) - bg).sum(-1)
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    mag = (r > 150) & (b > 150) & (g < 110) & (np.abs(r - b) < 80)
    return (d < 75) | mag


def grade(a, bgm, faixa=(17, 24)):
    """O tamanho do pixel e o deslocamento: as bordas entre cores (dentro do desenho) caem nas linhas da grade."""
    lum = a.astype(float).mean(-1)
    dx = np.abs(np.diff(lum, axis=1)) > 28
    dy = np.abs(np.diff(lum, axis=0)) > 28
    xs = np.nonzero(dx & ~bgm[:, 1:] & ~bgm[:, :-1])[1] + 1.0
    ys = np.nonzero(dy & ~bgm[1:, :] & ~bgm[:-1, :])[0] + 1.0
    melhor = None
    res = []
    for p in np.arange(faixa[0], faixa[1], 0.0625):   # o Flow desenha as folhas de 2048 px com o pixel perto de 20,5 (100 pixels de arte)
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


def celulas(low, cols, rows):
    """As folhas de ícones vêm numa grade: cada célula é um ícone (um ícone feito de partes soltas, como as 4 setas da
    tela cheia, fica junto). Devolve o desenho de cada célula, aparado, na ordem de leitura (vazias = None)."""
    op = low[..., 3] > 0
    ys, xs = np.nonzero(op)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    out = []
    for j in range(rows):
        for i in range(cols):
            cy0, cy1 = y0 + (y1 - y0) * j // rows, y0 + (y1 - y0) * (j + 1) // rows
            cx0, cx1 = x0 + (x1 - x0) * i // cols, x0 + (x1 - x0) * (i + 1) // cols
            cel = low[cy0:cy1, cx0:cx1].copy()
            # só a mancha maior da célula e o que estiver perto dela (tira as sobras do vizinho que caíram na borda)
            m = cel[..., 3] > 0
            lab, k = ndi.label(m, structure=np.ones((3, 3)))
            if not k:
                out.append(None); continue
            tam = ndi.sum(m, lab, range(1, k + 1))
            # ficam as partes grandes (as 4 setas da tela cheia) e as pequenas coladas na maior (faíscas, brilhos);
            # o resto é sobra do ícone vizinho
            perto = ndi.binary_dilation(lab == (int(np.argmax(tam)) + 1), iterations=2)
            caixas = ndi.find_objects(lab)
            Hc = cel.shape[0]
            def sobra(i):   # um fiapo encostado na borda de cima ou de baixo da célula: o fundo do ícone de outra fileira
                sl = caixas[i]
                return (sl[0].start == 0 or sl[0].stop == Hc) and sl[0].stop - sl[0].start <= 2 and tam[i] < 0.5 * tam.max()
            manter = np.isin(lab, [i + 1 for i in range(k) if not sobra(i) and (tam[i] >= 0.15 * tam.max() or ((perto & (lab == i + 1)).any() and tam[i] >= 2))])
            cel[~manter] = 0
            yy, xx = np.nonzero(cel[..., 3] > 0)
            out.append(cel[yy.min():yy.max() + 1, xx.min():xx.max() + 1].copy())
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


def dialogo(v):
    """A caixa da fala veio com tudo junto: a aba do nome em cima, o quadro do retrato à esquerda e a setinha embaixo.
    Cada parte vira uma peça própria (o jogo põe cada uma no seu elemento) e a moldura fica limpa para esticar."""
    def salva(nome, img):
        Image.fromarray(img, 'RGBA').save(os.path.join(SAIDA, nome + '.png'))
    H, W = v.shape[:2]
    # a aba do nome (linhas 0 a 6, colunas 12 a 34) com o contorno de baixo fechado
    aba = v[0:7, 12:35].copy()
    aba[-1] = aba[0]
    salva('ui_dialogo_nome', aba)
    # o quadro do retrato (16 x 16): o meio vazado, o rosto do NPC aparece por baixo
    rosto = v[11:27, 8:24].copy()
    rosto[3:13, 3:13, 3] = 0
    salva('ui_dialogo_rosto', rosto)
    # a setinha de continuar
    seta = v[25:29, 82:88].copy()
    rgb = seta[..., :3].astype(int)
    seta[~((rgb[..., 0] > 150) & (rgb[..., 2] < 110)), 3] = 0
    salva('ui_dialogo_seta', seta)
    # a moldura limpa: sem a aba (as linhas de cima saem), sem o retrato (a esquerda vem da direita espelhada) e sem a seta
    q = v.copy()
    q[3:6, 10:88, 3] = 0
    for r in range(12, 26):
        q[r, 0:10] = q[r, W - 1:W - 11:-1]
    for r in list(range(9, 12)) + list(range(25, 29)):   # a sombra e as linhas do quadro do retrato perto da borda
        q[r, 8:30] = q[r, 50]
    for r in range(25, 29):
        q[r, 80:88] = q[r, 60]
    return q[3:].copy()


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
    if nome == 'ui_dialogo':
        v = dialogo(v)
    if nome == 'ui_balao_chat':
        # a ponta do balão (embaixo, no meio) vira uma peça própria: o jogo estica o balão e põe a ponta embaixo do ninja
        ponta = v[58:74, 36:58].copy()
        Image.fromarray(ponta, 'RGBA').save(os.path.join(SAIDA, 'ui_balao_chat_ponta.png'))
        v = v[:63].copy()
        for x in range(36, 58):   # a borda de baixo fechada no lugar da ponta
            v[56:63, x] = v[56:63, 25]
    if nome == 'ui_barra_chefe':
        # as chamazinhas soltas na borda de cima e de baixo, no trecho que estica, esticariam junto: saem
        for x in list(range(44, 49)) + list(range(77, 82)):
            v[4:10, x] = v[4:10, 40]
            v[17:22, x] = v[17:22, 40]
    if nome == 'ui_aviso_grande':
        # o medalhão de cima (e as chamas em volta dele) vira uma peça por cima, no meio: assim a moldura estica sem
        # deformar o medalhão; a chama solta da borda de baixo sai (esticaria junto)
        selo = v[0:16, 26:77].copy()
        Image.fromarray(selo, 'RGBA').save(os.path.join(SAIDA, 'ui_aviso_grande_selo.png'))
        for x in range(29, 69):
            v[0:7, x, 3] = 0
            v[7:24, x] = v[7:24, 31]
            v[48:74, x] = v[48:74, 45]
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
    if cfg.get('reparar_topo'):
        # a borda de cima da direita veio apagada pelo painel que vazou (o Flow misturou os dois): a borda de cima é
        # refeita com uma coluna boa do meio, e a ponta da direita com a de baixo espelhada (a peça é simétrica)
        a0 = v[..., 3] > 0
        ref = int(W * 0.3)
        t = cfg['reparar_topo']
        for x in range(ref, W - 9):
            v[:t, x] = v[:t, ref]
        ponta = v[H - t:, W - 9:][::-1].copy()
        v[:t, W - 9:] = ponta
        v[:t, :, 3] = np.where(v[:t, :, 3] > 0, 255, 0)
    if cfg.get('perfil'):
        # as cores das barras vieram em pé: a coluna do meio é o corte de cima para baixo (a linha clara de cima, o
        # brilho, a cor e a linha escura de baixo). Cada faixa de cor igual encolhe para poucos pixels e a peça vira uma
        # tira de 4 colunas que o jogo repete na largura da barra
        col = v[:, W // 2, :].astype(int)
        col = col[col[:, 3] > 0][1:-1]   # sem o contorno de cima e de baixo
        runs = []
        for c in col:
            if runs and np.abs(runs[-1][0][:3] - c[:3]).sum() < 24:
                runs[-1][1] += 1
            else:
                runs.append([c, 1])
        linhas = []
        for c, n in runs:
            linhas += [c] * max(1, round(n / 4))
        tira = np.repeat(np.array(linhas, np.uint8)[:, None, :], 4, axis=1)
        tira[..., 3] = 255
        v = tira
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
        if cfg.get('area'):
            # o Flow às vezes desenha a peça por cima de um pedaço do painel de fundo (o da referência): fica só a área
            # da peça (retângulos em fração da folha: x0, y0, x1, y1), o resto vira fundo
            H0, W0 = bgm.shape
            manter = np.zeros_like(bgm)
            for x0, y0, x1, y1 in cfg['area']:
                manter[int(y0 * H0):int(y1 * H0), int(x0 * W0):int(x1 * W0)] = True
            bgm = bgm | ~manter
        if cfg.get('tirar_roxo'):
            # o brilho roxo do painel que vazou (o magenta misturado com o azul): vira fundo
            r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
            bgm = bgm | ((r > 70) & (b > 90) & (g < 0.55 * np.minimum(r, b)))
        p, fx, fy, e = grade(a, bgm, cfg.get('passo', (17, 24)))
        low = reduz(a, bgm, p, fx, fy)
        if cfg.get('celulas'):
            vs = celulas(low, *cfg['celulas'])
        else:
            vs = pecas(low, cfg.get('versoes', 1))
        nomes = cfg.get('nomes')
        info = {'pixel': round(float(p), 3), 'versoes': []}
        for k, v in enumerate(vs):
            if nomes is not None and (k >= len(nomes) or not nomes[k] or v is None):
                continue
            arq = f'{nome}_{nomes[k]}' if nomes else (nome if len(vs) == 1 else f'{nome}_{k + 1}')
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
