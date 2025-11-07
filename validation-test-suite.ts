/**
 * Validation Accuracy Test Suite
 *
 * This file contains test cases for validating that the AI correctly identifies
 * mathematically correct work, including alternative solution approaches.
 *
 * Use this to:
 * 1. Test for false negatives (marking correct work as incorrect)
 * 2. Test for false positives (marking incorrect work as correct)
 * 3. Validate edge cases and alternative approaches
 *
 * Run these tests after making prompt changes to ensure accuracy improvements.
 */

export interface ValidationTestCase {
  name: string;
  problem: string;
  previousSteps: string[];
  studentWork: string;
  expectedCorrect: boolean; // true = should be marked correct, false = should be incorrect
  reason: string;
  category: 'alternative-approach' | 'mental-math-shortcut' | 'equation-flip' | 'standard-step' | 'actual-error';
  priority: 'critical' | 'high' | 'medium' | 'low'; // How important is it to get this right?
}

/**
 * TEST SUITE 1: Alternative Approaches (Common False Negatives)
 * These are the most critical - valid work that might be marked incorrect
 */
export const alternativeApproachTests: ValidationTestCase[] = [
  {
    name: 'Division before distribution',
    problem: '2(x + 3) = 14',
    previousSteps: [],
    studentWork: 'x + 3 = 7',
    expectedCorrect: true,
    reason: 'Dividing both sides by 2 is valid (alternative to distributing first)',
    category: 'alternative-approach',
    priority: 'critical'
  },
  {
    name: 'Distribution before division',
    problem: '2(x + 3) = 14',
    previousSteps: [],
    studentWork: '2x + 6 = 14',
    expectedCorrect: true,
    reason: 'Distribution is the standard approach',
    category: 'standard-step',
    priority: 'critical'
  },
  {
    name: 'Add constant first (instead of combining like terms)',
    problem: '5x + 3x - 4 = 12',
    previousSteps: [],
    studentWork: '5x + 3x = 16',
    expectedCorrect: true,
    reason: 'Adding 4 to both sides before combining like terms is valid',
    category: 'alternative-approach',
    priority: 'high'
  },
  {
    name: 'Combine like terms first (standard)',
    problem: '5x + 3x - 4 = 12',
    previousSteps: [],
    studentWork: '8x - 4 = 12',
    expectedCorrect: true,
    reason: 'Standard approach - combine like terms first',
    category: 'standard-step',
    priority: 'critical'
  },
  {
    name: 'Multiple steps combined (mental math)',
    problem: '5x + 3x - 4 = 12',
    previousSteps: [],
    studentWork: '8x = 16',
    expectedCorrect: true,
    reason: 'Combined like terms AND added 4 to both sides in one step',
    category: 'mental-math-shortcut',
    priority: 'high'
  },
  {
    name: 'Subtract from both sides (moving constant right to left)',
    problem: '2x + 5 = 13',
    previousSteps: [],
    studentWork: '2x = 8',
    expectedCorrect: true,
    reason: 'Standard subtraction approach',
    category: 'standard-step',
    priority: 'critical'
  },
  {
    name: 'Add to both sides (moving constant left to right)',
    problem: '3x = 9 - 2',
    previousSteps: [],
    studentWork: '3x + 2 = 9',
    expectedCorrect: true,
    reason: 'Adding 2 to both sides is algebraically equivalent',
    category: 'alternative-approach',
    priority: 'medium'
  }
];

/**
 * TEST SUITE 2: Equation Manipulation (Valid Rearrangements)
 */
export const equationManipulationTests: ValidationTestCase[] = [
  {
    name: 'Equation flipping (commutativity)',
    problem: '3x = 12',
    previousSteps: [],
    studentWork: '12 = 3x',
    expectedCorrect: true,
    reason: 'Equations can be flipped (commutativity of equality)',
    category: 'equation-flip',
    priority: 'high'
  },
  {
    name: 'Flipping after subtraction',
    problem: '2x + 5 = 13',
    previousSteps: ['2x = 8'],
    studentWork: '8 = 2x',
    expectedCorrect: true,
    reason: 'Flipping the equation is mathematically valid',
    category: 'equation-flip',
    priority: 'medium'
  },
  {
    name: 'Rearranging without simplifying (not useful but correct)',
    problem: 'x = 4',
    previousSteps: [],
    studentWork: '4 = x',
    expectedCorrect: true, // mathematically_correct should be true, useful should be false
    reason: 'Mathematically correct but not useful (should trigger "correct-not-useful")',
    category: 'equation-flip',
    priority: 'low'
  }
];

