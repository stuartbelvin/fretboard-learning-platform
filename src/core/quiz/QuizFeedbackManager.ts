import { Note } from '../music-theory/Note';

/**
 * Types of visual feedback available in quiz modes.
 */
export type FeedbackType = 'correct' | 'incorrect' | 'hint' | 'none';

/**
 * Represents the current state of visual feedback for a note.
 */
export interface FeedbackState {
  /** The note position receiving feedback */
  positionId: string;
  /** Type of feedback being shown */
  type: FeedbackType;
  /** When the feedback started (for timing) */
  startTime: number;
  /** Duration of the feedback in ms */
  duration: number;
  /** Number of pulses (for hint animation) */
  pulseCount?: number;
}

/**
 * Configuration for feedback timing and behavior.
 */
export interface FeedbackConfig {
  /** Duration of correct answer flash in ms (default: 500) */
  correctDuration: number;
  /** Duration of incorrect answer flash in ms (default: 500) */
  incorrectDuration: number;
  /** Duration of a single hint pulse in ms (default: 500) */
  hintPulseDuration: number;
  /** Number of hint pulses to show (default: 3) */
  hintPulseCount: number;
  /** Callback when feedback animation completes */
  onFeedbackComplete?: (type: FeedbackType, positionId: string) => void;
}

/**
 * Default feedback configuration.
 */
export const DEFAULT_FEEDBACK_CONFIG: FeedbackConfig = {
  correctDuration: 500,
  incorrectDuration: 500,
  hintPulseDuration: 500,
  hintPulseCount: 3,
};

/**
 * Event types emitted by the feedback manager.
 */
export type FeedbackEventType = 
  | 'feedbackStart'
  | 'feedbackComplete'
  | 'feedbackClear';

/**
 * Event payload for feedback events.
 */
export interface FeedbackEvent {
  type: FeedbackEventType;
  feedbackType: FeedbackType;
  positionId: string;
  note?: Note;
}

/**
 * Event listener callback type.
 */
export type FeedbackEventListener = (event: FeedbackEvent) => void;

/**
 * QuizFeedbackManager handles visual feedback for quiz interactions.
 * 
 * Provides:
 * - Correct answer feedback: Green flash (500ms)
 * - Incorrect answer feedback: Red flash (500ms)
 * - Hint feedback: Green pulse 3 times (500ms each)
 * 
 * The manager tracks active feedback states and automatically clears them
 * after the specified duration.
 */
export class QuizFeedbackManager {
  private _config: FeedbackConfig;
  private _activeFeedback: Map<string, FeedbackState> = new Map();
  private _pendingTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private _listeners: Map<FeedbackEventType, Set<FeedbackEventListener>> = new Map();

  constructor(config: Partial<FeedbackConfig> = {}) {
    this._config = { ...DEFAULT_FEEDBACK_CONFIG, ...config };
  }

  // ============================================================
  // Public Getters
  // ============================================================

  /** Current configuration (immutable copy) */
  get config(): Readonly<FeedbackConfig> {
    return { ...this._config };
  }

  /** Number of active feedback animations */
  get activeFeedbackCount(): number {
    return this._activeFeedback.size;
  }

  /** Whether any feedback is currently active */
  get hasFeedback(): boolean {
    return this._activeFeedback.size > 0;
  }

  // ============================================================
  // Configuration
  // ============================================================

  /**
   * Updates the feedback configuration.
   * @param config Partial configuration to merge
   */
  public updateConfig(config: Partial<FeedbackConfig>): void {
    this._config = { ...this._config, ...config };
  }

  // ============================================================
  // Feedback Actions
  // ============================================================

  /**
   * Shows correct answer feedback (green flash) on a note.
   * @param note The note that was correctly answered
   * @returns The feedback state created
   */
  public showCorrectFeedback(note: Note): FeedbackState {
    const positionId = note.getPositionId();
    const duration = this._config.correctDuration;

    const state: FeedbackState = {
      positionId,
      type: 'correct',
      startTime: Date.now(),
      duration,
    };

    this._setFeedback(positionId, state, note);
    this._scheduleCleanup(positionId, duration);

    return state;
  }

