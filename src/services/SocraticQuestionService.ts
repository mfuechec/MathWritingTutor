/**
 * Socratic Question Service
 * Generates context-appropriate guiding questions to help students think through problems
 */

import OpenAI from 'openai';
import { OPENAI_API_KEY } from '@env';
import type { Problem } from '../types';

export type QuestionType =
  | 'after_correct'      // Celebrate and prompt next thinking
  | 'after_incorrect'    // Guide without giving answer
  | 'on_pause'          // Check-in after inactivity
  | 'strategic_moment';  // Key decision point (before distribution, combining terms, etc.)

export interface SocraticQuestionRequest {
  problem: Problem;
  previousSteps: string[];
  currentStep?: string;
  questionType: QuestionType;
  attemptNumber?: number;
  mistakePattern?: string; // e.g., "distribution_error", "sign_error"
}

export interface SocraticQuestionResponse {
  question: string;
  tone: 'encouraging' | 'questioning' | 'curious';
  expectsAnswer: boolean;
  suggestedAnswers?: string[]; // For multiple choice
}

export class SocraticQuestionService {
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
   * Generate a Socratic question to guide student thinking
   */
  async generateQuestion(request: SocraticQuestionRequest): Promise<SocraticQuestionResponse> {
    const prompt = this.buildQuestionPrompt(request);

    try {
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
        temperature: 0.7, // Higher temp for variety in questions
        max_tokens: 200,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from GPT-4o');
      }

      const parsed = JSON.parse(content);

      console.log('🤔 Generated Socratic question:', parsed.question);
      return {
        question: parsed.question,
        tone: parsed.tone || 'questioning',
        expectsAnswer: parsed.expects_answer || false,
        suggestedAnswers: parsed.suggested_answers,
      };
    } catch (error) {
      console.error('Socratic question generation error:', error);
      // Fallback to pre-written questions
      return this.getFallbackQuestion(request);
    }
  }

  /**
   * System prompt for Socratic questioning
   */
  private getSystemPrompt(): string {
    return `You are a Socratic math tutor. Your role is to ask guiding questions that help students discover answers themselves.

PRINCIPLES:
- Ask ONE question at a time
- Questions should prompt thinking, not give answers
- Use simple, conversational language
- Be encouraging and curious
- Questions will be spoken aloud via text-to-speech

RESPONSE FORMAT (JSON only):
{
  "question": "string - the Socratic question to ask",
  "tone": "encouraging | questioning | curious",
  "expects_answer": boolean - does this question expect a verbal response?,
  "suggested_answers": ["array", "of", "options"] or null - for multiple choice questions only
}

QUESTION TYPES:

After Correct Step:
- "Nice! What's your next move?"
- "Great thinking! Why did that work?"
- "Perfect! How many steps remain?"

After Incorrect Step (DON'T give answer):
- "Hmm, let's think about this. What operation are we trying to undo?"
- "Take another look. Does that equation still balance?"
- "What happens when we multiply both sides by 2?"

On Pause / Check-in:
- "How's it going? Need any help?"
- "Take your time. What are you thinking?"
- "Want to talk through your approach?"

Strategic Moment:
- "Before we continue, what do you notice about the parentheses?"
- "How might we simplify the left side first?"
- "What operation could isolate x here?"

Keep questions SHORT (1-2 sentences max) since they're spoken aloud.`;
  }

  /**
   * Build the question generation prompt
   */
  private buildQuestionPrompt(request: SocraticQuestionRequest): string {
    const { problem, previousSteps, currentStep, questionType, attemptNumber, mistakePattern } = request;

    let context = `Problem: ${problem.content}\n`;
    context += `Goal: Solve for ${problem.goalState.variable || 'x'}\n\n`;

    if (previousSteps.length > 0) {
      context += `Previous steps:\n${previousSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n`;
    }

    if (currentStep) {
      context += `Current step: ${currentStep}\n\n`;
    }

    switch (questionType) {
      case 'after_correct':
        context += `The student just completed a correct step! Ask an encouraging question about their next move or why their approach worked.`;
        break;

      case 'after_incorrect':
        context += `The student made a mistake${mistakePattern ? ` (${mistakePattern})` : ''}${attemptNumber ? `, attempt ${attemptNumber}` : ''}. Ask a guiding question that prompts them to reconsider WITHOUT giving the answer.`;
        break;

      case 'on_pause':
        context += `The student has been inactive for a while. Ask a gentle check-in question to see if they need help.`;
        break;

      case 'strategic_moment':
        context += `This is a key decision point in the problem. Ask a question that prompts strategic thinking about the next step.`;
        break;
    }

    return context;
  }

  /**
   * Get a fallback question if AI generation fails
   */
  private getFallbackQuestion(request: SocraticQuestionRequest): SocraticQuestionResponse {
    const { questionType } = request;

    const fallbacks = {
      after_correct: {
        question: "Nice work! What's your next step?",
        tone: 'encouraging' as const,
        expectsAnswer: true,
      },
      after_incorrect: {
        question: "Let's think about this. What operation are we trying to perform?",
        tone: 'questioning' as const,
        expectsAnswer: true,
      },
      on_pause: {
        question: "How's it going? Need any help with this step?",
        tone: 'curious' as const,
        expectsAnswer: true,
      },
      strategic_moment: {
        question: "What do you notice about this equation? How might we simplify it?",
        tone: 'questioning' as const,
        expectsAnswer: true,
      },
    };

    return fallbacks[questionType];
  }

  /**
   * Detect if current moment is strategic (worth asking a question)
   */
  detectStrategicMoment(problem: Problem, previousSteps: string[], currentStep?: string): boolean {
    const lastStep = currentStep || previousSteps[previousSteps.length - 1] || problem.content;

    // Check for strategic patterns
    const hasParentheses = /\([^)]+\)/.test(lastStep);
    const hasLikeTerms = /\d*x.*[+-].*\d*x/.test(lastStep);
    const hasDistribution = /\d+\([^)]+\)/.test(lastStep);
    const hasComplexFraction = /\\frac.*frac/.test(lastStep);
    const hasBothSidesWithVariable = lastStep.includes('=') && lastStep.split('=').every(side => /[a-z]/i.test(side));

    // Strategic if any of these patterns exist
    return hasParentheses || hasLikeTerms || hasDistribution || hasComplexFraction || hasBothSidesWithVariable;
  }
}

// Singleton instance
export const socraticQuestionService = new SocraticQuestionService();
