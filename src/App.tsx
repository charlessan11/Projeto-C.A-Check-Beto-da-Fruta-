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
import {
  bindCurrentDeviceToUser,
  unbindDeviceFromUser,
  findUserBoundToCurrentDevice,
  getOrCreateDeviceId,
} from './services/deviceService';
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
import { DailyBackupModal } from './components/DailyBackupModal';
import { BasicOperationalView } from './components/BasicOperationalView';
import {
  generateDailyBackupPayload,
  saveDailyBackupToLocalStorage,
  sendDailyBackupToServer,
} from './services/backupService';
import {
  getEffectiveSoundSettings,
  playTaskCompletionSound,
  playRoutineReminderSound,
} from './services/soundService';
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

  // Layout mode: 'basico' (default for Operacional) vs 'completo' (default for Administrador)
  const [viewMode, setViewMode] = useState<'basico' | 'completo'>('completo');

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
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

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

  // Initialize data on mount & check device auto-login
  useEffect(() => {
    const loadedUsers = loadUsers();
    setUsers(loadedUsers);
    const loadedCurrent = loadCurrentUser();
    setCurrentUser(loadedCurrent);

    const loadedRoutine = loadDailyRoutine();
    setRoutine(loadedRoutine);

    const initialTasks = loadTasks();
    const syncedTasks = syncRoutineWithTaskList(loadedRoutine, initialTasks);
    setTasks(syncedTasks);
    saveTasks(syncedTasks);

    setPurchases(loadPurchases());
    setSettings(loadSettings());

    // Fetch server state to sync bound devices across the store
    fetch('/api/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((serverData) => {
        if (serverData && Array.isArray(serverData.users) && serverData.users.length > 0) {
          const localList = loadUsers();
          // Merge server device bindings & PINs into local users
          const mergedUsers: User[] = localList.map((localU) => {
            const srvU = serverData.users.find(
              (su: User) => su.id === localU.id || su.nome === localU.nome
            );
            if (!srvU) return localU;

            const localDevs = localU.dispositivosVinculados || [];
            const srvDevs = Array.isArray(srvU.dispositivosVinculados)
              ? srvU.dispositivosVinculados
              : [];

            // Combine unique devices by deviceId
            const devMap = new Map<string, any>();
            srvDevs.forEach((d: any) => devMap.set(d.deviceId, d));
            localDevs.forEach((d) => devMap.set(d.deviceId, d));

            return {
              ...localU,
              pinCode: srvU.pinCode || localU.pinCode,
              dispositivosVinculados: Array.from(devMap.values()),
            };
          });

          setUsers(mergedUsers);
          localStorage.setItem('betodafruta_users_v2', JSON.stringify(mergedUsers));

          const autoUser = findUserBoundToCurrentDevice(mergedUsers);
          if (autoUser) {
            setCurrentUser(autoUser);
            saveCurrentUser(autoUser);
          }
        }
      })
      .catch(() => {
        // Offline mode continues using localStorage seamlessly
      });
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

  // Automatically set default viewMode whenever user logs in or switches profile:
  // Operacional -> starts in 'basico' | Administrador -> starts in 'completo'
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.perfil === 'Operacional') {
      setViewMode('basico');
    } else {
      setViewMode('completo');
    }
  }, [currentUser?.id, currentUser?.perfil]);

  // Enforce access control: only Administradores can view 'audit' and 'stats'
  useEffect(() => {
    if (currentUser && currentUser.perfil !== 'Administrador') {
      if (activeTab === 'audit' || activeTab === 'stats') {
        setActiveTab('rotinas');
      }
    }
  }, [currentUser?.perfil, activeTab]);

  // Automatic backup export to localStorage and server whenever tasks, purchases or routines change
  useEffect(() => {
    if (tasks.length === 0 && purchases.length === 0) return;

    const timer = setTimeout(() => {
      try {
        const payload = generateDailyBackupPayload({
          tasks,
          purchases,
          routine,
          settings,
          currentUser,
          tipo: 'Automatica',
        });
        saveDailyBackupToLocalStorage(payload);
        sendDailyBackupToServer(payload).catch(() => {});
      } catch (err) {
        console.warn('Falha silenciosa no backup automático:', err);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [tasks, purchases, routine, settings, currentUser]);

  // Periodic background auto-backup every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        if (tasks.length === 0 && purchases.length === 0) return;
        const payload = generateDailyBackupPayload({
          tasks,
          purchases,
          routine,
          settings,
          currentUser,
          tipo: 'Automatica',
        });
        saveDailyBackupToLocalStorage(payload);
        sendDailyBackupToServer(payload).catch(() => {});
      } catch {}
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tasks, purchases, routine, settings, currentUser]);

  // Helper to trigger a routine reminder notification & sound
  const triggerRoutineReminderAlert = (isManualTest = false) => {
    if (!currentUser) return;
    const todayStr = getTodayDateString();
    const pendingForUser = tasks.filter((t) => {
      if (t.dataProgramada !== todayStr || t.status === 'Concluída') return false;
      if (currentUser.perfil !== 'Administrador') {
        return t.responsavelId === currentUser.id || t.auxiliarId === currentUser.id;
      }
      return true;
    });

    if (pendingForUser.length > 0) {
      if (!isManualTest) {
        playRoutineReminderSound(settings);
      }
      const nextPriority = pendingForUser[0];
      showToast(
        `🔔 Lembrete de Rotina (${pendingForUser.length} pendente${pendingForUser.length > 1 ? 's' : ''})`,
        `Próxima: ${nextPriority.tituloAtividade}`
      );
    } else if (isManualTest) {
      showToast(
        '🔔 Teste de Lembrete de Rotina',
        'Parabéns! Todas as rotinas programadas para hoje já estão concluídas.'
      );
    }
  };

  // Periodic gentle routine reminder based on system settings
  useEffect(() => {
    if (!currentUser) return;
    const soundCfg = getEffectiveSoundSettings(settings);
    if (!soundCfg.ativo || !soundCfg.somLembreteRotina) return;

    const intervalMinutes = Math.max(5, soundCfg.intervaloLembreteMinutos || 30);
    const intervalMs = intervalMinutes * 60 * 1000;

    const reminderTimer = setInterval(() => {
      triggerRoutineReminderAlert(false);
    }, intervalMs);

    return () => clearInterval(reminderTimer);
  }, [
    currentUser?.id,
    settings.alertasSonoros?.ativo,
    settings.alertasSonoros?.somLembreteRotina,
    settings.alertasSonoros?.intervaloLembreteMinutos,
    settings.alertasSonoros?.tomLembrete,
    settings.alertasSonoros?.volume,
    tasks,
  ]);

  // Auto-sync DailyRoutine with TaskList whenever routine changes
  const handleUpdateRoutine = (updated: DailyRoutine) => {
    const prevCompletedCount = tasks.filter((t) => t.status === 'Concluída').length;
    setRoutine(updated);
    saveDailyRoutine(updated);
    const syncedTasks = syncRoutineWithTaskList(updated, tasks);
    const nextCompletedCount = syncedTasks.filter((t) => t.status === 'Concluída').length;
    setTasks(syncedTasks);
    saveTasks(syncedTasks);

    if (nextCompletedCount > prevCompletedCount) {
      playTaskCompletionSound(settings);
    }
  };

  const handleSyncRoutineWithTasks = () => {
    const updatedTasks = syncRoutineWithTaskList(routine, tasks);
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    showToast(
      'Rotinas Sincronizadas!',
      'As rotinas de hoje estão espelhadas em tempo real no Quadro Geral de Tarefas.'
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
      const wasCompleted = taskToEdit.status === 'Concluída';
      const isNowCompleted = taskData.status === 'Concluída';
      const updated = tasks.map((t) => (t.id === taskData.id ? ({ ...t, ...taskData } as Task) : t));
      handleSaveTasks(updated);
      if (!wasCompleted && isNowCompleted) {
        playTaskCompletionSound(settings);
      }
      showToast('Atividade atualizada com sucesso!');
    } else {
      const newTask = taskData as Task;
      const updated = [newTask, ...tasks];
      handleSaveTasks(updated);
      if (newTask.status === 'Concluída') {
        playTaskCompletionSound(settings);
      }
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
    playTaskCompletionSound(settings);

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

  // Unbind current device action (with confirmation dialog)
  const handleUnbindCurrentDevice = () => {
    if (!currentUser) return;
    const currentDeviceId = getOrCreateDeviceId();
    setConfirmDialog({
      isOpen: true,
      title: 'Desvincular Este Aparelho',
      message: `Deseja desvincular este aparelho do perfil de ${currentUser.nome}? No próximo acesso será solicitado o PIN de 4 dígitos.`,
      onConfirm: () => {
        const updatedUsers = unbindDeviceFromUser(users, currentUser.id, currentDeviceId);
        setUsers(updatedUsers);
        saveUsers(updatedUsers);
        setCurrentUser(null);
        saveCurrentUser(null);
        setConfirmDialog(null);
        showToast('Aparelho desvinculado!', 'Selecione um colaborador para vincular novamente.');
      },
    });
  };

  // Admin unbind any device from a user profile inside UserSwitcherModal
  const handleAdminUnbindDevice = (userId: string, deviceIdToRemove: string) => {
    const targetUser = users.find((u) => u.id === userId);
    const updatedUsers = unbindDeviceFromUser(users, userId, deviceIdToRemove);
    setUsers(updatedUsers);
    saveUsers(updatedUsers);

    const currentDeviceId = getOrCreateDeviceId();
    if (userId === currentUser?.id && deviceIdToRemove === currentDeviceId) {
      const refreshedMe = updatedUsers.find((u) => u.id === currentUser.id) || null;
      setCurrentUser(refreshedMe);
    }
    showToast(
      'Dispositivo removido!',
      `O aparelho foi desvinculado do perfil de ${targetUser?.nome || 'colaborador'}.`
    );
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

  const handleBatchAddPurchases = (
    newItems: PurchaseItem[],
    saveMode: 'replace' | 'append' = 'replace'
  ) => {
    const updated = saveMode === 'replace' ? newItems : [...newItems, ...purchases];
    handleSavePurchases(updated);
    showToast(
      saveMode === 'replace'
        ? `✨ Lista do dia atualizada com ${newItems.length} produtos!`
        : `✨ ${newItems.length} produtos somados à Lista de Compras!`,
      saveMode === 'replace'
        ? 'A lista anterior foi substituída pelos novos produtos importados.'
        : 'Os novos itens foram adicionados junto aos produtos existentes.'
    );
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
    if (!currentState) {
      playTaskCompletionSound(settings);
    }
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
    if (nextState) {
      playTaskCompletionSound(settings);
    }
    showToast(
      nextState ? 'Reposição Concluída na Banca!' : 'Reposição marcada como Pendente',
      item?.produto
    );
  };

  // User login & device binding (or Admin profile inspection)
  const handleLoginAndBindUser = (user: User, customDeviceName?: string) => {
    const { updatedUsers, updatedUser } = bindCurrentDeviceToUser(
      users,
      user.id,
      customDeviceName
    );
    const finalUser = updatedUser || user;
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    setCurrentUser(finalUser);
    saveCurrentUser(finalUser);
    showToast(
      `Aparelho vinculado a ${finalUser.nome}!`,
      'Nos próximos acessos, este dispositivo entrará automaticamente no seu perfil.'
    );
  };

  // Admin switching profile view via UserSwitcherModal
  const handleAdminSwitchProfile = (user: User, customDeviceName?: string) => {
    if (customDeviceName) {
      handleLoginAndBindUser(user, customDeviceName);
      return;
    }
    setCurrentUser(user);
    saveCurrentUser(user);
    showToast(
      `Perfil ativo: ${user.nome}`,
      `Nível: ${user.perfil} (${user.setoresAtuacao || user.setorPadrao || 'Geral'})`
    );
  };

  const handleAddUser = (user: User) => {
    const updated = [...users, user];
    setUsers(updated);
    saveUsers(updated);
    showToast(`Colaborador ${user.nome} cadastrado!`, `PIN inicial: ${user.pinCode || '1234'}`);
  };

  // Reset to defaults (with in-app confirmation modal)
  const handleResetData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Restaurar Dados Originais',
      message:
        'Deseja restaurar as tarefas e listas para o estado padrão do Hortifrúti Beto da Fruta?',
      onConfirm: () => {
        resetToDefaults();
        setUsers(loadUsers());
        const initialUser = loadCurrentUser();
        setCurrentUser(initialUser);
        setTasks(loadTasks());
        setPurchases(loadPurchases());
        setSettings(loadSettings());
        setConfirmDialog(null);
        showToast('Dados restaurados para o padrão do Hortifrúti!');
      },
    });
  };

  // Calculated counters (respecting operational isolation for non-admin users)
  const today = getTodayDateString();
  const pendingTasksCount = useMemo(() => {
    return tasks.filter((t) => {
      if (t.dataProgramada !== today || t.status === 'Concluída') return false;
      if (currentUser && currentUser.perfil !== 'Administrador') {
        return t.responsavelId === currentUser.id || t.auxiliarId === currentUser.id;
      }
      return true;
    }).length;
  }, [tasks, today, currentUser]);

  const twoMinTasksCount = useMemo(() => {
    return tasks.filter((t) => {
      if (
        t.dataProgramada !== today ||
        t.status === 'Concluída' ||
        t.tipoTempo !== '2 Minutos (Fazer na Transição)'
      ) {
        return false;
      }
      if (currentUser && currentUser.perfil !== 'Administrador') {
        return t.responsavelId === currentUser.id || t.auxiliarId === currentUser.id;
      }
      return true;
    }).length;
  }, [tasks, today, currentUser]);

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
        onSelectUser={handleLoginAndBindUser}
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
        onOpenUserSwitcher={() => {
          if (currentUser.perfil === 'Administrador') {
            setIsUserSwitcherOpen(true);
          }
        }}
        onUnbindCurrentDevice={handleUnbindCurrentDevice}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'audit' || tab === 'stats') {
            setViewMode('completo');
          }
        }}
        pendingTasksCount={pendingTasksCount}
        twoMinTasksCount={twoMinTasksCount}
        purchasesAlertCount={purchasesAlertCount}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenCheckinModal={() => setIsCheckinModalOpen(true)}
        onOpenChangePin={() => setIsChangePinOpen(true)}
        onOpenManual={() => setIsManualOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        settings={settings}
        onResetData={handleResetData}
        viewMode={viewMode}
        onToggleViewMode={() => {
          const nextMode = viewMode === 'basico' ? 'completo' : 'basico';
          setViewMode(nextMode);
          if (nextMode === 'basico' && (activeTab === 'audit' || activeTab === 'stats')) {
            setActiveTab('rotinas');
          }
          showToast(
            nextMode === 'basico' ? 'Modo Básico Ativado' : 'Modo Completo Ativado',
            nextMode === 'basico'
              ? 'Visualização limpa com botões grandes para operação rápida.'
              : 'Visualização avançada com todos os filtros e relatórios.'
          );
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-24 sm:py-6">
        {viewMode === 'basico' ? (
          <BasicOperationalView
            currentUser={currentUser}
            users={users}
            routine={routine}
            onUpdateRoutine={handleUpdateRoutine}
            tasks={tasks}
            onQuickCompleteTask={(taskId, obs) => handleConfirmQuickCheck(taskId, obs || '')}
            onReopenTask={handleReopenTask}
            onAddTask={() => {
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
            purchases={purchases}
            onUpdatePurchase={(item) => {
              const updated = purchases.map((p) => (p.id === item.id ? item : p));
              handleSavePurchases(updated);
              if (item.mercadoriaRecebida || item.reposicaoConcluida) {
                playTaskCompletionSound(settings);
              }
            }}
            onSavePurchases={(items) => {
              handleSavePurchases(items);
              playTaskCompletionSound(settings);
              showToast('Conferência atualizada!', 'Todos os itens marcados como recebidos na loja.');
            }}
            onBatchAddPurchases={handleBatchAddPurchases}
            onAddPurchase={() => {
              setPurchaseToEdit(null);
              setIsPurchaseModalOpen(true);
            }}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onSwitchToCompleteMode={() => {
              setViewMode('completo');
              showToast('Modo Completo Ativado', 'Todas as ferramentas avançadas estão visíveis.');
            }}
            settings={settings}
          />
        ) : (
          <>
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
                onBatchAddPurchases={handleBatchAddPurchases}
                onUpdatePurchase={(item) => {
                  const updated = purchases.map((p) => (p.id === item.id ? item : p));
                  handleSavePurchases(updated);
                }}
              />
            )}

            {/* Aba 4: Auditoria & Baixas - Somente Administradores */}
            {activeTab === 'audit' && currentUser.perfil === 'Administrador' && (
              <AuditLogView
                tasks={tasks}
                users={users}
                onOpenBackupModal={() => setIsBackupModalOpen(true)}
              />
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
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 text-center text-xs text-slate-500 no-print">
        <p>
          <strong>{settings.nomeLoja}</strong> • Encarregado do Hortifrúti: {settings.gerenteResponsavel} • Proprietários: {settings.proprietario} • Metodologia SMART, Pomodoro &amp; Regra dos 2 Minutos (GTD)
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
        onSelectUser={handleAdminSwitchProfile}
        onAddUser={handleAddUser}
        onUnbindDevice={handleAdminUnbindDevice}
        onRefreshUsers={() => setUsers(loadUsers())}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        currentUser={currentUser}
        onSave={handleSaveSettings}
        onPreviewCheckin={() => setIsCheckinModalOpen(true)}
        onTriggerRoutineReminderTest={() => triggerRoutineReminderAlert(true)}
        onOpenChangePin={() => setIsChangePinOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      {/* Modal de Backup Diário e Exportação JSON (Gestão) */}
      {currentUser && currentUser.perfil === 'Administrador' && (
        <DailyBackupModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
          tasks={tasks}
          purchases={purchases}
          routine={routine}
          settings={settings}
          currentUser={currentUser}
          onShowToast={showToast}
        />
      )}

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

      {/* Modal para Alterar PIN Individual (Todos os Colaboradores) */}
      {currentUser && (
        <ChangeAdminPinModal
          isOpen={isChangePinOpen}
          onClose={() => setIsChangePinOpen(false)}
          currentUser={currentUser}
          onSuccess={() => {
            setUsers(loadUsers());
            showToast(
              'PIN Individual alterado com sucesso!',
              `A nova senha de 4 dígitos foi salva para ${currentUser.nome}.`
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
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
