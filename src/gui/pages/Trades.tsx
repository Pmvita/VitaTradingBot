// Trade history page with comprehensive trade details

import React, { useState, useEffect } from 'react';
import { Trade } from '../../types';
import { tradeRepository } from '../../storage/TradeRepository';
import { TrendingUp, TrendingDown, Filter, Download } from 'lucide-react';
import './Trades.css';

export const Trades: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'profit' | 'loss'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'pnl' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadTrades();
    const interval = setInterval(loadTrades, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trades, filter, sortBy, sortOrder]);

  const loadTrades = async () => {
    try {
      const allTrades = await tradeRepository.getAllTrades();
      setTrades(allTrades);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load trades:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...trades];

    // Apply filter
    if (filter === 'profit') {
      filtered = filtered.filter(t => t.pnl > 0);
    } else if (filter === 'loss') {
      filtered = filtered.filter(t => t.pnl < 0);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = a.closedAt - b.closedAt;
          break;
        case 'pnl':
          comparison = a.pnl - b.pnl;
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTrades(filtered);
  };

  const calculateStats = () => {
    const totalTrades = filteredTrades.length;
    const profitableTrades = filteredTrades.filter(t => t.pnl > 0).length;
    const totalPnL = filteredTrades.reduce((sum, t) => sum + t.pnl, 0);
    const avgPnL = totalTrades > 0 ? totalPnL / totalTrades : 0;
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

    return { totalTrades, profitableTrades, totalPnL, avgPnL, winRate };
  };

  const stats = calculateStats();

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="trades-page loading">
        <div className="loading-spinner"></div>
        <p>Loading trade history...</p>
      </div>
    );
  }

  return (
    <div className="trades-page">
      <div className="trades-header">
        <div>
          <h2>Trade History</h2>
          <p className="subtitle">Complete trading activity and performance</p>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="trades-stats">
        <div className="stat-card">
          <div className="stat-label">Total Trades</div>
          <div className="stat-value">{stats.totalTrades}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Win Rate</div>
          <div className="stat-value">{stats.winRate.toFixed(1)}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total P&L</div>
          <div className={`stat-value ${stats.totalPnL >= 0 ? 'positive' : 'negative'}`}>
            ${Math.abs(stats.totalPnL).toFixed(2)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Average P&L</div>
          <div className={`stat-value ${stats.avgPnL >= 0 ? 'positive' : 'negative'}`}>
            ${Math.abs(stats.avgPnL).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="trades-controls">
        <div className="filter-group">
          <label>Filter:</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Trades
            </button>
            <button
              className={`filter-btn ${filter === 'profit' ? 'active' : ''}`}
              onClick={() => setFilter('profit')}
            >
              <TrendingUp size={14} />
              Profitable
            </button>
            <button
              className={`filter-btn ${filter === 'loss' ? 'active' : ''}`}
              onClick={() => setFilter('loss')}
            >
              <TrendingDown size={14} />
              Losses
            </button>
          </div>
        </div>

        <div className="sort-group">
          <label>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'pnl' | 'amount')}
            className="sort-select"
          >
            <option value="date">Date</option>
            <option value="pnl">P&L</option>
            <option value="amount">Amount</option>
          </select>
          <button
            className="sort-order-btn"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Trades Table */}
      <div className="trades-table-container">
        {filteredTrades.length === 0 ? (
          <div className="empty-state">
            <p>No trades found</p>
            <span className="empty-hint">Start trading to see your trade history here</span>
          </div>
        ) : (
          <table className="trades-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Symbol</th>
                <th>Side</th>
                <th>Entry Price</th>
                <th>Exit Price</th>
                <th>Amount</th>
                <th>Duration</th>
                <th>Fees</th>
                <th>P&L</th>
                <th>P&L %</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((trade) => (
                <tr key={trade.id}>
                  <td>
                    <div className="trade-time">
                      <div>{new Date(trade.closedAt).toLocaleDateString()}</div>
                      <div className="time-sub">{new Date(trade.closedAt).toLocaleTimeString()}</div>
                    </div>
                  </td>
                  <td className="symbol-cell">
                    <span className="symbol">{trade.symbol}</span>
                  </td>
                  <td>
                    <span className={`side-badge ${trade.side.toLowerCase()}`}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="price-cell">${trade.entryPrice.toFixed(2)}</td>
                  <td className="price-cell">${trade.exitPrice.toFixed(2)}</td>
                  <td className="amount-cell">{trade.amount.toFixed(6)}</td>
                  <td className="duration-cell">{formatDuration(trade.duration)}</td>
                  <td className="fees-cell">${trade.fees.toFixed(2)}</td>
                  <td className={`pnl-cell ${trade.pnl >= 0 ? 'positive' : 'negative'}`}>
                    {trade.pnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    ${Math.abs(trade.pnl).toFixed(2)}
                  </td>
                  <td className={`pnl-percent ${trade.pnl >= 0 ? 'positive' : 'negative'}`}>
                    {trade.pnl >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
