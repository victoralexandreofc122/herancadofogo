# A interface desenhada (tema Laca e Brasa)

Pedido do Victor (23/11/2026): uma interface própria do jogo, gerada no Flow, no estilo do jogo. As peças são pedidas na
página **Interface no Flow** (https://claude.ai/artifact/Cwr4oWRRZn7FSoadrW5CdM; o catálogo é `arte/ui/flow/catalogo.js`,
a página sai de `arte/ui/flow/montar.py`).

## Como uma peça entra no jogo

1. A folha do Flow vai para `arte/ui/flow/folhas/<id>.jpg` (o id do cartão).
2. `python3 arte/ui/recortar_ui.py [ids]`:
   - tira o fundo magenta;
   - acha a grade de pixels (o Flow desenha as folhas de 2048 px com o pixel perto de 20,5);
   - reduz cada célula a 1 pixel (a mediana: tira o borrado do jpeg);
   - separa as versões (normal, apertado, desligado...) e salva em `public/assets/ui/`;
   - gera o mapa `public/uiArte.js` (o servidor serve a lista dele).
   Em `PECAS`, cada peça diz as fatias (as bordas da moldura de 9 fatias, marcadas à mão olhando a peça na grade) e o
   ponto do miolo (o meio vira uma cor lisa, que é o que estica). `vazar` deixa o centro dos anéis transparente (a cor do
   elemento do jutsu aparece por baixo), `girar` deita um botão que veio em pé, `encurtar` tira colunas lisas das pontas.
3. `public/uiLaca.css` liga cada peça no lugar dela com `border-image` (9 fatias), sem mudar o tamanho dos botões e
   painéis. `--uis` = quantos pixels de tela por pixel de arte (1 no celular deitado, 2 no computador). Tudo `pixelated`.
4. Conferir sem rolagem: `npx tsx scripts/auditar-primeira.ts <pasta>`; e o HUD: `npx tsx scripts/auditar-hud.ts <pasta>`.
   Liga e desliga no ⚙️ → Visual → Interface.

## A animação (só com o gráfico no máximo)

`public/uiAnim.js` faz os quadros no aparelho, a partir da arte do Victor (nada novo para baixar). Liga quando os
efeitos dos jutsus estão em **Completos**, a opção "Fogo e brilho do ouro animados" está ligada e o aparelho não pede
para reduzir o movimento. Cada peça vira uma `@keyframes` que troca o `border-image-source` em passos (`step-end`).

### Os conceitos de animação em pixel art usados aqui

- **Poucos quadros, ritmo fixo.** Pixel art anima a 8 a 12 quadros por segundo, sempre em passos, sem misturar um quadro
  com o outro (misturar borra o pixel). Aqui: 10 por segundo.
- **Ciclo de paleta (fogo).** Em vez de redesenhar a chama, cada pixel dela anda uma casa numa rampa de calor (vermelho
  escuro → vermelho → laranja → amarelo → amarelo claro), numa onda que sobe linha a linha. O desenho continua o mesmo, mas
  a cor corre para cima e a chama parece queimar. A onda muda de fase a cada 4 colunas, para não subir tudo junto.
- **Ponta que pisca (sub-pixel).** Os pixels da ponta da chama somem e voltam, um de cada vez. Mexer 1 pixel na borda dá
  sensação de movimento maior do que o tamanho da mudança.
- **Faísca.** De vez em quando (a cada 8 quadros) uma faísca sobe 3 pixels acima de uma ponta, esfriando (amarela,
  laranja, vermelha) até apagar. Um detalhe raro chama mais atenção que um constante.
- **Reflexo no metal (ouro e bronze).** Uma faixa diagonal de 2 pixels mais claros passa pelo bronze de cima à esquerda
  para baixo à direita (a luz do jogo vem de cima à esquerda), em 8 a 18 quadros conforme o tamanho da peça, e depois uma
  pausa longa. Brilho constante cansa; brilho raro parece reflexo de verdade.
- **Só no que é fogo ou metal.** A chama é uma mancha pequena de laranja e vermelho saturado (até 16 pixels e não
  comprida); uma linha longa da mesma cor é o bronze aceso da moldura e não pega fogo. O metal é o que tem a cor do bronze
  e do ouro (matiz de 20 a 52 graus, saturação média).

Peças animadas (em `ANIMADAS`, no `uiAnim.js`):

| Peça | Onde aparece |
|---|---|
| painel | os painéis |
| cartão de entrada | a entrada e o Criador |
| pergaminho | o pergaminho |
| dica | a dica |
| painel pequeno | o aviso |
| aba ativa | a aba selecionada |
| botão principal | o botão principal |
| anel do jutsu pronto | os jutsus prontos |
| anel do ataque | o ataque básico |
| botão redondo | o botão redondo |
| retrato (você e o inimigo) | o retrato e o alvo |
| minimapa | o minimapa |
| faixa de fogo dos selos | a barra dos selos enchendo |

O apertado, o desligado e o jutsu em recarga ficam parados: o movimento é para o que está pronto para usar.

## Peças já no jogo (16 folhas do Victor, 23/11)

Painel, painel pequeno, pergaminho, cartão de entrada (a 2ª versão do painel, sem o fio de dentro), divisor, abas, dica,
botão principal, secundário (deitado), de perigo, redondo, fechar, caixa de marcar, controle deslizante, anel do jutsu
(pronto, recarga, travado) e anel do ataque.

v97 (mais 4 folhas, 23/11):
- O joystick: a base e a manopla, desenhadas no canvas em `drawJoystick`.
- O minimapa: o anel por cima do mapa.
- Os retratos:
  - em pé, com o canvas alto (o boneco da cabeça às pernas);
  - a plaquinha do nível embaixo.
- A barra dos selos: o trilho de 9 fatias e a faixa de fogo `ui_selos_fogo`, repetida na largura e animada inteira
  (`chamaGrande`).

v98 (o lote 4, 16 folhas, 23/11). Quando o Flow desenha a peça por cima de um pedaço do painel de fundo, o recorte
deixa esse pedaço de fora:
- `area`: os retângulos da peça, em fração da folha;
- `tirar_roxo`: o brilho roxo;
- `reparar_topo`: refaz a borda apagada.

As folhas de ícones são cortadas por célula (`celulas`: colunas e linhas) e cada célula ganha um nome (`nomes`, `None`
pula as repetidas). A caixa da fala vira 4 peças: moldura, aba do nome, quadro do retrato e seta. O balão do chat vira
moldura e ponta. O aviso grande vira moldura e medalhão, para os ornamentos do meio não esticarem.

Ainda sem lugar no jogo: os emblemas das aldeias, parte dos ícones de recurso e de aviso.

v99 (as 4 últimas, 23/11): a faixa do título, as cores das barras, a barra do chefe e o marcador do alvo no chão (no
canvas). As cores das barras vieram em pé: `perfil` pega o corte do meio, de cima para baixo, encolhe cada faixa de cor
e faz uma tira de 4 colunas que o CSS repete na largura.

Falta no Flow: a moldura das barras (vida, chakra, XP).
