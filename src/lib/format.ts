// ============================================================================
// Formatage à la française : montants en euros, nombres, pourcentages, dates.
// Séparateur de milliers = espace, décimale = virgule, dates = JJ/MM/AAAA.
// ============================================================================

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const currencyFormatterCents = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 8,
});

const percentFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function clean(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

/** Montant en euros, sans décimales (ex: 12 345 €). */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(clean(value));
}

/** Montant en euros avec centimes (ex: 12 345,67 €). */
export function formatCurrencyCents(value: number): string {
  return currencyFormatterCents.format(clean(value));
}

/**
 * Montant signé avec préfixe explicite (+ / −) pour les plus/moins-values.
 * Ex: +1 250 €, −340 €.
 */
export function formatSignedCurrency(value: number): string {
  const v = clean(value);
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${sign}${currencyFormatter.format(Math.abs(v))}`;
}

/** Nombre brut (quantités, cours), jusqu'à 8 décimales. */
export function formatNumber(value: number): string {
  return numberFormatter.format(clean(value));
}

/** Pourcentage à une décimale (ex: 12,5 %). */
export function formatPercent(value: number): string {
  return `${percentFormatter.format(clean(value))} %`;
}

/** Pourcentage signé (ex: +12,5 %, −3,2 %). */
export function formatSignedPercent(value: number): string {
  const v = clean(value);
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${sign}${percentFormatter.format(Math.abs(v))} %`;
}

/** Date au format JJ/MM/AAAA à partir d'une chaîne ISO. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Date + heure au format français (pour les exports). */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
