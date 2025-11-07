/**
 * Dialogue Manager Service
 * Coordinates conversation flow between AI and student to maintain natural, non-intrusive dialogue
 */

export type DialogueMode =
  | 'silent'           // No AI-initiated questions
  | 'hints_only'       // Only respond when student asks
  | 'conversational';  // Socratic questions enabled

export type ConversationState =
  | 'idle'             // No recent activity
  | 'working'          // Student actively solving
  | 'paused'           // Student paused but not timed out
  | 'stuck'            // Multiple incorrect attempts
  | 'listening'        // AI is listening for student response
  | 'speaking';        // AI is speaking

export interface DialogueConfig {
  mode: DialogueMode;

  // Timing constraints (milliseconds)
  minTimeBetweenQuestions: number;  // Prevent rapid-fire questions
  maxQuestionsPerMinute: number;    // Don't overwhelm student
  speakingCooldown: number;         // Wait after TTS finishes

  // Strategic settings
  strategicQuestionProbability: number;  // 0-1 chance for non-strategic moments
  alwaysAskOnStrategicMoment: boolean;
  checkInOnInactivity: boolean;
}

export interface DialogueState {
  conversationState: ConversationState;
  lastQuestionTime: number;
  questionsAskedInLastMinute: number;
  lastSpeechEndTime: number;
  isWaitingForResponse: boolean;
  currentQuestion?: string;
}

export class DialogueManager {
  private state: DialogueState;
  private config: DialogueConfig;
  private questionTimestamps: number[] = [];

  constructor(config: Partial<DialogueConfig> = {}) {
    this.config = {
      mode: 'conversational',
      minTimeBetweenQuestions: 15000, // 15 seconds minimum between questions
      maxQuestionsPerMinute: 3,
      speakingCooldown: 2000, // 2 seconds after speech ends
      strategicQuestionProbability: 0.4,
      alwaysAskOnStrategicMoment: true,
      checkInOnInactivity: true,
      ...config,
    };

    this.state = {
      conversationState: 'idle',
      lastQuestionTime: 0,
      questionsAskedInLastMinute: 0,
      lastSpeechEndTime: 0,
      isWaitingForResponse: false,
    };
  }

  /**
   * Update configuration dynamically
   */
  updateConfig(updates: Partial<DialogueConfig>) {
    this.config = { ...this.config, ...updates };
    console.log('🎙️ Dialogue config updated:', updates);
  }

  /**
   * Update conversation state
   */
  updateState(newState: Partial<ConversationState>) {
    this.state.conversationState = newState as ConversationState;
    console.log(`🎙️ Conversation state: ${this.state.conversationState}`);
  }

  /**
   * Record that speech has started
   */
  onSpeechStart() {
    this.state.conversationState = 'speaking';
  }

  /**
   * Record that speech has ended
   */
  onSpeechEnd() {
    this.state.lastSpeechEndTime = Date.now();

    // Return to appropriate state
    if (this.state.isWaitingForResponse) {
      this.state.conversationState = 'listening';
    } else {
      this.state.conversationState = 'working';
    }
  }

  /**
   * Student has started interacting (drawing, touching)
   */
  onStudentActivity() {
    // Don't interrupt if AI is speaking
    if (this.state.conversationState === 'speaking') {
      return;
    }

    this.state.conversationState = 'working';
    this.state.isWaitingForResponse = false;
  }

  /**
   * Student has stopped interacting
   */
  onStudentPause() {
    if (this.state.conversationState === 'working') {
      this.state.conversationState = 'paused';
    }
  }

  /**
   * Student provided a voice response
   */
  onStudentResponse(response: string) {
    this.state.isWaitingForResponse = false;
    this.state.conversationState = 'working';
    console.log('🎙️ Student response received:', response);
  }

