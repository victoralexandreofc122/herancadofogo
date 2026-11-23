/*
 * v94 (pedido do Victor, 22/11): auditoria da primeira experiência. Uma conta nova do zero, em 3 telas (celular deitado,
 * celular pequeno e computador): a entrada, o Criador de Personagem, a chegada na Academia e os painéis do menu. Em cada
 * tela: foto e o que rola (área com barra de rolagem) ou sai da tela. Regra do Victor: nada de rolagem, tudo cabe na tela;
 * o que não couber vai para uma aba própria.
 *
 * Uso: npx tsx scripts/auditar-primeira.ts <pasta de saída>   (servidor local rodando: bash scripts/ambiente-local.sh)
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const OUT = process.argv[2] ?? '/tmp/primeira';
mkdirSync(OUT, { recursive: true });
const URL_ = process.env.AUDIT_URL ?? 'http://localhost:3000';
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const VIEWS = [
  { name: 'celular', w: 844, h: 390, touch: true },
  { name: 'celular-pequeno', w: 667, h: 375, touch: true },
  { name: 'pc', w: 1366, h: 768, touch: false },
];

/** O que rola ou sai da tela agora (só o que está visível). */
function medir() {
  const vis = (el: Element) => {
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !(el as HTMLElement).closest('[hidden]') && Number(cs.opacity) > 0.05;
  };
  const nome = (el: Element) => (el.id ? '#' + el.id : el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : el.tagName.toLowerCase());
  const rola: { el: string; sobra: number }[] = [];
  const fora: { el: string; lado: string; px: number }[] = [];
  const W = innerWidth, H = innerHeight;
  for (const el of document.querySelectorAll('body *')) {
    if (!vis(el) || el.tagName === 'CANVAS' || el.id === 'chat-feed') continue;   // o chat é um registro: rola de propósito
    const cs = getComputedStyle(el);
    if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 4) rola.push({ el: nome(el), sobra: el.scrollHeight - el.clientHeight });
    if (/(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 4) rola.push({ el: nome(el) + ' (lado)', sobra: el.scrollWidth - el.clientWidth });
    // cortado sem rolar (overflow: hidden) nas caixas que deveriam caber inteiras
    if (cs.overflowY === 'hidden' && el.matches('.card, .mission-panel, .scroll-paper, .equip-panel') && el.scrollHeight > el.clientHeight + 4) rola.push({ el: nome(el) + ' (cortado)', sobra: el.scrollHeight - el.clientHeight });
    const r = el.getBoundingClientRect();
    if (cs.position === 'fixed' || cs.position === 'absolute') {
      if (r.bottom > H + 2) fora.push({ el: nome(el), lado: 'embaixo', px: Math.round(r.bottom - H) });
      if (r.right > W + 2) fora.push({ el: nome(el), lado: 'direita', px: Math.round(r.right - W) });
      if (r.top < -2 && !el.classList.contains('mm-pin')) fora.push({ el: nome(el), lado: 'em cima', px: Math.round(-r.top) });
    }
  }
  const doc = document.scrollingElement!;
  return { pagina: doc.scrollHeight > H + 2 ? doc.scrollHeight - H : 0, rola: rola.slice(0, 12), fora: fora.slice(0, 12) };
}

