"""Confere se os quadros de cada jutsu "casam": o centro de massa do desenho não pode pular entre um quadro e o seguinte.

  python3 arte/jutsus-vfx/alinhamento.py [--json saida.json]

Para cada folha, só os quadros com apoio no centro e sem direção (os que giram ou esticam têm outro apoio de propósito):
o centro de massa (alfa) de cada quadro em relação ao ponto de apoio, em casas, e o salto dele de um quadro para o outro.
Salto acima de LIMITE casas (e acima de 18% do tamanho do quadro) = o desenho pula na tela. A correção é o apoio
"massa" em ajustes.json (o ponto de apoio passa a ser o centro de massa do quadro).
"""
import glob, json, os, re, sys
import numpy as np
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, '..', '..'))
VFX = os.path.join(RAIZ, 'public', 'assets', 'vfx')
LIMITE = 0.22

src = open(os.path.join(RAIZ, 'public', 'vfxFogo.js'), encoding='utf-8').read()
FR = {m.group(1): json.loads(m.group(2)) for m in re.finditer(r'^  (\w+): (\{.*\}),$', src, re.M)}


def massa(nome):
    a = np.asarray(Image.open(os.path.join(VFX, nome + '.png')))[..., 3].astype(float)
    if a.sum() == 0:
        return None
    ys, xs = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    return float((xs * a).sum() / a.sum()), float((ys * a).sum() / a.sum()), a.shape[1]


def main():
    bases = {}
    for n in FR:
        if re.search(r'_0\d$', n):
            bases.setdefault(re.sub(r'_0\d$', '', n), []).append(n)
    rel = []
    for b, ns in sorted(bases.items()):
        pts = []
        for n in sorted(ns):
            f = FR[n]
            if f.get('arte') is not None or f.get('eixoPx'):
                continue
            m = massa(n)
            if not m:
                continue
            cx, cy, w = m
            k = f['casas'] / w   # casas por pixel
            ax, ay = f['ancora']
            pts.append((n, (cx - ax) * k, (cy - ay) * k, f['casas']))
        saltos = []
        for (n0, x0, y0, c0), (n1, x1, y1, c1) in zip(pts, pts[1:]):
            d = ((x1 - x0) ** 2 + (y1 - y0) ** 2) ** 0.5
            if d > LIMITE and d > 0.18 * max(c0, c1):
                saltos.append({'de': n0, 'para': n1, 'casas': round(d, 2), 'dx': round(x1 - x0, 2), 'dy': round(y1 - y0, 2)})
        if saltos:
            rel.append({'jutsu': b, 'saltos': saltos})
    for r in rel:
        print(r['jutsu'], ' '.join(f"{s['de'][-2:]}→{s['para'][-2:]}: {s['casas']} (dx {s['dx']}, dy {s['dy']})" for s in r['saltos']))
    print(len(rel), 'jutsus com salto')
    if '--json' in sys.argv:
        json.dump(rel, open(sys.argv[sys.argv.index('--json') + 1], 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
