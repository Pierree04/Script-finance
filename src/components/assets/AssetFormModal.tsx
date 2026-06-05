import { useEffect, useMemo, useState } from 'react';
import type {
  Asset,
  AssetCategory,
  CashAccountType,
  LiabilityType,
  RealEstateType,
  StockEnvelope,
} from '../../types';
import { Modal } from '../ui/Modal';
import {
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from '../ui/FormFields';
import { CATEGORY_LABELS } from '../../lib/constants';
import { parseDecimal, parseDecimalOr } from '../../lib/parse';
import { CATEGORY_FIELDS, type FieldDef } from './assetFields';
import type { NewAsset } from '../../store/useStore';

type Values = Record<string, string>;
type Errors = Record<string, string>;

interface AssetFormModalProps {
  open: boolean;
  category: AssetCategory;
  /** Ligne à éditer, ou null pour une création. */
  asset: Asset | null;
  onClose: () => void;
  onSubmit: (asset: Asset | NewAsset) => void;
}

/** Construit l'état initial du formulaire (champ -> chaîne). */
function initialValues(category: AssetCategory, asset: Asset | null): Values {
  const values: Values = {};
  for (const field of CATEGORY_FIELDS[category]) {
    if (asset) {
      const raw = (asset as unknown as Record<string, unknown>)[field.name];
      values[field.name] = raw === undefined || raw === null ? '' : String(raw);
    } else {
      values[field.name] = field.defaultValue ?? '';
    }
  }
  return values;
}

/** Valide un champ unique, renvoie un message d'erreur ou undefined. */
function validateField(field: FieldDef, raw: string): string | undefined {
  const value = raw.trim();
  if (field.type === 'number') {
    if (value === '') {
      return field.required ? 'Ce champ est obligatoire.' : undefined;
    }
    const parsed = parseDecimal(value);
    if (parsed === null) return 'Saisir un nombre valide.';
    const min = field.min ?? 0;
    if (parsed < min) {
      return min === 0
        ? 'La valeur ne peut pas être négative.'
        : `La valeur doit être ≥ ${min}.`;
    }
    return undefined;
  }
  if (field.required && value === '') {
    return 'Ce champ est obligatoire.';
  }
  return undefined;
}

/** Assemble l'objet Asset typé à partir des valeurs validées. */
function buildAsset(
  category: AssetCategory,
  values: Values,
  asset: Asset | null,
): Asset | NewAsset {
  const num = (name: string): number => parseDecimalOr(values[name]);
  const str = (name: string): string => values[name].trim();
  const note = str('note') === '' ? undefined : str('note');
  const idPart = asset ? { id: asset.id } : {};

  switch (category) {
    case 'liquidites':
      return {
        ...idPart,
        category,
        label: str('label'),
        accountType: values.accountType as CashAccountType,
        amount: num('amount'),
        note,
        updatedAt: '',
      };
    case 'bourse':
      return {
        ...idPart,
        category,
        label: str('label'),
        envelope: values.envelope as StockEnvelope,
        tickerOrIsin: str('tickerOrIsin') || undefined,
        quantity: num('quantity'),
        pru: num('pru'),
        currentPrice: num('currentPrice'),
        note,
        updatedAt: '',
      };
    case 'crypto':
      return {
        ...idPart,
        category,
        label: str('label'),
        tickerOrIsin: str('tickerOrIsin') || undefined,
        quantity: num('quantity'),
        avgBuyPrice: num('avgBuyPrice'),
        currentPrice: num('currentPrice'),
        note,
        updatedAt: '',
      };
    case 'assurance_vie':
      return {
        ...idPart,
        category,
        label: str('label'),
        insurer: str('insurer'),
        euroFundAmount: num('euroFundAmount'),
        unitLinkedAmount: num('unitLinkedAmount'),
        note,
        updatedAt: '',
      };
    case 'retraite':
      return {
        ...idPart,
        category,
        label: str('label'),
        insurer: str('insurer') || undefined,
        amount: num('amount'),
        note,
        updatedAt: '',
      };
    case 'immobilier':
      return {
        ...idPart,
        category,
        label: str('label'),
        propertyType: values.propertyType as RealEstateType,
        estimatedValue: num('estimatedValue'),
        remainingLoan: num('remainingLoan'),
        note,
        updatedAt: '',
      };
    case 'autres':
      return {
        ...idPart,
        category,
        label: str('label'),
        amount: num('amount'),
        note,
        updatedAt: '',
      };
    case 'passifs':
      return {
        ...idPart,
        category,
        label: str('label'),
        liabilityType: values.liabilityType as LiabilityType,
        amount: num('amount'),
        note,
        updatedAt: '',
      };
  }
}

/** Formulaire modal d'ajout / édition d'une ligne, piloté par CATEGORY_FIELDS. */
export function AssetFormModal({
  open,
  category,
  asset,
  onClose,
  onSubmit,
}: AssetFormModalProps) {
  const fields = useMemo(() => CATEGORY_FIELDS[category], [category]);
  const [values, setValues] = useState<Values>(() =>
    initialValues(category, asset),
  );
  const [errors, setErrors] = useState<Errors>({});

  // Réinitialise le formulaire à chaque ouverture / changement de cible.
  useEffect(() => {
    if (open) {
      setValues(initialValues(category, asset));
      setErrors({});
    }
  }, [open, category, asset]);

  const setValue = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = () => {
    const nextErrors: Errors = {};
    for (const field of fields) {
      const err = validateField(field, values[field.name] ?? '');
      if (err) nextErrors[field.name] = err;
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    onSubmit(buildAsset(category, values, asset));
  };

  return (
    <Modal
      open={open}
      title={`${asset ? 'Modifier' : 'Ajouter'} — ${CATEGORY_LABELS[category]}`}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-4"
      >
        {fields.map((field) => {
          const value = values[field.name] ?? '';
          const error = errors[field.name];
          if (field.type === 'select') {
            return (
              <SelectField
                key={field.name}
                label={field.label}
                value={value}
                options={field.options ?? []}
                onChange={(v) => setValue(field.name, v)}
                required={field.required}
                error={error}
              />
            );
          }
          if (field.type === 'number') {
            return (
              <NumberField
                key={field.name}
                label={field.label}
                value={value}
                onChange={(v) => setValue(field.name, v)}
                required={field.required}
                error={error}
                suffix={field.suffix}
                hint={field.hint}
                placeholder={field.placeholder}
              />
            );
          }
          if (field.type === 'textarea') {
            return (
              <TextAreaField
                key={field.name}
                label={field.label}
                value={value}
                onChange={(v) => setValue(field.name, v)}
                placeholder={field.placeholder}
              />
            );
          }
          return (
            <TextField
              key={field.name}
              label={field.label}
              value={value}
              onChange={(v) => setValue(field.name, v)}
              required={field.required}
              error={error}
              hint={field.hint}
              placeholder={field.placeholder}
            />
          );
        })}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="btn-primary">
            {asset ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
