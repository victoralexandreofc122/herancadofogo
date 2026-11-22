# Animações desenhadas dos jutsus (folhas do Victor)

O Victor desenha cada jutsu numa **folha de 6 quadros** (às vezes 5 ou 7), sobre fundo **verde** ou **magenta**, com o
nome do jutsu e às vezes F1..F6 escritos. Este diretório transforma a folha em quadros do jogo e diz em que momento do
golpe cada quadro aparece. Tudo é **só visual**: o servidor continua decidindo quem acerta.

## O caminho de uma folha até o jogo

1. **Achar o jutsu pelo nome** no servidor (`src/realtime/jutsus.ts`, `jutsusClasses.ts`, `jutsusMecanicas.ts`,
   `jutsusFase25.ts`): o id (`lightning_rugido`), a forma (`faixa`, `aviso`, `zona`, `projetil`...) e os números (raio,
   alcance, duração, selos). Folha repetida ou nome que não existe: avisar o Victor antes de fazer.
2. **Salvar a folha** em `folhas/<id>.jpg` (cópia do anexo que está em `/root/.claude/uploads/...`).
3. **Recortar** com `python3 arte/jutsus-vfx/recortar.py --debug <pasta> <id> [<id>...]`. O recorte usa
   `ajustes.json` (uma entrada por jutsu):
   - `pixel`: tamanho do pixel da arte na folha (px). Estime pelas distâncias entre trocas de cor (5, 7, 8, 10,5...).
   - `fundo`: `"magenta"` ou `"escuro"` (sem nada = verde); `cor_fundo`: a cor fixa quando o desenho encosta nos cantos.
   - `paineis`: os retângulos [x0, y0, x1, y1] quando a detecção automática erra (folha sem moldura, quadro que vaza);
     `quadros`: a numeração quando falta um quadro (ex.: `[1, 2, 3, 4, 6]`).
   - `topo` (faixa do título, em px do painel), `cantos` (retângulos do F1..F6), `texto_preto` (letras escuras por cima
     do desenho), `detector_texto: false` (desliga o detector de letras quando ele apaga arte).
   - `alfa_suave` (brilho e névoa com transparência em degraus), `limiar_m`, `circulo` (máscara redonda), `buraco`
     (apaga o miolo de um anel), `roer` (desfaz um corte reto na borda), `grao`, `margem`, `verde`.
   - `partes`: um pedaço do quadro vira peça solta (`<id>_04b`): a brasa que voa, um meteoro dos cinco; `roer_partes`.
   - `jogo`: tamanho e apoio de cada quadro no jogo: `pxCasa` (casas por pixel da arte), `ancora` (`centro`, `base`,
     `topo`, `esquerda`, `direita`, `cabeca`, `anel:<razão>` ou [x, y]), `arte` (para onde a arte aponta, em rad),
     `eixo` (comprimento a esticar até onde o golpe chega), `blend` (`glow`, `screen`, `normal`), `alpha`; e `quadros`
     para mudar um quadro só.
   Confira a imagem de `--debug` (todas as peças sobre fundo escuro) **antes** de seguir. O script gera
   `public/assets/vfx/<id>_0N.png` e a tabela `public/vfxFogo.js` (não editar à mão).
4. **Tocar no jogo** em `public/fogoAnim.js`: um `case '<id>'` em `fogoCast` (o lançamento), e se preciso em
   `fogoCastStart` (os selos), `fogoProjectileFrame` / `fogoImpact` (projétil), `fogoGround` (avisos e zonas),
   `fogoMarca` (marcas). `seq(jfx, id, x, y, now, [[quadro, começa_ms, dura_ms, opções], ...])`; opções: `angle`,
   `len` (estica no eixo), `scale`, `flicker`, `grow`, `layer: 'ground'`, `follow` (acompanha um boneco), `tag`
   (`jfx.drop(tag)` tira antes da hora). Quando o desenho novo substitui um antigo feito por código (raio, meteoro,
   partículas), desligue o antigo só quando `jutsuSpritesReady(id)` (se a folha não carregar, o antigo volta).
   Classe nova: acrescente o prefixo na lista de `src/web/staticFiles.ts` (`FOGO_SPRITE_FRAMES`, hoje fire|heal|lightning).
5. **Conferir no jogo**: `bash scripts/ambiente-local.sh` (uma vez por sessão), depois
   `set -a && . /var/tmp/jogo.env && set +a && npx tsx arte/jutsus-vfx/capturar.ts <pasta> <id>` e
   `python3 arte/jutsus-vfx/folha.py <pasta>`. Acrescente o plano do jutsu em `PLANOS` (copie o de um da mesma forma).
   Olhe as folhas: tamanho (o anel no tamanho da área do servidor), direção, onde cai o impacto, se o desenho antigo
   ainda aparece por cima. Ajuste e capture de novo.
