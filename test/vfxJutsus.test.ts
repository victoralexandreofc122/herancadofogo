import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { JUTSUS } from '../src/realtime/jutsus.js';
import { CAMADAS_FRAMES, FOGO_SPRITE_FRAMES, JUTSU_SPRITES, JUTSU_SPRITE_FRAMES, loadPublicFiles } from '../src/web/staticFiles.js';

/* v56: os sprites desenhados pelo Victor (Teleporte, Substituição, Fogo, Sopro, Névoa e Linha), 3 quadros cada. */
const J = await import(new URL('../public/vfxJutsus.js', import.meta.url).href);
const { VFX_CAMADAS } = await import(new URL('../public/vfxCamadas.js', import.meta.url).href);

const pngSize = (name: string) => {
  const png = readFileSync(new URL(`../public/assets/vfx/${name}.png`, import.meta.url));
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `${name}: PNG`);
  return [png.readUInt32BE(16), png.readUInt32BE(20)] as const;
};

describe('v56: sprites dos jutsus (vfxJutsus.js)', () => {
  it('os 6 jutsus têm os 3 quadros, e a lista do código bate com a do servidor', () => {
    assert.equal(JUTSU_SPRITES.length, 6);
    assert.deepEqual(Object.keys(J.FRAMES).sort(), [...JUTSU_SPRITE_FRAMES].sort());
  });

  it('cada quadro é um PNG pequeno (escala do jogo), com tamanho em casas e âncora dentro da imagem', () => {
    for (const [name, f] of Object.entries<any>(J.FRAMES)) {
      if (f.quadros) continue;   // v78: as camadas em grade têm o teste delas (abaixo)
      const [w, h] = pngSize(name);
      const fogo = /^(fire|heal|lightning|stone|water|shadow|taijutsu|wind|weapons|illusion|umbra|rubro|bastiao|aspide|garra|zefiro)/.test(name);   // v88: + Ilusão   // v80: + Água, Sombra e Taijutsu   // v73/v74: as folhas desenhadas têm quadros maiores (o leque, o raio, o chão)
      const lim = name === 'lightning_rede_01' ? 320 : /^lightning_4_0[3-6]$/.test(name) ? 210 : fogo ? 170 : 96;   // a Rede é a malha inteira; o Julgamento, o raio do céu
      // v95 (guia de estilo): o limite é a densidade do pixel (até 46 pixels de arte por casa), não um tamanho fixo
      const lim2 = Math.max(lim, Math.ceil(f.casas * 46));
      assert.ok(w <= lim2 && h <= lim2, `${name}: ${w}x${h} (reduzido para a escala do jogo)`);
      assert.ok(f.casas > 0 && f.casas <= (/^heal_(3|milagre)_/.test(name) ? 10 : fogo ? 9 : 6), `${name}: ${f.casas} casas`);   // zonas de raio 4
      if (f.eixoPx) assert.ok(f.arte !== undefined && f.eixoPx > 0, `${name}: eixo sem direção`);
      assert.ok(['glow', 'screen', 'lighter', 'normal'].includes(f.blend), `${name}: mistura`);
      if (f.ancora) assert.ok(f.ancora[0] >= 0 && f.ancora[0] <= w && f.ancora[1] >= 0 && f.ancora[1] <= h, `${name}: âncora`);
    }
  });

  it('o servidor serve o código e todos os quadros (lista fechada)', () => {
    const routes = new Set(loadPublicFiles().map((f) => f.route));
    for (const r of ['/vfxJutsus.js', '/vfxFogo.js', '/fogoAnim.js']) assert.ok(routes.has(r), r);
    for (const n of JUTSU_SPRITE_FRAMES) assert.ok(routes.has(`/assets/vfx/${n}.png`), n);
  });

  it('sem os quadros carregados, nada toca (o jogo cai no desenho antigo)', () => {
    const fx = new J.JutsuSprites();
    assert.equal(J.jutsuSpritesReady('fogo'), false);
    assert.equal(fx.show('fogo_01', 0, 0, 0, 100), false);
    assert.equal(fx.launch(1, 'fogo_02', 0, 0, 1, 0, 10, 5, 0), false);
  });
});

