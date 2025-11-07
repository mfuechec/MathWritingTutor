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

export type ProblemType =
  | 'linear_equation'           // Single variable linear equation: ax + b = c
  | 'system_of_equations'       // Two equations with two variables
  | 'inequality'                // Linear inequality: ax + b < c
  | 'quadratic_equation'        // Quadratic: ax² + bx + c = 0
  | 'rational_expression';      // Equation with fractions: (x+a)/(x+b) = c

export type AnswerFormat =
  | 'integer'                   // Whole numbers: 5, -3, 0
  | 'decimal'                   // Decimal numbers: 3.5, -2.75
  | 'simple_fraction'           // Simple fractions: 1/2, 3/4
  | 'complex_fraction'          // Complex fractions: 5/12, -7/15
  | 'radical'                   // Radicals: √2, 3√5
  | 'ordered_pair'              // For systems: (x, y) = (2, 3)
  | 'interval';                 // For inequalities: x < 5, x ≥ -2

export type GoalType =
  | 'ISOLATE_VARIABLE'          // Solve for a variable
  | 'SIMPLIFY'                  // Simplify expression
  | 'EVALUATE'                  // Calculate numerical result
  | 'SOLVE_SYSTEM'              // Solve system of equations
  | 'SOLVE_INEQUALITY';         // Solve inequality

export interface GoalState {
  type: GoalType;
  variable?: string; // For ISOLATE_VARIABLE
  variables?: string[]; // For SOLVE_SYSTEM (multiple variables)
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
  content: string; // LaTeX or plain text (can be multi-line for systems)
  contentType?: 'latex' | 'text';
  problemType: ProblemType; // Type of math problem
  difficulty: 'easy' | 'medium' | 'hard';
  skillArea: string;
  goalState: GoalState & {
    targetValue?: number; // For generated problems
  };
  answerFormat: AnswerFormat; // Expected format of the answer
  introductionText?: string; // Socratic-style conversational intro
  contextType?: 'abstract' | 'applied' | 'real-world'; // Problem presentation style
  hintLibrary?: HintLibrary;
  imageUrl?: string;
  expectedSteps?: number; // How many steps the problem should take
  expectedSolutionSteps?: string[]; // Model solution path (e.g., ["2x + 3 - 3 = 7 - 3", "2x = 4", "x = 2"])
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
  estimatedStepsRemaining?: number; // How many more steps to reach solution
  validationConfidence?: number; // Confidence in mathematical validation (0-1)
  rawResponse?: string;
}
