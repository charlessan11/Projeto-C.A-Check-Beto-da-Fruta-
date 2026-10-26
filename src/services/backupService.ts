import { Task, PurchaseItem, DailyRoutine, StoreSettings, User } from '../types';
import { getTodayDateString, loadUsers } from './storage';

export interface DailyBackupMetadata {
  versao: string;
  dataBackup: string; // YYYY-MM-DD
  dataHoraGeracao: string; // ISO
  loja: string;
  unidade?: string;
  gerenteResponsavel: string;
  proprietario: string;
  tipoExportacao: 'Automatica' | 'Manual Administrador';
  exportadoPor?: {
    id: string;
    nome: string;
    perfil: string;
  };
  resumo: {
    totalAtividadesDia: number;
    atividadesConcluidasDia: number;
    taxaConclusaoAtividades: string;
    totalItensComprasDia: number;
    itensRecebidos: number;
    itensReposicaoConcluida: number;
    colaboradoresComAtividade: string[];
  };
}

export interface DailyBackupPayload {
  metadados: DailyBackupMetadata;
  atividadesDoDia: Task[];
  rotinaDiaria: DailyRoutine | null;
  comprasDoDia: PurchaseItem[];
  auditoriaBaixasDoDia: Array<{
    id: string;
    titulo: string;
    concluidoPorNome?: string;
    concluidoPorId?: string;
    dataHoraConclusao?: string;
    observacaoOperacional?: string;
    categoria?: string;
    tipoTempo?: string;
  }>;
}

export interface BackupHistoryEntry {
  dataBackup: string;
  timestamp: string;
  filename: string;
  tipo: 'Automatica' | 'Manual Administrador';
  totalAtividades: number;
  totalCompras: number;
  taxaConclusao: string;
  origem: 'localStorage' | 'servidor';
}

const BACKUP_PREFIX = 'betodafruta_backup_daily_';
const BACKUP_META_KEY = 'betodafruta_backup_meta_v2';
const BACKUP_HISTORY_KEY = 'betodafruta_backup_history_v2';

/**
 * Filter tasks that pertain to a specific day:
 * - dataProgramada matching targetDate
 * - or completed on targetDate
 * - or created on targetDate
 */
export function filterTasksForDate(tasks: Task[], targetDate: string): Task[] {
  return tasks.filter((t) => {
    const isTargetDateProgramada = t.dataProgramada === targetDate;
    const isCompletedToday = t.dataHoraConclusao && t.dataHoraConclusao.startsWith(targetDate);
    const isCreatedToday = t.criadoEm && t.criadoEm.startsWith(targetDate);
    return isTargetDateProgramada || isCompletedToday || isCreatedToday;
  });
}

/**
 * Filter purchases that pertain to a specific day:
 * - order date matching targetDate
 * - updated on targetDate
 * - or if none matched, all current items in the procurement list
 */
export function filterPurchasesForDate(purchases: PurchaseItem[], targetDate: string): PurchaseItem[] {
  const dateSpecific = purchases.filter((p) => {
    const isOrderDate = p.data === targetDate;
    const isUpdatedToday = p.dataAtualizacao && p.dataAtualizacao.startsWith(targetDate);
    return isOrderDate || isUpdatedToday;
  });

  return dateSpecific.length > 0 ? dateSpecific : purchases;
}

/**
 * Generates the complete, structured daily backup payload.
 */
