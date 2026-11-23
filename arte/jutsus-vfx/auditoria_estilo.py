"""
v95 (pedido do Victor, 22/11): auditoria de estilo das animações dos jutsus (Fase 1 do diretor de arte).

Mede cada quadro recortado (public/assets/vfx/<jutsu>_NN.png) e resume por jutsu:
  - densidade: pixels de arte por casa (o "tamanho do pixel" na tela; o jogo desenha a casa com 32 px na base)
  - cores: quantas cores distintas (5 bits por canal) e a saturação / o brilho médios
  - contorno: quanto da borda é escura (contorno escuro = o estilo do boneco) e a cor média dela
  - suave: quanto do desenho é semitransparente (brilho borrado, gradiente de IA)
  - ruído: pixels muito diferentes dos 4 vizinhos (dithering, granulado de IA, jpeg)
  - luz: de que lado o desenho é mais claro (cima/baixo, esquerda/direita)
  - branco: quanto do desenho é branco quase puro (silhuetas brancas lisas)
Depois agrupa em famílias de estilo e marca os que fogem da família da maioria.

Uso: python3 arte/jutsus-vfx/auditoria_estilo.py [pasta de saída]
Gera <saída>/auditoria.json, <saída>/auditoria.md e as folhas de contato dos que fogem do padrão.
Só lê os PNG: não muda a arte (as correções esperam o OK do Victor).
"""
import json, os, re, sys, glob, statistics
import numpy as np
from PIL import Image, ImageDraw, ImageFont

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VFX = os.path.join(RAIZ, 'public', 'assets', 'vfx')
SAIDA = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, 'arte', 'jutsus-vfx', 'auditoria')
os.makedirs(SAIDA, exist_ok=True)

# casas de cada quadro (largura no jogo), do vfxFogo.js gerado pelo recortar.py
CASAS = {m.group(1): float(m.group(2)) for m in re.finditer(r'(\w+): \{"casas": ([\d.]+)', open(os.path.join(RAIZ, 'public', 'vfxFogo.js')).read())}


