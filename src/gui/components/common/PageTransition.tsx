// Page transition component using animated atom icon

import React, { useEffect, useState } from 'react';
import { AtomIcon } from './AtomIcon';
import './PageTransition.css';

interface PageTransitionProps {
  children: React.ReactNode;
  isLoading?: boolean;
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  isLoading = false,
  message,
  size = 'medium',
}) => {
  const [showContent, setShowContent] = useState(!isLoading);

  useEffect(() => {
    if (isLoading) {
      setShowContent(false);
    } else {
      // Delay showing content for smooth transition
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className={`page-transition loading size-${size}`}>
        <div className="transition-content">
          <AtomIcon />
          {message && <p className="transition-message">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`page-transition ${showContent ? 'visible' : 'hidden'}`}>
      {children}
    </div>
  );
};

