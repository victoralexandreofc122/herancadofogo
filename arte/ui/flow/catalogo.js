/* Catálogo da interface do jogo para o Flow (pedido do Victor, 23/11/2026): uma imagem por peça, no tema "Laca e Brasa".
   w x h = o tamanho da arte em pixels (o jogo mostra cada pixel de arte com 2 pixels de tela no celular, 3 no computador).
   k: moldura (9 fatias: os cantos ficam, as bordas esticam), peca (peça inteira), estados (as versões lado a lado numa linha),
   icones (uma folha com vários ícones em grade), fundo (tela inteira).
   v = as versões em fila (estados do botão, raridades, faixas). t = a quantidade de ícones e cada um. */
const GRUPOS = {
  molduras: "Molduras e painéis",
  botoes: "Botões",
  hud: "HUD de combate",
  barras: "Barras",
  inventario: "Mochila e equipamentos",
  icones: "Ícones",
  insignias: "Insígnias, faixas e emblemas",
  dialogo: "Conversa e avisos",
  telas: "Entrada e telas inteiras",
};

const UI = [
  // ===== Molduras e painéis =====
  { id: "ui_painel", g: "molduras", k: "moldura", w: 96, h: 96, n: "Painel grande (menus, Perfil, Configurações)",
    d: "a large window panel frame: a thick border of deep ink-navy lacquered wood with a raised aged-bronze trim line inside it, a slightly darker inset navy center; each of the four corners has a small bronze corner guard with a tiny ember-orange flame motif engraved on it." },
  { id: "ui_painel_pequeno", g: "molduras", k: "moldura", w: 48, h: 48, n: "Painel pequeno (dica, ficha do jutsu)",
    d: "a small compact panel frame: a thin ink-navy lacquered border with a single bronze trim line, small rounded bronze corner studs, a plain dark navy center." },
  { id: "ui_pergaminho", g: "molduras", k: "moldura", w: 128, h: 80, n: "Pergaminho de leitura (Manual, Nota de atualização, Pergaminho do Mestre)",
    d: "an unrolled horizontal paper scroll: a cream rice-paper sheet with a subtle fiber texture and slightly darker aged edges, a dark lacquered wooden roller across the top and another across the bottom, each roller with small bronze end caps; a thin red border line printed near the paper edge." },
  { id: "ui_titulo", g: "molduras", k: "moldura", w: 96, h: 20, n: "Faixa do título do painel",
    d: "a horizontal title plaque that sits on top of a panel: a lacquered ink-navy wooden board with angled cut ends, a bronze border with a thin gold highlight, two tiny flame motifs at the left and right ends; the long middle part is a plain flat navy area." },
  { id: "ui_divisor", g: "molduras", k: "peca", w: 96, h: 8, n: "Divisor ornamental",
    d: "a thin horizontal ornamental divider line in aged bronze, with a small diamond-shaped ember jewel in the middle and tapering ends." },
  { id: "ui_aba", g: "molduras", k: "estados", w: 40, h: 18, v: ["inactive tab: dark navy lacquer with a dim bronze edge", "active tab: brighter navy with a glowing warm gold edge and a small ember dot on top"], n: "Aba (inativa e ativa)",
    d: "a tab for switching sections at the top of a panel: a short lacquered wooden tab with rounded top corners, a plain flat center for the label." },
  { id: "ui_dica", g: "molduras", k: "moldura", w: 40, h: 28, n: "Balão da dica na hora",
    d: "a small hint card: a cream paper card with a bronze border and a tiny red seal stamp in the top-left corner, plain center." },

  // ===== Botões =====
  { id: "ui_botao_principal", g: "botoes", k: "estados", w: 64, h: 22, v: ["normal", "pressed: pushed down 1 pixel, slightly darker", "disabled: desaturated gray-brown"], n: "Botão principal (Começar a jogar, Salvar, Equipar)",
    d: "the main action button: a rounded rectangle of glossy ember-orange lacquer with a lighter top band and a darker bottom lip giving it thickness, a bronze outline ring, plain center for the label." },
  { id: "ui_botao_secundario", g: "botoes", k: "estados", w: 64, h: 22, v: ["normal", "pressed: pushed down 1 pixel", "disabled: dim and gray"], n: "Botão secundário (Cancelar, Voltar)",
    d: "a secondary button: a rounded rectangle of dark ink-navy lacquer with a bronze outline ring and a subtle lighter top band, plain center for the label." },
  { id: "ui_botao_perigo", g: "botoes", k: "estados", w: 64, h: 22, v: ["normal", "pressed"], n: "Botão de confirmar perigo (Redefinir, Sair)",
    d: "a danger confirm button: a rounded rectangle of deep crimson lacquer with a dark red bottom lip, a bronze outline ring, plain center for the label." },
  { id: "ui_botao_redondo", g: "botoes", k: "estados", w: 22, h: 22, v: ["normal", "pressed"], n: "Botão redondo de ícone (☰, girar, chat)",
    d: "a small round icon button: a circular ink-navy lacquer disc with a bronze ring and a soft highlight on the upper left, plain center for an icon." },
  { id: "ui_botao_fechar", g: "botoes", k: "peca", w: 20, h: 20, n: "Botão Fechar (✕)",
    d: "a small round close button: a crimson lacquer disc with a bronze ring and a cream X mark made of two thick brush strokes in the center." },
  { id: "ui_check", g: "botoes", k: "estados", w: 14, h: 14, v: ["unchecked: empty dark square socket", "checked: the socket with a gold ember tick mark"], n: "Caixa de marcar",
    d: "a small square checkbox socket of dark lacquer with a bronze rim." },
  { id: "ui_slider", g: "botoes", k: "peca", w: 96, h: 14, n: "Controle deslizante (volume, tamanho)",
    d: "a horizontal slider: a long thin recessed dark groove with a bronze rim, the left part filled with warm ember-orange, and a round bronze knob with a small ember jewel sitting on it." },

  // ===== HUD de combate =====
  { id: "ui_jutsu", g: "hud", k: "estados", w: 32, h: 32, v: ["ready: bright bronze ring with a faint ember glow at the rim", "cooldown: the ring dim and gray-brown", "locked: dark ring with a tiny bronze padlock at the bottom"], n: "Moldura do botão de jutsu",
    d: "a round jutsu button frame for the combat HUD: a thick circular bronze ring with four tiny engraved notches like a clock, a dark inset navy disc in the middle left plain for the jutsu icon." },
  { id: "ui_ataque", g: "hud", k: "peca", w: 44, h: 44, n: "Botão do ataque básico (o maior)",
    d: "the large basic attack button: a bigger circular frame with a double bronze ring, the outer ring carved with small flame-shaped teeth, a dark navy inset center left plain for the fist or weapon icon." },
  { id: "ui_joystick", g: "hud", k: "peca", w: 64, h: 64, n: "Joystick (base e manopla)",
    d: "a virtual joystick for touch screens, shown as two parts side by side: on the left a large round translucent-looking base disc of dark navy with a thin bronze ring and four small arrow marks pointing up, down, left and right; on the right a smaller round knob of bronze with a lighter ember-colored center." },
  { id: "ui_minimapa", g: "hud", k: "peca", w: 96, h: 96, n: "Moldura do minimapa",
    d: "a round minimap frame: a thick circular bronze ring with a darker inner lip, a small compass mark at the top shaped like a flame pointing north, four tiny studs at the sides; the inside of the circle is plain flat dark navy." },
  { id: "ui_retrato", g: "hud", k: "estados", w: 40, h: 40, v: ["player portrait frame: bronze with a warm gold highlight", "enemy portrait frame: dark iron with a red rim"], n: "Moldura do retrato (você e o inimigo)",
    d: "a portrait frame for a character face: an octagonal bronze frame with a thin dark inner border and a small plate below for the level number, the inside plain flat dark navy." },
  { id: "ui_selos", g: "hud", k: "peca", w: 96, h: 16, n: "Barra dos selos (conjurando)",
    d: "a horizontal casting bar: a recessed dark groove framed in bronze, small round sockets along it like hand-seal beads, the left third filled with glowing ember-orange to show progress." },
  { id: "ui_alvo", g: "hud", k: "peca", w: 32, h: 16, n: "Marcador do alvo no chão",
    d: "a flat target marker seen from above as an ellipse on the ground: a thin red dashed ring with four small inward-pointing triangles at the top, bottom, left and right." },

  // ===== Barras =====
  { id: "ui_barra_moldura", g: "barras", k: "moldura", w: 96, h: 14, n: "Moldura das barras (vida, chakra, XP)",
    d: "an empty horizontal bar frame: a long recessed dark groove with a bronze border, rounded ends with small bronze caps, the inside plain flat dark navy." },
  { id: "ui_barra_cores", g: "barras", k: "estados", w: 88, h: 8, v: ["health fill: bright leaf green with a lighter top line and a darker bottom line", "chakra fill: bright sky blue to cyan", "experience fill: violet", "enemy health fill: red", "shield fill: pale gold"], n: "Preenchimentos das barras (vida, chakra, XP, inimigo, escudo)",
    d: "the colored fill strips that go inside the bars: flat horizontal strips with 3 tones each (light top line, main color, darker bottom line) and a single bright highlight pixel row near the top." },
  { id: "ui_barra_chefe", g: "barras", k: "moldura", w: 160, h: 18, n: "Barra do chefe (Rei Lodo, Titãs)",
    d: "a long boss health bar frame: a heavy bronze frame with a dark red inner groove, a skull-like slime emblem plate on the left end and spiked bronze caps at both ends." },

  // ===== Mochila e equipamentos =====
  { id: "ui_slot", g: "inventario", k: "estados", w: 24, h: 24, v: ["empty: plain dark socket with a dim bronze rim", "common: gray-white rim", "rare: blue rim", "epic: violet rim", "legendary: gold rim with tiny ember sparks"], n: "Espaço da mochila (vazio e raridades)",
    d: "a square inventory slot: a recessed dark navy square with rounded corners and a rim whose color shows the item rarity, the inside plain for the item icon." },
  { id: "ui_slot_equip", g: "inventario", k: "icones", w: 24, h: 24, t: ["weapon slot: a faint outline of a short sword", "cape slot: a faint outline of a cape", "feet slot: a faint outline of a sandal", "accessory slot: a faint outline of a ring", "scroll slot: a faint outline of a rolled scroll", "mask slot: a faint outline of a mask"], n: "Espaços do equipamento (com a silhueta)",
    d: "equipment slots: each one a square dark navy socket with a bronze rim and a faint lighter silhouette in the center showing what goes there." },

  // ===== Ícones =====
  { id: "ui_icones_menu", g: "icones", k: "icones", w: 20, h: 20, t: ["backpack (inventory)", "person bust (profile)", "rolled mission scroll with a red seal (missions)", "paw print (bond with the creatures)", "gear (settings)", "village gate with a roof (village)", "hourglass (history)", "speech bubble (chat)", "open book (manual)", "envelope with a quill (feedback)", "two crossed kunai (ranked)", "four corner arrows (fullscreen)", "door with an arrow out (logout)", "shield with a check (admin)"], n: "Ícones do menu ☰ (14)",
    d: "menu icons: each one a bold simple symbol in cream and bronze tones with a dark outline, readable at small size." },
  { id: "ui_icones_recursos", g: "icones", k: "icones", w: 16, h: 16, t: ["gold coin with a square hole (ryo money)", "violet star (experience)", "blue chakra drop", "green health heart leaf", "small rolled scroll (jutsu scroll)", "glowing ancient page fragment (chronicle fragment)", "shuriken (throwing star item)", "clock (cooldown)"], n: "Ícones de recursos (ryō, XP, chakra, pergaminho...)",
    d: "small resource icons: each one a simple bold symbol with a dark outline and 2 to 3 tones, readable at very small size." },
  { id: "ui_icones_classes", g: "icones", k: "icones", w: 24, h: 24, t: ["fire flame (Fire)", "water wave (Water)", "lightning bolt (Lightning)", "rock chunk (Stone)", "swirl of wind (Wind)", "green healing leaf with a cross (Healing)", "dark crescent shadow (Shadow)", "violet spiral eye (Illusion)", "clenched fist (Taijutsu)", "crossed blades (Weapons)"], n: "Ícones das 10 classes",
    d: "class emblems: each one a round medallion with a bronze rim and the class symbol in the class color in the middle." },
  { id: "ui_icones_estados", g: "icones", k: "icones", w: 14, h: 14, t: ["yellow stars circling (stunned)", "flame (burning)", "green drop (poison)", "blue snail shell (slowed)", "brown chains (rooted)", "gray mouth with an X (silenced)", "blue Z letters (asleep)", "golden shield (shield)", "red arrow up (damage up)", "blue arrow down (defense down)", "eye with a slash (blinded)", "two crossed arrows (controls inverted)"], n: "Ícones de estado em cima da cabeça (12)",
    d: "status effect icons that float above a character: each one a tiny round light badge with a dark outline and the symbol in the middle, readable at very small size." },
  { id: "ui_icones_aviso", g: "icones", k: "icones", w: 16, h: 16, t: ["red exclamation mark (warning)", "green check mark (success)", "blue i (information)", "gold star burst (new)", "red dot badge (unread)", "padlock (locked)"], n: "Ícones de aviso e selos",
    d: "notice icons: each one a bold simple symbol with a dark outline." },

  // ===== Insígnias, faixas e emblemas =====
  { id: "ui_faixas", g: "insignias", k: "estados", w: 32, h: 32, v: ["bronze tier: brown-orange metal", "silver tier: cool gray metal", "gold tier: bright gold", "diamond tier: pale cyan crystal", "legend tier: deep violet with gold rim and ember sparks"], n: "Selos das faixas do rankeado (Bronze a Lenda)",
    d: "a round ranked tier seal: a medallion with a thick rim and a raised center, two crossed kunai engraved in the middle, a small ribbon tail below; the five versions differ only in metal and color." },
  { id: "ui_patentes", g: "insignias", k: "icones", w: 24, h: 24, t: ["academy student: a simple wooden plate", "genin: a forehead plate with one line", "chunin: a forehead plate with two lines and a vest collar", "jonin: a forehead plate with three lines and a bronze border", "anbu: a white mask plate with red marks", "kage: a forehead plate with a small crown of flame"], n: "Insígnias das patentes (Academia a Kage)",
    d: "rank insignia badges: each one a small shield-shaped badge with a bronze rim, getting richer from left to right." },
  { id: "ui_emblemas_aldeias", g: "insignias", k: "icones", w: 32, h: 32, t: ["Eternal Flame village: an original stylized flame in a circle, ember orange on jade green", "Hidden Tide village: an original stylized wave in a circle, teal on slate blue", "Cutting Wind village: an original stylized swirl of wind and cloud in a circle, white on burgundy", "Ancient Rock village: an original stylized mountain peak in a circle, ochre on rust red"], n: "Emblemas das 4 aldeias",
    d: "village emblems: each one a round lacquered medallion with a bronze rim and an original village symbol in the middle (an original design, not taken from any existing work)." },

  // ===== Conversa e avisos =====
  { id: "ui_dialogo", g: "dialogo", k: "moldura", w: 192, h: 48, n: "Caixa da fala do NPC (embaixo, no meio)",
    d: "a wide dialogue box at the bottom of the screen: a dark navy lacquer panel with a bronze border, a small nameplate tab sticking up from the top-left edge, a square portrait socket on the left side inside the box, and a small ember-orange arrow pointing down at the bottom-right corner (tap to continue); the text area is plain." },
  { id: "ui_aviso", g: "dialogo", k: "moldura", w: 96, h: 24, n: "Aviso rápido (toast)",
    d: "a short notice banner: a slim dark navy lacquer bar with rounded ends, a bronze edge and a small round socket on the left for an icon, plain middle for text." },
  { id: "ui_aviso_grande", g: "dialogo", k: "moldura", w: 160, h: 48, n: "Aviso grande (subiu de nível, nova patente)",
    d: "a big celebration banner: a wide red-and-gold ribbon banner with folded ends, a bronze border, small ember sparks around it, a plain middle area for the message." },
  { id: "ui_balao_chat", g: "dialogo", k: "moldura", w: 48, h: 24, n: "Balão do chat sobre o ninja",
    d: "a small speech bubble: a cream paper bubble with a thin dark outline and a short tail pointing down, plain inside." },

  // ===== Entrada e telas inteiras =====
  { id: "ui_logo", g: "telas", k: "peca", w: 128, h: 64, n: "Logotipo (sem letras: o emblema do jogo)",
    d: "the game emblem for the title screen: a flame rising from an open scroll, framed by a round bronze ring with two crossed kunai behind it, ember sparks around it; the area under the emblem is a plain bronze plaque for the game name, which the game writes itself." },
  { id: "ui_cartao_entrada", g: "telas", k: "moldura", w: 128, h: 96, n: "Cartão da tela de entrada",
    d: "the login card frame: a dark navy lacquer panel with an ornate bronze border, small flame motifs at the four corners and a slightly brighter top edge, plain center for the form." },
  { id: "ui_campo_texto", g: "telas", k: "estados", w: 96, h: 18, v: ["normal: dark recessed field with a dim bronze rim", "focused: the rim glowing warm gold"], n: "Campo de texto (e-mail, senha, chat)",
    d: "a text input field: a long recessed dark navy rectangle with a thin bronze rim and slightly rounded corners, plain inside." },
];
