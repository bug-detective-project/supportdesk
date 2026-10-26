# Code review: SD-231, a atribuição informa as falhas

Bom trabalho corrigindo os dois sintomas: este ticket tinha duas causas, e o QA verifica cada uma. Veja a abordagem de referência para comparar com o que você fez.

## Por que o bug aconteceu

- **O funcionário que saiu.** `/api/employees` retorna todo mundo, com uma flag `active`, porque outras telas também precisam das pessoas inativas (por exemplo, para mostrar quem atendeu um ticket antigo). O dropdown usou a lista completa sem pensar no propósito dela.
- **O falso sucesso.** `handleAssigneeChange` foi escrito de forma "otimista": envia a requisição, atualiza a tela na hora e supõe que funcionou. A promise de `updateTicket` nunca era aguardada, então o 422 do servidor se perdia. Um `fetch` só rejeita em falhas de rede; erros HTTP chegam como uma `Response` normal com `ok === false`, e é fácil deixá-los passar.

O servidor fez a parte dele: recusou o funcionário inativo com uma mensagem clara. O client simplesmente nunca a leu.

## Por que a correção de referência está certa

- Filtrar por `employee.active` no componente mantém a API como está (uma convenção do time) e segue a mesma regra que o servidor já aplica.
- Aguardar a requisição e verificar `response.ok` antes de mexer no estado faz a tela dizer a verdade. A mensagem de erro do próprio servidor é exibida, então o usuário descobre **por que** falhou.
- Em caso de sucesso, o estado vem da resposta do servidor em vez de um palpite local, então a tela mostra o que realmente foi salvo.
- A verificação `current?.id === ticketId` evita gravar o resultado em outro ticket se o usuário navegou enquanto a requisição estava em andamento (a lição do ticket 1).
- Os testes de regressão cobrem as duas causas de forma independente.

## Compare com a sua correção

- Você corrigiu as duas causas? Esconder o Lucas sozinho esconderia o sintoma neste caso, mas qualquer outra recusa do servidor ainda mostraria um falso sucesso.
- Você reaproveitou `saveField` ou escreveu um handler próprio? Os dois servem; o importante é que todo caminho de atualização verifique a resposta.
- Atualizações otimistas são um padrão legítimo, mas precisam de um rollback quando o servidor diz não.

## Para a próxima vez

- Uma promise não aguardada em um handler de evento é um sinal de alerta. Linters conseguem pegar isso (`no-floating-promises`).
- `fetch` não lança erro em 4xx/5xx: sempre verifique `response.ok`.
- Quando o servidor valida algo, a interface ainda precisa tratar a recusa, mesmo que também impeça a escolha inválida.