const br = await chromium.launch();
const rel: Record<string, Record<string, unknown>> = {};
for (const v of VIEWS) {
  rel[v.name] = {};
  const ctx = await br.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1, hasTouch: v.touch, isMobile: v.touch });
  await ctx.addInitScript('window.__name = (f) => f');
  const p = await ctx.newPage();
  p.on('pageerror', (e: Error) => console.log('ERRO:', e.message));
  const foto = async (n: string) => { await wait(600); await p.screenshot({ path: `${OUT}/${v.name}_${n}.png` }); rel[v.name]![n] = await p.evaluate(medir); };
  await p.goto(URL_); await wait(2500);
  await foto('1_entrada');
  // conta nova (a mesma tela de criar conta do jogo)
  try { await p.click('#toggle-mode', { timeout: 1500 }); } catch { try { await p.click('text=Criar conta', { timeout: 1500 }); } catch {} }
  await foto('2_criar_conta');
  const u = 'nv' + Math.random().toString(36).slice(2, 9);
  const ok = await p.evaluate(async (u) => {
    const post = async (path: string, body: unknown) => (await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).json();
    await post('/auth/register', { username: u, email: `${u}@teste.local`, password: 'Senha-teste-123' });
    const r = await post('/auth/login', { email: `${u}@teste.local`, password: 'Senha-teste-123' });
    if (!r.token) return false;
    localStorage.setItem('nin.token', r.token); return true;
  }, u);
  if (!ok) { console.log(v.name, 'não criou a conta'); continue; }
  await p.reload(); await wait(4500);
  await foto('3_criador');
  // cada aba do Criador
  for (let i = 1; i < 5; i++) {
    await p.evaluate((i) => (document.querySelectorAll('#creator-tabs .creator-tab')[i] as HTMLElement)?.click(), i);
    await foto('3_criador_aba' + i);
  }
  try { await p.click('#creator-save', { timeout: 2000 }); } catch {}
  await wait(3500);
  // a nota de atualização e os capítulos do Pergaminho do Mestre, um por um (o botão principal de cada papel)
  for (let i = 1; i <= 8; i++) {
    const aberto = await p.evaluate(() => { const o = document.querySelector('.scroll-overlay'); return !!o && !(o as HTMLElement).hidden; });
    if (!aberto) break;
    await foto('4_papel' + i);
    const ok = await p.evaluate(() => {
      const bs = [...document.querySelectorAll('.scroll-overlay .scroll-btn')] as HTMLButtonElement[];
      const b = bs.filter((x) => !x.disabled && !x.hidden && x.offsetParent).pop();
      if (!b) return false; b.click(); return true;
    });
    if (!ok) break;
    await wait(700);
  }
  await foto('5_academia');
  // os painéis do menu (cada um aberto e fechado)
  const paineis = ['inv-toggle', 'status-toggle', 'missions-toggle', 'vinculo-toggle', 'settings-toggle', 'village-toggle', 'chat-toggle', 'manual-toggle', 'feedback-toggle', 'ranked-toggle'];
  await p.evaluate(() => (document.getElementById('menu-toggle') as HTMLElement)?.click()); await wait(500);
  await foto('6_menu');
  for (const id of paineis) {
    const abriu = await p.evaluate((id) => {
      const b0 = document.getElementById(id) as HTMLElement | null;
      if (b0 && !b0.offsetParent || !document.body.classList.contains('menu-open')) (document.getElementById('menu-toggle') as HTMLElement)?.click();
      const b = document.getElementById(id) as HTMLElement | null;
      if (!b || !b.offsetParent) return false; b.click(); return true;
    }, id);
    if (!abriu) { rel[v.name]!['7_' + id] = 'sem botão'; continue; }
    await wait(500);
    await foto('7_' + id.replace('-toggle', ''));
    // as abas do painel (data-pane): cada uma tem que caber
    const abas = await p.evaluate((id) => {
      const painel = document.getElementById(id.replace('-toggle', '-panel'));
      return painel ? [...painel.querySelectorAll('.tab[data-pane], .tabs .tab')].filter((t) => (t as HTMLElement).offsetParent).length : 0;
    }, id);
    for (let i = 1; i < abas; i++) {
      await p.evaluate(([id, i]) => ([...document.getElementById(String(id).replace('-toggle', '-panel'))!.querySelectorAll('.tab[data-pane], .tabs .tab')].filter((t) => (t as HTMLElement).offsetParent)[Number(i)] as HTMLElement)?.click(), [id, i]);
      await foto('7_' + id.replace('-toggle', '') + '_aba' + i);
    }
    await p.keyboard.press('Escape'); await wait(300);
    await p.evaluate(() => {
      for (const b of document.querySelectorAll('button')) {
        const e = b as HTMLElement; const t = (e.getAttribute('aria-label') || '') + ' ' + (e.textContent || '');
        if (e.offsetParent && (/^\s*(fechar|✕|×)|\bfechar\b/i.test(t) || e.matches('.equip-close, .panel-close')) && !e.closest('#menu-grid')) e.click();
      }
    });
    await wait(300);
  }
  await ctx.close();
}
await br.close();
writeFileSync(`${OUT}/relatorio.json`, JSON.stringify(rel, null, 1));
for (const [v, telas] of Object.entries(rel)) {
  for (const [t, m] of Object.entries(telas)) {
    const x = m as any;
    if (typeof x === 'string') { console.log(v, t, x); continue; }
    if (x.pagina || x.rola.length || x.fora.length) console.log(v, t, 'página+' + x.pagina, 'rola:', x.rola.map((r: any) => `${r.el}(${r.sobra})`).join(' '), 'fora:', x.fora.map((f: any) => `${f.el} ${f.lado} ${f.px}`).join(' '));
  }
}
