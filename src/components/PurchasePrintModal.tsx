import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  FileText,
  Filter,
  CheckCircle2,
  Calendar,
  UserCheck,
  ShoppingBag,
} from 'lucide-react';
import { PurchaseItem, StoreSettings, User } from '../types';

interface PurchasePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchases: PurchaseItem[];
  settings: StoreSettings;
  currentUser: User;
}

export const PurchasePrintModal: React.FC<PurchasePrintModalProps> = ({
  isOpen,
  onClose,
  purchases,
  settings,
  currentUser,
}) => {
  const [selectedSupplier, setSelectedSupplier] = useState<string>('todos');
  const [printType, setPrintType] = useState<'compra' | 'conferencia'>('compra');

  const suppliers = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p) => {
      if (p.fornecedor && p.fornecedor.trim()) {
        set.add(p.fornecedor.trim());
      }
    });
    return Array.from(set).sort();
  }, [purchases]);

  const targetItems = useMemo(() => {
    return purchases.filter((item) => {
      if (selectedSupplier === 'todos') return true;
      return item.fornecedor?.trim() === selectedSupplier;
    });
  }, [purchases, selectedSupplier]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300">
        {/* Topbar (No Print) */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-t-3xl no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Imprimir Lista de Compras &amp; Espelho de Conferência
              </h2>
              <p className="text-xs text-slate-500">
                Formato A4 padronizado para compras no Ceasa, fornecedores ou prancheta de recebimento
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Gerar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Controls Bar (No Print) */}
        <div className="px-5 py-3 bg-emerald-50/60 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Modelo:</span>
              <div className="flex items-center bg-white rounded-lg border border-slate-300 p-0.5">
                <button
                  type="button"
                  onClick={() => setPrintType('compra')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    printType === 'compra'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ordem de Compra / Cotação
                </button>
                <button
                  type="button"
                  onClick={() => setPrintType('conferencia')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    printType === 'conferencia'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Planilha de Conferência (Lucas &amp; Rafael)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Filtrar Fornecedor:</span>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
              >
                <option value="todos">Todos ({purchases.length} itens)</option>
                {suppliers.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-slate-600 font-semibold text-[11px]">
            {targetItems.length} {targetItems.length === 1 ? 'item listado' : 'itens listados'}
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-2 print:overflow-visible">
          {/* Header of the Sheet */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  {settings.nomeLoja} — HORTIFRÚTI &amp; DISTRIBUIÇÃO
                </h1>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  {printType === 'compra'
                    ? 'ORDEM DE COMPRA DIÁRIA & COTAÇÃO DE FORNECEDORES'
                    : 'PLANILHA DE CONFERÊNCIA DE RECEBIMENTO & REPOSIÇÃO DE BANCA'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Data: <strong className="text-slate-800">{todayFormatted}</strong> • Solicitantes: Charles &amp; Amanda
                </p>
              </div>

              <div className="text-right text-xs">
                <div className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-slate-800">
                  {selectedSupplier === 'todos' ? 'TODOS OS FORNECEDORES' : selectedSupplier.toUpperCase()}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Gerente: {settings.gerenteResponsavel} • Visto: ____________
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-black uppercase text-[10px] tracking-wider">
                  <th className="p-2 border-r border-slate-300 w-8 text-center">#</th>
                  <th className="p-2 border-r border-slate-300">Produto</th>
                  <th className="p-2 border-r border-slate-300 w-28">Fornecedor</th>
                  <th className="p-2 border-r border-slate-300 w-24 text-center">Qtd Pedida</th>
                  {printType === 'conferencia' ? (
                    <>
                      <th className="p-2 border-r border-slate-300 w-24 text-center bg-amber-50">Qtd Recebida</th>
                      <th className="p-2 border-r border-slate-300 w-28 text-center">Conferente</th>
                      <th className="p-2 w-28 text-center bg-emerald-50">Reposto Banca</th>
                    </>
                  ) : (
                    <>
                      <th className="p-2 border-r border-slate-300 w-24 text-center">Preço / Cx</th>
                      <th className="p-2 w-40">Observações de Compra</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {targetItems.length === 0 ? (
                  <tr>
                    <td colSpan={printType === 'conferencia' ? 7 : 6} className="p-6 text-center text-slate-400">
                      Nenhum item encontrado para esta seleção.
                    </td>
                  </tr>
                ) : (
                  targetItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-slate-500">
                        {index + 1}
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <span className="font-bold text-slate-900 block">{item.produto}</span>
                        {item.categoria && (
                          <span className="text-[10px] text-slate-500">{item.categoria}</span>
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-semibold text-slate-700">
                        {item.fornecedor || 'Ceasa Box 14'}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-slate-900">
                        {item.quantidadePedida || '1 un'}
                      </td>
                      {printType === 'conferencia' ? (
                        <>
                          <td className="p-2 border-r border-slate-200 text-center font-mono bg-amber-50/40">
                            {item.quantidadeRecebida || '[ _________ ]'}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center text-[11px]">
                            {item.conferidoPorNome ? (
                              <span className="font-bold text-emerald-800">
                                ✓ {item.conferidoPorNome}
                              </span>
                            ) : (
                              <span className="text-slate-400">[ Lucas / Rafael ]</span>
                            )}
                          </td>
                          <td className="p-2 text-center text-[11px] bg-emerald-50/30">
                            {item.reposicaoConcluida ? (
                              <span className="font-bold text-emerald-800">✓ Reposto</span>
                            ) : item.mercadoriaRecebida ? (
                              <span className="font-bold text-amber-700">Falta Repor</span>
                            ) : (
                              <span className="text-slate-400">[ ] Repor</span>
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-400">
                            R$ ________
                          </td>
                          <td className="p-2 text-slate-600 text-[11px]">
                            {item.observacao || '—'}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer of the Sheet */}
          <div className="mt-6 pt-4 border-t border-slate-300 text-xs text-slate-600 flex justify-between items-end">
            <div>
              <p className="font-bold text-slate-900">Instruções para a Operação:</p>
              <p className="text-[11px] text-slate-500">
                1. Charles e Amanda fecham a lista de compra até as 18h.<br />
                2. No recebimento matinal, Lucas ou Rafael conferem conferindo quantidade física e peso.<br />
                3. Concluída a conferência, os produtos chegam ao estoque e são imediatamente abastecidos na banca.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono">Assinatura Recebimento: ___________________________</p>
              <p className="text-[10px] text-slate-400 mt-1">Conferido por Lucas / Rafael</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
