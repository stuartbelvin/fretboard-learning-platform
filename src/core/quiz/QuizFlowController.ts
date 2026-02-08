import { Note } from '../music-theory/Note';
import { HighlightZone } from '../zones/HighlightZone';
import { Fretboard } from '../instruments/Fretboard';
import { NoteQuizState } from './NoteQuizState';
import type { 
  QuizState, 
  QuizQuestion, 
  QuizResult, 
  QuestionStats,
  NoteQuizConfig
} from './NoteQuizState';
import { NoteQuestionGenerator } from './NoteQuestionGenerator';
import type { QuestionGeneratorConfig } from './NoteQuestionGenerator';
import { AnswerValidator } from './AnswerValidator';
import type { ValidationResult } from './AnswerValidator';
import { QuizFeedbackManager } from './QuizFeedbackManager';
import type { 
  FeedbackState, 
  FeedbackConfig 
} from './QuizFeedbackManager';

/**
 * Pause state for the quiz flow controller.
 */
export type PauseState = 'running' | 'paused' | 'auto-advance-pending';

/**
 * Configuration for the quiz flow controller.
 */
export interface FlowControllerConfig {
  /** Quiz state machine configuration */
  quizConfig?: Partial<NoteQuizConfig>;
  /** Question generator configuration */
  generatorConfig?: Partial<QuestionGeneratorConfig>;
  /** Feedback manager configuration */
  feedbackConfig?: Partial<FeedbackConfig>;
  /** Auto-advance enabled (default: true) */
  autoAdvance?: boolean;
  /** Auto-advance delay in ms (default: 1000) */
  autoAdvanceDelay?: number;
  /** Show hint automatically after max attempts (default: true) */
  autoShowHint?: boolean;
}

/**
 * Default flow controller configuration.
 */
export const DEFAULT_FLOW_CONFIG: Required<Pick<FlowControllerConfig, 'autoAdvance' | 'autoAdvanceDelay' | 'autoShowHint'>> = {
  autoAdvance: true,
  autoAdvanceDelay: 1000,
  autoShowHint: true
};

/**
 * Score data for display.
 */
export interface ScoreData {
  /** Number of correct answers */
  correct: number;
  /** Number of questions answered */
  total: number;
  /** Number of hints used */
  hintsUsed: number;
  /** Total attempts across all questions */
  totalAttempts: number;
  /** Formatted score string (e.g., "5/10") */
  display: string;
  /** Accuracy percentage (0-100) */
  accuracy: number;
}

/**
 * Progress data for display.
 */
export interface ProgressData {
  /** Current question number (1-based) */
  currentQuestion: number;
  /** Total questions in quiz */
  totalQuestions: number;
  /** Formatted progress string (e.g., "Question 5 of 10") */
  display: string;
  /** Progress percentage (0-100) */
  percentage: number;
}

/**
 * Event types for flow controller.
 */
export type FlowEventType = 
  | 'quizStarted'
  | 'questionReady'
  | 'answerProcessed'
  | 'autoAdvanceScheduled'
  | 'autoAdvanceCancelled'
  | 'paused'
  | 'resumed'
  | 'quizCompleted'
  | 'quizReset';

/**
 * Event payload for flow controller events.
 */
export interface FlowEvent {
  type: FlowEventType;
  timestamp: number;
  quizState?: QuizState;
  pauseState?: PauseState;
  question?: QuizQuestion;
  score?: ScoreData;
  progress?: ProgressData;
  result?: QuizResult;
  autoAdvanceRemaining?: number;
}

/**
 * Listener callback for flow events.
 */
export type FlowEventListener = (event: FlowEvent) => void;

/**
 * QuizFlowController orchestrates the entire quiz flow including:
 * - Auto-advancing to next question after correct answers
 * - Pause/resume functionality with timer management
 * - Score and progress tracking
 * - Integration of quiz state, question generator, answer validator, and feedback manager
 * 
 * This is the main entry point for managing Note Identification Quiz sessions.
 */
