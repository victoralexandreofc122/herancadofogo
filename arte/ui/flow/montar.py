"""Monta a página dos prompts da interface no Flow (tema Laca e Brasa) a partir do catálogo.

  python3 arte/ui/flow/montar.py <saida.html>

- catalogo.js: os grupos e as peças (id, tamanho da arte em pixels, tipo, descrição, versões ou ícones).
- pagina.html: a página; /*__REFS__*/ recebe as telas de hoje (referência) e /*__CAT__*/ o catálogo.
- As marcações ficam no banco da página (coleção "interface").
"""
import base64, io, json, os, sys
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
REFS = [('ref_hud.png', 'O HUD de hoje (o tema nasce daqui: azul-tinta e bronze)'), ('ref_pergaminho.png', 'O pergaminho de hoje (Manual, Nota de atualização)'),
        ('ref_painel.png', 'Um painel de hoje (Configurações)')]

def main():
    refs = []
    for f, cap in REFS:
        p = os.path.join(AQUI, f)
        if not os.path.exists(p):
            continue
        im = Image.open(p).convert('RGB'); im.thumbnail((720, 720))
        b = io.BytesIO(); im.save(b, 'JPEG', quality=74)
        refs.append(['data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode(), cap])
    pag = open(os.path.join(AQUI, 'pagina.html'), encoding='utf-8').read()
    cat = open(os.path.join(AQUI, 'catalogo.js'), encoding='utf-8').read()
    out = pag.replace('/*__REFS__*/', 'const REFS=' + json.dumps(refs) + ';').replace('/*__CAT__*/', cat)
    open(sys.argv[1], 'w', encoding='utf-8').write(out)
    print('ok', len(out) // 1024, 'KB', len(refs), 'referências')

if __name__ == '__main__':
    main()
