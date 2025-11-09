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
import { mathpixOCR } from './MathpixOCR';

export type TutoringPersona = 'encouraging' | 'socratic' | 'direct';

export interface StepValidationRequest {
  canvasImageBase64: string; // PNG image of handwritten step
  problem: Problem; // The math problem being solved
  previousSteps: string[]; // Previously completed steps
  currentStepNumber: number;
  expectedSolutionSteps?: string[]; // Model solution path for hint generation
  personaType?: TutoringPersona; // Tutoring style (default: 'encouraging')
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

  // Step Progression (new)
  stepProgression?: {
    currentStepCompleted: boolean;
    studentStrugglingOnCurrentStep: boolean;
    suggestedAction: 'continue' | 'advance' | 'hint';
    completedStepNumber?: number;
  };

  // Metadata for analytics and debugging
  metadata?: {
    timestamp: Date;
    responseTime: number; // milliseconds
    modelUsed: string;
    tokensUsed?: number;
    cachedTokens?: number; // Tokens retrieved from cache (OpenAI prompt caching)
    cacheHitRate?: number; // Percentage of prompt tokens that were cached (0-100)
    attemptNumber: number; // Which attempt is this for the current step
    sessionId?: string;
  };

  // Error handling
  errorType?: string;
  errorCategory?: 'distribution' | 'sign' | 'arithmetic' | 'conceptual' | 'notation';
  errorDetails?: string; // Specific explanation of what went wrong
  rawResponse?: string; // For debugging

  // Additional validation metrics
  estimatedStepsRemaining?: number;
  validationConfidence?: number; // 0-1
}

export class GPT4oValidationAPI {
  private client: OpenAI;
  private timeout: number;
  private sessionId: string;
  private attemptCounters: Map<number, number>; // Track attempts per step

  constructor() {
    this.client = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
    this.timeout = parseInt(API_TIMEOUT || '10000', 10);
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.attemptCounters = new Map();

    if (!OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API key not configured. Add OPENAI_API_KEY to .env');
    }
  }

  /**
   * Validate a student's handwritten math step
   * UPDATED: Now uses GPT-4o Vision for OCR instead of Mathpix (more reliable for handwriting)
   */
  async validateStep(request: StepValidationRequest): Promise<StepValidationResponse> {
    const startTime = Date.now();

    // Track attempt number for this step
    const attemptNumber = (this.attemptCounters.get(request.currentStepNumber) || 0) + 1;
    this.attemptCounters.set(request.currentStepNumber, attemptNumber);

    try {
      // Use GPT-4o Vision for BOTH OCR and validation in one call
      // This is more reliable than Mathpix for handwritten math
      console.log('🔍 Using GPT-4o Vision for OCR + Validation (bypassing Mathpix)');
      const validationResult = await this.validateStepWithVision(
        request,
        attemptNumber
      );

      const responseTime = Date.now() - startTime;

      // Log combined results
      console.log('=== VALIDATION COMPLETE ===');
      console.log('📝 Recognized:', validationResult.recognizedExpression);
      console.log('🎯 OCR Confidence:', (validationResult.recognitionConfidence * 100).toFixed(1) + '%');
      console.log('✅ Math Correct:', validationResult.mathematicallyCorrect);
      console.log('📊 Progress Score:', (validationResult.progressScore * 100).toFixed(1) + '%');
      console.log('💬 Feedback:', validationResult.feedbackMessage);
      console.log('⏱️  Total Time:', responseTime + 'ms');
      console.log('===========================');

      return {
        ...validationResult,
        metadata: {
          ...validationResult.metadata,
          timestamp: new Date(),
          responseTime,
          attemptNumber,
          sessionId: this.sessionId,
        },
      };
    } catch (error) {
      console.error('Validation pipeline error:', error);
      return this.buildErrorResponse(error);
    }
  }

