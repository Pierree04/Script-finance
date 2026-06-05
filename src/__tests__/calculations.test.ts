import { describe, it, expect } from 'vitest';
import type {
  Asset,
  CashAsset,
  CryptoAsset,
  LiabilityAsset,
  LifeInsuranceAsset,
  RealEstateAsset,
  StockAsset,
} from '../types';
import {
  allocationPercent,
  assetCostBasis,
  assetValue,
  categoryTotals,
  netWorth,
  safeNumber,
  totalAssets,
  totalInvestedGain,
  totalLiabilities,
  unrealizedGain,
} from '../lib/calculations';

const base = { id: '1', updatedAt: '2026-01-01T00:00:00.000Z' };

const cash: CashAsset = {
  ...base,
  id: 'cash',
  category: 'liquidites',
  label: 'Livret A',
  accountType: 'livret_a',
  amount: 10000,
};

const stock: StockAsset = {
  ...base,
  id: 'stock',
  category: 'bourse',
  label: 'ETF World',
  envelope: 'pea',
  quantity: 10,
  pru: 80,
  currentPrice: 100,
};

const crypto: CryptoAsset = {
  ...base,
  id: 'crypto',
  category: 'crypto',
  label: 'BTC',
  quantity: 2,
  avgBuyPrice: 30000,
  currentPrice: 25000,
};

const realEstate: RealEstateAsset = {
  ...base,
  id: 're',
  category: 'immobilier',
  label: 'Appartement',
  propertyType: 'residence_principale',
  estimatedValue: 300000,
  remainingLoan: 120000,
};

const lifeInsurance: LifeInsuranceAsset = {
  ...base,
  id: 'av',
  category: 'assurance_vie',
  label: 'Contrat',
  insurer: 'Assureur',
  euroFundAmount: 5000,
  unitLinkedAmount: 3000,
};

const liability: LiabilityAsset = {
  ...base,
  id: 'debt',
  category: 'passifs',
  label: 'Crédit auto',
  liabilityType: 'credit_conso',
  amount: 5000,
};

describe('safeNumber', () => {
  it('renvoie 0 pour les valeurs non finies', () => {
    expect(safeNumber(NaN)).toBe(0);
    expect(safeNumber(Infinity)).toBe(0);
    expect(safeNumber(undefined)).toBe(0);
    expect(safeNumber(null)).toBe(0);
    expect(safeNumber(42)).toBe(42);
  });
});

describe('assetValue', () => {
  it('liquidités = montant', () => {
    expect(assetValue(cash)).toBe(10000);
  });
  it('bourse = quantité × cours', () => {
    expect(assetValue(stock)).toBe(1000);
  });
  it('crypto = quantité × cours', () => {
    expect(assetValue(crypto)).toBe(50000);
  });
  it('immobilier = valeur − crédit', () => {
    expect(assetValue(realEstate)).toBe(180000);
  });
  it('assurance-vie = fonds euros + UC', () => {
    expect(assetValue(lifeInsurance)).toBe(8000);
  });
  it('passif = montant négatif', () => {
    expect(assetValue(liability)).toBe(-5000);
  });
});

describe('plus/moins-value latente', () => {
  it('plus-value bourse', () => {
    expect(unrealizedGain(stock)).toBe(200); // (100-80)*10
  });
  it('moins-value crypto', () => {
    expect(unrealizedGain(crypto)).toBe(-10000); // (25000-30000)*2
  });
  it('cost basis bourse', () => {
    expect(assetCostBasis(stock)).toBe(800);
  });
  it('aucune plus-value hors investi', () => {
    expect(unrealizedGain(cash)).toBe(0);
    expect(unrealizedGain(realEstate)).toBe(0);
  });
  it('plus-value globale investie = bourse + crypto', () => {
    expect(totalInvestedGain([stock, crypto, cash])).toBe(-9800);
  });
});

describe('agrégats patrimoine', () => {
  const all: Asset[] = [
    cash,
    stock,
    crypto,
    realEstate,
    lifeInsurance,
    liability,
  ];

  it('total actifs', () => {
    // 10000 + 1000 + 50000 + 180000 + 8000
    expect(totalAssets(all)).toBe(249000);
  });
  it('total passifs (positif)', () => {
    expect(totalLiabilities(all)).toBe(5000);
  });
  it('patrimoine net = actifs − passifs', () => {
    expect(netWorth(all)).toBe(244000);
  });
  it('totaux par catégorie', () => {
    const t = categoryTotals(all);
    expect(t.liquidites).toBe(10000);
    expect(t.bourse).toBe(1000);
    expect(t.crypto).toBe(50000);
    expect(t.immobilier).toBe(180000);
    expect(t.assurance_vie).toBe(8000);
    expect(t.passifs).toBe(-5000);
    expect(t.retraite).toBe(0);
    expect(t.autres).toBe(0);
  });
});

describe('cas limites', () => {
  it('liste vide', () => {
    expect(totalAssets([])).toBe(0);
    expect(netWorth([])).toBe(0);
    expect(totalLiabilities([])).toBe(0);
  });
  it('allocationPercent gère la division par zéro', () => {
    expect(allocationPercent(100, 0)).toBe(0);
    expect(allocationPercent(0, 0)).toBe(0);
    expect(allocationPercent(25, 100)).toBe(25);
  });
  it('valeurs NaN dans une ligne ne cassent pas le total', () => {
    const broken: StockAsset = {
      ...stock,
      quantity: NaN,
      currentPrice: NaN,
    };
    expect(assetValue(broken)).toBe(0);
    expect(netWorth([broken])).toBe(0);
  });
});
