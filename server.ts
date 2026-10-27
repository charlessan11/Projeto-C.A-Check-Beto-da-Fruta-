import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Helper: Normalize category header name (e.g., "*Lista de Temperos:*" -> "Temperos", "*Laticínio:*" -> "Laticínios")
function normalizeCategoryName(rawHeader: string): string {
  let clean = rawHeader
    .replace(/^[*_~#\s-]+/, '')
    .replace(/[*_~#\s:-]+$/, '')
    .replace(/^(?:lista\s+de\s+|setor\s+de\s+|setor\s+|categoria\s*:?\s*)/i, '')
    .trim();

  if (!clean) return 'Hortifrúti';

  const lower = clean
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (lower === 'hortifruti') return 'Hortifrúti';
  if (lower.includes('hortali')) return 'Hortaliças';
  if (lower.includes('bombonier')) return 'Bomboniere';
  if (lower.includes('tempero') || lower.includes('condimento') || lower.includes('especiaria')) return 'Temperos';
  if (lower.includes('laticin')) return 'Laticínios';
  if (lower === 'fruta' || lower === 'frutas') return 'Frutas';
  if (lower === 'legume' || lower === 'legumes') return 'Legumes';
  if (lower === 'verdura' || lower === 'verduras') return 'Verduras';
  if (lower.includes('folhagen')) return 'Folhagens';
  if (lower.includes('embalagen') || lower.includes('limpeza')) return 'Embalagens';
  if (lower.includes('mercearia')) return 'Mercearia';

  // Title-case any custom category
  return clean
    .split(/\s+/)
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
    .join(' ')
    .replace(/^./, (c) => c.toUpperCase());
}

// Helper: Normalize unit token
function normalizeUnitToken(rawUnit: string): string {
  const u = rawUnit.toLowerCase().trim();
  if (u === 'cxs' || u === 'caixa' || u === 'caixas' || u === 'cx') return 'cx';
  if (u === 'saco' || u === 'sacos' || u === 'sc') return 'sc';
  if (u === 'unid' || u === 'unidade' || u === 'unidades' || u === 'un') return 'un';
  if (u === 'quilo' || u === 'quilos' || u === 'kg') return 'kg';
  if (u === 'grama' || u === 'gramas' || u === 'gr' || u === 'g') return 'g';
  if (u === 'fardo' || u === 'fardos' || u === 'fd') return 'fd';
  if (u === 'pacote' || u === 'pacotes' || u === 'pct') return 'pct';
  if (u === 'bandeja' || u === 'bandejas' || u === 'bdj') return 'bdj';
  if (u === 'maco' || u === 'maço' || u === 'maços' || u === 'macos') return 'maços';
  if (u === 'duzia' || u === 'dúzia' || u === 'duzias' || u === 'dúzias' || u === 'dz') return 'dz';
  if (u === 'rolo' || u === 'rolos' || u === 'rl') return 'rl';
  if (u === 'bola' || u === 'bolas') return 'bola';
  if (u === 'pote' || u === 'potes') return 'pote';
  if (u === 'litro' || u === 'litros' || u === 'lt' || u === 'l') return 'L';
  return u;
}

const UNITS_PATTERN =
  '(?:cx|cxs|caixas?|sc|sacos?|kg|quilos?|g|gr|gramas?|un|unid|unidades?|bdj|bandejas?|dz|duzias?|dúzias?|macos?|maços?|fd|fardos?|rl|rolos?|pct|pacotes?|bolas?|potes?|lt|litros?|garrafas?|gf|saches?|sachês?)';

// Helper: Format product name (converts ALL CAPS like "MANTEIGA BEZERRA" to "Manteiga Bezerra" while preserving mixed case)
function formatCleanProductName(rawName: string): string {
  const cleaned = rawName.replace(/^[-–—:]\s*/, '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';

  const lettersOnly = cleaned.replace(/[^a-zA-ZÀ-ÿ]/g, '');
  const isAllUpperCase = lettersOnly.length > 2 && lettersOnly === lettersOnly.toUpperCase();

  if (isAllUpperCase) {
    const smallWords = new Set(['de', 'da', 'do', 'das', 'dos', 'para', 'com', 'em', 'e', 'ou']);
    return cleaned
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        if (index > 0 && smallWords.has(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

// Helper: Classify a product into Frutas, Legumes, Hortaliças, Temperos, etc. when under *Hortifruti:* or generic section
function classifyHortifrutiProduct(productName: string, currentSectionCategory: string, hasExplicitSection: boolean): string {
  // If we are inside an explicit non-Hortifruti section (e.g. Laticínios, Embalagens, Bomboniere, Temperos, Hortaliças), keep it!
  if (hasExplicitSection && currentSectionCategory !== 'Hortifrúti') {
    return currentSectionCategory;
  }

  const lower = productName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (
    /\b(cominho|oregano|colorau|pimenta do reino|paprica|acafrao|curcuma|louro|canela|cravo|chimichurri|edu guedes|ana maria|pega marido|tempero|lemon pepper|noz moscada|erva doce|coentro moido|alho frito|sal rosa|gergelim)\b/.test(
      lower
    )
  ) {
    return 'Temperos';
  }

  if (
    /\b(uva|tangerina|maracuja|pera|manga|goiaba|laranja|limao|mamao|melancia|banana|pinha|atemoia|maca|abacaxi|morango|abacate|kiwi|melao|pokan|paulistinha|pessego|ameixa|acerola|caju|caqui|figo|jabuticaba|pitaya|pitaia|roma|carambola|coco|graviola|jaca|tamara|nectarina)\b/.test(
      lower
    )
  ) {
    return 'Frutas';
  }

  if (
    /\b(tomate|cebola|batata|beterraba|brocolis|abobora|cenoura|chuchu|abobrinha|pimentao|pepino|mandioca|macaxeira|aipim|alho|berinjela|quiabo|vagem|gengibre|inhame|cara|couve-flor|couve flor|milho verde|ervilha|nabo|rabanete|maxixe|jiló|jilo)\b/.test(
      lower
    )
  ) {
    return 'Legumes';
  }

  if (
    /\b(alface|coentro|couve|rucula|repolho|espinafre|cheiro verde|salsa|salsinha|cebolinha|agriao|hortela|manjericao|acelga|chicoria|almeirao)\b/.test(
      lower
    )
  ) {
    return 'Hortaliças';
  }

  return currentSectionCategory || 'Hortifrúti';
}

// Helper: Clean and repair an item's quantity & product name so "1cx Uva Vitória" or "cx Uva Vitória" is never mangled
function sanitizeExtractedItem(rawItem: {
  produto: string;
  quantidadePedida?: string;
  fornecedor?: string;
  categoria?: string;
  observacao?: string;
}) {
  let produto = (rawItem.produto || '').trim();
  let quantidade = (rawItem.quantidadePedida || '').trim();

  // Clear fake zero quantities
  if (/^(0|0\s*[a-zA-Z]+|zero|n\/a|nao informado|não informado|sem quantidade|-)$/i.test(quantidade)) {
    quantidade = '';
  }

  // Strip bullet characters from product if any
  produto = produto.replace(/^[-*•–—\s]+/, '').replace(/^\*+|\*+$/g, '').trim();

  // Check if product still has a leading fraction + unit (e.g. "1/2cx Tomate Maduro")
  const fracInProd = produto.match(
    new RegExp(`^(\\d+\\/\\d+)\\s*(${UNITS_PATTERN})?\\b\\s*(?:de\\s+)?(.+)$`, 'i')
  );
  if (fracInProd) {
    const frac = fracInProd[1];
    const unit = fracInProd[2] ? normalizeUnitToken(fracInProd[2]) : 'cx';
    if (!quantidade) {
      quantidade = `${frac} ${unit}`;
    }
    produto = fracInProd[3].trim();
  }

  // Check if product still has a leading number + unit (e.g. "1cx Uva Vitória", "16Un Melancia")
  const qtyInProd = produto.match(
    new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s*(${UNITS_PATTERN})\\b\\s*(?:de\\s+)?(.+)$`, 'i')
  );
  if (qtyInProd) {
    const num = qtyInProd[1];
    const unit = normalizeUnitToken(qtyInProd[2]);
    if (!quantidade) {
      quantidade = `${num} ${unit}`;
    }
    produto = qtyInProd[3].trim();
  }

  // Check if product starts with an isolated unit because the digit '1' was stripped (e.g., "Cx Uva Vitória" or "sc Batata")
  const bareUnitInProd = produto.match(
    new RegExp(`^(${UNITS_PATTERN})\\b\\s+(?:de\\s+)?(.+)$`, 'i')
  );
  if (bareUnitInProd) {
    const unit = normalizeUnitToken(bareUnitInProd[1]);
    if (!quantidade) {
      quantidade = `1 ${unit}`;
    } else if (/^\d+(?:[.,]\d+)?$/.test(quantidade)) {
      quantidade = `${quantidade} ${unit}`;
    }
    produto = bareUnitInProd[2].trim();
  }

  // Check if product still has a leading plain number (e.g. "5 Alface Americano")
  const plainNumInProd = produto.match(/^(\d+)\s+([a-zA-ZÀ-ÿ].*)$/);
  if (plainNumInProd && !/^\d+\s*(?:g|mg|ml|l)\b/i.test(produto)) {
    const num = plainNumInProd[1];
    if (!quantidade) {
      const cat = (rawItem.categoria || '').toLowerCase();
      const defaultUnit = cat.includes('hortali') || cat.includes('folhagen') ? 'maços' : 'un';
      quantidade = `${num} ${defaultUnit}`;
    }
    produto = plainNumInProd[2].trim();
  }

  // Normalize spacing in quantidade (e.g., "1cx" -> "1 cx", "16Un" -> "16 un", "1/2sc" -> "1/2 sc")
  if (quantidade) {
    const compactQtyMatch = quantidade.match(
      new RegExp(`^(\\d+\\/\\d+|\\d+(?:[.,]\\d+)?)\\s*(${UNITS_PATTERN})$`, 'i')
    );
    if (compactQtyMatch) {
      quantidade = `${compactQtyMatch[1]} ${normalizeUnitToken(compactQtyMatch[2])}`;
    }
  }

  produto = formatCleanProductName(produto);

  const normalizedCat = rawItem.categoria ? normalizeCategoryName(rawItem.categoria) : 'Hortifrúti';
  const finalCategory =
    normalizedCat === 'Hortifrúti'
      ? classifyHortifrutiProduct(produto, normalizedCat, false)
      : normalizedCat;

  return {
    produto,
    quantidadePedida: quantidade,
    fornecedor: (rawItem.fornecedor || '').trim(),
    categoria: finalCategory,
    observacao: rawItem.observacao?.trim() || undefined,
  };
}

// Helper: Deterministic line-by-line parser for structured WhatsApp purchase lists
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
  let hasExplicitCategorySection = false;
  let currentSectionSupplier = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip generic title "Lista" or "Lista de Compras"
    if (/^[*_~#\s]*(?:lista|lista\s+de\s+compras|pedido\s+do\s+dia)[*_~#\s:]*$/i.test(trimmed)) {
      continue;
    }

    // 1. Check if line is a supplier header (e.g., "BOX 14:", "FORNECEDOR CEASA:", "CEASA:", "DISTRIBUIDORA X:")
    const supplierHeaderMatch = trimmed.match(
      /^[*_~#\s]*(fornecedor\s*:?\s*[^\n:]+|box\s*\d+[^\n:]*|ceasa[^\n:]*|distribuidora[^\n:]*)[*_~#\s:]*$/i
    );
    if (supplierHeaderMatch && !new RegExp(`\\b\\d+\\s*${UNITS_PATTERN}\\b`, 'i').test(trimmed)) {
      currentSectionSupplier = trimmed.replace(/[:*#_~]/g, '').trim();
      continue;
    }

    // 2. Check for ANY Category section header:
    // Matches lines like "*Temperos:*", "*Laticínio:*", "*Embalagens:*", "*Hortifruti:*", "*Bomboniere:*", "*Hortaliças:*"
    const startsWithBulletOrDigit = /^[-•\d]/.test(trimmed);
    const colonHeaderMatch = !startsWithBulletOrDigit
      ? trimmed.match(/^[*_~#\s]*(?:lista\s+de\s+|setor\s+de\s+|categoria\s*:?\s*)?([a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ\s/&]{1,32}?)[*_~#\s]*:[*_~#\s]*$/i)
      : null;
    const boldHeaderMatch = !startsWithBulletOrDigit
      ? trimmed.match(/^\*+\s*(?:lista\s+de\s+|setor\s+de\s+)?([a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ\s/&]{1,32}?)\s*:?\s*\*+$/i)
      : null;
    const knownStandAloneCatMatch = !startsWithBulletOrDigit
      ? trimmed.match(/^[*_~#\s]*(?:lista\s+de\s+)?(hortifr[uú]ti|hortali[cç]as?|bomboni[eé]re|temperos?|condimentos?|especiarias?|frutas?|legumes?|verduras?|folhagens?|embalagens?|mercearia|padaria|latic[ií]nios?|cereais|gr[aã]os|diversos)[*_~#\s:]*$/i)
      : null;

    const matchedCatRaw =
      (colonHeaderMatch && colonHeaderMatch[1]) ||
      (boldHeaderMatch && boldHeaderMatch[1]) ||
      (knownStandAloneCatMatch && knownStandAloneCatMatch[1]);

    if (matchedCatRaw && !new RegExp(`^\\d+\\s*${UNITS_PATTERN}\\b`, 'i').test(matchedCatRaw.trim())) {
      currentCategory = normalizeCategoryName(matchedCatRaw);
      hasExplicitCategorySection = true;
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

    // Only strip bullet characters (-, *, •, –) or numbered list markers ("1. " or "1) ")
    // NEVER strip digits that are part of a product quantity like "1cx Uva Vitória" or "5 Alface"!
    cleanLine = cleanLine.replace(/^[-*•–—\s]+/, '').trim();
    cleanLine = cleanLine.replace(/^\d+[.)]\s+/, '').trim();
    cleanLine = cleanLine.replace(/^\*+|\*+$/g, '').trim();
    if (!cleanLine) continue;

    let quantidade = '';
    let produto = cleanLine;

    // Pattern 1: Fractions at start of line (e.g., "1/2cx Tomate", "1/2sc Inhame", "1/4cx Pimentão")
    const fractionMatch = cleanLine.match(
      new RegExp(`^(\\d+\\/\\d+)\\s*(${UNITS_PATTERN})?\\b\\s*(?:de\\s+)?(.*)$`, 'i')
    );
    if (fractionMatch) {
      const frac = fractionMatch[1];
      const unit = fractionMatch[2]
        ? normalizeUnitToken(fractionMatch[2])
        : currentCategory === 'Hortaliças'
        ? 'maço'
        : 'cx';
      quantidade = `${frac} ${unit}`;
      produto = fractionMatch[3].trim();
    } else {
      // Pattern 2: Leading quantity with unit (glued or spaced, e.g. "1cx Uva Vitória", "16Un Melancia", "2cx Mamão Papaya", "1sc Limão Taiti", "1 Bola de Coentro")
      const leadingQtyRegex = new RegExp(
        `^(\\d+(?:[.,]\\d+)?)\\s*(${UNITS_PATTERN})\\b\\s*(?:de\\s+)?(.*)$`,
        'i'
      );
      const leadingMatch = cleanLine.match(leadingQtyRegex);

      if (leadingMatch) {
        const unitStr = normalizeUnitToken(leadingMatch[2]);
        quantidade = `${leadingMatch[1]} ${unitStr}`;
        produto = leadingMatch[3].trim();
      } else {
        // Pattern 3: Leading number only without explicit unit (e.g. "5 Alface Crespa", "5 Alface Americano", "5 Couve", "4 Rúcula")
        const numberOnlyMatch = cleanLine.match(/^(\d+)\s+([a-zA-ZÀ-ÿ].*)$/);
        if (numberOnlyMatch && !/^\d+\s*(?:g|mg|ml|l)\b/i.test(cleanLine)) {
          const num = numberOnlyMatch[1];
          const prodRest = numberOnlyMatch[2].trim();
          const defaultUnit = currentCategory === 'Hortaliças' ? 'maços' : 'un';
          quantidade = `${num} ${defaultUnit}`;
          produto = prodRest;
        } else {
          // Pattern 4: Explicit wholesale unit at end separated by dash/colon (e.g. "Tomate - 10 cx")
          // IMPORTANT: Do NOT strip package weights like "Bokus 30g" or "Bokus 45g" or "Maracujá 1ª"!
          const trailingWholesaleRegex =
            /^(.*?)\s+[-–—:]\s*(\d+(?:[.,]\d+)?\s*(?:cx|cxs|caixas?|sc|sacos?|fd|fardos?|un|unid|unidades?|macos?|maços?|bdj|bandejas?|pct|pacotes?))$/i;
          const trailingMatch = cleanLine.match(trailingWholesaleRegex);

          if (trailingMatch) {
            produto = trailingMatch[1].trim();
            quantidade = trailingMatch[2].trim().toLowerCase();
          } else {
            // Pattern 5: No quantity in line (e.g. "Beterraba", "MANTEIGA BEZERRA", "Álcool", "Bokus 30g", "Bokus 45g", "Cominho Puro", "Edu Guedes")
            // Keep quantity strictly blank ("") as confirmed by the user!
            quantidade = '';
            produto = cleanLine.replace(/^[-–—:]\s*/, '').replace(/\s+/g, ' ').trim();
          }
        }
      }
    }

    // Automatically classify category (separating *Hortifruti:* into Frutas and Legumes, while keeping explicit sections like Laticínios, Embalagens, Hortaliças, Bomboniere, Temperos)
    const categoria = classifyHortifrutiProduct(
      produto,
      currentCategory,
      hasExplicitCategorySection
    );

    const sanitized = sanitizeExtractedItem({
      produto,
      quantidadePedida: quantidade,
      fornecedor: itemSupplier || (defaultSupplier ? defaultSupplier : ''),
      categoria,
    });

    if (sanitized.produto.length >= 2) {
      items.push(sanitized);
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

    // Always compute the deterministic line-by-line parse first as our ground-truth reference
    const deterministicItems = fallbackHeuristicParser(text, defaultSupplier);

    // If the input is a structured line-by-line list (like WhatsApp lists), deterministicItems is 100% faithful:
    // It never drops items (like Uva Vitória), never invents quantities for unquantified items (like Beterraba or Bokus 30g),
    // and never alters quantities (like 2cx Mamão Papaya).
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || deterministicItems.length > 0) {
      return res.json({
        items: deterministicItems,
        source: 'deterministic_exact',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const prompt = `Você é o assistente inteligente de compras e conferência do hortifrúti "Beto da Fruta".
Sua única tarefa é extrair fielmente os produtos que estão presentes na mensagem de compra abaixo, sem NUNCA adicionar ou inventar produtos que não estejam escritos no texto.

TEXTO DE COMPRA ENVIADO PELO USUÁRIO:
"""
${text}
"""

REGRAS CRÍTICAS E OBRIGATÓRIAS:
1. PROIBIDO ALUCINAR OU INVENTAR PRODUTOS E QUANTIDADES:
   - Extraia EXCLUSIVAMENTE os itens que aparecem no texto acima.
   - Se o item não tiver quantidade informada na linha (ex: "Beterraba", "Bokus 30g", "Cominho Puro"), deixe 'quantidadePedida' estritamente vazio "".
2. QUANTIDADE COLADA OU ESPAÇADA ANTES DO PRODUTO:
   - "- 1cx Uva Vitória" ➔ quantidadePedida: "1 cx", produto: "Uva Vitória".
   - "- 2cx Mamão Papaya" ➔ quantidadePedida: "2 cx", produto: "Mamão Papaya".
   - "- 16Un Melancia" ➔ quantidadePedida: "16 un", produto: "Melancia".
3. CATEGORIAS AUTOMÁTICAS:
   - Classifique itens de Hortifruti automaticamente entre "Frutas" e "Legumes", e mantenha cabeçalhos de seção como "Laticínios", "Embalagens", "Hortaliças", "Bomboniere" e "Temperos".

Retorne apenas o JSON conforme o schema.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              produto: { type: Type.STRING },
              quantidadePedida: { type: Type.STRING },
              fornecedor: { type: Type.STRING },
              categoria: { type: Type.STRING },
              observacao: { type: Type.STRING },
            },
            required: ['produto', 'quantidadePedida', 'fornecedor', 'categoria'],
          },
        },
      },
      required: ['items'],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.0,
      },
    });

    const responseText = response.text || '{}';
    const parsedData = JSON.parse(responseText);
    const rawAiItems = Array.isArray(parsedData.items) ? parsedData.items : [];
    const sanitizedAiItems = rawAiItems.map((item: any) =>
      sanitizeExtractedItem({
        produto: item.produto || '',
        quantidadePedida: item.quantidadePedida || '',
        fornecedor: item.fornecedor || defaultSupplier || '',
        categoria: item.categoria || 'Hortifrúti',
        observacao: item.observacao,
      })
    );

    return res.json({
      items: sanitizedAiItems,
      source: 'gemini-3-flash-preview',
    });
  } catch (error: any) {
    console.error('Erro na rota /api/ai/parse-purchases:', error);
    try {
      const { text = '', defaultSupplier = 'Ceasa Box 14' } = req.body || {};
      const fallbackItems = fallbackHeuristicParser(text, defaultSupplier);
      return res.json({
        items: fallbackItems,
        source: 'local_heuristic_after_error',
      });
    } catch (e) {
      return res.status(500).json({
        error: 'Falha ao processar lista de compras com IA.',
        details: error?.message || String(error),
      });
    }
  }
});

const DATA_FILE_PATH = path.resolve(__dirname, 'data-store.json');
const BACKUPS_DIR = path.resolve(__dirname, 'backups');

if (!fs.existsSync(BACKUPS_DIR)) {
  try {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  } catch (err) {
    console.error('Erro ao criar diretório de backups:', err);
  }
}

interface ServerStore {
  users?: any[];
  tasks?: any[];
  purchases?: any[];
  routine?: any;
  settings?: any;
  lastDailyBackup?: any;
  updatedAt?: string;
}

function readServerStore(): ServerStore {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Erro ao ler data-store.json:', err);
  }
  return {};
}

