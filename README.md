# Pé de Moça

Delivery em React e Vite, com checkout e integrações Supabase. Começar pelas [regras do repositório](AGENTS.md); código, manifests e configuração do worktree ativo são as fontes operacionais.

## Mapa técnico

| Área | Fonte |
| --- | --- |
| Inicialização | [src/main.jsx](src/main.jsx), [Vite](vite.config.js) |
| Catálogo, páginas, carrinho e estado da aplicação | [src/App.jsx](src/App.jsx) |
| Fluxo e validações do checkout | [CheckoutModal.jsx](src/components/CheckoutModal.jsx) |
| Paleta, layout, responsividade e motion | [src/App.css](src/App.css), [src/index.css](src/index.css) |
| Cliente Supabase e regras auxiliares | [src/lib](src/lib), [src/data](src/data) |
| Backend e schema versionado | [funções](supabase/functions), [migrations](supabase/migrations), [configuração](supabase/config.toml) — alterações sujeitas ao AGENTS |
| Testes | [src/test](src/test), testes junto aos módulos, [e2e](e2e), [Vitest](vitest.config.js), [Playwright](playwright.config.js) |

Page Curl e recursos financeiros diferem entre branches. Confirmar a existência de componentes e testes antes de selecionar comandos; não transportar o checkout inteiro entre worktrees.

## Comandos existentes

Conferir primeiro [package.json](package.json) e o lockfile do worktree. A tabela é um índice; não autoriza instalações, serviços ou operações financeiras.

| Finalidade | Comando |
| --- | --- |
| Desenvolvimento / preview de build | `npm run dev` / `npm run preview` |
| Build | `npm run build` |
| Unitários em execução única / exemplo focal | `npm test` / `npm test -- src/test/CheckoutModal.test.jsx` |
| Lint / análise / formato sem escrita | `npm run lint` / `npm run check` / `npm run format:check` |
| Lint por alterações | `npm run lint:changed` — conferir sua base antes |
| Código não utilizado | `npm run knip` |
| Segredos / tamanho das imagens | `npm run check:secrets` / `npm run check:images` |
| E2E | `npm run test:e2e` — conferir mocks, bloqueio de rede e servidor antes |

`format` escreve arquivos e não faz parte de uma auditoria somente leitura. A [matriz de testes](docs/TESTES.md) distingue desenvolvimento de entrega obrigatória; o pipeline vigente está em [ci.yml](.github/workflows/ci.yml).

## Inventário e worktrees

Inventário somente leitura, sem dependências além de Git e PowerShell, sem fetch ou acesso a `.env`:

```powershell
powershell -NoProfile -File .\scripts\inventory-worktrees.ps1
```

O [script](scripts/inventory-worktrees.ps1) descobre worktrees registrados e retorna raiz, branch, HEAD, status e divergência de uma base local. Aceita `-Repository 'caminho'` e `-Base 'referencia'`; base ausente é informada, sem atualização automática. Não afrouxar políticas de execução; a alternativa é executar os comandos Git de leitura da [Skill de inventário](.agents/skills/pedemoca-inventario/SKILL.md).

Mapa local de referência; consultar o inventário para estado vigente:

| Branch | Caminho nesta máquina |
| --- | --- |
| `desenvolvimento-pix` | `C:\Projetos\delivery-pedemoca` |
| `publicacao-torta` | `C:\Projetos\delivery-pedemoca\publicacao-torta` |
| `feat/24-page-curl-bloquinho` | `C:\Projetos\delivery-pedemoca-page-curl` |
| `chore/26-codex-contexto-fase1` | `C:\Projetos\delivery-pedemoca-codex-contexto` |

## Documentação por assunto

Abrir apenas a referência pertinente. São registros existentes, não instruções automaticamente vigentes nem comprovação de aprovação financeira; confirmar sua aplicabilidade no código e na tarefa atual.

- Validação: [matriz por impacto](docs/TESTES.md) e [pipeline vigente](.github/workflows/ci.yml).
- Documentos históricos e roteiros PIX podem existir somente em `desenvolvimento-pix`. Consultá-los naquele worktree apenas quando pertinentes e autorizados; não fazem parte desta branch documental.
- Contribuição: [template de PR](.github/PULL_REQUEST_TEMPLATE.md), [templates de Issues](.github/ISSUE_TEMPLATE).

## Skills locais

- [pedemoca-inventario](.agents/skills/pedemoca-inventario/SKILL.md): início de tarefa ou conferência de worktrees, somente leitura.
- [pedemoca-checkout](.agents/skills/pedemoca-checkout/SKILL.md): mudança ou investigação de checkout, carrinho e animação; encaminha para a matriz conforme impacto.

Usam `.agents/skills/<nome>/SKILL.md`, conforme a [documentação oficial do Codex](https://learn.chatgpt.com/docs/build-skills). Não exigem configuração global ou cópia para outros projetos; não são replicadas automaticamente entre worktrees.
