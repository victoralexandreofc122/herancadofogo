#!/usr/bin/env python3
"""Gera a lista de pendências das folhas dos jutsus (o que falta, o que refazer, onde faltam quadros).

Saídas: arte/jutsus-vfx/pendencias.json (lida pela página de acompanhamento) e
arte/jutsus-vfx/pendencias.md (a mesma lista em texto, no repositório).

Os prompts do Flow seguem a regra da v72: bloco de estilo no começo, só frases positivas,
vista de frente e de cima, uma imagem por peça. Rodar: python3 arte/jutsus-vfx/pendencias.py
"""
import json
import os

AQUI = os.path.dirname(os.path.abspath(__file__))

VERDE = '#00FF00'
MAGENTA = '#FF00FF'
COR_FUNDO = {VERDE: 'pure green #00FF00', MAGENTA: 'pure magenta #FF00FF'}

CLASSES = {
    'illusion': ('Ilusão', 'deep violet, lilac and soft pink, with pale white highlights and a dark plum outline', VERDE),
    'stone': ('Pedra', 'warm amber, sandy brown and dark umber rock, with small gray dust', VERDE),
    'lightning': ('Relâmpago', 'electric yellow and pale cyan-white, with a deep blue outline', MAGENTA),
    'heal': ('Cura', 'fresh leaf green and mint, with soft white-gold light and a dark green outline', MAGENTA),
    'taijutsu': ('Taijutsu', 'warm orange and golden yellow impact light, with tan dust and a dark brown outline', VERDE),
    'water': ('Água', 'clear ocean blue and cyan, with white foam highlights and a navy outline', VERDE),
    'wind': ('Vento', 'pale cyan and white air streaks, with a light teal outline', MAGENTA),
    'rubro': ('Clã Rubro', 'crimson red and black, with a bright scarlet glow and a near-black outline', VERDE),
    'umbra': ('Clã Umbra', 'ink black and deep indigo shadow, with thin violet edges and two small pale eyes where noted', VERDE),
    'bastiao': ('Clã Bastião', 'steel blue-gray stone and iron, with golden rune light and a dark slate outline', VERDE),
    'aspide': ('Clã Áspide', 'toxic lime green and sickly yellow-green, with dark purple shading and a dark green outline', MAGENTA),
    'garra': ('Clã Garra', 'warm brown and tawny fur, amber eyes, ivory fangs and claws, with a dark brown outline', VERDE),
    'zefiro': ('Clã Zéfiro', 'pale sky blue and white air, with light silver sparkles and a light blue outline', MAGENTA),
}

ESTILO = (
    'Pixel art sprite sheet for a 2D top-down action MMORPG, 3/4 view seen from the front and from above, '
    'chibi anime ninja game style, a dark outline around every shape, cel shading in 2 to 3 tones, crisp square pixels. '
    'One single row of 6 square panels of the same size, separated by thin straight divider lines, with a small label '
    'F1 to F6 written under each panel, outside the art. Every panel has a solid flat {fundo} background. '
    'The effect sits fully inside each panel with a clear empty margin on all four sides. '
    'The effect keeps the same center point and the same scale reference in all 6 panels, so the frames line up '
    'when played one after another.'
)

