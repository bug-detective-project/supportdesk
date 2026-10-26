# Code review: SD-238, as mudanças de prioridade são salvas

Bom rastreamento: este é o tipo de bug em que todas as camadas dizem que deu certo. Veja a abordagem de referência para comparar com a sua.

## Por que o bug aconteceu

- O formulário e a API usam vocabulários diferentes: `priorityLevel` na interface, `priority` na requisição. Isso é normal, e `toTicketPatch` existe para traduzir entre os dois. Ela traduzia `status` e `assignee`, mas repassava `priorityLevel` sem mudar.
- O servidor é tolerante: ignora campos que não conhece, então a requisição era válida, não mudava nada e retornava 200.
- A interface atualizava o estado com o que **enviou**, e não com o que o servidor **retornou**, então a tela parecia certa até recarregar.

Três decisões razoáveis se combinaram em uma perda de dados silenciosa.

## Por que a correção de referência está certa

- Ela corrige o mapeamento na única função responsável por ele, então todos que a chamam se beneficiam.
- Ela mantém o contrato da API e o servidor intactos, como pedem as convenções do time; outros clients e as verificações ocultas dependem deles.
- O teste de regressão verifica o próprio corpo da requisição, que é o contrato entre os dois lados. Um teste só de interface teria passado mesmo com o bug.

## Compare com a sua correção

- Você mudou o mapeamento no client ou fez o servidor aceitar `priorityLevel`? Aceitar um apelido no servidor também salvaria o valor, mas muda a API para todo mundo e esconde o erro do client.
- Você pensou em atualizar a tela a partir da resposta do servidor, como o handler de responsável faz desde o ticket 2? Isso teria deixado este bug visível na hora.

## Para a próxima vez

- "200 OK" só significa que o servidor não reclamou. Confira se a resposta contém o que você mudou.
- Quando um valor some entre camadas, inspecione o payload em cada fronteira: estado do formulário, corpo da requisição, parsing no servidor, banco de dados.
- Tipos compartilhados entre client e servidor, ou um servidor estrito que rejeita campos desconhecidos, transformam esse tipo de divergência em um erro imediato.
