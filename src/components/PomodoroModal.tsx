import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Zap, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Task } from '../types';

interface PomodoroModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onFocusTwoMinuteQueue: () => void;
}

export const PomodoroModal: React.FC<PomodoroModalProps> = ({
  isOpen,
  onClose,
  task,
  onFocusTwoMinuteQueue,
}) => {
  const WORK_SECONDS = 25 * 60; // 25 minutes
  const BREAK_SECONDS = 5 * 60; // 5 minutes

  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(WORK_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (mode === 'work') {
        setMode('break');
        setTimeLeft(BREAK_SECONDS);
        setCyclesCompleted((prev) => prev + 1);
      } else {
        setMode('work');
        setTimeLeft(WORK_SECONDS);
      }
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercent =
    mode === 'work'
      ? Math.round(((WORK_SECONDS - timeLeft) / WORK_SECONDS) * 100)
      : Math.round(((BREAK_SECONDS - timeLeft) / BREAK_SECONDS) * 100);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Técnica Pomodoro (Foco Operacional)</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {task && (
          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-left">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Atividade em Foco:</div>
            <div className="text-xs font-bold text-slate-900 truncate">{task.tituloAtividade}</div>
          </div>
        )}

        {/* Mode Pill */}
        <div className="mt-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border">
          {mode === 'work' ? (
            <span className="text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              🍅 25 min de Foco Absoluto
            </span>
          ) : (
            <span className="text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 animate-pulse">
              ⚡ Pausa de 5 min (Executar Micro-Ações de 2 Minutos)
            </span>
          )}
        </div>

        {/* Big Digital Timer Display */}
        <div className="my-6">
          <div className="font-mono text-5xl sm:text-6xl font-black text-slate-900 tracking-tighter">
            {formattedTime}
          </div>
          <div className="w-48 mx-auto bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                mode === 'work' ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* GTD Pausa Tip */}
        {mode === 'break' && (
          <div className="mb-4 p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 text-left">
            <p className="font-bold flex items-center gap-1 mb-1 text-amber-900">
              <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              Regra dos 2 Minutos (GTD) na Pausa:
            </p>
            Use os 5 minutos de descanso para zerar tarefas rápidas pendentes na banca (trocar etiqueta, caixas vazias) antes de voltar ao corte ou contagem.
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer transition-colors ${
              isRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>{timeLeft < (mode === 'work' ? WORK_SECONDS : BREAK_SECONDS) ? 'Continuar' : 'Iniciar'}</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(mode === 'work' ? WORK_SECONDS : BREAK_SECONDS);
            }}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
            title="Reiniciar Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fast Forward for Testing (Sets to 5s) */}
          <button
            onClick={() => setTimeLeft(5)}
            className="px-2.5 py-2 text-[10px] text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
            title="Pular para os últimos 5 segundos para testar transição de ciclo"
          >
            Testar (5s)
          </button>
        </div>

        {/* Break action link to 2-minute queue */}
        {mode === 'break' && (
          <button
            onClick={() => {
              onFocusTwoMinuteQueue();
              onClose();
            }}
            className="mt-4 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Ir para a Fila de 2 Minutos da Banca</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Ciclos Concluídos: <strong>{cyclesCompleted}</strong></span>
          <span>Padrão: 25m foco + 5m GTD</span>
        </div>
      </div>
    </div>
  );
};
