// Currency conversion service for paper trading

import { priceService } from './PriceService';
import { Conversion, ApiResponse } from '../types';
import { logger } from '../utils/logger';

class CurrencyConversionService {
  private conversionFee = 0.001; // 0.1% conversion fee
  private conversionHistory: Conversion[] = [];

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<ApiResponse<number>> {
    try {
      // If same currency, return 1
      if (fromCurrency === toCurrency) {
        return { success: true, data: 1 };
      }

      // Get prices for both currencies in USD
      const fromSymbol = `${fromCurrency}/USDT`;
      const toSymbol = `${toCurrency}/USDT`;

      const fromPriceResult = await priceService.getPrice(fromSymbol);
      const toPriceResult = await priceService.getPrice(toSymbol);

      if (!fromPriceResult.success || !fromPriceResult.data) {
        return { success: false, error: `Failed to get price for ${fromCurrency}` };
      }

      if (!toPriceResult.success || !toPriceResult.data) {
        return { success: false, error: `Failed to get price for ${toCurrency}` };
      }

      // Calculate exchange rate
      // If converting from BTC to ETH: rate = BTC_USD / ETH_USD
      const fromPrice = fromPriceResult.data.price;
      const toPrice = toPriceResult.data.price;

      // Handle USDT as base currency
      if (toCurrency === 'USDT' || toCurrency === 'USDC') {
        return { success: true, data: fromPrice };
      }

      if (fromCurrency === 'USDT' || fromCurrency === 'USDC') {
        return { success: true, data: 1 / toPrice };
      }

      // Both are crypto: rate = fromPrice / toPrice
      const rate = fromPrice / toPrice;

      return { success: true, data: rate };
    } catch (error) {
      logger.error('Failed to get exchange rate', error as Error, { fromCurrency, toCurrency });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Convert currency
   */
  async convert(
    fromCurrency: string,
    toCurrency: string,
    amount: number
  ): Promise<ApiResponse<Conversion>> {
    try {
      if (amount <= 0) {
        return { success: false, error: 'Amount must be greater than 0' };
      }

      if (fromCurrency === toCurrency) {
        return { success: false, error: 'Cannot convert to same currency' };
      }

      // Get exchange rate
      const rateResult = await this.getExchangeRate(fromCurrency, toCurrency);
      if (!rateResult.success || rateResult.data === undefined) {
        return { success: false, error: rateResult.error || 'Failed to get exchange rate' };
      }

      const rate = rateResult.data;

      // Calculate conversion
      const baseAmount = amount * rate;
      const fees = baseAmount * this.conversionFee;
      const receivedAmount = baseAmount - fees;

      const conversion: Conversion = {
        id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fromCurrency,
        toCurrency,
        amount,
        rate,
        receivedAmount,
        fees,
        timestamp: Date.now(),
      };

      // Store in history
      this.conversionHistory.push(conversion);
      if (this.conversionHistory.length > 1000) {
        this.conversionHistory.shift(); // Keep last 1000 conversions
      }

      logger.info('Currency conversion', { conversion });

      return { success: true, data: conversion };
    } catch (error) {
      logger.error('Currency conversion failed', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get conversion history
   */
  getConversionHistory(limit: number = 50): Conversion[] {
    return this.conversionHistory.slice(-limit).reverse();
  }

  /**
   * Clear conversion history
   */
  clearHistory(): void {
    this.conversionHistory = [];
  }
}

export const currencyConversionService = new CurrencyConversionService();

