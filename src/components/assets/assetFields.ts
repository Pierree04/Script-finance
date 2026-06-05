// ============================================================================
// Description déclarative des champs de chaque catégorie.
// Pilote à la fois le rendu du formulaire et sa validation (source unique).
// ============================================================================

import type { AssetCategory } from '../../types';
import {
  CASH_ACCOUNT_LABELS,
  LIABILITY_LABELS,
  REAL_ESTATE_LABELS,
  STOCK_ENVELOPE_LABELS,
} from '../../lib/constants';

export type FieldType = 'text' | 'number' | 'select' | 'textarea';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Pour les nombres : valeur minimale autorisée (par défaut 0). */
  min?: number;
  suffix?: string;
  hint?: string;
  placeholder?: string;
  options?: FieldOption[];
  /** Valeur par défaut pour un select. */
  defaultValue?: string;
}

function toOptions(record: Record<string, string>): FieldOption[] {
  return Object.entries(record).map(([value, label]) => ({ value, label }));
}

const LABEL_FIELD: FieldDef = {
  name: 'label',
  label: 'Libellé',
  type: 'text',
  required: true,
  placeholder: 'Ex : Livret A, ETF World...',
};

const NOTE_FIELD: FieldDef = {
  name: 'note',
  label: 'Note (optionnel)',
  type: 'textarea',
  placeholder: 'Remarque libre',
};

/** Champs spécifiques (hors libellé / note) par catégorie. */
export const CATEGORY_FIELDS: Record<AssetCategory, FieldDef[]> = {
  liquidites: [
    LABEL_FIELD,
    {
      name: 'accountType',
      label: 'Type de compte',
      type: 'select',
      options: toOptions(CASH_ACCOUNT_LABELS),
      defaultValue: 'compte_courant',
    },
    {
      name: 'amount',
      label: 'Montant',
      type: 'number',
      required: true,
      suffix: '€',
    },
    NOTE_FIELD,
  ],
  bourse: [
    LABEL_FIELD,
    {
      name: 'envelope',
      label: 'Enveloppe',
      type: 'select',
      options: toOptions(STOCK_ENVELOPE_LABELS),
      defaultValue: 'pea',
    },
    {
      name: 'tickerOrIsin',
      label: 'Ticker / ISIN (optionnel)',
      type: 'text',
      placeholder: 'Ex : CW8, IE00B4L5Y983',
    },
    { name: 'quantity', label: 'Quantité', type: 'number', required: true },
    {
      name: 'pru',
      label: 'Prix de revient unitaire (PRU)',
      type: 'number',
      required: true,
      suffix: '€',
    },
    {
      name: 'currentPrice',
      label: 'Cours actuel',
      type: 'number',
      required: true,
      suffix: '€',
    },
    NOTE_FIELD,
  ],
  crypto: [
    LABEL_FIELD,
    {
      name: 'tickerOrIsin',
      label: 'Symbole (optionnel)',
      type: 'text',
      placeholder: 'Ex : BTC, ETH',
    },
    { name: 'quantity', label: 'Quantité', type: 'number', required: true },
    {
      name: 'avgBuyPrice',
      label: 'Prix d’achat moyen',
      type: 'number',
      required: true,
      suffix: '€',
    },
    {
      name: 'currentPrice',
      label: 'Cours actuel',
      type: 'number',
      required: true,
      suffix: '€',
    },
    NOTE_FIELD,
  ],
  assurance_vie: [
    LABEL_FIELD,
    { name: 'insurer', label: 'Assureur', type: 'text', required: true },
    {
      name: 'euroFundAmount',
      label: 'Montant fonds euros',
      type: 'number',
      required: true,
      suffix: '€',
    },
    {
      name: 'unitLinkedAmount',
      label: 'Montant unités de compte',
      type: 'number',
      required: true,
      suffix: '€',
    },
    NOTE_FIELD,
  ],
  retraite: [
    LABEL_FIELD,
    { name: 'insurer', label: 'Gestionnaire (optionnel)', type: 'text' },
    {
      name: 'amount',
      label: 'Montant',
      type: 'number',
      required: true,
      suffix: '€',
    },
    NOTE_FIELD,
  ],
  immobilier: [
    LABEL_FIELD,
    {
      name: 'propertyType',
      label: 'Type de bien',
      type: 'select',
      options: toOptions(REAL_ESTATE_LABELS),
      defaultValue: 'residence_principale',
    },
    {
      name: 'estimatedValue',
      label: 'Valeur estimée',
      type: 'number',
      required: true,
      suffix: '€',
    },
    {
      name: 'remainingLoan',
      label: 'Crédit restant dû',
      type: 'number',
      required: true,
      suffix: '€',
      hint: 'Mettre 0 si le bien n’a pas de crédit.',
    },
    NOTE_FIELD,
  ],
  autres: [
    LABEL_FIELD,
    {
      name: 'amount',
      label: 'Valeur estimée',
      type: 'number',
      required: true,
      suffix: '€',
    },
    NOTE_FIELD,
  ],
  passifs: [
    LABEL_FIELD,
    {
      name: 'liabilityType',
      label: 'Type de dette',
      type: 'select',
      options: toOptions(LIABILITY_LABELS),
      defaultValue: 'credit_conso',
    },
    {
      name: 'amount',
      label: 'Montant restant dû',
      type: 'number',
      required: true,
      suffix: '€',
    },
    NOTE_FIELD,
  ],
};
