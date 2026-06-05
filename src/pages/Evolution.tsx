import { useMemo, useState } from 'react';
import { CalendarPlus, LineChart as LineChartIcon, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { netWorth } from '../lib/calculations';
import {
  formatCurrency,
  formatDateTime,
  formatSignedCurrency,
} from '../lib/format';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/misc';
import { valueColorClass } from '../lib/colors';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { NetWorthLine } from '../components/charts/NetWorthLine';
import type { Snapshot } from '../types';

export default function Evolution() {
  const assets = useStore((s) => s.assets);
  const snapshots = useStore((s) => s.snapshots);
  const takeSnapshot = useStore((s) => s.takeSnapshot);
  const removeSnapshot = useStore((s) => s.removeSnapshot);

  const [toDelete, setToDelete] = useState<Snapshot | null>(null);
  const currentNet = netWorth(assets);

  // Liste antéchronologique (le plus récent en haut), avec variation.
  const rows = useMemo(() => {
    const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
    return sorted
      .map((s, i) => ({
        snapshot: s,
        delta: i === 0 ? null : s.netWorth - sorted[i - 1].netWorth,
      }))
      .reverse();
  }, [snapshots]);

  const confirmDelete = () => {
    if (toDelete) {
      void removeSnapshot(toDelete.id);
      setToDelete(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Évolution"
        subtitle="Figez la valeur du jour pour suivre votre patrimoine net dans le temps."
        action={
          <button
            type="button"
            className="btn-primary"
            onClick={() => void takeSnapshot()}
          >
            <CalendarPlus size={18} /> Figer la valeur du jour
          </button>
        }
      />

      <div className="mb-6 card">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Patrimoine net actuel (sera enregistré au figeage)
        </p>
        <p className={`text-2xl font-bold ${valueColorClass(currentNet)}`}>
          {formatCurrency(currentNet)}
        </p>
      </div>

      <div className="mb-6 card">
        <h2 className="mb-4 text-lg font-semibold">Courbe du patrimoine net</h2>
        <NetWorthLine snapshots={snapshots} />
      </div>

      <h2 className="mb-3 text-lg font-semibold">Instantanés enregistrés</h2>
      {rows.length === 0 ? (
        <EmptyState
          icon={<LineChartIcon size={32} />}
          title="Aucun instantané"
          description="Cliquez sur « Figer la valeur du jour » pour créer votre premier point d’historique."
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">
                  Patrimoine net
                </th>
                <th className="px-4 py-3 text-right font-medium">Variation</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ snapshot, delta }) => (
                <tr
                  key={snapshot.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                >
                  <td className="px-4 py-3">{formatDateTime(snapshot.date)}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatCurrency(snapshot.netWorth)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      delta === null ? 'text-slate-400' : valueColorClass(delta)
                    }`}
                  >
                    {delta === null ? '—' : formatSignedCurrency(delta)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setToDelete(snapshot)}
                        aria-label="Supprimer l’instantané"
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Supprimer cet instantané ?"
        message={
          toDelete
            ? `L’instantané du ${formatDateTime(
                toDelete.date,
              )} sera supprimé. Cette action est irréversible.`
            : ''
        }
        confirmLabel="Supprimer"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
