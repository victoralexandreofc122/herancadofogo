# Guia de estilo das animações dos jutsus

Pedido do Victor (22/11/2026): as habilidades parecem de artistas ou de jogos diferentes. Este guia junta a auditoria
(Fase 1), as regras canônicas (Fase 2) e o plano de correção (Fases 3 a 5). **Nada da arte do Victor é mudado sem o OK
dele**: as correções abaixo só valem depois que ele escolher quais aplicar.

- Auditoria: `python3 arte/jutsus-vfx/auditoria_estilo.py` (gera `arte/jutsus-vfx/auditoria/auditoria.md`, a tabela de
  cada jutsu, e as folhas de contato `familia_A.png` a `familia_D.png`). Só lê os PNG.
- O jogo: Canvas 2D próprio (sem engine), a casa com 32 px na tela base, os quadros desenhados a cerca de 6 a 12 por
  segundo (80 a 170 ms cada), o boneco chibi com contorno escuro e sombreado em 2 ou 3 tons.

## 1. Auditoria (Fase 1): o que foi medido em 224 animações (1.313 quadros)

| Família | Jutsus | Como é | Exemplos |
|---|---|---|---|
| A: contorno escuro, sombreado em tons | 112 | o estilo do boneco: contorno escuro de 1 px, 2 a 3 tons por cor | Pedra, Garra, Rubro, Áspide, as invocações |
| B: energia sem contorno escuro | 97 | fogo, raio, vento, água e luz com borda colorida, núcleo claro | Vento, Ilusão, Fogo |
| C: brilho borrado ou gradiente | 11 | borda semitransparente (brilho de pincel), parece pintura e não pixel | Cura (heal, heal_4, heal_disturbio), Relâmpago neon |
| D: silhueta branca lisa | 4 (+3 quase) | uma cor só, sem tom nem contorno: parece de outro jogo | Soco, Cem Golpes e Punho do Céu (as folhas antigas), Corte, Rasteira, Flecha |

A e B convivem bem (é o padrão dos jogos de pixel: objeto com contorno escuro, energia com borda clara). As famílias
C e D são as que destoam.

Outras medidas:

- **Tamanho do pixel na tela**: a maioria tem de 23 a 50 pixels de arte por casa (mediana 33). Fogem:
  - pixel grande demais (7 a 17 por casa): Milagre, Explosão Florescente (heal_3), Chamas do Rubro, Coluna Infernal,
    Julgamento do Trovão, Céu em Fúria;
  - pixel miúdo demais (67 a 91 por casa): Ninho de Áspides, Mãos de Trovão, Lâmina Polida, Séptica. Esses são pequenos
    na tela, e a diferença quase não aparece.
- **Granulado** (o ruído do gerador ou do jpeg): Ciclo Sem Fim, Rede de Faíscas, Correntes de Raio, Gotas, Arsenal Vivo.
- **Direção da luz**: quase todos os efeitos são radiais (sem lado); onde há luz, ela vem de cima. Não é um problema.
- **Quadros**: 6 por jutsu (alguns 5, 7, 8 ou 9). O ritmo é dado pelo código (`folhasAnim.js`, `fogoAnim.js`).

## 2. As regras (Fase 2)

1. **Tamanho do pixel**: 33 pixels de arte por casa (aceito de 25 a 45). No recorte, `pixel` e `pxCasa` em `ajustes.json`.
2. **Contorno**: objeto sólido (pedra, arma, criatura, punho, escudo) com contorno escuro de 1 px, na cor mais escura do
   mesmo matiz (não preto puro). Energia (fogo, raio, vento, água, luz) com a borda na cor saturada do elemento e o
   núcleo claro; nunca branco puro chapado sozinho.
3. **Sombreado**: 2 a 3 tons por cor mais 1 brilho; luz de cima. Sem gradiente liso.
4. **Transparência**: o desenho é opaco ou com no máximo um nível de transparência; o brilho suave vem do código
   (as camadas e a luz no chão), não da folha.
5. **Cores por elemento**: Fogo laranja e vermelho; Cura verde; Relâmpago amarelo e ciano; Água azul; Vento ciano e
   branco-azulado com rosa claro; Sombra e Ilusão violeta; Pedra marrom e âmbar; Armas aço com dourado; Taijutsu creme
   com laranja (o punho da folha de rajada).
6. **Quadros**: 6 por folha: anúncio (1 a 2), golpe ou laço (2 a 3), dissipar (1 a 2). Rajadas e invocações podem ter
   folhas a mais (rajada, de frente e de costas).

## 3. Correções propostas (Fase 3), com prévia antes/depois

Prévias geradas sem mexer na arte (`arte/jutsus-vfx/auditoria/previas/previa_1.png` a `previa_3.png`):

| Grupo | Correção mínima | Resultado da prévia | Recomendação |
|---|---|---|---|
| D: silhuetas brancas (Soco, Cem Golpes, Corte, Rasteira, Flecha) | 3 tons da paleta do Taijutsu desenhado + contorno de 1 px, luz de cima | fica no estilo da folha de rajada | **aplicar** (ou pedir a folha nova no Flow) |
| Pixel grande (Milagre, Explosão Florescente, Chamas do Rubro, Coluna Infernal, Julgamento, Céu em Fúria) | recortar de novo da folha a 33 px por casa | mais detalhe, mas a folha original já foi desenhada com pixel grande | aplicar onde melhora (Milagre); nos outros, refazer a folha |
| Pixel miúdo (Ninho, Mãos de Trovão, Lâmina Polida, Séptica) | recortar com pixel maior | quase igual na tela | **não precisa** |
| C: brilho borrado (Cura, Relâmpago neon) | transparência em 2 níveis; o brilho vem do código | borda nítida, como pixel art | aplicar |
| Granulado (Ciclo, Rede, Correntes, Gotas) | paleta limpa por quadro | melhora pouco; no Arsenal tira o dourado | aplicar só no Ciclo e na Rede, sem reduzir cor demais |

## 4. Animação (Fase 4) e partículas (Fase 5)

- O que já existe: o anúncio em fases (aviso no chão, carga dos selos), o zoom de entrada (`pop`), o giro, a sombra e a
  luz no chão, a metade de trás atrás do boneco, o laço do meio enquanto dura e as camadas do PixelFX (brasas, faíscas,
  poeira, anéis) no tempo dos quadros (`camadasJutsus.js`).
- O que falta, por regra: todo golpe com impacto tem 1 quadro de antecipação legível (a carga) e as partículas casando
  com o quadro do impacto (faísca aditiva para energia, poeira normal para chão). Os casos sem isso entram na lista de
  correção depois do OK do Victor.
