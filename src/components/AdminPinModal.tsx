import React, { useState, useEffect } from 'react';
import { X, Lock, ShieldCheck, Smartphone, AlertCircle, Check } from 'lucide-react';
import { User } from '../types';
import { getUserPin } from '../services/storage';
import { getDeviceDetails } from '../services/deviceService';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAdmin: User | null;
  onSuccess: (user: User, customDeviceName?: string) => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  targetAdmin,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState('');

  useEffect(() => {
    if (isOpen && targetAdmin) {
      setPin('');
      setError(null);
      const details = getDeviceDetails();
      setDeviceName(`Celular de ${targetAdmin.nome} (${details.nomeAparelho})`);
    }
  }, [isOpen, targetAdmin?.id]);

  if (!isOpen || !targetAdmin) return null;

  const validPin = getUserPin(targetAdmin.id);
  const isAdmin = targetAdmin.perfil === 'Administrador';

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
    if (enteredPin === validPin) {
      onSuccess(targetAdmin, deviceName);
      onClose();
    } else {
      setError('PIN incorreto. Digite os 4 dígitos do seu perfil.');
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
        <div className="bg-gradient-to-r from-[#09351e] to-slate-900 text-white p-5 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-2 text-emerald-300 shadow-inner">
            {isAdmin ? <ShieldCheck className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
          </div>

          <h3 className="text-base font-bold text-white">
            Vincular Dispositivo — {targetAdmin.nome}
          </h3>
          <p className="text-xs text-emerald-100/90 mt-0.5">
            Digite seu PIN individual de 4 dígitos para salvar este aparelho no seu perfil
          </p>
        </div>

        {/* PIN Entry Area */}
        <div className="p-5">
          <form onSubmit={handleFormSubmit} className="space-y-3.5">
            {/* Device Binding Notice */}
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-950">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
                <Smartphone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Login Automático Ativado neste Aparelho</span>
              </div>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Nome deste aparelho"
                className="w-full px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <p className="text-[10px] text-emerald-800 mt-1">
                Nos próximos acessos, este dispositivo entrará direto em <strong>{targetAdmin.nome}</strong> automaticamente.
              </p>
            </div>

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

            {/* Error Message or Default PIN Hint */}
            {error ? (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs font-semibold text-rose-700 flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            ) : (
              <p className="text-[11px] text-center text-slate-500">
                PIN de {targetAdmin.nome}:{' '}
                <strong className="text-emerald-700 font-mono">{validPin}</strong>
              </p>
            )}

            {/* Numeric Keypad for fast touch & mobile access */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitClick(digit)}
                  className="py-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200 text-lg font-bold text-slate-800 transition-colors cursor-pointer shadow-2xs"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPin('')}
                className="py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-500 transition-colors cursor-pointer"
              >
                Limpar
              </button>

              <button
                type="button"
                onClick={() => handleDigitClick('0')}
                className="py-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200 text-lg font-bold text-slate-800 transition-colors cursor-pointer shadow-2xs"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="py-2.5 rounded-2xl bg-slate-50 hover:bg-rose-50 text-xs font-bold text-rose-600 transition-colors cursor-pointer"
              >
                ⌫
              </button>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pin.length !== 4}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#0a3821] hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Vincular &amp; Entrar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
