import type { Asset } from '../../types';
import {
  CASH_ACCOUNT_LABELS,
  LIABILITY_LABELS,
  REAL_ESTATE_LABELS,
  STOCK_ENVELOPE_LABELS,
} from '../../lib/constants';
import { formatCurrencyCents, formatNumber } from '../../lib/format';

/** Sous-libellé (badge) décrivant le type précis de la ligne. */
export function assetSubtype(asset: Asset): string | null {
  switch (asset.category) {
    case 'liquidites':
      return CASH_ACCOUNT_LABELS[asset.accountType];
    case 'bourse':
      return STOCK_ENVELOPE_LABELS[asset.envelope];
    case 'immobilier':
      return REAL_ESTATE_LABELS[asset.propertyType];
    case 'passifs':
      return LIABILITY_LABELS[asset.liabilityType];
    case 'assurance_vie':
      return asset.insurer || null;
    case 'retraite':
      return asset.insurer || null;
    default:
      return null;
  }
}

/** Détail chiffré secondaire d'une ligne (quantité × cours, répartition...). */
export function assetDetail(asset: Asset): string | null {
  switch (asset.category) {
    case 'bourse':
      return `${formatNumber(asset.quantity)} × ${formatCurrencyCents(
        asset.currentPrice,
      )} (PRU ${formatCurrencyCents(asset.pru)})`;
    case 'crypto':
      return `${formatNumber(asset.quantity)} × ${formatCurrencyCents(
        asset.currentPrice,
      )} (achat ${formatCurrencyCents(asset.avgBuyPrice)})`;
    case 'assurance_vie':
      return `Fonds € : ${formatCurrencyCents(
        asset.euroFundAmount,
      )} · UC : ${formatCurrencyCents(asset.unitLinkedAmount)}`;
    case 'immobilier':
      return asset.remainingLoan > 0
        ? `Valeur ${formatCurrencyCents(
            asset.estimatedValue,
          )} − crédit ${formatCurrencyCents(asset.remainingLoan)}`
        : `Valeur ${formatCurrencyCents(asset.estimatedValue)}`;
    default:
      return null;
  }
}

/** Vrai si la catégorie expose une plus/moins-value latente. */
export function hasGain(asset: Asset): boolean {
  return asset.category === 'bourse' || asset.category === 'crypto';
}

/** Ticker / ISIN éventuel (Bourse, Crypto uniquement). */
export function assetTicker(asset: Asset): string | null {
  if (asset.category === 'bourse' || asset.category === 'crypto') {
    return asset.tickerOrIsin ?? null;
  }
  return null;
}
