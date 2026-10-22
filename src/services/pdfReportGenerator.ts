import { jsPDF } from 'jspdf';
import { User, Task, DailyRoutine } from '../types';

export interface ReportKPIs {
  storeAvgMacro: number;
  storeAvgTwoMin: number;
  totalTasksCount: number;
  completedTasksCount: number;
  completionRate: number;
  gtdAdherenceRate: number;
  topPerformerName: string;
}

export interface EmployeeReportStat {
  id: string;
  nomeCompleto: string;
  setor: string;
  totalConcluidas: number;
  macroConcluidas: number;
  twoMinConcluidas: number;
  mediaGeralMin: number;
  metaAtingida: boolean;
  pctMeta: number;
}

export interface CategoryReportStat {
  name: string;
  value: number;
  percentage: number;
}

export interface PDFReportOptions {
  periodLabel: string;
  generatedBy: string;
  storeName?: string;
  gerenteResponsavel?: string;
  kpis: ReportKPIs;
  employeeStats: EmployeeReportStat[];
  categoryStats: CategoryReportStat[];
  routine?: DailyRoutine | null;
}

export function generatePerformanceReportPDF(options: PDFReportOptions): void {
  const {
    periodLabel,
    generatedBy,
    storeName = 'Hortifrúti Beto da Fruta',
    gerenteResponsavel = 'Beto / Charles',
    kpis,
    employeeStats,
    categoryStats,
    routine,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm
  let currentY = 14;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Helper for page check
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 15) {
      doc.addPage();
      currentY = 16;
      // Repeat small header watermark on extra pages
      doc.setFillColor(5, 150, 105);
      doc.rect(marginX, currentY - 6, contentWidth, 1.5, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`${storeName} • Relatório de Desempenho Operacional (Continuação)`, marginX, currentY - 1);
      doc.text(`Página ${doc.getNumberOfPages()}`, pageWidth - marginX, currentY - 1, { align: 'right' });
      currentY += 4;
    }
  };

  // ================= 1. HEADER BANNER =================
  doc.setFillColor(6, 78, 59); // Emerald 900
  doc.roundedRect(marginX, currentY, contentWidth, 24, 2, 2, 'F');

  // Accent stripe
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(marginX, currentY, 3, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(storeName.toUpperCase(), marginX + 6, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(209, 250, 229); // Emerald 100
  doc.text('Relatório Executivo de Produtividade, Atividades & Metas Operacionais', marginX + 6, currentY + 13);

  doc.setFontSize(8);
  doc.setTextColor(167, 243, 208); // Emerald 200
  doc.text(`Período de Análise: ${periodLabel} | Emissão: ${dateFormatted} às ${timeFormatted}`, marginX + 6, currentY + 19);

  // Stamp in top right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('AUDITORIA ADMINISTRATIVA', pageWidth - marginX - 6, currentY + 8, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(209, 250, 229);
  doc.text(`Emitido por: ${generatedBy}`, pageWidth - marginX - 6, currentY + 13, { align: 'right' });
  doc.text(`Gestor: ${gerenteResponsavel}`, pageWidth - marginX - 6, currentY + 18, { align: 'right' });

  currentY += 28;

  // ================= 2. EXECUTIVE SUMMARY (KPIs) =================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('1. RESUMO EXECUTIVO & INDICADORES GERAIS (KPIS)', marginX, currentY);
  currentY += 4;

  const kpiBoxWidth = (contentWidth - 6) / 4;
  const kpiBoxHeight = 16;

  // Box 1: Conclusão Geral
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(marginX, currentY, kpiBoxWidth, kpiBoxHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TAREFAS CONCLUÍDAS', marginX + 3, currentY + 5);
  doc.setFontSize(12);
  doc.setTextColor(5, 150, 105);
  doc.text(`${kpis.completedTasksCount}`, marginX + 3, currentY + 11);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Taxa: ${kpis.completionRate}% do total`, marginX + 3, currentY + 14.5);

  // Box 2: Tempo Médio Macro
  const kpi2X = marginX + kpiBoxWidth + 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(kpi2X, currentY, kpiBoxWidth, kpiBoxHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TEMPO MÉDIO (MACRO)', kpi2X + 3, currentY + 5);
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`${kpis.storeAvgMacro} min`, kpi2X + 3, currentY + 11);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Micro 2m: ${kpis.storeAvgTwoMin} min`, kpi2X + 3, currentY + 14.5);

  // Box 3: Aderência GTD
  const kpi3X = marginX + (kpiBoxWidth + 2) * 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(kpi3X, currentY, kpiBoxWidth, kpiBoxHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('ADERÊNCIA REGRA 2 MIN', kpi3X + 3, currentY + 5);
  doc.setFontSize(12);
  doc.setTextColor(217, 119, 6); // Amber 600
  doc.text(`${kpis.gtdAdherenceRate}%`, kpi3X + 3, currentY + 11);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Transições imediatas', kpi3X + 3, currentY + 14.5);

  // Box 4: Colaborador Destaque
  const kpi4X = marginX + (kpiBoxWidth + 2) * 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(kpi4X, currentY, kpiBoxWidth, kpiBoxHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('DESTAQUE DO PERÍODO', kpi4X + 3, currentY + 5);
  doc.setFontSize(10);
  doc.setTextColor(2, 132, 199); // Sky 600
  doc.text(kpis.topPerformerName || 'Equipe', kpi4X + 3, currentY + 11);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Maior volume de entregas', kpi4X + 3, currentY + 14.5);

  currentY += kpiBoxHeight + 6;

  // ================= 3. EMPLOYEE PRODUCTIVITY TABLE =================
  checkPageBreak(50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. DESEMPENHO INDIVIDUAL & METAS ATINGIDAS PELOS FUNCIONÁRIOS', marginX, currentY);
  currentY += 4;

  // Table Column Coordinates
  // Width: 182mm
  // Col 1: Colaborador (45mm)
  // Col 2: Cargo / Setor (38mm)
  // Col 3: Concluídas (20mm)
  // Col 4: 2 Minutos (20mm)
  // Col 5: Tempo Médio (22mm)
  // Col 6: Meta Atingida (37mm)
  const colX = {
    colab: marginX + 2,
    cargo: marginX + 46,
    concl: marginX + 85,
    twoMin: marginX + 107,
    tempo: marginX + 128,
    meta: marginX + 150,
  };

  // Table Header
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(marginX, currentY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  doc.text('COLABORADOR', colX.colab, currentY + 4.8);
  doc.text('CARGO / SETOR', colX.cargo, currentY + 4.8);
  doc.text('CONCLUÍDAS', colX.concl, currentY + 4.8);
  doc.text('MICRO (2M)', colX.twoMin, currentY + 4.8);
  doc.text('MÉDIA (MIN)', colX.tempo, currentY + 4.8);
  doc.text('META ATINGIDA', colX.meta, currentY + 4.8);

  currentY += 7;

  // Table Rows
  employeeStats.forEach((emp, index) => {
    checkPageBreak(8);

    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 250, 252);
    }
    doc.rect(marginX, currentY, contentWidth, 6.5, 'F');

    // Horizontal separator
    doc.setDrawColor(241, 245, 249);
    doc.line(marginX, currentY + 6.5, marginX + contentWidth, currentY + 6.5);

    // Text cells
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(emp.nomeCompleto.length > 20 ? emp.nomeCompleto.slice(0, 20) + '...' : emp.nomeCompleto, colX.colab, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const cargoDisplay = emp.setor.length > 18 ? emp.setor.slice(0, 18) + '...' : emp.setor;
    doc.text(cargoDisplay, colX.cargo, currentY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(`${emp.totalConcluidas} ativ.`, colX.concl, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(217, 119, 6);
    doc.text(`${emp.twoMinConcluidas} un.`, colX.twoMin, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`${emp.mediaGeralMin} min`, colX.tempo, currentY + 4.5);

    // Goal achieved badge / text
    if (emp.metaAtingida) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105); // Green
      doc.text(`✓ Atingida (${emp.pctMeta}%)`, colX.meta, currentY + 4.5);
    } else if (emp.totalConcluidas > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(2, 132, 199); // Blue
      doc.text(`Em progresso (${emp.pctMeta}%)`, colX.meta, currentY + 4.5);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text('Pendente no ciclo', colX.meta, currentY + 4.5);
    }

    currentY += 6.5;
  });

  currentY += 4;

  // ================= 4. DISTRIBUTION BY CATEGORY & ROUTINES =================
  checkPageBreak(50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. DISTRIBUIÇÃO OPERACIONAL POR CATEGORIA & SETOR', marginX, currentY);
  currentY += 4;

  // 2-column layout: Left column = Categories, Right column = Daily Mandatory Routines
  const colHalfWidth = (contentWidth - 6) / 2;

  // Left Column Box: Categories
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, colHalfWidth, 38, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('VOLUME POR CATEGORIA DE ATIVIDADE', marginX + 4, currentY + 5.5);

  let catY = currentY + 10;
  categoryStats.slice(0, 5).forEach((cat) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const catName = cat.name.length > 22 ? cat.name.slice(0, 22) + '...' : cat.name;
    doc.text(catName, marginX + 4, catY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${cat.value} (${cat.percentage}%)`, marginX + colHalfWidth - 4, catY, { align: 'right' });

    // Mini bar
    doc.setFillColor(226, 232, 240);
    doc.rect(marginX + 4, catY + 1, colHalfWidth - 8, 1.2, 'F');
    doc.setFillColor(5, 150, 105);
    doc.rect(marginX + 4, catY + 1, Math.max(1, (colHalfWidth - 8) * (cat.percentage / 100)), 1.2, 'F');

    catY += 5.2;
  });

  // Right Column Box: Daily Mandatory Routines Status
  const rightX = marginX + colHalfWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightX, currentY, colHalfWidth, 38, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('ROTINAS DIÁRIAS OBRIGATÓRIAS (STATUS)', rightX + 4, currentY + 5.5);

  if (routine) {
    const expositoresDone = routine.expositores.filter((e) => e.concluido).length;
    const limpezasDone = routine.limpezas.filter((l) => l.concluido).length;
    const freezerTotal = routine.freezers.itens?.length || 3;
    const freezerDone = routine.freezers.itens ? routine.freezers.itens.filter((f) => f.concluido).length : (routine.freezers.concluido ? freezerTotal : 0);

      const cocoNome = routine.aguaDeCoco.responsavelNome || routine.aguaDeCoco.responsavelPrincipalNome;
      const routineSummary = [
        { label: `Reposição Hortifrúti (${routine.expositores.length} Setores)`, val: `${expositoresDone}/${routine.expositores.length} Abastecidos` },
        { label: `Atendimento Balcão (${routine.atendimentoBalcao.responsavelNome})`, val: routine.atendimentoBalcao.concluido ? '✓ Atendido' : 'Em Atendimento' },
        { label: `Limpeza (${routine.limpezas.length} Áreas: Rita & Bianca)`, val: `${limpezasDone}/${routine.limpezas.length} Limpos` },
        { label: `Freezers (${freezerTotal} Unidades - Vanessa)`, val: `${freezerDone}/${freezerTotal} Aferidos` },
        { label: `Coco (${cocoNome}: ${routine.aguaDeCoco.litrosProduzidos}L, Polpa)`, val: routine.aguaDeCoco.concluido ? '✓ Meta Atingida' : `Meta: ${routine.aguaDeCoco.metaMinLitros}-${routine.aguaDeCoco.metaMaxLitros}L` },
      ];

    let rY = currentY + 10;
    routineSummary.forEach((r) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(r.label, rightX + 4, rY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(r.val.startsWith('✓') ? 5 : 71, r.val.startsWith('✓') ? 150 : 85, r.val.startsWith('✓') ? 105 : 105);
      doc.text(r.val, rightX + colHalfWidth - 4, rY, { align: 'right' });
      rY += 5.2;
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Rotinas operacionais integradas ao checklist diário.', rightX + 4, currentY + 15);
  }

  currentY += 44;

  // ================= 5. OBSERVATIONS & SIGNATURES =================
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('4. VALIDAÇÃO GERENCIAL & CONFORMIDADE OPERACIONAL', marginX, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Este documento comprova o cumprimento das diretrizes operacionais de hortifrúti, regras de transição rápida (GTD 2 Minutos) e metas estabelecidas.',
    marginX,
    currentY
  );
  currentY += 12;

  // Signatures Lines
  const sigWidth = 70;
  // Left Sig
  doc.setDrawColor(148, 163, 184);
  doc.line(marginX, currentY, marginX + sigWidth, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(gerenteResponsavel, marginX, currentY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Encarregado / Gerente Responsável', marginX, currentY + 7.5);

  // Right Sig
  const sigRightX = pageWidth - marginX - sigWidth;
  doc.line(sigRightX, currentY, sigRightX + sigWidth, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(generatedBy, sigRightX, currentY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Administrador Responsável pela Auditoria', sigRightX, currentY + 7.5);

  // Footer text
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Hortifrúti Beto da Fruta • Sistema Operacional & Gestão GTD • Documento Oficial • Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Trigger download
  const cleanDate = dateFormatted.replace(/\//g, '-');
  doc.save(`relatorio-produtividade-${cleanDate}.pdf`);
}
