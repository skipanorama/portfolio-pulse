'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, X, Plus, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn, getYahooSymbol } from '@/lib/utils';
import { loadPdf, type ExtractedPdf } from '@/lib/pdf-extract';

interface ParsedHolding {
  symbol: string;
  yahooSymbol?: string;
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

interface ParseResult {
  holdings: ParsedHolding[];
  broker: string;
  accountName: string;
  /** Names of rows the AI reader left out (no ticker symbol or no quantity). */
  skipped?: string[];
  /** True when the PDF had no text layer and was read with AI vision. */
  viaAi?: boolean;
}

interface OcrPageResult {
  pageNumber: number;
  broker: string | null;
  accountName: string | null;
  holdings: ParsedHolding[];
  skipped: string[];
}

/** Below this many characters of extractable text we treat the PDF as a scan. */
const SCANNED_TEXT_THRESHOLD = 40;

interface Portfolio {
  id: number;
  name: string;
}

type Status = 'idle' | 'parsing' | 'parsed' | 'saving' | 'saved' | 'error';

const ASSET_TYPES = ['stock', 'etf', 'reit', 'mutual_fund', 'bond', 'other'];

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [createNew, setCreateNew] = useState(false);

  // Diagnostics for PDFs where nothing was recognized
  const [extracted, setExtracted] = useState<ExtractedPdf | null>(null);
  const [showExtracted, setShowExtracted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [parsingMessage, setParsingMessage] = useState('Parsing PDF…');

  // Manual entry form state
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({
    symbol: '', name: '', quantity: '', currency: 'CAD',
    avgCost: '', bookValue: '', marketPrice: '', marketValue: '', assetType: 'stock',
  });

  useEffect(() => {
    fetch('/api/portfolios').then(r => r.json()).then(setPortfolios).catch(() => {});
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file');
      return;
    }
    setStatus('parsing');
    setParsingMessage('Reading PDF…');
    setError('');
    setParsed(null);
    setExtracted(null);
    setShowExtracted(false);
    setCopied(false);

    let pdf: Awaited<ReturnType<typeof loadPdf>> | null = null;
    try {
      pdf = await loadPdf(file);
      const text = await pdf.extractText();
      setExtracted({ text, pageCount: pdf.pageCount });

      let data: ParseResult;

      if (text.trim().length >= SCANNED_TEXT_THRESHOLD) {
        // Text-based PDF: parse the text layer with the broker-specific parsers.
        const res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error(await res.text());
        data = await res.json();
      } else {
        // Scanned PDF (no text layer): rasterize each page and have the AI read it.
        const total = pdf.pageCount;
        let done = 0;
        setParsingMessage(`Scanned PDF — reading ${total} page${total === 1 ? '' : 's'} with AI…`);

        const currentPdf = pdf;
        const pages = await Promise.all(
          Array.from({ length: total }, (_, i) => i + 1).map(async pageNumber => {
            const image = await currentPdf.renderPage(pageNumber);
            const res = await fetch('/api/import/ocr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image: image.base64,
                mediaType: image.mediaType,
                pageNumber,
                pageCount: total,
              }),
            });
            if (!res.ok) {
              const err = await res.json().catch(() => null);
              throw new Error(err?.error ?? `Page ${pageNumber}: server returned ${res.status}`);
            }
            const result: OcrPageResult = await res.json();
            done += 1;
            setParsingMessage(`Read ${done} of ${total} page${total === 1 ? '' : 's'} with AI…`);
            return result;
          })
        );

        pages.sort((a, b) => a.pageNumber - b.pageNumber);
        const seen = new Set<string>();
        const holdings = pages
          .flatMap(p => p.holdings)
          .filter(h => {
            const key = `${h.symbol}|${h.quantity}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

        data = {
          holdings,
          broker: pages.find(p => p.broker)?.broker ?? 'Unknown',
          accountName: pages.find(p => p.accountName)?.accountName ?? 'Imported Portfolio',
          skipped: pages.flatMap(p => p.skipped),
          viaAi: true,
        };
      }

      setParsed(data);
      setNewPortfolioName(data.accountName);
      setStatus('parsed');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Parse failed');
      setStatus('error');
    } finally {
      await pdf?.destroy().catch(() => {});
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const removeHolding = (idx: number) => {
    if (!parsed) return;
    setParsed({ ...parsed, holdings: parsed.holdings.filter((_, i) => i !== idx) });
  };

  const addManual = () => {
    if (!manual.symbol || !manual.name || !manual.quantity) return;
    const h: ParsedHolding = {
      symbol: manual.symbol.toUpperCase(),
      yahooSymbol: getYahooSymbol(manual.symbol.toUpperCase(), manual.currency),
      name: manual.name,
      quantity: parseFloat(manual.quantity) || 0,
      currency: manual.currency,
      avgCost: manual.avgCost ? parseFloat(manual.avgCost) : undefined,
      bookValue: manual.bookValue ? parseFloat(manual.bookValue) : undefined,
      marketPrice: manual.marketPrice ? parseFloat(manual.marketPrice) : undefined,
      marketValue: manual.marketValue ? parseFloat(manual.marketValue) : undefined,
      assetType: manual.assetType,
    };
    if (parsed) {
      setParsed({ ...parsed, holdings: [...parsed.holdings, h] });
    } else {
      setParsed({ holdings: [h], broker: 'Manual', accountName: 'Manual Import' });
      setStatus('parsed');
    }
    setManual({ symbol: '', name: '', quantity: '', currency: 'CAD', avgCost: '', bookValue: '', marketPrice: '', marketValue: '', assetType: 'stock' });
    setShowManual(false);
  };

  const handleSave = async () => {
    if (!parsed || parsed.holdings.length === 0) return;
    if (!createNew && !selectedPortfolio) {
      setError('Please select a portfolio or create a new one');
      return;
    }

    setStatus('saving');
    setError('');

    try {
      let portfolioId: number;

      if (createNew) {
        const res = await fetch('/api/portfolios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newPortfolioName || parsed.accountName,
            owner: 'Imported',
            broker: parsed.broker,
            accountType: 'Cash',
            currency: 'CAD',
          }),
        });
        if (!res.ok) throw new Error('Failed to create portfolio');
        const p = await res.json();
        portfolioId = p.id;
      } else {
        portfolioId = parseInt(selectedPortfolio);
      }

      const res = await fetch(`/api/portfolios/${portfolioId}/holdings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings: parsed.holdings }),
      });
      if (!res.ok) throw new Error('Failed to save holdings');

      setStatus('saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
      setStatus('error');
    }
  };

  if (status === 'saved') {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="flex items-center justify-center w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full mx-auto mb-4">
          <CheckCircle size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Import Successful!</h2>
        <p className="text-slate-500 mb-6">{parsed?.holdings.length} holdings saved.</p>
        <div className="flex items-center justify-center gap-3">
          <a href="/" className="px-4 py-2 text-sm font-medium text-slate-300 bg-[hsl(222,47%,14%)] border border-[hsl(222,47%,20%)] rounded-lg hover:bg-[hsl(222,47%,18%)] transition-colors">
            Back to Dashboard
          </a>
          <button onClick={() => { setStatus('idle'); setParsed(null); }} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
            Import Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Import Holdings</h1>
        <p className="text-slate-500 text-sm mt-1">Upload a PDF statement or add holdings manually</p>
      </div>

      {/* PDF Drop Zone */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer',
          dragging
            ? 'border-blue-400 bg-blue-500/10'
            : 'border-[hsl(222,47%,22%)] bg-[hsl(222,47%,9%)] hover:border-blue-500/40 hover:bg-[hsl(222,47%,11%)]'
        )}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={onFileChange} />
        {status === 'parsing' ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={40} className="text-blue-400 animate-spin" />
            <p className="text-slate-400">{parsingMessage}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Upload size={24} className="text-blue-400" />
            </div>
            <div>
              <p className="text-slate-200 font-medium">Drop your PDF here</p>
              <p className="text-slate-500 text-sm mt-1">or click to browse · Scotia iTrade and Edward Jones statements · scanned PDFs are read with AI</p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Nothing recognized in the PDF */}
      {status === 'parsed' && parsed && parsed.holdings.length === 0 && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <div className="flex items-start gap-2 text-amber-300 text-sm">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <p>
              No holdings were recognized in this PDF
              {parsed.broker !== 'Unknown'
                ? ` (detected broker: ${parsed.broker}).`
                : ' (broker not recognized — no "Edward Jones" or "Scotia iTrade" text found).'}
            </p>
          </div>
          {extracted && (
            <>
              <p className="text-xs text-slate-500">
                {parsed.viaAi
                  ? `This PDF has no selectable text, so its ${extracted.pageCount} page${extracted.pageCount === 1 ? ' was' : 's were'} read with AI, which found no holdings.`
                  : `Extracted ${extracted.text.length.toLocaleString()} characters from ${extracted.pageCount} page${extracted.pageCount === 1 ? '' : 's'}.`}
              </p>
              {parsed.skipped && parsed.skipped.length > 0 && (
                <p className="text-xs text-slate-500">
                  Rows left out because they show no ticker symbol or quantity: {parsed.skipped.join(', ')}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowExtracted(!showExtracted)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-[hsl(222,47%,14%)] border border-[hsl(222,47%,20%)] rounded-lg hover:bg-[hsl(222,47%,18%)] transition-colors"
                >
                  {showExtracted ? 'Hide extracted text' : 'Show extracted text'}
                </button>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(extracted.text);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch {
                      setShowExtracted(true);
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy extracted text'}
                </button>
              </div>
              {showExtracted && (
                <textarea
                  readOnly
                  value={extracted.text}
                  rows={14}
                  className="w-full px-3 py-2 text-[11px] font-mono leading-snug bg-[hsl(222,47%,9%)] border border-[hsl(222,47%,16%)] rounded-xl text-slate-300 focus:outline-none"
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Manual entry */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Manual Entry</h3>
          <button
            onClick={() => setShowManual(!showManual)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors"
          >
            <Plus size={12} />
            Add Holding
          </button>
        </div>

        {showManual && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[hsl(222,47%,9%)] rounded-xl border border-[hsl(222,47%,16%)]">
            {[
              { key: 'symbol', label: 'Symbol', placeholder: 'e.g. AAPL' },
              { key: 'name', label: 'Name', placeholder: 'Company name' },
              { key: 'quantity', label: 'Quantity', placeholder: '100', type: 'number' },
              { key: 'avgCost', label: 'Avg Cost', placeholder: '0.00', type: 'number' },
              { key: 'bookValue', label: 'Book Value', placeholder: '0.00', type: 'number' },
              { key: 'marketPrice', label: 'Market Price', placeholder: '0.00', type: 'number' },
              { key: 'marketValue', label: 'Market Value', placeholder: '0.00', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[10px] uppercase tracking-wide text-slate-600 mb-1">{f.label}</label>
                <input
                  type={f.type ?? 'text'}
                  placeholder={f.placeholder}
                  value={manual[f.key as keyof typeof manual]}
                  onChange={e => setManual(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs bg-[hsl(222,47%,12%)] border border-[hsl(222,47%,20%)] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            ))}
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-slate-600 mb-1">Currency</label>
              <select
                value={manual.currency}
                onChange={e => setManual(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-2.5 py-1.5 text-xs bg-[hsl(222,47%,12%)] border border-[hsl(222,47%,20%)] rounded-lg text-slate-200 focus:outline-none"
              >
                <option value="CAD">CAD</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-slate-600 mb-1">Asset Type</label>
              <select
                value={manual.assetType}
                onChange={e => setManual(prev => ({ ...prev, assetType: e.target.value }))}
                className="w-full px-2.5 py-1.5 text-xs bg-[hsl(222,47%,12%)] border border-[hsl(222,47%,20%)] rounded-lg text-slate-200 focus:outline-none"
              >
                {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-4 flex justify-end gap-2 mt-1">
              <button onClick={() => setShowManual(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
              <button onClick={addManual} className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">Add</button>
            </div>
          </div>
        )}
      </div>

      {/* Parsed preview */}
      {parsed && parsed.holdings.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-blue-400" />
              <h3 className="text-sm font-semibold text-white">
                {parsed.holdings.length} Holdings Detected
              </h3>
              <span className="text-xs text-slate-500">· {parsed.broker}{parsed.viaAi ? ' · read with AI — please verify the numbers' : ''}</span>
            </div>
          </div>
          {parsed.skipped && parsed.skipped.length > 0 && (
            <p className="text-xs text-slate-500 mb-4">
              Left out (no ticker symbol or quantity shown): {parsed.skipped.join(', ')}. Add them manually below if needed.
            </p>
          )}

          {/* Holdings preview table */}
          <div className="overflow-x-auto rounded-xl border border-[hsl(222,47%,16%)] mb-6">
            <table className="w-full text-xs">
              <thead className="bg-[hsl(222,47%,9%)]">
                <tr>
                  {['Symbol', 'Name', 'Qty', 'Currency', 'Book Value', 'Market Value', 'Type', ''].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(222,47%,14%)]">
                {parsed.holdings.map((h, i) => (
                  <tr key={i} className="hover:bg-[hsl(222,47%,11%)] transition-colors">
                    <td className="px-3 py-2.5 font-mono font-semibold text-blue-300">{h.symbol}</td>
                    <td className="px-3 py-2.5 text-slate-300 max-w-[180px] truncate" title={h.name}>{h.name}</td>
                    <td className="px-3 py-2.5 text-slate-300 tabular-nums">{h.quantity}</td>
                    <td className="px-3 py-2.5 text-slate-400">{h.currency}</td>
                    <td className="px-3 py-2.5 text-slate-300 tabular-nums">{h.bookValue?.toFixed(2) ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-300 tabular-nums">{h.marketValue?.toFixed(2) ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-500 capitalize">{h.assetType}</td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => removeHolding(i)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <X size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Portfolio selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Import Into</h4>
            <div className="flex gap-2">
              <button
                onClick={() => setCreateNew(false)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  !createNew
                    ? 'text-blue-300 bg-blue-500/15 border-blue-500/30'
                    : 'text-slate-400 bg-[hsl(222,47%,12%)] border-[hsl(222,47%,20%)] hover:text-slate-200'
                )}
              >
                Existing Portfolio
              </button>
              <button
                onClick={() => setCreateNew(true)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  createNew
                    ? 'text-blue-300 bg-blue-500/15 border-blue-500/30'
                    : 'text-slate-400 bg-[hsl(222,47%,12%)] border-[hsl(222,47%,20%)] hover:text-slate-200'
                )}
              >
                Create New
              </button>
            </div>

            {!createNew ? (
              <select
                value={selectedPortfolio}
                onChange={e => setSelectedPortfolio(e.target.value)}
                className="w-full max-w-sm px-3 py-2 text-sm bg-[hsl(222,47%,12%)] border border-[hsl(222,47%,20%)] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
              >
                <option value="">Select a portfolio…</option>
                {portfolios.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            ) : (
              <input
                type="text"
                placeholder="New portfolio name"
                value={newPortfolioName}
                onChange={e => setNewPortfolioName(e.target.value)}
                className="w-full max-w-sm px-3 py-2 text-sm bg-[hsl(222,47%,12%)] border border-[hsl(222,47%,20%)] rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/50"
              />
            )}
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={handleSave}
              disabled={status === 'saving'}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {status === 'saving' ? (
                <><Loader2 size={14} className="animate-spin" />Saving…</>
              ) : (
                <>Save {parsed.holdings.length} Holdings</>
              )}
            </button>
            <button
              onClick={() => { setParsed(null); setStatus('idle'); }}
              className="px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
