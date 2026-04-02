import { config } from '../config.js';
import { fetchJson } from '../utils/http.js';

let cachedToken = null;
let cachedTokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedTokenExpiry - 60_000) {
    return cachedToken;
  }

  const basic = Buffer.from(`${config.ebay.clientId}:${config.ebay.clientSecret}`).toString('base64');
  const payload = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'https://api.ebay.com/oauth/api_scope'
  });

  const data = await fetchJson('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: payload.toString()
  });

  cachedToken = data.access_token;
  cachedTokenExpiry = Date.now() + (Number(data.expires_in || 7200) * 1000);
  return cachedToken;
}

function mapCondition(condition) {
  if (!condition) return 'Non précisé';
  return condition;
}

export async function searchEbayListings({ query, limit = 10 }) {
  const token = await getAccessToken();
  const url = new URL('https://api.ebay.com/buy/browse/v1/item_summary/search');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('sort', 'newlyListed');
  url.searchParams.set('filter', 'deliveryCountry:FR');

  const data = await fetchJson(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': config.ebay.marketplaceId,
      Accept: 'application/json'
    }
  });

  const items = Array.isArray(data.itemSummaries) ? data.itemSummaries : [];
  return items.map((item) => ({
    sourceId: item.itemId,
    name: item.title,
    foundPrice: Number(item.price?.value || 0),
    currency: item.price?.currency || 'EUR',
    condition: mapCondition(item.condition),
    seller: item.seller?.username || item.seller?.feedbackPercentage || 'ebay_seller',
    location: item.itemLocation?.city || item.itemLocation?.country || '—',
    posted: item.itemOriginDate || '',
    url: item.itemWebUrl,
    image: item.image?.imageUrl || '',
    platform: 'ebay'
  })).filter((item) => Number.isFinite(item.foundPrice) && item.foundPrice > 0);
}