export function generateDailyBackupPayload(
  params: {
    targetDate?: string;
    tasks: Task[];
    purchases: PurchaseItem[];
    routine: DailyRoutine | null;
    settings: StoreSettings;
    currentUser?: User | null;
    tipo?: 'Automatica' | 'Manual Administrador';
  }
): DailyBackupPayload {
  const targetDate = params.targetDate || getTodayDateString();
  const dayTasks = filterTasksForDate(params.tasks, targetDate);
  const dayPurchases = filterPurchasesForDate(params.purchases, targetDate);

  const users = loadUsers();
  const userMap = new Map<string, string>();
  users.forEach((u) => userMap.set(u.id, u.nome));

  const completedDayTasks = dayTasks.filter(
    (t) => t.status === 'Concluída' || !!t.dataHoraConclusao
  );
  const totalTasks = dayTasks.length;
  const completedCount = completedDayTasks.length;
  const taxaPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const itensRecebidos = dayPurchases.filter((p) => p.mercadoriaRecebida).length;
  const itensReposicao = dayPurchases.filter((p) => p.reposicaoConcluida).length;

  const activeColaboradoresSet = new Set<string>();
  dayTasks.forEach((t) => {
    const respNome = userMap.get(t.responsavelId) || t.concluidoPorNome;
    if (respNome) activeColaboradoresSet.add(respNome);
    if (t.auxiliarNome) activeColaboradoresSet.add(t.auxiliarNome);
    if (t.concluidoPorNome) activeColaboradoresSet.add(t.concluidoPorNome);
  });
  dayPurchases.forEach((p) => {
    if (p.conferidoPorNome) activeColaboradoresSet.add(p.conferidoPorNome);
    if (p.repostoPorNome) activeColaboradoresSet.add(p.repostoPorNome);
  });

  const auditoriaBaixas = completedDayTasks.map((t) => ({
    id: t.id,
    titulo: t.tituloAtividade,
    concluidoPorNome: t.concluidoPorNome || userMap.get(t.responsavelId) || 'Colaborador',
    concluidoPorId: t.concluidoPorId || t.responsavelId,
    dataHoraConclusao: t.dataHoraConclusao,
    observacaoOperacional: t.observacaoOperacional,
    categoria: t.categoria,
    tipoTempo: t.tipoTempo,
  }));

  const metadados: DailyBackupMetadata = {
    versao: '2.0',
    dataBackup: targetDate,
    dataHoraGeracao: new Date().toISOString(),
    loja: params.settings.nomeLoja || 'Beto da Fruta',
    unidade: params.settings.unidade || 'Loja Principal',
    gerenteResponsavel: params.settings.gerenteResponsavel || 'Charles Araújo',
    proprietario: params.settings.proprietario || 'Beto',
    tipoExportacao: params.tipo || 'Manual Administrador',
    exportadoPor: params.currentUser
      ? {
          id: params.currentUser.id,
          nome: params.currentUser.nome,
          perfil: params.currentUser.perfil,
        }
      : undefined,
    resumo: {
      totalAtividadesDia: totalTasks,
      atividadesConcluidasDia: completedCount,
      taxaConclusaoAtividades: `${taxaPercent}%`,
      totalItensComprasDia: dayPurchases.length,
      itensRecebidos,
      itensReposicaoConcluida: itensReposicao,
      colaboradoresComAtividade: Array.from(activeColaboradoresSet),
    },
  };

  return {
    metadados,
    atividadesDoDia: dayTasks,
    rotinaDiaria: params.routine,
    comprasDoDia: dayPurchases,
    auditoriaBaixasDoDia: auditoriaBaixas,
  };
}

/**
 * Saves a daily backup directly to browser localStorage.
 */
export function saveDailyBackupToLocalStorage(payload: DailyBackupPayload): void {
  try {
    const key = `${BACKUP_PREFIX}${payload.metadados.dataBackup}`;
    localStorage.setItem(key, JSON.stringify(payload));

    const meta = {
      lastAutoBackup: payload.metadados.dataHoraGeracao,
      lastDate: payload.metadados.dataBackup,
      totalAtividades: payload.metadados.resumo.totalAtividadesDia,
      totalCompras: payload.metadados.resumo.totalItensComprasDia,
      savedInLocalStorage: true,
    };
    localStorage.setItem(BACKUP_META_KEY, JSON.stringify(meta));

    // Append to local history list (up to 15 entries)
    recordBackupHistoryEntry({
      dataBackup: payload.metadados.dataBackup,
      timestamp: payload.metadados.dataHoraGeracao,
      filename: `backup-betodafruta-${payload.metadados.dataBackup}.json`,
      tipo: payload.metadados.tipoExportacao,
      totalAtividades: payload.metadados.resumo.totalAtividadesDia,
      totalCompras: payload.metadados.resumo.totalItensComprasDia,
      taxaConclusao: payload.metadados.resumo.taxaConclusaoAtividades,
      origem: 'localStorage',
    });
  } catch (err) {
    console.warn('Não foi possível salvar backup diário no localStorage:', err);
  }
}