  /**
   * Shows incorrect answer feedback (red flash) on a note.
   * @param note The note that was incorrectly clicked
   * @returns The feedback state created
   */
  public showIncorrectFeedback(note: Note): FeedbackState {
    const positionId = note.getPositionId();
    const duration = this._config.incorrectDuration;

    const state: FeedbackState = {
      positionId,
      type: 'incorrect',
      startTime: Date.now(),
      duration,
    };

    this._setFeedback(positionId, state, note);
    this._scheduleCleanup(positionId, duration);

    return state;
  }

  /**
   * Shows hint feedback (green pulse) on the correct note.
   * The hint pulses 3 times by default.
   * @param note The correct note to highlight as a hint
   * @returns The feedback state created
   */
  public showHintFeedback(note: Note): FeedbackState {
    const positionId = note.getPositionId();
    const pulseCount = this._config.hintPulseCount;
    const duration = this._config.hintPulseDuration * pulseCount;

    const state: FeedbackState = {
      positionId,
      type: 'hint',
      startTime: Date.now(),
      duration,
      pulseCount,
    };

    this._setFeedback(positionId, state, note);
    this._scheduleCleanup(positionId, duration);

    return state;
  }

  /**
   * Shows feedback of a specific type on a note.
   * @param note The note to show feedback on
   * @param type The type of feedback to show
   * @returns The feedback state created, or null if type is 'none'
   */
  public showFeedback(note: Note, type: FeedbackType): FeedbackState | null {
    switch (type) {
      case 'correct':
        return this.showCorrectFeedback(note);
      case 'incorrect':
        return this.showIncorrectFeedback(note);
      case 'hint':
        return this.showHintFeedback(note);
      case 'none':
        return null;
    }
  }

  // ============================================================
  // Feedback State Queries
  // ============================================================

  /**
   * Gets the feedback state for a specific note position.
   * @param positionId The position ID (e.g., "s1f5")
   * @returns The feedback state or undefined if no active feedback
   */
  public getFeedbackState(positionId: string): FeedbackState | undefined {
    return this._activeFeedback.get(positionId);
  }

  /**
   * Gets the feedback state for a note.
   * @param note The note to check
   * @returns The feedback state or undefined if no active feedback
   */
  public getFeedbackForNote(note: Note): FeedbackState | undefined {
    return this._activeFeedback.get(note.getPositionId());
  }

  /**
   * Gets the feedback type for a specific note position.
   * @param positionId The position ID (e.g., "s1f5")
   * @returns The feedback type, or 'none' if no active feedback
   */
  public getFeedbackType(positionId: string): FeedbackType {
    return this._activeFeedback.get(positionId)?.type ?? 'none';
  }

  /**
   * Checks if a position has active feedback.
   * @param positionId The position ID to check
   * @returns true if feedback is active on this position
   */
  public hasFeedbackAt(positionId: string): boolean {
    return this._activeFeedback.has(positionId);
  }

  /**
   * Checks if a note has active feedback.
   * @param note The note to check
   * @returns true if feedback is active on this note
   */
  public hasNoteActiveFeedback(note: Note): boolean {
    return this._activeFeedback.has(note.getPositionId());
  }

  /**
   * Gets all active feedback states.
   * @returns Array of all active feedback states
   */
  public getAllActiveFeedback(): FeedbackState[] {
    return Array.from(this._activeFeedback.values());
  }

  /**
   * Gets all position IDs with active feedback.
   * @returns Array of position IDs with active feedback
   */
  public getActiveFeedbackPositions(): string[] {
    return Array.from(this._activeFeedback.keys());
  }

  /**
   * Gets the remaining duration for a feedback animation.
   * @param positionId The position ID to check
   * @returns Remaining duration in ms, or 0 if no active feedback
   */
  public getRemainingDuration(positionId: string): number {
    const state = this._activeFeedback.get(positionId);
    if (!state) return 0;

    const elapsed = Date.now() - state.startTime;
    return Math.max(0, state.duration - elapsed);
  }

  // ============================================================
  // Feedback Clearing
  // ============================================================

