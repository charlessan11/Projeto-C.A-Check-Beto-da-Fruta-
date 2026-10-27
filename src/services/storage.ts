import { User, Task, PurchaseItem, StoreSettings } from '../types';
import { findUserBoundToCurrentDevice } from './deviceService';

const USERS_KEY = 'betodafruta_users_v2';
const TASKS_KEY = 'betodafruta_tasks_v2';
const PURCHASES_KEY = 'betodafruta_purchases_v2';
const CURRENT_USER_KEY = 'betodafruta_current_user_v2';
const SETTINGS_KEY = 'betodafruta_settings_v2';

// Tabela 1: Usuarios e Setores (Estrutura oficial Beto da Fruta)
export const INITIAL_USERS: User[] = [
  {
    id: 'USR-01',
    nome: 'Charles',
    perfil: 'Administrador',
    setoresAtuacao: 'Encarregado do Hortifrúti, Reposição, Atendimento, Caixa',
    cargoDescricao: 'Encarregado do Hortifrúti',
    avatarCor: 'bg-emerald-700 text-white',
    pinCode: '1234',
    dispositivosVinculados: [],
  },
  {
    id: 'USR-02',
    nome: 'Amanda',
    perfil: 'Administrador',
    setoresAtuacao: 'Proprietária, Gestão de Compras & Reposição, Auxílio em Produção',
    cargoDescricao: 'Proprietária',
    avatarCor: 'bg-teal-700 text-white',
    pinCode: '1234',
    dispositivosVinculados: [],
  },
  {
    id: 'USR-03',
    nome: 'Beto',
    perfil: 'Administrador',
    setoresAtuacao: 'Proprietário, Reposição',
    cargoDescricao: 'Proprietário',
    avatarCor: 'bg-indigo-700 text-white',
    pinCode: '1234',
    dispositivosVinculados: [],
  },
  {
    id: 'USR-04',
    nome: 'Lucas',
    perfil: 'Operacional',
    setoresAtuacao: 'Reposição, Atendimento, Caixa (Suporte)',
    cargoDescricao: 'Reposição & Caixa',
    avatarCor: 'bg-sky-600 text-white',
    pinCode: '1004',
    dispositivosVinculados: [],
  },
  {
    id: 'USR-05',
    nome: 'Rafael',
    perfil: 'Operacional',
    setoresAtuacao: 'Reposição, Atendimento, Caixa (Suporte)',
    cargoDescricao: 'Reposição & Caixa',
    avatarCor: 'bg-blue-600 text-white',
    pinCode: '1005',
    dispositivosVinculados: [],
  },
  {
    id: 'USR-06',
    nome: 'Bianca',
    perfil: 'Operacional',
    setoresAtuacao: 'Reposição, Atendimento, Caixa',
    cargoDescricao: 'Operadora de Caixa & Reposição',
    avatarCor: 'bg-amber-600 text-white',
    pinCode: '1006',
    dispositivosVinculados: [],
  },
  {
    id: 'USR-07',
    nome: 'Adriana',
    perfil: 'Operacional',
    setoresAtuacao: 'Produção',
    cargoDescricao: 'Produção / Grab & Go',
    avatarCor: 'bg-orange-600 text-white',
    pinCode: '1007',
    dispositivosVinculados: [],
  },
  {
    id: 'USR-08',
    nome: 'Vanessa',
    perfil: 'Operacional',
    setoresAtuacao: 'Produção',
    cargoDescricao: 'Produção / Grab & Go',
    avatarCor: 'bg-rose-600 text-white',
    pinCode: '1008',
    dispositivosVinculados: [],
  },
  {
    id: 'USR-09',
    nome: 'Rita',
    perfil: 'Operacional',
    setoresAtuacao: 'Limpeza, Auxílio em Produção',
    cargoDescricao: 'Limpeza & Auxílio Produção',
    avatarCor: 'bg-purple-600 text-white',
    pinCode: '1009',
    dispositivosVinculados: [],
  },
];

