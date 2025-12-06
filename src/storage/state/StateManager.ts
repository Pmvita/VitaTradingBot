// State management and persistence

import { BotState } from '../../types';
import { database } from '../Database';
import { STORAGE_KEYS } from '../../constants';
import { logger } from '../../utils/logger';

class StateManager {
  /**
   * Save bot state
   */
  async saveBotState(state: BotState): Promise<void> {
    try {
      await database.insert('bot_state', {
        id: 'current',
        ...state,
        savedAt: Date.now(),
      });
      logger.debug('Bot state saved');
    } catch (error) {
      logger.error('Failed to save bot state', error as Error);
      // Update if exists
      await database.update('bot_state', 'current', {
        ...state,
        savedAt: Date.now(),
      });
    }
  }

  /**
   * Load bot state
   */
  async loadBotState(): Promise<BotState | null> {
    try {
      const record = await database.getById('bot_state', 'current');
      if (record) {
        // Remove metadata fields
        const { id, savedAt, ...state } = record;
        return state as BotState;
      }
      return null;
    } catch (error) {
      logger.error('Failed to load bot state', error as Error);
      return null;
    }
  }

  /**
   * Clear bot state
   */
  async clearBotState(): Promise<void> {
    try {
      await database.delete('bot_state', 'current');
    } catch (error) {
      logger.error('Failed to clear bot state', error as Error);
    }
  }
}

export const stateManager = new StateManager();

