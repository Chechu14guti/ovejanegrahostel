import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Booking, Expense, BarTransaction } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ROOMS } from '../constants';

export const generateMonthlyReport = (
  bookings: Booking[],
  expenses: Expense[],
  date: Date
) => {
  const doc = new jsPDF();

  const monthName = format(date, 'MMMM yyyy', { locale: es }).toUpperCase();

  // Título
  doc.setFontSize(18);
  doc.text(`Reporte de Facturación - ${monthName}`, 14, 22);

  // Fecha de generación
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

  // ------------------ TABLA RESERVAS ------------------
  const bookingsTableData = bookings.map((b) => {
    const roomName = ROOMS.find((r) => r.id === b.roomId)?.name || 'Desconocido';
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

  const totalIncome = bookings.reduce((sum, b) => sum + b.total, 0);
  const totalDeposited = bookings.reduce((sum, b) => sum + b.deposit, 0);
  const totalPending = bookings.reduce((sum, b) => sum + b.remaining, 0);
  const totalCollected = totalIncome - totalPending; // lo realmente cobrado

  // Fix for ESM import quirks
  // @ts-ignore
  const applyAutoTable = autoTable.default || autoTable;

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
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 9 },
    });
  } else {
    console.error('Could not load autoTable plugin', autoTable);
  }

  // @ts-ignore
  let lastY = (doc as any).lastAutoTable?.finalY || 40;

  // ------------------ TABLA GASTOS / COMPRAS ------------------
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

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
  const realProfit = totalIncome - totalExpenses;

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Resumen del Mes:', 14, lastY + 15);

  doc.setFontSize(10);
  doc.text(`Total Facturado (Reservas): $${totalIncome}`, 14, lastY + 22);
  doc.text(`Total Gastos / Compras: $${totalExpenses}`, 14, lastY + 27);
  doc.text(`Beneficio Real (Ingresos - Gastos): $${realProfit}`, 14, lastY + 32);
  doc.text(`Total Cobrado (Señas + Pagos): $${totalCollected}`, 14, lastY + 37);
  doc.text(`Total Pendiente de Cobro: $${totalPending}`, 14, lastY + 42);

  doc.save(`reporte-hostel-${format(date, 'MM-yyyy')}.pdf`);
};

export const generateBarMonthlyReport = (
  transactions: BarTransaction[],
  date: Date
) => {
  const doc = new jsPDF();
  const monthName = format(date, 'MMMM yyyy', { locale: es }).toUpperCase();

  // Título
  doc.setFontSize(18);
  doc.text(`Reporte de Bar - ${monthName}`, 14, 22);

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
        `$${t.amount.toFixed(2)}`
      ]);

    // Apply color to amounts based on type (green for income, red for expense)
    applyAutoTable(doc, {
      head: [['Fecha', 'Concepto', 'Tipo', 'Monto']],
      body: tableData,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [243, 156, 18] }, // Naranja para el bar
      styles: { fontSize: 9 },
      didParseCell: function (data: any) {
        if (data.section === 'body' && data.column.index === 3) {
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
  doc.text('Resumen del Mes (Bar):', 14, lastY + 15);

  doc.setFontSize(10);
  doc.text(`Total Ingresos: $${totalIncome.toFixed(2)}`, 14, lastY + 22);
  doc.text(`Total Gastos: $${totalExpense.toFixed(2)}`, 14, lastY + 27);
  doc.text(`Balance Neto: $${balance.toFixed(2)}`, 14, lastY + 32);

  doc.save(`reporte-bar-${format(date, 'MM-yyyy')}.pdf`);
};
