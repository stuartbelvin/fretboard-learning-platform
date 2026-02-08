import { Note } from '../music-theory/Note';
import type { PitchClass } from '../music-theory/Note';
import { HighlightZone } from '../zones/HighlightZone';

/**
 * Possible states in the quiz state machine.
 */
export type QuizState = 
  | 'idle'      // Quiz not started
  | 'active'    // Quiz started, waiting for answer
  | 'answering' // Processing an answer attempt
  | 'hint'      // Showing hint after max attempts
  | 'complete'; // Quiz finished

/**
 * Result of an answer attempt.
 */
export type AnswerResult = 'correct' | 'incorrect' | 'invalid';

/**
 * Configuration for the note quiz.
 */
export interface NoteQuizConfig {
  /** Maximum attempts before showing hint (default: 3) */
  maxAttempts: number;
  /** Total number of questions in the quiz (default: 10) */
  totalQuestions: number;
  /** Auto-advance to next question after correct answer (default: true) */
  autoAdvance: boolean;
  /** Delay in ms before auto-advancing (default: 1000) */
  autoAdvanceDelay: number;
}

/**
 * Default quiz configuration.
 */
export const DEFAULT_QUIZ_CONFIG: NoteQuizConfig = {
  maxAttempts: 3,
  totalQuestions: 10,
  autoAdvance: true,
  autoAdvanceDelay: 1000
};

/**
 * Represents a single quiz question.
 */
export interface QuizQuestion {
  /** The target note to find */
  targetNote: Note;
  /** The pitch class the user needs to find */
  targetPitchClass: PitchClass;
  /** Question number (1-based) */
  questionNumber: number;
  /** Formatted question text */
  questionText: string;
}

/**
 * Represents the result of a completed quiz.
 */
export interface QuizResult {
  /** Total questions answered */
  totalQuestions: number;
  /** Number of correct answers */
  correctAnswers: number;
  /** Number of questions where hints were used */
  hintsUsed: number;
  /** Total attempts across all questions */
  totalAttempts: number;
  /** Accuracy percentage (0-100) */
  accuracy: number;
  /** Average attempts per correct answer */
  averageAttempts: number;
}

/**
 * Statistics for the current question.
 */
export interface QuestionStats {
  /** Number of attempts on current question */
  attempts: number;
  /** Whether hint was shown for this question */
  hintShown: boolean;
  /** Whether question was answered correctly */
  answeredCorrectly: boolean;
}

/**
 * Event types emitted by the quiz state machine.
 */
export type QuizEventType = 
  | 'stateChange'
  | 'questionGenerated'
  | 'answerAttempt'
  | 'correctAnswer'
  | 'incorrectAnswer'
  | 'hintShown'
  | 'quizComplete';

/**
 * Event payload for quiz events.
 */
export interface QuizEvent {
  type: QuizEventType;
  state: QuizState;
  previousState?: QuizState;
  question?: QuizQuestion;
  answerResult?: AnswerResult;
  result?: QuizResult;
  attemptNumber?: number;
  clickedNote?: Note;
}

/**
 * Event listener callback type.
 */
export type QuizEventListener = (event: QuizEvent) => void;

/**
 * NoteQuizState manages the state machine for the Note Identification Quiz.
 * 
 * State Transitions:
 * - idle -> active: start()
 * - active -> answering: submitAnswer()
 * - answering -> active: correct answer (advances to next question)
 * - answering -> active: incorrect answer (tries again)
 * - answering -> hint: max attempts reached
 * - hint -> active: acknowledgeHint() (advances to next question)
 * - active -> complete: last question answered
 * - any -> idle: reset()
 */
export class NoteQuizState {
  // State
  private _state: QuizState = 'idle';
  private _currentQuestion: QuizQuestion | null = null;
  private _questionStats: QuestionStats = { attempts: 0, hintShown: false, answeredCorrectly: false };
  
  // Score tracking
  private _questionsAnswered: number = 0;
  private _correctAnswers: number = 0;
  private _hintsUsed: number = 0;
  private _totalAttempts: number = 0;
  
  // Configuration
  private _config: NoteQuizConfig;
  private _activeZone: HighlightZone | null = null;
  
  // Event listeners
  private _listeners: Map<QuizEventType, Set<QuizEventListener>> = new Map();

  constructor(config: Partial<NoteQuizConfig> = {}) {
    this._config = { ...DEFAULT_QUIZ_CONFIG, ...config };
  }

  // ============================================================
  // Public Getters
  // ============================================================

  /** Current quiz state */
  get state(): QuizState {
    return this._state;
  }

  /** Current question or null if not active */
  get currentQuestion(): QuizQuestion | null {
    return this._currentQuestion;
  }

  /** Statistics for the current question */
  get questionStats(): Readonly<QuestionStats> {
    return { ...this._questionStats };
  }

