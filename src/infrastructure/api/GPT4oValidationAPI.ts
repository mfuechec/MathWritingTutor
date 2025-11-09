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

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from GPT-4o Vision');
    }

    const parsed = JSON.parse(content);

    // Extract cache performance metrics
    const promptTokens = response.usage?.prompt_tokens || 0;
    const completionTokens = response.usage?.completion_tokens || 0;
    const totalTokens = response.usage?.total_tokens || 0;
    const cachedTokens = (response.usage as any)?.prompt_tokens_details?.cached_tokens || 0;
    const cacheHitRate = promptTokens > 0 ? (cachedTokens / promptTokens * 100) : 0;

    // Log cache performance
    console.log(`⏱️ │  ├─ Tokens Used: ${totalTokens} (prompt: ${promptTokens}, completion: ${completionTokens})`);
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
      tokensUsed: totalTokens,
      cachedTokens,
      cacheHitRate: parseFloat(cacheHitRate.toFixed(1)),
      attemptNumber,
      sessionId: this.sessionId,
    };

    // GPT-4o Vision returns the transcribed text in the response
    const recognizedExpression = parsed.transcribed_expression || parsed.recognized_text || '';
    const recognitionConfidence = parsed.ocr_confidence || 0.95; // Default high confidence for GPT-4o
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

    // Extract cache performance metrics (legacy method)
    const promptTokens = response.usage?.prompt_tokens || 0;
    const cachedTokens = (response.usage as any)?.prompt_tokens_details?.cached_tokens || 0;
    const cacheHitRate = promptTokens > 0 ? (cachedTokens / promptTokens * 100) : 0;

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
You are a PATIENT, ENCOURAGING math tutor speaking directly to the student. Your feedback will be read aloud.

CORRECT ANSWERS - Be specific and vary your phrasing:
For subtraction/addition:
✓ "Nice work! You correctly subtracted 3 from both sides."
✓ "Excellent! Removing that constant was the right move."
✓ "Perfect! You kept the equation balanced by subtracting from both sides."
✓ "Great thinking! That subtraction simplified things nicely."

For multiplication/division:
✓ "Well done! Dividing by 2 isolated the variable."
✓ "Exactly right! That division gave us our answer."
✓ "Perfect! You used the inverse operation correctly."
✓ "Nice! Undoing the multiplication was the key."

For distribution:
✓ "Excellent distribution! You multiplied through correctly."
✓ "Great! You expanded those parentheses perfectly."
✓ "Well done! Each term got multiplied properly."

For combining like terms:
✓ "Nice! You combined those terms correctly."
✓ "Perfect simplification! 5x minus 3x does equal 2x."
✓ "Excellent! You simplified the variable terms."

Creative approaches:
✓ "Interesting approach! You got there a different way."
✓ "I like how you thought of it that way. Well done!"
✓ "Smart! You found a shortcut that works."
✓ "Impressive! You saw several steps ahead."

✗ DON'T say: "Great job!" or "Correct!" (too generic)

FIRST INCORRECT ATTEMPT - Gentle questioning nudge (NOT a full hint):
✓ "Hmm, let's double-check that step. Does it look right to you?"
✓ "Before we move on, let's verify that calculation."
✓ "Take another look at the [distribution/sign/arithmetic]. What do you notice?"
✓ "Let's pause and check: does that equation still balance?"
Pattern: Questioning tone + specific focus area + student autonomy

SUBSEQUENT INCORRECT ATTEMPTS - Acknowledge what's RIGHT first, then redirect:
✓ "You're on the right track with that subtraction, but let's check the arithmetic."
✓ "Good thinking to distribute! Let's make sure each term gets multiplied."
✓ "I see you're trying to isolate x - that's the right idea. Let's refine the approach."
✓ "Nice try! You've got the concept down, just a small calculation to fix."
✓ "Almost there! Let's double-check what happens when we multiply 2 by each term."
Pattern: [Acknowledge effort/concept] + [Gentle redirect to error]

Normalize mistakes:
✓ "Math is all about trying things and learning from mistakes. Let's look at this together."
✓ "These tricky steps catch everyone sometimes. Let's break it down."
✓ "Persistence is what matters in math! Let's tackle this step by step."

