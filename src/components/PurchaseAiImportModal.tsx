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

interface PurchaseAiImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onConfirmImport: (newItems: PurchaseItem[], openPrint?: boolean) => void;
  existingSuppliers: string[];
}

export const PurchaseAiImportModal: React.FC<PurchaseAiImportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onConfirmImport,
  existingSuppliers,
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

  // File input ref for .txt upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Examples with quantity first, products without quantity, and suppliers
  const loadExample = (type: 'modelo_charles_amanda' | 'padrao_ceasa' | 'sem_quantidade' | 'blocos') => {
    if (type === 'modelo_charles_amanda') {
      setInputText(
        `Lista\n\n` +
        ` *Hortifruti:*\n` +
        `- 1cx Uva Vitória\n` +
        `- 1cx Maçã Nacional Fuji\n` +
        `- 1cx Manga Tomy\n` +
        `- 1cx Manga Palmer\n` +
        `- 1cx Tangerina Importada\n` +
        `- 1cx Abacate\n\n` +
        `- 1cx Goiaba Verde\n\n` +
        `- 1cx Laranja Pêra\n` +
        `- 1cx Laranja Pokan ou Paulistinha\n\n` +
        `- 1/2cx Tomate Maduro\n` +
        `- 1cx Cenoura\n` +
        `- 1cx Alho\n` +
        `- 1cx Pimentão\n` +
        `- Tomate Cereja\n` +
        `- Repolho Branco\n\n` +
        `- Banana Prata\n` +
        `- Banana Comprida\n\n` +
        `- 16un Melancia\n` +
        `- 60kg Melão Espanhol\n` +
        `- 40kg Melão Português\n\n` +
        `- 1sc Batata Doce Vitória\n` +
        `- 1/2sc Inhame\n` +
        `- 1/2sc Cará\n\n` +
        ` *Bomboniere:*\n` +
        `- Paçoca Gigante\n` +
        `- Gula Sabor Cebola\n` +
        `- 1fd Pipoca Bokus 30g\n` +
        `- Brownie Evaristo\n\n` +
        ` *Hortaliças:*\n` +
        `- 5 Alface Americano\n` +
        `- 5 Alface Crespa\n` +
        `- 1 Bola de Coentro\n` +
        `- 15 Couve\n` +
        `- 5 Cebolinha`
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

  // Process text with server AI
  const handleProcessWithAi = async () => {
    if (!inputText.trim()) {
      setErrorMessage('Insira ou cole o texto da lista de compras antes de processar.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP ${response.status}`);
      }

      const data = await response.json();
      const items: ExtractedPurchaseDraft[] = data.items || [];

      if (items.length === 0) {
        setErrorMessage('Nenhum produto foi identificado no texto. Verifique o formato e tente novamente.');
        setIsLoading(false);
        return;
      }

      setExtractedItems(items);
      setStep('preview');
    } catch (err: any) {
      console.error('Erro ao processar lista com IA:', err);
      setErrorMessage(
        `Não foi possível processar a lista: ${err.message || 'Erro de comunicação'}. Verifique os dados e tente novamente.`
      );
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
        quantidadePedida: '10 cx',
        fornecedor: defaultSupplier || 'Ceasa Box 14',
        categoria: 'Frutas',
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
    return extractedItems.map((item, originalIndex) => ({
      item,
      originalIndex,
    })).filter(({ item }) => {
      if (previewFilter === 'sem_qtd') {
        return !item.quantidadePedida || item.quantidadePedida.trim() === '';
      }
      if (previewFilter === 'sem_fornec') {
        return !item.fornecedor || item.fornecedor.trim() === '';
      }
      return true;
    });
  }, [extractedItems, previewFilter]);

  // Confirm and insert to purchase list
  const handleFinalConfirm = (openPrintModalAfter: boolean = false) => {
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
      quantidadePedida: draft.quantidadePedida?.trim() || '1 cx',
      fornecedor: draft.fornecedor?.trim() || defaultSupplier || 'Ceasa Box 14',
      categoria: draft.categoria || 'Hortifrúti',
      solicitadoPorNome: solicitante,
      solicitadoPorId: solicitante === 'Charles' ? 'USR-02' : 'USR-03',
      observacao: draft.observacao?.trim() || undefined,
      mercadoriaRecebida: false,
      reposicaoConcluida: false,
      dataAtualizacao: nowIso,
    }));

    onConfirmImport(newPurchases, openPrintModalAfter);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="bg-[#0a3821] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700/80 text-emerald-200 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-white">
                  Importar Lista c/ Inteligência Artificial
                </h3>
                <span className="bg-emerald-900 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-600">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Quantidade primeiro (ex: 10 cx Tomate), itens sem quantidade e folha de prancheta
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
                      title="Carregar mensagem real do WhatsApp com Hortifruti, Bomboniere, Hortaliças e frações (1/2cx, 1/2sc)"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-300" />
                      <span>✨ Modelo Real (Charles &amp; Amanda)</span>
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
                    placeholder={`Cole aqui as mensagens do WhatsApp da sua lista de compras. Exemplo:\n\n10 cx Tomate Saladete (Box 14 Ceasa)\n5 sc Batata Lavada\nCebola Roxa\n15 maços Rúcula Hidropônica\n\nA IA identifica a quantidade antes do produto, detecta se algum item veio sem quantidade ou sem fornecedor, e abre a tela de conferência para você preencher rapidamente!`}
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
                  Regras de Extração Inteligente do Hortifrúti:
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed pl-1 text-[11px] sm:text-xs">
                  <li>
                    <strong>Quantidade antes do produto:</strong> <code>10 cx Tomate</code> ➔ Qtd: <em>10 cx</em>, Produto: <em>Tomate</em>.
                  </li>
                  <li>
                    <strong>Produtos sem quantidade:</strong> Se o produto vier sem quantidade no texto, o sistema sinaliza com <code>⚠️ Sem Quantidade</code> para você adicionar na conferência com 1 toque.
                  </li>
                  <li>
                    <strong>Fornecedor entre parênteses ou em blocos:</strong> Se não houver, o sistema sinaliza com <code>⚠️ Sem Fornecedor</code> ou usa o padrão.
                  </li>
                  <li>
                    <strong>Planilha de Prancheta para Uso Duplo:</strong> Ao salvar, você pode gerar a folha A4 para o comprador levar ao Ceasa e para Lucas/Rafael conferirem na chegada da Kombi.
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
                    <span>Processando e Identificando Produtos com IA...</span>
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
                    A IA identificou <strong>{extractedItems.length} itens</strong>. Revise e adicione a quantidade e o fornecedor dos produtos pendentes antes de salvar.
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
                            placeholder="Ex: 10 cx, 5 sc, 15 maços"
                            className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-2 ${
                              isMissingQty
                                ? 'bg-amber-50 border-amber-400 text-amber-900 focus:ring-amber-500'
                                : 'bg-emerald-50/60 border-emerald-300 text-emerald-950 focus:ring-emerald-500'
                            }`}
                          />

                          {/* Quick Quantity Chips (1-touch fill with fractions) */}
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            <span className="text-[9px] text-slate-500 font-semibold">Preencher:</span>
                            {['1/2 cx', '1 cx', '1/2 sc', '1 sc', '5 cx', '10 cx', '16 un', '60 kg', '1 fd', '5 maços', '15 maços'].map((chip) => (
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

                        {/* Category & Delete (2 cols on sm) */}
                        <div className="sm:col-span-2 flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                              Categoria:
                            </label>
                            <select
                              value={item.categoria || 'Hortifrúti'}
                              onChange={(e) =>
                                handleUpdateItem(originalIndex, 'categoria', e.target.value)
                              }
                              className="w-full min-h-[40px] px-2 py-1.5 bg-white rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="Hortifrúti">Hortifrúti</option>
                              <option value="Frutas">Frutas</option>
                              <option value="Legumes">Legumes</option>
                              <option value="Hortaliças">Hortaliças</option>
                              <option value="Folhagens">Folhagens</option>
                              <option value="Bomboniere">Bomboniere</option>
                              <option value="Embalagens">Embalagens</option>
                              <option value="Outros">Outros</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(originalIndex)}
                            className="mt-4 p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                            title="Remover este item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

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
      </div>
    </div>
  );
};