  /** Number of questions answered so far */
  get questionsAnswered(): number {
    return this._questionsAnswered;
  }

  /** Number of correct answers */
  get correctAnswers(): number {
    return this._correctAnswers;
  }

  /** Number of hints used */
  get hintsUsed(): number {
    return this._hintsUsed;
  }

  /** Total attempts across all questions */
  get totalAttempts(): number {
    return this._totalAttempts;
  }

  /** Quiz configuration */
  get config(): Readonly<NoteQuizConfig> {
    return { ...this._config };
  }

  /** Active zone for the quiz */
  get activeZone(): HighlightZone | null {
    return this._activeZone;
  }

  /** Whether the quiz is in a state that accepts answers */
  get canAnswer(): boolean {
    return this._state === 'active';
  }

  /** Whether the quiz can be started */
  get canStart(): boolean {
    return this._state === 'idle';
  }

  /** Whether the quiz is currently running */
  get isActive(): boolean {
    return this._state === 'active' || this._state === 'answering' || this._state === 'hint';
  }

  /** Current score as a formatted string */
  get scoreDisplay(): string {
    return `${this._correctAnswers}/${this._questionsAnswered}`;
  }

  /** Current progress as a formatted string */
  get progressDisplay(): string {
    return `Question ${this._questionsAnswered + 1} of ${this._config.totalQuestions}`;
  }

  // ============================================================
  // State Transitions
  // ============================================================

  /**
   * Starts the quiz with the given active zone.
   * @param zone The highlight zone to use for question generation
   * @returns true if quiz started successfully, false if invalid state or empty zone
   */
  public start(zone: HighlightZone): boolean {
    if (this._state !== 'idle') {
      return false;
    }

    if (zone.isEmpty()) {
      return false;
    }

    const previousState = this._state;
    this._activeZone = zone;
    this._state = 'active';
    
    // Reset all stats
    this._questionsAnswered = 0;
    this._correctAnswers = 0;
    this._hintsUsed = 0;
    this._totalAttempts = 0;
    
    this._emitEvent({
      type: 'stateChange',
      state: this._state,
      previousState
    });

    return true;
  }

  /**
   * Sets the current question. Called by question generator.
   * @param question The question to set
   * @returns true if question was set, false if invalid state
   */
  public setQuestion(question: QuizQuestion): boolean {
    if (this._state !== 'active') {
      return false;
    }

    this._currentQuestion = question;
    this._questionStats = { attempts: 0, hintShown: false, answeredCorrectly: false };

    this._emitEvent({
      type: 'questionGenerated',
      state: this._state,
      question: this._currentQuestion
    });

    return true;
  }

  /**
   * Submits an answer attempt.
   * @param clickedNote The note the user clicked
   * @returns The result of the answer attempt
   */
  public submitAnswer(clickedNote: Note): AnswerResult {
    if (this._state !== 'active' || !this._currentQuestion) {
      return 'invalid';
    }

    const previousState = this._state;
    this._state = 'answering';
    this._questionStats.attempts++;
    this._totalAttempts++;

    // Check if the clicked note matches the target pitch class
    const isCorrect = clickedNote.pitchClass === this._currentQuestion.targetPitchClass;

    this._emitEvent({
      type: 'answerAttempt',
      state: this._state,
      previousState,
      question: this._currentQuestion,
      clickedNote,
      attemptNumber: this._questionStats.attempts
    });

    if (isCorrect) {
      return this._handleCorrectAnswer(clickedNote);
    } else {
      return this._handleIncorrectAnswer(clickedNote);
    }
  }

  /**
   * Acknowledges the hint and advances to next question or completes quiz.
   * @returns true if acknowledged, false if not in hint state
   */
  public acknowledgeHint(): boolean {
    if (this._state !== 'hint') {
      return false;
    }

    this._questionsAnswered++;
    
    // Check if quiz is complete
    if (this._questionsAnswered >= this._config.totalQuestions) {
      return this._completeQuiz();
    }

    // Advance to next question
    const previousState = this._state;
    this._state = 'active';
    this._currentQuestion = null;

    this._emitEvent({
      type: 'stateChange',
      state: this._state,
      previousState
    });

    return true;
  }

  /**
   * Pauses the quiz. Quiz can be resumed from pause.
   * @returns true if paused, false if not in active state
   */
  public pause(): boolean {
    if (!this.isActive) {
      return false;
    }
    
    // For now, pausing just maintains current state
    // In a full implementation, this would handle timers, etc.
    return true;
  }

  /**
   * Resumes the quiz from pause.
   * @returns true if resumed, false if not paused
   */
  public resume(): boolean {
    if (!this.isActive) {
      return false;
    }
    return true;
  }

