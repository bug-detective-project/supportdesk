# SD-214: Os detalhes do ticket não mudam quando uso Anterior e Próximo

| Campo | Valor |
| --- | --- |
| Projeto | SupportDesk (SD) |
| Tipo de item | Bug |
| Status | A fazer |
| Prioridade | Alta |
| Relator | Hannah Brooks (Líder do time de suporte) |
| Responsável | Não atribuído |
| Versão afetada | 1.1 |
| Componente | Detalhes do ticket |
| Rótulos | `impacto-cliente`, `navegacao` |
| Sprint | SD Sprint 42 |
| Criado em | 12/10/2026 09:14 |

## Descrição

Quando abro um ticket e uso os botões **Previous** (anterior) ou **Next** (próximo) para percorrer a lista, a barra de endereço muda para o novo ticket, mas a tela continua mostrando o ticket que abri primeiro. O título, a descrição e os campos de seleção continuam iguais.

Hoje de manhã meus atendentes passaram por uma fila inteira achando que estavam lendo tickets diferentes. Um deles alterou o status do ticket errado por causa disso.

## Passos para reproduzir

1. Abra a lista de tickets.
2. Clique no ticket #3.
3. Clique em **Next**.
4. Veja a barra de endereço: ela mostra o ticket 4. Veja a página: ela continua mostrando o ticket #3.
5. Clique em **Previous** ou **Next** mais algumas vezes.
6. Atualize o navegador.

Também acontece quando a lista está filtrada por uma busca.

## Resultado esperado

A página mostra o ticket da barra de endereço depois de cada clique em **Previous** ou **Next**.

## Resultado atual

A página continua mostrando o primeiro ticket que abri até eu atualizar o navegador. Depois de atualizar, o ticket correto aparece.

## Critérios de aceitação

- [ ] **Previous** e **Next** mostram o ticket anterior ou o próximo da lista, com o próprio título, descrição, status, prioridade e responsável.
- [ ] **Previous** e **Next** respeitam a busca atual.
- [ ] O que aparece na tela sempre corresponde ao ticket da barra de endereço, mesmo depois de vários cliques rápidos seguidos.

## Ambiente

- SupportDesk 1.1
- Chrome 141 no Windows 11, Safari 19 no macOS

## Atividade

**Hannah Brooks** · 12/10/2026 09:20
> Está acontecendo com o time inteiro, em todos os navegadores que usamos. Por enquanto, a solução é atualizar a página depois de cada clique.
