// ============================================================================
// Store Zustand : état global + actions. Source de vérité = IndexedDB.
// Le store garde une copie en mémoire et synchronise chaque mutation.
// ============================================================================

import { create } from 'zustand';
import type {
  Asset,
  AssetCategory,
  CryptoAsset,
  Settings,
  Snapshot,
  StockAsset,
} from '../types';
import {
  dbClearAll,
  dbDeleteAsset,
  dbDeleteSnapshot,
  dbGetAllAssets,
  dbGetAllSnapshots,
  dbGetSettings,
  dbPutAsset,
  dbPutSettings,
  dbPutSnapshot,
  dbReplaceAll,
} from '../lib/db';
import {
  categoryTotals,
  netWorth,
  totalAssets,
  totalLiabilities,
} from '../lib/calculations';
import { buildBackup, parseBackup, serializeBackup } from '../lib/backup';
import { buildSampleAssets, buildSampleSnapshots } from '../lib/sampleData';
import { fetchPriceInEur, MarketDataError } from '../lib/marketData';

const DEFAULT_SETTINGS: Settings = { theme: 'light', currency: '€' };

/** Génère un identifiant unique (fallback si crypto.randomUUID indisponible). */
function genId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Données nécessaires pour créer une ligne (id + updatedAt générés ici). */
export type NewAsset = Omit<Asset, 'id' | 'updatedAt'> & { id?: string };

export interface ImportResult {
  ok: boolean;
  error?: string;
}

/** Bilan d'un rafraîchissement des cours de marché. */
export interface RefreshResult {
  updated: number;
  errors: number;
  /** Premier message d'erreur rencontré (pour informer l'utilisateur). */
  firstError?: string;
}

interface StoreState {
  assets: Asset[];
  snapshots: Snapshot[];
  settings: Settings;
  loaded: boolean;

  // Initialisation
  init: () => Promise<void>;

  // Thème
  setTheme: (theme: Settings['theme']) => Promise<void>;
  toggleTheme: () => Promise<void>;

  // Lignes
  addAsset: (data: NewAsset) => Promise<void>;
  updateAsset: (asset: Asset) => Promise<void>;
  removeAsset: (id: string) => Promise<void>;

  // Snapshots
  takeSnapshot: () => Promise<void>;
  removeSnapshot: (id: string) => Promise<void>;

  // Données
  exportJSON: () => string;
  importJSON: (raw: string) => Promise<ImportResult>;
  loadSample: () => Promise<void>;
  resetAll: () => Promise<void>;

  // Cours de marché
  setApiKey: (key: string) => Promise<void>;
  refreshQuotes: () => Promise<RefreshResult>;
}

/** Lignes dont le cours peut être récupéré automatiquement. */
function isAutoQuotable(asset: Asset): asset is StockAsset | CryptoAsset {
  return (
    (asset.category === 'bourse' || asset.category === 'crypto') &&
    asset.priceSource === 'auto' &&
    Boolean(asset.linkedSymbol)
  );
}

