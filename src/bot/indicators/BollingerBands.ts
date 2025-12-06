// Bollinger Bands indicator

import { OHLCV } from '../../types';

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
}

export function calculateBollingerBands(
  data: OHLCV[],
  period: number = 20,
  stdDev: number = 2
): BollingerBands[] {
  if (data.length < period) {
    return [];
  }

  const bands: BollingerBands[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const closes = slice.map(candle => candle.close);

    // Calculate SMA (middle band)
    const sum = closes.reduce((acc, val) => acc + val, 0);
    const sma = sum / period;

    // Calculate standard deviation
    const variance = closes.reduce((acc, val) => acc + Math.pow(val - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    // Calculate bands
    const upper = sma + (stdDev * standardDeviation);
    const lower = sma - (stdDev * standardDeviation);

    bands.push({
      upper,
      middle: sma,
      lower,
    });
  }

  return bands;
}

export function getLatestBollingerBands(
  data: OHLCV[],
  period: number = 20,
  stdDev: number = 2
): BollingerBands | null {
  const bands = calculateBollingerBands(data, period, stdDev);
  return bands.length > 0 ? bands[bands.length - 1] : null;
}