export class QuizFlowController {
  // Core components
  private _quizState: NoteQuizState;
  private _generator: NoteQuestionGenerator;
  private _validator: AnswerValidator;
  private _feedbackManager: QuizFeedbackManager;
  private _fretboard: Fretboard;
  
  // Active zone
  private _activeZone: HighlightZone | null = null;
  
  // Configuration
  private _autoAdvance: boolean;
  private _autoAdvanceDelay: number;
  private _autoShowHint: boolean;
  
  // Pause state
  private _pauseState: PauseState = 'running';
  private _pausedAt: number | null = null;
  
  // Auto-advance timer
  private _autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
  private _autoAdvanceStartTime: number | null = null;
  private _autoAdvanceRemaining: number | null = null;
  
  // Displayed question (used during auto-advance pending)
  private _displayedQuestion: QuizQuestion | null = null;
  
  // Event listeners
  private _listeners: Map<FlowEventType, Set<FlowEventListener>> = new Map();

  constructor(config: FlowControllerConfig = {}) {
    // Create fretboard instance for question generation
    this._fretboard = new Fretboard();
    
    // Initialize core components
    this._quizState = new NoteQuizState(config.quizConfig);
    this._generator = new NoteQuestionGenerator(this._fretboard, config.generatorConfig);
    this._validator = new AnswerValidator();
    this._feedbackManager = new QuizFeedbackManager(config.feedbackConfig);
    
    // Sync maxAttempts from quiz config to validator
    if (config.quizConfig?.maxAttempts !== undefined) {
      this._validator.updateConfig({ maxAttempts: config.quizConfig.maxAttempts });
    }
    
    // Apply flow configuration
    this._autoAdvance = config.autoAdvance ?? DEFAULT_FLOW_CONFIG.autoAdvance;
    this._autoAdvanceDelay = config.autoAdvanceDelay ?? DEFAULT_FLOW_CONFIG.autoAdvanceDelay;
    this._autoShowHint = config.autoShowHint ?? DEFAULT_FLOW_CONFIG.autoShowHint;
    
    // Subscribe to feedback completion events
    this._feedbackManager.on('feedbackComplete', () => {
      // Handle feedback completion if needed
    });
  }

  // ============================================================
  // Public Getters
  // ============================================================

  /** Current quiz state */
  get quizState(): QuizState {
    return this._quizState.state;
  }

  /** Current pause state */
  get pauseState(): PauseState {
    return this._pauseState;
  }

  /** Whether the quiz is paused */
  get isPaused(): boolean {
    return this._pauseState === 'paused';
  }

  /** Whether auto-advance is pending */
  get isAutoAdvancePending(): boolean {
    return this._pauseState === 'auto-advance-pending';
  }

  /** Whether the quiz is running (not paused, not pending) */
  get isRunning(): boolean {
    return this._pauseState === 'running';
  }

  /** Current question or null */
  get currentQuestion(): QuizQuestion | null {
    // During auto-advance pending or when paused with a pending question, 
    // show the displayed question (last answered question)
    if (this._displayedQuestion && (this._pauseState === 'auto-advance-pending' || 
        (this._pauseState === 'paused' && this._autoAdvanceRemaining !== null))) {
      return this._displayedQuestion;
    }
    return this._quizState.currentQuestion ?? this._displayedQuestion;
  }

  /** Statistics for current question */
  get questionStats(): Readonly<QuestionStats> {
    return this._quizState.questionStats;
  }

  /** Active zone */
  get activeZone(): HighlightZone | null {
    return this._activeZone;
  }

  /**
   * Updates the active zone for subsequent question generation.
   * This allows changing the zone between questions.
   * @param zone The new zone to use for question generation
   * @returns true if zone was set successfully
   */
  public setZone(zone: HighlightZone): boolean {
    if (!zone || zone.isEmpty()) {
      return false;
    }
    this._activeZone = zone;
    return true;
  }

  /** Whether auto-advance is enabled */
  get autoAdvanceEnabled(): boolean {
    return this._autoAdvance;
  }

