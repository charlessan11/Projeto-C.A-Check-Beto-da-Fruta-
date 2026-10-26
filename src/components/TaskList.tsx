import React, { useState, useMemo } from 'react';
import {
  Plus,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  RotateCcw,
  Search,
  Filter,
  Check,
  Edit,
  Trash2,
  Lock,
  Printer,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Task, User, CategoriaTarefa, Prioridade, StatusTarefa } from '../types';
import { getTodayDateString } from '../services/storage';

interface TaskListProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onQuickComplete: (task: Task) => void;
  onStartTask: (taskId: string) => void;
  onReopenTask: (taskId: string) => void;
  onOpenPrintModal: () => void;
  onStartPomodoro?: (task: Task) => void;
  focusTwoMinute: boolean;
  setFocusTwoMinute: (focus: boolean) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  users,
  currentUser,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onQuickComplete,
  onStartTask,
  onReopenTask,
  onOpenPrintModal,
  onStartPomodoro,
  focusTwoMinute,
  setFocusTwoMinute,
}) => {
  const isAdmin = currentUser.perfil === 'Administrador';
  const today = getTodayDateString();

  // Filters state
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'hoje' | 'amanha' | 'todas'>('hoje');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>(
    isAdmin ? 'todos' : currentUser.id
  );
  const [statusFilter, setStatusFilter] = useState<'ativas' | 'concluidas' | 'todas'>('ativas');

  const usersMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  // Priority sorting helper: 1-Crítica first, then 2-Alta, 3-Média, 4-Baixa
  const priorityWeight = (p: Prioridade): number => {
    if (p.startsWith('1')) return 1;
    if (p.startsWith('2')) return 2;
    if (p.startsWith('3')) return 3;
    return 4;
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Date filter
      if (dateFilter === 'hoje' && task.dataProgramada !== today) return false;
      if (dateFilter === 'amanha') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        if (task.dataProgramada !== tomorrowStr) return false;
      }

      // Status filter
      if (statusFilter === 'ativas' && task.status === 'Concluída') return false;
      if (statusFilter === 'concluidas' && task.status !== 'Concluída') return false;

      // User filter (Operational users strictly see only their own assigned tasks as primary or auxiliary)
      const effectiveUserFilter = isAdmin ? selectedUserFilter : currentUser.id;
      if (
        effectiveUserFilter !== 'todos' &&
        task.responsavelId !== effectiveUserFilter &&
        task.auxiliarId !== effectiveUserFilter
      ) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'todas' && task.categoria !== selectedCategory) {
        return false;
      }

      // Search term
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = task.tituloAtividade.toLowerCase().includes(query);
        const matchesInstructions = task.instrucoesDetalhadas?.toLowerCase().includes(query);
        const resp = usersMap.get(task.responsavelId)?.nome.toLowerCase() || '';
        const matchesResp = resp.includes(query);
        if (!matchesTitle && !matchesInstructions && !matchesResp) return false;
      }

      return true;
    });
  }, [tasks, dateFilter, today, statusFilter, selectedUserFilter, selectedCategory, search, usersMap]);

  // Separate into 2 queues: 2 Minutos (Micro-Ações) and Atividades Padrão (Macro-Tarefas)
  const twoMinuteTasks = useMemo(() => {
    return filteredTasks
      .filter((t) => t.tipoTempo === '2 Minutos (Fazer na Transição)')
      .sort((a, b) => priorityWeight(a.prioridade) - priorityWeight(b.prioridade));
  }, [filteredTasks]);

  const standardTasks = useMemo(() => {
    return filteredTasks
      .filter((t) => t.tipoTempo !== '2 Minutos (Fazer na Transição)')
      .sort((a, b) => {
        // Pending/In Progress first, then sorted by priority weight
        if (a.status === 'Concluída' && b.status !== 'Concluída') return 1;
        if (a.status !== 'Concluída' && b.status === 'Concluída') return -1;
        return priorityWeight(a.prioridade) - priorityWeight(b.prioridade);
      });
  }, [filteredTasks]);

  const totalPendingTwoMin = tasks.filter(
    (t) =>
      t.dataProgramada === today &&
      t.status !== 'Concluída' &&
      t.tipoTempo === '2 Minutos (Fazer na Transição)'
  ).length;

  return (
    <div className="space-y-6">
      {/* Control Bar: Filters, Search, and Action Buttons */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Buscar por atividade, produto, instrução ou responsável..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-h-[44px] w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
            />
          </div>

          {/* Quick Date Filters */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setDateFilter('hoje')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                dateFilter === 'hoje'
                  ? 'bg-[#0a3821] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setDateFilter('amanha')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                dateFilter === 'amanha'
                  ? 'bg-[#0a3821] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Amanhã
            </button>
            <button
              onClick={() => setDateFilter('todas')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                dateFilter === 'todas'
                  ? 'bg-[#0a3821] text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas as Datas
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={onAddTask}
                className="min-h-[44px] flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0a3821] hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-300" />
                <span>Nova Atividade</span>
              </button>
            )}

            <button
              onClick={onOpenPrintModal}
              className="min-h-[44px] flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              title="Visualizar e Imprimir Folha do Dia para a Prancheta"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Imprimir Prancheta</span>
            </button>
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Status filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium"
            >
              <option value="ativas">Pendentes & Em Andamento</option>
              <option value="concluidas">Apenas Concluídas</option>
              <option value="todas">Todos os Status</option>
            </select>
          </div>

          {/* Sector / Category Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Setor:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium"
            >
              <option value="todas">Todos os Setores</option>
              <option value="Reposição de Banca">Reposição de Banca</option>
              <option value="Produção / Grab & Go">Produção / Grab & Go</option>
              <option value="Qualidade / Validade">Qualidade / Validade</option>
              <option value="Limpeza">Limpeza</option>
              <option value="Estoque">Estoque</option>
              <option value="Administrativo">Administrativo</option>
            </select>
          </div>

          {/* Responsible Filter (Only admins can view/switch between team members) */}
          {isAdmin ? (
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-medium">Responsável:</span>
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium cursor-pointer"
              >
                <option value="todos">Toda a Equipe</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} {u.id === currentUser.id ? '(Eu)' : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-950 font-bold rounded-lg border border-emerald-200 text-xs">
              <span className="text-emerald-700 font-medium">Minhas Atividades:</span>
              <span className="font-black text-emerald-950">{currentUser.nome}</span>
            </div>
          )}
        </div>
      </div>

      {/* GTD Highlight Section: Fila de 2 Minutos (Micro-Ações) */}
      <div
        className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 ${
          focusTwoMinute
            ? 'bg-amber-50/90 border-amber-400 ring-4 ring-amber-200'
            : 'bg-gradient-to-r from-amber-50/50 via-white to-amber-50/30 border-amber-200/80 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Fila de 2 Minutos (Micro-Ações GTD)
                </h2>
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                  {twoMinuteTasks.filter((t) => t.status !== 'Concluída').length} pendente(s)
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Ações ultrarrápidas de transição para executar imediatamente entre tarefas grandes (etiquetas, caixas, borrifador).
              </p>
            </div>
          </div>

          {focusTwoMinute && (
            <button
              onClick={() => setFocusTwoMinute(false)}
              className="text-xs font-semibold text-amber-800 bg-amber-200/70 hover:bg-amber-300 px-3 py-1.5 rounded-lg cursor-pointer self-start sm:self-auto"
            >
              Fechar Destaque GTD
            </button>
          )}
        </div>

        {twoMinuteTasks.length === 0 ? (
          <div className="text-center py-6 text-slate-500 bg-white/70 rounded-xl border border-dashed border-amber-200 text-xs">
            <Sparkles className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            Nenhuma micro-ação de 2 minutos pendente nos filtros selecionados. Loja organizada!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {twoMinuteTasks.map((task) => {
              const resp = usersMap.get(task.responsavelId);
              const isMine = task.responsavelId === currentUser.id;
              const isCompleted = task.status === 'Concluída';

              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isCompleted
                      ? 'bg-slate-50/80 border-slate-200 opacity-60'
                      : 'bg-white border-amber-200 hover:border-amber-400 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          task.prioridade.startsWith('1')
                            ? 'bg-rose-100 text-rose-700'
                            : task.prioridade.startsWith('2')
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {task.prioridade}
                      </span>

                      <span className="text-[11px] text-slate-500 font-medium">
                        {task.categoria}
                      </span>
                    </div>

                    <h3
                      className={`text-sm font-semibold text-slate-900 leading-snug ${
                        isCompleted ? 'line-through text-slate-500' : ''
                      }`}
                    >
                      {task.tituloAtividade}
                    </h3>

                    {task.instrucoesDetalhadas && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {task.instrucoesDetalhadas}
                      </p>
                    )}
                  </div>

                  {/* Footer of micro task */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          resp?.avatarCor || 'bg-slate-200'
                        }`}
                      >
                        {resp?.nome.charAt(0) || 'U'}
                      </div>
                      <span className="truncate max-w-[120px]">
                        {resp?.nome} {isMine ? '(Você)' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isCompleted ? (
                        <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Feito</span>
                          {isAdmin && (
                            <button
                              onClick={() => onReopenTask(task.id)}
                              className="text-slate-400 hover:text-slate-600 ml-1 p-1"
                              title="Reabrir"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => onQuickComplete(task)}
                          className="min-h-[44px] px-3.5 py-2 bg-[#0a3821] hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>Concluir (2 min)</span>
                        </button>
                      )}

                      {isAdmin && (
                        <div className="flex items-center">
                          <button
                            onClick={() => onEditTask(task)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                            title="Editar"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Queue: Atividades Padrão (Macro-Tarefas) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Atividades Padrão & Rotinas Principais</span>
            </h2>
            <p className="text-xs text-slate-500">
              Ordenadas por prioridade decrescente (Crítica &gt; Alta &gt; Média &gt; Baixa) conforme Matriz de Eisenhower.
            </p>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            {standardTasks.length} atividade(s)
          </span>
        </div>

        {standardTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium">Nenhuma atividade padrão encontrada com os filtros atuais.</p>
            {isAdmin && (
              <button
                onClick={onAddTask}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Cadastrar Nova Atividade
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {standardTasks.map((task) => {
              const resp = usersMap.get(task.responsavelId);
              const isMine = task.responsavelId === currentUser.id;
              const isCompleted = task.status === 'Concluída';
              const isInProgress = task.status === 'Em Andamento';

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCompleted
                      ? 'bg-slate-50/80 border-slate-200'
                      : isInProgress
                      ? 'bg-sky-50/40 border-sky-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      {/* Priority, Category, Status badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            task.prioridade.startsWith('1')
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : task.prioridade.startsWith('2')
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : task.prioridade.startsWith('3')
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {task.prioridade}
                        </span>

                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {task.categoria}
                        </span>

                        {isInProgress && (
                          <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-ping" />
                            Em Andamento
                          </span>
                        )}

                        {isCompleted && (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Concluída
                          </span>
                        )}

                        {task.incluirNaImpressao && (
                          <span
                            className="text-[10px] text-slate-400 flex items-center gap-1"
                            title="Espelhada no checklist impresso"
                          >
                            <Printer className="w-3 h-3 text-slate-400" />
                            Prancheta
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3
                        className={`text-base font-semibold text-slate-900 ${
                          isCompleted ? 'line-through text-slate-500' : ''
                        }`}
                      >
                        {task.tituloAtividade}
                      </h3>

                      {/* Instructions */}
                      {task.instrucoesDetalhadas && (
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                          {task.instrucoesDetalhadas}
                        </p>
                      )}

                      {/* Operational Notes / Completion Details */}
                      {task.observacaoOperacional && (
                        <div className="text-xs text-amber-900 bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-200 flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <strong>Obs da equipe:</strong> {task.observacaoOperacional}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right side actions & assignments */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:min-w-[170px] pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Assigned user avatar and name */}
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${
                            resp?.avatarCor || 'bg-slate-200'
                          }`}
                        >
                          {resp?.nome.charAt(0) || 'U'}
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs font-semibold text-slate-900 leading-tight">
                            {resp?.nome}
                            {task.auxiliarNome ? ` + ${task.auxiliarNome}` : ''}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {isMine
                              ? 'Você (Titular)'
                              : task.auxiliarId === currentUser.id
                              ? 'Você (Auxiliar)'
                              : resp?.cargoDescricao || resp?.setoresAtuacao?.split(',')[0]}
                          </p>
                        </div>
                      </div>

                      {/* Interactive Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap justify-end">
                        {!isCompleted ? (
                          <>
                            {onStartPomodoro && (
                              <button
                                onClick={() => onStartPomodoro(task)}
                                className="min-h-[44px] px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Iniciar Modo Pomodoro (25 min foco + 5 min GTD)"
                              >
                                <Clock className="w-4 h-4 text-slate-500" />
                                <span className="hidden md:inline">Pomodoro</span>
                              </button>
                            )}

                            {!isInProgress && (
                              <button
                                onClick={() => onStartTask(task.id)}
                                className="min-h-[44px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
                                title="Marcar como Em Andamento"
                              >
                                <Play className="w-3.5 h-3.5 fill-slate-800" />
                                <span>Iniciar</span>
                              </button>
                            )}

                            <button
                              onClick={() => onQuickComplete(task)}
                              className="min-h-[44px] px-4 py-2 bg-[#0a3821] hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                              title="Marcar como concluída e adicionar observação"
                            >
                              <Check className="w-4 h-4 text-emerald-300" />
                              <span>Concluir</span>
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-400 font-medium">
                              {task.concluidoPorNome && `Por: ${task.concluidoPorNome}`}
                            </span>
                            {isAdmin && (
                              <button
                                onClick={() => onReopenTask(task.id)}
                                className="text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer"
                                title="Reabrir atividade"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}

                        {isAdmin && (
                          <div className="flex items-center border-l border-slate-200 pl-1.5 ml-1">
                            <button
                              onClick={() => onEditTask(task)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Editar Atividade"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteTask(task.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Excluir Atividade"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {!isAdmin && (
                          <div
                            className="p-1 text-slate-300"
                            title="Edição estrutural e exclusão bloqueadas para o perfil operacional"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
