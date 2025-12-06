// Moving Averages indicators

import { OHLCV } from '../../types';

export function calculateSMA(data: number[], period: number): number[] {
  if (data.length < period) {
    return [];
  }

  const sma: number[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, val) => acc + val, 0);
    sma.push(sum / period);
  }

  return sma;
}

export function calculateEMA(data: number[], period: number): number[] {
  if (data.length < period) {
    return [];
  }

  const multiplier = 2 / (period + 1);
  const ema: number[] = [];

  // Start with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  ema.push(sum / period);

  // Calculate EMA
  for (let i = period; i < data.length; i++) {
    const value = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(value);
  }

  return ema;
}

export function getLatestSMA(data: OHLCV[], period: number): number | null {
  const closes = data.map(candle => candle.close);
  const sma = calculateSMA(closes, period);
  return sma.length > 0 ? sma[sma.length - 1] : null;
}

export function getLatestEMA(data: OHLCV[], period: number): number | null {
  const closes = data.map(candle => candle.close);
  const ema = calculateEMA(closes, period);
  return ema.length > 0 ? ema[ema.length - 1] : null;
}

