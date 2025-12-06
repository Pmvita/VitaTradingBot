// Order management system

import { Order, OrderStatus, OrderType, OrderSide } from '../../types';
import { tradeRepository } from '../../storage/TradeRepository';
import { logger } from '../../utils/logger';

class OrderManager {
  private orders: Map<string, Order> = new Map();

  /**
   * Create a new order
   */
  createOrder(
    type: OrderType,
    side: OrderSide,
    symbol: string,
    amount: string,
    price?: string
  ): Order {
    const order: Order = {
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      side,
      symbol,
      amount,
      price,
      status: 'PENDING',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.orders.set(order.id, order);
    tradeRepository.saveOrder(order);

    logger.info('Order created', { orderId: order.id, type, side, symbol });

    return order;
  }

  /**
   * Get order by ID
   */
  getOrder(id: string): Order | undefined {
    return this.orders.get(id);
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    filledAmount?: string,
    filledPrice?: string
  ): Promise<void> {
    const order = this.orders.get(id);
    if (!order) {
      logger.warn('Order not found', { orderId: id });
      return;
    }

    order.status = status;
    order.updatedAt = Date.now();

    if (filledAmount) {
      order.filledAmount = filledAmount;
    }

    if (filledPrice) {
      order.filledPrice = filledPrice;
    }

    if (status === 'FILLED' || status === 'PARTIALLY_FILLED') {
      order.executedAt = Date.now();
    }

    await tradeRepository.updateOrder(id, order);
    logger.info('Order status updated', { orderId: id, status });
  }

  /**
   * Cancel order
   */
  async cancelOrder(id: string): Promise<void> {
    await this.updateOrderStatus(id, 'CANCELLED');
    this.orders.delete(id);
  }

  /**
   * Get all orders
   */
  getAllOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  /**
   * Get pending orders
   */
  getPendingOrders(): Order[] {
    return Array.from(this.orders.values()).filter(
      order => order.status === 'PENDING'
    );
  }
}

export const orderManager = new OrderManager();

