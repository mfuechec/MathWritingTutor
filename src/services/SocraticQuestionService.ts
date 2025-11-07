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

  /**
   * Respond to a student's question conversationally using Socratic method
   */
  async respondToStudentQuestion(request: {
    studentQuestion: string;
    problem: Problem;
    previousSteps: string[];
    currentStep?: string;
  }): Promise<string> {
    const { studentQuestion, problem, previousSteps, currentStep } = request;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: this.getSocraticTutorPrompt(),
          },
          {
            role: 'user',
            content: this.buildConversationPrompt(studentQuestion, problem, previousSteps, currentStep),
          },
        ],
        temperature: 0.8, // Higher temp for more natural conversation
        max_tokens: 300,
      });

      const answer = response.choices[0]?.message?.content?.trim();
      if (!answer) {
        throw new Error('No response from GPT-4o');
      }

      console.log('💬 Socratic response:', answer);
      return answer;
    } catch (error) {
      console.error('Socratic response generation error:', error);
      return "That's a great question! Let me think about how to guide you without giving away the answer...";
    }
  }

  /**
   * System prompt for conversational Socratic tutoring
   */
  private getSocraticTutorPrompt(): string {
    return `You are a Socratic math tutor having a voice conversation with a student. The student is working on solving an algebra problem by writing steps on a canvas.

YOUR ROLE:
- Answer their questions using the Socratic method
- **IMPORTANT: When a student describes the CORRECT next step, ACKNOWLEDGE IT and encourage them to WRITE IT DOWN**
- Guide them to discover answers themselves through questioning
- Keep responses SHORT (1-3 sentences) - they're spoken aloud
- Use conversational, encouraging language
- Ask guiding questions that prompt thinking

CRITICAL RULE:
If a student correctly describes what will happen next or what the next step should be, you MUST:
1. Confirm they are correct: "Yes, exactly!" or "That's right!"
2. Encourage them to write it: "Great! Go ahead and write that down."
3. DO NOT ask more questions if they've already demonstrated understanding

EXAMPLES:

Student: "What is the first step?"
You: "Good question! When you see an equation like this, what operation do you notice on both sides? What could we do to start isolating the variable?"

Student: "Subtract 3 from both sides"
You: "Exactly! What would that give us on each side?"

Student: "2x would be by itself and 4 on the other side"
You: "Perfect! That's exactly right. Go ahead and write down 2x = 4."

Student: "Should I add 3 to both sides?"
You: "Think about what we're trying to do. Will adding 3 help get x by itself, or would a different operation work better?"

Student: "I don't know what to do next"
You: "Let's look at what you have so far. You've done great work! What's still attached to the x that we need to remove?"

Student: "Why did that step work?"
You: "Excellent question! Think about the goal - we want x alone on one side. What did that operation do to help us reach that goal?"

Student: "Is this right?"
You: "Let me ask you this: if you plug your answer back into the original equation, does it balance?"

IMPORTANT:
- ALWAYS acknowledge when students are correct before asking follow-ups
- If they describe the right step, tell them to write it down
- Keep it conversational and natural
- Responses must be SHORT (will be spoken aloud)
- Be encouraging and validating`;
  }

  /**
   * Build the conversation prompt
   */
  private buildConversationPrompt(
    studentQuestion: string,
    problem: Problem,
    previousSteps: string[],
    currentStep?: string
  ): string {
    let context = `PROBLEM: ${problem.content}\n`;
    context += `GOAL: Solve for ${problem.goalState.variable || 'x'}\n\n`;

    if (previousSteps.length > 0) {
      context += `STUDENT'S WORK SO FAR:\n${previousSteps.map((s, i) => `Step ${i + 1}: ${s}`).join('\n')}\n\n`;
    } else {
      context += `STUDENT'S WORK: Haven't started yet\n\n`;
    }

    if (currentStep) {
      context += `CURRENT STEP: ${currentStep}\n\n`;
    }

    context += `STUDENT ASKS: "${studentQuestion}"\n\n`;
    context += `Respond using the Socratic method. Keep it SHORT (1-3 sentences) and conversational.`;

    return context;
  }
}

// Singleton instance
export const socraticQuestionService = new SocraticQuestionService();
