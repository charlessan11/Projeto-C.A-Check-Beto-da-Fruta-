import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Printer,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  ShoppingBag,
  Clock,
  Zap,
  Users,
  Search,
  Check,
  Download,
  Award,
  ChevronRight,
  Truck,
  Sparkles,
} from 'lucide-react';
import { StoreSettings } from '../types';

interface SystemManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
}

export const SystemManualModal: React.FC<SystemManualModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<'visao_geral' | 'rotinas' | 'compras' | 'gtd' | 'auditoria' | 'ganhos'>('visao_geral');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Header (No Print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-t-3xl no-print">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center shadow-md shadow-emerald-700/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Manual do Sistema &amp; Guia de Implantação
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
                  {settings.nomeLoja}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Documentação oficial de todas as funcionalidades e impactos operacionais no negócio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Manual</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector (No Print) */}
        <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs no-print">
          <button
            onClick={() => setActiveTab('visao_geral')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'visao_geral'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            1. Visão Geral &amp; Estrutura
          </button>
          <button
            onClick={() => setActiveTab('rotinas')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rotinas'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            2. 7 Rotinas Diárias
          </button>
          <button
            onClick={() => setActiveTab('compras')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'compras'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            3. Compras, Conferência &amp; Reposição
          </button>
          <button
            onClick={() => setActiveTab('gtd')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'gtd'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            4. GTD (2 Minutos) &amp; Pomodoro
          </button>
          <button
            onClick={() => setActiveTab('auditoria')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'auditoria'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            5. Auditoria &amp; Estatísticas PDF
          </button>
          <button
            onClick={() => setActiveTab('ganhos')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ganhos'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            6. Benefícios &amp; ROI da Empresa
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-slate-800 space-y-6 text-sm leading-relaxed print:p-2 print:overflow-visible">
          {/* Header of the Document (Visible in print) */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mb-1">
                  Documentação Técnica e Operacional
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {settings.nomeLoja.toUpperCase()} — SISTEMA INTEGRADO DE GESTÃO
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Manual de Operação, Responsabilidades por Colaborador e Impacto no Negócio
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>Encarregado: <strong className="text-slate-800">{settings.gerenteResponsavel}</strong></p>
                <p>Proprietário: <strong className="text-slate-800">{settings.proprietario}</strong></p>
                <p>Versão: 3.4 (PWA Híbrido)</p>
              </div>
            </div>
          </div>

          {/* TAB 1: VISÃO GERAL */}
          {(activeTab === 'visao_geral' || true) && (
            <section className={activeTab === 'visao_geral' ? 'block' : 'hidden print:block'}>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                <Users className="w-5 h-5 text-emerald-600" />
                1. Visão Geral do Sistema e Perfis de Acesso
              </h3>
              <p className="text-slate-700 text-xs sm:text-sm">
                O software foi arquitetado sob medida para a operação diária do <strong>Hortifrúti Beto da Fruta</strong>. Ele elimina a dependência de papéis soltos e grupos de WhatsApp desorganizados, transformando o fluxo da loja em um processo digital, auditável e com prestação de contas em tempo real.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs">
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Perfis Administrativos (PIN de 4 Dígitos):
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                    <li><strong>Charles (Gerente Geral)</strong>: supervisão total, lista de compras, aprovação de rotinas e métricas.</li>
                    <li><strong>Amanda (Administradora)</strong>: fechamento de compras, auditoria, precificação e relatórios.</li>
                    <li><strong>Beto (Proprietário)</strong>: acompanhamento executivo de metas, histórico e produtividade.</li>
                  </ul>
                  <p className="mt-2 text-[10px] text-emerald-800 italic">
                    * Módulos de Auditoria, Estatísticas e Exportação de PDF são restritos com senha individual.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs mb-1">
                    <Users className="w-4 h-4 text-slate-700" />
                    Perfis Operacionais (Foco em Execução Ágil):
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                    <li><strong>Lucas &amp; Rafael</strong>: reposição de bancas, descarga da Kombi, água de coco e conferência de compras.</li>
                    <li><strong>Bianca</strong>: atendimento de balcão e higienização do salão.</li>
                    <li><strong>Adriana</strong>: produção Grab &amp; Go (bandejas de frutas processadas e cortes).</li>
                    <li><strong>Vanessa</strong>: verificação dos freezers, polpas congeladas e controle de temperatura.</li>
                    <li><strong>Rita</strong>: higienização geral e sanitização de áreas críticas.</li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: ROTINAS DIÁRIAS */}
          {(activeTab === 'rotinas' || true) && (
            <section className={`pt-4 ${activeTab === 'rotinas' ? 'block' : 'hidden print:block'}`}>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                2. As 7 Rotinas Diárias Estruturadas
              </h3>
              <p className="text-xs text-slate-600 mb-3">
                Garante que nenhuma atividade essencial de abertura, manutenção e fechamento seja esquecida.
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 font-bold">1. Contagem Matinal &amp; Reposição Hortifrúti por Expositores:</strong>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Charles / Equipe</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Divisão das bancas entre Titular e Auxiliar (Gôndolas, Folhagens, Tubérculos, Frutas Tropicais). Administradores podem adicionar e excluir setores conforme sazonalidade.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 font-bold">2. Atendimento ao Balcão (Sorteio + Escolha Manual):</strong>
                    <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">Bianca / Sorteado</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    O sistema realiza um sorteio justo diário entre os colaboradores para atendimento no balcão e apoio à reposição. Administradores podem escolher manualmente quem assume o turno.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 font-bold">3. Limpeza Sanitária de 7 Áreas Fixas:</strong>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">Rita &amp; Bianca</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Checklist higiênico completo (Salão, Área de Corte, Sanitários, Depósito, Entrada). Admins podem incluir novas áreas de limpeza.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 font-bold">4. Verificação dos Freezers — Atividades:</strong>
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded">Vanessa</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Gerenciamento focado em atividades de verificação: aferição de temperatura digital (-18°C), conferência de datas de validade das polpas de frutas, organização PEPS e vedação das borrachas/degelo.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 font-bold">5. Conferência e Descarga da Kombi:</strong>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">Lucas ou Rafael</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Alternância automática dia sim, dia não entre Lucas e Rafael para descarregar o veículo de compras e conferir notas fiscais.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 font-bold">6. Produção de Água de Coco na Garrafa:</strong>
                    <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded">Exclusivo: 1 Funcionário</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Feito exclusivamente por 1 funcionário (ou Lucas ou Rafael, nunca os dois). Acompanha meta de litragem (28-35L dias normais, 50-75L sexta), equilíbrio de litros acumulados e 3 subetapas obrigatórias: envase em garrafas, corte/retirada de polpa e descarte de lixo das cascas.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 font-bold">7. Lista de Compras Diária:</strong>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Charles &amp; Amanda</span>
                  </div>
                  <p className="text-slate-600 mt-1">
                    Fechamento de faltas no salão e encaminhamento para cotação e compras.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* TAB 3: COMPRAS & REPOSIÇÃO */}
          {(activeTab === 'compras' || true) && (
            <section className={`pt-4 ${activeTab === 'compras' ? 'block' : 'hidden print:block'}`}>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                3. Setor de Compras, Conferência &amp; Reposição (Fluxo Integrado)
              </h3>
              <p className="text-xs text-slate-600 mb-3">
                O coração financeiro e de suprimentos do hortifrúti. Elimina furos de estoque, perdas no recebimento e bancas vazias.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] font-black uppercase text-emerald-800 block mb-1">
                    Fase 1: Pedido &amp; Cotação
                  </span>
                  <h4 className="font-bold text-slate-900 mb-1">Charles ou Amanda</h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Lançamento de Produto, Quantidade com unidade (cx, kg, un, sacos, fardos) e Fornecedor/Box.
                  </p>
                  <div className="mt-2 pt-2 border-t border-emerald-200 flex flex-col gap-1 text-[11px]">
                    <span className="text-emerald-900 font-semibold">• Envio por WhatsApp formatado</span>
                    <span className="text-emerald-900 font-semibold">• Impressão de Ordem de Compra A4</span>
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
                  <span className="text-[10px] font-black uppercase text-amber-800 block mb-1">
                    Fase 2: Conferência de Chegada
                  </span>
                  <h4 className="font-bold text-slate-900 mb-1">Lucas ou Rafael</h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Tabela comparativa em tempo real: <em>O que foi pedido</em> vs <em>O que chegou na loja</em>.
                  </p>
                  <div className="mt-2 pt-2 border-t border-amber-200 flex flex-col gap-1 text-[11px]">
                    <span className="text-amber-900 font-semibold">• Botão "Chegou Tudo Conforme Pedido"</span>
                    <span className="text-amber-900 font-semibold">• Registro de faltas e avarias</span>
                    <span className="text-amber-900 font-semibold">• Selo com visto e horário do conferente</span>
                  </div>
                </div>

                <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200">
                  <span className="text-[10px] font-black uppercase text-rose-800 block mb-1">
                    Fase 3: Estoque &amp; Reposição
                  </span>
                  <h4 className="font-bold text-slate-900 mb-1">Equipe de Chão de Loja</h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Acompanhamento visual do estoque recebido e dos produtos pendentes para ir à banca.
                  </p>
                  <div className="mt-2 pt-2 border-t border-rose-200 flex flex-col gap-1 text-[11px]">
                    <span className="text-rose-900 font-bold">• Alerta: "O Que Falta Repôr na Banca"</span>
                    <span className="text-rose-900 font-semibold">• Checkbox 1 clique: "Reposto na Banca"</span>
                    <span className="text-rose-900 font-semibold">• Registro de sobras na câmara fria</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 4: GTD & POMODORO */}
          {(activeTab === 'gtd' || true) && (
            <section className={`pt-4 ${activeTab === 'gtd' ? 'block' : 'hidden print:block'}`}>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                <Zap className="w-5 h-5 text-amber-500" />
                4. Metodologia de Produtividade: SMART, Regra dos 2 Minutos (GTD) &amp; Pomodoro
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-xs">Regra dos 2 Minutos (Getting Things Done):</h4>
                  <p className="text-slate-600 mt-1">
                    Tarefas rápidas (trocar etiqueta desatualizada, borrifar água nas folhagens, recolher caixa vazia no corredor) são catalogadas como <strong>"2 Minutos"</strong>. Ao concluir qualquer tarefa principal, o app abre um alerta sugerindo a execução imediata das microações pendentes, impedindo a procrastinação de detalhes críticos.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-xs">Temporizador Pomodoro Integrado:</h4>
                  <p className="text-slate-600 mt-1">
                    Disponível no quadro de tarefas para operações de foco contínuo (ex: produção de 30 bandejas de abacaxi processado, contagem geral de estoque). Conta ciclos de 25 minutos com alarmes sonoros e registro de tempo investido.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* TAB 5: AUDITORIA & ESTATÍSTICAS */}
          {(activeTab === 'auditoria' || true) && (
            <section className={`pt-4 ${activeTab === 'auditoria' ? 'block' : 'hidden print:block'}`}>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                5. Auditoria Administrativa &amp; Relatório Executivo em PDF
              </h3>
              <p className="text-xs text-slate-600 mb-3">
                Transparência total para Charles, Amanda e Beto analisarem o desempenho da loja.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="font-bold text-slate-900 mb-1">Módulo de Auditoria &amp; Baixas:</h4>
                  <p className="text-slate-600 text-[11px]">
                    Armazena o registro imutável de quem concluiu cada tarefa, horário exato, fotos ou justificativas operacionais. Evita a desculpa de "eu não sabia que era minha vez".
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="font-bold text-slate-900 mb-1">Exportação de Relatório PDF (jspdf):</h4>
                  <p className="text-slate-600 text-[11px]">
                    Na aba de Estatísticas, gera um relatório executivo impresso em alta definição, com taxa de conclusão geral, ranking de funcionários, aderência aos 2 minutos e tempo médio por tarefa.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* TAB 6: GANHOS & ROI */}
          {(activeTab === 'ganhos' || true) && (
            <section className={`pt-4 ${activeTab === 'ganhos' ? 'block' : 'hidden print:block'}`}>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                <Award className="w-5 h-5 text-emerald-600" />
                6. Como Este Sistema Ajuda a Empresa Beto da Fruta na Prática?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                  <strong className="text-emerald-950 font-bold block mb-1">1. Redução de Perdas e Desperdício no Ceasa:</strong>
                  <p className="text-emerald-900 text-[11px]">
                    A conferência detalhada impede pagar por caixas que não foram entregues ou aceitar frutos avariados sem registro imediato.
                  </p>
                </div>
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                  <strong className="text-emerald-950 font-bold block mb-1">2. Bancas Sempre Abastecidas e Atraentes:</strong>
                  <p className="text-emerald-900 text-[11px]">
                    O filtro "O Que Falta Repor na Banca" impede que mercadorias fiquem paradas no depósito enquanto o cliente encontra a gôndola vazia.
                  </p>
                </div>
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                  <strong className="text-emerald-950 font-bold block mb-1">3. Clima Organizacional Justo e Equilibrado:</strong>
                  <p className="text-emerald-900 text-[11px]">
                    O sorteio diário do balcão e o balanço de água de coco (Lucas vs Rafael) eliminam atritos e sobrecarga sobre os mesmos funcionários.
                  </p>
                </div>
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                  <strong className="text-emerald-950 font-bold block mb-1">4. Praticidade no Chão de Loja (PWA &amp; Prancheta):</strong>
                  <p className="text-emerald-900 text-[11px]">
                    Funciona como app instalado em janela no Chrome do celular, sem travar, e permite imprimir a folha diária para quem trabalha com mãos úmidas.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
