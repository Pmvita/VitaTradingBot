// Trade repository for storing and retrieving trade history

import { Trade, Position, Order } from '../types';
import { database } from './Database';
import { logger } from '../utils/logger';

class TradeRepository {
  /**
   * Save a trade
   */
  async saveTrade(trade: Trade): Promise<void> {
    try {
      await database.insert('trades', {
        id: trade.id,
        ...trade,
      });
      logger.debug('Trade saved', { tradeId: trade.id });
    } catch (error) {
      logger.error('Failed to save trade', error as Error);
      throw error;
    }
  }

  /**
   * Get trade by ID
   */
  async getTrade(id: string): Promise<Trade | null> {
    try {
      const record = await database.getById('trades', id);
      return record as Trade | null;
    } catch (error) {
      logger.error('Failed to get trade', error as Error);
      return null;
    }
  }

  /**
   * Get all trades
   */
  async getAllTrades(): Promise<Trade[]> {
    try {
      const records = await database.getAll('trades');
      return records as Trade[];
    } catch (error) {
      logger.error('Failed to get trades', error as Error);
      return [];
    }
  }

  /**
   * Get trades by strategy
   */
  async getTradesByStrategy(strategyId: string): Promise<Trade[]> {
    try {
      const trades = await database.query('trades', (record) => {
        return (record as Trade).strategy === strategyId;
      });
      return trades as Trade[];
    } catch (error) {
      logger.error('Failed to get trades by strategy', error as Error);
      return [];
    }
  }

  /**
   * Get trades by date range
   */
  async getTradesByDateRange(startDate: number, endDate: number): Promise<Trade[]> {
    try {
      const trades = await database.query('trades', (record) => {
        const trade = record as Trade;
        return trade.openedAt >= startDate && trade.openedAt <= endDate;
      });
      return trades as Trade[];
    } catch (error) {
      logger.error('Failed to get trades by date range', error as Error);
      return [];
    }
  }

  /**
   * Save a position
   */
  async savePosition(position: Position): Promise<void> {
    try {
      await database.insert('positions', {
        id: position.id,
        ...position,
      });
    } catch (error) {
      logger.error('Failed to save position', error as Error);
      throw error;
    }
  }

  /**
   * Get all positions
   */
  async getAllPositions(): Promise<Position[]> {
    try {
      const records = await database.getAll('positions');
      return records as Position[];
    } catch (error) {
      logger.error('Failed to get positions', error as Error);
      return [];
    }
  }

  /**
   * Update position
   */
  async updatePosition(id: string, updates: Partial<Position>): Promise<void> {
    try {
      await database.update('positions', id, updates);
    } catch (error) {
      logger.error('Failed to update position', error as Error);
      throw error;
    }
  }

  /**
   * Delete position
   */
  async deletePosition(id: string): Promise<void> {
    try {
      await database.delete('positions', id);
    } catch (error) {
      logger.error('Failed to delete position', error as Error);
      throw error;
    }
  }

  /**
   * Save an order
   */
  async saveOrder(order: Order): Promise<void> {
    try {
      await database.insert('orders', {
        id: order.id,
        ...order,
      });
    } catch (error) {
      logger.error('Failed to save order', error as Error);
      throw error;
    }
  }

  /**
   * Get all orders
   */
  async getAllOrders(): Promise<Order[]> {
    try {
      const records = await database.getAll('orders');
      return records as Order[];
    } catch (error) {
      logger.error('Failed to get orders', error as Error);
      return [];
    }
  }

  /**
   * Update order
   */
  async updateOrder(id: string, updates: Partial<Order>): Promise<void> {
    try {
      await database.update('orders', id, updates);
    } catch (error) {
      logger.error('Failed to update order', error as Error);
      throw error;
    }
  }
}

export const tradeRepository = new TradeRepository();

