import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useStore } from '../../store/useStore';

/** Bouton global de rafraîchissement des cours liés au marché. */
export function RefreshQuotesButton() {
  const apiKey = useStore((s) => s.settings.marketApiKey);
  const refreshQuotes = useStore((s) => s.refreshQuotes);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // N'affiche le bouton que si une clé d'API est configurée.
  if (!apiKey) return null;

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const result = await refreshQuotes();
    setBusy(false);

    if (result.updated === 0 && result.errors === 0) {
      setMessage('Aucune ligne à actualiser.');
    } else if (result.errors === 0) {
      setMessage(`${result.updated} cours mis à jour.`);
    } else {
      setMessage(
        `${result.updated} mis à jour · ${result.errors} en erreur${
          result.firstError ? ` (${result.firstError})` : ''
        }`,
      );
    }
    window.setTimeout(() => setMessage(null), 6000);
  };

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className="hidden text-xs text-slate-500 dark:text-slate-400 md:inline">
          {message}
        </span>
      )}
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={busy}
        className="btn-secondary"
        title="Mettre à jour les cours depuis le marché"
      >
        <RefreshCw size={16} className={busy ? 'animate-spin' : ''} />
        <span className="hidden sm:inline">
          {busy ? 'Mise à jour…' : 'Rafraîchir'}
        </span>
      </button>
    </div>
  );
}
