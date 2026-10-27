# Correção da Extração da Lista Real de Compras & Paginação A4 na Impressão de Espelhos e Folha de Atividades

Aprimoramento completo do motor de importação de listas de compras por texto livre (WhatsApp) para extrair 100% das quantidades coladas (`1cx`, `1sc`, `2cx`, `16Un`, `5`, `1 Bola`) e categorias automaticamente com edição livre, aliado à correção definitiva da impressão do **Espelho de Conferência de Mercadorias** e da **Folha de Atividades** para que listas longas fluam por múltiplas páginas A4 reais sem repetir nem cortar na 1ª página.

## User Review & Critical Decisions

> [!IMPORTANT]
> Decisões confirmadas e escopo consolidado para execução:

- **Decisão Confirmada 1 (Categorização Inteligente + Campo Editável)**: Para os itens sob `*Hortifruti:*`, o sistema identificará automaticamente se o item pertence a **Frutas** (ex: *Uva Vitória, Tangerina Importada, Maracujá 1ª, Pêra Foreli, Manga Tomy, Goiaba Verde, Laranja Pêra/Lima, Limão Taiti, Mamão Papaya/Formosa, Melancia, Banana Prata, Pinha, Atemoia*) ou **Legumes** (ex: *Tomate, Cebola, Batata Inglesa, Batata Doce Vitória, Beterraba, Tomate Cereja, Brócolis, Abóbora*), respeitando também todas as demais seções explícitas da lista (**Laticínios**, **Embalagens**, **Hortaliças**, **Bomboniere**, **Temperos**). Na tela de revisão, o campo de categoria permitirá escolher na lista ou digitar/editar livremente qualquer categoria.
- **Decisão Confirmada 2 (Itens Sem Número na Lista)**: Produtos enviados sem quantidade na lista (ex: *Beterraba, Tomate Cereja, Brócolis, Abóbora, Banana Prata, Pinha, Atemoia, Manteiga Bezerra, Manteiga Giva, Álcool, Sabão em Pedra, itens de Bomboniere e Temperos*) permanecerão com a quantidade em branco (`Sem Quantidade`) para preenchimento posterior, sem inventar nem zerar valores.
- **Decisão Confirmada 3 (Blindagem contra "Cx" no Nome do Produto)**: O extrator passa a priorizar a análise determinística linha a linha combinada com sanitização no cliente e no servidor, impedindo que `- 1cx Uva Vitória` vire `Cx Uva Vitória` sem quantidade.
- **Decisão Confirmada 4 (Correção de Impressão Multi-Páginas sem Duplicação)**: Tanto o **Espelho de Conferência de Mercadoria** quanto a **Folha de Atividades** terão isolamento de impressão A4 real, eliminando a repetição da 1ª folha em 4 páginas e exibindo todos os itens (do item 1 até o último item da lista, com rodapé de assinatura ao final).

---

## 1. Overview & Core Concept

- **O Que Faz**:
  1. Transforma instantaneamente a lista real do WhatsApp em itens estruturados de compra com **Nome Limpo**, **Quantidade Extraída** (`1 cx`, `1 sc`, `2 cx`, `16 un`, `5 maços`, `1 bola`, `4 maços`), **Categoria Automática Editável** e **Zero Alucinação**.
  2. Corrige o motor de impressão (`@media print`) para que o **Espelho de Compra/Conferência** e a **Folha de Atividades** imprimam todas as linhas da tabela em sequência (Página 1: itens 1–25, Página 2: itens 26–47 + assinaturas), sem repetir a primeira página nem cortar itens.
- **Público-Alvo**: Gestão (Charles e Amanda) e equipe operacional (Lucas, Rafael e equipe de loja) no uso diário em tela e na prancheta física A4.
- **Valor Principal**: Elimina retrabalho manual ao importar listas do WhatsApp e garante que as folhas impressas para o Ceasa e para a conferência na loja contenham 100% dos produtos sem desperdício de papel.

---

## 2. User Experience & Visual Design

