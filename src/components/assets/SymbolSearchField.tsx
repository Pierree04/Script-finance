import { useEffect, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  MarketDataError,
  searchSymbols,
  type SymbolResult,
} from '../../lib/marketData';

interface SymbolSearchFieldProps {
  label: string;
  /** Filtre optionnel sur le type d'instrument (ex : 'crypto'). */
  cryptoOnly?: boolean;
  onSelect: (result: SymbolResult) => void;
}

/** Indique si un résultat correspond à une crypto-monnaie. */
function isCrypto(r: SymbolResult): boolean {
  return /crypto|digital currency/i.test(r.type);
}

/** Champ de recherche d'instruments avec autocomplétion (Twelve Data). */
export function SymbolSearchField({
  label,
  cryptoOnly,
  onSelect,
}: SymbolSearchFieldProps) {
  const apiKey = useStore((s) => s.settings.marketApiKey);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SymbolResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Recherche débouncée pour limiter les appels réseau.
  useEffect(() => {
    if (!apiKey) return;
    const term = query.trim();
    if (term.length < 1) {
      setResults([]);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const found = await searchSymbols(term, apiKey);
        if (cancelled) return;
        const filtered = cryptoOnly ? found.filter(isCrypto) : found;
        setResults(filtered);
        setError(null);
        setOpen(true);
      } catch (err) {
        if (cancelled) return;
        setResults([]);
        setError(
          err instanceof MarketDataError
            ? err.message
            : 'Recherche impossible.',
        );
        setOpen(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, apiKey, cryptoOnly]);

  // Ferme la liste au clic extérieur.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!apiKey) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
        Pour rechercher un titre et suivre son cours automatiquement, ajoutez
        une clé d’API dans les Réglages.
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </span>
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          className="input-base pl-9 pr-9"
          value={query}
          placeholder="Tapez un nom ou un symbole (ex : LVMH, AAPL, BTC)"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && (
          <Loader2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
          />
        )}
      </div>

      {open && (error || results.length > 0) && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          {error ? (
            <p className="px-3 py-2 text-sm text-red-500">{error}</p>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.symbol}-${r.micCode}-${i}`}
                type="button"
                onClick={() => {
                  onSelect(r);
                  setQuery(`${r.symbol} — ${r.name}`);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700/60"
              >
                <span className="min-w-0">
                  <span className="font-medium">{r.symbol}</span>
                  <span className="ml-2 truncate text-slate-500 dark:text-slate-400">
                    {r.name}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {r.exchange || r.country} · {r.currency}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
