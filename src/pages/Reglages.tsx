import { useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  FlaskConical,
  Loader2,
  Moon,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/ui/PageHeader';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { MarketDataError, validateApiKey } from '../lib/marketData';

type Feedback = { type: 'success' | 'error'; text: string } | null;

export default function Reglages() {
  const theme = useStore((s) => s.settings.theme);
  const setTheme = useStore((s) => s.setTheme);
  const exportJSON = useStore((s) => s.exportJSON);
  const importJSON = useStore((s) => s.importJSON);
  const loadSample = useStore((s) => s.loadSample);
  const resetAll = useStore((s) => s.resetAll);
  const assets = useStore((s) => s.assets);
  const snapshots = useStore((s) => s.snapshots);

  const marketApiKey = useStore((s) => s.settings.marketApiKey);
  const setApiKey = useStore((s) => s.setApiKey);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [keyInput, setKeyInput] = useState(marketApiKey ?? '');
  const [keyBusy, setKeyBusy] = useState(false);
  const [keyStatus, setKeyStatus] = useState<Feedback>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const [confirmSample, setConfirmSample] = useState(false);
  const [pendingImport, setPendingImport] = useState<string | null>(null);

  const hasData = assets.length > 0 || snapshots.length > 0;

  const handleExport = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `script-finance-sauvegarde-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedback({ type: 'success', text: 'Sauvegarde exportée avec succès.' });
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Réinitialise l'input pour pouvoir réimporter le même fichier ensuite.
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPendingImport(String(reader.result ?? ''));
      setConfirmImport(true);
    };
    reader.onerror = () => {
      setFeedback({ type: 'error', text: 'Impossible de lire le fichier.' });
    };
    reader.readAsText(file);
  };

  const confirmDoImport = async () => {
    setConfirmImport(false);
    if (pendingImport === null) return;
    const result = await importJSON(pendingImport);
    setPendingImport(null);
    if (result.ok) {
      setFeedback({ type: 'success', text: 'Données importées avec succès.' });
    } else {
      setFeedback({
        type: 'error',
        text: `Import impossible : ${result.error ?? 'fichier invalide.'}`,
      });
    }
  };

  const confirmDoSample = async () => {
    setConfirmSample(false);
    await loadSample();
    setFeedback({
      type: 'success',
      text: 'Jeu de données d’exemple chargé.',
    });
  };

  const handleSaveKey = async () => {
    const trimmed = keyInput.trim();
    if (trimmed === '') {
      setKeyStatus({ type: 'error', text: 'Saisissez une clé d’API.' });
      return;
    }
    setKeyBusy(true);
    setKeyStatus(null);
    try {
      await validateApiKey(trimmed);
      await setApiKey(trimmed);
      setKeyStatus({
        type: 'success',
        text: 'Clé valide et enregistrée. Les cours se mettront à jour.',
      });
    } catch (err) {
      setKeyStatus({
        type: 'error',
        text:
          err instanceof MarketDataError
            ? err.message
            : 'Impossible de vérifier la clé.',
      });
    } finally {
      setKeyBusy(false);
    }
  };

  const handleRemoveKey = async () => {
    await setApiKey('');
    setKeyInput('');
    setKeyStatus({ type: 'success', text: 'Clé supprimée.' });
  };

  const confirmDoReset = async () => {
    setConfirmReset(false);
    await resetAll();
    setFeedback({
      type: 'success',
      text: 'Toutes les données ont été effacées.',
    });
  };

  return (
    <div>
      <PageHeader
        title="Réglages"
        subtitle="Apparence, sauvegarde, restauration et gestion des données."
      />

      {feedback && (
        <div
          className={`mb-6 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Apparence */}
        <section className="card">
          <h2 className="mb-1 text-lg font-semibold">Apparence</h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Choisissez le thème. La préférence est mémorisée localement.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void setTheme('light')}
              className={theme === 'light' ? 'btn-primary' : 'btn-secondary'}
            >
              <Sun size={18} /> Clair
            </button>
            <button
              type="button"
              onClick={() => void setTheme('dark')}
              className={theme === 'dark' ? 'btn-primary' : 'btn-secondary'}
            >
              <Moon size={18} /> Sombre
            </button>
          </div>
        </section>

        {/* Cours en direct (marchés) */}
        <section className="card">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
            <Activity size={18} className="text-brand-600" />
            Cours en direct (marchés financiers)
          </h2>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            Reliez vos lignes Bourse et Crypto à un instrument coté pour mettre
            à jour leur cours automatiquement (cours différés, convertis en
            euros). Collez ci-dessous votre clé d’API gratuite. Elle est stockée
            uniquement sur cet appareil ; seuls les symboles (ex. « LVMH ») sont
            envoyés, jamais vos montants.
          </p>
          <a
            href="https://twelvedata.com/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
          >
            Obtenir une clé gratuite (Twelve Data)
            <ExternalLink size={14} />
          </a>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="password"
              className="input-base"
              placeholder="Collez votre clé d’API ici"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              autoComplete="off"
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-primary whitespace-nowrap"
                onClick={() => void handleSaveKey()}
                disabled={keyBusy}
              >
                {keyBusy ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Vérifier et enregistrer
              </button>
              {marketApiKey && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => void handleRemoveKey()}
                  disabled={keyBusy}
                >
                  Retirer
                </button>
              )}
            </div>
          </div>

          {keyStatus && (
            <p
              className={`mt-2 text-sm ${
                keyStatus.type === 'success'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-500'
              }`}
            >
              {keyStatus.text}
            </p>
          )}
          {marketApiKey && !keyStatus && (
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
              Une clé est configurée. Le bouton « Rafraîchir » est disponible en
              haut de l’écran.
            </p>
          )}
        </section>

        {/* Sauvegarde / restauration */}
        <section className="card">
          <h2 className="mb-1 text-lg font-semibold">
            Sauvegarde et restauration
          </h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Exportez toutes vos données dans un fichier JSON, ou restaurez une
            sauvegarde. L’import remplace l’intégralité des données actuelles.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleExport}
            >
              <Download size={18} /> Exporter (JSON)
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} /> Importer (JSON)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleFileSelected}
            />
          </div>
        </section>

        {/* Données d'exemple */}
        <section className="card">
          <h2 className="mb-1 text-lg font-semibold">Données d’exemple</h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Chargez un jeu de données de démonstration pour tester
            l’application. Il remplace les données actuelles et peut être effacé
            avec la réinitialisation.
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setConfirmSample(true)}
          >
            <FlaskConical size={18} /> Charger les données d’exemple
          </button>
        </section>

        {/* Zone dangereuse */}
        <section className="card border-red-200 dark:border-red-900/60">
          <h2 className="mb-1 text-lg font-semibold text-red-600 dark:text-red-400">
            Réinitialisation
          </h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Efface définitivement toutes les lignes et tous les instantanés
            stockés sur cet appareil. Pensez à exporter une sauvegarde avant.
          </p>
          <button
            type="button"
            className="btn-danger"
            onClick={() => setConfirmReset(true)}
            disabled={!hasData}
          >
            <Trash2 size={18} /> Tout réinitialiser
          </button>
        </section>
      </div>

      <ConfirmDialog
        open={confirmImport}
        title="Importer cette sauvegarde ?"
        message="Les données actuelles seront entièrement remplacées par le contenu du fichier. Cette action est irréversible."
        confirmLabel="Importer"
        danger
        onConfirm={() => void confirmDoImport()}
        onCancel={() => {
          setConfirmImport(false);
          setPendingImport(null);
        }}
      />

      <ConfirmDialog
        open={confirmSample}
        title="Charger les données d’exemple ?"
        message="Les données actuelles seront remplacées par le jeu de démonstration."
        confirmLabel="Charger"
        onConfirm={() => void confirmDoSample()}
        onCancel={() => setConfirmSample(false)}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Tout réinitialiser ?"
        message="Toutes vos données (lignes et instantanés) seront définitivement effacées de cet appareil."
        confirmLabel="Tout effacer"
        danger
        onConfirm={() => void confirmDoReset()}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
