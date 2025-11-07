/**
 * Problem Library - Curated math problems organized by difficulty
 * Sprint 5-6: Multiple Problems Feature
 */

import type { Problem } from '../types';

// Easy Problems (1-2 steps)
export const EASY_PROBLEMS: Problem[] = [
  {
    id: 'easy-1',
    content: '2x + 3 = 7',
    contentType: 'text',
    problemType: 'linear_equation',
    difficulty: 'easy',
    skillArea: 'One-step equations',
    goalState: {
      type: 'ISOLATE_VARIABLE',
      variable: 'x',
      targetForm: 'x = 2',
    },
    answerFormat: 'integer',
    introductionText: 'This is a linear equation with one variable, x. How can we start isolating x to find its value?',
    contextType: 'abstract',
    hintLibrary: {
      subtract_constant: {
        level1: 'What operation helps remove the constant term?',
        level2: 'Try subtracting 3 from both sides',
        level3: '7 - 3 = 4, so you get 2x = 4',
      },
      divide_coefficient: {
        level1: 'How can we isolate x?',
        level2: 'Divide both sides by the coefficient of x',
        level3: '4 ÷ 2 = 2, so x = 2',
      },
    },
  },
  {
    id: 'easy-2',
    content: '5x = 15',
    contentType: 'text',
    problemType: 'linear_equation',
    difficulty: 'easy',
    skillArea: 'One-step equations',
    goalState: {
      type: 'ISOLATE_VARIABLE',
      variable: 'x',
      targetForm: 'x = 3',
    },
    answerFormat: 'integer',
    introductionText: 'We have a simple equation here. What operation do you think will help us find the value of x?',
    contextType: 'abstract',
    hintLibrary: {
      divide_coefficient: {
        level1: 'What operation undoes multiplication?',
        level2: 'Divide both sides by 5',
        level3: '15 ÷ 5 = 3, so x = 3',
      },
    },
  },
  {
    id: 'easy-3',
    content: 'x + 8 = 12',
    contentType: 'text',
    problemType: 'linear_equation',
    difficulty: 'easy',
    skillArea: 'One-step equations',
    goalState: {
      type: 'ISOLATE_VARIABLE',
      variable: 'x',
      targetForm: 'x = 4',
    },
    answerFormat: 'integer',
    introductionText: 'Looking at this equation, x plus 8 equals 12. How might we isolate x on one side?',
    contextType: 'abstract',
    hintLibrary: {
      subtract_constant: {
        level1: 'What operation undoes addition?',
        level2: 'Subtract 8 from both sides',
        level3: '12 - 8 = 4, so x = 4',
      },
    },
  },
  {
    id: 'easy-4',
    content: 'x - 5 = 9',
    contentType: 'text',
    problemType: 'linear_equation',
    difficulty: 'easy',
    skillArea: 'One-step equations',
    goalState: {
      type: 'ISOLATE_VARIABLE',
      variable: 'x',
      targetForm: 'x = 14',
    },
    answerFormat: 'integer',
    introductionText: 'Here we have x minus 5 equals 9. What do you think is the first step to solve for x?',
    contextType: 'abstract',
    hintLibrary: {
      add_constant: {
        level1: 'What operation undoes subtraction?',
        level2: 'Add 5 to both sides',
        level3: '9 + 5 = 14, so x = 14',
      },
    },
  },
];

