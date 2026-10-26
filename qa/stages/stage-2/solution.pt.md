# Solução: a atribuição informa as falhas

**Causa raiz.** Dois problemas independentes em `client/src/pages/TicketDetails.tsx`:

1. O dropdown mostra todos os funcionários de `/api/employees`, inclusive os que têm `active: false`.
2. `handleAssigneeChange` chama `updateTicket(...)` sem `await`, ignora a `Response` e atualiza a tela e mostra a mensagem de sucesso na hora. Quando o servidor responde `422 Unprocessable Entity`, ninguém está ouvindo.

## Passo a passo

1. **Ofereça só funcionários ativos.** Calcule `const activeEmployees = employees.filter((employee) => employee.active);` e gere a lista de `<option>` a partir de `activeEmployees`. Mantenha `Unassigned` como primeira opção.
2. **Torne o handler assíncrono e espere o servidor.** Declare `async function handleAssigneeChange(...)`, guarde `ticket.id`, limpe o feedback e faça `await updateTicket(ticketId, { assignee: event.target.value })`.
3. **Verifique a resposta antes de mudar a tela.** Se `!response.ok`, leia o motivo enviado pelo servidor com `readErrorMessage(response)`, mostre-o como erro e retorne sem alterar o ticket. O `<select>` é controlado por `ticket.assigneeId`, então ele volta sozinho para o responsável anterior.
4. **Em caso de sucesso, use o que o servidor salvou.** Leia o ticket atualizado da resposta e copie `assigneeId` e `assignee` para o estado, só se o mesmo ticket ainda estiver na tela. Depois mostre a mensagem de sucesso.
5. **Trate erros de rede.** Envolva a chamada em `try/catch` e mostre uma mensagem de erro quando o próprio `fetch` falhar.
6. **Adicione testes de regressão.** A referência adiciona `client/src/pages/TicketDetails.assignment.test.tsx`: um teste confere que o dropdown lista só funcionários ativos; o outro faz o PATCH simulado retornar 422 e confere que o erro aparece, a mensagem de sucesso não aparece e o responsável anterior continua.

Depois rode `npm test`, tente atribuir Lucas Moreau no navegador (ele não deve mais aparecer) e mova o card para **In QA**.