  /** Auto-advance delay in ms */
  get autoAdvanceDelay(): number {
    return this._autoAdvanceDelay;
  }

  /** Get remaining auto-advance time in ms (null if not pending) */
  get autoAdvanceRemaining(): number | null {
    // When paused and there's saved remaining time, return it
    if (this._pauseState === 'paused' && this._autoAdvanceRemaining !== null) {
      return this._autoAdvanceRemaining;
    }
    
    // When not paused, calculate from start time
    if (!this._autoAdvanceStartTime) return null;
    
    const elapsed = Date.now() - this._autoAdvanceStartTime;
    return Math.max(0, this._autoAdvanceDelay - elapsed);
  }

  /** Get current active feedback states */
  get activeFeedback(): FeedbackState[] {
    return this._feedbackManager.getAllActiveFeedback();
  }

  /** Access to underlying quiz state for advanced usage */
  get state(): NoteQuizState {
    return this._quizState;
  }

  /** Access to underlying feedback manager */
  get feedback(): QuizFeedbackManager {
    return this._feedbackManager;
  }

  // ============================================================
  // Score & Progress
  // ============================================================

  /**
   * Gets the current score data.
   */
  public getScore(): ScoreData {
    const correct = this._quizState.correctAnswers;
    const total = this._quizState.questionsAnswered;
    const hintsUsed = this._quizState.hintsUsed;
    const totalAttempts = this._quizState.totalAttempts;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    return {
      correct,
      total,
      hintsUsed,
      totalAttempts,
      display: `${correct}/${total}`,
      accuracy
    };
  }

  /**
   * Gets the current progress data.
   */
  public getProgress(): ProgressData {
    const totalQuestions = this._quizState.config.totalQuestions;
    const currentQuestion = this._quizState.questionsAnswered + 1;
    const percentage = Math.round((this._quizState.questionsAnswered / totalQuestions) * 100);
    
    return {
      currentQuestion: Math.min(currentQuestion, totalQuestions),
      totalQuestions,
      display: `Question ${currentQuestion} of ${totalQuestions}`,
      percentage
    };
  }

  // ============================================================
  // Quiz Lifecycle
  // ============================================================

  /**
   * Starts a new quiz session with the given zone.
   * @param zone The highlight zone to use for question generation
   * @returns true if quiz started successfully
   */
  public start(zone: HighlightZone): boolean {
    if (!zone || zone.isEmpty()) {
      return false;
    }

    // Reset validator attempts
    this._validator.resetAttempts();
    
    // Reset generator
    this._generator.reset();
    
    // Clear any pending timers
    this._clearAutoAdvanceTimer();
    
    // Start quiz state
    const started = this._quizState.start(zone);
    if (!started) {
      return false;
    }

    this._activeZone = zone;
    this._pauseState = 'running';
    this._pausedAt = null;
    
    this._emitEvent({
      type: 'quizStarted',
      timestamp: Date.now(),
      quizState: this._quizState.state,
      pauseState: this._pauseState,
      score: this.getScore(),
      progress: this.getProgress()
    });

    // Generate first question
    this._generateNextQuestion();
    
    return true;
  }

  /**
   * Generates the next question.
   * @returns true if question was generated successfully
   */
  private _generateNextQuestion(): boolean {
    if (!this._activeZone) {
      return false;
    }

    const result = this._generator.generateQuestion(this._activeZone);
    if (!result.success || !result.question) {
      return false;
    }

    const set = this._quizState.setQuestion(result.question);
    if (!set) {
      return false;
    }

    // Track displayed question
    this._displayedQuestion = result.question;
    
    // Reset validator for new question
    this._validator.resetAttempts();

    this._emitEvent({
      type: 'questionReady',
      timestamp: Date.now(),
      quizState: this._quizState.state,
      pauseState: this._pauseState,
      question: result.question,
      score: this.getScore(),
      progress: this.getProgress()
    });

    return true;
  }

