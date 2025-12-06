// Wallet connection component

import React, { useState } from 'react';
import { SupportedNetwork } from '../../../types';
import { NETWORK_CONFIGS } from '../../../constants';

interface WalletConnectProps {
  onConnect: (network: SupportedNetwork) => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect }) => {
  const [selectedNetwork, setSelectedNetwork] = useState<SupportedNetwork>('polygon');

  return (
    <div className="wallet-connect">
      <h3>Connect Wallet</h3>
      <div className="network-selector">
        <label>Network:</label>
        <select
          value={selectedNetwork}
          onChange={(e) => setSelectedNetwork(e.target.value as SupportedNetwork)}
        >
          {Object.keys(NETWORK_CONFIGS).map((network) => (
            <option key={network} value={network}>
              {NETWORK_CONFIGS[network as SupportedNetwork].name}
            </option>
          ))}
        </select>
      </div>
      <button
        className="btn btn-primary"
        onClick={() => onConnect(selectedNetwork)}
      >
        Connect MetaMask
      </button>
    </div>
  );
};

