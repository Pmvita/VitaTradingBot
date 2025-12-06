// Base strategy class that all strategies extend

import { OHLCV, Timeframe, OrderSide, StrategyConfig, Position, Signal } from '../../types';

export type { Signal };

export abstract class BaseStrategy {
  protected config: StrategyConfig;

  constructor(config: StrategyConfig) {
    this.config = config;
  }

  /**
   * Generate trading signal based on market data
   */
  abstract generateSignal(data: OHLCV[]): Signal;

  /**
   * Get strategy name
   */
  abstract getName(): string;

  /**
   * Get recommended timeframes for this strategy
   */
  abstract getRecommendedTimeframes(): Timeframe[];

  /**
   * Validate strategy configuration
   */
  abstract validateConfig(): boolean;

  /**
   * Update strategy with new market data
   */
  update(data: OHLCV[]): Signal {
    if (!this.validateConfig()) {
      return {
        side: 'HOLD',
        strength: 0,
        reason: 'Invalid strategy configuration',
      };
    }

    return this.generateSignal(data);
  }

  /**
   * Check if strategy should trade based on current positions
   */
  shouldTrade(currentPositions: Position[]): boolean {
    // Check if we have too many positions
    if (currentPositions.length >= this.config.riskManagement.maxPositions) {
      return false;
    }

    // Check if we already have a position in this symbol
    // This would be checked by the bot, not the strategy

    return true;
  }

  /**
   * Get strategy configuration
   */
  getConfig(): StrategyConfig {
    return this.config;
  }
}

