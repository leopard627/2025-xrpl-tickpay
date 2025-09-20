// Mock service database for AI payment demos
export interface ServiceInfo {
  id: string;
  name: string;
  price: number;
  currency: string;
  type: 'subscription' | 'one-time';
  period?: 'monthly' | 'yearly';
  description: string;
  provider: string;
  image?: string;
  url?: string;
  reviews?: string;
}

export const AVAILABLE_SERVICES: ServiceInfo[] = [
  {
    id: 'netflix-basic',
    name: 'Netflix Basic',
    price: 15.99,
    currency: 'USD',
    type: 'subscription',
    period: 'monthly',
    description: 'Netflix streaming service - Basic plan',
    provider: 'Netflix',
    image: 'https://images.ctfassets.net/y2ske730sjqp/5QQ9SVIdc1tmkqrtFnG9U1/de758bba0f65dcc1c6bc1f31f161003d/BrandAssets_Logos_02-NSymbol.jpg?w=940',
    url: 'https://www.netflix.com'
  },
  {
    id: 'netflix-premium',
    name: 'Netflix Premium',
    price: 22.99,
    currency: 'USD',
    type: 'subscription',
    period: 'monthly',
    description: 'Netflix streaming service - Premium plan (4K)',
    provider: 'Netflix',
    image: 'https://images.ctfassets.net/y2ske730sjqp/5QQ9SVIdc1tmkqrtFnG9U1/de758bba0f65dcc1c6bc1f31f161003d/BrandAssets_Logos_02-NSymbol.jpg?w=940',
    url: 'https://www.netflix.com'
  },
  {
    id: 'spotify-premium',
    name: 'Spotify Premium',
    price: 10.99,
    currency: 'USD',
    type: 'subscription',
    period: 'monthly',
    description: 'Spotify music streaming - Premium',
    provider: 'Spotify'
  },
  {
    id: 'chatgpt-plus',
    name: 'ChatGPT Plus',
    price: 20.00,
    currency: 'USD',
    type: 'subscription',
    period: 'monthly',
    description: 'OpenAI ChatGPT Plus subscription',
    provider: 'OpenAI'
  },
  {
    id: 'youtube-premium',
    name: 'YouTube Premium',
    price: 11.99,
    currency: 'USD',
    type: 'subscription',
    period: 'monthly',
    description: 'YouTube Premium - Ad-free viewing',
    provider: 'Google'
  },
  {
    id: 'apple-music',
    name: 'Apple Music',
    price: 9.99,
    currency: 'USD',
    type: 'subscription',
    period: 'monthly',
    description: 'Apple Music streaming service',
    provider: 'Apple'
  },
  {
    id: 'coupang-samdasoo',
    name: '제주삼다수 그린 무라벨',
    price: 12.96,
    currency: 'USD',
    type: 'one-time',
    description: '제주삼다수 그린 무라벨, 2L, 12개 - 로켓배송',
    provider: 'Coupang',
    image: 'https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/retail/images/71398552289343-b41a602e-f62c-4f23-99f5-0a31785c8c32.jpg',
    url: 'https://www.coupang.com',
    reviews: '513,835 개 상품평'
  }
];

export function findServiceByName(query: string): ServiceInfo | null {
  const lowerQuery = query.toLowerCase();

  // Exact name match first
  let service = AVAILABLE_SERVICES.find(s =>
    s.name.toLowerCase() === lowerQuery
  );

  if (service) return service;

  // Partial match in name, provider, or description
  service = AVAILABLE_SERVICES.find(s =>
    s.name.toLowerCase().includes(lowerQuery) ||
    s.provider.toLowerCase().includes(lowerQuery) ||
    s.description.toLowerCase().includes(lowerQuery) ||
    lowerQuery.includes(s.provider.toLowerCase()) ||
    lowerQuery.includes(s.name.toLowerCase().split(' ')[0]) ||
    // Special keywords for common searches
    (lowerQuery.includes('물') && s.id === 'coupang-samdasoo') ||
    (lowerQuery.includes('삼다수') && s.id === 'coupang-samdasoo') ||
    (lowerQuery.includes('쿠팡') && s.provider === 'Coupang') ||
    (lowerQuery.includes('로켓배송') && s.provider === 'Coupang')
  );

  return service || null;
}

export function convertPriceToXRP(usdPrice: number, exchangeRate: number = 0.5): number {
  // Mock conversion rate: 1 USD = 0.5 XRP (for demo purposes)
  return Number((usdPrice * exchangeRate).toFixed(6));
}