✗ DON'T say: "That's wrong" or "Incorrect" (too harsh)
✗ DON'T say: "Let's try that again" without acknowledgment (implies failure)

PROGRESS MILESTONES - Celebrate key moments:
At ~50% progress:
✓ "Great! You're halfway to the solution."
✓ "Nice progress! You've simplified this significantly."

At ~75% progress:
✓ "You're almost there! Just a bit more to go."
✓ "Excellent work so far! The finish line is in sight."

At ~90% progress (variable isolated but needs final step):
✓ "Perfect! You've isolated the variable. One more step to find its value."
✓ "Great job getting to 2x = 4! Now we just need to solve for x."

First step correct:
✓ "Excellent start! You're on the right track."

One step remaining:
✓ "Almost there! One more step to the solution."

TONE: Patient, warm, specific, conversational (like speaking to a student face-to-face)
LENGTH: 1-2 sentences, natural speaking rhythm
ENERGY: Enthusiastic but not over-the-top`;

      case 'socratic':
        return `
FEEDBACK MESSAGE GUIDELINES (spoken aloud via text-to-speech):
You are a SOCRATIC math tutor who guides students to discover answers through questions.

CORRECT ANSWERS - Acknowledge with curiosity:
✓ "Interesting! What made you decide to subtract 3 from both sides?"
✓ "Good! How did you know to distribute the 2?"
✓ "You've isolated x. What does that tell us about the solution?"
✗ DON'T say: "Correct!" (too direct - ask questions instead)

INCORRECT ANSWERS - Guide with questions:
✓ "What would happen if we divided both sides by 3?"
✓ "Before we subtract, do you notice anything inside the parentheses?"
✓ "Let's think about this. What's 12 divided by 3?"
✓ "What operation is being performed on x right now?"
✗ DON'T say: "That's wrong" or give direct answers

PROGRESS FEEDBACK - Encourage thinking:
✓ "What's your next move?"
✓ "You've gotten this far. What do you notice?"
✓ "Good progress. Where does that lead us?"

TONE: Curious, questioning, discovery-focused
LENGTH: 1-2 questions, conversational
ENERGY: Thoughtful and inquisitive`;

      case 'direct':
        return `
FEEDBACK MESSAGE GUIDELINES (spoken aloud via text-to-speech):
You are a CLEAR, EFFICIENT math tutor who provides direct, to-the-point feedback.

CORRECT ANSWERS - Acknowledge and move forward:
✓ "Correct. You subtracted 3 from both sides."
✓ "Right. You distributed properly."
✓ "Correct. x equals 4."
✗ DON'T add unnecessary praise - be efficient

INCORRECT ANSWERS - State the issue clearly:
✓ "Not quite. Divide 12 by 3 to get 4, not 12."
✓ "Error in distribution. 2 times x plus 3 gives 2x plus 6."
✓ "Check your arithmetic. 10 minus 2 equals 8."
✗ DON'T soften too much - be clear about the error

PROGRESS FEEDBACK - State status:
✓ "You've isolated the variable term. One more step."
✓ "Halfway there. Now divide both sides."
✓ "Almost done. Finish the division."

