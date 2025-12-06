// CEX order executor (for centralized exchanges like Binance)

import { Order, OrderSide } from '../../types';
import { orderManager } from './OrderManager';
import { logger } from '../../utils/logger';

class CEXExecutor {
  /**
   * Execute order on CEX
   */
  async executeOrder(order: Order, exchange: string = 'binance'): Promise<boolean> {
    try {
      // In production, this would integrate with exchange APIs
      // For now, we'll simulate execution

      logger.info('CEX order execution', {
        orderId: order.id,
        exchange,
        symbol: order.symbol,
        side: order.side,
      });

      // Simulate order execution
      await new Promise(resolve => setTimeout(resolve, 1000));

      await orderManager.updateOrderStatus(
        order.id,
        'FILLED',
        order.amount,
        order.price
      );

      return true;
    } catch (error) {
      logger.error('CEX order execution failed', error as Error);
      await orderManager.updateOrderStatus(order.id, 'FAILED');
      return false;
    }
  }
}

export const cexExecutor = new CEXExecutor();

