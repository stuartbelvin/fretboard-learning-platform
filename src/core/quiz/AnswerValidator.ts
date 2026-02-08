import { Note, CHROMATIC_SCALE_SHARPS, ENHARMONIC_MAP, FLAT_TO_SHARP_MAP } from '../music-theory/Note';
import type { PitchClass, FlatPitchClass, NoteName } from '../music-theory/Note';

/**
 * Result of an answer validation.
 */
export interface ValidationResult {
  /** Whether the answer is correct */
  isCorrect: boolean;
  /** The clicked note's pitch class */
  clickedPitchClass: PitchClass;
  /** The target pitch class */
  targetPitchClass: PitchClass;
  /** Whether the answer was enharmonically equivalent (e.g., C# vs Db) */
  wasEnharmonicMatch: boolean;
  /** Whether the notes are at the exact same pitch (same MIDI number) */
  isExactPitchMatch: boolean;
  /** Human-readable feedback message */
  feedbackMessage: string;
}

/**
 * Configuration for attempt tracking.
 */
export interface AttemptConfig {
  /** Maximum attempts before hint is triggered (default: 3) */
  maxAttempts: number;
  /** Whether to allow unlimited attempts (default: false) */
  unlimitedAttempts: boolean;
}

/**
 * Default attempt configuration.
 */
export const DEFAULT_ATTEMPT_CONFIG: AttemptConfig = {
  maxAttempts: 3,
  unlimitedAttempts: false
};

/**
 * State of attempt tracking for a single question.
 */
export interface AttemptState {
  /** Number of attempts made */
  attempts: number;
  /** Whether max attempts has been reached */
  maxAttemptsReached: boolean;
  /** Whether a hint should be shown */
  shouldShowHint: boolean;
  /** Remaining attempts before hint */
  remainingAttempts: number;
  /** History of incorrect pitch classes tried */
  incorrectAttempts: PitchClass[];
}

/**
 * AnswerValidator provides methods for validating quiz answers
 * with support for enharmonic equivalents and attempt tracking.
 * 
 * This class handles:
 * - Pitch class comparison (C# === Db)
 * - Enharmonic equivalent detection
 * - Attempt counting and hint triggering
 * - Validation feedback generation
 */
export class AnswerValidator {
  private attemptConfig: AttemptConfig;
  private currentAttempts: number = 0;
  private incorrectAttempts: PitchClass[] = [];

  constructor(config: Partial<AttemptConfig> = {}) {
    this.attemptConfig = { ...DEFAULT_ATTEMPT_CONFIG, ...config };
  }

  // ============================================================
  // Static Validation Methods
  // ============================================================

  /**
   * Normalizes any note name (sharp or flat) to its canonical sharp form.
   * This is the core of enharmonic handling.
   * 
   * @param noteName A note name in any format (C#, Db, etc.)
   * @returns The canonical PitchClass in sharp notation
   */
  public static normalizeToPitchClass(noteName: NoteName): PitchClass {
    // Check if it's already a sharp/natural pitch class
    if (CHROMATIC_SCALE_SHARPS.includes(noteName as PitchClass)) {
      return noteName as PitchClass;
    }
    // Must be a flat - convert to sharp
    return FLAT_TO_SHARP_MAP[noteName as FlatPitchClass];
  }

  /**
   * Checks if two note names are enharmonically equivalent.
   * For example, C# and Db are enharmonic equivalents.
   * 
   * @param noteName1 First note name
   * @param noteName2 Second note name
   * @returns true if the notes represent the same pitch class
   */
  public static areEnharmonicEquivalent(noteName1: NoteName, noteName2: NoteName): boolean {
    return AnswerValidator.normalizeToPitchClass(noteName1) === 
           AnswerValidator.normalizeToPitchClass(noteName2);
  }

  /**
   * Gets all enharmonic spellings for a pitch class.
   * 
   * @param pitchClass A pitch class in sharp notation
   * @returns Array of all valid spellings for this pitch class
   */
  public static getEnharmonicSpellings(pitchClass: PitchClass): NoteName[] {
    const flatEquivalent = ENHARMONIC_MAP[pitchClass];
    
    // If the note is natural (no accidental), it has no enharmonic
    if (pitchClass === flatEquivalent) {
      return [pitchClass];
    }
    
    // Return both sharp and flat spellings
    return [pitchClass, flatEquivalent];
  }

  /**
   * Validates if a clicked note matches the target pitch class.
   * This is the primary validation method.
   * 
   * @param clickedNote The Note object that was clicked
   * @param targetPitchClass The pitch class the user should find
   * @returns Detailed validation result
   */
  public static validateAnswer(clickedNote: Note, targetPitchClass: PitchClass): ValidationResult {
    const clickedPitchClass = clickedNote.pitchClass;
    const isCorrect = clickedPitchClass === targetPitchClass;
    
    // Check if this would have been correct with a different spelling
    // (This is informational - in our system, all pitch classes are stored as sharps)
    const wasEnharmonicMatch = isCorrect;
    
    // Generate feedback message
    let feedbackMessage: string;
    if (isCorrect) {
      feedbackMessage = `Correct! That is ${targetPitchClass}.`;
    } else {
      const clickedName = clickedNote.getDisplayName('sharps');
      feedbackMessage = `Incorrect. You clicked ${clickedName}, but the target was ${targetPitchClass}.`;
    }

    return {
      isCorrect,
      clickedPitchClass,
      targetPitchClass,
      wasEnharmonicMatch,
      isExactPitchMatch: isCorrect,
      feedbackMessage
    };
  }

