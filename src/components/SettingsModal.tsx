import React, { useState } from 'react';
import { X, Clock, Settings, Bell, Store, User as UserIcon, Sparkles, Check, CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react';
import { StoreSettings, User } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  currentUser?: User | null;
  onSave: (newSettings: StoreSettings) => void;
  onPreviewCheckin: () => void;
  onOpenChangePin?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentUser,
  onSave,
  onPreviewCheckin,
  onOpenChangePin,
}) => {
  const [nomeLoja, setNomeLoja] = useState(settings.nomeLoja);
  const [unidade, setUnidade] = useState(settings.unidade || 'Loja Principal');
  const [gerente, setGerente] = useState(settings.gerenteResponsavel);
  const [horarioCheckin, setHorarioCheckin] = useState(settings.horarioCheckinMatinal || '08:00');
  const [checkinAtivo, setCheckinAtivo] = useState(settings.checkinAtivo ?? true);
  const [mensagem, setMensagem] = useState(
    settings.mensagemBoasVindas ||
      'Excelente turno de trabalho! Mantenha o padrão de frescor e alinhamento visual da loja.'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      nomeLoja: nomeLoja.trim() || 'Beto da Fruta',
      unidade: (unidade || '').trim() || 'Loja Principal',
      gerenteResponsavel: gerente.trim() || 'Charles Araújo',
      proprietario: settings.proprietario || 'Beto',
      horarioCheckinMatinal: horarioCheckin || '07:00',
      checkinAtivo,
      mensagemBoasVindas: mensagem.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Configurações Operacionais</h2>
              <p className="text-xs text-slate-500">
                Horário de check-in matinal, alertas e dados da unidade
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          {/* Seção Check-in Matinal */}
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                    Check-in Matinal &amp; Briefing Diário
                  </h3>
                  <p className="text-[11px] text-emerald-800">
                    Exibe alerta com o resumo de prioridades na primeira abertura do turno
                  </p>
                </div>
              </div>
            </div>

            {/* Checkin Ativo toggle */}
            <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkinAtivo}
                  onChange={(e) => setCheckinAtivo(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span>Habilitar alerta matinal de boas-vindas ao fazer login</span>
              </label>
            </div>

            {/* Horário de Check-in */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  Horário de Check-in Matinal
                </label>
                <input
                  type="time"
                  required
                  value={horarioCheckin}
                  onChange={(e) => setHorarioCheckin(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-emerald-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <p className="text-[10px] text-emerald-800 mt-1">
                  Horário padrão de abertura ou chegada da equipe matutina.
                </p>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onSave({
                      ...settings,
                      horarioCheckinMatinal: horarioCheckin,
                      checkinAtivo,
                      mensagemBoasVindas: mensagem,
                    });
                    onPreviewCheckin();
                  }}
                  className="w-full py-2 px-3 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Testar Alerta de Check-in</span>
                </button>
              </div>
            </div>

            {/* Mensagem de Boas-Vindas */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mensagem Motivacional / Orientação do Encarregado
              </label>
              <input
                type="text"
                placeholder="Ex: Excelente turno de trabalho! Mantenha as bancas limpas e abastecidas."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-emerald-300 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Dados Gerais da Loja */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-slate-500" />
                Nome do Estabelecimento
              </label>
              <input
                type="text"
                required
                value={nomeLoja}
                onChange={(e) => setNomeLoja(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Unidade / Filial
                </label>
                <input
                  type="text"
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  Encarregado Geral
                </label>
                <input
                  type="text"
                  value={gerente}
                  onChange={(e) => setGerente(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Seção Segurança do Administrador (PIN Individual) */}
          {currentUser?.perfil === 'Administrador' && onOpenChangePin && (
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Segurança de Acesso (PIN de 4 Dígitos)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Perfil ativo: <strong>{currentUser.nome}</strong> (Administrador)
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-300">
                Cada administrador possui sua própria senha individual de 4 dígitos. A alteração afeta somente o seu acesso.
              </p>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenChangePin();
                }}
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <KeyRound className="w-4 h-4" />
                <span>Alterar Minha Senha de Administrador (PIN)</span>
              </button>
            </div>
          )}

          {/* Botões do Rodapé */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Configurações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