6. **Teste e versão**: acrescente o id em `SKILLS` de `test/vfxJutsus.test.ts` (e em `N` se a folha não tiver 6
   quadros); `README.md` e `CLAUDE.md` com a versão nova; `npm run verify` com
   `TEST_DATABASE_URL="postgres://postgres@localhost:5433/postgres?host=/var/tmp"`; commit, push e mandar as folhas
   (`folha_<id>.png`) ao Victor, com o que mudou em cada jutsu e o que não foi testado com um ninja de verdade.

## Folhas tocadas pela forma (v80)

Da Água em diante, a folha nova entra numa linha da tabela `TIPO` de `public/folhasAnim.js` (zona, anel, corpo, escudo,
proj, cone, linha, laco, prende, lamina, rastro, alvo, entre, agarre, aviso, invoca, muro), com os quadros de cada fase;
o resto sai da ordem da folha. Só precisa de `case` próprio no `fogoAnim.js` quando o desenho pede algo que a forma não
cobre. No recorte, `manter_escuro` mantém o roxo-escuro opaco e `manter_claro` o clarão claro (a arte da Sombra).

## Camadas por cima das folhas (v78)

Cada jutsu desenhado ganha **camadas** do PixelFX (a carga dos selos, anel, poeira, brasas, cruzes, faíscas, choque) em
`public/camadasJutsus.js`. Ao terminar uma folha nova, acrescente o `case '<id>'` dele lá (o teste cobra) com as camadas
no tempo dos quadros. O passo a passo e as lições estão em `arte/pixelfx/LEIAME.md`.

## Fundos pintados no painel (v79)

- `inundar`: [[r, g, b, tolerância], ...]: o chão pintado dentro do painel (terra, grama, retângulo escuro) que encosta na borda
  vira magenta antes do recorte; o que está dentro do desenho com cor parecida fica (as pedras do lamaçal, o corpo do golem).
- `trocar`: a mesma troca na folha inteira (ou numa área), sem olhar se encosta na borda.
- `limpa_verde` e o passo final de magenta: pontinhos da franja que sobram no quadro reduzido saem.

## Lições das folhas já feitas

- O fundo é tirado pela cor dos cantos de cada painel: se o desenho encosta no canto, use `cor_fundo`.
- Verde ou magenta misturado com o brilho dá cinza: o recorte já corrige (núcleo de cor + transparência gradual); se
  sobrar auréola, `alfa_suave`, `limiar_m` ou `circulo`.
- Vermelho perto do magenta some no recorte: deixe a peça vermelha de outro quadro por baixo.
- Quadro com vários objetos (5 meteoros, 4 marcadores): use `partes` e toque uma peça por aviso.
- Feixes, lanças e cometas: `arte` + `ancora` + `eixo`, e `len` no `seq` para esticar até o alcance do servidor.
- Projétil desenhado: o rastro e o estouro antigos do elemento saem (`drawnArt` em `game.js`).
- Captura de noite deixa o brilho mais forte; a Academia é o lugar padrão (chão liso, de dia).

## Profundidade, giro, sombra e luz (v85)

- O que fica no corpo (auras, escudos, anéis em volta, curas) entra no `PROFUNDIDADE` de `public/vfxJutsus.js`: o motor
  desenha a parte de cima do quadro (acima dos pés) na camada do chão, atrás do boneco, e a de baixo por cima. Bolhas e
  véus que cobrem o corpo vão também no `FRENTE` (a metade da frente fica translúcida).
- `show()` aceita `spin` (giro em rad/s), `pop` (entrada com zoom, em ms), `sombra` (raio em casas) e `luz` ([cor, raio]);
  `jfx.marca(x, y, início, ms, { sombra, luz })` põe só a sombra ou a luz no chão.
- `ancora: "massa"` no `jogo` do `ajustes.json` centra cada quadro pelo centro de massa do desenho (anéis que pulavam).
  `python3 arte/jutsus-vfx/alinhamento.py` lista os saltos de posição e de tamanho entre quadros.
- Hitbox: `AUDITAR=1 npx tsx arte/jutsus-vfx/capturar.ts <pasta>` e `npx tsx arte/jutsus-vfx/auditar.ts <pasta>/auditoria.json`
  (copiar o `auditoria-hitbox.md` para esta pasta). Casado é de 75% a 135% do raio do servidor.

