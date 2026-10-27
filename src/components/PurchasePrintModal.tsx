import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  ClipboardList,
} from 'lucide-react';
import { PurchaseItem, StoreSettings, User } from '../types';

interface PurchasePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchases: PurchaseItem[];
  settings: StoreSettings;
  currentUser: User;
  initialModel?: 'prancheta_dupla' | 'compra' | 'conferencia' | 'extras_fora_da_lista';
}

const EXTRA_UNLISTED_ROWS = Array.from({ length: 22 }, (_, i) => i + 1);

export const PurchasePrintModal: React.FC<PurchasePrintModalProps> = ({
  isOpen,
  onClose,
  purchases,
  settings,
  initialModel = 'prancheta_dupla',
}) => {
  const [selectedSupplier, setSelectedSupplier] = useState<string>('todos');
  const [printType, setPrintType] = useState<
    'prancheta_dupla' | 'compra' | 'conferencia' | 'extras_fora_da_lista'
  >(initialModel);
  const [alwaysBlankBrackets, setAlwaysBlankBrackets] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setPrintType(initialModel);
      document.body.classList.add('has-print-modal');
    } else {
      document.body.classList.remove('has-print-modal');
    }
    return () => {
      document.body.classList.remove('has-print-modal');
    };
  }, [isOpen, initialModel]);

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

  const modalContent = (
    <div className="print-portal-root fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="print-modal-dialog bg-white rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-300">
        {/* Topbar (No Print) */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-[#0a3821] text-white rounded-t-3xl no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md">
              <Printer className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {printType === 'extras_fora_da_lista'
                  ? 'Imprimir Folha: Produtos que Chegaram Fora da Lista (A4 Prancheta)'
                  : 'Imprimir Planilha de Compra & Conferência da Kombi (A4 Prancheta)'}
              </h2>
              <p className="text-xs text-emerald-100">
                {printType === 'extras_fora_da_lista'
                  ? 'Folha pautada A4 para anotar à caneta os produtos que chegaram na loja, mas que não estavam na lista'
                  : `Chaves amplas [              ] para preenchimento confortável à caneta na prancheta (${targetItems.length} itens)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>
                {printType === 'extras_fora_da_lista'
                  ? '🖨 Imprimir Folha Fora da Lista (22 linhas)'
                  : `🖨 Imprimir / Salvar PDF (${targetItems.length} itens)`}
              </span>
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-800">Modelo:</span>
              <div className="flex items-center flex-wrap bg-white rounded-xl border border-slate-300 p-0.5 gap-0.5">
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
                  <span>Prancheta A4 (Compra + Kombi)</span>
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
                  Conferência Kombi (Chaves Largas)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintType('extras_fora_da_lista')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    printType === 'extras_fora_da_lista'
                      ? 'bg-amber-500 text-slate-950 shadow-2xs'
                      : 'text-amber-950 bg-amber-50 hover:bg-amber-100'
                  }`}
                >
                  📝 Chegaram Fora da Lista (Em Branco)
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
              </div>
            </div>

            {printType !== 'extras_fora_da_lista' && (
              <>
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

                <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold text-emerald-950 bg-white px-2.5 py-1.5 rounded-xl border border-emerald-300">
                  <input
                    type="checkbox"
                    checked={alwaysBlankBrackets}
                    onChange={(e) => setAlwaysBlankBrackets(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-700"
                  />
                  <span>Chaves [ &nbsp;&nbsp;&nbsp;&nbsp; ] em branco p/ caneta</span>
                </label>
              </>
            )}
          </div>

          <div className="text-slate-700 font-bold text-xs">
            {printType === 'extras_fora_da_lista'
              ? 'Folha A4 com 22 linhas para anotar produtos que chegaram sem estar na lista'
              : `Total de ${targetItems.length} ${
                  targetItems.length === 1 ? 'item na folha' : 'itens na folha (paginação automática A4)'
                }`}
          </div>
        </div>

        {/* Printable Sheet Area */}
        <div className="print-modal-scroll-area p-5 sm:p-6 overflow-y-auto flex-1 bg-white text-slate-950 font-sans">
          {/* Sheet Header */}
          <div className="border-b-2 border-slate-900 pb-2.5 mb-2.5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-950">
                  {settings.nomeLoja} — HORTIFRÚTI &amp; DISTRIBUIÇÃO
                </h1>
                <h2 className="text-[11px] font-black uppercase text-slate-900 mt-0.5 tracking-wide">
                  {printType === 'extras_fora_da_lista'
                    ? 'FOLHA DE CONFERÊNCIA — PRODUTOS QUE CHEGARAM NA LOJA MAS NÃO ESTAVAM NA LISTA'
                    : printType === 'prancheta_dupla'
                    ? 'PLANILHA DE COMPRA (CEASA) & CONFERÊNCIA DE DESCARREGAMENTO DA KOMBI'
                    : printType === 'compra'
                    ? 'ORDEM DE COMPRA DIÁRIA & COTAÇÃO DE FORNECEDORES'
                    : 'ESPELHO DE CONFERÊNCIA DA KOMBI & REPOSIÇÃO DE BANCA (LUCAS / RAFAEL)'}
                </h2>
                <p className="text-[10px] text-slate-700 mt-0.5">
                  Data: <strong className="text-slate-950">{todayFormatted}</strong> • Proprietários: <strong>Beto &amp; Amanda</strong> • Encarregado do Hortifrúti: <strong>{settings.gerenteResponsavel}</strong>
                  {printType !== 'extras_fora_da_lista' && (
                    <>
                      {' '}
                      • Total: <strong>{targetItems.length} itens</strong>
                    </>
                  )}
                </p>
                {printType === 'prancheta_dupla' && (
                  <p className="text-[9.5px] font-bold text-slate-700 italic mt-0.5">
                    * DOCUMENTO DE USO DUPLO: O comprador anota no Ceasa e na chegada da Kombi a equipe (Lucas/Rafael) preenche a conferência à caneta dentro das chaves [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ].
                  </p>
                )}
                {printType === 'extras_fora_da_lista' && (
                  <p className="text-[9.5px] font-bold text-slate-800 italic mt-0.5">
                    * INSTRUÇÃO: Anote abaixo todas as mercadorias que chegaram na Kombi / entrega, mas que NÃO constavam na lista original de compras. Faça a conversão obrigatória em kg (peso) ou un (unidades).
                  </p>
                )}
              </div>

              <div className="text-right text-xs shrink-0 pl-2">
                <div className="px-2 py-0.5 bg-slate-100 border border-slate-400 rounded font-mono font-bold text-slate-950 text-[10px] whitespace-nowrap">
                  {printType === 'extras_fora_da_lista'
                    ? 'PRODUTOS EXTRAS / FORA DA LISTA'
                    : selectedSupplier === 'todos'
                    ? 'TODOS OS FORNECEDORES'
                    : selectedSupplier.toUpperCase()}
                </div>
                <p className="text-[10px] text-slate-600 mt-1 whitespace-nowrap">
                  Encarregado: <strong>{settings.gerenteResponsavel}</strong> • Visto: ____________
                </p>
              </div>
            </div>
          </div>

          {/* Table: Either Extra Unlisted Products Sheet OR Standard Purchase List Table */}
          {printType === 'extras_fora_da_lista' ? (
            <div className="print-table-wrapper border border-slate-400 rounded overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-200 border-b border-slate-400 text-slate-950 font-black uppercase text-[9.5px] tracking-wider">
                    <th className="p-1 border-r border-slate-400 w-7 text-center">#</th>
                    <th className="p-1 border-r border-slate-400 w-7 text-center">✓</th>
                    <th className="p-1.5 border-r border-slate-400">
                      Produto que Chegou (Não estava na Lista)
                    </th>
                    <th className="p-1.5 border-r border-slate-400 w-28">
                      Fornecedor / Box
                    </th>
                    <th className="p-1.5 border-r border-slate-400 w-32 text-center bg-amber-100/70">
                      Qtd Volumes (Cx/Sc)
                    </th>
                    <th className="p-1.5 border-r border-slate-400 w-48 text-center bg-emerald-100/60">
                      Conversão Obrigatória (kg / un)
                    </th>
                    <th className="p-1.5 border-r border-slate-400 w-32 text-center bg-rose-50/70">
                      Avaria (kg / un)
                    </th>
                    <th className="p-1.5 w-36 text-center">
                      Quem Enviou / Obs.
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {EXTRA_UNLISTED_ROWS.map((rowNum) => (
                    <tr key={rowNum} className="h-7">
                      <td className="p-1 border-r border-slate-300 text-center font-mono font-bold text-slate-700 text-[10px]">
                        {rowNum}
                      </td>
                      <td className="p-1 border-r border-slate-300 text-center">
                        <div className="w-3.5 h-3.5 border-2 border-slate-700 rounded-xs mx-auto" />
                      </td>
                      {/* Blank line for Product Name */}
                      <td className="px-2 py-1 border-r border-slate-300 align-bottom">
                        <div className="w-full border-b border-dotted border-slate-400 h-4" />
                      </td>
                      {/* Blank line for Supplier */}
                      <td className="px-2 py-1 border-r border-slate-300 align-bottom">
                        <div className="w-full border-b border-dotted border-slate-400 h-4" />
                      </td>
                      {/* Wide bracket for Qtd Volumes */}
                      <td className="px-1.5 py-1 border-r border-slate-300 bg-amber-50/30 align-middle">
                        <div className="flex items-center justify-between w-full font-mono text-slate-950 text-[11px]">
                          <span className="font-black">[</span>
                          <span className="flex-1 border-b border-dotted border-slate-400 mx-1 h-4" />
                          <span className="font-black">]</span>
                        </div>
                      </td>
                      {/* Wide bracket for Mandatory Conversion (kg / un) */}
                      <td className="px-1.5 py-1 border-r border-slate-300 bg-emerald-50/25 align-middle">
                        <div className="flex items-center justify-between w-full font-mono text-slate-950 text-[10.5px]">
                          <span className="font-black">[</span>
                          <span className="flex-1 border-b border-dotted border-slate-400 mx-1 h-4" />
                          <span className="text-[9px] font-bold text-slate-700 mr-1 whitespace-nowrap">
                            ( )kg ( )un
                          </span>
                          <span className="font-black">]</span>
                        </div>
                      </td>
                      {/* Wide bracket for Optional Avaria */}
                      <td className="px-1.5 py-1 border-r border-slate-300 bg-rose-50/20 align-middle">
                        <div className="flex items-center justify-between w-full font-mono text-slate-900 text-[10.5px]">
                          <span className="font-black">[</span>
                          <span className="flex-1 border-b border-dotted border-slate-400 mx-1 h-4" />
                          <span className="text-[8.5px] font-bold text-slate-500 mr-0.5">kg/un</span>
                          <span className="font-black">]</span>
                        </div>
                      </td>
                      {/* Blank line for Observation */}
                      <td className="px-2 py-1 align-bottom">
                        <div className="w-full border-b border-dotted border-slate-400 h-4" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="print-table-wrapper border border-slate-400 rounded overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-200 border-b border-slate-400 text-slate-950 font-black uppercase text-[9.5px] tracking-wider">
                    <th className="p-1 border-r border-slate-400 w-6 text-center">#</th>
                    <th className="p-1 border-r border-slate-400 w-6 text-center">✓</th>
                    <th className="p-1.5 border-r border-slate-400">Produto &amp; Categoria</th>
                    <th className="p-1 border-r border-slate-400 w-20">Fornecedor</th>
                    <th className="p-1 border-r border-slate-400 w-16 text-center bg-slate-300/60 font-black">
                      Qtd Pedida
                    </th>

                    {/* Dual Use Columns — Extra wide brackets for handwritten filling on clipboard */}
                    {printType === 'prancheta_dupla' && (
                      <>
                        <th className="p-1.5 border-r border-slate-400 w-32 min-w-[115px] text-center">
                          Qtd Comprada (Ceasa)
                        </th>
                        <th className="p-1.5 border-r border-slate-400 w-20 min-w-[75px] text-center">
                          Preço Unit.
                        </th>
                        <th className="p-1.5 border-r border-slate-400 w-44 min-w-[155px] text-center bg-amber-100/70 font-black">
                          Conferido &amp; Conversão (kg / un)
                        </th>
                        <th className="p-1.5 text-center w-36 min-w-[125px]">
                          Avaria (kg/un) / Faltas
                        </th>
                      </>
                    )}

                    {/* Purchase Only Columns */}
                    {printType === 'compra' && (
                      <>
                        <th className="p-1.5 border-r border-slate-400 w-40 min-w-[145px] text-center">
                          Qtd Comprada [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]
                        </th>
                        <th className="p-1.5 border-r border-slate-400 w-28 text-center">Preço / Cx</th>
                        <th className="p-1.5 w-44">Observações de Compra</th>
                      </>
                    )}

                    {/* Conference Only Columns (Extra-Wide Kombi Brackets with Conversion kg/un + Avaria) */}
                    {printType === 'conferencia' && (
                      <>
                        <th className="p-1.5 border-r border-slate-400 w-40 min-w-[145px] text-center bg-amber-100/70 font-black">
                          Qtd Chegou (Kombi)
                        </th>
                        <th className="p-1.5 border-r border-slate-400 w-44 min-w-[160px] text-center bg-emerald-100/60 font-black">
                          Conversão Obrigatória (kg / un)
                        </th>
                        <th className="p-1.5 w-36 min-w-[130px] text-center bg-rose-50/70 font-black">
                          Avaria (Mesma Unid. kg/un)
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {targetItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={printType === 'prancheta_dupla' ? 9 : printType === 'conferencia' ? 8 : 8}
                        className="p-6 text-center text-slate-500 italic"
                      >
                        Nenhum item encontrado para esta seleção.
                      </td>
                    </tr>
                  ) : (
                    targetItems.map((item, index) => {
                      const isNaoChegou =
                        item.statusConferencia === 'Comprou, mas não chegou' ||
                        item.statusConferencia === 'Não Comprou';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          {/* # */}
                          <td className="p-1 border-r border-slate-300 text-center font-mono font-bold text-slate-700 text-[10px] tabular-nums">
                            {index + 1}
                          </td>

                          {/* Physical Checkbox */}
                          <td className="p-1 border-r border-slate-300 text-center">
                            <div className="w-3.5 h-3.5 border-2 border-slate-700 rounded-xs mx-auto" />
                          </td>

                          {/* Produto & Categoria */}
                          <td className="p-1.5 border-r border-slate-300">
                            <div className="flex items-baseline justify-between gap-1.5">
                              <span className="font-bold text-slate-950 text-[11px] leading-tight">
                                {item.produto}
                              </span>
                              {item.categoria && (
                                <span className="text-[9px] text-slate-600 font-semibold shrink-0">
                                  ({item.categoria})
                                </span>
                              )}
                            </div>
                            {item.observacao && (
                              <div className="text-[9px] text-slate-700 italic mt-0.5">
                                Obs: {item.observacao}
                              </div>
                            )}
                          </td>

                          {/* Fornecedor */}
                          <td className="p-1 border-r border-slate-300 font-semibold text-slate-800 text-[9.5px] truncate max-w-[85px]">
                            {item.fornecedor || 'Ceasa Box 14'}
                          </td>

                          {/* Qtd Pedida */}
                          <td className="p-1 border-r border-slate-300 text-center font-mono font-black text-slate-950 bg-slate-100/80 text-[10.5px] whitespace-nowrap tabular-nums">
                            {item.quantidadePedida && item.quantidadePedida.trim()
                              ? item.quantidadePedida
                              : '—'}
                          </td>

                          {/* Dual Use Dynamic Columns with Full-Width Handwritten Brackets */}
                          {printType === 'prancheta_dupla' && (
                            <>
                              {/* Qtd Comprada (Ceasa) — Full-width bracket */}
                              <td className="px-1.5 py-1 border-r border-slate-300 align-middle">
                                <div className="flex items-center justify-between w-full font-mono text-slate-800 text-[11px]">
                                  <span className="font-black text-slate-900">[</span>
                                  <span className="flex-1 border-b border-dotted border-slate-400 mx-1 h-4" />
                                  <span className="font-black text-slate-900">]</span>
                                </div>
                              </td>

                              {/* Preço Unit */}
                              <td className="px-1.5 py-1 border-r border-slate-300 align-middle">
                                <div className="flex items-center justify-between w-full font-mono text-slate-700 text-[10px]">
                                  <span className="font-bold">R$</span>
                                  <span className="flex-1 border-b border-dotted border-slate-400 ml-1 h-4" />
                                </div>
                              </td>

                              {/* Qtd Conferida + Conversão (kg / un) — Extra-wide full-cell bracket */}
                              <td className="px-1.5 py-1 border-r border-slate-300 bg-amber-50/40 align-middle">
                                {!alwaysBlankBrackets && isNaoChegou ? (
                                  <div className="flex items-center justify-between w-full font-mono text-rose-900 font-black text-[9.5px]">
                                    <span>[</span>
                                    <span className="px-1">✕ {item.statusConferencia}</span>
                                    <span>]</span>
                                  </div>
                                ) : !alwaysBlankBrackets && item.mercadoriaRecebida ? (
                                  <div className="flex items-center justify-between w-full font-mono text-emerald-900 font-black text-[10px]">
                                    <span>[</span>
                                    <span className="px-1">
                                      ✓ {item.quantidadeRecebida || ''}
                                      {item.quantidadeConvertida && item.unidadeConversao
                                        ? ` ➔ ${item.quantidadeConvertida} ${item.unidadeConversao}`
                                        : ''}
                                    </span>
                                    <span>]</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between w-full font-mono text-slate-900 text-[10.5px]">
                                    <span className="font-black text-slate-950">[</span>
                                    <span className="flex-1 border-b border-dotted border-slate-400 mx-1 h-4" />
                                    <span className="text-[9px] font-bold text-slate-500 mr-0.5">kg/un</span>
                                    <span className="font-black text-slate-950">]</span>
                                  </div>
                                )}
                              </td>

                              {/* Avaria (kg/un) / Faltas */}
                              <td className="px-1.5 py-1 text-slate-600 text-[10px] align-middle">
                                {!alwaysBlankBrackets && (item.quantidadeAvaria || item.motivoDivergencia) ? (
                                  <span className="text-rose-900 font-bold whitespace-normal text-[9.5px]">
                                    {item.quantidadeAvaria && item.unidadeConversao
                                      ? `Avaria: ${item.quantidadeAvaria} ${item.unidadeConversao} `
                                      : ''}
                                    {item.motivoDivergencia || ''}
                                  </span>
                                ) : (
                                  <div className="flex items-center justify-between w-full font-mono text-slate-800 text-[10px]">
                                    <span className="font-bold">[</span>
                                    <span className="flex-1 border-b border-dotted border-slate-400 mx-1 h-4" />
                                    <span className="font-bold">]</span>
                                  </div>
                                )}
                              </td>
                            </>
                          )}

                          {/* Compra Only Columns */}
                          {printType === 'compra' && (
                            <>
                              <td className="px-2 py-1 border-r border-slate-300 align-middle">
                                <div className="flex items-center justify-between w-full font-mono text-slate-900 text-[11px]">
                                  <span className="font-black">[</span>
                                  <span className="flex-1 border-b border-dotted border-slate-400 mx-1.5 h-4" />
                                  <span className="font-black">]</span>
                                </div>
                              </td>
                              <td className="px-2 py-1 border-r border-slate-300 align-middle">
                                <div className="flex items-center justify-between w-full font-mono text-slate-700 text-[10.5px]">
                                  <span className="font-bold">R$</span>
                                  <span className="flex-1 border-b border-dotted border-slate-400 ml-1 h-4" />
                                </div>
                              </td>
                              <td className="p-1.5 text-slate-700 text-[10.5px]">
                                {item.observacao || <div className="w-full border-b border-dotted border-slate-400 h-4" />}
                              </td>
                            </>
                          )}

                          {/* Conferencia Kombi Only Columns (Extra-Wide Brackets + Mandatory Conversion kg/un + Avaria) */}
                          {printType === 'conferencia' && (
                            <>
                              <td className="px-2 py-1 border-r border-slate-300 bg-amber-50/40 align-middle">
                                {!alwaysBlankBrackets && isNaoChegou ? (
                                  <div className="flex items-center justify-between w-full font-mono font-black text-rose-900 text-[10px]">
                                    <span>[</span>
                                    <span>✕ {item.statusConferencia}</span>
                                    <span>]</span>
                                  </div>
                                ) : !alwaysBlankBrackets && item.quantidadeRecebida ? (
                                  <div className="flex items-center justify-between w-full font-mono font-black text-emerald-900 text-[11px]">
                                    <span>[</span>
                                    <span>✓ {item.quantidadeRecebida}</span>
                                    <span>]</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between w-full font-mono text-slate-950 text-[11.5px]">
                                    <span className="font-black">[</span>
                                    <span className="flex-1 border-b border-dotted border-slate-400 mx-1.5 h-4" />
                                    <span className="font-black">]</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-2 py-1 border-r border-slate-300 bg-emerald-50/30 align-middle">
                                {!alwaysBlankBrackets && item.quantidadeConvertida && item.unidadeConversao ? (
                                  <div className="flex items-center justify-between w-full font-mono font-black text-emerald-950 text-[11px]">
                                    <span>[</span>
                                    <span>
                                      {item.quantidadeConvertida} {item.unidadeConversao}
                                    </span>
                                    <span>]</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between w-full font-mono text-slate-900 text-[11px]">
                                    <span className="font-black">[</span>
                                    <span className="flex-1 border-b border-dotted border-slate-400 mx-1 h-4" />
                                    <span className="text-[9.5px] font-bold text-slate-600 mr-1">kg / un</span>
                                    <span className="font-black">]</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-2 py-1 text-center bg-rose-50/20 align-middle">
                                {!alwaysBlankBrackets && item.quantidadeAvaria && item.unidadeConversao ? (
                                  <div className="flex items-center justify-between w-full font-mono font-black text-rose-900 text-[10.5px]">
                                    <span>[</span>
                                    <span>
                                      {item.quantidadeAvaria} {item.unidadeConversao}
                                    </span>
                                    <span>]</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between w-full font-mono text-slate-900 text-[11px]">
                                    <span className="font-black">[</span>
                                    <span className="flex-1 border-b border-dotted border-slate-400 mx-1 h-4" />
                                    <span className="text-[9px] font-bold text-slate-500 mr-0.5">kg/un</span>
                                    <span className="font-black">]</span>
                                  </div>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Validation Footers with Signatures (Ceasa + Store Arrival + Replenishment) */}
          <div className="mt-3 pt-2.5 border-t-2 border-slate-900 text-xs text-slate-900 print-avoid-break">
            {printType === 'prancheta_dupla' ? (
              <div className="grid grid-cols-3 gap-3">
                {/* Stage 1: Ceasa Buyer */}
                <div className="border border-slate-400 p-2 rounded bg-slate-50 text-[10.5px] space-y-1">
                  <p className="font-black uppercase text-slate-900">
                    1. Comprador no Ceasa:
                  </p>
                  <p className="text-slate-700">Nome: ___________________________</p>
                  <p className="text-slate-700">Assinatura: ______________________</p>
                  <p className="text-slate-600 text-[9.5px]">Saída do Ceasa: ____:____</p>
                </div>

                {/* Stage 2: Store Conference (Lucas / Rafael) */}
                <div className="border border-slate-400 p-2 rounded bg-slate-50 text-[10.5px] space-y-1">
                  <p className="font-black uppercase text-slate-900">
                    2. Recepção / Descarga Kombi:
                  </p>
                  <p className="text-slate-700 font-bold">
                    Conferente: [ &nbsp;&nbsp;&nbsp; ] Lucas &nbsp;&nbsp;&nbsp; [ &nbsp;&nbsp;&nbsp; ] Rafael
                  </p>
                  <p className="text-slate-700">Assinatura: ______________________</p>
                  <p className="text-slate-600 text-[9.5px]">Chegada na Loja: ____:____</p>
                </div>

                {/* Stage 3: Store Replenishment */}
                <div className="border border-slate-400 p-2 rounded bg-slate-50 text-[10.5px] space-y-1">
                  <p className="font-black uppercase text-slate-900">
                    3. Reposição nas Bancas:
                  </p>
                  <p className="text-slate-700 font-semibold">
                    [ &nbsp;&nbsp;&nbsp; ] 100% Reposto nas bancas
                  </p>
                  <p className="text-slate-700 font-semibold">
                    [ &nbsp;&nbsp;&nbsp; ] Sobras guardadas na câmara
                  </p>
                  <p className="text-slate-600 text-[9.5px]">Encarregado ({settings.gerenteResponsavel}): ______________</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-end">
                <div>
                  <p className="font-bold text-slate-900">
                    {printType === 'extras_fora_da_lista'
                      ? 'Instruções para Produtos que Chegaram Fora da Lista:'
                      : 'Instruções para a Operação (Kombi & Bancas):'}
                  </p>
                  <p className="text-[10.5px] text-slate-600">
                    {printType === 'extras_fora_da_lista' ? (
                      <>
                        1. Anotar todo produto descarregado da Kombi que não estava na lista impressa do dia.<br />
                        2. Pesar (kg) ou contar (un) obrigatoriamente cada caixa recebida e marcar dentro das chaves [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ].<br />
                        3. Entregar esta folha ao Encarregado ({settings.gerenteResponsavel}) ou Proprietários (Beto &amp; Amanda) após a descarga.
                      </>
                    ) : (
                      <>
                        1. Lista conferida e separada por fornecedores/boxes.<br />
                        2. Chegada da Kombi: anotar quantidade recebida dentro das chaves [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ].<br />
                        3. Entrada imediata na área de vendas para reposição e estoque.
                      </>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold">Conferente: [ &nbsp;&nbsp; ] Lucas &nbsp;&nbsp; [ &nbsp;&nbsp; ] Rafael &nbsp;&nbsp; Visto: ___________________</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Encarregado do Hortifrúti: {settings.gerenteResponsavel} • Proprietários: Beto &amp; Amanda</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
