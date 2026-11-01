# SD-263: Status como "closed" são salvos e quebram a página do ticket

| Campo | Valor |
| --- | --- |
| Projeto | SupportDesk (SD) |
| Tipo de item | Bug |
| Status | A fazer |
| Prioridade | Alta |
| Relator | Marcus Bell (Gerente de operações de suporte) |
| Responsável | Não atribuído |
| Versão afetada | 1.7 |
| Componente | Atualização de tickets (API) |
| Rótulos | `qualidade-de-dados`, `api`, `automacao` |
| Sprint | SD Sprint 46 |
| Criado em | 06/11/2026 14:40 |

## Descrição

A nossa automação noturna fecha os tickets resolvidos pela API. Ontem à noite ela enviou `"status": "closed"` (em minúsculas), e a API aceitou. Agora esses tickets mostram um status vazio na página de detalhes, o filtro de status dos nossos relatórios pula todos eles, e os atendentes não sabem se estão abertos ou fechados.

O mesmo acontece com as prioridades: `"priority": "low"` é aceito e salvo como `low`. Valores totalmente errados, como `"Urgent"`, continuam sendo recusados.

## Passos para reproduzir

1. `curl -X PATCH http://localhost:3001/api/tickets/3 -H "Content-Type: application/json" -d '{"status":"closed"}'`
2. Abra o ticket #3 no app.

## Resultado esperado

O status de um ticket é sempre `Open`, `In Progress` ou `Closed`, exatamente como o contrato da API no README escreve. Uma requisição com outra grafia é recusada com `400` ou salva com o valor oficial.

## Resultado atual

A API responde `200` e salva `closed`. A página de detalhes mostra um status vazio, e o ticket não entra em nenhum filtro de status.

## Critérios de aceitação

- [ ] Nenhum status ou prioridade fora dos valores oficiais é salvo.
- [ ] Requisições com valores válidos continuam funcionando como antes.
- [ ] Valores inválidos continuam respondendo `400` com uma mensagem em `error`.

## Ambiente

- SupportDesk 1.7 (API)
- Script de automação da operação (Node.js) e `curl`

## Atividade

**Marcus Bell** · 06/11/2026 14:52
> Já corrigimos o script para enviar "Closed", mas a API nunca deveria ter aceitado. São 38 tickets para arrumar.
