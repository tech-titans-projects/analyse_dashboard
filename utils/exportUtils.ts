
import { AnalysisResult } from '../types';

declare const jspdf: any;

const createDownloadLink = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportToJson = (data: AnalysisResult[]) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  createDownloadLink(blob, 'sentiment_analysis_results.json');
};

export const exportToCsv = (data: AnalysisResult[]) => {
  const headers = ['Text', 'Sentiment', 'Confidence', 'Keywords', 'Explanation'];
  const csvRows = [headers.join(',')];

  const escapeCsvField = (field: string) => `"${field.replace(/"/g, '""')}"`;

  data.forEach(row => {
    const values = [
      escapeCsvField(row.originalText),
      row.sentiment,
      row.confidence.toFixed(2),
      escapeCsvField(row.keywords.join('; ')),
      escapeCsvField(row.explanation),
    ];
    csvRows.push(values.join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  createDownloadLink(blob, 'sentiment_analysis_results.csv');
};

export const exportToPdf = (data: AnalysisResult[]) => {
  const { jsPDF } = jspdf;
  const doc = new jsPDF({
    orientation: 'landscape',
  });

  doc.text('Sentiment Analysis Results', 14, 16);

  const tableColumn = ['Text', 'Sentiment', 'Confidence', 'Keywords', 'Explanation'];
  const tableRows: any[] = [];

  data.forEach(item => {
    const rowData = [
      item.originalText,
      item.sentiment,
      item.confidence.toFixed(2),
      item.keywords.join(', '),
      item.explanation,
    ];
    tableRows.push(rowData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 20,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      3: { cellWidth: 40 },
      4: { cellWidth: 'auto' },
    }
  });

  doc.save('sentiment_analysis_results.pdf');
};
