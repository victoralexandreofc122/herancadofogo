import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { describe, it } from 'node:test';
import Fastify from 'fastify';
import { EFFECT_CODES } from '../src/realtime/effects.js';
import { MUSIC_TRACKS, byteRange, loadPublicFiles, registerStaticFiles } from '../src/web/staticFiles.js';

/* v57: áudio (músicas em MP3 servidas com Range; efeitos sintetizados no cliente, public/audio.js). */
const A = await import(new URL('../public/audio.js', import.meta.url).href);

describe('v57: músicas', () => {
  it('toda faixa usada pelo cliente existe, é servida e é leve (MP3 sem capa)', () => {
    const used = new Set(Object.values<string[]>(A.MUSIC).flat());
    assert.deepEqual([...used].sort(), [...MUSIC_TRACKS].sort());
    for (const n of MUSIC_TRACKS) {
      const f = new URL(`../public/assets/audio/${n}.mp3`, import.meta.url);
      assert.ok(existsSync(f), n);
      assert.ok(statSync(f).size < 3_500_000, `${n}: ${statSync(f).size} bytes`);
    }
    const routes = new Set(loadPublicFiles().map((f) => f.route));
    assert.ok(routes.has('/audio.js'));
    for (const n of MUSIC_TRACKS) assert.ok(routes.has(`/assets/audio/${n}.mp3`), n);
  });

  it('cidade, arena, chefe e lugar tenso têm música; vitória e derrota também', () => {
    for (const mood of ['calma', 'pvp', 'boss', 'misterio', 'vitoria', 'derrota']) assert.ok(A.MUSIC[mood]?.length >= 1, mood);
    assert.equal(A.MUSIC.calma.length, 2, 'as duas calmas revezam');
  });

  it('volumes padrão: música 40%, efeitos 60%, sem mudo; os efeitos pedidos existem', () => {
    assert.deepEqual(A.DEFAULT_AUDIO, { music: 40, sfx: 60, mute: false });
    for (const k of ['slash', 'punch', 'thud', 'charge', 'seal', 'cast', 'impact', 'fly', 'step', 'blip', 'levelup', 'death',
      'teleport', 'substitution', 'notify', 'announce', 'coins', 'burning', 'status', 'slime', 'boss_roar', 'warn']) assert.ok(A.SFX_KINDS.includes(k), k);
  });

  it('v58: cada elemento tem som próprio de lançamento, voo e impacto; cada estado tem o seu', () => {
    const { CAST, IMPACT, STATUS, FLY } = A.SOUND_TABLES;
    for (const el of ['fire', 'water', 'lightning', 'wind', 'stone', 'shadow', 'illusion', 'heal', 'taijutsu', 'weapons']) {
      assert.equal(typeof CAST[el], 'function', `lançamento ${el}`);
      assert.equal(typeof IMPACT[el], 'function', `impacto ${el}`);
      assert.ok(CAST[el] !== CAST.neutral && IMPACT[el] !== IMPACT.neutral, el);
    }
    for (const el of ['fire', 'water', 'lightning', 'wind', 'stone', 'shadow', 'illusion', 'weapons']) assert.ok(FLY[el], `voo ${el}`);
    for (const code of EFFECT_CODES) assert.equal(typeof STATUS[code], 'function', `estado ${code}`);
  });

  it('antes do primeiro toque nada toca (sem contexto de áudio)', () => {
    const a = new A.AudioManager();
    assert.equal(a.unlocked, false);
    assert.equal(a.sfx('slash'), null);
    a.setMood('pvp');
    assert.equal(a.current, null);
  });
});

/** v103: um contexto de áudio de mentira (só o que o AudioManager usa), para ver o que liga, desliga e quantos nós cria. */
function fakeCtx() {
  const node = (extra: Record<string, unknown> = {}) => ({ connect: (n: unknown) => n, start() {}, stop() {}, ...extra });
  const param = () => ({ value: 0, setValueAtTime() {}, setTargetAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} });
  const ctx = {
    state: 'running', currentTime: 0, sampleRate: 44100, criados: 0, suspensos: 0,
    destination: {},
    resume() { ctx.state = 'running'; return Promise.resolve(); },
    suspend() { ctx.state = 'suspended'; ctx.suspensos += 1; return Promise.resolve(); },
    createGain() { ctx.criados += 1; return node({ gain: param() }); },
    createBufferSource() { ctx.criados += 1; return node({ buffer: null, playbackRate: param(), loop: false }); },
    createBiquadFilter() { ctx.criados += 1; return node({ frequency: param(), Q: param(), type: '' }); },
    createOscillator() { ctx.criados += 1; return node({ frequency: param(), detune: param(), type: '' }); },
    createDynamicsCompressor() { return node({ threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() }); },
    createBuffer(_c: number, n: number) { return { length: n, getChannelData: () => new Float32Array(n), copyToChannel() {} }; },
  };
  return ctx;
}
function comFake() {
  const a = new A.AudioManager();
  const ctx = fakeCtx();
  a.ctx = ctx; a.master = ctx.createGain(); a.musicBus = ctx.createGain(); a.sfxBus = ctx.createGain(); a.noise = ctx.createBuffer(1, 10);
  return { a, ctx };
}

