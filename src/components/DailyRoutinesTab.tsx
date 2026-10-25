import React, { useState } from 'react';
import {
  DailyRoutine,
  RoutineExpositorAssignment,
  RoutineLimpezaItem,
  RoutineFreezerItem,
  User,
} from '../types';
import {
  rerollAtendenteBalcao,
  setAtendenteBalcao,
  updateRoutineCounter,
  updateAguaDeCocoLitros,
  swapAguaDeCocoResponsavel,
  toggleAguaDeCocoEtapa,
  addExpositorRoutine,
  deleteExpositorRoutine,
  addLimpezaRoutine,
  deleteLimpezaRoutine,
  addFreezerRoutineItem,
  deleteFreezerRoutineItem,
  toggleFreezerRoutineItem,
  saveDailyRoutine,
} from '../services/routineEngine';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Shuffle,
  RefreshCw,
  Printer,
  Calendar,
  AlertTriangle,
  Flame,
  Droplets,
  Truck,
  ShoppingCart,
  Thermometer,
  Brush,
  Store,
  Layers,
  UserCheck,
  Award,
  ShieldCheck,
  Plus,
  Trash2,
  X,
  CheckSquare,
  Square,
  Scissors,
} from 'lucide-react';

interface DailyRoutinesTabProps {
  routine: DailyRoutine;
  onUpdateRoutine: (updated: DailyRoutine) => void;
  users: User[];
  currentUser: User | null;
  onOpenPrintModal: () => void;
  onNavigateToPurchases: () => void;
  onSyncWithTasks: () => void;
}

