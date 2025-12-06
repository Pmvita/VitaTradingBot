// Full TradingView-style candlestick chart with technical indicators

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, ColorType, CrosshairMode } from 'lightweight-charts';
import { Timeframe, OHLCV } from '../../../types';
import { priceService } from '../../../api/PriceService';
import { webSocketService } from '../../../api/WebSocketService';
import { calculateRSI } from '../../../bot/indicators/RSI';
import { calculateBollingerBands } from '../../../bot/indicators/BollingerBands';
import { calculateMACD } from '../../../bot/indicators/MACD';
import { calculateSMA } from '../../../bot/indicators/MovingAverages';
import './PriceChart.css';

interface PriceChartProps {
  symbol: string;
  timeframe: Timeframe;
}

interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const PriceChart: React.FC<PriceChartProps> = ({ symbol, timeframe }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [indicators, setIndicators] = useState<{
    rsi?: ISeriesApi<'Line'>;
    macd?: ISeriesApi<'Line'>;
    bollinger?: { upper: ISeriesApi<'Line'>; middle: ISeriesApi<'Line'>; lower: ISeriesApi<'Line'> };
    sma50?: ISeriesApi<'Line'>;
    sma200?: ISeriesApi<'Line'>;
  }>({});
  const [showIndicators, setShowIndicators] = useState({
    rsi: false,
    macd: false,
    bollinger: false,
    sma: false,
  });
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [historicalData, setHistoricalData] = useState<OHLCV[]>([]);
  const [chartReady, setChartReady] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) {
      return;
    }

    // Function to initialize the chart
    const initChart = () => {
      if (!chartContainerRef.current || chartRef.current) {
        return; // Already initialized or container gone
      }

      const containerWidth = chartContainerRef.current.clientWidth || 800;
      const containerHeight = chartContainerRef.current.clientHeight || 500;

      try {
        // Create chart
        const chart = createChart(chartContainerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: '#131829' },
            textColor: '#94a3b8',
          },
          grid: {
            vertLines: { color: '#1e293b' },
            horzLines: { color: '#1e293b' },
          },
          crosshair: {
            mode: CrosshairMode.Normal,
          },
          rightPriceScale: {
            borderColor: '#1e293b',
          },
          timeScale: {
            borderColor: '#1e293b',
            timeVisible: true,
            secondsVisible: timeframe === '1m' || timeframe === '5m',
          },
          width: containerWidth,
          height: containerHeight,
        });

        chartRef.current = chart;

        // Create candlestick series
        const candlestickSeries = chart.addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
          priceScaleId: 'right',
        });
        candlestickSeriesRef.current = candlestickSeries;

        // Create volume series
        const volumeSeries = chart.addHistogramSeries({
          color: '#3b82f6',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: 'volume',
        });
        volumeSeriesRef.current = volumeSeries;

        // Mark chart as ready
        setChartReady(true);
        console.log('Chart initialized successfully');
      } catch (error) {
        console.error('Error initializing chart:', error);
      }
    };

    // Try to initialize immediately
    if (chartContainerRef.current.clientWidth > 0) {
      initChart();
    } else {
      // Wait for container to get dimensions using ResizeObserver
      const resizeObserver = new ResizeObserver(() => {
        if (chartContainerRef.current && chartContainerRef.current.clientWidth > 0) {
          initChart();
          resizeObserver.disconnect();
        }
      });
      resizeObserver.observe(chartContainerRef.current);

      // Also try after a short delay as fallback
      const timer = setTimeout(() => {
        if (!chartRef.current && chartContainerRef.current) {
          initChart();
        }
        resizeObserver.disconnect();
      }, 200);

      return () => {
        resizeObserver.disconnect();
        clearTimeout(timer);
      };
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        const newWidth = chartContainerRef.current.clientWidth || 800;
        chart.applyOptions({
          width: newWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Use ResizeObserver for more accurate container size tracking
    let resizeObserver: ResizeObserver | null = null;
    if (chartContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (chart) {
        chart.remove();
      }
      setChartReady(false);
    };
  }, [timeframe]);


  // Calculate and update indicators
  const updateIndicators = useCallback((data: OHLCV[]) => {
    if (!chartRef.current || !candlestickSeriesRef.current || data.length === 0) return;

    const closes = data.map((d) => d.close);

    // Update RSI
    if (showIndicators.rsi && indicators.rsi) {
      const rsiValues = calculateRSI(data, 14);
      const rsiData = data.slice(14).map((d, i) => ({
        time: (d.timestamp / 1000) as any,
        value: rsiValues[i],
      }));
      indicators.rsi.setData(rsiData);
    }

    // Update Bollinger Bands
    if (showIndicators.bollinger && indicators.bollinger) {
      const bands = calculateBollingerBands(data, 20, 2);
      const bandData = data.slice(19).map((d, i) => ({
        time: (d.timestamp / 1000) as any,
        upper: bands[i].upper,
        middle: bands[i].middle,
        lower: bands[i].lower,
      }));
      indicators.bollinger.upper.setData(bandData.map((d) => ({ time: d.time, value: d.upper })));
      indicators.bollinger.middle.setData(bandData.map((d) => ({ time: d.time, value: d.middle })));
      indicators.bollinger.lower.setData(bandData.map((d) => ({ time: d.time, value: d.lower })));
    }

    // Update MACD
    if (showIndicators.macd && indicators.macd) {
      const macdValues = calculateMACD(data, 12, 26, 9);
      const macdData = data.slice(34).map((d, i) => ({
        time: (d.timestamp / 1000) as any,
        value: macdValues[i]?.macd || 0,
      }));
      indicators.macd.setData(macdData);
    }

    // Update Moving Averages
    if (showIndicators.sma) {
      if (indicators.sma50) {
        const sma50Values = calculateSMA(closes, 50);
        const sma50Data = data.slice(49).map((d, i) => ({
          time: (d.timestamp / 1000) as any,
          value: sma50Values[i],
        }));
        indicators.sma50.setData(sma50Data);
      }
      if (indicators.sma200) {
        const sma200Values = calculateSMA(closes, 200);
        const sma200Data = data.slice(199).map((d, i) => ({
          time: (d.timestamp / 1000) as any,
          value: sma200Values[i],
        }));
        indicators.sma200.setData(sma200Data);
      }
    }
  }, [showIndicators, indicators]);

  // Load historical data - only after chart is ready
  useEffect(() => {
    if (!chartReady) {
      return;
    }

    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) {
      return;
    }

    let cancelled = false;

    const displayData = (data: OHLCV[]) => {
      if (cancelled || !candlestickSeriesRef.current || !volumeSeriesRef.current) return;
      if (data.length === 0) {
        console.warn('No data to display');
        setLoading(false);
        return;
      }

      try {
        const candlestickData: CandlestickData[] = data.map((candle) => ({
          time: (candle.timestamp / 1000) as any,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        }));

        const volumeData = data.map((candle) => ({
          time: (candle.timestamp / 1000) as any,
          value: candle.volume,
          color: candle.close >= candle.open ? '#10b981' : '#ef4444',
        }));

        if (candlestickSeriesRef.current && volumeSeriesRef.current) {
          candlestickSeriesRef.current.setData(candlestickData);
          volumeSeriesRef.current.setData(volumeData);
          setCurrentPrice(data[data.length - 1].close);
          setHistoricalData(data);
          setLoading(false);

          // Update indicators after data is loaded
          setTimeout(() => {
            if (!cancelled) {
              updateIndicators(data);
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error displaying chart data:', error);
        setLoading(false);
      }
    };

    const loadData = async () => {
      setLoading(true);
      console.log('Loading chart data for', symbol, timeframe);

      try {
        const result = await priceService.getHistoricalData(symbol, timeframe, 200);

        if (cancelled) {
          return;
        }

        if (result.success && result.data && result.data.length > 0) {
          console.log('Chart data loaded successfully:', result.data.length, 'candles');
          displayData(result.data);
        } else {
          console.error('Failed to load chart data:', result.error);
          setLoading(false);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        console.error('Error loading chart data:', error);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [symbol, timeframe, chartReady, updateIndicators]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!candlestickSeriesRef.current) return;

    const unsubscribe = webSocketService.subscribe(symbol, (priceData) => {
      setCurrentPrice(priceData.price);

      // Update last candle with new price
      if (candlestickSeriesRef.current && historicalData.length > 0) {
        const lastCandle = historicalData[historicalData.length - 1];
        const now = Math.floor(Date.now() / 1000);
        const currentTime = (now - (now % getTimeframeSeconds(timeframe))) as any;

        // Update the last candle
        candlestickSeriesRef.current.update({
          time: (lastCandle.timestamp / 1000) as any,
          open: lastCandle.open,
          high: Math.max(lastCandle.high, priceData.price),
          low: Math.min(lastCandle.low, priceData.price),
          close: priceData.price,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [symbol, timeframe, historicalData]);

  // Add/remove indicators
  const toggleIndicator = (indicator: 'rsi' | 'macd' | 'bollinger' | 'sma') => {
    if (!chartRef.current || !candlestickSeriesRef.current) return;

    setShowIndicators((prev) => {
      const newState = { ...prev, [indicator]: !prev[indicator] };

      if (newState[indicator]) {
        // Add indicator
        if (indicator === 'rsi' && !indicators.rsi) {
          const rsiSeries = chartRef.current!.addLineSeries({
            color: '#8b5cf6',
            lineWidth: 2,
            priceScaleId: 'rsi',
            scaleMargins: { top: 0.7, bottom: 0 },
          });
          setIndicators((prev) => ({ ...prev, rsi: rsiSeries }));
          if (historicalData.length > 0) {
            updateIndicators(historicalData);
          }
        } else if (indicator === 'macd' && !indicators.macd) {
          const macdSeries = chartRef.current!.addLineSeries({
            color: '#3b82f6',
            lineWidth: 2,
            priceScaleId: 'macd',
            scaleMargins: { top: 0.7, bottom: 0 },
          });
          setIndicators((prev) => ({ ...prev, macd: macdSeries }));
          if (historicalData.length > 0) {
            updateIndicators(historicalData);
          }
        } else if (indicator === 'bollinger' && !indicators.bollinger) {
          const upper = chartRef.current!.addLineSeries({
            color: '#f59e0b',
            lineWidth: 1,
            lineStyle: 2,
          });
          const middle = chartRef.current!.addLineSeries({
            color: '#94a3b8',
            lineWidth: 1,
          });
          const lower = chartRef.current!.addLineSeries({
            color: '#f59e0b',
            lineWidth: 1,
            lineStyle: 2,
          });
          setIndicators((prev) => ({ ...prev, bollinger: { upper, middle, lower } }));
          if (historicalData.length > 0) {
            updateIndicators(historicalData);
          }
        } else if (indicator === 'sma' && !indicators.sma50) {
          const sma50 = chartRef.current!.addLineSeries({
            color: '#3b82f6',
            lineWidth: 2,
          });
          const sma200 = chartRef.current!.addLineSeries({
            color: '#8b5cf6',
            lineWidth: 2,
          });
          setIndicators((prev) => ({ ...prev, sma50, sma200 }));
          if (historicalData.length > 0) {
            updateIndicators(historicalData);
          }
        }
      } else {
        // Remove indicator
        if (indicator === 'rsi' && indicators.rsi) {
          chartRef.current!.removeSeries(indicators.rsi);
          setIndicators((prev) => ({ ...prev, rsi: undefined }));
        } else if (indicator === 'macd' && indicators.macd) {
          chartRef.current!.removeSeries(indicators.macd);
          setIndicators((prev) => ({ ...prev, macd: undefined }));
        } else if (indicator === 'bollinger' && indicators.bollinger) {
          chartRef.current!.removeSeries(indicators.bollinger.upper);
          chartRef.current!.removeSeries(indicators.bollinger.middle);
          chartRef.current!.removeSeries(indicators.bollinger.lower);
          setIndicators((prev) => ({ ...prev, bollinger: undefined }));
        } else if (indicator === 'sma' && indicators.sma50) {
          chartRef.current!.removeSeries(indicators.sma50);
          chartRef.current!.removeSeries(indicators.sma200!);
          setIndicators((prev) => ({ ...prev, sma50: undefined, sma200: undefined }));
        }
      }

      return newState;
    });
  };

  const getTimeframeSeconds = (tf: Timeframe): number => {
    const seconds: Record<Timeframe, number> = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '30m': 1800,
      '1h': 3600,
      '4h': 14400,
      '1d': 86400,
    };
    return seconds[tf];
  };

  const handleZoomIn = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().scrollPosition -= 10;
    }
  };

  const handleZoomOut = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().scrollPosition += 10;
    }
  };

  const handleResetZoom = () => {
    if (chartRef.current && historicalData.length > 0) {
      chartRef.current.timeScale().fitContent();
    }
  };

  if (loading) {
    return (
      <div className="price-chart loading">
        <div className="loading-spinner"></div>
        <p>Loading chart data...</p>
      </div>
    );
  }

  return (
    <div className="price-chart">
      <div className="chart-header">
        <div className="chart-title">
        <h3>{symbol}</h3>
          {currentPrice && (
            <span className="current-price">
              ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
      </div>
        <div className="chart-controls">
          <div className="indicator-toggles">
            <button
              className={`indicator-btn ${showIndicators.rsi ? 'active' : ''}`}
              onClick={() => toggleIndicator('rsi')}
              title="RSI (Relative Strength Index)"
            >
              RSI
            </button>
            <button
              className={`indicator-btn ${showIndicators.macd ? 'active' : ''}`}
              onClick={() => toggleIndicator('macd')}
              title="MACD (Moving Average Convergence Divergence)"
            >
              MACD
            </button>
            <button
              className={`indicator-btn ${showIndicators.bollinger ? 'active' : ''}`}
              onClick={() => toggleIndicator('bollinger')}
              title="Bollinger Bands"
            >
              BB
            </button>
            <button
              className={`indicator-btn ${showIndicators.sma ? 'active' : ''}`}
              onClick={() => toggleIndicator('sma')}
              title="Moving Averages (50 & 200)"
            >
              MA
            </button>
          </div>
        </div>
      </div>
      <div className="chart-container" ref={chartContainerRef}></div>
      <div className="chart-footer">
        <div className="timeframe-info">Timeframe: {timeframe}</div>
        <div className="chart-tools">
          <button className="tool-btn" onClick={handleZoomIn} title="Zoom In">+</button>
          <button className="tool-btn" onClick={handleZoomOut} title="Zoom Out">−</button>
          <button className="tool-btn" onClick={handleResetZoom} title="Reset Zoom">⟲</button>
        </div>
      </div>
    </div>
  );
};
