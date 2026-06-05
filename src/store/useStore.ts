// ============================================================================
// Store Zustand : état global + actions. Source de vérité = IndexedDB.
// Le store garde une copie en mémoire et synchronise chaque mutation.
// ============================================================================

import { create } from 'zustand';
import type { Asset, AssetCategory, Settings, Snapshot } from '../types';
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
}));
