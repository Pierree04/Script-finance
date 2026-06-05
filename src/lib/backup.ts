// ============================================================================
// Export / import des données en JSON, avec validation stricte du format.
// L'aller-retour export -> import doit être sans perte de données.
// ============================================================================

import type { Asset, AssetCategory, BackupFile, Snapshot } from '../types';
import { CATEGORY_ORDER } from './constants';

const VALID_CATEGORIES = new Set<AssetCategory>(CATEGORY_ORDER);

/** Résultat d'une tentative de parsing/validation d'un fichier de sauvegarde. */
export type ParseResult =
  | { ok: true; data: BackupFile }
  | { ok: false; error: string };

/** Construit l'objet de sauvegarde à partir des données courantes. */
export function buildBackup(
  assets: Asset[],
  snapshots: Snapshot[],
): BackupFile {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    assets,
    snapshots,
  };
}

/** Sérialise la sauvegarde en chaîne JSON indentée. */
export function serializeBackup(backup: BackupFile): string {
  return JSON.stringify(backup, null, 2);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/** Valide qu'une valeur a bien la forme d'un Asset connu. */
function validateAsset(value: unknown, index: number): string | null {
  if (!isObject(value)) return `Actif #${index + 1} : objet attendu.`;
  if (!isNonEmptyString(value.id))
    return `Actif #${index + 1} : "id" manquant.`;
  if (!isNonEmptyString(value.label)) {
    return `Actif #${index + 1} : "label" manquant.`;
  }
  if (
    typeof value.category !== 'string' ||
    !VALID_CATEGORIES.has(value.category as AssetCategory)
  ) {
    return `Actif #${index + 1} : catégorie inconnue "${String(value.category)}".`;
  }
  if (!isNonEmptyString(value.updatedAt)) {
    return `Actif #${index + 1} : "updatedAt" manquant.`;
  }
  return null;
}

/** Valide qu'une valeur a bien la forme d'un Snapshot. */
function validateSnapshot(value: unknown, index: number): string | null {
  if (!isObject(value)) return `Snapshot #${index + 1} : objet attendu.`;
  if (!isNonEmptyString(value.id)) {
    return `Snapshot #${index + 1} : "id" manquant.`;
  }
  if (!isNonEmptyString(value.date)) {
    return `Snapshot #${index + 1} : "date" manquante.`;
  }
  if (!isFiniteNumber(value.netWorth)) {
    return `Snapshot #${index + 1} : "netWorth" invalide.`;
  }
  return null;
}

/**
 * Parse et valide une chaîne JSON en BackupFile.
 * Renvoie un résultat discriminé (ok/erreur) avec un message explicite.
 */
export function parseBackup(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Le fichier n’est pas un JSON valide.' };
  }

  if (!isObject(parsed)) {
    return { ok: false, error: 'Le contenu du fichier est invalide.' };
  }

  if (parsed.version !== 1) {
    return {
      ok: false,
      error: `Version de sauvegarde non prise en charge (attendu : 1, reçu : ${String(
        parsed.version,
      )}).`,
    };
  }

  if (!Array.isArray(parsed.assets)) {
    return { ok: false, error: 'Le champ "assets" doit être une liste.' };
  }
  if (!Array.isArray(parsed.snapshots)) {
    return { ok: false, error: 'Le champ "snapshots" doit être une liste.' };
  }

  for (let i = 0; i < parsed.assets.length; i++) {
    const err = validateAsset(parsed.assets[i], i);
    if (err) return { ok: false, error: err };
  }
  for (let i = 0; i < parsed.snapshots.length; i++) {
    const err = validateSnapshot(parsed.snapshots[i], i);
    if (err) return { ok: false, error: err };
  }

  return {
    ok: true,
    data: {
      version: 1,
      exportedAt: isNonEmptyString(parsed.exportedAt)
        ? parsed.exportedAt
        : new Date().toISOString(),
      assets: parsed.assets as Asset[],
      snapshots: parsed.snapshots as Snapshot[],
    },
  };
}
