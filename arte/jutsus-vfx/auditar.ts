/*
 * v85: auditoria de hitbox: o tamanho que a arte tem na tela x a área que o servidor acerta.
 *
 *   AUDITAR=1 npx tsx arte/jutsus-vfx/capturar.ts <pasta>       # roda os planos, registra cada quadro (auditoria.json)
 *   npx tsx arte/jutsus-vfx/auditar.ts <pasta>/auditoria.json    # compara e escreve auditoria-hitbox.md na pasta
 *
 * Para os jutsus de área (zona, anel, aviso, meteoros, transformação) o raio da arte é metade da largura do maior quadro
 * do próprio jutsu que fica parado no ponto (sem esticar nem apontar), já com a escala e o crescimento. Fica "casado" de
 * 75% a 135% do raio do servidor: abaixo, a arte é menor que o dano (o jogador leva dano "de longe"); acima, a arte
 * promete mais do que acerta.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { JUTSUS } from '../../src/realtime/jutsus.js';

const arq = process.argv[2];
if (!arq) throw new Error('uso: npx tsx arte/jutsus-vfx/auditar.ts <pasta>/auditoria.json');
const LOG: Record<string, Array<{ name: string; scale: number; grow: number; len: number; casas: number; eixo: boolean; arte: boolean }>> = JSON.parse(readFileSync(arq, 'utf8'));
const AREA = new Set(['zona', 'anel_golpe', 'aviso', 'meteoros', 'transformacao', 'aviso_em_volta', 'nuvem_detona']);
const linhas: string[] = [];
const fora: string[] = [];
for (const j of JUTSUS as any[]) {
  const log = LOG[j.code];
  if (!log) continue;
  const n = j.numbers ?? {};
  // nos meteoros cada pedra acerta 1,3 casa (warnStrike r: 1.3); o Céu de Lâminas desenha a área inteira numa folha só
  const raio = j.form === 'meteoros' && j.code !== 'weapons_ceu' ? 1.3 : n.zone?.r ?? n.radius;
  if (!AREA.has(j.form) || !raio) continue;
  const proprios = log.filter((e) => e.name.startsWith(j.code + '_0') && !e.len && !e.eixo && !e.arte);
  if (!proprios.length) { linhas.push(`| ${j.name} | ${j.form} | ${raio} | (sem quadro parado) | |`); continue; }
  const r = Math.max(...proprios.map((e) => (e.casas * e.scale * (1 + Math.max(0, e.grow))) / 2));
  const k = r / raio;
  const ok = k >= 0.75 && k <= 1.35;
  const nota = ok ? 'casado' : k < 0.75 ? 'arte MENOR que o dano' : 'arte MAIOR que o dano';
  if (!ok) fora.push(j.code);
  linhas.push(`| ${j.name} (\`${j.code}\`) | ${j.form} | ${raio} | ${r.toFixed(2)} | ${Math.round(k * 100)}% ${nota} |`);
}
const md = ['# Auditoria de hitbox (arte x área do servidor)', '', `Fora da faixa (75% a 135%): ${fora.length}`, '',
  '| Jutsu | Forma | Raio do servidor (casas) | Raio da arte (casas) | Arte / dano |', '|---|---|---|---|---|', ...linhas, ''].join('\n');
writeFileSync(join(dirname(arq), 'auditoria-hitbox.md'), md);
console.log(md);
console.log(JSON.stringify(fora));
