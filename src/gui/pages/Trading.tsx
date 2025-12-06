// Trading page with bot controls and strategy configuration

import React, { useState, useEffect } from 'react';
import { tradingBot } from '../../bot/TradingBot';
import { paperTradingExecutor } from '../../bot/execution/PaperTradingExecutor';
import { walletService } from '../../wallet/WalletService';
import { BotState, StrategyConfig as StrategyConfigType, StrategyType, Timeframe } from '../../types';
import { BotControl } from '../components/trading/BotControl';
import { StrategyConfig as StrategyConfigComponent } from '../components/trading/StrategyConfig';
import { PriceChart } from '../components/charts/PriceChart';
import { Coins } from 'lucide-react';
import './Trading.css';

export const Trading: React.FC = () => {
  const [botState, setBotState] = useState<BotState | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>('MEAN_REVERSION');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1h');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  const [isPaperTrading, setIsPaperTrading] = useState(false);

  // Fetch available tokens from portfolio
  useEffect(() => {
    const tradingMode = localStorage.getItem('trading-mode');
    const isPaper = tradingMode === 'paper';
    setIsPaperTrading(isPaper);

    const updateAvailableSymbols = async () => {
      let tokens: string[] = [];

      if (isPaper) {
        // Paper trading: get tokens from paper trading executor
        const balances = paperTradingExecutor.getAllBalances();
        // Filter out USDT and get tokens with balance > 0
        tokens = balances
          .filter(b => b.currency !== 'USDT' && b.currency !== 'USDC' && b.amount > 0)
          .map(b => b.currency)
          .sort();
      } else {
        // Live trading: get tokens from wallet
        const wallet = walletService.getCurrentWallet();
        if (wallet) {
          // Get native token if it's not USDT
          if (wallet.balance && parseFloat(wallet.balance) > 0) {
            // Determine native token based on network
            const network = wallet.network?.toUpperCase() || '';
            if (network.includes('ETH')) tokens.push('ETH');
            else if (network.includes('BNB') || network.includes('BSC')) tokens.push('BNB');
            else if (network.includes('MATIC') || network.includes('POLYGON')) tokens.push('MATIC');
          }
          
          // Get ERC-20 tokens
          if (wallet.tokens && wallet.tokens.length > 0) {
            const tokenSymbols = wallet.tokens
              .filter(t => {
                const balance = parseFloat(t.balance || '0');
                return balance > 0 && t.symbol !== 'USDT' && t.symbol !== 'USDC';
              })
              .map(t => t.symbol);
            tokens.push(...tokenSymbols);
          }
        }
      }

      // Create trading pairs with USDT as quote currency
      const symbols = tokens.map(token => `${token}/USDT`);
      
      // If no tokens available, use default list
      if (symbols.length === 0) {
        symbols.push('BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'MATIC/USDT', 'AVAX/USDT');
      }

      setAvailableSymbols(symbols);
      
      // Set default selected symbol if not set or if current selection is not available
      setSelectedSymbol(prev => {
        if (prev && symbols.includes(prev)) {
          return prev;
        }
        return symbols[0] || 'BTC/USDT';
      });
    };

    updateAvailableSymbols();
    const interval = setInterval(updateAvailableSymbols, 2000);

    // Listen for balance updates
    const handleBalanceUpdate = () => {
      updateAvailableSymbols();
    };
    window.addEventListener('balance-updated', handleBalanceUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('balance-updated', handleBalanceUpdate);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBotState(tradingBot.getState());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async (config: StrategyConfigType) => {
    await tradingBot.start(config);
    setBotState(tradingBot.getState());
  };

  const handleStop = () => {
    tradingBot.stop();
    setBotState(tradingBot.getState());
  };

  const handlePause = () => {
    tradingBot.pause();
    setBotState(tradingBot.getState());
  };

  const handleResume = () => {
    tradingBot.resume();
    setBotState(tradingBot.getState());
  };

  return (
    <div className="trading-page">
      <div className="trading-header">
        <h2>Active Trading</h2>
      </div>

      <div className="trading-panel">
        <BotControl
          botState={botState}
          onStart={handleStart}
          onStop={handleStop}
          onPause={handlePause}
          onResume={handleResume}
          selectedStrategy={selectedStrategy}
          selectedTimeframe={selectedTimeframe}
          selectedSymbol={selectedSymbol}
          onStrategyChange={setSelectedStrategy}
          onTimeframeChange={setSelectedTimeframe}
        />
      </div>

      <div className="trading-content">
        <div className="chart-section">
          <div className="chart-header-controls">
            <div className="symbol-selector-wrapper">
              <div className="symbol-selector-header">
                <Coins size={18} />
                <span className="section-title">Trading Pair</span>
                {isPaperTrading && (
                  <span className="badge-paper">Paper Trading</span>
                )}
              </div>
              <div className="symbol-selector">
                <label htmlFor="trading-pair-select">Select Pair:</label>
                <select
                  id="trading-pair-select"
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="symbol-select"
                >
                  {availableSymbols.length > 0 ? (
                    availableSymbols.map((sym) => (
                      <option key={sym} value={sym}>{sym}</option>
                    ))
                  ) : (
                    <option value="">No tokens available</option>
                  )}
                </select>
                {selectedSymbol && (
                  <div className="symbol-info">
                    <span className="symbol-base">{selectedSymbol.split('/')[0]}</span>
                    <span className="symbol-separator">/</span>
                    <span className="symbol-quote">{selectedSymbol.split('/')[1]}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {selectedSymbol && (
            <PriceChart symbol={selectedSymbol} timeframe={selectedTimeframe} />
          )}
        </div>

        <div className="config-section">
          <StrategyConfigComponent
            strategyType={selectedStrategy}
            timeframe={selectedTimeframe}
            onConfigSave={(config) => handleStart(config)}
          />
        </div>
      </div>
    </div>
  );
};

