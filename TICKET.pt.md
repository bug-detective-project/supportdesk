# SD-270: Buscar por "O'Brien" mostra um erro

| Campo | Valor |
| --- | --- |
| Projeto | SupportDesk (SD) |
| Tipo de item | Bug |
| Status | A fazer |
| Prioridade | Crítica |
| Relator | Elena Duarte (Supervisora de atendimento ao cliente) |
| Trilha | Back-end |
| Versão afetada | 1.8 |
| Componente | Busca de tickets (API) |
| Rótulos | `busca`, `api`, `seguranca` |
| Sprint | SD Sprint 46 |
| Criado em | 09/11/2026 10:15 |

## Descrição

Quando um atendente busca um nome de cliente com apóstrofo, como `O'Brien` ou `D'Angelo`, a lista de tickets mostra um erro em vez dos resultados. Qualquer busca com `'` falha do mesmo jeito.

A Priya olhou o log do servidor e viu um erro de sintaxe SQL. Ela marcou o ticket como **Crítico** e acrescentou o rótulo `seguranca`: se uma aspa quebra a consulta, alguém poderia escrever a própria consulta na caixa de busca.

## Passos para reproduzir

1. Abra a lista de tickets.
2. Busque por `O'Brien`.

## Resultado esperado

A busca funciona como qualquer outra e mostra os tickets cujo título tem `O'Brien` (hoje nenhum), sem erro.

## Resultado atual

A requisição responde `500`, a lista mostra uma mensagem de erro, e o log do servidor tem `SQLITE_ERROR: near "Brien": syntax error`.

## Critérios de aceitação

- [ ] Buscas com `'` funcionam como qualquer outra busca.
- [ ] Nada digitado na caixa de busca muda o SQL que roda: é sempre só o texto procurado.
- [ ] `%` e `_` continuam sendo tratados como caracteres comuns, e todas as outras buscas continuam funcionando.

## Ambiente

- SupportDesk 1.8 (API)
- Todos os navegadores; também com `curl "http://localhost:3001/api/tickets?search=O'Brien"`

## Atividade

**Priya Raman** · 09/11/2026 10:40
> Log do servidor: `SQLITE_ERROR: near "Brien": syntax error`. Confiram também o que acontece com `' OR '1'='1`.
