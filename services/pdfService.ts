import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Booking } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ROOMS } from '../constants';

export const generateMonthlyReport = (bookings: Booking[], date: Date) => {
  const doc = new jsPDF();
  
  const monthName = format(date, 'MMMM yyyy', { locale: es }).toUpperCase();
  
  doc.setFontSize(18);
  doc.text(`Reporte de Facturación - ${monthName}`, 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

  const tableData = bookings.map(b => {
    const roomName = ROOMS.find(r => r.id === b.roomId)?.name || 'Desconocido';
    return [
      format(new Date(b.checkIn), 'dd/MM'),
      format(new Date(b.checkOut), 'dd/MM'),
      roomName,
      b.guestName,
      `$${b.total}`,
      `$${b.deposit}`,
      `$${b.remaining}`,
      b.remaining === 0 ? 'PAGADO' : 'PENDIENTE'
    ];
  });

  const totalIncome = bookings.reduce((sum, b) => sum + b.total, 0);
  const totalDeposited = bookings.reduce((sum, b) => sum + b.deposit, 0);
  const totalPending = bookings.reduce((sum, b) => sum + b.remaining, 0);

  // Fix for ESM import quirks: sometimes default export is nested or attached to the function
  // @ts-ignore
  const applyAutoTable = autoTable.default || autoTable;

  if (typeof applyAutoTable === 'function') {
    applyAutoTable(doc, {
        head: [['Entrada', 'Salida', 'Habitación', 'Huésped', 'Total', 'Seña', 'Falta', 'Estado']],
        body: tableData,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9 },
    });
  } else {
      console.error("Could not load autoTable plugin", autoTable);
  }

  // @ts-ignore
  const finalY = (doc as any).lastAutoTable?.finalY || 150;

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Resumen del Mes:', 14, finalY + 15);
  doc.setFontSize(10);
  doc.text(`Total Facturado: $${totalIncome}`, 14, finalY + 22);
  doc.text(`Total Cobrado (Señas + Pagos): $${totalDeposited + (totalIncome - totalPending - totalDeposited)}`, 14, finalY + 27); 
  
  doc.text(`Total Pendiente de Cobro: $${totalPending}`, 14, finalY + 32);

  doc.save(`reporte-hostel-${format(date, 'MM-yyyy')}.pdf`);
};