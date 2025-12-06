// Configuration repository for storing user settings

import { StrategyConfig } from '../types';
import { database } from './Database';
import { logger } from '../utils/logger';

class ConfigRepository {
  /**
   * Save strategy configuration
   */
  async saveStrategy(config: StrategyConfig): Promise<void> {
    try {
      await database.insert('strategies', {
        id: config.id,
        ...config,
      });
      logger.debug('Strategy saved', { strategyId: config.id });
    } catch (error) {
      logger.error('Failed to save strategy', error as Error);
      throw error;
    }
  }

  /**
   * Get strategy by ID
   */
  async getStrategy(id: string): Promise<StrategyConfig | null> {
    try {
      const record = await database.getById('strategies', id);
      return record as StrategyConfig | null;
    } catch (error) {
      logger.error('Failed to get strategy', error as Error);
      return null;
    }
  }

  /**
   * Get all strategies
   */
  async getAllStrategies(): Promise<StrategyConfig[]> {
    try {
      const records = await database.getAll('strategies');
      return records as StrategyConfig[];
    } catch (error) {
      logger.error('Failed to get strategies', error as Error);
      return [];
    }
  }

  /**
   * Update strategy
   */
  async updateStrategy(id: string, updates: Partial<StrategyConfig>): Promise<void> {
    try {
      await database.update('strategies', id, updates);
    } catch (error) {
      logger.error('Failed to update strategy', error as Error);
      throw error;
    }
  }

  /**
   * Delete strategy
   */
  async deleteStrategy(id: string): Promise<void> {
    try {
      await database.delete('strategies', id);
    } catch (error) {
      logger.error('Failed to delete strategy', error as Error);
      throw error;
    }
  }
}

export const configRepository = new ConfigRepository();

