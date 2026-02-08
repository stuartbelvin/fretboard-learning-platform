/**
 * ProgressiveQuizState - Manages progressive difficulty for note quiz
 * 
 * Tracks per-note performance (accuracy + timing) and determines which notes
 * are unlocked based on performance thresholds.
 * 
 * Notes are unlocked sequentially starting from the open E string (E2),
 * progressing up the frets: E, F, F#, G, G#, A, A#, B, C, C#, D, D#
 * (frets 0-11 on the low E string)
 */

import type { PitchClass } from '../music-theory/Note';

// ============================================================================
// Configuration Constants (easily tunable)
// ============================================================================

/**
 * Configuration for progressive difficulty thresholds.
 * These values can be adjusted to tune the difficulty progression.
 */
export interface ProgressiveQuizConfig {
  /** Minimum accuracy % required to unlock next note (default: 80) */
  accuracyThreshold: number;
  /** Maximum average answer time in seconds to unlock next note (default: 3) */
  averageTimeThreshold: number;
  /** Answer times above this value in seconds are ignored (default: 20) */
  maxAnswerTimeToCount: number;
  /** Minimum attempts required before evaluating unlock criteria (default: 3) */
  minAttemptsToUnlock: number;
  /** Delay in ms before showing next question after correct answer (default: 300) */
  nextNoteDelay: number;
  /** Weight multiplier for notes with low accuracy - higher = more frequent (default: 2.0) */
  lowAccuracyWeight: number;
  /** Weight multiplier for unlearned/new notes (default: 1.5) */
  unlearnedNoteWeight: number;
  /** Accuracy threshold below which a note is considered "struggling" (default: 70) */
  strugglingAccuracyThreshold: number;
  /** Minimum attempts before note is considered "learned" (default: 5) */
  minAttemptsForLearned: number;
}

/**
 * Default progressive quiz configuration.
 */
export const DEFAULT_PROGRESSIVE_CONFIG: ProgressiveQuizConfig = {
  accuracyThreshold: 80,        // 80% accuracy required
  averageTimeThreshold: 3,      // Under 3 seconds average
  maxAnswerTimeToCount: 20,     // Ignore answers over 20 seconds
  minAttemptsToUnlock: 3,       // At least 3 attempts before unlocking
  nextNoteDelay: 800,           // 800ms delay before next note (more visible feedback)
  lowAccuracyWeight: 2.0,       // Notes with low accuracy appear 2x more often
  unlearnedNoteWeight: 2.0,     // New/unlearned notes appear 2x more often
  strugglingAccuracyThreshold: 70, // Notes below 70% accuracy are "struggling"
  minAttemptsForLearned: 3,     // Need 3+ attempts to be considered "learned"
};

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Performance data for a single note position (fret on E string).
 */
export interface NotePerformanceData {
  /** Total number of attempts for this note */
  attempts: number;
  /** Number of correct answers */
  correct: number;
  /** Array of answer times in seconds (only includes times <= maxAnswerTimeToCount) */
  answerTimes: number[];
  /** Timestamp of last attempt */
  lastAttemptTime: number;
}

/**
 * Complete performance tracking for all E string notes.
 * Key is the fret number (0-11).
 */
export type EStringPerformance = Map<number, NotePerformanceData>;

/**
 * Computed statistics for a note.
 */
export interface NoteStats {
  /** Fret number (0-11) */
  fret: number;
  /** Pitch class at this fret */
  pitchClass: PitchClass;
  /** Current accuracy percentage (0-100) */
  accuracy: number;
  /** Average answer time in seconds (or null if no valid times) */
  averageTime: number | null;
  /** Total attempts */
  attempts: number;
  /** Correct answers */
  correct: number;
  /** Whether this note is unlocked */
  isUnlocked: boolean;
  /** Whether this note meets the unlock criteria for the next note */
  meetsUnlockCriteria: boolean;
}

/**
 * E string notes in order from fret 0 to fret 11.
 */
export const E_STRING_NOTES: PitchClass[] = [
  'E',   // Fret 0 (open string)
  'F',   // Fret 1
  'F#',  // Fret 2
  'G',   // Fret 3
  'G#',  // Fret 4
  'A',   // Fret 5
  'A#',  // Fret 6
  'B',   // Fret 7
  'C',   // Fret 8
  'C#',  // Fret 9
  'D',   // Fret 10
  'D#',  // Fret 11
];

/**
 * Get the pitch class for a fret on the E string.
 */
export function getPitchClassForFret(fret: number): PitchClass {
  if (fret < 0 || fret > 11) {
    throw new Error(`Fret must be between 0 and 11, got ${fret}`);
  }
  return E_STRING_NOTES[fret];
}

