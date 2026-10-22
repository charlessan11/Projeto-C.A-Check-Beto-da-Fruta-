import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Check,
  Sparkles,
  PackageCheck,
  UserCheck,
  Truck,
  ArrowRight,
} from 'lucide-react';
import { PurchaseItem, User } from '../types';
import { getTodayDateString } from '../services/storage';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<PurchaseItem>) => void;
  itemToEdit?: PurchaseItem | null;
  currentUser: User;
}

const COMMON_PRODUCTS = [
  'Banana Prata Especial',
  'Tomate Italiano Comercial',
  'Batata Inglesa Lavada',
  'Cebola Amarela Nacional',
  'Abacaxi Pérola para Produção',
  'Melancia Graúda',
  'Maçã Gala Nacional',
  'Mamão Papaya',
  'Alface Americana Hidropônica',
  'Morango Especial Bandeja',
  'Cenoura Especial',
  'Manga Palmer',
  'Filme PVC Alimentício 400m',
  'Gelo em Cubos 5kg',
];

const COMMON_SUPPLIERS = [
  'Ceasa Box 14',
  'Ceasa Box 32',
  'Distribuidora Frutix',
  'Sítio Primavera',
  'Distribuidora Central Horti',
  'Produtor João',
  'Distribuidora de Embalagens',
];

