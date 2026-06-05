// ============================================================================
// Fonctions de calcul financier PURES.
// Implémentées une seule fois ici, réutilisées partout (pas de duplication).
// Toutes les fonctions sont robustes aux valeurs manquantes / NaN.
// ============================================================================

import type { Asset, AssetCategory } from '../types';
import { CATEGORY_ORDER } from './constants';

/**
 * Convertit une valeur potentiellement invalide en nombre fini.
 * Garantit qu'aucun calcul ne propage NaN / Infinity.
 */
export function safeNumber(value: number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  return Number.isFinite(value) ? value : 0;
}

/**
 * Valeur NETTE d'une ligne, exprimée du point de vue du patrimoine :
 * - actifs : valeur positive ;
 * - immobilier : valeur estimée − crédit restant dû ;
 * - passifs : valeur négative (le montant saisi est positif).
 */
export function assetValue(asset: Asset): number {
  switch (asset.category) {
    case 'liquidites':
    case 'autres':
    case 'retraite':
      return safeNumber(asset.amount);
    case 'bourse':
      return safeNumber(asset.quantity) * safeNumber(asset.currentPrice);
    case 'crypto':
      return safeNumber(asset.quantity) * safeNumber(asset.currentPrice);
    case 'assurance_vie':
      return (
        safeNumber(asset.euroFundAmount) + safeNumber(asset.unitLinkedAmount)
      );
    case 'immobilier':
      return safeNumber(asset.estimatedValue) - safeNumber(asset.remainingLoan);
    case 'passifs':
      return -safeNumber(asset.amount);
  }
}

/**
 * Base de coût d'un investissement (Bourse / Crypto) : quantité × prix d'achat.
 * Renvoie 0 pour les autres catégories (non investies au sens PRU).
 */
export function assetCostBasis(asset: Asset): number {
  switch (asset.category) {
    case 'bourse':
      return safeNumber(asset.quantity) * safeNumber(asset.pru);
    case 'crypto':
      return safeNumber(asset.quantity) * safeNumber(asset.avgBuyPrice);
    default:
      return 0;
  }
}

/**
 * Plus / moins-value latente d'une ligne investie :
 * (cours actuel − prix d'achat) × quantité.
 * Renvoie 0 pour les catégories non concernées.
 */
export function unrealizedGain(asset: Asset): number {
  if (asset.category === 'bourse' || asset.category === 'crypto') {
    return assetValue(asset) - assetCostBasis(asset);
  }
  return 0;
}

/** Indique si une ligne est un passif. */
export function isLiability(asset: Asset): boolean {
  return asset.category === 'passifs';
}

/** Somme des actifs bruts (toutes catégories sauf passifs, valeur ≥ 0 comptée). */
export function totalAssets(assets: Asset[]): number {
  return assets
    .filter((a) => !isLiability(a))
    .reduce((sum, a) => sum + assetValue(a), 0);
}

/** Somme des passifs, renvoyée en valeur POSITIVE (montant total des dettes). */
export function totalLiabilities(assets: Asset[]): number {
  return assets
    .filter(isLiability)
    .reduce((sum, a) => sum + safeNumber((a as { amount: number }).amount), 0);
}

/** Patrimoine net = total actifs − total passifs. */
export function netWorth(assets: Asset[]): number {
  return totalAssets(assets) - totalLiabilities(assets);
}

/**
 * Total (valeur nette) par catégorie. Pour les passifs, renvoie une valeur
 * négative (cohérent avec assetValue).
 */
export function categoryTotals(assets: Asset[]): Record<AssetCategory, number> {
  const totals = Object.fromEntries(
    CATEGORY_ORDER.map((c) => [c, 0]),
  ) as Record<AssetCategory, number>;

  for (const asset of assets) {
    totals[asset.category] += assetValue(asset);
  }
  return totals;
}

/**
 * Pourcentage d'allocation d'un montant rapporté à un total.
 * Gère la division par zéro (renvoie 0). Résultat borné à [0, +∞[.
 */
export function allocationPercent(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total === 0) {
    return 0;
  }
  return (part / total) * 100;
}

/**
 * Plus / moins-value latente GLOBALE sur la partie investie (Bourse + Crypto).
 */
export function totalInvestedGain(assets: Asset[]): number {
  return assets.reduce((sum, a) => sum + unrealizedGain(a), 0);
}

/** Base de coût globale investie (Bourse + Crypto), pour le rendement %. */
export function totalInvestedCostBasis(assets: Asset[]): number {
  return assets.reduce((sum, a) => sum + assetCostBasis(a), 0);
}

/** Valeur de marché globale investie (Bourse + Crypto). */
export function totalInvestedValue(assets: Asset[]): number {
  return assets
    .filter((a) => a.category === 'bourse' || a.category === 'crypto')
    .reduce((sum, a) => sum + assetValue(a), 0);
}
