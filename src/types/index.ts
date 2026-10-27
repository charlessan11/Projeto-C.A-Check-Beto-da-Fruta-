export type UserProfile = 'Administrador' | 'Operacional';

export interface RegisteredDevice {
  deviceId: string;
  nomeAparelho: string;
  plataforma: string;
  vinculadoEm: string;
  ultimoAcesso: string;
}

export interface User {
  id: string; // USR-01, USR-02...
  nome: string;
  perfil: UserProfile;
  setoresAtuacao: string; // Detalhamento dos setores conforme especificação
  avatarCor: string;
  cargoDescricao?: string;
  setorPadrao?: string; // Compatibilidade com formulários de edição
  email?: string;
  pinCode?: string; // PIN individual de 4 dígitos para todos os colaboradores
  dispositivosVinculados?: RegisteredDevice[]; // Aparelhos salvos no perfil do usuário
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
  auxiliarId?: string;
  auxiliarNome?: string;
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

// Tabela 3: Compras & Reposição (Fluxo Completo: Charles/Amanda -> WhatsApp/Impressão -> Lucas/Rafael Conferência -> Reposição de Banca)
export type PurchaseStatusConferencia =
  | 'Entregue Completo'
  | 'Entrega Parcial / Falta'
  | 'Recebido a Mais'
  | 'Comprou, mas não chegou'
  | 'Não Comprou'
  | 'Pendente';

export interface PurchaseItem {
  id: string; // ID_Item
  data: string; // Data do pedido (YYYY-MM-DD)
  produto: string; // Produto (Ex: "Banana Prata Especial")
  quantidadePedida?: string; // Qtd e unidade pedida (Ex: "10 cx", "50 kg", "20 un")
  fornecedor?: string; // Fornecedor/Box (Ex: "Ceasa Box 14", "Distribuidora Central")
  categoria?: string; // Frutas, Legumes, Verduras, Folhagens, Embalagens, etc.
  solicitadoPorNome: string; // Charles ou Amanda (ou outro solicitante)
  solicitadoPorId: string;
  observacao?: string;

  // Envio & Impressão
  enviadoWhatsapp?: boolean;
  dataEnvioWhatsapp?: string;

  // Conferência de Recebimento na Loja (Lucas, Rafael ou Admin em conferência conjunta)
  mercadoriaRecebida: boolean; // Sim/Não
  quantidadeRecebida?: string; // Ex: "1 cx", "8 cx"
  unidadeConversao?: 'kg' | 'un'; // Obrigatório na conferência: 'kg' (aceita fração ex: 20,450) ou 'un' (apenas inteiro ex: 243)
  quantidadeConvertida?: string; // Valor convertido na chegada (Ex: "20,450" para kg ou "243" para un)
  quantidadeAvaria?: string; // Opcional, na mesma unidade de medida da conversão ('kg' fracionado ou 'un' inteiro)
  quantidadeLiquidaAproveitavel?: string; // Saldo líquido (quantidadeConvertida - quantidadeAvaria)
  statusConferencia?: PurchaseStatusConferencia;
  motivoNaoChegou?: 'Comprou, mas não chegou' | 'Não Comprou';
  conferidoPorNome?: string; // "Lucas", "Rafael", "Charles + Lucas", etc.
  conferidoPorId?: string;
  dataConferencia?: string;
  motivoDivergencia?: string; // Ex: "Fornecedor mandou 2 a menos"

  // Estoque Recebido & Reposição de Banca (Sobra & O que Falta Repor)
  reposicaoConcluida: boolean; // Sim/Não (foi para a banca)
  quantidadeReposta?: string; // Ex: "10 cx"
  repostoPorNome?: string;
  repostoPorId?: string;
  dataReposicao?: string;
  observacaoReposicao?: string; // Ex: "Banca cheia, sobra de 3 cx na câmara fria"