/**
 * Get the fret number for a pitch class on the E string (first occurrence).
 */
export function getFretForPitchClass(pitchClass: PitchClass): number {
  const index = E_STRING_NOTES.indexOf(pitchClass);
  if (index === -1) {
    throw new Error(`Pitch class ${pitchClass} not found in E string notes`);
  }
  return index;
}

// ============================================================================
// ProgressiveQuizState Class
// ============================================================================

/**
 * Manages the progressive difficulty state for the note quiz.
 * 
 * The quiz starts with only fret 0 (E) unlocked. As the user demonstrates
 * mastery (accuracy >= threshold AND average time < threshold), the next
 * note is unlocked.
 */
export class ProgressiveQuizState {
  private _performance: EStringPerformance;
  private _config: ProgressiveQuizConfig;
  private _unlockedFrets: number;

  constructor(
    config: Partial<ProgressiveQuizConfig> = {},
    initialPerformance?: EStringPerformance,
    initialUnlockedFrets?: number
  ) {
    this._config = { ...DEFAULT_PROGRESSIVE_CONFIG, ...config };
    this._performance = initialPerformance || new Map();
    
    // Initialize with at least fret 0 unlocked
    this._unlockedFrets = initialUnlockedFrets ?? 1;
    
    // Initialize performance data for all frets
    for (let fret = 0; fret <= 11; fret++) {
      if (!this._performance.has(fret)) {
        this._performance.set(fret, {
          attempts: 0,
          correct: 0,
          answerTimes: [],
          lastAttemptTime: 0,
        });
      }
    }
  }

  // ============================================================================
  // Getters
  // ============================================================================

  /** Get the current configuration */
  get config(): ProgressiveQuizConfig {
    return { ...this._config };
  }

  /** Get the number of unlocked frets (1 = only fret 0, 12 = all frets) */
  get unlockedFrets(): number {
    return this._unlockedFrets;
  }

  /** Get the highest unlocked fret index (0-based) */
  get highestUnlockedFret(): number {
    return this._unlockedFrets - 1;
  }

  /** Check if all notes are unlocked */
  get allNotesUnlocked(): boolean {
    return this._unlockedFrets >= 12;
  }

  /** Get set of unlocked pitch classes */
  get unlockedPitchClasses(): Set<PitchClass> {
    const unlocked = new Set<PitchClass>();
    for (let fret = 0; fret < this._unlockedFrets; fret++) {
      unlocked.add(E_STRING_NOTES[fret]);
    }
    return unlocked;
  }

  // ============================================================================
  // Performance Recording
  // ============================================================================

  /**
   * Record an answer attempt for a specific fret.
   * 
   * @param fret - The fret number (0-11)
   * @param correct - Whether the answer was correct
   * @param answerTimeSeconds - Time taken to answer in seconds
   */
  recordAttempt(fret: number, correct: boolean, answerTimeSeconds: number): void {
    if (fret < 0 || fret > 11) {
      throw new Error(`Fret must be between 0 and 11, got ${fret}`);
    }

    const performance = this._performance.get(fret)!;
    
    performance.attempts++;
    if (correct) {
      performance.correct++;
    }
    
    // Only record answer time if it's below the threshold
    if (answerTimeSeconds <= this._config.maxAnswerTimeToCount) {
      performance.answerTimes.push(answerTimeSeconds);
    }
    
    performance.lastAttemptTime = Date.now();

    // Check if we should unlock the next note
    this._checkAndUnlockNextNote();
  }

  // ============================================================================
  // Statistics & Queries
  // ============================================================================

  /**
   * Get statistics for a specific fret.
   */
  getNoteStats(fret: number): NoteStats {
    if (fret < 0 || fret > 11) {
      throw new Error(`Fret must be between 0 and 11, got ${fret}`);
    }

    const performance = this._performance.get(fret)!;
    const accuracy = performance.attempts > 0
      ? (performance.correct / performance.attempts) * 100
      : 0;
    const averageTime = performance.answerTimes.length > 0
      ? performance.answerTimes.reduce((a, b) => a + b, 0) / performance.answerTimes.length
      : null;
    
    const isUnlocked = fret < this._unlockedFrets;
    const meetsUnlockCriteria = this._checkUnlockCriteria(fret);

    return {
      fret,
      pitchClass: E_STRING_NOTES[fret],
      accuracy,
      averageTime,
      attempts: performance.attempts,
      correct: performance.correct,
      isUnlocked,
      meetsUnlockCriteria,
    };
  }

