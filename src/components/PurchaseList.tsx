import React, { useState, useMemo } from 'react';
import {
  Plus,
  ShoppingBag,
  CheckCircle2,
  Clock,
  CheckSquare,
  Square,
  Search,
  Calendar,
  Sparkles,
  Trash2,
  Edit,
  ArrowRight,
  PackageCheck,
  Package,
} from 'lucide-react';
import { PurchaseItem, User } from '../types';

interface PurchaseListProps {
  purchases: PurchaseItem[];
  currentUser: User;
  onAddPurchase: () => void;
  onEditPurchase: (item: PurchaseItem) => void;
  onDeletePurchase: (itemId: string) => void;
  onToggleRecebida: (itemId: string, currentState: boolean) => void;
  onToggleReposicao: (itemId: string, currentState: boolean) => void;
}

export const PurchaseList: React.FC<PurchaseListProps> = ({
  purchases,
  currentUser,
  onAddPurchase,
  onEditPurchase,
  onDeletePurchase,
  onToggleRecebida,
  onToggleReposicao,
}) => {
  const isAdmin = currentUser.perfil === 'Administrador';
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState<'todos' | 'pendente_chegada' | 'aguardando_banca' | 'concluido'>('todos');

  const filteredItems = useMemo(() => {
    return purchases.filter((item) => {
      if (filterStage === 'pendente_chegada' && item.mercadoriaRecebida) return false;
      if (filterStage === 'aguardando_banca' && (!item.mercadoriaRecebida || item.reposicaoConcluida)) return false;
      if (filterStage === 'concluido' && !item.reposicaoConcluida) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesProduct = item.produto.toLowerCase().includes(q);
        const matchesSolicitante = item.solicitadoPorNome.toLowerCase().includes(q);
        const matchesObs = item.observacao?.toLowerCase().includes(q);
        if (!matchesProduct && !matchesSolicitante && !matchesObs) return false;
      }

      return true;
    });
  }, [purchases, filterStage, search]);

  const pendentesChegadaCount = purchases.filter((p) => !p.mercadoriaRecebida).length;
  const aguardandoBancaCount = purchases.filter((p) => p.mercadoriaRecebida && !p.reposicaoConcluida).length;
  const concluidasCount = purchases.filter((p) => p.reposicaoConcluida).length;

  return (
    <div className="space-y-6">
      {/* Banner Informativo */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl text-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4" />
              Módulo de Compras &amp; Reposição (Simplificado)
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1 text-white tracking-tight">
              Lista de Necessidades &amp; Checklist Direto
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
              Desenenhado para agilidade no chão de loja: anote o produto em falta e acompanhe a chegada na loja e a ida pra banca com apenas dois cliques.
            </p>
          </div>

          <button
            onClick={onAddPurchase}
            className="px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-950 font-bold rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-emerald-700" />
            <span>Anotar Falta na Banca</span>
          </button>
        </div>
      </div>

      {/* Pipeline Direto Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setFilterStage('pendente_chegada')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStage === 'pendente_chegada'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-rose-600" />
            1. Aguardando Chegada na Loja
          </div>
          <div className="text-2xl font-black text-rose-950 mt-1">{pendentesChegadaCount}</div>
          <div className="text-[11px] text-slate-500">Produtos para comprar/receber</div>
        </button>

        <button
          onClick={() => setFilterStage('aguardando_banca')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStage === 'aguardando_banca'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600" />
            2. Chegou! Falta Repor na Banca
          </div>
          <div className="text-2xl font-black text-amber-950 mt-1">{aguardandoBancaCount}</div>
          <div className="text-[11px] text-slate-500">Na loja aguardando ir pra banca</div>
        </button>

        <button
          onClick={() => setFilterStage('concluido')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStage === 'concluido'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            3. Reposição Concluída
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-1">{concluidasCount}</div>
          <div className="text-[11px] text-slate-500">Banca abastecida / Estoque guardado</div>
        </button>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar produto ou quem anotou a falta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {filterStage !== 'todos' && (
            <button
              onClick={() => setFilterStage('todos')}
              className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
            >
              Ver Todos ({purchases.length})
            </button>
          )}

          <button
            onClick={onAddPurchase}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Adicionar Produto</span>
          </button>
        </div>
      </div>

      {/* Checklist Table (Tabela 3) */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
          <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium">Nenhum produto em falta registrado no momento.</p>
          <button
            onClick={onAddPurchase}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Lançar Falta na Banca
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
          {filteredItems.map((item) => {
            const isCompleted = item.mercadoriaRecebida && item.reposicaoConcluida;

            return (
              <div
                key={item.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  isCompleted ? 'bg-slate-50/60' : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {item.id}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.data}
                    </span>
                    <span className="text-xs text-slate-500">
                      • Por: <strong className="text-slate-700">{item.solicitadoPorNome}</strong>
                    </span>
                  </div>

                  <h3
                    className={`text-base font-bold text-slate-900 ${
                      isCompleted ? 'line-through text-slate-400' : ''
                    }`}
                  >
                    {item.produto}
                  </h3>

                  {item.observacao && (
                    <p className="text-xs text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 max-w-xl">
                      {item.observacao}
                    </p>
                  )}
                </div>

                {/* Direct Action Checklist: Checkbox a & Checkbox b (Section 3) */}
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap shrink-0">
                  {/* a. Mercadoria Recebida */}
                  <label
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-xs font-bold ${
                      item.mercadoriaRecebida
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.mercadoriaRecebida}
                      onChange={() => onToggleRecebida(item.id, item.mercadoriaRecebida)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span>a. Chegou na Loja</span>
                  </label>

                  {/* b. Reposição Concluída */}
                  <label
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-xs font-bold ${
                      item.reposicaoConcluida
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                        : item.mercadoriaRecebida
                        ? 'bg-amber-50 text-amber-900 border-amber-300 hover:border-amber-400'
                        : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.reposicaoConcluida}
                      onChange={() => onToggleReposicao(item.id, item.reposicaoConcluida)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span>b. Reposto na Banca</span>
                  </label>

                  {/* Actions for Admin / Edit */}
                  <div className="flex items-center border-l border-slate-200 pl-2">
                    <button
                      onClick={() => onEditPurchase(item)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                      title="Editar"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => onDeletePurchase(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
