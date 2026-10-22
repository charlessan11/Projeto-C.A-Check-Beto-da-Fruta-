import React, { useState, useMemo } from 'react';
import { X, Printer, CheckSquare, Sparkles, Copy, Check, Download, AlertCircle } from 'lucide-react';
import { Task, User, StoreSettings, Prioridade, DailyRoutine } from '../types';
import { getTodayDateString } from '../services/storage';

interface PrintSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  users: User[];
  settings: StoreSettings;
  routine?: DailyRoutine;
}

export const PrintSheetModal: React.FC<PrintSheetModalProps> = ({
  isOpen,
  onClose,
  tasks,
  users,
  settings,
  routine,
}) => {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [turno, setTurno] = useState<'Manhã' | 'Tarde' | 'Noite' | 'Integral'>('Manhã');
  const [apenasPendentes, setApenasPendentes] = useState(true);
  const [copied, setCopied] = useState(false);

  const usersMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const priorityWeight = (p: Prioridade): number => {
    if (p.startsWith('1')) return 1;
    if (p.startsWith('2')) return 2;
    if (p.startsWith('3')) return 3;
    return 4;
  };

  const priorityTag = (p: Prioridade): string => {
    if (p.startsWith('1')) return '[!] CRÍTICA';
    if (p.startsWith('2')) return '[A] ALTA';
    if (p.startsWith('3')) return '[M] MÉDIA';
    return '[B] BAIXA';
  };

  // Filter tasks for print sheet
  const printTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.incluirNaImpressao) return false;
      if (t.dataProgramada !== selectedDate) return false;
      if (apenasPendentes && t.status === 'Concluída') return false;
      return true;
    });
  }, [tasks, selectedDate, apenasPendentes]);

  // Bloco 1: Micro-Ações de 2 Minutos
  const twoMinuteList = useMemo(() => {
    return printTasks
      .filter((t) => t.tipoTempo === '2 Minutos (Fazer na Transição)')
      .sort((a, b) => priorityWeight(a.prioridade) - priorityWeight(b.prioridade));
  }, [printTasks]);

  // Bloco 2: Atividades Prioritárias por Setor (Macro-Tarefas)
  const sectorGroups = useMemo(() => {
    const macros = printTasks.filter((t) => t.tipoTempo !== '2 Minutos (Fazer na Transição)');
    const groups: { [cat: string]: Task[] } = {};

    macros.forEach((t) => {
      const cat = t.categoria || 'Geral';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    });

    // Sort items within each category by priority
    Object.keys(groups).forEach((cat) => {
      groups[cat].sort((a, b) => priorityWeight(a.prioridade) - priorityWeight(b.prioridade));
    });

    return groups;
  }, [printTasks]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    let text = `====================================================\n`;
    text += `${settings.nomeLoja.toUpperCase()} - CHECKLIST DE ROTINA DIÁRIA\n`;
    text += `Data: ${selectedDate} | Turno: ${turno} | Encarregado: ${settings.gerenteResponsavel}\n`;
    text += `====================================================\n\n`;

    text += `[BLOCO 1 - FILA RÁPIDA DE 2 MINUTOS (GTD)]\n`;
    twoMinuteList.forEach((t) => {
      const resp = usersMap.get(t.responsavelId)?.nome || 'Equipe';
      text += `[ ] ${priorityTag(t.prioridade)} ${t.tituloAtividade} (Resp: ${resp})\n`;
    });

    text += `\n[BLOCO 2 - ATIVIDADES PRIORITÁRIAS POR SETOR]\n`;
    Object.entries(sectorGroups).forEach(([cat, items]) => {
      text += `\n--- SETOR: ${cat.toUpperCase()} ---\n`;
      items.forEach((t) => {
        const resp = usersMap.get(t.responsavelId)?.nome || 'Equipe';
        text += `[ ] ${priorityTag(t.prioridade)} ${t.tituloAtividade}\n    Resp: ${resp} | Rubrica: _________\n`;
      });
    });

    text += `\n[BLOCO 3 - RASCUNHO DE FALTAS / ANOTAR PARA COMPRA]\n`;
    text += `(Espaço para anotação a caneta na prancheta pelo chão de loja)\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300">
        {/* Modal Topbar (hidden during print) */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-t-2xl no-print">
          <div>
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-bold text-slate-900">
                Gerar Folha do Dia (Espelhamento em Prancheta Física)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Formato padronizado A4 de alta densidade para colaboradores com mãos úmidas ou na banca.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
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

        {/* Configuration Bar (no-print) */}
        <div className="px-5 py-2.5 bg-emerald-50/50 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Data:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Turno:</span>
              <select
                value={turno}
                onChange={(e) => setTurno(e.target.value as any)}
                className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium"
              >
                <option value="Manhã">Manhã (Abertura)</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite (Fechamento)</option>
                <option value="Integral">Integral</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={apenasPendentes}
                onChange={(e) => setApenasPendentes(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600"
              />
              <span>Apenas Pendentes / Em Andamento</span>
            </label>
          </div>

          <div className="text-slate-500 font-medium">
            Total de {printTasks.length} tarefa(s) na folha
          </div>
        </div>

        {/* Printable Paper Preview (What will print on paper) */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-8 bg-slate-100">
          <div className="max-w-[800px] mx-auto bg-white border border-slate-300 shadow-lg p-6 sm:p-8 font-sans print-page-container">
            {/* Header section (Section 4.1) */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900">
                    {settings.nomeLoja}
                  </h1>
                  <p className="text-xs font-semibold text-slate-700">
                    FOLHA DE ROSTO &amp; CHECKLIST OPERACIONAL DIÁRIO (PRANCHETA)
                  </p>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-slate-900">TURNO: {turno.toUpperCase()}</div>
                  <div className="text-slate-700">DATA: {selectedDate}</div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-300 flex items-center justify-between text-xs text-slate-700">
                <div>
                  <strong>Encarregado / Gestão:</strong> {settings.gerenteResponsavel}
                </div>
                <div className="w-56 border-b border-slate-700 text-[10px] text-right text-slate-500 pt-3">
                  (Assinatura do Encarregado)
                </div>
              </div>
            </div>

            {/* Bloco 0 - Rotinas Diárias Obrigatórias (Escala Fixa do Hortifrúti) */}
            {routine && (
              <div className="mb-5 p-3 rounded-lg border border-emerald-500 bg-emerald-50/30 print-avoid-break">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-emerald-300">
                  <h2 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                    📋 ESCALA DE ROTINAS DIÁRIAS OBRIGATÓRIAS (BETO DA FRUTA)
                  </h2>
                  <span className="text-[10px] font-bold text-emerald-800">
                    {routine.isSextaFeira ? '⚡ Sexta-feira: Meta Coco 50-75L' : 'Dia Regular: Meta Coco 28-35L'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Coluna 1: Reposição e Balcão */}
                  <div className="space-y-1.5 border-r md:border-slate-300 pr-2">
                    <div className="font-bold text-slate-900 border-b border-slate-200 pb-0.5 text-[11px] uppercase">
                      1. Reposição do Hortifrúti (Contador assume Exp C + Bianca)
                    </div>
                    {routine.expositores.map((exp) => (
                      <div key={exp.expositor} className="flex items-start gap-1.5 leading-tight">
                        <span className="inline-block w-3.5 h-3.5 border border-slate-700 rounded-xs mt-0.5 shrink-0 bg-white" />
                        <span>
                          <strong>{exp.expositor}:</strong> {exp.responsavelNome}
                          {exp.auxiliarNome && ` (Auxílio: ${exp.auxiliarNome})`}
                        </span>
                      </div>
                    ))}
                    <div className="pt-1.5 flex items-start gap-1.5 leading-tight text-slate-800">
                      <span className="inline-block w-3.5 h-3.5 border border-slate-700 rounded-xs mt-0.5 shrink-0 bg-white" />
                      <span>
                        <strong>Atendimento Balcão:</strong> {routine.atendimentoBalcao.responsavelNome}{' '}
                        <span className="text-[10px] text-slate-500">(atende + repõe)</span>
                      </span>
                    </div>
                  </div>

                  {/* Coluna 2: Limpezas, Freezers, Kombi, Coco, Compras */}
                  <div className="space-y-1.5">
                    <div className="font-bold text-slate-900 border-b border-slate-200 pb-0.5 text-[11px] uppercase">
                      2. Limpeza, Produção &amp; Apoio Operacional
                    </div>
                    <div className="flex items-start gap-1.5 leading-tight">
                      <span className="inline-block w-3.5 h-3.5 border border-slate-700 rounded-xs mt-0.5 shrink-0 bg-white" />
                      <span>
                        <strong>Limpezas:</strong> Rita (Circulação, Produção, Banheiros, Estoque, Materiais) | Bianca (Caixa, Balcão)
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 leading-tight">
                      <span className="inline-block w-3.5 h-3.5 border border-slate-700 rounded-xs mt-0.5 shrink-0 bg-white" />
                      <span>
                        <strong>Freezers:</strong> Vanessa (Conferência de temperatura &amp; produtos congelados)
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 leading-tight">
                      <span className="inline-block w-3.5 h-3.5 border border-slate-700 rounded-xs mt-0.5 shrink-0 bg-white" />
                      <span>
                        <strong>Descarga Kombi:</strong> {routine.descargaKombi.responsavelNome} (Lucas ou Rafael)
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 leading-tight">
                      <span className="inline-block w-3.5 h-3.5 border border-slate-700 rounded-xs mt-0.5 shrink-0 bg-white" />
                      <span>
                        <strong>Água de Coco:</strong> {routine.aguaDeCoco.responsavelNome || routine.aguaDeCoco.responsavelPrincipalNome} (Responsável único: Lucas ou Rafael • Meta: {routine.aguaDeCoco.metaMinLitros}–{routine.aguaDeCoco.metaMaxLitros}L + Corte polpa + Descarte lixo)
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 leading-tight">
                      <span className="inline-block w-3.5 h-3.5 border border-slate-700 rounded-xs mt-0.5 shrink-0 bg-white" />
                      <span>
                        <strong>Lista de Compras:</strong> Charles (Checagem de faltas e pedido ao Ceasa)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bloco 1 - Micro-Ações Rápidas (2 Minutos GTD) */}
            <div className="mb-5 p-3 rounded-lg border border-amber-400 bg-amber-50/40 print-avoid-break">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-amber-300">
                <h2 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚡ BLOCO 1: MICRO-AÇÕES RÁPIDAS (REGRA DOS 2 MINUTOS - GTD)</span>
                </h2>
                <span className="text-[10px] font-semibold text-amber-800">
                  Executar nas transições entre tarefas grandes
                </span>
              </div>

              {twoMinuteList.length === 0 ? (
                <div className="text-xs italic text-slate-500 py-1">
                  Nenhuma micro-ação cadastrada para a data.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {twoMinuteList.map((t) => {
                    const resp = usersMap.get(t.responsavelId)?.nome || 'Equipe';
                    return (
                      <div key={t.id} className="flex items-start gap-2 py-0.5">
                        <span className="inline-block w-4 h-4 border-2 border-slate-800 rounded-xs mt-0.5 shrink-0 bg-white" />
                        <div className="leading-tight">
                          <span className="font-bold text-[10px] text-slate-900 mr-1">
                            {priorityTag(t.prioridade)}
                          </span>
                          <span className="text-slate-900">{t.tituloAtividade}</span>
                          <span className="text-[10px] text-slate-500 ml-1">({resp})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bloco 2 - Atividades Prioritárias por Setor */}
            <div className="space-y-4 mb-5">
              <div className="border-b border-slate-900 pb-1">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  BLOCO 2: ATIVIDADES PRIORITÁRIAS POR SETOR (ORDEM CRÍTICA &gt; BAIXA)
                </h2>
              </div>

              {Object.keys(sectorGroups).length === 0 ? (
                <div className="text-xs italic text-slate-500 py-2">
                  Nenhuma atividade macro pendente.
                </div>
              ) : (
                Object.entries(sectorGroups).map(([categoria, items]) => (
                  <div key={categoria} className="print-avoid-break">
                    <div className="bg-slate-100 px-2 py-1 border border-slate-400 font-bold text-xs text-slate-900 uppercase">
                      SETOR: {categoria}
                    </div>

                    <table className="w-full text-left text-xs border border-slate-400 border-t-0">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-400 text-[10px] uppercase font-bold text-slate-700">
                          <th className="w-8 text-center p-1.5 border-r border-slate-400">[ ]</th>
                          <th className="w-24 p-1.5 border-r border-slate-400">Prioridade</th>
                          <th className="p-1.5 border-r border-slate-400">Descrição &amp; Instruções</th>
                          <th className="w-28 p-1.5 border-r border-slate-400">Responsável</th>
                          <th className="w-28 p-1.5 text-center">Hora / Rubrica</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((task) => {
                          const resp = usersMap.get(task.responsavelId)?.nome || 'Equipe';
                          return (
                            <tr key={task.id} className="border-b border-slate-300">
                              <td className="text-center p-1.5 border-r border-slate-400 align-top">
                                <span className="inline-block w-4 h-4 border-2 border-slate-800 rounded-xs bg-white" />
                              </td>
                              <td className="p-1.5 border-r border-slate-400 font-bold text-[10px] align-top text-slate-900">
                                {priorityTag(task.prioridade)}
                              </td>
                              <td className="p-1.5 border-r border-slate-400 align-top">
                                <div className="font-semibold text-slate-900">
                                  {task.tituloAtividade}
                                </div>
                                {task.instrucoesDetalhadas && (
                                  <div className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                                    {task.instrucoesDetalhadas}
                                  </div>
                                )}
                              </td>
                              <td className="p-1.5 border-r border-slate-400 text-slate-800 align-top text-xs">
                                {resp}
                              </td>
                              <td className="p-1.5 text-center align-bottom border-b border-dashed border-slate-400">
                                <span className="text-[10px] text-slate-300">___:___ | ______</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>

            {/* Bloco 3 - Rascunho de Faltas/Compras (Anotação manual na prancheta) */}
            <div className="border border-slate-700 rounded-lg p-3 bg-slate-50/50 print-avoid-break">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-400 mb-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  BLOCO 3: FALTOU NA BANCA / ANOTAR PARA COMPRA (RASCUNHO À CANETA)
                </h3>
                <span className="text-[10px] text-slate-600">
                  Anote produtos esgotados para o encarregado lançar no final do turno
                </span>
              </div>

              <table className="w-full text-xs border border-slate-400 bg-white">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-bold uppercase text-slate-700 border-b border-slate-400">
                    <th className="p-1.5 border-r border-slate-400">Produto em Falta</th>
                    <th className="w-28 p-1.5 border-r border-slate-400">Qtd Estimada</th>
                    <th className="w-32 p-1.5 border-r border-slate-400">Urgência (Dia / Sem)</th>
                    <th className="w-32 p-1.5 text-center">Quem Notou</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4].map((i) => (
                    <tr key={i} className="border-b border-slate-300 h-7">
                      <td className="border-r border-slate-400 p-1"></td>
                      <td className="border-r border-slate-400 p-1"></td>
                      <td className="border-r border-slate-400 p-1"></td>
                      <td className="p-1"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer stamp */}
            <div className="mt-4 pt-2 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
              <span>HortiGestão • Sistema de Gestão Operacional e Compras</span>
              <span>Impresso em: {new Date().toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
