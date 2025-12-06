// Backtesting engine for historical strategy testing

import { OHLCV, StrategyConfig, Trade, BacktestResult, Timeframe } from '../../types';
import { BaseStrategy } from '../strategies/BaseStrategy';
import { MeanReversionStrategy } from '../strategies/MeanReversion';
import { MomentumStrategy } from '../strategies/Momentum';
import { riskManager } from '../risk/RiskManager';
import { priceService } from '../../api/PriceService';
import { dataLoader } from './DataLoader';
import { logger } from '../../utils/logger';

class BacktestEngine {
  /**
   * Run backtest for a strategy
   */
  async runBacktest(
    config: StrategyConfig,
    startDate: number,
    endDate: number,
    initialCapital: number
  ): Promise<BacktestResult> {
    try {
      logger.info('Starting backtest', { strategy: config.name, startDate, endDate });

      // Load historical data
      const symbol = 'BTC/USDT'; // Should come from config
      const dataResult = await priceService.getHistoricalData(
        symbol,
        config.timeframe,
        1000
      );

      if (!dataResult.success || !dataResult.data) {
        throw new Error('Failed to load historical data');
      }

      // Filter data by date range
      const data = dataResult.data.filter(
        candle => candle.timestamp >= startDate && candle.timestamp <= endDate
      );

      if (data.length === 0) {
        throw new Error('No data in date range');
      }

      // Create strategy instance
      const strategy = this.createStrategy(config);

      // Run simulation
      const result = this.simulateTrading(
        strategy,
        data,
        config,
        initialCapital,
        symbol
      );

      logger.info('Backtest completed', {
        totalReturn: result.totalReturnPercent,
        trades: result.totalTrades,
      });

      return result;
    } catch (error) {
      logger.error('Backtest failed', error as Error);
      throw error;
    }
  }

  /**
   * Simulate trading on historical data
   */
  private simulateTrading(
    strategy: BaseStrategy,
    data: OHLCV[],
    config: StrategyConfig,
    initialCapital: number,
    symbol: string
  ): BacktestResult {
    let capital = initialCapital;
    const trades: Trade[] = [];
    const equityCurve: Array<{ timestamp: number; value: number }> = [
      { timestamp: data[0].timestamp, value: initialCapital },
    ];

    const positions: Array<{
      entryPrice: number;
      amount: number;
      side: 'BUY' | 'SELL';
      entryTime: number;
    }> = [];

    // Minimum data points needed for strategy
    const minDataPoints = 50;
    let currentData: OHLCV[] = [];

    for (let i = 0; i < data.length; i++) {
      currentData.push(data[i]);

      if (currentData.length < minDataPoints) {
        continue;
      }

      // Generate signal
      const signal = strategy.generateSignal(currentData);

      // Update existing positions
      for (let j = positions.length - 1; j >= 0; j--) {
        const position = positions[j];
        const currentPrice = data[i].close;

        // Check stop-loss
        if (position.side === 'BUY') {
          const stopPrice = position.entryPrice * (1 - config.riskManagement.stopLoss / 100);
          if (currentPrice <= stopPrice) {
            // Close position
            const pnl = (currentPrice - position.entryPrice) * position.amount;
            capital += pnl;
            trades.push(this.createTrade(position, currentPrice, pnl, symbol, config.timeframe, data[i].timestamp));
            positions.splice(j, 1);
            continue;
          }

          // Check take-profit
          const takeProfitPrice = position.entryPrice * (1 + config.riskManagement.takeProfit / 100);
          if (currentPrice >= takeProfitPrice) {
            const pnl = (currentPrice - position.entryPrice) * position.amount;
            capital += pnl;
            trades.push(this.createTrade(position, currentPrice, pnl, symbol, config.timeframe, data[i].timestamp));
            positions.splice(j, 1);
            continue;
          }
        }
      }

      // Open new position if signal is valid
      if (signal.side !== 'HOLD' && positions.length < config.riskManagement.maxPositions) {
        const positionSize = riskManager.calculatePositionSize(
          capital,
          data[i].close,
          config.riskManagement
        );

        if (positionSize.size * data[i].close <= capital) {
          positions.push({
            entryPrice: data[i].close,
            amount: positionSize.size,
            side: signal.side as 'BUY' | 'SELL',
            entryTime: data[i].timestamp,
          });
          capital -= positionSize.size * data[i].close;
        }
      }

      // Update equity curve
      let currentValue = capital;
      positions.forEach(pos => {
        if (pos.side === 'BUY') {
          currentValue += pos.amount * data[i].close;
        }
      });

      equityCurve.push({
        timestamp: data[i].timestamp,
        value: currentValue,
      });
    }

    // Close remaining positions
    positions.forEach(position => {
      const exitPrice = data[data.length - 1].close;
      const pnl = position.side === 'BUY'
        ? (exitPrice - position.entryPrice) * position.amount
        : (position.entryPrice - exitPrice) * position.amount;
      capital += pnl;
      trades.push(this.createTrade(position, exitPrice, pnl, symbol, config.timeframe, data[data.length - 1].timestamp));
    });

    // Calculate metrics
    return this.calculateMetrics(initialCapital, capital, trades, equityCurve);
  }

