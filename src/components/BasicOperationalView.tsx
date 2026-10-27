import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  ClipboardList,
  Truck,
  Check,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Plus,
  Search,
  Layers,
  SlidersHorizontal,
  Store,
  Droplets,
  Thermometer,
  Brush,
  ShoppingBag,
  AlertTriangle,
  Edit3,
  X,
  User as UserIcon,
  Printer,
  Trash2,
  Square,
  CheckSquare,
  RefreshCw,
  Users,
} from 'lucide-react';
import {
  User,
  Task,
  PurchaseItem,
  DailyRoutine,
  StoreSettings,
  PurchaseStatusConferencia,
} from '../types';
import { getTodayDateString, archiveConferredPurchases } from '../services/storage';
import { PurchaseAiImportModal } from './PurchaseAiImportModal';
import { PurchasePrintModal } from './PurchasePrintModal';

interface BasicOperationalViewProps {
  currentUser: User;
  users: User[];
  routine: DailyRoutine;
  onUpdateRoutine: (updated: DailyRoutine) => void;
  tasks: Task[];
  onQuickCompleteTask: (taskId: string, observacao?: string) => void;
  onReopenTask: (taskId: string) => void;
  onAddTask: () => void;
  purchases: PurchaseItem[];
  onUpdatePurchase: (item: PurchaseItem) => void;
  onSavePurchases: (items: PurchaseItem[]) => void;
  onBatchAddPurchases: (newItems: PurchaseItem[], saveMode?: 'replace' | 'append') => void;
  onAddPurchase: () => void;
  activeTab: 'rotinas' | 'tasks' | 'purchases' | 'audit' | 'stats';
  setActiveTab: (tab: 'rotinas' | 'tasks' | 'purchases' | 'audit' | 'stats') => void;
  onSwitchToCompleteMode: () => void;
  settings: StoreSettings;
}

interface SimplifiedRoutineCardItem {
  id: string;
  categoriaLabel: string;
  titulo: string;
  subtitulo: string;
  responsavelNome: string;
  concluido: boolean;
  tipoIcone: 'contagem' | 'expositor' | 'balcao' | 'limpeza' | 'freezer' | 'kombi' | 'coco' | 'compras' | 'extra';
  onToggle: () => void;
  extraControl?: React.ReactNode;
}

