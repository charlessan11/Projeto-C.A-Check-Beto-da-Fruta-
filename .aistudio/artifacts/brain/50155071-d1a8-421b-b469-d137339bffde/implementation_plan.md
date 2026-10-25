# Importação Inteligente c/ IA & Planilha Impressa de Prancheta (Uso Duplo)

Calibração do processamento com IA (Gemini 3.8 Flash) e do motor local baseada no **modelo real de mensagem do WhatsApp do Hortifrúti Beto da Fruta** (enviada por Charles e Amanda), com suporte a categorias por blocos (`*Hortifruti:*`, `*Bomboniere:*`, `*Hortaliças:*`), frações (`1/2cx`, `1/2sc`), quantidades coladas na unidade (`1cx`, `1sc`, `16un`), números puros (`15 Couve`, `5 Alface`), unidades regionais (`1 Bola de Coentro`), itens sem quantidade e **Planilha Impressa A4 de Prancheta para Uso Duplo (Ceasa e Conferência na Loja)**.

---

## Revisão do Usuário & Decisões Confirmadas

> [!IMPORTANT]
> **Padrão Real de Mensagem Confirmado:**
> 1. **Asteriscos Opcionais**: Charles costuma colocar asteriscos nos títulos (`*Hortifruti:*`, `*Bomboniere:*`), enquanto Amanda envia sem asteriscos (`Hortifruti:`, `Hortaliças:`). O sistema trata ambos de forma transparente e flexível.
> 2. **Categorização Automática por Seções**: As linhas de título definem a categoria dos produtos que vêm abaixo até a próxima seção (`Hortifrúti`, `Bomboniere`, `Hortaliças`, `Frutas`, etc.).
> 3. **Quantidades Fracionadas**: Suporte nativo a `1/2cx` (meia caixa) e `1/2sc` (meio saco) sem quebrar o nome do produto.
> 4. **Quantidades Coladas ou Sem Espaço**: Reconhecimento de `1cx`, `1sc`, `16un`, `60kg`, `40kg`, `1fd` e também `1 cx`, `1 sc`.
> 5. **Números sem Unidade Explícita**: Linhas como `5 Alface Americano`, `15 Couve`, `5 Cebolinha` e unidades regionais de feira como `1 Bola de Coentro`.
> 6. **Itens Sem Quantidade**: Linhas como `Tomate Cereja`, `Repolho Branco`, `Banana Prata`, `Banana Comprida`, `Paçoca Gigante`, `Brownie Evaristo` são preservadas com quantidade pendente `""` e sinalizadas com destaque âmbar `⚠️ Sem Quantidade` para revisão ágil.
> 7. **Folha Impressa de Prancheta A4 de Uso Duplo**: O comprador leva a folha ao Ceasa para cotação e compra, e Lucas/Rafael utilizam **esse mesmo impresso** no descarregamento da Kombi para conferir o que chegou.

---

## 1. Visão Geral & Casos de Teste Reais

### Mapeamento do Exemplo Real Fornecido:

| Texto Original na Mensagem | Quantidade Identificada | Produto Padronizado | Categoria Atribuída | Observação / Status |
| :--- | :---: | :--- | :--- | :--- |
| `*Hortifruti:*` | — | *(Início do Bloco)* | Hortifrúti | Seção / Categoria |
| `- 1cx Uva Vitória` | **1 cx** | Uva Vitória | Hortifrúti (Frutas) | Quantidade antes |
| `- 1cx Maçã Nacional Fuji` | **1 cx** | Maçã Nacional Fuji | Hortifrúti (Frutas) | Quantidade antes |
| `- 1cx Laranja Pokan ou Paulistinha` | **1 cx** | Laranja Pokan ou Paulistinha | Hortifrúti (Frutas) | Nome composto |
| `- 1/2cx Tomate Maduro` | **1/2 cx** | Tomate Maduro | Hortifrúti (Legumes) | **Fração de caixa** |
| `- Tomate Cereja` | *(Vazio)* | Tomate Cereja | Hortifrúti (Legumes) | **⚠️ Sem Quantidade** |
| `- Repolho Branco` | *(Vazio)* | Repolho Branco | Hortifrúti (Legumes) | **⚠️ Sem Quantidade** |
| `- Banana Prata` | *(Vazio)* | Banana Prata | Hortifrúti (Frutas) | **⚠️ Sem Quantidade** |
| `- 16un Melancia` | **16 un** | Melancia | Hortifrúti (Frutas) | Unidades |
| `- 60kg Melão Espanhol` | **60 kg** | Melão Espanhol | Hortifrúti (Frutas) | Peso em kg |
| `- 1sc Batata Doce Vitória` | **1 sc** | Batata Doce Vitória | Hortifrúti (Legumes) | Saco |
| `- 1/2sc Inhame` | **1/2 sc** | Inhame | Hortifrúti (Legumes) | **Fração de saco** |
| `- 1/2sc Cará` | **1/2 sc** | Cará | Hortifrúti (Legumes) | **Fração de saco** |
| `*Bomboniere:*` | — | *(Início do Bloco)* | Bomboniere | Nova Categoria |
| `- Paçoca Gigante` | *(Vazio)* | Paçoca Gigante | Bomboniere | **⚠️ Sem Quantidade** |
| `- 1fd Pipoca Bokus 30g` | **1 fd** | Pipoca Bokus 30g | Bomboniere | Fardo |
| `*Hortaliças:*` | — | *(Início do Bloco)* | Hortaliças | Nova Categoria |
| `- 5 Alface Americano` | **5 un** / **5** | Alface Americano | Hortaliças | Quantidade numeral |
| `- 1 Bola de Coentro` | **1 bola** | Coentro | Hortaliças | Unidade regional |
| `- 15 Couve` | **15 maços** / **15** | Couve | Hortaliças | Quantidade numeral |

