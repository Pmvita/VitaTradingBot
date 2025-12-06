// Strategy configuration component

import React, { useState } from 'react';
import { StrategyType, Timeframe, StrategyConfig as StrategyConfigType, RiskManagementConfig } from '../../../types';
import './StrategyConfig.css';

interface StrategyConfigProps {
  strategyType: StrategyType;
  timeframe: Timeframe;
  onConfigSave: (config: StrategyConfigType) => void;
}

export const StrategyConfig: React.FC<StrategyConfigProps> = ({
  strategyType,
  timeframe,
  onConfigSave,
}) => {
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [riskConfig, setRiskConfig] = useState<RiskManagementConfig>({
    positionSize: 5,
    positionSizeType: 'PERCENTAGE',
    stopLoss: 2,
    takeProfit: 4,
    maxPositions: 3,
    maxDrawdown: 20,
    dailyLossLimit: 10,
    riskRewardRatio: 2,
  });

  const handleSave = () => {
    const config: StrategyConfigType = {
      id: `strategy-${Date.now()}`,
      type: strategyType,
      name: `${strategyType} Strategy`,
      enabled: true,
      timeframe,
      parameters,
      riskManagement: riskConfig,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onConfigSave(config);
  };

  return (
    <div className="strategy-config">
      <h3>Strategy Configuration</h3>

      <div className="config-section">
        <h4>Strategy Parameters</h4>
        {strategyType === 'MEAN_REVERSION' && (
          <>
            <div className="config-field">
              <label>Bollinger Period:</label>
              <input
                type="number"
                value={parameters.bollingerPeriod || 20}
                onChange={(e) =>
                  setParameters({ ...parameters, bollingerPeriod: parseInt(e.target.value) })
                }
                className="config-input"
              />
            </div>
            <div className="config-field">
              <label>Bollinger Std Dev:</label>
              <input
                type="number"
                step="0.1"
                value={parameters.bollingerStdDev || 2.0}
                onChange={(e) =>
                  setParameters({ ...parameters, bollingerStdDev: parseFloat(e.target.value) })
                }
                className="config-input"
              />
            </div>
            <div className="config-field">
              <label>RSI Period:</label>
              <input
                type="number"
                value={parameters.rsiPeriod || 14}
                onChange={(e) =>
                  setParameters({ ...parameters, rsiPeriod: parseInt(e.target.value) })
                }
                className="config-input"
              />
            </div>
          </>
        )}
      </div>

      <div className="config-section">
        <h4>Risk Management</h4>
        <div className="config-field">
          <label>Position Size (%):</label>
          <input
            type="number"
            value={riskConfig.positionSize}
            onChange={(e) =>
              setRiskConfig({ ...riskConfig, positionSize: parseFloat(e.target.value) })
            }
            className="config-input"
          />
        </div>
        <div className="config-field">
          <label>Stop Loss (%):</label>
          <input
            type="number"
            value={riskConfig.stopLoss}
            onChange={(e) =>
              setRiskConfig({ ...riskConfig, stopLoss: parseFloat(e.target.value) })
            }
            className="config-input"
          />
        </div>
        <div className="config-field">
          <label>Take Profit (%):</label>
          <input
            type="number"
            value={riskConfig.takeProfit}
            onChange={(e) =>
              setRiskConfig({ ...riskConfig, takeProfit: parseFloat(e.target.value) })
            }
            className="config-input"
          />
        </div>
        <div className="config-field">
          <label>Max Positions:</label>
          <input
            type="number"
            value={riskConfig.maxPositions}
            onChange={(e) =>
              setRiskConfig({ ...riskConfig, maxPositions: parseInt(e.target.value) })
            }
            className="config-input"
          />
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave}>
        Save Configuration
      </button>
    </div>
  );
};