# Como cada forma do servidor vira 6 quadros. {fx} é o efeito do jutsu.
FORMAS = {
    'anel': ('Anel em volta de você', [
        'a small bright glow gathering at the center: {fx} begins',
        'a thin ring of {fx} forms close around the center',
        'the ring expands to half of the panel',
        'the ring at full size, filling about 85% of the panel width, the brightest frame: the moment of the hit',
        'the ring thins out and breaks into fragments',
        'the last faint particles fading away',
    ], 'Toca em volta do ninja; a metade de trás do anel fica atrás do boneco e a da frente por cima.'),
    'zona': ('Área que dura', [
        'the area starts small at the center: {fx} appears',
        'the area grows to two thirds of its size',
        'the area at full size, filling about 85% of the panel width (loop frame A)',
        'the same area at full size with small changes in the details (loop frame B)',
        'the same area at full size with other small changes (loop frame C)',
        'the area dissolving into light particles',
    ], 'F1 e F2 na entrada, F3 a F5 em laço enquanto a área dura, F6 no fim. O tamanho no jogo segue o raio do servidor.'),
    'aviso': ('Golpe com aviso no chão', [
        'a flat warning circle drawn on the ground, seen from above, filling about 85% of the panel width',
        'the warning circle glows brighter while {fx} gathers above it',
        '{fx} starts to strike the ground',
        'the full impact, the biggest and brightest frame, the same width as the warning circle',
        'the aftermath: {fx} breaking apart over the ground',
        'the last particles and a faint mark on the ground fading',
    ], 'F1 e F2 durante o aviso, F3 e F4 no golpe, F5 e F6 depois. A largura do impacto casa com o círculo do aviso.'),
    'linha': ('Linha reta', [
        'a small charge of {fx} at the left side of the panel',
        '{fx} extends to the right, reaching the middle of the panel',
        '{fx} reaches the right side, a straight horizontal line at the vertical middle of the panel',
        'the full line at its brightest, the same height and position as F3',
        'the line thins out, the same position',
        'the last sparks along the line fading',
    ], 'A arte aponta para a direita; o jogo gira para a direção do golpe e estica até o alcance.'),
    'projetil': ('Projétil', [
        'a launch flash at the center: {fx} appears',
        '{fx} flying, centered in the panel (loop frame A)',
        'the same projectile, centered, with small changes (loop frame B)',
        'the same projectile, centered, with other small changes (loop frame C)',
        'the impact burst where it hits, centered',
        'the impact fading into particles',
    ], 'F2 a F4 em laço no caminho, F5 e F6 no alvo. O projétil fica no meio do painel em todos os quadros.'),
    'alvo': ('Efeito no alvo', [
        'a mark appears on the ground at the center, around an empty spot where the target stands',
        '{fx} rises and closes around the empty center',
        '{fx} at full strength around the target spot (loop frame A)',
        'the same hold with small changes (loop frame B)',
        'the release: {fx} loosens and opens up',
        'the last particles fading',
    ], 'Toca em cima do alvo; o meio do painel fica vazio para o boneco, com a parte de trás atrás dele.'),
    'corpo': ('Aura no corpo', [
        'thin light of {fx} appears around an empty spot at the center where the ninja stands',
        '{fx} forms a full shape around the empty center, seen from the 3/4 view (a ring or dome around the body)',
        '{fx} at full strength (loop frame A)',
        'the same aura with small changes (loop frame B)',
        'the moment it is hit or used: a bright flash and small cracks in {fx}',
        '{fx} breaking into fragments and fading',
    ], 'F3 e F4 em laço enquanto dura. A metade de trás fica atrás do boneco e a da frente por cima (profundidade).'),
    'recuo': ('Salto ou deslize', [
        'a burst of {fx} at the starting point, centered',
        'motion streaks of {fx} stretched horizontally across the panel',
        'thinner streaks, the same height as F2',
        'an arrival burst of {fx}, centered, the same size as F1',
        'the burst opening into small particles',
        'the last particles fading',
    ], 'F1 na saída, F2 e F3 esticados pelo caminho, F4 a F6 na chegada.'),
    'investida': ('Investida', [
        'a crouch: dust and {fx} gathering at the center',
        'a rising trail of {fx} going up',
        'a diving streak of {fx} coming down to the center',
        'the crash impact at the center, the biggest frame',
        'debris and rock chips flying out',
        'dust settling and fading',
    ], 'F1 na saída, F2 e F3 no caminho, F4 a F6 no alvo.'),
    'invocacao': ('Invocação', [
        'a summoning circle on the ground and {fx} rising from it',
        '{fx} standing, idle pose, facing the viewer and slightly to the right',
        '{fx} walking, step A, facing right',
        '{fx} walking, step B, facing right',
        '{fx} attacking to the right',
        '{fx} dissolving into particles',
    ], 'F1 ao surgir, F2 parado, F3 e F4 andando (laço), F5 no golpe, F6 ao sumir. A criatura fica com os pés no mesmo ponto em todos os quadros.'),
    'transformacao': ('Transformação', [
        '{fx} starts to wrap around an empty spot at the center where the ninja stands',
        '{fx} at full size around the empty center, seen from the 3/4 view',
        'the same form (loop frame A)',
        'the same form with small changes (loop frame B)',
        'the final wave of {fx} launched forward to the right',
        'the wave fading',
    ], 'F1 e F2 ao virar, F3 e F4 em laço por 5 s, F5 e F6 na onda do fim.'),
    'meteoros': ('Golpes que caem', [
        'a small warning mark on the ground at the center',
        'one {fx} falling from high above the mark',
        'the same {fx} close to the ground',
        'the hit on the ground: a cross slash and a burst',
        'a small gust opening from the hit',
        'the last streaks fading',
    ], 'Uma peça só por folha: o jogo repete a folha em cada um dos golpes, no ponto sorteado pelo servidor.'),
}

