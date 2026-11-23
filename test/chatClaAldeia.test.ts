import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { CHAT_SQL, memoryChatLog } from '../src/realtime/chatLog.js';
import { REALTIME, type RealtimeConfig } from '../src/realtime/config.js';
import { GameWorld, type JoiningPlayer } from '../src/realtime/gameWorld.js';
import { FakeConn, seededRandom } from './support/world.js';

const flush = () => new Promise((resolve) => setImmediate(resolve));
const config: RealtimeConfig = { ...REALTIME, combat: { ...REALTIME.combat, monsters: { ...REALTIME.combat.monsters, count: 0, stepMs: 1e12 } } };

function setup() {
  let t = 1_000_000;
  const world = new GameWorld(config, () => t, undefined, { random: seededRandom(), chatLog: memoryChatLog(() => t) });
  const join = (username: string, extra: Partial<JoiningPlayer> = {}) => {
    const conn = new FakeConn();
    const id = extra.id ?? randomUUID();
    const handle = world.join({ id, username, ...extra }, conn);
    return { id, conn, send: (m: unknown) => handle.receive(JSON.stringify(m)) };
  };
  const sess = (id: string) => (world as any).sessions.get(id);
  return { join, sess, advance: (ms: number) => { t += ms; } };
}

describe('v102 (decisões do Victor, 23/11): o chat do clã (a linhagem) e o da aldeia (só o Kage manda)', () => {
  it('/c vai para todos da mesma linhagem online (a marcada no Criador já vale), em qualquer mapa', () => {
    const { join } = setup();
    const a = join('kaito', { clan: 'rubro' });
    const b = join('mei', { clanMark: 'rubro' });
    const c = join('rin', { clan: 'umbra' });
    a.send({ type: 'chat', message: '/c caça no rio?' });
    const m = { type: 'chat', playerId: a.id, username: 'kaito', message: 'caça no rio?', channel: 'cla' };
    assert.deepEqual(b.conn.last('chat'), m);
    assert.deepEqual(a.conn.last('chat'), m, 'quem mandou também vê');
    assert.equal(c.conn.of('chat').length, 0, 'outra linhagem não recebe');
  });

  it('sem linhagem: o aviso, nada enviado', () => {
    const { join } = setup();
    const a = join('kaito');
    a.send({ type: 'chat', message: '/c oi' });
    assert.match(a.conn.last('notice').text, /ainda não tem linhagem/);
    assert.equal(a.conn.of('chat').length, 0);
  });

  it('/a: só o Kage da aldeia manda, e todos da mesma aldeia online recebem', () => {
    const { join, sess, advance } = setup();
    const kage = join('kaito');
    const mei = join('mei');
    const rin = join('rin');
    sess(kage.id).village = 'vila_1'; sess(kage.id).kageOf = 'vila_1';
    sess(mei.id).village = 'vila_1';
    sess(rin.id).village = 'vila_3';
    mei.send({ type: 'chat', message: '/a todos aqui!' });
    assert.match(mei.conn.last('notice').text, /Só o Kage/);
    assert.equal(kage.conn.of('chat').length, 0);
    advance(1000);
    kage.send({ type: 'chat', message: '/a reunião na praça' });
    assert.deepEqual(mei.conn.last('chat'), { type: 'chat', playerId: kage.id, username: 'kaito', message: 'reunião na praça', channel: 'aldeia' });
    assert.equal(rin.conn.of('chat').length, 0, 'outra aldeia não recebe');
  });

  it('o histórico traz o clã e a aldeia de quem pede (e não os dos outros)', async () => {
    const { join, sess } = setup();
    const kage = join('kaito', { clan: 'rubro' });
    sess(kage.id).village = 'vila_1'; sess(kage.id).kageOf = 'vila_1';
    kage.send({ type: 'chat', message: '/c só o clã' });
    await flush();
    const novo = join('mei', { clan: 'rubro' });
    const outro = join('rin', { clan: 'umbra' });
    await flush();
    assert.deepEqual(novo.conn.last('chat_history').messages.map((m: any) => [m.channel, m.message]), [['cla', 'só o clã']]);
    assert.deepEqual(outro.conn.last('chat_history').messages, []);
  });

  it('a migração v41 (pode rodar de novo, sem DO $$) e o histórico que segue funcionando sem ela', () => {
    const sql = readFileSync(new URL('../db/schema_v41_chat_cla_aldeia.sql', import.meta.url), 'utf8');
    assert.match(sql, /BEGIN;[\s\S]*COMMIT;/);
    assert.ok(!/DO \$\$/.test(sql));
    assert.match(sql, /ADD COLUMN IF NOT EXISTS escopo text/);
    assert.match(sql, /CHECK \(channel IN \('local', 'global', 'whisper', 'cla', 'aldeia'\)\)/);
    assert.match(sql, /DROP CONSTRAINT IF EXISTS ck_chat_logs_escopo/);
    assert.match(CHAT_SQL.historyScoped, /channel = 'cla' AND escopo = \$4/);
    const src = readFileSync(new URL('../src/realtime/chatLog.ts', import.meta.url), 'utf8');
    assert.match(src, /code !== '42703'/, 'sem a v41, cai no histórico de antes');
  });
});
