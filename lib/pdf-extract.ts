import type { TextItem } from 'pdfjs-dist/types/src/display/api';

const Y_TOLERANCE = 2;

type AsyncIterableStreamProto = {
  [Symbol.asyncIterator]?: () => AsyncIterator<Uint8Array>;
  values?: (options?: { preventCancel?: boolean }) => AsyncIterator<Uint8Array>;
};

/**
 * WebKit (Safari / iOS, including the home-screen web app) does not implement
 * `ReadableStream[Symbol.asyncIterator]`. pdf.js's `getTextContent()` does
 * `for await (const chunk of readableStream)`, which throws
 * "undefined is not a function" there (mozilla/pdf.js#21924).
 */
function polyfillReadableStreamAsyncIterator() {
  if (typeof ReadableStream === 'undefined') return;
  const proto = ReadableStream.prototype as unknown as AsyncIterableStreamProto;
  if (proto[Symbol.asyncIterator]) return;

  proto.values ??= function values(this: ReadableStream<Uint8Array>, { preventCancel = false } = {}) {
    const reader = this.getReader();
    const iterator: AsyncIterator<Uint8Array> & AsyncIterable<Uint8Array> = {
      async next() {
        const result = await reader.read();
        if (result.done) reader.releaseLock();
        return result as IteratorResult<Uint8Array>;
      },
      async return(value?: unknown) {
        if (preventCancel) reader.releaseLock();
        else await reader.cancel(value);
        return { done: true, value: undefined };
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };
    return iterator;
  };
  proto[Symbol.asyncIterator] = proto.values;
}

export interface ExtractedPdf {
  text: string;
  pageCount: number;
}

export async function extractPdfText(file: File): Promise<ExtractedPdf> {
  polyfillReadableStreamAsyncIterator();

  // Loaded dynamically so this browser-only module (it references DOM APIs
  // like DOMMatrix at import time) never gets pulled into server rendering.
  // The legacy build is used (rather than the default modern build) for
  // compatibility with older Safari/iOS versions.
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
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

  return { text: pageTexts.join('\n'), pageCount: pdf.numPages };
}
