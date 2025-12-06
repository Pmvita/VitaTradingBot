// Paper trading executor for simulated trading with multi-currency support

import { Order, Position, Trade, CurrencyBalance, CurrencyAllocation } from '../../types';
import { priceService } from '../../api/PriceService';
import { currencyConversionService } from '../../api/CurrencyConversionService';
import { orderManager } from './OrderManager';
import { tradeRepository } from '../../storage/TradeRepository';
import { logger } from '../../utils/logger';

class PaperTradingExecutor {
  private balances: Map<string, CurrencyBalance> = new Map();
  private allocations: Map<string, CurrencyAllocation> = new Map();
  private virtualPositions: Map<string, Position> = new Map();
  private slippage = 0.001; // 0.1% slippage
  private fees = 0.001; // 0.1% fees

  /**
   * Initialize paper trading with virtual capital
   */
  initialize(initialCapital: number, currency: string = 'USDT'): void {
    this.balances.clear();
    this.allocations.clear();
    this.virtualPositions.clear();

    // Initialize with specified currency
    this.balances.set(currency, {
      currency,
      amount: initialCapital,
      usdValue: initialCapital, // Assuming USDT is 1:1 with USD
    });

    logger.info('Paper trading initialized', { initialCapital, currency });
  }

  /**
   * Get balance for a specific currency
   */
  getBalance(currency: string): CurrencyBalance | null {
    return this.balances.get(currency) || null;
  }

  /**
   * Get all balances
   */
  getAllBalances(): CurrencyBalance[] {
    return Array.from(this.balances.values());
  }

  /**
   * Get total USD value of all balances
   */
  async getTotalUsdValue(): Promise<number> {
    let total = 0;
    for (const balance of this.balances.values()) {
      if (balance.currency === 'USDT' || balance.currency === 'USDC') {
        total += balance.amount;
      } else {
        // Get current price and calculate USD value
        const priceResult = await priceService.getPrice(`${balance.currency}/USDT`);
        if (priceResult.success && priceResult.data) {
          total += balance.amount * priceResult.data.price;
        } else {
          total += balance.usdValue; // Fallback to stored USD value
        }
      }
    }
    return total;
  }

  /**
   * Convert currency
   */
  async convertCurrency(fromCurrency: string, toCurrency: string, amount: number): Promise<boolean> {
    try {
      const fromBalance = this.balances.get(fromCurrency);
      if (!fromBalance || fromBalance.amount < amount) {
        logger.warn('Insufficient balance for conversion', { fromCurrency, amount, balance: fromBalance?.amount });
        return false;
      }

      // Perform conversion
      const conversionResult = await currencyConversionService.convert(fromCurrency, toCurrency, amount);
      if (!conversionResult.success || !conversionResult.data) {
        logger.error('Currency conversion failed', new Error(conversionResult.error || 'Unknown error'));
        return false;
      }

      const conversion = conversionResult.data;

      // Update balances
      fromBalance.amount -= amount;
      if (fromBalance.amount <= 0) {
        this.balances.delete(fromCurrency);
      } else {
        // Update USD value
        const priceResult = await priceService.getPrice(`${fromCurrency}/USDT`);
        if (priceResult.success && priceResult.data) {
          fromBalance.usdValue = fromBalance.amount * priceResult.data.price;
        }
      }

      // Add to destination currency
      const toBalance = this.balances.get(toCurrency);
      if (toBalance) {
        toBalance.amount += conversion.receivedAmount;
        const priceResult = await priceService.getPrice(`${toCurrency}/USDT`);
        if (priceResult.success && priceResult.data) {
          toBalance.usdValue = toBalance.amount * priceResult.data.price;
        } else if (toCurrency === 'USDT' || toCurrency === 'USDC') {
          toBalance.usdValue = toBalance.amount;
        }
      } else {
        // Create new balance
        const priceResult = await priceService.getPrice(`${toCurrency}/USDT`);
        const usdValue = toCurrency === 'USDT' || toCurrency === 'USDC'
          ? conversion.receivedAmount
          : conversion.receivedAmount * (priceResult.success && priceResult.data ? priceResult.data.price : 0);

        this.balances.set(toCurrency, {
          currency: toCurrency,
          amount: conversion.receivedAmount,
          usdValue,
        });
      }

      logger.info('Currency converted', { conversion });
      return true;
    } catch (error) {
      logger.error('Currency conversion failed', error as Error);
      return false;
    }
  }

  /**
   * Set allocation for a currency
   */
  setAllocation(currency: string, allocation: CurrencyAllocation): void {
    this.allocations.set(currency, allocation);
    logger.info('Allocation set', { currency, allocation });
  }