export const INITIAL_SETTINGS: StoreSettings = {
  nomeLoja: 'Beto da Fruta',
  gerenteResponsavel: 'Charles',
  proprietario: 'Beto & Amanda',
  horarioCheckinMatinal: '08:00',
  checkinAtivo: true,
  mensagemBoasVindas: 'Excelente turno de trabalho no Beto da Fruta! Mantenha o padrão de frescor e alinhamento visual da loja.',
  alertasSonoros: {
    ativo: true,
    somConclusaoTarefa: true,
    tomConclusao: 'campainha',
    somLembreteRotina: true,
    tomLembrete: 'sino_suave',
    intervaloLembreteMinutos: 30,
    volume: 70,
  },
};

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 'TSK-101',
    dataProgramada: getTodayDateString(),
    tituloAtividade: 'Montar 30 bandejas de abacaxi temperado até as 10h',
    instrucoesDetalhadas: 'Padrão SMART: Descascar, temperar com hortelã, pesar 300g, selar com filme PVC e etiquetar com preço e validade.',
    tipoTempo: 'Tarefa Padrão',
    prioridade: '1-Crítica',
    categoria: 'Produção / Grab & Go',
    responsavelId: 'USR-07', // Adriana
    status: 'Em Andamento',
    incluirNaImpressao: true,
    pomodoroCiclos: 1,
    criadoEm: new Date(Date.now() - 3600000 * 2.5).toISOString(),
  },
  {
    id: 'TSK-102',
    dataProgramada: getTodayDateString(),
    tituloAtividade: 'Montar banca nobre de Tomate, Batata e Cebola antes da abertura',
    instrucoesDetalhadas: 'Descartar itens machucados, alinhar placas de preços promocionais e abastecer saias das gôndolas.',
    tipoTempo: 'Tarefa Padrão',
    prioridade: '1-Crítica',
    categoria: 'Reposição de Banca',
    responsavelId: 'USR-04', // Lucas
    status: 'Em Andamento',
    incluirNaImpressao: true,
    criadoEm: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'TSK-103',
    dataProgramada: getTodayDateString(),
    tituloAtividade: 'Trocar etiqueta de preço desatualizada no Melão Amarelo',
    instrucoesDetalhadas: 'Colocar placa nova com preço de oferta da semana.',
    tipoTempo: '2 Minutos (Fazer na Transição)',
    prioridade: '1-Crítica',
    categoria: 'Reposição de Banca',
    responsavelId: 'USR-06', // Bianca
    status: 'Pendente',
    incluirNaImpressao: true,
    criadoEm: new Date(Date.now() - 3600000 * 1.8).toISOString(),
  },
  {
    id: 'TSK-104',
    dataProgramada: getTodayDateString(),
    tituloAtividade: 'Retirar caixas plásticas vazias acumuladas no corredor central',
    instrucoesDetalhadas: 'Empilhar as caixas vazias no palete dos fundos para desobstruir a passagem dos clientes.',
    tipoTempo: '2 Minutos (Fazer na Transição)',
    prioridade: '2-Alta',
    categoria: 'Limpeza',
    responsavelId: 'USR-05', // Rafael
    status: 'Pendente',
    incluirNaImpressao: true,
    criadoEm: new Date(Date.now() - 3600000 * 1.2).toISOString(),
  },
  {
    id: 'TSK-105',
    dataProgramada: getTodayDateString(),
    tituloAtividade: 'Conferência de temperatura das câmaras frias de folhagens e frutas',
    instrucoesDetalhadas: 'Aferir termohigrômetros (Câmara 1: 4°C a 6°C; Câmara 2: 8°C a 10°C).',
    tipoTempo: 'Tarefa Padrão',
    prioridade: '2-Alta',
    categoria: 'Qualidade / Validade',
    responsavelId: 'USR-08', // Vanessa
    status: 'Concluída',
    dataHoraConclusao: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    concluidoPorId: 'USR-08',
    concluidoPorNome: 'Vanessa',
    observacaoOperacional: 'Temperatura em 5.1°C nas folhagens e 8.5°C nas frutas. Normal.',
    incluirNaImpressao: true,
    criadoEm: new Date(Date.now() - 3600000 * 3.5).toISOString(),
  },
  {
    id: 'TSK-106',
    dataProgramada: getTodayDateString(),
    tituloAtividade: 'Higienizar tábuas de corte e sanitizar bancada da produção',
    instrucoesDetalhadas: 'Usar solução clorada e álcool 70% neutro para evitar contaminação cruzada.',
    tipoTempo: 'Tarefa Padrão',
    prioridade: '2-Alta',
    categoria: 'Limpeza',
    responsavelId: 'USR-09', // Rita
    status: 'Concluída',
    dataHoraConclusao: new Date(Date.now() - 3600000 * 0.9).toISOString(),
    concluidoPorId: 'USR-09',
    concluidoPorNome: 'Rita',
    observacaoOperacional: 'Higienização concluída antes do início da segunda rodada de cortes.',
    incluirNaImpressao: true,
    criadoEm: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'TSK-107',
    dataProgramada: getTodayDateString(),
    tituloAtividade: 'Borrifar água fresca nas ervas e folhagens sensíveis',
    instrucoesDetalhadas: 'Usar borrifador limpo com água gelada no coentro, salsa, hortelã e alfaces.',
    tipoTempo: '2 Minutos (Fazer na Transição)',
    prioridade: '3-Média',
    categoria: 'Reposição de Banca',
    responsavelId: 'USR-02', // Amanda
    status: 'Pendente',
    incluirNaImpressao: true,
    criadoEm: new Date(Date.now() - 3600000 * 0.7).toISOString(),
  },
  {
    id: 'TSK-108',
    dataProgramada: getTodayDateString(),
    tituloAtividade: 'Conferir pedidos e notas fiscais da feira com fornecedores',
    instrucoesDetalhadas: 'Verificar se todas as caixas faturadas deram entrada física na loja.',
    tipoTempo: 'Tarefa Padrão',
    prioridade: '1-Crítica',
    categoria: 'Administrativo',
    responsavelId: 'USR-01', // Charles
    status: 'Concluída',
    dataHoraConclusao: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    concluidoPorId: 'USR-01',
    concluidoPorNome: 'Charles',
    observacaoOperacional: 'Todas as notas conferidas sem divergência.',
    incluirNaImpressao: true,
    criadoEm: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'TSK-109',
    dataProgramada: getTodayDateString(),
    tituloAtividade: 'Revisar estoque de sacolas biodegradáveis e bobinas de caixa',
    instrucoesDetalhadas: 'Contar fardos de sacolas plásticas nos caixas 1 e 2.',
    tipoTempo: 'Tarefa Padrão',
    prioridade: '4-Baixa',
    categoria: 'Administrativo',
    responsavelId: 'USR-03', // Beto
    status: 'Pendente',
    incluirNaImpressao: true,
    criadoEm: new Date(Date.now() - 3600000 * 0.4).toISOString(),
  },
];