// Medium Problems (2-3 steps)
export const MEDIUM_PROBLEMS: Problem[] = [
  {
    id: 'medium-1',
    content: '3x + 7 = 22',
    contentType: 'text',
    problemType: 'linear_equation',
    difficulty: 'medium',
    skillArea: 'Two-step equations',
    goalState: {
      type: 'ISOLATE_VARIABLE',
      variable: 'x',
      targetForm: 'x = 5',
    },
    answerFormat: 'integer',
    introductionText: 'This is a two-step equation. Can you see what steps we might need to take to isolate x?',
    contextType: 'abstract',
    hintLibrary: {
      subtract_constant: {
        level1: 'Start by eliminating the constant term',
        level2: 'Subtract 7 from both sides',
        level3: '22 - 7 = 15, so you get 3x = 15',
      },
      divide_coefficient: {
        level1: 'Now isolate x',
        level2: 'Divide both sides by 3',
        level3: '15 ÷ 3 = 5, so x = 5',
      },
    },
  },
  {
    id: 'medium-2',
    content: '4x - 9 = 15',
    contentType: 'text',
    problemType: 'linear_equation',
    difficulty: 'medium',
    skillArea: 'Two-step equations',
    goalState: {
      type: 'ISOLATE_VARIABLE',
      variable: 'x',
      targetForm: 'x = 6',
    },
    answerFormat: 'integer',
    introductionText: 'We have 4x minus 9 equals 15. What strategy would you use to solve this two-step equation?',
    contextType: 'abstract',
    hintLibrary: {
      add_constant: {
        level1: 'First, eliminate the constant',
        level2: 'Add 9 to both sides',
        level3: '15 + 9 = 24, so you get 4x = 24',
      },
      divide_coefficient: {
        level1: 'Now solve for x',
        level2: 'Divide both sides by 4',
        level3: '24 ÷ 4 = 6, so x = 6',
      },
    },
  },
  {
    id: 'medium-3',
    content: '2(x + 3) = 14',
    contentType: 'text',
    problemType: 'linear_equation',
    difficulty: 'medium',
    skillArea: 'Distributive property',
    goalState: {
      type: 'ISOLATE_VARIABLE',
      variable: 'x',
      targetForm: 'x = 4',
    },
    answerFormat: 'integer',
    introductionText: 'This problem involves the distributive property. How should we handle the parentheses?',
    contextType: 'abstract',
    hintLibrary: {
      distribute: {
        level1: 'Start by expanding the parentheses',
        level2: 'Use the distributive property: 2(x + 3) = 2x + 6',
        level3: 'This gives you 2x + 6 = 14',
      },
      solve_two_step: {
        level1: 'Now solve the two-step equation',
        level2: 'Subtract 6, then divide by 2',
        level3: '14 - 6 = 8, then 8 ÷ 2 = 4',
      },
    },
  },
  {
    id: 'medium-4',
    content: '5x + 2 = 3x + 10',
    contentType: 'text',
    problemType: 'linear_equation',
    difficulty: 'medium',
    skillArea: 'Variables on both sides',
    goalState: {
      type: 'ISOLATE_VARIABLE',
      variable: 'x',
      targetForm: 'x = 4',
    },
    answerFormat: 'integer',
    introductionText: 'Notice that x appears on both sides of the equation. How might we gather all the x terms together?',
    contextType: 'abstract',
    hintLibrary: {
      collect_variables: {
        level1: 'Get all x terms on one side',
        level2: 'Subtract 3x from both sides',
        level3: '5x - 3x = 2x on the left, you get 2x + 2 = 10',
      },
      solve_two_step: {
        level1: 'Now finish solving',
        level2: 'Subtract 2, then divide by 2',
        level3: '10 - 2 = 8, then 8 ÷ 2 = 4',
      },
    },
  },
];

// Hard Problems (3+ steps)
export const HARD_PROBLEMS: Problem[] = [
  {
    id: 'hard-1',
    content: '2(3x - 5) + 4 = 22',
    contentType: 'text',
    problemType: 'linear_equation',
    difficulty: 'hard',
    skillArea: 'Multi-step with distribution',
    goalState: {
      type: 'ISOLATE_VARIABLE',
      variable: 'x',
      targetForm: 'x = 14/3',
    },
    answerFormat: 'simple_fraction',
    introductionText: 'This is a multi-step problem with distribution. What do you think should be our first move?',
    contextType: 'abstract',
    hintLibrary: {
      distribute: {
        level1: 'Start by expanding the parentheses',
        level2: 'Distribute 2 across (3x - 5)',
        level3: '2(3x - 5) = 6x - 10, so you get 6x - 10 + 4 = 22',
      },
      combine_like_terms: {
        level1: 'Simplify the left side',
        level2: 'Combine -10 and +4',
        level3: '-10 + 4 = -6, so you get 6x - 6 = 22',
      },
      solve_two_step: {
        level1: 'Now solve the equation',
        level2: 'Add 6, then divide by 6',
        level3: '22 + 6 = 28, then 28 ÷ 6 = 14/3 (or 4⅔)',
      },
    },
  },
  {
    id: 'hard-2',
    content: '4(x + 2) = 2(x + 8)',
    contentType: 'text',
    problemType: 'linear_equation',
    difficulty: 'hard',
    skillArea: 'Distribution on both sides',
    goalState: {
      type: 'ISOLATE_VARIABLE',
      variable: 'x',
      targetForm: 'x = 4',
    },
    answerFormat: 'integer',
    introductionText: 'We have parentheses on both sides here. Can you see a strategy to approach this?',
    contextType: 'abstract',
    hintLibrary: {
      distribute_both: {
        level1: 'Expand both sides using distributive property',
        level2: 'Left: 4x + 8, Right: 2x + 16',
        level3: 'You get 4x + 8 = 2x + 16',
      },
      collect_variables: {
        level1: 'Get all x terms on one side',
        level2: 'Subtract 2x from both sides',
        level3: '4x - 2x = 2x, you get 2x + 8 = 16',
      },
      solve_final: {
        level1: 'Finish solving for x',
        level2: 'Subtract 8, then divide by 2',
        level3: '16 - 8 = 8, then 8 ÷ 2 = 4',
      },
    },
  },
  {
    id: 'hard-3',
    content: '3(2x - 1) - 2(x + 3) = 11',
    contentType: 'text',
    problemType: 'linear_equation',
    difficulty: 'hard',
    skillArea: 'Complex distribution',
    goalState: {
      type: 'ISOLATE_VARIABLE',
      variable: 'x',
      targetForm: 'x = 5',
    },
    answerFormat: 'integer',
    introductionText: 'This is quite a complex equation! We have multiple sets of parentheses to deal with. Where should we begin?',
    contextType: 'abstract',
    hintLibrary: {
      distribute_both: {
        level1: 'Expand both parentheses',
        level2: 'Left: 6x - 3, Right: -2x - 6',
        level3: 'You get 6x - 3 - 2x - 6 = 11',
      },
      combine_like_terms: {
        level1: 'Combine like terms on the left',
        level2: 'Combine 6x and -2x, then -3 and -6',
        level3: '6x - 2x = 4x, and -3 - 6 = -9, so 4x - 9 = 11',
      },
      solve_two_step: {
        level1: 'Now solve for x',
        level2: 'Add 9, then divide by 4',
        level3: '11 + 9 = 20, then 20 ÷ 4 = 5',
      },
    },
  },
];