  /**
   * Determine if AI should ask a question right now
   */
  shouldAskQuestion(context: {
    isStrategicMoment: boolean;
    isCorrectStep: boolean;
    consecutiveErrors?: number;
  }): boolean {
    const { isStrategicMoment, isCorrectStep, consecutiveErrors = 0 } = context;

    // Never ask if mode is silent or hints-only
    if (this.config.mode === 'silent' || this.config.mode === 'hints_only') {
      return false;
    }

    // Don't interrupt while speaking or listening
    if (this.state.conversationState === 'speaking' || this.state.conversationState === 'listening') {
      return false;
    }

    // Check cooldown after last speech
    const timeSinceLastSpeech = Date.now() - this.state.lastSpeechEndTime;
    if (timeSinceLastSpeech < this.config.speakingCooldown) {
      console.log(`🎙️ Skipping question: cooldown active (${timeSinceLastSpeech}ms < ${this.config.speakingCooldown}ms)`);
      return false;
    }

    // Check minimum time between questions
    const timeSinceLastQuestion = Date.now() - this.state.lastQuestionTime;
    if (timeSinceLastQuestion < this.config.minTimeBetweenQuestions) {
      console.log(`🎙️ Skipping question: too soon since last (${timeSinceLastQuestion}ms < ${this.config.minTimeBetweenQuestions}ms)`);
      return false;
    }

    // Check question rate limit
    this.cleanupOldQuestions();
    if (this.questionTimestamps.length >= this.config.maxQuestionsPerMinute) {
      console.log(`🎙️ Skipping question: rate limit reached (${this.questionTimestamps.length}/${this.config.maxQuestionsPerMinute} per minute)`);
      return false;
    }

    // If student is stuck (multiple errors), always ask
    if (consecutiveErrors >= 2) {
      console.log('🎙️ Asking question: student appears stuck');
      return true;
    }

    // Strategic moments get priority
    if (isStrategicMoment && this.config.alwaysAskOnStrategicMoment) {
      console.log('🎙️ Asking question: strategic moment detected');
      return true;
    }

    // Otherwise use probability
    if (isCorrectStep) {
      const shouldAsk = Math.random() < this.config.strategicQuestionProbability;
      console.log(`🎙️ ${shouldAsk ? 'Asking' : 'Skipping'} question: random chance (${this.config.strategicQuestionProbability})`);
      return shouldAsk;
    }

    return false;
  }

  /**
   * Record that a question was asked
   */
  recordQuestion(question: string, expectsResponse: boolean = false) {
    const now = Date.now();
    this.state.lastQuestionTime = now;
    this.state.currentQuestion = question;
    this.state.isWaitingForResponse = expectsResponse;

    this.questionTimestamps.push(now);
    this.cleanupOldQuestions();

    console.log(`🎙️ Question recorded. ${this.questionTimestamps.length}/${this.config.maxQuestionsPerMinute} in last minute`);
  }

  /**
   * Check if AI should respond to a check-in
   */
  shouldRespondToCheckIn(inactivityDuration: number, checkInLevel: number): boolean {
    if (!this.config.checkInOnInactivity) {
      return false;
    }

    // Only respond on first and third check-in (not every one)
    if (checkInLevel === 1 || checkInLevel === 3) {
      return true;
    }

    return false;
  }

  /**
   * Get current state for debugging
   */
  getState(): DialogueState {
    return { ...this.state };
  }

  /**
   * Get current config
   */
  getConfig(): DialogueConfig {
    return { ...this.config };
  }

  /**
   * Remove question timestamps older than 1 minute
   */
  private cleanupOldQuestions() {
    const oneMinuteAgo = Date.now() - 60000;
    this.questionTimestamps = this.questionTimestamps.filter(time => time > oneMinuteAgo);
    this.state.questionsAskedInLastMinute = this.questionTimestamps.length;
  }

  /**
   * Reset dialogue state (e.g., when starting new problem)
   */
  reset() {
    this.state = {
      conversationState: 'idle',
      lastQuestionTime: 0,
      questionsAskedInLastMinute: 0,
      lastSpeechEndTime: 0,
      isWaitingForResponse: false,
    };
    this.questionTimestamps = [];
    console.log('🎙️ Dialogue manager reset');
  }
}

// Singleton instance
export const dialogueManager = new DialogueManager();
