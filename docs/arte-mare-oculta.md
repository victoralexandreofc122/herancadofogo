# Maré Oculta — frente 3, etapa 01: superfície da água

26/11/2026, horário de Brasília (27/11 UTC). Responsável: Victor Alexandre, conta Business victoralexandre301. Guia v1, Registro ed.02, Quadro de Frentes ed.02 / DA-005 e DA-007. Base main 90a5a24abe453963d11622120ad5fdacd5b4a27e (PR #79); PR #80 ainda separado. Branch arte/mare-oculta-margem-ponte. Sem PR, merge ou deploy.

## Recorte
Mapa vila_nevoa, 80 × 60 casas; a ponte central ocupa x 37,63–42,77, y 26,74–29,13. A caixa de água leste se estende a x 68,05. Primeiro recorte planejado: x 42,77–55, y 26,74–29,13, uma margem junto à ponte; não substituir a vila inteira. As caixas resultam de retrace() em src/realtime/maps.ts da main. O eixo da travessia é x 40,20, entre y 24,5 e 31,5. A arte antiga contém ponte, água, margem, bambus e telhado na mesma imagem, visualmente deslocados em relação às caixas. Foram inspecionados os blocos nevoa/4_3.webp, 5_3.webp e 6_3.webp; não usar a caixa de colisão como máscara visual sem rever o desenho.

## Entrega
- Tile de água original, 96 × 96 px (4 × 4 casas, 24 px/casa), PNG de 1098 bytes, pivô superior esquerdo, repetição ancorada na grade. SHA-256 747d176a2d34116b1e57ccf014aa91dcd0216f6793d3a759e1de9cf722fe4552. Cinco tons azul-acinzentados, ondas baixas e sem espuma. Fonte regenerável em arte/mapas/mare/agua.py.
- Módulo independente public/mareArt.js: repete o tile em escala de mundo com máscara Path2D explícita; não altera a colisão. Manifesto em arte/mapas/mare/manifesto.json.
- A água não está ativada no cliente. Nenhum arquivo compartilhado de jogo ou servidor foi editado; as rotas HTTP e os ganchos de cache/minimapa ainda precisam ser coordenados entre frentes.

## Checagens
Chromium local isolado em viewport horizontal 900 × 450: imagem decodificou em 96 × 96; faixa 16 × 4 casas desenhada inteira igual pixel a pixel a dois chunks de 8 × 4; sem erros JS. Bancada esquemática, não jogo. Emendas inspecionadas também no mosaico de 4 × 3 tiles. Geometria da planta da main, usando a regra de colisão de public/movement.js (raio 0,3): 29 amostras livres no eixo da ponte, x 40,20, y 24,5–31,5; x49, y28 bloqueado. Isso não é travessia real com servidor, personagem, HUD ou aparelho físico. Clone indisponível neste ambiente (DNS); não houve build, verify ou execução do servidor.

## Primeira ação seguinte
Obter checkout completo do commit da base (ou atualizar e revalidar), conferir visualmente a máscara sobre os três chunks reais preservando o bambu e os telhados, combinar integração em public/game.js e src/web/staticFiles.ts com as demais frentes. Ativar e testar exclusivamente a água, em cache e minimapa; atravessar com personagem, servidor e HUD horizontal. Só então criar a borda como peça independente. Não alterar colisão nem tratar esta revisão como aprovada. Não mexer em Chama Eterna, lojas, Academia ou Oracle.
