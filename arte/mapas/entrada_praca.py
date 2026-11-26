"""Monta o piso da entrada e do centro da Praça. O mosaico fica em outra camada."""
from math import hypot, sin
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / "public/assets/terrain"
atlas = Image.open(DIR / "chama.png").convert("RGB")
assert atlas.size == (288, 96)
px = 24
out = Image.new("RGBA", (18 * px, 18 * px))
for j in range(out.height):
    for i in range(out.width):
        x, y = 30 + i / px, 34 + j / px
        # Acima da praça, a curva abre o caminho junto aos dois gramados.
        dx = min(x - 36.65, 41.25 - x)
        dy = y - 36.15
        curve = hypot(max(dx + .45, 0), max(dy + .45, 0)) - .45
        if dx < -.45 and dy < -.45:
            curve = max(dx, dy)
        tooth = .07 * sin(i * .31 + j * .11) + .05 * sin(j * .71)
        lawn = curve + tooth < 0
        lip = y - 37.95 + .035 * sin(i * .11)
        column = 2 if lip >= 0 else (0 if lawn else 1)
        color = atlas.getpixel((column * 96 + i % 96, j % 96))
        if 0 <= lip < .11:
            color = (111, 103, 94) if lip < .055 else (184, 171, 148)
        elif -0.07 < curve + tooth < 0 and lip < 0:
            color = (104, 117, 62)
        # A vista antiga tem lanternas e bancos incorporados. O granito novo entra
        # entre eles; a faixa horizontal de terra passa abaixo das placas e lojas.
        street = min(x - 30, 48 - x, y - 35.75, 37.96 - y)
        approach = min(x - 35.35, 42.7 - x, y - 34.1, 51.9 - y)
        # O disco antigo alcançava quatro casas de raio. Esta área de lajes
        # cobre o desenho inteiro e passa entre os bancos, as lanternas e o poço.
        center = 4.85 - hypot(x - 39, (y - 45.55) * 1.04)
        extent = max(street, approach, center)
        opacity = max(0, min(1, extent / .62))
        out.putpixel((i, j), (*color, round(255 * opacity)))
out.save(DIR / "entrada-praca.png", optimize=True)
