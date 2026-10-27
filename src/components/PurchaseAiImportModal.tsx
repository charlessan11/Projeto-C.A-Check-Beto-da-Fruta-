import React, { useState, useRef, useMemo } from 'react';
import {
  Sparkles,
  X,
  Upload,
  ClipboardPaste,
  Check,
  AlertCircle,
  Trash2,
  Plus,
  RefreshCw,
  Building,
  FileText,
  ArrowRight,
  CheckCircle2,
  Printer,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { PurchaseItem, User } from '../types';
import { getTodayDateString } from '../services/storage';

export interface ExtractedPurchaseDraft {
  produto: string;
  quantidadePedida: string;
  fornecedor: string;
  categoria: string;
  observacao?: string;
}

const DEFAULT_CATEGORIES = [
  'Hortifrúti',
  'Frutas',
  'Legumes',
  'Hortaliças',
  'Folhagens',
  'Temperos',
  'Bomboniere',
  'Embalagens',
  'Mercearia',
  'Laticínios',
  'Outros',
];

interface PurchaseAiImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onConfirmImport: (
    newItems: PurchaseItem[],
    openPrint?: boolean,
    saveMode?: 'replace' | 'append'
  ) => void;
  existingSuppliers: string[];
  existingPurchasesCount?: number;
}

