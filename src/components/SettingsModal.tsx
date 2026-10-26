import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Settings,
  Bell,
  Volume2,
  VolumeX,
  Play,
  Store,
  User as UserIcon,
  Sparkles,
  Check,
  KeyRound,
  Database,
  Download,
} from 'lucide-react';
import {
  StoreSettings,
  User,
  CompletionTone,
  ReminderTone,
} from '../types';
import {
  COMPLETION_TONE_OPTIONS,
  REMINDER_TONE_OPTIONS,
  REMINDER_INTERVAL_OPTIONS,
  getEffectiveSoundSettings,
  playTaskCompletionSound,
  playRoutineReminderSound,
} from '../services/soundService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  currentUser?: User | null;
  onSave: (newSettings: StoreSettings) => void;
  onPreviewCheckin: () => void;
  onTriggerRoutineReminderTest?: () => void;
  onOpenChangePin?: () => void;
  onOpenBackupModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  currentUser,
  onSave,
  onPreviewCheckin,
  onTriggerRoutineReminderTest,
  onOpenChangePin,
  onOpenBackupModal,
}) => {
  const initialSound = getEffectiveSoundSettings(settings);

  const [nomeLoja, setNomeLoja] = useState(settings.nomeLoja);
  const [unidade, setUnidade] = useState(settings.unidade || 'Loja Principal');
  const [gerente, setGerente] = useState(settings.gerenteResponsavel);
  const [horarioCheckin, setHorarioCheckin] = useState(settings.horarioCheckinMatinal || '08:00');
  const [checkinAtivo, setCheckinAtivo] = useState(settings.checkinAtivo ?? true);
  const [mensagem, setMensagem] = useState(
    settings.mensagemBoasVindas ||
      'Excelente turno de trabalho! Mantenha o padrão de frescor e alinhamento visual da loja.'
  );

  // Sound Alerts State
  const [somAtivo, setSomAtivo] = useState<boolean>(initialSound.ativo);
  const [somConclusaoTarefa, setSomConclusaoTarefa] = useState<boolean>(
    initialSound.somConclusaoTarefa
  );
  const [tomConclusao, setTomConclusao] = useState<CompletionTone>(initialSound.tomConclusao);
  const [somLembreteRotina, setSomLembreteRotina] = useState<boolean>(
    initialSound.somLembreteRotina
  );
  const [tomLembrete, setTomLembrete] = useState<ReminderTone>(initialSound.tomLembrete);
  const [intervaloLembreteMinutos, setIntervaloLembreteMinutos] = useState<number>(
    initialSound.intervaloLembreteMinutos
  );
  const [volume, setVolume] = useState<number>(initialSound.volume);

  useEffect(() => {
    if (isOpen) {
      setNomeLoja(settings.nomeLoja);
      setUnidade(settings.unidade || 'Loja Principal');
      setGerente(settings.gerenteResponsavel);
      setHorarioCheckin(settings.horarioCheckinMatinal || '08:00');
      setCheckinAtivo(settings.checkinAtivo ?? true);
      setMensagem(
        settings.mensagemBoasVindas ||
          'Excelente turno de trabalho! Mantenha o padrão de frescor e alinhamento visual da loja.'
      );
      const eff = getEffectiveSoundSettings(settings);
      setSomAtivo(eff.ativo);
      setSomConclusaoTarefa(eff.somConclusaoTarefa);
      setTomConclusao(eff.tomConclusao);
      setSomLembreteRotina(eff.somLembreteRotina);
      setTomLembrete(eff.tomLembrete);
      setIntervaloLembreteMinutos(eff.intervaloLembreteMinutos);
      setVolume(eff.volume);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const isAdmin = currentUser?.perfil === 'Administrador';

  const buildDraftSettings = (): StoreSettings => ({
    nomeLoja: nomeLoja.trim() || 'Beto da Fruta',
    unidade: (unidade || '').trim() || 'Loja Principal',
    gerenteResponsavel: gerente.trim() || 'Charles',
    proprietario: settings.proprietario || 'Beto',
    horarioCheckinMatinal: horarioCheckin || '08:00',
    checkinAtivo,
    mensagemBoasVindas: mensagem.trim(),
    alertasSonoros: {
      ativo: somAtivo,
      somConclusaoTarefa,
      tomConclusao,
      somLembreteRotina,
      tomLembrete,
      intervaloLembreteMinutos,
      volume,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(buildDraftSettings());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Configurações do Sistema &amp; Alertas Sonoros
              </h2>
              <p className="text-xs text-slate-500">
                Alertas sonoros suaves, lembretes de rotina, check-in matinal e unidade
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
          {/* ================= SEÇÃO 1: ALERTAS SONOROS SUAVES & LEMBRETES DE ROTINA ================= */}
          <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-950">
                    Alertas Sonoros Suaves &amp; Lembretes
                  </h3>
                  <p className="text-[11px] text-amber-800">
                    Toque de campainha ao concluir tarefas e avisos sonoros para rotinas
                  </p>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-2.5 py-1.5 rounded-xl border border-amber-300 shadow-2xs">
                <input
                  type="checkbox"
                  checked={somAtivo}
                  onChange={(e) => setSomAtivo(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  {somAtivo ? 'Sons Ativos' : 'Silenciado'}
                </span>
              </label>
            </div>

            {/* Controle de Volume */}
            <div className="bg-white/90 p-3 rounded-xl border border-amber-200/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  {somAtivo && volume > 0 ? (
                    <Volume2 className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                  Volume dos Alertas Suaves
                </span>
                <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md text-[11px]">
                  {volume}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                disabled={!somAtivo}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer disabled:opacity-50"
              />
            </div>

            {/* Sub-bloco A: Conclusão de Tarefas (Toque de Campainha) */}
            <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!somAtivo}
                    checked={somConclusaoTarefa}
                    onChange={(e) => setSomConclusaoTarefa(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>Toque de campainha suave ao concluir tarefas e rotinas</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Timbre de Conclusão
                  </label>
                  <select
                    disabled={!somAtivo || !somConclusaoTarefa}
                    value={tomConclusao}
                    onChange={(e) => {
                      const nextTone = e.target.value as CompletionTone;
                      setTomConclusao(nextTone);
                      playTaskCompletionSound(buildDraftSettings(), nextTone, true);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    {COMPLETION_TONE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      playTaskCompletionSound(buildDraftSettings(), tomConclusao, true)
                    }
                    className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-[#0a3d24] border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-[#0a3d24]" />
                    <span>Ouvir Campainha</span>
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                {
                  COMPLETION_TONE_OPTIONS.find((o) => o.value === tomConclusao)?.description
                }
              </p>
            </div>

            {/* Sub-bloco B: Lembretes de Rotina */}
            <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!somAtivo}
                    checked={somLembreteRotina}
                    onChange={(e) => setSomLembreteRotina(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>Alerta sonoro suave para lembretes de rotina pendente</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Timbre do Lembrete de Rotina
                  </label>
                  <select
                    disabled={!somAtivo || !somLembreteRotina}
                    value={tomLembrete}
                    onChange={(e) => {
                      const nextTone = e.target.value as ReminderTone;
                      setTomLembrete(nextTone);
                      playRoutineReminderSound(buildDraftSettings(), nextTone, true);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    {REMINDER_TONE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Frequência dos Lembretes
                  </label>
                  <select
                    disabled={!somAtivo || !somLembreteRotina}
                    value={intervaloLembreteMinutos}
                    onChange={(e) => setIntervaloLembreteMinutos(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    {REMINDER_INTERVAL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-[10px] text-slate-500 flex-1">
                  {REMINDER_TONE_OPTIONS.find((o) => o.value === tomLembrete)?.description}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    playRoutineReminderSound(buildDraftSettings(), tomLembrete, true);
                    if (onTriggerRoutineReminderTest) {
                      onTriggerRoutineReminderTest();
                    }
                  }}
                  className="py-1.5 px-3 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-800" />
                  <span>Testar Lembrete</span>
                </button>
              </div>
            </div>
          </div>

          {/* ================= SEÇÃO 2: CHECK-IN MATINAL ================= */}
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
                  disabled={!isAdmin}
                  value={horarioCheckin}
                  onChange={(e) => setHorarioCheckin(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-emerald-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm disabled:opacity-60"
                />
                <p className="text-[10px] text-emerald-800 mt-1">
                  Horário padrão de abertura ou chegada da equipe matutina.
                </p>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onSave(buildDraftSettings());
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
                disabled={!isAdmin}
                placeholder="Ex: Excelente turno de trabalho! Mantenha as bancas limpas e abastecidas."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-emerald-300 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
              />
            </div>
          </div>

          {/* ================= SEÇÃO 3: DADOS GERAIS DA LOJA (SOMENTE ADMIN EDITA) ================= */}
          {isAdmin && (
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
          )}

          {/* Seção Backup e Exportação de Dados (JSON) */}
          {isAdmin && onOpenBackupModal && (
            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0a3d24] text-white flex items-center justify-center">
                    <Database className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                      Backup Diário &amp; Exportação (JSON)
                    </h3>
                    <p className="text-[11px] text-emerald-800">
                      Exportação automática no localStorage e servidor com download em JSON
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-600">
                Baixe um arquivo JSON completo contendo todas as atividades, rotinas e compras realizadas no dia para auditoria e controle gerencial.
              </p>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBackupModal();
                }}
                className="w-full py-2.5 px-3 bg-[#0a3d24] hover:bg-[#09351e] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4 text-emerald-300" />
                <span>Abrir Central de Backup &amp; Baixar JSON do Dia</span>
              </button>
            </div>
          )}

          {/* Seção Segurança (PIN Individual) */}
          {currentUser && onOpenChangePin && (
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
                      Perfil ativo: <strong>{currentUser.nome}</strong> ({currentUser.perfil})
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-300">
                Cada usuário possui sua própria senha individual de 4 dígitos. A alteração afeta somente o seu acesso.
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
                <span>Alterar Minha Senha Individual (PIN)</span>
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
