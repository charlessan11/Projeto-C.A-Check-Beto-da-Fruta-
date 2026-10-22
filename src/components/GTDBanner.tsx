import React from 'react';
import { Zap, CheckCircle2, ArrowRight, X } from 'lucide-react';

interface GTDTransitionPromptProps {
  isOpen: boolean;
  onClose: () => void;
  completedTaskTitle: string;
  twoMinuteTasksCount: number;
  onFocusTwoMinuteTasks: () => void;
}

export const GTDTransitionModal: React.FC<GTDTransitionPromptProps> = ({
  isOpen,
  onClose,
  completedTaskTitle,
  twoMinuteTasksCount,
  onFocusTwoMinuteTasks,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl shadow-xs">
            <Zap className="w-6 h-6 text-amber-600 fill-amber-500" />
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Atividade Padrão Concluída!
          </div>
          <h3 className="text-base font-semibold text-slate-900 mt-1 line-clamp-2">
            "{completedTaskTitle}"
          </h3>

          <div className="mt-3 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-900 leading-relaxed">
            <p className="font-semibold flex items-center gap-1.5 text-amber-950 mb-1">
              <span>⏱️ Regra dos 2 Minutos (GTD):</span>
            </p>
            Antes de iniciar a próxima tarefa longa, aproveite este momento de transição para executar micro-ações rápidas que mantêm a loja impecável (etiquetas, caixas vazias, borrifar água).
          </div>

          <div className="mt-4 text-xs text-slate-600">
            {twoMinuteTasksCount > 0 ? (
              <p>
                Existem <strong className="text-amber-700 font-bold">{twoMinuteTasksCount} micro-ações de 2 minutos</strong> aguardando execução na banca agora.
              </p>
            ) : (
              <p className="text-emerald-700 font-medium">
                Nenhuma micro-ação pendente no momento! A fila está zerada.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          {twoMinuteTasksCount > 0 ? (
            <button
              onClick={() => {
                onFocusTwoMinuteTasks();
                onClose();
              }}
              className="w-full sm:flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>Ver Fila de 2 Minutos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : null}

          <button
            onClick={onClose}
            className="w-full sm:flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-colors cursor-pointer"
          >
            Continuar Atividades
          </button>
        </div>
      </div>
    </div>
  );
};
