"""Monta a página dos prompts do Flow (texturas dos mapas) a partir do catálogo.

  python3 arte/mapas/flow/montar.py <saida.html>

- catalogo.js: as regiões (paleta de cada uma) e as peças (id, tamanho em casas, descrição, luz, movimento).
- pagina.html: a página; os blocos /*__REFS__*/ e /*__ASSETS__*/ recebem as miniaturas das referências e o catálogo.
- As referências de estilo são as imagens provisórias de arte/vilas e arte/mapas.
- v105: ao lado da página, recebidas/<id>.webp (a miniatura de cada imagem que o Victor mandou, de
  arte/mapas/flow/recebidas/) e chama_v105.jpg (o mapa montado com elas, arte/mapas/capturas/). Publicar os três juntos.
"""
import base64, io, json, os, sys
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.join(AQUI, '..', '..', '..')
REFS = [('chama', 'arte/vilas/referencia_folha.jpg'), ('floresta', 'arte/mapas/referencia_floresta.jpg'),
        ('mare', 'arte/vilas/referencia_nevoa.jpg'), ('vento', 'arte/vilas/referencia_nuvem.jpg'),
        ('zona', 'arte/mapas/referencia_zona_conflito.jpg')]

def main():
    refs = {}
    for k, p in REFS:
        im = Image.open(os.path.join(RAIZ, p)).convert('RGB')
        im.thumbnail((640, 640))
        b = io.BytesIO(); im.save(b, 'JPEG', quality=72)
        refs[k] = 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
    pag = open(os.path.join(AQUI, 'pagina.html'), encoding='utf-8').read()
    cat = open(os.path.join(AQUI, 'catalogo.js'), encoding='utf-8').read()
    out = pag.replace('/*__REFS__*/', 'const REFS=' + json.dumps(refs) + ';').replace('/*__ASSETS__*/', cat)
    open(sys.argv[1], 'w', encoding='utf-8').write(out)
    pasta = os.path.dirname(os.path.abspath(sys.argv[1]))
    rec = os.path.join(AQUI, 'recebidas')
    os.makedirs(os.path.join(pasta, 'recebidas'), exist_ok=True)
    n = 0
    for f in sorted(os.listdir(rec)):
        if f.endswith('.jpg'):
            im = Image.open(os.path.join(rec, f)).convert('RGB')
            im.thumbnail((240, 240), Image.LANCZOS)
            im.save(os.path.join(pasta, 'recebidas', f[:-4] + '.webp'), 'WEBP', quality=86)
            if f.endswith('_1.jpg'):                       # a peça em quadros (canal_agua_1..4): o primeiro é a miniatura
                im.save(os.path.join(pasta, 'recebidas', f[:-6] + '.webp'), 'WEBP', quality=86)
            n += 1
    mapa = os.path.join(AQUI, '..', 'capturas', 'chama_v105.jpg')   # o nome fica (a página aponta para ele)
    if os.path.exists(mapa):
        Image.open(mapa).save(os.path.join(pasta, 'chama_v105.jpg'), 'JPEG', quality=84)
    print('ok', len(out) // 1024, 'KB,', n, 'miniaturas')

if __name__ == '__main__':
    main()