  dataAtualizacao: string;
}

export type CompletionTone = 'campainha' | 'cristal' | 'harpa' | 'acorde';
export type ReminderTone = 'sino_suave' | 'pulso_zen' | 'toque_discreto';

export interface SoundAlertSettings {
  ativo: boolean;
  somConclusaoTarefa: boolean;
  tomConclusao: CompletionTone;
  somLembreteRotina: boolean;
  tomLembrete: ReminderTone;
  intervaloLembreteMinutos: number;
  volume: number; // 0 a 100
}

export interface StoreSettings {
  nomeLoja: string;
  gerenteResponsavel: string;
  proprietario: string;
  horarioCheckinMatinal: string; // ex: "07:00"
  checkinAtivo: boolean;
  mensagemBoasVindas?: string;
  unidade?: string;
  alertasSonoros?: SoundAlertSettings;
}

// Estrutura de Rotinas Diárias Obrigatórias do Hortifrúti Beto da Fruta
export interface RoutineExpositorAssignment {
  id?: string;
  expositor: string;
  responsavelId: string;
  responsavelNome: string;
  auxiliarId?: string;
  auxiliarNome?: string;
  concluido: boolean;
  observacoes?: string;
}

export interface RoutineLimpezaItem {
  id: string;
  area: string;
  responsavelId: string;
  responsavelNome: string;
  concluido: boolean;
}

export interface RoutineFreezerAtividade {
  id: string;
  atividade: string; // Ex: "Aferição de temperatura (-18°C)", "Conferência de validade das polpas", etc.
  nome?: string;
  responsavelId: string;
  responsavelNome: string;
  temperaturaAferida?: string;
  concluido: boolean;
  observacoes?: string;
}

export type RoutineFreezerItem = RoutineFreezerAtividade;

export interface DailyRoutine {
  id: string;
  data: string; // YYYY-MM-DD
  isSextaFeira: boolean;

  // 1. Contagem matinal & Reposição Hortifrúti
  responsavelContagemId: string;
  responsavelContagemNome: string;
  contagemConcluida: boolean;
  expositores: RoutineExpositorAssignment[];

  // 2. Atendimento Balcão (Sorteado / Escolhido - Atende e repõe)
  atendimentoBalcao: {
    responsavelId: string;
    responsavelNome: string;
    concluido: boolean;
    observacao: string;
  };

  // 3. Limpeza (Áreas configuráveis: Rita, Bianca e adicionais)
  limpezas: RoutineLimpezaItem[];

  // 4. Verificação dos freezers (Atividades gerenciáveis pelo administrador: Vanessa)
  freezers: {
    responsavelId: string;
    responsavelNome: string;
    concluido: boolean;
    temperaturaAferida?: string;
    observacoes?: string;
    atividades?: RoutineFreezerAtividade[];
    itens?: RoutineFreezerAtividade[];
  };


  // 5. Conferência e descarga da kombi (Lucas ou Rafael)
  descargaKombi: {
    responsavelId: string;
    responsavelNome: string;
    concluido: boolean;
    observacoes?: string;
  };

  // 6. Produção de água de coco na garrafa (Feito exclusivamente por 1 funcionário: Lucas ou Rafael, nunca os dois)
  aguaDeCoco: {
    responsavelId?: string; // USR-04 (Lucas) ou USR-05 (Rafael)
    responsavelNome?: string;
    responsavelPrincipalId: string;
    responsavelPrincipalNome: string;
    auxiliarId?: string;
    auxiliarNome?: string;
    metaMinLitros: number; // 28 a 35L (Seg-Qui, Sáb, Dom) ou 50 a 75L (Sexta)
    metaMaxLitros: number;
    litrosProduzidos: number;
    concluido: boolean;
    observacoes?: string;
    saldoLucasLitros: number;
    saldoRafaelLitros: number;
    etapas?: {
      garrafasEnvase: boolean;      // Produção de água de coco na garrafa
      corteERetiradaPolpa: boolean; // Cortes de coco para retirada da polpa
      descarteLixoCocos: boolean;   // Jogar o lixo dos cocos
    };
  };

  // 7. Lista de compras (Charles)
  listaCompras: {
    responsavelId: string;
    responsavelNome: string;
    concluido: boolean;
    observacoes?: string;
  };

  // 8. Rotinas e Atividades Adicionadas Manualmente pela Gestão
  rotinasExtras?: RoutineCustomItem[];

  atualizadoEm: string;
}

export interface RoutineCustomItem {
  id: string;
  titulo: string;
  responsavelId: string;
  responsavelNome: string;
  auxiliarId?: string;
  auxiliarNome?: string;
  categoria?: string;
  observacoes?: string;
  horario?: string;
  concluido: boolean;
  criadoEm: string;
}


