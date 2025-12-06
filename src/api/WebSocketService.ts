// WebSocket service for real-time price feeds

import { PriceData, ApiResponse } from '../types';
import { logger } from '../utils/logger';

type PriceCallback = (data: PriceData) => void;

class WebSocketService {
  private connections: Map<string, WebSocket> = new Map();
  private callbacks: Map<string, Set<PriceCallback>> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;

  /**
   * Subscribe to price updates for a symbol
   */
  subscribe(symbol: string, callback: PriceCallback): () => void {
    if (!this.callbacks.has(symbol)) {
      this.callbacks.set(symbol, new Set());
    }
    this.callbacks.get(symbol)!.add(callback);

    // Connect if not already connected
    if (!this.connections.has(symbol)) {
      this.connect(symbol);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(symbol);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.disconnect(symbol);
        }
      }
    };
  }

  /**
   * Connect WebSocket for a symbol
   */
  private connect(symbol: string): void {
    try {
      // Use Binance WebSocket for crypto pairs
      const binanceSymbol = symbol.replace('/', '').toLowerCase();
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${binanceSymbol}@ticker`);

      ws.onopen = () => {
        logger.info(`WebSocket connected for ${symbol}`);
        this.connections.set(symbol, ws);
        this.reconnectAttempts.set(symbol, 0);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const priceData: PriceData = {
            symbol,
            price: parseFloat(data.c),
            change24h: parseFloat(data.P),
            changePercent24h: parseFloat(data.P),
            volume24h: parseFloat(data.v),
            timestamp: Date.now(),
          };

          // Notify all callbacks
          const callbacks = this.callbacks.get(symbol);
          if (callbacks) {
            callbacks.forEach(cb => cb(priceData));
          }
        } catch (error) {
          logger.error('Failed to parse WebSocket message', error as Error);
        }
      };

      ws.onerror = (error) => {
        logger.error(`WebSocket error for ${symbol}`, error as any);
      };

      ws.onclose = () => {
        logger.warn(`WebSocket closed for ${symbol}`);
        this.connections.delete(symbol);
        this.attemptReconnect(symbol);
      };
    } catch (error) {
      logger.error(`Failed to connect WebSocket for ${symbol}`, error as Error);
      this.attemptReconnect(symbol);
    }
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(symbol: string): void {
    const attempts = this.reconnectAttempts.get(symbol) || 0;
    if (attempts >= this.maxReconnectAttempts) {
      logger.error(`Max reconnect attempts reached for ${symbol}`);
      return;
    }

    this.reconnectAttempts.set(symbol, attempts + 1);
    const delay = Math.min(1000 * Math.pow(2, attempts), 30000); // Exponential backoff

    setTimeout(() => {
      if (this.callbacks.has(symbol) && this.callbacks.get(symbol)!.size > 0) {
        this.connect(symbol);
      }
    }, delay);
  }

  /**
   * Disconnect WebSocket for a symbol
   */
  private disconnect(symbol: string): void {
    const ws = this.connections.get(symbol);
    if (ws) {
      ws.close();
      this.connections.delete(symbol);
      this.reconnectAttempts.delete(symbol);
    }
  }

  /**
   * Disconnect all WebSockets
   */
  disconnectAll(): void {
    this.connections.forEach((ws, symbol) => {
      ws.close();
    });
    this.connections.clear();
    this.callbacks.clear();
    this.reconnectAttempts.clear();
  }
}

export const webSocketService = new WebSocketService();

