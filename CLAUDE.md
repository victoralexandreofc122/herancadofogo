# Herança do Fogo: servidor-missoes

MMORPG ninja em pixel art chibi, para o navegador do celular (deitado) e do computador. O dono do projeto é o
Victor: ele escreve em português e quer as respostas em português do Brasil.

## O jogo em resumo

- **Gênero:** MMORPG de ação 2D, combate em tempo real, progressão por rank (Academia, Genin…), níveis até 60.
- **Tecnologia:** servidor autoritativo em Node e TypeScript (Fastify + WebSocket), Postgres no **Neon**, cliente em
  Canvas 2D sem engine (`public/`). O Render publica a `main` sozinho.
- **Mundo:** Aldeia da Chama Eterna 80x80 (lojas com interior, Academia), Aldeias da Maré Oculta, Vento Cortante (antes Nuvem) e Rocha Antiga (antes Areia) (antes Folha, Névoa, Nuvem e Areia; a Pedra saiu na v20),
  Floresta 100x100, Caverna do Lodo, Clareira Queimada, Poço sob a Praça, Zona de Conflito e Refúgio dos Renegados.
- **Sistemas prontos:** combate com jutsus por elemento e efeitos (queimadura, silêncio, paralisia…), habilidades em
  linha nas 4 direções, monstros com máquina de estados e o chefe Rei Lodo, classes, Extração, armas com jeito próprio,
  Tela de Equipamentos (arma, capa, pés, acessório, pergaminho), clima e dia/noite, fim de jogo (Kage eleito,
  diplomacia, Zona de Conflito com MMR e temporadas de 60 dias, renegados, Akatsuki), Painel do Admin e API `/site/*`.
- **Personagem:** desenhado por código (`public/rig.js` esqueleto 3D, `public/rigArt.js` camadas e física do pano,
  `public/figure.js` cache e giro). Detalhes em `arte/personagem-rig/LEIAME.md`. O estilo segue a folha de referência
  do Victor (chibi, contorno escuro, sombreado em 2-3 tons). Toda mudança de arte é comparada lado a lado com a
  referência e conferida dentro do jogo antes de fechar.
