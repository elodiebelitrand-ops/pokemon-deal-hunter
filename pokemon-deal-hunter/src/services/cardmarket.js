import { config } from '../config.js';
import { buildOAuth1Header } from '../utils/oauth1.js';
import { fetchJson } from '../utils/http.js';
import { overlapScore, extractPotentialCardName } from '../utils/text.js';

const ID_GAME_POKEMON = 51;
const ID_LANGUAGE_FR = 2;

function authHeaders(method, url) {
  return {
    Authorization: buildOAuth1Header({
      method,
      url,
      consumerKey: config.cardmarket.appToken,
      consumerSecret: config.cardmarket.appSecret,
      token: config.cardmarket.accessToken,
      tokenSecret: config.cardmarket.accessSecret
    }),
    Accept: 'application/json'
  };
}

async function cmGet(path, query = {}) {
  const url = new URL(`${config.cardmarket.baseUrl}${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, String(value));
    }
  });

  return fetchJson(url.toString(), {
    headers: authHeaders('GET', url.toString())
  });
}

function asArray(value, fallbacks = []) {
  if (Array.isArray(value)) return value;
  for (const key of fallbacks) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  return [];
}

export async function findCardmarketReference(listingTitle) {
  const query = extractPotentialCardName(listingTitle) || listingTitle;
  const result = await cmGet('/products/find', {
    search: query,
    exact: false,
    idGame: ID_GAME_POKEMON,
    idLanguage: ID_LANGUAGE_FR,
    maxResults: 10
  });

  const candidates = asArray(result, ['product', 'products']).length
    ? asArray(result, ['product', 'products'])
    : asArray(result?.product, ['product']);

  const ranked = candidates
    .map((product) => ({
      product,
      score: overlapScore(listingTitle, product.enName || product.locName || product.name)
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 0.25) {
    return null;
  }

  const productId = best.product.idProduct || best.product.id;
  if (!productId) {
    return null;
  }

  const articles = await cmGet(`/articles/${productId}`, {
    start: 0,
    maxResults: 20,
    idLanguage: ID_LANGUAGE_FR,
    minCondition: 'EX',
    userType: 'private'
  });

  const articleList = asArray(articles, ['article', 'articles']).length
    ? asArray(articles, ['article', 'articles'])
    : asArray(articles?.article, ['article']);

  const prices = articleList
    .map((article) => Number(article.price || article.priceEuro || article?.priceGuide?.SELL || article?.priceGuide?.LOW))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

  if (!prices.length) {
    const details = await cmGet(`/products/${productId}`);
    const guide = details?.priceGuide || details?.product?.priceGuide || null;
    const fallbackPrice = Number(guide?.LOW || guide?.SELL || guide?.TREND || 0);
    if (!fallbackPrice) {
      return null;
    }

    return {
      productId,
      name: best.product.enName || best.product.locName || best.product.name || listingTitle,
      referencePrice: fallbackPrice,
      source: 'product_price_guide',
      matchScore: best.score
    };
  }

  return {
    productId,
    name: best.product.enName || best.product.locName || best.product.name || listingTitle,
    referencePrice: prices[0],
    source: 'lowest_article_price',
    matchScore: best.score
  };
}
