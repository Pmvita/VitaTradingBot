// Multi-timeframe data management

import { OHLCV, Timeframe } from '../../types';
import { priceService } from '../../api/PriceService';
import { logger } from '../../utils/logger';

class TimeframeManager {
  private dataCache: Map<string, Map<Timeframe, OHLCV[]>> = new Map();
  private lastUpdate: Map<string, Map<Timeframe, number>> = new Map();

  /**
   * Get data for a specific symbol and timeframe
   */
  async getData(symbol: string, timeframe: Timeframe, limit: number = 100): Promise<OHLCV[]> {
    const cacheKey = `${symbol}-${timeframe}`;
    const cached = this.dataCache.get(symbol)?.get(timeframe);
    const lastUpdateTime = this.lastUpdate.get(symbol)?.get(timeframe) || 0;

    // Return cached data if fresh (within 1 minute)
    if (cached && Date.now() - lastUpdateTime < 60000) {
      return cached;
    }

    // Fetch new data
    const result = await priceService.getHistoricalData(symbol, timeframe, limit);
    if (result.success && result.data) {
      this.setData(symbol, timeframe, result.data);
      return result.data;
    }

    // Return cached data even if stale
    return cached || [];
  }

  /**
   * Set data for a symbol and timeframe
   */
  setData(symbol: string, timeframe: Timeframe, data: OHLCV[]): void {
    if (!this.dataCache.has(symbol)) {
      this.dataCache.set(symbol, new Map());
    }
    if (!this.lastUpdate.has(symbol)) {
      this.lastUpdate.set(symbol, new Map());
    }

    this.dataCache.get(symbol)!.set(timeframe, data);
    this.lastUpdate.get(symbol)!.set(timeframe, Date.now());
  }

  /**
   * Get data for multiple timeframes
   */
  async getMultiTimeframeData(
    symbol: string,
    timeframes: Timeframe[],
    limit: number = 100
  ): Promise<Map<Timeframe, OHLCV[]>> {
    const results = new Map<Timeframe, OHLCV[]>();

    await Promise.all(
      timeframes.map(async (tf) => {
        const data = await this.getData(symbol, tf, limit);
        results.set(tf, data);
      })
    );

    return results;
  }

  /**
   * Clear cache for a symbol
   */
  clearCache(symbol?: string): void {
    if (symbol) {
      this.dataCache.delete(symbol);
      this.lastUpdate.delete(symbol);
    } else {
      this.dataCache.clear();
      this.lastUpdate.clear();
    }
  }
}

export const timeframeManager = new TimeframeManager();

