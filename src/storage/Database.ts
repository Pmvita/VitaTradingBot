// Database interface for SQLite storage

import { logger } from '../utils/logger';

// Simple in-memory database for now
// In production, this would use SQLite or PostgreSQL

interface DatabaseRecord {
  id: string;
  [key: string]: any;
}

class Database {
  private tables: Map<string, Map<string, DatabaseRecord>> = new Map();

  /**
   * Initialize database
   */
  async initialize(): Promise<void> {
    // Create tables
    this.tables.set('trades', new Map());
    this.tables.set('positions', new Map());
    this.tables.set('orders', new Map());
    this.tables.set('strategies', new Map());
    this.tables.set('settings', new Map());
    this.tables.set('bot_state', new Map());

    logger.info('Database initialized');
  }

  /**
   * Insert a record
   */
  async insert(table: string, record: DatabaseRecord): Promise<void> {
    if (!this.tables.has(table)) {
      this.tables.set(table, new Map());
    }

    const tableData = this.tables.get(table)!;
    tableData.set(record.id, record);
  }

  /**
   * Get a record by ID
   */
  async getById(table: string, id: string): Promise<DatabaseRecord | null> {
    const tableData = this.tables.get(table);
    if (!tableData) {
      return null;
    }
    return tableData.get(id) || null;
  }

  /**
   * Get all records from a table
   */
  async getAll(table: string): Promise<DatabaseRecord[]> {
    const tableData = this.tables.get(table);
    if (!tableData) {
      return [];
    }
    return Array.from(tableData.values());
  }

  /**
   * Update a record
   */
  async update(table: string, id: string, updates: Partial<DatabaseRecord>): Promise<void> {
    const tableData = this.tables.get(table);
    if (!tableData) {
      return;
    }

    const record = tableData.get(id);
    if (record) {
      tableData.set(id, { ...record, ...updates });
    }
  }

  /**
   * Delete a record
   */
  async delete(table: string, id: string): Promise<void> {
    const tableData = this.tables.get(table);
    if (!tableData) {
      return;
    }
    tableData.delete(id);
  }

  /**
   * Query records with a filter function
   */
  async query(
    table: string,
    filter: (record: DatabaseRecord) => boolean
  ): Promise<DatabaseRecord[]> {
    const tableData = this.tables.get(table);
    if (!tableData) {
      return [];
    }
    return Array.from(tableData.values()).filter(filter);
  }

  /**
   * Clear a table
   */
  async clear(table: string): Promise<void> {
    const tableData = this.tables.get(table);
    if (tableData) {
      tableData.clear();
    }
  }
}

export const database = new Database();

