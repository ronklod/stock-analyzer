export interface CompanyInfo {
  name: string;
  sector: string;
  currentPrice: number;
  previousClose: number;
  dayChange: number;
  dayChangePercent: number;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
  marketCap: number;
  volume: number;
  averageVolume: number;
  pe: number;
  eps: number;
  dividend: number;
}

export interface TechnicalAnalysis {
  score: number;
  signals: Record<string, string>;
}

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  sentiment: number;
  date: string;
  summary: string;
}

export interface SentimentAnalysis {
  score: number;
  description: string;
  articles: NewsArticle[];
}

export interface Recommendation {
  recommendation: string;
  confidence: number;
  technical_score: number;
  sentiment_score: number;
  combined_score: number;
  description: string;
}

export interface ChartData {
  dates: string[];
  ohlc: {
    open: number[];
    high: number[];
    low: number[];
    close: number[];
  };
  volume: number[];
  indicators: {
    sma20?: number[];
    sma50?: number[];
    sma150?: number[];
    sma200?: number[];
    bbUpper?: number[];
    bbLower?: number[];
    rsi?: number[];
    macd?: number[];
    macdSignal?: number[];
    macdHist?: number[];
    cci?: number[];
  };
}

export interface LatestData {
  close: number;
  volume: number;
  rsi: number | null;
  sma20: number | null;
  sma50: number | null;
}

export interface SupportResistanceLevel {
  price: number;
  type: 'Support' | 'Resistance';  // Strict union type
  strength: number;
}

export interface PriceTargets {
  current_price: number;
  stop_loss: number;
  target_1: number;
  target_2: number;
  risk_reward: number;
}

export interface StockAnalysisResponse {
  ticker: string;
  companyInfo: CompanyInfo;
  technicalAnalysis: TechnicalAnalysis;
  sentimentAnalysis: SentimentAnalysis;
  recommendation: Recommendation;
  priceTargets: PriceTargets;
  supportResistanceLevels: SupportResistanceLevel[];
  chartData: ChartData;
  latestData: LatestData;
}

export interface TopStock {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  marketCap: number;
  peRatio: number;
  recommendation: string;
  combinedScore: number;
  technicalScore: number;
  sentimentScore: number;
  confidence: number;
  pricePosition52w: number;
  volumeRatio: number;
  momentum20d: number;
  attractivenessScore: number;
  description: string;
}

export interface ScreeningResponse {
  topStocks: TopStock[];
  totalAnalyzed: number;
  failedSymbols: string[];
} 