import React, { useState } from 'react';
import {
  UserCheck,
  Printer,
  ClipboardList,
  ShoppingCart,
  History,
  ShieldCheck,
  User as UserIcon,
  RotateCcw,
  Store,
  ChevronDown,
  Sparkles,
  BarChart3,
  Settings,
  Sun,
  Clock,
  LogOut,
} from 'lucide-react';
import { User, StoreSettings } from '../types';

interface HeaderProps {
  currentUser: User;
  onOpenUserSwitcher: () => void;
  onLogout?: () => void;
  activeTab: 'tasks' | 'purchases' | 'audit' | 'stats';
  setActiveTab: (tab: 'tasks' | 'purchases' | 'audit' | 'stats') => void;
  pendingTasksCount: number;
  twoMinTasksCount: number;
  purchasesAlertCount: number;
  onOpenPrintModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenCheckinModal: () => void;
  settings: StoreSettings;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenUserSwitcher,
  onLogout,
  activeTab,
  setActiveTab,
  pendingTasksCount,
  twoMinTasksCount,
  purchasesAlertCount,
  onOpenPrintModal,
  onOpenSettingsModal,
  onOpenCheckinModal,
  settings,
  onResetData,
}) => {
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const isAdmin = currentUser.perfil === 'Administrador';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      {/* Top Banner indicating simulated active user and role */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-slate-300">Modo de Operação Híbrido:</span>
          <span className="text-slate-400">Digital no chão de loja & Espelhamento em Prancheta Física</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            {isAdmin ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <UserIcon className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="text-slate-300">
              Usuário Atual: <strong className="text-white">{currentUser.nome}</strong> ({currentUser.perfil})
            </span>
          </div>

          <button
            onClick={onOpenUserSwitcher}
            className="text-emerald-400 hover:text-emerald-300 underline font-medium text-xs flex items-center gap-1 cursor-pointer"
            title="Trocar perfil de acesso"
          >
            <UserCheck className="w-3 h-3" />
            Alternar Perfil
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Store Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {settings.nomeLoja}
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
                  Hortifrúti
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Gestão Operacional, Regra dos 2 Minutos (GTD) e Reposição • Resp: {settings.gerenteResponsavel}
              </p>
            </div>
          </div>

          {/* Quick Actions & Navigation Controls */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Morning Check-in button */}
            <button
              onClick={onOpenCheckinModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Abrir Alerta de Boas-Vindas e Resumo Matinal do Dia"
            >
              <Sun className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>Check-in Matinal</span>
              <span className="bg-amber-200/80 text-amber-950 px-1.5 py-0.2 rounded font-mono font-bold text-[10px]">
                {settings.horarioCheckinMatinal || '07:00'}
              </span>
            </button>

            {/* Print / Checklist button */}
            <button
              onClick={onOpenPrintModal}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              title="Gerar folha física formatada para prancheta"
            >
              <Printer className="w-4 h-4" />
              <span>Gerar Folha do Dia</span>
              <span className="hidden sm:inline-block text-[11px] bg-emerald-800/60 px-1.5 py-0.5 rounded text-emerald-100">
                Prancheta
              </span>
            </button>

            {/* User Profile Pill button */}
            <button
              onClick={onOpenUserSwitcher}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-sm transition-colors text-slate-700 cursor-pointer"
              title="Trocar perfil de funcionário"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentUser.avatarCor}`}>
                {currentUser.nome.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-medium text-slate-900 leading-tight">{currentUser.nome}</div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  {currentUser.cargoDescricao || currentUser.setoresAtuacao?.split(',')[0]}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* Logout / Trocar Funcionário */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Sair / Voltar para a Tela de Seleção de Funcionários"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Settings button */}
            <button
              onClick={onOpenSettingsModal}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Configurações (Horário de Check-in, Loja)"
            >
              <Settings className="w-4 h-4 text-slate-700" />
            </button>

            {/* Demo Reset helper */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Mais opções"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {showSettingsDropdown && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50 text-xs">
                  <div className="px-2 py-1 text-slate-400 font-medium border-b border-slate-100 mb-1">
                    Opções &amp; Configurações
                  </div>
                  <button
                    onClick={() => {
                      onOpenSettingsModal();
                      setShowSettingsDropdown(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Settings className="w-3.5 h-3.5 text-emerald-600" />
                    Configurar Horário de Check-in
                  </button>
                  <button
                    onClick={() => {
                      onOpenCheckinModal();
                      setShowSettingsDropdown(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    Abrir Briefing Matinal
                  </button>
                  <button
                    onClick={() => {
                      onOpenUserSwitcher();
                      setShowSettingsDropdown(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 text-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Gerenciar Colaboradores
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={() => {
                      onResetData();
                      setShowSettingsDropdown(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-rose-50 text-slate-600 flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                    Restaurar Dados Originais
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4 flex items-center gap-2 border-b border-slate-200 -mb-[1px]">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'tasks'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Tarefas & Rotinas</span>
            {pendingTasksCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                {pendingTasksCount}
              </span>
            )}
            {twoMinTasksCount > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded border border-amber-200">
                ⚡ {twoMinTasksCount} de 2min
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('purchases')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'purchases'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Compras & Reposição</span>
            {purchasesAlertCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-700 rounded-full">
                {purchasesAlertCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'audit'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Auditoria & Baixas</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'stats'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Estatísticas & Tempos</span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">
              Recharts
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
