import { useEffect, useMemo, useRef, useState } from 'react';
import { Link2, Loader2, X } from 'lucide-react';
import type {
  Asset,
  AssetCategory,
  CashAccountType,
  LiabilityType,
  QuoteLink,
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
import { SymbolSearchField } from './SymbolSearchField';
import { useStore, type NewAsset } from '../../store/useStore';
import {
  fetchPriceInEur,
  MarketDataError,
  type SymbolResult,
} from '../../lib/marketData';

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
  link: QuoteLink,
): Asset | NewAsset {
  const num = (name: string): number => parseDecimalOr(values[name]);
  const str = (name: string): string => values[name].trim();
  const note = str('note') === '' ? undefined : str('note');
  const idPart = asset ? { id: asset.id } : {};

  switch (category) {
    case 'bourse':
      return {
        ...idPart,
        ...link,
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
        ...link,
        category,
        label: str('label'),
        tickerOrIsin: str('tickerOrIsin') || undefined,
        quantity: num('quantity'),
        avgBuyPrice: num('avgBuyPrice'),
        currentPrice: num('currentPrice'),
        note,
        updatedAt: '',
      };
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

/** Extrait le lien de cours d'une ligne existante (Bourse / Crypto). */
function initialLink(asset: Asset | null): QuoteLink {
  if (asset && (asset.category === 'bourse' || asset.category === 'crypto')) {
    return {
      linkedSymbol: asset.linkedSymbol,
      exchange: asset.exchange,
      micCode: asset.micCode,
      quoteCurrency: asset.quoteCurrency,
      priceSource: asset.priceSource ?? 'manual',
      lastQuoteAt: asset.lastQuoteAt,
    };
  }
  return { priceSource: 'manual' };
}

/** Formulaire modal d'ajout / édition d'une ligne, piloté par CATEGORY_FIELDS. */
export function AssetFormModal({
  open,
  category,
  asset,
  onClose,
  onSubmit,
}: AssetFormModalProps) {
  const apiKey = useStore((s) => s.settings.marketApiKey);
  const fields = useMemo(() => CATEGORY_FIELDS[category], [category]);
  const quotable = category === 'bourse' || category === 'crypto';

  const [values, setValues] = useState<Values>(() =>
    initialValues(category, asset),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [link, setLink] = useState<QuoteLink>(() => initialLink(asset));
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const fxCache = useRef<Map<string, number>>(new Map());

  // Réinitialise le formulaire à chaque ouverture / changement de cible.
  useEffect(() => {
    if (open) {
      setValues(initialValues(category, asset));
      setErrors({});
      setLink(initialLink(asset));
      setLinking(false);
      setLinkError(null);
      fxCache.current = new Map();
    }
  }, [open, category, asset]);

  const isLinked = link.priceSource === 'auto' && Boolean(link.linkedSymbol);

  // Sélection d'un instrument : on lie la ligne et on récupère son cours.
  const handleSelectSymbol = async (result: SymbolResult) => {
    setLink({
      linkedSymbol: result.symbol,
      exchange: result.exchange || undefined,
      micCode: result.micCode || undefined,
      quoteCurrency: result.currency || undefined,
      priceSource: 'auto',
      lastQuoteAt: undefined,
    });
    // Pré-remplit le libellé et le symbole si vides.
    if (values.label.trim() === '') setValue('label', result.name);
    if ((values.tickerOrIsin ?? '').trim() === '') {
      setValue('tickerOrIsin', result.symbol);
    }

    if (!apiKey) return;
    setLinking(true);
    setLinkError(null);
    try {
      const { priceEur, currency } = await fetchPriceInEur(
        {
          linkedSymbol: result.symbol,
          exchange: result.exchange || undefined,
          micCode: result.micCode || undefined,
        },
        apiKey,
        fxCache.current,
      );
      setValue('currentPrice', String(Math.round(priceEur * 100) / 100));
      setLink((prev) => ({
        ...prev,
        quoteCurrency: currency || prev.quoteCurrency,
        lastQuoteAt: new Date().toISOString(),
      }));
    } catch (err) {
      setLinkError(
        err instanceof MarketDataError
          ? err.message
          : 'Récupération du cours impossible.',
      );
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = () => {
    setLink({
      linkedSymbol: undefined,
      exchange: undefined,
      micCode: undefined,
      quoteCurrency: undefined,
      priceSource: 'manual',
      lastQuoteAt: undefined,
    });
    setLinkError(null);
  };

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
    onSubmit(buildAsset(category, values, asset, link));
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
        {quotable && !isLinked && (
          <SymbolSearchField
            label="Suivre un cours automatiquement (optionnel)"
            cryptoOnly={category === 'crypto'}
            onSelect={(r) => void handleSelectSymbol(r)}
          />
        )}

        {quotable && isLinked && (
          <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 dark:border-brand-900/60 dark:bg-brand-950/30">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Link2 size={16} className="text-brand-600" />
                <span>
                  Cours automatique lié à{' '}
                  <span className="font-semibold">{link.linkedSymbol}</span>
                  {link.quoteCurrency && (
                    <span className="text-slate-500 dark:text-slate-400">
                      {' '}
                      ({link.quoteCurrency})
                    </span>
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={handleUnlink}
                className="rounded p-1 text-slate-500 hover:bg-white/60 hover:text-red-600 dark:hover:bg-slate-800"
                aria-label="Supprimer le lien et repasser en saisie manuelle"
                title="Repasser en saisie manuelle"
              >
                <X size={16} />
              </button>
            </div>
            {linking && (
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <Loader2 size={12} className="animate-spin" /> Récupération du
                cours…
              </p>
            )}
            {linkError && (
              <p className="mt-1 text-xs text-red-500">{linkError}</p>
            )}
            {!linking && !linkError && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Le cours ci-dessous est mis à jour automatiquement (converti en
                euros) à l’ouverture de l’application et via le bouton «
                Rafraîchir ».
              </p>
            )}
          </div>
        )}

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