describe('v103: o áudio não esquenta o celular', () => {
  it('50 ms de margem (o padrão de 10 ms acorda o processador o tempo todo)', async () => {
    const src = (await import('node:fs')).readFileSync(new URL('../public/audio.js', import.meta.url), 'utf8');
    assert.match(src, /const LATENCIA_S = 0\.05;/);
    assert.match(src, /new AC\(\{ latencyHint: LATENCIA_S \}\)/);
  });
  it('mudo (ou tudo no zero): a música pausa e o áudio desliga', () => {
    const { a, ctx } = comFake();
    a.settings = { music: 40, sfx: 60, mute: false };
    a.setMute(true);
    assert.equal(ctx.state, 'suspended');
    a.setMute(false);
    assert.equal(ctx.state, 'running');
    a.settings.mute = false;
    a.setVolume('music', 0); a.setVolume('sfx', 0);
    assert.equal(ctx.state, 'suspended');
    assert.equal(a.sfx('slash'), null, 'efeitos no zero: nada toca');
  });
  it('música no zero: o efeito religa o áudio e ele desliga sozinho depois', async () => {
    const { a, ctx } = comFake();
    a.settings = { music: 0, sfx: 60, mute: false };
    ctx.state = 'suspended';
    a.sfx('slash');
    assert.equal(ctx.state, 'running', 'o efeito religou');
    assert.ok(a.desligaTimer, 'com o desligar marcado');
    clearTimeout(a.desligaTimer);
  });
  it('o efeito gravado toca com 2 nós (fonte e volume); os longos (selos, voo) seguem ao vivo', () => {
    const { a, ctx } = comFake();
    a.settings = { music: 40, sfx: 60, mute: false };
    a.gravacoes.set('slash|||0||', { buffers: [{ length: 10 }], gravando: false });
    a.gravacoes.get('slash|||0||')!.buffers.push({ length: 10 }, { length: 10 });
    const antes = ctx.criados;
    a.sfx('slash');
    assert.equal(ctx.criados - antes, 2);
    const vivo = ctx.criados;
    a.sfx('cast', 1, { el: 'fire' });                 // ainda sem gravação: toca ao vivo (e grava em segundo plano, se puder)
    assert.ok(ctx.criados - vivo > 10, 'ao vivo, dezenas de nós');
  });
});

describe('v57: Range (o Safari do iPhone só toca áudio com 206)', () => {
  it('byteRange', () => {
    assert.equal(byteRange(undefined, 100), undefined);
    assert.deepEqual(byteRange('bytes=0-', 100), [0, 99]);
    assert.deepEqual(byteRange('bytes=0-1', 100), [0, 1]);
    assert.deepEqual(byteRange('bytes=90-500', 100), [90, 99]);
    assert.deepEqual(byteRange('bytes=-10', 100), [90, 99]);
    assert.equal(byteRange('bytes=100-', 100), 'bad');
    assert.equal(byteRange('bytes=0-1,5-6', 100), undefined);
  });

  it('o servidor responde 206 com o pedaço certo; sem Range, o arquivo todo; texto não muda', async () => {
    const app = Fastify();
    registerStaticFiles(app, [
      { route: '/m.mp3', body: Buffer.from('0123456789'), contentType: 'audio/mpeg', etag: '"x"' },
      { route: '/t.js', body: 'abc', contentType: 'text/javascript', etag: '"y"' },
    ]);
    const part = await app.inject({ url: '/m.mp3', headers: { range: 'bytes=2-4' } });
    assert.equal(part.statusCode, 206);
    assert.equal(part.body, '234');
    assert.equal(part.headers['content-range'], 'bytes 2-4/10');
    assert.equal(part.headers['accept-ranges'], 'bytes');
    assert.equal((await app.inject({ url: '/m.mp3' })).body, '0123456789');
    assert.equal((await app.inject({ url: '/m.mp3', headers: { range: 'bytes=20-' } })).statusCode, 416);
    assert.equal((await app.inject({ url: '/t.js', headers: { range: 'bytes=0-0' } })).statusCode, 200);
    await app.close();
  });
});
