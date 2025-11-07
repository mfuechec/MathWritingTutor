/**
 * Solution Path Types
 * Defines structured problem-solving paths with progressive hints
 */

export type HintLevel = 1 | 2 | 3;

export interface Hint {
  level1: string; // Conceptual cue
  level2: string; // Specific suggestion
  level3: string; // Scaffolded step
}

export interface SolutionStep {
  stepNumber: number;
  description: string;
  expectedExpression: string;
  hints: Hint;
  completed: boolean;
}

export interface SolutionApproach {
  name: string; // e.g., "Standard approach", "Alternative method"
  steps: SolutionStep[];
}

export interface SolutionPath {
  problemId: string;
  approaches: SolutionApproach[];
  currentApproachIndex: number;
  currentStepIndex: number;
  totalSteps: number;
}

export interface StepProgression {
  currentStepCompleted: boolean;
  studentStrugglingOnCurrentStep: boolean;
  suggestedAction: 'continue' | 'advance' | 'hint';
  hintLevel?: HintLevel;
}
