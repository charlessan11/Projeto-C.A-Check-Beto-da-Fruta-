import React, { useState } from 'react';
import { Smartphone, Download, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AndroidInstallModal } from './AndroidInstallModal';

interface AndroidInstallButtonProps {
  variant?: 'header' | 'login' | 'banner';
  className?: string;
}

export const AndroidInstallButton: React.FC<AndroidInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = async () => {
    if (isInstallable) {
      const res = await install();
      if (res !== 'accepted') {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  if (isInstalled && variant === 'header') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span className="hidden sm:inline">App Instalado</span>
      </div>
    );
  }

  if (variant === 'login') {
    return (
      <>
        <button
          onClick={handleClick}
          type="button"
          title="Instalar app como atalho em janela pelo navegador Chrome"
          className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
            isInstalled
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 text-white shadow-emerald-700/20 hover:shadow-md'
          } ${className}`}
        >
          <Smartphone className="w-4 h-4" />
          {isInstalled ? 'App Instalado' : 'Instalar app'}
        </button>
        <AndroidInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  // Header button variant
  return (
    <>
      <button
        onClick={handleClick}
        type="button"
        title="Instalar app como atalho em janela pelo navegador Chrome"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
          isInstalled
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-800/15 hover:shadow-sm'
        } ${className}`}
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">
          {isInstalled ? 'App Instalado' : 'Instalar app'}
        </span>
        <span className="sm:hidden">{isInstalled ? 'App' : 'Instalar app'}</span>
      </button>
      <AndroidInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
