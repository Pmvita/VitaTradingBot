// Standalone atom transition component for use between page navigations

import React, { useEffect, useState } from 'react';
import { AtomIcon } from './AtomIcon';
import './AtomTransition.css';

interface AtomTransitionProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
  duration?: number; // Industry standard: 800-1200ms for page transitions
  size?: 'small' | 'medium' | 'large';
}

export const AtomTransition: React.FC<AtomTransitionProps> = ({
  show,
  message,
  onComplete,
  duration = 1000, // Industry standard: 1000ms (1 second) for smooth page transitions
  size = 'medium',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) {
          setTimeout(onComplete, 300); // Wait for fade out
        }
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show, duration, onComplete]);

  if (!show && !isVisible) {
    return null;
  }

  return (
    <div className={`atom-transition ${isVisible ? 'visible' : 'hidden'} size-${size}`}>
      <div className="atom-transition-content">
        <AtomIcon />
        {message && <p className="atom-transition-message">{message}</p>}
      </div>
    </div>
  );
};

