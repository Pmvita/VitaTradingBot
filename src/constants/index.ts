// Application constants

import { SupportedNetwork, Timeframe } from '../types';

export const NETWORK_CONFIGS: Record<SupportedNetwork, {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}> = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon.llamarpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  bsc: {
    chainId: 56,
    name: 'Binance Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
  },
  avalanche: {
    chainId: 43114,
    name: 'Avalanche',
    rpcUrl: 'https://avalanche.public-rpc.com',
    explorerUrl: 'https://snowtrace.io',
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18,
    },
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  optimism: {
    chainId: 10,
    name: 'Optimism',
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  solana: {
    chainId: 0,
    name: 'Solana',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://solscan.io',
    nativeCurrency: {
      name: 'SOL',
      symbol: 'SOL',
      decimals: 9,
    },
  },
};

export const API_ENDPOINTS = {
  COINGECKO: 'https://api.coingecko.com/api/v3',
  BINANCE: 'https://api.binance.com/api/v3',
  BINANCE_WS: 'wss://stream.binance.com:9443/ws',
  ONEINCH: 'https://api.1inch.io/v5.0',
  ZEROX: 'https://api.0x.org',
  JUPITER: 'https://quote-api.jup.ag/v6',
} as const;

export const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];

export const TIMEFRAME_MS: Record<Timeframe, number> = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
};

export const MINIMUM_CAPITAL = 20; // USD

// Supported currencies for paper trading
export const SUPPORTED_CURRENCIES = [
  'BTC',
  'ETH',
  'USDT',
  'USDC',
  'BNB',
  'MATIC',
  'AVAX',
  'SOL',
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

// Paper trading initial allocation
export const PAPER_TRADING_INITIAL_CAPITAL = 1000000; // $1,000,000 USDT

export const DEFAULT_RISK_CONFIG = {
  positionSize: 5, // 5% of capital
  stopLoss: 2, // 2%
  takeProfit: 4, // 4%
  maxPositions: 3,
  maxDrawdown: 20, // 20%
  dailyLossLimit: 10, // 10%
  riskRewardRatio: 2, // 2:1
};

export const STORAGE_KEYS = {
  WALLET: 'wallet',
  STRATEGIES: 'strategies',
  TRADES: 'trades',
  POSITIONS: 'positions',
  SETTINGS: 'settings',
  BOT_STATE: 'bot_state',
} as const;