## Folhas de direção: para baixo e para cima (v86)

A folha base aponta para a direita (o jogo espelha para a esquerda e gira nas diagonais). O que tem volume (objeto,
criatura, chama que sobe, pontas que saem do chão, muro) fica deitado de lado quando o golpe vai para baixo ou para cima,
então esses jutsus ganham mais folhas:

- `folhas/<id>_baixo.jpg` e `folhas/<id>_cima.jpg`, com a entrada `<id>_baixo` / `<id>_cima` no `ajustes.json` (mesmos
  cortes da base) e `jogo.arte` = `1.5708` (para baixo) ou `-1.5708` (para cima), com a âncora na ponta de onde sai
  (`topo` para baixo, `base` para cima). Os quadros saem como `<id>_baixo_0N`.
- O motor (`variante()` em `public/vfxJutsus.js`) troca sozinho: quando a direção do golpe é mais vertical que horizontal
  (|seno| > 0,75), usa o quadro de mesmo número da folha daquela direção, se ela existir; senão, gira a base como antes.
- Invocações: `drawJutsuFrame(..., { dir })` usa `baixo` (de frente) ou `cima` (de costas) quando ela anda mais na
  vertical (`m.faceV`, em `game.js`). Golem e Sentinela usam os quadros 04/05 (parado e golpe): renomear as folhas novas
  para casar com esses números.
- Muros: a folha vertical serve às duas direções; recortar como `<id>_baixo` e copiar a entrada para `<id>_cima`.
- A lista das folhas de direção que faltam está no `pendencias.py` (`DIRECOES` e `DIRECOES_FEITAS`).
- Toda folha nova traz o nome do jutsu escrito no topo (fora dos painéis): o recorte corta o título com `topo`.

## Pendências e prompts do Flow (v85)

`python3 arte/jutsus-vfx/pendencias.py` gera `pendencias.json` e `pendencias.md`: as folhas que faltam, as que precisam
refazer e as que precisam de mais quadros, cada uma com o fundo, os 6 quadros e o prompt do Flow. A página de
acompanhamento do Victor lê o `pendencias.json` e guarda o que ele marcou (Fazendo, Enviei) no banco dela. Ao receber
uma folha da lista: tirar o item do `pendencias.py`, gerar de novo e republicar a página.

## Situação (22/11/2026)

**Feitos (147):**

- Fogo (17): Fogo, Sopro Incinerador, Névoa Inflamável, Linha de Fogo Rasante, Revoada de Brasas, Lança de Fogo, Cinzas Detonantes, Lâmina de Fogo, Varredura Flamejante, Projétil Dracônico, Chuva de Meteoros, Marca Incandescente, Chão Incandescente, Cometa Rasteiro, Rugido da Fornalha, Coroa de Chamas, Coluna Infernal.
- Cura (17): Cura, Desintoxicação Celular, Corte Cirúrgico, Palma Curadora, Descontrole Muscular, Punho Sísmico, Regeneração de Área, Renovação Celular, Selo dos Meridianos, Agulha Calmante, Casca de Chakra, Lâmina Séptica, Banho de Chakra, Onda Anestésica, Milagre Verde, Santuário Vital, Punho do Colosso.
- Relâmpago (16): Corrente Rasteira, Shuriken do Trovão, Impulso Estático, Farpas de Trovão, Lança Saltadora, Descarga Envolvente, Investida Elétrica, Julgamento do Trovão, Ida e Volta, Rede de Faíscas, Rugido do Trovão, Mãos de Trovão, Correntes de Raio, Céu em Fúria, Armadura Relampejante, Risco de Luz.
- Pedra (17, v79/v80): Pedra, Coração de Montanha (`stone_4`, o tier 4 do escudo), Prisão de Pilares, Projétil de Rocha, Escavação Furtiva, Muralha de Terra, Lamaçal Profundo, Pisão da Montanha, Punho de Rocha, Chuva de Cascalho, Carga do Rochedo, Lanças da Terra, Resposta da Montanha, Couraça Mineral, Avalanche (uma folha só, duas crateras), Golem de Terra Titânico (o golem desenhado anda e soca no lugar do de código)., Sumidouro (v80).
- Água (15, v80): Água, Serpente d’Água, Muro de Água, Duplo de Água (o desenhado anda e soca), Véu de Bruma, Estouro de Maré, Poça Viscosa, Cárcere Líquido, Prisão do Vórtice, Laço da Correnteza, Lâmina d’Água, Rajada de Gotas, Casulo de Água, Tromba d’Água, Grande Onda.
- Sombra (18, v80): todas (a Sentinela desenhada anda e soca; o Véu Sombrio se desfaz no golpe).
- Taijutsu (14, v80/v81/v84): Taijutsu, Rasteira Baixa, Esquiva Rápida, Fôlego de Luta, Chute Ciclone, Despertar do Corpo, Flecha Humana, Fúria do Encurralado, Punho do Céu, Queda do Meteoro, Cem Golpes, Soco de Pressão, Bloqueio Firme, Chute Ascendente.
- Vento (16, v81/v82/v84): Rajada Aberta, Passo Aéreo, Shuriken do Vento, Véu de Vento, Balas de Vento, Espelho de Ar, Lâmina em Arco, Passo Leve, Pulso de Vento, Tornado Cortante, Asa Cortante, Vórtice de Ar, Corte em Cadeia, Disco do Furacão, Fenda do Vento, Olho da Tempestade (falta o Mil Cortes do Céu).
- Armas (17, v82/v83): todas (o Arsenal Vivo tem só o círculo de invocação; o corpo dele continua o de código).

