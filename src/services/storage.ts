import { User, Task, PurchaseItem, StoreSettings } from '../types';

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
    setoresAtuacao: 'Encarregado de Reposição, Atendimento, Caixa',
    cargoDescricao: 'Encarregado Geral',
    avatarCor: 'bg-emerald-700 text-white',
  },
  {
    id: 'USR-02',
    nome: 'Amanda',
    perfil: 'Administrador',
    setoresAtuacao: 'Gestão de Reposição, Auxílio em Produção',
    cargoDescricao: 'Gestão de Reposição',
    avatarCor: 'bg-teal-700 text-white',
  },
  {
    id: 'USR-03',
    nome: 'Beto',
    perfil: 'Administrador',
    setoresAtuacao: 'Proprietário, Reposição',
    cargoDescricao: 'Proprietário',
    avatarCor: 'bg-indigo-700 text-white',
  },
  {
    id: 'USR-04',
    nome: 'Lucas',
    perfil: 'Operacional',
    setoresAtuacao: 'Reposição, Atendimento, Caixa (Suporte)',
    cargoDescricao: 'Reposição & Caixa',
    avatarCor: 'bg-sky-600 text-white',
  },
  {
    id: 'USR-05',
    nome: 'Rafael',
    perfil: 'Operacional',
    setoresAtuacao: 'Reposição, Atendimento, Caixa (Suporte)',
    cargoDescricao: 'Reposição & Caixa',
    avatarCor: 'bg-blue-600 text-white',
  },
  {
    id: 'USR-06',
    nome: 'Bianca',
    perfil: 'Operacional',
    setoresAtuacao: 'Reposição, Atendimento, Caixa',
    cargoDescricao: 'Operadora de Caixa & Reposição',
    avatarCor: 'bg-amber-600 text-white',
  },
  {
    id: 'USR-07',
    nome: 'Adriana',
    perfil: 'Operacional',
    setoresAtuacao: 'Produção',
    cargoDescricao: 'Produção / Grab & Go',
    avatarCor: 'bg-orange-600 text-white',
  },
  {
    id: 'USR-08',
    nome: 'Vanessa',
    perfil: 'Operacional',
    setoresAtuacao: 'Produção',
    cargoDescricao: 'Produção / Grab & Go',
    avatarCor: 'bg-rose-600 text-white',
  },
  {
    id: 'USR-09',
    nome: 'Rita',
    perfil: 'Operacional',
    setoresAtuacao: 'Limpeza, Auxílio em Produção',
    cargoDescricao: 'Limpeza & Auxílio Produção',
    avatarCor: 'bg-purple-600 text-white',
  },
];

export const INITIAL_SETTINGS: StoreSettings = {
  nomeLoja: 'Beto da Fruta',
  gerenteResponsavel: 'Charles',
  proprietario: 'Beto',
  horarioCheckinMatinal: '07:00',
  checkinAtivo: true,
  mensagemBoasVindas: 'Excelente turno de trabalho no Beto da Fruta! Mantenha o padrão de frescor e alinhamento visual da loja.',
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

// Tabela 3: Compras_Reposicao (Simplificada com Mercadoria_Recebida e Reposicao_Concluida)
export const INITIAL_PURCHASES: PurchaseItem[] = [
  {
    id: 'ITEM-01',
    data: getTodayDateString(),
    produto: 'Banana Prata Especial (Caixas)',
    mercadoriaRecebida: true,
    reposicaoConcluida: true,
    solicitadoPorNome: 'Lucas',
    solicitadoPorId: 'USR-04',
    dataAtualizacao: new Date(Date.now() - 3600000 * 3).toISOString(),
    observacao: 'Banca abastecida com 12 caixas.',
  },
  {
    id: 'ITEM-02',
    data: getTodayDateString(),
    produto: 'Abacaxi Pérola para Grab & Go',
    mercadoriaRecebida: true,
    reposicaoConcluida: false,
    solicitadoPorNome: 'Adriana',
    solicitadoPorId: 'USR-07',
    dataAtualizacao: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    observacao: 'Chegou do caminhão, aguardando descarregar na produção.',
  },
  {
    id: 'ITEM-03',
    data: getTodayDateString(),
    produto: 'Morango Especial em bandeja 250g',
    mercadoriaRecebida: false,
    reposicaoConcluida: false,
    solicitadoPorNome: 'Bianca',
    solicitadoPorId: 'USR-06',
    dataAtualizacao: new Date(Date.now() - 3600000 * 0.8).toISOString(),
    observacao: 'Falta total na banca de frutas vermelhas.',
  },
  {
    id: 'ITEM-04',
    data: getTodayDateString(),
    produto: 'Filme PVC Alimentício 400m',
    mercadoriaRecebida: false,
    reposicaoConcluida: false,
    solicitadoPorNome: 'Vanessa',
    solicitadoPorId: 'USR-08',
    dataAtualizacao: new Date(Date.now() - 3600000 * 2).toISOString(),
    observacao: 'Resta apenas 1 rolo em uso na área de corte.',
  },
  {
    id: 'ITEM-05',
    data: getTodayDateString(),
    produto: 'Tomate Italiano Comercial',
    mercadoriaRecebida: true,
    reposicaoConcluida: true,
    solicitadoPorNome: 'Charles',
    solicitadoPorId: 'USR-01',
    dataAtualizacao: new Date(Date.now() - 3600000 * 4).toISOString(),
    observacao: 'Recebido e reposto na abertura da loja.',
  },
];

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
    return parsed;
  } catch {
    return INITIAL_USERS;
  }
};

export const saveUsers = (users: User[]): void => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const loadCurrentUser = (): User | null => {
  const users = loadUsers();
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
  return null; // Return null so Login Screen is shown when no user is selected!
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

export const loadPurchases = (): PurchaseItem[] => {
  try {
    const raw = localStorage.getItem(PURCHASES_KEY);
    if (!raw) {
      localStorage.setItem(PURCHASES_KEY, JSON.stringify(INITIAL_PURCHASES));
      return INITIAL_PURCHASES;
    }
    const parsed: PurchaseItem[] = JSON.parse(raw);
    // If old format detected without mercadoriaRecebida, reset to simplified format
    if (parsed.length > 0 && typeof parsed[0].mercadoriaRecebida === 'undefined') {
      localStorage.setItem(PURCHASES_KEY, JSON.stringify(INITIAL_PURCHASES));
      return INITIAL_PURCHASES;
    }
    return parsed;
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
    return { ...INITIAL_SETTINGS, ...parsed };
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