// Tabela 3: Compras & Reposição (Fluxo Completo: Charles/Amanda -> WhatsApp/Impressão -> Lucas/Rafael Conferência -> Reposição de Banca)
export const INITIAL_PURCHASES: PurchaseItem[] = [
  {
    id: 'ITEM-01',
    data: getTodayDateString(),
    produto: 'Banana Prata Especial',
    quantidadePedida: '12 cx',
    fornecedor: 'Ceasa Box 14',
    categoria: 'Frutas',
    solicitadoPorNome: 'Charles',
    solicitadoPorId: 'USR-01',
    enviadoWhatsapp: true,
    dataEnvioWhatsapp: new Date(Date.now() - 3600000 * 18).toISOString(),
    mercadoriaRecebida: true,
    quantidadeRecebida: '12 cx',
    statusConferencia: 'Entregue Completo',
    conferidoPorNome: 'Lucas',
    conferidoPorId: 'USR-04',
    dataConferencia: new Date(Date.now() - 3600000 * 3).toISOString(),
    reposicaoConcluida: true,
    quantidadeReposta: '8 cx na banca / 4 cx câmara',
    repostoPorNome: 'Lucas',
    repostoPorId: 'USR-04',
    dataReposicao: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    dataAtualizacao: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    observacao: 'Banca abastecida nobremente. Sobra de 4 caixas organizada na câmara.',
  },
  {
    id: 'ITEM-02',
    data: getTodayDateString(),
    produto: 'Abacaxi Pérola para Grab & Go',
    quantidadePedida: '30 un',
    fornecedor: 'Sítio Primavera',
    categoria: 'Frutas',
    solicitadoPorNome: 'Amanda',
    solicitadoPorId: 'USR-02',
    enviadoWhatsapp: true,
    dataEnvioWhatsapp: new Date(Date.now() - 3600000 * 16).toISOString(),
    mercadoriaRecebida: true,
    quantidadeRecebida: '30 un',
    statusConferencia: 'Entregue Completo',
    conferidoPorNome: 'Rafael',
    conferidoPorId: 'USR-05',
    dataConferencia: new Date(Date.now() - 3600000 * 2).toISOString(),
    reposicaoConcluida: false,
    dataAtualizacao: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    observacao: 'Chegou na loja, aguardando descarregar na produção Grab & Go.',
  },
  {
    id: 'ITEM-03',
    data: getTodayDateString(),
    produto: 'Morango Especial em bandeja 250g',
    quantidadePedida: '20 bandejas',
    fornecedor: 'Distribuidora Frutix',
    categoria: 'Frutas',
    solicitadoPorNome: 'Charles',
    solicitadoPorId: 'USR-01',
    enviadoWhatsapp: true,
    dataEnvioWhatsapp: new Date(Date.now() - 3600000 * 15).toISOString(),
    mercadoriaRecebida: true,
    quantidadeRecebida: '15 bandejas',
    statusConferencia: 'Entrega Parcial / Falta',
    conferidoPorNome: 'Lucas',
    conferidoPorId: 'USR-04',
    dataConferencia: new Date(Date.now() - 3600000 * 2.8).toISOString(),
    motivoDivergencia: 'Fornecedor entregou apenas 15 bandejas por falta de colheita.',
    reposicaoConcluida: false,
    dataAtualizacao: new Date(Date.now() - 3600000 * 0.8).toISOString(),
    observacao: 'Falta repor na banca de frutas vermelhas.',
  },
  {
    id: 'ITEM-04',
    data: getTodayDateString(),
    produto: 'Filme PVC Alimentício 400m',
    quantidadePedida: '4 rolos',
    fornecedor: 'Distribuidora de Embalagens',
    categoria: 'Embalagens',
    solicitadoPorNome: 'Amanda',
    solicitadoPorId: 'USR-02',
    enviadoWhatsapp: false,
    mercadoriaRecebida: false,
    statusConferencia: 'Pendente',
    reposicaoConcluida: false,
    dataAtualizacao: new Date(Date.now() - 3600000 * 2).toISOString(),
    observacao: 'Urgente: resta apenas 1 rolo em uso na área de corte.',
  },
  {
    id: 'ITEM-05',
    data: getTodayDateString(),
    produto: 'Tomate Italiano Comercial',
    quantidadePedida: '15 cx',
    fornecedor: 'Ceasa Box 32',
    categoria: 'Legumes',
    solicitadoPorNome: 'Charles',
    solicitadoPorId: 'USR-01',
    enviadoWhatsapp: true,
    dataEnvioWhatsapp: new Date(Date.now() - 3600000 * 14).toISOString(),
    mercadoriaRecebida: false,
    statusConferencia: 'Pendente',
    reposicaoConcluida: false,
    dataAtualizacao: new Date(Date.now() - 3600000 * 4).toISOString(),
    observacao: 'Pedido enviado para chegada matinal com nota fiscal.',
  },
];

