/**
 * GPT-4o Vision Validation API
 *
 * All-in-one solution for:
 * 1. Handwriting OCR (vision)
 * 2. Mathematical correctness validation
 * 3. Usefulness assessment (pedagogical value)
 * 4. Graduated hint generation
 *
 * Replaces: Mathpix OCR + WolframAlpha + custom usefulness logic
 */

import OpenAI from 'openai';
import { OPENAI_API_KEY, API_TIMEOUT } from '@env';
import type { ValidationResult, MathExpression, Problem, HintLevel } from '../../types';

export interface StepValidationRequest {
  canvasImageBase64: string; // PNG image of handwritten step
  problem: Problem; // The math problem being solved
  previousSteps: string[]; // Previously completed steps
  currentStepNumber: number;
}

export interface StepValidationResponse {
  // OCR Results
  recognizedExpression: string;
  recognitionConfidence: number; // 0-1

  // Validation Results
  mathematicallyCorrect: boolean;
  useful: boolean; // Does it progress toward solution?
  progressScore: number; // 0-1 (how close to solution)

  // Feedback
  feedbackType: 'correct' | 'correct-not-useful' | 'incorrect';
  feedbackMessage: string;
  nudgeMessage?: string;

  // Hints (if needed)
  suggestedHint?: {
    level: HintLevel;
    text: string;
  };

  // Error handling
  errorType?: string;
  rawResponse?: string; // For debugging
}

export class GPT4oValidationAPI {
  private client: OpenAI;
  private timeout: number;

  constructor() {
    this.client = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
    this.timeout = parseInt(API_TIMEOUT || '10000', 10);

    if (!OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API key not configured. Add OPENAI_API_KEY to .env');
    }
  }

  /**
   * Validate a student's handwritten math step
   * Single API call handles: OCR + Correctness + Usefulness + Hints
   */
  async validateStep(request: StepValidationRequest): Promise<StepValidationResponse> {
    try {
      const prompt = this.buildValidationPrompt(request);

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${request.canvasImageBase64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1, // Low temperature for consistency
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from GPT-4o');
      }

      const parsed = JSON.parse(content);
      return this.parseValidationResponse(parsed, content);
    } catch (error) {
      console.error('GPT-4o validation error:', error);
      return this.buildErrorResponse(error);
    }
  }

  /**
   * System prompt defines the AI's role and response format
   */
  private getSystemPrompt(): string {
    return `You are a K-12 math tutor. Read handwritten math, validate correctness, assess usefulness, and provide encouraging feedback.

RESPONSE FORMAT (JSON only):
{
  "recognized_expression": "string",
  "recognition_confidence": 0-1,
  "mathematically_correct": boolean,
  "useful": boolean,
  "progress_score": 0-1 (1.0 = fully solved),
  "feedback_type": "correct" | "correct-not-useful" | "incorrect",
  "feedback_message": "encouraging message",
  "nudge_message": "string or null",
  "error_type": "conceptual | computational | notation or null",
  "suggested_hint": {"level": 1-3, "text": "string"} or null
}

PRINCIPLES:
- Use growth mindset language ("Keep thinking", "You're on track!")
- Distinguish conceptual vs computational errors
- Accept alternative valid approaches
- For "2x + 3 - 3 = 7 - 3", accept "2x = 4" as correct simplified form

PROGRESS SCORES:
0.5 = eliminated constant, 0.8 = variable isolated, 1.0 = FULLY SOLVED

HINTS:
Level 1: Conceptual cue, Level 2: Specific suggestion, Level 3: Scaffolded step`;
  }

  /**
   * Build the validation prompt with problem context
   */
  private buildValidationPrompt(request: StepValidationRequest): string {
    const { problem, previousSteps, currentStepNumber } = request;

    return `Problem: ${problem.content}
Goal: ${this.describeGoal(problem)}

Previous steps:
${previousSteps.length > 0 ? previousSteps.map((step, i) => `${i + 1}. ${step}`).join('\n') : 'None (this is step 1)'}

Current step #${currentStepNumber} - see image.

CRITICAL: When validating step 1, the student can directly write the result of an operation (e.g., "2x = 4" is correct from "2x + 3 = 7" if they subtracted 3). Don't require them to show intermediate work like "2x + 3 - 3 = 7 - 3".

Tasks:
1. OCR: Read handwriting carefully
2. Validate: Is it mathematically correct and logical given the problem/previous steps?
3. Assess: Does it progress toward the goal?
4. Feedback: Encouraging message
5. Hint: If incorrect, provide level 1-3 hint

Return JSON only.`;
  }

  /**
   * Describe the problem goal in natural language
   */
  private describeGoal(problem: Problem): string {
    const { goalState } = problem;

    switch (goalState.type) {
      case 'ISOLATE_VARIABLE':
        return `Isolate the variable ${goalState.variable || 'x'} to find its value`;
      case 'SIMPLIFY':
        return `Simplify the expression to its simplest form`;
      case 'EVALUATE':
        return `Evaluate the expression to find the numerical result`;
      default:
        return 'Solve the problem completely';
    }
  }

  /**
   * Parse and normalize the GPT-4o response
   */
  private parseValidationResponse(
    parsed: any,
    rawResponse: string
  ): StepValidationResponse {
    return {
      recognizedExpression: parsed.recognized_expression || '',
      recognitionConfidence: parsed.recognition_confidence || 0,
      mathematicallyCorrect: parsed.mathematically_correct || false,
      useful: parsed.useful || false,
      progressScore: parsed.progress_score || 0,
      feedbackType: parsed.feedback_type || 'incorrect',
      feedbackMessage: parsed.feedback_message || 'Unable to validate step',
      nudgeMessage: parsed.nudge_message || undefined,
      errorType: parsed.error_type || undefined,
      suggestedHint: parsed.suggested_hint || undefined,
      rawResponse,
    };
  }

  /**
   * Build error response when API fails
   */
  private buildErrorResponse(error: unknown): StepValidationResponse {
    return {
      recognizedExpression: '',
      recognitionConfidence: 0,
      mathematicallyCorrect: false,
      useful: false,
      progressScore: 0,
      feedbackType: 'incorrect',
      feedbackMessage: 'Unable to validate your step right now. Please try again.',
      errorType: 'API_ERROR',
      rawResponse: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: 'Respond with just the word "OK" if you can read this.',
          },
        ],
        max_tokens: 10,
      });

      return response.choices[0]?.message?.content?.includes('OK') || false;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const gpt4oValidationAPI = new GPT4oValidationAPI();
