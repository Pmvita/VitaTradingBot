// Main trading bot orchestrator

import {
  BotStatus,
  BotState,
  StrategyConfig,
  Position,
  Trade,
  Signal,
  OrderSide,
} from '../types';
import { BaseStrategy } from './strategies/BaseStrategy';
import { MeanReversionStrategy } from './strategies/MeanReversion';
import { MomentumStrategy } from './strategies/Momentum';
import { riskManager } from './risk/RiskManager';
import { timeframeManager } from './scheduler/TimeframeManager';
import { tradingHours } from './scheduler/TradingHours';
import { priceService } from '../api/PriceService';
import { dexService } from '../wallet/DEXService';
import { tradeRepository } from '../storage/TradeRepository';
import { walletService } from '../wallet/WalletService';
import { orderManager } from './execution/OrderManager';
import { PAPER_TRADING_INITIAL_CAPITAL } from '../constants';
import { logger } from '../utils/logger';

class TradingBot {
  private status: BotStatus = 'STOPPED';
  private state: BotState;
  private activeStrategy: BaseStrategy | null = null;
  private strategyConfig: StrategyConfig | null = null;
  private tradingLoop: NodeJS.Timeout | null = null;
  private updateInterval = 60000; // 1 minute
  private startTime: number = 0;

  constructor() {
    this.state = {
      status: 'STOPPED',
      activeStrategies: [],
      positions: [],
      orders: [],
      balance: 0,
      totalPnL: 0,
      realizedPnL: 0,
      unrealizedPnL: 0,
      winRate: 0,
      totalTrades: 0,
    };
  }

  /**
   * Start the trading bot
   */
  async start(config: StrategyConfig): Promise<void> {
    if (this.status === 'RUNNING') {
      logger.warn('Bot is already running');
      return;
    }

    try {
      // Initialize strategy
      this.strategyConfig = config;
      this.activeStrategy = this.createStrategy(config);

      if (!this.activeStrategy.validateConfig()) {
        throw new Error('Invalid strategy configuration');
      }

      // Check trading mode
      const tradingMode = localStorage.getItem('trading-mode');
      
      if (tradingMode === 'paper') {
        // Paper trading: initialize paper trading executor if needed
        const { paperTradingExecutor } = await import('./execution/PaperTradingExecutor');
        const balances = paperTradingExecutor.getAllBalances();
        if (balances.length === 0) {
          // Initialize with default capital if not already initialized
          paperTradingExecutor.initialize(PAPER_TRADING_INITIAL_CAPITAL, 'USDT');
        }
        
        // Get balance from paper trading executor
        const quoteCurrency = config.symbol.split('/')[1] || 'USDT';
        const balance = paperTradingExecutor.getBalance(quoteCurrency);
        this.state.balance = balance?.amount || 0;
      } else {
        // Live trading: check wallet connection
        const wallet = walletService.getCurrentWallet();
        if (!wallet) {
          throw new Error('Wallet not connected');
        }

        // Update balance
        const balanceResult = await walletService.getBalance(wallet.address);
        if (balanceResult.success && balanceResult.data) {
          this.state.balance = parseFloat(balanceResult.data);
        }
      }

      // Load existing positions and orders
      await this.loadState();

      // Start trading loop
      this.status = 'RUNNING';
      this.state.status = 'RUNNING';
      this.startTime = Date.now();
      this.state.startTime = this.startTime;

      this.tradingLoop = setInterval(() => {
        this.executeTradingCycle();
      }, this.updateInterval);

      logger.info('Trading bot started', { strategy: config.name, symbol: config.symbol, mode: tradingMode });
    } catch (error) {
      logger.error('Failed to start bot', error as Error);
      this.status = 'ERROR';
      this.state.status = 'ERROR';
      throw error;
    }
  }

  /**
   * Stop the trading bot
   */
  stop(): void {
    if (this.status === 'STOPPED') {
      return;
    }

    if (this.tradingLoop) {
      clearInterval(this.tradingLoop);
      this.tradingLoop = null;
    }

    this.status = 'STOPPED';
    this.state.status = 'STOPPED';
    this.state.uptime = Date.now() - (this.startTime || Date.now());

    // Save state
    this.saveState();

    logger.info('Trading bot stopped');
  }

