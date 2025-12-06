// Price data service using free APIs

import axios from 'axios';
import { API_ENDPOINTS } from '../constants';
import { PriceData, OHLCV, ApiResponse, Timeframe } from '../types';
import { logger } from '../utils/logger';

class PriceService {
  private cache: Map<string, { data: PriceData; timestamp: number }> = new Map();
  private cacheTimeout = 60000; // 1 minute

  /**
   * Get current price for a token/coin
   */
  async getPrice(symbol: string, network?: string): Promise<ApiResponse<PriceData>> {
    try {
      // Check cache first
      const cached = this.cache.get(symbol);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return { success: true, data: cached.data };
      }

      // Try CoinGecko first (free tier)
      const coinId = this.mapSymbolToCoinGeckoId(symbol);
      if (coinId) {
        const response = await axios.get(
          `${API_ENDPOINTS.COINGECKO}/simple/price`,
          {
            params: {
              ids: coinId,
              vs_currencies: 'usd',
              include_24hr_change: true,
              include_24hr_vol: true,
            },
            timeout: 10000,
          }
        );

        const data = response.data[coinId];
        if (data) {
          const priceData: PriceData = {
            symbol,
            price: data.usd,
            change24h: data.usd_24h_change || 0,
            changePercent24h: data.usd_24h_change || 0,
            volume24h: data.usd_24h_vol || 0,
            timestamp: Date.now(),
          };

          this.cache.set(symbol, { data: priceData, timestamp: Date.now() });
          return { success: true, data: priceData };
        }
      }

      // Fallback to Binance if available
      if (symbol.includes('/')) {
        return await this.getBinancePrice(symbol);
      }

      return { success: false, error: 'Price not found' };
    } catch (error) {
      logger.error('Failed to fetch price', error as Error, { symbol });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get historical OHLCV data
   */
  async getHistoricalData(
    symbol: string,
    timeframe: Timeframe,
    limit: number = 100
  ): Promise<ApiResponse<OHLCV[]>> {
    try {
      // Try Binance first for proper OHLCV candlestick data
      if (symbol.includes('/')) {
        const binanceResult = await this.getBinanceOHLCV(symbol, timeframe, limit);
        if (binanceResult.success && binanceResult.data) {
          return binanceResult;
        }
      }

      // Fallback to CoinGecko (less accurate but works for more symbols)
      const coinId = this.mapSymbolToCoinGeckoId(symbol);
      if (!coinId) {
        return { success: false, error: 'Symbol not supported' };
      }

      const days = this.timeframeToDays(timeframe, limit);
      const response = await axios.get(
        `${API_ENDPOINTS.COINGECKO}/coins/${coinId}/ohlc`,
        {
          params: {
            vs_currency: 'usd',
            days,
          },
          timeout: 15000,
        }
      );

      const ohlcData = response.data || [];

      const ohlcv: OHLCV[] = ohlcData.map((candle: [number, number, number, number, number]) => {
        return {
          timestamp: candle[0],
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4],
          volume: 0, // CoinGecko OHLC doesn't include volume
        };
      });

      return { success: true, data: ohlcv };
    } catch (error) {
      logger.error('Failed to fetch historical data', error as Error, { symbol, timeframe });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get OHLCV data from Binance (proper candlestick data)
   */
  private async getBinanceOHLCV(
    symbol: string,
    timeframe: Timeframe,
    limit: number = 100
  ): Promise<ApiResponse<OHLCV[]>> {
    try {
      const binanceSymbol = symbol.replace('/', '').toUpperCase();
      const interval = this.timeframeToBinanceInterval(timeframe);
      
      const response = await axios.get(`${API_ENDPOINTS.BINANCE}/klines`, {
        params: {
          symbol: binanceSymbol,
          interval,
          limit,
        },
        timeout: 15000,
      });

      const klines = response.data || [];
      
      const ohlcv: OHLCV[] = klines.map((kline: any[]) => {
        return {
          timestamp: kline[0],
          open: parseFloat(kline[1]),
          high: parseFloat(kline[2]),
          low: parseFloat(kline[3]),
          close: parseFloat(kline[4]),
          volume: parseFloat(kline[5]),
        };
      });

      return { success: true, data: ohlcv };
    } catch (error) {
      logger.error('Failed to fetch Binance OHLCV data', error as Error, { symbol, timeframe });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Convert timeframe to Binance interval
   */
  private timeframeToBinanceInterval(timeframe: Timeframe): string {
    const mapping: Record<Timeframe, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d',
    };
    return mapping[timeframe] || '1h';
  }

  /**
   * Get price from Binance
   */
  private async getBinancePrice(symbol: string): Promise<ApiResponse<PriceData>> {
    try {
      const binanceSymbol = symbol.replace('/', '').toUpperCase();
      const response = await axios.get(`${API_ENDPOINTS.BINANCE}/ticker/24hr`, {
        params: { symbol: binanceSymbol },
        timeout: 10000,
      });

      const data = response.data;
      const priceData: PriceData = {
        symbol,
        price: parseFloat(data.lastPrice),
        change24h: parseFloat(data.priceChange),
        changePercent24h: parseFloat(data.priceChangePercent),
        volume24h: parseFloat(data.volume),
        timestamp: Date.now(),
      };

      this.cache.set(symbol, { data: priceData, timestamp: Date.now() });
      return { success: true, data: priceData };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Map symbol to CoinGecko coin ID
   */
  private mapSymbolToCoinGeckoId(symbol: string): string | null {
    const mapping: Record<string, string> = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      USDT: 'tether',
      USDC: 'usd-coin',
      BNB: 'binancecoin',
      MATIC: 'matic-network',
      AVAX: 'avalanche-2',
      SOL: 'solana',
    };

    const upperSymbol = symbol.toUpperCase().split('/')[0];
    return mapping[upperSymbol] || null;
  }

  /**
   * Convert timeframe to days for CoinGecko API
   */
  private timeframeToDays(timeframe: Timeframe, limit: number): number {
    const timeframeDays: Record<Timeframe, number> = {
      '1m': limit / (24 * 60),
      '5m': limit / (24 * 12),
      '15m': limit / (24 * 4),
      '30m': limit / (24 * 2),
      '1h': limit / 24,
      '4h': limit / 6,
      '1d': limit,
    };

    return Math.max(1, Math.ceil(timeframeDays[timeframe]));
  }

  /**
   * Get interval for CoinGecko API
   */
  private getInterval(timeframe: Timeframe): string {
    if (timeframe === '1d') return 'daily';
    return 'hourly';
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const priceService = new PriceService();