# (code, nome, forma do servidor, molde, descrição do jogo, fx em inglês, classe da paleta, notas)
FALTAM = [
    ('illusion', 'Ilusão', 'anel', 'anel', 'Atordoa todos em volta de você (raio 3) por 3 s.',
     'a hypnotic spiral of violet petals', 'illusion', ''),
    ('illusion_2', 'Visão do Abismo', 'linha', 'linha', 'Olhar em linha (5 casas): atordoa o primeiro inimigo por 1,6 s e tira 10 de chakra dele. Sem dano.',
     'a violet gaze beam with a dark abyss swirl inside', 'illusion', ''),
    ('illusion_3', 'Raízes do Pesadelo', 'alvo', 'alvo', 'Prende o alvo (até 5 casas) por 1,9 s; o golpe cai nele 1,2 s depois.',
     'twisted dark violet roots with thorns', 'illusion', 'O F5 (abrir) é o momento do golpe, 1,2 s depois.'),
    ('illusion_4', 'Ciclo Sem Fim', 'alvo', 'alvo', 'Prende o alvo (até 5 casas) por 2,4 s, deixa em silêncio por 2,5 s e lento por 2 s. Sem dano.',
     'three violet rune rings turning around the target like a clock', 'illusion', ''),
    ('illusion_kai', 'Dissipação', 'limpeza', 'corpo', 'Limpa lentidão, silêncio e sono de você. Funciona mesmo em silêncio.',
     'a thin shell of violet glass', 'illusion', 'F5 é o vidro quebrando; F6 os cacos sumindo.'),
    ('illusion_estaca', 'Estaca da Ilusão', 'linha', 'linha', 'Estaca em linha (6 casas): fere e prende o primeiro inimigo por 1,6 s.',
     'a long violet crystal stake', 'illusion', ''),
    ('illusion_templo', 'Santuário das Penas', 'zona', 'zona', 'Santuário na área mirada (raio 4) por 3 s: deixa lento; quem ficar até o fim leva o golpe e é atordoado por 1,3 s.',
     'a round floor of violet feathers with a pale rune circle', 'illusion', 'O F6 pode ser o golpe do fim (penas subindo num clarão).'),
    ('illusion_noite', 'Noite Eterna', 'alvo', 'alvo', 'Escurece a tela do alvo (até 6 casas) por 3 s: ele quase não enxerga.',
     'a dark violet night cloud with tiny stars', 'illusion', 'A escuridão da tela já é feita pelo jogo; a folha é a nuvem no alvo.'),
    ('illusion_olho', 'Olho Errante', 'projetil', 'projetil', 'Olho lento em linha (7 casas): dano e lentidão por 2 s no primeiro inimigo.',
     'a floating violet eye with a short trail', 'illusion', ''),
    ('illusion_passo', 'Passo Falso', 'recuo', 'recuo', 'Salta 3 casas para trás e, por 1,2 s, ninguém trava o alvo em você.',
     'violet mirror shards and a fading afterimage outline', 'illusion', ''),
    ('illusion_veu', 'Véu da Meia-Noite', 'zona', 'zona', 'Escuridão na área mirada (raio 2,5) por 4 s: os inimigos dentro quase não enxergam.',
     'a dome of midnight violet mist', 'illusion', ''),
    ('illusion_espelho', 'Espelho Quebrado', 'alvo', 'alvo', 'Dano no alvo (até 5 casas) e controles embaralhados por 1,3 s: ele anda ao contrário.',
     'a cracked violet mirror frame', 'illusion', ''),
    ('illusion_coro', 'Coro do Silêncio', 'anel_golpe', 'anel', 'Silêncio por 3 s em todos em volta de você (raio 3): ficam sem jutsu. Sem dano.',
     'a ring of pale violet sound waves with small closed-mouth rune marks', 'illusion', ''),
    ('illusion_colapso', 'Colapso Onírico', 'aviso', 'aviso', 'Explosão mental na área mirada (raio 2,5), com aviso de 1 s: dano e atordoa por 1,3 s.',
     'a violet dream sphere that implodes', 'illusion', ''),
    ('illusion_ninar', 'Canção de Ninar', 'linha', 'linha', 'Depois de 1 s de selos parado: põe o primeiro inimigo da linha (6 casas) para dormir por 2,5 s. Acorda se apanhar. Sem dano.',
     'a soft line of violet music notes and small moons', 'illusion', ''),
    ('illusion_reflexo', 'Reflexo Vazio', 'invocacao', 'corpo', 'Cria um duplo seu ao lado por 8 s: ele atrai os monstros e segura golpes.',
     'a violet smoke swirl', 'illusion', 'Proposta: o duplo usa o seu próprio boneco com um tom violeta (sem arte nova de personagem); a folha é só a fumaça de surgir (F1 a F4) e de sumir (F5 e F6).'),
    ('illusion_emprestimo', 'Empréstimo Forçado', 'alvo', 'alvo', 'No alvo (até 5 casas): dano leve, e o escudo e os bônus ativos dele (Básico, velocidade) passam para você pelo tempo que faltava.',
     'violet hands of light pulling glowing orbs out', 'illusion', 'No jogo, os orbes voam do alvo até você entre o F4 e o F5.'),
    ('illusion_voz', 'Segunda Voz', 'invocacao', 'corpo', 'Cria um clone ao seu lado por 8 s: ele repete, do lugar dele, o seu próximo jutsu em linha, com 50% do dano.',
     'a violet echo ring with small sound marks', 'illusion', 'Proposta igual à do Reflexo Vazio: o clone usa o seu boneco com tom violeta; a folha é o surgir e o sumir.'),
    ('stone_3', 'Esmagamento de Paredes', 'alvo', 'alvo', 'Paredes esmagam o alvo (até 5 casas): dano alto e prende por 1,6 s.',
     'two thick rock walls, one on each side', 'stone', 'F2 as paredes sobem, F3 elas fecham no meio (golpe), F4 presas, F5 se abrem e racham.'),
    ('lightning', 'Faísca Rasante', 'linha_raio', 'linha', 'Raio em linha (4,5 casas): atordoa o primeiro inimigo por 0,6 s e paralisa por 2 s. Em alvo molhado bate 30% mais.',
     'a low zigzag lightning bolt skimming the ground', 'lightning', 'O primeiro jutsu do Relâmpago: o mais usado da classe.'),
    ('heal_aura', 'Aura de Regeneração', 'zona', 'corpo', 'Aura que anda com você por 3 s (raio 2) e cura 10 em quem está dentro a cada segundo.',
     'a soft green ring of leaves and small plus-sign sparkles on the ground around you', 'heal', 'Anda com o ninja; a metade de trás fica atrás do boneco.'),
    ('taijutsu_lotus', 'Mergulho Esmagador', 'investida', 'investida', 'Mergulha no alvo (até 3 casas): dano alto e 1,3 s no ar. Custa 5% da sua vida atual.',
     'orange speed light and a spinning lotus of wind', 'taijutsu', ''),
    ('taijutsu_chave', 'Chave de Braço', 'alvo', 'alvo', 'Agarra o alvo colado: dano e prende por 1,3 s.',
     'orange grip lines and small impact stars', 'taijutsu', 'Efeito pequeno, colado no alvo (1 casa).'),
    ('taijutsu_impacto', 'Impacto Circular', 'anel_golpe', 'anel', 'Pisão forte: dano em volta de você (raio 2) e atordoa por 0,8 s.',
     'a ground shockwave with cracked earth and tan dust', 'taijutsu', ''),
    ('water_coluna', 'Coluna d’Água', 'aviso', 'aviso', 'Jorro que sobe na área mirada (raio 2,5), com aviso de 0,9 s: dano e 1 s no ar.',
     'a tall geyser of water rising from the ground', 'water', 'A base do jorro fica sempre no mesmo ponto do chão; ele cresce para cima.'),
    ('water_corpo', 'Corpo de Água', 'transformacao', 'transformacao', 'Por 5 s: escudo de 65 e Ataque Básico 15% mais forte. No fim, uma onda à frente levanta os inimigos por 0,8 s.',
     'a flowing armor of clear water', 'water', ''),
    ('wind_milcortes', 'Mil Cortes do Céu', 'meteoros', 'meteoros', '5 lâminas de ar caem na área mirada (até 7 casas), cada uma com aviso no chão de 0,8 s.',
     'crescent blade of air', 'wind', ''),
    ('rubro_olho', 'Olhar Rubro', 'escudo', 'corpo', 'O próximo golpe que você receber perde 50% da força.',
     'a crimson eye-shaped ward with a black pupil mark', 'rubro', ''),
    ('rubro_transe', 'Transe Ocular', 'linha', 'linha', 'Olhar em linha (4 casas): atordoa o primeiro inimigo por 1,3 s.',
     'a crimson gaze beam with small black tomoe-like marks', 'rubro', ''),
    ('rubro_chamas', 'Brasa Sem Luz', 'linha', 'linha', 'Chama escura em linha (6 casas): o alvo queima por 4 s.',
     'a line of black fire with crimson edges', 'rubro', ''),
    ('rubro_guardiao', 'Sentinela Espectral', 'escudo_vida', 'corpo', 'Escudo de 65 de dano por 4 s e um corte em cone à frente.',
     'a crimson spectral ribcage of light', 'rubro', 'O F5 é o corte em cone à frente (para a direita).'),
    ('rubro_lua', 'Mundo Espelhado', 'linha', 'linha', 'Olhar em linha (5 casas) depois de 0,8 s de selos parado: dano alto e atordoa por 2,4 s. Qualquer dano nos selos faz falhar.',
     'a crimson beam under a red moon reflection', 'rubro', 'O F1 pode durar os 0,8 s dos selos (lua surgindo).'),
    ('rubro_completo', 'Colosso Espectral', 'transformacao', 'transformacao', 'Por 5 s: escudo de 85 e Ataque Básico 15% mais forte. No fim, uma onda à frente levanta os inimigos por 0,8 s.',
     'a towering crimson spectral warrior of light behind and around you', 'rubro', 'O colosso é luz espectral (sem rosto detalhado), maior que o boneco.'),
    ('umbra_deslize', 'Deslize Noturno', 'recuo', 'recuo', 'Desliza 4 casas; por 1,5 s ninguém trava o alvo em você, e o seu próximo golpe (em até 4 s) bate 15% mais.',
     'a flat ink-black shadow smear', 'umbra', ''),
    ('umbra_faminta', 'Sombra Faminta', 'marca', 'alvo', 'Marca um alvo (até 6 casas) por 6 s: o seu próximo golpe nele bate 25% mais e deixa lento por 1 s.',
     'a hungry shadow mouth with two small pale eyes', 'umbra', 'F3 e F4 em laço enquanto a marca dura; F5 é a mordida quando o golpe acerta.'),
    ('umbra_noite', 'Noite Fechada', 'zona', 'zona', 'Noite em volta de você (raio 3) por 4 s: os inimigos dentro quase não enxergam e você leva 15% menos dano.',
     'a circle of deep indigo night with drifting shadow wisps', 'umbra', ''),
    ('umbra_forma', 'Forma Umbral', 'forma_sombra', 'corpo', 'Vira sombra por 5 s: projéteis atravessam você, anda 20% mais rápido, e quem você atravessa leva dano e fica lento.',
     'a cloak of living black shadow with violet edges', 'umbra', ''),
    ('bastiao_muralha', 'Muralha Interior', 'escudo_vida', 'corpo', 'Escudo de 40 de dano por 4 s; quem te bater de perto leva 20% do golpe de volta.',
     'a ring of upright stone shield plates with golden runes', 'bastiao', ''),
    ('bastiao_guarda', 'Guarda Compartilhada', 'escudo_vida', 'corpo', 'Escudo de 35 de dano por 4 s em você e no aliado mirado (até 6 casas).',
     'a dome of steel-blue hexagon light with golden runes', 'bastiao', 'A mesma folha toca em você e no aliado.'),
    ('bastiao_resposta', 'Muro que Responde', 'postura', 'corpo', 'Por 2 s, quem te acertar é empurrado 2 casas e fica lento por 1,5 s.',
     'a low ring of stone with spikes pointing outward', 'bastiao', 'F5 é o empurrão (as pontas disparam para fora).'),
    ('bastiao_juramento', 'Juramento do Escudo', 'postura', 'corpo', 'Por 10 s você leva 50% menos dano, e 50% do dano dos aliados a até 6 casas vem para você.',
     'a large golden rune circle on the ground and a tall steel shield of light behind you', 'bastiao', ''),
    ('aspide_cuspe', 'Cuspe da Áspide', 'projetil', 'projetil', 'Cuspe em linha (7 casas): envenena (3 por segundo por carga, até 3 cargas, por 6 s) e deixa lento por 2 s.',
     'a glob of toxic green venom with drips', 'aspide', ''),
    ('aspide_nevoa', 'Névoa Tóxica', 'zona', 'zona', 'Névoa de raio 2,5 por 5 s onde você mirar: quem fica dentro ganha uma carga de veneno a cada segundo (até 4).',
     'a low cloud of toxic green mist with bubbles', 'aspide', ''),
    ('aspide_constricao', 'Constrição', 'alvo', 'alvo', 'Enrola o alvo (até 5 casas): preso por 1,5 s e envenenado com 6 por segundo por 5 s.',
     'a large green serpent coiling', 'aspide', ''),
    ('aspide_ninho', 'Ninho de Áspides', 'invocacao', 'invocacao', '3 serpentes por 8 s: correm no inimigo, mordem e envenenam (2 por segundo por carga).',
     'one small green viper', 'aspide', 'Uma serpente por folha; o jogo põe três.'),
    ('garra_matilha', 'Chamado da Matilha', 'invocacao', 'invocacao', 'Invoca uma fera por 10 s (com 12% da sua vida) que corre no alvo e morde.',
     'one wolf beast with tawny fur', 'garra', ''),
    ('garra_uivo', 'Uivo de Comando', 'comando', 'linha', 'Uivo no alvo (até 8 casas): atordoa por 0,5 s, e as suas invocações saltam nele e mordem.',
     'amber sound waves of a howl', 'garra', ''),
    ('garra_troca', 'Troca Instintiva', 'troca', 'recuo', 'Troca de lugar com a sua invocação mais perto (até 10 casas).',
     'amber claw-mark swirls and tufts of fur', 'garra', 'Toca nos dois pontos: F1 onde você estava, F4 onde chega.'),
    ('garra_rei', 'Rei da Matilha', 'invocacao', 'invocacao', 'Invoca o Rei da Matilha por 15 s: uma fera grande, com 40% da sua vida, que bate forte.',
     'one large alpha wolf king with a scarred face and a mane', 'garra', 'Maior que a fera da Matilha (cerca de 2 casas).'),
    ('zefiro_passo', 'Passo do Vento', 'recuo', 'recuo', 'Avança 3 casas e esquiva de todo golpe direto por 0,5 s.',
     'pale blue wind streaks and a white feather', 'zefiro', ''),
    ('zefiro_veu', 'Véu de Ar', 'postura', 'corpo', 'Véu de ar por 4 s: você esquiva 25% dos golpes diretos.',
     'a thin spinning veil of pale blue air', 'zefiro', ''),
    ('zefiro_eco', 'Eco do Vento', 'eco', 'recuo', 'O vento te devolve para onde você estava 3 s atrás.',
     'a pale blue wind spiral and a faint footprint marker', 'zefiro', 'F1 marca o ponto de 3 s atrás; F4 a chegada nele.'),
    ('zefiro_mil', 'Mil Passos', 'mil_passos', 'recuo', 'Salta em até 5 inimigos a até 5 casas em volta, golpeando cada um, e termina ao lado do último.',
     'pale blue dash streaks and a cross slash', 'zefiro', 'F4 vira o corte em cada inimigo; o jogo repete para cada salto.'),
]

