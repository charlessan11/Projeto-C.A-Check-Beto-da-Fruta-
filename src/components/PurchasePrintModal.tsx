import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  Calendar,
  Building,
  Truck,
  ClipboardList,
  UserCheck,
} from 'lucide-react';
import { PurchaseItem, StoreSettings, User } from '../types';

interface PurchasePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchases: PurchaseItem[];
  settings: StoreSettings;
  currentUser: User;
  initialModel?: 'prancheta_dupla' | 'compra' | 'conferencia';
}

export const PurchasePrintModal: React.FC<PurchasePrintModalProps> = ({
  isOpen,
  onClose,
  purchases,
  settings,
  currentUser,
  initialModel = 'prancheta_dupla',
}) => {
  const [selectedSupplier, setSelectedSupplier] = useState<string>('todos');
  const [printType, setPrintType] = useState<'prancheta_dupla' | 'compra' | 'conferencia'>(initialModel);

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
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-300">
        {/* Topbar (No Print) */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-[#0a3821] text-white rounded-t-3xl no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md">
              <Printer className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                Imprimir Planilha de Compra &amp; Conferência (A4 Prancheta)
              </h2>
              <p className="text-xs text-emerald-100">
                Uso Duplo: O comprador leva ao Ceasa e Lucas/Rafael conferem o descarregamento no mesmo impresso
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>🖨 Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Controls Bar (No Print) */}
        <div className="px-5 py-3 bg-emerald-50/70 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Modelo:</span>
              <div className="flex items-center bg-white rounded-xl border border-slate-300 p-0.5">
                <button
                  type="button"
                  onClick={() => setPrintType('prancheta_dupla')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    printType === 'prancheta_dupla'
                      ? 'bg-[#0a3821] text-white shadow-2xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Prancheta A4 (Uso Duplo)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintType('compra')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    printType === 'compra'
                      ? 'bg-[#0a3821] text-white shadow-2xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Apenas Ordem de Compra
                </button>
                <button
                  type="button"
                  onClick={() => setPrintType('conferencia')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    printType === 'conferencia'
                      ? 'bg-[#0a3821] text-white shadow-2xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  Apenas Conferência Loja
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Fornecedor:</span>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
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

          <div className="text-slate-700 font-bold text-xs">
            {targetItems.length} {targetItems.length === 1 ? 'item pronto para impressão' : 'itens prontos para impressão'}
          </div>
        </div>

        {/* Printable Sheet Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-white text-slate-950 font-sans print:p-2 print:overflow-visible">
          {/* Sheet Header */}
          <div className="border-b-2 border-slate-900 pb-3 mb-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black uppercase tracking-tight text-slate-950">
                    {settings.nomeLoja} — HORTIFRÚTI &amp; DISTRIBUIÇÃO
                  </h1>
                </div>
                <h2 className="text-xs font-black uppercase text-slate-900 mt-0.5 tracking-wide">
                  {printType === 'prancheta_dupla'
                    ? 'PLANILHA DE COMPRA (CEASA) & CONFERÊNCIA DE DESCARREGAMENTO NA LOJA'
                    : printType === 'compra'
                    ? 'ORDEM DE COMPRA DIÁRIA & COTAÇÃO DE FORNECEDORES'
                    : 'PLANILHA DE CONFERÊNCIA DE RECEBIMENTO & REPOSIÇÃO DE BANCA'}
                </h2>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Data: <strong className="text-slate-950">{todayFormatted}</strong> • Unidade: <strong>Loja Principal</strong> • Solicitantes: Charles &amp; Amanda
                </p>
                {printType === 'prancheta_dupla' && (
                  <p className="text-[10px] font-bold text-slate-700 italic mt-0.5">
                    * DOCUMENTO DE USO DUPLO: O comprador leva ao Ceasa para comprar e na chegada a equipe (Lucas/Rafael) confere o descarregamento no mesmo impresso.
                  </p>
                )}
              </div>

              <div className="text-right text-xs shrink-0 pl-3">
                <div className="px-2.5 py-1 bg-slate-100 border border-slate-400 rounded font-mono font-bold text-slate-950 text-[11px]">
                  {selectedSupplier === 'todos' ? 'TODOS OS FORNECEDORES' : selectedSupplier.toUpperCase()}
                </div>
                <p className="text-[10px] text-slate-600 mt-1">
                  Gerente: <strong>{settings.gerenteResponsavel}</strong> • Visto: ____________
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-400 rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-400 text-slate-950 font-black uppercase text-[10px] tracking-wider">
                  <th className="p-2 border-r border-slate-400 w-8 text-center">#</th>
                  <th className="p-2 border-r border-slate-400 w-8 text-center">✓</th>
                  <th className="p-2 border-r border-slate-400">Produto &amp; Categoria</th>
                  <th className="p-2 border-r border-slate-400 w-28">Fornecedor / Box</th>
                  <th className="p-2 border-r border-slate-400 w-22 text-center bg-slate-300/60 font-black">
                    Qtd Pedida
                  </th>

                  {/* Dual Use Columns */}
                  {printType === 'prancheta_dupla' && (
                    <>
                      <th className="p-2 border-r border-slate-400 w-24 text-center">
                        Qtd Comprada (Ceasa)
                      </th>
                      <th className="p-2 border-r border-slate-400 w-20 text-center">
                        Preço Unit.
                      </th>
                      <th className="p-2 border-r border-slate-400 w-24 text-center bg-amber-100/70 font-black">
                        Qtd Recebida (Loja)
                      </th>
                      <th className="p-2 text-center w-36">
                        Divergência / Faltas
                      </th>
                    </>
                  )}

                  {/* Purchase Only Columns */}
                  {printType === 'compra' && (
                    <>
                      <th className="p-2 border-r border-slate-400 w-24 text-center">Preço / Cx</th>
                      <th className="p-2 w-48">Observações de Compra</th>
                    </>
                  )}

                  {/* Conference Only Columns */}
                  {printType === 'conferencia' && (
                    <>
                      <th className="p-2 border-r border-slate-400 w-24 text-center bg-amber-50">
                        Qtd Recebida
                      </th>
                      <th className="p-2 border-r border-slate-400 w-28 text-center">
                        Conferente
                      </th>
                      <th className="p-2 w-28 text-center bg-emerald-50">
                        Reposto Banca
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {targetItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={printType === 'prancheta_dupla' ? 9 : printType === 'conferencia' ? 8 : 7}
                      className="p-6 text-center text-slate-500 italic"
                    >
                      Nenhum item encontrado para esta seleção.
                    </td>
                  </tr>
                ) : (
                  targetItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      {/* # */}
                      <td className="p-2 border-r border-slate-300 text-center font-mono font-bold text-slate-600 text-[11px]">
                        {index + 1}
                      </td>

                      {/* Physical Checkbox */}
                      <td className="p-2 border-r border-slate-300 text-center">
                        <div className="w-4 h-4 border-2 border-slate-600 rounded mx-auto"></div>
                      </td>

                      {/* Produto & Categoria */}
                      <td className="p-2 border-r border-slate-300">
                        <span className="font-bold text-slate-950 block text-[12px] leading-tight">
                          {item.produto}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.categoria && (
                            <span className="text-[10px] text-slate-600 font-semibold">
                              {item.categoria}
                            </span>
                          )}
                          {item.observacao && (
                            <span className="text-[10px] text-slate-700 italic">
                              • Obs: {item.observacao}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Fornecedor */}
                      <td className="p-2 border-r border-slate-300 font-semibold text-slate-900 text-[11px]">
                        {item.fornecedor || 'Ceasa Box 14'}
                      </td>

                      {/* Qtd Pedida */}
                      <td className="p-2 border-r border-slate-300 text-center font-mono font-black text-slate-950 bg-slate-100/80 text-[12px]">
                        {item.quantidadePedida || '—'}
                      </td>

                      {/* Dual Use Dynamic Columns */}
                      {printType === 'prancheta_dupla' && (
                        <>
                          {/* Qtd Comprada (Ceasa) */}
                          <td className="p-2 border-r border-slate-300 text-center font-mono text-slate-500 text-[11px]">
                            [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]
                          </td>

                          {/* Preço Unit */}
                          <td className="p-2 border-r border-slate-300 text-center font-mono text-slate-400 text-[11px]">
                            R$ _____
                          </td>

                          {/* Qtd Recebida (Loja - Lucas/Rafael) */}
                          <td className="p-2 border-r border-slate-300 text-center font-mono bg-amber-50/50 font-bold text-slate-900 text-[11px]">
                            {item.quantidadeRecebida ? (
                              <span className="text-emerald-800 font-black">
                                ✓ {item.quantidadeRecebida}
                              </span>
                            ) : (
                              <span className="text-slate-500">[ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]</span>
                            )}
                          </td>

                          {/* Divergência / Faltas */}
                          <td className="p-2 text-slate-600 text-[10px]">
                            {item.motivoDivergencia ? (
                              <span className="text-amber-900 font-bold">
                                {item.motivoDivergencia}
                              </span>
                            ) : (
                              <span className="text-slate-400">________________________</span>
                            )}
                          </td>
                        </>
                      )}

                      {/* Compra Only Columns */}
                      {printType === 'compra' && (
                        <>
                          <td className="p-2 border-r border-slate-300 text-center font-mono text-slate-500">
                            R$ ________
                          </td>
                          <td className="p-2 text-slate-700 text-[11px]">
                            {item.observacao || '—'}
                          </td>
                        </>
                      )}

                      {/* Conferencia Only Columns */}
                      {printType === 'conferencia' && (
                        <>
                          <td className="p-2 border-r border-slate-300 text-center font-mono bg-amber-50/40 font-bold">
                            {item.quantidadeRecebida || '[ _________ ]'}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center text-[11px]">
                            {item.conferidoPorNome ? (
                              <span className="font-bold text-emerald-800">
                                ✓ {item.conferidoPorNome}
                              </span>
                            ) : (
                              <span className="text-slate-500">[ Lucas / Rafael ]</span>
                            )}
                          </td>
                          <td className="p-2 text-center text-[11px] bg-emerald-50/30">
                            {item.reposicaoConcluida ? (
                              <span className="font-bold text-emerald-800">✓ Reposto</span>
                            ) : (
                              <span className="text-slate-500">[ ] Repor</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Validation Footers with Signatures (Ceasa + Store Arrival + Replenishment) */}
          <div className="mt-4 pt-3 border-t-2 border-slate-900 text-xs text-slate-900">
            {printType === 'prancheta_dupla' ? (
              <div className="grid grid-cols-3 gap-4">
                {/* Stage 1: Ceasa Buyer */}
                <div className="border border-slate-300 p-2.5 rounded bg-slate-50 text-[11px] space-y-1.5">
                  <p className="font-black uppercase text-slate-900 flex items-center gap-1">
                    <span>1. Comprador no Ceasa:</span>
                  </p>
                  <p className="text-slate-700">Nome: _____________________________</p>
                  <p className="text-slate-700">Assinatura: ________________________</p>
                  <p className="text-slate-600 text-[10px]">Saída do Ceasa: ____:____</p>
                </div>

                {/* Stage 2: Store Conference (Lucas / Rafael) */}
                <div className="border border-slate-300 p-2.5 rounded bg-slate-50 text-[11px] space-y-1.5">
                  <p className="font-black uppercase text-slate-900">
                    2. Recepção / Descarregamento da Kombi:
                  </p>
                  <p className="text-slate-700 font-bold">
                    Conferente: [ &nbsp; ] Lucas &nbsp;&nbsp;&nbsp; [ &nbsp; ] Rafael
                  </p>
                  <p className="text-slate-700">Visto / Assinatura: __________________</p>
                  <p className="text-slate-600 text-[10px]">Chegada na Loja: ____:____</p>
                </div>

                {/* Stage 3: Store Replenishment */}
                <div className="border border-slate-300 p-2.5 rounded bg-slate-50 text-[11px] space-y-1.5">
                  <p className="font-black uppercase text-slate-900">
                    3. Reposição nas Bancas:
                  </p>
                  <p className="text-slate-700 font-semibold">
                    [ &nbsp; ] 100% Reposto nas bancas
                  </p>
                  <p className="text-slate-700 font-semibold">
                    [ &nbsp; ] Sobras guardadas na câmara fria
                  </p>
                  <p className="text-slate-600 text-[10px]">Responsável: _____________________</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-end">
                <div>
                  <p className="font-bold text-slate-900">Instruções para a Operação:</p>
                  <p className="text-[11px] text-slate-600">
                    1. Lista conferida e separada por fornecedores/boxes.<br />
                    2. Chegada da Kombi: conferência física de caixas e sacarias.<br />
                    3. Entrada imediata na área de vendas para reposição e estoque.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold">Visto Responsável: ___________________________</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Lucas / Rafael / Charles</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
