# SD-252: Buscar por "%" ou "_" traz todos os tickets

| Campo | Valor |
| --- | --- |
| Projeto | SupportDesk (SD) |
| Tipo de item | Bug |
| Status | A fazer |
| Prioridade | Média |
| Relator | Hannah Brooks (Líder do time de suporte) |
| Responsável | Não atribuído |
| Versão afetada | 1.5 |
| Componente | Busca de tickets (API) |
| Rótulos | `busca`, `api` |
| Sprint | SD Sprint 45 |
| Criado em | 03/11/2026 09:20 |

## Descrição

Nossos atendentes buscam tickets por nome de arquivo e por código promocional o tempo todo, e esses textos costumam ter `_` ou `%` (`report_final.csv`, `100% off`). Desde a última versão, buscar por um desses caracteres traz a lista inteira, e não só os tickets que têm o caractere.

A caixa de busca parece certa: ela envia o texto que digitamos. O problema está na lista que volta.

## Passos para reproduzir

1. Abra a lista de tickets.
2. Busque por `%`.
3. Busque por `_`.

## Resultado esperado

Buscar por `%` mostra só os tickets cujo título tem `%` (hoje, o ticket do desconto "100% off"). Buscar por `_` mostra só os títulos que têm `_` (o ticket da exportação `report_final.csv`).

## Resultado atual

As duas buscas trazem todos os tickets. Uma busca como `t_f` também encontra títulos que só têm um `t`, um caractere qualquer e um `f` em sequência.

## Critérios de aceitação

- [ ] `%` e `_` numa busca são tratados como caracteres comuns.
- [ ] Todas as outras buscas continuam funcionando: parciais e sem diferenciar maiúsculas.
- [ ] `GET /api/tickets?search=…` mantém o formato da resposta (o client e os relatórios dependem dele).

## Ambiente

- SupportDesk 1.5 (API)
- Reproduzido no app e com `curl "http://localhost:3001/api/tickets?search=%25"`

## Atividade

**Hannah Brooks** · 03/11/2026 09:31
> Não é urgente, mas deixa a busca por arquivos exportados inútil.
