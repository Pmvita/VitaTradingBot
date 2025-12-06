// DEX aggregator service using 1inch and 0x APIs

import axios from 'axios';
import { API_ENDPOINTS, NETWORK_CONFIGS } from '../constants';
import { SupportedNetwork, ApiResponse } from '../types';
import { logger } from '../utils/logger';

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  priceImpact: number;
  gasEstimate: string;
  route: any[];
}

class DEXAggregator {
  /**
   * Get swap quote from 1inch
   */
  async get1inchQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    chainId: number
  ): Promise<ApiResponse<SwapQuote>> {
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.ONEINCH}/${chainId}/quote`,
        {
          params: {
            fromTokenAddress: fromToken,
            toTokenAddress: toToken,
            amount,
          },
          timeout: 10000,
        }
      );

      const data = response.data;
      const quote: SwapQuote = {
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: data.toTokenAmount,
        priceImpact: parseFloat(data.estimatedGas) || 0,
        gasEstimate: data.estimatedGas || '0',
        route: data.protocols || [],
      };

      return { success: true, data: quote };
    } catch (error) {
      logger.error('1inch quote failed', error as Error, { fromToken, toToken });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get swap quote from 0x
   */
  async get0xQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    chainId: number
  ): Promise<ApiResponse<SwapQuote>> {
    try {
      const response = await axios.get(`${API_ENDPOINTS.ZEROX}/swap/v1/quote`, {
        params: {
          sellToken: fromToken === '0x0000000000000000000000000000000000000000' ? 'ETH' : fromToken,
          buyToken: toToken === '0x0000000000000000000000000000000000000000' ? 'ETH' : toToken,
          sellAmount: amount,
        },
        headers: {
          '0x-api-key': '', // Free tier doesn't require key
        },
        timeout: 10000,
      });

      const data = response.data;
      const quote: SwapQuote = {
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: data.buyAmount,
        priceImpact: parseFloat(data.priceImpact || '0'),
        gasEstimate: data.gas || '0',
        route: data.sources || [],
      };

      return { success: true, data: quote };
    } catch (error) {
      logger.error('0x quote failed', error as Error, { fromToken, toToken });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get best swap quote from available aggregators
   */
  async getBestQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    network: SupportedNetwork
  ): Promise<ApiResponse<SwapQuote>> {
    const chainId = NETWORK_CONFIGS[network].chainId;

    // Try both aggregators and return the best quote
    const [oneInchResult, zeroXResult] = await Promise.all([
      this.get1inchQuote(fromToken, toToken, amount, chainId),
      this.get0xQuote(fromToken, toToken, amount, chainId),
    ]);

    const quotes: SwapQuote[] = [];
    if (oneInchResult.success && oneInchResult.data) {
      quotes.push(oneInchResult.data);
    }
    if (zeroXResult.success && zeroXResult.data) {
      quotes.push(zeroXResult.data);
    }

    if (quotes.length === 0) {
      return { success: false, error: 'No quotes available' };
    }

    // Return the quote with the best output amount
    const bestQuote = quotes.reduce((best, current) => {
      const bestAmount = parseFloat(best.toAmount);
      const currentAmount = parseFloat(current.toAmount);
      return currentAmount > bestAmount ? current : best;
    });

    return { success: true, data: bestQuote };
  }
}

export const dexAggregator = new DEXAggregator();