// NEW: Systems of Equations
export const SYSTEM_PROBLEMS: Problem[] = [
  {
    id: 'system-1',
    content: 'x + y = 5\nx - y = 1',
    contentType: 'text',
    problemType: 'system_of_equations',
    difficulty: 'medium',
    skillArea: 'Systems of equations',
    answerFormat: 'ordered_pair',
    introductionText: 'We have a system of two equations here. Can you think of a way to eliminate one variable?',
    contextType: 'abstract',
    expectedSteps: 3,
    goalState: {
      type: 'SOLVE_SYSTEM',
      variables: ['x', 'y'],
      targetForm: '(3, 2)',
    },
  },
  {
    id: 'system-2',
    content: '2x + y = 7\nx - y = 2',
    contentType: 'text',
    problemType: 'system_of_equations',
    difficulty: 'medium',
    skillArea: 'Systems of equations',
    answerFormat: 'ordered_pair',
    introductionText: 'Looking at these two equations, what strategy might help us solve for both x and y?',
    contextType: 'abstract',
    expectedSteps: 4,
    goalState: {
      type: 'SOLVE_SYSTEM',
      variables: ['x', 'y'],
      targetForm: '(3, 1)',
    },
  },
];

// NEW: Inequalities
export const INEQUALITY_PROBLEMS: Problem[] = [
  {
    id: 'inequality-1',
    content: '3x - 5 < 10',
    contentType: 'text',
    problemType: 'inequality',
    difficulty: 'easy',
    skillArea: 'Linear inequalities',
    answerFormat: 'interval',
    introductionText: 'This is an inequality problem. How is solving an inequality similar to solving an equation?',
    contextType: 'abstract',
    expectedSteps: 2,
    goalState: {
      type: 'SOLVE_INEQUALITY',
      variable: 'x',
      targetForm: 'x < 5',
    },
  },
  {
    id: 'inequality-2',
    content: '2x + 7 ≥ 15',
    contentType: 'text',
    problemType: 'inequality',
    difficulty: 'medium',
    skillArea: 'Linear inequalities',
    answerFormat: 'interval',
    introductionText: 'We need to solve for x and express the answer as an inequality. What should we do first?',
    contextType: 'abstract',
    expectedSteps: 2,
    goalState: {
      type: 'SOLVE_INEQUALITY',
      variable: 'x',
      targetForm: 'x ≥ 4',
    },
  },
];