function writeServerStore(data: ServerStore): void {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar data-store.json:', err);
  }
}

// GET /api/state — Returns server-persisted users (with device bindings), tasks, purchases, routine
app.get('/api/state', (_req, res) => {
  const store = readServerStore();
  res.json(store);
});

// POST /api/state — Syncs state from client to server
app.post('/api/state', (req, res) => {
  try {
    const current = readServerStore();
    const { users, tasks, purchases, routine, settings } = req.body || {};
    const next: ServerStore = {
      users: Array.isArray(users) ? users : current.users,
      tasks: Array.isArray(tasks) ? tasks : current.tasks,
      purchases: Array.isArray(purchases) ? purchases : current.purchases,
      routine: routine || current.routine,
      settings: settings || current.settings,
      updatedAt: new Date().toISOString(),
    };
    writeServerStore(next);
    res.json({ ok: true, updatedAt: next.updatedAt });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro ao sincronizar estado' });
  }
});

// POST /api/devices/bind — Binds a device to a user profile on the server
app.post('/api/devices/bind', (req, res) => {
  try {
    const { userId, device } = req.body || {};
    if (!userId || !device || !device.deviceId) {
      return res.status(400).json({ error: 'userId e device.deviceId são obrigatórios.' });
    }

    const store = readServerStore();
    if (Array.isArray(store.users)) {
      store.users = store.users.map((u: any) => {
        const list = Array.isArray(u.dispositivosVinculados) ? u.dispositivosVinculados : [];
        if (u.id === userId) {
          const filtered = list.filter((d: any) => d.deviceId !== device.deviceId);
          return {
            ...u,
            dispositivosVinculados: [device, ...filtered],
          };
        } else {
          return {
            ...u,
            dispositivosVinculados: list.filter((d: any) => d.deviceId !== device.deviceId),
          };
        }
      });
      store.updatedAt = new Date().toISOString();
      writeServerStore(store);
    }

    return res.json({ ok: true, users: store.users || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Falha ao vincular dispositivo' });
  }
});

// POST /api/devices/unbind — Unbinds a device from a user profile on the server
app.post('/api/devices/unbind', (req, res) => {
  try {
    const { userId, deviceId } = req.body || {};
    if (!userId || !deviceId) {
      return res.status(400).json({ error: 'userId e deviceId são obrigatórios.' });
    }

    const store = readServerStore();
    if (Array.isArray(store.users)) {
      store.users = store.users.map((u: any) => {
        if (u.id === userId) {
          const list = Array.isArray(u.dispositivosVinculados) ? u.dispositivosVinculados : [];
          return {
            ...u,
            dispositivosVinculados: list.filter((d: any) => d.deviceId !== deviceId),
          };
        }
        return u;
      });
      store.updatedAt = new Date().toISOString();
      writeServerStore(store);
    }

    return res.json({ ok: true, users: store.users || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Falha ao desvincular dispositivo' });
  }
});

// POST /api/backup — Receives automatic or manual daily backup from client
app.post('/api/backup', (req, res) => {
  try {
    const { date, payload } = req.body || {};
    const safeDate = (date || (payload && payload.metadados && payload.metadados.dataBackup) || new Date().toISOString().slice(0, 10)).replace(/[^0-9-]/g, '');
    const filename = `backup-betodafruta-${safeDate}.json`;
    const filePath = path.join(BACKUPS_DIR, filename);

    if (payload) {
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
      fs.writeFileSync(path.join(BACKUPS_DIR, 'latest.json'), JSON.stringify(payload, null, 2), 'utf-8');

      // Update in data-store.json
      const store = readServerStore();
      store.lastDailyBackup = {
        date: safeDate,
        filename,
        savedAt: new Date().toISOString(),
        resumo: payload.metadados?.resumo,
      };
      writeServerStore(store);

      return res.json({
        ok: true,
        filename,
        savedAt: store.lastDailyBackup.savedAt,
      });
    }

    return res.status(400).json({ error: 'Payload de backup ausente' });
  } catch (err: any) {
    console.error('Erro ao processar /api/backup:', err);
    return res.status(500).json({ error: err?.message || 'Falha ao salvar backup no servidor' });
  }
});

// GET /api/backups — List all available daily backups on the server
app.get('/api/backups', (_req, res) => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return res.json({ backups: [] });
    }
    const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.startsWith('backup-') && f.endsWith('.json'));
    const list = files.map((filename) => {
      const filePath = path.join(BACKUPS_DIR, filename);
      const stat = fs.statSync(filePath);
      const dateMatch = filename.match(/backup-betodafruta-([\d-]+)\.json/);
      const date = dateMatch ? dateMatch[1] : '';
      return {
        filename,
        date,
        sizeBytes: stat.size,
        updatedAt: stat.mtime.toISOString(),
      };
    }).sort((a, b) => b.date.localeCompare(a.date));

    return res.json({ backups: list });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Erro ao listar backups' });
  }
});