const COMMON_UNITS = ['cx', 'kg', 'un', 'sacos', 'fardos', 'maços', 'bandejas', 'pct', 'rolos'];

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  itemToEdit,
  currentUser,
}) => {
  const [produto, setProduto] = useState('');
  const [qtdValor, setQtdValor] = useState('10');
  const [qtdUnidade, setQtdUnidade] = useState('cx');
  const [fornecedor, setFornecedor] = useState('Ceasa Box 14');
  const [categoria, setCategoria] = useState('Frutas');
  const [solicitanteNome, setSolicitanteNome] = useState('Charles');
  const [data, setData] = useState(getTodayDateString());
  const [observacao, setObservacao] = useState('');

  // Conference & Restocking fields (available during edit)
  const [mercadoriaRecebida, setMercadoriaRecebida] = useState(false);
  const [quantidadeRecebida, setQuantidadeRecebida] = useState('');
  const [conferidoPorNome, setConferidoPorNome] = useState<'Lucas' | 'Rafael'>('Lucas');
  const [reposicaoConcluida, setReposicaoConcluida] = useState(false);
  const [observacaoReposicao, setObservacaoReposicao] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setProduto(itemToEdit.produto);
      setData(itemToEdit.data);
      setFornecedor(itemToEdit.fornecedor || 'Ceasa Box 14');
      setCategoria(itemToEdit.categoria || 'Frutas');
      setSolicitanteNome(itemToEdit.solicitadoPorNome || 'Charles');
      setObservacao(itemToEdit.observacao || '');

      // Parse quantity
      if (itemToEdit.quantidadePedida) {
        const parts = itemToEdit.quantidadePedida.trim().split(' ');
        if (parts.length >= 2 && !isNaN(Number(parts[0]))) {
          setQtdValor(parts[0]);
          setQtdUnidade(parts.slice(1).join(' '));
        } else {
          setQtdValor(itemToEdit.quantidadePedida);
        }
      }

      setMercadoriaRecebida(itemToEdit.mercadoriaRecebida || false);
      setQuantidadeRecebida(itemToEdit.quantidadeRecebida || '');
      setConferidoPorNome(
        itemToEdit.conferidoPorNome === 'Rafael' ? 'Rafael' : 'Lucas'
      );
      setReposicaoConcluida(itemToEdit.reposicaoConcluida || false);
      setObservacaoReposicao(itemToEdit.observacaoReposicao || '');
    } else {
      setProduto('');
      setData(getTodayDateString());
      setQtdValor('10');
      setQtdUnidade('cx');
      setFornecedor('Ceasa Box 14');
      setCategoria('Frutas');
      // Default solicitante to current user if Charles or Amanda, else Charles
      const defaultSol =
        currentUser.nome.includes('Amanda') ? 'Amanda' : 'Charles';
      setSolicitanteNome(defaultSol);
      setObservacao('');
      setMercadoriaRecebida(false);
      setQuantidadeRecebida('');
      setConferidoPorNome('Lucas');
      setReposicaoConcluida(false);
      setObservacaoReposicao('');
    }
  }, [itemToEdit, isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produto.trim()) return;

    const fullQtd = `${qtdValor.trim()} ${qtdUnidade.trim()}`.trim();
    const isLucas = conferidoPorNome === 'Lucas';

    onSave({
      id: itemToEdit ? itemToEdit.id : `ITEM-${Date.now().toString(36).toUpperCase()}`,
      data,
      produto: produto.trim(),
      quantidadePedida: fullQtd,
      fornecedor: fornecedor.trim(),
      categoria,
      solicitadoPorNome: solicitanteNome,
      solicitadoPorId: solicitanteNome === 'Amanda' ? 'USR-02' : 'USR-01',
      observacao: observacao.trim() || undefined,
      mercadoriaRecebida,
      quantidadeRecebida: mercadoriaRecebida
        ? quantidadeRecebida.trim() || fullQtd
        : undefined,
      statusConferencia: mercadoriaRecebida
        ? (quantidadeRecebida.trim() && quantidadeRecebida.trim() !== fullQtd
            ? 'Entrega Parcial / Falta'
            : 'Entregue Completo')
        : 'Pendente',
      conferidoPorNome: mercadoriaRecebida ? conferidoPorNome : undefined,
      conferidoPorId: mercadoriaRecebida ? (isLucas ? 'USR-04' : 'USR-05') : undefined,
      dataConferencia: mercadoriaRecebida
        ? itemToEdit?.dataConferencia || new Date().toISOString()
        : undefined,
      reposicaoConcluida,
      observacaoReposicao: observacaoReposicao.trim() || undefined,
      dataAtualizacao: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {itemToEdit ? 'Editar Pedido de Compra' : 'Novo Pedido de Compra (Charles & Amanda)'}
              </h2>
              <p className="text-xs text-slate-500">
                Lançamento no app com Nome, Quantidade e Fornecedor
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Solicitante: Charles ou Amanda */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Solicitante do Pedido:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSolicitanteNome('Charles')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  solicitanteNome === 'Charles'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Charles (Gerente)
              </button>
              <button
                type="button"
                onClick={() => setSolicitanteNome('Amanda')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  solicitanteNome === 'Amanda'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Amanda (Adm)
              </button>
            </div>
          </div>

          {/* Nome do Produto */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Nome do Produto *
              </label>
              <span className="text-[10px] text-slate-400">Sugestões rápidas abaixo</span>
            </div>
            <input
              type="text"
              required
              placeholder="Ex: Tomate Italiano, Banana Prata, Maçã Gala..."
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {/* Quick Chips for Common Products */}
            <div className="mt-1.5 flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {COMMON_PRODUCTS.slice(0, 8).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProduto(p)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-[10px] font-medium text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Quantidade e Unidade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Quantidade *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 10, 50, 25"
                value={qtdValor}
                onChange={(e) => setQtdValor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Unidade / Embalagem *
              </label>
              <select
                value={qtdUnidade}
                onChange={(e) => setQtdUnidade(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fornecedor */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Fornecedor / Produtor / Box *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Ceasa Box 14, Distribuidora Frutix, Sítio Primavera..."
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {/* Quick Supplier Chips */}
            <div className="mt-1.5 flex flex-wrap gap-1">
              {COMMON_SUPPLIERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFornecedor(s)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors cursor-pointer ${
                    fornecedor === s
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Categoria & Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Categoria:
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Frutas">Frutas</option>
                <option value="Legumes">Legumes</option>
                <option value="Verduras">Verduras</option>
                <option value="Folhagens">Folhagens</option>
                <option value="Produção / Grab & Go">Produção / Grab & Go</option>
                <option value="Embalagens">Embalagens</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Data do Pedido:
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Observações / Especificação (Opcional):
            </label>
            <input
              type="text"
              placeholder="Ex: Fruto de primeira linha, calibre 18, entregar até 07h30..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Se estiver editando, permite registrar conferência rápida */}
          {itemToEdit && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Conferência de Chegada & Reposição (Lucas & Rafael):</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={mercadoriaRecebida}
                    onChange={(e) => setMercadoriaRecebida(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">Chegou na Loja</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={reposicaoConcluida}
                    onChange={(e) => setReposicaoConcluida(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">Reposto na Banca</span>
                </label>
              </div>

              {mercadoriaRecebida && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-600 font-bold block mb-1">
                      Qtd Recebida:
                    </span>
                    <input
                      type="text"
                      placeholder="Ex: 10 cx"
                      value={quantidadeRecebida}
                      onChange={(e) => setQuantidadeRecebida(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 font-bold block mb-1">
                      Conferente:
                    </span>
                    <select
                      value={conferidoPorNome}
                      onChange={(e) => setConferidoPorNome(e.target.value as any)}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    >
                      <option value="Lucas">Lucas</option>
                      <option value="Rafael">Rafael</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit buttons */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Pedido</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
