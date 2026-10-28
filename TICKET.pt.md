# SD-238: Alterações de prioridade se perdem ao atualizar a página

| Campo | Valor |
| --- | --- |
| Projeto | SupportDesk (SD) |
| Tipo de item | Bug |
| Status | A fazer |
| Prioridade | Média |
| Relator | Elena Duarte (Supervisora de atendimento ao cliente) |
| Responsável | Não atribuído |
| Versão afetada | 1.3 |
| Componente | Detalhes do ticket |
| Rótulos | `perda-de-dados`, `triagem` |
| Sprint | SD Sprint 43 |
| Criado em | 21/10/2026 10:37 |

## Descrição

Quando altero a prioridade de um ticket, a tela mostra a nova prioridade e a mensagem verde de sucesso. Tudo parece certo. Mas, se eu atualizo a página, ou se outra pessoa abre o mesmo ticket, a prioridade antiga está de volta.

Isso está fazendo tickets urgentes ficarem no fim da fila. Alterar o status parece continuar funcionando. Não aparece nenhuma mensagem de erro em lugar nenhum.

## Passos para reproduzir

1. Abra o ticket #2 (prioridade **Medium**).
2. Altere a prioridade para **High**.
3. Atualize a página.

O mesmo acontece com todos os valores de prioridade.

## Resultado esperado

O ticket mostra **High** depois de atualizar a página, e a lista de tickets também mostra **High**.

## Resultado atual

Antes de atualizar, a tela mostra **High** e uma mensagem de sucesso. Depois de atualizar, a prioridade voltou a ser **Medium**, e a lista de tickets também mostra **Medium**.

## Critérios de aceitação

- [ ] Depois que altero a prioridade e vejo a mensagem de sucesso, a nova prioridade continua lá depois de atualizar a página.
- [ ] A lista de tickets e todas as outras pessoas que abrirem o ticket veem a nova prioridade.
- [ ] Alterar a prioridade não muda nenhum outro campo do ticket.

## Ambiente

- SupportDesk 1.3
- Firefox 144 no Ubuntu 24.04, Chrome 141 no macOS

## Atividade

**Elena Duarte** · 21/10/2026 10:45
> Estamos conferindo as prioridades manualmente toda manhã até isso ser corrigido.