  /**
   * Submits an answer and processes the result.
   * @param clickedNote The note the user clicked
   * @returns ValidationResult with answer correctness and tracking info
   */
  public submitAnswer(clickedNote: Note): ValidationResult | null {
    if (this._pauseState === 'paused') {
      return null;
    }

    const question = this._quizState.currentQuestion;
    if (!question) {
      return null;
    }

    // Cancel any pending auto-advance
    this._clearAutoAdvanceTimer();
    this._pauseState = 'running';

    // Validate the answer
    const { validation, attemptState: _attemptState } = this._validator.validateAndTrack(
      clickedNote,
      question.targetPitchClass
    );

    // Submit to quiz state
    this._quizState.submitAnswer(clickedNote);

    // Show appropriate feedback
    if (validation.isCorrect) {
      this._feedbackManager.showCorrectFeedback(clickedNote);
    } else {
      this._feedbackManager.showIncorrectFeedback(clickedNote);
    }

    this._emitEvent({
      type: 'answerProcessed',
      timestamp: Date.now(),
      quizState: this._quizState.state,
      pauseState: this._pauseState,
      question,
      score: this.getScore(),
      progress: this.getProgress()
    });

    // Handle result
    if (validation.isCorrect) {
      this._handleCorrectAnswer();
    } else {
      this._handleIncorrectAnswer(question);
    }

    return validation;
  }

  /**
   * Handles a correct answer - schedule auto-advance if enabled.
   */
  private _handleCorrectAnswer(): void {
    // Check if quiz is complete
    if (this._quizState.state === 'complete') {
      this._handleQuizComplete();
      return;
    }

    // Schedule auto-advance if enabled
    if (this._autoAdvance) {
      this._scheduleAutoAdvance();
    }
  }

  /**
   * Handles an incorrect answer - show hint if max attempts reached.
   */
  private _handleIncorrectAnswer(question: QuizQuestion): void {
    const attemptState = this._validator.getAttemptState();
    
    // Show hint if max attempts reached
    if (attemptState.maxAttemptsReached && this._autoShowHint) {
      this._feedbackManager.showHintFeedback(question.targetNote);
    }
  }

  /**
   * Acknowledges the hint and advances to next question.
   */
  public acknowledgeHint(): boolean {
    const acknowledged = this._quizState.acknowledgeHint();
    if (!acknowledged) {
      return false;
    }

    // Clear feedback
    this._feedbackManager.clearAllFeedback();
    
    // Reset validator
    this._validator.resetAttempts();

    // Check if quiz is complete
    if (this._quizState.state === 'complete') {
      this._handleQuizComplete();
      return true;
    }

    // Generate next question
    this._generateNextQuestion();
    
    return true;
  }

  /**
   * Manually advances to the next question (skipping auto-advance timer).
   * @returns true if advanced successfully
   */
  public advanceToNextQuestion(): boolean {
    if (this._quizState.state !== 'active') {
      return false;
    }

    // Clear auto-advance timer
    this._clearAutoAdvanceTimer();
    this._pauseState = 'running';
    
    // Clear feedback
    this._feedbackManager.clearAllFeedback();
    
    // Reset validator
    this._validator.resetAttempts();
    
    // Check if quiz is complete
    if (this._quizState.questionsAnswered >= this._quizState.config.totalQuestions) {
      this._handleQuizComplete();
      return true;
    }

    // Generate next question
    return this._generateNextQuestion();
  }

  /**
   * Handles quiz completion.
   */
  private _handleQuizComplete(): void {
    this._clearAutoAdvanceTimer();
    this._pauseState = 'running';
    this._feedbackManager.clearAllFeedback();

    const result = this._quizState.getResult();

    this._emitEvent({
      type: 'quizCompleted',
      timestamp: Date.now(),
      quizState: this._quizState.state,
      pauseState: this._pauseState,
      score: this.getScore(),
      progress: this.getProgress(),
      result: result ?? undefined
    });
  }

  // ============================================================
  // Auto-Advance Management
  // ============================================================

