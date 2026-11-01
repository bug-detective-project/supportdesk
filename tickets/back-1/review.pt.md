# Code review: SD-252, % e _ são buscados como texto

Boa caçada a um bug que só aparece com entradas "incomuns". Aqui está a abordagem de referência, para você comparar com a sua.

## Por que o bug aconteceu

- O `LIKE` é uma pequena linguagem de padrões: `%` e `_` são curingas. O texto do usuário entrava no padrão como estava, então os caracteres dele viravam curingas também.
- Escapar precisa de duas partes: o texto escapado **e** uma cláusula `ESCAPE` dizendo ao SQLite qual caractere escapa. Tirar qualquer uma das duas quebra o escape.
- A maioria das buscas não tem `%` nem `_`, então o bug ficava escondido atrás do caso comum.

## Por que a correção de referência está certa

- O termo é escapado no ponto em que o padrão é montado, então todo uso de `listTickets` recebe a correção.
- O termo continua indo como parâmetro. Escapar para o `LIKE` e se proteger de SQL injection são problemas diferentes: o parâmetro cuida do segundo.
- O teste de regressão fixa os casos de borda (`%`, `_` e os dois dentro de títulos reais), e não só uma busca normal.

## Compare com a sua correção

- Você escapou o `\` também? Sem isso, uma busca por `\` seguido de `%` desligaria o escape de novo.
- Você filtrou em JavaScript depois de carregar todos os tickets? Funciona, mas tira a busca do banco e carrega a tabela inteira a cada requisição.

## Para a próxima vez

- Sempre que um texto do usuário entra num padrão (`LIKE`, expressão regular, glob), pergunte quais caracteres são especiais ali.
- Teste a busca com os caracteres que as pessoas digitam de verdade: `%`, `_`, aspas, acentos, espaços.
