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
  Smartphone,
  BarChart3,
  Settings,
  Sun,
  LogOut,
  CalendarCheck,
  KeyRound,
  BookOpen,
  Menu,
  Unlink,
  Database,
  Bell,
} from 'lucide-react';
import { User, StoreSettings } from '../types';
import { AndroidInstallButton } from './AndroidInstallButton';

interface HeaderProps {
  currentUser: User;
  onOpenUserSwitcher: () => void;
  onLogout?: () => void;
  onUnbindCurrentDevice?: () => void;
  activeTab: 'rotinas' | 'tasks' | 'purchases' | 'audit' | 'stats';
  setActiveTab: (tab: 'rotinas' | 'tasks' | 'purchases' | 'audit' | 'stats') => void;
  pendingTasksCount: number;
  twoMinTasksCount: number;
  purchasesAlertCount: number;
  routinePendingCount?: number;
  onOpenPrintModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenCheckinModal: () => void;
  onOpenChangePin?: () => void;
  onOpenManual?: () => void;
  onOpenBackupModal?: () => void;
  settings: StoreSettings;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenUserSwitcher,
  onLogout,
  onUnbindCurrentDevice,
  activeTab,
  setActiveTab,
  pendingTasksCount,
  twoMinTasksCount,
  purchasesAlertCount,
  onOpenPrintModal,
  onOpenSettingsModal,
  onOpenCheckinModal,
  onOpenChangePin,
  onOpenManual,
  onOpenBackupModal,
  settings,
  onResetData,
}) => {
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const isAdmin = currentUser.perfil === 'Administrador';

  return (
    <>
      {/* ================= DESKTOP & TABLET HEADER (sm:block) ================= */}
      <header className="bg-white border-b border-emerald-900/10 sticky top-0 z-30 shadow-xs no-print hidden sm:block">
        {/* Top Operational Bar: Dark Green & White Contrast */}
        <div className="bg-[#09351e] text-white text-xs py-1.5 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-100">Beto da Fruta — Gestão de Loja:</span>
            <span className="text-emerald-300/90 hidden md:inline">
              Rotinas Diárias • Compras &amp; Reposição • Regra dos 2 Minutos
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-200 bg-emerald-900/70 px-2 py-0.5 rounded-md border border-emerald-700/50">
              <Smartphone className="w-3 h-3 text-emerald-300" />
              <span>Aparelho Vinculado</span>
            </span>

            {isAdmin ? (
              <button
                onClick={onOpenUserSwitcher}
                className="flex items-center gap-1.5 bg-emerald-800/80 hover:bg-emerald-700/80 text-white px-2.5 py-0.5 rounded-lg border border-emerald-600/40 text-xs font-semibold cursor-pointer transition-all"
                title="Gerenciar Colaboradores e Dispositivos (Acesso Admin)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>
                  {currentUser.nome} ({currentUser.perfil})
                </span>
                <ChevronDown className="w-3 h-3 text-emerald-300 ml-0.5" />
              </button>
            ) : (
              <div
                className="flex items-center gap-1.5 bg-emerald-900/60 text-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-700/40 text-xs font-semibold"
                title="Perfil vinculado a este aparelho"
              >
                <UserIcon className="w-3.5 h-3.5 text-emerald-300" />
                <span>
                  {currentUser.nome} ({currentUser.perfil})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Desktop Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo & Store Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0a3d24] flex items-center justify-center text-white shadow-sm">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black text-slate-900 tracking-tight">
                    {settings.nomeLoja}
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-[#09351e] rounded border border-emerald-200">
                    Hortifrúti
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Encarregado: <strong className="text-slate-700">{settings.gerenteResponsavel}</strong> • Metodologia Chão de Loja
                </p>
              </div>
            </div>

            {/* Desktop Action Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Install on Android */}
              <AndroidInstallButton variant="header" />

              {/* Check-in Matinal */}
              <button
                onClick={onOpenCheckinModal}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Abrir Alerta de Boas-Vindas e Resumo Matinal do Dia"
              >
                <Sun className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>Check-in</span>
                <span className="bg-amber-200/80 text-amber-950 px-1.5 py-0.2 rounded font-mono font-bold text-[10px]">
                  {settings.horarioCheckinMatinal || '08:00'}
                </span>
              </button>

              {/* Print / Checklist button */}
              <button
                onClick={onOpenPrintModal}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Gerar folha física formatada para prancheta"
              >
                <Printer className="w-4 h-4 text-[#0a3d24]" />
                <span>Folha do Dia</span>
              </button>

              {/* Manual button */}
              {onOpenManual && (
                <button
                  onClick={onOpenManual}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  title="Abrir o Manual do Sistema e Descrição de Funcionalidades"
                >
                  <BookOpen className="w-4 h-4 text-[#0a3d24]" />
                  <span>Manual</span>
                </button>
              )}

              {/* Backup Diário button (Administradores) */}
              {onOpenBackupModal && isAdmin && (
                <button
                  onClick={onOpenBackupModal}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0a3d24] border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  title="Exportação e Backup Diário (JSON) de Atividades e Compras"
                >
                  <Database className="w-4 h-4 text-[#0a3d24]" />
                  <span>Backup Diário</span>
                </button>
              )}

              {/* User badge (Only admins can open switcher) */}
              {isAdmin ? (
                <button
                  onClick={onOpenUserSwitcher}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs transition-colors text-slate-800 font-semibold cursor-pointer"
                  title="Gerenciar Colaboradores e Dispositivos Vinculados"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentUser.avatarCor}`}>
                    {currentUser.nome.charAt(0)}
                  </div>
                  <span>{currentUser.nome}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>
              ) : (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-bold"
                  title="Perfil vinculado a este dispositivo"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentUser.avatarCor}`}>
                    {currentUser.nome.charAt(0)}
                  </div>
                  <span>{currentUser.nome}</span>
                  <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                </div>
              )}

              {/* Settings Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                  title="Mais opções"
                >
                  <Settings className="w-4 h-4 text-[#0a3d24]" />
                </button>

                {showSettingsDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs">
                    <div className="px-3 py-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 mb-1">
                      Opções &amp; Dispositivo
                    </div>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            onOpenUserSwitcher();
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-emerald-950 flex items-center gap-2 cursor-pointer font-bold"
                        >
                          <UserCheck className="w-4 h-4 text-[#0a3d24]" />
                          Equipe &amp; Aparelhos Vinculados
                        </button>
                        {onOpenBackupModal && (
                          <button
                            onClick={() => {
                              onOpenBackupModal();
                              setShowSettingsDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-emerald-950 flex items-center gap-2 cursor-pointer font-bold"
                          >
                            <Database className="w-4 h-4 text-[#0a3d24]" />
                            Exportar / Backup Diário (JSON)
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => {
                        onOpenSettingsModal();
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50 text-slate-900 flex items-center gap-2 cursor-pointer font-bold"
                    >
                      <Bell className="w-4 h-4 text-amber-600" />
                      Configurações &amp; Alertas Sonoros
                    </button>
                    <button
                      onClick={() => {
                        onOpenCheckinModal();
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-800 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Sun className="w-4 h-4 text-amber-500" />
                      Abrir Briefing Matinal
                    </button>
                    {onOpenChangePin && (
                      <button
                        onClick={() => {
                          onOpenChangePin();
                          setShowSettingsDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-emerald-950 flex items-center gap-2 cursor-pointer font-bold"
                      >
                        <KeyRound className="w-4 h-4 text-[#0a3d24]" />
                        Alterar Meu PIN (4 dígitos)
                      </button>
                    )}
                    {onOpenManual && (
                      <button
                        onClick={() => {
                          onOpenManual();
                          setShowSettingsDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-emerald-950 flex items-center gap-2 cursor-pointer font-bold"
                      >
                        <BookOpen className="w-4 h-4 text-[#0a3d24]" />
                        Manual do Sistema &amp; Guia
                      </button>
                    )}
                    <div className="my-1 border-t border-slate-100" />
                    {onUnbindCurrentDevice && (
                      <button
                        onClick={() => {
                          onUnbindCurrentDevice();
                          setShowSettingsDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-700 flex items-center gap-2 cursor-pointer font-semibold"
                      >
                        <Unlink className="w-4 h-4 text-rose-600" />
                        Desvincular Este Aparelho
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => {
                          onResetData();
                          setShowSettingsDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-700 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <RotateCcw className="w-4 h-4 text-rose-500" />
                        Restaurar Dados Originais
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Horizontal Tabs */}
          <div className="mt-3 flex items-center gap-2 border-b border-slate-200 -mb-[1px] overflow-x-auto">
            <button
              onClick={() => setActiveTab('rotinas')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 rounded-t-xl ${
                activeTab === 'rotinas'
                  ? 'border-[#0a3d24] text-[#0a3d24] bg-emerald-50/80 font-black'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CalendarCheck className="w-4 h-4 text-[#0a3d24]" />
              <span>Rotinas Diárias</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-[#0a3d24] text-white uppercase tracking-wider">
                Hoje
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 rounded-t-xl ${
                activeTab === 'tasks'
                  ? 'border-[#0a3d24] text-[#0a3d24] bg-emerald-50/80 font-black'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Quadro Geral</span>
              {pendingTasksCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-100 text-[#09351e] rounded-full">
                  {pendingTasksCount}
                </span>
              )}
              {twoMinTasksCount > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-bold bg-amber-100 text-amber-900 rounded border border-amber-200">
                  ⚡ {twoMinTasksCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('purchases')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 rounded-t-xl ${
                activeTab === 'purchases'
                  ? 'border-[#0a3d24] text-[#0a3d24] bg-emerald-50/80 font-black'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Compras &amp; Reposição</span>
              {purchasesAlertCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold bg-rose-100 text-rose-800 rounded-full">
                  {purchasesAlertCount}
                </span>
              )}
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 rounded-t-xl ${
                    activeTab === 'audit'
                      ? 'border-[#0a3d24] text-[#0a3d24] bg-emerald-50/80 font-black'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Auditoria &amp; Baixas</span>
                  <span className="px-1 py-0.2 text-[9px] font-extrabold uppercase bg-emerald-200 text-emerald-950 rounded">
                    Admin
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('stats')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 rounded-t-xl ${
                    activeTab === 'stats'
                      ? 'border-[#0a3d24] text-[#0a3d24] bg-emerald-50/80 font-black'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Estatísticas &amp; PDF</span>
                  <span className="px-1 py-0.2 text-[9px] font-extrabold uppercase bg-emerald-200 text-emerald-950 rounded">
                    Admin
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ================= MOBILE APP BAR (sm:hidden) ================= */}
      <header className="sm:hidden bg-[#0a3821] text-white sticky top-0 z-30 shadow-md no-print">
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
          {/* Left: Brand & Store */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
              <Store className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-white leading-tight truncate">
                {settings.nomeLoja}
              </h1>
              {isAdmin ? (
                <button
                  onClick={onOpenUserSwitcher}
                  className="flex items-center gap-1 text-[11px] text-emerald-200 hover:text-white font-medium truncate cursor-pointer"
                >
                  <span>{currentUser.nome} (Admin)</span>
                  <ChevronDown className="w-3 h-3 text-emerald-300" />
                </button>
              ) : (
                <div className="flex items-center gap-1 text-[11px] text-emerald-200 font-medium truncate">
                  <Smartphone className="w-3 h-3 text-emerald-300 shrink-0" />
                  <span>{currentUser.nome} • Aparelho Vinculado</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Quick Touch Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <AndroidInstallButton variant="header" />

            <button
              onClick={onOpenCheckinModal}
              className="p-2 bg-amber-400 text-amber-950 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer shadow-xs"
              title="Check-in Matinal"
            >
              <Sun className="w-4 h-4 fill-amber-950" />
            </button>

            <button
              onClick={onOpenPrintModal}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer"
              title="Gerar Folha do Dia"
            >
              <Printer className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer"
                title="Menu"
              >
                <Menu className="w-4 h-4" />
              </button>

              {/* Mobile Settings Dropdown */}
              {showSettingsDropdown && (
                <div className="absolute right-0 mt-2 w-60 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 text-xs">
                  <div className="px-3 py-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 mb-1">
                    Menu Rápido ({currentUser.nome})
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        onOpenUserSwitcher();
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 font-bold text-slate-800"
                    >
                      <UserCheck className="w-4 h-4 text-[#0a3d24]" />
                      Equipe &amp; Aparelhos Vinculados
                    </button>
                  )}
                  {onOpenManual && (
                    <button
                      onClick={() => {
                        onOpenManual();
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-[#0a3d24] flex items-center gap-2 font-bold"
                    >
                      <BookOpen className="w-4 h-4 text-[#0a3d24]" />
                      Manual do Sistema
                    </button>
                  )}
                  {onOpenChangePin && (
                    <button
                      onClick={() => {
                        onOpenChangePin();
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-[#0a3d24] flex items-center gap-2 font-bold"
                    >
                      <KeyRound className="w-4 h-4 text-[#0a3d24]" />
                      Alterar Meu PIN (4 dígitos)
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onOpenSettingsModal();
                      setShowSettingsDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50 flex items-center gap-2 text-slate-900 font-bold"
                  >
                    <Bell className="w-4 h-4 text-amber-600" />
                    Configurações &amp; Alertas Sonoros
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          setActiveTab('audit');
                          setShowSettingsDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 text-slate-800 font-medium"
                      >
                        <History className="w-4 h-4 text-slate-600" />
                        Auditoria &amp; Baixas
                      </button>
                      {onOpenBackupModal && (
                        <button
                          onClick={() => {
                            onOpenBackupModal();
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 flex items-center gap-2 text-emerald-950 font-bold"
                        >
                          <Database className="w-4 h-4 text-emerald-700" />
                          Backup Diário (JSON)
                        </button>
                      )}
                    </>
                  )}
                  <div className="my-1 border-t border-slate-100" />
                  {onUnbindCurrentDevice && (
                    <button
                      onClick={() => {
                        onUnbindCurrentDevice();
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-700 flex items-center gap-2 font-bold"
                    >
                      <Unlink className="w-4 h-4" />
                      Desvincular Este Aparelho
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================= MOBILE BOTTOM NAVIGATION BAR (sm:hidden) ================= */}
      {/* 1-Thumb Ergonomic Mobile Bottom Nav Bar */}
      <nav
        aria-label="Navegação móvel"
        className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 h-16 flex items-center justify-around shadow-2xl px-1 select-none no-print"
      >
        {/* Tab 1: Rotinas */}
        <button
          onClick={() => setActiveTab('rotinas')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all cursor-pointer relative ${
            activeTab === 'rotinas'
              ? 'text-[#0a3821] font-black'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          {activeTab === 'rotinas' && (
            <span className="absolute top-0 inset-x-4 h-0.5 bg-[#0a3821] rounded-full" />
          )}
          <CalendarCheck className={`w-5 h-5 ${activeTab === 'rotinas' ? 'text-[#0a3821]' : 'text-slate-500'}`} />
          <span className="text-[11px] mt-0.5">Rotinas</span>
        </button>

        {/* Tab 2: Tarefas */}
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all cursor-pointer relative ${
            activeTab === 'tasks'
              ? 'text-[#0a3821] font-black'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          {activeTab === 'tasks' && (
            <span className="absolute top-0 inset-x-4 h-0.5 bg-[#0a3821] rounded-full" />
          )}
          <div className="relative">
            <ClipboardList className={`w-5 h-5 ${activeTab === 'tasks' ? 'text-[#0a3821]' : 'text-slate-500'}`} />
            {pendingTasksCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-[#0a3821] text-white text-[9px] font-bold rounded-full min-w-4 text-center">
                {pendingTasksCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-0.5">Tarefas</span>
        </button>

        {/* Tab 3: Compras */}
        <button
          onClick={() => setActiveTab('purchases')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all cursor-pointer relative ${
            activeTab === 'purchases'
              ? 'text-[#0a3821] font-black'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          {activeTab === 'purchases' && (
            <span className="absolute top-0 inset-x-4 h-0.5 bg-[#0a3821] rounded-full" />
          )}
          <div className="relative">
            <ShoppingCart className={`w-5 h-5 ${activeTab === 'purchases' ? 'text-[#0a3821]' : 'text-slate-500'}`} />
            {purchasesAlertCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-rose-600 text-white text-[9px] font-bold rounded-full min-w-4 text-center">
                {purchasesAlertCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-0.5">Compras</span>
        </button>

        {/* Tab 4: Estatísticas / PDF (ou Auditoria para Admin) */}
        {isAdmin ? (
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all cursor-pointer relative ${
              activeTab === 'stats'
                ? 'text-[#0a3821] font-black'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            {activeTab === 'stats' && (
              <span className="absolute top-0 inset-x-4 h-0.5 bg-[#0a3821] rounded-full" />
            )}
            <BarChart3 className={`w-5 h-5 ${activeTab === 'stats' ? 'text-[#0a3821]' : 'text-slate-500'}`} />
            <span className="text-[11px] mt-0.5">Estatísticas</span>
          </button>
        ) : (
          <button
            onClick={onOpenManual}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 transition-all cursor-pointer relative text-slate-500 hover:text-slate-800 font-medium"
          >
            <BookOpen className="w-5 h-5 text-slate-500" />
            <span className="text-[11px] mt-0.5">Guia</span>
          </button>
        )}
      </nav>
    </>
  );
};
