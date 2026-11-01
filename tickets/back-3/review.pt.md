# Code review: SD-263, só os status e as prioridades oficiais são salvos

Muito bem: este bug é sobre o ponto em que a validação e os dados se separam. Aqui está a abordagem de referência, para você comparar com a sua.

## Por que o bug aconteceu

- Alguém deixou a conferência mais amigável (qualquer maiúscula ou minúscula), mas esqueceu que o valor é salvo como chegou. Uma validação que aceita um valor também precisa definir o que é guardado.
- A API respondeu `200`, então a automação não tinha motivo para perceber que algo estava errado.
- O estrago aparece longe da causa: um select vazio na página de detalhes e linhas faltando nos relatórios.

## Por que a correção de referência está certa

- O contrato da API lista valores exatos, e outros clients e relatórios dependem deles. Recusar outras grafias mantém o contrato e diz ao chamador o que corrigir.
- A correção é uma linha na conferência compartilhada, então status e prioridade ficam cobertos.
- O teste de regressão confere o que foi **salvo**, que é o que de fato quebrou, e aceita qualquer um dos desenhos válidos (recusar ou normalizar).

## Compare com a sua correção

- Você normalizou (salvar `Closed` para `closed`)? É válido e mais amigável, desde que você salve o valor oficial e não o que chegou. Pense se esconder o erro do client é o que você quer.
- Você pensou nos 38 tickets já salvos com `closed`? Uma correção no código não conserta os dados que já existem; num time de verdade você planejaria uma pequena migração de dados.

## Para a próxima vez

- Valide e converta no mesmo lugar, e salve o valor convertido.
- Quando uma API aceita algo, teste o que ela **guarda**, e não só o código de status.