---

## 2. Experiência do Usuário & Fluxo Operacional

```
┌────────────────────────────────────────────────────────┐
│  1. Entrada de Texto (WhatsApp Charles ou Amanda)       │
│     - Suporte a títulos com/sem asteriscos:            │
│       *Hortifruti:*, Bomboniere:, Hortaliças:          │
│     - Botão de exemplo real adicionado:                │
│       "Exemplo Real Charles & Amanda"                  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│  2. Motor Duplo de Extração (Gemini 3.8 + Fallback)     │
│     - Reconhece 1/2cx, 1/2sc, 1cx, 16un, 60kg         │
│     - Reconhece numerais puros: 5 Alface, 15 Couve     │
│     - Preserva itens sem quantidade: Tomate Cereja     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│  3. Tela de Conferência Prévia                         │
│     - Aba "Sem Quantidade (N)" com destaque âmbar      │
│     - Chips rápidos: [+ 1/2 cx] [+ 1 cx] [+ 1/2 sc]    │
│     - Atribuição de fornecedor em lote                 │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│  4. Impressão A4 de Prancheta para Uso Duplo           │
│     - Comprador leva ao Ceasa para cotar e comprar     │
│     - Lucas e Rafael conferem no mesmo impresso        │
│     - Baixa digital em 1 clique: "Tudo Conforme"       │
└────────────────────────────────────────────────────────┘
```

---

## 3. Decisões de Arquitetura & Implementação

### Decisão 1: Ajuste de Expressões Regulares no Backend (`server.ts`)
- **Frações**: Suporte explícito a `1/2`, `1/4`, `3/4` e números decimais (`0.5`, `1,5`).
  Regex atualizada para capturar: `((?:1\/2|1\/4|3\/4|\d+(?:[.,]\d+)?)\s*(?:cx|cxs|sc|sacos?|kg|un|unid|bdj|dz|fd|rl|bola|maço|maços)?)\s+(.*)`.
- **Seções e Categorias**: Reconhecimento dinâmico de cabeçalhos de bloco com ou sem asteriscos (`*Hortifruti:*`, `Hortifruti:`, `*Bomboniere:*`, `*Hortaliças:*`). Todos os itens seguintes herdam a categoria até a próxima seção.
- **Quantidades numéricas puras**: Para hortaliças e itens contáveis (ex.: `5 Alface`, `15 Couve`, `5 Cebolinha`), o numeral inicial é extraído como quantidade (`5 un` ou `5 maços`).

### Decisão 2: Chips Específicos para Frações no Modal (`PurchaseAiImportModal.tsx`)
- Adição dos chips rápidos de fração solicitados pelo padrão Ceasa:
  `[+ 1/2 cx]`, `[+ 1 cx]`, `[+ 1/2 sc]`, `[+ 1 sc]`, `[+ 5 cx]`, `[+ 10 cx]`, `[+ 5 maços]`.
- Botão pré-configurado no modal: **"Carregar Exemplo Real Beto da Fruta"** para demonstração e teste imediato.

### Decisão 3: Manutenção do Formato de Prancheta A4 de Uso Duplo
- Garantia de que todos os produtos (incluindo Bomboniere e Hortaliças) sejam impressos organizados por categoria na folha de prancheta, facilitando o percurso do comprador no Ceasa e a conferência na loja.

---

## 4. Próximos Passos (Após Aprovação do Plano)

1. Atualizar o regex e o prompt do backend em `server.ts` para cobrir perfeitamente frações (`1/2cx`, `1/2sc`), cabeçalhos com/sem asteriscos (`*Hortifruti:*`, `*Bomboniere:*`) e números puros.
2. Adicionar os botões de preenchimento rápido fracionado (`1/2 cx`, `1/2 sc`) e o botão de exemplo real no `PurchaseAiImportModal.tsx`.
3. Executar compilação e validação do fluxo completo.
