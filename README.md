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

## O que pode entrar aqui

Só número da âncora, data, hashes sha256 e carimbos OpenTimestamps. Cada arquivo `ancoras/NNNNNN.json` tem apenas estes
campos: `seq`, `quando`, `n_folhas`, `raiz`, `anterior`, `raiz_encadeada`, `folhas_nivel0` (hashes de nível 0), `regra` e
`provas` (`calendario`, `tipo`, `bloco`, `ots_base64`, `quando`). O texto de cada folha (número cego, protocolo, conteúdo)
fica no banco; aqui chega só o hash dele. Nenhum nome de cliente, território, coordenada de ponto de coleta ou dado
pessoal entra neste repositório.

O script `scripts/conferir_formato.mjs` confere esse formato antes de cada gravação e em todo pull request; campo fora
da lista ou hash fora do padrão reprova.

## Conferir de forma independente pelo OpenTimestamps

Sem depender da Plataforma ERA, com o cliente oficial do OpenTimestamps (`pip install opentimestamps-client`):

```bash
jq -r '.provas[0].ots_base64' ancoras/000012.json | base64 -d > ancora-000012.ots
ots info ancora-000012.ots
ots verify -d "$(jq -r .raiz_encadeada ancoras/000012.json)" ancora-000012.ots
```

`ots info` mostra o caminho do carimbo até o bloco do Bitcoin; `ots verify` confere o carimbo contra o resumo, que é a
raiz encadeada da âncora (com um nó do Bitcoin à mão, a conferência vai até o cabeçalho do bloco). A raiz encadeada
se refaz a partir das folhas: nível 0 = sha256(0x00 || folha), nó = sha256(0x01 || esquerda || direita), com número
ímpar o último sobe inteiro, e raiz encadeada = sha256(anterior em hex || raiz em hex).

## Conferir com o verificador aberto

Com o verificador aberto da Plataforma ERA (`scripts/impacto-verificar` no repositório da plataforma):

```bash
node scripts/impacto-verificar/verificar.mjs --arquivo ancoras/000012.json --anterior ancoras/000011.json --rede
```

A atualização roda sozinha pelo GitHub Actions (`.github/workflows/ancoras.yml`), a cada hora, só lendo a função
pública. Contato: contato@plataformaera.com.