REFAZER = [
    ('wind_veu', 'Véu de Vento', 'wind', 'refazer', 'O F1 sumiu no recorte: o rosa do véu é perto do fundo magenta.',
     'Refazer a folha inteira com fundo verde (o véu tem rosa).', 'corpo', 'a swirling veil of pale cyan and soft pink air', VERDE),
    ('wind_espelho', 'Espelho de Ar', 'wind', 'refazer', 'O F1 sumiu no recorte pelo mesmo motivo (rosa no fundo magenta).',
     'Refazer com fundo verde.', 'corpo', 'a round mirror of pale cyan and pink air', VERDE),
    ('taijutsu_pressao', 'Soco de Pressão', 'taijutsu', 'refazer', 'O F6 ficou vazio (a arte saiu do painel). Hoje a animação tem 5 quadros.',
     'Refazer com a arte inteira dentro de cada painel, com margem.', 'linha', 'a compressed air punch wave', VERDE),
    ('wind_olho', 'Olho da Tempestade', 'wind', 'refazer', 'O F6 tem duas espirais cortadas pela linha do painel; o jogo usa só F1 a F5 e o 07/08.',
     'Refazer só o F6 (ou a folha) com a espiral no meio do painel.', 'transformacao', 'a storm eye of spiraling cyan wind', MAGENTA),
    ('water_tromba', 'Tromba d’Água', 'water', 'refazer', 'A base da tromba anda para os lados entre os quadros; no jogo ela parece escorregar.',
     'Refazer com a base sempre no mesmo ponto do chão, no meio do painel.', 'aviso', 'a waterspout column', VERDE),
    ('wind_3', 'Tornado Cortante', 'wind', 'refazer', 'O tornado muda de lado entre os quadros (o centro pula).',
     'Refazer com a base do tornado fixa no meio do painel; só o topo balança.', 'aviso', 'a cutting tornado', MAGENTA),
    ('wind_fenda', 'Fenda do Vento', 'wind', 'refazer', 'Os quadros encostam na borda do painel e o corte sai reto.',
     'Refazer com a fenda inteira dentro do painel, com margem dos dois lados.', 'linha', 'a long slicing rift of wind', MAGENTA),
    ('heal_desintox', 'Desintoxicação', 'heal', 'refazer', 'O F6 veio vazio; a animação tem 5 quadros.',
     'Refazer só o F6: as últimas faíscas verdes sumindo.', 'corpo', 'cleansing green bubbles lifting poison away', MAGENTA),
    ('fire_cometa', 'Cometa Rasteiro', 'fire', 'refazer', 'Falta o F5 na folha (tem 5 quadros).',
     'Refazer a folha com os 6 quadros.', 'projetil', 'a low fire comet', VERDE),
]