export interface ArchivedPurchaseBatch {
  id: string;
  dataLista: string;
  dataArquivamento: string;
  conferidoPor: string;
  totalItens: number;
  itens: PurchaseItem[];
}

const PURCHASES_HISTORY_KEY = 'betodafruta_purchases_history_v2';
const PURCHASES_LAST_RENEWAL_DATE_KEY = 'betodafruta_purchases_last_renewal_date_v2';

export const loadUsers = (): User[] => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const parsed: User[] = JSON.parse(raw);
    // Ensure all 9 official Beto da Fruta users exist
    if (parsed.length < INITIAL_USERS.length || !parsed.some((u) => u.nome === 'Beto')) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    // Ensure every user has their individual pinCode, dispositivosVinculados, and updated roles for Charles & Amanda
    let updated = false;
    const usersWithPin = parsed.map((u) => {
      const defaultUser = INITIAL_USERS.find((init) => init.id === u.id || init.nome === u.nome);
      const storedIndividualPin = localStorage.getItem(`betodafruta_pin_${u.id}`);
      const effectivePin =
        storedIndividualPin || u.pinCode || defaultUser?.pinCode || '1234';
      const nextDevices = Array.isArray(u.dispositivosVinculados) ? u.dispositivosVinculados : [];

      let nextCargo = u.cargoDescricao;
      let nextSetores = u.setoresAtuacao;
      if (u.id === 'USR-01' || u.nome === 'Charles') {
        if (nextCargo !== 'Encarregado do Hortifrúti') {
          nextCargo = 'Encarregado do Hortifrúti';
          nextSetores = 'Encarregado do Hortifrúti, Reposição, Atendimento, Caixa';
          updated = true;
        }
      } else if (u.id === 'USR-02' || u.nome === 'Amanda') {
        if (nextCargo !== 'Proprietária') {
          nextCargo = 'Proprietária';
          nextSetores = 'Proprietária, Gestão de Compras & Reposição, Auxílio em Produção';
          updated = true;
        }
      }

      if (u.pinCode !== effectivePin || !Array.isArray(u.dispositivosVinculados)) {
        updated = true;
      }
      return {
        ...u,
        cargoDescricao: nextCargo,
        setoresAtuacao: nextSetores,
        pinCode: effectivePin,
        dispositivosVinculados: nextDevices,
      };
    });
    if (updated) {
      localStorage.setItem(USERS_KEY, JSON.stringify(usersWithPin));
    }
    return usersWithPin;
  } catch {
    return INITIAL_USERS;
  }
};

