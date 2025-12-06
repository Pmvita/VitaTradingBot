// Take-profit management

import { Position, RiskManagementConfig } from '../../types';

class TakeProfit {
  /**
   * Check if take-profit should be triggered
   */
  shouldTrigger(
    position: Position,
    currentPrice: number,
    config: RiskManagementConfig
  ): boolean {
    if (!position.takeProfit) {
      return false;
    }

    const takeProfitPrice = this.calculateTakeProfitPrice(position, config);

    if (position.side === 'BUY') {
      return currentPrice >= takeProfitPrice;
    } else {
      return currentPrice <= takeProfitPrice;
    }
  }

  /**
   * Calculate take-profit price
   */
  calculateTakeProfitPrice(position: Position, config: RiskManagementConfig): number {
    if (position.side === 'BUY') {
      return position.entryPrice * (1 + (position.takeProfit || config.takeProfit) / 100);
    } else {
      return position.entryPrice * (1 - (position.takeProfit || config.takeProfit) / 100);
    }
  }

  /**
   * Calculate partial exit amount
   */
  calculatePartialExit(amount: number, percentage: number): number {
    return amount * (percentage / 100);
  }
}

export const takeProfit = new TakeProfit();