/**
 * Loads a daily backup from localStorage for a given date.
 */
export function loadDailyBackupFromLocalStorage(targetDate?: string): DailyBackupPayload | null {
  try {
    const date = targetDate || getTodayDateString();
    const key = `${BACKUP_PREFIX}${date}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Erro ao ler backup do localStorage:', err);
  }
  return null;
}

/**
 * Sends a daily backup to the Express server (/api/backup).
 */
export async function sendDailyBackupToServer(
  payload: DailyBackupPayload
): Promise<{ ok: boolean; filename?: string; savedAt?: string; error?: string }> {
  try {
    const res = await fetch('/api/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: payload.metadados.dataBackup,
        payload,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { ok: false, error: errJson.error || `HTTP ${res.status}` };
    }

    const data = await res.json();
    return {
      ok: true,
      filename: data.filename,
      savedAt: data.savedAt,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Servidor indisponível' };
  }
}

/**
 * Records an entry in backup history.
 */
function recordBackupHistoryEntry(entry: BackupHistoryEntry): void {
  try {
    const raw = localStorage.getItem(BACKUP_HISTORY_KEY);
    const list: BackupHistoryEntry[] = raw ? JSON.parse(raw) : [];
    // Filter duplicates with the exact same minute
    const minute = entry.timestamp.slice(0, 16);
    const filtered = list.filter(
      (e) => !(e.dataBackup === entry.dataBackup && e.timestamp.startsWith(minute))
    );
    const updated = [entry, ...filtered].slice(0, 20);
    localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Erro ao registrar histórico de backup:', err);
  }
}

/**
 * Returns the history of saved daily backups.
 */
export function getBackupHistory(): BackupHistoryEntry[] {
  try {
    const raw = localStorage.getItem(BACKUP_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Returns metadata about the latest backup.
 */
export function getLatestBackupMeta(): {
  lastAutoBackup: string | null;
  lastDate: string | null;
  totalAtividades: number;
  totalCompras: number;
} {
  try {
    const raw = localStorage.getItem(BACKUP_META_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    lastAutoBackup: null,
    lastDate: null,
    totalAtividades: 0,
    totalCompras: 0,
  };
}

/**
 * Triggers a browser download of the daily backup JSON file.
 * Returns the downloaded filename and total items.
 */
export function downloadDailyBackupJson(
  params: {
    targetDate?: string;
    tasks: Task[];
    purchases: PurchaseItem[];
    routine: DailyRoutine | null;
    settings: StoreSettings;
    currentUser?: User | null;
  }
): { filename: string; totalAtividades: number; totalCompras: number } {
  const payload = generateDailyBackupPayload({
    ...params,
    tipo: 'Manual Administrador',
  });

  const targetDate = payload.metadados.dataBackup;
  const filename = `backup-betodafruta-${targetDate}.json`;
  const jsonString = JSON.stringify(payload, null, 2);

  // Native blob download
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Also store to localStorage and attempt server save
  saveDailyBackupToLocalStorage(payload);
  sendDailyBackupToServer(payload).catch((err) =>
    console.warn('Falha silenciosa ao sincronizar backup manual no servidor:', err)
  );

  return {
    filename,
    totalAtividades: payload.metadados.resumo.totalAtividadesDia,
    totalCompras: payload.metadados.resumo.totalItensComprasDia,
  };
}
