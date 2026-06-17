const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

exports.generatePdfReport = (stream, title, records) => {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  doc.pipe(stream);

  // Header Banner
  doc.rect(0, 0, doc.page.width, 80).fill('#0f172a');
  doc.fillColor('#ffffff').fontSize(16).text('INDIAN RAILWAYS', 30, 20, { bold: true });
  doc.fontSize(11).text('Save Life Smartly', 30, 42);
  
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

exports.generateSessionPdfReport = (stream, session, readings) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(stream);

  // 1. Header Banner
  doc.rect(0, 0, doc.page.width, 100).fill('#1e3a8a'); // Dark Blue banner
  doc.fillColor('#ffffff').fontSize(20).text('INDIAN RAILWAYS', 40, 25, { bold: true, tracking: 1 });
  doc.fontSize(11).text('Save Life Smartly', 40, 52);
  doc.fontSize(9).text('AUTOMATED INSPECTION SERVICE REPORT', 40, 70);

  // 2. Metadata Section (Zebra styled card)
  doc.rect(40, 120, doc.page.width - 80, 85).fill('#f8fafc');
  doc.rect(40, 120, doc.page.width - 80, 85).stroke('#e2e8f0');

  doc.fillColor('#1e293b').fontSize(10).text('RAKE DETAILS:', 50, 130, { bold: true });
  doc.text(`Rake Number: ${session.train_number}`, 50, 145);
  doc.text(`Rake Type: ${session.train_name}`, 50, 160);
  doc.text(`Division/Branch: ${session.route || 'N/A'}`, 50, 175);

  doc.text('INSPECTION METADATA:', doc.page.width - 240, 130, { bold: true });
  doc.text(`Date: ${session.inspection_date}`, doc.page.width - 240, 145);
  doc.text(`Status: ${session.status.toUpperCase()}`, doc.page.width - 240, 160, { bold: true });
  doc.fillColor('#2563eb').text(`Completed by: ${session.inspector_name || 'Ground Engineer'}`, doc.page.width - 240, 175, { bold: true });

  // 3. Readings Table
  let y = 230;
  doc.fillColor('#0f172a').fontSize(12).text('Bogie Thermal Scanning Summary (RDSO Guidelines)', 40, y, { bold: true });
  y += 20;

  // Table Headers
  doc.rect(40, y, doc.page.width - 80, 24).fill('#475569');
  doc.fillColor('#ffffff').fontSize(9);
  doc.text('COACH', 50, y + 8, { bold: true });
  doc.text('ZONE/COMPONENT', 110, y + 8, { bold: true });
  doc.text('MAX (°C)', 270, y + 8, { bold: true });
  doc.text('AMBIENT (°C)', 340, y + 8, { bold: true });
  doc.text('RISE (°C)', 420, y + 8, { bold: true });
  doc.text('RDSO STATUS', 485, y + 8, { bold: true });
  y += 24;

  readings.forEach((r, idx) => {
    // Page break handling
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 40;
      doc.rect(40, y, doc.page.width - 80, 24).fill('#475569');
      doc.fillColor('#ffffff').fontSize(9);
      doc.text('COACH', 50, y + 8, { bold: true });
      doc.text('ZONE/COMPONENT', 110, y + 8, { bold: true });
      doc.text('MAX (°C)', 270, y + 8, { bold: true });
      doc.text('AMBIENT (°C)', 340, y + 8, { bold: true });
      doc.text('RISE (°C)', 420, y + 8, { bold: true });
      doc.text('RDSO STATUS', 485, y + 8, { bold: true });
      y += 24;
    }

    // Zebra striping background
    if (idx % 2 === 1) {
      doc.rect(40, y, doc.page.width - 80, 22).fill('#f1f5f9');
    }

    const maxVal = r.temperature !== null ? r.temperature : 0;
    const ambVal = r.ambient_temperature !== null ? r.ambient_temperature : 0;
    const riseVal = maxVal - ambVal;

    doc.fillColor('#334155').fontSize(9);
    doc.text(String(r.coach_number), 50, y + 6);
    doc.text(String(r.zone_name), 110, y + 6);
    doc.text(`${maxVal.toFixed(1)}°C`, 270, y + 6);
    doc.text(`${ambVal.toFixed(1)}°C`, 340, y + 6);
    doc.text(`${riseVal.toFixed(1)}°C`, 420, y + 6, { bold: riseVal > 25.0 });

    // Colorful Status Pill representation
    let statusColor = '#059669'; // Green (Safe)
    let statusText = 'ACCEPTABLE';
    if (r.status === 'critical') {
      statusColor = '#dc2626'; // Red (Critical)
      statusText = 'INVESTIGATE';
    }

    doc.fillColor(statusColor).text(statusText, 485, y + 6, { bold: true });
    
    // Draw row separator line
    doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(40, y + 22).lineTo(doc.page.width - 40, y + 22).stroke();
    y += 22;
  });

  // Footer page numbering
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor('#94a3b8').text(
      `Page ${i + 1} of ${pages.count}  |  Indian Railways Bogie Inspection Service`,
      40,
      doc.page.height - 30,
      { align: 'center' }
    );
  }

  doc.end();
};