def medir(path):
    im = np.array(Image.open(path).convert('RGBA')).astype(float)
    a = im[:, :, 3] / 255
    op = a > 0.5
    n = int(op.sum())
    if n < 12:
        return None
    rgb = im[:, :, :3][op] / 255
    mx, mn = rgb.max(1), rgb.min(1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    q = (im[:, :, :3][op] // 8).astype(int)
    cores = len({tuple(c) for c in q})
    # borda: opaco com algum vizinho transparente
    pad = np.pad(op, 1)
    viz = pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:]
    borda = op & ~viz
    lum = (0.299 * im[:, :, 0] + 0.587 * im[:, :, 1] + 0.114 * im[:, :, 2]) / 255
    bl = lum[borda]
    contorno = float((bl < 0.28).mean()) if bl.size else 0.0
    cor_borda = im[:, :, :3][borda].mean(0).round().astype(int).tolist() if bl.size else [0, 0, 0]
    suave = float(((a > 0.04) & (a < 0.9)).sum() / max(1, (a > 0.04).sum()))
    # ruído: o pixel difere muito dos 4 vizinhos (só dentro do desenho)
    L = np.pad(lum, 1, mode='edge')
    d = np.stack([abs(L[1:-1, 1:-1] - L[:-2, 1:-1]), abs(L[1:-1, 1:-1] - L[2:, 1:-1]), abs(L[1:-1, 1:-1] - L[1:-1, :-2]), abs(L[1:-1, 1:-1] - L[1:-1, 2:])]).min(0)
    interior = op & viz
    ruido = float((d[interior] > 0.12).mean()) if interior.any() else 0.0
    # luz: diferença de brilho entre as metades (do desenho)
    ys, xs = np.nonzero(op)
    cy, cx = ys.mean(), xs.mean()
    lumop = lum[op]
    luz_v = float(lumop[ys < cy].mean() - lumop[ys >= cy].mean()) if (ys < cy).any() and (ys >= cy).any() else 0.0
    luz_h = float(lumop[xs < cx].mean() - lumop[xs >= cx].mean()) if (xs < cx).any() and (xs >= cx).any() else 0.0
    branco = float(((rgb.min(1) > 0.9)).mean())
    nome = os.path.basename(path)[:-4]
    w = im.shape[1]
    return {
        'quadro': nome, 'w': w, 'h': im.shape[0], 'opacos': n, 'cores': cores, 'sat': float(sat.mean()), 'brilho': float(mx.mean()),
        'contorno': contorno, 'cor_borda': cor_borda, 'suave': suave, 'ruido': ruido, 'luz_v': luz_v, 'luz_h': luz_h, 'branco': branco,
        'densidade': (w / CASAS[nome]) if CASAS.get(nome) else None,
    }


def base_de(q):
    return re.sub(r'_(baixo|cima|rajada)?_?0\d\w?$', '', q) if re.search(r'_0\d\w?$', q) else q


quadros = [m for m in (medir(p) for p in sorted(glob.glob(os.path.join(VFX, '*.png')))) if m]
por = {}
for q in quadros:
    por.setdefault(re.sub(r'_0\d\w?$', '', q['quadro']), []).append(q)

med = lambda xs: statistics.median(xs) if xs else 0
jutsus = []
for k, qs in sorted(por.items()):
    if k.startswith('pfx_'):
        continue   # as camadas do PixelFX (código nosso) ficam fora: só a arte do Victor
    dens = [q['densidade'] for q in qs if q['densidade']]
    j = {'jutsu': k, 'quadros': len(qs), 'densidade': med(dens), 'cores': med([q['cores'] for q in qs]), 'sat': med([q['sat'] for q in qs]),
         'brilho': med([q['brilho'] for q in qs]), 'contorno': med([q['contorno'] for q in qs]), 'suave': med([q['suave'] for q in qs]),
         'ruido': med([q['ruido'] for q in qs]), 'luz_v': med([q['luz_v'] for q in qs]), 'luz_h': med([q['luz_h'] for q in qs]),
         'branco': med([q['branco'] for q in qs]), 'cor_borda': qs[len(qs) // 2]['cor_borda']}
    # família de estilo
    if j['branco'] > 0.55 and j['sat'] < 0.12:
        j['familia'] = 'D: silhueta branca lisa'
    elif j['suave'] > 0.30:
        j['familia'] = 'C: brilho suave / gradiente'
    elif j['contorno'] >= 0.35:
        j['familia'] = 'A: contorno escuro, sombreado em tons'
    else:
        j['familia'] = 'B: sem contorno (energia, luz)'
    jutsus.append(j)

# a referência: a família da maioria e as faixas dela (do 10º ao 90º percentil)
fam = {}
for j in jutsus:
    fam.setdefault(j['familia'], []).append(j)
maioria = max(fam, key=lambda f: len(fam[f]))
ref = fam[maioria]
def faixa(chave):
    v = sorted(x[chave] for x in ref)
    return v[int(len(v) * 0.1)], v[int(len(v) * 0.9)]
FAIXAS = {c: faixa(c) for c in ('densidade', 'cores', 'sat', 'ruido')}
for j in jutsus:
    fora = []
    if j['familia'] != maioria:
        fora.append(j['familia'].split(':')[0])
    lo, hi = FAIXAS['densidade']
    if j['densidade'] and (j['densidade'] < lo * 0.8 or j['densidade'] > hi * 1.25):
        fora.append('pixel ' + ('grande' if j['densidade'] < lo else 'miúdo'))
    lo, hi = FAIXAS['sat']
    if j['sat'] < lo * 0.7:
        fora.append('pouca cor')
    lo, hi = FAIXAS['ruido']
    if j['ruido'] > hi * 1.3:
        fora.append('granulado')
    lo, hi = FAIXAS['cores']
    if j['cores'] > hi * 1.4:
        fora.append('cores demais')
    j['fora'] = fora

json.dump({'maioria': maioria, 'faixas': FAIXAS, 'familias': {f: len(v) for f, v in fam.items()}, 'jutsus': jutsus}, open(os.path.join(SAIDA, 'auditoria.json'), 'w'), ensure_ascii=False, indent=1)

# relatório
linhas = [f'# Auditoria de estilo dos jutsus ({len(jutsus)} jutsus, {sum(j["quadros"] for j in jutsus)} quadros)', '',
          f'Família da maioria: **{maioria}** ({len(ref)} jutsus).', '', '## Famílias', '']
for f, v in sorted(fam.items(), key=lambda x: -len(x[1])):
    linhas.append(f'- **{f}**: {len(v)} jutsus')
linhas += ['', '## Faixas da maioria (10º ao 90º percentil)', '']
for c, (lo, hi) in FAIXAS.items():
    linhas.append(f'- {c}: {lo:.2f} a {hi:.2f}')
linhas += ['', '## Tabela', '', '| jutsu | quadros | família | px/casa | cores | saturação | contorno | suave | ruído | luz (cima/esq) | fora do padrão |', '|---|---|---|---|---|---|---|---|---|---|---|']
for j in sorted(jutsus, key=lambda j: (-len(j['fora']), j['jutsu'])):
    luz = ('cima' if j['luz_v'] > 0.04 else 'baixo' if j['luz_v'] < -0.04 else '-') + '/' + ('esq' if j['luz_h'] > 0.04 else 'dir' if j['luz_h'] < -0.04 else '-')
    linhas.append(f"| {j['jutsu']} | {j['quadros']} | {j['familia'][0]} | {j['densidade']:.0f} | {j['cores']:.0f} | {j['sat']:.2f} | {j['contorno']:.2f} | {j['suave']:.2f} | {j['ruido']:.2f} | {luz} | {', '.join(j['fora']) or '-'} |")
open(os.path.join(SAIDA, 'auditoria.md'), 'w').write('\n'.join(linhas) + '\n')

# folhas de contato: uma por família (o quadro do meio de cada jutsu)
try:
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 11)
except OSError:
    F = ImageFont.load_default()
for f, v in fam.items():
    cell, cols = 120, 10
    rows = (len(v) + cols - 1) // cols
    o = Image.new('RGB', (cols * cell, rows * (cell + 14) + 24), (34, 38, 48))
    d = ImageDraw.Draw(o)
    d.text((6, 4), f'{f} ({len(v)})', font=F, fill=(255, 230, 160))
    for i, j in enumerate(sorted(v, key=lambda j: j['jutsu'])):
        qs = sorted(por[j['jutsu']], key=lambda q: q['quadro'])
        q = qs[min(len(qs) - 1, 3)]
        im = Image.open(os.path.join(VFX, q['quadro'] + '.png')).convert('RGBA')
        im.thumbnail((cell - 8, cell - 8), Image.NEAREST)
        x, y = (i % cols) * cell, 24 + (i // cols) * (cell + 14)
        o.paste(im, (x + 4, y + 14), im)
        d.text((x + 2, y), j['jutsu'][:17], font=F, fill=(255, 120, 120) if j['fora'] else (200, 200, 210))
    o.save(os.path.join(SAIDA, 'familia_' + f[0] + '.png'))
print(f'{len(jutsus)} jutsus; famílias:', {f: len(v) for f, v in fam.items()}, '; fora do padrão:', sum(1 for j in jutsus if j['fora']))
