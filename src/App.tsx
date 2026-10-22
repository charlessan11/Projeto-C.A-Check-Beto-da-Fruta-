/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  loadUsers,
  saveUsers,
  loadCurrentUser,
  saveCurrentUser,
  loadTasks,
  saveTasks,
  loadPurchases,
  savePurchases,
  loadSettings,
  saveSettings,
  resetToDefaults,
  getTodayDateString,
} from './services/storage';
import { loadDailyRoutine, saveDailyRoutine, syncRoutineWithTaskList } from './services/routineEngine';
import { User, Task, PurchaseItem, StoreSettings, DailyRoutine } from './types';
import { Header } from './components/Header';
import { TaskList } from './components/TaskList';
import { TaskModal } from './components/TaskModal';
import { QuickCheckModal } from './components/QuickCheckModal';
import { GTDTransitionModal } from './components/GTDBanner';
import { PurchaseList } from './components/PurchaseList';
import { PurchaseModal } from './components/PurchaseModal';
import { PrintSheetModal } from './components/PrintSheetModal';
import { AuditLogView } from './components/AuditLogModal';
import { UserSwitcherModal } from './components/UserSwitcherModal';
import { StatsDashboard } from './components/StatsDashboard';
import { SettingsModal } from './components/SettingsModal';
import { CheckinWelcomeModal } from './components/CheckinWelcomeModal';
import { LoginScreen } from './components/LoginScreen';
import { PomodoroModal } from './components/PomodoroModal';
import { DailyRoutinesTab } from './components/DailyRoutinesTab';
import { ChangeAdminPinModal } from './components/ChangeAdminPinModal';
import { SystemManualModal } from './components/SystemManualModal';
import { CheckCircle2, AlertTriangle, Sparkles, X } from 'lucide-react';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(loadSettings());
  const [routine, setRoutine] = useState<DailyRoutine>(() => loadDailyRoutine());

  // Navigation tab (defaults to rotinas for daily operational focus)
  const [activeTab, setActiveTab] = useState<'rotinas' | 'tasks' | 'purchases' | 'audit' | 'stats'>('rotinas');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const [isQuickCheckOpen, setIsQuickCheckOpen] = useState(false);
  const [taskForQuickCheck, setTaskForQuickCheck] = useState<Task | null>(null);

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = useState<PurchaseItem | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);

  // Pomodoro Timer state
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [taskForPomodoro, setTaskForPomodoro] = useState<Task | null>(null);

  // GTD Transition Alert
  const [isGTDModalOpen, setIsGTDModalOpen] = useState(false);
  const [justCompletedTaskTitle, setJustCompletedTaskTitle] = useState('');
  const [focusTwoMinuteQueue, setFocusTwoMinuteQueue] = useState(false);

  // In-app confirmation dialog (safe for iframe)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // In-app toast notification
  const [toastMessage, setToastMessage] = useState<{ title: string; subtitle?: string } | null>(null);

  const showToast = (title: string, subtitle?: string) => {
    setToastMessage({ title, subtitle });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Initialize data on mount
  useEffect(() => {
    const loadedUsers = loadUsers();
    setUsers(loadedUsers);
    const loadedCurrent = loadCurrentUser();
    setCurrentUser(loadedCurrent);
    setTasks(loadTasks());
    setPurchases(loadPurchases());
    setSettings(loadSettings());
  }, []);

  // Morning check-in auto-prompt on login / session start if enabled
  useEffect(() => {
    if (!currentUser || settings.checkinAtivo === false) return;
    const today = getTodayDateString();
    const checkinKey = `hortigestion_checkin_${currentUser.id}_${today}`;
    const alreadyCheckedIn = localStorage.getItem(checkinKey);
    if (!alreadyCheckedIn) {
      // Auto-open check-in greeting and priority briefing
      const timer = setTimeout(() => {
        setIsCheckinModalOpen(true);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [currentUser?.id, settings.checkinAtivo]);

  // Enforce access control: only Administradores can view 'audit' and 'stats'
  useEffect(() => {
    if (currentUser && currentUser.perfil !== 'Administrador') {
      if (activeTab === 'audit' || activeTab === 'stats') {
        setActiveTab('rotinas');
      }
    }
  }, [currentUser?.perfil, activeTab]);

  const handleUpdateRoutine = (updated: DailyRoutine) => {
    setRoutine(updated);
    saveDailyRoutine(updated);
  };

  const handleSyncRoutineWithTasks = () => {
    const updatedTasks = syncRoutineWithTaskList(routine, tasks);
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    showToast(
      'Rotinas Sincronizadas!',
      'As rotinas de hoje foram espelhadas no Quadro Geral de Tarefas.'
    );
  };

  const handleConfirmCheckin = () => {
    if (currentUser) {
      const today = getTodayDateString();
      const checkinKey = `hortigestion_checkin_${currentUser.id}_${today}`;
      localStorage.setItem(checkinKey, new Date().toISOString());
    }
    setActiveTab('rotinas');
    showToast(
      'Check-in matinal confirmado!',
      `Bom turno de trabalho, ${currentUser?.nome.split(' ')[0]}!`
    );
  };

  const handleSaveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    showToast(
      'Configurações salvas!',
      `Horário de Check-in Matinal definido para: ${newSettings.horarioCheckinMatinal}`
    );
  };

  // Save tasks on change
  const handleSaveTasks = (updated: Task[]) => {
    setTasks(updated);
    saveTasks(updated);
  };

  // Save purchases on change
  const handleSavePurchases = (updated: PurchaseItem[]) => {
    setPurchases(updated);
    savePurchases(updated);
  };

  // Task actions
  const handleCreateOrUpdateTask = (taskData: Partial<Task>) => {
    if (taskToEdit) {
      const updated = tasks.map((t) => (t.id === taskData.id ? ({ ...t, ...taskData } as Task) : t));
      handleSaveTasks(updated);
      showToast('Atividade atualizada com sucesso!');
    } else {
      const newTask = taskData as Task;
      const updated = [newTask, ...tasks];
      handleSaveTasks(updated);
      showToast('Nova atividade operacional cadastrada!');
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Atividade',
      message: 'Tem certeza de que deseja excluir esta atividade operacional?',
      onConfirm: () => {
        const updated = tasks.filter((t) => t.id !== taskId);
        handleSaveTasks(updated);
        showToast('Atividade removida.');
        setConfirmDialog(null);
      },
    });
  };

  const handleStartTask = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, status: 'Em Andamento' as const };
      }
      return t;
    });
    handleSaveTasks(updated);
    showToast('Atividade iniciada!', 'Status alterado para Em Andamento');
  };

  const handleReopenTask = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'Pendente' as const,
          dataHoraConclusao: undefined,
          concluidoPorId: undefined,
          concluidoPorNome: undefined,
        };
      }
      return t;
    });
    handleSaveTasks(updated);
    showToast('Atividade reaberta!');
  };

  // Floor quick completion
  const handleOpenQuickCheck = (task: Task) => {
    setTaskForQuickCheck(task);
    setIsQuickCheckOpen(true);
  };

  const handleConfirmQuickCheck = (taskId: string, observacao: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !currentUser) return;

    const isStandardTask = task.tipoTempo === 'Tarefa Padrão';

    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'Concluída' as const,
          dataHoraConclusao: new Date().toISOString(),
          concluidoPorId: currentUser.id,
          concluidoPorNome: currentUser.nome,
          observacaoOperacional: observacao || t.observacaoOperacional,
        };
      }
      return t;
    });

    handleSaveTasks(updated);

    // GTD Business Rule (Section 2.1):
    // "Sempre que o colaborador finalizar uma Atividade Padrão, o sistema orienta que ele olhe a Fila de 2 Minutos
    // e execute imediatamente o que estiver ali antes de iniciar a próxima tarefa grande."
    if (isStandardTask) {
      setJustCompletedTaskTitle(task.tituloAtividade);
      setIsGTDModalOpen(true);
    } else {
      showToast('Micro-ação concluída!', '⚡ 2 Minutos realizados com sucesso.');
    }
  };

  // Pomodoro action
  const handleStartPomodoro = (task: Task) => {
    setTaskForPomodoro(task);
    setIsPomodoroOpen(true);
  };

  // Logout action
  const handleLogout = () => {
    setCurrentUser(null);
    saveCurrentUser(null);
    showToast('Sessão finalizada', 'Selecione um colaborador para entrar');
  };

  // Purchase actions (Tabela 3 - Simplificada para o Beto da Fruta)
  const handleCreateOrUpdatePurchase = (itemData: Partial<PurchaseItem>) => {
    if (purchaseToEdit) {
      const updated = purchases.map((p) =>
        p.id === itemData.id ? ({ ...p, ...itemData } as PurchaseItem) : p
      );
      handleSavePurchases(updated);
      showToast('Item de reposição atualizado.');
    } else {
      const newItem = itemData as PurchaseItem;
      const updated = [newItem, ...purchases];
      handleSavePurchases(updated);
      showToast('Produto adicionado à Lista de Compras!', 'Registrado no checklist de reposição');
    }
  };

  const handleDeletePurchase = (itemId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Item de Compra',
      message: 'Tem certeza de que deseja excluir este item de reposição/compra?',
      onConfirm: () => {
        const updated = purchases.filter((p) => p.id !== itemId);
        handleSavePurchases(updated);
        showToast('Item de compra removido.');
        setConfirmDialog(null);
      },
    });
  };

  const handleToggleRecebida = (itemId: string, currentState: boolean) => {
    const updated = purchases.map((p) => {
      if (p.id === itemId) {
        const nextState = !currentState;
        return {
          ...p,
          mercadoriaRecebida: nextState,
          reposicaoConcluida: nextState ? p.reposicaoConcluida : false,
          dataAtualizacao: new Date().toISOString(),
        };
      }
      return p;
    });
    handleSavePurchases(updated);
    showToast(
      !currentState ? 'Mercadoria Recebida na Loja!' : 'Marcada como Pendente de Chegada',
      'Etapa (a) do checklist direto atualizada'
    );
  };

  const handleToggleReposicao = (itemId: string, currentState: boolean) => {
    const item = purchases.find((p) => p.id === itemId);
    const nextState = !currentState;
    const updated = purchases.map((p) => {
      if (p.id === itemId) {
        return {
          ...p,
          mercadoriaRecebida: nextState ? true : p.mercadoriaRecebida,
          reposicaoConcluida: nextState,
          dataAtualizacao: new Date().toISOString(),
        };
      }
      return p;
    });
    handleSavePurchases(updated);
    showToast(
      nextState ? 'Reposição Concluída na Banca!' : 'Reposição marcada como Pendente',
      item?.produto
    );
  };

  // User switcher
  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    saveCurrentUser(user);
    showToast(`Perfil ativo: ${user.nome}`, `Nível: ${user.perfil} (${user.setoresAtuacao || user.setorPadrao || 'Geral'})`);
  };

  const handleAddUser = (user: User) => {
    const updated = [...users, user];
    setUsers(updated);
    saveUsers(updated);
  };

  // Reset to defaults
  const handleResetData = () => {
    resetToDefaults();
    setUsers(loadUsers());
    const initialUser = loadCurrentUser();
    setCurrentUser(initialUser);
    setTasks(loadTasks());
    setPurchases(loadPurchases());
    setSettings(loadSettings());
    showToast('Dados restaurados para o padrão do Hortifrúti!');
  };

  // Calculated counters
  const today = getTodayDateString();
  const pendingTasksCount = useMemo(() => {
    return tasks.filter((t) => t.dataProgramada === today && t.status !== 'Concluída').length;
  }, [tasks, today]);

  const twoMinTasksCount = useMemo(() => {
    return tasks.filter(
      (t) =>
        t.dataProgramada === today &&
        t.status !== 'Concluída' &&
        t.tipoTempo === '2 Minutos (Fazer na Transição)'
    ).length;
  }, [tasks, today]);

  const purchasesAlertCount = useMemo(() => {
    // Shows items pending arrival OR pending replenishment on the shelf
    return purchases.filter((p) => !p.reposicaoConcluida).length;
  }, [purchases]);

  // If no user is logged in, display the Login Screen with all employees (Beto da Fruta)
  if (!currentUser) {
    return (
      <LoginScreen
        users={users}
        tasks={tasks}
        onSelectUser={handleSelectUser}
        storeName={settings.nomeLoja}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 max-w-sm flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-white text-sm">{toastMessage.title}</p>
            {toastMessage.subtitle && (
              <p className="text-slate-300 mt-0.5">{toastMessage.subtitle}</p>
            )}
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Top Header */}
      <Header
        currentUser={currentUser}
        onOpenUserSwitcher={() => setIsUserSwitcherOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingTasksCount={pendingTasksCount}
        twoMinTasksCount={twoMinTasksCount}
        purchasesAlertCount={purchasesAlertCount}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenCheckinModal={() => setIsCheckinModalOpen(true)}
        onOpenChangePin={() => setIsChangePinOpen(true)}
        onOpenManual={() => setIsManualOpen(true)}
        settings={settings}
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-24 sm:py-6">
        {/* Aba 1: Rotinas Diárias Obrigatórias (Beto da Fruta) */}
        {activeTab === 'rotinas' && (
          <DailyRoutinesTab
            routine={routine}
            onUpdateRoutine={handleUpdateRoutine}
            users={users}
            currentUser={currentUser}
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
            onNavigateToPurchases={() => setActiveTab('purchases')}
            onSyncWithTasks={handleSyncRoutineWithTasks}
          />
        )}

        {/* Aba 2: Quadro Geral de Tarefas */}
        {activeTab === 'tasks' && (
          <TaskList
            tasks={tasks}
            users={users}
            currentUser={currentUser}
            onAddTask={() => {
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onQuickComplete={handleOpenQuickCheck}
            onStartTask={handleStartTask}
            onReopenTask={handleReopenTask}
            onOpenPrintModal={() => setIsPrintModalOpen(true)}
            onStartPomodoro={handleStartPomodoro}
            focusTwoMinute={focusTwoMinuteQueue}
            setFocusTwoMinute={setFocusTwoMinuteQueue}
          />
        )}

        {/* Aba 3: Compras & Reposição */}
        {activeTab === 'purchases' && (
          <PurchaseList
            purchases={purchases}
            currentUser={currentUser}
            settings={settings}
            onAddPurchase={() => {
              setPurchaseToEdit(null);
              setIsPurchaseModalOpen(true);
            }}
            onEditPurchase={(item) => {
              setPurchaseToEdit(item);
              setIsPurchaseModalOpen(true);
            }}
            onDeletePurchase={handleDeletePurchase}
            onToggleRecebida={handleToggleRecebida}
            onToggleReposicao={handleToggleReposicao}
            onSavePurchases={handleSavePurchases}
            onUpdatePurchase={(item) => {
              const updated = purchases.map((p) => (p.id === item.id ? item : p));
              handleSavePurchases(updated);
            }}
          />
        )}

        {/* Aba 4: Auditoria & Baixas - Somente Administradores */}
        {activeTab === 'audit' && currentUser.perfil === 'Administrador' && (
          <AuditLogView tasks={tasks} users={users} />
        )}

        {/* Aba 5: Estatísticas & Tempos - Somente Administradores */}
        {activeTab === 'stats' && currentUser.perfil === 'Administrador' && (
          <StatsDashboard
            tasks={tasks}
            users={users}
            currentUser={currentUser}
            settings={settings}
            routine={routine}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 text-center text-xs text-slate-500 no-print">
        <p>
          <strong>{settings.nomeLoja}</strong> • Encarregado: {settings.gerenteResponsavel} • Proprietário: {settings.proprietario} • Metodologia SMART, Pomodoro &amp; Regra dos 2 Minutos (GTD)
        </p>
      </footer>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSave={handleCreateOrUpdateTask}
        taskToEdit={taskToEdit}
        users={users}
        currentUser={currentUser}
      />

      <QuickCheckModal
        isOpen={isQuickCheckOpen}
        onClose={() => {
          setIsQuickCheckOpen(false);
          setTaskForQuickCheck(null);
        }}
        task={taskForQuickCheck}
        currentUser={currentUser}
        onConfirm={handleConfirmQuickCheck}
      />

      <GTDTransitionModal
        isOpen={isGTDModalOpen}
        onClose={() => setIsGTDModalOpen(false)}
        completedTaskTitle={justCompletedTaskTitle}
        twoMinuteTasksCount={twoMinTasksCount}
        onFocusTwoMinuteTasks={() => {
          setActiveTab('tasks');
          setFocusTwoMinuteQueue(true);
        }}
      />

      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => {
          setIsPurchaseModalOpen(false);
          setPurchaseToEdit(null);
        }}
        onSave={handleCreateOrUpdatePurchase}
        itemToEdit={purchaseToEdit}
        currentUser={currentUser}
      />

      <PrintSheetModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        tasks={tasks}
        users={users}
        settings={settings}
        routine={routine}
      />

      <UserSwitcherModal
        isOpen={isUserSwitcherOpen}
        onClose={() => setIsUserSwitcherOpen(false)}
        users={users}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        onAddUser={handleAddUser}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        currentUser={currentUser}
        onSave={handleSaveSettings}
        onPreviewCheckin={() => setIsCheckinModalOpen(true)}
        onOpenChangePin={() => setIsChangePinOpen(true)}
      />

      <CheckinWelcomeModal
        isOpen={isCheckinModalOpen}
        onClose={() => setIsCheckinModalOpen(false)}
        currentUser={currentUser}
        settings={settings}
        todayTasks={tasks.filter((t) => t.dataProgramada === today)}
        purchases={purchases}
        routine={routine}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onConfirmCheckin={handleConfirmCheckin}
      />

      {/* Modal para Alterar Senha de Administrador (PIN Individual) */}
      {currentUser && currentUser.perfil === 'Administrador' && (
        <ChangeAdminPinModal
          isOpen={isChangePinOpen}
          onClose={() => setIsChangePinOpen(false)}
          currentUser={currentUser}
          onSuccess={() => {
            showToast(
              'Senha de Administrador alterada com sucesso!',
              `A nova senha de 4 dígitos foi salva individualmente para ${currentUser.nome}.`
            );
          }}
        />
      )}

      <PomodoroModal
        isOpen={isPomodoroOpen}
        onClose={() => {
          setIsPomodoroOpen(false);
          setTaskForPomodoro(null);
        }}
        task={taskForPomodoro}
        onFocusTwoMinuteQueue={() => {
          setActiveTab('tasks');
          setFocusTwoMinuteQueue(true);
        }}
      />

      <SystemManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        settings={settings}
      />

      {/* Confirmation Dialog Modal (safe for iframes, no window.confirm) */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{confirmDialog.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{confirmDialog.message}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
