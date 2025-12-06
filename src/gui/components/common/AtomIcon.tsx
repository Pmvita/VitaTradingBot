// Animated atom icon component - pure CSS/SVG with smooth animations

import React from 'react';
import './AtomIcon.css';

export const AtomIcon: React.FC = () => {
  return (
    <div className="atom-icon">
      <div className="atom-container">
        {/* Nucleus */}
        <div className="nucleus"></div>

        {/* Electron orbits using CSS transforms for smooth animation */}
        <div className="orbit orbit-1">
          <div className="orbit-ring"></div>
          <div className="electron electron-1"></div>
        </div>

        <div className="orbit orbit-2">
          <div className="orbit-ring"></div>
          <div className="electron electron-2"></div>
        </div>

        <div className="orbit orbit-3">
          <div className="orbit-ring"></div>
          <div className="electron electron-3"></div>
        </div>
      </div>
    </div>
  );
};