QUADROS = [
    ('weapons_arsenal', 'Arsenal Vivo', 'weapons', 'quadros', 'Só veio o círculo de invocação; o guerreiro de armas usa o desenho de código.',
     'Folha do corpo: surgir, parado, andar (2), golpe, sumir.', 'invocacao', 'a living armor made of floating swords and blades', VERDE),
    ('water_clone', 'Duplo de Água', 'water', 'quadros', 'Tem 1 quadro só; o duplo fica parado enquanto anda e soca.',
     'Folha com 6 quadros: surgir, parado, andar (2), soco, desmanchar.', 'invocacao', 'a ninja-shaped figure made of clear water', VERDE),
    ('taijutsu_bloqueio', 'Bloqueio Firme', 'taijutsu', 'quadros', 'Tem 1 quadro só; o escudo aparece parado.',
     'Folha com 6 quadros: subir a guarda, firme (2 em laço), golpe recebido, quebrar, sumir.', 'corpo', 'an orange guard barrier of crossed forearms of light', VERDE),
    ('lightning_rede', 'Rede de Faíscas', 'lightning', 'quadros', 'Tem 1 quadro só; a rede pisca, mas não se mexe.',
     'Folha com 6 quadros de área (entrar, 3 em laço, sumir).', 'zona', 'a net of crackling electric threads on the ground', MAGENTA),
    ('stone_avalanche', 'Avalanche', 'stone', 'quadros', 'Tem 2 quadros (a queda e a pedra); a pedra só desce, sem impacto desenhado.',
     'Uma pedra por folha: aviso, caindo (2), impacto, poeira, sumir.', 'meteoros', 'big falling boulder', VERDE),
    ('weapons_ceu', 'Céu de Lâminas', 'weapons', 'quadros', 'A folha tem 5 lâminas em lugares fixos; o servidor sorteia os pontos, então a arte não cai onde o dano cai.',
     'Uma lâmina por folha, e o jogo põe uma em cada golpe sorteado.', 'meteoros', 'giant falling sword blade', VERDE),
    ('weapons_dragoes', 'Ascensão Dupla', 'weapons', 'opcional', 'As lâminas eram 57% maiores que a área do dano (157%). Diminuí no código: agora estão em 123%, dentro da faixa, mas o desenho fica um pouco pequeno na tela.',
     'Opcional: refazer com as duas lâminas dentro de um círculo do tamanho do aviso.', 'aviso', 'two rising twin dragon blades', VERDE),
]


