// Bot control component

import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, PlayCircle } from 'lucide-react';
import { BotState, StrategyType, Timeframe, StrategyConfig as StrategyConfigType } from '../../../types';
import { paperTradingExecutor } from '../../../bot/execution/PaperTradingExecutor';
import { walletService } from '../../../wallet/WalletService';
import './BotControl.css';

interface BotControlProps {
  botState: BotState | null;
  onStart: (config: StrategyConfigType) => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  selectedStrategy: StrategyType;
  selectedTimeframe: Timeframe;
  selectedSymbol: string;
  onStrategyChange: (strategy: StrategyType) => void;
  onTimeframeChange: (timeframe: Timeframe) => void;
}

export const BotControl: React.FC<BotControlProps> = ({
  botState,
  onStart,
  onStop,
  onPause,
  onResume,
  selectedStrategy,
  selectedTimeframe,
  selectedSymbol,
  onStrategyChange,
  onTimeframeChange,
}) => {
  const isRunning = botState?.status === 'RUNNING';
  const isPaused = botState?.status === 'PAUSED';
  const [quoteBalance, setQuoteBalance] = useState<number>(0);
  const [quoteCurrency, setQuoteCurrency] = useState<string>('USDT');

  // Extract quote currency from symbol (e.g., "BTC/USDT" -> "USDT")
  useEffect(() => {
    const parts = selectedSymbol.split('/');
    const quote = parts.length > 1 ? parts[1] : 'USDT';
    setQuoteCurrency(quote);
  }, [selectedSymbol]);

  // Fetch balance for the quote currency
  useEffect(() => {
    const updateBalance = async () => {
      const tradingMode = localStorage.getItem('trading-mode');
      
      if (tradingMode === 'paper') {
        // Paper trading: get balance from paper trading executor
        const balance = paperTradingExecutor.getBalance(quoteCurrency);
        setQuoteBalance(balance?.amount || 0);
      } else {
        // Live trading: get balance from wallet service
        const wallet = walletService.getCurrentWallet();
        if (wallet) {
          // For live trading, we might need to check token balances
          // For now, use the main wallet balance if quote currency is the native token
          // Otherwise, check token balances
          if (quoteCurrency === 'ETH' || quoteCurrency === 'BNB' || quoteCurrency === 'MATIC') {
            setQuoteBalance(parseFloat(wallet.balance) || 0);
          } else {
            // For stablecoins or other tokens, try to find in token list
            const tokenBalance = wallet.tokens?.find(t => 
              t.symbol === quoteCurrency || t.name === quoteCurrency
            );
            setQuoteBalance(tokenBalance ? parseFloat(tokenBalance.balance) : 0);
          }
        } else {
          setQuoteBalance(0);
        }
      }
    };

    updateBalance();
    const interval = setInterval(updateBalance, 2000); // Update every 2 seconds

    // Listen for balance updates
    const handleBalanceUpdate = () => {
      updateBalance();
    };
    window.addEventListener('balance-updated', handleBalanceUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('balance-updated', handleBalanceUpdate);
    };
  }, [quoteCurrency]);

  const handleStart = () => {
    // Create default config - in real app, this would come from user input
    const config: StrategyConfigType = {
      id: `strategy-${Date.now()}`,
      type: selectedStrategy,
      name: `${selectedStrategy} Strategy`,
      enabled: true,
      timeframe: selectedTimeframe,
      parameters: {},
      riskManagement: {
        positionSize: 5,
        positionSizeType: 'PERCENTAGE',
        stopLoss: 2,
        takeProfit: 4,
        maxPositions: 3,
        maxDrawdown: 20,
        dailyLossLimit: 10,
        riskRewardRatio: 2,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onStart(config);
  };

  return (
    <div className="bot-control">
      <div className="control-row">
        <div className="control-group">
          <label>Strategy:</label>
          <select
            value={selectedStrategy}
            onChange={(e) => onStrategyChange(e.target.value as StrategyType)}
            disabled={isRunning}
            className="control-select"
          >
            <option value="MEAN_REVERSION">Mean Reversion</option>
            <option value="MOMENTUM">Momentum</option>
            <option value="GRID_TRADING">Grid Trading</option>
            <option value="MARKET_MAKING">Market Making</option>
            <option value="ARBITRAGE">Arbitrage</option>
          </select>
        </div>

        <div className="control-group">
          <label>Timeframe:</label>
          <select
            value={selectedTimeframe}
            onChange={(e) => onTimeframeChange(e.target.value as Timeframe)}
            disabled={isRunning}
            className="control-select"
          >
            <option value="1m">1 Minute</option>
            <option value="5m">5 Minutes</option>
            <option value="15m">15 Minutes</option>
            <option value="30m">30 Minutes</option>
            <option value="1h">1 Hour</option>
            <option value="4h">4 Hours</option>
            <option value="1d">1 Day</option>
          </select>
        </div>
      </div>

      <div className="control-actions">
        {!isRunning && !isPaused && (
          <button className="btn btn-primary" onClick={handleStart}>
            <Play size={16} />
            Start Bot
          </button>
        )}
        {isRunning && (
          <>
            <button className="btn btn-warning" onClick={onPause}>
              <Pause size={16} />
              Pause
            </button>
            <button className="btn btn-danger" onClick={onStop}>
              <Square size={16} />
              Stop
            </button>
          </>
        )}
        {isPaused && (
          <>
            <button className="btn btn-primary" onClick={onResume}>
              <PlayCircle size={16} />
              Resume
            </button>
            <button className="btn btn-danger" onClick={onStop}>
              <Square size={16} />
              Stop
            </button>
          </>
        )}
      </div>

      {botState && (
        <div className="bot-stats">
          <div className="stat">
            <span className="stat-label">Balance ({quoteCurrency}):</span>
            <span className="stat-value">
              {quoteBalance.toLocaleString('en-US', { 
                minimumFractionDigits: quoteCurrency === 'USDT' || quoteCurrency === 'USDC' ? 2 : 8,
                maximumFractionDigits: quoteCurrency === 'USDT' || quoteCurrency === 'USDC' ? 2 : 8
              })} {quoteCurrency}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">P&L Today:</span>
            <span className={`stat-value ${botState.totalPnL >= 0 ? 'positive' : 'negative'}`}>
              ${botState.totalPnL.toFixed(2)} ({((botState.totalPnL / botState.balance) * 100).toFixed(2)}%)
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Active Positions:</span>
            <span className="stat-value">{botState.positions.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Win Rate:</span>
            <span className="stat-value">{botState.winRate.toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