  /**
   * Get allocation for a currency
   */
  getAllocation(currency: string): CurrencyAllocation | null {
    return this.allocations.get(currency) || null;
  }

  /**
   * Get available amount for trading (considering allocations)
   */
  async getAvailableForTrading(currency: string): Promise<number> {
    const balance = this.balances.get(currency);
    if (!balance) {
      return 0;
    }

    const allocation = this.allocations.get(currency);
    if (!allocation) {
      return balance.amount;
    }

    // Calculate locked amount
    let lockedAmount = 0;
    if (allocation.lockedType === 'fixed') {
      // Convert fixed USD amount to currency amount
      const priceResult = await priceService.getPrice(`${currency}/USDT`);
      if (priceResult.success && priceResult.data) {
        lockedAmount = allocation.lockedAmount / priceResult.data.price;
      } else {
        lockedAmount = allocation.lockedAmount; // Assume 1:1 for stablecoins
      }
    } else {
      // Percentage of total portfolio
      const totalUsd = await this.getTotalUsdValue();
      const lockedUsd = (totalUsd * allocation.lockedAmount) / 100;
      const priceResult = await priceService.getPrice(`${currency}/USDT`);
      if (priceResult.success && priceResult.data) {
        lockedAmount = lockedUsd / priceResult.data.price;
      } else {
        lockedAmount = lockedUsd;
      }
    }

    return Math.max(0, balance.amount - lockedAmount);
  }

  /**
   * Check if there's already a position for a currency
   */
  hasPositionForCurrency(currency: string): boolean {
    return Array.from(this.virtualPositions.values()).some(
      p => this.extractCurrencyFromSymbol(p.symbol) === currency
    );
  }

  /**
   * Extract currency from symbol (e.g., "BTC/USDT" -> "BTC")
   */
  private extractCurrencyFromSymbol(symbol: string): string {
    return symbol.split('/')[0];
  }

  /**
   * Execute buy order in paper trading
   */
  async executeBuy(order: Order, symbol: string): Promise<boolean> {
    try {
      const baseCurrency = this.extractCurrencyFromSymbol(symbol);
      
      // Check if position already exists for this currency
      if (this.hasPositionForCurrency(baseCurrency)) {
        logger.warn('Position already exists for currency', { currency: baseCurrency, symbol });
        await orderManager.updateOrderStatus(order.id, 'FAILED');
        return false;
      }

      // Get current price
      const priceResult = await priceService.getPrice(symbol);
      if (!priceResult.success || !priceResult.data) {
        return false;
      }

      const currentPrice = priceResult.data.price;
      const amount = parseFloat(order.amount);
      const cost = amount * currentPrice * (1 + this.slippage + this.fees);

      // Determine which currency to use for payment (quote currency, e.g., USDT)
      const quoteCurrency = symbol.split('/')[1] || 'USDT';
      const quoteBalance = this.balances.get(quoteCurrency);

      // Check if we have enough balance in quote currency
      if (!quoteBalance || quoteBalance.amount < cost) {
        // Try automatic conversion if enabled
        const available = await this.getAvailableForTrading(quoteCurrency);
        if (available < cost) {
          logger.warn('Insufficient balance for paper trade', {
            cost,
            balance: quoteBalance?.amount,
            available,
            currency: quoteCurrency,
          });
          await orderManager.updateOrderStatus(order.id, 'FAILED');
          return false;
        }
      }

      // Check allocation limits
      const available = await this.getAvailableForTrading(quoteCurrency);
      if (cost > available) {
        logger.warn('Trade exceeds allocation limit', {
          cost,
          available,
          currency: quoteCurrency,
        });
        await orderManager.updateOrderStatus(order.id, 'FAILED');
        return false;
      }

      // Deduct cost from balance
      if (quoteBalance) {
        quoteBalance.amount -= cost;
        if (quoteBalance.amount <= 0) {
          this.balances.delete(quoteCurrency);
        } else {
          // Update USD value
          if (quoteCurrency === 'USDT' || quoteCurrency === 'USDC') {
            quoteBalance.usdValue = quoteBalance.amount;
          } else {
            const priceResult = await priceService.getPrice(`${quoteCurrency}/USDT`);
            if (priceResult.success && priceResult.data) {
              quoteBalance.usdValue = quoteBalance.amount * priceResult.data.price;
            }
          }
        }
      }

      // Create position
      const position: Position = {
        id: `paper-pos-${Date.now()}`,
        symbol,
        side: 'BUY',
        entryPrice: currentPrice,
        currentPrice: currentPrice,
        amount,
        value: amount * currentPrice,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        realizedPnL: 0,
        openedAt: Date.now(),
      };

      this.virtualPositions.set(position.id, position);

      await orderManager.updateOrderStatus(order.id, 'FILLED', order.amount, currentPrice.toString());

      logger.info('Paper trade executed', { orderId: order.id, positionId: position.id });

      return true;
    } catch (error) {
      logger.error('Paper trading buy failed', error as Error);
      return false;
    }
  }

