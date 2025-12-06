// Recent trades table

import React, { useEffect, useState } from 'react';
import { Trade } from '../../../types';
import { tradeRepository } from '../../../storage/TradeRepository';
import './RecentTrades.css';

interface RecentTradesProps {
  limit?: number;
}

export const RecentTrades: React.FC<RecentTradesProps> = ({ limit = 20 }) => {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    loadTrades();
    const interval = setInterval(loadTrades, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadTrades = async () => {
    const allTrades = await tradeRepository.getAllTrades();
    const sorted = allTrades.sort((a, b) => b.closedAt - a.closedAt);
    setTrades(sorted.slice(0, limit));
  };

  if (trades.length === 0) {
    return (
      <div className="recent-trades empty">
        <p>No trades yet</p>
      </div>
    );
  }

  return (
    <div className="recent-trades">
      <table className="trades-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Pair</th>
            <th>Type</th>
            <th>Entry</th>
            <th>Exit</th>
            <th>Amount</th>
            <th>P&L</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id}>
              <td>{new Date(trade.closedAt).toLocaleTimeString()}</td>
              <td>{trade.symbol}</td>
              <td>
                <span className={`side ${trade.side.toLowerCase()}`}>
                  {trade.side}
                </span>
              </td>
              <td>${trade.entryPrice.toFixed(2)}</td>
              <td>${trade.exitPrice.toFixed(2)}</td>
              <td>{trade.amount.toFixed(6)}</td>
              <td className={trade.pnl >= 0 ? 'positive' : 'negative'}>
                ${trade.pnl.toFixed(2)} ({trade.pnlPercent.toFixed(2)}%)
              </td>
              <td>
                <span className="status-badge completed">Completed</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

