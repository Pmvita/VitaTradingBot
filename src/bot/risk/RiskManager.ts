// Risk management system

import {
  RiskManagementConfig,
  Position,
  OrderSide,
  BotState,
  CurrencyAllocation,
} from '../../types';
import { logger } from '../../utils/logger';

export interface PositionSizingResult {
  size: number;
  reason: string;
}

class RiskManager {
  /**
   * Calculate position size based on risk management config
   */
  calculatePositionSize(
    balance: number,
    price: number,
    config: RiskManagementConfig
  ): PositionSizingResult {
    let size = 0;
    let reason = '';

    switch (config.positionSizeType) {
      case 'PERCENTAGE':
        size = (balance * config.positionSize) / 100;
        reason = `${config.positionSize}% of capital`;
        break;

      case 'FIXED':
        size = config.positionSize;
        reason = `Fixed amount: $${config.positionSize}`;
        break;

      case 'KELLY':
        // Kelly Criterion would require win rate and average win/loss
        // For now, use a conservative fraction of Kelly
        size = (balance * config.positionSize) / 100;
        reason = `Kelly-based sizing: ${config.positionSize}%`;
        break;

      case 'VOLATILITY':
        // Volatility-based sizing would require ATR calculation
        // For now, use percentage
        size = (balance * config.positionSize) / 100;
        reason = `Volatility-based sizing: ${config.positionSize}%`;
        break;
    }

    // Convert to token amount
    const tokenAmount = size / price;

    return {
      size: tokenAmount,
      reason,
    };
  }

  /**
   * Check if a new position can be opened
   */
  canOpenPosition(
    currentPositions: Position[],
    config: RiskManagementConfig
  ): boolean {
    // Check max positions limit
    if (currentPositions.length >= config.maxPositions) {
      logger.warn('Max positions limit reached', {
        current: currentPositions.length,
        max: config.maxPositions,
      });
      return false;
    }

    return true;
  }

  /**
   * Check if stop-loss should be triggered
   */
  shouldTriggerStopLoss(
    position: Position,
    currentPrice: number,
    config: RiskManagementConfig
  ): boolean {
    if (!position.stopLoss) {
      return false;
    }

    const stopPrice = position.entryPrice * (1 - position.stopLoss / 100);

    if (position.side === 'BUY') {
      return currentPrice <= stopPrice;
    } else {
      // SHORT position
      return currentPrice >= stopPrice;
    }
  }

  /**
   * Check if take-profit should be triggered
   */
  shouldTriggerTakeProfit(
    position: Position,
    currentPrice: number,
    config: RiskManagementConfig
  ): boolean {
    if (!position.takeProfit) {
      return false;
    }

    const takeProfitPrice = position.entryPrice * (1 + position.takeProfit / 100);

    if (position.side === 'BUY') {
      return currentPrice >= takeProfitPrice;
    } else {
      // SHORT position
      return currentPrice <= takeProfitPrice;
    }
  }

  /**
   * Check portfolio-level risk limits
   */
  checkPortfolioRisk(
    botState: BotState,
    config: RiskManagementConfig
  ): { allowed: boolean; reason?: string } {
    // Check maximum drawdown
    if (botState.totalPnL < 0) {
      const drawdownPercent = Math.abs((botState.totalPnL / botState.balance) * 100);
      if (drawdownPercent >= config.maxDrawdown) {
        return {
          allowed: false,
          reason: `Maximum drawdown limit reached: ${drawdownPercent.toFixed(2)}%`,
        };
      }
    }

    // Check daily loss limit
    // This would require tracking daily P&L separately
    // For now, we'll check total P&L

    return { allowed: true };
  }

  /**
   * Calculate stop-loss price
   */
  calculateStopLoss(
    entryPrice: number,
    side: OrderSide,
    stopLossPercent: number
  ): number {
    if (side === 'BUY') {
      return entryPrice * (1 - stopLossPercent / 100);
    } else {
      return entryPrice * (1 + stopLossPercent / 100);
    }
  }

  /**
   * Calculate take-profit price
   */
  calculateTakeProfit(
    entryPrice: number,
    side: OrderSide,
    takeProfitPercent: number
  ): number {
    if (side === 'BUY') {
      return entryPrice * (1 + takeProfitPercent / 100);
    } else {
      return entryPrice * (1 - takeProfitPercent / 100);
    }
  }
}

export const riskManager = new RiskManager();

