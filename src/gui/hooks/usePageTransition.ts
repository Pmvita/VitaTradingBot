// Hook for managing page transitions with atom icon

import { useState, useCallback } from 'react';

export const usePageTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState<string | undefined>();

  const startTransition = useCallback((message?: string) => {
    setTransitionMessage(message);
    setIsTransitioning(true);
  }, []);

  const endTransition = useCallback(() => {
    setIsTransitioning(false);
    setTransitionMessage(undefined);
  }, []);

  const transition = useCallback(
    async (callback: () => void | Promise<void>, message?: string) => {
      startTransition(message);
      const startTime = Date.now();
      try {
        await callback();
      } finally {
        // Ensure minimum visible duration (industry standard: 800-1000ms)
        const elapsed = Date.now() - startTime;
        const minDuration = 800;
        const remaining = Math.max(0, minDuration - elapsed);
        setTimeout(() => {
          endTransition();
        }, remaining);
      }
    },
    [startTransition, endTransition]
  );

  return {
    isTransitioning,
    transitionMessage,
    startTransition,
    endTransition,
    transition,
  };
};

