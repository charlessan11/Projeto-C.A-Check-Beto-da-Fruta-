import {
  DailyRoutine,
  RoutineExpositorAssignment,
  RoutineLimpezaItem,
  RoutineFreezerItem,
  Task,
  User,
} from '../types';
import { getTodayDateString } from './storage';

const ROUTINE_STORAGE_KEY_PREFIX = 'betodafruta_routine_';
const COCO_BALANCE_KEY = 'betodafruta_coco_balance';

interface CocoBalance {
  lucasLitros: number;
  rafaelLitros: number;
}

export function loadCocoBalance(): CocoBalance {
  const saved = localStorage.getItem(COCO_BALANCE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return { lucasLitros: 140, rafaelLitros: 140 }; // Initial balanced baseline
}

export function saveCocoBalance(balance: CocoBalance): void {
  localStorage.setItem(COCO_BALANCE_KEY, JSON.stringify(balance));
}

// Generate an assignment based on who is doing the morning count
export function buildExpositorAssignments(
  counterId: string,
  counterName: string
): RoutineExpositorAssignment[] {
  // Pool of stockers: Lucas (USR-04), Rafael (USR-05), Charles (USR-01)
  // Bianca (USR-06) assists the person at Expositor C
  const stockers = [
    { id: 'USR-01', nome: 'Charles' },
    { id: 'USR-04', nome: 'Lucas' },
    { id: 'USR-05', nome: 'Rafael' },
  ];

  // Whoever counts gets Expositor C + Bianca as assistant
  const expositorC: RoutineExpositorAssignment = {
    expositor: 'Expositor C',
    responsavelId: counterId,
    responsavelNome: counterName,
    auxiliarId: 'USR-06',
    auxiliarNome: 'Bianca',
    concluido: false,
    observacoes: 'Responsável fez a contagem matinal. Bianca auxilia no abastecimento.',
  };

  // Remaining available stockers for Expositor A, B, and Área Externa
  const remaining = stockers.filter((s) => s.id !== counterId);
  const stocker1 = remaining[0] || { id: 'USR-04', nome: 'Lucas' };
  const stocker2 = remaining[1] || { id: 'USR-05', nome: 'Rafael' };

  const expositorA: RoutineExpositorAssignment = {
    expositor: 'Expositor A',
    responsavelId: stocker1.id,
    responsavelNome: stocker1.nome,
    concluido: false,
    observacoes: 'Frutas Nobres e Gôndola Principal. Reposição contínua e descarte.',
  };

  const expositorB: RoutineExpositorAssignment = {
    expositor: 'Expositor B',
    responsavelId: stocker2.id,
    responsavelNome: stocker2.nome,
    concluido: false,
    observacoes: 'Legumes, Batatas e Cebolas. Abastecimento e placas de preços.',
  };

  const areaExterna: RoutineExpositorAssignment = {
    expositor: 'Área Externa',
    responsavelId: stocker1.id,
    responsavelNome: stocker1.nome,
    auxiliarId: stocker2.id,
    auxiliarNome: stocker2.nome,
    concluido: false,
    observacoes: 'Melancias, Cocos e Folhagens na entrada externa (divisão conjunta).',
  };

  return [expositorA, expositorB, expositorC, areaExterna];
}

// 7 Fixed cleaning tasks as mandated
export function buildFixedCleaningTasks(): RoutineLimpezaItem[] {
  return [
    {
      id: 'LMP-01',
      area: 'Área de circulação dos clientes',
      responsavelId: 'USR-09',
      responsavelNome: 'Rita',
      concluido: false,
    },
    {
      id: 'LMP-02',
      area: 'Caixa registrador',
      responsavelId: 'USR-06',
      responsavelNome: 'Bianca',
      concluido: false,
    },
    {
      id: 'LMP-03',
      area: 'Balcão',
      responsavelId: 'USR-06',
      responsavelNome: 'Bianca',
      concluido: false,
    },
    {
      id: 'LMP-04',
      area: 'Área de Produção',
      responsavelId: 'USR-09',
      responsavelNome: 'Rita',
      concluido: false,
    },
    {
      id: 'LMP-05',
      area: 'Banheiros',
      responsavelId: 'USR-09',
      responsavelNome: 'Rita',
      concluido: false,
    },
    {
      id: 'LMP-06',
      area: 'Estoque',
      responsavelId: 'USR-09',
      responsavelNome: 'Rita',
      concluido: false,
    },
    {
      id: 'LMP-07',
      area: 'Lavagem do Material de Produção',
      responsavelId: 'USR-09',
      responsavelNome: 'Rita',
      concluido: false,
    },
  ];
}

// Generate new daily routine with fair balance and Friday detection
export function generateDailyRoutine(dateStr: string = getTodayDateString()): DailyRoutine {
  const parts = dateStr.split('-');
  const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const dayOfWeek = dateObj.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  const isFriday = dayOfWeek === 5;

  const dayNumber = dateObj.getDate();
  const balance = loadCocoBalance();

  // Coconut water: Done ONLY by 1 employee: EITHER Lucas OR Rafael, NEVER both.
  // Whichever has fewer accumulated liters gets assigned today to maintain balance!
  const lucasIsToday = balance.lucasLitros <= balance.rafaelLitros;
  const singleCocoWorker = lucasIsToday
    ? { id: 'USR-04', nome: 'Lucas' }
    : { id: 'USR-05', nome: 'Rafael' };

  const metaMin = isFriday ? 50 : 28;
  const metaMax = isFriday ? 75 : 35;

  // Kombi unloading: alternates between Lucas and Rafael
  const kombiStocker =
    dayNumber % 2 === 0
      ? { id: 'USR-04', nome: 'Lucas' }
      : { id: 'USR-05', nome: 'Rafael' };

  // Counter default: Charles (USR-01) or alternate
  const counter = { id: 'USR-01', nome: 'Charles' };

  // Atendimento Balcão: 1 person randomly chosen from pool
  // "além de repor precisa atender ao balcão e fazer a reposição"
  const counterPool = [
    { id: 'USR-04', nome: 'Lucas' },
    { id: 'USR-05', nome: 'Rafael' },
    { id: 'USR-06', nome: 'Bianca' },
    { id: 'USR-01', nome: 'Charles' },
  ];
  // Stable pseudo-random by date seed or random
  const seedIndex = (dayNumber * 7 + dayOfWeek) % counterPool.length;
  const attendant = counterPool[seedIndex];

  const routine: DailyRoutine = {
    id: `ROUTINE-${dateStr}`,
    data: dateStr,
    isSextaFeira: isFriday,
    responsavelContagemId: counter.id,
    responsavelContagemNome: counter.nome,
    contagemConcluida: false,
    expositores: buildExpositorAssignments(counter.id, counter.nome),
    atendimentoBalcao: {
      responsavelId: attendant.id,
      responsavelNome: attendant.nome,
      concluido: false,
      observacao: 'Atendimento contínuo ao balcão + reposição de mercadorias no salão.',
    },
    limpezas: buildFixedCleaningTasks(),
    freezers: {
      responsavelId: 'USR-08',
      responsavelNome: 'Vanessa',
      concluido: false,
      temperaturaAferida: '-18°C',
      observacoes: 'Verificação diária dos freezers: temperaturas, organização e validade dos congelados.',
      atividades: [
        {
          id: 'FRZ-ATV-01',
          atividade: 'Aferição de temperatura dos freezers e termômetro digital (-18°C)',
          responsavelId: 'USR-08',
          responsavelNome: 'Vanessa',
          temperaturaAferida: '-18°C',
          concluido: false,
        },
        {
          id: 'FRZ-ATV-02',
          atividade: 'Conferência de datas de validade das polpas de frutas e congelados',
          responsavelId: 'USR-08',
          responsavelNome: 'Vanessa',
          concluido: false,
        },
        {
          id: 'FRZ-ATV-03',
          atividade: 'Organização dos produtos por lote e rotação (PEPS / Primeiro que Vence)',
          responsavelId: 'USR-08',
          responsavelNome: 'Vanessa',
          concluido: false,
        },
        {
          id: 'FRZ-ATV-04',
          atividade: 'Checagem de vedação das borrachas e inspeção de acúmulo de gelo',
          responsavelId: 'USR-08',
          responsavelNome: 'Vanessa',
          concluido: false,
        },
      ],
    },
    descargaKombi: {
      responsavelId: kombiStocker.id,
      responsavelNome: kombiStocker.nome,
      concluido: false,
      observacoes: 'Conferência física de caixas e descarregamento ágil da Kombi na chegada.',
    },
    aguaDeCoco: {
      responsavelId: singleCocoWorker.id,
      responsavelNome: singleCocoWorker.nome,
      responsavelPrincipalId: singleCocoWorker.id,
      responsavelPrincipalNome: singleCocoWorker.nome,
      metaMinLitros: metaMin,
      metaMaxLitros: metaMax,
      litrosProduzidos: 0,
      concluido: false,
      observacoes: isFriday
        ? '⚡ SEXTA-FEIRA: Meta reforçada de 50 a 75 Litros! Responsável único: engarrafamento, corte p/ polpa e descarte do lixo dos cocos.'
        : 'Meta padrão de 28 a 35 Litros. Responsável único: engarrafamento, corte p/ polpa e descarte do lixo dos cocos.',
      saldoLucasLitros: balance.lucasLitros,
      saldoRafaelLitros: balance.rafaelLitros,
      etapas: {
        garrafasEnvase: false,
        corteERetiradaPolpa: false,
        descarteLixoCocos: false,
      },
    },
    listaCompras: {
      responsavelId: 'USR-01',
      responsavelNome: 'Charles',
      concluido: false,
      observacoes: 'Levantamento matinal de faltas no estoque e fechamento do pedido de reposição.',
    },
    atualizadoEm: new Date().toISOString(),
  };

  return routine;
}

// Load routine from localStorage or generate fresh
export function loadDailyRoutine(dateStr: string = getTodayDateString()): DailyRoutine {
  const key = `${ROUTINE_STORAGE_KEY_PREFIX}${dateStr}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const parsed: DailyRoutine = JSON.parse(saved);
      // Ensure date consistency
      if (parsed.data === dateStr && parsed.expositores && parsed.limpezas) {
        return parsed;
      }
    } catch {
      // fallback
    }
  }

  const generated = generateDailyRoutine(dateStr);
  saveDailyRoutine(generated);
  return generated;
}

export function saveDailyRoutine(routine: DailyRoutine): void {
  const key = `${ROUTINE_STORAGE_KEY_PREFIX}${routine.data}`;
  localStorage.setItem(key, JSON.stringify(routine));
}

// Reroll Atendente Balcão randomly
export function rerollAtendenteBalcao(currentRoutine: DailyRoutine): DailyRoutine {
  const pool = [
    { id: 'USR-04', nome: 'Lucas' },
    { id: 'USR-05', nome: 'Rafael' },
    { id: 'USR-06', nome: 'Bianca' },
    { id: 'USR-01', nome: 'Charles' },
  ].filter((p) => p.id !== currentRoutine.atendimentoBalcao.responsavelId);

  const picked = pool[Math.floor(Math.random() * pool.length)];
  const updated: DailyRoutine = {
    ...currentRoutine,
    atendimentoBalcao: {
      ...currentRoutine.atendimentoBalcao,
      responsavelId: picked.id,
      responsavelNome: picked.nome,
    },
    atualizadoEm: new Date().toISOString(),
  };
  saveDailyRoutine(updated);
  return updated;
}

// Manually select Atendente Balcão (Administrators)
export function setAtendenteBalcao(
  currentRoutine: DailyRoutine,
  responsavelId: string,
  responsavelNome: string
): DailyRoutine {
  const updated: DailyRoutine = {
    ...currentRoutine,
    atendimentoBalcao: {
      ...currentRoutine.atendimentoBalcao,
      responsavelId,
      responsavelNome,
    },
    atualizadoEm: new Date().toISOString(),
  };
  saveDailyRoutine(updated);
  return updated;
}


// Change who does the morning count and re-assign expositors
export function updateRoutineCounter(
  currentRoutine: DailyRoutine,
  counterId: string,
  counterName: string
): DailyRoutine {
  const newAssignments = buildExpositorAssignments(counterId, counterName);
  const updated: DailyRoutine = {
    ...currentRoutine,
    responsavelContagemId: counterId,
    responsavelContagemNome: counterName,
    expositores: newAssignments,
    atualizadoEm: new Date().toISOString(),
  };
  saveDailyRoutine(updated);
  return updated;
}

// ================= ADMIN ROUTINE MANAGEMENT =================
// 1. Expositores / Reposição do Hortifrúti (Adicionar & Excluir)
export function addExpositorRoutine(
  currentRoutine: DailyRoutine,
  expositorNome: string,
  responsavelId: string,
  responsavelNome: string,
  auxiliarId?: string,
  auxiliarNome?: string,
  observacoes?: string
): DailyRoutine {
  const newExpositor: RoutineExpositorAssignment = {
    id: `EXP-${Date.now()}`,
    expositor: expositorNome,
    responsavelId,
    responsavelNome,
    auxiliarId: auxiliarId || undefined,
    auxiliarNome: auxiliarNome || undefined,
    concluido: false,
    observacoes: observacoes || `Reposição e abastecimento contínuo de ${expositorNome}.`,
  };
  const updated: DailyRoutine = {
    ...currentRoutine,
    expositores: [...currentRoutine.expositores, newExpositor],
    atualizadoEm: new Date().toISOString(),
  };
  saveDailyRoutine(updated);
  return updated;
}

export function deleteExpositorRoutine(
  currentRoutine: DailyRoutine,
  expositorKey: string
): DailyRoutine {
  const updated: DailyRoutine = {
    ...currentRoutine,
    expositores: currentRoutine.expositores.filter(
      (e) => (e.id || e.expositor) !== expositorKey && e.expositor !== expositorKey
    ),
    atualizadoEm: new Date().toISOString(),
  };
  saveDailyRoutine(updated);
  return updated;
}

// 2. Limpeza de Setores (Adicionar & Excluir)
export function addLimpezaRoutine(
  currentRoutine: DailyRoutine,
  areaName: string,
  responsavelId: string,
  responsavelNome: string
): DailyRoutine {
  const newItem: RoutineLimpezaItem = {
    id: `LMP-${Date.now()}`,
    area: areaName,
    responsavelId,
    responsavelNome,
    concluido: false,
  };
  const updated: DailyRoutine = {
    ...currentRoutine,
    limpezas: [...currentRoutine.limpezas, newItem],
    atualizadoEm: new Date().toISOString(),
  };
  saveDailyRoutine(updated);
  return updated;
}

export function deleteLimpezaRoutine(
  currentRoutine: DailyRoutine,
  limpezaId: string
): DailyRoutine {
  const updated: DailyRoutine = {
    ...currentRoutine,
    limpezas: currentRoutine.limpezas.filter((l) => l.id !== limpezaId),
    atualizadoEm: new Date().toISOString(),
  };
  saveDailyRoutine(updated);
  return updated;
}

// 3. Verificação de Freezers (Adicionar, Excluir & Alternar)
export function addFreezerRoutineItem(
  currentRoutine: DailyRoutine,
  atividadeNome: string,
  responsavelId: string,
  responsavelNome: string,
  temperaturaAferida?: string,
  observacoes?: string
): DailyRoutine {
  const currentItems =
    currentRoutine.freezers.atividades || currentRoutine.freezers.itens || [];

  const newItem: RoutineFreezerItem = {
    id: `FRZ-ATV-${Date.now()}`,
    atividade: atividadeNome,
    nome: atividadeNome,
    responsavelId,
    responsavelNome,
    temperaturaAferida: temperaturaAferida || undefined,
    concluido: false,
    observacoes: observacoes || 'Atividade diária de verificação dos freezers.',
  };

  const nextItems = [...currentItems, newItem];
  const allDone = nextItems.length > 0 && nextItems.every((i) => i.concluido);

  const updated: DailyRoutine = {
    ...currentRoutine,
    freezers: {
      ...currentRoutine.freezers,
      atividades: nextItems,
      itens: nextItems,
      concluido: allDone,
    },
    atualizadoEm: new Date().toISOString(),
  };
  saveDailyRoutine(updated);
  return updated;
}

export function deleteFreezerRoutineItem(
  currentRoutine: DailyRoutine,
  atividadeId: string
): DailyRoutine {
  const currentItems =
    currentRoutine.freezers.atividades || currentRoutine.freezers.itens || [];
  const nextItems = currentItems.filter((f) => f.id !== atividadeId);
  const allDone = nextItems.length > 0 && nextItems.every((i) => i.concluido);

  const updated: DailyRoutine = {
    ...currentRoutine,
    freezers: {
      ...currentRoutine.freezers,
      atividades: nextItems,
      itens: nextItems,
      concluido: allDone,
    },
    atualizadoEm: new Date().toISOString(),
  };
  saveDailyRoutine(updated);
  return updated;
}

export function toggleFreezerRoutineItem(
  currentRoutine: DailyRoutine,
  atividadeId: string
): DailyRoutine {
  const currentItems =
    currentRoutine.freezers.atividades || currentRoutine.freezers.itens || [];
  const nextItems = currentItems.map((item) => {
    if (item.id === atividadeId) {
      return { ...item, concluido: !item.concluido };
    }
    return item;
  });
  const allDone = nextItems.length > 0 && nextItems.every((i) => i.concluido);

  const updated: DailyRoutine = {
    ...currentRoutine,
    freezers: {
      ...currentRoutine.freezers,
      atividades: nextItems,
      itens: nextItems,
      concluido: allDone,
    },
    atualizadoEm: new Date().toISOString(),
  };
  saveDailyRoutine(updated);
  return updated;
}

// Aliases
export const addFreezerAtividade = addFreezerRoutineItem;
export const deleteFreezerAtividade = deleteFreezerRoutineItem;
export const toggleFreezerAtividade = toggleFreezerRoutineItem;



// Swap coconut water single responsible worker between Lucas and Rafael (only 1 employee, never both)
export function swapAguaDeCocoResponsavel(currentRoutine: DailyRoutine): DailyRoutine {
  const currentId = currentRoutine.aguaDeCoco.responsavelId || currentRoutine.aguaDeCoco.responsavelPrincipalId;
  const isLucas = currentId === 'USR-04';
  const nextWorker = isLucas
    ? { id: 'USR-05', nome: 'Rafael' }
    : { id: 'USR-04', nome: 'Lucas' };

  const updated: DailyRoutine = {
    ...currentRoutine,
    aguaDeCoco: {
      ...currentRoutine.aguaDeCoco,
      responsavelId: nextWorker.id,
      responsavelNome: nextWorker.nome,
      responsavelPrincipalId: nextWorker.id,
      responsavelPrincipalNome: nextWorker.nome,
      auxiliarId: undefined,
      auxiliarNome: undefined,
    },
    atualizadoEm: new Date().toISOString(),
  };
  saveDailyRoutine(updated);
  return updated;
}

// Toggle or update coconut water production and update fair balance
export function updateAguaDeCocoLitros(
  currentRoutine: DailyRoutine,
  litros: number,
  concluido: boolean
): DailyRoutine {
  const balance = loadCocoBalance();
  const diff = litros - currentRoutine.aguaDeCoco.litrosProduzidos;

  if (diff > 0) {
    const workerId = currentRoutine.aguaDeCoco.responsavelId || currentRoutine.aguaDeCoco.responsavelPrincipalId;
    if (workerId === 'USR-04') {
      balance.lucasLitros += diff;
    } else {
      balance.rafaelLitros += diff;
    }
    saveCocoBalance(balance);
  }

  const updated: DailyRoutine = {
    ...currentRoutine,
    aguaDeCoco: {
      ...currentRoutine.aguaDeCoco,
      litrosProduzidos: litros,
      concluido,
      saldoLucasLitros: balance.lucasLitros,
      saldoRafaelLitros: balance.rafaelLitros,
    },
    atualizadoEm: new Date().toISOString(),
  };
  saveDailyRoutine(updated);
  return updated;
}

// Toggle individual steps of Coconut routine (Garrafas, Polpa, Lixo)
export function toggleAguaDeCocoEtapa(
  currentRoutine: DailyRoutine,
  etapaKey: 'garrafasEnvase' | 'corteERetiradaPolpa' | 'descarteLixoCocos'
): DailyRoutine {
  const currentEtapas = currentRoutine.aguaDeCoco.etapas || {
    garrafasEnvase: currentRoutine.aguaDeCoco.litrosProduzidos >= currentRoutine.aguaDeCoco.metaMinLitros,
    corteERetiradaPolpa: false,
    descarteLixoCocos: false,
  };

  const nextEtapas = {
    ...currentEtapas,
    [etapaKey]: !currentEtapas[etapaKey],
  };

  const isLitersReached = currentRoutine.aguaDeCoco.litrosProduzidos >= currentRoutine.aguaDeCoco.metaMinLitros;
  const isDone =
    (nextEtapas.garrafasEnvase || isLitersReached) &&
    nextEtapas.corteERetiradaPolpa &&
    nextEtapas.descarteLixoCocos;

  const updated: DailyRoutine = {
    ...currentRoutine,
    aguaDeCoco: {
      ...currentRoutine.aguaDeCoco,
      etapas: nextEtapas,
      concluido: isDone,
    },
    atualizadoEm: new Date().toISOString(),
  };
  saveDailyRoutine(updated);
  return updated;
}


// Sync routine tasks into system Task[] list so employees see them in their daily personal feed
export function syncRoutineWithTaskList(routine: DailyRoutine, currentTasks: Task[]): Task[] {
  const today = routine.data;
  // Prefix for routine task IDs to avoid duplicates
  const routinePrefix = `RTN-${today}-`;

  // Filter out any existing tasks created from this routine today
  const nonRoutineTasks = currentTasks.filter((t) => !t.id.startsWith(routinePrefix));

  const generatedTasks: Task[] = [];

  // 1. Contagem matinal
  generatedTasks.push({
    id: `${routinePrefix}CONTAGEM`,
    dataProgramada: today,
    tituloAtividade: `Contagem Matinal de Abertura do Hortifrúti (${routine.responsavelContagemNome})`,
    instrucoesDetalhadas: `Realizar levantamento físico dos itens antes da abertura. O responsável pela contagem assume o Expositor C com auxílio da Bianca.`,
    tipoTempo: 'Tarefa Padrão',
    prioridade: '1-Crítica',
    categoria: 'Reposição de Banca',
    responsavelId: routine.responsavelContagemId,
    status: routine.contagemConcluida ? 'Concluída' : 'Em Andamento',
    incluirNaImpressao: true,
    criadoEm: routine.atualizadoEm,
  });

  // 2. Expositores A, B, C e Área Externa
  routine.expositores.forEach((exp, idx) => {
    generatedTasks.push({
      id: `${routinePrefix}EXP-${idx}`,
      dataProgramada: today,
      tituloAtividade: `Reposição ${exp.expositor} ${exp.auxiliarNome ? `(+ ${exp.auxiliarNome} auxilia)` : ''}`,
      instrucoesDetalhadas: exp.observacoes || `Abastecimento completo do ${exp.expositor}.`,
      tipoTempo: 'Tarefa Padrão',
      prioridade: '1-Crítica',
      categoria: 'Reposição de Banca',
      responsavelId: exp.responsavelId,
      status: exp.concluido ? 'Concluída' : 'Pendente',
      incluirNaImpressao: true,
      criadoEm: routine.atualizadoEm,
    });
  });

  // 3. Atendimento Balcão
  generatedTasks.push({
    id: `${routinePrefix}BALCAO`,
    dataProgramada: today,
    tituloAtividade: `Atendimento de Balcão e Apoio de Reposição (${routine.atendimentoBalcao.responsavelNome})`,
    instrucoesDetalhadas: routine.atendimentoBalcao.observacao,
    tipoTempo: 'Tarefa Padrão',
    prioridade: '2-Alta',
    categoria: 'Reposição de Banca',
    responsavelId: routine.atendimentoBalcao.responsavelId,
    status: routine.atendimentoBalcao.concluido ? 'Concluída' : 'Pendente',
    incluirNaImpressao: true,
    criadoEm: routine.atualizadoEm,
  });

  // 4. Limpezas (7 áreas fixas)
  routine.limpezas.forEach((lmp) => {
    generatedTasks.push({
      id: `${routinePrefix}${lmp.id}`,
      dataProgramada: today,
      tituloAtividade: `Limpeza: ${lmp.area}`,
      instrucoesDetalhadas: `Higienização completa conforme o padrão sanitário diário do hortifrúti.`,
      tipoTempo: 'Tarefa Padrão',
      prioridade: '2-Alta',
      categoria: 'Limpeza',
      responsavelId: lmp.responsavelId,
      status: lmp.concluido ? 'Concluída' : 'Pendente',
      incluirNaImpressao: true,
      criadoEm: routine.atualizadoEm,
    });
  });

  // 5. Freezers: Atividades de Verificação (Vanessa)
  const freezerAtividades = routine.freezers.atividades || routine.freezers.itens || [];
  if (freezerAtividades.length > 0) {
    freezerAtividades.forEach((atv) => {
      generatedTasks.push({
        id: `${routinePrefix}${atv.id}`,
        dataProgramada: today,
        tituloAtividade: `Verificação Freezers: ${atv.atividade || atv.nome}`,
        instrucoesDetalhadas: `Executar checagem de freezers: ${atv.atividade || atv.nome}.${
          atv.temperaturaAferida ? ` Parâmetro de temperatura: ${atv.temperaturaAferida}.` : ''
        }`,
        tipoTempo: 'Tarefa Padrão',
        prioridade: '2-Alta',
        categoria: 'Qualidade / Validade',
        responsavelId: atv.responsavelId || routine.freezers.responsavelId,
        status: atv.concluido ? 'Concluída' : 'Pendente',
        incluirNaImpressao: true,
        criadoEm: routine.atualizadoEm,
      });
    });
  } else {
    generatedTasks.push({
      id: `${routinePrefix}FREEZER`,
      dataProgramada: today,
      tituloAtividade: `Verificação de Atividades dos Freezers (Vanessa)`,
      instrucoesDetalhadas: `Aferir temperaturas, conferir validades e organização dos produtos congelados e polpas.`,
      tipoTempo: 'Tarefa Padrão',
      prioridade: '2-Alta',
      categoria: 'Qualidade / Validade',
      responsavelId: routine.freezers.responsavelId,
      status: routine.freezers.concluido ? 'Concluída' : 'Pendente',
      incluirNaImpressao: true,
      criadoEm: routine.atualizadoEm,
    });
  }

  // 6. Kombi (Lucas ou Rafael)
  generatedTasks.push({
    id: `${routinePrefix}KOMBI`,
    dataProgramada: today,
    tituloAtividade: `Conferência e Descarga da Kombi (${routine.descargaKombi.responsavelNome})`,
    instrucoesDetalhadas: `Conferir notas fiscais e mercadorias físicas descarregando para a área de triagem.`,
    tipoTempo: 'Tarefa Padrão',
    prioridade: '1-Crítica',
    categoria: 'Reposição de Banca',
    responsavelId: routine.descargaKombi.responsavelId,
    status: routine.descargaKombi.concluido ? 'Concluída' : 'Pendente',
    incluirNaImpressao: true,
    criadoEm: routine.atualizadoEm,
  });

  // 7. Água de Coco (Somente 1 funcionário: Lucas OU Rafael, nunca os dois)
  const cocoWorkerNome = routine.aguaDeCoco.responsavelNome || routine.aguaDeCoco.responsavelPrincipalNome;
  const cocoWorkerId = routine.aguaDeCoco.responsavelId || routine.aguaDeCoco.responsavelPrincipalId;
  generatedTasks.push({
    id: `${routinePrefix}COCO`,
    dataProgramada: today,
    tituloAtividade: `Produção de Água de Coco: Garrafas, Polpa & Descarte (${cocoWorkerNome})`,
    instrucoesDetalhadas: `Responsável Único: ${cocoWorkerNome} (Feito exclusivamente por 1 funcionário: ou Lucas ou Rafael, nunca os dois). Envolve: 1) Produzir e engarrafar água de coco (${routine.aguaDeCoco.metaMinLitros}-${routine.aguaDeCoco.metaMaxLitros}L); 2) Cortes de coco para retirada da polpa; 3) Jogar o lixo dos cocos e limpar bancada.`,
    tipoTempo: 'Tarefa Padrão',
    prioridade: '1-Crítica',
    categoria: 'Produção / Grab & Go',
    responsavelId: cocoWorkerId,
    status: routine.aguaDeCoco.concluido ? 'Concluída' : 'Pendente',
    incluirNaImpressao: true,
    criadoEm: routine.atualizadoEm,
  });

  // 8. Lista de Compras (Charles)
  generatedTasks.push({
    id: `${routinePrefix}COMPRAS`,
    dataProgramada: today,
    tituloAtividade: `Elaboração e Checagem da Lista de Compras (Charles)`,
    instrucoesDetalhadas: `Verificar baixas de estoque na Tabela de Reposição e preparar o pedido de compras do Ceasa/fornecedores.`,
    tipoTempo: 'Tarefa Padrão',
    prioridade: '1-Crítica',
    categoria: 'Administrativo',
    responsavelId: routine.listaCompras.responsavelId,
    status: routine.listaCompras.concluido ? 'Concluída' : 'Pendente',
    incluirNaImpressao: true,
    criadoEm: routine.atualizadoEm,
  });

  return [...nonRoutineTasks, ...generatedTasks];
}
