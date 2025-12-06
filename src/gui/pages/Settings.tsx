// Settings page with comprehensive configuration options

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Database, Palette, Globe } from 'lucide-react';
import './Settings.css';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'trading' | 'notifications' | 'security' | 'appearance'>('general');
  const [settings, setSettings] = useState({
    // General
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    // Trading
    defaultStrategy: 'MEAN_REVERSION',
    defaultTimeframe: '1h',
    autoStart: false,
    paperTradingEnabled: true,
    // Notifications
    emailNotifications: false,
    tradeAlerts: true,
    priceAlerts: true,
    errorAlerts: true,
    // Security
    twoFactorAuth: false,
    sessionTimeout: 30,
    requirePassword: false,
    // Appearance
    theme: 'dark',
    compactMode: false,
  });

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('app-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...settings, ...parsed });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  const saveSettings = (newSettings: Partial<typeof settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('app-settings', JSON.stringify(updated));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'trading', label: 'Trading', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>Settings</h2>
        <p className="subtitle">Configure your trading bot preferences</p>
      </div>

      <div className="settings-container">
        <div className="settings-sidebar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h3>General Settings</h3>
              <div className="settings-group">
                <div className="setting-item">
                  <label>Language</label>
                  <select
                    value={settings.language}
                    onChange={(e) => saveSettings({ language: e.target.value })}
                    className="setting-input"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                <div className="setting-item">
                  <label>Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => saveSettings({ timezone: e.target.value })}
                    className="setting-input"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>

                <div className="setting-item">
                  <label>Date Format</label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => saveSettings({ dateFormat: e.target.value })}
                    className="setting-input"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="setting-item">
                  <label>Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => saveSettings({ currency: e.target.value })}
                    className="setting-input"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trading' && (
            <div className="settings-section">
              <h3>Trading Settings</h3>
              <div className="settings-group">
                <div className="setting-item">
                  <label>Default Strategy</label>
                  <select
                    value={settings.defaultStrategy}
                    onChange={(e) => saveSettings({ defaultStrategy: e.target.value })}
                    className="setting-input"
                  >
                    <option value="MEAN_REVERSION">Mean Reversion</option>
                    <option value="MOMENTUM">Momentum</option>
                    <option value="GRID_TRADING">Grid Trading</option>
                    <option value="MARKET_MAKING">Market Making</option>
                    <option value="ARBITRAGE">Arbitrage</option>
                  </select>
                </div>

                <div className="setting-item">
                  <label>Default Timeframe</label>
                  <select
                    value={settings.defaultTimeframe}
                    onChange={(e) => saveSettings({ defaultTimeframe: e.target.value })}
                    className="setting-input"
                  >
                    <option value="1m">1 Minute</option>
                    <option value="5m">5 Minutes</option>
                    <option value="15m">15 Minutes</option>
                    <option value="30m">30 Minutes</option>
                    <option value="1h">1 Hour</option>
                    <option value="4h">4 Hours</option>
                    <option value="1d">1 Day</option>
                  </select>
                </div>

                <div className="setting-item checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.autoStart}
                      onChange={(e) => saveSettings({ autoStart: e.target.checked })}
                    />
                    <span>Auto-start bot on launch</span>
                  </label>
                </div>

                <div className="setting-item checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.paperTradingEnabled}
                      onChange={(e) => saveSettings({ paperTradingEnabled: e.target.checked })}
                    />
                    <span>Enable paper trading mode</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h3>Notification Settings</h3>
              <div className="settings-group">
                <div className="setting-item checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => saveSettings({ emailNotifications: e.target.checked })}
                    />
                    <span>Email notifications</span>
                  </label>
                </div>

                <div className="setting-item checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.tradeAlerts}
                      onChange={(e) => saveSettings({ tradeAlerts: e.target.checked })}
                    />
                    <span>Trade alerts</span>
                  </label>
                </div>

                <div className="setting-item checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.priceAlerts}
                      onChange={(e) => saveSettings({ priceAlerts: e.target.checked })}
                    />
                    <span>Price alerts</span>
                  </label>
                </div>

                <div className="setting-item checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.errorAlerts}
                      onChange={(e) => saveSettings({ errorAlerts: e.target.checked })}
                    />
                    <span>Error alerts</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h3>Security Settings</h3>
              <div className="settings-group">
                <div className="setting-item checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.twoFactorAuth}
                      onChange={(e) => saveSettings({ twoFactorAuth: e.target.checked })}
                    />
                    <span>Enable two-factor authentication</span>
                  </label>
                </div>

                <div className="setting-item">
                  <label>Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => saveSettings({ sessionTimeout: parseInt(e.target.value) || 30 })}
                    className="setting-input"
                    min="5"
                    max="1440"
                  />
                </div>

                <div className="setting-item checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.requirePassword}
                      onChange={(e) => saveSettings({ requirePassword: e.target.checked })}
                    />
                    <span>Require password for sensitive actions</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h3>Appearance Settings</h3>
              <div className="settings-group">
                <div className="setting-item">
                  <label>Theme</label>
                  <select
                    value={settings.theme}
                    onChange={(e) => saveSettings({ theme: e.target.value })}
                    className="setting-input"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>

                <div className="setting-item checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.compactMode}
                      onChange={(e) => saveSettings({ compactMode: e.target.checked })}
                    />
                    <span>Compact mode</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