  /**
   * Pause the trading bot
   */
  pause(): void {
    if (this.status === 'RUNNING') {
      this.status = 'PAUSED';
      this.state.status = 'PAUSED';
      logger.info('Trading bot paused');
    }
  }

  /**
   * Resume the trading bot
   */
  resume(): void {
    if (this.status === 'PAUSED') {
      this.status = 'RUNNING';
      this.state.status = 'RUNNING';
      logger.info('Trading bot resumed');
    }
  }

  /**
   * Execute one trading cycle
   */
  private async executeTradingCycle(): Promise<void> {
    if (this.status !== 'RUNNING' || !this.activeStrategy || !this.strategyConfig) {
      return;
    }

    try {
      // Check trading hours
      if (!tradingHours.isWithinTradingHours(this.strategyConfig.tradingHours)) {
        logger.debug('Outside trading hours, skipping cycle');
        return;
      }

      // Check portfolio risk
      const riskCheck = riskManager.checkPortfolioRisk(this.state, this.strategyConfig.riskManagement);
      if (!riskCheck.allowed) {
        logger.warn('Portfolio risk limit reached', { reason: riskCheck.reason });
        this.pause();
        return;
      }

      // Get market data - use symbol from config
      const symbol = this.strategyConfig.symbol || 'BTC/USDT';
      const data = await timeframeManager.getData(symbol, this.strategyConfig.timeframe, 100);

      if (data.length === 0) {
        logger.warn('No market data available');
        return;
      }

      // Generate signal
      const signal = this.activeStrategy.generateSignal(data);

      // Update positions
      await this.updatePositions();

      // Execute signal if valid
      if (signal.side !== 'HOLD' && signal.strength > 50) {
        await this.executeSignal(signal, symbol);
      }

      // Update state
      this.updateState();
    } catch (error) {
      logger.error('Error in trading cycle', error as Error);
    }
  }

  /**
   * Execute a trading signal
   */
  private async executeSignal(signal: Signal, symbol: string): Promise<void> {
    if (!this.strategyConfig || !this.activeStrategy) {
      return;
    }

    try {
      // Extract base currency from symbol (e.g., "BTC/USDT" -> "BTC")
      const baseCurrency = symbol.split('/')[0];

      // Check if position already exists for this currency (one position per currency limit)
      const existingPosition = this.state.positions.find(
        p => p.symbol.split('/')[0] === baseCurrency
      );
      if (existingPosition) {
        logger.info('Position already exists for currency, skipping', { currency: baseCurrency, symbol });
        return;
      }

      // Check if we can open a new position
      if (!riskManager.canOpenPosition(this.state.positions, this.strategyConfig.riskManagement)) {
        return;
      }

      // Check currency-specific limits
      const tradingMode = localStorage.getItem('trading-mode');
      if (tradingMode === 'paper') {
        const { paperTradingExecutor } = await import('./execution/PaperTradingExecutor');
        if (paperTradingExecutor.hasPositionForCurrency(baseCurrency)) {
          logger.info('Paper trading: Position already exists for currency', { currency: baseCurrency });
          return;
        }
      }

      // Calculate position size
      const wallet = walletService.getCurrentWallet();
      let balance = 0;

      if (tradingMode === 'paper') {
        const { paperTradingExecutor } = await import('./execution/PaperTradingExecutor');
        const quoteCurrency = symbol.split('/')[1] || 'USDT';
        const available = await paperTradingExecutor.getAvailableForTrading(quoteCurrency);
        balance = available;
      } else {
      if (!wallet) {
        return;
        }
        balance = parseFloat(wallet.balance);
      }

      const positionSizeResult = riskManager.calculatePositionSize(
        balance,
        signal.entryPrice || 0,
        this.strategyConfig.riskManagement
      );

      // Get current price
      const priceResult = await priceService.getPrice(symbol);
      if (!priceResult.success || !priceResult.data) {
        return;
      }

      const currentPrice = priceResult.data.price;

      // Create order and execute based on trading mode
      const order = orderManager.createOrder(
        'MARKET',
        signal.side as OrderSide,
        symbol,
        positionSizeResult.size.toString()
      );

      let orderExecuted = false;

      if (tradingMode === 'paper') {
        // Execute using paper trading executor
        const { paperTradingExecutor } = await import('./execution/PaperTradingExecutor');
        if (signal.side === 'BUY') {
          orderExecuted = await paperTradingExecutor.executeBuy(order, symbol);
        } else if (signal.side === 'SELL') {
          orderExecuted = await paperTradingExecutor.executeSell(order, symbol);
        }

        if (orderExecuted) {
          // Get position from paper trading executor
          const paperPositions = paperTradingExecutor.getPositions();
          const newPosition = paperPositions.find(p => p.symbol === symbol);
          if (newPosition) {
            newPosition.strategy = this.strategyConfig.id;
            newPosition.stopLoss = signal.stopLoss;
            newPosition.takeProfit = signal.takeProfit;
            this.state.positions.push(newPosition);
            await tradeRepository.savePosition(newPosition);
          }
        }
      } else {
        // Live trading: use DEX or CEX executor
        // For now, create position directly (executor integration can be added later)
        const position: Position = {
          id: `pos-${Date.now()}`,
          symbol,
          side: signal.side as OrderSide,
          entryPrice: currentPrice,
          currentPrice: currentPrice,
          amount: positionSizeResult.size,
          value: positionSizeResult.size * currentPrice,
          unrealizedPnL: 0,
          unrealizedPnLPercent: 0,
          realizedPnL: 0,
          openedAt: Date.now(),
          strategy: this.strategyConfig.id,
          stopLoss: signal.stopLoss,
          takeProfit: signal.takeProfit,
        };

        this.state.positions.push(position);
        await tradeRepository.savePosition(position);
        await orderManager.updateOrderStatus(order.id, 'FILLED', order.amount, currentPrice.toString());
        orderExecuted = true;
      }

      if (orderExecuted) {
        logger.info('Position opened', { symbol, side: signal.side, reason: signal.reason });
      } else {
        logger.warn('Failed to execute order', { orderId: order.id, symbol });
      }
    } catch (error) {
      logger.error('Failed to execute signal', error as Error);
    }
  }

