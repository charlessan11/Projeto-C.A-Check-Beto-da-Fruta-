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
      server: { middlewareMode: true, hmr: false, ws: false },
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
