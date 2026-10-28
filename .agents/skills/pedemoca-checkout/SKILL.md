---
name: pedemoca-checkout
description: "Selecionar contexto e validacao para investigar ou alterar checkout, carrinho ou Page Curl da Pe de Moca. Nao autoriza operacoes financeiras ou deploy."
---

# Checkout Pé de Moça

Respeitar o [AGENTS do worktree](../../../AGENTS.md) e o escopo solicitado. Esta Skill não inicia instalação, testes ou escrita quando a tarefa é somente leitura.

- Confirmar branch, HEAD e status. Localizar consumidores e handlers com `rg -n`; abrir somente trechos necessários do componente e da cascata CSS efetiva.
- Investigar `src/components/CheckoutModal.jsx`, consumidores e testes locais. Abrir geometria/Page Curl apenas se existirem e estiverem no escopo; não copiar o componente inteiro de outra branch.
- Ao planejar ou executar validação, ler a [matriz](../../../docs/TESTES.md) e conferir scripts/configuração no worktree. Só executar verificações autorizadas e pertinentes, mantendo as exigidas para entrega.
- Preservar dados, validações, normalizações, persistência, confirmação explícita, foco e mobile. Em navegação/motion, verificar avanço/retorno, cancelamento, rerender, cliques repetidos, frete tardio e reduced motion.
- Antes de E2E ou testes que possam usar backend, comprovar mocks e bloqueio de rede. Não presumir que fixtures de outra branch fornecem proteção.
- Relatar diff, testes executados e códigos de saída, cobertura pendente e limitações visuais. Uma captura Chromium não comprova Safari/iPhone; teste escrito não é teste executado.
