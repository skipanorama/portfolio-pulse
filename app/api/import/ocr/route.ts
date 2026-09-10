import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { getYahooSymbol } from '@/lib/utils';

// Vercel function limit for this route (mirrored in vercel.json).
export const maxDuration = 60;

const MAX_IMAGE_BASE64_CHARS = 6_000_000; // ~4.5MB of image data
const IMAGE_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
type ImageMediaType = (typeof IMAGE_MEDIA_TYPES)[number];

const ExtractedHoldingSchema = z.object({
  symbol: z
    .string()
    .describe('Ticker symbol exactly as printed (e.g. "RY", "BRK.B", "AGTHX"). Empty string if the row shows no symbol.'),
  name: z.string().describe('Security name as printed.'),
  quantity: z.number().describe('Number of shares/units held. 0 if not shown.'),
  currency: z.string().describe('ISO currency code of the holding, e.g. "CAD" or "USD".'),
  marketPrice: z.number().nullable().describe('Current price per share/unit, or null if not shown.'),
  marketValue: z.number().nullable().describe('Total current market value of the position, or null if not shown.'),
  bookValue: z.number().nullable().describe('Total cost basis / book value of the position, or null if not shown.'),
  avgCost: z.number().nullable().describe('Average cost per share/unit, or null if not shown.'),
  assetType: z.enum(['stock', 'etf', 'reit', 'mutual_fund', 'bond', 'other']),
});

const StatementPageSchema = z.object({
  broker: z.string().nullable().describe('Brokerage / financial institution named on the page, or null.'),
  accountName: z
    .string()
    .nullable()
    .describe('Account holder name and/or account title as printed (e.g. "John Doe - RRSP"), or null if not on this page.'),
  holdings: z.array(ExtractedHoldingSchema),
});

type StatementPage = z.infer<typeof StatementPageSchema>;

const SYSTEM_PROMPT = `You read scanned brokerage account statements and transcribe the holdings table into structured data.

Rules:
- Transcribe every individual security position (stocks, ETFs, REITs, mutual funds, bonds). One entry per row.
- Do not include cash / money-market balances, subtotal or total rows, section headers, or transaction history.
- Copy symbols and names exactly as printed. Never invent a ticker symbol: if none is printed, use an empty string.
- Numbers must be plain numbers: strip currency signs and thousands separators; a value in parentheses or with a trailing minus is negative.
- If a row wraps onto two printed lines, combine them into one entry.
- If a value is not printed for a field, use null (or 0 for quantity). Do not estimate.
- If the page contains no holdings (cover page, disclosures, activity), return an empty holdings list.`;

function isRefusal(message: Anthropic.Beta.BetaMessage): boolean {
  return message.stop_reason === 'refusal';
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'AI statement reading is not configured on the server (ANTHROPIC_API_KEY is missing).' },
      { status: 503 }
    );
  }

  let body: { image?: unknown; mediaType?: unknown; pageNumber?: unknown; pageCount?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { image, mediaType, pageNumber, pageCount } = body;
  if (typeof image !== 'string' || image.length === 0) {
    return NextResponse.json({ error: 'image (base64) is required' }, { status: 400 });
  }
  if (image.length > MAX_IMAGE_BASE64_CHARS) {
    return NextResponse.json({ error: 'Page image is too large' }, { status: 413 });
  }
  if (!IMAGE_MEDIA_TYPES.includes(mediaType as ImageMediaType)) {
    return NextResponse.json({ error: 'Unsupported image mediaType' }, { status: 400 });
  }
  const page = typeof pageNumber === 'number' ? pageNumber : 1;
  const total = typeof pageCount === 'number' ? pageCount : 1;

  const client = new Anthropic();

  try {
    const response = await client.beta.messages.create({
      model: 'claude-opus-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEM_PROMPT,
      output_config: { format: zodOutputFormat(StatementPageSchema) },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType as ImageMediaType, data: image },
            },
            {
              type: 'text',
              text: `This is page ${page} of ${total} of a scanned brokerage statement. Transcribe the holdings on this page.`,
            },
          ],
        },
      ],
    });

    if (isRefusal(response)) {
      return NextResponse.json(
        { error: `The AI declined to read page ${page}${response.stop_details?.explanation ? `: ${response.stop_details.explanation}` : '.'}` },
        { status: 422 }
      );
    }

    const textBlock = response.content.find(
      (block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text'
    );
    if (!textBlock) {
      return NextResponse.json({ error: `No structured output returned for page ${page}` }, { status: 502 });
    }

    const parsed: StatementPage = StatementPageSchema.parse(JSON.parse(textBlock.text));

    const kept = parsed.holdings.filter(h => h.symbol.trim() !== '' && h.quantity > 0);
    const skipped = parsed.holdings.filter(h => !kept.includes(h)).map(h => h.name);

    return NextResponse.json({
      pageNumber: page,
      broker: parsed.broker,
      accountName: parsed.accountName,
      holdings: kept.map(h => {
        const symbol = h.symbol.trim().toUpperCase();
        const currency = h.currency.trim().toUpperCase() || 'CAD';
        return {
          ...h,
          symbol,
          currency,
          yahooSymbol: getYahooSymbol(symbol, currency),
          unrealizedGain:
            h.marketValue != null && h.bookValue != null ? h.marketValue - h.bookValue : null,
        };
      }),
      skipped,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: 'The server\'s Anthropic API key was rejected.' }, { status: 500 });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'AI service is rate-limited; try again in a minute.' }, { status: 429 });
    }
    if (err instanceof Anthropic.APIError) {
      console.error('Anthropic API error', err.status, err.message);
      return NextResponse.json({ error: `AI service error (${err.status}): ${err.message}` }, { status: 502 });
    }
    if (err instanceof z.ZodError || err instanceof SyntaxError) {
      console.error('Unparseable structured output', err);
      return NextResponse.json({ error: `Could not parse the AI's reading of page ${page}` }, { status: 502 });
    }
    console.error('OCR route error', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : `Failed to read page ${page}` },
      { status: 500 }
    );
  }
}
