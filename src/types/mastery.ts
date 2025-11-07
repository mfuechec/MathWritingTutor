/**
 * Mastery Tracking Types
 * Tracks student performance and determines when to advance difficulty
 */

export interface ProblemAttempt {
  problemId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  solved: boolean;
  timeSpent: number; // milliseconds
  hintsUsed: number;
  incorrectAttempts: number;
  timestamp: Date;
}

export interface MasteryLevel {
  easy: number; // 0-1 (percentage mastery)
  medium: number;
  hard: number;
}

export interface MasteryState {
  recentAttempts: ProblemAttempt[];
  masteryLevels: MasteryLevel;
  consecutiveSolved: number;
  shouldAdvance: boolean;
  recommendedDifficulty: 'easy' | 'medium' | 'hard';
}

export interface MasteryThresholds {
  advanceThreshold: number; // e.g., 0.8 = 80% mastery to advance
  consecutiveSolvedToAdvance: number; // e.g., 3 problems in a row
  maxAttemptsWindow: number; // Consider last N attempts
}