  /**
   * Validates if a clicked note matches the target note exactly.
   * This checks both pitch class AND octave (MIDI number match).
   * 
   * @param clickedNote The Note object that was clicked
   * @param targetNote The exact Note to find
   * @returns Detailed validation result
   */
  public static validateExactNote(clickedNote: Note, targetNote: Note): ValidationResult {
    const clickedPitchClass = clickedNote.pitchClass;
    const targetPitchClass = targetNote.pitchClass;
    const pitchClassMatch = clickedPitchClass === targetPitchClass;
    const exactMatch = clickedNote.midiNumber === targetNote.midiNumber;
    
    let feedbackMessage: string;
    if (exactMatch) {
      feedbackMessage = `Correct! That is ${targetNote.getFullName()}.`;
    } else if (pitchClassMatch) {
      feedbackMessage = `You found ${targetPitchClass}, but in a different octave.`;
    } else {
      feedbackMessage = `Incorrect. You clicked ${clickedNote.getFullName()}, but the target was ${targetNote.getFullName()}.`;
    }

    return {
      isCorrect: pitchClassMatch, // Pitch class match is considered correct for note identification
      clickedPitchClass,
      targetPitchClass,
      wasEnharmonicMatch: pitchClassMatch,
      isExactPitchMatch: exactMatch,
      feedbackMessage
    };
  }

  // ============================================================
  // Instance Methods (Attempt Tracking)
  // ============================================================

  /**
   * Updates the attempt configuration.
   */
  public updateConfig(config: Partial<AttemptConfig>): void {
    this.attemptConfig = { ...this.attemptConfig, ...config };
  }

  /**
   * Gets the current configuration.
   */
  public getConfig(): Readonly<AttemptConfig> {
    return { ...this.attemptConfig };
  }

  /**
   * Resets the attempt counter for a new question.
   */
  public resetAttempts(): void {
    this.currentAttempts = 0;
    this.incorrectAttempts = [];
  }

  /**
   * Records an attempt and returns the current attempt state.
   * Call this after each answer submission.
   * 
   * @param wasCorrect Whether the attempt was correct
   * @param clickedPitchClass The pitch class that was clicked (for incorrect tracking)
   * @returns Current attempt state
   */
  public recordAttempt(wasCorrect: boolean, clickedPitchClass?: PitchClass): AttemptState {
    this.currentAttempts++;
    
    if (!wasCorrect && clickedPitchClass) {
      this.incorrectAttempts.push(clickedPitchClass);
    }

    return this.getAttemptState();
  }

  /**
   * Gets the current attempt state without recording a new attempt.
   */
  public getAttemptState(): AttemptState {
    const maxReached = !this.attemptConfig.unlimitedAttempts && 
                       this.currentAttempts >= this.attemptConfig.maxAttempts;
    
    const remaining = this.attemptConfig.unlimitedAttempts
      ? Infinity
      : Math.max(0, this.attemptConfig.maxAttempts - this.currentAttempts);

    return {
      attempts: this.currentAttempts,
      maxAttemptsReached: maxReached,
      shouldShowHint: maxReached,
      remainingAttempts: remaining,
      incorrectAttempts: [...this.incorrectAttempts]
    };
  }

  /**
   * Checks if the user can make more attempts.
   */
  public canAttempt(): boolean {
    if (this.attemptConfig.unlimitedAttempts) {
      return true;
    }
    return this.currentAttempts < this.attemptConfig.maxAttempts;
  }

  /**
   * Gets the number of remaining attempts.
   */
  public getRemainingAttempts(): number {
    if (this.attemptConfig.unlimitedAttempts) {
      return Infinity;
    }
    return Math.max(0, this.attemptConfig.maxAttempts - this.currentAttempts);
  }

  // ============================================================
  // Combined Validation with Attempt Tracking
  // ============================================================

  /**
   * Validates an answer and tracks the attempt in one call.
   * This is the main method for quiz flow integration.
   * 
   * @param clickedNote The Note object that was clicked
   * @param targetPitchClass The pitch class the user should find
   * @returns Object containing both validation result and attempt state
   */
  public validateAndTrack(
    clickedNote: Note,
    targetPitchClass: PitchClass
  ): { validation: ValidationResult; attemptState: AttemptState } {
    const validation = AnswerValidator.validateAnswer(clickedNote, targetPitchClass);
    const attemptState = this.recordAttempt(validation.isCorrect, clickedNote.pitchClass);
    
    return { validation, attemptState };
  }
}

/**
 * Pitch class validation map for testing all 12 pitch classes.
 * Maps each pitch class to its valid representations (sharp and flat).
 */
export const PITCH_CLASS_VALIDATION_MAP: Record<PitchClass, { sharp: PitchClass; flat: FlatPitchClass; isNatural: boolean }> = {
  'C':  { sharp: 'C',  flat: 'C',  isNatural: true },
  'C#': { sharp: 'C#', flat: 'Db', isNatural: false },
  'D':  { sharp: 'D',  flat: 'D',  isNatural: true },
  'D#': { sharp: 'D#', flat: 'Eb', isNatural: false },
  'E':  { sharp: 'E',  flat: 'E',  isNatural: true },
  'F':  { sharp: 'F',  flat: 'F',  isNatural: true },
  'F#': { sharp: 'F#', flat: 'Gb', isNatural: false },
  'G':  { sharp: 'G',  flat: 'G',  isNatural: true },
  'G#': { sharp: 'G#', flat: 'Ab', isNatural: false },
  'A':  { sharp: 'A',  flat: 'A',  isNatural: true },
  'A#': { sharp: 'A#', flat: 'Bb', isNatural: false },
  'B':  { sharp: 'B',  flat: 'B',  isNatural: true }
};