  /**
   * Schedules auto-advance to next question.
   */
  private _scheduleAutoAdvance(): void {
    this._clearAutoAdvanceTimer();
    
    this._pauseState = 'auto-advance-pending';
    this._autoAdvanceStartTime = Date.now();
    this._autoAdvanceRemaining = this._autoAdvanceDelay;
    
    this._emitEvent({
      type: 'autoAdvanceScheduled',
      timestamp: Date.now(),
      quizState: this._quizState.state,
      pauseState: this._pauseState,
      autoAdvanceRemaining: this._autoAdvanceDelay
    });
    
    this._autoAdvanceTimer = setTimeout(() => {
      this._executeAutoAdvance();
    }, this._autoAdvanceDelay);
  }

  /**
   * Executes auto-advance to next question.
   */
  private _executeAutoAdvance(): void {
    this._autoAdvanceTimer = null;
    this._autoAdvanceStartTime = null;
    this._autoAdvanceRemaining = null;
    
    // Clear feedback before advancing
    this._feedbackManager.clearAllFeedback();
    
    // Reset validator
    this._validator.resetAttempts();
    
    // Set running state before generating question
    this._pauseState = 'running';
    
    // Check if quiz should complete (already answered all questions)
    if (this._quizState.questionsAnswered >= this._quizState.config.totalQuestions) {
      this._handleQuizComplete();
      return;
    }
    
    // Generate next question
    this._generateNextQuestion();
  }

  /**
   * Clears the auto-advance timer.
   */
  private _clearAutoAdvanceTimer(): void {
    if (this._autoAdvanceTimer) {
      clearTimeout(this._autoAdvanceTimer);
      this._autoAdvanceTimer = null;
    }
    this._autoAdvanceStartTime = null;
    this._autoAdvanceRemaining = null;
  }

  /**
   * Cancels any pending auto-advance.
   * @returns true if there was a pending auto-advance to cancel
   */
  public cancelAutoAdvance(): boolean {
    if (this._pauseState !== 'auto-advance-pending') {
      return false;
    }

    this._clearAutoAdvanceTimer();
    this._pauseState = 'running';

    this._emitEvent({
      type: 'autoAdvanceCancelled',
      timestamp: Date.now(),
      quizState: this._quizState.state,
      pauseState: this._pauseState
    });

    return true;
  }

  // ============================================================
  // Pause/Resume
  // ============================================================

  /**
   * Pauses the quiz, preserving auto-advance timer state.
   * @returns true if paused successfully
   */
  public pause(): boolean {
    if (this._pauseState === 'paused') {
      return false;
    }

    if (!this._quizState.isActive) {
      return false;
    }

    // Save remaining auto-advance time if pending
    if (this._pauseState === 'auto-advance-pending' && this._autoAdvanceStartTime) {
      const elapsed = Date.now() - this._autoAdvanceStartTime;
      this._autoAdvanceRemaining = Math.max(0, this._autoAdvanceDelay - elapsed);
      // Clear timer but keep the remaining time
      if (this._autoAdvanceTimer) {
        clearTimeout(this._autoAdvanceTimer);
        this._autoAdvanceTimer = null;
      }
      this._autoAdvanceStartTime = null;
    }

    this._pauseState = 'paused';
    this._pausedAt = Date.now();
    
    this._quizState.pause();

    this._emitEvent({
      type: 'paused',
      timestamp: Date.now(),
      quizState: this._quizState.state,
      pauseState: this._pauseState,
      autoAdvanceRemaining: this._autoAdvanceRemaining ?? undefined
    });

    return true;
  }

  /**
   * Resumes the quiz, restoring auto-advance timer if applicable.
   * @returns true if resumed successfully
   */
  public resume(): boolean {
    if (this._pauseState !== 'paused') {
      return false;
    }

    // Restore auto-advance timer if there was remaining time
    if (this._autoAdvanceRemaining !== null && this._autoAdvanceRemaining > 0) {
      this._pauseState = 'auto-advance-pending';
      this._autoAdvanceStartTime = Date.now();
      
      this._autoAdvanceTimer = setTimeout(() => {
        this._executeAutoAdvance();
      }, this._autoAdvanceRemaining);
    } else {
      this._pauseState = 'running';
    }

    this._pausedAt = null;
    this._quizState.resume();

    this._emitEvent({
      type: 'resumed',
      timestamp: Date.now(),
      quizState: this._quizState.state,
      pauseState: this._pauseState,
      autoAdvanceRemaining: this._autoAdvanceRemaining ?? undefined
    });

    return true;
  }

