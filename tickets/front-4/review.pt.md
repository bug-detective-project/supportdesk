# Code review: SD-245, tickets sem responsável voltam a abrir

Este era o mais difícil dos quatro: nenhum erro no servidor, nenhum stack trace no terminal, só uma página branca. Sair disso e chegar em uma linha de código é trabalho de depuração de verdade. Veja a abordagem de referência para comparar com a sua.

## Por que o bug aconteceu

- Os dados sempre estiveram certos: tickets sem responsável têm `assignee: null` desde a primeira versão, e o componente `AssigneeName` e a lista de tickets tratam isso.
- Uma mudança posterior colocou o responsável no cabeçalho do ticket lendo o nome direto, escrita e testada com um ticket que tinha responsável. Foi uma **regressão**: um comportamento que funcionava quebrou por causa de uma funcionalidade nova.
- O tipo `Ticket` dizia `assignee: Employee`, o que não batia com a API. O TypeScript confere o seu código contra os seus tipos, não contra a realidade, então um tipo errado desliga a rede de proteção sem avisar.
- No React, uma exceção durante a renderização remove a árvore inteira, a menos que um error boundary a capture, então um pequeno erro de renderização vira uma tela em branco.

## Por que a correção de referência está certa

- Corrigir o tipo primeiro faz o compilador encontrar todos os acessos inseguros, agora e no futuro.
- Renderizar um caso explícito sem responsável (o avatar `?` e **Unassigned**) segue a lista de tickets, então a mesma pessoa aparece igual nas duas telas.
- Tickets com responsável continuam com o avatar e o nome no cabeçalho, então a funcionalidade nova é preservada, não revertida.
- Os testes de regressão cobrem as duas entradas: abrir um ticket sem responsável e remover o responsável de um ticket aberto.

## Compare com a sua correção

- Você corrigiu o tipo ou só adicionou `?.` no ponto do erro? O optional chaining (`ticket.assignee?.name`) evita o erro, mas mostra um nome vazio e deixa o tipo incorreto para a próxima pessoa.
- Você reaproveitou `AssigneeName` e o avatar da lista? É um bom instinto: um componente para um conceito.
- Um error boundary em volta da página seria um extra útil, mas mostraria uma mensagem de erro em vez do ticket, então não substitui a correção.

## Para a próxima vez

- Página React em branco significa "leia o Console primeiro".
- Os tipos dos dados da API precisam descrever o que a API realmente retorna, inclusive `null`.
- Dados de seed ou de teste devem incluir os casos de borda (sem responsável, vazio, inativo), para que funcionalidades novas os encontrem cedo.
