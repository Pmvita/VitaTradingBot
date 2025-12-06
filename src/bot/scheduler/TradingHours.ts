// Trading hours enforcement

import { TradingHoursConfig } from '../../types';
import { logger } from '../../utils/logger';

class TradingHours {
  /**
   * Check if current time is within trading hours
   */
  isWithinTradingHours(config: TradingHoursConfig | undefined): boolean {
    if (!config || !config.enabled) {
      return true; // No restrictions
    }

    const now = new Date();
    const timezone = config.timezone || 'UTC';
    
    // Convert to target timezone
    const localTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const dayOfWeek = localTime.getDay();
    const hours = localTime.getHours();
    const minutes = localTime.getMinutes();
    const currentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    // Check day of week
    if (!config.days.includes(dayOfWeek)) {
      logger.debug('Outside trading days', { dayOfWeek, allowedDays: config.days });
      return false;
    }

    // Check time range
    if (currentTime < config.startTime || currentTime > config.endTime) {
      logger.debug('Outside trading hours', { currentTime, start: config.startTime, end: config.endTime });
      return false;
    }

    return true;
  }

  /**
   * Get time until next trading session
   */
  getTimeUntilNextSession(config: TradingHoursConfig | undefined): number | null {
    if (!config || !config.enabled) {
      return null;
    }

    const now = new Date();
    const timezone = config.timezone || 'UTC';
    const localTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    
    // Parse start time
    const [startHours, startMinutes] = config.startTime.split(':').map(Number);
    
    // Create next trading session start time
    const nextSession = new Date(localTime);
    nextSession.setHours(startHours, startMinutes, 0, 0);

    // If we've passed today's start time, move to tomorrow
    if (nextSession <= localTime) {
      nextSession.setDate(nextSession.getDate() + 1);
    }

    // Find next allowed day
    while (!config.days.includes(nextSession.getDay())) {
      nextSession.setDate(nextSession.getDate() + 1);
    }

    return nextSession.getTime() - localTime.getTime();
  }
}

export const tradingHours = new TradingHours();