  /**
   * Create trade record
   */
  private createTrade(
    position: { entryPrice: number; amount: number; side: 'BUY' | 'SELL'; entryTime: number },
    exitPrice: number,
    pnl: number,
    symbol: string,
    timeframe: Timeframe,
    exitTime: number
  ): Trade {
    return {
      id: `trade-${Date.now()}-${Math.random()}`,
      symbol,
      side: position.side,
      entryPrice: position.entryPrice,
      exitPrice,
      amount: position.amount,
      pnl,
      pnlPercent: (pnl / (position.entryPrice * position.amount)) * 100,
      fees: 0,
      strategy: 'backtest',
      timeframe,
      openedAt: position.entryTime,
      closedAt: exitTime,
      duration: exitTime - position.entryTime,
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculateMetrics(
    initialCapital: number,
    finalCapital: number,
    trades: Trade[],
    equityCurve: Array<{ timestamp: number; value: number }>
  ): BacktestResult {
    const totalReturn = finalCapital - initialCapital;
    const totalReturnPercent = (totalReturn / initialCapital) * 100;

    // Calculate drawdown
    let maxValue = initialCapital;
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

    // Calculate win rate
    const winningTrades = trades.filter(t => t.pnl > 0);
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;

    // Calculate profit factor
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : undefined;

    // Calculate average win/loss
    const averageWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length
      : undefined;
    const averageLoss = trades.filter(t => t.pnl < 0).length > 0
      ? Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0) / trades.filter(t => t.pnl < 0).length)
      : undefined;

    // Calculate CAGR
    const days = (equityCurve[equityCurve.length - 1].timestamp - equityCurve[0].timestamp) / (1000 * 60 * 60 * 24);
    const years = days / 365.25;
    const cagr = years > 0 ? (Math.pow(finalCapital / initialCapital, 1 / years) - 1) * 100 : undefined;

    // Calculate Sharpe Ratio (simplified)
    const returns = equityCurve.slice(1).map((point, i) => {
      const prevValue = equityCurve[i].value;
      return prevValue > 0 ? (point.value - prevValue) / prevValue : 0;
    });
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : undefined;

    return {
      totalReturn,
      totalReturnPercent,
      cagr,
      sharpeRatio,
      sortinoRatio: undefined, // Would need downside deviation
      calmarRatio: cagr && maxDrawdownPercent > 0 ? cagr / maxDrawdownPercent : undefined,
      maxDrawdown,
      maxDrawdownPercent,
      winRate,
      profitFactor,
      averageWin,
      averageLoss,
      totalTrades: trades.length,
      equityCurve,
      trades,
    };
  }

  /**
   * Create strategy instance
   */
  private createStrategy(config: StrategyConfig): BaseStrategy {
    switch (config.type) {
      case 'MEAN_REVERSION':
        return new MeanReversionStrategy(config);
      case 'MOMENTUM':
        return new MomentumStrategy(config);
      default:
        throw new Error(`Unknown strategy type: ${config.type}`);
    }
  }
}

export const backtestEngine = new BacktestEngine();

