import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Helper: Smart heuristic fallback parser if API is unavailable or offline
function fallbackHeuristicParser(text: string, defaultSupplier?: string) {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const items: Array<{
    produto: string;
    quantidadePedida: string;
    fornecedor: string;
    categoria: string;
    observacao?: string;
  }> = [];

  let currentCategory = 'Hortifrúti';
  let currentSectionSupplier = '';

  const unitsRegex = '(?:cx|cxs|caixas?|sc|sacos?|kg|quilos?|un|unid|unidades?|bdj|bandejas?|dz|duzias?|dúzias?|maco|maço|maços?|fd|fardos?|rl|rolos?|pct|pacotes?|bola|bolas?)';

  for (const line of lines) {
    // Clean asterisks, dashes, hashes
    const trimmed = line.trim();

    // Skip generic title "Lista"
    if (/^[*_~#\s]*lista[*_~#\s:]*$/i.test(trimmed)) {
      continue;
    }

    // Check for Category section headers: e.g. *Hortifruti:*, Hortifruti:, *Bomboniere:*, *Hortaliças:*, etc.
    const categoryHeaderMatch = trimmed.match(/^[*_~#\s]*(hortifruti|hortali[cç]as?|bomboniere|frutas?|legumes?|verduras?|folhagens?|embalagens?|mercearia|padaria|diversos)[*_~#\s:]*$/i);
    if (categoryHeaderMatch) {
      const rawCat = categoryHeaderMatch[1].toLowerCase();
      if (rawCat.includes('bomboniere')) currentCategory = 'Bomboniere';
      else if (rawCat.includes('hortali')) currentCategory = 'Hortaliças';
      else if (rawCat.includes('fruta')) currentCategory = 'Frutas';
      else if (rawCat.includes('legume')) currentCategory = 'Legumes';
      else if (rawCat.includes('embalag')) currentCategory = 'Embalagens';
      else currentCategory = 'Hortifrúti';
      continue;
    }

    // Check if line looks like a supplier header (e.g., "BOX 14:", "FORNECEDOR CEASA:", "CEASA:")
    const supplierHeaderMatch = trimmed.match(/^(\*{0,2})(fornecedor\s*:?|box\s*\d+|ceasa|distribuidora[^\n:]*):?(.*)$/i);
    if (supplierHeaderMatch && !trimmed.match(/\d+\s*(cx|kg|sc|un|bdj|dz|maço)/i)) {
      currentSectionSupplier = trimmed.replace(/[:*#-]/g, '').trim();
      continue;
    }

    // Extract supplier in parentheses if present: "1cx Tomate (Box 14 Ceasa)"
    let itemSupplier = currentSectionSupplier || '';
    let cleanLine = trimmed;

    const parenMatch = cleanLine.match(/\(([^)]+)\)/);
    if (parenMatch) {
      itemSupplier = parenMatch[1].trim();
      cleanLine = cleanLine.replace(/\([^)]+\)/, '').trim();
    }

    // Strip leading dashes, asterisks, bullet points or list numbers: "- ", "* ", "1. ", "• "
    cleanLine = cleanLine.replace(/^[-*•\d+.)\s]+/, '').trim();
    // Also remove any remaining isolated asterisks that Charles might have placed
    cleanLine = cleanLine.replace(/^\*+|\*+$/g, '').trim();
    if (!cleanLine) continue;

    let quantidade = '';
    let produto = cleanLine;

    // Pattern 1: Fractions (e.g., "1/2cx Tomate", "1/2sc Inhame", "1/4cx Pimentão")
    const fractionMatch = cleanLine.match(/^(1\/2|1\/4|3\/4)\s*(cx|cxs|caixas?|sc|sacos?|kg|un|bdj|fd)?\s*(?:de\s+)?(.*)$/i);
    if (fractionMatch) {
      const frac = fractionMatch[1];
      const unit = fractionMatch[2] ? fractionMatch[2].toLowerCase() : (currentCategory === 'Hortaliças' ? 'maço' : 'cx');
      quantidade = `${frac} ${unit}`;
      produto = fractionMatch[3].trim();
    } else {
      // Pattern 2: Leading quantity with unit (glued or spaced, e.g. "1cx Uva", "16un Melancia", "60kg Melão", "1sc Batata", "1fd Pipoca")
      const leadingQtyRegex = new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s*(${unitsRegex})\\s+(?:de\\s+)?(.*)$`, 'i');
      const leadingMatch = cleanLine.match(leadingQtyRegex);

      if (leadingMatch) {
        let unitStr = leadingMatch[2].toLowerCase();
        // Normalize common abbreviations
        if (unitStr === 'cxs' || unitStr === 'caixa' || unitStr === 'caixas') unitStr = 'cx';
        if (unitStr === 'saco' || unitStr === 'sacos') unitStr = 'sc';
        if (unitStr === 'unid' || unitStr === 'unidade' || unitStr === 'unidades') unitStr = 'un';
        if (unitStr === 'quilo' || unitStr === 'quilos') unitStr = 'kg';
        if (unitStr === 'fardo' || unitStr === 'fardos') unitStr = 'fd';

        quantidade = `${leadingMatch[1]} ${unitStr}`;
        produto = leadingMatch[3].trim();
      } else {
        // Pattern 3: Number only without explicit unit (e.g. "5 Alface Americano", "15 Couve", "5 Cebolinha")
        const numberOnlyMatch = cleanLine.match(/^(\d+)\s+([a-zA-ZÀ-ÿ].*)$/);
        if (numberOnlyMatch && !/^\d+\s*(?:g|mg|ml|l)\b/i.test(cleanLine)) {
          const num = numberOnlyMatch[1];
          const prodRest = numberOnlyMatch[2].trim();
          // If in Hortaliças, assume "un" or "maços"
          const defaultUnit = currentCategory === 'Hortaliças' ? 'maços' : 'un';
          quantidade = `${num} ${defaultUnit}`;
          produto = prodRest;
        } else {
          // Pattern 4: Unit at end (e.g. "Tomate 10 cx")
          const trailingQtyRegex = new RegExp(`^(.*?)\\s+[-–—:]?\\s*(\\d+(?:[.,]\\d+)?\\s*${unitsRegex})$`, 'i');
          const trailingMatch = cleanLine.match(trailingQtyRegex);

          if (trailingMatch) {
            produto = trailingMatch[1].trim();
            quantidade = trailingMatch[2].trim().toLowerCase();
          } else {
            // Pattern 5: No quantity found at all (e.g. "Tomate Cereja", "Repolho Branco", "Banana Prata", "Paçoca Gigante")
            quantidade = '';
            produto = cleanLine.replace(/[-–—:]/g, ' ').replace(/\s+/g, ' ').trim();
          }
        }
      }
    }

    // Clean up product string
    produto = produto.replace(/^[-–—:]\s*/, '').replace(/\s+/g, ' ').trim();

    // Determine category based on current section or product names
    let categoria = currentCategory;
    const lower = produto.toLowerCase();
    if (currentCategory === 'Hortifrúti') {
      if (/banana|maca|maçã|laranja|mamao|mamão|melancia|abacaxi|uva|manga|limao|limão|morango|pera|pêra|abacate|maracuja|maracujá|kiwi|goiaba|melao|melão|tangerina|pokan|paulistinha|pessego|pêssego/.test(lower)) {
        categoria = 'Frutas';
      } else if (/tomate|batata|cebola|cenoura|chuchu|abobrinha|pimentao|pimentão|pepino|mandioca|beterraba|alho|berinjela|quiabo|vagem|abobora|abóbora|gengibre|inhame|cará|cara/.test(lower)) {
        categoria = 'Legumes';
      } else if (/repolho|alface|couve|rucula|rúcula|espinafre|cheiro verde|coentro|salsa|cebolinha|agriao|agrião|brocolis|brócolis/.test(lower)) {
        categoria = 'Hortaliças';
      }
    }

    if (produto.length >= 2) {
      items.push({
        produto: produto.charAt(0).toUpperCase() + produto.slice(1),
        quantidadePedida: quantidade,
        fornecedor: itemSupplier || (defaultSupplier ? defaultSupplier : ''),
        categoria,
        observacao: undefined,
      });
    }
  }

  return items;
}

// POST /api/ai/parse-purchases
app.post('/api/ai/parse-purchases', async (req, res) => {
  try {
    const { text, defaultSupplier = '' } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        error: 'O texto da lista de compras é obrigatório.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('GEMINI_API_KEY não configurada no servidor. Usando processamento inteligente local.');
      const fallbackItems = fallbackHeuristicParser(text, defaultSupplier);
      return res.json({
        items: fallbackItems,
        source: 'local_heuristic',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const prompt = `Você é o assistente inteligente de compras e conferência de hortifrúti da empresa "Beto da Fruta".
Sua tarefa é analisar a mensagem de compra enviada pelo WhatsApp (feita por Charles ou Amanda) e extrair com máxima precisão todos os itens a serem comprados para a loja.

TEXTO INFORMAL DE COMPRA:
"""
${text}
"""

REGRAS OBRIGATÓRIAS DE EXTRAÇÃO:
1. QUANTIDADE ANTES DO PRODUTO (PADRÃO OFICIAL DO BETO DA FRUTA):
   - A quantidade vem antes do produto!
     Exemplos reais:
     • "1cx Uva Vitória" ➔ Qtd: "1 cx", Produto: "Uva Vitória"
     • "1/2cx Tomate Maduro" ➔ Qtd: "1/2 cx", Produto: "Tomate Maduro"
     • "1sc Batata Doce Vitória" ➔ Qtd: "1 sc", Produto: "Batata Doce Vitória"
     • "1/2sc Inhame" ➔ Qtd: "1/2 sc", Produto: "Inhame"
     • "1/2sc Cará" ➔ Qtd: "1/2 sc", Produto: "Cará"
     • "16un Melancia" ➔ Qtd: "16 un", Produto: "Melancia"
     • "60kg Melão Espanhol" ➔ Qtd: "60 kg", Produto: "Melão Espanhol"
     • "1fd Pipoca Bokus 30g" ➔ Qtd: "1 fd", Produto: "Pipoca Bokus 30g"
     • "5 Alface Americano" ➔ Qtd: "5 un" (ou "5 maços"), Produto: "Alface Americano"
     • "1 Bola de Coentro" ➔ Qtd: "1 bola", Produto: "Coentro"
     • "15 Couve" ➔ Qtd: "15 maços", Produto: "Couve"

2. PRODUTOS SEM QUANTIDADE (NÃO INVENTE NADA):
   - Na rotina da loja, vários produtos vêm na lista sem quantidade especificada para serem checados na hora ou cotados no Ceasa.
     Exemplos reais do WhatsApp:
     • "- Tomate Cereja" ➔ Qtd: "" (string vazia), Produto: "Tomate Cereja"
     • "- Repolho Branco" ➔ Qtd: "" (string vazia), Produto: "Repolho Branco"
     • "- Banana Prata" ➔ Qtd: "" (string vazia), Produto: "Banana Prata"
     • "- Banana Comprida" ➔ Qtd: "" (string vazia), Produto: "Banana Comprida"
     • "- Paçoca Gigante" ➔ Qtd: "" (string vazia), Produto: "Paçoca Gigante"
     • "- Gula Sabor Cebola" ➔ Qtd: "" (string vazia), Produto: "Gula Sabor Cebola"
     • "- Brownie Evaristo" ➔ Qtd: "" (string vazia), Produto: "Brownie Evaristo"
   - Se um produto vier sem quantidade no texto, NUNCA invente um número. Deixe 'quantidadePedida' como string vazia "".

3. ASTERISCOS E SEÇÕES DE CATEGORIA:
   - Charles costuma colocar asteriscos nos títulos (ex: "*Hortifruti:*", "*Bomboniere:*", "*Hortaliças:*") e Amanda envia sem asteriscos (ex: "Hortifruti:", "Bomboniere:").
   - Ignore os asteriscos e utilize essas linhas como agrupador de categoria para todos os produtos que vêm abaixo daquela seção!
     • Produtos abaixo de *Hortifruti:* ou Hortifruti: ➔ Categoria: "Frutas", "Legumes" ou "Hortifrúti"
     • Produtos abaixo de *Bomboniere:* ou Bomboniere: ➔ Categoria: "Bomboniere"
     • Produtos abaixo de *Hortaliças:* ou Hortaliças: ➔ Categoria: "Hortaliças"

4. FORNECEDOR:
   - Se o fornecedor vier especificado entre parênteses (ex: "(Box 14 Ceasa)") ou no cabeçalho de bloco, utilize-o.
   - Caso contrário, utilize "${defaultSupplier}" (ou deixe vazio se não informado) para conferência na tela do app.

Retorne rigorosamente em formato JSON estruturado conforme o schema.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          description: 'Lista de produtos de compra identificados no texto.',
          items: {
            type: Type.OBJECT,
            properties: {
              produto: {
                type: Type.STRING,
                description: 'Nome padronizado do produto (ex: Tomate Saladete)',
              },
              quantidadePedida: {
                type: Type.STRING,
                description: 'Quantidade com unidade de medida (ex: 10 cx, 5 sc, 15 maços) ou string vazia se não informado',
              },
              fornecedor: {
                type: Type.STRING,
                description: 'Nome do fornecedor identificado, ou vazio se não houver',
              },
              categoria: {
                type: Type.STRING,
                description: 'Frutas, Legumes, Folhagens, Verduras, Embalagens ou Outros',
              },
              observacao: {
                type: Type.STRING,
                description: 'Observações de qualidade, calibre ou ponto de maturação, se houver',
              },
            },
            required: ['produto', 'quantidadePedida', 'fornecedor', 'categoria'],
          },
        },
      },
      required: ['items'],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.1,
      },
    });

    const responseText = response.text || '{}';
    const parsedData = JSON.parse(responseText);

    const items = Array.isArray(parsedData.items) ? parsedData.items : [];

    // Fallback if model returned empty array for nonempty text
    if (items.length === 0 && text.trim().length > 10) {
      const fallback = fallbackHeuristicParser(text, defaultSupplier);
      return res.json({
        items: fallback,
        source: 'gemini_fallback',
      });
    }

    return res.json({
      items,
      source: 'gemini-3.8-flash',
    });
  } catch (error: any) {
    console.error('Erro na rota /api/ai/parse-purchases:', error);
    try {
      // Graceful fallback to heuristic extraction on network/timeout error
      const { text = '', defaultSupplier = 'Ceasa Box 14' } = req.body || {};
      const fallbackItems = fallbackHeuristicParser(text, defaultSupplier);
      return res.json({
        items: fallbackItems,
        source: 'local_heuristic_after_error',
        notice: 'Processado com motor local devido a oscilação de conexão com a IA.',
      });
    } catch (e) {
      return res.status(500).json({
        error: 'Falha ao processar lista de compras com IA.',
        details: error?.message || String(error),
      });
    }
  }
});

// Setup Vite middleware for Development or Static serving for Production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Beto da Fruta rodando em http://localhost:${PORT}`);
  });
}

startServer();
