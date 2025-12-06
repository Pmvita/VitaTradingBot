// Momentum strategy using MACD crossover

import { BaseStrategy, Signal } from './BaseStrategy';
import { OHLCV, Timeframe, OrderSide, StrategyConfig } from '../../types';
import { getLatestMACD } from '../indicators/MACD';
import { getLatestEMA } from '../indicators/MovingAverages';

export class MomentumStrategy extends BaseStrategy {
  private macdFast: number = 12;
  private macdSlow: number = 26;
  private macdSignal: number = 9;
  private emaFast: number = 50;
  private emaSlow: number = 200;

  constructor(config: StrategyConfig) {
    super(config);
    this.loadParameters();
  }

  private loadParameters(): void {
    const params = this.config.parameters;
    this.macdFast = params.macdFast || 12;
    this.macdSlow = params.macdSlow || 26;
    this.macdSignal = params.macdSignal || 9;
    this.emaFast = params.emaFast || 50;
    this.emaSlow = params.emaSlow || 200;
  }

  getName(): string {
    return 'Momentum';
  }

  getRecommendedTimeframes(): Timeframe[] {
    return ['1h', '4h', '1d'];
  }

  validateConfig(): boolean {
    return (
      this.macdFast > 0 &&
      this.macdSlow > this.macdFast &&
      this.macdSignal > 0 &&
      this.emaFast > 0 &&
      this.emaSlow > this.emaFast
    );
  }

  generateSignal(data: OHLCV[]): Signal {
    const minPeriod = Math.max(this.macdSlow + this.macdSignal, this.emaSlow);
    if (data.length < minPeriod + 1) {
      return {
        side: 'HOLD',
        strength: 0,
        reason: 'Insufficient data',
      };
    }

    const macd = getLatestMACD(data, this.macdFast, this.macdSlow, this.macdSignal);
    const emaFast = getLatestEMA(data, this.emaFast);
    const emaSlow = getLatestEMA(data, this.emaSlow);
    const currentPrice = data[data.length - 1].close;

    if (!macd || emaFast === null || emaSlow === null) {
      return {
        side: 'HOLD',
        strength: 0,
        reason: 'Failed to calculate indicators',
      };
    }

    // Bullish signal: MACD crosses above signal AND price above both EMAs
    const macdBullish = macd.macd > macd.signal && macd.histogram > 0;
    const priceAboveEMAs = currentPrice > emaFast && currentPrice > emaSlow;
    const trendBullish = emaFast > emaSlow;

    if (macdBullish && priceAboveEMAs && trendBullish) {
      const strength = Math.min(100, 50 + Math.abs(macd.histogram) * 100 + (currentPrice / emaFast - 1) * 100);

      return {
        side: 'BUY',
        strength: Math.min(100, strength),
        reason: `MACD bullish crossover, price above EMAs, uptrend confirmed`,
        entryPrice: currentPrice,
        stopLoss: this.config.riskManagement.stopLoss,
        takeProfit: this.config.riskManagement.takeProfit,
      };
    }

    // Bearish signal: MACD crosses below signal AND price below both EMAs
    const macdBearish = macd.macd < macd.signal && macd.histogram < 0;
    const priceBelowEMAs = currentPrice < emaFast && currentPrice < emaSlow;
    const trendBearish = emaFast < emaSlow;

    if (macdBearish && priceBelowEMAs && trendBearish) {
      const strength = Math.min(100, 50 + Math.abs(macd.histogram) * 100 + (1 - currentPrice / emaFast) * 100);

      return {
        side: 'SELL',
        strength: Math.min(100, strength),
        reason: `MACD bearish crossover, price below EMAs, downtrend confirmed`,
        entryPrice: currentPrice,
        stopLoss: this.config.riskManagement.stopLoss,
        takeProfit: this.config.riskManagement.takeProfit,
      };
    }

    return {
      side: 'HOLD',
      strength: 0,
      reason: 'No momentum signal',
    };
  }
}

