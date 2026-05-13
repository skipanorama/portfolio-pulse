export type RatingLabel = 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell' | 'N/A';

export interface Portfolio {
  id: number;
  name: string;
  owner: string;
  broker: string;
  accountType: string;
  accountId?: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
  holdings?: Holding[];
  totalMarketValue?: number;
  totalBookValue?: number;
  totalUnrealizedGain?: number;
  totalUnrealizedGainPct?: number;
}

export interface Holding {
  id: number;
  portfolioId: number;
  symbol: string;
  yahooSymbol: string;
  name: string;
  quantity: number;
  currency: string;
  avgCost?: number | null;
  bookValue?: number | null;
  marketPrice?: number | null;
  marketValue?: number | null;
  unrealizedGain?: number | null;
  assetType: string;
  exchange?: string | null;
  rating?: AnalystRating | null;
}

export interface AnalystRating {
  id?: number;
  yahooSymbol: string;
  rating?: string | null;
  ratingScore?: number | null;
  strongBuyCount?: number | null;
  buyCount?: number | null;
  holdCount?: number | null;
  sellCount?: number | null;
  strongSellCount?: number | null;
  targetPrice?: number | null;
  numberOfAnalysts?: number | null;
  lastUpdated?: string;
}

export interface PortfolioSummary {
  totalPortfolios: number;
  totalMarketValue: number;
  totalBookValue: number;
  totalUnrealizedGain: number;
  totalUnrealizedGainPct: number;
  byRating: Record<RatingLabel, number>;
}
