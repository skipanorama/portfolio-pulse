import { NextRequest, NextResponse } from 'next/server';
import { detectAndParsePDF } from '@/lib/pdf-parser';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const { holdings, broker, accountName } = detectAndParsePDF(text);

    return NextResponse.json({ holdings, broker, accountName });
  } catch (err) {
    console.error('PDF parse error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}
