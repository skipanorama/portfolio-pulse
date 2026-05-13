import { NextRequest, NextResponse } from 'next/server';
import { detectAndParsePDF } from '@/lib/pdf-parser';
import { getYahooSymbol } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamically import pdf-parse to avoid issues at module load time
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParseModule = await import('pdf-parse') as any;
    const pdfParse = pdfParseModule.default ?? pdfParseModule;
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    const { holdings, broker, accountName } = detectAndParsePDF(text);

    // Enrich with yahoo symbols
    const enrichedHoldings = holdings.map(h => ({
      ...h,
      yahooSymbol: getYahooSymbol(h.symbol, h.currency),
    }));

    return NextResponse.json({
      holdings: enrichedHoldings,
      broker,
      accountName,
      pageCount: pdfData.numpages,
      characterCount: text.length,
    });
  } catch (err) {
    console.error('PDF parse error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}
