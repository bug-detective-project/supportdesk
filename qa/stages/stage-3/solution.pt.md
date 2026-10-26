# Solução: as mudanças de prioridade são salvas

**Causa raiz.** O formulário de detalhes guarda a prioridade em um campo chamado `priorityLevel` (`TicketFormValues`). `toTicketPatch`, em `client/src/api/tickets.ts`, copia esse nome direto para o corpo da requisição, então o client envia `{ "priorityLevel": "High" }`. A API espera `{ "priority": "High" }` (veja o README). O servidor ignora campos desconhecidos, não encontra nada para mudar e responde `200` com o ticket inalterado. A interface confia no 200 e mostra o novo valor até a página ser recarregada.

## Passo a passo

1. **Confirme na aba Network.** O payload do PATCH contém `priorityLevel`, e a resposta ainda traz o `priority` antigo.
2. **Mapeie o campo do formulário para o campo da API.** Em `toTicketPatch`, troque a entrada da prioridade por
   `...(values.priorityLevel !== undefined && { priority: values.priorityLevel }),`
   Este é o único lugar onde os valores do formulário viram o corpo da API, então a correção pertence a ele. O servidor e o contrato da API continuam iguais (uma convenção do time).
3. **Adicione um teste de regressão.** A referência adiciona `client/src/pages/TicketDetails.priority.test.tsx`: ele seleciona **High** e confere que o corpo da requisição PATCH é exatamente `{ priority: 'High' }`.

Depois rode `npm test`, mude uma prioridade no navegador, recarregue a página e mova o card para **In QA**.
