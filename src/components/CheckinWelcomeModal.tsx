import React from 'react';
import {
  Sun,
  X,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Clock,
  Printer,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Layers,
} from 'lucide-react';
import { User, Task, PurchaseItem, StoreSettings } from '../types';

interface CheckinWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  settings: StoreSettings;
  todayTasks: Task[];
  purchases: PurchaseItem[];
  onOpenPrintModal: () => void;
  onConfirmCheckin: () => void;
}

export const CheckinWelcomeModal: React.FC<CheckinWelcomeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  settings,
  todayTasks,
  purchases,
  onOpenPrintModal,
  onConfirmCheckin,
}) => {
  if (!isOpen) return null;

  // Filter tasks
  const criticalTasks = todayTasks.filter(
    (t) => t.status !== 'Concluída' && t.prioridade.startsWith('1')
  );
  const twoMinTasks = todayTasks.filter(
    (t) => t.status !== 'Concluída' && t.tipoTempo === '2 Minutos (Fazer na Transição)'
  );
  const highPriorityTasks = todayTasks.filter(
    (t) => t.status !== 'Concluída' && t.prioridade.startsWith('2') && t.tipoTempo !== '2 Minutos (Fazer na Transição)'
  );
  const todayPurchases = purchases.filter((p) => !p.reposicaoConcluida);

  const totalPending = todayTasks.filter((t) => t.status !== 'Concluída').length;

  // Current time
  const now = new Date();
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-emerald-200 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sun className="w-7 h-7 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Bom dia, {currentUser.nome.split(' ')[0]}!
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Check-in Matinal
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentUser.nome} • {currentUser.perfil} ({currentUser.cargoDescricao || currentUser.setoresAtuacao})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Check-in time info bar */}
        <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>
              Horário Configurado de Check-in: <strong>{settings.horarioCheckinMatinal || '07:00'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Horário do Acesso:</span>
            <span className="font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-900">
              {currentTimeStr}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Confirmado
            </span>
          </div>
        </div>

        {/* Motivational Greeting Banner */}
        {settings.mensagemBoasVindas && (
          <div className="mt-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-900">Orientação do Encarregado:</strong>{' '}
              {settings.mensagemBoasVindas}
            </div>
          </div>
        )}

        {/* Resumo de Prioridades do Dia */}
        <div className="mt-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Resumo de Prioridades de Hoje</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {totalPending} tarefa(s) pendentes hoje
            </span>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
              <div className="text-rose-700 font-extrabold text-lg">{criticalTasks.length}</div>
              <div className="text-[11px] font-semibold text-rose-900 leading-tight">Críticas (Imediato)</div>
            </div>

            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
              <div className="text-amber-700 font-extrabold text-lg">{twoMinTasks.length}</div>
              <div className="text-[11px] font-semibold text-amber-900 leading-tight">Micro-Ações (2 min)</div>
            </div>

            <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-200">
              <div className="text-sky-700 font-extrabold text-lg">{highPriorityTasks.length}</div>
              <div className="text-[11px] font-semibold text-sky-900 leading-tight">Alta Prioridade</div>
            </div>

            <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200">
              <div className="text-purple-700 font-extrabold text-lg">{todayPurchases.length}</div>
              <div className="text-[11px] font-semibold text-purple-900 leading-tight">Compras do Dia</div>
            </div>
          </div>

          {/* Highlighted Critical Tasks List */}
          {criticalTasks.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
              <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Atividades Críticas para Execução Imediata:</span>
              </div>
              <ul className="space-y-1.5 text-xs">
                {criticalTasks.slice(0, 3).map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start gap-2 bg-white p-2 rounded-xl border border-rose-100 shadow-2xs text-slate-900"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <span className="font-semibold">{task.tituloAtividade}</span>
                      <span className="text-[11px] text-slate-500 ml-1.5">({task.categoria})</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Micro-Ações GTD Highlight */}
          {twoMinTasks.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
              <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>Lembrete GTD: {twoMinTasks.length} Micro-Ações na Fila de Transição</span>
              </div>
              <p className="text-[11px] text-amber-900">
                Execute micro-ações (etiquetas, caixas vazias, borrifador) sempre ao finalizar cada atividade padrão longa.
              </p>
            </div>
          )}

          {/* Compras / Rupturas */}
          {todayPurchases.length > 0 && (
            <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs flex items-center justify-between text-purple-950">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-purple-600" />
                <span>
                  <strong>{todayPurchases.length} item(ns) com alerta de ruptura urgente</strong> aguardando reposição ou compra hoje.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => {
              onOpenPrintModal();
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimir Folha da Prancheta</span>
          </button>

          <button
            onClick={() => {
              onConfirmCheckin();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <span>Iniciar Turno &amp; Ver Tarefas</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
