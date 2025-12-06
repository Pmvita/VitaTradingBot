// Currency converter component

import React, { useState, useEffect } from 'react';
import { currencyConversionService } from '../../../api/CurrencyConversionService';
import { paperTradingExecutor } from '../../../bot/execution/PaperTradingExecutor';
import { SUPPORTED_CURRENCIES } from '../../../constants';
import { ArrowRightLeft } from 'lucide-react';
import './CurrencyConverter.css';

export const CurrencyConverter: React.FC = () => {
  const [fromCurrency, setFromCurrency] = useState<string>('USDT');
  const [toCurrency, setToCurrency] = useState<string>('BTC');
  const [amount, setAmount] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchRate = async () => {
      if (fromCurrency && toCurrency && fromCurrency !== toCurrency) {
        const rateResult = await currencyConversionService.getExchangeRate(fromCurrency, toCurrency);
        if (rateResult.success && rateResult.data) {
          setExchangeRate(rateResult.data);
        }
      } else {
        setExchangeRate(null);
      }
    };

    fetchRate();
    const interval = setInterval(fetchRate, 10000); // Update rate every 10 seconds

    return () => clearInterval(interval);
  }, [fromCurrency, toCurrency]);

  const handleConvert = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (fromCurrency === toCurrency) {
      setError('Cannot convert to same currency');
      return;
    }

    setConverting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await paperTradingExecutor.convertCurrency(
        fromCurrency,
        toCurrency,
        parseFloat(amount)
      );

      if (result) {
        setSuccess(`Successfully converted ${amount} ${fromCurrency} to ${toCurrency}`);
        setAmount('');
        // Trigger balance update in parent
        window.dispatchEvent(new CustomEvent('balance-updated'));
      } else {
        setError('Conversion failed. Check your balance.');
      }
    } catch (err) {
      setError((err as Error).message || 'Conversion failed');
    } finally {
      setConverting(false);
    }
  };

  const getMaxAmount = () => {
    const balance = paperTradingExecutor.getBalance(fromCurrency);
    return balance ? balance.amount : 0;
  };

  const handleMax = () => {
    const max = getMaxAmount();
    setAmount(max.toString());
  };

  const estimatedAmount = exchangeRate && amount
    ? (parseFloat(amount) * exchangeRate * 0.999).toFixed(8) // Account for fees
    : '0';

  return (
    <div className="currency-converter">
      <div className="converter-header">
        <h3>Currency Converter</h3>
      </div>
      <div className="converter-form">
        <div className="converter-row">
          <div className="currency-input-group">
            <label>From</label>
            <div className="input-with-select">
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="currency-select"
              >
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="amount-input"
                step="any"
                min="0"
              />
            </div>
            <div className="balance-info">
              Balance: {getMaxAmount().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
              <button className="max-button" onClick={handleMax}>MAX</button>
            </div>
          </div>

          <div className="swap-icon">
            <ArrowRightLeft size={24} />
          </div>

          <div className="currency-input-group">
            <label>To</label>
            <div className="input-with-select">
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="currency-select"
              >
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
              <div className="estimated-amount">
                {estimatedAmount} {toCurrency}
              </div>
            </div>
            {exchangeRate && (
              <div className="rate-info">
                1 {fromCurrency} = {exchangeRate.toFixed(8)} {toCurrency}
              </div>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button
          className="convert-button"
          onClick={handleConvert}
          disabled={converting || !amount || parseFloat(amount) <= 0}
        >
          {converting ? 'Converting...' : 'Convert'}
        </button>
      </div>
    </div>
  );
};