  /**
   * Execute sell order in paper trading
   */
  async executeSell(order: Order, symbol: string): Promise<boolean> {
    try {
      const baseCurrency = this.extractCurrencyFromSymbol(symbol);
      
      // Find position to close
      const position = Array.from(this.virtualPositions.values()).find(
        p => this.extractCurrencyFromSymbol(p.symbol) === baseCurrency
      );

      if (!position) {
        logger.warn('No position found to close', { symbol, baseCurrency });
        return false;
      }

      // Get current price
      const priceResult = await priceService.getPrice(symbol);
      if (!priceResult.success || !priceResult.data) {
        return false;
      }

      const currentPrice = priceResult.data.price;
      const quoteCurrency = symbol.split('/')[1] || 'USDT';
      const proceeds = position.amount * currentPrice * (1 - this.slippage - this.fees);
      const pnl = (currentPrice - position.entryPrice) * position.amount;

      // Credit proceeds to quote currency balance
      const quoteBalance = this.balances.get(quoteCurrency);
      if (quoteBalance) {
        quoteBalance.amount += proceeds;
        if (quoteCurrency === 'USDT' || quoteCurrency === 'USDC') {
          quoteBalance.usdValue = quoteBalance.amount;
        } else {
          const priceResult = await priceService.getPrice(`${quoteCurrency}/USDT`);
          if (priceResult.success && priceResult.data) {
            quoteBalance.usdValue = quoteBalance.amount * priceResult.data.price;
          }
        }
      } else {
        // Create new balance
        this.balances.set(quoteCurrency, {
          currency: quoteCurrency,
          amount: proceeds,
          usdValue: quoteCurrency === 'USDT' || quoteCurrency === 'USDC' ? proceeds : proceeds * currentPrice,
        });
      }

      // Create trade record
      const trade: Trade = {
        id: `paper-trade-${Date.now()}`,
        symbol,
        side: position.side,
        entryPrice: position.entryPrice,
        exitPrice: currentPrice,
        amount: position.amount,
        pnl,
        pnlPercent: (pnl / (position.entryPrice * position.amount)) * 100,
        fees: position.amount * currentPrice * this.fees,
        strategy: 'paper',
        timeframe: '1h',
        openedAt: position.openedAt,
        closedAt: Date.now(),
        duration: Date.now() - position.openedAt,
      };

      this.virtualPositions.delete(position.id);
      await tradeRepository.saveTrade(trade);
      await orderManager.updateOrderStatus(order.id, 'FILLED', order.amount, currentPrice.toString());

      logger.info('Paper trade closed', { tradeId: trade.id, pnl });

      return true;
    } catch (error) {
      logger.error('Paper trading sell failed', error as Error);
      return false;
    }
  }

  /**
   * Get virtual positions
   */
  getPositions(): Position[] {
    return Array.from(this.virtualPositions.values());
  }

  /**
   * Update position prices and balance USD values
   */
  async updatePositions(): Promise<void> {
    // Update position prices
    for (const position of this.virtualPositions.values()) {
      const priceResult = await priceService.getPrice(position.symbol);
      if (priceResult.success && priceResult.data) {
        position.currentPrice = priceResult.data.price;
        if (position.side === 'BUY') {
          position.unrealizedPnL = (position.currentPrice - position.entryPrice) * position.amount;
        } else {
          position.unrealizedPnL = (position.entryPrice - position.currentPrice) * position.amount;
        }
        position.unrealizedPnLPercent = (position.unrealizedPnL / (position.entryPrice * position.amount)) * 100;
        position.value = position.amount * position.currentPrice;
      }
    }

    // Update balance USD values
    for (const balance of this.balances.values()) {
      if (balance.currency === 'USDT' || balance.currency === 'USDC') {
        balance.usdValue = balance.amount;
      } else {
        const priceResult = await priceService.getPrice(`${balance.currency}/USDT`);
        if (priceResult.success && priceResult.data) {
          balance.usdValue = balance.amount * priceResult.data.price;
        }
      }
    }
  }

  /**
   * Get legacy balance (for backward compatibility) - returns total USD value
   */
  getLegacyBalance(): number {
    // Return USDT balance or total USD value
    const usdtBalance = this.balances.get('USDT');
    if (usdtBalance) {
      return usdtBalance.amount;
    }
    // Return sum of all USD values
    return Array.from(this.balances.values()).reduce((sum, b) => sum + b.usdValue, 0);
  }
}

export const paperTradingExecutor = new PaperTradingExecutor();
