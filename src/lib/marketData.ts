// ============================================================================
// Accès aux données de marché via Twelve Data (https://twelvedata.com).
// - Recherche d'instruments (autocomplétion).
// - Récupération du cours d'un instrument + conversion en euros.
// Seul le symbole est envoyé au fournisseur ; jamais les quantités/montants.
// La clé d'API est fournie par l'utilisateur et stockée localement.
// ============================================================================

const BASE_URL = 'https://api.twelvedata.com';

/** Résultat de recherche d'un instrument coté. */
export interface SymbolResult {
  symbol: string;
  name: string;
  exchange: string;
  micCode: string;
  currency: string;
  type: string;
  country: string;
}

/** Cours d'un instrument exprimé dans sa devise de cotation. */
export interface QuoteResult {
  price: number;
  currency: string;
}

/** Lien minimal nécessaire pour interroger un cours. */
export interface QuoteQuery {
  linkedSymbol?: string;
  exchange?: string;
  micCode?: string;
}

/** Erreur métier renvoyée par le fournisseur (clé invalide, quota, etc.). */
export class MarketDataError extends Error {}

interface TwelveErrorShape {
  status?: string;
  code?: number;
  message?: string;
}

function isErrorPayload(json: unknown): json is TwelveErrorShape {
  return (
    typeof json === 'object' &&
    json !== null &&
    (json as TwelveErrorShape).status === 'error'
  );
}

/** Traduit les erreurs fournisseur les plus courantes en messages clairs. */
function friendlyError(payload: TwelveErrorShape): MarketDataError {
  const code = payload.code;
  if (code === 401 || code === 403) {
    return new MarketDataError('Clé d’API invalide ou non autorisée.');
  }
  if (code === 429) {
    return new MarketDataError(
      'Limite de requêtes atteinte (réessayez dans une minute).',
    );
  }
  if (code === 404) {
    return new MarketDataError('Instrument introuvable.');
  }
  return new MarketDataError(
    payload.message ?? 'Erreur du fournisseur de cours.',
  );
}

async function getJson(url: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new MarketDataError(
      'Connexion au service de cours impossible (réseau).',
    );
  }
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new MarketDataError('Réponse illisible du service de cours.');
  }
  if (isErrorPayload(json)) {
    throw friendlyError(json);
  }
  return json;
}

function enc(value: string): string {
  return encodeURIComponent(value);
}

/**
 * Recherche d'instruments par texte libre (ex : "LV" -> LVMH...).
 * N'utilise pas de crédit API chez Twelve Data.
 */
export async function searchSymbols(
  query: string,
  apiKey: string,
): Promise<SymbolResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 1) return [];
  const url = `${BASE_URL}/symbol_search?symbol=${enc(
    trimmed,
  )}&outputsize=20&apikey=${enc(apiKey)}`;
  const json = (await getJson(url)) as { data?: unknown };
  const data = Array.isArray(json.data) ? json.data : [];
  return data.map((raw) => {
    const r = raw as Record<string, unknown>;
    return {
      symbol: String(r.symbol ?? ''),
      name: String(r.instrument_name ?? ''),
      exchange: String(r.exchange ?? ''),
      micCode: String(r.mic_code ?? ''),
      currency: String(r.currency ?? ''),
      type: String(r.instrument_type ?? ''),
      country: String(r.country ?? ''),
    };
  });
}

/** Récupère le cours d'un instrument dans sa devise de cotation. */
export async function fetchQuote(
  query: QuoteQuery,
  apiKey: string,
): Promise<QuoteResult> {
  const symbol = query.linkedSymbol?.trim();
  if (!symbol) {
    throw new MarketDataError('Aucun symbole associé à cette ligne.');
  }
  let url = `${BASE_URL}/quote?symbol=${enc(symbol)}&apikey=${enc(apiKey)}`;
  if (query.micCode) url += `&mic_code=${enc(query.micCode)}`;
  else if (query.exchange) url += `&exchange=${enc(query.exchange)}`;

  const json = (await getJson(url)) as Record<string, unknown>;
  const rawPrice = json.close ?? json.price;
  const price = Number(rawPrice);
  if (!Number.isFinite(price)) {
    throw new MarketDataError('Cours indisponible pour cet instrument.');
  }
  return {
    price,
    currency: String(json.currency ?? '').toUpperCase(),
  };
}

/**
 * Taux de change vers l'euro pour une devise donnée.
 * Utilise un cache (Map) pour éviter les appels répétés dans une session.
 */
export async function fetchFxToEur(
  currency: string,
  apiKey: string,
  cache: Map<string, number>,
): Promise<number> {
  const code = currency.toUpperCase();
  if (code === '' || code === 'EUR') return 1;
  const cached = cache.get(code);
  if (cached !== undefined) return cached;

  const url = `${BASE_URL}/exchange_rate?symbol=${enc(code)}/EUR&apikey=${enc(
    apiKey,
  )}`;
  const json = (await getJson(url)) as { rate?: unknown };
  const rate = Number(json.rate);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new MarketDataError(`Conversion ${code} → EUR indisponible.`);
  }
  cache.set(code, rate);
  return rate;
}

/** Récupère le cours d'un instrument déjà converti en euros. */
export async function fetchPriceInEur(
  query: QuoteQuery,
  apiKey: string,
  fxCache: Map<string, number>,
): Promise<{ priceEur: number; currency: string }> {
  const quote = await fetchQuote(query, apiKey);
  const rate = await fetchFxToEur(quote.currency, apiKey, fxCache);
  return { priceEur: quote.price * rate, currency: quote.currency };
}

/** Vérifie qu'une clé d'API fonctionne (appel léger). */
export async function validateApiKey(apiKey: string): Promise<void> {
  const url = `${BASE_URL}/exchange_rate?symbol=USD/EUR&apikey=${enc(apiKey)}`;
  await getJson(url);
}
