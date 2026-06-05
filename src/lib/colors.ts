// ============================================================================
// Helpers de style liés aux valeurs financières (couleurs cohérentes).
// ============================================================================

/** Classe de couleur cohérente et accessible selon le signe d'un montant. */
export function valueColorClass(value: number): string {
  if (value > 0) return 'text-emerald-600 dark:text-emerald-400';
  if (value < 0) return 'text-red-600 dark:text-red-400';
  return 'text-slate-500 dark:text-slate-400';
}
