/**
 * Core Type Definitions for Math Tutor App
 * Based on Architecture Document
 */

// ============================================================================
// Drawing Types
// ============================================================================

export interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  thickness: number;
}

// ============================================================================
// Math Expression Types
// ============================================================================

export interface MathExpression {
  latex: string;
  plainText: string;
  confidence: number;
}

// ============================================================================
// Problem Types
// ============================================================================

export type GoalType = 'ISOLATE_VARIABLE' | 'SIMPLIFY' | 'EVALUATE';

export interface GoalState {
  type: GoalType;
  variable?: string; // For ISOLATE_VARIABLE
  targetForm?: string; // Expected final form
}

export interface HintLibrary {
  [errorType: string]: {
    level1: string; // Concept cue
    level2: string; // Directional hint
    level3: string; // Micro next step
  };
}

export interface Problem {
  id: string;
  content: string; // LaTeX or plain text
  contentType: 'latex' | 'text';
  difficulty: 'easy' | 'medium' | 'hard';
  skillArea: string;
  goalState: GoalState;
  hintLibrary: HintLibrary;
  imageUrl?: string;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  recognized: MathExpression;
  correct: boolean;
  useful: boolean;
  nudgeMessage?: string;
  errorType?: string;
  progressScore: number; // 0-1
}

export interface UsefulnessResult {
  useful: boolean;
  nudgeMessage?: string;
  progressDelta: number; // -1 to +1
}

// ============================================================================
// Hint Types
// ============================================================================

export type HintLevel = 1 | 2 | 3;

export interface Hint {
  id: string;
  stepId: string;
  level: HintLevel;
  text: string;
  displayedAt: number;
}

// ============================================================================
// Attempt and Step Types
// ============================================================================

export interface Step {
  id: string; // UUID
  sequence: number;
  strokes: Stroke[];
  recognizedText?: string;
  correct?: boolean;
  useful?: boolean;
  nudgeMessage?: string;
  errorType?: string;
  hintShown?: string;
  hintLevel?: HintLevel;
  timestamp: number;
}

export interface Attempt {
  id: string; // UUID
  studentId: string;
  problemId: string;
  startedAt: number;
  completedAt?: number;
  steps: Step[];
  completed: boolean;
  hintsUsed: number;
  timeSpent: number;
  synced: boolean;
}

// ============================================================================
// Student Types
// ============================================================================

export interface StudentSettings {
  inkColor: string;
  penThickness: 'thin' | 'medium' | 'thick';
  inactivityTimeout: number; // seconds
  highContrastMode: boolean;
}

export interface Student {
  id: string;
  deviceId: string;
  consentTimestamp?: number;
  createdAt: number;
  settings?: StudentSettings;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface RecognitionAPIResponse {
  expression: string;
  confidence: number;
}

export interface ValidationAPIResponse {
  correct: boolean;
  errorType?: string;
}

// GPT-4o Validation Response (for AppWithValidation.tsx)
export interface StepValidationResponse {
  recognizedExpression: string;
  recognitionConfidence: number;
  mathematicallyCorrect: boolean;
  useful: boolean;
  progressScore: number;
  feedbackType: 'correct' | 'correct-not-useful' | 'incorrect';
  feedbackMessage: string;
  nudgeMessage?: string;
  errorType?: string;
  suggestedHint?: {
    level: HintLevel;
    text: string;
  };
  rawResponse?: string;
}