export const saveUsers = (users: User[]): void => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  fetch('/api/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ users }),
  }).catch(() => {
    // Offline fallback
  });
};

export const getUserPin = (userId: string): string => {
  const individualPin = localStorage.getItem(`betodafruta_pin_${userId}`);
  if (individualPin) return individualPin;
  const users = loadUsers();
  const user = users.find((u) => u.id === userId);
  if (user?.pinCode) return user.pinCode;
  const defaultUser = INITIAL_USERS.find((u) => u.id === userId);
  return defaultUser?.pinCode || '1234';
};

export const updateUserPin = (userId: string, newPin: string): boolean => {
  if (!newPin || newPin.trim().length !== 4) return false;
  const cleanPin = newPin.trim();
  // Save to isolated individual storage key
  localStorage.setItem(`betodafruta_pin_${userId}`, cleanPin);

  // Also update in users list for that specific user only
  const users = loadUsers();
  const updatedUsers = users.map((u) => {
    if (u.id === userId) {
      return { ...u, pinCode: cleanPin };
    }
    return u;
  });
  saveUsers(updatedUsers);

  // Update currentUser if currently logged in
  const current = loadCurrentUser();
  if (current && current.id === userId) {
    saveCurrentUser({ ...current, pinCode: cleanPin });
  }
  return true;
};

export const loadCurrentUser = (): User | null => {
  const users = loadUsers();
  // 1. Priority: Check if this physical device is bound to a user profile (Auto-login for all users)
  const boundUser = findUserBoundToCurrentDevice(users);
  if (boundUser) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(boundUser));
    return boundUser;
  }

  // 2. Fallback: Check active session in localStorage
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const found = users.find((u) => u.id === parsed.id || u.nome === parsed.nome);
      if (found) return found;
    }
  } catch {
    // fallback
  }
  return null;
};

export const saveCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

