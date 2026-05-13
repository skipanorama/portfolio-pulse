import type { Holding } from '@/types';
import { getYahooSymbol } from './utils';

// Suppress unused import warning - used indirectly via type export
void (null as unknown as Holding);

interface ParsedHolding {
  symbol: string;
  name: string;
  quantity: number;
  currency: string;
  avgCost?: number;
  bookValue?: number;
  marketPrice?: number;
  marketValue?: number;
  unrealizedGain?: number;
  assetType: string;
}

export function parseITradePDF(text: string): ParsedHolding[] {
  const holdings: ParsedHolding[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let inCAD = false;
  let inUSD = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('CANADIAN ACCOUNT POSITIONS')) inCAD = true;
    if (line.includes('U.S. ACCOUNT POSITIONS')) { inCAD = false; inUSD = true; }
    if (line.includes('TOTAL (CAD)') || line.includes('TOTAL (USD)')) continue;

    // Look for lines with stock symbols (uppercase letters, numbers, dots)
    const symbolMatch = line.match(/^([A-Z][A-Z0-9._-]{0,9})\s+(.+?)\s+([\d,]+)\s+/);
    if (symbolMatch && (inCAD || inUSD)) {
      const symbol = symbolMatch[1];
      const qty = parseFloat(symbolMatch[3].replace(/,/g, ''));
      if (!isNaN(qty) && qty > 0) {
        holdings.push({
          symbol,
          name: symbolMatch[2].trim(),
          quantity: qty,
          currency: inUSD ? 'USD' : 'CAD',
          assetType: 'stock',
        });
      }
    }
  }

  return holdings;
}

export function parseEdwardJonesPDF(text: string): ParsedHolding[] {
  const holdings: ParsedHolding[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Pattern: NAME SYMBOL QTY CURRENCY PRICE MARKETVALUE BOOKCOST GAIN
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip headers and totals
    if (line.startsWith('Total') || line.startsWith('Description') || line.startsWith('Copyright')) continue;

    // Match Edward Jones format: multiple words as name, then symbol, then numbers
    const match = line.match(/^(.+?)\s+([A-Z][A-Z0-9._-]{0,9})\s+([\d,.]+)\s+(CAD|USD)\s+\$([\d,.]+)\s+\$([\d,.-]+)\s+\$([\d,.-]+)\s+/);
    if (match) {
      const qty = parseFloat(match[3].replace(/,/g, ''));
      const price = parseFloat(match[5].replace(/,/g, ''));
      const mv = parseFloat(match[6].replace(/,/g, ''));
      const book = parseFloat(match[7].replace(/,/g, ''));

      if (!isNaN(qty) && qty > 0) {
        holdings.push({
          symbol: match[2],
          name: match[1].trim(),
          quantity: qty,
          currency: match[4],
          marketPrice: price,
          marketValue: mv,
          bookValue: book,
          unrealizedGain: mv - book,
          assetType: 'stock',
        });
      }
    }
  }

  return holdings;
}

export function detectAndParsePDF(text: string): { holdings: ParsedHolding[]; broker: string; accountName: string } {
  const isITrade = text.includes('iTrade') || text.includes('Scotia');
  const isEdwardJones = text.includes('Edward Jones');

  let broker = 'Unknown';
  let accountName = 'Imported Portfolio';
  let holdings: ParsedHolding[] = [];

  if (isITrade) {
    broker = 'Scotia iTrade';
    const nameMatch = text.match(/iTrade\s*-\s*([^-]+?)\s*-\s*(\d{8})/);
    if (nameMatch) accountName = `${nameMatch[1].trim()} (${nameMatch[2]})`;
    holdings = parseITradePDF(text);
  } else if (isEdwardJones) {
    broker = 'Edward Jones';
    const nameMatch = text.match(/Holdings for\s+([^(]+)/);
    if (nameMatch) accountName = nameMatch[1].trim();
    holdings = parseEdwardJonesPDF(text);
  }

  // Enrich with Yahoo symbols
  holdings = holdings.map(h => ({
    ...h,
    yahooSymbol: getYahooSymbol(h.symbol, h.currency),
  }));

  return { holdings, broker, accountName };
}
