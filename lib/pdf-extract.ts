import type { PDFDocumentProxy, TextItem } from 'pdfjs-dist/types/src/display/api';

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

export interface RenderedPage {
  pageNumber: number;
  /** Base64 JPEG data, without a `data:` URL prefix. */
  base64: string;
  mediaType: 'image/jpeg';
}

export interface LoadedPdf {
  pageCount: number;
  /** Reconstructs the text layer, one visual row per line. Empty for scanned PDFs. */
  extractText(): Promise<string>;
  /** Rasterizes a page to a JPEG sized for vision models (~1568px on the long edge). */
  renderPage(pageNumber: number): Promise<RenderedPage>;
  destroy(): Promise<void>;
}

const RENDER_LONG_EDGE_PX = 1568;
const JPEG_QUALITY = 0.85;

async function extractTextFromDocument(pdf: PDFDocumentProxy): Promise<string> {
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

async function renderPageToJpeg(pdf: PDFDocumentProxy, pageNumber: number): Promise<RenderedPage> {
  const page = await pdf.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = RENDER_LONG_EDGE_PX / Math.max(baseViewport.width, baseViewport.height);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  // `intent: 'print'` renders synchronously-scheduled; the default 'display'
  // intent paces work with requestAnimationFrame, which never fires in a
  // hidden/background tab and would leave this promise hanging.
  await page.render({ canvas, viewport, intent: 'print' }).promise;

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  canvas.width = 0;
  canvas.height = 0;

  return {
    pageNumber,
    base64: dataUrl.slice(dataUrl.indexOf(',') + 1),
    mediaType: 'image/jpeg',
  };
}

export async function loadPdf(file: File): Promise<LoadedPdf> {
  polyfillReadableStreamAsyncIterator();

  // Loaded dynamically so this browser-only module (it references DOM APIs
  // like DOMMatrix at import time) never gets pulled into server rendering.
  // The legacy build is used (rather than the default modern build) for
  // compatibility with older Safari/iOS versions.
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  return {
    pageCount: pdf.numPages,
    extractText: () => extractTextFromDocument(pdf),
    renderPage: pageNumber => renderPageToJpeg(pdf, pageNumber),
    destroy: () => pdf.loadingTask.destroy(),
  };
}