TONE: Clear, efficient, to-the-point
LENGTH: 1 sentence, concise
ENERGY: Calm and matter-of-fact`;
    }
  }

  /**
   * System prompt defines the AI's role and response format
   * Persona type determines the tutoring voice and feedback style
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

CRITICAL: MULTIPLE VALID APPROACHES MUST BE ACCEPTED

Students can solve the same problem correctly using different valid strategies. ALL valid approaches must be marked as mathematically_correct: true.

Example 1 - Distribution vs Division First:
Problem: 2(x + 3) = 14
Previous steps: []

Approach A (Distribution first):
  Student writes: "2x + 6 = 14"  ✓ CORRECT (distributed 2 into parentheses)

Approach B (Division first):
  Student writes: "x + 3 = 7"    ✓ CORRECT (divided both sides by 2)

Both are mathematically valid! Don't reject Approach B just because it doesn't match Approach A.

Example 2 - Order of Operations:
Problem: 5x + 3x - 4 = 12
Previous steps: []

Approach A (Combine like terms first):
  Student writes: "8x - 4 = 12"  ✓ CORRECT

Approach B (Add 4 to both sides first):
  Student writes: "5x + 3x = 16" ✓ CORRECT

Approach C (Mental math shortcut - combined both operations):
  Student writes: "8x = 16"      ✓ CORRECT

All three are valid!

Example 3 - Equation Flipping (Commutativity):
Problem: 3x = 12
Previous steps: []

Student writes: "12 = 3x"        ✓ CORRECT (equations can be flipped)
Student writes: "x = 4"          ✓ CORRECT (divided both sides by 3)

Example 4 - Multiple Steps Combined:
Problem: 2(3x - 5) + 4 = 22
Previous steps: []

Approach A (Step by step):
  Student writes: "6x - 10 + 4 = 22"  ✓ CORRECT (distributed)

Approach B (Distribution + combining in one step):
  Student writes: "6x - 6 = 22"       ✓ CORRECT (distributed AND combined constants)

VALIDATION PRINCIPLE:
Judge mathematical correctness based on algebraic equivalence, NOT adherence to a specific solution path.

${personaGuidelines}

RESPONSE FORMAT (JSON only):
{
  "transcribed_expression": "string - what you read from the image",
  "transcription_notes": "string - any observations about handwriting or clarity",
  "ocr_confidence": 0-1 (confidence in reading the handwriting),
  "mathematically_correct": boolean,
  "useful": boolean,
  "progress_score": 0-1 (how close to final answer),
  "estimated_steps_remaining": number (how many more steps to solution),
  "validation_confidence": 0-1 (confidence in your mathematical judgment),
  "feedback_type": "correct" | "correct-not-useful" | "incorrect",
  "feedback_message": "encouraging message",
  "nudge_message": "string or null",
  "error_type": "conceptual | computational | notation or null",
  "error_category": "distribution | sign | arithmetic | conceptual | notation or null",
  "error_details": "string - specific explanation of what went wrong (if incorrect)",
  "suggested_hint": {"level": 1-3, "text": "string"} or null
}

CORRECTNESS JUDGMENT (PRIMARY TASK):
mathematically_correct: true/false

Set to TRUE if:
- The expression is algebraically equivalent to the previous step or original problem
- The operation performed is mathematically valid
- The arithmetic is correct (even if it's an unusual approach)

Examples of CORRECT steps (even if unusual):
✓ "3x = 12" → "12 = 3x" (flipping is valid)
✓ "2x + 6 = 14" → "x + 3 = 7" (dividing both sides by 2 is valid)
✓ "5x - 3x = 8" → "2x = 8" (combining like terms is valid)
✓ "5x - 3x = 8" → "5x = 8 + 3x" (adding 3x to both sides is valid, though unusual)
✓ "2(x + 3) = 14" → "x + 3 = 7" (dividing both sides by 2 instead of distributing is valid)

Set to FALSE only if:
- There's a clear mathematical error (distribution error, sign error, arithmetic mistake)
- The expression is NOT algebraically equivalent to the previous step

Common ERRORS to catch:
✗ "2(x + 3) = 14" → "2x + 3 = 14" (distribution error: should be 2x + 6)
✗ "-(x - 3)" → "-x - 3" (sign error: should be -x + 3)
✗ "3x = 12" → "x = 12" (division error: should be x = 4)
✗ "5x - 3x" → "8x" (arithmetic error: should be 2x)

USEFULNESS JUDGMENT (SECONDARY TASK):
useful: true/false

Set to TRUE if:
- The step moves toward isolating the variable
- It simplifies the expression in a productive way

Set to FALSE if:
- Mathematically valid but doesn't progress toward solution (e.g., "x = 4" → "4 = x")
- Rearrangement without simplification

⚠️ CRITICAL: Evaluate mathematically_correct FIRST, then assess usefulness SEPARATELY.
NEVER mark mathematically_correct as false just because useful is false.

PROGRESS SCORES (Descriptive, NOT Prescriptive):
- 0.3-0.5 = Simplified constants or distributed
- 0.6-0.8 = Variable term isolated on one side
- 0.9 = Coefficient still present (e.g., "2x = 4")
- 1.0 = Fully solved (e.g., "x = 2")

⚠️ IMPORTANT: Progress score describes HOW CLOSE to final answer.
It does NOT determine correctness! A step with progress_score = 0.9 can be 100% mathematically correct.

ESTIMATED STEPS REMAINING:
- Count how many more algebraic operations are needed to fully isolate the variable
- Examples:
  - "2x = 4" → 1 step remaining (divide by 2)
  - "2x + 3 = 7" → 2 steps remaining (subtract 3, then divide by 2)
  - "x = 4" → 0 steps remaining (solved)
- If incorrect, estimate steps needed to correct and complete

VALIDATION CONFIDENCE (CRITICAL):
Set validation_confidence based on your certainty about the mathematical judgment:
- 1.0 = Completely certain the answer is correct or incorrect
- 0.9 = Very confident but there's a small chance of alternate interpretation
- 0.7-0.8 = Somewhat uncertain, could be valid in a different approach
- < 0.7 = Cannot reliably validate (ambiguous handwriting, unclear operation)

⚠️ Be accurate: Only mark as correct if you are confident (>=0.75) the math is algebraically valid.
Low confidence judgments will be logged for review.

HINTS:
Level 1: Conceptual cue, Level 2: Specific suggestion, Level 3: Scaffolded step`;
  }

  /**
   * Build the validation prompt with problem context
   */
  private buildValidationPrompt(request: StepValidationRequest, recognizedExpression: string): string {
    const { problem, previousSteps, expectedSolutionSteps } = request;

    // Build expected steps context if available - WITH STRONG ANTI-ANCHORING WARNING
    let expectedStepsContext = '';
    if (expectedSolutionSteps && expectedSolutionSteps.length > 0) {
      expectedStepsContext = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ HINT GENERATION ONLY (DO NOT USE FOR VALIDATION) ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Model Solution Path (FOR HINTS ONLY):
${expectedSolutionSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

⚠️ CRITICAL: DO NOT USE THIS TO VALIDATE THE STUDENT'S WORK ⚠️

The student may use a DIFFERENT but EQUALLY VALID approach.
Examples:
- They might divide both sides first instead of distributing
- They might combine steps you show separately
- They might use a creative shortcut

Validate based on ALGEBRAIC EQUIVALENCE, NOT adherence to this path.
Only reference this model solution when generating hints if the student needs help.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    }

    return `Problem: ${problem.content}
Goal: ${this.describeGoal(problem)}

Previous steps (already validated):
${previousSteps.length > 0 ? previousSteps.map((step, i) => `${i + 1}. ${step}`).join('\n') : 'None (this is the first step)'}

Student's latest work (read from image):
"${recognizedExpression}"
${expectedStepsContext}

VALIDATION TASK:

Step 1 - Identify the starting point:
Starting equation: ${previousSteps.length > 0 ? previousSteps[previousSteps.length - 1] : problem.content}

Step 2 - Identify what operation the student performed:
(Examples: distributed, combined like terms, added/subtracted from both sides, multiplied/divided both sides, etc.)

Step 3 - Verify algebraic equivalence:
Execute that operation yourself on the starting equation.
Does your result match what the student wrote?

- If YES → mathematically_correct: true
- If NO → Is there an alternate valid approach that would give this result?
  - If YES → mathematically_correct: true
  - If NO → mathematically_correct: false

Step 4 - Set validation_confidence:
- 1.0 = Completely certain about your judgment
- 0.9 = Very confident
- 0.7-0.8 = Somewhat uncertain, could be valid in different approach
- < 0.7 = Cannot reliably validate

⚠️ Be accurate: Only mark as correct if you're confident the math is algebraically valid.
Low confidence judgments will be logged for review.

Step 5 - Assess usefulness (separate from correctness):
Does this step progress toward isolating the variable?
- useful: true if it moves toward the goal
- useful: false if correct but doesn't help (e.g., "x = 4" → "4 = x")

Step 6 - Generate feedback:
Write encouraging, specific feedback as if speaking to the student.
- CORRECT: Acknowledge the specific operation ("You correctly divided both sides by 2")
- INCORRECT: Gently guide ("Let's check that distribution")

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
    const validationConfidence = parsed.validation_confidence || 1.0;
    const reportedCorrect = parsed.mathematically_correct || false;

    // Trust AI's judgment without override
    const mathematicallyCorrect = reportedCorrect;

    // Log AI validation details for debugging
    console.log('🔍 AI Validation Details:', {
      startingEquation: 'previous step',
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
