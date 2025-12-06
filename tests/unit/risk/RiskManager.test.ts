// Unit tests for Risk Manager

import { riskManager } from '../../../src/bot/risk/RiskManager';
import { RiskManagementConfig, Position, OrderSide } from '../../../src/types';

describe('RiskManager', () => {
  const defaultConfig: RiskManagementConfig = {
    positionSize: 5,
    positionSizeType: 'PERCENTAGE',
    stopLoss: 2,
    takeProfit: 4,
    maxPositions: 3,
    maxDrawdown: 20,
    dailyLossLimit: 10,
    riskRewardRatio: 2,
  };

  describe('Position Sizing', () => {
    it('should calculate position size as percentage of capital', () => {
      const balance = 1000;
      const price = 100;
      const result = riskManager.calculatePositionSize(balance, price, defaultConfig);

      expect(result.size).toBeCloseTo(0.5); // 5% of $1000 = $50, / $100 = 0.5 tokens
      expect(result.reason).toContain('5%');
    });

    it('should calculate position size for fixed amount', () => {
      const config = {
        ...defaultConfig,
        positionSizeType: 'FIXED' as const,
        positionSize: 50,
      };

      const balance = 1000;
      const price = 100;
      const result = riskManager.calculatePositionSize(balance, price, config);

      expect(result.size).toBeCloseTo(0.5); // $50 / $100 = 0.5 tokens
    });
  });

  describe('Position Limits', () => {
    it('should allow opening position when under limit', () => {
      const positions: Position[] = [
        {
          id: '1',
          symbol: 'BTC/USDT',
          side: 'BUY',
          entryPrice: 100,
          currentPrice: 105,
          amount: 1,
          value: 105,
          unrealizedPnL: 5,
          unrealizedPnLPercent: 5,
          realizedPnL: 0,
          openedAt: Date.now(),
        },
      ];

      const canOpen = riskManager.canOpenPosition(positions, defaultConfig);
      expect(canOpen).toBe(true);
    });

    it('should prevent opening position when at max limit', () => {
      const positions: Position[] = Array.from({ length: 3 }, (_, i) => ({
        id: `${i}`,
        symbol: 'BTC/USDT',
        side: 'BUY' as OrderSide,
        entryPrice: 100,
        currentPrice: 105,
        amount: 1,
        value: 105,
        unrealizedPnL: 5,
        unrealizedPnLPercent: 5,
        realizedPnL: 0,
        openedAt: Date.now(),
      }));

      const canOpen = riskManager.canOpenPosition(positions, defaultConfig);
      expect(canOpen).toBe(false);
    });
  });

  describe('Stop Loss', () => {
    it('should trigger stop-loss for LONG position', () => {
      const position: Position = {
        id: '1',
        symbol: 'BTC/USDT',
        side: 'BUY',
        entryPrice: 100,
        currentPrice: 98, // Below stop-loss (2% = $98)
        amount: 1,
        value: 98,
        unrealizedPnL: -2,
        unrealizedPnLPercent: -2,
        realizedPnL: 0,
        openedAt: Date.now(),
        stopLoss: 2,
      };

      const shouldTrigger = riskManager.shouldTriggerStopLoss(
        position,
        position.currentPrice,
        defaultConfig
      );

      expect(shouldTrigger).toBe(true);
    });

    it('should trigger stop-loss for SHORT position', () => {
      const position: Position = {
        id: '1',
        symbol: 'BTC/USDT',
        side: 'SELL',
        entryPrice: 100,
        currentPrice: 102, // Above stop-loss (2% = $102)
        amount: 1,
        value: 102,
        unrealizedPnL: -2,
        unrealizedPnLPercent: -2,
        realizedPnL: 0,
        openedAt: Date.now(),
        stopLoss: 2,
      };

      const shouldTrigger = riskManager.shouldTriggerStopLoss(
        position,
        position.currentPrice,
        defaultConfig
      );

      expect(shouldTrigger).toBe(true);
    });
  });

  describe('Take Profit', () => {
    it('should trigger take-profit for LONG position', () => {
      const position: Position = {
        id: '1',
        symbol: 'BTC/USDT',
        side: 'BUY',
        entryPrice: 100,
        currentPrice: 104, // Above take-profit (4% = $104)
        amount: 1,
        value: 104,
        unrealizedPnL: 4,
        unrealizedPnLPercent: 4,
        realizedPnL: 0,
        openedAt: Date.now(),
        takeProfit: 4,
      };

      const shouldTrigger = riskManager.shouldTriggerTakeProfit(
        position,
        position.currentPrice,
        defaultConfig
      );

      expect(shouldTrigger).toBe(true);
    });
  });
});

