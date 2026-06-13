const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

exports.generatePdfReport = (stream, title, records) => {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  doc.pipe(stream);

  // Header Banner
  doc.rect(0, 0, doc.page.width, 80).fill('#0f172a');
  doc.fillColor('#ffffff').fontSize(16).text('INDIAN RAILWAYS', 30, 20, { bold: true });
  doc.fontSize(12).text('Bogie Thermal Inspection & Analytics Portal', 30, 42);
  
  // Title
  doc.fillColor('#000000').fontSize(14).text(title, 30, 100, { bold: true });
  
  // Date timestamp
  doc.fontSize(9).fillColor('#64748b').text(`Report generated at: ${new Date().toLocaleString()}`, 30, 120);

  // Table header
  let y = 150;
  doc.rect(30, y, doc.page.width - 60, 25).fill('#334155');
  doc.fillColor('#ffffff').fontSize(9);
  
  const headers = records.length ? Object.keys(records[0]) : [];
  const colWidth = (doc.page.width - 60) / Math.max(1, headers.length);
  
  headers.forEach((h, i) => {
    doc.text(h.toUpperCase(), 35 + (i * colWidth), y + 8, { width: colWidth - 10, align: 'left' });
  });

  y += 25;
  doc.fillColor('#000000');

  // Rows
  records.forEach((row, rIdx) => {
    // Page break if near bottom
    if (y > doc.page.height - 50) {
      doc.addPage();
      y = 30;
      doc.rect(30, y, doc.page.width - 60, 25).fill('#334155');
      doc.fillColor('#ffffff').fontSize(9);
      headers.forEach((h, i) => {
        doc.text(h.toUpperCase(), 35 + (i * colWidth), y + 8, { width: colWidth - 10, align: 'left' });
      });
      y += 25;
      doc.fillColor('#000000');
    }

    // Zebra striping
    if (rIdx % 2 === 1) {
      doc.rect(30, y, doc.page.width - 60, 20).fill('#f8fafc');
      doc.fillColor('#000000');
    }

    headers.forEach((h, i) => {
      const val = row[h] !== null && row[h] !== undefined ? String(row[h]) : '';
      doc.text(val, 35 + (i * colWidth), y + 6, { width: colWidth - 10, align: 'left' });
    });
    
    y += 20;
  });

  doc.end();
};

exports.generateExcelReport = async (stream, title, records) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');

  // Title Block
  worksheet.mergeCells('A1:G1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 40;

  worksheet.addRow([]); // Blank spacer

  if (records.length) {
    const headers = Object.keys(records[0]);
    const headerRow = worksheet.addRow(headers.map(h => h.toUpperCase()));
    
    // Header Style
    headerRow.eachCell(cell => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      cell.alignment = { horizontal: 'center' };
    });

    records.forEach(row => {
      worksheet.addRow(headers.map(h => row[h]));
    });

    // Auto-fit Column Widths
    worksheet.columns.forEach(col => {
      let maxLen = 0;
      col.eachCell({ includeEmpty: true }, cell => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.max(12, maxLen + 3);
    });
  }

  await workbook.xlsx.write(stream);
};
