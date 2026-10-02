# Pé de Moça — Instruções para Agentes

Este arquivo define as regras obrigatórias para qualquer agente de IA ou desenvolvedor que trabalhe neste repositório.

## 1. Fluxo de desenvolvimento

A branch `main` representa produção.

Não desenvolver novas funcionalidades, melhorias ou correções relevantes diretamente na `main`.

Fluxo padrão:

Issue → Branch → Desenvolvimento → Testes → Pull Request → Merge → Deploy

### Issues

Toda nova funcionalidade, melhoria ou correção relevante deve possuir uma Issue no GitHub.

Pequenos ajustes pertencentes a uma Issue existente devem permanecer nela, evitando Issues desnecessárias.

### Branches

Cada Issue deve possuir uma branch própria.

Padrões:

- `feat/<issue>-<descricao>` para novas funcionalidades
- `fix/<issue>-<descricao>` para correções
- `chore/<issue>-<descricao>` para infraestrutura, manutenção e configuração
- `refactor/<issue>-<descricao>` para refatorações

Exemplo:

`feat/15-imagens-dinamicas-caldas`

### Pull Requests

Toda alteração destinada à produção deve passar por Pull Request.

O PR deve mencionar a Issue relacionada.

Quando o PR concluir completamente a Issue, utilizar:

`Closes #<numero>`

Exemplo:

`Closes #15`

Não realizar merge enquanto verificações obrigatórias estiverem falhando.

## 2. Deploy

A branch `main` representa a versão de produção.

O Netlify está conectado ao GitHub e realiza o deploy da `main`.

Não utilizar push direto na `main` como fluxo normal de desenvolvimento.

O fluxo esperado é:

Branch → Pull Request → verificações → Merge → main → Netlify

## 3. Qualidade de código

Priorizar:

- código simples e legível;
- componentes reutilizáveis quando fizer sentido;
- evitar duplicação desnecessária;
- remover código morto;
- preservar funcionalidades existentes;
- não adicionar dependências sem necessidade real.

Ferramentas de lint, análise e testes configuradas no projeto devem ser executadas antes do merge.

## 4. Testes

Novas regras de negócio devem possuir testes quando aplicável.

Priorizar testes para:

- carrinho;
- preços;
- quantidades;
- complementos;
- observações;
- personalizações;
- persistência;
- checkout;
- regras de fidelidade.

Fluxos críticos do usuário devem possuir testes end-to-end quando aplicável.

## 5. Interface e Motion

Seguir princípios de motion orientados à experiência do usuário.

Animações devem possuir propósito e não devem ser adicionadas apenas como decoração.

Priorizar:

- feedback visual de ações;
- transições suaves quando apropriadas;
- estados de carregamento;
- lazy loading quando aplicável;
- skeletons quando houver espera perceptível;
- animações de entrada e saída quando melhorarem a compreensão;
- performance;
- acessibilidade;
- suporte a `prefers-reduced-motion`.

Evitar animações excessivas em interações frequentes.

## 6. CSS e identidade visual

Utilizar as variáveis CSS da paleta do projeto.

Evitar inserir cores diretamente nos componentes ou novas declarações CSS quando já existir uma variável correspondente.

Caso uma nova cor seja necessária, adicioná-la primeiro à paleta de variáveis CSS.

Preservar a identidade visual da Pé de Moça.

## 7. Processo de alteração

Antes de modificar código:

1. Identificar a Issue relacionada.
2. Confirmar que a branch correta está ativa.
3. Entender o comportamento existente antes de alterá-lo.

Depois da alteração:

1. Testar localmente.
2. Executar verificações automatizadas disponíveis.
3. Revisar os arquivos modificados.
4. Criar commit descritivo.
5. Enviar a branch ao GitHub.
6. Criar Pull Request.
7. Referenciar a Issue.
8. Aguardar verificações.
9. Fazer merge somente após aprovação das verificações.

## 8. Segurança de alterações

Não remover funcionalidades existentes sem solicitação explícita.

Não alterar arquivos ou componentes fora do escopo da Issue sem necessidade.

Não realizar mudanças grandes e não relacionadas dentro do mesmo PR.

Se uma nova necessidade relevante surgir durante uma tarefa, considerar criar uma nova Issue.

## 9. Pé de Moça

Ao alterar o projeto, preservar:

- funcionamento responsivo;
- experiência mobile;
- carrinho e persistência;
- personalizações dos produtos;
- identidade visual;
- compatibilidade com o fluxo de deploy existente.

Toda mudança deve ser validada localmente antes de chegar à produção.