  /**
   * Get statistics for all E string notes.
   */
  getAllNoteStats(): NoteStats[] {
    const stats: NoteStats[] = [];
    for (let fret = 0; fret <= 11; fret++) {
      stats.push(this.getNoteStats(fret));
    }
    return stats;
  }

  /**
   * Get overall statistics across all unlocked notes.
   */
  getOverallStats(): {
    totalAttempts: number;
    totalCorrect: number;
    overallAccuracy: number;
    unlockedNotes: number;
    totalNotes: number;
  } {
    let totalAttempts = 0;
    let totalCorrect = 0;

    for (let fret = 0; fret < this._unlockedFrets; fret++) {
      const performance = this._performance.get(fret)!;
      totalAttempts += performance.attempts;
      totalCorrect += performance.correct;
    }

    return {
      totalAttempts,
      totalCorrect,
      overallAccuracy: totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0,
      unlockedNotes: this._unlockedFrets,
      totalNotes: 12,
    };
  }

  /**
   * Get the raw performance data for a fret.
   */
  getPerformanceData(fret: number): NotePerformanceData | undefined {
    return this._performance.get(fret);
  }

  /**
   * Check if a specific fret is unlocked.
   */
  isFretUnlocked(fret: number): boolean {
    return fret >= 0 && fret < this._unlockedFrets;
  }

  // ============================================================================
  // Unlock Logic
  // ============================================================================

  /**
   * Check if a fret meets the unlock criteria.
   * A fret meets the criteria if:
   * - Accuracy >= accuracyThreshold
   * - Average answer time <= averageTimeThreshold
   * - At least minAttemptsToUnlock attempts
   */
  private _checkUnlockCriteria(fret: number): boolean {
    const performance = this._performance.get(fret);
    if (!performance) return false;

    // Must have minimum attempts
    if (performance.attempts < this._config.minAttemptsToUnlock) {
      return false;
    }

    // Check accuracy
    const accuracy = (performance.correct / performance.attempts) * 100;
    if (accuracy < this._config.accuracyThreshold) {
      return false;
    }

    // Check average time (need at least one valid time)
    if (performance.answerTimes.length === 0) {
      return false;
    }
    const avgTime = performance.answerTimes.reduce((a, b) => a + b, 0) / performance.answerTimes.length;
    if (avgTime > this._config.averageTimeThreshold) {
      return false;
    }

    return true;
  }

  /**
   * Check all unlocked notes to see if we should unlock the next note.
   * The next note is unlocked when ALL previously unlocked notes meet the criteria.
   */
  private _checkAndUnlockNextNote(): void {
    // If all notes are already unlocked, nothing to do
    if (this._unlockedFrets >= 12) {
      return;
    }

    // Check if ALL currently unlocked notes meet the criteria
    for (let fret = 0; fret < this._unlockedFrets; fret++) {
      if (!this._checkUnlockCriteria(fret)) {
        return; // At least one note doesn't meet criteria
      }
    }

    // All unlocked notes meet criteria - unlock the next note
    this._unlockedFrets++;
  }

  /**
   * Force unlock a specific number of frets (for testing or admin purposes).
   */
  forceUnlock(numFrets: number): void {
    this._unlockedFrets = Math.max(1, Math.min(12, numFrets));
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  /**
   * Update the configuration.
   */
  updateConfig(config: Partial<ProgressiveQuizConfig>): void {
    this._config = { ...this._config, ...config };
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  /**
   * Serialize state for persistence.
   */
  toJSON(): {
    config: ProgressiveQuizConfig;
    performance: Record<number, NotePerformanceData>;
    unlockedFrets: number;
  } {
    const performanceObj: Record<number, NotePerformanceData> = {};
    for (const [fret, data] of this._performance) {
      performanceObj[fret] = { ...data };
    }

    return {
      config: { ...this._config },
      performance: performanceObj,
      unlockedFrets: this._unlockedFrets,
    };
  }

  /**
   * Create a ProgressiveQuizState from serialized data.
   */
  static fromJSON(data: ReturnType<ProgressiveQuizState['toJSON']>): ProgressiveQuizState {
    const performance = new Map<number, NotePerformanceData>();
    for (const [fret, perfData] of Object.entries(data.performance)) {
      performance.set(Number(fret), { ...perfData });
    }

    return new ProgressiveQuizState(
      data.config,
      performance,
      data.unlockedFrets
    );
  }

  /**
   * Reset all progress (for starting over).
   */
  reset(): void {
    this._unlockedFrets = 1;
    for (let fret = 0; fret <= 11; fret++) {
      this._performance.set(fret, {
        attempts: 0,
        correct: 0,
        answerTimes: [],
        lastAttemptTime: 0,
      });
    }
  }
}