- **Versão atual:** v104 na `main`; a v105 a v110 (a Aldeia da Chama refeita com as texturas do Flow, o clima desenhado, os prédios, o canal animado, a muralha, o portão, os objetos, a montanha e as árvores) no branch `claude/amazing-dirac-hl11fw` (PRs #33 a #76; o #76 trouxe a v104, o FPS escolhido; o #75 a v103, o áudio mais leve; o #73 a v102, o chat do clã e da aldeia; o #72 a v101, a borda do painel e os painéis sem rolar; o #71 a v100, o chat em botão e a doca da arena; o #70 a v99, as últimas peças da interface; o #69 a v98, o lote 4; o #68 a v97, o HUD desenhado; o #67 a v96, a interface desenhada; o #64 a #66 trouxeram a v95, com o guia de estilo das animações em `arte/jutsus-vfx/guia-de-estilo.md`: o Ciclo Sem Fim, o lugar no corpo em todos e as folhas refeitas). **Banco:** todas as
  migrações até a **v41** rodaram no `production` do Neon (a v41, chat do clã e da aldeia, confirmada pelo Victor em
  23/11/2026); nenhuma pendente.
  Jutsus v2 com 96 jutsus (10 classes, Vento nova, e o Clã Rubro), mais os 74 da Fase 2.5 e os 16 dos clãs novos;
  conjuração, sistemas próprios (muros, invocações, escuridão...), clãs por linhagem, Extração e maestria, rankeado 1v1 e
  3v3, torneios, Vínculo, Titãs e Progressão de Mundo. Documento canônico do endgame (identidade, aldeias, hierarquia, ANBU,
  torneios, Terra Sem Lei, guerras, roadmap Fase 0 a 3): `docs/endgame-visao.md`; nada dele é implementado sem o OK do
  Victor. **Stack:** em avaliação (empacotamento nativo, WASM, N-API, Capacitor/Tauri, C/C++); não mudar nada até ele
  decidir.
  Histórico completo no `README.md`; relatório de progresso em `docs/relatorio-final-e-progresso-2026-11.md`.

- **v53 (ajustes do Teste Alpha, migração v32):** Agilidade saiu (virou Taijutsu: velocidade e ritmo do Básico), Chakra
  aumenta a cura, item Shuriken (consumível, botão ✴️), invocações andam até o alvo e socam (Sentinela de Sombra e Arsenal
  Vivo com desenho próprio). v54: curas e escudos com valor fixo (sem % da vida), Cura rebalanceada, Cegueira como estado
  (perde o alvo), Duplo de Água bate. Mesclado (PR #34; a v32 rodou no Neon).
- **v110 (sem migração, marcações do Victor de 24/11):** água só no canal (sem vazar), sem o resto de rocha atrás da
  montanha, arena sem pilares e bandeiras na cerca de cima, tons mais escuros e menos contraste (`tons()`), árvores no
  verde da grama; `--sombra` gera a versão com sombra longa para o Victor escolher. A refazer: lanterna de pedra e caixotes.
- **v109 (sem migração, pedido do Victor de 24/11):** a aldeia sem os restos do mapa antigo: pontes desenhadas por código
  (provisórias), bordas de gramado, lados da muralha em pedra, árvores x montanha, caixotes/placas/pedras do Flow. Regra do
  Victor: não sair da aldeia até ela estar perfeita. A gerar no Flow: ponte (e `chama_ponte_lado`), `chama_muralha_lado`,
  pergaminhos e portão.
- **v108 (sem migração, pedido do Victor de 23/11):** a montanha, as árvores redondas, os pinheiros, as flores e o capim do
  Flow na aldeia; as peças da Floresta recortadas e guardadas (a Floresta é a próxima). A refazer: arbusto, trilha e
  chão da Clareira Queimada.
- **v107 (sem migração, pedido do Victor de 23/11):** os objetos do Flow na aldeia (cerejeiras, lanternas de pedra, vasos,
  barris, a arena), em `OBJETOS` no montador, sobre as colisões de hoje. A refazer: poste de lanterna, banco, placa de seta
  e kunais no chão.
- **v106 (sem migração, pedido do Victor de 23/11):** mais 16 peças do Flow na Aldeia da Chama: Salão, Academia, hospital, as
  três lojas, poço, muralha, portão e o Canal de água (o rio corre: `drawMapaAnim` em `public/clima.js`). O montador gera
  as colisões em `src/realtime/chamaArte.ts` (não editar à mão). A refazer: canto da muralha, ponte e grade do canal.
- **v105 (sem migração, pedido do Victor de 23/11):** as 16 imagens do Flow recortadas (`arte/mapas/recortar_pecas.py`:
  originais em `arte/mapas/flow/recebidas/`, peças em `arte/mapas/pecas/`, efeitos em `public/assets/clima/`) e a Aldeia
  da Chama refeita com elas (`arte/mapas/montar_chama.py` → `public/mapas/chama/`, `CHAMA_ART` em `maps.ts`): chão novo,
  as 8 casas novas e o resto provisório da arte antiga até a peça chegar. Clima desenhado em `public/clima.js` (chuva,
  neblina e as partículas). Página das texturas do Flow: recebidas com miniatura e parecer; a refazer (com prompt novo):
  grama, trilha e respingo. Como continuar: `docs/mapas.md`, seção 7 ("Refeita com as peças do Flow").
- **v104 (sem migração, pedido do Victor de 23/11):** o desenho para em 60 fps (antes 90/120 nas telas rápidas), cai para 30
  com nada se mexendo na tela e volta na hora ao mexer; Config. → Visual → Desempenho: FPS 60, 30 ou 24 e o contador de
  FPS no topo (`frame()`/`telaParada()` em `public/game.js`, `test/fps.test.ts`).
- **v103 (sem migração, pedido do Victor de 23/11):** o áudio gasta bem menos (o celular esquentava): efeitos sintetizados uma
  vez e tocados da gravação, 50 ms de margem no lugar de 10 ms, e mudo ou volume no zero desligam o áudio
  (`public/audio.js`). Medido: música e luta de 7,6% para 3,5% de um núcleo; mudo de 3,6% para 0%.
- **v102 (migração v41, decisões do Victor de 23/11):** o chat do clã (a linhagem; todos da mesma linhagem on-line) e o da
  aldeia (todos da aldeia on-line; só o Kage manda), com as abas Clã e Aldeia no painel do chat e `/c` e `/a`. Mesclado (PR #73);
  a v41 rodou no Neon.
- **v101 (sem migração, pedido do Victor de 23/11):** a borda de baixo do painel sem as faixas laranja que piscavam (o
  bronze não é mais fogo na animação; bordas lisas e a linha de bronze de baixo mais grossa) e o ranking e o Torneio sem
  rolar no celular (duas colunas; só a tabela rola).
- **v100 (sem migração, pedido do Victor de 23/11):** o chat virou um botão 💬 na doca de baixo (em qualquer mapa, com o
  contador de novas), que abre o painel do chat (abas e linha de digitar); a barra da arena desceu para a doca (Desafio à
  vista, o resto no 🏟️ Arena); as lanternas da mureta na frente de quem passa atrás (`fenceLanternProps`). Os canais de
  clã e de aldeia vieram na v102.
- **v99 (sem migração, folhas do Victor de 23/11):** as 4 últimas do catálogo: a faixa do título dos painéis, as cores das
  barras (vida, chakra, XP, inimigo, chefe; `perfil` no recorte), a barra do chefe e o marcador do alvo no chão (canvas).
- **v98 (sem migração, 16 folhas do Victor de 23/11):** o lote 4 da interface sem o painel de fundo que vazou nas folhas
  (`area`, `tirar_roxo`, `celulas` no `recortar_ui.py`): ícones do menu, aviso, campos de texto, caixa da fala, aviso grande e
  faixas, logo, ryō, mochila e equipamento, patente, classe, balão do chat e ícones de estado no canvas.
- **v97 (sem migração, folhas do Victor de 23/11):** o HUD desenhado: o joystick (no canvas), o anel do minimapa, os
  retratos em pé com a plaquinha do nível e a barra dos selos com a faixa de fogo animada (`arte/ui/LEIAME.md`).
- **v96 (sem migração, pedido do Victor de 23/11):** a interface desenhada no Flow (tema Laca e Brasa: 16 peças no jogo,
  `arte/ui/LEIAME.md`, `public/uiLaca.css`) e a animação do fogo e do brilho do ouro com o gráfico no máximo (`public/uiAnim.js`).
- **v95 (sem migração, pedidos do Victor de 22/11):** o Ciclo Sem Fim (a última folha: os 200 desenhados), o lugar no corpo em
  todos os jutsus desse tipo (`LUGAR` em `public/vfxJutsus.js`) e as 12 folhas refeitas (o Ninho de Áspides com as serpentes nas 3
  direções; a lista de refazer ficou vazia), mais 12 folhas (Arsenal Vivo e Duplo de Água nas 3 direções, Bloqueio, Rede, Avalanche e
  Céu de Lâminas por ponto, as rajadas) e os círculos centrados no corpo (marcações do Victor).
- **v94 (sem migração, pedido do Victor de 22/11):** a primeira experiência sem rolagem (entrada em 2 colunas, Criador,
  Configurações, Vínculo em abas, Perfil e Manual em colunas; `scripts/auditar-primeira.ts` confere), a Forma Umbral nos pés e
  opaca e o chão verde da Aura de Regeneração (`piso`).
- **v93 (sem migração, pedidos do Victor de 22/11):** invocação só atrai o monstro se bate nele e está mais perto que o ninja;
  o Rito do Despertar com O Cronista (o Diretor só com as classes) e a linhagem continua desperta ao zerar as classes; o Salão do
  Rei Lodo (só o chefe, sem filhos); o soco sem arma com o impacto do punho; o círculo escuro em perspectiva. Mesclado (PR #62).
- **v92 (sem migração):** ajustes do Victor: a cabeça na frente da Forma Umbral e da Guarda (a parte de trás até o pescoço),
  o ninja dentro do Casulo e da Aura de Regeneração (por cima, translúcidos), o anel do Muro que Responde mais alto. Mesclado (PR #61).
- **v91 (sem migração, pedidos do Victor de 22/11):** o lugar da arte no corpo (`lugar`: torso, corpo com ou sem a metade de
  trás, pes) em 7 jutsus de exemplo (o resto espera o OK dele), a fileira de ícones em cima da cabeça (estados e jutsus
  lado a lado; o Olhar Rubro e a Sombra Faminta) e a página das texturas do Flow com estado salvo no banco. Mesclado (PR #60).
- **v90 (sem migração):** os clãs Bastião, Áspide, Garra (feras andando e mordendo; o Rei de frente e de costas) e Zéfiro, a
  Forma Umbral, a Faísca Rasante, o Esmagamento de Paredes, a Segunda Voz e o Empréstimo Forçado. Mesclado (PR #59).
- **v89 (sem migração):** o Clã Rubro, 3 do Clã Umbra, Corpo de Água, Coluna d’Água, Mil Cortes do Céu, 3 do Taijutsu e a
  Aura de Regeneração; o Reflexo Vazio é o próprio boneco em tom violeta (escolha do Victor). Mesclado (PR #58).
- **v88 (sem migração):** as 15 primeiras folhas da Ilusão (e a Estaca para baixo, a primeira folha de direção); `vidro`
  no recorte; a fumaça antiga da Ilusão sai com a folha desenhada. Mesclado (PR #57).
- **v87 (sem migração):** rajadas: Cem Golpes e Punho do Céu alternam os socos em laço rápido, as 4 ondas da Ascensão
  Dupla batem; folha `<id>_rajada` na lista de pendências (o jogo usa sozinho). Mesclado (PR #56).
- **v86 (sem migração):** folhas para baixo e para cima (`variante()` no motor; invocações de frente e de costas) e o
  nome do jutsu no topo de cada folha pedida no Flow; 103 folhas na lista de pendências. Mesclado (PR #55).
- **v85 (sem migração):** profundidade (metade de trás das auras atrás do boneco), giro, zoom de entrada, sombra e luz,
  quadros alinhados pelo centro de massa, auditoria de hitbox e a lista de pendências das folhas com os prompts do Flow
  (`arte/jutsus-vfx/pendencias.py`, página de acompanhamento). Mesclado (PR #54).
- **v84 (sem migração):** Cem Golpes, Soco de Pressão, Bloqueio Firme, Chute Ascendente e Olho da Tempestade. Mesclado (PR #53).
- **v83 (sem migração):** as 5 últimas das Armas (Dança dos Mil Cortes, Ascensão Dupla, Céu de Lâminas, Laço de Ferro,
  Arsenal Vivo): a classe Armas completa. Mesclado (PR #52).
- **v82 (sem migração):** mais 4 do Vento e 12 das Armas (`public/folhasAnim.js`). Mesclado (PR #51).
- **v81 (sem migração):** 11 folhas do Vento e mais 5 do Taijutsu (`public/folhasAnim.js`: aviso em fases, o desenho que
  voa pelo caminho, o rastro no chão, os quadros ao longo do alcance). Mesclado (PR #50).
- **v80 (sem migração):** as folhas da Água (15), da Sombra (18), do Taijutsu (5) e o Sumidouro, tocadas pela forma do
  jutsu em `public/folhasAnim.js`; Duplo de Água e Sentinela de Sombra desenhados. Mesclado (PR #49, junto com a v79).
- **v79 (sem migração):** os 16 jutsus da Pedra desenhados pelo Victor (o Golem desenhado anda e soca, o escudo quebra no
  golpe, a Resposta devolve, o muro gira para o eixo da parede) e as camadas de Pedra (carga âmbar, chão afundando,
  poeira). Recorte com fundo pintado no painel (`inundar`). Falta o Esmagamento de Paredes.
- **v78 (sem migração):** camadas do PixelFX por cima das folhas desenhadas dos 50 jutsus (carga dos selos, anel de fogo,
  poeira, brasas, luz da cura, runas, cruzes, estalo, choque, faíscas), em `public/camadasJutsus.js`; gerador e efeitos
  nossos em `arte/pixelfx/` (`LEIAME.md`). Mesclado (PR #48, junto com a v71 a v77).
- **v77 (sem migração):** mais 7 de Relâmpago desenhados (Investida Elétrica, Mãos de Trovão, Rugido do Trovão, Julgamento
  do Trovão, Céu em Fúria, Armadura Relampejante, Risco de Luz).
- **v76 (sem migração):** 9 jutsus de Relâmpago desenhados (Corrente Rasteira, Impulso Estático, Shuriken do Trovão,
  Descarga Envolvente, Farpas de Trovão, Ida e Volta, Lança Saltadora, Rede de Faíscas, Correntes de Raio).
- **v75 (sem migração):** os outros 10 jutsus de Cura desenhados (toda a classe Cura tem animação própria).
- **v74 (sem migração):** mais 10 animações desenhadas pelo Victor (Chuva de Meteoros, Coroa de Chamas, Coluna Infernal e 7
  da Cura); o recorte agora aceita fundo magenta, brilho suave e texto por cima do desenho (`arte/jutsus-vfx/ajustes.json`).
- **v73 (sem migração):** as animações desenhadas pelo Victor de 10 jutsus de Fogo (6 quadros cada), recortadas por
  `arte/jutsus-vfx/recortar.py` (gera `public/vfxFogo.js`) e tocadas por `public/fogoAnim.js` em cada fase do golpe.
- **v72 (sem migração, pedido do Victor de 17/11):** o chat do celular deitado menor (253 x 72 px) e a linha de digitar fina
  (28 px visíveis, toque de 44 px), sem o ➤. Os prompts do Flow (`arte/mapas/flow/`) sem frases negativas, com o bloco de
  estilo no começo, a vista de frente e de cima, e uma imagem só por peça (sombra, luz e movimento feitos por código).
- **v71 (sem migração, pedido do Victor de 17/11):** a fala do NPC numa caixa embaixo, no meio da tela (nome, páginas de
  até 3 linhas, texto aparecendo aos poucos, toque para continuar), no lugar do balão; retrato opcional no ⚙️. Regra no
  guia de UI, seção 14. Branch `ccr-2afc1981-eq01zm`.
- **v70 (migração v40, pedidos do Victor de 17/11):** bug da conexão morta ao voltar ao navegador (vigia que reconecta),
  retrato abre os atributos, nome no lugar de "Vida", chat menor no meio (celular) e missões à esquerda, regen 2/s após 3 s,
  Lodo Verde 8, respawn de 1 min, XP das missões 50/150/325 (v40), arena própria e maior do 3v3 com a escolha 1v1/3v3.
  Mesclado (PR #46); a v40 rodou no Neon. Arena do 3v3: "Arena dos Três Juramentos" (escolha 13A do Victor, 17/11).
- **v69 (sem migração):** polimento do rankeado: "Próximo: X × Y" e "você é o próximo", selo redondo e "faltam N" no
  resultado, nomes colados, arquibancada em degraus, estátua com volume, mureta, rochas e holofote. Branch `ccr-rankeado`.
- **v68 (sem migração):** no toque longo do jutsu sem mira, o ✕ Cancelar (deslizar até ele e soltar não lança). Branch `ccr-ui-hud`.
- **v67 (as 8 propostas do guia de UI, sem migração):** joystick fixo, ✋ cancelar selos, retratos no PvP, câmera da mira,
  toque longo no jutsu, "Enquanto você esteve fora", daltonismo na auditoria, barras escondidas (opção). Branch `ccr-ui-hud`.
- **v66 (UI, UX e HUD pelo guia, sem migração):** alvos de toque de 44 px, texto de 12 px, HUD de combate, erros com causa
  e números, avisos de 2 a 5 s, auditoria no navegador. Branch `ccr-ui-hud` (sobre a `ccr-decisoes`).
- **v65 (migração v39, decisões do Victor de 15/11):** os 12 nomes da lore aplicados (Lodo Verde, Pedras da Vigília...),
  Kenji e Mei com os visuais certos, Pular a Academia, fragmentos da Crônica no banco (prêmio e falas do Cronista) e todos
  os comandos `/admin` no Painel do Admin (o teste `test/decisoes.test.ts` cobra botão para comando novo). Mesclado (PR #43);
  a v39 rodou no Neon.
- **v64 (lore e tutorial, sem migração):** `docs/lore/` (Bíblia do Mundo, NDD, fichas, artefatos, planilha de diálogos,
  tutorial, propostas de nomes), 17 fragmentos da Crônica no mapa (Manual → Fragmentos), falas com voz dos professores e
  lojistas, dicas na hora e folha de controles. A Bíblia é a fonte única de verdade da lore; os nomes que faltam esperam a
  escolha do Victor (`docs/lore/propostas-de-nomes.md`). Branch `ccr-lore` (sobre a `ccr-fase3`).
- **v63 (migração v38, Fase 3 Etapa 4):** os 4 clãs novos (Bastião, Áspide, Garra, Zéfiro; 16 jutsus e as passivas, escolhas do
  Victor em 15/11) e as relíquias com os nomes da opção A. Mesclado (PR #41); a v38 rodou no Neon.
- **v61/v62 (migrações v36 e v37, Fase 3):** Titãs Ancestrais e Portadores (passiva e Suprema em todos os modos), Progressão
  de Mundo (marcos 30/60/100/150/250, névoa, O Cronista; começa forçado em 250) e Loot das relíquias. Mesclado (PR #41);
  a v36 e a v37 rodaram no Neon. A Etapa 4 (clãs novos) e os nomes das relíquias
  foram escolhidos e aplicados na v63 (`docs/fase3-propostas.md`).
- **v60 (migração v35):** Vínculo Ancestral (8 criaturas, afinidade, Invocar no HUD) e Estado Primal, só no mapa aberto.
  Mesclado (PR #40); a v35 rodou no Neon.
- **v59 (migração v34):** o ninja volta sempre ao último lugar (posição gravada no banco), guarda de 2 min ao cair a conexão,
  contador da Shuriken certo na entrada. Mesclado (PR #39); a v34 rodou no Neon.
- **v55 (migração v33):** 4 arenas simultâneas e espectador fantasma (painel "Lutas"), semifinal e final sozinhas na principal,
  rankeado 3v3 (solo e Trio), calendário automático da Era e do Torneio, Torneio dos Heróis e dos Vilões. Mesclado
  (PR #35); a v33 rodou no Neon.

## Animações dos jutsus (folhas do Victor): como continuar numa aba nova

O Victor manda folhas de 6 quadros (fundo verde ou magenta) e cada uma vira a animação de um jutsu. **Feitos os 200** (todas as classes e os clãs, v56 e v73 a v95;
o Ciclo Sem Fim, `illusion_4`, foi o último). O lugar no corpo de cada um: `LUGAR` em `public/vfxJutsus.js` (v95). O que refazer e as folhas de direção estão nas pendências. A lista completa, com o id e a forma de cada um, e o passo a passo
estão em **`arte/jutsus-vfx/LEIAME.md`**: ler antes de mexer. O que falta e o que refazer, com o prompt do Flow de cada
folha: `arte/jutsus-vfx/pendencias.md` (gerado por `pendencias.py`).

- **Começo da sessão:** `bash scripts/ambiente-local.sh` (Postgres local na 5433, banco `jogo` com todas as migrações,
  segredos locais aleatórios em `/var/tmp/jogo.env`, servidor na 3000 e o ninja admin `rin`). Rodar de novo religa o
  que caiu (o container pode reiniciar o Postgres).
- **Por folha:** achar o id pelo nome → `arte/jutsus-vfx/folhas/<id>.jpg` → `ajustes.json` → `recortar.py --debug`
  → conferir o recorte → `public/fogoAnim.js` (o momento de cada quadro) → `capturar.ts` + `folha.py` → conferir no jogo
  → `test/vfxJutsus.test.ts` → README/CLAUDE.md → `npm run verify` → commit e push → mandar as folhas ao Victor.
- **Skill de animação:** se esta sessão tiver uma skill de banco de habilidades, efeitos ou animação (veja a lista de
  skills), use-a para complementar: mais quadros intermediários, partículas e brilho por cima dos quadros desenhados,
  ou para propor ao Victor como animar os jutsus que ainda não têm folha. A arte do Victor é a base: a skill
  complementa, não troca o desenho dele.
- **Camadas (v78):** cada folha nova ganha o seu `case` em `public/camadasJutsus.js` (as camadas do PixelFX no tempo dos
  quadros; o teste cobra). Para gerar ou acrescentar camadas: `arte/pixelfx/LEIAME.md` (clonar o PixelFX e rodar
  `node arte/pixelfx/camadas.mjs <pasta>`). O servidor guarda os arquivos de `public/` na memória: reinicie
  (`bash scripts/ambiente-local.sh`) antes de capturar de novo.
- Nada disso muda o servidor (só visual), salvo um aviso visual quando faltar informação (ex.: o `combo` 'marca').

## Documentos

- `README.md`: o que entrou em cada versão (v5 a v27) e se precisa de migração.
- `DEPLOY.md`: publicação passo a passo e as regras das migrações.
- `docs/fase2-plano.md`: plano de arquitetura da Fase 2 (endgame), etapas, migrações previstas e decisões em aberto.
- `docs/design-do-jogo.md`: design completo (pilares, sistemas, roadmap, decisões e riscos).
- `docs/historia/arco-1.md`: roteiro do Arco 1 (15 missões); o sistema de história ainda não existe.
- `docs/historia/arco-1-mare.md`, `arco-1-vento.md`, `arco-1-rocha.md`: os Arcos 1 das outras aldeias (decisão do Victor de
  17/11: cada aldeia com Academia e Arco 1 próprios); nomes novos nos itens 29 a 38.
- `docs/lore/mundo-aberto-proposta.md`: o mundo aberto em anéis (17 x 17 blocos), aprovado pelo Victor em 17/11; os
  arcos regionais, os chefes, as regras de passagem e a ordem de construção.
- `docs/ui/estrutura-ui-ux-hud.md`: a estrutura de UI, UX e HUD (regra de toda tela nova).
- `arte/jutsus-vfx/LEIAME.md`: as animações desenhadas dos jutsus (como recortar, tocar e conferir; o que falta).
- `arte/pixelfx/LEIAME.md`: as camadas do PixelFX por cima das animações desenhadas (gerar, escolher, conferir).
- `docs/lore/`: a lore (Bíblia do Mundo, fonte única de verdade) e o design do tutorial; a planilha `dialogos.csv` é gerada
  do jogo (`npx tsx scripts/gerar-dialogos.ts`) e o teste confere.
- `docs/mapas.md`, `docs/endgame.md`, `docs/habilidades.md`, `docs/clima.md`, `docs/netcode.md`.
- `docs/relatorio-progresso-2026-11.pdf`: relatório de progresso (estado do jogo e próximas atualizações).
- `docs/relatorio-completo-do-jogo-2026-11-12.pdf`: relatório completo do jogo (todos os sistemas e a ficha dos 186 jutsus,
  com ícone, arte capturada no jogo, tier, classe e números).

## Próximas entregas

1. Jutsus v2 (decisão do Victor, 03/11): todos os jutsus do PDF adaptados (`docs/jutsus-v2.md`,
   `revisao_egm/jutsus/`). Entrega 2 (Fogo novo) com migração v16; Fase 1 (nomes, v17), as classes e a Vento (v18), os
   clãs (v19), a provocação de monstros e a Fase 0 (Extração e maestria, v20) feitos; a linhagem no Criador e o Rito do
   Despertar (v25) e a maestria em todos os jutsus (Fase 1.5, v36) feitos. A Fase 2.5 (74 jutsus novos,
   4 por classe por tier, nomes da opção B) foi feita na v49 (migração v30, `src/realtime/jutsusFase25.ts`).
2. Rankeado, polimento (`revisao_egm/rankeado/`): feito na v69 (arquibancada em degraus, estátua, selo de faixa, aviso de próximo).
3. Arte dos personagens (decisão do Victor, 12/11/2026): **o Victor vai desenhar**. Não produzir arte de personagem,
   cabelo, roupa ou acessório sem ele pedir; o jogo segue com a arte base atual. O boneco base de `arte/boneco-base/`
   (PR #31) fica só como referência técnica.
4. Site no Floot (páginas, login com a conta do jogo, admin, notificações).
5. Salas com imagem: aguardando as imagens do Victor (Areia, Alfaiataria, Academia, Caverna, Clareira, Refúgio).
6. Arco 1 jogável (sistema de história), depois o social (grupo, amigos, sensei).

## Como trabalhar

- **UI, UX e HUD (regra do Victor, 15/11/2026):** o guia de UI que ele enviou é a estrutura da interface:
  `docs/ui/estrutura-ui-ux-hud.md`. Toda tela, botão ou aviso novo segue o documento (taxonomia, zona do polegar, alvos
  de 44 px, texto de 12 px, matriz de estados, avisos de 2 a 5 s, erro com causa e números) e passa pela auditoria
  (`npx tsx scripts/auditar-hud.ts <pasta>`) e pelo `test/uiHud.test.ts`. As 8 propostas da seção 13 foram aceitas e feitas (v67).
- **Mapas com as texturas do Flow (regra do Victor, 24/11/2026):** um mapa novo só é montado e posto no jogo depois de
  conferir todas as imagens que ele mandou para aquele mapa e colocar cada uma no lugar. Enquanto faltar peça (ou houver
  peça a refazer), as recebidas ficam recortadas e guardadas em `arte/mapas/pecas/` e marcadas na página das texturas.
- **Renomeações (regra do Victor, 09/11/2026):** nunca aplicar nome novo sem aprovação. O processo é sempre: **auditar, propor 3 opções por item,
  o Victor escolhe, só então aplicar** (código, banco, testes e docs). "Continuar a partir da sua recomendação" não é escolha: se o Victor
  não disse qual opção, perguntar. Vale para jutsus, clãs, locais, itens, NPCs, títulos e organizações, nesta e nas próximas fases.

- **Troca de classe no nível 60 (decisão do Victor, 09/11/2026; implementar na Fase 2):** custo alto em ryō, só no nível 60. Os jutsus
  e a maestria da classe antiga **ficam guardados no perfil**, só **bloqueados no kit** (a trava de classe da v34, `canUse` no
  `gameWorld.ts`, já faz isso); se ele voltar para aquela classe, voltam a valer sem perder nada. A proteção contra azar da Extração
  da classe antiga também fica guardada.
- **#11, linhagem (decisões do Victor, 09/11/2026):** a linhagem (Rubro, Umbra, Andarilho) é **marcada no Criador de Personagem** e
  **despertada no "Rito do Despertar"** (missão no rank Genin, nível 11); a árvore só abre depois do Rito. A classe Sombra continua uma
  das 10 classes; o **Clã Umbra ganha 4 jutsus próprios** (nomes e mecânicas: 3 opções por jutsu, o Victor escolhe antes de codar).

- **Foco (decisão do Victor, 10/11/2026):** PvP pronto para o Teste Alpha. Nada novo de endgame (Kage, ANBU, Renegados, Guerra) nem os 74
  jutsus da Fase 2.5 até ele pedir. A auditoria dos 100 jutsus (v45) está em `test/auditoriaJutsus.test.ts`: jutsu novo ou mexido passa por ela.
- `npm run verify` (typecheck, testes e build) tem que passar antes de qualquer commit.
- Mudança visual: conferir no jogo com o navegador automático (Playwright) e mostrar imagens ao Victor.
- Commit e push só com o código verificado; mudança que precisa de migração vai num branch até o Victor rodar a
  migração no Neon.

## Migrações de banco (`db/*.sql`)

As migrações são rodadas pelo Victor no **SQL Editor do Neon**, pelo celular. Siga as regras da seção
"Regras para as migrações" do `DEPLOY.md`. As principais:

- **Nunca use blocos `DO $$ ... $$`**: o editor do Neon corta o bloco e dá `unterminated dollar-quoted string`.
  Use `IF [NOT] EXISTS`, `CREATE OR REPLACE FUNCTION`, `INSERT ... ON CONFLICT`, ou uma função temporária
  chamada com `SELECT` e apagada depois.
- Tudo dentro de `BEGIN; ... COMMIT;`.
- O branch principal do Neon se chama `production`.
- Ordem do deploy: migração no Neon primeiro, depois o código na `main` (o Render publica a `main` sozinho).
- Toda migração pode rodar de novo sem erro (avisos como "already exists, skipping" são normais).

## Segredos

`DATABASE_URL`, `JWT_SECRET` e `SERVICE_TOKEN` só existem no painel do Render. Nunca no código, no
`DEPLOY.md`, em logs ou em prints.

## Skill task-observer

- No começo de toda sessão, antes da primeira ferramenta, ative a skill `task-observer`.
- Se ela não estiver instalada (o container da nuvem é novo a cada sessão), instale antes:
  `npx -y skills add rebelytics/one-skill-to-rule-them-all --skill task-observer -g -y`
- As observações que ela registrar nunca podem conter os segredos acima.

## Skill pxl-pixel-art

- Pedido do Victor (12/11/2026): ter a skill de pixel art `pxl-pixel-art` disponível. O container da nuvem é novo a cada
  sessão, então instale antes do primeiro trabalho de arte, se ela não estiver na lista de skills:
  `git clone --depth 1 https://github.com/augusto-scarvalho/claude-pxl.git ~/.claude/skills/pxl-pixel-art`
