// Wallet connection modal with industry-standard flow

import React, { useState } from 'react';
import { X, Wallet, Shield, Check } from 'lucide-react';
import { walletService } from '../../../wallet/WalletService';
import { SupportedNetwork } from '../../../types';
import { NETWORK_CONFIGS } from '../../../constants';
import './WalletConnectionModal.css';

interface WalletConnectionModalProps {
  onClose: () => void;
  onConnected: () => void;
}

export const WalletConnectionModal: React.FC<WalletConnectionModalProps> = ({
  onClose,
  onConnected,
}) => {
  const [selectedNetwork, setSelectedNetwork] = useState<SupportedNetwork>('polygon');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'connecting' | 'success'>('select');

  const handleConnect = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setConnecting(true);
    setError(null);
    setStep('connecting');

    try {
      const result = await walletService.connectWallet(selectedNetwork);
      
      if (result.success) {
        setStep('success');
        setTimeout(() => {
          onConnected();
        }, 1500);
      } else {
        setError(result.error || 'Failed to connect wallet');
        setStep('select');
      }
    } catch (err) {
      setError((err as Error).message);
      setStep('select');
    } finally {
      setConnecting(false);
    }
  };

  const handleImportWallet = () => {
    // Navigate to import wallet page or show import modal
    setError('Import wallet feature coming soon');
  };

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {step === 'select' && (
          <>
            <div className="modal-header">
              <div className="modal-icon">
                <Wallet size={32} />
              </div>
              <h2>Connect Wallet</h2>
              <p>Choose how you'd like to connect</p>
            </div>

            <div className="wallet-options">
              <div className="wallet-option" onClick={handleConnect}>
                <div className="wallet-option-icon">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path
                      d="M28 8.5L16 2L4 8.5L16 15L28 8.5Z"
                      fill="currentColor"
                      opacity="0.6"
                    />
                    <path
                      d="M4 23.5L16 30L28 23.5L16 17L4 23.5Z"
                      fill="currentColor"
                    />
                    <path
                      d="M4 15.5L16 22L28 15.5L16 9L4 15.5Z"
                      fill="currentColor"
                      opacity="0.8"
                    />
                  </svg>
                </div>
                <div className="wallet-option-content">
                  <h3>MetaMask</h3>
                  <p>Connect using MetaMask browser extension</p>
                </div>
                <div className="wallet-option-arrow">→</div>
              </div>

              <div className="wallet-option" onClick={handleImportWallet}>
                <div className="wallet-option-icon">
                  <Shield size={32} />
                </div>
                <div className="wallet-option-content">
                  <h3>Import Wallet</h3>
                  <p>Import using private key or mnemonic</p>
                </div>
                <div className="wallet-option-arrow">→</div>
              </div>
            </div>

            <div className="network-selector">
              <label>Select Network:</label>
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value as SupportedNetwork)}
                className="network-select"
              >
                {Object.entries(NETWORK_CONFIGS).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="security-notice">
              <Shield size={16} />
              <span>Your keys are stored securely and never leave your device</span>
            </div>
          </>
        )}

        {step === 'connecting' && (
          <div className="connecting-state">
            <div className="connecting-spinner"></div>
            <h3>Connecting to wallet...</h3>
            <p>Please approve the connection in your wallet</p>
          </div>
        )}

        {step === 'success' && (
          <div className="success-state">
            <div className="success-icon">
              <Check size={48} />
            </div>
            <h3>Wallet Connected!</h3>
            <p>Redirecting to dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
};