  /**
   * Gets the time the quiz was paused at.
   */
  get pausedAt(): number | null {
    return this._pausedAt;
  }

  /**
   * Gets how long the quiz has been paused in ms.
   */
  get pausedDuration(): number {
    if (!this._pausedAt) return 0;
    return Date.now() - this._pausedAt;
  }

  // ============================================================
  // Reset & Cleanup
  // ============================================================

  /**
   * Resets the quiz to initial state.
   */
  public reset(): void {
    this._clearAutoAdvanceTimer();
    this._feedbackManager.clearAllFeedback();
    this._quizState.reset();
    this._generator.reset();
    this._validator.resetAttempts();
    
    this._activeZone = null;
    this._displayedQuestion = null;
    this._pauseState = 'running';
    this._pausedAt = null;

    this._emitEvent({
      type: 'quizReset',
      timestamp: Date.now(),
      quizState: this._quizState.state,
      pauseState: this._pauseState
    });
  }

  /**
   * Gets the final quiz result (only available when quiz is complete).
   */
  public getResult(): QuizResult | null {
    return this._quizState.getResult();
  }

  /**
   * Updates flow controller configuration.
   * @param config Configuration to update
   * @returns true if updated successfully (quiz must not be active)
   */
  public updateConfig(config: FlowControllerConfig): boolean {
    if (this._quizState.isActive) {
      return false;
    }

    if (config.autoAdvance !== undefined) {
      this._autoAdvance = config.autoAdvance;
    }
    if (config.autoAdvanceDelay !== undefined) {
      this._autoAdvanceDelay = config.autoAdvanceDelay;
    }
    if (config.autoShowHint !== undefined) {
      this._autoShowHint = config.autoShowHint;
    }
    if (config.quizConfig) {
      this._quizState.updateConfig(config.quizConfig);
    }
    if (config.generatorConfig) {
      this._generator.updateConfig(config.generatorConfig);
    }
    if (config.feedbackConfig) {
      this._feedbackManager.updateConfig(config.feedbackConfig);
    }

    return true;
  }

  /**
   * Cleans up all resources.
   */
  public dispose(): void {
    this._clearAutoAdvanceTimer();
    this._feedbackManager.dispose();
    this._quizState.removeAllListeners();
    this._listeners.clear();
    this._activeZone = null;
    this._displayedQuestion = null;
  }

  // ============================================================
  // Event System
  // ============================================================

  /**
   * Subscribes to flow events.
   * @param eventType The event type to listen for
   * @param listener The callback function
   * @returns Unsubscribe function
   */
  public on(eventType: FlowEventType, listener: FlowEventListener): () => void {
    if (!this._listeners.has(eventType)) {
      this._listeners.set(eventType, new Set());
    }
    this._listeners.get(eventType)!.add(listener);

    return () => {
      this._listeners.get(eventType)?.delete(listener);
    };
  }

  /**
   * Removes an event listener.
   * @param eventType The event type
   * @param listener The callback function to remove
   */
  public off(eventType: FlowEventType, listener: FlowEventListener): void {
    this._listeners.get(eventType)?.delete(listener);
  }

  /**
   * Removes all listeners for an event type, or all listeners if no type specified.
   * @param eventType Optional event type
   */
  public removeAllListeners(eventType?: FlowEventType): void {
    if (eventType) {
      this._listeners.delete(eventType);
    } else {
      this._listeners.clear();
    }
  }

  /**
   * Emits an event to all registered listeners.
   */
  private _emitEvent(event: FlowEvent): void {
    this._listeners.get(event.type)?.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in flow event listener for ${event.type}:`, error);
      }
    });
  }
}
