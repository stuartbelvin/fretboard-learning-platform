/**
 * ProgressiveQuizState - Manages progressive difficulty for note quiz
 * 
 * Supports multi-string progression:
 * - String 6 (low E) → String 5 (A) → String 4 (D) → String 3 (G) → String 2 (B) → String 1 (high E)
 * - Each string has its own progress, starting with the open string and advancing one fret at a time
 * - 80% of questions come from the current learning string, 20% from already-learned strings
 */

import type { PitchClass } from '../music-theory/Note';

// ============================================================================
// Configuration Constants (easily tunable)
// ============================================================================

/**
 * Configuration for progressive difficulty thresholds.
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
  /** Probability of getting a question from the current learning string (default: 0.8) */
  currentStringProbability: number;
}

/**
 * Default progressive quiz configuration.
 */
export const DEFAULT_PROGRESSIVE_CONFIG: ProgressiveQuizConfig = {
  accuracyThreshold: 80,
  averageTimeThreshold: 3,
  maxAnswerTimeToCount: 20,
  minAttemptsToUnlock: 3,
  nextNoteDelay: 800,
  lowAccuracyWeight: 2.0,
  unlearnedNoteWeight: 2.0,
  strugglingAccuracyThreshold: 70,
  minAttemptsForLearned: 3,
  currentStringProbability: 0.8,
};

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Performance data for a single note position.
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
 * Performance tracking for a single string.
 * Key is the fret number (0-11).
 */
export type StringPerformance = Map<number, NotePerformanceData>;

/**
 * Performance tracking for all strings.
 * Key is the string number (1-6).
 */
export type AllStringsPerformance = Map<number, StringPerformance>;

/**
 * Computed statistics for a note.
 */
