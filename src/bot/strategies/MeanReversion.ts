// Mean Reversion strategy using Bollinger Bands and RSI

import { BaseStrategy, Signal } from './BaseStrategy';
import { OHLCV, Timeframe, OrderSide, StrategyConfig } from '../../types';
import { getLatestBollingerBands } from '../indicators/BollingerBands';
import { getLatestRSI } from '../indicators/RSI';

export class MeanReversionStrategy extends BaseStrategy {
  private bollingerPeriod: number = 20;
  private bollingerStdDev: number = 2;
  private rsiPeriod: number = 14;
  private rsiOversold: number = 30;
  private rsiOverbought: number = 70;

  constructor(config: StrategyConfig) {
    super(config);
    this.loadParameters();
  }

  private loadParameters(): void {
    const params = this.config.parameters;
    this.bollingerPeriod = params.bollingerPeriod || 20;
    this.bollingerStdDev = params.bollingerStdDev || 2;
    this.rsiPeriod = params.rsiPeriod || 14;
    this.rsiOversold = params.rsiOversold || 30;
    this.rsiOverbought = params.rsiOverbought || 70;
  }

  getName(): string {
    return 'Mean Reversion';
  }

  getRecommendedTimeframes(): Timeframe[] {
    return ['15m', '1h', '4h'];
  }

  validateConfig(): boolean {
    return (
      this.bollingerPeriod > 0 &&
      this.bollingerStdDev > 0 &&
      this.rsiPeriod > 0 &&
      this.rsiOversold >= 0 &&
      this.rsiOversold < 50 &&
      this.rsiOverbought > 50 &&
      this.rsiOverbought <= 100
    );
  }

  generateSignal(data: OHLCV[]): Signal {
    if (data.length < Math.max(this.bollingerPeriod, this.rsiPeriod) + 1) {
      return {
        side: 'HOLD',
        strength: 0,
        reason: 'Insufficient data',
      };
    }

    const currentPrice = data[data.length - 1].close;
    const bands = getLatestBollingerBands(data, this.bollingerPeriod, this.bollingerStdDev);
    const rsi = getLatestRSI(data, this.rsiPeriod);

    if (!bands || rsi === null) {
      return {
        side: 'HOLD',
        strength: 0,
        reason: 'Failed to calculate indicators',
      };
    }

    // Buy signal: Price touches lower band AND RSI is oversold
    if (currentPrice <= bands.lower && rsi < this.rsiOversold) {
      const distanceFromLower = ((bands.lower - currentPrice) / bands.lower) * 100;
      const strength = Math.min(100, 50 + (this.rsiOversold - rsi) + distanceFromLower * 10);

      return {
        side: 'BUY',
        strength: Math.min(100, strength),
        reason: `Price at lower Bollinger Band (${currentPrice.toFixed(2)}) and RSI oversold (${rsi.toFixed(2)})`,
        entryPrice: currentPrice,
        stopLoss: this.config.riskManagement.stopLoss,
        takeProfit: this.config.riskManagement.takeProfit,
      };
    }

    // Sell signal: Price touches upper band AND RSI is overbought
    if (currentPrice >= bands.upper && rsi > this.rsiOverbought) {
      const distanceFromUpper = ((currentPrice - bands.upper) / bands.upper) * 100;
      const strength = Math.min(100, 50 + (rsi - this.rsiOverbought) + distanceFromUpper * 10);

      return {
        side: 'SELL',
        strength: Math.min(100, strength),
        reason: `Price at upper Bollinger Band (${currentPrice.toFixed(2)}) and RSI overbought (${rsi.toFixed(2)})`,
        entryPrice: currentPrice,
        stopLoss: this.config.riskManagement.stopLoss,
        takeProfit: this.config.riskManagement.takeProfit,
      };
    }

    return {
      side: 'HOLD',
      strength: 0,
      reason: 'No mean reversion signal',
    };
  }
}

