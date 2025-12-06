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
      // Use CoinGecko for historical data
      const coinId = this.mapSymbolToCoinGeckoId(symbol);
      if (!coinId) {
        return { success: false, error: 'Symbol not supported' };
      }

      const days = this.timeframeToDays(timeframe, limit);
      const response = await axios.get(
        `${API_ENDPOINTS.COINGECKO}/coins/${coinId}/market_chart`,
        {
          params: {
            vs_currency: 'usd',
            days,
            interval: this.getInterval(timeframe),
          },
          timeout: 15000,
        }
      );

      const prices = response.data.prices || [];
      const volumes = response.data.total_volumes || [];

      const ohlcv: OHLCV[] = prices.map((price: [number, number], index: number) => {
        const volume = volumes[index]?.[1] || 0;
        return {
          timestamp: price[0],
          open: price[1],
          high: price[1],
          low: price[1],
          close: price[1],
          volume,
        };
      });

      return { success: true, data: ohlcv };
    } catch (error) {
      logger.error('Failed to fetch historical data', error as Error, { symbol, timeframe });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get price from Binance
   */
  private async getBinancePrice(symbol: string): Promise<ApiResponse<PriceData>> {
    try {
      const binanceSymbol = symbol.replace('/', '');
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

