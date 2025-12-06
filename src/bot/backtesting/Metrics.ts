// Performance metrics calculations

import { Trade, BacktestResult } from '../../types';

export class MetricsCalculator {
  /**
   * Calculate Sharpe Ratio
   */
  static calculateSharpeRatio(
    returns: number[],
    riskFreeRate: number = 0.02
  ): number | undefined {
    if (returns.length === 0) {
      return undefined;
    }

    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) {
      return undefined;
    }

    // Annualized Sharpe Ratio
    const annualizedReturn = meanReturn * 252; // Assuming daily returns
    const annualizedStdDev = stdDev * Math.sqrt(252);
    return (annualizedReturn - riskFreeRate) / annualizedStdDev;
  }

  /**
   * Calculate Sortino Ratio
   */
  static calculateSortinoRatio(
    returns: number[],
    riskFreeRate: number = 0.02
  ): number | undefined {
    if (returns.length === 0) {
      return undefined;
    }

    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const downsideReturns = returns.filter(r => r < 0);
    
    if (downsideReturns.length === 0) {
      return undefined;
    }

    const downsideVariance = downsideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downsideReturns.length;
    const downsideStdDev = Math.sqrt(downsideVariance);

    if (downsideStdDev === 0) {
      return undefined;
    }

    const annualizedReturn = meanReturn * 252;
    const annualizedDownsideStdDev = downsideStdDev * Math.sqrt(252);
    return (annualizedReturn - riskFreeRate) / annualizedDownsideStdDev;
  }

  /**
   * Calculate Maximum Drawdown
   */
  static calculateMaxDrawdown(equityCurve: Array<{ timestamp: number; value: number }>): {
    maxDrawdown: number;
    maxDrawdownPercent: number;
  } {
    if (equityCurve.length === 0) {
      return { maxDrawdown: 0, maxDrawdownPercent: 0 };
    }

    let maxValue = equityCurve[0].value;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;

    equityCurve.forEach(point => {
      if (point.value > maxValue) {
        maxValue = point.value;
      }
      const drawdown = maxValue - point.value;
      const drawdownPercent = (drawdown / maxValue) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
      }
    });

    return { maxDrawdown, maxDrawdownPercent };
  }

  /**
   * Calculate Win Rate
   */
  static calculateWinRate(trades: Trade[]): number {
    if (trades.length === 0) {
      return 0;
    }
    const winningTrades = trades.filter(t => t.pnl > 0);
    return (winningTrades.length / trades.length) * 100;
  }

  /**
   * Calculate Profit Factor
   */
  static calculateProfitFactor(trades: Trade[]): number | undefined {
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);

    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));

    if (grossLoss === 0) {
      return undefined;
    }

    return grossProfit / grossLoss;
  }

  /**
   * Calculate CAGR
   */
  static calculateCAGR(
    initialValue: number,
    finalValue: number,
    days: number
  ): number | undefined {
    if (days <= 0 || initialValue <= 0) {
      return undefined;
    }

    const years = days / 365.25;
    if (years <= 0) {
      return undefined;
    }

    return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
  }
}

