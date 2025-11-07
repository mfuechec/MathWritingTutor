/**
 * Mastery Service
 * Tracks student performance and determines optimal difficulty progression
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProblemAttempt, MasteryState, MasteryLevel, MasteryThresholds } from '../types/mastery';

const MASTERY_STORAGE_KEY = '@math_tutor_mastery';

const DEFAULT_THRESHOLDS: MasteryThresholds = {
  advanceThreshold: 0.75, // 75% mastery to advance
  consecutiveSolvedToAdvance: 3, // 3 problems in a row
  maxAttemptsWindow: 10, // Consider last 10 attempts
};

export class MasteryService {
  private thresholds: MasteryThresholds;

  constructor(thresholds: Partial<MasteryThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Calculate mastery level for a given difficulty
   */
  calculateMastery(attempts: ProblemAttempt[], difficulty: 'easy' | 'medium' | 'hard'): number {
    const relevantAttempts = attempts
      .filter(a => a.difficulty === difficulty)
      .slice(-this.thresholds.maxAttemptsWindow);

    if (relevantAttempts.length === 0) return 0;

    const solvedCount = relevantAttempts.filter(a => a.solved).length;
    const avgHintsUsed = relevantAttempts.reduce((sum, a) => sum + a.hintsUsed, 0) / relevantAttempts.length;
    const avgIncorrect = relevantAttempts.reduce((sum, a) => sum + a.incorrectAttempts, 0) / relevantAttempts.length;

    // Base score from solve rate
    const solveRate = solvedCount / relevantAttempts.length;

    // Penalties for hints and incorrect attempts
    const hintPenalty = Math.min(avgHintsUsed * 0.1, 0.3); // Max 30% penalty
    const incorrectPenalty = Math.min(avgIncorrect * 0.05, 0.2); // Max 20% penalty

    return Math.max(0, Math.min(1, solveRate - hintPenalty - incorrectPenalty));
  }

  /**
   * Determine if student should advance to next difficulty
   */
  shouldAdvanceDifficulty(attempts: ProblemAttempt[], currentDifficulty: 'easy' | 'medium' | 'hard'): boolean {
    // Can't advance from hard
    if (currentDifficulty === 'hard') return false;

    const mastery = this.calculateMastery(attempts, currentDifficulty);

    // Check mastery threshold
    if (mastery < this.thresholds.advanceThreshold) return false;

    // Check consecutive solved
    const recentAttempts = attempts
      .filter(a => a.difficulty === currentDifficulty)
      .slice(-this.thresholds.consecutiveSolvedToAdvance);

    if (recentAttempts.length < this.thresholds.consecutiveSolvedToAdvance) return false;

    return recentAttempts.every(a => a.solved);
  }

  /**
   * Get recommended difficulty based on performance
   */
  getRecommendedDifficulty(attempts: ProblemAttempt[], currentDifficulty: 'easy' | 'medium' | 'hard'): 'easy' | 'medium' | 'hard' {
    const easyMastery = this.calculateMastery(attempts, 'easy');
    const mediumMastery = this.calculateMastery(attempts, 'medium');
    const hardMastery = this.calculateMastery(attempts, 'hard');

    // If struggling on current difficulty, stay or go down
    const currentMastery = this.calculateMastery(attempts, currentDifficulty);
    if (currentMastery < 0.5) {
      // Struggling - consider going down
      if (currentDifficulty === 'hard' && mediumMastery > 0.6) return 'medium';
      if (currentDifficulty === 'medium' && easyMastery > 0.6) return 'easy';
      return currentDifficulty;
    }

    // Check if ready to advance
    if (this.shouldAdvanceDifficulty(attempts, currentDifficulty)) {
      if (currentDifficulty === 'easy') return 'medium';
      if (currentDifficulty === 'medium') return 'hard';
    }

    return currentDifficulty;
  }

  /**
   * Update mastery state with new attempt
   */
  updateMasteryState(state: MasteryState, newAttempt: ProblemAttempt): MasteryState {
    const recentAttempts = [...state.recentAttempts, newAttempt].slice(-this.thresholds.maxAttemptsWindow * 3);

    const masteryLevels: MasteryLevel = {
      easy: this.calculateMastery(recentAttempts, 'easy'),
      medium: this.calculateMastery(recentAttempts, 'medium'),
      hard: this.calculateMastery(recentAttempts, 'hard'),
    };

    const consecutiveSolved = newAttempt.solved
      ? state.consecutiveSolved + 1
      : 0;

    const recommendedDifficulty = this.getRecommendedDifficulty(
      recentAttempts,
      newAttempt.difficulty
    );

    const shouldAdvance = this.shouldAdvanceDifficulty(
      recentAttempts,
      newAttempt.difficulty
    );

    return {
      recentAttempts,
      masteryLevels,
      consecutiveSolved,
      shouldAdvance,
      recommendedDifficulty,
    };
  }

  /**
   * Load mastery state from storage
   */
  async loadMasteryState(): Promise<MasteryState> {
    try {
      const stored = await AsyncStorage.getItem(MASTERY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        parsed.recentAttempts = parsed.recentAttempts.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        }));
        return parsed;
      }
    } catch (error) {
      console.error('Error loading mastery state:', error);
    }

    // Return default state
    return {
      recentAttempts: [],
      masteryLevels: { easy: 0, medium: 0, hard: 0 },
      consecutiveSolved: 0,
      shouldAdvance: false,
      recommendedDifficulty: 'easy',
    };
  }

  /**
   * Save mastery state to storage
   */
  async saveMasteryState(state: MasteryState): Promise<void> {
    try {
      await AsyncStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving mastery state:', error);
    }
  }

  /**
   * Reset mastery state (for testing or user request)
   */
  async resetMasteryState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(MASTERY_STORAGE_KEY);
    } catch (error) {
      console.error('Error resetting mastery state:', error);
    }
  }
}

// Singleton instance
export const masteryService = new MasteryService();
