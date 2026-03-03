import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Booking, Expense, BarTransaction, SenderoRecord, Room } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
// The ROOMS import is kept as it might be used elsewhere or for type inference if the parameter is not always provided.
// However, the new function signature implies ROOMS will be passed as a parameter.
import { ROOMS as CONSTANT_ROOMS } from '../constants';

export const generateMonthlyReport = (
  totalIncomeReservations: number,
  totalExpenses: number,
  totalIncome: number,
  netProfit: number,
  expenses: Expense[],
  currentMonth: Date,
  bookings: Booking[],
  senderoRecords: SenderoRecord[],
  barTransactions: BarTransaction[] = [],
  senderoIncome: number,
  filterType: 'day' | 'month' | 'year' = 'month',
  activeFilter: string | null = null,
  filteredMovements: any[] = []
) => {
  const doc = new jsPDF();

  // Define formatted date strings based on filterType
  let titleDateStr = '';
  let fileDateStr = '';
  if (filterType === 'day') {
    titleDateStr = format(currentMonth, 'dd MMMM yyyy', { locale: es });
    fileDateStr = format(currentMonth, 'yyyy-MM-dd');
  } else if (filterType === 'year') {
    titleDateStr = format(currentMonth, 'yyyy', { locale: es });
    fileDateStr = format(currentMonth, 'yyyy');
  } else {
    titleDateStr = format(currentMonth, 'MMMM yyyy', { locale: es });
    fileDateStr = format(currentMonth, 'yyyy-MM');
  }

  // Título Dinámico
  let tituloPrincipal = `Reporte de Facturación`;
  if (activeFilter && activeFilter !== 'profit') {
    const labels: Record<string, string> = {
      'income-reservas': 'Ingresos Reservas',
      'income-sendero': 'Ingresos Sendero',
      'income-bar': 'Ingresos Bar',
      'total-income': 'Total Ingresos',
      'expenses': 'Gastos y Compras',
      'pending': 'Pendiente de Cobro'
    };
    tituloPrincipal += ` - ${labels[activeFilter] || 'Filtrado'}`;
  }

  doc.setFontSize(20);
  doc.text(`${tituloPrincipal} (${titleDateStr.charAt(0).toUpperCase() + titleDateStr.slice(1)})`, 14, 22);

  // Fecha de generación
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

  // Fix for ESM import quirks
  // @ts-ignore
  const applyAutoTable = autoTable.default || autoTable;

  if (activeFilter && activeFilter !== 'profit') {
    // ------------------ TABLA DE MOVIMIENTOS FILTRADOS ------------------
    if (filteredMovements.length > 0 && typeof applyAutoTable === 'function') {
      const movementsTableData = filteredMovements.map(m => [
        m.date,
        m.type,
        m.description,
        m.paymentMethod === 'transfer' ? 'Transf.' : (m.paymentMethod === 'cash' ? 'Efectivo' : '-'),
        `$${Math.abs(m.amount).toLocaleString()}`
      ]);

      applyAutoTable(doc, {
        head: [['Fecha', 'Tipo', 'Concepto', 'Método', 'Monto']],
        body: movementsTableData,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      // @ts-ignore
      let lastY = (doc as any).lastAutoTable?.finalY || 40;

      const totalFiltrado = filteredMovements.reduce((sum, m) => sum + m.amount, 0);

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Resumen del Filtro:', 14, lastY + 15);

      applyAutoTable(doc, {
        body: [
          [{ content: 'TOTAL SELECCIONADO:', styles: { fontStyle: 'bold' } },
          { content: `$${totalFiltrado.toLocaleString()}`, styles: { fontStyle: 'bold', textColor: totalFiltrado >= 0 ? [46, 204, 113] : [231, 76, 60] } }]
        ],
        startY: lastY + 22,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { halign: 'right', cellWidth: 50 }
        }
      });
    } else {
      doc.setFontSize(12);
      doc.text(`No hay movimientos para este filtro en la fecha seleccionada.`, 14, 45);
    }

    const filename = `reporte-${activeFilter}-${fileDateStr}.pdf`;
    doc.save(filename);
    return;
  }

  // ------------------ REPORTE GENERAL (CÓDIGO ORIGINAL) ------------------

  // ------------------ TABLA RESERVAS ------------------
  const bookingsTableData = bookings.map((b) => {
    const roomName = CONSTANT_ROOMS.find((r) => r.id === b.roomId)?.name || 'Desconocido';
    return [
      format(new Date(b.checkIn), 'dd/MM'),
      format(new Date(b.checkOut), 'dd/MM'),
      roomName,
      b.guestName,
      `$${b.total}`,
      `$${b.deposit}`,
      `$${b.remaining}`,
      b.remaining === 0 ? 'PAGADO' : 'PENDIENTE',
    ];
  });

  // The original calculations for totalIncome, totalDeposited, totalPending, totalCollected are replaced by parameters.
  // const totalIncome = bookings.reduce((sum, b) => sum + b.total, 0);
  // const totalDeposited = bookings.reduce((sum, b) => sum + b.deposit, 0);
  // const totalPending = bookings.reduce((sum, b) => sum + b.remaining, 0);
  // const totalCollected = totalIncome - totalPending; // lo realmente cobrado

  // The applyAutoTable variable was already assigned above so we reuse it here

  if (typeof applyAutoTable === 'function') {
    applyAutoTable(doc, {
      head: [
        [
          'Entrada',
          'Salida',
          'Habitación',
          'Huésped',
          'Total',
          'Seña',
          'Falta',
          'Estado',
        ],
      ],
      body: bookingsTableData,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
  } else {
    console.error('Could not load autoTable plugin', autoTable);
  }

  // @ts-ignore
  let lastY = (doc as any).lastAutoTable?.finalY || 40;

  // ------------------ TABLA GASTOS / COMPRAS ------------------  // Calculate totalCollected and totalPending from the bookings parameter
  const totalPending = bookings.reduce((sum, b) => sum + b.remaining, 0);
  const totalCollected = bookings.reduce((sum, b) => sum + b.total, 0) - totalPending;

  // Render expenses table
  const totalExpensesFromList = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (expenses.length > 0 && typeof applyAutoTable === 'function') {
    const expensesTableData = expenses.map((e) => [
      format(new Date(e.date), 'dd/MM'),
      e.description,
      `$${e.amount}`,
    ]);

    applyAutoTable(doc, {
      head: [['Fecha', 'Concepto', 'Monto']],
      body: expensesTableData,
      startY: lastY + 15,
      theme: 'grid',
      headStyles: { fillColor: [231, 76, 60] }, // rojo suave para gastos
      styles: { fontSize: 9 },
    });

    // @ts-ignore
    lastY = (doc as any).lastAutoTable?.finalY || lastY + 15;
  }

  // ------------------ RESUMEN DEL MES ------------------
  const barIncome = barTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const barExpense = barTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const totalCombinedIncome = totalIncome + barIncome;
  const totalCombinedExpenses = totalExpensesFromList + barExpense;
  const realProfit = totalCombinedIncome - totalCombinedExpenses;

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Resumen del Mes:', 14, lastY + 15);

  doc.setFontSize(10);
  // The original summary section is replaced with a new autoTable for better formatting
  const summaryTableData = [
    [{ content: 'Total Ingresos Reservas:', styles: { fontStyle: 'bold' } }, { content: `$${totalIncome.toLocaleString()}`, styles: { fontStyle: 'bold', textColor: [41, 128, 185] } }],
    [{ content: 'Total Ingresos Sendero:', styles: { fontStyle: 'bold' } }, { content: `$${senderoIncome.toLocaleString()}`, styles: { fontStyle: 'bold', textColor: [46, 204, 113] } }],
    [
      { content: 'Total Ingresos Bar:', styles: { fontStyle: 'bold' } },
      { content: `$${barIncome.toLocaleString()}`, styles: { fontStyle: 'bold', textColor: [46, 204, 113] } }
    ],
    [
      { content: 'Total Gastos Bar:', styles: { fontStyle: 'bold' } },
      { content: `-$${barExpense.toLocaleString()}`, styles: { fontStyle: 'bold', textColor: [231, 76, 60] } }
    ],
    [{ content: 'Total Cobrado Reservas:', styles: { fontStyle: 'bold' } }, { content: `$${totalCollected.toLocaleString()}`, styles: { fontStyle: 'bold' } }],
    [{ content: 'Total Pendiente Reservas:', styles: { fontStyle: 'bold' } }, { content: `$${totalPending.toLocaleString()}`, styles: { textColor: [231, 76, 60], fontStyle: 'bold' } }],
    [{ content: 'Total Gastos:', styles: { fontStyle: 'bold' } }, { content: `-$${totalExpensesFromList.toLocaleString()}`, styles: { textColor: [231, 76, 60], fontStyle: 'bold' } }],
    [{ content: 'BENEFICIO NETO DEL PERIODO:', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
    { content: `$${(totalCollected + senderoIncome + barIncome - totalExpensesFromList - barExpense).toLocaleString()}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: (totalCollected + senderoIncome + barIncome - totalExpensesFromList - barExpense) >= 0 ? [46, 204, 113] : [231, 76, 60] } }]
  ];

  if (typeof applyAutoTable === 'function') {
    applyAutoTable(doc, {
      body: summaryTableData,
      startY: lastY + 22,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { halign: 'right', cellWidth: 50 }
      }
    });
  }

  doc.save(`reporte-facturacion-${fileDateStr}.pdf`);
};

export const generateBarMonthlyReport = (
  transactions: BarTransaction[],
  date: Date,
  filterType: 'day' | 'month' | 'year' = 'month',
  paymentFilter: 'all' | 'cash' | 'transfer' = 'all'
) => {
  const doc = new jsPDF();

  let periodName = '';
  let fileNameDate = '';

  if (filterType === 'day') {
    periodName = format(date, 'dd MMMM yyyy', { locale: es }).toUpperCase();
    fileNameDate = format(date, 'dd-MM-yyyy');
  } else if (filterType === 'year') {
    periodName = format(date, 'yyyy', { locale: es }).toUpperCase();
    fileNameDate = format(date, 'yyyy');
  } else {
    periodName = format(date, 'MMMM yyyy', { locale: es }).toUpperCase();
    fileNameDate = format(date, 'MM-yyyy');
  }

  // Título
  doc.setFontSize(18);
  let titleFilterStr = '';
  if (paymentFilter === 'cash') titleFilterStr = ' (Efectivo)';
  if (paymentFilter === 'transfer') titleFilterStr = ' (Transferencia)';
  doc.text(`Reporte de Bar - ${periodName}${titleFilterStr}`, 14, 22);

  // Fecha de generación
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

  // @ts-ignore
  const applyAutoTable = autoTable.default || autoTable;

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  if (transactions.length > 0 && typeof applyAutoTable === 'function') {
    const tableData = transactions
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((t) => [
        format(new Date(t.date), 'dd/MM'),
        t.description,
        t.type === 'income' ? 'Ingreso' : 'Gasto',
        t.paymentMethod === 'transfer' ? 'Transf.' : (t.paymentMethod === 'cash' ? 'Efectivo' : '-'),
        `$${t.amount.toFixed(2)}`
      ]);

    // Apply color to amounts based on type (green for income, red for expense)
    applyAutoTable(doc, {
      head: [['Fecha', 'Concepto', 'Tipo', 'Método', 'Monto']],
      body: tableData,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [243, 156, 18] }, // Naranja para el bar
      styles: { fontSize: 9 },
      didParseCell: function (data: any) {
        if (data.section === 'body' && data.column.index === 4) {
          if (data.row.raw[2] === 'Ingreso') {
            data.cell.styles.textColor = [46, 204, 113]; // Green
          } else {
            data.cell.styles.textColor = [231, 76, 60]; // Red
          }
        }
      }
    });
  }

  // @ts-ignore
  let lastY = (doc as any).lastAutoTable?.finalY || 40;

  // ------------------ RESUMEN DEL MES ------------------
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Resumen del Periodo (Bar):', 14, lastY + 15);

  doc.setFontSize(10);
  doc.text(`Total Ingresos: $${totalIncome.toFixed(2)}`, 14, lastY + 22);
  doc.text(`Total Gastos: $${totalExpense.toFixed(2)}`, 14, lastY + 27);
  doc.text(`Balance Neto: $${balance.toFixed(2)}`, 14, lastY + 32);

  doc.save(`reporte-bar-${fileNameDate}.pdf`);
};
