import type { TextItem } from 'pdfjs-dist/types/src/display/api';

const Y_TOLERANCE = 2;

export async function extractPdfText(file: File): Promise<string> {
  // Loaded dynamically so this browser-only module (it references DOM APIs
  // like DOMMatrix at import time) never gets pulled into server rendering.
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const items = (content.items as TextItem[])
      .filter(item => item.str.trim() !== '')
      .sort((a, b) => {
        const dy = b.transform[5] - a.transform[5];
        return Math.abs(dy) > Y_TOLERANCE ? dy : a.transform[4] - b.transform[4];
      });

    const rows: string[][] = [];
    let currentY: number | null = null;
    for (const item of items) {
      const y = item.transform[5];
      if (currentY === null || Math.abs(y - currentY) > Y_TOLERANCE) {
        rows.push([]);
        currentY = y;
      }
      rows[rows.length - 1].push(item.str);
    }

    pageTexts.push(rows.map(row => row.join(' ')).join('\n'));
  }

  return pageTexts.join('\n');
}
