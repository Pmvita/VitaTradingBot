// MACD (Moving Average Convergence Divergence) indicator

import { OHLCV } from '../../types';

export interface MACD {
  macd: number;
  signal: number;
  histogram: number;
}

export function calculateEMA(data: number[], period: number): number[] {
  const multiplier = 2 / (period + 1);
  const ema: number[] = [];

  // Start with SMA
  let sum = 0;
  for (let i = 0; i < period && i < data.length; i++) {
    sum += data[i];
  }
  ema.push(sum / Math.min(period, data.length));

  // Calculate EMA
  for (let i = period; i < data.length; i++) {
    const value = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(value);
  }

  return ema;
}

export function calculateMACD(
  data: OHLCV[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACD[] {
  if (data.length < slowPeriod + signalPeriod) {
    return [];
  }

  const closes = data.map(candle => candle.close);

  // Calculate EMAs
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  // Calculate MACD line
  const macdLine: number[] = [];
  const offset = slowPeriod - fastPeriod;

  for (let i = 0; i < slowEMA.length; i++) {
    const fastIndex = i + offset;
    if (fastIndex < fastEMA.length) {
      macdLine.push(fastEMA[fastIndex] - slowEMA[i]);
    }
  }

  // Calculate signal line (EMA of MACD line)
  const signalLine = calculateEMA(macdLine, signalPeriod);

  // Calculate histogram
  const macd: MACD[] = [];
  const signalOffset = macdLine.length - signalLine.length;

  for (let i = 0; i < signalLine.length; i++) {
    const macdIndex = i + signalOffset;
    if (macdIndex < macdLine.length) {
      macd.push({
        macd: macdLine[macdIndex],
        signal: signalLine[i],
        histogram: macdLine[macdIndex] - signalLine[i],
      });
    }
  }

  return macd;
}

export function getLatestMACD(
  data: OHLCV[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACD | null {
  const macd = calculateMACD(data, fastPeriod, slowPeriod, signalPeriod);
  return macd.length > 0 ? macd[macd.length - 1] : null;
}