  /**
   * Update all open positions
   */
  private async updatePositions(): Promise<void> {
    if (!this.strategyConfig) {
      return;
    }

    const tradingMode = localStorage.getItem('trading-mode');
    
    // Sync with paper trading executor positions if in paper trading mode
    if (tradingMode === 'paper') {
      const { paperTradingExecutor } = await import('./execution/PaperTradingExecutor');
      await paperTradingExecutor.updatePositions();
      
      // Sync paper trading positions with bot state
      const paperPositions = paperTradingExecutor.getPositions();
      this.state.positions = paperPositions.filter(p => p.strategy === this.strategyConfig?.id);
    }

    for (const position of this.state.positions) {
      try {
        // Get current price
        const priceResult = await priceService.getPrice(position.symbol);
        if (!priceResult.success || !priceResult.data) {
          continue;
        }

        const currentPrice = priceResult.data.price;
        position.currentPrice = currentPrice;

        // Calculate unrealized P&L
        if (position.side === 'BUY') {
          position.unrealizedPnL = (currentPrice - position.entryPrice) * position.amount;
        } else {
          position.unrealizedPnL = (position.entryPrice - currentPrice) * position.amount;
        }
        position.unrealizedPnLPercent = (position.unrealizedPnL / (position.entryPrice * position.amount)) * 100;
        position.value = position.amount * currentPrice;

        // Check stop-loss and take-profit
        if (riskManager.shouldTriggerStopLoss(position, currentPrice, this.strategyConfig.riskManagement)) {
          await this.closePosition(position, 'STOP_LOSS');
        } else if (riskManager.shouldTriggerTakeProfit(position, currentPrice, this.strategyConfig.riskManagement)) {
          await this.closePosition(position, 'TAKE_PROFIT');
        } else {
          // Update position in repository
          await tradeRepository.updatePosition(position.id, position);
        }
      } catch (error) {
        logger.error('Failed to update position', error as Error, { positionId: position.id });
      }
    }
  }

