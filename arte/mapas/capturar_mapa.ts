/**
 * Fotografa um mapa no jogo (servidor local de scripts/ambiente-local.sh, ninja admin 'rin').
 *
 *   set -a; . /var/tmp/jogo.env; set +a
 *   npx tsx arte/mapas/capturar_mapa.ts <saida.png> <mapa> <x> <y> [clima] [hora]
 *
 * clima: normal | chuva | neblina | quente; hora: amanhecer | dia | entardecer | noite (comandos /admin do jogo).
 */
import pg from 'pg';
import { createRequire } from 'node:module';
import { makeTokenIssuer } from '../../src/auth/issueToken.js';
const { chromium } = createRequire(import.meta.url)('playwright');

const [saida, mapa = 'map_1', x = '38', y = '30', clima = 'normal', hora = 'dia'] = process.argv.slice(2);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const issue = makeTokenIssuer({ secret: process.env.JWT_SECRET! });
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const id = (await db.query(`SELECT id FROM game.players WHERE username = 'rin'`)).rows[0]?.id;
await db.end();
const { token } = await issue(id);
const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 1100, height: 620 }, deviceScaleFactor: 1 });
await ctx.addInitScript('window.__name = (f) => f');
await ctx.addInitScript(`localStorage.setItem('nin.token', ${JSON.stringify(token)});`);
const p = await ctx.newPage();
p.on('pageerror', (e: Error) => console.log('ERRO no jogo:', e.message));
if (process.env.CONSOLE) p.on('console', (m) => console.log('console:', m.text()));
await p.goto(`http://localhost:${process.env.PORT ?? 3000}`);
await wait(4500);
for (const sel of ['text=Começar a jogar', 'text=Entendi', 'text=Fechar (já entendi)', 'text=Guardar']) { try { await p.click(sel, { timeout: 800 }); } catch { /* sem aviso */ } }
const cmd = async (c: string) => {
  if (!(await p.isVisible('#chat-input'))) await p.evaluate(() => (document.getElementById('chat-open') as HTMLElement)?.click());
  await p.fill('#chat-input', c);
  await p.press('#chat-input', 'Enter');
  await wait(600);
};
await cmd(`/admin ir ${mapa} ${x} ${y}`);
await cmd(`/admin clima ${clima} 10`);
await cmd(`/admin hora ${hora}`);
await p.evaluate(() => (document.getElementById('history-close') as HTMLElement)?.click());
await p.evaluate(() => (document.activeElement as HTMLElement)?.blur());
await p.keyboard.press('Escape');
for (const sel of ['text=Entendi', 'text=Fechar (já entendi)']) { try { await p.click(sel, { timeout: 500 }); } catch { /* sem aviso */ } }
if (!process.env.COM_HUD) await p.evaluate(() => document.querySelectorAll('body > :not(#game)').forEach((e) => { (e as HTMLElement).style.visibility = 'hidden'; }));
await wait(3500);
if (process.env.CONSOLE) console.log(await p.evaluate(() => JSON.stringify((window as any).__dbgSky ?? null)));
await p.screenshot({ path: saida });
await br.close();
console.log('ok', saida);
