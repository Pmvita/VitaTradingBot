// Unit tests for RSI indicator

import { calculateRSI, getLatestRSI } from '../../../src/bot/indicators/RSI';
import { OHLCV } from '../../../src/types';

describe('RSI Indicator', () => {
  const createTestData = (prices: number[]): OHLCV[] => {
    return prices.map((price, i) => ({
      timestamp: Date.now() + i * 3600000,
      open: price,
      high: price * 1.01,
      low: price * 0.99,
      close: price,
      volume: 1000,
    }));
  };

  describe('calculateRSI', () => {
    it('should calculate RSI for valid data', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + (i % 10));
      const data = createTestData(prices);
      const rsi = calculateRSI(data, 14);

      expect(rsi.length).toBeGreaterThan(0);
      rsi.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    });

    it('should return empty array for insufficient data', () => {
      const data = createTestData([100, 101, 102]);
      const rsi = calculateRSI(data, 14);

      expect(rsi.length).toBe(0);
    });

    it('should handle oversold conditions (RSI < 30)', () => {
      // Create declining price data
      const prices = Array.from({ length: 20 }, (_, i) => 100 - i * 2);
      const data = createTestData(prices);
      const rsi = calculateRSI(data, 14);

      if (rsi.length > 0) {
        const latestRSI = rsi[rsi.length - 1];
        // RSI should be low for declining prices
        expect(latestRSI).toBeLessThan(50);
      }
    });
  });

  describe('getLatestRSI', () => {
    it('should return latest RSI value', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + (i % 10));
      const data = createTestData(prices);
      const latestRSI = getLatestRSI(data, 14);

      expect(latestRSI).not.toBeNull();
      if (latestRSI !== null) {
        expect(latestRSI).toBeGreaterThanOrEqual(0);
        expect(latestRSI).toBeLessThanOrEqual(100);
      }
    });

    it('should return null for insufficient data', () => {
      const data = createTestData([100, 101, 102]);
      const latestRSI = getLatestRSI(data, 14);

      expect(latestRSI).toBeNull();
    });
  });
});