def prompt(nome_en, classe, molde, fx, fundo=None, extra=''):
    _, pal, fundo_padrao = CLASSES[classe]
    fundo = fundo or fundo_padrao
    _, quadros, _ = FORMAS[molde]
    linhas = [ESTILO.format(fundo=COR_FUNDO[fundo])]
    linhas.append(f'The jutsu "{nome_en}": {fx}. Palette: {pal}. The sheet shows only the jutsu effect; '
                  'the game draws the ninja separately, so the middle of the panel stays as open background where the ninja stands.'
                  if molde in ('corpo', 'transformacao', 'alvo') else
                  f'The jutsu "{nome_en}": {fx}. Palette: {pal}.')
    if molde == 'invocacao':
        linhas[-1] = (f'The summon "{nome_en}": {fx}. Palette: {pal}. The creature keeps its feet on the same ground point '
                      'in every panel and keeps the same size in every panel.')
    for i, q in enumerate(quadros, 1):
        linhas.append(f'F{i}: ' + q.format(fx=fx) + '.')
    if extra:
        linhas.append(extra)
    return '\n'.join(linhas)


def item_falta(t):
    code, nome, forma, molde, texto, fx, classe, nota = t
    titulo, quadros, toca = FORMAS[molde]
    fundo = CLASSES[classe][2]
    return {
        'id': code, 'grupo': 'falta', 'nome': nome, 'classe': CLASSES[classe][0], 'forma': forma,
        'molde': titulo, 'descricao': texto, 'fundo': 'verde' if fundo == VERDE else 'magenta',
        'quadros': [q.format(fx=fx) for q in quadros], 'comoToca': toca, 'nota': nota,
        'prompt': prompt(nome, classe, molde, fx),
    }


