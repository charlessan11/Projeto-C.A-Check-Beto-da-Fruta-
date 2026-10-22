export type UserProfile = 'Administrador' | 'Operacional';

export interface User {
  id: string; // USR-01, USR-02...
  nome: string;
  perfil: UserProfile;
  setoresAtuacao: string; // Detalhamento dos setores conforme especificação
  avatarCor: string;
  cargoDescricao?: string;
  setorPadrao?: string; // Compatibilidade com formulários de edição
  email?: string;
}

export type TipoTempo = 'Tarefa Padrão' | '2 Minutos (Fazer na Transição)';
export type Prioridade = '1-Crítica' | '2-Alta' | '3-Média' | '4-Baixa';
export type CategoriaTarefa =
  | 'Reposição de Banca'
  | 'Produção / Grab & Go'
  | 'Qualidade / Validade'
  | 'Limpeza'
  | 'Administrativo';

export type StatusTarefa = 'Pendente' | 'Em Andamento' | 'Concluída';

export interface Task {
  id: string;
  dataProgramada: string; // YYYY-MM-DD
  tituloAtividade: string;
  instrucoesDetalhadas: string;
  tipoTempo: TipoTempo;
  prioridade: Prioridade;
  categoria: CategoriaTarefa;
  responsavelId: string;
  status: StatusTarefa;
  dataHoraConclusao?: string; // ISO string
  concluidoPorId?: string;
  concluidoPorNome?: string;
  observacaoOperacional?: string;
  incluirNaImpressao: boolean;
  pomodoroAtivo?: boolean;
  pomodoroCiclos?: number;
  criadoEm: string;
}

// Tabela 3: Compras_Reposicao (Simplificada conforme especificação Beto da Fruta)
export interface PurchaseItem {
  id: string; // ID_Item
  data: string; // Data
  produto: string; // Produto
  mercadoriaRecebida: boolean; // Mercadoria_Recebida: Sim/Não (Checkbox quando mercadoria chega na loja)
  reposicaoConcluida: boolean; // Reposicao_Concluida: Sim/Não (Checkbox quando vai pra banca)
  solicitadoPorNome: string;
  solicitadoPorId: string;
  dataAtualizacao: string;
  observacao?: string;
}

export interface StoreSettings {
  nomeLoja: string;
  gerenteResponsavel: string;
  proprietario: string;
  horarioCheckinMatinal: string; // ex: "07:00"
  checkinAtivo: boolean;
  mensagemBoasVindas?: string;
  unidade?: string;
}