**Faltam (53), com o id e a forma no servidor:**

- **Cura (1):** Aura de Regeneração (`heal_aura`, zona).
- **Relâmpago (1):** Relâmpago (`lightning`).
- **Água (2):** Coluna d’Água (`water_coluna`, aviso); Corpo de Água (`water_corpo`, transformacao).
- **Vento (1):** Mil Cortes do Céu (`wind_milcortes`, meteoros).
- **Pedra (1):** Esmagamento de Paredes (`stone_3`, alvo).
- **Ilusão (18):** Ilusão (`illusion`); Dissipação (`illusion_kai`, limpeza); Visão do Abismo (`illusion_2`, linha); Estaca da Ilusão (`illusion_estaca`, linha); Noite Eterna (`illusion_noite`, alvo); Raízes do Pesadelo (`illusion_3`, alvo); Ciclo Sem Fim (`illusion_4`, alvo); Santuário das Penas (`illusion_templo`, zona); Empréstimo Forçado (`illusion_emprestimo`, alvo); Segunda Voz (`illusion_voz`, invocacao); Olho Errante (`illusion_olho`, projetil); Passo Falso (`illusion_passo`, recuo); Véu da Meia-Noite (`illusion_veu`, zona); Espelho Quebrado (`illusion_espelho`, alvo); Coro do Silêncio (`illusion_coro`, anel_golpe); Colapso Onírico (`illusion_colapso`, aviso); Canção de Ninar (`illusion_ninar`, linha); Reflexo Vazio (`illusion_reflexo`, invocacao).
- **Taijutsu (3):** Mergulho Esmagador (`taijutsu_lotus`, investida); Chave de Braço (`taijutsu_chave`, alvo); Impacto Circular (`taijutsu_impacto`, anel_golpe).
- **Clã Rubro (6):** Olhar Rubro (`rubro_olho`, escudo); Transe Ocular (`rubro_transe`, linha); Brasa Sem Luz (`rubro_chamas`, linha); Sentinela Espectral (`rubro_guardiao`, escudo_vida); Mundo Espelhado (`rubro_lua`, linha); Colosso Espectral (`rubro_completo`, transformacao).
- **Clã Umbra (4):** Deslize Noturno (`umbra_deslize`, recuo); Sombra Faminta (`umbra_faminta`, marca); Noite Fechada (`umbra_noite`, zona); Forma Umbral (`umbra_forma`, forma_sombra).
- **Clã Bastião (4):** Muralha Interior (`bastiao_muralha`, escudo_vida); Guarda Compartilhada (`bastiao_guarda`, escudo_vida); Muro que Responde (`bastiao_resposta`, postura); Juramento do Escudo (`bastiao_juramento`, postura).
- **Clã Áspide (4):** Cuspe da Áspide (`aspide_cuspe`, projetil); Névoa Tóxica (`aspide_nevoa`, zona); Constrição (`aspide_constricao`, alvo); Ninho de Áspides (`aspide_ninho`, invocacao).
- **Clã Garra (4):** Chamado da Matilha (`garra_matilha`, invocacao); Uivo de Comando (`garra_uivo`, comando); Troca Instintiva (`garra_troca`, troca); Rei da Matilha (`garra_rei`, invocacao).
- **Clã Zéfiro (4):** Passo do Vento (`zefiro_passo`, recuo); Véu de Ar (`zefiro_veu`, postura); Eco do Vento (`zefiro_eco`, eco); Mil Passos (`zefiro_mil`, mil_passos).
