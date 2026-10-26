import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Download,
  Database,
  CloudCheck,
  CheckCircle2,
  Calendar,
  FileJson,
  RefreshCw,
  Clock,
  ShoppingCart,
  ClipboardList,
  AlertCircle,
  Eye,
  History,
  HardDrive,
  Users,
} from 'lucide-react';
import { Task, PurchaseItem, DailyRoutine, StoreSettings, User } from '../types';
import {
  generateDailyBackupPayload,
  downloadDailyBackupJson,
  saveDailyBackupToLocalStorage,
  sendDailyBackupToServer,
  getBackupHistory,
  getLatestBackupMeta,
  BackupHistoryEntry,
  filterTasksForDate,
  filterPurchasesForDate,
} from '../services/backupService';
import { getTodayDateString, loadUsers } from '../services/storage';

interface DailyBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  purchases: PurchaseItem[];
  routine: DailyRoutine | null;
  settings: StoreSettings;
  currentUser: User;
  onShowToast: (title: string, desc?: string) => void;
}

export const DailyBackupModal: React.FC<DailyBackupModalProps> = ({
  isOpen,
  onClose,
  tasks,
  purchases,
  routine,
  settings,
  currentUser,
  onShowToast,
}) => {
  const today = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [activeTab, setActiveTab] = useState<'resumo' | 'previa' | 'historico'>('resumo');
  const [isSyncing, setIsSyncing] = useState(false);
  const [serverStatus, setServerStatus] = useState<'conectado' | 'offline' | 'verificando'>('verificando');
  const [historyList, setHistoryList] = useState<BackupHistoryEntry[]>([]);

  const users = useMemo(() => loadUsers(), [isOpen]);
  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => map.set(u.id, u.nome));
    return map;
  }, [users]);

  useEffect(() => {
    if (isOpen) {
      setHistoryList(getBackupHistory());
      // Test server connection
      fetch('/api/state')
        .then((res) => (res.ok ? setServerStatus('conectado') : setServerStatus('offline')))
        .catch(() => setServerStatus('offline'));
    }
  }, [isOpen]);

  const latestMeta = useMemo(() => getLatestBackupMeta(), [isOpen, isSyncing]);

  const currentPayload = useMemo(() => {
    return generateDailyBackupPayload({
      targetDate: selectedDate,
      tasks,
      purchases,
      routine,
      settings,
      currentUser,
      tipo: 'Manual Administrador',
    });
  }, [selectedDate, tasks, purchases, routine, settings, currentUser]);

  if (!isOpen) return null;

  const handleDownloadJson = () => {
    const result = downloadDailyBackupJson({
      targetDate: selectedDate,
      tasks,
      purchases,
      routine,
      settings,
      currentUser,
    });

    setHistoryList(getBackupHistory());
    onShowToast(
      'Backup baixado com sucesso!',
      `Arquivo ${result.filename} gerado com ${result.totalAtividades} atividades e ${result.totalCompras} itens de compras.`
    );
  };

  const handleManualSyncNow = async () => {
    setIsSyncing(true);
    saveDailyBackupToLocalStorage(currentPayload);
    const serverRes = await sendDailyBackupToServer(currentPayload);
    setIsSyncing(false);

    if (serverRes.ok) {
      setServerStatus('conectado');
      setHistoryList(getBackupHistory());
      onShowToast(
        'Backup sincronizado com sucesso!',
        `Salvo no localStorage e no servidor (${serverRes.filename})`
      );
    } else {
      setHistoryList(getBackupHistory());
      onShowToast(
        'Backup salvo no navegador (localStorage)',
        `Servidor: ${serverRes.error || 'Não disponível'}`
      );
    }
  };

  const formatTimestamp = (iso?: string | null) => {
    if (!iso) return 'Pendente';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const dayTasks = currentPayload.atividadesDoDia;
  const dayPurchases = currentPayload.comprasDoDia;
  const resumo = currentPayload.metadados.resumo;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0 bg-gradient-to-r from-emerald-900 to-[#0a3d24] text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold border border-white/20">
              <Database className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Exportação &amp; Backup Diário (JSON)</h2>
                <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Gestão
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Salva automaticamente no localStorage e servidor com download direto em arquivo JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Status Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-emerald-950">Backup Automático Local</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[11px] text-emerald-800">
                  Salvo continuamente no <strong>localStorage</strong> a cada atividade concluída ou compra cadastrada.
                </p>
                <div className="text-[10px] text-emerald-700 font-mono pt-0.5">
                  Último: {formatTimestamp(latestMeta.lastAutoBackup || new Date().toISOString())}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                <CloudCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900">Backup no Servidor</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      serverStatus === 'conectado'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {serverStatus === 'conectado' ? 'Conectado (/api/backup)' : 'Sincronização Local'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Armazenamento persistente em disco (pasta <code>backups/</code>) com snapshot diário.
                </p>
                <div className="text-[10px] text-slate-500 font-mono pt-0.5">
                  Destino: <code>backup-betodafruta-{selectedDate}.json</code>
                </div>
              </div>
            </div>
          </div>

          {/* Date Selector & Action Bar */}
          <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-[#0a3d24]" />
              <div>
                <label className="block text-[11px] font-bold text-slate-700">Data do Relatório/Backup:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                />
              </div>
              {selectedDate === today && (
                <span className="bg-emerald-100 text-emerald-900 font-black text-[10px] px-2 py-0.5 rounded-full border border-emerald-300">
                  HOJE
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleManualSyncNow}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
                title="Forçar sincronização imediata no servidor e localStorage"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadJson}
                className="flex items-center gap-2 px-4 py-2 bg-[#0a3d24] hover:bg-[#09351e] text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
                title="Baixar arquivo JSON com todas as atividades e compras do dia"
              >
                <Download className="w-4 h-4 text-emerald-300" />
                <span>Baixar JSON do Dia</span>
              </button>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('resumo')}
              className={`px-3 py-1.5 font-bold text-xs border-b-2 cursor-pointer transition-colors ${
                activeTab === 'resumo'
                  ? 'border-[#0a3d24] text-[#0a3d24]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Resumo do Dia ({selectedDate})
            </button>
            <button
              onClick={() => setActiveTab('previa')}
              className={`px-3 py-1.5 font-bold text-xs border-b-2 cursor-pointer transition-colors ${
                activeTab === 'previa'
                  ? 'border-[#0a3d24] text-[#0a3d24]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Prévia do JSON ({dayTasks.length + dayPurchases.length} itens)
            </button>
            <button
              onClick={() => setActiveTab('historico')}
              className={`px-3 py-1.5 font-bold text-xs border-b-2 cursor-pointer transition-colors ${
                activeTab === 'historico'
                  ? 'border-[#0a3d24] text-[#0a3d24]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Histórico de Backups ({historyList.length})
            </button>
          </div>

          {/* Tab 1: Resumo do Dia */}
          {activeTab === 'resumo' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Atividades
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    {resumo.totalAtividadesDia}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold">
                    {resumo.atividadesConcluidasDia} concluídas ({resumo.taxaConclusaoAtividades})
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Itens de Compra
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    {resumo.totalItensComprasDia}
                  </div>
                  <div className="text-[10px] text-blue-700 font-semibold">
                    {resumo.itensRecebidos} recebidos
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Reposição em Banca
                  </div>
                  <div className="text-xl font-black text-emerald-800 mt-0.5">
                    {resumo.itensReposicaoConcluida}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold">
                    Concluídas na loja
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Equipe no Dia
                  </div>
                  <div className="text-xl font-black text-indigo-800 mt-0.5">
                    {resumo.colaboradoresComAtividade.length}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold">
                    Colaboradores
                  </div>
                </div>
              </div>

              {/* Atividades list preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <ClipboardList className="w-4 h-4 text-[#0a3d24]" />
                    <span>Atividades &amp; Rotinas Incluídas ({dayTasks.length})</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Rotinas obrigatórias + Tarefas operacionais
                  </span>
                </div>
                <div className="max-h-44 overflow-y-auto divide-y divide-slate-100">
                  {dayTasks.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">
                      Nenhuma atividade registrada para esta data.
                    </div>
                  ) : (
                    dayTasks.map((t) => (
                      <div key={t.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              t.status === 'Concluída' ? 'text-emerald-600' : 'text-slate-300'
                            }`}
                          />
                          <div>
                            <span className="font-semibold text-slate-800">{t.tituloAtividade}</span>
                            <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                              {t.categoria}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-[11px]">
                          <span className="font-bold text-slate-700">
                            {t.concluidoPorNome || userMap.get(t.responsavelId) || 'Equipe'}
                          </span>
                          <span
                            className={`ml-2 font-bold ${
                              t.status === 'Concluída' ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Compras list preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <ShoppingCart className="w-4 h-4 text-[#0a3d24]" />
                    <span>Compras &amp; Reposição ({dayPurchases.length})</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Chegada Ceasa / Fornecedores e conferência
                  </span>
                </div>
                <div className="max-h-44 overflow-y-auto divide-y divide-slate-100">
                  {dayPurchases.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">
                      Nenhum item de compra registrado.
                    </div>
                  ) : (
                    dayPurchases.map((p) => (
                      <div key={p.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <span className="font-bold text-slate-800">{p.produto}</span>
                          <span className="ml-2 text-slate-500 font-mono text-[10px]">
                            {p.quantidadePedida || '—'}
                          </span>
                          <span className="ml-2 text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
                            {p.fornecedor || 'Ceasa'}
                          </span>
                        </div>
                        <div className="text-right text-[11px] flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                              p.mercadoriaRecebida
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.mercadoriaRecebida ? 'Recebido' : 'Pendente'}
                          </span>
                          {p.reposicaoConcluida && (
                            <span className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-blue-800">
                              Na Banca
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

          {/* Tab 2: Prévia do JSON */}
          {activeTab === 'previa' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <FileJson className="w-4 h-4 text-emerald-700" />
                  <span>Conteúdo formatado que será exportado para o arquivo JSON</span>
                </div>
                <span className="font-mono text-[10px]">
                  Tamanho estimado: ~{Math.round(JSON.stringify(currentPayload).length / 1024)} KB
                </span>
              </div>
              <pre className="bg-slate-900 text-emerald-300 p-4 rounded-xl font-mono text-[11px] max-h-80 overflow-y-auto overflow-x-auto leading-relaxed border border-slate-800">
                {JSON.stringify(currentPayload, null, 2)}
              </pre>
            </div>
          )}

          {/* Tab 3: Histórico de Backups Salvos */}
          {activeTab === 'historico' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>Últimos backups gerados e salvos no histórico</span>
                <span className="font-semibold text-emerald-800">Total: {historyList.length} registros</span>
              </div>

              {historyList.length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-8 text-center text-slate-400 border border-slate-200">
                  <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600">Nenhum backup registrado no histórico ainda.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ao sincronizar ou baixar, os registros aparecerão aqui para download rápido.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white max-h-72 overflow-y-auto">
                  {historyList.map((entry, idx) => (
                    <div
                      key={`${entry.dataBackup}-${entry.timestamp}-${idx}`}
                      className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{entry.dataBackup}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                            {entry.tipo}
                          </span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
                            {entry.origem}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>
                            {entry.totalAtividades} atividades ({entry.taxaConclusao})
                          </span>
                          <span>•</span>
                          <span>{entry.totalCompras} itens compras</span>
                          <span>•</span>
                          <span className="font-mono">{formatTimestamp(entry.timestamp)}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(entry.dataBackup);
                          handleDownloadJson();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                        title="Baixar JSON deste backup"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Baixar</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 rounded-b-2xl flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Administrador ativo: <strong className="text-slate-800">{currentUser.nome}</strong> ({currentUser.perfil})
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
            >
              Fechar
            </button>
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-2 px-4 py-2 bg-[#0a3d24] hover:bg-[#09351e] text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>Baixar Arquivo JSON ({selectedDate})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