describe('v73 a v79: as animações desenhadas dos jutsus de Fogo, Cura, Relâmpago e Pedra (fogoAnim.js)', () => {
  const SKILLS = ['fire_2', 'fire_ryuka', 'fire_haiseki', 'fire_lamina', 'fire_marca', 'fire_3', 'fire_hotan', 'fire_chao', 'fire_cometa', 'fire_rugido',
    'fire_4', 'fire_coroa', 'fire_coluna', 'heal', 'heal_bisturi', 'heal_desintox', 'heal_palma', 'heal_agulha', 'heal_casca', 'heal_disturbio',
    'heal_2', 'heal_banho', 'heal_septica', 'heal_onda', 'heal_3', 'heal_meridianos', 'heal_milagre', 'heal_colosso', 'heal_4', 'heal_santuario',
    'lightning_corrente', 'lightning_impulso', 'lightning_shuriken', 'lightning_fluxo', 'lightning_2', 'lightning_volta', 'lightning_raio', 'lightning_correntes',
    'lightning_3', 'lightning_maos', 'lightning_rugido', 'lightning_4', 'lightning_ceu', 'lightning_armadura', 'lightning_risco',
    // v79: a Pedra (16 folhas; faltam o Esmagamento de Paredes e o Sumidouro)
    'stone', 'stone_4', 'stone_pilares', 'stone_rocha', 'stone_toupeira', 'stone_muralha', 'stone_2', 'stone_pisao', 'stone_punho', 'stone_cascalho',
    'stone_carga', 'stone_lancas', 'stone_resposta', 'stone_couraca', 'stone_avalanche', 'stone_golem', 'stone_sumidouro',
    // v80: a Água (15), a Sombra (18) e o Taijutsu (5)
    'water', 'water_dragao', 'water_nevoa', 'water_muro', 'water_clone', 'water_2', 'water_xarope', 'water_lamina', 'water_laco', 'water_3',
    'water_gotas', 'water_casulo', 'water_4', 'water_tromba', 'water_onda',
    'shadow', 'shadow_recuo', 'shadow_espinho', 'shadow_veu', 'shadow_2', 'shadow_beijo', 'shadow_ciranda', 'shadow_mergulho', 'shadow_armadilha',
    'shadow_3', 'shadow_mancha', 'shadow_troca', 'shadow_saltadora', 'shadow_estrangular', 'shadow_4', 'shadow_agarre', 'shadow_punho', 'shadow_sentinela',
    'taijutsu', 'taijutsu_rasteira', 'taijutsu_esquiva', 'taijutsu_folego', 'taijutsu_2',
    // v81: mais 5 do Taijutsu e 11 do Vento
    'taijutsu_portoes', 'taijutsu_flecha', 'taijutsu_furia', 'taijutsu_4', 'taijutsu_queda',
    'wind', 'wind_salto', 'wind_shuriken', 'wind_veu', 'wind_2', 'wind_espelho', 'wind_arco', 'wind_leve', 'wind_pulso', 'wind_3', 'wind_asa',
    // v82: o resto do Vento e as Armas
    'wind_vortice', 'wind_cadeia', 'wind_4', 'wind_fenda', 'weapons', 'weapons_multi', 'weapons_corte', 'weapons_pregos', 'weapons_peconha',
    'weapons_2', 'weapons_gigante', 'weapons_serrilhada', 'weapons_polida', 'weapons_arco', 'weapons_3', 'weapons_kunai',
    // v83: as Armas completas
    'weapons_4', 'weapons_dragoes', 'weapons_ceu', 'weapons_laco', 'weapons_arsenal',
    // v84
    'taijutsu_3', 'taijutsu_pressao', 'taijutsu_bloqueio', 'taijutsu_ascendente', 'wind_olho',
    // v88: as 15 primeiras da Ilusão
    'illusion', 'illusion_2', 'illusion_3', 'illusion_kai', 'illusion_estaca', 'illusion_templo', 'illusion_noite', 'illusion_olho',
    'illusion_passo', 'illusion_veu', 'illusion_espelho', 'illusion_coro', 'illusion_colapso', 'illusion_ninar', 'illusion_reflexo',
    // v89: o Clã Rubro, 3 do Clã Umbra, Água, Taijutsu, Vento e Cura
    'rubro_olho', 'rubro_transe', 'rubro_chamas', 'rubro_lua', 'rubro_guardiao', 'rubro_completo', 'umbra_deslize', 'umbra_faminta', 'umbra_noite',
    'water_corpo', 'water_coluna', 'wind_milcortes', 'taijutsu_impacto', 'taijutsu_chave', 'taijutsu_lotus', 'heal_aura',
    // v90: os clãs Bastião, Áspide, Garra e Zéfiro, a Forma Umbral e mais 4
    'lightning', 'stone_3', 'illusion_voz', 'illusion_emprestimo', 'umbra_forma', 'bastiao_muralha', 'bastiao_guarda', 'bastiao_resposta',
    'bastiao_juramento', 'aspide_cuspe', 'aspide_nevoa', 'aspide_constricao', 'aspide_ninho', 'garra_matilha', 'garra_uivo', 'garra_troca',
    'garra_rei', 'zefiro_passo', 'zefiro_veu', 'zefiro_eco', 'zefiro_mil',
    // v95: o Ciclo Sem Fim (a última folha)
    'illusion_4'];
  // quadros por folha: 6; o Cometa veio sem o 5, a Desintoxicação com o 6 vazio, a Palma com 7
  const N: Record<string, number> = { illusion_4: 9, heal_palma: 7, lightning_risco: 7,
 water_casulo: 8, taijutsu_queda: 7, weapons: 7, weapons_corte: 5, zefiro_mil: 5, shadow_veu: 7, shadow_2: 5, shadow_beijo: 5, shadow_recuo: 5 };   // v80: folhas com outro número de quadros   // a Avalanche: duas crateras de uma folha só
  it('cada jutsu tem os quadros da folha, e a Revoada e a Chuva têm as peças soltas (uma brasa, um meteoro)', () => {
    for (const s of SKILLS) {
      const n = FOGO_SPRITE_FRAMES.filter((f) => f.replace(/_0\d\w?$/, '') === s && /_0\d$/.test(f)).length;
      assert.equal(n, N[s] ?? 6, s);
    }
    for (let i = 1; i <= 6; i++) assert.ok(FOGO_SPRITE_FRAMES.includes(`lightning_rede_0${i}`), 'a Rede de Faíscas com os 6 quadros (v95)');
    for (const d of ['baixo', 'cima']) for (const k of ['water_clone', 'weapons_arsenal', 'aspide_ninho']) assert.ok(FOGO_SPRITE_FRAMES.includes(`${k}_${d}_02`), `${k} para ${d} (v95)`);
    for (const k of ['taijutsu_3', 'taijutsu_4']) assert.ok(FOGO_SPRITE_FRAMES.includes(`${k}_rajada_06`), `${k}: a folha de rajada (v95)`);
    for (let i = 1; i <= 6; i++) assert.ok(FOGO_SPRITE_FRAMES.includes(`illusion_estaca_baixo_0${i}`), 'a Estaca para baixo');   // v88: a primeira folha de direção
    for (const f of ['lightning_ceu_01b', 'lightning_ceu_03b', 'lightning_ceu_05b', 'lightning_ceu_06b', 'lightning_2_02b', 'lightning_2_05b', 'fire_2_04b', 'fire_2_05b', 'fire_2_06b', 'fire_4_01b', 'fire_4_04b', 'fire_4_05b', 'fire_4_06b']) assert.ok(FOGO_SPRITE_FRAMES.includes(f), f);
  });
  it('"heal" (a Cura) só fica pronta com os quadros dela, não com os dos outros jutsus de Cura', () => {
    const src = readFileSync(new URL('../public/vfxJutsus.js', import.meta.url), 'utf8');
    assert.match(src, /n\.replace\(\/_0\\d\\w\?\$\/, ''\) === base/);
  });
  it('os jutsus são os do servidor (pelo nome da folha)', () => {
    // v79: pela lista do próprio servidor (o Coração de Montanha, stone_4, sai da lista de tiers e não tem linha própria)
    const codes = new Set<string>(JUTSUS.map((j) => j.code));
    for (const s of SKILLS) assert.ok(codes.has(s), s);
  });
  it('sem os quadros carregados, as funções não desenham (o jogo usa o efeito antigo)', async () => {
    const F = await import(new URL('../public/fogoAnim.js', import.meta.url).href);
    const fx = new J.JutsuSprites();
    const msg = { skill: 'fire_ryuka', playerId: 'a', x: 0, y: 0, fx: 1, fy: 0 };
    assert.equal(F.fogoCast(fx, msg, {}, { tx: 8, ty: 0 }, 0, () => null), false);
    assert.equal(F.fogoProjectileFrame({ skill: 'fire_2' }), null);
    assert.equal(F.fogoGround(fx, { skill: 'fire_chao', kind: 'fogo', x: 0, y: 0, r: 2.5, ms: 4000 }, 0), false);
    assert.equal(fx.list.length, 0);
  });
  it('o servidor avisa o jogo quando a Marca pega alguém (só visual)', () => {
    const src = readFileSync(new URL('../src/realtime/gameWorld.ts', import.meta.url), 'utf8');
    assert.match(src, /combo: 'marca', ms: cfg\.brandMs/);
  });
});