// GET /api/backup/download — Directly downloads the daily JSON file
app.get('/api/backup/download', (req, res) => {
  try {
    const rawDate = (req.query.date as string) || new Date().toISOString().slice(0, 10);
    const safeDate = rawDate.replace(/[^0-9-]/g, '');
    const filename = `backup-betodafruta-${safeDate}.json`;
    const targetPath = path.join(BACKUPS_DIR, filename);

    if (fs.existsSync(targetPath)) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.sendFile(targetPath);
    }

    // Fallback: if specific date file not found on disk, build from current server store
    const store = readServerStore();
    const fallbackPayload = {
      metadados: {
        versao: '2.0',
        dataBackup: safeDate,
        dataHoraGeracao: new Date().toISOString(),
        loja: store.settings?.nomeLoja || 'Beto da Fruta',
        gerenteResponsavel: store.settings?.gerenteResponsavel || 'Charles Araújo',
        tipoExportacao: 'Servidor Snapshot',
        resumo: {
          totalAtividadesDia: Array.isArray(store.tasks) ? store.tasks.length : 0,
          totalItensComprasDia: Array.isArray(store.purchases) ? store.purchases.length : 0,
        },
      },
      atividadesDoDia: store.tasks || [],
      rotinaDiaria: store.routine || null,
      comprasDoDia: store.purchases || [],
    };

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.send(JSON.stringify(fallbackPayload, null, 2));
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Erro ao baixar backup' });
  }
});

// GET /api/backup — Returns latest backup payload or for a specific date
app.get('/api/backup', (req, res) => {
  try {
    const rawDate = req.query.date as string | undefined;
    if (rawDate) {
      const safeDate = rawDate.replace(/[^0-9-]/g, '');
      const targetPath = path.join(BACKUPS_DIR, `backup-betodafruta-${safeDate}.json`);
      if (fs.existsSync(targetPath)) {
        const raw = fs.readFileSync(targetPath, 'utf-8');
        return res.json(JSON.parse(raw));
      }
    }

    const latestPath = path.join(BACKUPS_DIR, 'latest.json');
    if (fs.existsSync(latestPath)) {
      const raw = fs.readFileSync(latestPath, 'utf-8');
      return res.json(JSON.parse(raw));
    }

    const store = readServerStore();
    if (store.lastDailyBackup) {
      return res.json(store.lastDailyBackup);
    }

    return res.status(404).json({ error: 'Nenhum backup encontrado' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Erro ao buscar backup' });
  }
});

// Setup Vite middleware for Development or Static serving for Production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
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