  /**
   * Close a position
   */
  private async closePosition(position: Position, reason: string): Promise<void> {
    try {
      const tradingMode = localStorage.getItem('trading-mode');
      
      // In paper trading mode, use paper trading executor to close position
      if (tradingMode === 'paper') {
        const { paperTradingExecutor } = await import('./execution/PaperTradingExecutor');
        
        // Create sell order to close position
        const order = orderManager.createOrder(
          'MARKET',
          'SELL',
          position.symbol,
          position.amount.toString()
        );
        
        const closed = await paperTradingExecutor.executeSell(order, position.symbol);
        if (closed) {
          // Position is already closed and trade saved by paper trading executor
          this.state.positions = this.state.positions.filter(p => p.id !== position.id);
          
          // Update statistics
          const allTrades = await tradeRepository.getAllTrades();
          const winningTrades = allTrades.filter(t => t.pnl > 0).length;
          this.state.winRate = allTrades.length > 0 ? (winningTrades / allTrades.length) * 100 : 0;
          this.state.totalTrades = allTrades.length;
          this.state.realizedPnL = allTrades.reduce((sum, t) => sum + t.pnl, 0);
          
          logger.info('Paper trading position closed', { positionId: position.id, reason });
        }
        return;
      }

      // Live trading: close position directly
      const trade: Trade = {
        id: `trade-${Date.now()}`,
        symbol: position.symbol,
        side: position.side,
        entryPrice: position.entryPrice,
        exitPrice: position.currentPrice,
        amount: position.amount,
        pnl: position.unrealizedPnL,
        pnlPercent: position.unrealizedPnLPercent,
        fees: 0, // Calculate actual fees
        strategy: position.strategy || '',
        timeframe: this.strategyConfig?.timeframe || '1h',
        openedAt: position.openedAt,
        closedAt: Date.now(),
        duration: Date.now() - position.openedAt,
      };

      // Update realized P&L
      this.state.realizedPnL += trade.pnl;
      this.state.totalTrades++;

      // Calculate win rate
      const allTrades = await tradeRepository.getAllTrades();
      const winningTrades = allTrades.filter(t => t.pnl > 0).length;
      this.state.winRate = allTrades.length > 0 ? (winningTrades / allTrades.length) * 100 : 0;

      // Save trade
      await tradeRepository.saveTrade(trade);

      // Remove position
      this.state.positions = this.state.positions.filter(p => p.id !== position.id);
      await tradeRepository.deletePosition(position.id);

      logger.info('Position closed', { trade, reason });
    } catch (error) {
      logger.error('Failed to close position', error as Error);
    }
  }

  /**
   * Update bot state
   */
  private updateState(): void {
    // Calculate total unrealized P&L
    this.state.unrealizedPnL = this.state.positions.reduce(
      (sum, pos) => sum + pos.unrealizedPnL,
      0
    );

    // Calculate total P&L
    this.state.totalPnL = this.state.realizedPnL + this.state.unrealizedPnL;

    // Update uptime
    if (this.startTime) {
      this.state.uptime = Date.now() - this.startTime;
    }
  }

  /**
   * Create strategy instance
   */
  private createStrategy(config: StrategyConfig): BaseStrategy {
    switch (config.type) {
      case 'MEAN_REVERSION':
        return new MeanReversionStrategy(config);
      case 'MOMENTUM':
        return new MomentumStrategy(config);
      default:
        throw new Error(`Unknown strategy type: ${config.type}`);
    }
  }

  /**
   * Get current bot state
   */
  getState(): BotState {
    this.updateState();
    return { ...this.state };
  }

  /**
   * Get bot status
   */
  getStatus(): BotStatus {
    return this.status;
  }

  /**
   * Load bot state from storage
   */
  private async loadState(): Promise<void> {
    // Load positions
    const positions = await tradeRepository.getAllPositions();
    this.state.positions = positions;

    // Load orders
    const orders = await tradeRepository.getAllOrders();
    this.state.orders = orders;

    // Load trades for statistics
    const trades = await tradeRepository.getAllTrades();
    this.state.totalTrades = trades.length;
    this.state.realizedPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    this.state.winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
  }

  /**
   * Save bot state to storage
   */
  private async saveState(): Promise<void> {
    // State is saved automatically when positions/orders are updated
    // This method can be used for additional state persistence if needed
  }
}

export const tradingBot = new TradingBot();

