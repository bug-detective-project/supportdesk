# SD-231: Atribuir um ticket mostra "atualizado", mas nada foi salvo

| Campo | Valor |
| --- | --- |
| Projeto | SupportDesk (SD) |
| Tipo de item | Bug |
| Status | A fazer |
| Prioridade | Alta |
| Relator | Marcus Bell (Gerente de operações de suporte) |
| Responsável | Não atribuído |
| Versão afetada | 1.2 |
| Componente | Detalhes do ticket |
| Rótulos | `impacto-cliente`, `atribuicao` |
| Sprint | SD Sprint 43 |
| Criado em | 19/10/2026 14:02 |

## Descrição

Há dois problemas no campo de responsável na tela de detalhes do ticket.

**1. Pessoas que saíram da empresa continuam na lista.** O Lucas saiu do time de suporte no mês passado, mas o nome dele ainda aparece quando escolhemos para quem atribuir um ticket.

**2. A aplicação diz que a atribuição funcionou quando não funcionou.** Se eu escolho o Lucas, aparece a mensagem verde de sucesso e o nome dele aparece no ticket. Mas, quando atualizo a página, o ticket volta para a pessoa que estava antes. Ninguém é avisado e o ticket fica parado sem ninguém trabalhando nele, porque todos acreditam que ele foi reatribuído.

Só descobrimos porque um cliente reclamou que ficou três dias sem resposta.

## Passos para reproduzir

1. Abra o ticket #3.
2. Abra a lista de responsáveis.
3. Selecione Lucas Moreau.
4. Atualize a página.

## Resultado esperado

Lucas Moreau não aparece na lista de responsáveis. Se uma atribuição não puder ser salva, a tela avisa.

## Resultado atual

Lucas Moreau aparece na lista. Depois de selecioná-lo, aparece uma mensagem de sucesso e o ticket mostra o Lucas como responsável. Depois de atualizar a página, o ticket está atribuído de novo à pessoa anterior.

## Critérios de aceitação

- [ ] Só quem trabalha atualmente no time pode ser escolhido como responsável.
- [ ] Se uma atribuição não puder ser salva, por qualquer motivo, a tela mostra uma mensagem de erro em vez da mensagem de sucesso, e o ticket continua mostrando a pessoa a quem estava atribuído antes.
- [ ] Atribuir um ticket a alguém do time continua funcionando e continua salvo depois de atualizar a página.

## Ambiente

- SupportDesk 1.2
- Chrome 141 no Windows 11

## Atividade

**Marcus Bell** · 19/10/2026 14:10
> Há uma escalação de cliente ligada a este card. Por favor, tratem como prioridade nesta sprint.
