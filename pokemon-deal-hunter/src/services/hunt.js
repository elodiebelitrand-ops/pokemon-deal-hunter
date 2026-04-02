import { config, hasCardmarketCredentials, hasEbayCredentials } from '../config.js';
import { buildDemoDeals } from './demo.js';
import { searchEbayListings } from './ebay.js';
import { findCardmarketReference } from './cardmarket.js';

const CATS = {
  edition1: { label: '1ère Édition', q: 'pokemon 1st edition shadowless wotc' },
  magique: { label: 'Cartes WOTC', q: 'pokemon wotc jungle fossil team rocket holo' },
  brillant: { label: 'Shiny / Full Art', q: 'pokemon shiny full art alternate art' },
  classeur_ancien: { label: 'Classeur Pokémon Ancien', q: 'pokemon binder vintage officiel' },
  classeur95: { label: 'Classeur 1995', q: 'pokemon binder 1995 nintendo' },
  vieille: { label: 'Vieilles cartes', q: 'pokemon vintage base set neo genesis holo' }
};

const KEYWORDS = [
  { id: 'kw01', label: 'carte pokemon edition 1', q: 'pokemon edition 1' },
  { id: 'kw02', label: 'carte pokemon ED1', q: 'pokemon ED1' },
  { id: 'kw03', label: 'carte pokemon 1st edition', q: 'pokemon 1st edition' },
  { id: 'kw04', label: 'carte pokemon 1995', q: 'pokemon 1995' },
  { id: 'kw05', label: 'carte pokemon wizard of the coast', q: 'pokemon wizard of the coast' },
  { id: 'kw06', label: 'carte pokemon vintage', q: 'pokemon vintage' },
  { id: 'kw07', label: 'carte pokemon ancienne', q: 'pokemon ancienne' },
  { id: 'kw08', label: 'carte pokemon set de base 1995', q: 'pokemon set de base 1995' },
  { id: 'kw09', label: 'carte pokemon shadowless', q: 'pokemon shadowless' },
  { id: 'kw10', label: 'carte pokemon holo edition 1', q: 'pokemon holo edition 1' },
  { id: 'kw11', label: 'carte pokemon rare edition 1', q: 'pokemon rare edition 1' },
  { id: 'kw12', label: 'carte pokemon fr edition 1', q: 'pokemon fr edition 1' },
  { id: 'kw13', label: 'dracaufeu edition 1', q: 'dracaufeu edition 1' },
  { id: 'kw14', label: 'pikachu edition 1', q: 'pikachu edition 1' },
  { id: 'kw15', label: 'carte pokemon 1999 edition 1', q: 'pokemon 1999 edition 1' },
  { id: 'kw16', label: 'carte pokemon 1999 wizard', q: 'pokemon 1999 wizard' },
  { id: 'kw17', label: 'wizard ancienne holo', q: 'pokemon wizard holo ancienne' }
];

function uniqBy(array, keyFn) {
  const seen = new Set();
  return array.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function calculateDeal(listing, reference, category, threshold) {
  if (!reference?.referencePrice || !listing?.foundPrice) return null;
  if (reference.referencePrice <= listing.foundPrice) return null;

  const savingEuros = Number((reference.referencePrice - listing.foundPrice).toFixed(2));
  const saving = Math.round((savingEuros / reference.referencePrice) * 100);
  if (saving < threshold) return null;

  return {
    name: reference.name || listing.name,
    category,
    platform: listing.platform,
    cmPrice: Number(reference.referencePrice.toFixed(2)),
    foundPrice: listing.foundPrice,
    saving,
    savingEuros,
    condition: listing.condition,
    seller: listing.seller,
    location: listing.location,
    posted: listing.posted,
    url: listing.url,
    notes: `Référence Cardmarket via ${reference.source}. Score de match: ${reference.matchScore?.toFixed(2) ?? 'n/a'}`,
    hot: saving >= 50
  };
}

function buildQueries(activeCats = [], activeKws = []) {
  const queries = [];

  for (const cat of activeCats) {
    if (CATS[cat]) {
      queries.push({ category: cat, label: CATS[cat].label, q: CATS[cat].q });
    }
  }

  for (const kwId of activeKws) {
    const kw = KEYWORDS.find((item) => item.id === kwId);
    if (kw) {
      queries.push({ category: 'edition1', label: kw.label, q: kw.q });
    }
  }

  return queries;
}

export async function runHunt({ threshold = 30, maxResults = 8, activeCats = [], activeKws = [], activePlats = [] }) {
  const requestedEbay = activePlats.includes('ebay');

  if ((!requestedEbay || !hasEbayCredentials() || !hasCardmarketCredentials()) && config.features.demoMode) {
    return {
      mode: 'demo',
      deals: buildDemoDeals({ threshold }).slice(0, maxResults + 4),
      warnings: [
        'Mode démo activé : renseigne les clés eBay et Cardmarket pour obtenir des données réelles.',
        activePlats.includes('vinted') ? 'Vinted non activé : l’API officielle est réservée aux comptes Pro allowlistés.' : null,
        activePlats.includes('lbc') ? 'Le Bon Coin non activé : aucun connecteur officiel n’est fourni ici.' : null
      ].filter(Boolean)
    };
  }

  const warnings = [];
  if (activePlats.includes('vinted')) {
    warnings.push('Vinted ignoré : ce projet ne l’active pas sans accès Vinted Pro allowlisté.');
  }
  if (activePlats.includes('lbc')) {
    warnings.push('Le Bon Coin ignoré : aucun adaptateur officiel n’est activé dans cette version.');
  }
  if (!requestedEbay) {
    warnings.push('Aucune plateforme réelle active : coche eBay pour lancer une recherche officielle.');
  }
  if (!hasEbayCredentials()) {
    warnings.push('Clés eBay manquantes.');
  }
  if (!hasCardmarketCredentials()) {
    warnings.push('Clés Cardmarket manquantes.');
  }
  if (!requestedEbay || !hasEbayCredentials() || !hasCardmarketCredentials()) {
    return { mode: 'disabled', deals: [], warnings };
  }

  const queries = buildQueries(activeCats, activeKws).slice(0, 12);
  const collectedDeals = [];

  for (const query of queries) {
    const listings = await searchEbayListings({ query: query.q, limit: 8 });
    for (const listing of listings) {
      try {
        const reference = await findCardmarketReference(listing.name);
        const deal = calculateDeal(listing, reference, query.category, threshold);
        if (deal) {
          collectedDeals.push(deal);
        }
      } catch (error) {
        warnings.push(`Comparaison Cardmarket impossible pour "${listing.name}": ${error.message}`);
      }
    }
  }

  const deduped = uniqBy(collectedDeals, (item) => `${item.name}|${item.platform}|${item.foundPrice}`.toLowerCase())
    .sort((a, b) => b.saving - a.saving)
    .slice(0, maxResults + 4);

  return {
    mode: 'live',
    deals: deduped,
    warnings: uniqBy(warnings, (item) => item)
  };
}
