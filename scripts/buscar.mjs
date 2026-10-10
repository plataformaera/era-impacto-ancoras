// Busca as âncoras novas na função pública do ERA Impacto e grava uma por arquivo. Só leitura, chave pública (anon).
import { existsSync, readFileSync, writeFileSync, appendFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const URL = 'https://adplglmnnmnafuxoicwf.supabase.co/rest/v1/rpc/era_impacto_ancora_publica';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkcGxnbG1ubm1uYWZ1eG9pY3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MzIxODUsImV4cCI6MjEwNTQwODE4NX0.j7muN_gupGCU0hWx2vyZ9WA9GbwHLhMh50uwsmOjhg0';
const pedir = async (seq) => {
  const r = await fetch(URL, { method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_seq: seq }) });
  if (!r.ok) { console.log(`a função pública respondeu HTTP ${r.status}`); return null; }
  return r.json();
};
const nome = (seq) => `ancoras/${String(seq).padStart(6, '0')}.json`;
const ultima = await pedir(null);
if (!ultima?.seq) { console.log('nenhuma âncora publicada ainda'); process.exit(0); }
const gravadas = readdirSync('ancoras').filter((f) => /^\d{6}\.json$/.test(f)).map((f) => Number(f.slice(0, 6)));
const desde = gravadas.length ? Math.max(...gravadas) + 1 : 1;
let novas = 0;
for (let seq = desde; seq <= Number(ultima.seq); seq += 1) {
  const a = seq === Number(ultima.seq) ? ultima : await pedir(seq);
  if (!a?.seq) continue;
  const texto = JSON.stringify(a, null, 1) + '\n';
  writeFileSync(nome(seq), texto);
  appendFileSync('ancoras.jsonl', JSON.stringify({ seq: a.seq, quando: a.quando, raiz_encadeada: a.raiz_encadeada,
    sha256_do_arquivo: createHash('sha256').update(texto).digest('hex') }) + '\n');
  novas += 1;
}
// carimbos que ficaram completos depois (confirmação no Bitcoin): regrava o arquivo da âncora com as provas novas
for (const seq of gravadas.slice(-48)) {
  const a = await pedir(seq);
  if (!a?.seq || !existsSync(nome(seq))) continue;
  const antes = JSON.parse(readFileSync(nome(seq), 'utf8'));
  if (a.raiz_encadeada !== antes.raiz_encadeada) { console.error(`a âncora ${seq} publicada agora difere da gravada: conferir`); process.exit(1); }
  if ((a.provas || []).length > (antes.provas || []).length) writeFileSync(nome(seq), JSON.stringify(a, null, 1) + '\n');
}
console.log(`${novas} âncora(s) nova(s)`);