- **Fluxo 1 — Importação e Revisão da Lista Real do WhatsApp**:
  - `- 1cx Uva Vitória` ➔ Produto: `Uva Vitória` | Qtd: `1 cx` | Categoria: `Frutas`
  - `- 1cx Maracujá 1ª` ➔ Produto: `Maracujá 1ª` | Qtd: `1 cx` | Categoria: `Frutas`
  - `- 1sc Batata Inglesa` ➔ Produto: `Batata Inglesa` | Qtd: `1 sc` | Categoria: `Legumes`
  - `- 16Un Melancia` ➔ Produto: `Melancia` | Qtd: `16 un` | Categoria: `Frutas`
  - `- MANTEIGA BEZERRA` (sob `*Laticínio:*`) ➔ Produto: `Manteiga Bezerra` | Qtd: `""` | Categoria: `Laticínios`
  - `- Álcool` (sob `*Embalagens:*`) ➔ Produto: `Álcool` | Qtd: `""` | Categoria: `Embalagens`
  - `- 1 Bola de Coentro` (sob `*Hortaliças:*`) ➔ Produto: `Coentro` | Qtd: `1 bola` | Categoria: `Hortaliças`
  - `- Bokus 30g` (sob `*Bomboniere:*`) ➔ Produto: `Bokus 30g` | Qtd: `""` | Categoria: `Bomboniere`
  - `- Edu Guedes` (sob `*Temperos:*`) ➔ Produto: `Edu Guedes` | Qtd: `""` | Categoria: `Temperos`
  - **Categoria Editável**: Em cada linha revisada, o usuário pode selecionar uma categoria existente ou digitar/editar livremente o nome da categoria.

- **Fluxo 2 — Impressão Multi-Página A4 (Espelho de Conferência & Folha de Atividades)**:
  - Ao clicar em **Imprimir / Salvar PDF**, o conteúdo de fundo do painel é ocultado (`display: none !important` no conteúdo fora do modal de impressão) e o modal de impressão deixa de ser `position: fixed` com `max-height: 94vh` e `overflow-y: auto`, passando a ter fluxo estático natural (`position: static`, `height: auto`, `max-height: none`, `overflow: visible`).
  - O cabeçalho da tabela (`<thead>`) repete-se automaticamente no topo de cada nova página A4 (`display: table-header-group`), enquanto os itens continuam do item 17 em diante até o final da lista, seguidos pelo bloco de assinaturas (Ceasa / Recepção Kombi / Reposição nas Bancas).

---

## 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Causa Raiz e Solução para a Duplicação de 4 Páginas na Impressão**
  - *Causa Identificada*: Os modais de impressão utilizam `fixed inset-0` e `max-h-[94vh] overflow-y-auto` sobre o painel principal. No navegador (Chromium/Edge/Chrome), elementos com `position: fixed` são carimbados repetidamente em todas as páginas geradas pela altura do painel de fundo (4 páginas), enquanto o `max-h-[94vh]` corta a tabela no item 16.
  - *Abordagem Escolhida*: Durante `@media print`, ocultar o painel principal da aplicação quando o modal de impressão estiver aberto e converter toda a hierarquia do modal de impressão para fluxo de documento nativo (`position: static !important; max-height: none !important; overflow: visible !important; display: block !important;`), permitindo paginação A4 real do item 1 ao último item.
- **Decisão 2: Extração Determinística Linha a Linha + Sanitização Dupla**
  - *Abordagem Escolhida*: Separar quantidades coladas no início da linha (`1cx`, `1sc`, `2cx`, `16Un`, `5`, `1 Bola de`) preservando sufixos legítimos no final do nome do produto (`30g`, `45g`, `1ª`), tanto no servidor quanto no cliente.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│             1. Importação de Lista de Compras (WhatsApp)                │
│  • Extrator Determinístico + Sanitizador (Cliente & Servidor)           │
│  • Separa Qtd inicial ("1cx Uva" -> Qtd: "1 cx", Produto: "Uva")        │
│  • Classifica Hortifruti em Frutas/Legumes + Campo Categoria Editável   │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│       2. Motor de Impressão A4 Multi-Páginas (Compras & Atividades)     │
│  • Oculta o painel de fundo (.app-shell-content) no @media print        │
│  • Remove position:fixed, max-h-[94vh] e overflow-y:auto no print       │
│  • Paginação contínua (itens 1..N) + thead em cada página + Assinaturas │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Mapeamento de Componentes e Estado**:
  - **Extrator e Modal de Revisão de Compras**: Sanitização automática de prefixos de unidade colados, preservação de itens sem quantidade em branco, e campo editável de categoria com sugestões rápidas (`datalist` / edição direta).
  - **Modais de Impressão (Espelho de Conferência de Mercadoria & Folha de Atividades)**: Classes dedicadas de isolamento de impressão (`print-modal-root`, `print-modal-dialog`, `print-modal-body`) combinadas com regras `@media print` que desativam o corte de altura (`max-height: none`) e a repetição de camada fixa (`position: static`), garantindo impressão completa de todas as páginas.
