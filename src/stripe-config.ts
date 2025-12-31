export interface StripePrice {
  id: string;
  price_per_unit: number;
  interval: 'month' | 'year';
}

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  currency_symbol: string;
  mode: 'payment' | 'subscription';
  prices: StripePrice[];
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_TgwVCab0EfqGlD',
    name: 'TMLN Pro',
    description: 'Appears during onboarding, free thresholds, and when users manage their account',
    currency_symbol: '$',
    mode: 'subscription',
    prices: [
      {
        id: 'price_1SjYc6FBXMid40qf3Xfwzrbw',
        price_per_unit: 5.99,
        interval: 'month'
      },
      {
        id: 'price_1SjYc6FBXMid40qf7zrGUIwz',
        price_per_unit: 59.00,
        interval: 'year'
      }
    ]
  }
];

export const getProductByPriceId = (priceId: string): { product: StripeProduct; price: StripePrice } | undefined => {
  for (const product of stripeProducts) {
    const price = product.prices.find(p => p.id === priceId);
    if (price) {
      return { product, price };
    }
  }
  return undefined;
};

export const getProductById = (id: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.id === id);
};