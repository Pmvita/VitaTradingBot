// Sidebar navigation component

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  TrendingUp,
  Briefcase,
  History,
  BarChart3,
  Settings,
  Wallet,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/trading', icon: TrendingUp, label: 'Trading' },
  { path: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { path: '/trades', icon: History, label: 'Trade History' },
  { path: '/backtesting', icon: BarChart3, label: 'Backtesting' },
  { path: '/funds', icon: Wallet, label: 'Fund Management' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