export const BasicOperationalView: React.FC<BasicOperationalViewProps> = ({
  currentUser,
  users,
  routine,
  onUpdateRoutine,
  tasks,
  onQuickCompleteTask,
  onReopenTask,
  onAddTask,
  purchases,
  onUpdatePurchase,
  onSavePurchases,
  onBatchAddPurchases,
  onAddPurchase,
  activeTab,
  setActiveTab,
  onSwitchToCompleteMode,
  settings,
}) => {
  const isAdmin = currentUser.perfil === 'Administrador';
  const today = getTodayDateString();

  // Map activeTab to one of the 3 basic sections
  const currentSection: 'rotinas' | 'tasks' | 'purchases' =
    activeTab === 'tasks' ? 'tasks' : activeTab === 'purchases' ? 'purchases' : 'rotinas';

  // Admin can optionally filter by a collaborator in Basic Mode, while operational staff see only their own
  const [adminSelectedUserId, setAdminSelectedUserId] = useState<string>('todos');
  const effectiveUserId: string | null = isAdmin
    ? adminSelectedUserId === 'todos'
      ? null
      : adminSelectedUserId
    : currentUser.id;

  // Sub-filters for ultra-simple navigation
  const [routineFilter, setRoutineFilter] = useState<'pendentes' | 'concluidas' | 'todas'>('pendentes');
  const [taskFilter, setTaskFilter] = useState<'pendentes' | 'concluidas'>('pendentes');
  const [purchaseStep, setPurchaseStep] = useState<'chegada' | 'banca'>('chegada');
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchaseCategoryFilter, setPurchaseCategoryFilter] = useState('todas');

  // Modals & Conference State in Basic Mode
  const firstName = currentUser.nome.split(' ')[0];
  const [conferentePadrao, setConferentePadrao] = useState<string>(() => {
    if (currentUser.nome.includes('Rafael')) return 'Rafael';
    if (currentUser.nome.includes('Lucas')) return 'Lucas';
    if (currentUser.perfil === 'Administrador') return `${firstName} + Lucas`;
    return 'Lucas';
  });
  const [isAiImportOpen, setIsAiImportOpen] = useState(false);
  const [isPurchasePrintOpen, setIsPurchasePrintOpen] = useState(false);
  const [purchasePrintInitialModel, setPurchasePrintInitialModel] = useState<
    'prancheta_dupla' | 'compra' | 'conferencia' | 'extras_fora_da_lista'
  >('prancheta_dupla');
  const [naoChegouMenuItemId, setNaoChegouMenuItemId] = useState<string | null>(null);
  const [divergenciaItem, setDivergenciaItem] = useState<PurchaseItem | null>(null);
  const [divergenciaQtd, setDivergenciaQtd] = useState('');
  const [divergenciaUnidadeConversao, setDivergenciaUnidadeConversao] = useState<'kg' | 'un' | ''>('');
  const [divergenciaValorConvertido, setDivergenciaValorConvertido] = useState('');
  const [divergenciaValorAvaria, setDivergenciaValorAvaria] = useState('');
  const [divergenciaErro, setDivergenciaErro] = useState('');
  const [divergenciaMotivo, setDivergenciaMotivo] = useState('');
  const [divergenciaConferente, setDivergenciaConferente] = useState('Lucas');
  const [selectedPurchaseIds, setSelectedPurchaseIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);

  // Coconut water quick counter state
  const [cocoLitrosInput, setCocoLitrosInput] = useState<number>(
    routine.aguaDeCoco.litrosProduzidos || 0
  );

  // Build flat, easy-to-read list of Routine items for the user
  const routineCards = useMemo<SimplifiedRoutineCardItem[]>(() => {
    const list: SimplifiedRoutineCardItem[] = [];

    const matchesUser = (respId?: string, auxId?: string) => {
      if (!effectiveUserId) return true;
      return respId === effectiveUserId || auxId === effectiveUserId;
    };

    // 1. Contagem Matinal
    if (matchesUser(routine.responsavelContagemId)) {
      list.push({
        id: 'rot-contagem',
        categoriaLabel: 'Abertura da Loja',
        titulo: 'Contagem Matinal das Bancas',
        subtitulo: 'Verificar produtos que faltam repor logo cedo',
        responsavelNome: routine.responsavelContagemNome,
        concluido: routine.contagemConcluida,
        tipoIcone: 'contagem',
        onToggle: () => {
          onUpdateRoutine({
            ...routine,
            contagemConcluida: !routine.contagemConcluida,
            atualizadoEm: new Date().toISOString(),
          });
        },
      });
    }

    // 2. Expositores / Bancas
    routine.expositores.forEach((exp, idx) => {
      if (matchesUser(exp.responsavelId, exp.auxiliarId)) {
        list.push({
          id: exp.id || `rot-exp-${idx}`,
          categoriaLabel: 'Abastecimento de Banca',
          titulo: `Organizar e Repor: ${exp.expositor}`,
          subtitulo: exp.observacoes || 'Retirar avarias e deixar a banca cheia e alinhada',
          responsavelNome: exp.auxiliarNome
            ? `${exp.responsavelNome} + ${exp.auxiliarNome}`
            : exp.responsavelNome,
          concluido: exp.concluido,
          tipoIcone: 'expositor',
          onToggle: () => {
            const nextExpositores = routine.expositores.map((e, i) =>
              i === idx ? { ...e, concluido: !e.concluido } : e
            );
            onUpdateRoutine({
              ...routine,
              expositores: nextExpositores,
              atualizadoEm: new Date().toISOString(),
            });
          },
        });
      }
    });

    // 3. Atendimento Balcão
    if (matchesUser(routine.atendimentoBalcao.responsavelId)) {
      list.push({
        id: 'rot-balcao',
        categoriaLabel: 'Atendimento',
        titulo: 'Atendimento no Balcão e Reposição Rápida',
        subtitulo: routine.atendimentoBalcao.observacao || 'Atender clientes com agilidade e repor arredores',
        responsavelNome: routine.atendimentoBalcao.responsavelNome,
        concluido: routine.atendimentoBalcao.concluido,
        tipoIcone: 'balcao',
        onToggle: () => {
          onUpdateRoutine({
            ...routine,
            atendimentoBalcao: {
              ...routine.atendimentoBalcao,
              concluido: !routine.atendimentoBalcao.concluido,
            },
            atualizadoEm: new Date().toISOString(),
          });
        },
      });
    }

    // 4. Limpezas
    routine.limpezas.forEach((lmp) => {
      if (matchesUser(lmp.responsavelId)) {
        list.push({
          id: `rot-lmp-${lmp.id}`,
          categoriaLabel: 'Limpeza e Organização',
          titulo: `Limpeza: ${lmp.area}`,
          subtitulo: 'Manter o piso e bancadas limpos e higienizados',
          responsavelNome: lmp.responsavelNome,
          concluido: lmp.concluido,
          tipoIcone: 'limpeza',
          onToggle: () => {
            const nextLimpezas = routine.limpezas.map((l) =>
              l.id === lmp.id ? { ...l, concluido: !l.concluido } : l
            );
            onUpdateRoutine({
              ...routine,
              limpezas: nextLimpezas,
              atualizadoEm: new Date().toISOString(),
            });
          },
        });
      }
    });

    // 5. Freezers
    const freezerList =
      routine.freezers.atividades && routine.freezers.atividades.length > 0
        ? routine.freezers.atividades
        : routine.freezers.itens && routine.freezers.itens.length > 0
        ? routine.freezers.itens
        : [];

    if (freezerList.length > 0) {
      freezerList.forEach((frz) => {
        const respId = frz.responsavelId || routine.freezers.responsavelId;
        if (matchesUser(respId)) {
          list.push({
            id: `rot-frz-${frz.id}`,
            categoriaLabel: 'Freezers e Congelados',
            titulo: frz.atividade || frz.nome || 'Verificação de Freezers',
            subtitulo: frz.temperaturaAferida ? `Meta de Temperatura: ${frz.temperaturaAferida}` : 'Conferir conservação e organização',
            responsavelNome: frz.responsavelNome || routine.freezers.responsavelNome,
            concluido: frz.concluido,
            tipoIcone: 'freezer',
            onToggle: () => {
              const updatedList = freezerList.map((f) =>
                f.id === frz.id ? { ...f, concluido: !f.concluido } : f
              );
              const allDone = updatedList.every((f) => f.concluido);
              onUpdateRoutine({
                ...routine,
                freezers: {
                  ...routine.freezers,
                  concluido: allDone,
                  atividades: updatedList,
                  itens: updatedList,
                },
                atualizadoEm: new Date().toISOString(),
              });
            },
          });
        }
      });
    } else if (matchesUser(routine.freezers.responsavelId)) {
      list.push({
        id: 'rot-frz-main',
        categoriaLabel: 'Freezers e Congelados',
        titulo: 'Verificação Geral dos Freezers (-18°C)',
        subtitulo: 'Conferir temperatura, validade das polpas e vedação',
        responsavelNome: routine.freezers.responsavelNome,
        concluido: routine.freezers.concluido,
        tipoIcone: 'freezer',
        onToggle: () => {
          onUpdateRoutine({
            ...routine,
            freezers: {
              ...routine.freezers,
              concluido: !routine.freezers.concluido,
            },
            atualizadoEm: new Date().toISOString(),
          });
        },
      });
    }

    // 6. Descarga da Kombi
    if (matchesUser(routine.descargaKombi.responsavelId)) {
      list.push({
        id: 'rot-kombi',
        categoriaLabel: 'Recebimento de Mercadoria',
        titulo: 'Descarga da Kombi e Conferência de Chegada',
        subtitulo: 'Descarregar caixas e conferir o pedido na aba Compras',
        responsavelNome: routine.descargaKombi.responsavelNome,
        concluido: routine.descargaKombi.concluido,
        tipoIcone: 'kombi',
        onToggle: () => {
          onUpdateRoutine({
            ...routine,
            descargaKombi: {
              ...routine.descargaKombi,
              concluido: !routine.descargaKombi.concluido,
            },
            atualizadoEm: new Date().toISOString(),
          });
        },
      });
    }

    // 7. Produção de Água de Coco
    const cocoRespId = routine.aguaDeCoco.responsavelId || routine.aguaDeCoco.responsavelPrincipalId;
    if (matchesUser(cocoRespId, routine.aguaDeCoco.auxiliarId)) {
      const metaMin = routine.aguaDeCoco.metaMinLitros;
      const metaMax = routine.aguaDeCoco.metaMaxLitros;
      const atual = routine.aguaDeCoco.litrosProduzidos || 0;

      list.push({
        id: 'rot-coco',
        categoriaLabel: 'Produção Diária',
        titulo: `Água de Coco na Garrafa (Meta: ${metaMin}L a ${metaMax}L)`,
        subtitulo: `Produzido hoje: ${atual} litros • Cortar, envasar e descartar cascas`,
        responsavelNome: routine.aguaDeCoco.responsavelNome || routine.aguaDeCoco.responsavelPrincipalNome,
        concluido: routine.aguaDeCoco.concluido,
        tipoIcone: 'coco',
        onToggle: () => {
          const nextDone = !routine.aguaDeCoco.concluido;
          const nextLitros =
            nextDone && routine.aguaDeCoco.litrosProduzidos < metaMin
              ? metaMin
              : routine.aguaDeCoco.litrosProduzidos;
          setCocoLitrosInput(nextLitros);
          onUpdateRoutine({
            ...routine,
            aguaDeCoco: {
              ...routine.aguaDeCoco,
              litrosProduzidos: nextLitros,
              concluido: nextDone,
            },
            atualizadoEm: new Date().toISOString(),
          });
        },
        extraControl: (
          <div className="flex items-center gap-2 bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 flex-wrap">
            <span className="text-xs font-bold text-emerald-950">Litros prontos:</span>
            <div className="flex items-center gap-1.5">
              {[5, 15, 28, 35].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setCocoLitrosInput(val);
                    onUpdateRoutine({
                      ...routine,
                      aguaDeCoco: {
                        ...routine.aguaDeCoco,
                        litrosProduzidos: val,
                        concluido: val >= metaMin ? true : routine.aguaDeCoco.concluido,
                      },
                      atualizadoEm: new Date().toISOString(),
                    });
                  }}
                  className={`min-h-[40px] px-3 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                    routine.aguaDeCoco.litrosProduzidos === val
                      ? 'bg-[#0a3821] text-white border-[#0a3821]'
                      : 'bg-white text-emerald-950 border-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  {val}L
                </button>
              ))}
              <input
                type="number"
                min={0}
                max={200}
                value={cocoLitrosInput}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value));
                  setCocoLitrosInput(val);
                  onUpdateRoutine({
                    ...routine,
                    aguaDeCoco: {
                      ...routine.aguaDeCoco,
                      litrosProduzidos: val,
                      concluido: val >= metaMin ? true : routine.aguaDeCoco.concluido,
                    },
                    atualizadoEm: new Date().toISOString(),
                  });
                }}
                className="w-20 min-h-[40px] px-2.5 bg-white border border-emerald-300 rounded-xl text-sm font-black text-center text-slate-900"
              />
            </div>
          </div>
        ),
      });
    }

    // 8. Lista de Compras (Charles / Amanda)
    if (matchesUser(routine.listaCompras.responsavelId)) {
      list.push({
        id: 'rot-compras',
        categoriaLabel: 'Compras Ceasa',
        titulo: 'Fechamento da Lista de Compras do Dia',
        subtitulo: 'Elaborar ou importar lista de compras pelo WhatsApp',
        responsavelNome: routine.listaCompras.responsavelNome,
        concluido: routine.listaCompras.concluido,
        tipoIcone: 'compras',
        onToggle: () => {
          onUpdateRoutine({
            ...routine,
            listaCompras: {
              ...routine.listaCompras,
              concluido: !routine.listaCompras.concluido,
            },
            atualizadoEm: new Date().toISOString(),
          });
        },
      });
    }

    // 9. Rotinas Extras
    (routine.rotinasExtras || []).forEach((extra) => {
      if (matchesUser(extra.responsavelId, extra.auxiliarId)) {
        list.push({
          id: `rot-extra-${extra.id}`,
          categoriaLabel: extra.categoria || 'Rotina do Dia',
          titulo: extra.titulo,
          subtitulo: extra.observacoes || (extra.horario ? `Horário: ${extra.horario}` : 'Atividade programada para hoje'),
          responsavelNome: extra.auxiliarNome
            ? `${extra.responsavelNome} + ${extra.auxiliarNome}`
            : extra.responsavelNome,
          concluido: extra.concluido,
          tipoIcone: 'extra',
          onToggle: () => {
            const nextExtras = (routine.rotinasExtras || []).map((r) =>
              r.id === extra.id ? { ...r, concluido: !r.concluido } : r
            );
            onUpdateRoutine({
              ...routine,
              rotinasExtras: nextExtras,
              atualizadoEm: new Date().toISOString(),
            });
          },
        });
      }
    });

    return list;
  }, [routine, effectiveUserId, cocoLitrosInput]);

  const pendingRoutinesCount = routineCards.filter((r) => !r.concluido).length;
  const completedRoutinesCount = routineCards.filter((r) => r.concluido).length;

  const filteredRoutineCards = useMemo(() => {
    if (routineFilter === 'pendentes') return routineCards.filter((r) => !r.concluido);
    if (routineFilter === 'concluidas') return routineCards.filter((r) => r.concluido);
    return routineCards;
  }, [routineCards, routineFilter]);

  // Tasks for the user today (excluding duplicated auto-routine mirrors if user is already seeing routines, or showing all assigned tasks clearly)
  const userTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.dataProgramada !== today) return false;
      if (effectiveUserId) {
        return t.responsavelId === effectiveUserId || t.auxiliarId === effectiveUserId;
      }
      return true;
    });
  }, [tasks, today, effectiveUserId]);

  const pendingUserTasks = userTasks.filter((t) => t.status !== 'Concluída');
  const completedUserTasks = userTasks.filter((t) => t.status === 'Concluída');
  const displayedTasks = taskFilter === 'pendentes' ? pendingUserTasks : completedUserTasks;

  // Purchases stats & filtering
  const pendingArrivalPurchases = purchases.filter((p) => !p.mercadoriaRecebida);
  const pendingRestockPurchases = purchases.filter((p) => p.mercadoriaRecebida && !p.reposicaoConcluida);

  const purchaseCategories = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p) => {
      if (p.categoria && p.categoria.trim()) set.add(p.categoria.trim());
    });
    return Array.from(set).sort();
  }, [purchases]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((item) => {
      if (purchaseStep === 'chegada') {
        // Show all items, pending arrival first
      } else {
        // Repor na banca: show items that arrived in store
        if (!item.mercadoriaRecebida) return false;
      }

      if (purchaseCategoryFilter !== 'todas' && (item.categoria?.trim() || 'Hortifrúti') !== purchaseCategoryFilter) {
        return false;
      }

      if (purchaseSearch.trim()) {
        const q = purchaseSearch.toLowerCase();
        const matchProd = item.produto.toLowerCase().includes(q);
        const matchCat = item.categoria?.toLowerCase().includes(q);
        const matchSup = item.fornecedor?.toLowerCase().includes(q);
        if (!matchProd && !matchCat && !matchSup) return false;
      }

      return true;
    }).sort((a, b) => {
      if (purchaseStep === 'chegada') {
        return Number(a.mercadoriaRecebida) - Number(b.mercadoriaRecebida);
      }
      return Number(a.reposicaoConcluida) - Number(b.reposicaoConcluida);
    });
  }, [purchases, purchaseStep, purchaseCategoryFilter, purchaseSearch]);

  // Helper to sanitize conversion / avaria input according to selected unit ('kg' allows fraction up to 3 decimals; 'un' strictly integer)
  const sanitizeMeasureValue = (raw: string, unit: 'kg' | 'un' | ''): string => {
    if (!unit) return raw;
    if (unit === 'un') {
      // Strictly integer digits only
      return raw.replace(/\D/g, '');
    }
    // For 'kg': allow digits and a single comma (or dot converted to comma), up to 3 decimal places (e.g. 20,450)
    const normalized = raw.replace(/\./g, ',').replace(/[^0-9,]/g, '');
    const parts = normalized.split(',');
    if (parts.length <= 1) return parts[0];
    return `${parts[0]},${parts.slice(1).join('').slice(0, 3)}`;
  };

  const parseMeasureNumber = (val: string): number => {
    if (!val || !val.trim()) return 0;
    const num = parseFloat(val.trim().replace(/\./g, '').replace(',', '.'));
    return isNaN(num) ? 0 : num;
  };

  const formatMeasureNumber = (num: number, unit: 'kg' | 'un', referenceRaw?: string): string => {
    if (unit === 'un') {
      return Math.max(0, Math.round(num)).toString();
    }
    const decimals = referenceRaw && referenceRaw.includes(',')
      ? Math.min(3, Math.max(1, referenceRaw.split(',')[1]?.length || 3))
      : Number.isInteger(num)
      ? 0
      : 3;
    return Math.max(0, num).toFixed(decimals).replace('.', ',');
  };

  // Open arrival quantity & mandatory conversion prompt when clicking to confer item in Basic Mode
  const handleOpenArrivalQuantityModal = (item: PurchaseItem) => {
    setDivergenciaItem(item);
    setDivergenciaQtd(item.quantidadeRecebida || item.quantidadePedida || '1 cx');
    const initialUnit: 'kg' | 'un' | '' = item.unidadeConversao || '';
    setDivergenciaUnidadeConversao(initialUnit);
    setDivergenciaValorConvertido(item.quantidadeConvertida || '');
    setDivergenciaValorAvaria(item.quantidadeAvaria || '');
    setDivergenciaErro('');
    setDivergenciaMotivo(item.motivoDivergencia || '');
    setDivergenciaConferente(item.conferidoPorNome || conferentePadrao);
  };

  // Switch conversion unit ('kg' vs 'un') and immediately adapt existing values to rule (integer for 'un', fractional allowed for 'kg')
  const handleSelectUnidadeConversao = (unit: 'kg' | 'un') => {
    setDivergenciaUnidadeConversao(unit);
    setDivergenciaErro('');
    if (unit === 'un') {
      if (divergenciaValorConvertido) {
        const intVal = Math.round(parseMeasureNumber(divergenciaValorConvertido));
        setDivergenciaValorConvertido(intVal > 0 ? String(intVal) : '');
      }
      if (divergenciaValorAvaria) {
        const intAv = Math.round(parseMeasureNumber(divergenciaValorAvaria));
        setDivergenciaValorAvaria(intAv > 0 ? String(intAv) : '');
      }
    } else {
      setDivergenciaValorConvertido((prev) => sanitizeMeasureValue(prev, 'kg'));
      setDivergenciaValorAvaria((prev) => sanitizeMeasureValue(prev, 'kg'));
    }
  };

  // Start sequential conference from first pending item (since conversion to kg/un is mandatory per item)
  const handleQuickReceiveAll = () => {
    if (pendingArrivalPurchases.length > 0) {
      handleOpenArrivalQuantityModal(pendingArrivalPurchases[0]);
    }
  };

  // Save arrival quantity + mandatory conversion (kg/un) + optional avaria in Basic Mode
  const saveConferenceItem = (goToNextPending: boolean) => {
    if (!divergenciaItem) return;
    const checkerName = divergenciaConferente || conferentePadrao;
    const recebida = divergenciaQtd.trim() || divergenciaItem.quantidadePedida || 'Conforme pedido';
    const isZero =
      recebida === '0' ||
      recebida.toLowerCase() === 'nada' ||
      recebida.toLowerCase().includes('faltou');

    if (!isZero) {
      if (!divergenciaUnidadeConversao) {
        setDivergenciaErro(
          'Selecione obrigatoriamente a unidade de medida da conversão: Quilo (kg) ou Unidade (un).'
        );
        return;
      }
      const cleanConvertido = sanitizeMeasureValue(divergenciaValorConvertido, divergenciaUnidadeConversao);
      const numConvertido = parseMeasureNumber(cleanConvertido);
      if (!cleanConvertido || numConvertido <= 0) {
        setDivergenciaErro(
          divergenciaUnidadeConversao === 'kg'
            ? 'Informe o peso convertido em kg (Ex: 20,450).'
            : 'Informe a quantidade convertida em unidades inteiras (Ex: 243).'
        );
        return;
      }
      if (divergenciaUnidadeConversao === 'un' && !/^\d+$/.test(cleanConvertido)) {
        setDivergenciaErro('A conversão em Unidade (un) aceita apenas números inteiros (sem vírgula).');
        return;
      }
    }

    const unit = !isZero && divergenciaUnidadeConversao ? divergenciaUnidadeConversao : undefined;
    const cleanConv = unit ? sanitizeMeasureValue(divergenciaValorConvertido, unit) : undefined;
    const cleanAvariaRaw =
      unit && divergenciaValorAvaria.trim()
        ? sanitizeMeasureValue(divergenciaValorAvaria, unit)
        : '';
    const numConv = cleanConv ? parseMeasureNumber(cleanConv) : 0;
    const numAvaria = cleanAvariaRaw ? parseMeasureNumber(cleanAvariaRaw) : 0;
    const cleanAvaria = numAvaria > 0 ? cleanAvariaRaw : undefined;
    const netNum = Math.max(0, numConv - numAvaria);
    const liquida =
      unit && cleanConv
        ? formatMeasureNumber(netNum, unit, cleanConv)
        : undefined;

    const pedidaNorm = (divergenciaItem.quantidadePedida || '').trim().toLowerCase();
    const isExactMatch =
      !divergenciaMotivo.trim() &&
      (!pedidaNorm ||
        recebida.toLowerCase() === pedidaNorm ||
        recebida.toLowerCase() === 'conforme pedido');

    const currentId = divergenciaItem.id;
    onUpdatePurchase({
      ...divergenciaItem,
      mercadoriaRecebida: !isZero,
      quantidadeRecebida: recebida,
      unidadeConversao: unit,
      quantidadeConvertida: cleanConv,
      quantidadeAvaria: cleanAvaria,
      quantidadeLiquidaAproveitavel: liquida,
      statusConferencia: isZero
        ? 'Pendente'
        : isExactMatch
        ? 'Entregue Completo'
        : 'Entrega Parcial / Falta',
      conferidoPorNome: checkerName,
      conferidoPorId: currentUser.id,
      motivoDivergencia: divergenciaMotivo.trim() || undefined,
      dataConferencia: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
    });

    if (goToNextPending) {
      const nextPending = purchases.find((p) => !p.mercadoriaRecebida && p.id !== currentId);
      if (nextPending) {
        handleOpenArrivalQuantityModal(nextPending);
        return;
      }
    }
    setDivergenciaItem(null);
  };

  const handleSaveDivergencia = (e: React.FormEvent) => {
    e.preventDefault();
    saveConferenceItem(false);
  };

  // Mark item that was on the purchase list but did not arrive at the store ("Comprou, mas não chegou" or "Não Comprou")
  const handleMarkNaoChegou = (
    item: PurchaseItem,
    opcao: 'Comprou, mas não chegou' | 'Não Comprou'
  ) => {
    onUpdatePurchase({
      ...item,
      mercadoriaRecebida: false,
      quantidadeRecebida: '0 (Não chegou)',
      unidadeConversao: undefined,
      quantidadeConvertida: undefined,
      quantidadeAvaria: undefined,
      quantidadeLiquidaAproveitavel: undefined,
      statusConferencia: opcao,
      motivoNaoChegou: opcao,
      motivoDivergencia: opcao,
      conferidoPorNome: conferentePadrao,
      conferidoPorId: currentUser.id,
      dataConferencia: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
    });
    setNaoChegouMenuItemId(null);
  };

  // Bulk selection helpers in Basic Mode
  const toggleSelectPurchase = (id: string) => {
    setSelectedPurchaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmBulkDelete = () => {
    if (selectedPurchaseIds.size === 0) return;
    const remaining = purchases.filter((p) => !selectedPurchaseIds.has(p.id));
    onSavePurchases(remaining);
    setSelectedPurchaseIds(new Set());
    setIsBulkDeleteModalOpen(false);
  };

  const handleConfirmRenewList = (mode: 'archive_conferred' | 'archive_all') => {
    const itemsToArchive =
      mode === 'archive_all'
        ? purchases
        : purchases.filter((p) => p.mercadoriaRecebida);

    if (itemsToArchive.length > 0) {
      archiveConferredPurchases(itemsToArchive, conferentePadrao, 'Renovação Pós-Conferência');
    }

    const remaining =
      mode === 'archive_all'
        ? []
        : purchases.filter((p) => !p.mercadoriaRecebida);

    onSavePurchases(remaining);
    setSelectedPurchaseIds(new Set());
    setIsRenewModalOpen(false);
  };

  // Quick toggle restocking on shelf
  const handleQuickToggleBanca = (item: PurchaseItem) => {
    const nextState = !item.reposicaoConcluida;
    onUpdatePurchase({
      ...item,
      mercadoriaRecebida: nextState ? true : item.mercadoriaRecebida,
      reposicaoConcluida: nextState,
      repostoPorNome: nextState ? currentUser.nome : undefined,
      repostoPorId: nextState ? currentUser.id : undefined,
      dataReposicao: nextState ? new Date().toISOString() : undefined,
      dataAtualizacao: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* ================= TOP WELCOME & SIMPLE PROGRESS BANNER ================= */}
      <div className="bg-[#0a3821] text-white rounded-3xl p-5 sm:p-6 shadow-md border border-emerald-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-emerald-900/90 text-emerald-200 px-3 py-1 rounded-xl text-xs font-extrabold border border-emerald-700">
              <span>Modo Básico • Tela Simplificada</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white pt-1">
              Olá, {firstName}! Bom trabalho hoje.
            </h2>
            <p className="text-sm text-emerald-100/90 font-medium">
              Toque nos botões grandes abaixo para ver o que falta fazer e marcar como concluído.
            </p>
          </div>

          <button
            type="button"
            onClick={onSwitchToCompleteMode}
            className="min-h-[48px] px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 border border-white/25 transition-all cursor-pointer shrink-0 active:scale-[0.99]"
            title="Mudar para o Modo Completo com todos os filtros, relatórios e detalhes"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-300" />
            <span>Abrir Modo Completo</span>
          </button>
        </div>

        {/* Admin quick employee selector inside Basic Mode */}
        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-emerald-800/80 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5" />
              Ver tela básica de:
            </span>
            <button
              type="button"
              onClick={() => setAdminSelectedUserId('todos')}
              className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                adminSelectedUserId === 'todos'
                  ? 'bg-white text-[#0a3821] font-black'
                  : 'bg-emerald-900/70 text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              Toda a Loja
            </button>
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setAdminSelectedUserId(u.id)}
                className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminSelectedUserId === u.id
                    ? 'bg-white text-[#0a3821] font-black'
                    : 'bg-emerald-900/70 text-emerald-100 hover:bg-emerald-800'
                }`}
              >
                {u.nome.split(' ')[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ================= 3 BIG INTUITIVE MAIN FUNCTION BUTTONS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Button 1: Minhas Rotinas do Dia */}
        <button
          type="button"
          onClick={() => setActiveTab('rotinas')}
          className={`min-h-[96px] p-5 rounded-3xl border-2 text-left transition-all flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] ${
            currentSection === 'rotinas'
              ? 'bg-[#0a3821] text-white border-[#0a3821] shadow-lg'
              : 'bg-white text-slate-900 border-slate-200 hover:border-emerald-600 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                currentSection === 'rotinas'
                  ? 'bg-emerald-800 text-emerald-200'
                  : 'bg-emerald-100 text-[#0a3821]'
              }`}
            >
              <CalendarCheck className="w-7 h-7" />
            </div>
            <div>
              <span
                className={`text-xs font-extrabold uppercase tracking-wider block ${
                  currentSection === 'rotinas' ? 'text-emerald-300' : 'text-emerald-800'
                }`}
              >
                1. Passo a Passo
              </span>
              <span className="text-lg sm:text-xl font-black block leading-tight mt-0.5">
                Minhas Rotinas
              </span>
              <span
                className={`text-xs font-semibold block mt-1 ${
                  currentSection === 'rotinas' ? 'text-emerald-100' : 'text-slate-600'
                }`}
              >
                {pendingRoutinesCount === 0
                  ? '✓ Tudo feito hoje!'
                  : `Faltam ${pendingRoutinesCount} rotinas`}
              </span>
            </div>
          </div>

          <div
            className={`min-w-10 h-10 px-2.5 rounded-2xl font-black text-base flex items-center justify-center shrink-0 ${
              currentSection === 'rotinas'
                ? 'bg-white text-[#0a3821]'
                : pendingRoutinesCount > 0
                ? 'bg-[#0a3821] text-white'
                : 'bg-emerald-100 text-emerald-900'
            }`}
          >
            {pendingRoutinesCount}
          </div>
        </button>

        {/* Button 2: Tarefas */}
        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`min-h-[96px] p-5 rounded-3xl border-2 text-left transition-all flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] ${
            currentSection === 'tasks'
              ? 'bg-[#0a3821] text-white border-[#0a3821] shadow-lg'
              : 'bg-white text-slate-900 border-slate-200 hover:border-emerald-600 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                currentSection === 'tasks'
                  ? 'bg-emerald-800 text-emerald-200'
                  : 'bg-emerald-100 text-[#0a3821]'
              }`}
            >
              <ClipboardList className="w-7 h-7" />
            </div>
            <div>
              <span
                className={`text-xs font-extrabold uppercase tracking-wider block ${
                  currentSection === 'tasks' ? 'text-emerald-300' : 'text-emerald-800'
                }`}
              >
                2. Atividades
              </span>
              <span className="text-lg sm:text-xl font-black block leading-tight mt-0.5">
                Minhas Tarefas
              </span>
              <span
                className={`text-xs font-semibold block mt-1 ${
                  currentSection === 'tasks' ? 'text-emerald-100' : 'text-slate-600'
                }`}
              >
                {pendingUserTasks.length === 0
                  ? '✓ Nenhuma pendente!'
                  : `Faltam ${pendingUserTasks.length} tarefas`}
              </span>
            </div>
          </div>

          <div
            className={`min-w-10 h-10 px-2.5 rounded-2xl font-black text-base flex items-center justify-center shrink-0 ${
              currentSection === 'tasks'
                ? 'bg-white text-[#0a3821]'
                : pendingUserTasks.length > 0
                ? 'bg-[#0a3821] text-white'
                : 'bg-emerald-100 text-emerald-900'
            }`}
          >
            {pendingUserTasks.length}
          </div>
        </button>

        {/* Button 3: Conferência de Compras */}
        <button
          type="button"
          onClick={() => setActiveTab('purchases')}
          className={`min-h-[96px] p-5 rounded-3xl border-2 text-left transition-all flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] ${
            currentSection === 'purchases'
              ? 'bg-[#0a3821] text-white border-[#0a3821] shadow-lg'
              : 'bg-white text-slate-900 border-slate-200 hover:border-emerald-600 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                currentSection === 'purchases'
                  ? 'bg-emerald-800 text-emerald-200'
                  : 'bg-emerald-100 text-[#0a3821]'
              }`}
            >
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <span
                className={`text-xs font-extrabold uppercase tracking-wider block ${
                  currentSection === 'purchases' ? 'text-emerald-300' : 'text-emerald-800'
                }`}
              >
                3. Chegada e Banca
              </span>
              <span className="text-lg sm:text-xl font-black block leading-tight mt-0.5">
                Conferir Compras
              </span>
              <span
                className={`text-xs font-semibold block mt-1 ${
                  currentSection === 'purchases' ? 'text-emerald-100' : 'text-slate-600'
                }`}
              >
                {pendingArrivalPurchases.length > 0
                  ? `${pendingArrivalPurchases.length} p/ conferir chegada`
                  : `${pendingRestockPurchases.length} p/ repor na banca`}
              </span>
            </div>
          </div>

          <div
            className={`min-w-10 h-10 px-2.5 rounded-2xl font-black text-base flex items-center justify-center shrink-0 ${
              currentSection === 'purchases'
                ? 'bg-white text-[#0a3821]'
                : pendingArrivalPurchases.length + pendingRestockPurchases.length > 0
                ? 'bg-amber-500 text-slate-950'
                : 'bg-emerald-100 text-emerald-900'
            }`}
          >
            {pendingArrivalPurchases.length > 0
              ? pendingArrivalPurchases.length
              : pendingRestockPurchases.length}
          </div>
        </button>
      </div>

      {/* ===================================================================================== */}
      {/* SECTION 1: MINHAS ROTINAS DO DIA (BOTÕES GRANDES E 1 TOQUE)                           */}
      {/* ===================================================================================== */}
      {currentSection === 'rotinas' && (
        <div className="space-y-4">
          {/* Simple Filter Bar */}
          <div className="bg-white p-3.5 rounded-3xl border border-slate-200 flex items-center justify-between gap-2 flex-wrap shadow-xs">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <button
                type="button"
                onClick={() => setRoutineFilter('pendentes')}
                className={`min-h-[48px] px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex-1 sm:flex-none ${
                  routineFilter === 'pendentes'
                    ? 'bg-[#0a3821] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Falta Fazer ({pendingRoutinesCount})
              </button>
              <button
                type="button"
                onClick={() => setRoutineFilter('concluidas')}
                className={`min-h-[48px] px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex-1 sm:flex-none ${
                  routineFilter === 'concluidas'
                    ? 'bg-[#0a3821] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Já Concluídas ({completedRoutinesCount})
              </button>
              <button
                type="button"
                onClick={() => setRoutineFilter('todas')}
                className={`min-h-[48px] px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  routineFilter === 'todas'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas ({routineCards.length})
              </button>
            </div>
          </div>

          {filteredRoutineCards.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-emerald-200 p-8 text-center space-y-3 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-[#0a3821] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {routineFilter === 'pendentes'
                  ? 'Parabéns! Você concluiu todas as suas rotinas do dia!'
                  : 'Nenhuma rotina concluída ainda.'}
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                {routineFilter === 'pendentes'
                  ? 'Toque em "Já Concluídas" para revisar ou veja a Conferência de Compras.'
                  : 'Toque em "Falta Fazer" para ver suas atividades de hoje.'}
              </p>
              {routineFilter === 'pendentes' && completedRoutinesCount > 0 && (
                <button
                  type="button"
                  onClick={() => setRoutineFilter('todas')}
                  className="min-h-[48px] px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-sm font-black cursor-pointer"
                >
                  Ver Todas as Rotinas ({routineCards.length})
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredRoutineCards.map((card) => (
                <div
                  key={card.id}
                  className={`p-5 rounded-3xl border-2 transition-all space-y-4 ${
                    card.concluido
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-emerald-100 text-[#0a3821]">
                          {card.categoriaLabel}
                        </span>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                          Responsável: {card.responsavelNome}
                        </span>
                      </div>
                      <h3
                        className={`text-lg sm:text-xl font-black leading-snug pt-1 ${
                          card.concluido ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {card.titulo}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">
                        {card.subtitulo}
                      </p>
                    </div>

                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        card.concluido
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {card.tipoIcone === 'coco' && <Droplets className="w-6 h-6" />}
                      {card.tipoIcone === 'freezer' && <Thermometer className="w-6 h-6" />}
                      {card.tipoIcone === 'limpeza' && <Brush className="w-6 h-6" />}
                      {card.tipoIcone === 'kombi' && <Truck className="w-6 h-6" />}
                      {card.tipoIcone === 'compras' && <ShoppingBag className="w-6 h-6" />}
                      {(card.tipoIcone === 'expositor' ||
                        card.tipoIcone === 'contagem' ||
                        card.tipoIcone === 'balcao' ||
                        card.tipoIcone === 'extra') && <Store className="w-6 h-6" />}
                    </div>
                  </div>

                  {card.extraControl && <div>{card.extraControl}</div>}

                  {/* Big 1-Tap Action Button */}
                  <button
                    type="button"
                    onClick={card.onToggle}
                    className={`w-full min-h-[60px] rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-[0.99] ${
                      card.concluido
                        ? 'bg-white border-2 border-slate-300 hover:bg-slate-100 text-slate-700'
                        : 'bg-[#0a3821] hover:bg-emerald-800 text-white shadow-md'
                    }`}
                  >
                    {card.concluido ? (
                      <>
                        <RotateCcw className="w-5 h-5 text-slate-500" />
                        <span>✓ JÁ CONCLUÍDO (Toque se quiser desmarcar)</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-6 h-6 text-emerald-300 stroke-[3]" />
                        <span>MARCAR COMO FEITO</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================================== */}
      {/* SECTION 2: MINHAS TAREFAS (BOTÕES GRANDES E INTUITIVOS)                               */}
      {/* ===================================================================================== */}
      {currentSection === 'tasks' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-3xl border border-slate-200 flex items-center justify-between gap-2 flex-wrap shadow-xs">
            <div className="flex items-center gap-2 flex-1">
              <button
                type="button"
                onClick={() => setTaskFilter('pendentes')}
                className={`min-h-[48px] px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex-1 sm:flex-none ${
                  taskFilter === 'pendentes'
                    ? 'bg-[#0a3821] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Falta Fazer ({pendingUserTasks.length})
              </button>
              <button
                type="button"
                onClick={() => setTaskFilter('concluidas')}
                className={`min-h-[48px] px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex-1 sm:flex-none ${
                  taskFilter === 'concluidas'
                    ? 'bg-[#0a3821] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Já Feitas ({completedUserTasks.length})
              </button>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={onAddTask}
                className="min-h-[48px] px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs sm:text-sm font-black flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nova Tarefa</span>
              </button>
            )}
          </div>

          {displayedTasks.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-emerald-200 p-8 text-center space-y-3 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-[#0a3821] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {taskFilter === 'pendentes'
                  ? 'Tudo em dia! Nenhuma tarefa pendente agora.'
                  : 'Nenhuma tarefa concluída ainda hoje.'}
              </h3>
              <p className="text-sm text-slate-600">
                {taskFilter === 'pendentes'
                  ? 'Excelente trabalho na operação da loja!'
                  : 'Toque em "Falta Fazer" para ver suas tarefas abertas.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {displayedTasks.map((task) => {
                const isDone = task.status === 'Concluída';
                const isTwoMin = task.tipoTempo === '2 Minutos (Fazer na Transição)';
                const isUrgent = task.prioridade === '1-Crítica' || task.prioridade === '2-Alta';

                return (
                  <div
                    key={task.id}
                    className={`p-5 rounded-3xl border-2 transition-all space-y-4 ${
                      isDone
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-800">
                          {task.categoria}
                        </span>
                        {isTwoMin && (
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-100 text-amber-950 border border-amber-300">
                            ⚡ Rápida (2 Minutos)
                          </span>
                        )}
                        {isUrgent && !isDone && (
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-rose-100 text-rose-900">
                            Prioridade Alta
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-lg sm:text-xl font-black leading-snug pt-0.5 ${
                          isDone ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.tituloAtividade}
                      </h3>

                      {task.instrucoesDetalhadas && (
                        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                          {task.instrucoesDetalhadas}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (isDone) {
                          onReopenTask(task.id);
                        } else {
                          onQuickCompleteTask(task.id, '');
                        }
                      }}
                      className={`w-full min-h-[60px] rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-[0.99] ${
                        isDone
                          ? 'bg-white border-2 border-slate-300 hover:bg-slate-100 text-slate-700'
                          : 'bg-[#0a3821] hover:bg-emerald-800 text-white shadow-md'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <RotateCcw className="w-5 h-5 text-slate-500" />
                          <span>✓ TAREFA FEITA (Toque para reabrir)</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-6 h-6 text-emerald-300 stroke-[3]" />
                          <span>CONCLUIR TAREFA AGORA</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================================== */}
      {/* SECTION 3: CONFERÊNCIA DE COMPRAS & REPOSIÇÃO DE BANCA                                */}
      {/* ===================================================================================== */}
      {currentSection === 'purchases' && (
        <div className="space-y-4">
          {/* Two Huge Mode Buttons: 1. Conferir Chegada | 2. Repor na Banca */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPurchaseStep('chegada')}
              className={`min-h-[72px] p-4 rounded-3xl border-2 text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                purchaseStep === 'chegada'
                  ? 'bg-[#0a3821] text-white border-[#0a3821] shadow-md'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <Truck
                  className={`w-6 h-6 shrink-0 ${
                    purchaseStep === 'chegada' ? 'text-emerald-300' : 'text-emerald-700'
                  }`}
                />
                <div>
                  <span className="font-black text-base block">1. Conferir Chegada</span>
                  <span
                    className={`text-xs block ${
                      purchaseStep === 'chegada' ? 'text-emerald-100' : 'text-slate-500'
                    }`}
                  >
                    Marcar o que chegou da Kombi / Fornecedor
                  </span>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-xl font-black text-sm ${
                  purchaseStep === 'chegada'
                    ? 'bg-white text-[#0a3821]'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {pendingArrivalPurchases.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPurchaseStep('banca')}
              className={`min-h-[72px] p-4 rounded-3xl border-2 text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                purchaseStep === 'banca'
                  ? 'bg-[#0a3821] text-white border-[#0a3821] shadow-md'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers
                  className={`w-6 h-6 shrink-0 ${
                    purchaseStep === 'banca' ? 'text-emerald-300' : 'text-emerald-700'
                  }`}
                />
                <div>
                  <span className="font-black text-base block">2. Colocar na Banca</span>
                  <span
                    className={`text-xs block ${
                      purchaseStep === 'banca' ? 'text-emerald-100' : 'text-slate-500'
                    }`}
                  >
                    Mercadorias na loja que faltam ir pra banca
                  </span>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-xl font-black text-sm ${
                  purchaseStep === 'banca'
                    ? 'bg-white text-[#0a3821]'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {pendingRestockPurchases.length}
              </span>
            </button>
          </div>

          {/* Quick Actions Bar: Search, Category Pills, Joint Conference & Bulk Delete */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={purchaseSearch}
                  onChange={(e) => setPurchaseSearch(e.target.value)}
                  placeholder="Buscar produto ou categoria (ex: Uva, Temperos)..."
                  className="w-full min-h-[48px] pl-11 pr-4 py-2 bg-slate-50 rounded-2xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsAiImportOpen(true)}
                  className="min-h-[48px] px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-none shadow-xs"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>Importar Lista (WhatsApp)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPurchasePrintInitialModel('prancheta_dupla');
                    setIsPurchasePrintOpen(true);
                  }}
                  className="min-h-[48px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Imprimir Espelho de Conferência de Mercadoria (A4)"
                >
                  <Printer className="w-4 h-4 text-emerald-800" />
                  <span>Imprimir Lista</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPurchasePrintInitialModel('extras_fora_da_lista');
                    setIsPurchasePrintOpen(true);
                  }}
                  className="min-h-[48px] px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 border-2 border-amber-300 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Imprimir uma folha A4 em branco para anotar os produtos que chegaram na loja, mas que não estavam na lista"
                >
                  <Printer className="w-4 h-4 text-amber-800" />
                  <span>📝 Folha: Chegaram Fora da Lista</span>
                </button>
                {purchases.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsRenewModalOpen(true)}
                    className="min-h-[48px] px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Renovar lista após a conferência do Lucas ou Rafael"
                  >
                    <RefreshCw className="w-4 h-4 text-amber-700" />
                    <span>Renovar Lista</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onAddPurchase}
                  className="min-h-[48px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Item</span>
                </button>
              </div>
            </div>

            {/* Conferente Selector (including Admin Joint Conference with Lucas or Rafael) */}
            {purchaseStep === 'chegada' && (
              <div className="p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-950">
                  <Users className="w-4 h-4 text-[#0a3821] shrink-0" />
                  <span>
                    {isAdmin
                      ? 'Conferência Conjunta Admin (caso Lucas/Rafael estejam sem celular):'
                      : 'Quem está conferindo a chegada:'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(isAdmin
                    ? [`${firstName} + Lucas`, `${firstName} + Rafael`, 'Lucas', 'Rafael', 'Lucas & Rafael']
                    : ['Lucas', 'Rafael', 'Lucas & Rafael']
                  ).map((nome) => (
                    <button
                      key={nome}
                      type="button"
                      onClick={() => setConferentePadrao(nome)}
                      className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                        conferentePadrao === nome
                          ? 'bg-[#0a3821] text-white border-[#0a3821] shadow-2xs'
                          : 'bg-white text-emerald-950 border-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      {nome}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Category Filter Buttons */}
            {purchaseCategories.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-xs font-bold text-slate-500 mr-1">Categorias:</span>
                <button
                  type="button"
                  onClick={() => setPurchaseCategoryFilter('todas')}
                  className={`min-h-[38px] px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    purchaseCategoryFilter === 'todas'
                      ? 'bg-[#0a3821] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Todas ({purchases.length})
                </button>
                {purchaseCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPurchaseCategoryFilter(cat)}
                    className={`min-h-[38px] px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      purchaseCategoryFilter === cat
                        ? 'bg-[#0a3821] text-white'
                        : 'bg-emerald-50 text-emerald-950 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Bulk Selection & Deletion Bar */}
            {filteredPurchases.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const allSelected =
                        filteredPurchases.length > 0 &&
                        filteredPurchases.every((p) => selectedPurchaseIds.has(p.id));
                      if (allSelected) {
                        setSelectedPurchaseIds(new Set());
                      } else {
                        setSelectedPurchaseIds(new Set(filteredPurchases.map((p) => p.id)));
                      }
                    }}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-black border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    {filteredPurchases.length > 0 &&
                    filteredPurchases.every((p) => selectedPurchaseIds.has(p.id)) ? (
                      <CheckSquare className="w-4 h-4 text-[#0a3821]" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span>Selecionar Todos ({filteredPurchases.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPurchaseIds(
                        new Set(purchases.filter((p) => p.mercadoriaRecebida).map((p) => p.id))
                      )
                    }
                    className="min-h-[36px] px-2.5 py-1.5 rounded-xl text-xs font-bold border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 cursor-pointer"
                  >
                    Selecionar Já Conferidos
                  </button>

                  {selectedPurchaseIds.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedPurchaseIds(new Set())}
                      className="min-h-[36px] px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                    >
                      Limpar ({selectedPurchaseIds.size})
                    </button>
                  )}
                </div>

                {selectedPurchaseIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsBulkDeleteModalOpen(true)}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir Selecionados ({selectedPurchaseIds.size})</span>
                  </button>
                )}
              </div>
            )}

            {/* Sequential Conference Button when in Chegada mode */}
            {purchaseStep === 'chegada' && pendingArrivalPurchases.length > 0 && (
              <button
                type="button"
                onClick={handleQuickReceiveAll}
                className="w-full min-h-[54px] bg-emerald-100 hover:bg-emerald-200 text-[#0a3821] border-2 border-emerald-300 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
              >
                <CheckCircle2 className="w-5 h-5 text-[#0a3821]" />
                <span>
                  ⚖️ CONFERIR MERCADORIAS EM SEQUÊNCIA — CONVERSÃO OBRIGATÓRIA KG / UN ({pendingArrivalPurchases.length} pendentes)
                </span>
              </button>
            )}
          </div>

          {/* Purchases Cards List */}
          {filteredPurchases.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-8 text-center space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-lg font-black text-slate-800">
                {purchaseStep === 'banca'
                  ? 'Nenhuma mercadoria aguardando reposição nesta categoria.'
                  : 'Nenhum produto encontrado na lista.'}
              </h3>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPurchases.map((item) => {
                const isReceived = item.mercadoriaRecebida;
                const isRestocked = item.reposicaoConcluida;
                const isPartial = item.statusConferencia === 'Entrega Parcial / Falta';
                const isComprouNaoChegou = item.statusConferencia === 'Comprou, mas não chegou';
                const isNaoComprou = item.statusConferencia === 'Não Comprou';
                const isNaoChegouAny = isComprouNaoChegou || isNaoComprou;
                const isSelected = selectedPurchaseIds.has(item.id);
                const isNaoChegouMenuOpen = naoChegouMenuItemId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-3xl border-2 transition-all space-y-4 ${
                      isSelected
                        ? 'bg-rose-50/40 border-rose-400 ring-2 ring-rose-200'
                        : isNaoChegouAny
                        ? 'bg-amber-50/40 border-amber-300'
                        : (purchaseStep === 'chegada' && isReceived) ||
                          (purchaseStep === 'banca' && isRestocked)
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleSelectPurchase(item.id)}
                          className="mt-1 text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
                          title="Selecionar produto para exclusão em massa"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-6 h-6 text-rose-600" />
                          ) : (
                            <Square className="w-6 h-6" />
                          )}
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.categoria && (
                              <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-emerald-100 text-[#0a3821]">
                                {item.categoria}
                              </span>
                            )}
                            {item.fornecedor && (
                              <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                                {item.fornecedor}
                              </span>
                            )}
                            {isComprouNaoChegou && (
                              <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-200 text-amber-950 border border-amber-400">
                                📦⚠️ Comprou, mas não chegou
                              </span>
                            )}
                            {isNaoComprou && (
                              <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-rose-100 text-rose-900 border border-rose-300">
                                🚫 Não Comprou
                              </span>
                            )}
                            {isReceived && item.quantidadeRecebida && (
                              <span
                                className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${
                                  isPartial
                                    ? 'bg-amber-100 text-amber-950 border-amber-300'
                                    : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                }`}
                              >
                                {isPartial ? '⚠ Qtd que chegou:' : '✓ Qtd que chegou:'}{' '}
                                {item.quantidadeRecebida}
                              </span>
                            )}
                            {isReceived && item.quantidadeConvertida && item.unidadeConversao && (
                              <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#0a3821] text-white border border-[#0a3821] font-mono">
                                {item.unidadeConversao === 'kg' ? '⚖️ Peso:' : '🔢 Contagem:'}{' '}
                                {item.quantidadeConvertida} {item.unidadeConversao}
                              </span>
                            )}
                            {isReceived && item.quantidadeAvaria && item.unidadeConversao && (
                              <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-rose-100 text-rose-900 border border-rose-300 font-mono">
                                ⚠ Avaria: {item.quantidadeAvaria} {item.unidadeConversao}
                                {item.quantidadeLiquidaAproveitavel
                                  ? ` (Líquido: ${item.quantidadeLiquidaAproveitavel} ${item.unidadeConversao})`
                                  : ''}
                              </span>
                            )}
                            {(isReceived || isNaoChegouAny) && item.conferidoPorNome && (
                              <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700">
                                Conf: {item.conferidoPorNome}
                              </span>
                            )}
                          </div>

                          <h4 className="text-xl font-black text-slate-900 pt-0.5">
                            {item.produto}
                          </h4>

                          {item.motivoDivergencia && (
                            <p className="text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                              Obs: {item.motivoDivergencia}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Huge Quantity Pill */}
                      <div className="px-4 py-2 rounded-2xl bg-emerald-950 text-white text-right shrink-0">
                        <span className="text-[10px] uppercase font-bold text-emerald-300 block">
                          Qtd Pedida
                        </span>
                        <span className="text-base sm:text-lg font-mono font-black">
                          {item.quantidadePedida && item.quantidadePedida.trim()
                            ? item.quantidadePedida
                            : 'A definir'}
                        </span>
                      </div>
                    </div>

                    {/* Step A: Conferir Chegada + Botão ao lado para Produtos que Não Chegaram */}
                    {purchaseStep === 'chegada' && (
                      <div className="space-y-2.5">
                        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setNaoChegouMenuItemId(null);
                              if (isReceived) {
                                onUpdatePurchase({
                                  ...item,
                                  mercadoriaRecebida: false,
                                  statusConferencia: 'Pendente',
                                  motivoNaoChegou: undefined,
                                  dataAtualizacao: new Date().toISOString(),
                                });
                              } else {
                                handleOpenArrivalQuantityModal(item);
                              }
                            }}
                            className={`flex-1 min-h-[56px] rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.99] ${
                              isReceived
                                ? 'bg-white border-2 border-slate-300 hover:bg-slate-100 text-slate-700'
                                : 'bg-[#0a3821] hover:bg-emerald-800 text-white shadow-md'
                            }`}
                          >
                            {isReceived ? (
                              <>
                                <RotateCcw className="w-5 h-5 text-slate-500" />
                                <span>✓ JÁ CONFERIDO NA LOJA (Desmarcar)</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-6 h-6 text-emerald-300 stroke-[3]" />
                                <span>CONFERIR CHEGADA &amp; CONVERTER (KG / UN)</span>
                              </>
                            )}
                          </button>

                          {/* Botão ao lado do botão Conferir para produtos que estavam na lista mas não chegaram à loja */}
                          <button
                            type="button"
                            onClick={() =>
                              setNaoChegouMenuItemId(isNaoChegouMenuOpen ? null : item.id)
                            }
                            className={`min-h-[56px] px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border-2 transition-all cursor-pointer shrink-0 ${
                              isNaoChegouMenuOpen || isNaoChegouAny
                                ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300'
                            }`}
                            title="Marcar produto que estava na lista mas não chegou à loja"
                          >
                            <X className="w-5 h-5" />
                            <span>
                              {isComprouNaoChegou
                                ? 'Comprou, mas não chegou'
                                : isNaoComprou
                                ? 'Não Comprou'
                                : 'Não Chegou à Loja'}
                            </span>
                          </button>

                          {isReceived && (
                            <button
                              type="button"
                              onClick={() => handleOpenArrivalQuantityModal(item)}
                              className="min-h-[56px] px-4 bg-amber-50 hover:bg-amber-100 text-amber-950 border-2 border-amber-300 rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
                            >
                              <Edit3 className="w-4 h-4 text-amber-700" />
                              <span>Editar Conversão / Avaria</span>
                            </button>
                          )}
                        </div>

                        {/* Opções após clicar no botão Não Chegou: "Comprou, mas não chegou" ou "Não Comprou" */}
                        {(isNaoChegouMenuOpen || isNaoChegouAny) && (
                          <div className="p-3.5 rounded-2xl bg-rose-50/90 border-2 border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in">
                            <span className="text-xs font-black text-rose-950">
                              Por que este produto da lista não chegou à loja?
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() =>
                                  handleMarkNaoChegou(item, 'Comprou, mas não chegou')
                                }
                                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-black border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isComprouNaoChegou
                                    ? 'bg-amber-500 text-slate-950 border-amber-700 shadow-xs'
                                    : 'bg-white hover:bg-amber-50 text-amber-950 border-amber-400'
                                }`}
                              >
                                <span>📦⚠️ Comprou, mas não chegou</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleMarkNaoChegou(item, 'Não Comprou')}
                                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-black border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isNaoComprou
                                    ? 'bg-rose-700 text-white border-rose-900 shadow-xs'
                                    : 'bg-white hover:bg-rose-100 text-rose-900 border-rose-300'
                                }`}
                              >
                                <span>🚫 Não Comprou</span>
                              </button>

                              {isNaoChegouAny && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdatePurchase({
                                      ...item,
                                      statusConferencia: 'Pendente',
                                      motivoNaoChegou: undefined,
                                      motivoDivergencia: undefined,
                                      quantidadeRecebida: undefined,
                                      dataAtualizacao: new Date().toISOString(),
                                    });
                                    setNaoChegouMenuItemId(null);
                                  }}
                                  className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 cursor-pointer"
                                >
                                  Limpar
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step B: Repor na Banca Button */}
                    {purchaseStep === 'banca' && (
                      <button
                        type="button"
                        onClick={() => handleQuickToggleBanca(item)}
                        className={`w-full min-h-[56px] rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.99] ${
                          isRestocked
                            ? 'bg-white border-2 border-slate-300 hover:bg-slate-100 text-slate-700'
                            : 'bg-[#0a3821] hover:bg-emerald-800 text-white shadow-md'
                        }`}
                      >
                        {isRestocked ? (
                          <>
                            <RotateCcw className="w-5 h-5 text-slate-500" />
                            <span>✓ JÁ ESTÁ NA BANCA (Desmarcar)</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-6 h-6 text-emerald-300 stroke-[3]" />
                            <span>MARCAR QUE JÁ COLOQUEI NA BANCA</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: CONFERÊNCIA DE CHEGADA + CONVERSÃO OBRIGATÓRIA (KG / UN) + AVARIA ================= */}
      {divergenciaItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#0a3821]" />
                  <span>Conferência &amp; Conversão Obrigatória</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Converta a caixa/volume recebido em <strong>kg</strong> (peso com fração) ou <strong>un</strong> (unidades inteiras)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDivergenciaItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDivergencia} className="space-y-4">
              <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-slate-500 block">Produto conferido na loja:</span>
                  <span className="text-lg font-black text-slate-900 block">
                    {divergenciaItem.produto}
                  </span>
                  {divergenciaItem.fornecedor && (
                    <span className="text-[11px] font-bold text-emerald-900">
                      Fornecedor: {divergenciaItem.fornecedor}
                    </span>
                  )}
                </div>
                <div className="text-right bg-white px-3.5 py-2 rounded-xl border border-emerald-200 shrink-0">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                    Qtd Pedida
                  </span>
                  <span className="text-base font-mono font-black text-[#0a3821]">
                    {divergenciaItem.quantidadePedida || 'Em aberto'}
                  </span>
                </div>
              </div>

              {divergenciaErro && (
                <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs font-black flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{divergenciaErro}</span>
                </div>
              )}

              {/* PASSO 1: Volumes que chegaram (ex: 1 cx, 2 cx, 1 sc) */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase mb-1.5">
                  1. Quantos volumes chegaram na loja? (Ex: 1 cx, 1 sc) *
                </label>
                <input
                  type="text"
                  required
                  value={divergenciaQtd}
                  onChange={(e) => setDivergenciaQtd(e.target.value)}
                  placeholder="Ex: 1 cx, 1/2 cx, 1 sc, 0 (faltou)..."
                  className="w-full min-h-[46px] px-4 py-2 rounded-2xl border-2 border-slate-300 text-base font-black text-slate-900 focus:outline-none focus:border-[#0a3821]"
                />
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  {divergenciaItem.quantidadePedida && (
                    <button
                      type="button"
                      onClick={() => setDivergenciaQtd(divergenciaItem.quantidadePedida!)}
                      className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-950 border border-emerald-300 cursor-pointer"
                    >
                      ✓ Pedido ({divergenciaItem.quantidadePedida})
                    </button>
                  )}
                  {['1/2 cx', '1 cx', '2 cx', '1 sc', '5 un', '10 un', '0 (Faltou)'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setDivergenciaQtd(chip)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* PASSO 2: CONVERSÃO OBRIGATÓRIA EM KG OU UNIDADE + AVARIA OPCIONAL NA MESMA UNIDADE */}
              {!(
                divergenciaQtd.trim() === '0' ||
                divergenciaQtd.toLowerCase().includes('faltou') ||
                divergenciaQtd.toLowerCase() === 'nada'
              ) && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-300 space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label className="text-xs font-black text-slate-900 uppercase">
                        2. Unidade de Medida na Conversão (Obrigatório) *
                      </label>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-200 text-amber-950 uppercase">
                        Obrigatório p/ quem conferiu
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mb-2">
                      Escolha se este produto na caixa é convertido por <strong>Peso na Balança (kg)</strong> ou por <strong>Contagem de Unidades (un)</strong>:
                    </p>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleSelectUnidadeConversao('kg')}
                        className={`min-h-[58px] p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                          divergenciaUnidadeConversao === 'kg'
                            ? 'bg-[#0a3821] text-white border-[#0a3821] shadow-md'
                            : 'bg-white text-slate-900 border-slate-300 hover:border-emerald-600'
                        }`}
                      >
                        <span className="text-sm font-black block">⚖️ Quilo (kg)</span>
                        <span
                          className={`text-[11px] font-semibold block ${
                            divergenciaUnidadeConversao === 'kg' ? 'text-emerald-200' : 'text-slate-500'
                          }`}
                        >
                          Aceita fração (Ex: 20,450 kg)
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectUnidadeConversao('un')}
                        className={`min-h-[58px] p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                          divergenciaUnidadeConversao === 'un'
                            ? 'bg-[#0a3821] text-white border-[#0a3821] shadow-md'
                            : 'bg-white text-slate-900 border-slate-300 hover:border-emerald-600'
                        }`}
                      >
                        <span className="text-sm font-black block">🔢 Unidade (un)</span>
                        <span
                          className={`text-[11px] font-semibold block ${
                            divergenciaUnidadeConversao === 'un' ? 'text-emerald-200' : 'text-slate-500'
                          }`}
                        >
                          Só número inteiro (Ex: 243 un)
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Inputs de Quantidade Convertida + Avaria Opcional (mesma unidade) */}
                  {divergenciaUnidadeConversao ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Quantidade Convertida Obrigatória */}
                      <div>
                        <label className="block text-xs font-black text-slate-900 mb-1">
                          {divergenciaUnidadeConversao === 'kg'
                            ? 'Peso Total Convertido (kg) *'
                            : 'Total em Unidades (un) *'}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode={divergenciaUnidadeConversao === 'kg' ? 'decimal' : 'numeric'}
                            required
                            value={divergenciaValorConvertido}
                            onChange={(e) => {
                              setDivergenciaErro('');
                              setDivergenciaValorConvertido(
                                sanitizeMeasureValue(e.target.value, divergenciaUnidadeConversao)
                              );
                            }}
                            placeholder={
                              divergenciaUnidadeConversao === 'kg'
                                ? 'Ex: 20,450'
                                : 'Ex: 243 (inteiro)'
                            }
                            className="w-full min-h-[48px] pl-3.5 pr-12 py-2 bg-white rounded-2xl border-2 border-[#0a3821] text-base font-mono font-black text-slate-900 focus:outline-none"
                          />
                          <span className="absolute right-3.5 top-3 text-xs font-mono font-black text-[#0a3821] bg-emerald-100 px-2 py-0.5 rounded-lg">
                            {divergenciaUnidadeConversao}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-600 font-semibold block mt-1">
                          {divergenciaUnidadeConversao === 'kg'
                            ? 'Permite número fracionado c/ vírgula (ex: 20,450 kg)'
                            : 'Apenas número inteiro sem fração (ex: 243 un)'}
                        </span>
                      </div>

                      {/* Avaria Opcional na Mesma Unidade de Medida */}
                      <div>
                        <label className="block text-xs font-bold text-rose-900 mb-1">
                          Avaria / Perda (Opcional em {divergenciaUnidadeConversao})
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode={divergenciaUnidadeConversao === 'kg' ? 'decimal' : 'numeric'}
                            value={divergenciaValorAvaria}
                            onChange={(e) =>
                              setDivergenciaValorAvaria(
                                sanitizeMeasureValue(e.target.value, divergenciaUnidadeConversao)
                              )
                            }
                            placeholder={
                              divergenciaUnidadeConversao === 'kg'
                                ? 'Ex: 0,450 (opcional)'
                                : 'Ex: 3 (inteiro, opcional)'
                            }
                            className="w-full min-h-[48px] pl-3.5 pr-12 py-2 bg-white rounded-2xl border-2 border-rose-300 text-base font-mono font-bold text-rose-950 focus:outline-none focus:border-rose-600"
                          />
                          <span className="absolute right-3.5 top-3 text-xs font-mono font-black text-rose-900 bg-rose-100 px-2 py-0.5 rounded-lg">
                            {divergenciaUnidadeConversao}
                          </span>
                        </div>
                        <span className="text-[10px] text-rose-800 font-semibold block mt-1">
                          {divergenciaUnidadeConversao === 'kg'
                            ? 'Mesma unidade (kg fracionado) p/ fruta estragada'
                            : 'Mesma unidade (un inteiro) p/ unidades estragadas'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-white/80 border border-amber-300 text-xs font-bold text-amber-950 text-center">
                      👆 Toque acima em <strong>Quilo (kg)</strong> ou <strong>Unidade (un)</strong> para liberar o preenchimento do valor convertido e avaria.
                    </div>
                  )}

                  {/* Resumo Líquido Aproveitável em Tempo Real */}
                  {divergenciaUnidadeConversao && divergenciaValorConvertido && (
                    <div className="p-3 rounded-xl bg-white border border-emerald-300 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        Conversão registrada ({divergenciaQtd || '1 cx'}):
                      </span>
                      <span className="font-mono font-black text-[#0a3821] text-sm">
                        {divergenciaValorConvertido} {divergenciaUnidadeConversao}
                        {parseMeasureNumber(divergenciaValorAvaria) > 0 && (
                          <span className="text-rose-700 ml-1.5">
                            (- {divergenciaValorAvaria} {divergenciaUnidadeConversao} avaria ={' '}
                            <strong className="text-emerald-900">
                              {formatMeasureNumber(
                                Math.max(
                                  0,
                                  parseMeasureNumber(divergenciaValorConvertido) -
                                    parseMeasureNumber(divergenciaValorAvaria)
                                ),
                                divergenciaUnidadeConversao,
                                divergenciaValorConvertido
                              )}{' '}
                              {divergenciaUnidadeConversao} líq.
                            </strong>
                            )
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* PASSO 3: Quem conferiu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  3. Conferido por (Lucas, Rafael ou Admin junto):
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(isAdmin
                    ? [`${firstName} + Lucas`, `${firstName} + Rafael`, 'Lucas', 'Rafael', 'Lucas & Rafael']
                    : ['Lucas', 'Rafael', 'Lucas & Rafael']
                  ).map((nome) => (
                    <button
                      key={nome}
                      type="button"
                      onClick={() => {
                        setDivergenciaConferente(nome);
                        setConferentePadrao(nome);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        divergenciaConferente === nome
                          ? 'bg-[#0a3821] text-white border-[#0a3821]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {nome}
                    </button>
                  ))}
                </div>
              </div>

              {/* PASSO 4: Observação */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  4. Observação / Divergência (opcional):
                </label>
                <input
                  type="text"
                  value={divergenciaMotivo}
                  onChange={(e) => setDivergenciaMotivo(e.target.value)}
                  placeholder="Ex: Faltou no fornecedor, veio maduro demais..."
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl border border-slate-300 text-sm text-slate-800"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDivergenciaItem(null)}
                  className="min-h-[48px] px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs sm:text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                {pendingArrivalPurchases.filter((p) => p.id !== divergenciaItem.id).length > 0 && (
                  <button
                    type="button"
                    onClick={() => saveConferenceItem(true)}
                    className="flex-1 min-h-[48px] px-4 bg-emerald-100 hover:bg-emerald-200 text-[#0a3821] border-2 border-emerald-400 font-black rounded-2xl text-xs sm:text-sm cursor-pointer"
                  >
                    Salvar e Ir p/ Próximo ({pendingArrivalPurchases.filter((p) => p.id !== divergenciaItem.id).length})
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 min-h-[48px] px-4 bg-[#0a3821] hover:bg-emerald-800 text-white font-black rounded-2xl text-xs sm:text-sm cursor-pointer shadow-md"
                >
                  ✓ Confirmar Chegada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRMAÇÃO DE EXCLUSÃO EM MASSA ================= */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Excluir {selectedPurchaseIds.size} Produto(s) Selecionado(s)?
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Os produtos selecionados serão removidos da lista de compras e reposição.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="flex-1 min-h-[46px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="flex-1 min-h-[46px] bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl text-xs cursor-pointer shadow-md"
              >
                Sim, Excluir ({selectedPurchaseIds.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: RENOVAR LISTA PÓS-CONFERÊNCIA ================= */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Renovar Lista Pós-Conferência
                  </h3>
                  <p className="text-xs text-slate-500">
                    Arquiva os itens conferidos por Lucas ou Rafael e prepara a lista para o próximo pedido
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRenewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleConfirmRenewList('archive_conferred')}
                className="w-full p-3.5 rounded-2xl border-2 border-emerald-600 bg-emerald-50/70 hover:bg-emerald-100/80 text-left transition-all cursor-pointer"
              >
                <span className="text-xs font-black text-[#0a3821] block">
                  ✓ Arquivar Já Conferidos e Manter Pendentes (Recomendado)
                </span>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  Remove os itens que já chegaram na loja e mantém apenas o que faltou chegar.
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmRenewList('archive_all')}
                className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 text-left transition-all cursor-pointer"
              >
                <span className="text-xs font-black text-slate-800 block">
                  Limpar Lista Inteira para Novo Dia ({purchases.length} itens)
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Arquiva todos os produtos atuais no histórico e deixa a lista em branco.
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Import Modal available directly from Basic Mode */}
      <PurchaseAiImportModal
        isOpen={isAiImportOpen}
        onClose={() => setIsAiImportOpen(false)}
        currentUser={currentUser}
        existingSuppliers={[]}
        existingPurchasesCount={purchases.length}
        onConfirmImport={(newItems, openPrint, saveMode = 'replace') => {
          onBatchAddPurchases(newItems, saveMode);
          if (openPrint) {
            setIsPurchasePrintOpen(true);
          }
        }}
      />

      {/* Purchase Print Modal available directly from Basic Mode */}
      <PurchasePrintModal
        isOpen={isPurchasePrintOpen}
        onClose={() => setIsPurchasePrintOpen(false)}
        purchases={purchases}
        settings={settings}
        currentUser={currentUser}
        initialModel={purchasePrintInitialModel}
      />
    </div>
  );
};
