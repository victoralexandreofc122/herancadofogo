# Frente 3 — Maré Oculta — etapa 03: margem norte

27/11/2026 BRT. Responsável Victor Alexandre (victoralexandre301). Guia v1, Registro ed. 02 (DA-005/DA-007), Quadro ed. 02. Ponto de partida: revisão da água (documento Heranca-do-Fogo-Mare-Oculta-Revisao-Agua.md nas Fontes). Main 90a5a24, PR #79 integrado e #80 separado. Branch arte/mare-oculta-margem-ponte; pai 30133cb73d45686c77bd75ac9f1386d8cd112e13.

A revisão da água em cópia descartável da Frente 1 (13eff05) confirmou travessia ida/volta, água servida, 1.169 testes, tipos e build. Este resultado é anterior à nova borda, não uma validação desta mudança.

## Entrega desta rodada

- Tile transparente independente de contenção baixa: 96 × 30 px, 4 × 1,25 casas, 24 px/casa, 1.240 bytes. Pedra cinza-esverdeada, juntas desencontradas, musgo discreto, face sombreada e linha de contato com a água. Fonte regenerável `arte/mapas/mare/margem_norte.py`, manifesto `arte/mapas/mare/margem-norte.json`.
- Posição x43,06–55 / y26,22–27,47. A face começa aproximadamente na borda da colisão y26,74. A peça não define terreno caminhável. A região está a leste da ponte central; o tablado, portas, bambus, fachadas e colisões não foram editados.
- `public/mareArt.js`: composição após água, repetição em fase global, transições nas extremidades, cache por imagem e invalidação após carregar o novo PNG. `integrar.mjs` inclui a nova rota e preserva os ganchos de água. Não editamos diretamente game.js, staticFiles.ts ou maps.ts. A integração compartilhada continua sujeita à coordenação.
- Prévia de composição em Chromium horizontal usando recorte da captura validada da água, escala aproximada de 32 px/casa. Não é captura nova de partida, nem substitui os chunks reais.

## Testes executados localmente

`node test/mare-mask.test.mjs` passou (42.935 pixels candidatos sintéticos). `node test/mare-bank.test.mjs` passou: 33.022 pixels alterados a 48 px/casa e 240 a 4 px/casa; montagem inteira idêntica à dividida; zero pixels fora do recorte. Checagem de sintaxe do módulo e script passou. Chromium isolado: 13.869 pixels efetivamente alterados, zero fora da faixa, sem erro JS, na prévia baseada na referência. Os totais são testes locais do renderizador, não novos testes do servidor.

## Pendências e retomada

Obter checkout jogável integrado (água e demais frentes), aplicar ou revisar `node arte/mapas/mare/integrar.mjs --apply`, conferir borda sobre chunks originais, travessia norte/sul pelo eixo x40,20 entre y24,5 e 31,5 e aproximação da água sem cruzar a colisão. Verificar HUD, minimapa, cache e aparelho físico. A borda reta precisa de revisão de leitura dos materiais e término do trecho antes de avançar para cantos, pedra úmida/transição e tablado. Não houve execução do jogo completo nesta rodada (clone indisponível), PR novo, merge, deploy ou Oracle. A decisão de material é reversível e está em revisão; nenhuma decisão aprovada foi substituída.
