import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  ebay: {
    enabled: process.env.ENABLE_EBAY !== 'false',
    marketplaceId: process.env.EBAY_MARKETPLACE_ID || 'EBAY_FR',
    clientId: process.env.EBAY_CLIENT_ID || '',
    clientSecret: process.env.EBAY_CLIENT_SECRET || ''
  },
  cardmarket: {
    enabled: process.env.ENABLE_CARDMARKET !== 'false',
    baseUrl: process.env.CARDMARKET_BASE_URL || 'https://apiv2.cardmarket.com/ws/v2.0',
    appToken: process.env.CARDMARKET_APP_TOKEN || '',
    appSecret: process.env.CARDMARKET_APP_SECRET || '',
    accessToken: process.env.CARDMARKET_ACCESS_TOKEN || '',
    accessSecret: process.env.CARDMARKET_ACCESS_SECRET || ''
  },
  features: {
    vinted: process.env.ENABLE_VINTED === 'true',
    lbc: process.env.ENABLE_LBC === 'true',
    demoMode: process.env.ALLOW_DEMO_MODE !== 'false'
  }
};

export function hasEbayCredentials() {
  return Boolean(config.ebay.clientId && config.ebay.clientSecret);
}

export function hasCardmarketCredentials() {
  return Boolean(
    config.cardmarket.appToken &&
    config.cardmarket.appSecret &&
    config.cardmarket.accessToken &&
    config.cardmarket.accessSecret
  );
}
