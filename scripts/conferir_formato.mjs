// Confere que o log público só tem o formato permitido: número da âncora, data, hashes e carimbos OpenTimestamps.
// Qualquer outro campo, ou hash fora do padrão, reprova (governança do GitHub, 10/10/2026). Sem dependências.
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const HEX64 = /^[0-9a-f]{64}$/;
const DATA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const CAMPOS = new Set(['seq', 'quando', 'n_folhas', 'raiz', 'anterior', 'raiz_encadeada', 'folhas_nivel0', 'regra', 'provas']);
const CAMPOS_PROVA = new Set(['calendario', 'tipo', 'bloco', 'ots_base64', 'quando']);
const CAMPOS_LINHA = new Set(['seq', 'quando', 'raiz_encadeada', 'sha256_do_arquivo']);
const problemas = [];
const fora = (obj, permitidos, onde) => Object.keys(obj).filter((k) => !permitidos.has(k)).forEach((k) => problemas.push(`${onde}: campo fora do formato: ${k}`));

const pasta = 'ancoras';
const arquivos = existsSync(pasta) ? readdirSync(pasta).filter((n) => n.endsWith('.json')) : [];
for (const nome of arquivos) {
  const onde = `${pasta}/${nome}`;
  if (!/^\d{6}\.json$/.test(nome)) problemas.push(`${onde}: nome fora do padrão NNNNNN.json`);
  const a = JSON.parse(readFileSync(onde, 'utf8'));
  fora(a, CAMPOS, onde);
  if (!Number.isInteger(a.seq)) problemas.push(`${onde}: seq não é inteiro`);
  if (!DATA.test(String(a.quando))) problemas.push(`${onde}: data fora do padrão`);
  for (const k of ['raiz', 'raiz_encadeada']) if (!HEX64.test(String(a[k]))) problemas.push(`${onde}: ${k} não é sha256`);
  if (a.anterior !== '' && !HEX64.test(String(a.anterior))) problemas.push(`${onde}: anterior não é sha256`);
  (a.folhas_nivel0 || []).forEach((h, i) => { if (!HEX64.test(String(h))) problemas.push(`${onde}: folha ${i} não é sha256`); });
  (a.provas || []).forEach((p, i) => {
    fora(p, CAMPOS_PROVA, `${onde} prova ${i}`);
    if (!/^https:\/\/[a-z0-9.-]+(\/|$)/.test(String(p.calendario))) problemas.push(`${onde} prova ${i}: calendário fora do padrão`);
    if (!/^[A-Za-z0-9+/=]+$/.test(String(p.ots_base64))) problemas.push(`${onde} prova ${i}: carimbo não é base64`);
  });
}
if (existsSync('ancoras.jsonl')) {
  readFileSync('ancoras.jsonl', 'utf8').split('\n').filter(Boolean).forEach((l, i) => {
    const o = JSON.parse(l);
    fora(o, CAMPOS_LINHA, `ancoras.jsonl linha ${i + 1}`);
    if (!HEX64.test(String(o.raiz_encadeada)) || !HEX64.test(String(o.sha256_do_arquivo))) problemas.push(`ancoras.jsonl linha ${i + 1}: hash fora do padrão`);
  });
}
if (problemas.length) { problemas.forEach((p) => console.log(`✗ ${p}`)); process.exit(1); }
console.log(`✓ formato conferido: ${arquivos.length} âncora(s), só número, data, hashes e carimbos`);
