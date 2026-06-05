import { describe, it, expect } from 'vitest';
import type { Asset, Snapshot } from '../types';
import { buildBackup, parseBackup, serializeBackup } from '../lib/backup';

const assets: Asset[] = [
  {
    id: 'a1',
    category: 'liquidites',
    label: 'Compte courant',
    accountType: 'compte_courant',
    amount: 2500,
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'a2',
    category: 'bourse',
    label: 'ETF World',
    envelope: 'pea',
    quantity: 12,
    pru: 75.5,
    currentPrice: 92.3,
    tickerOrIsin: 'IWDA',
    updatedAt: '2026-02-01T00:00:00.000Z',
    note: 'Achat régulier',
  },
];

const snapshots: Snapshot[] = [
  {
    id: 's1',
    date: '2026-03-01T00:00:00.000Z',
    netWorth: 100000,
    totalAssets: 105000,
    totalLiabilities: 5000,
    categoryTotals: {
      liquidites: 2500,
      bourse: 1107.6,
      crypto: 0,
      assurance_vie: 0,
      retraite: 0,
      immobilier: 0,
      autres: 0,
      passifs: -5000,
    },
  },
];

describe('aller-retour export / import', () => {
  it('sérialise puis re-parse sans perte de données', () => {
    const backup = buildBackup(assets, snapshots);
    const json = serializeBackup(backup);
    const result = parseBackup(json);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.assets).toEqual(assets);
      expect(result.data.snapshots).toEqual(snapshots);
      expect(result.data.version).toBe(1);
    }
  });
});

describe('validation du format à l’import', () => {
  it('rejette un JSON malformé', () => {
    const r = parseBackup('{ ceci n’est pas du json');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/JSON/);
  });

  it('rejette une version non prise en charge', () => {
    const r = parseBackup(
      JSON.stringify({ version: 2, assets: [], snapshots: [] }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/[Vv]ersion/);
  });

  it('rejette un champ assets non-liste', () => {
    const r = parseBackup(
      JSON.stringify({ version: 1, assets: {}, snapshots: [] }),
    );
    expect(r.ok).toBe(false);
  });

  it('rejette un actif sans catégorie valide', () => {
    const r = parseBackup(
      JSON.stringify({
        version: 1,
        assets: [{ id: 'x', label: 'X', category: 'inconnu', updatedAt: 'z' }],
        snapshots: [],
      }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/catégorie/);
  });

  it('rejette un actif sans label', () => {
    const r = parseBackup(
      JSON.stringify({
        version: 1,
        assets: [{ id: 'x', category: 'liquidites', updatedAt: 'z' }],
        snapshots: [],
      }),
    );
    expect(r.ok).toBe(false);
  });

  it('accepte des listes vides', () => {
    const r = parseBackup(
      JSON.stringify({ version: 1, assets: [], snapshots: [] }),
    );
    expect(r.ok).toBe(true);
  });
});
