import React, { useState, useMemo } from 'react';
import {
  Plus,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Search,
  Calendar,
  Sparkles,
  Trash2,
  Edit,
  ArrowRight,
  PackageCheck,
  Package,
  Printer,
  MessageCircle,
  Truck,
  Layers,
  AlertCircle,
  Check,
  UserCheck,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  Square,
  ChevronRight,
  Eye,
  Store,
  X,
} from 'lucide-react';
import { PurchaseItem, User, StoreSettings, PurchaseStatusConferencia } from '../types';
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
  onBatchAddPurchases?: (newItems: PurchaseItem[]) => void;
}

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
    proprietario: 'Beto',
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
  const [reposicaoSubFilter, setReposicaoSubFilter] = useState<'falta_repor' | 'reposto' | 'todos'>('falta_repor');

  // Active checker for Conference tab (Lucas or Rafael)
  const [activeChecker, setActiveChecker] = useState<'Lucas' | 'Rafael'>(
    currentUser.nome.includes('Rafael') ? 'Rafael' : 'Lucas'
  );

  // Modals for AI, WhatsApp and Printing
  const [isAiImportModalOpen, setIsAiImportModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Modal to record custom conference details (difference reason)
  const [editingConferenceItem, setEditingConferenceItem] = useState<PurchaseItem | null>(null);
  const [confRecebidaInput, setConfRecebidaInput] = useState('');
  const [confDivergenciaInput, setConfDivergenciaInput] = useState('');

  // Reposicao detail modal
  const [editingReposicaoItem, setEditingReposicaoItem] = useState<PurchaseItem | null>(null);
  const [reposicaoObsInput, setReposicaoObsInput] = useState('');

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

  // General counts
  const totalPurchases = purchases.length;
  const aguardandoChegadaCount = purchases.filter((p) => !p.mercadoriaRecebida).length;
  const recebidosNaLojaCount = purchases.filter((p) => p.mercadoriaRecebida).length;
  const faltaReporCount = purchases.filter((p) => p.mercadoriaRecebida && !p.reposicaoConcluida).length;
  const reposicaoConcluidaCount = purchases.filter((p) => p.reposicaoConcluida).length;

  // Filtered items based on active subtab, supplier, search
  const filteredItems = useMemo(() => {
    return purchases.filter((item) => {
      // Sub-tab filtering
      if (activeSubTab === 'compras') {
        // Show items in the purchase phase or all
      } else if (activeSubTab === 'conferencia') {
        // Items to check / compare
      } else if (activeSubTab === 'reposicao') {
        // Only items that have arrived in store
        if (!item.mercadoriaRecebida) return false;
        if (reposicaoSubFilter === 'falta_repor' && item.reposicaoConcluida) return false;
        if (reposicaoSubFilter === 'reposto' && !item.reposicaoConcluida) return false;
      }

      // Supplier filter
      if (supplierFilter !== 'todos' && item.fornecedor?.trim() !== supplierFilter) {
        return false;
      }

      // Text Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesProduct = item.produto.toLowerCase().includes(q);
        const matchesSupplier = item.fornecedor?.toLowerCase().includes(q);
        const matchesSol = item.solicitadoPorNome.toLowerCase().includes(q);
        const matchesChecker = item.conferidoPorNome?.toLowerCase().includes(q);
        const matchesObs = item.observacao?.toLowerCase().includes(q);
        if (!matchesProduct && !matchesSupplier && !matchesSol && !matchesChecker && !matchesObs) {
          return false;
        }
      }

      return true;
    });
  }, [purchases, activeSubTab, supplierFilter, search, reposicaoSubFilter]);

  // Update a single purchase item
  const updateItem = (updated: PurchaseItem) => {
    if (onUpdatePurchase) {
      onUpdatePurchase(updated);
    } else if (onSavePurchases) {
      const next = purchases.map((p) => (p.id === updated.id ? updated : p));
      onSavePurchases(next);
    }
  };

  // Fast Conference: "Chegou Tudo Conforme o Pedido"
  const handleQuickReceiveAll = () => {
    const updated = purchases.map((p) => {
      if (!p.mercadoriaRecebida) {
        return {
          ...p,
          mercadoriaRecebida: true,
          quantidadeRecebida: p.quantidadePedida || '10 cx',
          statusConferencia: 'Entregue Completo' as PurchaseStatusConferencia,
          conferidoPorNome: activeChecker,
          conferidoPorId: activeChecker === 'Lucas' ? 'USR-04' : 'USR-05',
          dataConferencia: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString(),
        };
      }
      return p;
    });

    if (onSavePurchases) {
      onSavePurchases(updated);
    }
  };

  // Fast Single Item Receive: "Chegou Tudo"
  const handleQuickReceiveItem = (item: PurchaseItem) => {
    const isLucas = activeChecker === 'Lucas';
    const updated: PurchaseItem = {
      ...item,
      mercadoriaRecebida: true,
      quantidadeRecebida: item.quantidadePedida || '10 cx',
      statusConferencia: 'Entregue Completo',
      conferidoPorNome: activeChecker,
      conferidoPorId: isLucas ? 'USR-04' : 'USR-05',
      dataConferencia: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
    };
    updateItem(updated);
  };

  // Save Detailed Conference Modal
  const handleSaveDetailedConference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConferenceItem) return;

    const fullPedida = editingConferenceItem.quantidadePedida || '';
    const recebida = confRecebidaInput.trim() || fullPedida;

    let status: PurchaseStatusConferencia = 'Entregue Completo';
    if (recebida === '0' || recebida.toLowerCase().includes('nada')) {
      status = 'Pendente';
    } else if (recebida !== fullPedida) {
      status = 'Entrega Parcial / Falta';
    }

    const isLucas = activeChecker === 'Lucas';
    const updated: PurchaseItem = {
      ...editingConferenceItem,
      mercadoriaRecebida: status !== 'Pendente',
      quantidadeRecebida: recebida,
      statusConferencia: status,
      conferidoPorNome: activeChecker,
      conferidoPorId: isLucas ? 'USR-04' : 'USR-05',
      dataConferencia: new Date().toISOString(),
      motivoDivergencia: confDivergenciaInput.trim() || undefined,
      dataAtualizacao: new Date().toISOString(),
    };

    updateItem(updated);
    setEditingConferenceItem(null);
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
    <div className="space-y-6">
      {/* Top Banner Informativo & Ações Rápidas */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl text-white p-6 shadow-md border border-emerald-700/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4" />
              <span>Setor de Compras, Conferência &amp; Reposição</span>
              <span className="bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                Fluxo Chão de Loja
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Compras (Charles &amp; Amanda) ➔ Recebimento (Lucas &amp; Rafael) ➔ Reposição
            </h2>
            <p className="text-xs text-emerald-100/90 max-w-2xl leading-relaxed">
              Faça a lista de compras no app, imprima ou envie por WhatsApp. No dia seguinte, confira o que foi pedido com o que chegou na loja e acompanhe a sobra de produtos que falta repor na banca.
            </p>
          </div>

          {/* Action Buttons for Charles & Amanda */}
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
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
              title="Imprimir lista de compras ou planilha de conferência para prancheta"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Lista</span>
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
            Tabela comparativa: o que pediu vs o que chegou
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

      {/* Control Bar: Busca e Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
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

          {supplierFilter !== 'todos' && (
            <button
              onClick={() => setSupplierFilter('todos')}
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

      {/* ======================= ABA 1: LISTA DE COMPRAS (CHARLES & AMANDA) ======================= */}
      {activeSubTab === 'compras' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
            <div>
              <h3 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-700" />
                Lista de Compras — Charles &amp; Amanda
              </h3>
              <p className="text-xs text-emerald-800">
                Itens lançados com Nome, Quantidade e Fornecedor prontos para cotação e envio
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
                onClick={() => setIsPrintModalOpen(true)}
                className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
              <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium">Nenhum pedido de compra encontrado para os filtros.</p>
              <button
                onClick={onAddPurchase}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Lançar Novo Pedido de Compra
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
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
                      <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md font-mono">
                        Qtd: {item.quantidadePedida || '10 cx'}
                      </span>
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

                  {/* Actions for Purchase List */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        item.mercadoriaRecebida
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.mercadoriaRecebida ? '✓ Na Loja' : 'Aguardando Chegada'}
                    </span>

                    <button
                      onClick={() => onEditPurchase(item)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => onDeletePurchase(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================= ABA 2: CONFERÊNCIA DE RECEBIMENTO (LUCAS & RAFAEL) ======================= */}
      {activeSubTab === 'conferencia' && (
        <div className="space-y-4">
          {/* Top Checker Selector & Bulk Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5 text-emerald-800" />
                </div>
                <h3 className="font-black text-sm text-slate-900">
                  Tabela Comparativa: O Que Foi Pedido vs O Que Chegou na Loja
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Conferência física feita por Lucas ou Rafael no descarregamento das mercadorias
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Checker Switcher (Large touch buttons) */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <span className="text-[11px] font-bold text-slate-600 px-1">Conferente:</span>
                <button
                  type="button"
                  onClick={() => setActiveChecker('Lucas')}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeChecker === 'Lucas'
                      ? 'bg-[#0a3821] text-white shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Lucas
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChecker('Rafael')}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeChecker === 'Rafael'
                      ? 'bg-[#0a3821] text-white shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Rafael
                </button>
              </div>

              {aguardandoChegadaCount > 0 && (
                <button
                  onClick={handleQuickReceiveAll}
                  className="min-h-[44px] px-4 py-2 bg-[#0a3821] hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs active:scale-[0.98] cursor-pointer"
                  title="Marcar todos os itens pendentes como entregues 100% conforme o pedido"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Chegou Tudo Conforme Pedido</span>
                </button>
              )}
            </div>
          </div>

          {/* Banner de Uso Duplo da Folha Física Impressa */}
          <div className="bg-emerald-50/90 border border-emerald-200 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0">
                <Printer className="w-4 h-4 text-emerald-200" />
              </div>
              <div>
                <span className="font-black text-emerald-950 text-xs sm:text-sm block">
                  Conferência Física com o Mesmo Papel Impresso da Kombi:
                </span>
                <span className="text-emerald-900 text-[11px] leading-tight block mt-0.5">
                  Charles levou a folha ao Ceasa e {activeChecker} confere o descarregamento no mesmo impresso antes de registrar no app.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="min-h-[38px] px-3.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Visualizar ou reimprimir a planilha de prancheta A4 de uso duplo"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-700" />
                <span>Reimprimir Prancheta A4</span>
              </button>
              {aguardandoChegadaCount > 0 && (
                <button
                  type="button"
                  onClick={handleQuickReceiveAll}
                  className="min-h-[38px] px-3.5 bg-[#0a3821] hover:bg-emerald-800 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Dar baixa completa em todos os itens conforme conferido no papel impresso"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>✓ Tudo Conforme o Impresso</span>
                </button>
              )}
            </div>
          </div>

          {/* DEDICATED MOBILE CARDS VIEW (block md:hidden) - Zero horizontal scroll, big thumb touch targets */}
          <div className="block md:hidden space-y-3">
            {filteredItems.map((item) => {
              const status = item.statusConferencia || (item.mercadoriaRecebida ? 'Entregue Completo' : 'Pendente');

              return (
                <div key={item.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
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

                    {status === 'Entrega Parcial / Falta' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                        ⚠ Entrega Parcial
                      </span>
                    ) : item.mercadoriaRecebida ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 shrink-0">
                        ✓ Entregue
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 shrink-0">
                        Pendente
                      </span>
                    )}
                  </div>

                  {/* Quantities comparison */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-0.5">O que pediu:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">{item.quantidadePedida || '10 cx'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-0.5">O que chegou na loja:</span>
                      {item.mercadoriaRecebida ? (
                        <span className="font-mono font-bold text-emerald-800 text-sm">
                          {item.quantidadeRecebida || item.quantidadePedida || '10 cx'}
                        </span>
                      ) : (
                        <span className="font-bold text-rose-600 text-sm italic">Aguardando entrega</span>
                      )}
                    </div>
                  </div>

                  {item.motivoDivergencia && (
                    <p className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      <strong>Motivo da divergência:</strong> {item.motivoDivergencia}
                    </p>
                  )}

                  {item.conferidoPorNome && (
                    <p className="text-xs text-slate-600">
                      Conferido por: <strong className="text-emerald-900 font-bold">{item.conferidoPorNome}</strong>
                    </p>
                  )}

                  {/* Large Full-Width Action Buttons (>= 48px) */}
                  <div className="flex items-center gap-2 pt-1">
                    {!item.mercadoriaRecebida ? (
                      <button
                        onClick={() => handleQuickReceiveItem(item)}
                        className="flex-1 min-h-[48px] bg-[#0a3821] hover:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.98] shadow-xs cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>✓ Chegou Tudo ({activeChecker})</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onToggleRecebida(item.id, true)}
                        className="flex-1 min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Reverter Recebimento
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setEditingConferenceItem(item);
                        setConfRecebidaInput(item.quantidadeRecebida || item.quantidadePedida || '10 cx');
                        setConfDivergenciaInput(item.motivoDivergencia || '');
                      }}
                      className="min-h-[48px] px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      title="Anotar quantidade diferente ou divergência"
                    >
                      <Edit className="w-4 h-4 text-slate-600" />
                      <span>Falta / Sobra</span>
                    </button>
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
                    <th className="p-3">Produto &amp; Categoria</th>
                    <th className="p-3">Fornecedor</th>
                    <th className="p-3 text-center">O Que Foi Pedido</th>
                    <th className="p-3 text-center bg-emerald-50/50">O Que Chegou na Loja</th>
                    <th className="p-3 text-center">Status / Divergência</th>
                    <th className="p-3 text-center">Conferido Por</th>
                    <th className="p-3 text-right">Ação Rápida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const status = item.statusConferencia || (item.mercadoriaRecebida ? 'Entregue Completo' : 'Pendente');

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        {/* Produto */}
                        <td className="p-3">
                          <span className="font-bold text-slate-900 text-xs block">{item.produto}</span>
                          <span className="text-[10px] text-slate-500">
                            Pedente por: {item.solicitadoPorNome} • {item.categoria || 'Geral'}
                          </span>
                        </td>

                        {/* Fornecedor */}
                        <td className="p-3 font-semibold text-slate-700">
                          {item.fornecedor || 'Ceasa Box 14'}
                        </td>

                        {/* O que foi pedido */}
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-900 font-mono font-bold text-xs">
                            {item.quantidadePedida || '10 cx'}
                          </span>
                        </td>

                        {/* O que chegou na loja */}
                        <td className="p-3 text-center bg-emerald-50/30">
                          {item.mercadoriaRecebida ? (
                            <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-950 font-mono font-bold text-xs border border-emerald-300">
                              {item.quantidadeRecebida || item.quantidadePedida || '10 cx'}
                            </span>
                          ) : (
                            <span className="text-rose-600 font-bold text-xs italic">
                              Não Chegou
                            </span>
                          )}
                        </td>

                        {/* Status / Divergência */}
                        <td className="p-3 text-center">
                          {status === 'Entregue Completo' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ✓ Entregue Completo
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

                        {/* Ações */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!item.mercadoriaRecebida ? (
                              <button
                                onClick={() => handleQuickReceiveItem(item)}
                                className="min-h-[38px] px-3 py-1.5 bg-[#0a3821] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-[0.98] cursor-pointer shadow-2xs"
                                title={`Marcar que chegou tudo conforme pedido conferido por ${activeChecker}`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Chegou Tudo</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => onToggleRecebida(item.id, true)}
                                className="min-h-[38px] px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                                title="Desmarcar recebimento"
                              >
                                Reverter
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setEditingConferenceItem(item);
                                setConfRecebidaInput(item.quantidadeRecebida || item.quantidadePedida || '10 cx');
                                setConfDivergenciaInput(item.motivoDivergencia || '');
                              }}
                              className="p-2 text-slate-500 hover:text-emerald-900 rounded-xl hover:bg-slate-100 cursor-pointer"
                              title="Anotar quantidade diferente ou divergência"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
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

      {/* ======================= ABA 3: ESTOQUE RECEBIDO & REPOSIÇÃO DE BANCA (O QUE FALTA REPOR) ======================= */}
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

          {/* Sub-filtros de Reposição (Large Touch Targets) */}
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
              {/* MOBILE CARDS VIEW (block md:hidden) */}
              <div className="block md:hidden space-y-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      item.reposicaoConcluida
                        ? 'bg-slate-50 border-slate-200 opacity-80'
                        : 'bg-white border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {item.id}
                          </span>
                          <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-md font-mono">
                            Estoque: {item.quantidadeRecebida || item.quantidadePedida || '10 cx'}
                          </span>
                        </div>
                        <h4
                          className={`text-base font-black ${
                            item.reposicaoConcluida ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {item.produto}
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Fornecedor: <strong className="text-slate-800">{item.fornecedor || 'Ceasa Box 14'}</strong>
                        </p>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                          item.reposicaoConcluida ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.reposicaoConcluida ? '✓ Na Banca' : 'Falta Repor'}
                      </span>
                    </div>

                    {item.observacaoReposicao && (
                      <p className="text-xs text-emerald-950 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                        <strong>Sobra / Obs:</strong> {item.observacaoReposicao}
                      </p>
                    )}

                    {/* Full-width touch action button (>= 48px) */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleQuickToggleReposicao(item)}
                        className={`flex-1 min-h-[48px] rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer ${
                          item.reposicaoConcluida
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            : 'bg-[#0a3821] hover:bg-emerald-800 text-white shadow-xs'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>{item.reposicaoConcluida ? '✓ Reposto na Banca (Reverter)' : '✓ Marcar como Reposto na Banca'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingReposicaoItem(item);
                          setReposicaoObsInput(item.observacaoReposicao || '');
                        }}
                        className="min-h-[48px] px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                        title="Anotar sobra de estoque na câmara ou observação"
                      >
                        <Edit className="w-4 h-4 text-slate-600" />
                        <span>Sobra</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP ROW VIEW (hidden md:block) */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                      item.reposicaoConcluida ? 'bg-slate-50/50' : 'bg-white hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {item.id}
                        </span>
                        <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-md font-mono">
                          Qtd em Estoque: {item.quantidadeRecebida || item.quantidadePedida || '10 cx'}
                        </span>
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

                    {/* Checklist Button: Reposto na Banca */}
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => handleQuickToggleReposicao(item)}
                        className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 active:scale-[0.98] transition-all cursor-pointer ${
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
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                        title="Anotar sobra de estoque na câmara ou observação"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= MODAL: ANOTAR DIVERGÊNCIA DE CONFERÊNCIA ======================= */}
      {editingConferenceItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                Registrar Conferência de Chegada
              </h3>
              <button
                onClick={() => setEditingConferenceItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDetailedConference} className="mt-4 space-y-3.5 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Produto:</span>
                <span className="text-sm font-black text-slate-900">{editingConferenceItem.produto}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block font-semibold">Qtd Pedida:</span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {editingConferenceItem.quantidadePedida || '10 cx'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold">Fornecedor:</span>
                  <span className="text-xs font-bold text-slate-800">
                    {editingConferenceItem.fornecedor || 'Ceasa Box 14'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Quantidade Realmente Recebida na Loja *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 8 cx (se faltaram 2), 12 cx (se veio a mais)"
                  value={confRecebidaInput}
                  onChange={(e) => setConfRecebidaInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Motivo da Divergência / Observação de Avaria (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Faltaram 2 caixas no caminhão, 1 caixa machucada devolvida"
                  value={confDivergenciaInput}
                  onChange={(e) => setConfDivergenciaInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingConferenceItem(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Salvar Conferência ({activeChecker})
                </button>
              </div>
            </form>
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
                  {editingReposicaoItem.quantidadeRecebida || editingReposicaoItem.quantidadePedida || '10 cx'}
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
        onConfirmImport={(newItems, openPrint) => {
          if (onBatchAddPurchases) {
            onBatchAddPurchases(newItems);
          } else if (onSavePurchases) {
            onSavePurchases([...newItems, ...purchases]);
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
      />
    </div>
  );
};
