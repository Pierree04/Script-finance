// ============================================================================
// Parsing tolérant des saisies numériques à la française.
// Accepte la virgule ou le point comme séparateur décimal, ignore les espaces
// (y compris insécables) utilisés comme séparateurs de milliers.
// ============================================================================

/**
 * Convertit une chaîne saisie en nombre.
 * Renvoie null si la chaîne est vide ou non numérique.
 */
export function parseDecimal(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  // \s couvre aussi les espaces insécables : on les retire tous, puis on
  // normalise la virgule décimale en point.
  const normalized = trimmed.replace(/\s/g, '').replace(',', '.');
  if (!/^-?\d*\.?\d+$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** Convertit en formant un nombre par défaut (0) si invalide. */
export function parseDecimalOr(raw: string, fallback = 0): number {
  const v = parseDecimal(raw);
  return v === null ? fallback : v;
}
