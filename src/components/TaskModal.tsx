import React, { useState, useEffect } from 'react';
import { X, Calendar, User as UserIcon, Tag, Zap, AlertTriangle, Layers, FileText, Sparkles } from 'lucide-react';
import { Task, User, Prioridade, TipoTempo, CategoriaTarefa, StatusTarefa } from '../types';
import { getTodayDateString } from '../services/storage';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  taskToEdit?: Task | null;
  users: User[];
  currentUser: User;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  users,
  currentUser,
}) => {
  const isAdmin = currentUser.perfil === 'Administrador';

  const [titulo, setTitulo] = useState('');
  const [instrucoes, setInstrucoes] = useState('');
  const [dataProgramada, setDataProgramada] = useState(getTodayDateString());
  const [tipoTempo, setTipoTempo] = useState<TipoTempo>('Tarefa Padrão');
  const [prioridade, setPrioridade] = useState<Prioridade>('2-Alta');
  const [categoria, setCategoria] = useState<CategoriaTarefa>('Reposição de Banca');
  const [responsavelId, setResponsavelId] = useState(users[0]?.id || '');
  const [status, setStatus] = useState<StatusTarefa>('Pendente');
  const [incluirNaImpressao, setIncluirNaImpressao] = useState(true);
  const [observacaoOperacional, setObservacaoOperacional] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitulo(taskToEdit.tituloAtividade);
      setInstrucoes(taskToEdit.instrucoesDetalhadas || '');
      setDataProgramada(taskToEdit.dataProgramada);
      setTipoTempo(taskToEdit.tipoTempo);
      setPrioridade(taskToEdit.prioridade);
      setCategoria(taskToEdit.categoria);
      setResponsavelId(taskToEdit.responsavelId);
      setStatus(taskToEdit.status);
      setIncluirNaImpressao(taskToEdit.incluirNaImpressao);
      setObservacaoOperacional(taskToEdit.observacaoOperacional || '');
    } else {
      setTitulo('');
      setInstrucoes('');
      setDataProgramada(getTodayDateString());
      setTipoTempo('Tarefa Padrão');
      setPrioridade('2-Alta');
      setCategoria('Reposição de Banca');
      setResponsavelId(users[0]?.id || '');
      setStatus('Pendente');
      setIncluirNaImpressao(true);
      setObservacaoOperacional('');
    }
  }, [taskToEdit, isOpen, users]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    onSave({
      id: taskToEdit ? taskToEdit.id : `tsk-${Date.now().toString(36)}`,
      tituloAtividade: titulo.trim(),
      instrucoesDetalhadas: instrucoes.trim(),
      dataProgramada,
      tipoTempo,
      prioridade,
      categoria,
      responsavelId,
      status,
      incluirNaImpressao,
      observacaoOperacional: observacaoOperacional.trim() || undefined,
      criadoEm: taskToEdit ? taskToEdit.criadoEm : new Date().toISOString(),
      ...(status === 'Concluída' && !taskToEdit?.dataHoraConclusao
        ? {
            dataHoraConclusao: new Date().toISOString(),
            concluidoPorId: currentUser.id,
            concluidoPorNome: currentUser.nome,
          }
        : {}),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {taskToEdit ? 'Editar Atividade' : 'Nova Atividade Operacional'}
            </h2>
            <p className="text-xs text-slate-500">
              {isAdmin
                ? 'Lançamento com Matriz de Priorização e classificação GTD'
                : 'Visualização de detalhes da atividade'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-sm">
          {/* Metodologia SMART Banner */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950">
            <div className="font-bold flex items-center gap-1.5 text-emerald-900 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Metodologia SMART para Atividades:</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Defina ações <strong>Específicas, Mensuráveis, Atingíveis, Relevantes e Temporais</strong>. Exemplo: em vez de <em>"Arrumar banca"</em>, use <em>"Montar 30 bandejas de abacaxi temperado até as 10h"</em>.
            </p>
          </div>

          {/* Titulo */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Título da Atividade (Padrão SMART) *
              </label>
              {isAdmin && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTitulo('Montar 30 bandejas de abacaxi temperado até as 10h')}
                    className="text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold underline cursor-pointer"
                  >
                    Exemplo SMART
                  </button>
                </div>
              )}
            </div>
            <input
              type="text"
              required
              disabled={!isAdmin && !!taskToEdit}
              placeholder="Ex: Montar 30 bandejas de abacaxi temperado até as 10h"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-600"
            />
          </div>

          {/* Grid: Tipo de Tempo (GTD) and Prioridade (Eisenhower) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Tempo GTD */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Tempo / Formato (GTD)
              </label>
              <select
                disabled={!isAdmin && !!taskToEdit}
                value={tipoTempo}
                onChange={(e) => setTipoTempo(e.target.value as TipoTempo)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 text-sm"
              >
                <option value="Tarefa Padrão">Tarefa Padrão (Foco contínuo)</option>
                <option value="2 Minutos (Fazer na Transição)">⚡ 2 Minutos (Micro-Ação Rápida)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                {tipoTempo === '2 Minutos (Fazer na Transição)'
                  ? 'Entra na fila rápida de transição para evitar acúmulo no chão de loja.'
                  : 'Rotina principal com tempo dedicado.'}
              </p>
            </div>

            {/* Prioridade */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                Prioridade (Eisenhower)
              </label>
              <select
                disabled={!isAdmin && !!taskToEdit}
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as Prioridade)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 text-sm font-medium"
              >
                <option value="1-Crítica">🔴 1 - Crítica (Imediato / Ruptura)</option>
                <option value="2-Alta">🟠 2 - Alta (No Turno Atual)</option>
                <option value="3-Média">🟡 3 - Média (Planejado do Dia)</option>
                <option value="4-Baixa">🟢 4 - Baixa (Quando Houver Janela)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Define a ordem prioritária na tela do chão de loja e na prancheta.
              </p>
            </div>
          </div>

          {/* Grid: Categoria, Responsavel, Data */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Categoria */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                Setor / Categoria
              </label>
              <select
                disabled={!isAdmin && !!taskToEdit}
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaTarefa)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 text-sm"
              >
                <option value="Reposição de Banca">Reposição de Banca</option>
                <option value="Produção / Grab & Go">Produção / Grab & Go</option>
                <option value="Qualidade / Validade">Qualidade / Validade</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Estoque">Estoque</option>
                <option value="Administrativo">Administrativo</option>
              </select>
            </div>

            {/* Responsável */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                Responsável
              </label>
              <select
                disabled={!isAdmin && !!taskToEdit}
                value={responsavelId}
                onChange={(e) => setResponsavelId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 text-sm"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} ({(u.setoresAtuacao || u.setorPadrao || 'Loja').split(',')[0].trim()})
                  </option>
                ))}
              </select>
            </div>

            {/* Data Programada */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Data
              </label>
              <input
                type="date"
                required
                disabled={!isAdmin && !!taskToEdit}
                value={dataProgramada}
                onChange={(e) => setDataProgramada(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 text-sm"
              >
              </input>
            </div>
          </div>

          {/* Instruções Detalhadas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Instruções Passo a Passo para o Colaborador
            </label>
            <textarea
              rows={3}
              disabled={!isAdmin && !!taskToEdit}
              placeholder="Ex: Verificar temperatura no termômetro, descartar legumes machucados, etiquetar com peso e preço promocional..."
              value={instrucoes}
              onChange={(e) => setInstrucoes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm disabled:bg-slate-50"
            />
          </div>

          {/* Status & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status Atual
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusTarefa)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="Pendente">Pendente</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluída">Concluída</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin && !!taskToEdit}
                  checked={incluirNaImpressao}
                  onChange={(e) => setIncluirNaImpressao(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-slate-700">
                  Espelhar na Folha Impressa (Prancheta Física)
                </span>
              </label>
            </div>
          </div>

          {/* Observação Operacional (se editando ou visualizando) */}
          {taskToEdit && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Observações de Execução (Equipe de Loja)
              </label>
              <input
                type="text"
                placeholder="Ex: Reposição realizada com 12 caixas, faltaram 2 no pallet"
                value={observacaoOperacional}
                onChange={(e) => setObservacaoOperacional(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-medium rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-700/20 transition-colors cursor-pointer"
            >
              {taskToEdit ? 'Salvar Alterações' : 'Criar Atividade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
