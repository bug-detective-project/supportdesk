# Solução: os detalhes acompanham Previous e Next

**Causa raiz.** Em `client/src/pages/TicketDetails.tsx`, o efeito que carrega o ticket tem um array de dependências vazio (`[]`). O React o executa uma vez, quando o componente é montado. Previous e Next só mudam o parâmetro de rota `:id`, então o React Router mantém o mesmo componente montado, o efeito nunca roda de novo e a tela continua com o primeiro ticket.

## Passo a passo

1. **Rode o efeito de novo quando o id mudar.** Troque o array de dependências de `[]` para `[id]`. O efeito lê `id`, então o React precisa saber disso.
2. **Ignore respostas antigas.** Com cliques rápidos, a requisição do ticket 4 pode terminar depois da requisição do ticket 5. Declare `let ignore = false;` dentro do efeito, retorne uma função de limpeza que faz `ignore = true` e só chame `setTicket` / `setLoadError` quando `ignore` ainda for `false`. O React executa a limpeza do efeito anterior antes do próximo, então só a requisição mais recente atualiza a tela.
3. **Reinicie o estado do ticket.** No início do efeito, limpe `feedback` e `loadError`, para que uma mensagem de sucesso ou um erro de "não encontrado" do ticket anterior não continue na tela. Em caso de erro, limpe também `ticket`.
4. **Adicione um teste de regressão.** A referência adiciona `client/src/pages/TicketDetails.navigation.test.tsx`: um teste clica em Next e Previous e confere o título e o id; outro segura a resposta do ticket 2, clica em Next duas vezes e confere que o ticket 3 continua na tela quando o ticket 2 finalmente chega.

Depois rode `npm test`, teste no navegador e mova o card para **In QA**.
