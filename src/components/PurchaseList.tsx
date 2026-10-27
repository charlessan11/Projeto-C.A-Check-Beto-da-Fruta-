import React, { useState, useMemo } from 'react';
import {
  Plus,
  ShoppingBag,
  CheckCircle2,
  Search,
  Calendar,
  Sparkles,
  Trash2,
  Edit,
  PackageCheck,
  Package,
  Printer,
  MessageCircle,
  Truck,
  Layers,
  Check,
  UserCheck,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  Square,
  History,
  X,
} from 'lucide-react';
import { PurchaseItem, User, StoreSettings, PurchaseStatusConferencia } from '../types';
import {
  archiveConferredPurchases,
  loadPurchaseHistory,
  ArchivedPurchaseBatch,
} from '../services/storage';
import { PurchaseWhatsAppModal } from './PurchaseWhatsAppModal';
import { PurchasePrintModal } from './PurchasePrintModal';
import { PurchaseAiImportModal } from './PurchaseAiImportModal';

interface PurchaseListProps {
  purchases: PurchaseItem[];
  currentUser: User;
  onAddPurchase: () => void;
  onEditPurchase: (item: PurchaseItem) => void;
  onDeletePurchase: (itemId: string) => void;
  onToggleRecebida: (itemId: string, currentState: boolean) => void;
  onToggleReposicao: (itemId: string, currentState: boolean) => void;
  settings?: StoreSettings;
  onUpdatePurchase?: (item: PurchaseItem) => void;
  onSavePurchases?: (items: PurchaseItem[]) => void;
  onBatchAddPurchases?: (newItems: PurchaseItem[], saveMode?: 'replace' | 'append') => void;
}

const QUICK_ARRIVAL_QUANTITIES = [
  '1/2 cx',
  '1 cx',
  '2 cx',
  '5 cx',
  '10 cx',
  '1/2 sc',
  '1 sc',
  '5 maços',
  '10 maços',
  '16 un',
  '1 fd',
];