  /**
   * Resets the quiz to idle state.
   */
  public reset(): void {
    const previousState = this._state;
    
    this._state = 'idle';
    this._currentQuestion = null;
    this._questionStats = { attempts: 0, hintShown: false, answeredCorrectly: false };
    this._questionsAnswered = 0;
    this._correctAnswers = 0;
    this._hintsUsed = 0;
    this._totalAttempts = 0;
    this._activeZone = null;

    if (previousState !== 'idle') {
      this._emitEvent({
        type: 'stateChange',
        state: this._state,
        previousState
      });
    }
  }

  /**
   * Updates the quiz configuration.
   * @param config Partial configuration to merge
   * @returns true if config was updated, false if quiz is active
   */
  public updateConfig(config: Partial<NoteQuizConfig>): boolean {
    if (this.isActive) {
      return false;
    }

    this._config = { ...this._config, ...config };
    return true;
  }

  /**
   * Gets the final quiz result.
   * @returns QuizResult if quiz is complete, null otherwise
   */
  public getResult(): QuizResult | null {
    if (this._state !== 'complete') {
      return null;
    }

    return this._calculateResult();
  }

  // ============================================================
  // Event System
  // ============================================================

  /**
   * Subscribes to quiz events.
   * @param eventType The event type to listen for
   * @param listener The callback function
   * @returns Unsubscribe function
   */
  public on(eventType: QuizEventType, listener: QuizEventListener): () => void {
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
  public off(eventType: QuizEventType, listener: QuizEventListener): void {
    this._listeners.get(eventType)?.delete(listener);
  }

  /**
   * Removes all listeners for an event type, or all listeners if no type specified.
   * @param eventType Optional event type
   */
  public removeAllListeners(eventType?: QuizEventType): void {
    if (eventType) {
      this._listeners.delete(eventType);
    } else {
      this._listeners.clear();
    }
  }

  // ============================================================
  // Private Methods
  // ============================================================

  private _handleCorrectAnswer(clickedNote: Note): AnswerResult {
    this._questionStats.answeredCorrectly = true;
    this._correctAnswers++;
    this._questionsAnswered++;

    this._emitEvent({
      type: 'correctAnswer',
      state: this._state,
      question: this._currentQuestion!,
      clickedNote,
      attemptNumber: this._questionStats.attempts
    });

    // Check if quiz is complete
    if (this._questionsAnswered >= this._config.totalQuestions) {
      this._completeQuiz();
      return 'correct';
    }

    // Advance to next question
    this._state = 'active';
    this._currentQuestion = null;

    this._emitEvent({
      type: 'stateChange',
      state: this._state,
      previousState: 'answering'
    });

    return 'correct';
  }

  private _handleIncorrectAnswer(clickedNote: Note): AnswerResult {
    this._emitEvent({
      type: 'incorrectAnswer',
      state: this._state,
      question: this._currentQuestion!,
      clickedNote,
      attemptNumber: this._questionStats.attempts
    });

    // Check if max attempts reached
    if (this._questionStats.attempts >= this._config.maxAttempts) {
      return this._showHint();
    }

    // Return to active state for another attempt
    this._state = 'active';

    this._emitEvent({
      type: 'stateChange',
      state: this._state,
      previousState: 'answering'
    });

    return 'incorrect';
  }

  private _showHint(): AnswerResult {
    this._state = 'hint';
    this._questionStats.hintShown = true;
    this._hintsUsed++;

    this._emitEvent({
      type: 'hintShown',
      state: this._state,
      previousState: 'answering',
      question: this._currentQuestion!
    });

    return 'incorrect';
  }

  private _completeQuiz(): boolean {
    const previousState = this._state;
    this._state = 'complete';
    this._currentQuestion = null;

    const result = this._calculateResult();

    this._emitEvent({
      type: 'quizComplete',
      state: this._state,
      previousState,
      result
    });

    this._emitEvent({
      type: 'stateChange',
      state: this._state,
      previousState
    });

    return true;
  }

  private _calculateResult(): QuizResult {
    const accuracy = this._questionsAnswered > 0 
      ? Math.round((this._correctAnswers / this._questionsAnswered) * 100)
      : 0;

    const averageAttempts = this._correctAnswers > 0
      ? Math.round((this._totalAttempts / this._correctAnswers) * 100) / 100
      : 0;

    return {
      totalQuestions: this._questionsAnswered,
      correctAnswers: this._correctAnswers,
      hintsUsed: this._hintsUsed,
      totalAttempts: this._totalAttempts,
      accuracy,
      averageAttempts
    };
  }

  private _emitEvent(event: QuizEvent): void {
    // Emit to specific event listeners
    this._listeners.get(event.type)?.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in quiz event listener for ${event.type}:`, error);
      }
    });
  }
}
