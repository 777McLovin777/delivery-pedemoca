# Testes por impacto

Este documento seleciona verificações; não substitui as [regras de segurança](../AGENTS.md), os scripts do [package.json](../package.json) ou o [CI vigente](../.github/workflows/ci.yml). Conferir esses arquivos no worktree ativo antes de executar. Os exemplos abaixo não foram executados por esta fase documental.

## Durante desenvolvimento

Começar pelo menor conjunto que exercite o comportamento alterado. Ampliar quando houver novas mudanças, falhas ou dependências afetadas; registrar o que ainda falta para entrega.

| Impacto | Validação inicial | Ampliar conforme risco |
| --- | --- | --- |
| Documentação, Skills ou inventário | Links/caminhos, frontmatter YAML, comandos contra manifests, parser PowerShell e execução somente leitura do inventário | Comparar regras antigas/novas; verificar status e arquivos preservados. Não exigir build para confirmar links |
| Geometria da folha | Teste junto ao módulo, se presente, e `src/test/CheckoutModal.test.jsx` | E2E de avanço/retorno, extremos e captura visual; não afirmar fidelidade visual sem inspeção |
| Checkout, navegação, foco ou cancelamento | `npm test -- src/test/CheckoutModal.test.jsx`, com backend simulado | Avanço validado, retorno, cliques repetidos, fechar/desmontar, rerender, frete tardio e confirmação explícita; E2E correspondente |
| Carrinho, preços, quantidades, complementos, observações, personalizações ou fidelidade | Testes dos módulos afetados e `src/test/App.test.jsx`, conforme comportamento | Persistência e checkout completo, incluindo fluxos críticos E2E e fidelidade quando aplicáveis |
| CSS, motion e responsividade | Lint pertinente, build e E2E visual aplicável | Mobile/desktop, foco, scroll, teclado e reduced motion. Chromium não comprova Safari/iPhone |
| Manifests, configuração ou dependências | Conferir scripts/lockfile e seleção de testes, mocks e permissões | Suíte completa e verificações de entrega; instalar apenas se autorizado e necessário |
| Financeiro, banco, migrations ou RLS | Identificar primeiro autorização específica e ambiente isolado | Consultar só o procedimento pertinente indicado no README; não executar PostgreSQL, serviços ou deploy por seleção automática |

Usar arquivos realmente existentes; um teste da branch Page Curl pode não existir na PIX ou na base de produção. Não alterar a interface nem reduzir asserts para satisfazer fixtures antigas.

## Antes de executar

- Conferir autorização, dependências e configuração. Se uma instalação necessária falhar, não tentar validadores sem seus executáveis disponíveis.
- Confirmar mocks e bloqueio de chamadas externas dos testes escolhidos. Não reutilizar servidor desconhecido ou configuração real de outro projeto; a configuração antiga do Playwright não garante isolamento só por fornecer um fallback fictício.
- Usar execução única (`npm test` já usa `vitest run`), sem watch quando a tarefa for validação.
- Conferir a base de `lint:changed`: o script atual usa `main`, que pode diferir da base do PR. Resolver a referência e conferir o diff antes; não tratar uma referência local como atualizada ou fazer fetch sem autorização.
- O wrapper `test:pix:local`, quando presente, desabilita carregamento de `.env`, usa configuração fictícia e já inclui build após os testes. Seu nome não garante que todo teste alcançado está simulado.

## Entrega e merge

Testes focais aceleram desenvolvimento; não dispensam as verificações exigidas para entrega/merge. Executar lint, análise e testes configurados, revisar o diff e cumprir integralmente o pipeline aplicável. A execução continua sujeita às autorizações: uma fase documental sem autorização de build/E2E deve registrá-los como não executados, sem declarar prontidão para publicação.

O CI atual prepara dependências e Chromium e executa:

1. Biome nos arquivos alterados em PR, usando o SHA da base do PR.
2. `npm run knip`, `npm run check:secrets` e `npm run check:images`.
3. `npm test`, `npm run test:e2e` e `npm run build`.

Executar também `git diff --check` localmente. Reconferir a lista em `ci.yml` antes da entrega; este documento não muda o pipeline. Biome usa `continue-on-error: true` no CI: isso não torna um erro aprovação de qualidade nem autoriza suprimir regras. Não fazer merge com checks obrigatórios falhando.

## Evidências curtas

Registrar worktree, HEAD, escopo do diff, comando, código de saída e resumo da falha. Separar testes executados, apenas escritos e não autorizados; comparar falhas preexistentes com a base Git sem sobrescrever o checkout. Reutilizar evidência somente enquanto código, lockfile, configuração e ambiente relevante forem equivalentes; não substituir evidência exigida pelo CI ou aprovação financeira.
