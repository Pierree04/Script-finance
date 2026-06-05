import type {
  AssetCategory,
  CashAccountType,
  LiabilityType,
  RealEstateType,
  StockEnvelope,
} from '../types';

/** Ordre d'affichage stable des catégories. */
export const CATEGORY_ORDER: AssetCategory[] = [
  'liquidites',
  'bourse',
  'crypto',
  'assurance_vie',
  'retraite',
  'immobilier',
  'autres',
  'passifs',
];

/** Libellés français des catégories. */
export const CATEGORY_LABELS: Record<AssetCategory, string> = {
  liquidites: 'Liquidités',
  bourse: 'Bourse',
  crypto: 'Crypto',
  assurance_vie: 'Assurance-vie',
  retraite: 'Épargne retraite',
  immobilier: 'Immobilier',
  autres: 'Autres actifs',
  passifs: 'Passifs / Dettes',
};

/** Couleurs associées à chaque catégorie (donut, badges). Accessibles. */
export const CATEGORY_COLORS: Record<AssetCategory, string> = {
  liquidites: '#0ea5e9',
  bourse: '#6366f1',
  crypto: '#f59e0b',
  assurance_vie: '#10b981',
  retraite: '#14b8a6',
  immobilier: '#8b5cf6',
  autres: '#64748b',
  passifs: '#ef4444',
};

export const CASH_ACCOUNT_LABELS: Record<CashAccountType, string> = {
  compte_courant: 'Compte courant',
  livret_a: 'Livret A',
  ldds: 'LDDS',
  lep: 'LEP',
  csl: 'Compte sur livret',
  autre: 'Autre',
};

export const STOCK_ENVELOPE_LABELS: Record<StockEnvelope, string> = {
  pea: 'PEA',
  pea_pme: 'PEA-PME',
  cto: 'Compte-titres (CTO)',
};

export const REAL_ESTATE_LABELS: Record<RealEstateType, string> = {
  residence_principale: 'Résidence principale',
  locatif: 'Locatif',
  scpi: 'SCPI',
};

export const LIABILITY_LABELS: Record<LiabilityType, string> = {
  credit_conso: 'Crédit conso',
  pret_perso: 'Prêt personnel',
  autre: 'Autre',
};
