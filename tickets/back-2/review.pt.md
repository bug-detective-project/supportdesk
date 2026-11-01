# Code review: SD-257, os tickets sem responsável voltam para a lista

Bom trabalho: uma palavra numa consulta escondia tickets reais de clientes. Aqui está a abordagem de referência, para você comparar com a sua.

## Por que o bug aconteceu

- `JOIN` e `LEFT JOIN` só diferem quando uma linha não tem par. Todo ticket atribuído tinha, então quase toda a lista parecia certa.
- A mesma consulta alimenta a lista, a página de detalhes e a resposta de toda atualização, então uma mudança quebrou três funcionalidades de uma vez.
- Os dados que sumiram são justamente os que a triagem mais precisa: tickets novos que ninguém pegou ainda.

## Por que a correção de referência está certa

- O tipo de junção combina com os dados: `assigneeId` pode ser null, então o funcionário é opcional, e uma relação opcional é um `LEFT JOIN`.
- A correção fica na consulta compartilhada, então a lista, os detalhes e as atualizações voltam a concordar.
- `toTicket` já tratava as colunas de funcionário `NULL`; a correção só deixa essas linhas chegarem até ele.
- O teste de regressão cobre os três sintomas, e não só a lista.

## Compare com a sua correção

- Você criou uma segunda consulta para os tickets sem responsável e juntou os resultados? Funciona, mas a ordem e os dois caminhos de código são fáceis de errar.
- Você mudou `toTicket`? Ele já estava certo; as linhas é que não chegavam até ele.

## Para a próxima vez

- Em toda junção, pergunte: o outro lado pode faltar? Se puder, é uma junção externa (outer join).
- Um teste que confere "todas as linhas voltam" pega uma família inteira de bugs de filtragem.