def item_ajuste(t):
    code, nome, classe, grupo, problema, pedido, molde, fx, fundo = t
    titulo, quadros, toca = FORMAS[molde]
    return {
        'id': code, 'grupo': grupo, 'nome': nome, 'classe': CLASSES[classe][0],
        'forma': molde, 'molde': titulo, 'descricao': problema, 'pedido': pedido,
        'fundo': 'verde' if fundo == VERDE else 'magenta', 'quadros': [q.format(fx=fx) for q in quadros],
        'comoToca': toca, 'nota': '',
        'prompt': prompt(nome, classe, molde, fx, fundo),
    }


CLASSES['fire'] = ('Fogo', 'bright orange, yellow and deep red flame, with a dark brown-red outline', VERDE)
CLASSES['weapons'] = ('Armas', 'polished steel gray and silver, with white glints, a little gold trim and a dark gray outline', VERDE)


def auditoria():
    """As linhas da auditoria de hitbox (auditoria-hitbox.md, gerada pelo auditar.ts)."""
    arq = os.path.join(AQUI, 'auditoria-hitbox.md')
    if not os.path.exists(arq):
        return []
    linhas = []
    for l in open(arq, encoding='utf-8'):
        c = [x.strip() for x in l.strip().strip('|').split('|')]
        if len(c) != 5 or c[0] in ('Jutsu', '---') or c[0].startswith('---'):
            continue
        linhas.append({'jutsu': c[0], 'forma': c[1], 'servidor': c[2], 'arte': c[3], 'razao': c[4]})
    return linhas


