# Solução: tickets sem responsável voltam a abrir

**Causa raiz.** Uma mudança recente colocou o responsável no cabeçalho do ticket em `client/src/pages/TicketDetails.tsx`, ao lado das tags de status e prioridade, com um avatar das iniciais. O código lê `ticket.assignee.name` direto. Para tickets sem responsável, a API retorna `"assignee": null`, então a renderização lança `TypeError: Cannot read properties of null (reading 'name')`. Um erro lançado durante a renderização desmonta toda a árvore do React, e sobra uma página em branco. O tipo `Ticket` em `client/src/api/tickets.ts` declara `assignee: Employee` (não anulável), então o verificador de tipos não tinha como pegar.

## Passo a passo

1. **Reproduza no Console.** Abra o ticket #4 e leia o `TypeError` e o componente no stack trace.
2. **Faça o tipo dizer a verdade.** Em `client/src/api/tickets.ts`, troque `assignee: Employee;` por `assignee: Employee | null;`. Agora o `npm run build` (ou o seu editor) aponta todos os lugares que supõem que existe um responsável.
3. **Renderize os dois casos.** No cabeçalho, faça o que a lista de tickets já faz: quando `ticket.assignee` existir, mostre o avatar com `getInitials(ticket.assignee.name)` (classe `avatar-user`); senão, mostre `?` (classe `avatar-unassigned`). Para o nome, use o componente `AssigneeName`, que já mostra **Unassigned** para `null`.
4. **Adicione testes de regressão.** A referência adiciona `client/src/pages/TicketDetails.unassigned.test.tsx`: um teste abre um ticket sem responsável e confere que os detalhes aparecem com "Unassigned"; o outro remove o responsável de um ticket e confere que a página continua visível.

Depois rode `npm test`, abra o ticket #4, remova o responsável do ticket #3 e mova o card para **In QA**.