export const loadTasks = (): Task[] => {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) {
      localStorage.setItem(TASKS_KEY, JSON.stringify(INITIAL_TASKS));
      return INITIAL_TASKS;
    }
    const parsed: Task[] = JSON.parse(raw);
    const existingIds = new Set(parsed.map((t) => t.id));
    const missing = INITIAL_TASKS.filter((t) => !existingIds.has(t.id));
    if (missing.length > 0) {
      const merged = [...parsed, ...missing];
      localStorage.setItem(TASKS_KEY, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch {
    return INITIAL_TASKS;
  }
};

export const saveTasks = (tasks: Task[]): void => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

export const loadPurchaseHistory = (): ArchivedPurchaseBatch[] => {
  try {
    const raw = localStorage.getItem(PURCHASES_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const savePurchaseHistory = (history: ArchivedPurchaseBatch[]): void => {
  localStorage.setItem(PURCHASES_HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
};

/**
 * Archives items already conferred by Lucas or Rafael into history and returns the renewed list
 */
export const archiveConferredPurchases = (
  currentPurchases: PurchaseItem[],
  mode: 'only_conferred' | 'all' = 'only_conferred'
): { remaining: PurchaseItem[]; archivedCount: number } => {
  const toArchive =
    mode === 'all'
      ? currentPurchases
      : currentPurchases.filter((p) => p.mercadoriaRecebida || Boolean(p.conferidoPorNome));
  const remaining =
    mode === 'all'
      ? []
      : currentPurchases.filter((p) => !p.mercadoriaRecebida && !p.conferidoPorNome);

  if (toArchive.length > 0) {
    const checkers = Array.from(
      new Set(toArchive.map((p) => p.conferidoPorNome).filter(Boolean))
    );
    const conferidoPor = checkers.length > 0 ? checkers.join(' & ') : 'Lucas / Rafael';
    const batch: ArchivedPurchaseBatch = {
      id: `HIST-${Date.now()}`,
      dataLista: toArchive[0]?.data || getTodayDateString(),
      dataArquivamento: new Date().toISOString(),
      conferidoPor,
      totalItens: toArchive.length,
      itens: toArchive,
    };
    const existingHistory = loadPurchaseHistory();
    savePurchaseHistory([batch, ...existingHistory]);
  }

  savePurchases(remaining);
  localStorage.setItem(PURCHASES_LAST_RENEWAL_DATE_KEY, getTodayDateString());
  return { remaining, archivedCount: toArchive.length };
};

export const loadPurchases = (): PurchaseItem[] => {
  try {
    const raw = localStorage.getItem(PURCHASES_KEY);
    if (raw === null) {
      localStorage.setItem(PURCHASES_KEY, JSON.stringify(INITIAL_PURCHASES));
      localStorage.setItem(PURCHASES_LAST_RENEWAL_DATE_KEY, getTodayDateString());
      return INITIAL_PURCHASES;
    }
    const parsed: PurchaseItem[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(PURCHASES_KEY, JSON.stringify(INITIAL_PURCHASES));
      return INITIAL_PURCHASES;
    }

    // If user intentionally emptied or renewed the list, keep it empty!
    if (parsed.length === 0) {
      return [];
    }

    // Daily Automatic Renewal Check:
    // Whenever a new day starts, any item from a previous day (item.data < today)
    // that was ALREADY conferred by Lucas or Rafael (mercadoriaRecebida === true)
    // is automatically archived into history so the new day's list is renewed cleanly!
    const today = getTodayDateString();
    const oldConferredItems = parsed.filter(
      (item) => item.data && item.data < today && (item.mercadoriaRecebida || Boolean(item.conferidoPorNome))
    );

    let activeItems = parsed;
    if (oldConferredItems.length > 0) {
      const checkers = Array.from(
        new Set(oldConferredItems.map((p) => p.conferidoPorNome).filter(Boolean))
      );
      const batch: ArchivedPurchaseBatch = {
        id: `HIST-AUTO-${Date.now()}`,
        dataLista: oldConferredItems[0]?.data || today,
        dataArquivamento: new Date().toISOString(),
        conferidoPor: checkers.length > 0 ? checkers.join(' & ') : 'Lucas / Rafael',
        totalItens: oldConferredItems.length,
        itens: oldConferredItems,
      };
      const existingHistory = loadPurchaseHistory();
      savePurchaseHistory([batch, ...existingHistory]);

      activeItems = parsed.filter(
        (item) => !(item.data && item.data < today && (item.mercadoriaRecebida || Boolean(item.conferidoPorNome)))
      );
      localStorage.setItem(PURCHASES_KEY, JSON.stringify(activeItems));
      localStorage.setItem(PURCHASES_LAST_RENEWAL_DATE_KEY, today);
    }

    // Ensure basic fields without overwriting intentionally blank quantities
    const normalized = activeItems.map((item) => ({
      ...item,
      fornecedor: item.fornecedor || 'Ceasa Box 14',
      categoria: item.categoria || 'Frutas',
      statusConferencia:
        item.statusConferencia || (item.mercadoriaRecebida ? 'Entregue Completo' : 'Pendente'),
    }));

    return normalized;
  } catch {
    return INITIAL_PURCHASES;
  }
};

export const savePurchases = (items: PurchaseItem[]): void => {
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(items));
};

export const loadSettings = (): StoreSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    let needsSave = false;
    // Automatically migrate previous default 07:00 to new standard 08:00
    if (parsed.horarioCheckinMatinal === '07:00') {
      parsed.horarioCheckinMatinal = '08:00';
      needsSave = true;
    }
    // Migrate proprietario to include Amanda alongside Beto
    if (!parsed.proprietario || parsed.proprietario === 'Beto') {
      parsed.proprietario = 'Beto & Amanda';
      needsSave = true;
    }
    const merged: StoreSettings = {
      ...INITIAL_SETTINGS,
      ...parsed,
      alertasSonoros: {
        ...INITIAL_SETTINGS.alertasSonoros!,
        ...(parsed.alertasSonoros || {}),
      },
    };
    if (needsSave) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    }
    return merged;
  } catch {
    return INITIAL_SETTINGS;
  }
};

export const saveSettings = (settings: StoreSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const resetToDefaults = (): void => {
  localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(TASKS_KEY, JSON.stringify(INITIAL_TASKS));
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(INITIAL_PURCHASES));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(INITIAL_SETTINGS));
  localStorage.removeItem(CURRENT_USER_KEY);
};
