// Historical data loader for backtesting

import { OHLCV, Timeframe } from '../../types';
import { priceService } from '../../api/PriceService';
import { logger } from '../../utils/logger';

class DataLoader {
  private cache: Map<string, OHLCV[]> = new Map();

  /**
   * Load historical data for backtesting
   */
  async loadHistoricalData(
    symbol: string,
    timeframe: Timeframe,
    startDate: number,
    endDate: number
  ): Promise<OHLCV[]> {
    const cacheKey = `${symbol}-${timeframe}-${startDate}-${endDate}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Calculate how many data points we need
      const timeframeMs = this.getTimeframeMs(timeframe);
      const duration = endDate - startDate;
      const dataPoints = Math.ceil(duration / timeframeMs);
      const limit = Math.min(dataPoints, 1000); // API limit

      const result = await priceService.getHistoricalData(symbol, timeframe, limit);

      if (!result.success || !result.data) {
        logger.error('Failed to load historical data', new Error('No data returned'));
        return [];
      }

      // Filter by date range
      const filtered = result.data.filter(
        candle => candle.timestamp >= startDate && candle.timestamp <= endDate
      );

      // Cache the data
      this.cache.set(cacheKey, filtered);

      return filtered;
    } catch (error) {
      logger.error('Failed to load historical data', error as Error);
      return [];
    }
  }

  /**
   * Get timeframe in milliseconds
   */
  private getTimeframeMs(timeframe: Timeframe): number {
    const ms: Record<Timeframe, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
    };
    return ms[timeframe];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const dataLoader = new DataLoader();

