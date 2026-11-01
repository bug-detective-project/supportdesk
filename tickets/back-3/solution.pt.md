# Solução: só os status e as prioridades oficiais são salvos

**Causa.** `isOneOf` em `server/src/routes/tickets.ts` foi alterado para comparar sem diferenciar maiúsculas, então `"closed"` passa na conferência. Depois `parseChanges` salva `input.status` exatamente como chegou. A validação e o valor salvo deixaram de concordar: a conferência aceita `closed`, o banco guarda `closed`, e toda parte do app que espera `Closed` quebra.

## Passo a passo

1. **Reproduza pela API.** `PATCH /api/tickets/3` com `{"status":"closed"}` responde `200`, e `GET /api/tickets/3` mostra `"status": "closed"`.
2. **Deixe a conferência exata de novo.** `isOneOf` volta a ser `values.includes(value)`. O contrato da API no README lista os valores exatos, e as convenções do time dizem para não mudar a API. Uma requisição com `"closed"` agora recebe `400`, como qualquer outro valor inválido.
3. **Adicione um teste de regressão.** A referência adiciona `server/src/validation.test.ts`: depois de um `PATCH` com `"closed"` ou `"low"`, o valor salvo continua sendo um dos oficiais, e a resposta é `400` ou a grafia oficial.

(Salvar o valor oficial que bateu, por exemplo `Closed` para `closed`, também passa nas verificações. A referência mantém a API rígida, para que os clients descubram o próprio erro.)

Depois rode `npm test`, repita a requisição com `curl` e mova o card para **Em QA**.