  /**
   * Request conceptual explanation for a step
   * Used when student asks "why?" or "explain"
   */
  async requestExplanation(request: {
    problem: Problem;
    previousSteps: string[];
    currentStep: string;
    prompt: string;
  }): Promise<string> {
    try {
      const { problem, previousSteps, currentStep, prompt } = request;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a K-12 math tutor explaining mathematical concepts.

GUIDELINES:
- Explain WHY a step works, not just WHAT to do
- Use simple, conversational language (will be read aloud via text-to-speech)
- Focus on conceptual understanding, not procedural steps
- Be encouraging and patient
- Keep explanations under 2 sentences for clarity
- Use growth mindset language

TONE: Patient teacher explaining to a curious student
LENGTH: 1-2 sentences maximum`,
          },
          {
            role: 'user',
            content: `Problem: ${problem.content}
Goal: ${this.describeGoal(problem)}

Previous steps:
${previousSteps.length > 0 ? previousSteps.map((step, i) => `${i + 1}. ${step}`).join('\n') : 'None'}

Current step: ${currentStep}

${prompt}

Respond with ONLY the explanation text (no JSON, no preamble).`,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const explanation = response.choices[0]?.message?.content;
      if (!explanation) {
        throw new Error('No explanation generated');
      }

      console.log('💡 Explanation generated:', explanation);

      return explanation;
    } catch (error) {
      console.error('Explanation generation error:', error);
      throw new Error('Failed to generate explanation');
    }
  }

  /**
   * Validate a handwritten step using GPT-4o Vision
   * This method uses Vision to read the handwriting AND validate in one call
   */
  private async validateStepWithVision(
    request: StepValidationRequest,
    attemptNumber: number
  ): Promise<StepValidationResponse> {
    const prompt = this.buildValidationPrompt(request, '[TO BE RECOGNIZED FROM IMAGE]');
    const personaType = request.personaType || 'encouraging';

    console.log(`🎭 Using persona: ${personaType}`);

    // ⏱️ API TIMING - Network request
    const apiStartTime = Date.now();
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(personaType),
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
                detail: 'auto', // Balanced detail for speed vs accuracy (was 'high')
              },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 500, // Reduced from 800 for faster responses
      response_format: { type: 'json_object' },
    });
    const apiTime = Date.now() - apiStartTime;
    console.log(`⏱️ │  ├─ API Network Request: ${apiTime}ms`);

    // ⏱️ API TIMING - Response parsing
    const parseStartTime = Date.now();
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from GPT-4o Vision');
    }

    const parsed = JSON.parse(content);
    const parseTime = Date.now() - parseStartTime;
    console.log(`⏱️ │  ├─ Response Parsing: ${parseTime}ms`);

    // CACHE PERFORMANCE MONITORING
    const promptTokens = response.usage?.prompt_tokens || 0;
    const cachedTokens = (response.usage as any)?.prompt_tokens_details?.cached_tokens || 0;
    const cacheHitRate = promptTokens > 0 ? (cachedTokens / promptTokens * 100) : 0;

    console.log(`⏱️ │  ├─ Tokens Used: ${response.usage?.total_tokens || 'unknown'} (prompt: ${promptTokens}, completion: ${response.usage?.completion_tokens || 0})`);
    console.log(`⏱️ │  └─ Cache Performance: ${cachedTokens} cached (${cacheHitRate.toFixed(1)}% hit rate)`);

    if (cachedTokens > 0) {
      const cacheSavings = cachedTokens * 0.5; // 50% discount on cached tokens
      const savingsPercent = (cacheSavings / promptTokens * 100).toFixed(1);
      console.log(`💰      Cost savings: ${savingsPercent}% from caching`);
    }

    const metadata = {
      timestamp: new Date(),
      responseTime: 0, // Will be set by caller
      modelUsed: response.model || 'gpt-4o',
      tokensUsed: response.usage?.total_tokens,
      cachedTokens,
      cacheHitRate: parseFloat(cacheHitRate.toFixed(1)),
      attemptNumber,
      sessionId: this.sessionId,
    };

    // GPT-4o Vision returns the transcribed text in the response
    const recognizedExpression = parsed.transcribed_expression || parsed.recognized_text || '';
    const recognitionConfidence = parsed.ocr_confidence || 0.5; // Conservative default (was 0.95)
    const transcriptionNotes = parsed.transcription_notes || '';

    console.log('=== GPT-4o VISION OCR ===');
    console.log('📝 Transcribed:', recognizedExpression);
    console.log('🎯 Confidence:', (recognitionConfidence * 100).toFixed(1) + '%');
    if (transcriptionNotes) {
      console.log('📋 Notes:', transcriptionNotes);
    }
    console.log('========================');

    const validationResult = this.parseValidationResponse(parsed, content, metadata);

    // LOG POTENTIAL FALSE NEGATIVES for debugging
    if (!validationResult.mathematicallyCorrect) {
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn('⚠️ MARKED INCORRECT - Review for potential false negative');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn('📝 Recognized Expression:', recognizedExpression);
      console.warn('📍 Previous Step:', request.previousSteps[request.previousSteps.length - 1] || request.problem.content);
      console.warn('🎯 Validation Confidence:', validationResult.validationConfidence);
      console.warn('❌ Error Type:', validationResult.errorType);
      console.warn('📂 Error Category:', validationResult.errorCategory);
      console.warn('💬 Feedback:', validationResult.feedbackMessage);
      if (transcriptionNotes) {
        console.warn('📋 Transcription Notes:', transcriptionNotes);
      }
      console.warn('🔍 Raw AI Response:', JSON.stringify(parsed, null, 2));
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    return {
      ...validationResult,
      recognizedExpression,
      recognitionConfidence,
    };
  }

  /**
   * Validate a recognized expression using GPT-4o
   * (Legacy method - now mostly unused since we use Vision directly)
   */
  private async validateExpression(
    recognizedExpression: string,
    ocrConfidence: number,
    request: StepValidationRequest,
    attemptNumber: number
  ): Promise<StepValidationResponse> {
    const prompt = this.buildValidationPrompt(request, recognizedExpression);

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
      temperature: 0.1, // Low temperature for consistency
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from GPT-4o');
    }

    const parsed = JSON.parse(content);

    const metadata = {
      timestamp: new Date(),
      responseTime: 0, // Will be set by caller
      modelUsed: response.model || 'gpt-4o',
      tokensUsed: response.usage?.total_tokens,
      cachedTokens: 0, // Legacy method doesn't use caching
      cacheHitRate: 0,
      attemptNumber,
      sessionId: this.sessionId,
    };

    return this.parseValidationResponse(parsed, content, metadata);
  }

  /**
   * Get persona-specific feedback guidelines
   * Different personas for different tutoring styles
   */
  private getPersonaGuidelines(personaType: TutoringPersona): string {
    switch (personaType) {
      case 'encouraging':
        return `
FEEDBACK MESSAGE GUIDELINES (spoken aloud via text-to-speech):
You are a PATIENT, ENCOURAGING math tutor. Feedback will be read aloud.

CORRECT ANSWERS - Be specific about what they did:
✓ "Nice work! You correctly [operation] from both sides."
✓ "Excellent! You [distributed/combined/isolated] perfectly."
✗ DON'T use generic praise like "Great job!" or "Correct!"

INCORRECT ATTEMPTS:
First attempt: Gentle question - "Hmm, let's double-check that step. Does it look right to you?"
Later attempts: Acknowledge effort first - "You're on the right track with [concept], but let's check the [specific issue]."
✗ NEVER say "That's wrong" or "Incorrect" directly

PROGRESS MILESTONES:
~50%: "Great! You're halfway there."
~90%: "Perfect! You've isolated the variable. One more step."
First/last step: Acknowledge momentum

TONE: Patient, warm, specific, conversational
LENGTH: 1-2 sentences maximum`;

      case 'socratic':
        return `
FEEDBACK: Guide through questions, not answers.
CORRECT: "Interesting! What made you [action]?" or "You've [result]. What does that tell us?"
INCORRECT: "What would happen if [alternative]?" or "What operation is being performed on x?"
✗ DON'T give direct answers or say "Correct/Wrong"
TONE: Curious, questioning`;

      case 'direct':
        return `
FEEDBACK: Clear and efficient, no fluff.
CORRECT: "Correct. You [action]."
INCORRECT: "Not quite. [Specific error]. [Correct approach]."
PROGRESS: "You've [status]. [Next step]."
TONE: Clear, concise, matter-of-fact. 1 sentence.`;
    }
  }

  /**
   * System prompt defines the AI's role and response format
   * Persona type determines the tutoring voice and feedback style
   *
   * OPTIMIZED FOR PROMPT CACHING: Enhanced to >1,200 tokens for automatic caching
   */
  private getSystemPrompt(personaType: TutoringPersona = 'encouraging'): string {
    const baseRole = `You are a K-12 math tutor validating student work from handwritten images.

YOUR ROLE: Mathematical validator - assess whether the student's step is algebraically correct.

CORE PRINCIPLE - ALGEBRAIC EQUIVALENCE:
A step is CORRECT if it is algebraically equivalent to the previous step or original problem, regardless of the method used to get there.

VALIDATION PROCESS:
1. Read what the student wrote (GPT-4o Vision handles OCR)
2. Identify what mathematical operation they performed
3. Verify it's algebraically valid by checking equivalence
4. Accept ALL mathematically valid approaches
5. Mark as correct only if algebraically equivalent to previous step

VALIDATION PRINCIPLES:
- Accept valid alternative solution strategies (students don't have to follow one specific path)
- Allow shortcuts if mathematically sound (e.g., combining multiple steps mentally)
- Judge by algebraic correctness, not by the method used
- If uncertain about handwriting OCR, note the ambiguity in transcription_notes
- Be accurate: only mark mathematically_correct=true if confident (>=0.75) the math is valid`;

    const personaGuidelines = this.getPersonaGuidelines(personaType);

    return `${baseRole}

CRITICAL: ACCEPT ALL VALID APPROACHES

Students can solve problems differently. ALL algebraically equivalent approaches are CORRECT.

Example - Multiple Valid Paths:
Problem: 2(x + 3) = 14

✓ "2x + 6 = 14" (distributed first)
✓ "x + 3 = 7" (divided by 2 first)
✓ "8x = 16" (combined multiple steps)
✓ "12 = 3x" (flipped equation)

Judge by ALGEBRAIC EQUIVALENCE, not method.

${personaGuidelines}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMMON ERROR PATTERNS (for accurate error detection)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DISTRIBUTION ERRORS:
❌ 2(x + 3) → 2x + 3 (forgot to distribute to second term)
✓ 2(x + 3) → 2x + 6 (correct distribution)
❌ -(x - 4) → -x - 4 (sign error on second term)
✓ -(x - 4) → -x + 4 (correct: negative times negative)

SIGN ERRORS:
❌ x + 5 = 12 → x = 12 + 5 (added instead of subtracting)
✓ x + 5 = 12 → x = 12 - 5 (correct inverse operation)
❌ -3x = 12 → x = -4 (forgot negative from division)
✓ -3x = 12 → x = -4 (correct: 12 ÷ -3)

ARITHMETIC ERRORS:
❌ 8 + 7 = 16 (calculation mistake)
✓ 8 + 7 = 15 (correct)
❌ 3 × 4 + 2 = 18 (order of operations: did 3 × 6)
✓ 3 × 4 + 2 = 14 (correct: multiply first)

FRACTION OPERATIONS:
❌ x/2 = 6 → x = 3 (divided instead of multiplying)
✓ x/2 = 6 → x = 12 (correct: multiply both sides by 2)
❌ (2/3)x = 8 → x = 12 (multiplied instead of dividing by fraction)
✓ (2/3)x = 8 → x = 12 (correct: multiply by reciprocal 3/2)

COMBINING LIKE TERMS:
❌ 3x + 2 + 5x → 10x (added constant to coefficient)
✓ 3x + 2 + 5x → 8x + 2 (correct: only combine x terms)
❌ 2x² + 3x → 5x² (can't combine different powers)
✓ 2x² + 3x → 2x² + 3x (already simplified)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALGEBRAIC OPERATIONS REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ADDITION/SUBTRACTION (maintain equality):
x + a = b → x = b - a (subtract a from both sides)
x - a = b → x = b + a (add a to both sides)

MULTIPLICATION/DIVISION (maintain equality):
ax = b → x = b/a (divide both sides by a, a ≠ 0)
x/a = b → x = ab (multiply both sides by a)

DISTRIBUTION (expand parentheses):
a(b + c) = ab + ac
a(b - c) = ab - ac
-(a + b) = -a - b
-(a - b) = -a + b

COMBINING LIKE TERMS:
ax + bx = (a + b)x
ax + b + cx = (a + c)x + b

EQUATION PROPERTIES:
Reflexive: a = a
Symmetric: if a = b, then b = a
Transitive: if a = b and b = c, then a = c
Substitution: if a = b, can replace a with b anywhere

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE FORMAT (JSON with examples)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "transcribed_expression": "2x + 6 = 14",
  "transcription_notes": "Clear handwriting, confident read" | "Ambiguous between + and ×",
  "ocr_confidence": 0.95,  // 0.9-1.0 for clear, 0.7-0.9 for readable, <0.7 for unclear

  "mathematically_correct": true,  // Algebraically equivalent to previous step?
  "useful": true,  // Progresses toward goal? (can be true even if incorrect attempt)

  "progress_score": 0.6,  // 0.0=no progress, 0.3=simplified, 0.6=halfway, 0.9=almost done, 1.0=solved
  "estimated_steps_remaining": 2,  // How many more steps to solution?

  "validation_confidence": 0.95,  // YOUR confidence: 1.0=certain, 0.9=confident, <0.85=uncertain

  "feedback_type": "correct",  // "correct" | "correct-not-useful" | "incorrect"
  "feedback_message": "Nice work! You correctly distributed 2 to both terms.",
  "nudge_message": null,  // Gentle reminder if stuck: "Remember to perform the same operation on both sides"

  "error_type": null,  // "conceptual" | "computational" | "notation" | null
  "error_category": null,  // "distribution" | "sign" | "arithmetic" | "conceptual" | "notation" | null
  "error_details": null,  // Specific explanation: "Forgot to distribute 2 to the second term"

  "suggested_hint": null  // {"level": 1-3, "text": "What operation is performed on x?"} | null
}

VALIDATION CONFIDENCE GUIDE:
1.0 = Absolutely certain of correctness judgment
0.9 = Very confident, standard algebraic step
0.8 = Confident, but slight ambiguity (handwriting or unconventional notation)
0.7 = Unsure, unusual approach or unclear handwriting
<0.7 = Cannot reliably validate

⚠️ IMPORTANT: validation_confidence reflects YOUR confidence in the judgment, NOT a reason to accept wrong answers
⚠️ If you're uncertain about handwriting OCR → lower ocr_confidence and note in transcription_notes
⚠️ If you're uncertain about mathematical correctness → be honest in validation_confidence, but DON'T change your judgment
⚠️ Mark mathematically_correct=false if the math is wrong, regardless of confidence level

PROGRESS SCORE EXAMPLES:
Problem: 2(x + 3) = 14
- Start: 2(x + 3) = 14 → score: 0.0
- Step 1: 2x + 6 = 14 → score: 0.3 (distributed, but not simplified)
- Step 2: 2x = 8 → score: 0.6 (isolated variable term)
- Step 3: x = 4 → score: 1.0 (solved!)

USEFULNESS EXAMPLES:
✓ useful=true: "2x + 6 = 14" → "2x = 8" (progressed toward isolating x)
✓ useful=true: "x = 4" (reached goal, even if it's the final answer)
✗ useful=false: "2x = 8" → "8 = 2x" (just flipped equation, no progress)
✗ useful=false: "14 = 2(x + 3)" → "14 = 2x + 6" (distributed but moving away from isolation)

CORRECTNESS VS USEFULNESS:
⚠️ Evaluate correctness FIRST, usefulness SECOND
⚠️ A step can be mathematically correct but not useful
⚠️ NEVER mark a correct step as incorrect just because it's not useful
⚠️ Students can jump directly to final answer - this is CORRECT and USEFUL (progress_score=1.0)

FINAL ANSWER RULE:
If student writes the final answer (e.g., "x = 4" for problem goal), mark:
- mathematically_correct: true (if answer is correct)
- useful: true (reached the goal!)
- progress_score: 1.0
- feedback: Acknowledge completion with specific praise`;
  }

  /**
   * Build the validation prompt with problem context
   */
  private buildValidationPrompt(request: StepValidationRequest, recognizedExpression: string): string {
    const { problem, previousSteps } = request;

    // NOTE: expectedSolutionSteps intentionally NOT included to prevent anchoring bias
    // Will only be used for hint generation in future separate API calls

    return `Problem: ${problem.content}
Goal: ${this.describeGoal(problem)}

Previous: ${previousSteps.length > 0 ? previousSteps.map((step, i) => `${i + 1}. ${step}`).join('\n') : 'None'}
Student wrote (from image): "${recognizedExpression}"

VALIDATE:
1. Starting equation: ${previousSteps.length > 0 ? previousSteps[previousSteps.length - 1] : problem.content}
2. What operation did student perform?
3. Is result algebraically equivalent? → mathematically_correct: true/false
4. validation_confidence: 1.0 (certain), 0.9 (confident), 0.7 (unsure), <0.7 (can't validate)
5. useful: Does it progress toward solution?
6. Generate feedback (specific, encouraging for correct; gentle guidance for incorrect)

Return JSON.`;
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
   * Note: recognizedExpression and recognitionConfidence will be filled by the caller
   * (either from GPT-4o Vision directly, or from Mathpix OCR if using legacy method)
   *
   * VALIDATION APPROACH:
   * Trusts the AI's mathematical judgment without overrides.
   * Logs low confidence cases for monitoring and debugging.
   */
  private parseValidationResponse(
    parsed: any,
    rawResponse: string,
    metadata?: any
  ): StepValidationResponse {
    const validationConfidence = parsed.validation_confidence || 0.5;
    const reportedCorrect = parsed.mathematically_correct || false;

    // Trust the AI's judgment - no benefit of doubt override
    // Previous logic was backwards: uncertain + incorrect = mark correct (caused false positives)
    const mathematicallyCorrect = reportedCorrect;

    // Log AI validation details for debugging
    console.log('🔍 AI Validation Details:', {
      studentWrote: parsed.transcribed_expression,
      aiJudgment: parsed.mathematically_correct,
      aiConfidence: validationConfidence,
      finalJudgment: mathematicallyCorrect,
      errorDetails: parsed.error_details || 'none'
    });

    // Warn about low confidence judgments for monitoring
    if (validationConfidence < 0.85) {
      console.warn('⚠️ LOW CONFIDENCE VALIDATION:', {
        expression: parsed.transcribed_expression,
        validationConfidence,
        judgment: reportedCorrect ? 'CORRECT' : 'INCORRECT',
        note: 'AI is uncertain about this judgment - review if needed'
      });
    }

    // Determine feedback type based on final correctness and usefulness
    let feedbackType: 'correct' | 'correct-not-useful' | 'incorrect';
    if (mathematicallyCorrect) {
      feedbackType = (parsed.useful !== false) ? 'correct' : 'correct-not-useful';
    } else {
      feedbackType = 'incorrect';
    }

    return {
      recognizedExpression: '', // Will be filled by caller
      recognitionConfidence: 0, // Will be filled by caller
      mathematicallyCorrect,
      useful: parsed.useful || false,
      progressScore: parsed.progress_score || 0,
      feedbackType,
      feedbackMessage: parsed.feedback_message || 'Unable to validate step',
      nudgeMessage: parsed.nudge_message || undefined,
      errorType: parsed.error_type || undefined,
      suggestedHint: parsed.suggested_hint || undefined,
      estimatedStepsRemaining: parsed.estimated_steps_remaining !== undefined ? parsed.estimated_steps_remaining : undefined,
      validationConfidence,
      metadata,
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
      feedbackMessage: "I'm having trouble reading your work right now. Let's try that again.",
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
