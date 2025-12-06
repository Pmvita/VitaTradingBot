// Real-Time P&L Display Component - Critical Feature

import React, { useEffect, useState } from 'react';
import { BotState } from '../../../types';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import './PnLDisplay.css';

interface PnLDisplayProps {
  botState: BotState;
}

export const PnLDisplay: React.FC<PnLDisplayProps> = ({ botState }) => {
  const [sessionStartBalance] = useState(botState.balance);
  const sessionPnL = botState.totalPnL;

  // Calculate today's P&L (simplified - would need date tracking)
  const todayPnL = botState.realizedPnL + botState.unrealizedPnL;

  return (
    <div className="pnl-display">
      <div className="pnl-header">
        <h3>Real-Time Profit & Loss</h3>
        <div className="bot-status-badge">
          <span className={`status-dot ${botState.status.toLowerCase()}`}></span>
          {botState.status} | Uptime: {formatUptime(botState.uptime || 0)}
        </div>
      </div>

      <div className="pnl-grid">
        <div className="pnl-card total">
          <div className="pnl-label">
            <DollarSign size={20} />
            <span>Total P&L</span>
          </div>
          <div className={`pnl-value ${botState.totalPnL >= 0 ? 'positive' : 'negative'}`}>
            {botState.totalPnL >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            <div>
              <div className="pnl-amount">
                ${Math.abs(botState.totalPnL).toFixed(2)}
              </div>
              <div className="pnl-percent">
                {sessionStartBalance > 0
                  ? `(${((botState.totalPnL / sessionStartBalance) * 100).toFixed(2)}%)`
                  : '(0.00%)'}
              </div>
            </div>
          </div>
        </div>

        <div className="pnl-card today">
          <div className="pnl-label">
            <span>Today P&L</span>
          </div>
          <div className={`pnl-value ${todayPnL >= 0 ? 'positive' : 'negative'}`}>
            {todayPnL >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            <div>
              <div className="pnl-amount">${Math.abs(todayPnL).toFixed(2)}</div>
              <div className="pnl-percent">
                {botState.balance > 0
                  ? `(${((todayPnL / botState.balance) * 100).toFixed(2)}%)`
                  : '(0.00%)'}
              </div>
            </div>
          </div>
        </div>

        <div className="pnl-card session">
          <div className="pnl-label">
            <span>Session P&L</span>
          </div>
          <div className={`pnl-value ${sessionPnL >= 0 ? 'positive' : 'negative'}`}>
            {sessionPnL >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            <div>
              <div className="pnl-amount">${Math.abs(sessionPnL).toFixed(2)}</div>
              <div className="pnl-percent">
                {sessionStartBalance > 0
                  ? `(${((sessionPnL / sessionStartBalance) * 100).toFixed(2)}%)`
                  : '(0.00%)'}
              </div>
            </div>
          </div>
        </div>

        <div className="pnl-card unrealized">
          <div className="pnl-label">
            <span>Unrealized P&L</span>
          </div>
          <div className={`pnl-value ${botState.unrealizedPnL >= 0 ? 'positive' : 'negative'}`}>
            {botState.unrealizedPnL >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            <div>
              <div className="pnl-amount">${Math.abs(botState.unrealizedPnL).toFixed(2)}</div>
              <div className="pnl-percent">
                {botState.balance > 0
                  ? `(${((botState.unrealizedPnL / botState.balance) * 100).toFixed(2)}%)`
                  : '(0.00%)'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pnl-breakdown">
        <div className="breakdown-item">
          <span className="breakdown-label">Realized P&L:</span>
          <span className={`breakdown-value ${botState.realizedPnL >= 0 ? 'positive' : 'negative'}`}>
            ${botState.realizedPnL.toFixed(2)}
          </span>
          <span className="breakdown-note">(from closed positions)</span>
        </div>
        <div className="breakdown-item">
          <span className="breakdown-label">Unrealized P&L:</span>
          <span className={`breakdown-value ${botState.unrealizedPnL >= 0 ? 'positive' : 'negative'}`}>
            ${botState.unrealizedPnL.toFixed(2)}
          </span>
          <span className="breakdown-note">(from open positions)</span>
        </div>
        <div className="breakdown-item">
          <span className="breakdown-label">Fees Paid:</span>
          <span className="breakdown-value negative">-$0.00</span>
          <span className="breakdown-note">(estimated)</span>
        </div>
        <div className="breakdown-item">
          <span className="breakdown-label">Net P&L:</span>
          <span className={`breakdown-value ${botState.totalPnL >= 0 ? 'positive' : 'negative'}`}>
            ${botState.totalPnL.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="pnl-stats">
        <div className="stat-item">
          <span className="stat-label">Win Rate</span>
          <span className="stat-value">{botState.winRate.toFixed(1)}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Trades</span>
          <span className="stat-value">{botState.totalTrades}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Active Positions</span>
          <span className="stat-value">{botState.positions.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Balance</span>
          <span className="stat-value">${botState.balance.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