/**
 * TEST SUITE 3: Mental Math Shortcuts
 */
export const mentalMathTests: ValidationTestCase[] = [
  {
    name: 'Simple division shortcut',
    problem: '6x = 18',
    previousSteps: [],
    studentWork: 'x = 3',
    expectedCorrect: true,
    reason: 'Student did division in their head (6x ÷ 6 = x, 18 ÷ 6 = 3)',
    category: 'mental-math-shortcut',
    priority: 'high'
  },
  {
    name: 'Distribution and combining in one step',
    problem: '2(3x - 5) + 4 = 22',
    previousSteps: [],
    studentWork: '6x - 6 = 22',
    expectedCorrect: true,
    reason: 'Distributed (2×3x=6x, 2×-5=-10) AND combined constants (-10+4=-6) mentally',
    category: 'mental-math-shortcut',
    priority: 'high'
  },
  {
    name: 'Two-step simplification',
    problem: '4x + 2x - 3 = 15',
    previousSteps: [],
    studentWork: '6x = 18',
    expectedCorrect: true,
    reason: 'Combined like terms (4x+2x=6x) AND added 3 to both sides mentally',
    category: 'mental-math-shortcut',
    priority: 'high'
  }
];

/**
 * TEST SUITE 4: Common Errors (Should Be Marked INCORRECT)
 * These ensure we're still catching actual mistakes
 */
export const actualErrorTests: ValidationTestCase[] = [
  {
    name: 'Distribution error (forgot to multiply constant)',
    problem: '2(x + 3) = 14',
    previousSteps: [],
    studentWork: '2x + 3 = 14',
    expectedCorrect: false,
    reason: 'Failed to distribute: should be 2x + 6, not 2x + 3',
    category: 'actual-error',
    priority: 'critical'
  },
  {
    name: 'Sign error when distributing negative',
    problem: '-(x - 3) = 5',
    previousSteps: [],
    studentWork: '-x - 3 = 5',
    expectedCorrect: false,
    reason: 'Sign error: -(x-3) should be -x+3, not -x-3',
    category: 'actual-error',
    priority: 'critical'
  },
  {
    name: 'Division error (forgot to divide)',
    problem: '3x = 12',
    previousSteps: [],
    studentWork: 'x = 12',
    expectedCorrect: false,
    reason: 'Failed to divide: 12÷3=4, not 12',
    category: 'actual-error',
    priority: 'critical'
  },
  {
    name: 'Arithmetic error when combining like terms',
    problem: '5x - 3x = 8',
    previousSteps: [],
    studentWork: '8x = 8',
    expectedCorrect: false,
    reason: 'Arithmetic error: 5x-3x=2x, not 8x',
    category: 'actual-error',
    priority: 'critical'
  },
  {
    name: 'Wrong operation (added instead of subtracting)',
    problem: '2x + 5 = 13',
    previousSteps: [],
    studentWork: '2x + 10 = 13',
    expectedCorrect: false,
    reason: 'Added 5 instead of subtracting it',
    category: 'actual-error',
    priority: 'high'
  },
  {
    name: 'Subtracted from one side only',
    problem: '2x + 5 = 13',
    previousSteps: [],
    studentWork: '2x = 13',
    expectedCorrect: false,
    reason: 'Subtracted 5 from left but not from right (should be 2x = 8)',
    category: 'actual-error',
    priority: 'critical'
  }
];

/**
 * TEST SUITE 5: Multi-step Problems
 */