/** Applique la classe de thème sur <html>. */
function applyThemeClass(theme: Settings['theme']): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export const useStore = create<StoreState>((set, get) => ({
  assets: [],
  snapshots: [],
  settings: DEFAULT_SETTINGS,
  loaded: false,

  init: async () => {
    const [assets, snapshots, settings] = await Promise.all([
      dbGetAllAssets(),
      dbGetAllSnapshots(),
      dbGetSettings(),
    ]);
    const resolvedSettings = settings ?? DEFAULT_SETTINGS;
    applyThemeClass(resolvedSettings.theme);
    set({
      assets,
      snapshots: snapshots.sort((a, b) => a.date.localeCompare(b.date)),
      settings: resolvedSettings,
      loaded: true,
    });

    // Rafraîchissement automatique des cours à l'ouverture (non bloquant).
    if (resolvedSettings.marketApiKey) {
      void get().refreshQuotes();
    }
  },

  setTheme: async (theme) => {
    const settings: Settings = { ...get().settings, theme };
    applyThemeClass(theme);
    set({ settings });
    await dbPutSettings(settings);
  },

  toggleTheme: async () => {
    const next = get().settings.theme === 'dark' ? 'light' : 'dark';
    await get().setTheme(next);
  },

  addAsset: async (data) => {
    const asset = {
      ...data,
      id: data.id ?? genId(),
      updatedAt: new Date().toISOString(),
    } as Asset;
    await dbPutAsset(asset);
    set({ assets: [...get().assets, asset] });
  },

  updateAsset: async (asset) => {
    const updated: Asset = { ...asset, updatedAt: new Date().toISOString() };
    await dbPutAsset(updated);
    set({
      assets: get().assets.map((a) => (a.id === updated.id ? updated : a)),
    });
  },

  removeAsset: async (id) => {
    await dbDeleteAsset(id);
    set({ assets: get().assets.filter((a) => a.id !== id) });
  },

  takeSnapshot: async () => {
    const { assets } = get();
    const snapshot: Snapshot = {
      id: genId(),
      date: new Date().toISOString(),
      netWorth: netWorth(assets),
      totalAssets: totalAssets(assets),
      totalLiabilities: totalLiabilities(assets),
      categoryTotals: categoryTotals(assets) as Record<AssetCategory, number>,
    };
    await dbPutSnapshot(snapshot);
    set({
      snapshots: [...get().snapshots, snapshot].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    });
  },

  removeSnapshot: async (id) => {
    await dbDeleteSnapshot(id);
    set({ snapshots: get().snapshots.filter((s) => s.id !== id) });
  },

  exportJSON: () => {
    const { assets, snapshots } = get();
    return serializeBackup(buildBackup(assets, snapshots));
  },

  importJSON: async (raw) => {
    const result = parseBackup(raw);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    await dbReplaceAll(result.data.assets, result.data.snapshots);
    set({
      assets: result.data.assets,
      snapshots: result.data.snapshots.sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    });
    return { ok: true };
  },

  loadSample: async () => {
    const assets = buildSampleAssets();
    const snapshots = buildSampleSnapshots();
    await dbReplaceAll(assets, snapshots);
    set({
      assets,
      snapshots: snapshots.sort((a, b) => a.date.localeCompare(b.date)),
    });
  },

  resetAll: async () => {
    await dbClearAll();
    set({ assets: [], snapshots: [] });
  },

  setApiKey: async (key) => {
    const trimmed = key.trim();
    const settings: Settings = {
      ...get().settings,
      marketApiKey: trimmed === '' ? undefined : trimmed,
    };
    set({ settings });
    await dbPutSettings(settings);
  },

  refreshQuotes: async () => {
    const apiKey = get().settings.marketApiKey;
    if (!apiKey) {
      return {
        updated: 0,
        errors: 0,
        firstError: 'Aucune clé d’API configurée (voir Réglages).',
      };
    }

    // Lignes liées à un instrument et en mode automatique.
    const linked = get().assets.filter(isAutoQuotable);

    if (linked.length === 0) {
      return { updated: 0, errors: 0 };
    }

    const fxCache = new Map<string, number>();
    const now = new Date().toISOString();
    const updates = new Map<string, Asset>();
    let errors = 0;
    let firstError: string | undefined;

    for (const asset of linked) {
      try {
        const { priceEur, currency } = await fetchPriceInEur(
          {
            linkedSymbol: asset.linkedSymbol,
            exchange: asset.exchange,
            micCode: asset.micCode,
          },
          apiKey,
          fxCache,
        );
        updates.set(asset.id, {
          ...asset,
          currentPrice: Math.round(priceEur * 100) / 100,
          quoteCurrency: currency,
          lastQuoteAt: now,
        });
      } catch (err) {
        errors += 1;
        if (!firstError) {
          firstError =
            err instanceof MarketDataError
              ? err.message
              : 'Erreur lors de la récupération d’un cours.';
        }
      }
    }

    if (updates.size > 0) {
      for (const asset of updates.values()) {
        await dbPutAsset(asset);
      }
      set({
        assets: get().assets.map((a) => updates.get(a.id) ?? a),
      });
    }

    return { updated: updates.size, errors, firstError };
  },
}));
