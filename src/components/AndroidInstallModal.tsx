import React from 'react';
import { X, Smartphone, Download, CheckCircle2, MoreVertical, PlusSquare, ArrowRight, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    const res = await install();
    if (res === 'accepted') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 p-1.5 flex items-center justify-center border border-white/20 shadow-inner">
              <img src="/icon.svg" alt="Beto da Fruta" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Instalar App Beto da Fruta</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                  Google Chrome
                </span>
              </div>
              <p className="text-xs text-emerald-100/90">Instala como atalho em janela pelo navegador Chrome (sem barras, tela limpa)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {isInstalled ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">O aplicativo já está instalado!</p>
                <p className="text-xs text-emerald-700">Você já pode abri-lo pelo ícone na tela inicial do seu aparelho.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Native Prompt button if available */}
              {isInstallable && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Instalação Direta</span>
                    <span className="text-xs text-emerald-600 font-medium">1 Toque</span>
                  </div>
                  <button
                    onClick={handleDirectInstall}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Instalar Agora no Aparelho
                  </button>
                  <p className="text-[11px] text-emerald-700 text-center">
                    Seu navegador suporta a instalação direta em um clique.
                  </p>
                </div>
              )}

              {/* Step by step instructions for Android */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  Passo a Passo no Celular Android (Google Chrome)
                </h4>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                      1
                    </div>
                    <div className="text-xs text-slate-700">
                      <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                        Abra o menu do Chrome
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[11px]">
                          <MoreVertical className="w-3.5 h-3.5" /> 3 pontinhos
                        </span>
                      </p>
                      <p className="mt-0.5 text-slate-600">
                        Toque no ícone de três pontinhos no canto superior direito do seu navegador Chrome.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                      2
                    </div>
                    <div className="text-xs text-slate-700">
                      <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                        Selecione "Instalar aplicativo"
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium text-[11px]">
                          <PlusSquare className="w-3.5 h-3.5" /> Adicionar à tela
                        </span>
                      </p>
                      <p className="mt-0.5 text-slate-600">
                        No menu aberto, procure a opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                      3
                    </div>
                    <div className="text-xs text-slate-700">
                      <p className="font-semibold text-slate-900">Confirme a Instalação</p>
                      <p className="mt-0.5 text-slate-600">
                        Clique em <strong>Instalar</strong>. O ícone do <strong>Beto da Fruta</strong> aparecerá entre seus apps e abrirá sem barras do navegador, funcionando 100% como app nativo!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advantages of the Android App */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 space-y-2">
                <p className="text-xs font-bold flex items-center gap-1.5 text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Vantagens do Aplicativo no Celular:
                </p>
                <ul className="text-xs space-y-1 text-amber-900/90 pl-5 list-disc">
                  <li>Abertura instantânea sem precisar digitar o endereço da web</li>
                  <li>Tela cheia com visão total para repositores e produção na bancada</li>
                  <li>Memória local para preenchimento de rotinas mesmo com oscilação de Wi-Fi</li>
                  <li>Acesso rápido ao perfil de cada funcionário</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Entendi / Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
