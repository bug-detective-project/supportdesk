# Code review: SD-214, os detalhes acompanham Previous e Next

Bom trabalho passando este pelo QA. Veja como a correção de referência resolve o problema, para comparar com a sua. Muitas vezes existe mais de uma boa resposta, e os testes só verificam o comportamento.

## Por que o bug aconteceu

O efeito dos detalhes foi escrito para uma tela que é montada uma vez por ticket. Isso era verdade enquanto todo ticket era aberto a partir da lista. Quando Previous e Next foram adicionados, a rota passou a mudar **dentro** de um componente já montado, e um efeito com `[]` não tem como perceber. Nada quebra, a URL está certa e os dados estão errados, e é por isso que esse tipo de bug sobrevive a testes manuais.

## Por que a correção de referência está certa

- `[id]` deixa a dependência explícita: o efeito lê `id`, então roda de novo sempre que `id` muda. A regra de lint `react-hooks/exhaustive-deps` aponta exatamente isso.
- A flag `ignore` na limpeza trata uma condição de corrida que `[id]` sozinho não resolve: duas requisições em andamento, terminando na ordem errada. Sem ela, uma resposta lenta de um ticket anterior sobrescreve o atual. Um `AbortController` é uma escolha igualmente válida.
- Limpar `feedback` e `loadError` evita que o estado de interface de um ticket vaze para o próximo.
- O teste de regressão reproduz tanto a navegação simples quanto a resposta fora de ordem, então uma refatoração futura não consegue trazê-las de volta sem ninguém perceber.

## Compare com a sua correção

- Você tratou respostas fora de ordem, ou só o array de dependências?
- Algumas correções adicionam `key={id}` para forçar uma nova montagem. Funciona, mas descarta todo o estado do componente e busca a lista de funcionários de novo a cada clique. É um trade-off válido que vale conhecer.

## Para a próxima vez

- Um efeito que lê um valor normalmente deve listá-lo como dependência.
- Quando um parâmetro da URL muda, considere que o componente continua montado.
- Toda busca dentro de um efeito precisa de uma resposta para "e se o usuário seguir em frente antes de ela terminar?".
