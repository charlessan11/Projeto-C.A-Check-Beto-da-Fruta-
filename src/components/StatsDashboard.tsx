import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  Clock,
  PieChart as PieIcon,
  TrendingUp,
  Users,
  Zap,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
  Filter,
  BarChart3,
  Info,
} from 'lucide-react';
import { Task, User, CategoriaTarefa } from '../types';

interface StatsDashboardProps {
  tasks: Task[];
  users: User[];
}

// Vibrant, accessible palette matching the hortifrúti theme
const CATEGORY_COLORS: Record<string, string> = {
  'Reposição de Banca': '#059669', // Emerald 600
  'Produção / Grab & Go': '#d97706', // Amber 600
  'Qualidade / Validade': '#0284c7', // Sky 600
  'Limpeza': '#0d9488', // Teal 600
  'Estoque': '#6366f1', // Indigo 500
  'Administrativo': '#64748b', // Slate 500
  'Geral': '#84cc16', // Lime 500
};

const GTD_COLORS = ['#059669', '#f59e0b']; // Macro (Emerald) vs 2-Min (Amber)

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ tasks, users }) => {
  const [period, setPeriod] = useState<'mes_atual' | '30_dias' | 'tudo'>('mes_atual');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('todos');

  const usersMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  // Filter completed tasks according to selected period and user
  const completedTasks = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return tasks.filter((task) => {
      if (task.status !== 'Concluída' && !task.dataHoraConclusao) return false;

      const finishDate = task.dataHoraConclusao ? new Date(task.dataHoraConclusao) : new Date(task.criadoEm);

      if (period === 'mes_atual') {
        if (finishDate.getMonth() !== currentMonth || finishDate.getFullYear() !== currentYear) {
          return false;
        }
      } else if (period === '30_dias') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (finishDate < thirtyDaysAgo) return false;
      }

      if (selectedUserFilter !== 'todos') {
        const userId = task.concluidoPorId || task.responsavelId;
        if (userId !== selectedUserFilter) return false;
      }

      return true;
    });
  }, [tasks, period, selectedUserFilter]);

  // Helper to calculate duration in minutes between created and completed
  const getTaskDurationMinutes = (task: Task): number => {
    if (!task.dataHoraConclusao) {
      return task.tipoTempo === '2 Minutos (Fazer na Transição)' ? 2.5 : 35;
    }

    const start = new Date(task.criadoEm).getTime();
    const end = new Date(task.dataHoraConclusao).getTime();
    const diffMin = Math.round((end - start) / 60000);

    // Guard against unrealistic negative or extreme values in mock data
    if (diffMin <= 0 || isNaN(diffMin)) {
      return task.tipoTempo === '2 Minutos (Fazer na Transição)' ? 2.5 : 35;
    }
    // Cap at reasonable shift minutes (e.g., 240 max for analysis)
    return Math.min(diffMin, 240);
  };

  // 1. Data for Tempo Médio por Colaborador
  const userCompletionData = useMemo(() => {
    return users.map((user) => {
      const userTasks = completedTasks.filter(
        (t) => (t.concluidoPorId || t.responsavelId) === user.id
      );

      const standard = userTasks.filter((t) => t.tipoTempo !== '2 Minutos (Fazer na Transição)');
      const twoMin = userTasks.filter((t) => t.tipoTempo === '2 Minutos (Fazer na Transição)');

      const totalStandardMinutes = standard.reduce((acc, t) => acc + getTaskDurationMinutes(t), 0);
      const totalTwoMinMinutes = twoMin.reduce((acc, t) => acc + getTaskDurationMinutes(t), 0);

      const avgStandard = standard.length > 0 ? Math.round(totalStandardMinutes / standard.length) : 0;
      const avgTwoMin = twoMin.length > 0 ? Number((totalTwoMinMinutes / twoMin.length).toFixed(1)) : 0;
      const totalAvg =
        userTasks.length > 0
          ? Math.round((totalStandardMinutes + totalTwoMinMinutes) / userTasks.length)
          : 0;

      return {
        id: user.id,
        nome: user.nome.split(' ')[0], // First name for clean X axis
        nomeCompleto: user.nome,
        setor: user.cargoDescricao || user.setoresAtuacao?.split(',')[0] || 'Geral',
        totalConcluidas: userTasks.length,
        macroConcluidas: standard.length,
        twoMinConcluidas: twoMin.length,
        mediaMacroMin: avgStandard,
        mediaTwoMin: avgTwoMin,
        mediaGeralMin: totalAvg,
      };
    });
  }, [users, completedTasks]);

  // 2. Data for Distribuição de Tipos de Atividades no Mês (Categories)
  const categoryDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};

    completedTasks.forEach((task) => {
      const cat = task.categoria || 'Geral';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const total = completedTasks.length || 1;

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / total) * 100),
      color: CATEGORY_COLORS[name] || '#10b981',
    }));
  }, [completedTasks]);

  // 3. Data for GTD vs Macro Distribution
  const gtdDistributionData = useMemo(() => {
    const macroCount = completedTasks.filter(
      (t) => t.tipoTempo !== '2 Minutos (Fazer na Transição)'
    ).length;
    const twoMinCount = completedTasks.filter(
      (t) => t.tipoTempo === '2 Minutos (Fazer na Transição)'
    ).length;

    const total = completedTasks.length || 1;

    return [
      {
        name: 'Macro-Tarefas (Padrão)',
        value: macroCount,
        percentage: Math.round((macroCount / total) * 100),
        color: '#059669',
      },
      {
        name: 'Micro-Ações 2 Minutos (GTD)',
        value: twoMinCount,
        percentage: Math.round((twoMinCount / total) * 100),
        color: '#f59e0b',
      },
    ];
  }, [completedTasks]);

  // 4. Data for Daily Completion Trend
  const dailyTrendData = useMemo(() => {
    const dayMap: Record<string, { data: string; concluidas: number; micro: number }> = {};

    // Group last 7 distinct days or sorted dates
    completedTasks.forEach((task) => {
      const dateStr = task.dataProgramada;
      const displayDay = dateStr.slice(5); // MM-DD
      if (!dayMap[displayDay]) {
        dayMap[displayDay] = { data: displayDay, concluidas: 0, micro: 0 };
      }
      dayMap[displayDay].concluidas += 1;
      if (task.tipoTempo === '2 Minutos (Fazer na Transição)') {
        dayMap[displayDay].micro += 1;
      }
    });

    return Object.values(dayMap).sort((a, b) => a.data.localeCompare(b.data));
  }, [completedTasks]);

  // KPI calculations
  const totalTasksCount = completedTasks.length;

  const storeAvgMacroMinutes = useMemo(() => {
    const macroTasks = completedTasks.filter((t) => t.tipoTempo !== '2 Minutos (Fazer na Transição)');
    if (macroTasks.length === 0) return 0;
    const sum = macroTasks.reduce((acc, t) => acc + getTaskDurationMinutes(t), 0);
    return Math.round(sum / macroTasks.length);
  }, [completedTasks]);

  const storeAvgTwoMin = useMemo(() => {
    const twoMin = completedTasks.filter((t) => t.tipoTempo === '2 Minutos (Fazer na Transição)');
    if (twoMin.length === 0) return 0;
    const sum = twoMin.reduce((acc, t) => acc + getTaskDurationMinutes(t), 0);
    return Number((sum / twoMin.length).toFixed(1));
  }, [completedTasks]);

  const gtdAdherenceRate = useMemo(() => {
    if (totalTasksCount === 0) return 0;
    const twoMin = completedTasks.filter((t) => t.tipoTempo === '2 Minutos (Fazer na Transição)').length;
    return Math.round((twoMin / totalTasksCount) * 100);
  }, [completedTasks, totalTasksCount]);

  const topPerformer = useMemo(() => {
    if (userCompletionData.length === 0) return null;
    return [...userCompletionData].sort((a, b) => b.totalConcluidas - a.totalConcluidas)[0];
  }, [userCompletionData]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl text-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <BarChart3 className="w-4 h-4" />
              Painel de Desempenho Operacional &amp; Métricas
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1 tracking-tight text-white">
              Estatísticas de Produtividade &amp; Tempos
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
              Análise comparativa do tempo médio de execução por colaborador e distribuição de atividades por setor no mês.
            </p>
          </div>

          {/* Period Selector Controls */}
          <div className="flex items-center gap-2 bg-emerald-950/60 p-1.5 rounded-xl border border-emerald-700/50 text-xs self-start md:self-auto">
            <button
              onClick={() => setPeriod('mes_atual')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                period === 'mes_atual'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              Mês Atual
            </button>
            <button
              onClick={() => setPeriod('30_dias')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                period === '30_dias'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              Últimos 30 dias
            </button>
            <button
              onClick={() => setPeriod('tudo')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                period === 'tudo'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              Histórico Total
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tempo Médio Geral */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Tempo Médio (Macro-Tarefas)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-900">{storeAvgMacroMinutes}</span>
              <span className="text-sm font-bold text-slate-600">minutos</span>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
              <span>⚡ Média Micro-ações: <strong>{storeAvgTwoMin} min</strong></span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Total Concluído */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Tarefas Realizadas</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-900">{totalTasksCount}</span>
              <span className="text-xs font-medium text-slate-500">entregas</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              No período selecionado
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Aderência GTD */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Aderência à Regra 2 Min</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-amber-600">{gtdAdherenceRate}%</span>
              <span className="text-xs font-medium text-slate-500">do volume</span>
            </div>
            <p className="text-[11px] text-amber-800 font-medium mt-1">
              Transições rápidas executadas
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Colaborador Mais Ativo */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Colaborador em Destaque</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-slate-900 truncate max-w-[150px]">
                {topPerformer?.nomeCompleto || 'Equipe'}
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              {topPerformer?.totalConcluidas || 0} atividades baixadas
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Tempo Médio de Conclusão por Colaborador */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Tempo Médio por Colaborador (Minutos)</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Recharts BarChart
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Comparação do tempo médio dedicado às Atividades Padrão vs Micro-Ações de 2 Minutos.
            </p>
          </div>

          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userCompletionData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="nome"
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  unit="m"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700">
                          <p className="font-bold text-sm text-emerald-400">{data.nomeCompleto}</p>
                          <p className="text-slate-400 text-[11px]">Setor: {data.setor}</p>
                          <div className="pt-1 border-t border-slate-800 space-y-1">
                            <p className="flex justify-between gap-4">
                              <span>Média Macro-Tarefas:</span>
                              <strong className="text-emerald-300">{data.mediaMacroMin} min</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span>Média Micro 2-Min:</span>
                              <strong className="text-amber-400">{data.mediaTwoMin} min</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span>Total de Baixas:</span>
                              <strong className="text-white">{data.totalConcluidas}</strong>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                  formatter={(value) => (
                    <span className="text-slate-700 font-medium">
                      {value === 'mediaMacroMin' ? 'Atividades Padrão (min)' : 'Micro-Ações 2 Min (min)'}
                    </span>
                  )}
                />
                <Bar
                  dataKey="mediaMacroMin"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                  name="mediaMacroMin"
                />
                <Bar
                  dataKey="mediaTwoMin"
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                  name="mediaTwoMin"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Valores menores indicam maior velocidade na execução.</span>
            <span className="font-semibold text-emerald-700">Meta: Macro &lt; 45m | Micro &lt; 3m</span>
          </div>
        </div>

        {/* CHART 2: Distribuição de Tipos de Atividades Realizadas no Mês */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-600" />
                <span>Distribuição de Atividades no Mês</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Recharts PieChart
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Proporção de tarefas concluídas por categoria/setor operacional da loja.
            </p>
          </div>

          {categoryDistributionData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-slate-400 text-xs">
              Nenhuma atividade concluída no período para exibição.
            </div>
          ) : (
            <div className="h-72 w-full flex flex-col sm:flex-row items-center justify-center">
              <div className="h-full w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs border border-slate-700">
                              <p className="font-bold text-emerald-400">{data.name}</p>
                              <p className="text-slate-300 mt-0.5">
                                {data.value} tarefa(s) ({data.percentage}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Legend with Percentage Pills */}
              <div className="w-full sm:w-1/2 space-y-1.5 pl-2">
                {categoryDistributionData.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-slate-700 truncate font-medium">{cat.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">
                      {cat.value} ({cat.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Categorias mais demandadas da rotina</span>
            <span className="font-semibold text-slate-700">Total: {totalTasksCount} concluídas</span>
          </div>
        </div>
      </div>

      {/* Secondary Row: GTD Distribution & Daily Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GTD vs Macro Proportions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Perfil de Tempo (GTD vs Macro)</span>
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Divisão entre tarefas de foco contínuo e micro-ações rápidas.
          </p>

          <div className="space-y-3 pt-2">
            {gtdDistributionData.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-800">
                  <span>{item.name}</span>
                  <span>{item.value} ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
            <p className="font-bold flex items-center gap-1 text-amber-950 mb-0.5">
              <span>💡 Dica GTD de Chão de Loja:</span>
            </p>
            Uma proporção saudável de micro-ações (20% a 35%) indica que a equipe está mantendo bancas limpas e organizadas sem acumular gargalos.
          </div>
        </div>

        {/* Daily Completion Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Volume de Baixas Concluídas por Data</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Evolução no Mês
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2">
              Ritmo de entrega diária da equipe de frente de loja e produção.
            </p>
          </div>

          <div className="h-48 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConcluidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="data" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs border border-slate-700">
                          <p className="font-bold text-emerald-400">Data: {data.data}</p>
                          <p className="text-slate-300 mt-1">Total: {data.concluidas} tarefas concluídas</p>
                          <p className="text-amber-400">Micro-ações GTD: {data.micro}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="concluidas"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorConcluidas)"
                  name="Tarefas Concluídas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 text-right text-xs text-slate-500">
            <span>Fluxo regular de abastecimento matutino e diurno</span>
          </div>
        </div>
      </div>

      {/* Detailed Team Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Desempenho e Tempos Médios por Colaborador
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Atualizado com base nas baixas registradas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Colaborador</th>
                <th className="p-3.5">Setor de Atuação</th>
                <th className="p-3.5 text-center">Total Concluídas</th>
                <th className="p-3.5 text-center">Tempo Médio (Macro)</th>
                <th className="p-3.5 text-center">Tempo Médio (2 Min)</th>
                <th className="p-3.5 text-center">Tempo Médio Geral</th>
                <th className="p-3.5 text-right">Eficiência Operacional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {userCompletionData.map((u) => {
                const userObj = usersMap.get(u.id);
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          userObj?.avatarCor || 'bg-slate-200'
                        }`}
                      >
                        {u.nomeCompleto.charAt(0)}
                      </div>
                      <div>
                        <div>{u.nomeCompleto}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {userObj?.perfil}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600">{u.setor}</td>
                    <td className="p-3.5 text-center font-bold text-slate-900">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-full text-xs">
                        {u.totalConcluidas}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-semibold text-emerald-800">
                      {u.mediaMacroMin > 0 ? `${u.mediaMacroMin} min` : '-'}
                    </td>
                    <td className="p-3.5 text-center font-semibold text-amber-700">
                      {u.mediaTwoMin > 0 ? `${u.mediaTwoMin} min` : '-'}
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-900">
                      {u.mediaGeralMin > 0 ? `${u.mediaGeralMin} min` : '-'}
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {u.totalConcluidas >= 4 ? 'Alto Rendimento' : 'Dentro do Prazo'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
