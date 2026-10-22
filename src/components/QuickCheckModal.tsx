import React, { useState } from 'react';
import { CheckCircle2, MessageSquare, X, Clock, AlertCircle } from 'lucide-react';
import { Task, User } from '../types';

interface QuickCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  currentUser: User;
  onConfirm: (taskId: string, observacao: string) => void;
}

export const QuickCheckModal: React.FC<QuickCheckModalProps> = ({
  isOpen,
  onClose,
  task,
  currentUser,
  onConfirm,
}) => {
  const [observacao, setObservacao] = useState('');

  if (!isOpen || !task) return null;

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(task.id, observacao.trim());
    setObservacao('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Dar Baixa na Atividade</h3>
              <p className="text-xs text-slate-500">
                Registrado por: <strong>{currentUser.nome}</strong>
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

        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                task.prioridade.startsWith('1')
                  ? 'bg-rose-100 text-rose-700'
                  : task.prioridade.startsWith('2')
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              Prioridade: {task.prioridade}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {task.categoria}
            </span>
          </div>
          <p className="font-semibold text-sm text-slate-900">{task.tituloAtividade}</p>
          {task.instrucoesDetalhadas && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {task.instrucoesDetalhadas}
            </p>
          )}
        </div>

        <form onSubmit={handleFinish} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              Observações de Execução (Opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Não consegui repor completo pois faltou embalagem; ou: Banca 100% abastecida com 15 caixas."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-slate-400" />
              Esta nota ficará gravada para auditoria do encarregado ({task.concluidoPorNome || 'Gestão'}).
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-medium rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-emerald-700/20 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Conclusão</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