export const PurchaseAiImportModal: React.FC<PurchaseAiImportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onConfirmImport,
  existingPurchasesCount = 0,
}) => {
  if (!isOpen) return null;

  // Step 1: Input text & configuration | Step 2: Preview & Conference Screen
  const [step, setStep] = useState<'input' | 'preview'>('input');

  // Input states
  const [inputText, setInputText] = useState('');
  const [defaultSupplier, setDefaultSupplier] = useState('Ceasa Box 14');
  const [solicitante, setSolicitante] = useState(
    currentUser.nome.includes('Amanda') ? 'Amanda' : 'Charles'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted drafts for preview
  const [extractedItems, setExtractedItems] = useState<ExtractedPurchaseDraft[]>([]);
  const [batchSupplierValue, setBatchSupplierValue] = useState('');
  const [previewFilter, setPreviewFilter] = useState<'todos' | 'sem_qtd' | 'sem_fornec'>('todos');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('todas');

  // Prompt modal asking whether to Replace or Append when saving
  const [pendingSaveAction, setPendingSaveAction] = useState<{
    isOpen: boolean;
    openPrintAfter: boolean;
  } | null>(null);

  // File input ref for .txt upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic list of categories combining defaults + any new categories extracted from free text
  const availableCategories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    extractedItems.forEach((item) => {
      if (item.categoria && item.categoria.trim()) {
        set.add(item.categoria.trim());
      }
    });
    return Array.from(set);
  }, [extractedItems]);

  // Categories actually present in the current extracted items
  const extractedCategorySummary = useMemo(() => {
    const counts = new Map<string, number>();
    extractedItems.forEach((item) => {
      const cat = item.categoria?.trim() || 'Hortifrúti';
      counts.set(cat, (counts.get(cat) || 0) + 1);
    });
    return Array.from(counts.entries());
  }, [extractedItems]);

  // Helper: Client-side deterministic parser & sanitizer to guarantee 100% fidelity on WhatsApp lists
  const parseAndSanitizeClientSide = (rawText: string, fallbackSup: string): ExtractedPurchaseDraft[] => {
    const unitsPattern =
      '(?:cx|cxs|caixas?|sc|sacos?|kg|quilos?|g|gr|gramas?|un|unid|unidades?|bdj|bandejas?|dz|duzias?|dúzias?|macos?|maços?|fd|fardos?|rl|rolos?|pct|pacotes?|bolas?|potes?|lt|litros?|garrafas?|gf|saches?|sachês?)';

    const normalizeUnit = (uRaw: string): string => {
      const u = uRaw.toLowerCase().trim();
      if (['cx', 'cxs', 'caixa', 'caixas'].includes(u)) return 'cx';
      if (['sc', 'saco', 'sacos'].includes(u)) return 'sc';
      if (['un', 'unid', 'unidade', 'unidades'].includes(u)) return 'un';
      if (['kg', 'quilo', 'quilos'].includes(u)) return 'kg';
      if (['g', 'gr', 'grama', 'gramas'].includes(u)) return 'g';
      if (['fd', 'fardo', 'fardos'].includes(u)) return 'fd';
      if (['pct', 'pacote', 'pacotes'].includes(u)) return 'pct';
      if (['bdj', 'bandeja', 'bandejas'].includes(u)) return 'bdj';
      if (['maco', 'maço', 'maços', 'macos'].includes(u)) return 'maços';
      if (['dz', 'duzia', 'dúzia', 'duzias', 'dúzias'].includes(u)) return 'dz';
      if (['rl', 'rolo', 'rolos'].includes(u)) return 'rl';
      if (['bola', 'bolas'].includes(u)) return 'bola';
      if (['pote', 'potes'].includes(u)) return 'pote';
      if (['l', 'lt', 'litro', 'litros'].includes(u)) return 'L';
      return u;
    };

    const normalizeCat = (rawHeader: string): string => {
      const clean = rawHeader
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
      return clean
        .split(/\s+/)
        .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
        .join(' ')
        .replace(/^./, (c) => c.toUpperCase());
    };

    const classifyProduct = (prodName: string, sectionCat: string, hasExplicitSection: boolean): string => {
      if (hasExplicitSection && sectionCat !== 'Hortifrúti') {
        return sectionCat;
      }
      const lower = prodName
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
        /\b(tomate|cebola|batata|beterraba|brocolis|abobora|cenoura|chuchu|abobrinha|pimentao|pepino|mandioca|macaxeira|aipim|alho|berinjela|quiabo|vagem|gengibre|inhame|cara|couve-flor|couve flor|milho verde|ervilha|nabo|rabanete|maxixe|jilo)\b/.test(
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
      return sectionCat || 'Hortifrúti';
    };

    const formatName = (raw: string): string => {
      const cleaned = raw.replace(/^[-–—:]\s*/, '').replace(/\s+/g, ' ').trim();
      if (!cleaned) return '';
      const lettersOnly = cleaned.replace(/[^a-zA-ZÀ-ÿ]/g, '');
      const isAllUpper = lettersOnly.length > 2 && lettersOnly === lettersOnly.toUpperCase();
      if (isAllUpper) {
        const smallWords = new Set(['de', 'da', 'do', 'das', 'dos', 'para', 'com', 'em', 'e', 'ou']);
        return cleaned
          .toLowerCase()
          .split(' ')
          .map((w, idx) => (idx > 0 && smallWords.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
          .join(' ');
      }
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    };

    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const results: ExtractedPurchaseDraft[] = [];
    let currentCategory = 'Hortifrúti';
    let hasExplicitCategorySection = false;
    let currentSectionSupplier = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (/^[*_~#\s]*(?:lista|lista\s+de\s+compras|pedido\s+do\s+dia)[*_~#\s:]*$/i.test(trimmed)) {
        continue;
      }

      const supplierHeaderMatch = trimmed.match(
        /^[*_~#\s]*(fornecedor\s*:?\s*[^\n:]+|box\s*\d+[^\n:]*|ceasa[^\n:]*|distribuidora[^\n:]*)[*_~#\s:]*$/i
      );
      if (supplierHeaderMatch && !new RegExp(`\\b\\d+\\s*${unitsPattern}\\b`, 'i').test(trimmed)) {
        currentSectionSupplier = trimmed.replace(/[:*#_~]/g, '').trim();
        continue;
      }

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

      if (matchedCatRaw && !new RegExp(`^\\d+\\s*${unitsPattern}\\b`, 'i').test(matchedCatRaw.trim())) {
        currentCategory = normalizeCat(matchedCatRaw);
        hasExplicitCategorySection = true;
        continue;
      }

      let itemSupplier = currentSectionSupplier || '';
      let cleanLine = trimmed;

      const parenMatch = cleanLine.match(/\(([^)]+)\)/);
      if (parenMatch) {
        itemSupplier = parenMatch[1].trim();
        cleanLine = cleanLine.replace(/\([^)]+\)/, '').trim();
      }

      cleanLine = cleanLine.replace(/^[-*•–—\s]+/, '').trim();
      cleanLine = cleanLine.replace(/^\d+[.)]\s+/, '').trim();
      cleanLine = cleanLine.replace(/^\*+|\*+$/g, '').trim();
      if (!cleanLine) continue;

      let quantidade = '';
      let produto = cleanLine;

      const fractionMatch = cleanLine.match(
        new RegExp(`^(\\d+\\/\\d+)\\s*(${unitsPattern})?\\b\\s*(?:de\\s+)?(.*)$`, 'i')
      );
      if (fractionMatch) {
        const frac = fractionMatch[1];
        const unit = fractionMatch[2]
          ? normalizeUnit(fractionMatch[2])
          : currentCategory === 'Hortaliças'
          ? 'maço'
          : 'cx';
        quantidade = `${frac} ${unit}`;
        produto = fractionMatch[3].trim();
      } else {
        const leadingQtyRegex = new RegExp(
          `^(\\d+(?:[.,]\\d+)?)\\s*(${unitsPattern})\\b\\s*(?:de\\s+)?(.*)$`,
          'i'
        );
        const leadingMatch = cleanLine.match(leadingQtyRegex);
        if (leadingMatch) {
          quantidade = `${leadingMatch[1]} ${normalizeUnit(leadingMatch[2])}`;
          produto = leadingMatch[3].trim();
        } else {
          const numberOnlyMatch = cleanLine.match(/^(\d+)\s+([a-zA-ZÀ-ÿ].*)$/);
          if (numberOnlyMatch && !/^\d+\s*(?:g|mg|ml|l)\b/i.test(cleanLine)) {
            const defaultUnit = currentCategory === 'Hortaliças' ? 'maços' : 'un';
            quantidade = `${numberOnlyMatch[1]} ${defaultUnit}`;
            produto = numberOnlyMatch[2].trim();
          } else {
            const trailingWholesaleRegex =
              /^(.*?)\s+[-–—:]\s*(\d+(?:[.,]\d+)?\s*(?:cx|cxs|caixas?|sc|sacos?|fd|fardos?|un|unid|unidades?|macos?|maços?|bdj|bandejas?|pct|pacotes?))$/i;
            const trailingMatch = cleanLine.match(trailingWholesaleRegex);
            if (trailingMatch) {
              produto = trailingMatch[1].trim();
              quantidade = trailingMatch[2].trim().toLowerCase();
            } else {
              quantidade = '';
              produto = cleanLine;
            }
          }
        }
      }

      // Extra safety against orphan unit prefixes like "Cx Uva Vitória"
      const bareUnitInProd = produto.match(new RegExp(`^(${unitsPattern})\\b\\s+(?:de\\s+)?(.+)$`, 'i'));
      if (bareUnitInProd) {
        const unit = normalizeUnit(bareUnitInProd[1]);
        if (!quantidade) quantidade = `1 ${unit}`;
        produto = bareUnitInProd[2].trim();
      }

      produto = formatName(produto);
      const categoria = classifyProduct(produto, currentCategory, hasExplicitCategorySection);

      if (produto.length >= 2) {
        results.push({
          produto,
          quantidadePedida: quantidade,
          fornecedor: itemSupplier || fallbackSup || '',
          categoria,
        });
      }
    }

    return results;
  };

  // Examples with quantity first, products without quantity, and dynamic categories including Temperos
  const loadExample = (type: 'modelo_charles_amanda' | 'padrao_ceasa' | 'sem_quantidade' | 'blocos') => {
    if (type === 'modelo_charles_amanda') {
      setInputText(
        `lista\n\n` +
        `*Hortifruti:*\n` +
        `- 1cx Uva Vitória\n` +
        `- 1cx Tangerina Importada\n` +
        `- 1cx Maracujá 1ª\n` +
        `- 1cx Pêra Foreli\n` +
        `- 1cx Manga Tomy\n\n` +
        `- 1cx Goiaba Verde\n\n` +
        `- 1cx Laranja Pêra\n` +
        `- 1cx Laranja Lima\n` +
        `- 1sc Limão Taiti\n\n` +
        `- 1cx Tomate\n` +
        `- 1sc Cebola\n` +
        `- 1sc Batata Inglesa\n\n` +
        `- 1sc Batata Doce Vitória\n\n` +
        `- Beterraba\n` +
        `- Tomate Cereja\n` +
        `- Brócolis\n\n` +
        `- 2cx Mamão Papaya\n` +
        `- 1cx Mamão Formosa\n\n` +
        `- 16Un Melancia\n` +
        `- Abóbora\n` +
        `- Banana Prata\n\n` +
        `- Pinha\n` +
        `- Atemoia\n\n` +
        ` *Laticínio:* \n` +
        `- MANTEIGA BEZERRA\n` +
        `- MANTEIGA GIVA\n\n` +
        ` *Embalagens:* \n` +
        `- Álcool \n` +
        `- Sabão em Pedra\n\n` +
        ` *Hortaliças:*\n` +
        `- 5 Alface Crespa\n` +
        `- 5 Alface Americano\n` +
        `- 1 Bola de Coentro\n` +
        `- 5 Couve\n` +
        `- 4 Rúcula\n\n` +
        `*Bomboniere:*\n` +
        `- Doce de Leite Barrinha Ki-Delicia\n` +
        `- Broa Sequilhos\n` +
        `- Paçoca Gigante\n` +
        `- Pingo de Leite\n` +
        `- Jujuba Bremer\n` +
        `- Bokus 30g\n` +
        `- Bokus 45g\n` +
        `- Gula Cebola\n` +
        `- Cocada de Leite\n` +
        `- Lanche Goiabada\n\n` +
        ` *Temperos:* \n` +
        `- Cominho Puro\n` +
        `- Tempero Para Frango\n` +
        `- Edu Guedes`
      );
    } else if (type === 'padrao_ceasa') {
      setInputText(
        `10 cx Tomate Saladete (Ceasa Box 14)\n` +
        `15 cx Banana Prata (Distribuidora Central)\n` +
        `20 sc Batata Lavada Especial\n` +
        `8 sc Cebola Nacional\n` +
        `30 maços Alface Crespa (Horta Vale Verde)\n` +
        `12 cx Cenoura Graúda (primeira linha)\n` +
        `20 un Melancia Comprida\n` +
        `5 rl Bobina Plástica Picotada`
      );
    } else if (type === 'sem_quantidade') {
      setInputText(
        `10 cx Tomate Italiano (Box 14 Ceasa)\n` +
        `Batata Doce Roxa\n` +
        `5 sc Cebola Roxa\n` +
        `Gengibre\n` +
        `Cheiro Verde\n` +
        `15 maços Rúcula Hidropônica\n` +
        `Manga Palmer (Distribuidora Alfa)`
      );
    } else {
      setInputText(
        `CEASA BOX 14:\n` +
        `- 10 cx Tomate Italiano\n` +
        `- 5 cx Pimentão Verde\n` +
        `- 6 cx Abobrinha Menina\n\n` +
        `DISTRIBUIDORA VALE DAS FRUTAS:\n` +
        `- 12 cx Manga Palmer (bem madura)\n` +
        `- 15 bdj Uva Thompson\n` +
        `- 8 cx Mamão Papaya Formosa\n\n` +
        `HORTA DIRETA:\n` +
        `- 25 maços Cheiro Verde\n` +
        `- 20 maços Couve Manteiga\n` +
        `- Agrião da Terra`
      );
    }
  };

  // Handle file upload (.txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt') && file.type !== 'text/plain') {
      setErrorMessage('Por favor, envie um arquivo de texto simples (.txt).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
        setErrorMessage(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Erro ao ler o arquivo de texto.');
    };
    reader.readAsText(file);
  };

  // Handle Clipboard Paste
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputText((prev) => (prev ? `${prev}\n${text}` : text));
          setErrorMessage(null);
        }
      }
    } catch {
      setErrorMessage('Para colar, clique na caixa de texto abaixo e use Ctrl+V ou toque em Colar.');
    }
  };

  // Process text with deterministic parser + server verification
  const handleProcessWithAi = async () => {
    if (!inputText.trim()) {
      setErrorMessage('Insira ou cole o texto da lista de compras antes de processar.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const localDeterministic = parseAndSanitizeClientSide(inputText, defaultSupplier.trim());

    try {
      const response = await fetch('/api/ai/parse-purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          defaultSupplier: defaultSupplier.trim(),
        }),
      });

      if (!response.ok) {
        if (localDeterministic.length > 0) {
          setExtractedItems(localDeterministic);
          setSelectedCategoryFilter('todas');
          setPreviewFilter('todos');
          setStep('preview');
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP ${response.status}`);
      }

      const data = await response.json();
      const serverItems: ExtractedPurchaseDraft[] = data.items || [];

      // If localDeterministic found structured items, prefer localDeterministic whenever server missed quantities or left "Cx " prefixes
      const finalItems =
        localDeterministic.length > 0
          ? localDeterministic
          : serverItems;

      if (finalItems.length === 0) {
        setErrorMessage('Nenhum produto foi identificado no texto. Verifique o formato e tente novamente.');
        setIsLoading(false);
        return;
      }

      setExtractedItems(finalItems);
      setSelectedCategoryFilter('todas');
      setPreviewFilter('todos');
      setStep('preview');
    } catch (err: any) {
      if (localDeterministic.length > 0) {
        setExtractedItems(localDeterministic);
        setSelectedCategoryFilter('todas');
        setPreviewFilter('todos');
        setStep('preview');
      } else {
        console.error('Erro ao processar lista com IA:', err);
        setErrorMessage(
          `Não foi possível processar a lista: ${err.message || 'Erro de comunicação'}. Verifique os dados e tente novamente.`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Inline edits in preview
  const handleUpdateItem = (index: number, field: keyof ExtractedPurchaseDraft, value: string) => {
    setExtractedItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Quick fill quantity chip
  const handleQuickSetQuantity = (index: number, qtyString: string) => {
    setExtractedItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], quantidadePedida: qtyString };
      return next;
    });
  };

  // Remove item in preview
  const handleRemoveItem = (index: number) => {
    setExtractedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Add extra blank item in preview
  const handleAddManualItem = () => {
    setExtractedItems((prev) => [
      ...prev,
      {
        produto: '',
        quantidadePedida: '1 cx',
        fornecedor: defaultSupplier || 'Ceasa Box 14',
        categoria: selectedCategoryFilter !== 'todas' ? selectedCategoryFilter : 'Frutas',
      },
    ]);
  };

  // Batch apply supplier in preview
  const handleApplyBatchSupplier = (onlyMissing: boolean) => {
    if (!batchSupplierValue.trim()) return;
    setExtractedItems((prev) =>
      prev.map((item) => {
        if (onlyMissing && item.fornecedor && item.fornecedor.trim()) {
          return item;
        }
        return {
          ...item,
          fornecedor: batchSupplierValue.trim(),
        };
      })
    );
  };

  // Stats for the conference screen
  const semQuantidadeCount = useMemo(() => {
    return extractedItems.filter(
      (item) => !item.quantidadePedida || item.quantidadePedida.trim() === ''
    ).length;
  }, [extractedItems]);

  const semFornecedorCount = useMemo(() => {
    return extractedItems.filter(
      (item) => !item.fornecedor || item.fornecedor.trim() === ''
    ).length;
  }, [extractedItems]);

  // Filtered items in preview screen
  const displayItems = useMemo(() => {
    return extractedItems
      .map((item, originalIndex) => ({
        item,
        originalIndex,
      }))
      .filter(({ item }) => {
        if (selectedCategoryFilter !== 'todas' && (item.categoria || 'Hortifrúti') !== selectedCategoryFilter) {
          return false;
        }
        if (previewFilter === 'sem_qtd') {
          return !item.quantidadePedida || item.quantidadePedida.trim() === '';
        }
        if (previewFilter === 'sem_fornec') {
          return !item.fornecedor || item.fornecedor.trim() === '';
        }
        return true;
      });
  }, [extractedItems, previewFilter, selectedCategoryFilter]);

  // Execute the final save with chosen mode ('replace' or 'append')
  const executeSaveImport = (openPrintModalAfter: boolean, saveMode: 'replace' | 'append') => {
    const validItems = extractedItems.filter((i) => i.produto.trim().length > 0);
    if (validItems.length === 0) {
      setErrorMessage('Nenhum produto válido para adicionar.');
      return;
    }

    const today = getTodayDateString();
    const nowIso = new Date().toISOString();

    const newPurchases: PurchaseItem[] = validItems.map((draft, idx) => ({
      id: `COM-${Date.now().toString().slice(-6)}-${idx + 1}`,
      data: today,
      produto: draft.produto.trim(),
      quantidadePedida: draft.quantidadePedida?.trim() || '',
      fornecedor: draft.fornecedor?.trim() || defaultSupplier || 'Ceasa Box 14',
      categoria: draft.categoria?.trim() || 'Hortifrúti',
      solicitadoPorNome: solicitante,
      solicitadoPorId: solicitante === 'Charles' ? 'USR-02' : 'USR-03',
      observacao: draft.observacao?.trim() || undefined,
      mercadoriaRecebida: false,
      reposicaoConcluida: false,
      dataAtualizacao: nowIso,
    }));

    setPendingSaveAction(null);
    onConfirmImport(newPurchases, openPrintModalAfter, saveMode);
    onClose();
  };

  // Triggered when clicking "Salvar na Lista" or "Salvar & Imprimir"
  const handleFinalConfirm = (openPrintModalAfter: boolean = false) => {
    const validItems = extractedItems.filter((i) => i.produto.trim().length > 0);
    if (validItems.length === 0) {
      setErrorMessage('Nenhum produto válido para adicionar.');
      return;
    }

    // If there are already items in the purchase list, ask the user right now whether to sum or replace!
    if (existingPurchasesCount > 0) {
      setPendingSaveAction({
        isOpen: true,
        openPrintAfter: openPrintModalAfter,
      });
      return;
    }

    executeSaveImport(openPrintModalAfter, 'replace');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 relative">
        {/* Modal Header */}
        <div className="bg-[#0a3821] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700/80 text-emerald-200 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-white">
                  Importar Lista c/ Inteligência Artificial
                </h3>
                <span className="bg-emerald-900 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-600">
                  Extração Fiel • Zero Alucinação
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Identifica quantidades coladas (ex: 1cx Uva Vitória), novas categorias (ex: Temperos) e itens sem quantidade
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Atenção:</span> {errorMessage}
              </div>
            </div>
          )}

          {/* ================= STEP 1: INPUT & CONFIGURATION ================= */}
          {step === 'input' && (
            <div className="space-y-4">
              {/* Configuration Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                {/* Solicitante */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Solicitante do Pedido:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSolicitante('Charles')}
                      className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        solicitante === 'Charles'
                          ? 'bg-[#0a3821] text-white border-[#0a3821] shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Charles
                    </button>
                    <button
                      type="button"
                      onClick={() => setSolicitante('Amanda')}
                      className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        solicitante === 'Amanda'
                          ? 'bg-[#0a3821] text-white border-[#0a3821] shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Amanda
                    </button>
                  </div>
                </div>

                {/* Default Supplier */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fornecedor Padrão (se não vier no texto):
                  </label>
                  <input
                    type="text"
                    value={defaultSupplier}
                    onChange={(e) => setDefaultSupplier(e.target.value)}
                    placeholder="Ex: Ceasa Box 14, Distribuidora Central..."
                    className="w-full min-h-[44px] px-3.5 py-2 bg-white rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Text Input Area with Actions */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-800" />
                    Texto da Lista de Compras (Cole do WhatsApp):
                  </label>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => loadExample('modelo_charles_amanda')}
                      className="text-[11px] font-black text-white bg-emerald-800 hover:bg-emerald-900 px-3 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                      title="Carregar mensagem real do WhatsApp com Hortifruti, Bomboniere, Hortaliças, Temperos e quantidades coladas (1cx, 1/2cx)"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-300" />
                      <span>✨ Modelo Real (c/ Temperos e 1cx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => loadExample('padrao_ceasa')}
                      className="text-[11px] font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Ex: Qtd Primeiro (10 cx)
                    </button>
                    <button
                      type="button"
                      onClick={() => loadExample('sem_quantidade')}
                      className="text-[11px] font-semibold text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Ex: Itens Sem Quantidade
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={9}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Cole aqui as mensagens do WhatsApp da sua lista de compras. Exemplo:\n\n*Hortifruti:*\n- 1cx Uva Vitória\n- 1/2cx Tomate Maduro\n- Tomate Cereja\n\n*Temperos:*\n- 2pct Cominho Moído\n- 1pct Orégano\n- Colorau\n\nO sistema identifica automaticamente qualquer categoria (como Temperos, Bomboniere, Hortaliças), separa a quantidade colada (1cx -> Qtd: 1 cx, Produto: Uva Vitória) e nunca adiciona itens fora do texto!`}
                    className="w-full p-4 bg-white rounded-2xl border-2 border-slate-300 text-slate-900 text-xs sm:text-sm font-mono leading-relaxed focus:outline-none focus:border-[#0a3821] focus:ring-1 focus:ring-[#0a3821] placeholder:text-slate-400"
                  />

                  {/* Action buttons under Textarea */}
                  <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePasteClipboard}
                        className="min-h-[40px] px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                      >
                        <ClipboardPaste className="w-3.5 h-3.5 text-slate-600" />
                        <span>Colar do WhatsApp</span>
                      </button>

                      {/* Hidden File Input for .txt */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".txt,text/plain"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="min-h-[40px] px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                        title="Carregar arquivo .txt com a lista de compras"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-600" />
                        <span>Carregar Arquivo .txt</span>
                      </button>
                    </div>

                    {inputText.trim() && (
                      <button
                        type="button"
                        onClick={() => setInputText('')}
                        className="text-xs text-slate-500 hover:text-rose-600 font-semibold underline cursor-pointer"
                      >
                        Limpar texto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Informative Guidance Card */}
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  Extração Precisa e Categorias Automáticas:
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed pl-1 text-[11px] sm:text-xs">
                  <li>
                    <strong>Quantidade colada ou espaçada:</strong> <code>1cx Uva Vitória</code> ➔ Qtd: <em>1 cx</em>, Produto: <em>Uva Vitória</em>.
                  </li>
                  <li>
                    <strong>Qualquer categoria reconhecida na hora:</strong> Títulos como <code>*Temperos:*</code>, <code>*Hortaliças:*</code> ou <code>*Bomboniere:*</code> preenchem automaticamente a categoria dos itens abaixo.
                  </li>
                  <li>
                    <strong>Fidelidade total ao texto:</strong> Apenas os produtos escritos no texto são extraídos, e ao salvar você escolhe se deseja <strong>substituir</strong> ou <strong>somar</strong> à lista do dia.
                  </li>
                </ul>
              </div>

              {/* Big Process Button */}
              <button
                type="button"
                onClick={handleProcessWithAi}
                disabled={isLoading || !inputText.trim()}
                className={`w-full min-h-[52px] rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer ${
                  isLoading || !inputText.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#0a3821] hover:bg-emerald-800 text-white active:scale-[0.99]'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-emerald-300" />
                    <span>Processando Lista e Categorias...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-emerald-300" />
                    <span>✨ Processar e Abrir Tela de Conferência</span>
                    <ArrowRight className="w-4 h-4 text-emerald-300" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* ================= STEP 2: PREVIEW & CONFERENCE SCREEN ================= */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Conference Header Banner */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs font-black flex items-center justify-center">
                      ✓
                    </span>
                    <h4 className="font-black text-sm sm:text-base text-emerald-950">
                      Tela de Conferência Prévia dos Produtos
                    </h4>
                  </div>
                  <p className="text-xs text-emerald-900">
                    Foram extraídos <strong>{extractedItems.length} itens</strong> em{' '}
                    <strong>{extractedCategorySummary.length} categorias</strong> exatamente conforme o texto.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setStep('input')}
                    className="min-h-[40px] px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    ← Voltar ao Texto
                  </button>
                  <button
                    type="button"
                    onClick={handleAddManualItem}
                    className="min-h-[40px] px-3.5 py-1.5 bg-[#0a3821] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Adicionar Item</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Categories Filter Bar */}
              {extractedCategorySummary.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 px-1.5 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-700" />
                    Categorias Identificadas:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter('todas')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedCategoryFilter === 'todas'
                        ? 'bg-[#0a3821] text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Todas ({extractedItems.length})
                  </button>
                  {extractedCategorySummary.map(([cat, count]) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedCategoryFilter === cat
                          ? 'bg-[#0a3821] text-white'
                          : 'bg-emerald-50 text-emerald-950 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  ))}
                </div>
              )}

              {/* Status Tabs: Todos, Sem Quantidade, Sem Fornecedor */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPreviewFilter('todos')}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    previewFilter === 'todos'
                      ? 'bg-[#0a3821] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Todos ({extractedItems.length})
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewFilter('sem_qtd')}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    previewFilter === 'sem_qtd'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : semQuantidadeCount > 0
                      ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sem Quantidade ({semQuantidadeCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewFilter('sem_fornec')}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    previewFilter === 'sem_fornec'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : semFornecedorCount > 0
                      ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Building className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sem Fornecedor ({semFornecedorCount})</span>
                </button>
              </div>

              {/* Batch Supplier Tool */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2.5 text-xs">
                <span className="font-bold text-slate-700 shrink-0 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  Atribuir Fornecedor em Lote:
                </span>
                <input
                  type="text"
                  placeholder="Nome do fornecedor (ex: Ceasa Box 14, Horta Verde...)"
                  value={batchSupplierValue}
                  onChange={(e) => setBatchSupplierValue(e.target.value)}
                  className="flex-1 w-full bg-white px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleApplyBatchSupplier(true)}
                    disabled={!batchSupplierValue.trim() || semFornecedorCount === 0}
                    className={`min-h-[38px] px-3 rounded-xl font-bold text-xs flex-1 sm:flex-none cursor-pointer ${
                      batchSupplierValue.trim() && semFornecedorCount > 0
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                    title="Apenas nos itens que estão sem fornecedor"
                  >
                    Aplicar nos Sem Fornecedor ({semFornecedorCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyBatchSupplier(false)}
                    disabled={!batchSupplierValue.trim()}
                    className={`min-h-[38px] px-3 rounded-xl font-bold text-xs flex-1 sm:flex-none cursor-pointer ${
                      batchSupplierValue.trim()
                        ? 'bg-[#0a3821] hover:bg-emerald-800 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Aplicar em Todos
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
                {displayItems.map(({ item, originalIndex }) => {
                  const isMissingQty = !item.quantidadePedida || item.quantidadePedida.trim() === '';
                  const isMissingSupplier = !item.fornecedor || item.fornecedor.trim() === '';

                  return (
                    <div
                      key={originalIndex}
                      className={`p-3.5 sm:p-4 transition-colors ${
                        isMissingQty || isMissingSupplier
                          ? 'bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-l-amber-500'
                          : 'hover:bg-slate-50/80 border-l-4 border-l-emerald-600'
                      }`}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start">
                        {/* Product Name (4 cols on sm) */}
                        <div className="sm:col-span-4">
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[10px] font-bold text-slate-500">
                              Produto #{originalIndex + 1}:
                            </label>
                            {isMissingQty && (
                              <span className="text-[9px] font-extrabold text-amber-900 bg-amber-200/80 px-1.5 py-0.2 rounded">
                                ⚠️ Sem Quantidade
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={item.produto}
                            onChange={(e) =>
                              handleUpdateItem(originalIndex, 'produto', e.target.value)
                            }
                            placeholder="Nome do produto"
                            className="w-full min-h-[40px] px-3 py-1.5 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Quantity & Unit (3 cols on sm) */}
                        <div className="sm:col-span-3">
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                            Qtd / Unidade:
                          </label>
                          <input
                            type="text"
                            value={item.quantidadePedida}
                            onChange={(e) =>
                              handleUpdateItem(originalIndex, 'quantidadePedida', e.target.value)
                            }
                            placeholder="Ex: 1 cx, 1/2 sc, 2 pct"
                            className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-2 ${
                              isMissingQty
                                ? 'bg-amber-50 border-amber-400 text-amber-900 focus:ring-amber-500'
                                : 'bg-emerald-50/60 border-emerald-300 text-emerald-950 focus:ring-emerald-500'
                            }`}
                          />

                          {/* Quick Quantity Chips (1-touch fill with fractions & units) */}
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            <span className="text-[9px] text-slate-500 font-semibold">Preencher:</span>
                            {['1/2 cx', '1 cx', '1/2 sc', '1 sc', '1 pct', '2 pct', '5 cx', '10 cx', '16 un', '60 kg', '1 fd', '5 maços'].map((chip) => (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => handleQuickSetQuantity(originalIndex, chip)}
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 transition-colors cursor-pointer"
                              >
                                {chip}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Supplier (3 cols on sm) */}
                        <div className="sm:col-span-3">
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[10px] font-bold text-slate-500">
                              Fornecedor / Box:
                            </label>
                            {isMissingSupplier && (
                              <span className="text-[9px] font-extrabold text-amber-900 bg-amber-200/80 px-1.5 py-0.2 rounded">
                                ⚠️ Sem Fornecedor
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={item.fornecedor}
                            onChange={(e) =>
                              handleUpdateItem(originalIndex, 'fornecedor', e.target.value)
                            }
                            placeholder="Fornecedor / Box"
                            className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 ${
                              isMissingSupplier
                                ? 'bg-amber-50 border-amber-400 text-amber-900 focus:ring-amber-500'
                                : 'bg-white border-slate-300 text-slate-800 focus:ring-emerald-500'
                            }`}
                          />
                        </div>

                        {/* Category (Editable) & Delete (2 cols on sm) */}
                        <div className="sm:col-span-2 flex items-start gap-1.5">
                          <div className="flex-1 min-w-0">
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                              Categoria (Editável):
                            </label>
                            <input
                              type="text"
                              list="purchase-categories-datalist"
                              value={item.categoria ?? ''}
                              onChange={(e) =>
                                handleUpdateItem(originalIndex, 'categoria', e.target.value)
                              }
                              placeholder="Ex: Frutas, Legumes..."
                              className="w-full min-h-[40px] px-2.5 py-1.5 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              title="Identificada automaticamente — clique para editar ou escolher outra categoria"
                            />
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {['Frutas', 'Legumes', 'Hortaliças', 'Laticínios', 'Temperos', 'Bomboniere', 'Embalagens'].map((quickCat) => (
                                <button
                                  key={quickCat}
                                  type="button"
                                  onClick={() => handleUpdateItem(originalIndex, 'categoria', quickCat)}
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                                    item.categoria === quickCat
                                      ? 'bg-[#0a3821] text-white'
                                      : 'bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-950'
                                  }`}
                                >
                                  {quickCat}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(originalIndex)}
                            className="mt-5 p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                            title="Remover este item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <datalist id="purchase-categories-datalist">
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>

                {displayItems.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Nenhum produto para este filtro.
                  </div>
                )}
              </div>

              {/* Confirm Actions */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  Solicitante: <strong className="text-slate-900 font-bold">{solicitante}</strong> •{' '}
                  <span>{extractedItems.length} produtos na conferência</span>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
                  <button
                    type="button"
                    onClick={() => setStep('input')}
                    className="min-h-[48px] px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs sm:text-sm cursor-pointer flex-1 md:flex-none"
                  >
                    ← Corrigir Texto
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFinalConfirm(false)}
                    disabled={extractedItems.length === 0}
                    className={`min-h-[48px] px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-1.5 cursor-pointer flex-1 md:flex-none ${
                      extractedItems.length === 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-800 hover:bg-slate-900 text-white'
                    }`}
                  >
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Salvar na Lista</span>
                  </button>

                  {/* Highlighted primary dual-use button */}
                  <button
                    type="button"
                    onClick={() => handleFinalConfirm(true)}
                    disabled={extractedItems.length === 0}
                    className={`min-h-[48px] px-5 py-2 rounded-2xl font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer flex-1 md:flex-none ${
                      extractedItems.length === 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-[#0a3821] hover:bg-emerald-800 text-white active:scale-[0.99]'
                    }`}
                    title="Salvar e abrir folha A4 para o comprador levar ao Ceasa e a equipe conferir na chegada"
                  >
                    <Printer className="w-4 h-4 text-emerald-300" />
                    <span>✓ Salvar &amp; Imprimir Planilha de Prancheta</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= PROMPT AT SAVE TIME: SOMAR OU SUBSTITUIR LISTA ================= */}
        {pendingSaveAction && pendingSaveAction.isOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-[#0a3821] flex items-center justify-center shrink-0">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-base text-slate-900">
                      Como deseja salvar esta lista?
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Já existem <strong>{existingPurchasesCount} itens</strong> registrados na lista atual.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingSaveAction(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => executeSaveImport(pendingSaveAction.openPrintAfter, 'replace')}
                  className="w-full min-h-[64px] p-4 rounded-2xl bg-[#0a3821] hover:bg-emerald-900 text-white text-left flex items-center justify-between gap-3 shadow-md transition-all cursor-pointer"
                >
                  <div>
                    <span className="font-black text-sm block text-white">
                      Substituir a Lista Atual ({extractedItems.length} itens)
                    </span>
                    <span className="text-xs text-emerald-100/90 block mt-0.5">
                      Limpa os {existingPurchasesCount} itens anteriores e deixa apenas os produtos desta lista
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-emerald-300 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => executeSaveImport(pendingSaveAction.openPrintAfter, 'append')}
                  className="w-full min-h-[64px] p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-2 border-emerald-300 text-left flex items-center justify-between gap-3 transition-all cursor-pointer"
                >
                  <div>
                    <span className="font-black text-sm block text-emerald-950">
                      Somar à Lista Existente ({existingPurchasesCount + extractedItems.length} itens)
                    </span>
                    <span className="text-xs text-emerald-800 block mt-0.5">
                      Mantém os {existingPurchasesCount} itens atuais e adiciona os {extractedItems.length} novos produtos
                    </span>
                  </div>
                  <Plus className="w-5 h-5 text-emerald-800 shrink-0" />
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPendingSaveAction(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Voltar para Revisão
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