  /**
   * Clears feedback for a specific position.
   * @param positionId The position ID to clear
   * @returns true if feedback was cleared, false if none existed
   */
  public clearFeedback(positionId: string): boolean {
    if (!this._activeFeedback.has(positionId)) {
      return false;
    }

    const state = this._activeFeedback.get(positionId)!;
    
    // Clear any pending timeout
    const timeout = this._pendingTimeouts.get(positionId);
    if (timeout) {
      clearTimeout(timeout);
      this._pendingTimeouts.delete(positionId);
    }

    this._activeFeedback.delete(positionId);

    this._emitEvent({
      type: 'feedbackClear',
      feedbackType: state.type,
      positionId,
    });

    return true;
  }

  /**
   * Clears feedback for a specific note.
   * @param note The note to clear feedback for
   * @returns true if feedback was cleared, false if none existed
   */
  public clearFeedbackForNote(note: Note): boolean {
    return this.clearFeedback(note.getPositionId());
  }

  /**
   * Clears all active feedback.
   */
  public clearAllFeedback(): void {
    // Clear all pending timeouts
    for (const timeout of this._pendingTimeouts.values()) {
      clearTimeout(timeout);
    }
    this._pendingTimeouts.clear();

    // Emit clear events for all active feedback
    for (const [positionId, state] of this._activeFeedback) {
      this._emitEvent({
        type: 'feedbackClear',
        feedbackType: state.type,
        positionId,
      });
    }

    this._activeFeedback.clear();
  }

  // ============================================================
  // Event System
  // ============================================================

  /**
   * Subscribes to feedback events.
   * @param eventType The event type to listen for
   * @param listener The callback function
   * @returns Unsubscribe function
   */
  public on(eventType: FeedbackEventType, listener: FeedbackEventListener): () => void {
    if (!this._listeners.has(eventType)) {
      this._listeners.set(eventType, new Set());
    }
    this._listeners.get(eventType)!.add(listener);

    return () => this.off(eventType, listener);
  }

  /**
   * Unsubscribes from feedback events.
   * @param eventType The event type
   * @param listener The callback function to remove
   */
  public off(eventType: FeedbackEventType, listener: FeedbackEventListener): void {
    this._listeners.get(eventType)?.delete(listener);
  }

  /**
   * Removes all listeners for a specific event type, or all listeners.
   * @param eventType Optional event type to clear listeners for
   */
  public removeAllListeners(eventType?: FeedbackEventType): void {
    if (eventType) {
      this._listeners.get(eventType)?.clear();
    } else {
      this._listeners.clear();
    }
  }

  // ============================================================
  // Cleanup
  // ============================================================

  /**
   * Cleans up all resources (timeouts, listeners, feedback states).
   * Call this when destroying the manager.
   */
  public dispose(): void {
    this.clearAllFeedback();
    this.removeAllListeners();
  }

  // ============================================================
  // Private Methods
  // ============================================================

  /**
   * Sets feedback state and emits start event.
   */
  private _setFeedback(positionId: string, state: FeedbackState, note?: Note): void {
    // Clear any existing feedback at this position first
    if (this._activeFeedback.has(positionId)) {
      const existingTimeout = this._pendingTimeouts.get(positionId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        this._pendingTimeouts.delete(positionId);
      }
    }

    this._activeFeedback.set(positionId, state);

    this._emitEvent({
      type: 'feedbackStart',
      feedbackType: state.type,
      positionId,
      note,
    });
  }

  /**
   * Schedules cleanup of feedback after duration.
   */
  private _scheduleCleanup(positionId: string, duration: number): void {
    const timeout = setTimeout(() => {
      this._completeFeedback(positionId);
    }, duration);

    this._pendingTimeouts.set(positionId, timeout);
  }

  /**
   * Completes feedback and emits complete event.
   */
  private _completeFeedback(positionId: string): void {
    const state = this._activeFeedback.get(positionId);
    if (!state) return;

    this._activeFeedback.delete(positionId);
    this._pendingTimeouts.delete(positionId);

    this._emitEvent({
      type: 'feedbackComplete',
      feedbackType: state.type,
      positionId,
    });

    // Call the onFeedbackComplete callback if configured
    this._config.onFeedbackComplete?.(state.type, positionId);
  }

  /**
   * Emits an event to all listeners.
   */
  private _emitEvent(event: FeedbackEvent): void {
    const listeners = this._listeners.get(event.type);
    if (!listeners) return;

    for (const listener of listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in feedback event listener:', error);
      }
    }
  }
}