describe('v78: as camadas do PixelFX que complementam as folhas desenhadas (camadasJutsus.js)', () => {
  // os 50 jutsus desenhados: os 4 de Fogo da v56 e os 46 das folhas (v73 a v77)
  // v88: as folhas de outra direção e de rajada (<id>_baixo, <id>_cima, <id>_rajada) são do mesmo jutsu
  const DESENHADOS = ['fire', 'fire_endan', 'fire_kasumi', 'fire_hibashiri', ...new Set(FOGO_SPRITE_FRAMES.map((f) => f.replace(/_0\d\w?$/, '')).filter((b) => !/_(baixo|cima|rajada)$/.test(b)))];
  const src = readFileSync(new URL('../public/camadasJutsus.js', import.meta.url), 'utf8');

  it('os 200 jutsus desenhados têm camadas (lançamento, impacto ou chão)', () => {
    assert.equal(DESENHADOS.length, 200);   // v95: + o Ciclo Sem Fim (todos desenhados)   // v90: + 21 (os clãs novos, a Forma Umbral e mais 4)   // v89: + Rubro (6), Umbra (3), Água (2), Taijutsu (3), Vento e Cura   // v88: + 15 da Ilusão   // v84: + 4 do Taijutsu e o Olho da Tempestade   // v83: + as 5 últimas das Armas   // v82: + 4 do Vento e 12 das Armas   // v81: + 5 do Taijutsu e 11 do Vento   // v79: + os 16 da Pedra; v80: + Sumidouro, Água, Sombra e Taijutsu
    // v80: a Água, a Sombra e o Taijutsu têm a carga e a faísca da classe (camadas por classe, não por jutsu)
    for (const s of DESENHADOS) if (!/^(water|shadow|taijutsu|wind|weapons|illusion|umbra|rubro|bastiao|aspide|garra|zefiro)/.test(s)) assert.match(src, new RegExp(`case '${s}':`), s);
    assert.match(src, /LEVA80/);
  });

  it('toda camada usada existe na tabela gerada, e toda camada gerada é usada', () => {
    const usadas = new Set([...src.matchAll(/'(pfx_\w+)'/g)].map((m) => m[1] ?? ''));
    for (const el of ['fogo', 'cura', 'raio', 'pedra', 'agua', 'sombra', 'taijutsu', 'vento', 'armas']) for (const t of ['carga', 'faisca']) if (VFX_CAMADAS[`pfx_${el}_${t}`]) usadas.add(`pfx_${el}_${t}`);
    for (const el of [] as string[]) usadas.add(`pfx_${el}_carga`);   // a carga dos selos: `pfx_${el}_carga`
    for (const n of usadas) assert.ok(VFX_CAMADAS[n], `${n}: não existe em vfxCamadas.js`);
    for (const n of Object.keys(VFX_CAMADAS)) assert.ok(usadas.has(n), `${n}: gerada e não usada`);
    assert.deepEqual(Object.keys(VFX_CAMADAS).sort(), [...CAMADAS_FRAMES].sort());
  });

  it('cada folha é a grade da cor em cima e a da luz embaixo, com a âncora dentro do quadro', () => {
    let total = 0;
    for (const [name, f] of Object.entries<any>(VFX_CAMADAS)) {
      const [w, h] = pngSize(name);
      const rows = Math.ceil(f.quadros / f.cols);
      assert.deepEqual([w, h], [f.cols * f.quadro[0], rows * f.quadro[1] * 2], `${name}: grade`);
      assert.ok(w <= 2048, `${name}: largura ${w}`);
      assert.ok(f.ancora[0] >= 0 && f.ancora[0] <= f.quadro[0] && f.ancora[1] >= 0 && f.ancora[1] <= f.quadro[1], `${name}: âncora`);
      assert.ok(f.casas > 0 && f.casas <= 9 && f.ms > 0 && f.quadros > 0, `${name}: tamanho e tempo`);
      assert.ok(['normal', 'glow', 'screen', 'lighter'].includes(f.blend), `${name}: mistura`);
      total += readFileSync(new URL(`../public/assets/vfx/${name}.png`, import.meta.url)).length;
    }
    assert.ok(total < 1_000_000, `as camadas pesam ${total} bytes (o celular baixa tudo no começo)`);
  });

  it('sem as folhas carregadas, as camadas não desenham (nem por cima do desenho antigo)', async () => {
    const C = await import(new URL('../public/camadasJutsus.js', import.meta.url).href);
    const fx = new J.JutsuSprites();
    const msg = { skill: 'fire_coroa', playerId: 'a', x: 0, y: 0, fx: 1, fy: 0 };
    assert.equal(C.camadasCast(fx, msg, {}, { tx: 5, ty: 0 }, 0, () => null), false);
    assert.equal(C.camadasCastStart(fx, { skill: 'fire_rugido', ms: 500 }, { id: 'a' }, 0, () => null), false);
    assert.equal(C.camadasImpact(fx, { x: 0, y: 0, r: 2 }, 'fire', 0), false);
    assert.equal(C.camadasGround(fx, { skill: 'fire_4', kind: 'aviso', x: 0, y: 0, r: 1.3, ms: 800 }, 0), false);
    assert.equal(fx.layer('pfx_fogo_anel', 0, 0, 0), false);
    assert.equal(fx.list.length, 0);
  });

  it('o jogo chama as camadas nos mesmos pontos das folhas', () => {
    const game = readFileSync(new URL('../public/game.js', import.meta.url), 'utf8');
    for (const f of ['camadasCast(', 'camadasCastStart(', 'camadasImpact(', 'camadasGround(', 'camadasMarca(', 'camadasDetona(']) assert.ok(game.includes(f), f);
  });

  it('os créditos do PixelFX (MIT) vêm junto', () => {
    assert.match(readFileSync(new URL('../arte/pixelfx/LICENSE-pixelfx', import.meta.url), 'utf8'), /MIT License/);
    assert.match(readFileSync(new URL('../public/vfxCamadas.js', import.meta.url), 'utf8'), /PixelFX .*MIT/);
  });
});

