// Notification center component

import React from 'react';
import { X } from 'lucide-react';
import './NotificationCenter.css';

interface NotificationCenterProps {
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  // Mock notifications for now
  const notifications = [
    {
      id: '1',
      type: 'TRADE',
      title: 'Position Opened',
      message: 'BTC/USDT LONG position opened',
      timestamp: Date.now() - 10000,
      read: false,
    },
    {
      id: '2',
      type: 'ALERT',
      title: 'Stop Loss Hit',
      message: 'ETH/USDT position closed at stop loss',
      timestamp: Date.now() - 30000,
      read: false,
    },
  ];

  return (
    <div className="notification-center">
      <div className="notification-header">
        <h3>Notifications</h3>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <div className="notification-list">
        {notifications.map((notif) => (
          <div key={notif.id} className={`notification-item ${notif.type.toLowerCase()}`}>
            <div className="notification-content">
              <div className="notification-title">{notif.title}</div>
              <div className="notification-message">{notif.message}</div>
              <div className="notification-time">
                {new Date(notif.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

