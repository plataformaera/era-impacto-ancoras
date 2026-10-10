# ERA Impacto · log público das âncoras da prova

Este repositório guarda, fora do banco da Plataforma ERA, cada âncora da prova do ERA Impacto. A cada hora o banco junta
toda prova nova (eventos de custódia, decisões emitidas, relatórios aprovados, laudos, eventos da decisão e chamadas de
IA), calcula a raiz de Merkle e a encadeia à anterior. A raiz encadeada vai ao OpenTimestamps (Bitcoin) e fica gravada
aqui, num commit por âncora.

Quem reescrever uma prova por dentro do banco muda a raiz; a raiz antiga já está aqui, no histórico do git, e no Bitcoin.

## Arquivos

- `ancoras/NNNNNN.json`: a âncora como a função pública `era_impacto_ancora_publica` devolve (só hashes, nenhum
  conteúdo, nenhum dado pessoal), com os carimbos OpenTimestamps.
- `ancoras.jsonl`: uma linha por âncora (número, hora, raiz encadeada, sha256 do arquivo).

## Conferir

Com o verificador aberto da Plataforma ERA (`scripts/impacto-verificar` no repositório da plataforma):

```bash
node scripts/impacto-verificar/verificar.mjs --arquivo ancoras/000012.json --anterior ancoras/000011.json --rede
```

A atualização roda sozinha pelo GitHub Actions (`.github/workflows/ancoras.yml`), a cada hora, só lendo a função
pública. Contato: contato@plataformaera.com.
