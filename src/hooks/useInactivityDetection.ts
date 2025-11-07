/**
 * Inactivity Detection Hook
 * Tracks student activity and triggers check-ins after periods of inactivity
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface InactivityConfig {
  checkInIntervals: number[]; // e.g., [30000, 60000, 90000] for 30s, 60s, 90s
  onCheckIn: (elapsedSeconds: number, checkInLevel: number) => void;
  enabled?: boolean;
}

export interface InactivityState {
  isInactive: boolean;
  inactiveDuration: number; // milliseconds
  checkInLevel: number; // 0, 1, 2, etc.
  lastActivityTime: number;
}

/**
 * Hook to detect inactivity and trigger escalating check-ins
 */
export function useInactivityDetection(config: InactivityConfig) {
  const { checkInIntervals, onCheckIn, enabled = true } = config;

  const [state, setState] = useState<InactivityState>({
    isInactive: false,
    inactiveDuration: 0,
    checkInLevel: 0,
    lastActivityTime: Date.now(),
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckInLevelRef = useRef<number>(0);
  const lastActivityRef = useRef<number>(Date.now());

  /**
   * Reset the inactivity timer (called on any student interaction)
   */
  const resetInactivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    lastCheckInLevelRef.current = 0;

    setState({
      isInactive: false,
      inactiveDuration: 0,
      checkInLevel: 0,
      lastActivityTime: now,
    });

    console.log('⏰ Inactivity timer reset');
  }, []);

  /**
   * Check inactivity status
   */
  const checkInactivity = useCallback(() => {
    if (!enabled) return;

    const now = Date.now();
    const elapsed = now - lastActivityRef.current;

    // Find which check-in interval we've passed
    let newCheckInLevel = 0;
    for (let i = 0; i < checkInIntervals.length; i++) {
      if (elapsed >= checkInIntervals[i]) {
        newCheckInLevel = i + 1;
      }
    }

    // If we've crossed a new check-in threshold
    if (newCheckInLevel > lastCheckInLevelRef.current) {
      lastCheckInLevelRef.current = newCheckInLevel;
      const elapsedSeconds = Math.floor(elapsed / 1000);

      console.log(`⏰ Inactivity check-in triggered: Level ${newCheckInLevel}, ${elapsedSeconds}s elapsed`);

      setState({
        isInactive: true,
        inactiveDuration: elapsed,
        checkInLevel: newCheckInLevel,
        lastActivityTime: lastActivityRef.current,
      });

      // Trigger callback
      onCheckIn(elapsedSeconds, newCheckInLevel);
    } else if (elapsed > 0) {
      // Update duration without triggering check-in
      setState(prev => ({
        ...prev,
        isInactive: elapsed >= (checkInIntervals[0] || 30000),
        inactiveDuration: elapsed,
      }));
    }
  }, [enabled, checkInIntervals, onCheckIn]);

  /**
   * Start monitoring inactivity
   */
  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Check every 5 seconds
    timerRef.current = setInterval(checkInactivity, 5000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, checkInactivity]);

  return {
    ...state,
    resetInactivity,
  };
}

/**
 * Generate check-in message based on level
 */
export function getCheckInMessage(level: number, elapsedSeconds: number): string {
  const messages = [
    [
      "Still working on that step?",
      "How's it going?",
      "Take your time! Just checking in.",
    ],
    [
      "Would you like a hint?",
      "Need any help with this?",
      "Want me to explain the last step?",
    ],
    [
      "Let me know if you need help!",
      "Should we talk through this together?",
      "I'm here if you need anything!",
    ],
  ];

  const levelMessages = messages[Math.min(level - 1, messages.length - 1)];
  return levelMessages[Math.floor(Math.random() * levelMessages.length)];
}
