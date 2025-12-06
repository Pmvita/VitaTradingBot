// Portfolio-level risk management

import { BotState, RiskManagementConfig, Position } from '../../types';
import { logger } from '../../utils/logger';

class PortfolioRisk {
  /**
   * Check maximum drawdown limit
   */
  checkMaxDrawdown(botState: BotState, config: RiskManagementConfig): {
    allowed: boolean;
    reason?: string;
  } {
    if (botState.totalPnL < 0) {
      const drawdownPercent = Math.abs((botState.totalPnL / botState.balance) * 100);
      if (drawdownPercent >= config.maxDrawdown) {
        return {
          allowed: false,
          reason: `Maximum drawdown limit reached: ${drawdownPercent.toFixed(2)}%`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Check daily loss limit
   */
  checkDailyLossLimit(
    dailyPnL: number,
    balance: number,
    config: RiskManagementConfig
  ): { allowed: boolean; reason?: string } {
    if (dailyPnL < 0) {
      const lossPercent = Math.abs((dailyPnL / balance) * 100);
      if (lossPercent >= config.dailyLossLimit) {
        return {
          allowed: false,
          reason: `Daily loss limit reached: ${lossPercent.toFixed(2)}%`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Check position correlation
   */
  checkCorrelation(positions: Position[]): { allowed: boolean; reason?: string } {
    // Simple correlation check - in production, would calculate actual correlation
    const symbols = new Set(positions.map(p => p.symbol));
    
    // If too many positions in same asset, warn
    const symbolCounts = new Map<string, number>();
    positions.forEach(p => {
      symbolCounts.set(p.symbol, (symbolCounts.get(p.symbol) || 0) + 1);
    });

    for (const [symbol, count] of symbolCounts.entries()) {
      if (count > 2) {
        return {
          allowed: false,
          reason: `Too many positions in ${symbol}: ${count}`,
        };
      }
    }

    return { allowed: true };
  }
}

export const portfolioRisk = new PortfolioRisk();

