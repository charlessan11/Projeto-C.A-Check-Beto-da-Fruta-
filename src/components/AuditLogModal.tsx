import React, { useState, useMemo } from 'react';
import { History, CheckCircle2, Search, Filter, Calendar, User as UserIcon, MessageSquare } from 'lucide-react';
import { Task, User } from '../types';

interface AuditLogViewProps {
  tasks: Task[];
  users: User[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ tasks, users }) => {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('todos');

  const completedTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status === 'Concluída' || !!t.dataHoraConclusao)
      .sort((a, b) => {
        const timeA = a.dataHoraConclusao ? new Date(a.dataHoraConclusao).getTime() : 0;
        const timeB = b.dataHoraConclusao ? new Date(b.dataHoraConclusao).getTime() : 0;
        return timeB - timeA;
      });
  }, [tasks]);

  const filtered = useMemo(() => {
    return completedTasks.filter((t) => {
      if (selectedUser !== 'todos' && t.concluidoPorId !== selectedUser && t.responsavelId !== selectedUser) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = t.tituloAtividade.toLowerCase().includes(q);
        const matchesObs = t.observacaoOperacional?.toLowerCase().includes(q);
        const matchesName = t.concluidoPorNome?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesObs && !matchesName) return false;
      }
      return true;
    });
  }, [completedTasks, selectedUser, search]);

  const formatDate = (iso?: string) => {
    if (!iso) return 'Conclusão registrada';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Auditoria Operacional &amp; Registro de Baixas</h2>
            <p className="text-xs text-slate-400">
              Rastreamento em tempo real de quem executou cada tarefa, timestamp exato e notas operacionais de execução.
            </p>
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por atividade, executor ou observação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Filtrar por Usuário:</span>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
          >
            <option value="todos">Todos os Colaboradores</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
          <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium">Nenhum registro de conclusão encontrado com os filtros atuais.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-xs">
          {filtered.map((item) => (
            <div key={item.id} className="p-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Baixa Efetuada
                    </span>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {item.categoria}
                    </span>
                    <span className="text-xs text-slate-400">
                      {item.tipoTempo}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{item.tituloAtividade}</h4>

                  {item.observacaoOperacional ? (
                    <div className="text-xs text-amber-900 bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-200 flex items-start gap-1.5 mt-1">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Observação deixada pelo executor:</strong> {item.observacaoOperacional}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Sem observações adicionais.</p>
                  )}
                </div>

                <div className="text-left sm:text-right text-xs shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="font-bold text-slate-900 flex items-center sm:justify-end gap-1">
                    <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>{item.concluidoPorNome || 'Usuário do Sistema'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center sm:justify-end gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{formatDate(item.dataHoraConclusao)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
