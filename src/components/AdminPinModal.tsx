import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldCheck, KeyRound, AlertCircle, Check } from 'lucide-react';
import { User } from '../types';
import { getUserPin } from '../services/storage';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAdmin: User | null;
  onSuccess: (admin: User) => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  targetAdmin,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
    }
  }, [isOpen, targetAdmin?.id]);

  if (!isOpen || !targetAdmin) return null;

  const handleDigitClick = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(null);
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const verifyPin = (enteredPin: string) => {
    const validPin = getUserPin(targetAdmin.id);
    if (enteredPin === validPin) {
      onSuccess(targetAdmin);
      onClose();
    } else {
      setError('Senha incorreta. Tente novamente.');
      setTimeout(() => {
        setPin('');
      }, 600);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 4) {
      verifyPin(pin);
    } else {
      setError('Digite os 4 dígitos da senha.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-2 text-emerald-400 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>

          <h3 className="text-base font-bold text-white">Acesso de Administrador</h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Digite a senha de 4 dígitos de <strong>{targetAdmin.nome}</strong>
          </p>
        </div>

        {/* PIN Entry Area */}
        <div className="p-6">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* PIN Dots Indicator */}
            <div className="flex justify-center items-center gap-3 my-2">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-150 ${
                      filled
                        ? 'bg-emerald-600 scale-110 shadow-sm'
                        : 'border-2 border-slate-300 bg-slate-100'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error Message */}
            {error ? (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs font-semibold text-rose-700 flex items-center justify-center gap-1.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            ) : (
              <p className="text-[11px] text-center text-slate-500">
                Senha padrão inicial: <strong className="text-emerald-700 font-mono">1234</strong>
              </p>
            )}

            {/* Numeric Keypad for fast touch & mobile access */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitClick(digit)}
                  className="py-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200 text-lg font-bold text-slate-800 transition-colors cursor-pointer shadow-2xs"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPin('')}
                className="py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-500 transition-colors cursor-pointer"
              >
                Limpar
              </button>

              <button
                type="button"
                onClick={() => handleDigitClick('0')}
                className="py-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200 text-lg font-bold text-slate-800 transition-colors cursor-pointer shadow-2xs"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="py-3 rounded-2xl bg-slate-50 hover:bg-rose-50 text-xs font-bold text-rose-600 transition-colors cursor-pointer"
              >
                ⌫
              </button>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 mt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pin.length !== 4}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Entrar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
