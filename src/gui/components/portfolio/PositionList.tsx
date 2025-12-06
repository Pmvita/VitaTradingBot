// List of open positions

import React from 'react';
import { Position } from '../../../types';
import './PositionList.css';

interface PositionListProps {
  positions: Position[];
}

export const PositionList: React.FC<PositionListProps> = ({ positions }) => {
  if (positions.length === 0) {
    return (
      <div className="position-list empty">
        <p>No open positions</p>
      </div>
    );
  }

  return (
    <div className="position-list">
      {positions.map((position) => (
        <div key={position.id} className="position-card">
          <div className="position-header">
            <div className="position-symbol">
              <span className="symbol">{position.symbol}</span>
              <span className={`side ${position.side.toLowerCase()}`}>
                {position.side}
              </span>
            </div>
            <button className="close-btn">Close</button>
          </div>
          <div className="position-details">
            <div className="detail-row">
              <span className="label">Entry:</span>
              <span className="value">${position.entryPrice.toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Current:</span>
              <span className="value">${position.currentPrice.toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Amount:</span>
              <span className="value">{position.amount.toFixed(6)}</span>
            </div>
            <div className="detail-row">
              <span className="label">P&L:</span>
              <span className={`value ${position.unrealizedPnL >= 0 ? 'positive' : 'negative'}`}>
                ${position.unrealizedPnL.toFixed(2)} ({position.unrealizedPnLPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

