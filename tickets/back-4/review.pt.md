# Code review: SD-270, o termo de busca é um parâmetro, nunca SQL

Correção importante: o que parecia uma falha com um nome com apóstrofo era uma brecha de segurança. Aqui está a abordagem de referência, para você comparar com a sua.

## Por que o bug aconteceu

- A consulta era montada como texto, com a entrada do usuário no meio. O banco não tem como saber onde termina a consulta e onde começam os dados.
- `escapeLike` dava a impressão de segurança, mas só escapa os curingas do `LIKE`, não as aspas. Escapar para um propósito não protege contra outro.
- A falha com `O'Brien` era o sintoma visível; o silencioso é que `' OR '1'='1` roda uma consulta diferente.

## Por que a correção de referência está certa

- Consultas preparadas com parâmetros são a defesa padrão: o SQL e os valores viajam separados, então nenhuma entrada consegue mudar a consulta.
- Ela combina com o resto do arquivo: todas as outras consultas de `repository.ts` já usam `?` e parâmetros.
- Ela mantém o escape do `LIKE`, então `%` e `_` continuam sendo buscados como caracteres comuns.
- O teste de regressão confere tanto o erro quanto a injeção.

## Compare com a sua correção

- Você escapou ou removeu os apóstrofos? Isso conserta `O'Brien`, mas deixa outros caminhos abertos; e remover caracteres muda o que o usuário busca.
- Você manteve o `escapeLike`? Sem ele, `%` e `_` voltariam a ser curingas.

## Para a próxima vez

- Nunca monte SQL concatenando strings ou com template strings que contêm a entrada. Use parâmetros, sempre.
- Quando uma aspa quebra alguma coisa, trate como bug de segurança até provar o contrário.
