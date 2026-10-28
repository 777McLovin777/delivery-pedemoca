---
name: pedemoca-inventario
description: "Inventariar Git e worktrees da Pe de Moca no inicio de tarefa ou ao conferir divergencias, somente leitura. Nao executa testes ou publicacao."
---

# Inventário Pé de Moça

Respeitar o [AGENTS do worktree](../../../AGENTS.md). Não ampliar a autorização da tarefa.

- Obter raiz, branch, HEAD e status; conferir todos os worktrees registrados, sem presumir checkout limpo.
- Preferir o [inventário PowerShell](../../../scripts/inventory-worktrees.ps1), passando `-Repository` se necessário. Ler sua implementação apenas para investigar falha ou alterá-la.
- Se o script não existir neste worktree ou a política impedir seu uso, executar `git rev-parse --show-toplevel`, `git branch --show-current`, `git rev-parse HEAD` e `git worktree list --porcelain`; para cada caminho, `git -C 'caminho' status --short`. Não afrouxar a política.
- Consultar o [índice técnico](../../../README.md) apenas para localizar contexto necessário. Verificar existência local antes de seguir referências de outra branch.
- Resolver a base local antes de comparar; informar se estiver ausente. Não fazer fetch, ler `.env`, imprimir diffs sensíveis ou executar Git de escrita por causa desta Skill.
- Entregar caminho, branch, SHA, status (incluindo untracked) e divergência da base quando disponível. Referências locais não comprovam deploy ativo. Investigar detalhes somente quando afetarem a tarefa.