def main():
    itens = [item_falta(t) for t in FALTAM] + [item_ajuste(t) for t in REFAZER + QUADROS]
    with open(os.path.join(AQUI, 'pendencias.json'), 'w', encoding='utf-8') as f:
        json.dump({'gerado': '2026-11-22', 'itens': itens, 'auditoria': auditoria()}, f, ensure_ascii=False, separators=(',', ':'))
        f.write('\n')
    nomes = {'falta': 'Faltam (folha nova)', 'refazer': 'Refazer', 'quadros': 'Mais quadros', 'opcional': 'Opcional'}
    md = ['# Pendências das folhas dos jutsus', '',
          'Gerado por `python3 arte/jutsus-vfx/pendencias.py`. A página de acompanhamento guarda o que já foi feito;',
          'este arquivo é a mesma lista em texto.', '']
    for g in ('falta', 'refazer', 'quadros', 'opcional'):
        grupo = [i for i in itens if i['grupo'] == g]
        md.append(f'## {nomes[g]} ({len(grupo)})')
        md.append('')
        for i in grupo:
            md.append(f"### {i['nome']} (`{i['id']}`), {i['classe']}, {i['molde'].lower()}, fundo {i['fundo']}")
            md.append('')
            md.append(i['descricao'])
            if i.get('pedido'):
                md.append('')
                md.append('**Pedido:** ' + i['pedido'])
            if i['nota']:
                md.append('')
                md.append('**Nota:** ' + i['nota'])
            md.append('')
            md.append('**No jogo:** ' + i['comoToca'])
            md.append('')
            md.append('```')
            md.append(i['prompt'])
            md.append('```')
            md.append('')
    with open(os.path.join(AQUI, 'pendencias.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(md))
    print(len(itens), 'itens;', {g: sum(1 for i in itens if i['grupo'] == g) for g in nomes})


if __name__ == '__main__':
    main()
