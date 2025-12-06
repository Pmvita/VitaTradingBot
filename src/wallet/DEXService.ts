// DEX service for executing swaps on decentralized exchanges

import { ethers } from 'ethers';
import { SupportedNetwork, ApiResponse } from '../types';
import { dexAggregator } from '../api/DEXAggregator';
import { walletService } from './WalletService';
import { logger } from '../utils/logger';

export interface SwapParams {
  fromToken: string;
  toToken: string;
  amount: string;
  slippage: number; // Percentage
  recipient: string;
}

export interface SwapResult {
  transactionHash: string;
  fromAmount: string;
  toAmount: string;
  gasUsed: string;
}

class DEXService {
  /**
   * Execute a swap on DEX
   */
  async executeSwap(
    params: SwapParams,
    network: SupportedNetwork
  ): Promise<ApiResponse<SwapResult>> {
    try {
      const signer = walletService.getSigner();
      if (!signer) {
        return { success: false, error: 'Wallet not connected' };
      }

      // Get best quote
      const quoteResult = await dexAggregator.getBestQuote(
        params.fromToken,
        params.toToken,
        params.amount,
        network
      );

      if (!quoteResult.success || !quoteResult.data) {
        return { success: false, error: 'Failed to get swap quote' };
      }

      const quote = quoteResult.data;

      // Get swap transaction data from 1inch
      const swapData = await this.getSwapTransactionData(
        params,
        network,
        quote
      );

      if (!swapData.success || !swapData.data) {
        return { success: false, error: 'Failed to get swap transaction data' };
      }

      // Execute transaction
      const tx = await signer.sendTransaction(swapData.data);
      const receipt = await tx.wait();

      if (!receipt) {
        return { success: false, error: 'Transaction failed' };
      }

      const result: SwapResult = {
        transactionHash: receipt.hash,
        fromAmount: params.amount,
        toAmount: quote.toAmount,
        gasUsed: receipt.gasUsed.toString(),
      };

      logger.info('Swap executed', result);

      return { success: true, data: result };
    } catch (error) {
      logger.error('Swap execution failed', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get swap transaction data from 1inch
   */
  private async getSwapTransactionData(
    params: SwapParams,
    network: SupportedNetwork,
    quote: any
  ): Promise<ApiResponse<ethers.TransactionRequest>> {
    try {
      // This would typically call 1inch swap API to get transaction data
      // For now, return a placeholder structure
      // In production, you'd make an actual API call to get the transaction data

      return {
        success: false,
        error: 'Swap transaction data generation not fully implemented',
      };
    } catch (error) {
      logger.error('Failed to get swap transaction data', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Estimate gas for swap
   */
  async estimateGas(
    params: SwapParams,
    network: SupportedNetwork
  ): Promise<ApiResponse<string>> {
    try {
      const quoteResult = await dexAggregator.getBestQuote(
        params.fromToken,
        params.toToken,
        params.amount,
        network
      );

      if (!quoteResult.success || !quoteResult.data) {
        return { success: false, error: 'Failed to get quote' };
      }

      return { success: true, data: quoteResult.data.gasEstimate };
    } catch (error) {
      logger.error('Gas estimation failed', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }
}

export const dexService = new DEXService();