export const PurchaseList: React.FC<PurchaseListProps> = ({
  purchases,
  currentUser,
  onAddPurchase,
  onEditPurchase,
  onDeletePurchase,
  onToggleRecebida,
  onToggleReposicao,
  settings = {
    nomeLoja: 'Beto da Fruta',
    gerenteResponsavel: 'Charles',
    proprietario: 'Beto & Amanda',
    horarioCheckinMatinal: '08:00',
    checkinAtivo: true,
  },
  onUpdatePurchase,
  onSavePurchases,
  onBatchAddPurchases,
}) => {
  const isAdmin = currentUser.perfil === 'Administrador';

  // Sub-tabs of the Purchase Sector
  const [activeSubTab, setActiveSubTab] = useState<'compras' | 'conferencia' | 'reposicao' | 'todos'>('compras');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('todos');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [reposicaoSubFilter, setReposicaoSubFilter] = useState<'falta_repor' | 'reposto' | 'todos'>('falta_repor');

  // Active checker for Conference tab (Lucas, Rafael, or Admin + Lucas/Rafael when without phone)
  const [activeChecker, setActiveChecker] = useState<string>(
    currentUser.nome.includes('Rafael')
      ? 'Rafael'
      : currentUser.nome.includes('Lucas')
      ? 'Lucas'
      : isAdmin
      ? `${currentUser.nome} + Lucas`
      : 'Lucas'
  );

  // Bulk Selection State for Mass Deletion
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  // Daily Renewal & History Modal State
  const [isRenewConfirmOpen, setIsRenewConfirmOpen] = useState(false);
  const [renewMode, setRenewMode] = useState<'only_conferred' | 'all'>('only_conferred');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyList, setHistoryList] = useState<ArchivedPurchaseBatch[]>(() => loadPurchaseHistory());

  // Modals for AI, WhatsApp and Printing
  const [isAiImportModalOpen, setIsAiImportModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printModalInitialModel, setPrintModalInitialModel] = useState<
    'prancheta_dupla' | 'compra' | 'conferencia' | 'extras_fora_da_lista'
  >('prancheta_dupla');

  // Track which product has the "Não Chegou" options ("Comprou, mas não chegou" | "Não Comprou") open
  const [naoChegouOpenId, setNaoChegouOpenId] = useState<string | null>(null);

  // Modal to record arrival conference quantity, mandatory conversion (kg/un) & optional avaria
  const [editingConferenceItem, setEditingConferenceItem] = useState<PurchaseItem | null>(null);
  const [confRecebidaInput, setConfRecebidaInput] = useState('');
  const [confUnidadeConversao, setConfUnidadeConversao] = useState<'kg' | 'un' | ''>('');
  const [confValorConvertido, setConfValorConvertido] = useState('');
  const [confValorAvaria, setConfValorAvaria] = useState('');
  const [confErro, setConfErro] = useState('');
  const [confDivergenciaInput, setConfDivergenciaInput] = useState('');

  // Reposicao detail modal
  const [editingReposicaoItem, setEditingReposicaoItem] = useState<PurchaseItem | null>(null);
  const [reposicaoObsInput, setReposicaoObsInput] = useState('');

  // Available checker options (includes joint Admin + Lucas/Rafael options for when Lucas/Rafael don't have their phone)
  const checkerOptions = useMemo(() => {
    const base = ['Lucas', 'Rafael', 'Lucas & Rafael'];
    if (isAdmin) {
      const adminFirst = currentUser.nome.split(' ')[0];
      return [
        `${adminFirst} + Lucas`,
        `${adminFirst} + Rafael`,
        'Lucas',
        'Rafael',
        'Lucas & Rafael',
      ];
    }
    return base;
  }, [isAdmin, currentUser.nome]);

  // Suppliers list
  const suppliers = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p) => {
      if (p.fornecedor && p.fornecedor.trim()) {
        set.add(p.fornecedor.trim());
      }
    });
    return Array.from(set).sort();
  }, [purchases]);

  // Dynamic Categories list from purchases
  const categories = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p) => {
      if (p.categoria && p.categoria.trim()) {
        set.add(p.categoria.trim());
      }
    });
    return Array.from(set).sort();
  }, [purchases]);

  // General counts
  const totalPurchases = purchases.length;
  const aguardandoChegadaCount = purchases.filter((p) => !p.mercadoriaRecebida).length;
  const recebidosNaLojaCount = purchases.filter((p) => p.mercadoriaRecebida).length;
  const faltaReporCount = purchases.filter((p) => p.mercadoriaRecebida && !p.reposicaoConcluida).length;
  const reposicaoConcluidaCount = purchases.filter((p) => p.reposicaoConcluida).length;

  // Filtered items based on active subtab, supplier, search
  const filteredItems = useMemo(() => {
    return purchases.filter((item) => {
      if (activeSubTab === 'reposicao') {
        if (!item.mercadoriaRecebida) return false;
        if (reposicaoSubFilter === 'falta_repor' && item.reposicaoConcluida) return false;
        if (reposicaoSubFilter === 'reposto' && !item.reposicaoConcluida) return false;
      }

      if (supplierFilter !== 'todos' && item.fornecedor?.trim() !== supplierFilter) {
        return false;
      }

      if (categoryFilter !== 'todas' && (item.categoria?.trim() || 'Hortifrúti') !== categoryFilter) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesProduct = item.produto.toLowerCase().includes(q);
        const matchesSupplier = item.fornecedor?.toLowerCase().includes(q);
        const matchesCategory = item.categoria?.toLowerCase().includes(q);
        const matchesSol = item.solicitadoPorNome.toLowerCase().includes(q);
        const matchesChecker = item.conferidoPorNome?.toLowerCase().includes(q);
        const matchesObs = item.observacao?.toLowerCase().includes(q);
        if (!matchesProduct && !matchesSupplier && !matchesCategory && !matchesSol && !matchesChecker && !matchesObs) {
          return false;
        }
      }

      return true;
    });
  }, [purchases, activeSubTab, supplierFilter, categoryFilter, search, reposicaoSubFilter]);

  // Bulk Selection Helpers
  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id));

  const handleToggleSelectAllVisible = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredItems.forEach((item) => next.delete(item.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredItems.forEach((item) => next.add(item.id));
        return next;
      });
    }
  };

  const handleSelectConferredOnly = () => {
    const conferredIds = purchases.filter((p) => p.mercadoriaRecebida).map((p) => p.id);
    setSelectedIds(new Set(conferredIds));
  };

  const handleSelectPendingOnly = () => {
    const pendingIds = purchases.filter((p) => !p.mercadoriaRecebida).map((p) => p.id);
    setSelectedIds(new Set(pendingIds));
  };

  const handleConfirmBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const remaining = purchases.filter((p) => !selectedIds.has(p.id));
    if (onSavePurchases) {
      onSavePurchases(remaining);
    }
    setSelectedIds(new Set());
    setIsBulkDeleteConfirmOpen(false);
  };

  // Daily Renewal / Archive Conferred Handler
  const handleConfirmRenewList = () => {
    const { remaining } = archiveConferredPurchases(purchases, renewMode);
    if (onSavePurchases) {
      onSavePurchases(remaining);
    }
    setHistoryList(loadPurchaseHistory());
    setSelectedIds(new Set());
    setIsRenewConfirmOpen(false);
  };

  // Update a single purchase item
  const updateItem = (updated: PurchaseItem) => {
    if (onUpdatePurchase) {
      onUpdatePurchase(updated);
    } else if (onSavePurchases) {
      const next = purchases.map((p) => (p.id === updated.id ? updated : p));
      onSavePurchases(next);
    }
  };

  // Helpers for conversion unit validation ('kg' allows fraction up to 3 decimals like 20,450; 'un' strictly integer like 243)
  const sanitizeMeasureValue = (raw: string, unit: 'kg' | 'un' | ''): string => {
    if (!unit) return raw;
    if (unit === 'un') {
      return raw.replace(/\D/g, '');
    }
    const normalized = raw.replace(/\./g, ',').replace(/[^0-9,]/g, '');
    const parts = normalized.split(',');
    if (parts.length <= 1) return parts[0];
    return `${parts[0]},${parts.slice(1).join('').slice(0, 3)}`;
  };

  const parseMeasureNumber = (val: string): number => {
    if (!val || !val.trim()) return 0;
    const num = parseFloat(val.trim().replace(/\./g, '').replace(',', '.'));
    return isNaN(num) ? 0 : num;
  };

  const formatMeasureNumber = (num: number, unit: 'kg' | 'un', referenceRaw?: string): string => {
    if (unit === 'un') {
      return Math.max(0, Math.round(num)).toString();
    }
    const decimals =
      referenceRaw && referenceRaw.includes(',')
        ? Math.min(3, Math.max(1, referenceRaw.split(',')[1]?.length || 3))
        : Number.isInteger(num)
        ? 0
        : 3;
    return Math.max(0, num).toFixed(decimals).replace('.', ',');
  };

  // Open Conference Modal to enter/confirm arrived quantity & mandatory kg/un conversion
  const handleOpenArrivalQuantityModal = (item: PurchaseItem) => {
    setEditingConferenceItem(item);
    setConfRecebidaInput(item.quantidadeRecebida || item.quantidadePedida || '1 cx');
    setConfUnidadeConversao(item.unidadeConversao || '');
    setConfValorConvertido(item.quantidadeConvertida || '');
    setConfValorAvaria(item.quantidadeAvaria || '');
    setConfErro('');
    setConfDivergenciaInput(item.motivoDivergencia || '');
  };

  const handleSelectConfUnidade = (unit: 'kg' | 'un') => {
    setConfUnidadeConversao(unit);
    setConfErro('');
    if (unit === 'un') {
      if (confValorConvertido) {
        const intVal = Math.round(parseMeasureNumber(confValorConvertido));
        setConfValorConvertido(intVal > 0 ? String(intVal) : '');
      }
      if (confValorAvaria) {
        const intAv = Math.round(parseMeasureNumber(confValorAvaria));
        setConfValorAvaria(intAv > 0 ? String(intAv) : '');
      }
    } else {
      setConfValorConvertido((prev) => sanitizeMeasureValue(prev, 'kg'));
      setConfValorAvaria((prev) => sanitizeMeasureValue(prev, 'kg'));
    }
  };

  // Start sequential conference from first pending item (since conversion into kg or un is mandatory per item)
  const handleQuickReceiveAll = () => {
    const firstPending = purchases.find((p) => !p.mercadoriaRecebida);
    if (firstPending) {
      handleOpenArrivalQuantityModal(firstPending);
    }
  };

  // Save Detailed Conference Modal (with arrived quantity, mandatory kg/un conversion, optional avaria & checker)
  const saveDetailedConference = (goToNextPending: boolean) => {
    if (!editingConferenceItem) return;

    const fullPedida = (editingConferenceItem.quantidadePedida || '').trim();
    const recebida = confRecebidaInput.trim() || fullPedida || '1 cx';
    const isZero =
      recebida === '0' ||
      recebida.toLowerCase().includes('nada') ||
      recebida.toLowerCase().includes('faltou');

    if (!isZero) {
      if (!confUnidadeConversao) {
        setConfErro(
          'Selecione obrigatoriamente a unidade de medida na conversão: Quilo (kg) ou Unidade (un).'
        );
        return;
      }
      const cleanConvertido = sanitizeMeasureValue(confValorConvertido, confUnidadeConversao);
      const numConvertido = parseMeasureNumber(cleanConvertido);
      if (!cleanConvertido || numConvertido <= 0) {
        setConfErro(
          confUnidadeConversao === 'kg'
            ? 'Informe o peso convertido em kg (Ex: 20,450).'
            : 'Informe a quantidade convertida em unidades inteiras (Ex: 243).'
        );
        return;
      }
      if (confUnidadeConversao === 'un' && !/^\d+$/.test(cleanConvertido)) {
        setConfErro('A unidade de medida em Unidade (un) recebe apenas valor inteiro (sem fração).');
        return;
      }
    }

    const unit = !isZero && confUnidadeConversao ? confUnidadeConversao : undefined;
    const cleanConv = unit ? sanitizeMeasureValue(confValorConvertido, unit) : undefined;
    const cleanAvariaRaw =
      unit && confValorAvaria.trim() ? sanitizeMeasureValue(confValorAvaria, unit) : '';
    const numConv = cleanConv ? parseMeasureNumber(cleanConv) : 0;
    const numAvaria = cleanAvariaRaw ? parseMeasureNumber(cleanAvariaRaw) : 0;
    const cleanAvaria = numAvaria > 0 ? cleanAvariaRaw : undefined;
    const netNum = Math.max(0, numConv - numAvaria);
    const liquida =
      unit && cleanConv ? formatMeasureNumber(netNum, unit, cleanConv) : undefined;

    let status: PurchaseStatusConferencia = 'Entregue Completo';
    if (isZero) {
      status = 'Pendente';
    } else if (fullPedida && recebida.toLowerCase() !== fullPedida.toLowerCase() && confDivergenciaInput.trim()) {
      status = 'Entrega Parcial / Falta';
    } else if (confDivergenciaInput.trim()) {
      status = 'Entrega Parcial / Falta';
    }

    const isRafael = activeChecker.includes('Rafael') && !activeChecker.includes('Lucas');
    const currentId = editingConferenceItem.id;
    const updated: PurchaseItem = {
      ...editingConferenceItem,
      mercadoriaRecebida: status !== 'Pendente',
      quantidadeRecebida: recebida,
      unidadeConversao: unit,
      quantidadeConvertida: cleanConv,
      quantidadeAvaria: cleanAvaria,
      quantidadeLiquidaAproveitavel: liquida,
      statusConferencia: status,
      conferidoPorNome: activeChecker,
      conferidoPorId: isRafael ? 'USR-05' : 'USR-04',
      dataConferencia: new Date().toISOString(),
      motivoDivergencia: confDivergenciaInput.trim() || undefined,
      dataAtualizacao: new Date().toISOString(),
    };

    updateItem(updated);

    if (goToNextPending) {
      const nextPending = purchases.find((p) => !p.mercadoriaRecebida && p.id !== currentId);
      if (nextPending) {
        handleOpenArrivalQuantityModal(nextPending);
        return;
      }
    }
    setEditingConferenceItem(null);
  };

  const handleSaveDetailedConference = (e: React.FormEvent) => {
    e.preventDefault();
    saveDetailedConference(false);
  };

  // Mark product that was on the purchase list but did not arrive at the store ("Comprou, mas não chegou" or "Não Comprou")
  const handleMarkItemNaoChegou = (
    item: PurchaseItem,
    opcao: 'Comprou, mas não chegou' | 'Não Comprou'
  ) => {
    const isRafael = activeChecker.includes('Rafael') && !activeChecker.includes('Lucas');
    const updated: PurchaseItem = {
      ...item,
      mercadoriaRecebida: false,
      quantidadeRecebida: '0 (Não chegou)',
      unidadeConversao: undefined,
      quantidadeConvertida: undefined,
      quantidadeAvaria: undefined,
      quantidadeLiquidaAproveitavel: undefined,
      statusConferencia: opcao,
      motivoNaoChegou: opcao,
      motivoDivergencia: opcao,
      conferidoPorNome: activeChecker,
      conferidoPorId: isRafael ? 'USR-05' : 'USR-04',
      dataConferencia: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
    };
    updateItem(updated);
    setNaoChegouOpenId(null);
  };

  const handleClearItemNaoChegou = (item: PurchaseItem) => {
    const updated: PurchaseItem = {
      ...item,
      mercadoriaRecebida: false,
      quantidadeRecebida: undefined,
      statusConferencia: 'Pendente',
      motivoNaoChegou: undefined,
      motivoDivergencia: undefined,
      dataAtualizacao: new Date().toISOString(),
    };
    updateItem(updated);
    setNaoChegouOpenId(null);
  };

  // Fast Toggle Reposicao
  const handleQuickToggleReposicao = (item: PurchaseItem) => {
    const nextState = !item.reposicaoConcluida;
    const updated: PurchaseItem = {
      ...item,
      reposicaoConcluida: nextState,
      repostoPorNome: nextState ? currentUser.nome : undefined,
      repostoPorId: nextState ? currentUser.id : undefined,
      dataReposicao: nextState ? new Date().toISOString() : undefined,
      dataAtualizacao: new Date().toISOString(),
    };
    updateItem(updated);
  };

  // Save detailed reposicao modal
  const handleSaveDetailedReposicao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReposicaoItem) return;

    const updated: PurchaseItem = {
      ...editingReposicaoItem,
      reposicaoConcluida: true,
      repostoPorNome: currentUser.nome,
      repostoPorId: currentUser.id,
      dataReposicao: new Date().toISOString(),
      observacaoReposicao: reposicaoObsInput.trim() || undefined,
      dataAtualizacao: new Date().toISOString(),
    };

    updateItem(updated);
    setEditingReposicaoItem(null);
  };

  // Mark items as sent via WhatsApp
  const handleMarkAsSentWhatsApp = (itemIds: string[]) => {
    const updated = purchases.map((p) => {
      if (itemIds.includes(p.id)) {
        return {
          ...p,
          enviadoWhatsapp: true,
          dataEnvioWhatsapp: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString(),
        };
      }
      return p;
    });
    if (onSavePurchases) {
      onSavePurchases(updated);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner Informativo & Ações Rápidas */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl text-white p-6 shadow-md border border-emerald-700/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider flex-wrap">
              <ShoppingBag className="w-4 h-4" />
              <span>Setor de Compras, Conferência da Kombi &amp; Reposição</span>
              <span className="bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                Renovação Diária Automática
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Compras (Charles &amp; Amanda) ➔ Conferência (Lucas &amp; Rafael) ➔ Reposição
            </h2>
            <p className="text-xs text-emerald-100/90 max-w-2xl leading-relaxed">
              Encarregado do Hortifrúti: <strong>Charles</strong> • Proprietários: <strong>Beto &amp; Amanda</strong>. A lista se renova automaticamente todos os dias após a conferência do Lucas ou Rafael (arquivando os conferidos no histórico).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={() => setIsAiImportModalOpen(true)}
              className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-emerald-950 font-black rounded-2xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
              title="Importar lista de compras colada do WhatsApp ou arquivo .txt com Inteligência Artificial"
            >
              <Sparkles className="w-4 h-4 text-emerald-950 fill-emerald-950" />
              <span>✨ Importar c/ IA (WhatsApp)</span>
            </button>

            <button
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              title="Enviar pedidos formatados por WhatsApp para fornecedores ou grupo"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Enviar WhatsApp</span>
            </button>

            <button
              onClick={() => {
                setPrintModalInitialModel('prancheta_dupla');
                setIsPrintModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
              title="Imprimir lista de compras ou planilha de conferência da Kombi com chaves largas"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Prancheta</span>
            </button>

            <button
              onClick={() => {
                setPrintModalInitialModel('extras_fora_da_lista');
                setIsPrintModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              title="Imprimir uma folha A4 para anotar os produtos que chegaram na loja, mas que não estavam na lista"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>📝 Folha: Chegaram Fora da Lista</span>
            </button>

            <button
              onClick={onAddPurchase}
              className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-950 font-black rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>+ Novo Pedido</span>
            </button>
          </div>
        </div>

        {/* Admin Shortcut: Conferir Junto com Lucas ou Rafael (Caso estejam sem celular) */}
        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-emerald-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-950/50 p-3.5 rounded-2xl border border-emerald-700/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider block">
                  Modo Administrador • Conferência Conjunta (Lucas ou Rafael sem celular)
                </span>
                <span className="text-[11px] text-emerald-100 block">
                  Você ({currentUser.nome}) pode conferir a chegada das mercadorias junto com o Lucas ou Rafael pelo seu aparelho:
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveChecker(`${currentUser.nome.split(' ')[0]} + Lucas`);
                  setActiveSubTab('conferencia');
                }}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === 'conferencia' && activeChecker.includes('Lucas')
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Conferir Junto c/ Lucas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveChecker(`${currentUser.nome.split(' ')[0]} + Rafael`);
                  setActiveSubTab('conferencia');
                }}
                className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === 'conferencia' && activeChecker.includes('Rafael')
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Conferir Junto c/ Rafael</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navegação entre as 3 Etapas do Fluxo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Etapa 1: Lista de Compras */}
        <button
          onClick={() => setActiveSubTab('compras')}
          className={`min-h-[80px] p-4 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer ${
            activeSubTab === 'compras'
              ? 'bg-[#0a3821] text-white border-[#0a3821] shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold flex items-center gap-1.5 ${activeSubTab === 'compras' ? 'text-white' : 'text-slate-900'}`}>
              <ShoppingBag className={`w-4 h-4 ${activeSubTab === 'compras' ? 'text-emerald-300' : 'text-emerald-700'}`} />
              1. Lista de Compras
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeSubTab === 'compras' ? 'bg-emerald-900 text-emerald-100 border border-emerald-700' : 'bg-slate-100 text-slate-700'
            }`}>
              Charles &amp; Amanda
            </span>
          </div>
          <div className={`text-2xl font-black mt-1.5 ${activeSubTab === 'compras' ? 'text-white' : 'text-[#0a3821]'}`}>{totalPurchases}</div>
          <div className={`text-[11px] ${activeSubTab === 'compras' ? 'text-emerald-100' : 'text-slate-500'}`}>
            {aguardandoChegadaCount} aguardando chegada do fornecedor
          </div>
        </button>

        {/* Etapa 2: Conferência de Chegada */}
        <button
          onClick={() => setActiveSubTab('conferencia')}
          className={`min-h-[80px] p-4 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer ${
            activeSubTab === 'conferencia'
              ? 'bg-[#0a3821] text-white border-[#0a3821] shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold flex items-center gap-1.5 ${activeSubTab === 'conferencia' ? 'text-white' : 'text-slate-900'}`}>
              <Truck className={`w-4 h-4 ${activeSubTab === 'conferencia' ? 'text-emerald-300' : 'text-emerald-700'}`} />
              2. Conferência de Chegada
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeSubTab === 'conferencia' ? 'bg-emerald-900 text-emerald-100 border border-emerald-700' : 'bg-slate-100 text-slate-700'
            }`}>
              Lucas &amp; Rafael
            </span>
          </div>
          <div className={`text-2xl font-black mt-1.5 ${activeSubTab === 'conferencia' ? 'text-white' : 'text-[#0a3821]'}`}>{recebidosNaLojaCount}/{totalPurchases}</div>
          <div className={`text-[11px] ${activeSubTab === 'conferencia' ? 'text-emerald-100' : 'text-slate-500'}`}>
            Confirmar chegada e informar quantidade recebida
          </div>
        </button>

        {/* Etapa 3: Estoque & Reposição de Banca */}
        <button
          onClick={() => setActiveSubTab('reposicao')}
          className={`min-h-[80px] p-4 rounded-2xl border text-left transition-all active:scale-[0.99] cursor-pointer ${
            activeSubTab === 'reposicao'
              ? 'bg-[#0a3821] text-white border-[#0a3821] shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold flex items-center gap-1.5 ${activeSubTab === 'reposicao' ? 'text-white' : 'text-slate-900'}`}>
              <Layers className={`w-4 h-4 ${activeSubTab === 'reposicao' ? 'text-emerald-300' : 'text-emerald-700'}`} />
              3. Reposição &amp; Sobra
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeSubTab === 'reposicao' ? 'bg-emerald-900 text-emerald-100 border border-emerald-700' : 'bg-slate-100 text-slate-700'
            }`}>
              Estoque da Loja
            </span>
          </div>
          <div className={`text-2xl font-black mt-1.5 ${activeSubTab === 'reposicao' ? 'text-white' : 'text-[#0a3821]'}`}>{faltaReporCount}</div>
          <div className={`text-[11px] ${activeSubTab === 'reposicao' ? 'text-emerald-100' : 'text-slate-500'}`}>
            {faltaReporCount === 1 ? 'Produto falta repor na banca' : 'Produtos que faltam repor na banca'}
          </div>
        </button>
      </div>

      {/* Control Bar: Busca, Filtros, Seleção em Massa e Renovação Diária */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por produto, fornecedor ou responsável..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
            {/* Categoria Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Categoria:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="todas">Todas ({purchases.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Fornecedor Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Fornecedor:</span>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="todos">Todos ({purchases.length})</option>
                {suppliers.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {(supplierFilter !== 'todos' || categoryFilter !== 'todas') && (
              <button
                onClick={() => {
                  setSupplierFilter('todos');
                  setCategoryFilter('todas');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
              >
                Limpar
              </button>
            )}

            <button
              onClick={onAddPurchase}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </button>
          </div>
        </div>

        {/* Barra de Seleção em Massa (Exclusão em Massa) & Renovação Pós-Conferência */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleToggleSelectAllVisible}
              disabled={filteredItems.length === 0}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all cursor-pointer disabled:opacity-50 ${
                allFilteredSelected
                  ? 'bg-[#0a3821] text-white border-[#0a3821]'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              {allFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-emerald-300" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span>
                {allFilteredSelected
                  ? `Desmarcar Todos (${filteredItems.length})`
                  : `Selecionar Todos (${filteredItems.length})`}
              </span>
            </button>

            {recebidosNaLojaCount > 0 && (
              <button
                type="button"
                onClick={handleSelectConferredOnly}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-semibold cursor-pointer"
              >
                Selecionar Já Conferidos ({recebidosNaLojaCount})
              </button>
            )}

            {aguardandoChegadaCount > 0 && (
              <button
                type="button"
                onClick={handleSelectPendingOnly}
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold cursor-pointer"
              >
                Selecionar Pendentes ({aguardandoChegadaCount})
              </button>
            )}

            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-slate-500 hover:text-slate-800 underline font-semibold px-1 cursor-pointer"
              >
                Limpar seleção
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Botão de Exclusão em Massa quando há itens selecionados */}
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => setIsBulkDeleteConfirmOpen(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer animate-in fade-in"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Selecionados ({selectedIds.size})</span>
              </button>
            )}

            {/* Botão de Renovação Diária após conferência do Lucas/Rafael */}
            {purchases.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setRenewMode(recebidosNaLojaCount > 0 ? 'only_conferred' : 'all');
                  setIsRenewConfirmOpen(true);
                }}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                title="Arquivar produtos já conferidos pelo Lucas ou Rafael e renovar a lista para o próximo dia"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>
                  Renovar Lista Pós-Conferência
                  {recebidosNaLojaCount > 0 ? ` (${recebidosNaLojaCount})` : ''}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setHistoryList(loadPurchaseHistory());
                setIsHistoryModalOpen(true);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
              title="Ver histórico de listas conferidas nos dias anteriores"
            >
              <History className="w-3.5 h-3.5 text-slate-600" />
              <span>Histórico ({historyList.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================= ABA 1: LISTA DE COMPRAS (CHARLES & AMANDA) ======================= */}
      {activeSubTab === 'compras' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-700" />
                Lista de Compras — Charles (Encarregado) &amp; Amanda (Proprietária)
              </h3>
              <p className="text-xs text-emerald-800">
                Marque a caixinha ao lado dos produtos para excluir em massa ou confira a chegada na Aba 2
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsAiImportModalOpen(true)}
                className="px-3 py-1.5 bg-[#0a3821] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Colar texto do WhatsApp e processar com IA"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>✨ Importar c/ IA</span>
              </button>
              <button
                onClick={() => setIsWhatsAppModalOpen(true)}
                className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => {
                  setPrintModalInitialModel('prancheta_dupla');
                  setIsPrintModalOpen(true);
                }}
                className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                <span>Imprimir Lista</span>
              </button>
              <button
                onClick={() => {
                  setPrintModalInitialModel('extras_fora_da_lista');
                  setIsPrintModalOpen(true);
                }}
                className="px-3 py-1.5 bg-amber-100 border border-amber-300 hover:bg-amber-200 text-amber-950 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Imprimir folha para anotar os produtos que chegaram, mas que não estavam na lista"
              >
                <Printer className="w-3.5 h-3.5 text-amber-800" />
                <span>📝 Folha: Chegaram Fora da Lista</span>
              </button>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
              <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium">Nenhum pedido de compra na lista atual.</p>
              <p className="text-xs text-slate-400 mt-1">
                A lista está limpa e pronta para o novo pedido do dia.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsAiImportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0a3821] text-white rounded-xl text-xs font-bold hover:bg-emerald-900 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  Importar Lista do WhatsApp
                </button>
                <button
                  onClick={onAddPurchase}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Lançar Novo Pedido Manual
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      isSelected ? 'bg-rose-50/60' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Selection Checkbox for Mass Deletion */}
                      <button
                        type="button"
                        onClick={() => toggleSelectItem(item.id)}
                        className="mt-1 text-slate-400 hover:text-slate-800 cursor-pointer shrink-0"
                        title="Selecionar produto para exclusão em massa"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-rose-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-bold">
                            {item.id}
                          </span>
                          <span className="text-xs text-slate-600 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {item.data}
                          </span>
                          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Por: {item.solicitadoPorNome}
                          </span>
                          {item.categoria && (
                            <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              {item.categoria}
                            </span>
                          )}
                          {item.enviadoWhatsapp && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" /> WhatsApp Enviado
                            </span>
                          )}
                        </div>

                        <div className="flex items-baseline gap-2 flex-wrap pt-0.5">
                          <h4 className="text-base font-black text-slate-900">{item.produto}</h4>
                          {item.quantidadePedida && item.quantidadePedida.trim() ? (
                            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md font-mono">
                              Pedido: {item.quantidadePedida}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
                              Pedido: A definir
                            </span>
                          )}
                          {item.statusConferencia === 'Comprou, mas não chegou' && (
                            <span className="text-xs font-black text-amber-950 bg-amber-200 border border-amber-400 px-2.5 py-0.5 rounded-md">
                              📦⚠️ Comprou, mas não chegou
                            </span>
                          )}
                          {item.statusConferencia === 'Não Comprou' && (
                            <span className="text-xs font-black text-rose-900 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-md">
                              🚫 Não Comprou
                            </span>
                          )}
                          {item.mercadoriaRecebida && item.quantidadeRecebida && (
                            <span className="text-xs font-black text-emerald-950 bg-emerald-200/80 px-2.5 py-0.5 rounded-md font-mono">
                              Chegou: {item.quantidadeRecebida} ({item.conferidoPorNome || 'Conferido'})
                            </span>
                          )}
                          {item.mercadoriaRecebida && item.quantidadeConvertida && item.unidadeConversao && (
                            <span className="text-xs font-black text-white bg-[#0a3821] px-2.5 py-0.5 rounded-md font-mono">
                              {item.unidadeConversao === 'kg' ? '⚖️' : '🔢'} Convertido: {item.quantidadeConvertida} {item.unidadeConversao}
                            </span>
                          )}
                          {item.mercadoriaRecebida && item.quantidadeAvaria && item.unidadeConversao && (
                            <span className="text-xs font-black text-rose-900 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-md font-mono">
                              ⚠ Avaria: {item.quantidadeAvaria} {item.unidadeConversao}
                              {item.quantidadeLiquidaAproveitavel
                                ? ` (Líq: ${item.quantidadeLiquidaAproveitavel} ${item.unidadeConversao})`
                                : ''}
                            </span>
                          )}
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                            Fornecedor: <strong className="text-slate-900">{item.fornecedor || 'Ceasa Box 14'}</strong>
                          </span>
                        </div>

                        {item.observacao && (
                          <p className="text-xs text-slate-600 bg-amber-50/60 px-2.5 py-1 rounded-lg border border-amber-200/80 max-w-2xl">
                            {item.observacao}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions for Purchase List: Botão Conferir + Botão Não Chegou (Comprou, mas não chegou | Não Comprou) */}
                    <div className="flex flex-col items-end gap-2 shrink-0 self-end sm:self-center">
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {!item.mercadoriaRecebida ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setNaoChegouOpenId(null);
                                handleOpenArrivalQuantityModal(item);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                              title="Confirmar que chegou na loja e anotar a quantidade recebida"
                            >
                              <Truck className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Conferir</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setNaoChegouOpenId(naoChegouOpenId === item.id ? null : item.id)
                              }
                              className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1 cursor-pointer transition-all ${
                                naoChegouOpenId === item.id ||
                                item.statusConferencia === 'Comprou, mas não chegou' ||
                                item.statusConferencia === 'Não Comprou'
                                  ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300'
                              }`}
                              title="Produto estava na lista mas não chegou à loja"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>
                                {item.statusConferencia === 'Comprou, mas não chegou'
                                  ? 'Comprou, mas não chegou'
                                  : item.statusConferencia === 'Não Comprou'
                                  ? 'Não Comprou'
                                  : 'Não Chegou'}
                              </span>
                            </button>
                          </>
                        ) : (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                            ✓ Na Loja ({item.quantidadeRecebida || item.quantidadePedida || 'OK'})
                          </span>
                        )}

                        <button
                          onClick={() => onEditPurchase(item)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeletePurchase(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Opções após clicar no botão Não Chegou */}
                      {(naoChegouOpenId === item.id ||
                        item.statusConferencia === 'Comprou, mas não chegou' ||
                        item.statusConferencia === 'Não Comprou') &&
                        !item.mercadoriaRecebida && (
                          <div className="flex items-center gap-1.5 flex-wrap justify-end bg-rose-50/90 border border-rose-200 px-2.5 py-1.5 rounded-xl">
                            <button
                              type="button"
                              onClick={() =>
                                handleMarkItemNaoChegou(item, 'Comprou, mas não chegou')
                              }
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-black border cursor-pointer transition-all ${
                                item.statusConferencia === 'Comprou, mas não chegou'
                                  ? 'bg-amber-500 text-slate-950 border-amber-700'
                                  : 'bg-white hover:bg-amber-50 text-amber-950 border-amber-400'
                              }`}
                            >
                              📦⚠️ Comprou, mas não chegou
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkItemNaoChegou(item, 'Não Comprou')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-black border cursor-pointer transition-all ${
                                item.statusConferencia === 'Não Comprou'
                                  ? 'bg-rose-700 text-white border-rose-900'
                                  : 'bg-white hover:bg-rose-100 text-rose-900 border-rose-300'
                              }`}
                            >
                              🚫 Não Comprou
                            </button>
                            {(item.statusConferencia === 'Comprou, mas não chegou' ||
                              item.statusConferencia === 'Não Comprou') && (
                              <button
                                type="button"
                                onClick={() => handleClearItemNaoChegou(item)}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 cursor-pointer"
                              >
                                Limpar
                              </button>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================= ABA 2: CONFERÊNCIA DE RECEBIMENTO (LUCAS, RAFAEL & ADMIN) ======================= */}
      {activeSubTab === 'conferencia' && (
        <div className="space-y-4">
          {/* Top Checker Selector & Joint Admin Conference */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5 text-emerald-800" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Conferência de Chegada da Kombi: O Que Pediu vs Quantidade que Chegou
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ao clicar em <strong>Conferir Chegada</strong>, informe a quantidade recebida. A lista se renova todos os dias após a conferência.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Checker Switcher (Supports Lucas, Rafael, and Admin + Lucas/Rafael when without phone) */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl flex-wrap">
                <span className="text-[11px] font-bold text-slate-600 px-1.5">
                  {isAdmin ? 'Conferindo como (c/ Lucas ou Rafael):' : 'Conferente:'}
                </span>
                {checkerOptions.map((chk) => (
                  <button
                    key={chk}
                    type="button"
                    onClick={() => setActiveChecker(chk)}
                    className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeChecker === chk
                        ? 'bg-[#0a3821] text-white shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {chk}
                  </button>
                ))}
              </div>

              {aguardandoChegadaCount > 0 && (
                <button
                  onClick={handleQuickReceiveAll}
                  className="min-h-[42px] px-4 py-2 bg-[#0a3821] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs active:scale-[0.98] cursor-pointer"
                  title="Iniciar conferência sequencial convertendo os produtos em kg ou un"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>⚖️ Conferir em Sequência (Converter kg / un)</span>
                </button>
              )}
            </div>
          </div>

          {/* Banner de Renovação Diária Automática & Prancheta Física */}
          <div className="bg-emerald-50/90 border border-emerald-200 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4 text-emerald-200" />
              </div>
              <div>
                <span className="font-black text-emerald-950 text-xs sm:text-sm block">
                  Renovação Diária Automática após Conferência ({activeChecker}):
                </span>
                <span className="text-emerald-900 text-[11px] leading-tight block mt-0.5">
                  Todos os itens conferidos são arquivados automaticamente na virada do dia para iniciar uma lista limpa. Você também pode renovar agora ao concluir a conferência.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setPrintModalInitialModel('conferencia');
                  setIsPrintModalOpen(true);
                }}
                className="min-h-[38px] px-3.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-700" />
                <span>Imprimir Espelho Kombi</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrintModalInitialModel('extras_fora_da_lista');
                  setIsPrintModalOpen(true);
                }}
                className="min-h-[38px] px-3.5 bg-amber-100 border border-amber-300 hover:bg-amber-200 text-amber-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Imprimir folha pautada para anotar os produtos que chegaram na loja, mas que não estavam na lista"
              >
                <Printer className="w-3.5 h-3.5 text-amber-800" />
                <span>📝 Folha: Chegaram Fora da Lista</span>
              </button>
              {recebidosNaLojaCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setRenewMode('only_conferred');
                    setIsRenewConfirmOpen(true);
                  }}
                  className="min-h-[38px] px-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Encerrar Conferência &amp; Renovar Lista ({recebidosNaLojaCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* DEDICATED MOBILE CARDS VIEW (block md:hidden) */}
          <div className="block md:hidden space-y-3">
            {filteredItems.map((item) => {
              const status = item.statusConferencia || (item.mercadoriaRecebida ? 'Entregue Completo' : 'Pendente');
              const isSelected = selectedIds.has(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-4 bg-white rounded-2xl border shadow-xs space-y-3 ${
                    isSelected ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => toggleSelectItem(item.id)}
                        className="mt-1 text-slate-400 hover:text-slate-800 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-rose-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-bold">{item.id}</span>
                          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.fornecedor || 'Ceasa Box 14'}
                          </span>
                        </div>
                        <h4 className="text-base font-black text-slate-900">{item.produto}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Pedido por: {item.solicitadoPorNome} • {item.categoria || 'Geral'}</p>
                      </div>
                    </div>

                    {status === 'Comprou, mas não chegou' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-200 text-amber-950 border border-amber-400 shrink-0">
                        📦⚠️ Comprou, mas não chegou
                      </span>
                    ) : status === 'Não Comprou' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300 shrink-0">
                        🚫 Não Comprou
                      </span>
                    ) : status === 'Entrega Parcial / Falta' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                        ⚠ Entrega Parcial
                      </span>
                    ) : item.mercadoriaRecebida ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 shrink-0">
                        ✓ Conferido
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 shrink-0">
                        Pendente
                      </span>
                    )}
                  </div>

                  {/* Quantities & Mandatory Conversion comparison */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-0.5">O que pediu:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {item.quantidadePedida && item.quantidadePedida.trim() ? item.quantidadePedida : 'A definir'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-0.5">Qtd que chegou na loja:</span>
                      {item.mercadoriaRecebida ? (
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-emerald-800 text-sm block">
                            {item.quantidadeRecebida || item.quantidadePedida || 'Conferido'}
                          </span>
                          {item.quantidadeConvertida && item.unidadeConversao && (
                            <span className="inline-block px-2 py-0.5 rounded bg-[#0a3821] text-white font-mono font-black text-xs">
                              {item.unidadeConversao === 'kg' ? '⚖️' : '🔢'} {item.quantidadeConvertida} {item.unidadeConversao}
                            </span>
                          )}
                          {item.quantidadeAvaria && item.unidadeConversao && (
                            <span className="block text-[11px] font-mono font-bold text-rose-700">
                              ⚠ Avaria: {item.quantidadeAvaria} {item.unidadeConversao}
                              {item.quantidadeLiquidaAproveitavel
                                ? ` • Líq: ${item.quantidadeLiquidaAproveitavel} ${item.unidadeConversao}`
                                : ''}
                            </span>
                          )}
                        </div>
                      ) : status === 'Comprou, mas não chegou' || status === 'Não Comprou' ? (
                        <span className="font-black text-rose-700 text-xs block">
                          ✕ {status}
                        </span>
                      ) : (
                        <span className="font-bold text-rose-600 text-sm italic">Aguardando conferência</span>
                      )}
                    </div>
                  </div>

                  {item.motivoDivergencia && (
                    <p className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      <strong>Observação / Divergência:</strong> {item.motivoDivergencia}
                    </p>
                  )}

                  {item.conferidoPorNome && (
                    <p className="text-xs text-slate-600">
                      Conferido por: <strong className="text-emerald-900 font-bold">{item.conferidoPorNome}</strong>
                    </p>
                  )}

                  {/* Large Action Buttons: Conferir + Botão Não Chegou (Comprou, mas não chegou | Não Comprou) */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      {!item.mercadoriaRecebida ? (
                        <>
                          <button
                            onClick={() => {
                              setNaoChegouOpenId(null);
                              handleOpenArrivalQuantityModal(item);
                            }}
                            className="flex-1 min-h-[48px] bg-[#0a3821] hover:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.98] shadow-xs cursor-pointer"
                          >
                            <Check className="w-4 h-4 text-emerald-300" />
                            <span>✓ Conferir ({activeChecker})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setNaoChegouOpenId(naoChegouOpenId === item.id ? null : item.id)
                            }
                            className={`min-h-[48px] px-3.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer shrink-0 ${
                              naoChegouOpenId === item.id ||
                              status === 'Comprou, mas não chegou' ||
                              status === 'Não Comprou'
                                ? 'bg-rose-600 text-white border-rose-700'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300'
                            }`}
                          >
                            <X className="w-4 h-4" />
                            <span>Não Chegou</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOpenArrivalQuantityModal(item)}
                            className="flex-1 min-h-[48px] bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Edit className="w-4 h-4 text-emerald-700" />
                            <span>
                              Editar ({item.quantidadeConvertida ? `${item.quantidadeConvertida} ${item.unidadeConversao}` : item.quantidadeRecebida || 'OK'})
                            </span>
                          </button>
                          <button
                            onClick={() => onToggleRecebida(item.id, true)}
                            className="min-h-[48px] px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                          >
                            Desmarcar
                          </button>
                        </>
                      )}
                    </div>

                    {(naoChegouOpenId === item.id ||
                      status === 'Comprou, mas não chegou' ||
                      status === 'Não Comprou') &&
                      !item.mercadoriaRecebida && (
                        <div className="p-2.5 rounded-xl bg-rose-50/90 border border-rose-200 space-y-1.5">
                          <span className="text-[11px] font-black text-rose-950 block">
                            Selecione o motivo de não ter chegado à loja:
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() =>
                                handleMarkItemNaoChegou(item, 'Comprou, mas não chegou')
                              }
                              className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer ${
                                status === 'Comprou, mas não chegou'
                                  ? 'bg-amber-500 text-slate-950 border-amber-700'
                                  : 'bg-white hover:bg-amber-50 text-amber-950 border-amber-400'
                              }`}
                            >
                              📦⚠️ Comprou, mas não chegou
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkItemNaoChegou(item, 'Não Comprou')}
                              className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer ${
                                status === 'Não Comprou'
                                  ? 'bg-rose-700 text-white border-rose-900'
                                  : 'bg-white hover:bg-rose-100 text-rose-900 border-rose-300'
                              }`}
                            >
                              🚫 Não Comprou
                            </button>
                            {(status === 'Comprou, mas não chegou' || status === 'Não Comprou') && (
                              <button
                                type="button"
                                onClick={() => handleClearItemNaoChegou(item)}
                                className="min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 border border-slate-300 cursor-pointer"
                              >
                                Limpar
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP COMPARISON TABLE (hidden md:block) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-3 w-10 text-center">Sel.</th>
                    <th className="p-3">Produto &amp; Categoria</th>
                    <th className="p-3">Fornecedor</th>
                    <th className="p-3 text-center">O Que Foi Pedido</th>
                    <th className="p-3 text-center bg-emerald-50/50">Qtd Que Chegou na Loja</th>
                    <th className="p-3 text-center">Status / Divergência</th>
                    <th className="p-3 text-center">Conferido Por</th>
                    <th className="p-3 text-right">Conferir / Não Chegou</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const status = item.statusConferencia || (item.mercadoriaRecebida ? 'Entregue Completo' : 'Pendente');
                    const isSelected = selectedIds.has(item.id);

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-rose-50/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectItem(item.id)}
                            className="text-slate-400 hover:text-slate-800 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-rose-600 mx-auto" />
                            ) : (
                              <Square className="w-4 h-4 mx-auto" />
                            )}
                          </button>
                        </td>

                        {/* Produto */}
                        <td className="p-3">
                          <span className="font-bold text-slate-900 text-xs block">{item.produto}</span>
                          <span className="text-[10px] text-slate-500">
                            Pedido por: {item.solicitadoPorNome} • {item.categoria || 'Geral'}
                          </span>
                        </td>

                        {/* Fornecedor */}
                        <td className="p-3 font-semibold text-slate-700">
                          {item.fornecedor || 'Ceasa Box 14'}
                        </td>

                        {/* O que foi pedido */}
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-900 font-mono font-bold text-xs">
                            {item.quantidadePedida && item.quantidadePedida.trim()
                              ? item.quantidadePedida
                              : 'A definir'}
                          </span>
                        </td>

                        {/* O que chegou na loja + Conversão Obrigatória (kg / un) + Avaria */}
                        <td className="p-3 text-center bg-emerald-50/30">
                          {item.mercadoriaRecebida ? (
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenArrivalQuantityModal(item)}
                                className="px-2.5 py-1 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-mono font-bold text-xs border border-emerald-300 cursor-pointer inline-flex items-center gap-1"
                                title="Clique para editar a quantidade que chegou, conversão (kg/un) ou avaria"
                              >
                                <span>{item.quantidadeRecebida || item.quantidadePedida || 'Conferido'}</span>
                                <Edit className="w-3 h-3 text-emerald-700" />
                              </button>
                              {item.quantidadeConvertida && item.unidadeConversao && (
                                <span className="px-2 py-0.5 rounded bg-[#0a3821] text-white font-mono font-black text-[11px]">
                                  {item.unidadeConversao === 'kg' ? '⚖️' : '🔢'} {item.quantidadeConvertida} {item.unidadeConversao}
                                </span>
                              )}
                              {item.quantidadeAvaria && item.unidadeConversao && (
                                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-300 font-mono font-bold text-[10px]">
                                  Avaria: {item.quantidadeAvaria} {item.unidadeConversao}
                                  {item.quantidadeLiquidaAproveitavel
                                    ? ` (Líq: ${item.quantidadeLiquidaAproveitavel} ${item.unidadeConversao})`
                                    : ''}
                                </span>
                              )}
                            </div>
                          ) : status === 'Comprou, mas não chegou' || status === 'Não Comprou' ? (
                            <span className="text-rose-800 font-black text-xs">
                              0 (Não chegou)
                            </span>
                          ) : (
                            <span className="text-rose-600 font-bold text-xs italic">
                              Aguardando
                            </span>
                          )}
                        </td>

                        {/* Status / Divergência */}
                        <td className="p-3 text-center">
                          {status === 'Entregue Completo' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ✓ Entregue Completo
                            </span>
                          ) : status === 'Comprou, mas não chegou' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-200 text-amber-950 border border-amber-400">
                              📦⚠️ Comprou, mas não chegou
                            </span>
                          ) : status === 'Não Comprou' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300">
                              🚫 Não Comprou
                            </span>
                          ) : status === 'Entrega Parcial / Falta' ? (
                            <div className="space-y-0.5">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                ⚠ Entrega Parcial
                              </span>
                              {item.motivoDivergencia && (
                                <p className="text-[10px] text-amber-800 truncate max-w-36 mx-auto">
                                  {item.motivoDivergencia}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                              Pendente
                            </span>
                          )}
                        </td>

                        {/* Conferido Por */}
                        <td className="p-3 text-center text-[11px]">
                          {item.conferidoPorNome ? (
                            <div className="font-bold text-slate-800">
                              <span className="text-emerald-700">✓ {item.conferidoPorNome}</span>
                              {item.dataConferencia && (
                                <span className="block text-[10px] text-slate-400 font-normal">
                                  {new Date(item.dataConferencia).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Aguardando</span>
                          )}
                        </td>

                        {/* Ações: Conferir + Botão Não Chegou (Comprou, mas não chegou | Não Comprou) */}
                        <td className="p-3 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center justify-end gap-1.5">
                              {!item.mercadoriaRecebida ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setNaoChegouOpenId(null);
                                      handleOpenArrivalQuantityModal(item);
                                    }}
                                    className="min-h-[38px] px-3 py-1.5 bg-[#0a3821] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-[0.98] cursor-pointer shadow-2xs"
                                    title={`Confirmar chegada e informar a quantidade recebida (${activeChecker})`}
                                  >
                                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                                    <span>Conferir</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setNaoChegouOpenId(
                                        naoChegouOpenId === item.id ? null : item.id
                                      )
                                    }
                                    className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1 cursor-pointer transition-all ${
                                      naoChegouOpenId === item.id ||
                                      status === 'Comprou, mas não chegou' ||
                                      status === 'Não Comprou'
                                        ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                                        : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300'
                                    }`}
                                    title="Marcar produto que estava na lista mas não chegou à loja"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Não Chegou</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleOpenArrivalQuantityModal(item)}
                                    className="min-h-[38px] px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
                                    title="Editar quantidade recebida ou observação"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                    <span>Qtd</span>
                                  </button>
                                  <button
                                    onClick={() => onToggleRecebida(item.id, true)}
                                    className="min-h-[38px] px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                                    title="Desmarcar recebimento"
                                  >
                                    Reverter
                                  </button>
                                </>
                              )}
                            </div>

                            {(naoChegouOpenId === item.id ||
                              status === 'Comprou, mas não chegou' ||
                              status === 'Não Comprou') &&
                              !item.mercadoriaRecebida && (
                                <div className="flex items-center justify-end gap-1 flex-wrap bg-rose-50/90 border border-rose-200 p-1.5 rounded-xl">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleMarkItemNaoChegou(item, 'Comprou, mas não chegou')
                                    }
                                    className={`px-2 py-1 rounded-lg text-[10px] font-black border cursor-pointer ${
                                      status === 'Comprou, mas não chegou'
                                        ? 'bg-amber-500 text-slate-950 border-amber-700'
                                        : 'bg-white hover:bg-amber-50 text-amber-950 border-amber-400'
                                    }`}
                                  >
                                    📦⚠️ Comprou, mas não chegou
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMarkItemNaoChegou(item, 'Não Comprou')}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-black border cursor-pointer ${
                                      status === 'Não Comprou'
                                        ? 'bg-rose-700 text-white border-rose-900'
                                        : 'bg-white hover:bg-rose-100 text-rose-900 border-rose-300'
                                    }`}
                                  >
                                    🚫 Não Comprou
                                  </button>
                                  {(status === 'Comprou, mas não chegou' ||
                                    status === 'Não Comprou') && (
                                    <button
                                      type="button"
                                      onClick={() => handleClearItemNaoChegou(item)}
                                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white text-slate-600 border border-slate-300 cursor-pointer"
                                    >
                                      Limpar
                                    </button>
                                  )}
                                </div>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= ABA 3: ESTOQUE RECEBIDO & REPOSIÇÃO DE BANCA ======================= */}
      {activeSubTab === 'reposicao' && (
        <div className="space-y-4">
          {/* Dashboard de Estoque e Falta Repor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-700" />
                Estoque Recebido na Loja
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">{recebidosNaLojaCount} itens</div>
              <div className="text-[11px] text-slate-500">Produtos físicos já conferidos na loja</div>
            </div>

            <div className="p-4 bg-white rounded-2xl border-2 border-[#0a3821] shadow-xs">
              <div className="text-xs font-bold text-[#0a3821] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-emerald-800" />
                Falta Repor na Banca
              </div>
              <div className="text-2xl font-black text-[#0a3821] mt-1">{faltaReporCount} produtos</div>
              <div className="text-[11px] text-slate-600 font-semibold">
                Mercadorias na loja aguardando abastecer a banca
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Banca Abastecida (Reposto)
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">{reposicaoConcluidaCount} produtos</div>
              <div className="text-[11px] text-emerald-800 font-semibold">
                Produtos prontos no salão de vendas
              </div>
            </div>
          </div>

          {/* Sub-filtros de Reposição */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700">Visualizar Estoque:</span>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setReposicaoSubFilter('falta_repor')}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reposicaoSubFilter === 'falta_repor'
                      ? 'bg-[#0a3821] text-white shadow-2xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Falta Repor ({faltaReporCount})
                </button>
                <button
                  type="button"
                  onClick={() => setReposicaoSubFilter('reposto')}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reposicaoSubFilter === 'reposto'
                      ? 'bg-[#0a3821] text-white shadow-2xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Reposto na Banca ({reposicaoConcluidaCount})
                </button>
                <button
                  type="button"
                  onClick={() => setReposicaoSubFilter('todos')}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reposicaoSubFilter === 'todos'
                      ? 'bg-[#0a3821] text-white shadow-2xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Todos ({recebidosNaLojaCount})
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Toque no botão para marcar que colocou na banca
            </div>
          </div>

          {/* Lista de Reposição */}
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
              <PackageCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">
                {reposicaoSubFilter === 'falta_repor'
                  ? 'Parabéns! Todas as mercadorias recebidas já foram repostas na banca.'
                  : 'Nenhum produto encontrado nesta categoria.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-rose-50/50 border-rose-300'
                        : item.reposicaoConcluida
                        ? 'bg-slate-50 border-slate-200 opacity-85'
                        : 'bg-white border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleSelectItem(item.id)}
                        className="mt-1 text-slate-400 hover:text-slate-800 cursor-pointer shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-rose-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {item.id}
                          </span>
                          <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-md font-mono">
                            Qtd Recebida: {item.quantidadeRecebida || item.quantidadePedida || 'Conferido'}
                          </span>
                          {item.quantidadeConvertida && item.unidadeConversao && (
                            <span className="text-xs font-black text-white bg-[#0a3821] px-2.5 py-0.5 rounded-md font-mono">
                              {item.unidadeConversao === 'kg' ? '⚖️' : '🔢'} Convertido: {item.quantidadeConvertida} {item.unidadeConversao}
                            </span>
                          )}
                          {item.quantidadeAvaria && item.unidadeConversao && (
                            <span className="text-xs font-black text-rose-900 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-md font-mono">
                              ⚠ Avaria: {item.quantidadeAvaria} {item.unidadeConversao}
                              {item.quantidadeLiquidaAproveitavel
                                ? ` (Líquido p/ Banca: ${item.quantidadeLiquidaAproveitavel} ${item.unidadeConversao})`
                                : ''}
                            </span>
                          )}
                          <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                            Fornecedor: <strong className="text-slate-800">{item.fornecedor || 'Ceasa Box 14'}</strong>
                          </span>
                          {item.conferidoPorNome && (
                            <span className="text-[11px] text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                              Conferido por: {item.conferidoPorNome}
                            </span>
                          )}
                        </div>

                        <h4
                          className={`text-base font-black ${
                            item.reposicaoConcluida ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {item.produto}
                        </h4>

                        {item.observacaoReposicao && (
                          <p className="text-xs text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            Sobra de estoque / Observação: {item.observacaoReposicao}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        onClick={() => handleQuickToggleReposicao(item)}
                        className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 active:scale-[0.98] transition-all cursor-pointer ${
                          item.reposicaoConcluida
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            : 'bg-[#0a3821] hover:bg-emerald-800 text-white shadow-xs'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>{item.reposicaoConcluida ? '✓ Reposto na Banca' : 'Marcar como Reposto'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingReposicaoItem(item);
                          setReposicaoObsInput(item.observacaoReposicao || '');
                        }}
                        className="min-h-[44px] px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        title="Anotar sobra de estoque na câmara ou observação"
                      >
                        <Edit className="w-4 h-4 text-slate-600" />
                        <span>Sobra</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================= MODAL: CONFERIR CHEGADA + CONVERSÃO OBRIGATÓRIA (KG / UN) + AVARIA ======================= */}
      {editingConferenceItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-700" />
                  <span>Conferência de Chegada &amp; Conversão Obrigatória</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Quando os produtos chegam em caixa/saco, converta obrigatoriamente em <strong>kg</strong> (fração) ou <strong>un</strong> (inteiro)
                </p>
              </div>
              <button
                onClick={() => setEditingConferenceItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDetailedConference} className="space-y-4 text-xs">
              <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-emerald-800 font-bold block">Produto Conferido:</span>
                  <span className="text-base font-black text-slate-900">{editingConferenceItem.produto}</span>
                  <span className="text-[11px] text-slate-600 block mt-0.5">
                    Fornecedor: <strong>{editingConferenceItem.fornecedor || 'Ceasa Box 14'}</strong>
                  </span>
                </div>
                <div className="text-right bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0">
                  <span className="text-[10px] text-slate-500 block font-bold uppercase">Qtd Pedida</span>
                  <span className="text-sm font-mono font-black text-emerald-950">
                    {editingConferenceItem.quantidadePedida && editingConferenceItem.quantidadePedida.trim()
                      ? editingConferenceItem.quantidadePedida
                      : 'Em branco'}
                  </span>
                </div>
              </div>

              {confErro && (
                <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs font-black flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{confErro}</span>
                </div>
              )}

              {/* Quem está conferindo (Lucas, Rafael ou Admin junto com eles) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                  1. Quem está conferindo a chegada?
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {checkerOptions.map((chk) => (
                    <button
                      key={chk}
                      type="button"
                      onClick={() => setActiveChecker(chk)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        activeChecker === chk
                          ? 'bg-[#0a3821] text-white border-[#0a3821]'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {chk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantidade de volumes que chegou na loja */}
              <div>
                <label className="block text-[11px] font-bold text-slate-800 uppercase mb-1">
                  2. Quantos volumes chegaram na loja? (Ex: 1 cx, 1 sc) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 1 cx, 2 sc, 5 maços, 16 un..."
                  value={confRecebidaInput}
                  onChange={(e) => setConfRecebidaInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border-2 border-slate-300 font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />

                {/* Botões rápidos para tocar e preencher a quantidade que chegou */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] font-bold text-slate-500">Toque rápido:</span>
                  {editingConferenceItem.quantidadePedida && editingConferenceItem.quantidadePedida.trim() && (
                    <button
                      type="button"
                      onClick={() => setConfRecebidaInput(editingConferenceItem.quantidadePedida!)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-black text-[11px] cursor-pointer border border-emerald-300"
                    >
                      ✓ Igual ao Pedido ({editingConferenceItem.quantidadePedida})
                    </button>
                  )}
                  {QUICK_ARRIVAL_QUANTITIES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setConfRecebidaInput(q)}
                      className={`px-2 py-1 rounded-lg font-mono font-bold text-[11px] cursor-pointer border ${
                        confRecebidaInput === q
                          ? 'bg-[#0a3821] text-white border-[#0a3821]'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* CONVERSÃO OBRIGATÓRIA EM KG OU UNIDADE + AVARIA OPCIONAL NA MESMA UNIDADE */}
              {!(
                confRecebidaInput.trim() === '0' ||
                confRecebidaInput.toLowerCase().includes('faltou') ||
                confRecebidaInput.toLowerCase() === 'nada'
              ) && (
                <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-300 space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label className="text-[11px] font-black text-slate-900 uppercase">
                        3. Unidade de Medida na Conversão (Obrigatório) *
                      </label>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-200 text-amber-950 uppercase">
                        Obrigatório
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mb-2">
                      Ex: 1cx Uva Vitória ➔ <strong>20,450 kg</strong> (fracionado) | 1cx Limão Taiti ➔ <strong>243 un</strong> (inteiro)
                    </p>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleSelectConfUnidade('kg')}
                        className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          confUnidadeConversao === 'kg'
                            ? 'bg-[#0a3821] text-white border-[#0a3821] shadow-md'
                            : 'bg-white text-slate-900 border-slate-300 hover:border-emerald-600'
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-black block">⚖️ Quilo (kg)</span>
                        <span
                          className={`text-[10px] font-semibold block mt-0.5 ${
                            confUnidadeConversao === 'kg' ? 'text-emerald-200' : 'text-slate-500'
                          }`}
                        >
                          Aceita número fracionado (Ex: 20,450)
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectConfUnidade('un')}
                        className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          confUnidadeConversao === 'un'
                            ? 'bg-[#0a3821] text-white border-[#0a3821] shadow-md'
                            : 'bg-white text-slate-900 border-slate-300 hover:border-emerald-600'
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-black block">🔢 Unidade (un)</span>
                        <span
                          className={`text-[10px] font-semibold block mt-0.5 ${
                            confUnidadeConversao === 'un' ? 'text-emerald-200' : 'text-slate-500'
                          }`}
                        >
                          Recebe apenas valor inteiro (Ex: 243)
                        </span>
                      </button>
                    </div>
                  </div>

                  {confUnidadeConversao ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Valor Convertido Obrigatório */}
                      <div>
                        <label className="block text-[11px] font-black text-slate-900 uppercase mb-1">
                          {confUnidadeConversao === 'kg'
                            ? 'Peso Convertido em kg *'
                            : 'Quantidade Convertida em un *'}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode={confUnidadeConversao === 'kg' ? 'decimal' : 'numeric'}
                            required
                            value={confValorConvertido}
                            onChange={(e) => {
                              setConfErro('');
                              setConfValorConvertido(
                                sanitizeMeasureValue(e.target.value, confUnidadeConversao)
                              );
                            }}
                            placeholder={
                              confUnidadeConversao === 'kg' ? 'Ex: 20,450' : 'Ex: 243 (inteiro)'
                            }
                            className="w-full pl-3.5 pr-12 py-2.5 bg-white rounded-xl border-2 border-[#0a3821] font-mono font-black text-sm text-slate-900 focus:outline-none"
                          />
                          <span className="absolute right-3 top-2.5 text-xs font-mono font-black text-[#0a3821] bg-emerald-100 px-2 py-0.5 rounded">
                            {confUnidadeConversao}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-600 font-semibold block mt-1">
                          {confUnidadeConversao === 'kg'
                            ? 'Número fracionado permitido (ex: 20,450 kg)'
                            : 'Somente número inteiro (ex: 243 un)'}
                        </span>
                      </div>

                      {/* Avaria Opcional na Mesma Unidade */}
                      <div>
                        <label className="block text-[11px] font-bold text-rose-900 uppercase mb-1">
                          Avaria (Opcional em {confUnidadeConversao})
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode={confUnidadeConversao === 'kg' ? 'decimal' : 'numeric'}
                            value={confValorAvaria}
                            onChange={(e) =>
                              setConfValorAvaria(
                                sanitizeMeasureValue(e.target.value, confUnidadeConversao)
                              )
                            }
                            placeholder={
                              confUnidadeConversao === 'kg'
                                ? 'Ex: 0,450 (opcional)'
                                : 'Ex: 3 (inteiro, opcional)'
                            }
                            className="w-full pl-3.5 pr-12 py-2.5 bg-white rounded-xl border-2 border-rose-300 font-mono font-bold text-sm text-rose-950 focus:outline-none focus:border-rose-600"
                          />
                          <span className="absolute right-3 top-2.5 text-xs font-mono font-black text-rose-900 bg-rose-100 px-2 py-0.5 rounded">
                            {confUnidadeConversao}
                          </span>
                        </div>
                        <span className="text-[10px] text-rose-800 font-semibold block mt-1">
                          {confUnidadeConversao === 'kg'
                            ? 'Mesma unidade (kg c/ fração) p/ avaria'
                            : 'Mesma unidade (un inteiro) p/ avaria'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-white border border-amber-300 text-[11px] font-bold text-amber-950 text-center">
                      👆 Selecione <strong>Quilo (kg)</strong> ou <strong>Unidade (un)</strong> acima para informar a conversão e eventual avaria.
                    </div>
                  )}

                  {confUnidadeConversao && confValorConvertido && (
                    <div className="p-2.5 rounded-xl bg-white border border-emerald-300 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        Conversão ({confRecebidaInput || '1 cx'}):
                      </span>
                      <span className="font-mono font-black text-[#0a3821]">
                        {confValorConvertido} {confUnidadeConversao}
                        {parseMeasureNumber(confValorAvaria) > 0 && (
                          <span className="text-rose-700 ml-1">
                            (- {confValorAvaria} {confUnidadeConversao} avaria ={' '}
                            <strong className="text-emerald-950">
                              {formatMeasureNumber(
                                Math.max(
                                  0,
                                  parseMeasureNumber(confValorConvertido) -
                                    parseMeasureNumber(confValorAvaria)
                                ),
                                confUnidadeConversao,
                                confValorConvertido
                              )}{' '}
                              {confUnidadeConversao} líq.
                            </strong>
                            )
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  4. Observação / Motivo de Divergência (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Deixe em branco se chegou tudo certo, ou anote faltas/observações"
                  value={confDivergenciaInput}
                  onChange={(e) => setConfDivergenciaInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="pt-2 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingConferenceItem(null)}
                  className="px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                {purchases.filter((p) => !p.mercadoriaRecebida && p.id !== editingConferenceItem.id).length > 0 && (
                  <button
                    type="button"
                    onClick={() => saveDetailedConference(true)}
                    className="px-4 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-[#0a3821] border border-emerald-400 rounded-xl text-xs font-black cursor-pointer"
                  >
                    Salvar &amp; Próximo ({purchases.filter((p) => !p.mercadoriaRecebida && p.id !== editingConferenceItem.id).length})
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0a3821] hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Confirmar Chegada ({activeChecker})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: CONFIRMAÇÃO DE EXCLUSÃO EM MASSA ======================= */}
      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Excluir {selectedIds.size} {selectedIds.size === 1 ? 'Produto Selecionado' : 'Produtos Selecionados'}?
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Os produtos selecionados serão removidos imediatamente da lista de compras e reposição.
                </p>
              </div>
            </div>

            <div className="max-h-40 overflow-y-auto bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
              {purchases
                .filter((p) => selectedIds.has(p.id))
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-slate-700 font-semibold">
                    <span>• {p.produto}</span>
                    <span className="font-mono text-[11px] text-slate-500">{p.quantidadePedida || 'S/ qtd'}</span>
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteConfirmOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir ({selectedIds.size})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: RENOVAR LISTA PÓS-CONFERÊNCIA ======================= */}
      {isRenewConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Renovar Lista de Compras para o Próximo Pedido
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Os produtos conferidos pelo Lucas ou Rafael ficam salvos no <strong>Histórico de Conferências</strong> e saem da lista ativa para você começar a lista do novo dia limpa.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="renewMode"
                  checked={renewMode === 'only_conferred'}
                  onChange={() => setRenewMode('only_conferred')}
                  className="mt-0.5 text-emerald-700"
                />
                <div>
                  <span className="font-black text-slate-900 block">
                    Arquivar e limpar apenas os já conferidos ({recebidosNaLojaCount} itens)
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Mantém na lista os {aguardandoChegadaCount} itens que ainda não chegaram.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="renewMode"
                  checked={renewMode === 'all'}
                  onChange={() => setRenewMode('all')}
                  className="mt-0.5 text-emerald-700"
                />
                <div>
                  <span className="font-black text-slate-900 block">
                    Arquivar tudo e zerar a lista completa ({purchases.length} itens)
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Deixa a lista 100% em branco para o próximo dia.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRenewConfirmOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRenewList}
                className="px-4 py-2 text-xs font-black text-white bg-[#0a3821] hover:bg-emerald-800 rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4 text-emerald-300" />
                <span>Confirmar Renovação</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: HISTÓRICO DE CONFERÊNCIAS ANTERIORES ======================= */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[88vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#0a3821] flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Histórico de Listas Conferidas (Renovação Diária)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registro automático das listas finalizadas após a conferência de Lucas e Rafael
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {historyList.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                  Nenhuma lista arquivada ainda. Assim que os produtos conferidos forem renovados na virada do dia (ou pelo botão Renovar Lista), eles aparecerão aqui.
                </div>
              ) : (
                historyList.map((batch) => (
                  <div key={batch.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <span className="font-black text-slate-900 text-sm">
                          Lista de {batch.dataLista} ({batch.totalItens} produtos)
                        </span>
                        <span className="block text-[11px] text-emerald-800 font-semibold">
                          Conferido por: {batch.conferidoPor} • Arquivado em:{' '}
                          {new Date(batch.dataArquivamento).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onBatchAddPurchases) {
                            const cloned = batch.itens.map((it, idx) => ({
                              ...it,
                              id: `ITEM-${Date.now().toString().slice(-4)}-${idx + 1}`,
                              mercadoriaRecebida: false,
                              quantidadeRecebida: undefined,
                              statusConferencia: 'Pendente' as PurchaseStatusConferencia,
                              conferidoPorNome: undefined,
                              conferidoPorId: undefined,
                              dataConferencia: undefined,
                              reposicaoConcluida: false,
                            }));
                            onBatchAddPurchases(cloned, 'append');
                            setIsHistoryModalOpen(false);
                          }
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-[#0a3821] border border-emerald-300 rounded-xl font-bold text-xs cursor-pointer"
                      >
                        Reutilizar Produtos na Lista de Hoje
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {batch.itens.slice(0, 12).map((it) => (
                        <span
                          key={it.id}
                          className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] text-slate-700"
                        >
                          {it.produto} ({it.quantidadeRecebida || it.quantidadePedida || 'OK'})
                        </span>
                      ))}
                      {batch.itens.length > 12 && (
                        <span className="text-[11px] text-slate-500 font-semibold">
                          +{batch.itens.length - 12} itens
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: ANOTAR SOBRA DE REPOSIÇÃO ======================= */}
      {editingReposicaoItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                Reposição &amp; Sobra de Estoque
              </h3>
              <button
                onClick={() => setEditingReposicaoItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDetailedReposicao} className="mt-4 space-y-3.5 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Produto:</span>
                <span className="text-sm font-black text-slate-900">{editingReposicaoItem.produto}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block font-semibold">Qtd Recebida em Estoque:</span>
                <span className="text-sm font-mono font-bold text-slate-900">
                  {editingReposicaoItem.quantidadeRecebida || editingReposicaoItem.quantidadePedida || 'Conferido'}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Observação de Sobra (O que foi pra banca vs O que ficou guardado):
                </label>
                <input
                  type="text"
                  placeholder="Ex: 6 cx na banca, sobra de 4 cx na câmara fria"
                  value={reposicaoObsInput}
                  onChange={(e) => setReposicaoObsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingReposicaoItem(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirmar Reposição na Banca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Import Modal (WhatsApp & .txt) */}
      <PurchaseAiImportModal
        isOpen={isAiImportModalOpen}
        onClose={() => setIsAiImportModalOpen(false)}
        currentUser={currentUser}
        existingSuppliers={suppliers}
        existingPurchasesCount={purchases.length}
        onConfirmImport={(newItems, openPrint, saveMode = 'replace') => {
          if (onBatchAddPurchases) {
            onBatchAddPurchases(newItems, saveMode);
          } else if (onSavePurchases) {
            onSavePurchases(saveMode === 'replace' ? newItems : [...newItems, ...purchases]);
          }
          if (openPrint) {
            setIsPrintModalOpen(true);
          }
        }}
      />

      {/* WhatsApp Modal */}
      <PurchaseWhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        purchases={purchases}
        settings={settings}
        currentUser={currentUser}
        onMarkAsSent={handleMarkAsSentWhatsApp}
      />

      {/* Print Modal */}
      <PurchasePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        purchases={purchases}
        settings={settings}
        currentUser={currentUser}
        initialModel={printModalInitialModel}
      />
    </div>
  );
};