export interface NoteStats {
  /** String number (1-6) */
  string: number;
  /** Fret number (0-11) */
  fret: number;
  /** Pitch class at this position */
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
 * String progression order (from low E to high E).
 * Guitar strings are numbered 1 (high E) to 6 (low E), but we learn low to high.
 */
export const STRING_PROGRESSION: number[] = [6, 5, 4, 3, 2, 1];

/**
 * String names for display.
 */
export const STRING_NAMES: Record<number, string> = {
  6: 'Low E',
  5: 'A',
  4: 'D',
  3: 'G',
  2: 'B',
  1: 'High E',
};

/**
 * Open string pitch classes for each string (in standard tuning).
 */
export const STRING_OPEN_NOTES: Record<number, PitchClass> = {
  6: 'E',  // Low E string
  5: 'A',
  4: 'D',
  3: 'G',
  2: 'B',
  1: 'E',  // High E string
};

/**
 * Notes on each string from fret 0 to fret 11.
 * Derived from the chromatic scale starting at the open string note.
 */
const CHROMATIC: PitchClass[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getStringNotes(openNote: PitchClass): PitchClass[] {
  const startIndex = CHROMATIC.indexOf(openNote);
  const notes: PitchClass[] = [];
  for (let i = 0; i < 12; i++) {
    notes.push(CHROMATIC[(startIndex + i) % 12]);
  }
  return notes;
}

/**
 * Pre-computed notes for each string (frets 0-11).
 */
export const STRING_NOTES: Record<number, PitchClass[]> = {
  6: getStringNotes('E'),  // E, F, F#, G, G#, A, A#, B, C, C#, D, D#
  5: getStringNotes('A'),  // A, A#, B, C, C#, D, D#, E, F, F#, G, G#
  4: getStringNotes('D'),  // D, D#, E, F, F#, G, G#, A, A#, B, C, C#
  3: getStringNotes('G'),  // G, G#, A, A#, B, C, C#, D, D#, E, F, F#
  2: getStringNotes('B'),  // B, C, C#, D, D#, E, F, F#, G, G#, A, A#
  1: getStringNotes('E'),  // E, F, F#, G, G#, A, A#, B, C, C#, D, D#
};

// Legacy E_STRING_NOTES for backward compatibility
export const E_STRING_NOTES: PitchClass[] = STRING_NOTES[6];

/**
 * Get the pitch class for a fret on a specific string.
 */
export function getPitchClassForPosition(string: number, fret: number): PitchClass {
  if (fret < 0 || fret > 11) {
    throw new Error(`Fret must be between 0 and 11, got ${fret}`);
  }
  if (string < 1 || string > 6) {
    throw new Error(`String must be between 1 and 6, got ${string}`);
  }
  return STRING_NOTES[string][fret];
}

// Legacy function for backward compatibility
export function getPitchClassForFret(fret: number): PitchClass {
  return getPitchClassForPosition(6, fret);
}

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
 * Multi-string progression:
 * - Starts with String 6 (low E), only fret 0 unlocked
 * - As each string is mastered, the next string unlocks
 * - 80% questions from current learning string, 20% from learned strings
 */
export class ProgressiveQuizState {
  private _performance: AllStringsPerformance;
  private _config: ProgressiveQuizConfig;
  /** Number of unlocked frets per string (1 = only fret 0, 12 = all frets) */
  private _unlockedFretsPerString: Map<number, number>;
  /** Index into STRING_PROGRESSION for the current learning string (0 = string 6) */
  private _currentStringIndex: number;

  constructor(
    config: Partial<ProgressiveQuizConfig> = {},
    initialPerformance?: AllStringsPerformance,
    initialUnlockedFretsPerString?: Map<number, number>,
    initialCurrentStringIndex?: number
  ) {
    this._config = { ...DEFAULT_PROGRESSIVE_CONFIG, ...config };
    this._performance = initialPerformance || new Map();
    this._unlockedFretsPerString = initialUnlockedFretsPerString || new Map();
    this._currentStringIndex = initialCurrentStringIndex ?? 0;
    
    // Initialize performance data for all strings
    for (const stringNum of STRING_PROGRESSION) {
      if (!this._performance.has(stringNum)) {
        this._performance.set(stringNum, new Map());
      }
      const stringPerf = this._performance.get(stringNum)!;
      for (let fret = 0; fret <= 11; fret++) {
        if (!stringPerf.has(fret)) {
          stringPerf.set(fret, {
            attempts: 0,
            correct: 0,
            answerTimes: [],
            lastAttemptTime: 0,
          });
        }
      }
      
      // Initialize unlocked frets - first string starts with 1 fret, others with 0
      if (!this._unlockedFretsPerString.has(stringNum)) {
        const stringIdx = STRING_PROGRESSION.indexOf(stringNum);
        if (stringIdx === 0) {
          // First string (low E): start with 1 fret unlocked
          this._unlockedFretsPerString.set(stringNum, 1);
        } else if (stringIdx <= this._currentStringIndex) {
          // Previously mastered strings: all frets unlocked
          this._unlockedFretsPerString.set(stringNum, 12);
        } else {
          // Future strings: no frets unlocked yet
          this._unlockedFretsPerString.set(stringNum, 0);
        }
      }
    }
  }

  // ============================================================================
  // Getters
  // ============================================================================

  get config(): ProgressiveQuizConfig {
    return { ...this._config };
  }

  /** Get the current learning string number (6 = low E, 1 = high E) */
  get currentString(): number {
    return STRING_PROGRESSION[this._currentStringIndex];
  }

  /** Get the current string index (0-5 in progression order) */
  get currentStringIndex(): number {
    return this._currentStringIndex;
  }

  /** Get the number of unlocked frets for the current learning string */
  get unlockedFrets(): number {
    return this._unlockedFretsPerString.get(this.currentString) ?? 0;
  }

  /** Get the number of unlocked frets for a specific string */
  getUnlockedFretsForString(string: number): number {
    return this._unlockedFretsPerString.get(string) ?? 0;
  }

  /** Get the highest unlocked fret index for current string (0-based) */
  get highestUnlockedFret(): number {
    return Math.max(0, this.unlockedFrets - 1);
  }

  /** Check if all notes on current string are unlocked */
  get currentStringComplete(): boolean {
    return this.unlockedFrets >= 12;
  }

  /** Check if all strings are complete */
  get allStringsComplete(): boolean {
    return this._currentStringIndex >= STRING_PROGRESSION.length - 1 && this.currentStringComplete;
  }

  /** Get array of fully mastered (completed) string numbers */
  get masteredStrings(): number[] {
    const mastered: number[] = [];
    for (let i = 0; i < this._currentStringIndex; i++) {
      mastered.push(STRING_PROGRESSION[i]);
    }
    return mastered;
  }

  /** Get array of unlocked string numbers (includes current learning string) */
  get unlockedStrings(): number[] {
    return STRING_PROGRESSION.slice(0, this._currentStringIndex + 1);
  }

  /** Check if a string is fully mastered */
  isStringMastered(string: number): boolean {
    const stringIdx = STRING_PROGRESSION.indexOf(string);
    return stringIdx < this._currentStringIndex;
  }

  /** Check if a string is currently being learned */
  isCurrentLearningString(string: number): boolean {
    return string === this.currentString;
  }

  /** Check if a string is unlocked (either mastered or current) */
  isStringUnlocked(string: number): boolean {
    const stringIdx = STRING_PROGRESSION.indexOf(string);
    return stringIdx <= this._currentStringIndex;
  }

  /** Get set of unlocked pitch classes for the current string */
  get unlockedPitchClasses(): Set<PitchClass> {
    const unlocked = new Set<PitchClass>();
    const string = this.currentString;
    const notes = STRING_NOTES[string];
    for (let fret = 0; fret < this.unlockedFrets; fret++) {
      unlocked.add(notes[fret]);
    }
    return unlocked;
  }

  /** Get unlocked pitch classes for a specific string */
  getUnlockedPitchClassesForString(string: number): Set<PitchClass> {
    const unlocked = new Set<PitchClass>();
    const unlockedFrets = this.getUnlockedFretsForString(string);
    const notes = STRING_NOTES[string];
    for (let fret = 0; fret < unlockedFrets; fret++) {
      unlocked.add(notes[fret]);
    }
    return unlocked;
  }

  // ============================================================================
  // Performance Recording
  // ============================================================================

  /**
   * Record an answer attempt for a specific string and fret.
   */
  recordAttempt(string: number, fret: number, correct: boolean, answerTimeSeconds: number): void {
    if (fret < 0 || fret > 11) {
      throw new Error(`Fret must be between 0 and 11, got ${fret}`);
    }
    if (string < 1 || string > 6) {
      throw new Error(`String must be between 1 and 6, got ${string}`);
    }

    const stringPerf = this._performance.get(string)!;
    const performance = stringPerf.get(fret)!;
    
    performance.attempts++;
    if (correct) {
      performance.correct++;
    }
    
    if (answerTimeSeconds <= this._config.maxAnswerTimeToCount) {
      performance.answerTimes.push(answerTimeSeconds);
    }
    
    performance.lastAttemptTime = Date.now();

    // Check if we should unlock the next note or string
    this._checkAndUnlockNext(string);
  }

  // ============================================================================
  // Statistics & Queries
  // ============================================================================

  /**
   * Get statistics for a specific position.
   */
  getNoteStats(string: number, fret: number): NoteStats {
    if (fret < 0 || fret > 11) {
      throw new Error(`Fret must be between 0 and 11, got ${fret}`);
    }
    if (string < 1 || string > 6) {
      throw new Error(`String must be between 1 and 6, got ${string}`);
    }

    const stringPerf = this._performance.get(string)!;
    const performance = stringPerf.get(fret)!;
    const accuracy = performance.attempts > 0
      ? (performance.correct / performance.attempts) * 100
      : 0;
    const averageTime = performance.answerTimes.length > 0
      ? performance.answerTimes.reduce((a, b) => a + b, 0) / performance.answerTimes.length
      : null;
    
    const unlockedFrets = this.getUnlockedFretsForString(string);
    const isUnlocked = fret < unlockedFrets;
    const meetsUnlockCriteria = this._checkUnlockCriteria(string, fret);

    return {
      string,
      fret,
      pitchClass: STRING_NOTES[string][fret],
      accuracy,
      averageTime,
      attempts: performance.attempts,
      correct: performance.correct,
      isUnlocked,
      meetsUnlockCriteria,
    };
  }

  /**
   * Get statistics for all notes on a specific string.
   */
  getStringNoteStats(string: number): NoteStats[] {
    const stats: NoteStats[] = [];
    for (let fret = 0; fret <= 11; fret++) {
      stats.push(this.getNoteStats(string, fret));
    }
    return stats;
  }

  /**
   * Get statistics for all E string notes (backward compatibility).
   */
  getAllNoteStats(): NoteStats[] {
    return this.getStringNoteStats(6);
  }

  /**
   * Get overall statistics for a specific string.
   */
  getStringOverallStats(string: number): {
    totalAttempts: number;
    totalCorrect: number;
    overallAccuracy: number;
    unlockedNotes: number;
    totalNotes: number;
  } {
    let totalAttempts = 0;
    let totalCorrect = 0;
    const unlockedFrets = this.getUnlockedFretsForString(string);
    const stringPerf = this._performance.get(string)!;

    for (let fret = 0; fret < unlockedFrets; fret++) {
      const performance = stringPerf.get(fret)!;
      totalAttempts += performance.attempts;
      totalCorrect += performance.correct;
    }

    return {
      totalAttempts,
      totalCorrect,
      overallAccuracy: totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0,
      unlockedNotes: unlockedFrets,
      totalNotes: 12,
    };
  }

  /**
   * Get overall statistics across all unlocked notes (backward compatibility).
   */
  getOverallStats(): {
    totalAttempts: number;
    totalCorrect: number;
    overallAccuracy: number;
    unlockedNotes: number;
    totalNotes: number;
  } {
    return this.getStringOverallStats(this.currentString);
  }

  /**
   * Get the raw performance data for a position.
   */
  getPerformanceData(string: number, fret: number): NotePerformanceData | undefined {
    return this._performance.get(string)?.get(fret);
  }

  /**
   * Check if a specific position is unlocked.
   */
  isPositionUnlocked(string: number, fret: number): boolean {
    if (!this.isStringUnlocked(string)) return false;
    const unlockedFrets = this.getUnlockedFretsForString(string);
    return fret >= 0 && fret < unlockedFrets;
  }

  // Legacy method
  isFretUnlocked(fret: number): boolean {
    return this.isPositionUnlocked(6, fret);
  }

  // ============================================================================
  // Question Generation
  // ============================================================================

  /**
   * Generate a weighted question target.
   * Returns { string, fret } for the target note.
   * 
   * 80% chance: question from current learning string
   * 20% chance: question from a random previously mastered string
   */
  generateQuestionTarget(): { string: number; fret: number } {
    const masteredStrings = this.masteredStrings;
    const currentString = this.currentString;
    const currentUnlockedFrets = this.unlockedFrets;

    // If no mastered strings, always use current string
    if (masteredStrings.length === 0 || Math.random() < this._config.currentStringProbability) {
      // Question from current learning string
      const fret = this._selectWeightedFret(currentString, currentUnlockedFrets);
      return { string: currentString, fret };
    } else {
      // Question from a random mastered string (20% of the time)
      const randomMasteredString = masteredStrings[Math.floor(Math.random() * masteredStrings.length)];
      // Mastered strings have all 12 frets unlocked
      const fret = this._selectWeightedFret(randomMasteredString, 12);
      return { string: randomMasteredString, fret };
    }
  }

  /**
   * Select a fret using weighted random selection based on performance.
   */
  private _selectWeightedFret(string: number, maxFret: number): number {
    const stringPerf = this._performance.get(string)!;
    const weights: number[] = [];
    let totalWeight = 0;

    for (let fret = 0; fret < maxFret; fret++) {
      const perf = stringPerf.get(fret)!;
      let weight = 1;

      if (perf.attempts < this._config.minAttemptsForLearned) {
        // Unlearned note - boost weight
        weight *= this._config.unlearnedNoteWeight;
      } else {
        const accuracy = (perf.correct / perf.attempts) * 100;
        if (accuracy < this._config.strugglingAccuracyThreshold) {
          // Struggling note - boost weight
          const struggleFactor = (this._config.strugglingAccuracyThreshold - accuracy) / this._config.strugglingAccuracyThreshold;
          weight *= 1 + (this._config.lowAccuracyWeight - 1) * struggleFactor;
        } else if (accuracy >= this._config.accuracyThreshold) {
          // Mastered note - reduce weight
          weight *= 0.5;
        }
      }

      weights.push(weight);
      totalWeight += weight;
    }

    // Weighted random selection
    let random = Math.random() * totalWeight;
    for (let fret = 0; fret < maxFret; fret++) {
      random -= weights[fret];
      if (random <= 0) {
        return fret;
      }
    }
    return maxFret - 1;
  }

  // ============================================================================
  // Unlock Logic
  // ============================================================================

  /**
   * Check if a position meets the unlock criteria.
   */
  private _checkUnlockCriteria(string: number, fret: number): boolean {
    const stringPerf = this._performance.get(string);
    if (!stringPerf) return false;
    const performance = stringPerf.get(fret);
    if (!performance) return false;

    if (performance.attempts < this._config.minAttemptsToUnlock) {
      return false;
    }

    const accuracy = (performance.correct / performance.attempts) * 100;
    if (accuracy < this._config.accuracyThreshold) {
      return false;
    }

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
   * Check if all unlocked notes on a string meet unlock criteria.
   */
  private _allUnlockedNotesMeetCriteria(string: number): boolean {
    const unlockedFrets = this.getUnlockedFretsForString(string);
    for (let fret = 0; fret < unlockedFrets; fret++) {
      if (!this._checkUnlockCriteria(string, fret)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check and unlock next note or string if criteria are met.
   */
  private _checkAndUnlockNext(string: number): void {
    // Only check the string that was just practiced
    if (!this._allUnlockedNotesMeetCriteria(string)) {
      return;
    }

    const unlockedFrets = this.getUnlockedFretsForString(string);
    
    if (unlockedFrets < 12) {
      // Unlock the next fret on this string
      this._unlockedFretsPerString.set(string, unlockedFrets + 1);
    } else if (string === this.currentString && this._currentStringIndex < STRING_PROGRESSION.length - 1) {
      // String is complete, unlock the next string
      this._currentStringIndex++;
      const nextString = STRING_PROGRESSION[this._currentStringIndex];
      // Start the new string with 1 fret unlocked (open string)
      this._unlockedFretsPerString.set(nextString, 1);
    }
  }

  /**
   * Force unlock a specific number of frets on the current string (for testing).
   */
  forceUnlock(numFrets: number): void {
    this._unlockedFretsPerString.set(this.currentString, Math.max(1, Math.min(12, numFrets)));
  }

  /**
   * Force advance to a specific string (for testing).
   */
  forceStringIndex(index: number): void {
    const newIndex = Math.max(0, Math.min(STRING_PROGRESSION.length - 1, index));
    this._currentStringIndex = newIndex;
    // Unlock all frets on mastered strings
    for (let i = 0; i < newIndex; i++) {
      this._unlockedFretsPerString.set(STRING_PROGRESSION[i], 12);
    }
    // Initialize current string with at least 1 fret
    const currentString = STRING_PROGRESSION[newIndex];
    if ((this._unlockedFretsPerString.get(currentString) ?? 0) < 1) {
      this._unlockedFretsPerString.set(currentString, 1);
    }
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  updateConfig(config: Partial<ProgressiveQuizConfig>): void {
    this._config = { ...this._config, ...config };
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  toJSON(): {
    config: ProgressiveQuizConfig;
    performance: Record<number, Record<number, NotePerformanceData>>;
    unlockedFretsPerString: Record<number, number>;
    currentStringIndex: number;
    // Legacy fields for backward compatibility
    unlockedFrets: number;
  } {
    const performanceObj: Record<number, Record<number, NotePerformanceData>> = {};
    for (const [string, stringPerf] of this._performance) {
      performanceObj[string] = {};
      for (const [fret, data] of stringPerf) {
        performanceObj[string][fret] = { ...data };
      }
    }

    const unlockedFretsObj: Record<number, number> = {};
    for (const [string, frets] of this._unlockedFretsPerString) {
      unlockedFretsObj[string] = frets;
    }

    return {
      config: { ...this._config },
      performance: performanceObj,
      unlockedFretsPerString: unlockedFretsObj,
      currentStringIndex: this._currentStringIndex,
      // Legacy field: unlocked frets for E string (string 6)
      unlockedFrets: this._unlockedFretsPerString.get(6) ?? 1,
    };
  }

  static fromJSON(data: ReturnType<ProgressiveQuizState['toJSON']>): ProgressiveQuizState {
    const performance = new Map<number, StringPerformance>();
    
    // Check if this is the new format (with per-string data) or legacy format
    if (data.performance && typeof data.performance === 'object') {
      // Check if first key is a string number (new format) or fret number (legacy)
      const firstKey = Object.keys(data.performance)[0];
      if (firstKey && data.performance[Number(firstKey)] && typeof data.performance[Number(firstKey)] === 'object') {
        // Check if it's nested (new format) or flat (legacy)
        const firstValue = data.performance[Number(firstKey)];
        if ('attempts' in firstValue) {
          // Legacy format: flat structure for E string only
          const eStringPerf = new Map<number, NotePerformanceData>();
          for (const [fret, perfData] of Object.entries(data.performance as unknown as Record<number, NotePerformanceData>)) {
            eStringPerf.set(Number(fret), { ...perfData as NotePerformanceData });
          }
          performance.set(6, eStringPerf);
        } else {
          // New format: nested per-string structure
          for (const [string, stringData] of Object.entries(data.performance)) {
            const stringPerf = new Map<number, NotePerformanceData>();
            for (const [fret, perfData] of Object.entries(stringData as Record<number, NotePerformanceData>)) {
              stringPerf.set(Number(fret), { ...perfData });
            }
            performance.set(Number(string), stringPerf);
          }
        }
      }
    }

    const unlockedFretsPerString = new Map<number, number>();
    if (data.unlockedFretsPerString) {
      for (const [string, frets] of Object.entries(data.unlockedFretsPerString)) {
        unlockedFretsPerString.set(Number(string), frets as number);
      }
    } else if (data.unlockedFrets !== undefined) {
      // Legacy: only E string data
      unlockedFretsPerString.set(6, data.unlockedFrets);
    }

    return new ProgressiveQuizState(
      data.config,
      performance.size > 0 ? performance : undefined,
      unlockedFretsPerString.size > 0 ? unlockedFretsPerString : undefined,
      data.currentStringIndex ?? 0
    );
  }

  /**
   * Reset all progress.
   */
  reset(): void {
    this._currentStringIndex = 0;
    
    for (const stringNum of STRING_PROGRESSION) {
      const stringPerf = this._performance.get(stringNum)!;
      for (let fret = 0; fret <= 11; fret++) {
        stringPerf.set(fret, {
          attempts: 0,
          correct: 0,
          answerTimes: [],
          lastAttemptTime: 0,
        });
      }
      
      // Reset unlocked frets
      if (stringNum === 6) {
        this._unlockedFretsPerString.set(stringNum, 1);
      } else {
        this._unlockedFretsPerString.set(stringNum, 0);
      }
    }
  }
}
