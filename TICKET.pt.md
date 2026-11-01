# SD-245: Alguns tickets abrem como uma página em branco

| Campo | Valor |
| --- | --- |
| Projeto | SupportDesk (SD) |
| Tipo de item | Bug |
| Status | A fazer |
| Prioridade | Crítica |
| Relator | Hannah Brooks (Líder do time de suporte) |
| Responsável | Não atribuído |
| Versão afetada | 1.4 |
| Componente | Detalhes do ticket |
| Rótulos | `bloqueante`, `regressao` |
| Sprint | SD Sprint 44 |
| Criado em | 24/10/2026 08:51 |

## Descrição

Desde a última versão, alguns tickets não abrem de jeito nenhum. Quando clico neles na lista, a página inteira fica branca: sem ticket, sem botões, sem menu. A única saída é o botão voltar do navegador.

Outros tickets abrem normalmente. Parece que os que quebram são os tickets novos que ninguém pegou ainda, justamente os que precisamos triar.

Também acontece com um ticket que estava funcionando: se eu mudo o responsável para **Unassigned** (sem responsável), a página fica em branco na hora.

## Passos para reproduzir

1. Abra a lista de tickets.
2. Clique no ticket #4.
3. Volte e clique no ticket #3.
4. No ticket #3, mude o responsável para **Unassigned**.

## Resultado esperado

O ticket #4 abre normalmente e mostra **Unassigned** como responsável. Mudar o ticket #3 para **Unassigned** mantém a página funcionando.

## Resultado atual

O ticket #4 abre como uma página em branco. O ticket #3 abre normalmente, mas a página fica em branco assim que ele é mudado para **Unassigned**.

## Critérios de aceitação

- [ ] Todos os tickets abrem normalmente.
- [ ] Tickets sem responsável mostram **Unassigned** como responsável.
- [ ] Mudar um ticket para **Unassigned** mantém a página funcionando.
- [ ] Tickets com responsável continuam mostrando o nome da pessoa.

## Ambiente

- SupportDesk 1.4
- Chrome 141 no Windows 11, Edge 141 no Windows 11

## Atividade

**Hannah Brooks** · 24/10/2026 08:58
> Os tickets novos estão se acumulando porque ninguém consegue abri-los. Isso está travando a triagem do time inteiro.
