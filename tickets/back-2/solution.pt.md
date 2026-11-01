# Solução: os tickets sem responsável voltam para a lista

**Causa.** `selectTickets` em `server/src/repository.ts` junta a tabela de funcionários com `JOIN employees e ON e.id = t.assigneeId`. Um `JOIN` simples é um `INNER JOIN`: ele só mantém as linhas que têm par dos dois lados. Um ticket com `assigneeId` null não tem funcionário correspondente, então a lista o pula, `findTicket` não encontra nada (404), e tirar o responsável de um ticket faz ele sumir.

## Passo a passo

1. **Encontre o padrão.** Compare `GET /api/tickets` com os ids de 1 a 15: todo ticket que falta tem `assigneeId: null`.
2. **Mantenha os tickets sem par.** Troque a junção por `LEFT JOIN employees e ON e.id = t.assigneeId`. Um `LEFT JOIN` mantém todos os tickets e preenche as colunas do funcionário com `NULL` quando não há responsável; `toTicket` já transforma isso em `assignee: null`.
3. **Adicione um teste de regressão.** A referência adiciona `server/src/unassigned.test.ts`: a lista tem os 15 tickets, inclusive os sem responsável, um ticket sem responsável abre pelo id, e tirar o responsável devolve `assignee: null`.

Depois rode `npm test`, tire o responsável de um ticket no app, confira que ele continua na lista e mova o card para **Em QA**.
