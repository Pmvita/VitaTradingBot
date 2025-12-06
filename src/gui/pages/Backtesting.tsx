// Backtesting page with strategy testing interface

import React, { useState } from 'react';
import { StrategyType, Timeframe, BacktestResult } from '../../types';
import { Play, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import './Backtesting.css';

export const Backtesting: React.FC = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>('MEAN_REVERSION');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1h');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC/USDT');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BacktestResult | null>(null);

  const strategies: StrategyType[] = ['MEAN_REVERSION', 'MOMENTUM', 'GRID_TRADING', 'MARKET_MAKING', 'ARBITRAGE'];
  const timeframes: Timeframe[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];
  const symbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'MATIC/USDT'];

  const handleRunBacktest = async () => {
    setIsRunning(true);
    // Simulate backtest (in production, this would call the actual backtesting engine)
    setTimeout(() => {
      const mockResults: BacktestResult = {
        totalReturn: 12500,
        totalReturnPercent: 12.5,
        cagr: 15.2,
        sharpeRatio: 1.85,
        sortinoRatio: 2.1,
        calmarRatio: 0.8,
        maxDrawdown: -8500,
        maxDrawdownPercent: -8.5,
        winRate: 62.5,
        profitFactor: 1.75,
        averageWin: 450,
        averageLoss: -280,
        totalTrades: 120,
        equityCurve: [],
        trades: [],
      };
      setResults(mockResults);
      setIsRunning(false);
    }, 2000);
  };

  return (
    <div className="backtesting-page">
      <div className="backtesting-header">
        <div>
          <h2>Backtesting</h2>
          <p className="subtitle">Test your trading strategies against historical data</p>
        </div>
      </div>

      <div className="backtesting-container">
        <div className="backtesting-config">
          <div className="config-section">
            <h3>Strategy Configuration</h3>
            <div className="config-group">
              <div className="config-item">
                <label>Strategy</label>
                <select
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value as StrategyType)}
                  className="config-input"
                >
                  {strategies.map((strategy) => (
                    <option key={strategy} value={strategy}>
                      {strategy.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="config-item">
                <label>Timeframe</label>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value as Timeframe)}
                  className="config-input"
                >
                  {timeframes.map((tf) => (
                    <option key={tf} value={tf}>{tf}</option>
                  ))}
                </select>
              </div>

              <div className="config-item">
                <label>Symbol</label>
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="config-input"
                >
                  {symbols.map((sym) => (
                    <option key={sym} value={sym}>{sym}</option>
                  ))}
                </select>
              </div>

              <div className="config-item">
                <label>Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="config-input"
                />
              </div>

              <div className="config-item">
                <label>End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="config-input"
                />
              </div>
            </div>

            <button
              className="run-backtest-btn"
              onClick={handleRunBacktest}
              disabled={isRunning || !dateRange.start || !dateRange.end}
            >
              <Play size={18} />
              {isRunning ? 'Running Backtest...' : 'Run Backtest'}
            </button>
          </div>
        </div>

        {results && (
          <div className="backtesting-results">
            <div className="results-header">
              <h3>Backtest Results</h3>
              <div className="results-summary">
                <div className={`summary-badge ${results.totalReturnPercent >= 0 ? 'positive' : 'negative'}`}>
                  {results.totalReturnPercent >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  <div>
                    <div className="badge-label">Total Return</div>
                    <div className="badge-value">
                      {results.totalReturnPercent >= 0 ? '+' : ''}{results.totalReturnPercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="results-grid">
              <div className="result-card">
                <div className="result-label">Total Return</div>
                <div className={`result-value ${results.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                  ${results.totalReturn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="result-card">
                <div className="result-label">CAGR</div>
                <div className="result-value">{results.cagr?.toFixed(2)}%</div>
              </div>

              <div className="result-card">
                <div className="result-label">Sharpe Ratio</div>
                <div className="result-value">{results.sharpeRatio?.toFixed(2)}</div>
              </div>

              <div className="result-card">
                <div className="result-label">Sortino Ratio</div>
                <div className="result-value">{results.sortinoRatio?.toFixed(2)}</div>
              </div>

              <div className="result-card">
                <div className="result-label">Max Drawdown</div>
                <div className="result-value negative">
                  {results.maxDrawdownPercent.toFixed(2)}%
                </div>
              </div>

              <div className="result-card">
                <div className="result-label">Win Rate</div>
                <div className="result-value">{results.winRate.toFixed(1)}%</div>
              </div>

              <div className="result-card">
                <div className="result-label">Total Trades</div>
                <div className="result-value">{results.totalTrades}</div>
              </div>

              <div className="result-card">
                <div className="result-label">Profit Factor</div>
                <div className="result-value">{results.profitFactor?.toFixed(2)}</div>
              </div>

              <div className="result-card">
                <div className="result-label">Average Win</div>
                <div className="result-value positive">${results.averageWin?.toFixed(2)}</div>
              </div>

              <div className="result-card">
                <div className="result-label">Average Loss</div>
                <div className="result-value negative">${results.averageLoss?.toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}

        {!results && !isRunning && (
          <div className="backtesting-placeholder">
            <BarChart3 size={64} />
            <h3>No Backtest Results</h3>
            <p>Configure your strategy and run a backtest to see results here</p>
          </div>
        )}
      </div>
    </div>
  );
};