// NEW: Quadratic Equations
export const QUADRATIC_PROBLEMS: Problem[] = [
  {
    id: 'quadratic-1',
    content: 'x² + 5x + 6 = 0',
    contentType: 'text',
    problemType: 'quadratic_equation',
    difficulty: 'medium',
    skillArea: 'Quadratic equations',
    answerFormat: 'integer',
    introductionText: 'This is a quadratic equation. What methods do you know for solving quadratics?',
    contextType: 'abstract',
    expectedSteps: 3,
    goalState: {
      type: 'ISOLATE_VARIABLE',
      variable: 'x',
      targetForm: 'x = -2 or x = -3',
    },
  },
  {
    id: 'quadratic-2',
    content: 'x² - 4 = 0',
    contentType: 'text',
    problemType: 'quadratic_equation',
    difficulty: 'easy',
    skillArea: 'Quadratic equations',
    answerFormat: 'integer',
    introductionText: 'This quadratic can be solved by factoring as a difference of squares. Can you see the pattern?',
    contextType: 'abstract',
    expectedSteps: 2,
    goalState: {
      type: 'ISOLATE_VARIABLE',
      variable: 'x',
      targetForm: 'x = 2 or x = -2',
    },
  },
];

// NEW: Rational Expressions
export const RATIONAL_PROBLEMS: Problem[] = [
  {
    id: 'rational-1',
    content: '(x + 2) / 3 = 4',
    contentType: 'text',
    problemType: 'rational_expression',
    difficulty: 'easy',
    skillArea: 'Rational equations',
    answerFormat: 'integer',
    introductionText: 'This equation involves a fraction. How should we approach equations with rational expressions?',
    contextType: 'abstract',
    expectedSteps: 2,
    goalState: {
      type: 'ISOLATE_VARIABLE',
      variable: 'x',
      targetForm: 'x = 10',
    },
  },
  {
    id: 'rational-2',
    content: 'x/2 + x/3 = 5',
    contentType: 'text',
    problemType: 'rational_expression',
    difficulty: 'medium',
    skillArea: 'Rational equations',
    answerFormat: 'integer',
    introductionText: 'We have two fractions with different denominators here. What strategy can help us combine them?',
    contextType: 'abstract',
    expectedSteps: 3,
    goalState: {
      type: 'ISOLATE_VARIABLE',
      variable: 'x',
      targetForm: 'x = 6',
    },
  },
];

// Export combined library
export const ALL_PROBLEMS: Problem[] = [
  ...EASY_PROBLEMS,
  ...MEDIUM_PROBLEMS,
  ...HARD_PROBLEMS,
  ...SYSTEM_PROBLEMS,
  ...INEQUALITY_PROBLEMS,
  ...QUADRATIC_PROBLEMS,
  ...RATIONAL_PROBLEMS,
];

// Helper functions
export function getProblemsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Problem[] {
  switch (difficulty) {
    case 'easy':
      return EASY_PROBLEMS;
    case 'medium':
      return MEDIUM_PROBLEMS;
    case 'hard':
      return HARD_PROBLEMS;
    default:
      return EASY_PROBLEMS;
  }
}

export function getRandomProblem(difficulty?: 'easy' | 'medium' | 'hard'): Problem {
  const problems = difficulty ? getProblemsByDifficulty(difficulty) : ALL_PROBLEMS;
  return problems[Math.floor(Math.random() * problems.length)];
}

export function getNextProblem(currentProblemId: string, difficulty?: 'easy' | 'medium' | 'hard'): Problem | null {
  const problems = difficulty ? getProblemsByDifficulty(difficulty) : ALL_PROBLEMS;
  const currentIndex = problems.findIndex(p => p.id === currentProblemId);

  if (currentIndex === -1 || currentIndex === problems.length - 1) {
    return null; // No next problem
  }

  return problems[currentIndex + 1];
}

export function getSimilarProblem(currentProblemId: string): Problem {
  const currentProblem = ALL_PROBLEMS.find(p => p.id === currentProblemId);

  if (!currentProblem) {
    return getRandomProblem();
  }

  // Get problems of same difficulty and skill area
  const similarProblems = ALL_PROBLEMS.filter(
    p => p.difficulty === currentProblem.difficulty &&
         p.skillArea === currentProblem.skillArea &&
         p.id !== currentProblemId
  );

  if (similarProblems.length === 0) {
    // Fallback to same difficulty
    return getRandomProblem(currentProblem.difficulty);
  }

  return similarProblems[Math.floor(Math.random() * similarProblems.length)];
}

export function getHarderProblem(currentProblemId: string): Problem {
  const currentProblem = ALL_PROBLEMS.find(p => p.id === currentProblemId);

  if (!currentProblem) {
    return getRandomProblem('medium');
  }

  // Progression: easy → medium → hard
  let targetDifficulty: 'easy' | 'medium' | 'hard';
  if (currentProblem.difficulty === 'easy') {
    targetDifficulty = 'medium';
  } else if (currentProblem.difficulty === 'medium') {
    targetDifficulty = 'hard';
  } else {
    // Already on hard, return random hard problem
    return getRandomProblem('hard');
  }

  return getRandomProblem(targetDifficulty);
}
