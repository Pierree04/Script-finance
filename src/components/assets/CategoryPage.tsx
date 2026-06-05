import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Inbox } from 'lucide-react';
import type { Asset, AssetCategory } from '../../types';
import { useStore, type NewAsset } from '../../store/useStore';
import {
  assetValue,
  categoryTotals,
  unrealizedGain,
} from '../../lib/calculations';
import {
  formatCurrency,
  formatDate,
  formatSignedCurrency,
} from '../../lib/format';
import { CATEGORY_LABELS } from '../../lib/constants';
import { PageHeader } from '../ui/PageHeader';
import { Badge, EmptyState } from '../ui/misc';
import { valueColorClass } from '../../lib/colors';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { AssetFormModal } from './AssetFormModal';
import {
  assetDetail,
  assetSubtype,
  assetTicker,
  hasGain,
} from './assetDisplay';

interface CategoryPageProps {
  category: AssetCategory;
  /** Texte d'aide affiché sous le titre. */
  description?: string;
}

/** Page générique listant et gérant les lignes d'une catégorie. */
export function CategoryPage({ category, description }: CategoryPageProps) {
  const assets = useStore((s) => s.assets);
  const addAsset = useStore((s) => s.addAsset);
  const updateAsset = useStore((s) => s.updateAsset);
  const removeAsset = useStore((s) => s.removeAsset);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [toDelete, setToDelete] = useState<Asset | null>(null);

  const rows = useMemo(
    () => assets.filter((a) => a.category === category),
    [assets, category],
  );

  const total = categoryTotals(assets)[category];
  const showGain = category === 'bourse' || category === 'crypto';

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (asset: Asset) => {
    setEditing(asset);
    setFormOpen(true);
  };

  const handleSubmit = (asset: Asset | NewAsset) => {
    if ('id' in asset && asset.id) {
      void updateAsset(asset as Asset);
    } else {
      void addAsset(asset);
    }
    setFormOpen(false);
  };

  const confirmDelete = () => {
    if (toDelete) {
      void removeAsset(toDelete.id);
      setToDelete(null);
    }
  };

  return (
    <div>
      <PageHeader
        title={CATEGORY_LABELS[category]}
        subtitle={description}
        action={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus size={18} /> Ajouter
          </button>
        }
      />

      <div className="mb-6 card flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total {CATEGORY_LABELS[category].toLowerCase()}
          </p>
          <p className={`text-2xl font-bold ${valueColorClass(total)}`}>
            {formatCurrency(total)}
          </p>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {rows.length} ligne{rows.length > 1 ? 's' : ''}
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Inbox size={32} />}
          title="Aucune ligne pour le moment"
          description="Ajoutez votre première ligne pour commencer le suivi."
          action={
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus size={18} /> Ajouter une ligne
            </button>
          }
        />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                <th className="px-4 py-3 font-medium">Libellé</th>
                <th className="px-4 py-3 font-medium">Détail</th>
                {showGain && (
                  <th className="px-4 py-3 text-right font-medium">
                    +/- value
                  </th>
                )}
                <th className="px-4 py-3 text-right font-medium">Valeur</th>
                <th className="px-4 py-3 font-medium">Mise à jour</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((asset) => {
                const value = assetValue(asset);
                const subtype = assetSubtype(asset);
                const detail = assetDetail(asset);
                const ticker = assetTicker(asset);
                const gain = unrealizedGain(asset);
                return (
                  <tr
                    key={asset.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{asset.label}</span>
                        <div className="flex flex-wrap items-center gap-1">
                          {subtype && <Badge>{subtype}</Badge>}
                          {ticker && (
                            <span className="text-xs text-slate-400">
                              {ticker}
                            </span>
                          )}
                        </div>
                        {asset.note && (
                          <span className="text-xs italic text-slate-400">
                            {asset.note}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {detail ?? '—'}
                    </td>
                    {showGain && (
                      <td
                        className={`px-4 py-3 text-right font-medium ${valueColorClass(
                          gain,
                        )}`}
                      >
                        {hasGain(asset) ? formatSignedCurrency(gain) : '—'}
                      </td>
                    )}
                    <td
                      className={`px-4 py-3 text-right font-semibold ${valueColorClass(
                        value,
                      )}`}
                    >
                      {formatCurrency(value)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {formatDate(asset.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(asset)}
                          aria-label="Modifier"
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setToDelete(asset)}
                          aria-label="Supprimer"
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AssetFormModal
        open={formOpen}
        category={category}
        asset={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title="Supprimer cette ligne ?"
        message={
          toDelete
            ? `« ${toDelete.label} » sera définitivement supprimée. Cette action est irréversible.`
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
