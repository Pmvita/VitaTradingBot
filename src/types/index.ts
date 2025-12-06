// Core type definitions for the trading bot

export type SupportedNetwork = 
  | 'ethereum' 
  | 'polygon' 
  | 'bsc' 
  | 'avalanche' 
  | 'arbitrum' 
  | 'optimism' 
  | 'solana';

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'STOP_LIMIT' | 'TRAILING_STOP' | 'OCO';

export type OrderSide = 'BUY' | 'SELL';

export type OrderStatus = 'PENDING' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'FAILED' | 'EXPIRED';

export type StrategyType = 
  | 'MEAN_REVERSION' 
  | 'MOMENTUM' 
  | 'GRID_TRADING' 
  | 'MARKET_MAKING' 
  | 'ARBITRAGE';

export type BotStatus = 'STOPPED' | 'RUNNING' | 'PAUSED' | 'ERROR';

export interface Wallet {
  address: string;
  network: SupportedNetwork;
  balance: string;
  tokens?: TokenBalance[];
}

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  price?: number;
  value?: number;
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
}

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  timestamp: number;
}

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Order {
  id: string;
  type: OrderType;
  side: OrderSide;
  symbol: string;
  amount: string;
  price?: string;
  status: OrderStatus;
  filledAmount?: string;
  filledPrice?: string;
  createdAt: number;
  updatedAt: number;
  executedAt?: number;
  stopPrice?: string;
  takeProfitPrice?: string;
  trailingStopDistance?: string;
}

export interface Position {
  id: string;
  symbol: string;
  side: OrderSide;
  entryPrice: number;
  currentPrice: number;
  amount: number;
  value: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
  openedAt: number;
  strategy?: string;
  stopLoss?: number;
  takeProfit?: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: OrderSide;
  entryPrice: number;
  exitPrice: number;
  amount: number;
  pnl: number;
  pnlPercent: number;
  fees: number;
  strategy: string;
  timeframe: Timeframe;
  openedAt: number;
  closedAt: number;
  duration: number;
}

export interface StrategyConfig {
  id: string;
  type: StrategyType;
  name: string;
  enabled: boolean;
  symbol: string; // Trading pair symbol (e.g., "BTC/USDT")
  timeframe: Timeframe;
  parameters: Record<string, any>;
  riskManagement: RiskManagementConfig;
  tradingHours?: TradingHoursConfig;
  createdAt: number;
  updatedAt: number;
}

export interface RiskManagementConfig {
  positionSize: number; // Percentage of capital
  positionSizeType: 'PERCENTAGE' | 'FIXED' | 'KELLY' | 'VOLATILITY';
  stopLoss: number; // Percentage
  takeProfit: number; // Percentage
  maxPositions: number;
  maxDrawdown: number; // Percentage
  dailyLossLimit: number; // Percentage
  riskRewardRatio: number; // Minimum ratio
  trailingStop?: boolean;
  trailingStopDistance?: number;
}

export interface TradingHoursConfig {
  enabled: boolean;
  timezone: string;
  days: number[]; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

export interface BotState {
  status: BotStatus;
  activeStrategies: string[];
  positions: Position[];
  orders: Order[];
  balance: number;
  totalPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  winRate: number;
  totalTrades: number;
  startTime?: number;
  uptime?: number;
}

export interface BacktestResult {
  totalReturn: number;
  totalReturnPercent: number;
  cagr?: number;
  sharpeRatio?: number;
  sortinoRatio?: number;
  calmarRatio?: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  winRate: number;
  profitFactor?: number;
  averageWin?: number;
  averageLoss?: number;
  totalTrades: number;
  equityCurve: Array<{ timestamp: number; value: number }>;
  trades: Trade[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Notification {
  id: string;
  type: 'TRADE' | 'ALERT' | 'ERROR' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface Signal {
  side: OrderSide | 'HOLD';
  strength: number; // 0-100
  reason: string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}

// Multi-currency paper trading types
export interface CurrencyBalance {
  currency: string;
  amount: number;
  usdValue: number;
}

export interface CurrencyAllocation {
  currency: string;
  lockedAmount: number;
  lockedType: 'fixed' | 'percentage';
  maxPositions: number;
}

export interface Conversion {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  rate: number;
  receivedAmount: number;
  fees: number;
  timestamp: number;
}

export interface PaperTradingState {
  balances: Map<string, CurrencyBalance>;
  allocations: Map<string, CurrencyAllocation>;
  totalUsdValue: number;
  conversions: Conversion[];
}

