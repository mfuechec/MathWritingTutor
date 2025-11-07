/**
 * Problem Generator Service
 * Uses GPT-4o to generate fresh math problems on demand
 */

import OpenAI from 'openai';
import { OPENAI_API_KEY } from '@env';
import type { Problem, ProblemType, AnswerFormat } from '../types';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type ContextType = 'abstract' | 'applied' | 'real-world';

export class ProblemGeneratorService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    if (!OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API key not configured. Add OPENAI_API_KEY to .env');
    }
  }

  /**
   * Generate a new problem based on difficulty, type, and context
   */
  async generateProblem(
    difficulty: DifficultyLevel,
    problemType: ProblemType = 'linear_equation',
    contextType: ContextType = 'abstract',
    referenceProblem?: Problem
  ): Promise<Problem> {
    try {
      const prompt = this.buildGenerationPrompt(difficulty, problemType, contextType, referenceProblem);

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.95, // Higher temperature for more variety
        max_tokens: 700,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from GPT-4o');
      }

      const parsed = JSON.parse(content);
      const problem = this.parseProblemResponse(parsed, difficulty, problemType, contextType);

      // Log generated problem details
      console.log('📝 PROBLEM GENERATED');
      console.log('Type:', problem.problemType);
      console.log('Difficulty:', problem.difficulty);
      console.log('Content:', problem.content);
      console.log('Introduction:', problem.introductionText);
      console.log('Expected Steps:', problem.expectedSteps);
      console.log('Solution Steps:', problem.expectedSolutionSteps);
      console.log('Answer Format:', problem.answerFormat);

      return problem;
    } catch (error) {
      console.error('Problem generation error:', error);
      // Fallback to a default problem
      return this.getFallbackProblem(difficulty);
    }
  }

  /**
   * System prompt for problem generation
   */
  private getSystemPrompt(): string {
    return `You are a K-12 math problem generator. Create engaging, age-appropriate algebra problems for students.

RESPONSE FORMAT (JSON only):
{
  "equation": "string - PLAIN TEXT ONLY, NO LATEX (e.g., '2x + 3 = 7', '(2x - 3)/(x + 4) = 5/(x - 3)', or 'x + y = 5\\nx - y = 1' for systems)",
  "problem_type": "string (linear_equation, system_of_equations, inequality, quadratic_equation, rational_expression)",
  "variable": "string or array (e.g., 'x' or ['x', 'y'] for systems)",
  "solution": "string (the answer - can be integer, decimal, fraction, ordered pair, etc.)",
  "answer_format": "string (integer, decimal, simple_fraction, complex_fraction, radical, ordered_pair, interval)",
  "skill_area": "string (e.g., 'One-step equations', 'Systems by substitution')",
  "steps": "number (how many steps to solve)",
  "solution_steps": ["array", "of", "step-by-step", "solution", "strings"],
  "introduction_text": "string (Socratic-style opening question to guide student thinking)"
}

CRITICAL: Use plain text notation ONLY - NO LaTeX formatting!
- Fractions: Use parentheses and forward slash: (2x + 3)/(x - 1)
- NOT LaTeX: Do NOT use \\frac{}{}, \\sqrt{}, or any other LaTeX commands
- Powers: Use caret (^): x^2, x^3
- Square roots: Write as "sqrt(x)" or solve to give decimal/radical form

PROBLEM TYPES:
- linear_equation: ax + b = c (solve for x)
- system_of_equations: Two equations with two unknowns (x, y)
- inequality: ax + b < c (solve and express as inequality)
- quadratic_equation: ax² + bx + c = 0 (solve using factoring or quadratic formula)
- rational_expression: (x+a)/(x+b) = c (solve fractional equations)

DIFFICULTY LEVELS:
- Easy: 1-2 steps, simple numbers, integer answers
- Medium: 2-3 steps, moderate complexity, may have decimal/fraction answers
- Hard: 3-5 steps, complex operations, may have radical/complex fraction answers

CONTEXT TYPES:
- abstract: Pure mathematical notation
- applied: Geometric or numeric contexts ("A rectangle's perimeter...")
- real-world: Story problems with real scenarios ("A train travels...")

INTRODUCTION TEXT (Socratic Method):
Generate an engaging, question-based introduction that:
- Observes the problem structure ("This is a linear equation...", "We have two equations here...")
- Asks a guiding question ("How can we start isolating x?", "What strategy might work?")
- Is conversational and encouraging
- Suitable for text-to-speech (natural phrasing, appropriate pauses)
- 1-2 sentences max

Example introductions:
- "This is a linear equation with one variable, x. How can we start isolating x to find its value?"
- "We have two equations here with two unknowns. Can you think of a way to eliminate one variable?"
- "This inequality needs us to solve for x. How is solving an inequality similar to solving an equation?"

SOLUTION STEPS:
- Provide complete step-by-step solution showing all transformations
- Write steps as students would write them (show operations on both sides)
- For systems, show substitution or elimination method clearly`;
  }

  /**
   * Build the generation prompt
   */
  private buildGenerationPrompt(
    difficulty: DifficultyLevel,
    problemType: ProblemType,
    contextType: ContextType,
    referenceProblem?: Problem
  ): string {
    if (referenceProblem) {
      return `Generate a ${difficulty} difficulty ${problemType} problem similar to: "${referenceProblem.content}"

Requirements:
- Same skill area: ${referenceProblem.skillArea}
- ${difficulty === 'easy' ? 'Simpler' : difficulty === 'hard' ? 'More complex' : 'Similar complexity'}
- Different numbers and structure
- Context: ${contextType}
- Should take ${this.getExpectedSteps(difficulty)} steps to solve
- Include engaging Socratic introduction text

Return JSON only.`;
    }

    const problemTypeDescriptions = this.getProblemTypeDescription(problemType);
    const contextDescription = this.getContextDescription(contextType);
    const problemTypeName = String(problemType).replace(/_/g, ' ');

    return `Generate a ${difficulty} difficulty ${problemTypeName}.

Problem Type: ${problemTypeDescriptions}
Context Style: ${contextDescription}

Requirements:
- Difficulty: ${difficulty === 'easy' ? '1-2 steps, simple numbers, integer answers' :
              difficulty === 'medium' ? '2-3 steps, moderate complexity, may have decimal/fraction answers' :
              '3-5 steps, complex operations, may have radical/complex fraction answers'}
- Should take ${this.getExpectedSteps(difficulty)} steps to solve
- Appropriate for K-12 students
- Include engaging Socratic introduction text that's suitable for text-to-speech
- Answer format should match the problem type and difficulty

Return JSON only.`;
  }

  /**
   * Get problem type description for prompt
   */
  private getProblemTypeDescription(problemType: ProblemType): string {
    const descriptions = {
      linear_equation: 'Linear equation with one variable (ax + b = c)',
      system_of_equations: 'System of two linear equations with two variables',
      inequality: 'Linear inequality (ax + b < c or ax + b > c)',
      quadratic_equation: 'Quadratic equation (ax² + bx + c = 0)',
      rational_expression: 'Equation with rational expressions/fractions'
    };
    return descriptions[problemType];
  }

  /**
   * Get context description for prompt
   */
  private getContextDescription(contextType: ContextType): string {
    const descriptions = {
      abstract: 'Pure mathematical notation, no story context',
      applied: 'Applied context (geometry, rates, patterns) but not a full story',
      'real-world': 'Real-world story problem with meaningful context'
    };
    return descriptions[contextType];
  }

  /**
   * Get expected steps for difficulty
   */
  private getExpectedSteps(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case 'easy': return 2;
      case 'medium': return 3;
      case 'hard': return 4;
    }
  }

  /**
   * Convert LaTeX to plain text notation (fallback safety)
   */
  private convertLatexToPlainText(latex: string): string {
    let plainText = latex;

    // Convert \frac{numerator}{denominator} to (numerator)/(denominator)
    plainText = plainText.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');

    // Convert \sqrt{x} to sqrt(x)
    plainText = plainText.replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)');

    // Convert x^{2} to x^2 (remove braces)
    plainText = plainText.replace(/\^\\?\{([^}]+)\}/g, '^$1');

    // Remove any remaining backslashes (for simple commands)
    plainText = plainText.replace(/\\([a-zA-Z]+)/g, '$1');

    // Remove extra backslashes
    plainText = plainText.replace(/\\/g, '');

    console.log('🔄 Converted LaTeX to plain text:', { original: latex, converted: plainText });

    return plainText;
  }

  /**
   * Parse GPT-4o response into Problem object
   */
  private parseProblemResponse(
    parsed: any,
    difficulty: DifficultyLevel,
    problemType: ProblemType,
    contextType: ContextType
  ): Problem {
    const problemId = `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Determine goal type based on problem type
    const goalType = this.getGoalType(problemType);

    // Parse variables (can be string or array)
    const variables = Array.isArray(parsed.variable) ? parsed.variable : [parsed.variable || 'x'];

    // Convert LaTeX to plain text if needed (safety fallback)
    let equation = parsed.equation || '';
    if (equation.includes('\\frac') || equation.includes('\\sqrt') || equation.includes('\\')) {
      console.warn('⚠️  LaTeX detected in equation, converting to plain text');
      equation = this.convertLatexToPlainText(equation);
    }

    return {
      id: problemId,
      content: equation,
      contentType: 'text',
      problemType: parsed.problem_type || problemType,
      difficulty,
      skillArea: parsed.skill_area || this.getDefaultSkillArea(problemType),
      answerFormat: parsed.answer_format || this.getDefaultAnswerFormat(difficulty, problemType),
      introductionText: parsed.introduction_text || this.getDefaultIntroduction(problemType),
      contextType,
      expectedSteps: parsed.steps || this.getExpectedSteps(difficulty),
      expectedSolutionSteps: parsed.solution_steps || [],
      goalState: {
        type: goalType,
        variable: variables[0],
        variables: variables.length > 1 ? variables : undefined,
        targetValue: parsed.solution,
      },
    };
  }

  /**
   * Get goal type based on problem type
   */
  private getGoalType(problemType: ProblemType) {
    const goalTypes = {
      linear_equation: 'ISOLATE_VARIABLE',
      system_of_equations: 'SOLVE_SYSTEM',
      inequality: 'SOLVE_INEQUALITY',
      quadratic_equation: 'ISOLATE_VARIABLE',
      rational_expression: 'ISOLATE_VARIABLE'
    };
    return goalTypes[problemType] as any;
  }

  /**
   * Get default skill area for problem type
   */
  private getDefaultSkillArea(problemType: ProblemType): string {
    const skillAreas = {
      linear_equation: 'Linear Equations',
      system_of_equations: 'Systems of Equations',
      inequality: 'Linear Inequalities',
      quadratic_equation: 'Quadratic Equations',
      rational_expression: 'Rational Equations'
    };
    return skillAreas[problemType];
  }

  /**
   * Get default answer format based on difficulty and problem type
   */
  private getDefaultAnswerFormat(difficulty: DifficultyLevel, problemType: ProblemType): AnswerFormat {
    if (problemType === 'system_of_equations') return 'ordered_pair';
    if (problemType === 'inequality') return 'interval';
    if (problemType === 'quadratic_equation' && difficulty === 'hard') return 'radical';

    // For other types, base on difficulty
    if (difficulty === 'easy') return 'integer';
    if (difficulty === 'medium') return Math.random() > 0.5 ? 'decimal' : 'simple_fraction';
    return Math.random() > 0.5 ? 'complex_fraction' : 'radical';
  }

  /**
   * Get default introduction text if GPT doesn't provide one
   */
  private getDefaultIntroduction(problemType: ProblemType): string {
    const introductions = {
      linear_equation: 'This is a linear equation with one variable. How can we start isolating the variable?',
      system_of_equations: 'We have a system of two equations here. What strategy might help us solve for both variables?',
      inequality: 'This is an inequality problem. How is solving an inequality similar to solving an equation?',
      quadratic_equation: 'This is a quadratic equation. What methods do you know for solving quadratics?',
      rational_expression: 'This equation involves fractions. How should we approach equations with rational expressions?'
    };
    return introductions[problemType];
  }

  /**
   * Fallback problem if generation fails
   */
  private getFallbackProblem(difficulty: DifficultyLevel): Problem {
    const fallbacks: Record<DifficultyLevel, Problem> = {
      easy: {
        id: 'fallback-easy',
        content: 'x + 5 = 12',
        contentType: 'text',
        problemType: 'linear_equation',
        difficulty: 'easy',
        skillArea: 'One-step equations',
        answerFormat: 'integer',
        introductionText: 'This is a simple linear equation. How can we isolate x?',
        contextType: 'abstract',
        expectedSteps: 2,
        expectedSolutionSteps: ['x + 5 - 5 = 12 - 5', 'x = 7'],
        goalState: { type: 'ISOLATE_VARIABLE', variable: 'x', targetValue: 7 },
      },
      medium: {
        id: 'fallback-medium',
        content: '3x - 4 = 11',
        contentType: 'text',
        problemType: 'linear_equation',
        difficulty: 'medium',
        skillArea: 'Two-step equations',
        answerFormat: 'integer',
        introductionText: 'This is a two-step equation. What strategy should we use?',
        contextType: 'abstract',
        expectedSteps: 3,
        expectedSolutionSteps: ['3x - 4 + 4 = 11 + 4', '3x = 15', '3x ÷ 3 = 15 ÷ 3', 'x = 5'],
        goalState: { type: 'ISOLATE_VARIABLE', variable: 'x', targetValue: 5 },
      },
      hard: {
        id: 'fallback-hard',
        content: '2(x + 3) = 14',
        contentType: 'text',
        problemType: 'linear_equation',
        difficulty: 'hard',
        skillArea: 'Multi-step equations',
        answerFormat: 'integer',
        introductionText: 'This involves the distributive property. Where should we begin?',
        contextType: 'abstract',
        expectedSteps: 4,
        expectedSolutionSteps: ['2(x + 3) ÷ 2 = 14 ÷ 2', 'x + 3 = 7', 'x + 3 - 3 = 7 - 3', 'x = 4'],
        goalState: { type: 'ISOLATE_VARIABLE', variable: 'x', targetValue: 4 },
      },
    };

    console.log('⚠️  Using fallback problem for difficulty:', difficulty);
    return fallbacks[difficulty];
  }
}

// Singleton instance
export const problemGenerator = new ProblemGeneratorService();
