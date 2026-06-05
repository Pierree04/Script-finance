// ============================================================================
// Jeu de données de DÉMONSTRATION (clairement étiqueté).
// Chargeable en un clic depuis les Réglages, effaçable proprement.
// ============================================================================

import type { Asset, Snapshot } from '../types';

/** Préfixe d'id pour repérer/effacer facilement les données d'exemple. */
export const SAMPLE_PREFIX = 'sample-';

function iso(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

export function buildSampleAssets(): Asset[] {
  return [
    {
      id: `${SAMPLE_PREFIX}cash-1`,
      category: 'liquidites',
      label: 'Compte courant',
      accountType: 'compte_courant',
      amount: 4200,
      updatedAt: iso(2),
      note: 'Exemple',
    },
    {
      id: `${SAMPLE_PREFIX}cash-2`,
      category: 'liquidites',
      label: 'Livret A',
      accountType: 'livret_a',
      amount: 12000,
      updatedAt: iso(2),
    },
    {
      id: `${SAMPLE_PREFIX}stock-1`,
      category: 'bourse',
      label: 'ETF MSCI World',
      envelope: 'pea',
      tickerOrIsin: 'IE00B4L5Y983',
      quantity: 45,
      pru: 78.4,
      currentPrice: 96.2,
      updatedAt: iso(1),
    },
    {
      id: `${SAMPLE_PREFIX}stock-2`,
      category: 'bourse',
      label: 'Air Liquide',
      envelope: 'pea',
      tickerOrIsin: 'FR0000120073',
      quantity: 20,
      pru: 145,
      currentPrice: 168.5,
      updatedAt: iso(1),
    },
    {
      id: `${SAMPLE_PREFIX}crypto-1`,
      category: 'crypto',
      label: 'Bitcoin',
      tickerOrIsin: 'BTC',
      quantity: 0.35,
      avgBuyPrice: 38000,
      currentPrice: 52000,
      updatedAt: iso(1),
    },
    {
      id: `${SAMPLE_PREFIX}crypto-2`,
      category: 'crypto',
      label: 'Ethereum',
      tickerOrIsin: 'ETH',
      quantity: 3,
      avgBuyPrice: 2800,
      currentPrice: 2400,
      updatedAt: iso(1),
    },
    {
      id: `${SAMPLE_PREFIX}av-1`,
      category: 'assurance_vie',
      label: 'Assurance-vie Linxea',
      insurer: 'Linxea / Spirica',
      euroFundAmount: 15000,
      unitLinkedAmount: 22000,
      updatedAt: iso(5),
    },
    {
      id: `${SAMPLE_PREFIX}per-1`,
      category: 'retraite',
      label: 'PER individuel',
      insurer: 'Yomoni',
      amount: 9500,
      updatedAt: iso(5),
    },
    {
      id: `${SAMPLE_PREFIX}re-1`,
      category: 'immobilier',
      label: 'Résidence principale',
      propertyType: 'residence_principale',
      estimatedValue: 320000,
      remainingLoan: 185000,
      updatedAt: iso(10),
    },
    {
      id: `${SAMPLE_PREFIX}re-2`,
      category: 'immobilier',
      label: 'Parts SCPI',
      propertyType: 'scpi',
      estimatedValue: 25000,
      remainingLoan: 0,
      updatedAt: iso(10),
    },
    {
      id: `${SAMPLE_PREFIX}other-1`,
      category: 'autres',
      label: 'Or physique (pièces)',
      amount: 6000,
      updatedAt: iso(20),
    },
    {
      id: `${SAMPLE_PREFIX}debt-1`,
      category: 'passifs',
      label: 'Crédit auto',
      liabilityType: 'credit_conso',
      amount: 7800,
      updatedAt: iso(3),
    },
  ];
}

export function buildSampleSnapshots(): Snapshot[] {
  // Quelques points d'évolution cohérents pour illustrer la courbe.
  const points: Array<{ daysAgo: number; net: number }> = [
    { daysAgo: 180, net: 198000 },
    { daysAgo: 150, net: 205000 },
    { daysAgo: 120, net: 211000 },
    { daysAgo: 90, net: 219500 },
    { daysAgo: 60, net: 228000 },
    { daysAgo: 30, net: 234000 },
  ];

  return points.map((p, i) => ({
    id: `${SAMPLE_PREFIX}snap-${i}`,
    date: iso(p.daysAgo),
    netWorth: p.net,
    totalAssets: p.net + 8000,
    totalLiabilities: 8000,
    categoryTotals: {
      liquidites: 16000,
      bourse: 5000,
      crypto: 8000,
      assurance_vie: 37000,
      retraite: 9500,
      immobilier: 160000,
      autres: 6000,
      passifs: -8000,
    },
  }));
}