export const multiStepTests: ValidationTestCase[] = [
  {
    name: 'Second step - standard path',
    problem: '2(x + 3) = 14',
    previousSteps: ['2x + 6 = 14'],
    studentWork: '2x = 8',
    expectedCorrect: true,
    reason: 'Subtracted 6 from both sides',
    category: 'standard-step',
    priority: 'critical'
  },
  {
    name: 'Second step - alternative path',
    problem: '2(x + 3) = 14',
    previousSteps: ['x + 3 = 7'],
    studentWork: 'x = 4',
    expectedCorrect: true,
    reason: 'Subtracted 3 from both sides (following division-first approach)',
    category: 'alternative-approach',
    priority: 'high'
  },
  {
    name: 'Third step - final division',
    problem: '2(x + 3) = 14',
    previousSteps: ['2x + 6 = 14', '2x = 8'],
    studentWork: 'x = 4',
    expectedCorrect: true,
    reason: 'Divided both sides by 2',
    category: 'standard-step',
    priority: 'critical'
  }
];

/**
 * All test cases combined
 */
export const allValidationTests: ValidationTestCase[] = [
  ...alternativeApproachTests,
  ...equationManipulationTests,
  ...mentalMathTests,
  ...actualErrorTests,
  ...multiStepTests
];

/**
 * Test statistics helper
 */
export interface TestResults {
  total: number;
  passed: number;
  failed: number;
  falseNegatives: number; // Marked incorrect but should be correct
  falsePositives: number;  // Marked correct but should be incorrect
  passRate: number;
  falseNegativeRate: number;
  falsePositiveRate: number;
}

/**
 * Helper to categorize test results
 */
export function categorizeTestResult(
  testCase: ValidationTestCase,
  actualCorrect: boolean
): 'pass' | 'fail-false-negative' | 'fail-false-positive' {
  if (actualCorrect === testCase.expectedCorrect) {
    return 'pass';
  }
  if (testCase.expectedCorrect && !actualCorrect) {
    return 'fail-false-negative'; // Should be correct, marked incorrect
  }
  return 'fail-false-positive'; // Should be incorrect, marked correct
}

/**
 * Example usage:
 *
 * import { gpt4oValidationAPI } from './GPT4oValidationAPI';
 * import { allValidationTests, categorizeTestResult } from './validation-test-suite';
 *
 * async function runValidationTests() {
 *   const results: TestResults = {
 *     total: 0,
 *     passed: 0,
 *     failed: 0,
 *     falseNegatives: 0,
 *     falsePositives: 0,
 *     passRate: 0,
 *     falseNegativeRate: 0,
 *     falsePositiveRate: 0
 *   };
 *
 *   for (const testCase of allValidationTests) {
 *     // Note: This would require creating mock canvas images
 *     // For now, you'd manually test these cases
 *     console.log(`Testing: ${testCase.name}`);
 *     console.log(`Expected: ${testCase.expectedCorrect ? 'CORRECT' : 'INCORRECT'}`);
 *     console.log(`Reason: ${testCase.reason}`);
 *     console.log('---');
 *   }
 *
 *   return results;
 * }
 */

/**
 * Priority-based test filtering
 */
export function getCriticalTests(): ValidationTestCase[] {
  return allValidationTests.filter(t => t.priority === 'critical');
}

export function getHighPriorityTests(): ValidationTestCase[] {
  return allValidationTests.filter(t => t.priority === 'critical' || t.priority === 'high');
}

/**
 * Category-based filtering
 */
export function getAlternativeApproachTests(): ValidationTestCase[] {
  return allValidationTests.filter(t => t.category === 'alternative-approach');
}

export function getActualErrorTests(): ValidationTestCase[] {
  return allValidationTests.filter(t => t.category === 'actual-error');
}

console.log('=== Validation Test Suite Loaded ===');
console.log(`Total test cases: ${allValidationTests.length}`);
console.log(`Critical tests: ${getCriticalTests().length}`);
console.log(`High priority tests: ${getHighPriorityTests().length}`);
console.log(`Alternative approach tests: ${alternativeApproachTests.length}`);
console.log(`Actual error tests: ${actualErrorTests.length}`);
console.log('====================================');
