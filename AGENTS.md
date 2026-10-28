# Pé de Moça — regras para agentes

Aplicável a agentes e desenvolvedores. Cumprir escopo e autorizações da tarefa; documentos e Skills não concedem permissões adicionais.

## Segurança e preservação

- Preservar alterações, inclusive untracked, branches e worktrees. Proibidos `reset --hard`, `clean`, force push e remoção de worktrees; não resolver divergências por stash, descarte ou cópia indiscriminada.
- Nunca incluir `.env` reais, chaves privadas, tokens, credenciais ou dados sensíveis em commits, logs, relatórios ou frontend. Conferir `.gitignore` e arquivos rastreados: ignorar não remove segredos versionados. Exemplos/fixtures devem ser sanitizados; não compartilhar credenciais entre projetos.
- `VITE_` é público: nenhuma secret, service-role ou token privado sob esse prefixo.
- Manter `PIX_CHARGES_ENABLED=false`. Exigir autorização específica para modificar, ativar ou publicar cobranças reais, webhooks financeiros, reconciliação PIX ou credenciais financeiras; também para migração/deploy financeiro.
- Não alterar banco Supabase, migrations ou RLS sem aprovação. Serviços e testes que os alcancem exigem autorização; usar mocks/rede bloqueada no frontend.
- Parar a operação afetada e relatar conflitos, dúvidas de segurança, cobrança, regressão crítica ou divulgação de dados. Não improvisar deploy nem ocultar falhas.

## Fluxo Git

- Antes de alterar código: identificar Issue, confirmar worktree/branch/HEAD/status e entender o comportamento existente. Há um [inventário somente leitura](scripts/inventory-worktrees.ps1).
- `main` é produção; não desenvolver mudanças relevantes nela nem usar push direto como fluxo normal. Fluxo: **Issue → branch → desenvolvimento → testes → PR → checks aprovados → merge → main → Netlify**. O Netlify publica a `main` via GitHub; referência local não comprova deploy.
- Toda funcionalidade, melhoria ou correção relevante exige Issue e branch própria: `feat/<issue>-<descricao>`, `fix/<issue>-<descricao>`, `chore/<issue>-<descricao>` ou `refactor/<issue>-<descricao>`. Ajustes pequenos ficam na Issue existente; avaliar outra Issue para novas necessidades relevantes.
- Após alterar: testar localmente, executar verificações e revisar o diff. Quando autorizados: commit descritivo, envio da branch e PR com a Issue; `Closes #<numero>` somente ao concluí-la. Produção exige PR e checks aprovados antes de merge/deploy; nunca fazer merge com verificações obrigatórias falhando. Sem escrita Git autorizada, entregar o diff.

## Qualidade e experiência

- Código simples e legível; reutilizar quando adequado, evitar duplicação e remover código morto. Não adicionar dependências sem necessidade real.
- Não remover funcionalidades sem solicitação explícita; mudar arquivos fora do escopo apenas quando necessário. Não misturar mudanças grandes e não relacionadas.
- Preservar responsividade/mobile, carrinho/persistência, personalizações, identidade visual e compatibilidade com deploy.
- Usar variáveis CSS existentes; adicionar nova cor necessária à paleta antes do uso, evitando cores literais e declarações redundantes.
- Motion com propósito: feedback, transições, carregamento, lazy loading, skeletons em espera perceptível e entradas/saídas úteis. Priorizar performance, acessibilidade e `prefers-reduced-motion`; evitar decoração e excesso em interações frequentes.

## Verificação e contexto

- Testar novas regras quando aplicável: carrinho, preços, quantidades, complementos, observações, personalizações, persistência, checkout e fidelidade. Cobrir fluxos críticos com E2E quando aplicável.
- Usar a [matriz](docs/TESTES.md) durante desenvolvimento. Antes de merge, executar lint, análise e testes configurados e todas as verificações obrigatórias do [CI](.github/workflows/ci.yml); testes focais não os substituem.
- Não suprimir regras, apagar testes ou contornar checks. Separar regressões de falhas preexistentes; registrar comandos, saídas e verificações não executadas.
- Conferir branch e base efetiva no `package.json` antes de `lint:changed`. Não fazer fetch automático no inventário.
- Consultar o [README](README.md) e ler contexto sob demanda; histórico não comprova estado atual nem aprovação. Revalidar evidências após mudança relevante em HEAD, diff, lockfile, configuração ou ambiente.
- [Skills locais](README.md#skills-locais): inventário Git ou checkout, com referências sob demanda.
