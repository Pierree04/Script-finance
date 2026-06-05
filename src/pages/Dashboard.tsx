import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  allocationPercent,
  assetValue,
  categoryTotals,
  netWorth,
  totalAssets,
  totalInvestedCostBasis,
  totalInvestedGain,
  totalLiabilities,
} from '../lib/calculations';
import {
  formatCurrency,
  formatPercent,
  formatSignedCurrency,
  formatSignedPercent,
} from '../lib/format';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
} from '../lib/constants';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/misc';
import { valueColorClass } from '../lib/colors';
import {
  DonutAllocation,
  type AllocationDatum,
} from '../components/charts/DonutAllocation';
import type { Asset, AssetCategory } from '../types';

const CATEGORY_LINKS: Record<AssetCategory, string> = {
  liquidites: '/liquidites',
  bourse: '/bourse',
  crypto: '/crypto',
  assurance_vie: '/assurance-vie',
  retraite: '/retraite',
  immobilier: '/immobilier',
  autres: '/autres',
  passifs: '/passifs',
};

interface TopLine {
  asset: Asset;
  value: number;
}

export default function Dashboard() {
  const assets = useStore((s) => s.assets);

  const stats = useMemo(() => {
    const totals = categoryTotals(assets);
    const grossAssets = totalAssets(assets);
    const liabilities = totalLiabilities(assets);
    const net = netWorth(assets);
    const investedGain = totalInvestedGain(assets);
    const investedCost = totalInvestedCostBasis(assets);
    const investedGainPercent = allocationPercent(investedGain, investedCost);

    // Allocation : catégories d'actifs (positives) rapportées au total brut.
    const allocation: AllocationDatum[] = CATEGORY_ORDER.filter(
      (c) => c !== 'passifs',
    )
      .map((c) => ({
        key: c,
        label: CATEGORY_LABELS[c],
        value: totals[c],
        color: CATEGORY_COLORS[c],
        percent: allocationPercent(totals[c], grossAssets),
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);

    // Top des lignes par montant (valeur absolue, tous types confondus).
    const top: TopLine[] = [...assets]
      .map((a) => ({ asset: a, value: assetValue(a) }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 6);

    return {
      totals,
      grossAssets,
      liabilities,
      net,
      investedGain,
      investedGainPercent,
      allocation,
      top,
    };
  }, [assets]);

  if (assets.length === 0) {
    return (
      <div>
        <PageHeader title="Tableau de bord" />
        <EmptyState
          icon={<Wallet size={32} />}
          title="Votre patrimoine est vide"
          description="Ajoutez des lignes dans les différentes catégories, ou chargez le jeu de données d’exemple depuis les Réglages."
          action={
            <Link to="/reglages" className="btn-primary">
              Aller aux Réglages
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d’ensemble de votre patrimoine."
      />

      {/* Cartes de synthèse */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Patrimoine net
          </p>
          <p
            className={`mt-1 text-2xl font-bold ${valueColorClass(stats.net)}`}
          >
            {formatCurrency(stats.net)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total des actifs
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(stats.grossAssets)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total des passifs
          </p>
          <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.liabilities > 0
              ? `− ${formatCurrency(stats.liabilities)}`
              : formatCurrency(0)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            +/- value latente (investi)
          </p>
          <p
            className={`mt-1 flex items-center gap-1 text-2xl font-bold ${valueColorClass(
              stats.investedGain,
            )}`}
          >
            {stats.investedGain >= 0 ? (
              <TrendingUp size={20} />
            ) : (
              <TrendingDown size={20} />
            )}
            {formatSignedCurrency(stats.investedGain)}
          </p>
          <p
            className={`mt-0.5 text-xs ${valueColorClass(stats.investedGain)}`}
          >
            {formatSignedPercent(stats.investedGainPercent)} sur Bourse + Crypto
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Donut + table d'allocation */}
        <div className="card lg:col-span-3">
          <h2 className="mb-4 text-lg font-semibold">Répartition des actifs</h2>
          {stats.allocation.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">
              Aucun actif positif à répartir.
            </p>
          ) : (
            <div className="grid items-center gap-4 sm:grid-cols-2">
              <DonutAllocation data={stats.allocation} />
              <div className="space-y-1">
                {stats.allocation.map((d) => (
                  <div
                    key={d.key}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: d.color }}
                      />
                      {d.label}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-medium">
                        {formatCurrency(d.value)}
                      </span>
                      <span className="w-14 text-right text-slate-400">
                        {formatPercent(d.percent)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top lignes */}
        <div className="card lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Top des lignes</h2>
          {stats.top.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune ligne.</p>
          ) : (
            <ul className="space-y-2">
              {stats.top.map(({ asset, value }) => (
                <li
                  key={asset.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: CATEGORY_COLORS[asset.category],
                      }}
                    />
                    <span className="truncate">{asset.label}</span>
                  </span>
                  <span className={`font-medium ${valueColorClass(value)}`}>
                    {formatCurrency(value)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Cartes par catégorie */}
      <h2 className="mb-3 mt-8 text-lg font-semibold">Par catégorie</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORY_ORDER.map((c) => {
          const value = stats.totals[c];
          return (
            <Link
              key={c}
              to={CATEGORY_LINKS[c]}
              className="card transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[c] }}
                />
                {value >= 0 ? (
                  <ArrowUpRight size={16} className="text-slate-300" />
                ) : (
                  <ArrowDownRight size={16} className="text-slate-300" />
                )}
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {CATEGORY_LABELS[c]}
              </p>
              <p className={`text-lg font-bold ${valueColorClass(value)}`}>
                {formatCurrency(value)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
