# Solução: o termo de busca é um parâmetro, nunca SQL

**Causa.** `listTickets` em `server/src/repository.ts` monta a consulta com uma template string: `` `... WHERE t.title LIKE '%${escapeLike(term)}%' ...` ``. O texto do usuário vira parte do SQL. O apóstrofo de `O'Brien` fecha o texto literal antes da hora, então o SQLite lê `Brien%'` como SQL e falha (`500`). Uma busca como `' OR '1'='1` é pior: muda a condição e devolve todos os tickets. Isso é SQL injection.

## Passo a passo

1. **Leia o log do servidor.** O erro é `SQLITE_ERROR: near "Brien": syntax error`, o que mostra que a entrada chegou ao texto do SQL.
2. **Passe o termo como parâmetro.** Escreva a consulta com um marcador e entregue o valor ao `.all()`:
   `.prepare(\`${selectTickets} WHERE t.title LIKE ? ESCAPE '\\' ORDER BY t.id\`).all(\`%${escapeLike(term)}%\`)`
   O banco recebe o SQL e o valor separados, então o valor nunca consegue mudar a consulta.
3. **Mantenha o escape do LIKE.** `escapeLike` continua cuidando de `%` e `_`; os parâmetros não fazem isso por você.
4. **Adicione um teste de regressão.** A referência adiciona `server/src/search-quotes.test.ts`: `O'Brien` responde `200` com uma lista vazia, e `' OR '1'='1` não devolve nenhum ticket.

Depois rode `npm test`, busque por `O'Brien` no app e mova o card para **Em QA**.
