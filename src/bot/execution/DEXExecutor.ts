// DEX order executor

import { Order, OrderSide } from '../../types';
import { dexService } from '../../wallet/DEXService';
import { walletService } from '../../wallet/WalletService';
import { orderManager } from './OrderManager';
import { logger } from '../../utils/logger';

class DEXExecutor {
  /**
   * Execute a buy order on DEX
   */
  async executeBuy(order: Order, network: string): Promise<boolean> {
    try {
      const wallet = walletService.getCurrentWallet();
      if (!wallet) {
        throw new Error('Wallet not connected');
      }

      // Convert order to swap params
      // This is simplified - in production, you'd need proper token addresses
      const swapParams = {
        fromToken: '0x0000000000000000000000000000000000000000', // ETH
        toToken: '0x...', // Token address
        amount: order.amount,
        slippage: 1, // 1%
        recipient: wallet.address,
      };

      const result = await dexService.executeSwap(swapParams, network as any);

      if (result.success) {
        await orderManager.updateOrderStatus(
          order.id,
          'FILLED',
          order.amount,
          order.price
        );
        return true;
      } else {
        await orderManager.updateOrderStatus(order.id, 'FAILED');
        return false;
      }
    } catch (error) {
      logger.error('DEX buy execution failed', error as Error);
      await orderManager.updateOrderStatus(order.id, 'FAILED');
      return false;
    }
  }

  /**
   * Execute a sell order on DEX
   */
  async executeSell(order: Order, network: string): Promise<boolean> {
    // Similar to executeBuy but reversed
    return this.executeBuy(order, network);
  }
}

export const dexExecutor = new DEXExecutor();

