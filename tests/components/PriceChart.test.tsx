// Test for PriceChart component

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PriceChart } from '../../src/gui/components/charts/PriceChart';
import { priceService } from '../../src/api/PriceService';

// Mock the price service
jest.mock('../../src/api/PriceService', () => ({
  priceService: {
    getHistoricalData: jest.fn(),
  },
}));

// Mock lightweight-charts
jest.mock('lightweight-charts', () => ({
  createChart: jest.fn(() => ({
    addCandlestickSeries: jest.fn(() => ({
      setData: jest.fn(),
      update: jest.fn(),
    })),
    addHistogramSeries: jest.fn(() => ({
      setData: jest.fn(),
    })),
    addLineSeries: jest.fn(() => ({
      setData: jest.fn(),
    })),
    removeSeries: jest.fn(),
    timeScale: jest.fn(() => ({
      scrollPosition: 0,
      fitContent: jest.fn(),
    })),
    applyOptions: jest.fn(),
    remove: jest.fn(),
  })),
  ColorType: {
    Solid: 'solid',
  },
  CrosshairMode: {
    Normal: 'normal',
  },
}));

// Mock WebSocket service
jest.mock('../../src/api/WebSocketService', () => ({
  webSocketService: {
    subscribe: jest.fn(() => jest.fn()), // Return unsubscribe function
  },
  unsubscribe: jest.fn(),
}));

describe('PriceChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state initially', () => {
    (priceService.getHistoricalData as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    render(<PriceChart symbol="BTC/USDT" timeframe="1h" />);
    
    expect(screen.getByText('Loading chart data...')).toBeInTheDocument();
  });

  it('should display chart with mock data when API fails', async () => {
    (priceService.getHistoricalData as jest.Mock).mockResolvedValue({
      success: false,
      error: 'API Error',
    });

    const { container } = render(<PriceChart symbol="BTC/USDT" timeframe="1h" />);
    
    // Wait for loading to complete (should use mock data after timeout)
    await waitFor(
      () => {
        expect(screen.queryByText('Loading chart data...')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Chart should be rendered
    expect(container.querySelector('.price-chart')).toBeInTheDocument();
    expect(container.querySelector('.price-chart.loading')).not.toBeInTheDocument();
  });

  it('should display chart with real data when API succeeds', async () => {
    const mockData = [
      {
        timestamp: Date.now() - 3600000,
        open: 45000,
        high: 45500,
        low: 44800,
        close: 45200,
        volume: 1000000,
      },
      {
        timestamp: Date.now(),
        open: 45200,
        high: 45800,
        low: 45100,
        close: 45600,
        volume: 1200000,
      },
    ];

    (priceService.getHistoricalData as jest.Mock).mockResolvedValue({
      success: true,
      data: mockData,
    });

    const { container } = render(<PriceChart symbol="BTC/USDT" timeframe="1h" />);
    
    // Wait for data to load
    await waitFor(
      () => {
        expect(screen.queryByText('Loading chart data...')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Chart should be rendered with data
    expect(container.querySelector('.price-chart')).toBeInTheDocument();
    expect(container.querySelector('.price-chart.loading')).not.toBeInTheDocument();
  });

  it('should use mock data after timeout if API is slow', async () => {
    // Make API call hang
    (priceService.getHistoricalData as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { container } = render(<PriceChart symbol="BTC/USDT" timeframe="1h" />);
    
    // Should show loading initially
    expect(screen.getByText('Loading chart data...')).toBeInTheDocument();
    
    // After timeout, should use mock data
    await waitFor(
      () => {
        expect(screen.queryByText('Loading chart data...')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Chart should be rendered with mock data
    expect(container.querySelector('.price-chart')).toBeInTheDocument();
    expect(container.querySelector('.price-chart.loading')).not.toBeInTheDocument();
  });

  it('should display symbol in chart header', async () => {
    (priceService.getHistoricalData as jest.Mock).mockResolvedValue({
      success: false,
      error: 'API Error',
    });

    render(<PriceChart symbol="ETH/USDT" timeframe="1h" />);
    
    await waitFor(
      () => {
        expect(screen.queryByText('Loading chart data...')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.getByText('ETH/USDT')).toBeInTheDocument();
  });
});

