# SD-257: Tickets sem responsável somem da lista

| Campo | Valor |
| --- | --- |
| Projeto | SupportDesk (SD) |
| Tipo de item | Bug |
| Status | A fazer |
| Prioridade | Alta |
| Relator | Marcus Bell (Gerente de operações de suporte) |
| Responsável | Não atribuído |
| Versão afetada | 1.6 |
| Componente | Lista de tickets (API) |
| Rótulos | `impacto-cliente`, `triagem`, `api` |
| Sprint | SD Sprint 45 |
| Criado em | 04/11/2026 08:05 |

## Descrição

Os tickets novos chegam sem responsável, e a nossa triagem da manhã começa justamente por eles. Desde a versão de ontem, eles não aparecem na lista de tickets. A lista só mostra os tickets que já têm alguém atribuído.

E piora: se um atendente volta um ticket para **Unassigned** (sem responsável), o ticket some da lista, e abrir o link dele mostra "Ticket not found". Ninguém consegue encontrá-lo de novo.

## Passos para reproduzir

1. Abra a lista de tickets e conte os tickets.
2. Abra qualquer ticket atribuído e mude o responsável para **Unassigned**.
3. Volte para a lista e depois abra o link do ticket de novo.

## Resultado esperado

A lista mostra todos os tickets, com ou sem responsável. Um ticket sem responsável abre normalmente e mostra "Unassigned".

## Resultado atual

A lista pula todos os tickets sem responsável. Tirar o responsável de um ticket funciona, mas depois o ticket some da lista e a página dele diz "Ticket not found".

## Critérios de aceitação

- [ ] `GET /api/tickets` devolve todos os tickets, com ou sem responsável, ainda em ordem de id.
- [ ] `GET /api/tickets/:id` devolve um ticket sem responsável com `assigneeId: null` e `assignee: null`.
- [ ] Tirar o responsável de um ticket o devolve com `assignee: null`.

## Ambiente

- SupportDesk 1.6 (API)
- Todos os navegadores; também com `curl`

## Atividade

**Marcus Bell** · 04/11/2026 08:12
> Três tickets novos de clientes ficaram uma noite sem ninguém ver por causa disso. Tratem como urgente, por favor.
