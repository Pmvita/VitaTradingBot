// Stop-loss management

import { Position, RiskManagementConfig } from '../../types';
import { logger } from '../../utils/logger';

class StopLoss {
  /**
   * Check if stop-loss should be triggered
   */
  shouldTrigger(
    position: Position,
    currentPrice: number,
    config: RiskManagementConfig
  ): boolean {
    if (!position.stopLoss) {
      return false;
    }

    const stopPrice = this.calculateStopPrice(position, config);

    if (position.side === 'BUY') {
      return currentPrice <= stopPrice;
    } else {
      return currentPrice >= stopPrice;
    }
  }

  /**
   * Calculate stop-loss price
   */
  calculateStopPrice(position: Position, config: RiskManagementConfig): number {
    if (position.side === 'BUY') {
      return position.entryPrice * (1 - (position.stopLoss || config.stopLoss) / 100);
    } else {
      return position.entryPrice * (1 + (position.stopLoss || config.stopLoss) / 100);
    }
  }

  /**
   * Update trailing stop-loss
   */
  updateTrailingStop(
    position: Position,
    currentPrice: number,
    trailingDistance: number
  ): number | null {
    if (position.side === 'BUY') {
      const newStop = currentPrice * (1 - trailingDistance / 100);
      const currentStop = this.calculateStopPrice(position, {
        stopLoss: position.stopLoss || 2,
      } as RiskManagementConfig);

      if (newStop > currentStop) {
        return newStop;
      }
    } else {
      const newStop = currentPrice * (1 + trailingDistance / 100);
      const currentStop = this.calculateStopPrice(position, {
        stopLoss: position.stopLoss || 2,
      } as RiskManagementConfig);

      if (newStop < currentStop) {
        return newStop;
      }
    }

    return null;
  }
}

export const stopLoss = new StopLoss();

