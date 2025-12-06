// Wallet service for connecting and managing crypto wallets

import { ethers } from 'ethers';
import { Wallet, SupportedNetwork, ApiResponse, TokenBalance } from '../types';
import { NETWORK_CONFIGS } from '../constants';
import { logger } from '../utils/logger';

class WalletService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private currentWallet: Wallet | null = null;

  /**
   * Connect to MetaMask or other Web3 wallet
   */
  async connectWallet(network: SupportedNetwork): Promise<ApiResponse<Wallet>> {
    try {
      if (!window.ethereum) {
        return { success: false, error: 'No Web3 wallet found. Please install MetaMask.' };
      }

      this.provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await this.provider.send('eth_requestAccounts', []);

      if (accounts.length === 0) {
        return { success: false, error: 'No accounts found' };
      }

      // Switch network if needed
      await this.switchNetwork(network);

      this.signer = await this.provider.getSigner();
      const address = accounts[0];

      const balance = await this.getBalance(address);
      if (!balance.success) {
        return { success: false, error: 'Failed to fetch balance' };
      }

      const wallet: Wallet = {
        address,
        network,
        balance: balance.data || '0',
        tokens: [],
      };

      this.currentWallet = wallet;
      logger.info('Wallet connected', { address, network });

      return { success: true, data: wallet };
    } catch (error) {
      logger.error('Failed to connect wallet', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Import wallet from private key
   */
  async importWallet(
    privateKey: string,
    network: SupportedNetwork
  ): Promise<ApiResponse<Wallet>> {
    try {
      const config = NETWORK_CONFIGS[network];
      const provider = new ethers.JsonRpcProvider(config.rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);

      const balance = await provider.getBalance(wallet.address);
      const balanceFormatted = ethers.formatEther(balance);

      const importedWallet: Wallet = {
        address: wallet.address,
        network,
        balance: balanceFormatted,
        tokens: [],
      };

      this.currentWallet = importedWallet;
      this.provider = provider;
      this.signer = wallet as any;

      logger.info('Wallet imported', { address: wallet.address, network });

      return { success: true, data: importedWallet };
    } catch (error) {
      logger.error('Failed to import wallet', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get balance for an address
   */
  async getBalance(address: string): Promise<ApiResponse<string>> {
    try {
      if (!this.provider) {
        return { success: false, error: 'Provider not initialized' };
      }

      const balance = await this.provider.getBalance(address);
      return { success: true, data: ethers.formatEther(balance) };
    } catch (error) {
      logger.error('Failed to get balance', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get token balance
   */
  async getTokenBalance(
    tokenAddress: string,
    walletAddress: string
  ): Promise<ApiResponse<string>> {
    try {
      if (!this.provider) {
        return { success: false, error: 'Provider not initialized' };
      }

      const tokenABI = ['function balanceOf(address) view returns (uint256)'];
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, this.provider);
      const balance = await tokenContract.balanceOf(walletAddress);

      return { success: true, data: balance.toString() };
    } catch (error) {
      logger.error('Failed to get token balance', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Switch network
   */
  async switchNetwork(network: SupportedNetwork): Promise<void> {
    if (!window.ethereum) return;

    const config = NETWORK_CONFIGS[network];
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${config.chainId.toString(16)}` }],
      });
    } catch (error: any) {
      // Chain doesn't exist, add it
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${config.chainId.toString(16)}`,
              chainName: config.name,
              nativeCurrency: config.nativeCurrency,
              rpcUrls: [config.rpcUrl],
              blockExplorerUrls: [config.explorerUrl],
            },
          ],
        });
      }
    }
  }

  /**
   * Get current wallet
   */
  getCurrentWallet(): Wallet | null {
    return this.currentWallet;
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.provider = null;
    this.signer = null;
    this.currentWallet = null;
    logger.info('Wallet disconnected');
  }

  /**
   * Get signer for transaction signing
   */
  getSigner(): ethers.JsonRpcSigner | null {
    return this.signer;
  }
}

export const walletService = new WalletService();