export const DailyRoutinesTab: React.FC<DailyRoutinesTabProps> = ({
  routine,
  onUpdateRoutine,
  users,
  currentUser,
  onOpenPrintModal,
  onNavigateToPurchases,
  onSyncWithTasks,
}) => {
  const isAdmin = currentUser?.perfil === 'Administrador';
  const [coconutInput, setCoconutInput] = useState<number>(routine.aguaDeCoco.litrosProduzidos || 0);

  // Admin inline form states: Expositor
  const [showAddExpositor, setShowAddExpositor] = useState(false);
  const [newExpositorNome, setNewExpositorNome] = useState('');
  const [newExpositorRespId, setNewExpositorRespId] = useState(users[0]?.id || 'USR-04');
  const [newExpositorAuxId, setNewExpositorAuxId] = useState('');
  const [newExpositorObs, setNewExpositorObs] = useState('');

  // Admin inline form states: Limpeza
  const [showAddLimpeza, setShowAddLimpeza] = useState(false);
  const [newLimpezaArea, setNewLimpezaArea] = useState('');
  const [newLimpezaRespId, setNewLimpezaRespId] = useState(users[0]?.id || 'USR-09');

  // Admin inline form states: Freezer
  // Admin inline form states: Freezer Atividades
  const [showAddFreezer, setShowAddFreezer] = useState(false);
  const [newFreezerAtividade, setNewFreezerAtividade] = useState('');
  const [newFreezerTemp, setNewFreezerTemp] = useState('');
  const [newFreezerRespId, setNewFreezerRespId] = useState(
    users.find((u) => u.nome.includes('Vanessa'))?.id || users[0]?.id || 'USR-08'
  );

  // Active freezer activities list (focus on inspection activities, not appliances)
  const freezerItems: RoutineFreezerItem[] =
    routine.freezers.atividades && routine.freezers.atividades.length > 0
      ? routine.freezers.atividades
      : routine.freezers.itens && routine.freezers.itens.length > 0
      ? routine.freezers.itens
      : [
          {
            id: 'FRZ-ATV-01',
            atividade: 'Aferição de temperatura dos freezers e termômetro digital (-18°C)',
            nome: 'Aferição de temperatura dos freezers e termômetro digital (-18°C)',
            responsavelId: routine.freezers.responsavelId || 'USR-08',
            responsavelNome: routine.freezers.responsavelNome || 'Vanessa',
            temperaturaAferida: '-18°C',
            concluido: routine.freezers.concluido,
          },
          {
            id: 'FRZ-ATV-02',
            atividade: 'Conferência de datas de validade das polpas de frutas e congelados',
            nome: 'Conferência de datas de validade das polpas de frutas e congelados',
            responsavelId: routine.freezers.responsavelId || 'USR-08',
            responsavelNome: routine.freezers.responsavelNome || 'Vanessa',
            concluido: routine.freezers.concluido,
          },
          {
            id: 'FRZ-ATV-03',
            atividade: 'Organização dos produtos por lote e rotação (PEPS / Primeiro que Vence)',
            nome: 'Organização dos produtos por lote e rotação (PEPS / Primeiro que Vence)',
            responsavelId: routine.freezers.responsavelId || 'USR-08',
            responsavelNome: routine.freezers.responsavelNome || 'Vanessa',
            concluido: routine.freezers.concluido,
          },
          {
            id: 'FRZ-ATV-04',
            atividade: 'Checagem de vedação das borrachas e inspeção de acúmulo de gelo',
            nome: 'Checagem de vedação das borrachas e inspeção de acúmulo de gelo',
            responsavelId: routine.freezers.responsavelId || 'USR-08',
            responsavelNome: routine.freezers.responsavelNome || 'Vanessa',
            concluido: routine.freezers.concluido,
          },
        ];

  // Calculate overall completion stats
  const totalItems =
    1 + // contagem
    routine.expositores.length +
    1 + // balcao
    routine.limpezas.length +
    freezerItems.length +
    1 + // kombi
    1 + // agua coco
    1; // lista compras

  let completedItems = 0;
  if (routine.contagemConcluida) completedItems++;
  routine.expositores.forEach((e) => e.concluido && completedItems++);
  if (routine.atendimentoBalcao.concluido) completedItems++;
  routine.limpezas.forEach((l) => l.concluido && completedItems++);
  freezerItems.forEach((f) => f.concluido && completedItems++);
  if (routine.descargaKombi.concluido) completedItems++;
  if (routine.aguaDeCoco.concluido) completedItems++;
  if (routine.listaCompras.concluido) completedItems++;

  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Format date in PT-BR
  const formattedDate = new Date(routine.data + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // ================= HANDLERS =================
  const handleToggleExpositor = (index: number) => {
    const updated = { ...routine };
    updated.expositores = [...updated.expositores];
    updated.expositores[index] = {
      ...updated.expositores[index],
      concluido: !updated.expositores[index].concluido,
    };
    updated.atualizadoEm = new Date().toISOString();
    onUpdateRoutine(updated);
    saveDailyRoutine(updated);
  };

  const handleToggleLimpeza = (id: string) => {
    const updated = {
      ...routine,
      limpezas: routine.limpezas.map((l) => (l.id === id ? { ...l, concluido: !l.concluido } : l)),
      atualizadoEm: new Date().toISOString(),
    };
    onUpdateRoutine(updated);
    saveDailyRoutine(updated);
  };

  const handleToggleContagem = () => {
    const updated = {
      ...routine,
      contagemConcluida: !routine.contagemConcluida,
      atualizadoEm: new Date().toISOString(),
    };
    onUpdateRoutine(updated);
    saveDailyRoutine(updated);
  };

  const handleChangeCounter = (counterId: string) => {
    const userObj = users.find((u) => u.id === counterId) || { nome: 'Charles' };
    const updated = updateRoutineCounter(routine, counterId, userObj.nome);
    onUpdateRoutine(updated);
  };

  // Balcão Handlers
  const handleRerollBalcao = () => {
    const updated = rerollAtendenteBalcao(routine);
    onUpdateRoutine(updated);
  };

  const handleSelectBalcaoUser = (userId: string) => {
    const selectedUser = users.find((u) => u.id === userId);
    if (!selectedUser) return;
    const updated = setAtendenteBalcao(routine, selectedUser.id, selectedUser.nome);
    onUpdateRoutine(updated);
  };

  const handleToggleBalcao = () => {
    const updated = {
      ...routine,
      atendimentoBalcao: {
        ...routine.atendimentoBalcao,
        concluido: !routine.atendimentoBalcao.concluido,
      },
      atualizadoEm: new Date().toISOString(),
    };
    onUpdateRoutine(updated);
    saveDailyRoutine(updated);
  };

  // Freezers Handlers
  const handleToggleFreezersItem = (id: string) => {
    const updated = toggleFreezerRoutineItem(routine, id);
    onUpdateRoutine(updated);
  };

  // Kombi Handlers
  const handleToggleKombi = () => {
    const updated = {
      ...routine,
      descargaKombi: {
        ...routine.descargaKombi,
        concluido: !routine.descargaKombi.concluido,
      },
      atualizadoEm: new Date().toISOString(),
    };
    onUpdateRoutine(updated);
    saveDailyRoutine(updated);
  };

  const handleSwapKombiResponsavel = () => {
    const isLucas = routine.descargaKombi.responsavelId === 'USR-04';
    const next = isLucas
      ? { id: 'USR-05', nome: 'Rafael' }
      : { id: 'USR-04', nome: 'Lucas' };
    const updated = {
      ...routine,
      descargaKombi: {
        ...routine.descargaKombi,
        responsavelId: next.id,
        responsavelNome: next.nome,
      },
      atualizadoEm: new Date().toISOString(),
    };
    onUpdateRoutine(updated);
    saveDailyRoutine(updated);
  };

  // Água de Coco Handlers (Feito somente por 1 funcionário: Lucas ou Rafael)
  const handleSwapCocoResponsavel = () => {
    const updated = swapAguaDeCocoResponsavel(routine);
    onUpdateRoutine(updated);
  };

  const handleSaveCocoLitros = () => {
    const isDone = coconutInput >= routine.aguaDeCoco.metaMinLitros;
    const updated = updateAguaDeCocoLitros(routine, coconutInput, isDone);
    onUpdateRoutine(updated);
  };

  const handleToggleCocoSubEtapa = (etapa: 'garrafasEnvase' | 'corteERetiradaPolpa' | 'descarteLixoCocos') => {
    const updated = toggleAguaDeCocoEtapa(routine, etapa);
    onUpdateRoutine(updated);
  };

  // Lista Compras Handler
  const handleToggleListaCompras = () => {
    const updated = {
      ...routine,
      listaCompras: {
        ...routine.listaCompras,
        concluido: !routine.listaCompras.concluido,
      },
      atualizadoEm: new Date().toISOString(),
    };
    onUpdateRoutine(updated);
    saveDailyRoutine(updated);
  };

  // ================= ADMIN ADD / DELETE HANDLERS =================
  // Expositor
  const handleConfirmAddExpositor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpositorNome.trim()) return;
    const respUser = users.find((u) => u.id === newExpositorRespId) || users[0];
    const auxUser = users.find((u) => u.id === newExpositorAuxId);

    const updated = addExpositorRoutine(
      routine,
      newExpositorNome.trim(),
      respUser.id,
      respUser.nome,
      auxUser?.id,
      auxUser?.nome,
      newExpositorObs.trim() || undefined
    );
    onUpdateRoutine(updated);
    setNewExpositorNome('');
    setNewExpositorObs('');
    setShowAddExpositor(false);
  };

  const handleDeleteExpositor = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Excluir o setor/expositor "${key}" da rotina diária?`)) {
      const updated = deleteExpositorRoutine(routine, key);
      onUpdateRoutine(updated);
    }
  };

  // Limpeza
  const handleConfirmAddLimpeza = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLimpezaArea.trim()) return;
    const respUser = users.find((u) => u.id === newLimpezaRespId) || users[0];

    const updated = addLimpezaRoutine(routine, newLimpezaArea.trim(), respUser.id, respUser.nome);
    onUpdateRoutine(updated);
    setNewLimpezaArea('');
    setShowAddLimpeza(false);
  };

  const handleDeleteLimpeza = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Excluir esta área de limpeza da rotina diária?')) {
      const updated = deleteLimpezaRoutine(routine, id);
      onUpdateRoutine(updated);
    }
  };

  // Freezer Atividades
  const handleConfirmAddFreezer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFreezerAtividade.trim()) return;
    const respUser = users.find((u) => u.id === newFreezerRespId) || users[0];

    const updated = addFreezerRoutineItem(
      routine,
      newFreezerAtividade.trim(),
      respUser.id,
      respUser.nome,
      newFreezerTemp.trim() || undefined
    );
    onUpdateRoutine(updated);
    setNewFreezerAtividade('');
    setNewFreezerTemp('');
    setShowAddFreezer(false);
  };

  const handleDeleteFreezer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Excluir esta atividade de verificação dos freezers?')) {
      const updated = deleteFreezerRoutineItem(routine, id);
      onUpdateRoutine(updated);
    }
  };

  const cocoEtapas = routine.aguaDeCoco.etapas || {
    garrafasEnvase: routine.aguaDeCoco.litrosProduzidos >= routine.aguaDeCoco.metaMinLitros,
    corteERetiradaPolpa: false,
    descarteLixoCocos: false,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Date, Friday Alert, Progress & Quick Actions */}
      <div className="bg-[#0a3821] text-white rounded-2xl border border-emerald-950/40 p-5 sm:p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-900/90 text-emerald-100 border border-emerald-700/60">
                <Calendar className="w-3.5 h-3.5" />
                Rotina Diária Obrigatória
              </span>
              {routine.isSextaFeira && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-emerald-950 animate-pulse shadow-xs">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  Sexta-feira (Pico de Coco)
                </span>
              )}
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-emerald-100 border border-white/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  Modo Administrador
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white capitalize tracking-tight">
              {formattedDate}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
              Gestão de atividades, balanceamento justo e conformidade operacional do Hortifrúti Beto da Fruta
            </p>
          </div>

          {/* Quick Action Buttons (Large Touch Targets >= 44px) */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={onSyncWithTasks}
              type="button"
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs active:scale-[0.98] transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Sincronizar c/ Quadro
            </button>
            <button
              onClick={onOpenPrintModal}
              type="button"
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir Folha A4
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-5 pt-4 border-t border-emerald-800/60">
          <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
            <span className="font-bold text-emerald-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              Progresso Geral das Rotinas do Dia
            </span>
            <span className="font-mono font-bold text-white bg-emerald-900/90 border border-emerald-700/60 px-3 py-0.5 rounded-lg">
              {completedItems}/{totalItems} ({progressPct}%)
            </span>
          </div>
          <div className="w-full h-3 bg-emerald-950/70 rounded-full overflow-hidden p-0.5 border border-emerald-800/40">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-200 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Routine Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================= 1. REPOSIÇÃO DO HORTIFRÚTI & CONTAGEM ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  1. Reposição do Hortifrúti por Setores
                </h3>
                <p className="text-[11px] text-slate-500">
                  Divisão de bancas, contagem matinal e apoio mútuo
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowAddExpositor(!showAddExpositor)}
                type="button"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer"
                title="Adicionar novo setor ou expositor à rotina (Administrador)"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Setor
              </button>
            )}
          </div>

          {/* Admin Add Expositor Inline Form */}
          {isAdmin && showAddExpositor && (
            <form
              onSubmit={handleConfirmAddExpositor}
              className="p-3.5 bg-emerald-50/80 border border-emerald-300 rounded-xl space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Cadastrar Novo Setor / Expositor
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddExpositor(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nome da Banca / Setor *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Expositor D, Bancada Melancias"
                    value={newExpositorNome}
                    onChange={(e) => setNewExpositorNome(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Responsável Principal *
                  </label>
                  <select
                    value={newExpositorRespId}
                    onChange={(e) => setNewExpositorRespId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome} ({u.cargoDescricao || u.perfil})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Auxiliar (Opcional)
                  </label>
                  <select
                    value={newExpositorAuxId}
                    onChange={(e) => setNewExpositorAuxId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">Nenhum</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Observações Operacionais
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Foco em reposição contínua e precificação"
                    value={newExpositorObs}
                    onChange={(e) => setNewExpositorObs(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddExpositor(false)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 rounded-lg text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs cursor-pointer"
                >
                  Salvar Expositor
                </button>
              </div>
            </form>
          )}

          {/* Morning Counter Selector & Rule */}
          <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                Quem realizou a Contagem Matinal de Abertura?
              </label>
              <button
                onClick={handleToggleContagem}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  routine.contagemConcluida
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                }`}
              >
                {routine.contagemConcluida ? '✓ Contagem Feita' : 'Marcar Feita'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'USR-01', nome: 'Charles' },
                { id: 'USR-04', nome: 'Lucas' },
                { id: 'USR-05', nome: 'Rafael' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleChangeCounter(c.id)}
                  type="button"
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer ${
                    routine.responsavelContagemId === c.id
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {c.nome} {routine.responsavelContagemId === c.id ? '(Contou)' : ''}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-emerald-800 pt-1 leading-snug">
              ⚡ <strong>Regra do Hortifrúti:</strong> Quem faz a contagem (
              <strong>{routine.responsavelContagemNome}</strong>) fica responsável pela reposição do{' '}
              <strong>Expositor C</strong> e a <strong>Bianca auxilia</strong>. Os demais setores ficam divididos entre os outros funcionários.
            </p>
          </div>

          {/* Expositores List */}
          <div className="space-y-2.5">
            {routine.expositores.map((exp, idx) => (
              <div
                key={exp.id || exp.expositor}
                onClick={() => handleToggleExpositor(idx)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  exp.concluido
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                      exp.concluido
                        ? 'bg-emerald-600 text-white'
                        : 'border-2 border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    ✓
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{exp.expositor}</span>
                      {exp.expositor === 'Expositor C' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Contador + Bianca auxilia
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Responsável: <strong className="text-slate-800">{exp.responsavelNome}</strong>
                      {exp.auxiliarNome && (
                        <span>
                          {' '}
                          | Auxílio: <strong className="text-slate-800">{exp.auxiliarNome}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      exp.concluido
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {exp.concluido ? 'Abastecido' : 'Pendente'}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={(e) => handleDeleteExpositor(exp.id || exp.expositor, e)}
                      type="button"
                      title="Excluir este setor/expositor da rotina (Admin)"
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= 2. ATENDIMENTO AO BALCÃO (SORTEAR OU ESCOLHER ADMIN) ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                <Store className="w-5 h-5 text-emerald-800" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">2. Atendimento ao Balcão</h3>
                <p className="text-[11px] text-slate-500">
                  1 Responsável todos os dias — Além de repor, atende ao balcão
                </p>
              </div>
            </div>

            {/* Sorteio / Randomize button */}
            {isAdmin && (
              <button
                onClick={handleRerollBalcao}
                type="button"
                title="Sortear outro funcionário disponível aleatoriamente"
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Shuffle className="w-4 h-4 text-emerald-700" />
                Sortear
              </button>
            )}
          </div>

          {/* Admin Selection Controls for Atendente Balcão */}
          {isAdmin ? (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Escolha do Atendente (Controle do Administrador)
                </label>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  Manual ou sorteio
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <select
                  value={routine.atendimentoBalcao.responsavelId}
                  onChange={(e) => handleSelectBalcaoUser(e.target.value)}
                  className="min-h-[44px] flex-1 text-xs font-bold text-slate-900 bg-white border border-emerald-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome} — {u.cargoDescricao || u.perfil}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleRerollBalcao}
                  type="button"
                  className="min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-900 bg-white hover:bg-emerald-50 border border-emerald-300 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Shuffle className="w-4 h-4 text-emerald-700" />
                  Sortear Aleatório
                </button>
              </div>

              {/* Quick Staff Shortcuts */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
                <span className="text-[11px] font-semibold text-emerald-900">Atalhos rápidos:</span>
                {users.slice(0, 5).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectBalcaoUser(u.id)}
                    className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      routine.atendimentoBalcao.responsavelId === u.id
                        ? 'bg-[#0a3821] text-white border-[#0a3821]'
                        : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    {u.nome.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Designação do Atendimento:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                Definido pela Administração
              </span>
            </div>
          )}

          {/* Active Attendant Card (Large touch target >= 56px) */}
          <div
            onClick={handleToggleBalcao}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.99] ${
              routine.atendimentoBalcao.concluido
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-white border-[#0a3821] shadow-xs hover:bg-emerald-50/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Responsável Ativo no Balcão Hoje
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  routine.atendimentoBalcao.concluido
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-[#0a3821] text-white'
                }`}
              >
                {routine.atendimentoBalcao.concluido ? '✓ Atendimento Concluído' : 'Em Atendimento'}
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#0a3821] text-white font-black text-lg flex items-center justify-center shadow-xs shrink-0">
                {routine.atendimentoBalcao.responsavelNome.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {routine.atendimentoBalcao.responsavelNome}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Dupla atribuição: Realiza atendimento cordial aos clientes no balcão e faz reposição contínua.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">
              📌 Regra Operacional: Atendimento & Reposição
            </p>
            <p>
              O funcionário no balcão não fica ocioso quando o movimento abaixar. Ele abastece a área próxima e se reveza se necessário com suporte da Bianca ou Charles.
            </p>
          </div>
        </div>

        {/* ================= 3. LIMPEZA DIÁRIA DOS SETORES ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                <Brush className="w-5 h-5 text-emerald-800" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">3. Limpeza Diária de Setores</h3>
                <p className="text-[11px] text-slate-500">
                  Rita (circulação, produção, banheiros, estoque, lavagem) e Bianca (caixa, balcão)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900">
                {routine.limpezas.filter((l) => l.concluido).length}/{routine.limpezas.length} Feitos
              </span>
              {isAdmin && (
                <button
                  onClick={() => setShowAddLimpeza(!showAddLimpeza)}
                  type="button"
                  className="min-h-[40px] inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 active:scale-[0.98] transition-all cursor-pointer"
                  title="Adicionar nova área de limpeza (Administrador)"
                >
                  <Plus className="w-4 h-4 text-emerald-700" />
                  Adicionar Área
                </button>
              )}
            </div>
          </div>

          {/* Admin Add Limpeza Inline Form */}
          {isAdmin && showAddLimpeza && (
            <form
              onSubmit={handleConfirmAddLimpeza}
              className="p-3.5 bg-emerald-50/80 border border-emerald-300 rounded-xl space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Cadastrar Nova Área de Limpeza
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddLimpeza(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nome da Área *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Calçada Externa, Câmara Fria"
                    value={newLimpezaArea}
                    onChange={(e) => setNewLimpezaArea(e.target.value)}
                    className="min-h-[40px] w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Responsável *
                  </label>
                  <select
                    value={newLimpezaRespId}
                    onChange={(e) => setNewLimpezaRespId(e.target.value)}
                    className="min-h-[40px] w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome} ({u.cargoDescricao || u.perfil})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddLimpeza(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-bold bg-[#0a3821] text-white hover:bg-emerald-800 shadow-xs active:scale-[0.98] cursor-pointer"
                >
                  Salvar Área
                </button>
              </div>
            </form>
          )}

          {/* Limpezas List (Large touch targets >= 44px) */}
          <div className="space-y-2">
            {routine.limpezas.map((lmp) => (
              <div
                key={lmp.id}
                onClick={() => handleToggleLimpeza(lmp.id)}
                className={`min-h-[46px] p-3 rounded-xl border transition-all cursor-pointer active:scale-[0.99] flex items-center justify-between gap-3 ${
                  lmp.concluido
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      lmp.concluido
                        ? 'bg-[#0a3821] text-white'
                        : 'border-2 border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    ✓
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900">{lmp.area}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-800">
                    {lmp.responsavelNome}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      lmp.concluido ? 'text-emerald-800 bg-emerald-100' : 'text-slate-500 bg-slate-100'
                    }`}
                  >
                    {lmp.concluido ? 'Limpo' : 'Pendente'}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={(e) => handleDeleteLimpeza(lmp.id, e)}
                      type="button"
                      title="Excluir esta área de limpeza (Admin)"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= 4. VERIFICAÇÃO DOS FREEZERS (GERENCIAMENTO DE ATIVIDADES) ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                <Thermometer className="w-5 h-5 text-emerald-800" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">4. Verificação dos Freezers — Atividades (Vanessa)</h3>
                <p className="text-[11px] text-slate-500">
                  Checklist diário de inspeção, controle de temperatura e qualidade dos congelados
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900">
                {freezerItems.filter((f) => f.concluido).length}/{freezerItems.length} Feitas
              </span>
              {isAdmin && (
                <button
                  onClick={() => setShowAddFreezer(!showAddFreezer)}
                  type="button"
                  className="min-h-[40px] inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 active:scale-[0.98] transition-all cursor-pointer"
                  title="Adicionar nova atividade de verificação dos freezers (Administrador)"
                >
                  <Plus className="w-4 h-4 text-emerald-700" />
                  Adicionar Atividade
                </button>
              )}
            </div>
          </div>

          {/* Admin Add Freezer Atividade Inline Form */}
          {isAdmin && showAddFreezer && (
            <form
              onSubmit={handleConfirmAddFreezer}
              className="p-3.5 bg-emerald-50/80 border border-emerald-300 rounded-xl space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Cadastrar Nova Atividade de Verificação dos Freezers
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddFreezer(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Atividade de Verificação *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Checagem de vedação e acúmulo de gelo"
                    value={newFreezerAtividade}
                    onChange={(e) => setNewFreezerAtividade(e.target.value)}
                    className="min-h-[40px] w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Parâmetro / Temperatura (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: -18°C ou Rotação PEPS"
                    value={newFreezerTemp}
                    onChange={(e) => setNewFreezerTemp(e.target.value)}
                    className="min-h-[40px] w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Responsável *
                  </label>
                  <select
                    value={newFreezerRespId}
                    onChange={(e) => setNewFreezerRespId(e.target.value)}
                    className="min-h-[40px] w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome} ({u.cargoDescricao || u.perfil})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddFreezer(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-bold bg-[#0a3821] text-white hover:bg-emerald-800 shadow-xs active:scale-[0.98] cursor-pointer"
                >
                  Salvar Atividade
                </button>
              </div>
            </form>
          )}

          {/* Freezer Activities List (Large touch targets >= 44px) */}
          <div className="space-y-2.5">
            {freezerItems.map((frz) => (
              <div
                key={frz.id}
                onClick={() => handleToggleFreezersItem(frz.id)}
                className={`min-h-[48px] p-3.5 rounded-xl border transition-all cursor-pointer active:scale-[0.99] flex items-center justify-between gap-3 ${
                  frz.concluido
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      frz.concluido
                        ? 'bg-[#0a3821] text-white'
                        : 'border-2 border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">{frz.atividade || frz.nome}</h4>
                    <p className="text-[11px] text-slate-600">
                      Responsável: <strong className="text-slate-800">{frz.responsavelNome}</strong>
                      {frz.observacoes && ` • ${frz.observacoes}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {frz.temperaturaAferida && (
                    <span className="text-xs font-mono font-bold text-emerald-950 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded">
                      {frz.temperaturaAferida}
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      frz.concluido
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {frz.concluido ? '✓ Realizada' : 'Pendente'}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={(e) => handleDeleteFreezer(frz.id, e)}
                      type="button"
                      title="Excluir esta atividade da verificação dos freezers (Admin)"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= 5. CONFERÊNCIA E DESCARGA DA KOMBI ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5 text-emerald-800" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  5. Conferência &amp; Descarga da Kombi
                </h3>
                <p className="text-[11px] text-slate-500">Alternância entre Lucas ou Rafael</p>
              </div>
            </div>
            <button
              onClick={handleSwapKombiResponsavel}
              type="button"
              className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 active:scale-[0.98] transition-all inline-flex items-center gap-1 cursor-pointer"
            >
              Trocar: {routine.descargaKombi.responsavelNome === 'Lucas' ? 'Rafael' : 'Lucas'}
            </button>
          </div>

          <div
            onClick={handleToggleKombi}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.99] ${
              routine.descargaKombi.concluido
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-white border-[#0a3821] shadow-xs hover:bg-emerald-50/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                    routine.descargaKombi.concluido
                      ? 'bg-[#0a3821] text-white'
                      : 'border-2 border-slate-300 bg-white text-transparent'
                  }`}
                >
                  ✓
                </div>
                <span className="font-bold text-xs sm:text-sm text-slate-900">
                  Responsável: {routine.descargaKombi.responsavelNome}
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  routine.descargaKombi.concluido
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-[#0a3821] text-white'
                }`}
              >
                {routine.descargaKombi.concluido ? '✓ Descarregada' : 'Aguardando Chegada'}
              </span>
            </div>
            <p className="text-xs text-slate-600 pl-8">
              Conferir caixas descarregadas da Kombi com a nota de entrega, triar frutas sensíveis e levar para a área de higienização ou bancas.
            </p>
          </div>
        </div>

        {/* ================= 6. PRODUÇÃO DE ÁGUA DE COCO (FEITO SOMENTE POR 1 FUNCIONÁRIO: LUCAS OU RAFAEL) ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                <Droplets className="w-5 h-5 text-emerald-800" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  6. Produção de Água de Coco (Lucas OU Rafael)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Feito somente por 1 funcionário no dia — ou Lucas ou Rafael, nunca os dois
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSwapCocoResponsavel}
                type="button"
                title="Alternar responsável único pelo coco hoje"
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5 text-emerald-700" />
                Alternar: {(routine.aguaDeCoco.responsavelNome || routine.aguaDeCoco.responsavelPrincipalNome) === 'Lucas' ? 'Passar p/ Rafael' : 'Passar p/ Lucas'}
              </button>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black ${
                  routine.isSextaFeira
                    ? 'bg-amber-400 text-emerald-950 animate-pulse'
                    : 'bg-[#0a3821] text-white'
                }`}
              >
                Meta: {routine.aguaDeCoco.metaMinLitros} a {routine.aguaDeCoco.metaMaxLitros}L
              </span>
            </div>
          </div>

          {/* Operational Rule Notice */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              <span>
                <strong>Regra Operacional:</strong> A produção é feita exclusivamente por{' '}
                <strong>1 funcionário</strong> (ou Lucas ou Rafael, nunca os dois no mesmo dia).
              </span>
            </div>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-950 bg-white border border-emerald-300 px-3 py-1.5 rounded-xl text-xs shrink-0 self-start sm:self-auto shadow-2xs">
              Responsável Único Hoje:{' '}
              <strong className="text-emerald-800">
                {routine.aguaDeCoco.responsavelNome || routine.aguaDeCoco.responsavelPrincipalNome}
              </strong>
            </span>
          </div>

          {/* Target, Liters Input and Save */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                Escalado Hoje:{' '}
                <strong className="text-[#0a3821]">
                  {routine.aguaDeCoco.responsavelNome || routine.aguaDeCoco.responsavelPrincipalNome}
                </strong>{' '}
                (Atribuição Individual)
              </span>
              <span className="font-mono text-emerald-800 font-bold">
                {coconutInput >= routine.aguaDeCoco.metaMinLitros ? '✓ Meta de Litros Atingida' : 'Em Produção'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  max="150"
                  value={coconutInput}
                  onChange={(e) => setCoconutInput(Number(e.target.value))}
                  className="min-h-[44px] w-full pl-3.5 pr-14 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Litros produzidos"
                />
                <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                  Litros
                </span>
              </div>
              <button
                onClick={handleSaveCocoLitros}
                type="button"
                className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0a3821] hover:bg-emerald-800 text-white shadow-xs active:scale-[0.98] transition-all cursor-pointer shrink-0"
              >
                Salvar Litragem
              </button>
            </div>

            {/* 3 MANDATORY STAGES CHECKLIST (Large touch targets >= 48px) */}
            <div className="pt-2 border-t border-slate-200 space-y-2.5">
              <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider block">
                Atividades Obrigatórias do Processo de Coco:
              </span>

              {/* Etapa 1: Produção na Garrafa */}
              <div
                onClick={() => handleToggleCocoSubEtapa('garrafasEnvase')}
                className={`min-h-[50px] p-3 rounded-xl border transition-all cursor-pointer active:scale-[0.99] flex items-center justify-between gap-3 ${
                  cocoEtapas.garrafasEnvase
                    ? 'bg-emerald-50/80 border-emerald-300'
                    : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      cocoEtapas.garrafasEnvase
                        ? 'bg-[#0a3821] text-white'
                        : 'border-2 border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    ✓
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      1. Produção de água de coco na garrafa
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Envase limpo, lacre e refrigeração imediata ({routine.aguaDeCoco.metaMinLitros} a {routine.aguaDeCoco.metaMaxLitros} Litros).
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    cocoEtapas.garrafasEnvase ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {cocoEtapas.garrafasEnvase ? '✓ Concluído' : 'Pendente'}
                </span>
              </div>

              {/* Etapa 2: Corte e Retirada da Polpa */}
              <div
                onClick={() => handleToggleCocoSubEtapa('corteERetiradaPolpa')}
                className={`min-h-[50px] p-3 rounded-xl border transition-all cursor-pointer active:scale-[0.99] flex items-center justify-between gap-3 ${
                  cocoEtapas.corteERetiradaPolpa
                    ? 'bg-emerald-50/80 border-emerald-300'
                    : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      cocoEtapas.corteERetiradaPolpa
                        ? 'bg-[#0a3821] text-white'
                        : 'border-2 border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    ✓
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      2. Cortes de coco para retirada da polpa
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Corte cuidadoso dos cocos, raspagem e acondicionamento da polpa fresca/congelada.
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    cocoEtapas.corteERetiradaPolpa ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {cocoEtapas.corteERetiradaPolpa ? '✓ Concluído' : 'Pendente'}
                </span>
              </div>

              {/* Etapa 3: Jogar o Lixo dos Cocos */}
              <div
                onClick={() => handleToggleCocoSubEtapa('descarteLixoCocos')}
                className={`min-h-[50px] p-3 rounded-xl border transition-all cursor-pointer active:scale-[0.99] flex items-center justify-between gap-3 ${
                  cocoEtapas.descarteLixoCocos
                    ? 'bg-emerald-50/80 border-emerald-300'
                    : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      cocoEtapas.descarteLixoCocos
                        ? 'bg-[#0a3821] text-white'
                        : 'border-2 border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    ✓
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      3. Jogar o lixo dos cocos e limpeza da bancada
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Recolhimento imediato das cascas para a caçamba/lixo e higienização do chão/mesa.
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    cocoEtapas.descarteLixoCocos ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {cocoEtapas.descarteLixoCocos ? '✓ Concluído' : 'Pendente'}
                </span>
              </div>
            </div>

            {/* Fair balance meter */}
            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-emerald-950 font-bold">
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-emerald-700" />
                  Equilíbrio Lucas vs Rafael
                </span>
                <span className="text-slate-600">Ninguém faz mais que o outro</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                  <span>Lucas:</span>
                  <span className="font-bold text-[#0a3821] font-mono text-sm">
                    {routine.aguaDeCoco.saldoLucasLitros}L
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                  <span>Rafael:</span>
                  <span className="font-bold text-[#0a3821] font-mono text-sm">
                    {routine.aguaDeCoco.saldoRafaelLitros}L
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 7. LISTA DE COMPRAS (CHARLES) ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">7. Lista de Compras Diária</h3>
                <p className="text-[11px] text-slate-500">
                  Responsável: Charles (Levantamento de estoque e pedidos de reposição)
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Charles
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-start gap-3">
              <div
                onClick={handleToggleListaCompras}
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer shrink-0 mt-0.5 ${
                  routine.listaCompras.concluido
                    ? 'bg-emerald-600 text-white'
                    : 'border-2 border-slate-300 bg-white text-transparent'
                }`}
              >
                ✓
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">
                  Fechar Checagem de Faltas no Salão e Estoque
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Conferir as bancas esvaziando, preencher os itens na tabela de Compras/Reposição e enviar quantidades necessárias para compra.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleToggleListaCompras}
                type="button"
                className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  routine.listaCompras.concluido
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {routine.listaCompras.concluido ? '✓ Lista Finalizada' : 'Marcar Fechada'}
              </button>
              <button
                onClick={onNavigateToPurchases}
                type="button"
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Ir para Compras & Reposição
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
