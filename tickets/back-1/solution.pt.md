# Solução: % e _ são buscados como texto

**Causa.** `listTickets` em `server/src/repository.ts` monta o padrão do `LIKE` como `%${term}%` sem escapar o termo, e a consulta não tem cláusula `ESCAPE`. No SQL, `%` encontra qualquer sequência e `_` qualquer caractere, então uma busca por `%` vira `%%%` e encontra todos os títulos.

## Passo a passo

1. **Confirme na API.** `GET /api/tickets?search=%25` devolve todos os tickets; o client só mostra o que a API envia.
2. **Escape o texto do usuário.** Crie uma função que coloca uma barra invertida antes de `\`, `%` e `_`:
   `value.replace(/[\\%_]/g, (char) => \`\\${char}\`)`
3. **Diga ao SQLite qual caractere de escape você usou.** A consulta fica
   `WHERE t.title LIKE ? ESCAPE '\' ORDER BY t.id` com `` `%${escapeLike(term)}%` `` como parâmetro. O termo continua sendo parâmetro: nunca coloque o termo no texto do SQL.
4. **Adicione um teste de regressão.** A referência adiciona `server/src/search.test.ts`: `%`, `t_f`, `100%` e `report_final` encontram só os títulos que os contêm.

Depois rode `npm test`, busque por `%` e `_` no app e mova o card para **Em QA**.
