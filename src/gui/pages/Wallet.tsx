// Wallet management page with connection and balance display

import React, { useState, useEffect } from 'react';
import { walletService } from '../../wallet/WalletService';
import { paperTradingExecutor } from '../../bot/execution/PaperTradingExecutor';
import { SupportedNetwork, Wallet as WalletType, CurrencyBalance } from '../../types';
import { WalletConnect } from '../components/wallet/WalletConnect';
import { CurrencyBalanceCard } from '../components/funds/CurrencyBalanceCard';
import { Wallet as WalletIcon, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import './Wallet.css';

export const Wallet: React.FC = () => {
  const [wallet, setWallet] = useState<WalletType | null>(walletService.getCurrentWallet());
  const [isPaperTrading, setIsPaperTrading] = useState(false);
  const [balances, setBalances] = useState<CurrencyBalance[]>([]);
  const [totalUsdValue, setTotalUsdValue] = useState(0);

  useEffect(() => {
    const tradingMode = localStorage.getItem('trading-mode');
    setIsPaperTrading(tradingMode === 'paper');

    if (tradingMode === 'paper') {
      const updateBalances = async () => {
        const allBalances = paperTradingExecutor.getAllBalances();
        setBalances(allBalances);
        const total = await paperTradingExecutor.getTotalUsdValue();
        setTotalUsdValue(total);
      };

      updateBalances();
      const interval = setInterval(updateBalances, 5000);

      // Listen for balance updates
      const handleBalanceUpdate = () => {
        updateBalances();
      };
      window.addEventListener('balance-updated', handleBalanceUpdate);

      return () => {
        clearInterval(interval);
        window.removeEventListener('balance-updated', handleBalanceUpdate);
      };
    }
  }, []);

  const handleConnect = async (network: SupportedNetwork) => {
    const result = await walletService.connectWallet(network);
    if (result.success) {
      setWallet(result.data || null);
    }
  };

  const handleDisconnect = () => {
    walletService.disconnect();
    setWallet(null);
  };

  const copyAddress = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet.address);
      // Could show a toast notification here
    }
  };

  const getExplorerUrl = (address: string, network: SupportedNetwork): string => {
    const explorers: Record<SupportedNetwork, string> = {
      ethereum: `https://etherscan.io/address/${address}`,
      polygon: `https://polygonscan.com/address/${address}`,
      bsc: `https://bscscan.com/address/${address}`,
      avalanche: `https://snowtrace.io/address/${address}`,
      arbitrum: `https://arbiscan.io/address/${address}`,
      optimism: `https://optimistic.etherscan.io/address/${address}`,
      solana: `https://solscan.io/account/${address}`,
    };
    return explorers[network] || '#';
  };

  return (
    <div className="wallet-page">
      <div className="wallet-header">
        <h2>Wallet Management</h2>
        <p className="subtitle">Connect and manage your crypto wallets</p>
      </div>

      {isPaperTrading ? (
        <div className="wallet-content">
          <div className="wallet-section">
            <div className="section-header">
              <h3>Paper Trading Balances</h3>
              <span className="mode-badge">Demo Mode</span>
            </div>
            <div className="total-balance-display">
              <div className="balance-label">Total Portfolio Value</div>
              <div className="balance-value">
                ${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            {balances.length > 0 ? (
              <div className="balances-grid">
                {balances.map((balance) => (
                  <CurrencyBalanceCard key={balance.currency} balance={balance} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No currency balances</p>
                <span className="empty-hint">Initialize paper trading to get started</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="wallet-content">
          {wallet ? (
            <div className="wallet-section">
              <div className="section-header">
                <h3>Connected Wallet</h3>
                <button className="disconnect-btn" onClick={handleDisconnect}>
                  Disconnect
                </button>
              </div>

              <div className="wallet-info">
                <div className="wallet-address-group">
                  <div className="address-label">Address</div>
                  <div className="address-value">
                    <WalletIcon size={20} />
                    <span className="address-text">{wallet.address}</span>
                    <button className="icon-btn" onClick={copyAddress} title="Copy address">
                      <Copy size={16} />
                    </button>
                    <a
                      href={getExplorerUrl(wallet.address, wallet.network)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="icon-btn"
                      title="View on explorer"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>

                <div className="wallet-network-group">
                  <div className="network-label">Network</div>
                  <div className="network-badge">{wallet.network}</div>
                </div>

                <div className="wallet-balance-group">
                  <div className="balance-label">Balance</div>
                  <div className="balance-value">{wallet.balance} ETH</div>
                </div>

                {wallet.tokens && wallet.tokens.length > 0 && (
                  <div className="wallet-tokens">
                    <div className="tokens-label">Token Balances</div>
                    <div className="tokens-list">
                      {wallet.tokens.map((token) => (
                        <div key={token.address} className="token-item">
                          <div className="token-info">
                            <span className="token-symbol">{token.symbol}</span>
                            <span className="token-name">{token.name}</span>
                          </div>
                          <div className="token-balance">
                            {parseFloat(token.balance).toFixed(6)} {token.symbol}
                            {token.value && (
                              <span className="token-value">${token.value.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="wallet-section">
              <div className="section-header">
                <h3>Connect Wallet</h3>
              </div>
              <WalletConnect onConnect={handleConnect} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
