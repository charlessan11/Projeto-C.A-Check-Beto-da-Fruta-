import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, CheckSquare, Square, Check, Sparkles } from 'lucide-react';
import { PurchaseItem, User } from '../types';
import { getTodayDateString } from '../services/storage';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<PurchaseItem>) => void;
  itemToEdit?: PurchaseItem | null;
  currentUser: User;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  itemToEdit,
  currentUser,
}) => {
  const [produto, setProduto] = useState('');
  const [data, setData] = useState(getTodayDateString());
  const [mercadoriaRecebida, setMercadoriaRecebida] = useState(false);
  const [reposicaoConcluida, setReposicaoConcluida] = useState(false);
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setProduto(itemToEdit.produto);
      setData(itemToEdit.data);
      setMercadoriaRecebida(itemToEdit.mercadoriaRecebida);
      setReposicaoConcluida(itemToEdit.reposicaoConcluida);
      setObservacao(itemToEdit.observacao || '');
    } else {
      setProduto('');
      setData(getTodayDateString());
      setMercadoriaRecebida(false);
      setReposicaoConcluida(false);
      setObservacao('');
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produto.trim()) return;

    onSave({
      id: itemToEdit ? itemToEdit.id : `ITEM-${Date.now().toString(36).toUpperCase()}`,
      data,
      produto: produto.trim(),
      mercadoriaRecebida,
      reposicaoConcluida,
      solicitadoPorNome: itemToEdit ? itemToEdit.solicitadoPorNome : currentUser.nome,
      solicitadoPorId: itemToEdit ? itemToEdit.solicitadoPorId : currentUser.id,
      observacao: observacao.trim() || undefined,
      dataAtualizacao: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {itemToEdit ? 'Editar Registro de Reposição' : 'Anotar Falta na Banca (Lista de Compras)'}
              </h2>
              <p className="text-xs text-slate-500">
                Fluxo direto e simplificado do chão de loja • {currentUser.nome}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          {/* Nome do Produto */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Produto em Falta *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Banana Prata Especial, Abacaxi Pérola, Filme PVC, Morango..."
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
            />
          </div>

          {/* Data do Registro */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Data do Registro
            </label>
            <input
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          {/* Checklist Direto de 2 Etapas (Tabela 3) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Fluxo de Ação Direto (Checklist):
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={mercadoriaRecebida}
                onChange={(e) => setMercadoriaRecebida(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 mt-0.5"
              />
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  a. Mercadoria Recebida
                </span>
                <span className="text-[11px] text-slate-500">
                  Marcar quando o produto chegou do fornecedor na loja.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-slate-200">
              <input
                type="checkbox"
                checked={reposicaoConcluida}
                onChange={(e) => {
                  setReposicaoConcluida(e.target.checked);
                  if (e.target.checked) {
                    setMercadoriaRecebida(true);
                  }
                }}
                className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 mt-0.5"
              />
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  b. Reposição Concluída
                </span>
                <span className="text-[11px] text-slate-500">
                  Marcar quando a mercadoria já foi abastecida na banca ou guardada na câmara fria/estoque.
                </span>
              </div>
            </label>
          </div>

          {/* Observação */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Observação / Quantidade Sugerida (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: 5 caixas; acabou tudo na banca matinal..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-700/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{itemToEdit ? 'Atualizar Item' : 'Registrar na Lista'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
