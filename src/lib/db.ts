// ============================================================================
// Couche de persistance locale via IndexedDB (librairie idb).
// Trois magasins : assets, snapshots, settings (clé/valeur).
// Aucune donnée ne quitte le navigateur.
// ============================================================================

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Asset, Settings, Snapshot } from '../types';

const DB_NAME = 'script-finance';
const DB_VERSION = 1;

interface FinanceDB extends DBSchema {
  assets: {
    key: string;
    value: Asset;
  };
  snapshots: {
    key: string;
    value: Snapshot;
  };
  settings: {
    key: string;
    value: Settings;
  };
}

const SETTINGS_KEY = 'app';

let dbPromise: Promise<IDBPDatabase<FinanceDB>> | null = null;

function getDB(): Promise<IDBPDatabase<FinanceDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FinanceDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('assets')) {
          db.createObjectStore('assets', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('snapshots')) {
          db.createObjectStore('snapshots', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

// ----------------------------- Assets --------------------------------------

export async function dbGetAllAssets(): Promise<Asset[]> {
  const db = await getDB();
  return db.getAll('assets');
}

export async function dbPutAsset(asset: Asset): Promise<void> {
  const db = await getDB();
  await db.put('assets', asset);
}

export async function dbDeleteAsset(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('assets', id);
}

// ---------------------------- Snapshots ------------------------------------

export async function dbGetAllSnapshots(): Promise<Snapshot[]> {
  const db = await getDB();
  return db.getAll('snapshots');
}

export async function dbPutSnapshot(snapshot: Snapshot): Promise<void> {
  const db = await getDB();
  await db.put('snapshots', snapshot);
}

export async function dbDeleteSnapshot(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('snapshots', id);
}

// ----------------------------- Settings ------------------------------------

export async function dbGetSettings(): Promise<Settings | undefined> {
  const db = await getDB();
  return db.get('settings', SETTINGS_KEY);
}

export async function dbPutSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, SETTINGS_KEY);
}

// --------------------------- Opérations en masse ---------------------------

/** Remplace intégralement le contenu (utilisé à l'import et au chargement démo). */
export async function dbReplaceAll(
  assets: Asset[],
  snapshots: Snapshot[],
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['assets', 'snapshots'], 'readwrite');
  await tx.objectStore('assets').clear();
  await tx.objectStore('snapshots').clear();
  for (const asset of assets) {
    await tx.objectStore('assets').put(asset);
  }
  for (const snapshot of snapshots) {
    await tx.objectStore('snapshots').put(snapshot);
  }
  await tx.done;
}

/** Efface toutes les lignes et snapshots (réinitialisation). */
export async function dbClearAll(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['assets', 'snapshots'], 'readwrite');
  await tx.objectStore('assets').clear();
  await tx.objectStore('snapshots').clear();
  await tx.done;
}
