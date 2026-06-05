// ============================================================================
// Modèle de données de l'application de suivi de patrimoine.
// Toutes les structures persistées (IndexedDB) et échangées (export/import)
// sont décrites ici. Aucune donnée ne quitte la machine.
// ============================================================================

/** Catégories d'actifs (et de passifs) gérées par l'application. */
export type AssetCategory =
  | 'liquidites'
  | 'bourse'
  | 'crypto'
  | 'assurance_vie'
  | 'retraite'
  | 'immobilier'
  | 'autres'
  | 'passifs';

/** Champs communs à toute ligne saisie. */
export interface BaseAsset {
  /** Identifiant unique (crypto.randomUUID). */
  id: string;
  category: AssetCategory;
  /** Libellé affiché (obligatoire). */
  label: string;
  /** Note libre optionnelle. */
  note?: string;
  /** Date ISO de dernière mise à jour. */
  updatedAt: string;
}

/** Types de comptes de liquidités (contexte français). */
export type CashAccountType =
  | 'compte_courant'
  | 'livret_a'
  | 'ldds'
  | 'lep'
  | 'csl'
  | 'autre';

/** Liquidités : montant simple. */
export interface CashAsset extends BaseAsset {
  category: 'liquidites';
  accountType: CashAccountType;
  amount: number;
}

/** Enveloppe boursière. */
export type StockEnvelope = 'pea' | 'pea_pme' | 'cto';

/** Bourse : une ligne = un titre (action ou ETF). */
export interface StockAsset extends BaseAsset {
  category: 'bourse';
  envelope: StockEnvelope;
  tickerOrIsin?: string;
  quantity: number;
  /** Prix de revient unitaire. */
  pru: number;
  /** Cours actuel saisi manuellement. */
  currentPrice: number;
}

/** Crypto-monnaie. */
export interface CryptoAsset extends BaseAsset {
  category: 'crypto';
  tickerOrIsin?: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
}

/** Assurance-vie : fonds euros + unités de compte. */
export interface LifeInsuranceAsset extends BaseAsset {
  category: 'assurance_vie';
  insurer: string;
  euroFundAmount: number;
  unitLinkedAmount: number;
}

/** Épargne retraite (PER). */
export interface RetirementAsset extends BaseAsset {
  category: 'retraite';
  insurer?: string;
  amount: number;
}

/** Type de bien immobilier. */
export type RealEstateType = 'residence_principale' | 'locatif' | 'scpi';

/** Immobilier : valeur nette = valeur estimée − crédit restant dû. */
export interface RealEstateAsset extends BaseAsset {
  category: 'immobilier';
  propertyType: RealEstateType;
  estimatedValue: number;
  remainingLoan: number;
}

/** Autres actifs : métaux, objets de valeur, parts de société... */
export interface OtherAsset extends BaseAsset {
  category: 'autres';
  amount: number;
}

/** Type de passif (hors crédit immobilier rattaché à un bien). */
export type LiabilityType = 'credit_conso' | 'pret_perso' | 'autre';

/** Passif / dette : le montant est saisi positif, il diminue le patrimoine. */
export interface LiabilityAsset extends BaseAsset {
  category: 'passifs';
  liabilityType: LiabilityType;
  /** Montant restant dû, saisi en valeur positive. */
  amount: number;
}

/** Union discriminée de toutes les lignes possibles. */
export type Asset =
  | CashAsset
  | StockAsset
  | CryptoAsset
  | LifeInsuranceAsset
  | RetirementAsset
  | RealEstateAsset
  | OtherAsset
  | LiabilityAsset;

/**
 * Instantané du patrimoine à une date donnée.
 * On archive le patrimoine net ET le détail par catégorie pour pouvoir
 * reconstituer la répartition figée à cette date.
 */
export interface Snapshot {
  id: string;
  /** Date ISO du figeage. */
  date: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  /** Total (valeur nette) de chaque catégorie au moment du figeage. */
  categoryTotals: Record<AssetCategory, number>;
}

/** Préférences utilisateur. */
export interface Settings {
  theme: 'light' | 'dark';
  currency: string;
}

/** Format du fichier d'export / import (sauvegarde complète). */
export interface BackupFile {
  version: 1;
  exportedAt: string;
  assets: Asset[];
  snapshots: Snapshot[];
}