describe('v95: guia de estilo (as correções escolhidas pelo Victor, no recorte)', () => {
  const aj = JSON.parse(readFileSync(new URL('../arte/jutsus-vfx/ajustes.json', import.meta.url), 'utf8'));
  it('as silhuetas brancas lisas ganham 3 tons e contorno', () => {
    for (const k of ['taijutsu', 'taijutsu_3', 'taijutsu_4', 'taijutsu_rasteira', 'taijutsu_flecha', 'weapons_corte']) {
      assert.equal(aj[k].tons?.length, 3, k);
      assert.equal(aj[k].contorno?.length, 3, k);
    }
  });
  it('o brilho borrado fica em 2 níveis de transparência', () => {
    for (const k of ['heal', 'heal_3', 'heal_4', 'heal_disturbio', 'heal_milagre', 'heal_palma', 'lightning_2', 'lightning_armadura', 'lightning_corrente', 'lightning_fluxo', 'lightning_risco'])
      assert.equal(aj[k].alfa_niveis, 2, k);
  });
  it('o recorte aplica as correções (a folha original fica como veio)', () => {
    const src = readFileSync(new URL('../arte/jutsus-vfx/recortar.py', import.meta.url), 'utf8');
    assert.match(src, /def tonaliza\(/);
    assert.match(src, /def alfa_em_niveis\(/);
  });
});
