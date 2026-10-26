import React, { useState } from 'react';
import {
  Store,
  ShieldCheck,
  User as UserIcon,
  ArrowRight,
  Sparkles,
  ClipboardList,
  Smartphone,
  Lock,
} from 'lucide-react';
import { User, Task } from '../types';
import { AndroidInstallButton } from './AndroidInstallButton';
import { AdminPinModal } from './AdminPinModal';
import { getOrCreateDeviceId } from '../services/deviceService';

interface LoginScreenProps {
  users: User[];
  tasks: Task[];
  onSelectUser: (user: User, customDeviceName?: string) => void;
  storeName: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  tasks,
  onSelectUser,
  storeName,
}) => {
  const [userForPin, setUserForPin] = useState<User | null>(null);
  const currentDeviceId = getOrCreateDeviceId();

  const adminUsers = users.filter((u) => u.perfil === 'Administrador');
  const opUsers = users.filter((u) => u.perfil === 'Operacional');

  const getUserPendingTasksCount = (userId: string) => {
    return tasks.filter(
      (t) => (t.responsavelId === userId || t.auxiliarId === userId) && t.status !== 'Concluída'
    ).length;
  };

  const isThisDeviceBoundToUser = (user: User) => {
    return (user.dispositivosVinculados || []).some((d) => d.deviceId === currentDeviceId);
  };

  const handleUserClick = (user: User) => {
    if (isThisDeviceBoundToUser(user)) {
      // Device is already bound to this user — enter directly without asking for PIN
      onSelectUser(user);
    } else {
      // Require individual 4-digit PIN to bind this device to the user's profile
      setUserForPin(user);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Branding Bar */}
      <div className="max-w-5xl mx-auto w-full pt-4 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-xs font-semibold backdrop-blur-xs mb-3">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sistema Integrado de Chão de Loja &amp; Prancheta</span>
        </div>

        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-600/30">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {storeName}
          </h1>
        </div>

        <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-xl mx-auto">
          Gestão de Atividades Operacionais, Reposição Simplificada &amp; Priorização GTD
        </p>
      </div>

      {/* Main Employee Grid */}
      <div className="max-w-5xl mx-auto w-full my-8">
        <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-7">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Identificação do Colaborador &amp; Vínculo de Aparelho
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Selecione seu nome para vincular este aparelho ao seu perfil. Nos próximos acessos, o sistema entrará automaticamente na sua conta.
            </p>

            {/* Android Install Banner inside Login */}
            <div className="mt-4 max-w-md mx-auto">
              <AndroidInstallButton variant="login" />
            </div>
          </div>

          <div className="space-y-6">
            {/* Bloco 1: Gestão e Encarregados (Administrador) */}
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Gestão &amp; Encarregados (Charles, Amanda e Beto — Acesso Total)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {adminUsers.map((user) => {
                  const pendingCount = getUserPendingTasksCount(user.id);
                  const boundHere = isThisDeviceBoundToUser(user);
                  const deviceCount = (user.dispositivosVinculados || []).length;

                  return (
                    <button
                      key={user.id}
                      onClick={() => handleUserClick(user)}
                      className={`group p-4 bg-slate-800/80 hover:bg-emerald-950/70 border rounded-2xl text-left transition-all duration-150 hover:shadow-lg hover:shadow-emerald-950/50 flex flex-col justify-between cursor-pointer ${
                        boundHere
                          ? 'border-emerald-400 ring-2 ring-emerald-500/30'
                          : 'border-slate-700/80 hover:border-emerald-500/70'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${user.avatarCor}`}
                          >
                            {user.nome.charAt(0)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {boundHere ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                                <Smartphone className="w-2.5 h-2.5" />
                                Este Aparelho
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <Lock className="w-2.5 h-2.5" />
                                PIN {deviceCount > 0 ? `• ${deviceCount} ap.` : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {user.nome}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 font-medium line-clamp-2">
                          {user.setoresAtuacao}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                          <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
                          <span>{pendingCount} tarefa(s) pendente(s)</span>
                        </span>
                        <div className="w-6 h-6 rounded-full bg-slate-700/60 group-hover:bg-emerald-500 text-slate-300 group-hover:text-white flex items-center justify-center transition-all">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bloco 2: Equipe Operacional (Chão de Loja) */}
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <UserIcon className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Equipe Operacional (Lucas, Rafael, Bianca, Adriana, Vanessa e Rita)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {opUsers.map((user) => {
                  const pendingCount = getUserPendingTasksCount(user.id);
                  const boundHere = isThisDeviceBoundToUser(user);
                  const deviceCount = (user.dispositivosVinculados || []).length;

                  return (
                    <button
                      key={user.id}
                      onClick={() => handleUserClick(user)}
                      className={`group p-4 bg-slate-800/80 hover:bg-slate-800 border rounded-2xl text-left transition-all duration-150 hover:shadow-lg hover:shadow-amber-950/30 flex flex-col justify-between cursor-pointer ${
                        boundHere
                          ? 'border-amber-400 ring-2 ring-amber-500/30'
                          : 'border-slate-700/80 hover:border-amber-500/70'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${user.avatarCor}`}
                          >
                            {user.nome.charAt(0)}
                          </div>
                          {boundHere ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                              <Smartphone className="w-2.5 h-2.5" />
                              Este Aparelho
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Lock className="w-2.5 h-2.5" />
                              PIN {deviceCount > 0 ? `• ${deviceCount} ap.` : ''}
                            </span>
                          )}
                        </div>

                        <div className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                          {user.nome}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 font-medium line-clamp-2">
                          {user.setoresAtuacao}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                          <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
                          <span>{pendingCount} tarefa(s) pendente(s)</span>
                        </span>
                        <div className="w-6 h-6 rounded-full bg-slate-700/60 group-hover:bg-amber-500 text-slate-300 group-hover:text-white flex items-center justify-center transition-all">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-5xl mx-auto w-full text-center text-xs text-slate-400 pb-2">
        <p>
          <strong>{storeName}</strong> • Responsável: Charles Araújo • Proprietário: Beto
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          Metodologia SMART • Regra dos 2 Minutos (GTD) • Técnica Pomodoro • Espelhamento Físico em Prancheta
        </p>
      </div>

      {/* 4-Digit PIN & Device Binding Modal for All Employees */}
      <AdminPinModal
        isOpen={!!userForPin}
        targetAdmin={userForPin}
        onClose={() => setUserForPin(null)}
        onSuccess={(selectedUser, customDeviceName) => {
          setUserForPin(null);
          onSelectUser(selectedUser, customDeviceName);
        }}
      />
    </div>
  );
};
