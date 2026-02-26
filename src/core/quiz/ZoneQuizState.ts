/**
 * ZoneQuizState - Manages progressive difficulty for zone-based note quiz
 * 
 * Key differences from ProgressiveQuizState:
 * - Works with a specific zone (set of 12 positions)
 * - Zone can slide up/down within 24 frets
 * - Unlock logic applies to positions within the zone
 * - Tracks per-fret stats across all positions in the zone
 */

import type { PitchClass } from '../music-theory/Note';
import type { NotePosition } from '../zones/HighlightZone';

// ============================================================================
// Configuration Constants
// ============================================================================

export interface ZoneQuizConfig {
  accuracyThreshold: number;
  averageTimeThreshold: number;
  maxAnswerTimeToCount: number;
  minAttemptsToUnlock: number;
  nextNoteDelay: number;
  lowAccuracyWeight: number;
  unlearnedNoteWeight: number;
  strugglingAccuracyThreshold: number;
  minAttemptsForLearned: number;
  maxSlideAmount: number;  // Max frets to slide up/down
}

export const DEFAULT_ZONE_QUIZ_CONFIG: ZoneQuizConfig = {
  accuracyThreshold: 80,
  averageTimeThreshold: 3,
  maxAnswerTimeToCount: 20,
  minAttemptsToUnlock: 3,
  nextNoteDelay: 800,
  lowAccuracyWeight: 2.0,
  unlearnedNoteWeight: 2.0,
  strugglingAccuracyThreshold: 70,
  minAttemptsForLearned: 3,
  maxSlideAmount: 5,
};

// ============================================================================
// Types
// ============================================================================

export interface NotePerformanceData {
  attempts: number;
  correct: number;
  answerTimes: number[];
  lastAttemptTime: number;
}

export type ZonePerformance = Map<string, NotePerformanceData>;  // key: "s{fret}" for a single string

export interface ZoneNoteStats {
  position: NotePosition;
  pitchClass: PitchClass;
  accuracy: number;
  averageTime: number | null;
  attempts: number;
  correct: number;
  isUnlocked: boolean;
  meetsUnlockCriteria: boolean;
}

// ============================================================================
// ZoneQuizState Class
// ============================================================================

export class ZoneQuizState {
  private _config: ZoneQuizConfig;
  private _performance: ZonePerformance;
  private _zonePositions: NotePosition[];  // 12 positions that define the zone
  private _currentSlide: number;  // Current slide offset from base
  private _unlockedCount: number;  // Number of notes unlocked (0-12)
  private _slidingEnabled: boolean;  // Whether zone sliding has started

  constructor(
    config: Partial<ZoneQuizConfig> = {},
    zonePositions: NotePosition[] = [],
    initialPerformance?: ZonePerformance,
    initialUnlockedCount?: number,
    initialSlide?: number,
    initialSlidingEnabled?: boolean
  ) {
    this._config = { ...DEFAULT_ZONE_QUIZ_CONFIG, ...config };
    this._performance = initialPerformance || new Map();
    this._zonePositions = zonePositions;
    this._currentSlide = initialSlide ?? 0;
    this._unlockedCount = initialUnlockedCount ?? 1;  // Start with 1 note unlocked
    this._slidingEnabled = initialSlidingEnabled ?? false;

    this._initializePerformance();
  }

  private _initializePerformance(): void {
    // Initialize performance data for all zone positions (base positions, not shifted)
    for (const pos of this._zonePositions) {
      const key = this._getPositionKey(pos.string, pos.fret);
      if (!this._performance.has(key)) {
        this._performance.set(key, {
          attempts: 0,
          correct: 0,
          answerTimes: [],
          lastAttemptTime: 0,
        });
      }
    }
  }

  private _getPositionKey(string: number, fret: number): string {
    return `s${string}f${fret}`;
  }

  // Get the actual fret position accounting for slide
  private _getShiftedFret(baseFret: number): number {
    return baseFret + this._currentSlide;
  }

  // Check if a shifted position is within 24 frets
  private _isWithinFretboard(fret: number): boolean {
    return fret >= 0 && fret <= 24;
  }

  // Get all valid shifted positions for the zone
  getShiftedPositions(): NotePosition[] {
    return this._zonePositions
      .map(pos => ({
        string: pos.string,
        fret: this._getShiftedFret(pos.fret),
      }))
      .filter(pos => this._isWithinFretboard(pos.fret));
  }

  // Get unlocked positions (based on _unlockedCount from base positions)
  getUnlockedPositions(): NotePosition[] {
    const positions = this.getShiftedPositions();
    // Unlock based on index in the zone's position array
    return positions.slice(0, this._unlockedCount);
  }

  // ============================================================================
  // Getters
  // ============================================================================

  get config(): ZoneQuizConfig {
    return { ...this._config };
  }

  get unlockedCount(): number {
    return this._unlockedCount;
  }

  get currentSlide(): number {
    return this._currentSlide;
  }

  get slidingEnabled(): boolean {
    return this._slidingEnabled;
  }

  get allPositionsUnlocked(): boolean {
    return this._unlockedCount >= 12;
  }

  get zonePositions(): NotePosition[] {
    return [...this._zonePositions];
  }

  // ============================================================================
  // Performance Recording
  // ============================================================================

  recordAttempt(string: number, fret: number, correct: boolean, answerTimeSeconds: number): void {
    // Find the base position (undo slide) for tracking
    const baseFret = fret - this._currentSlide;
    const key = this._getPositionKey(string, baseFret);
    
    const performance = this._performance.get(key);
    if (!performance) return;
    
    performance.attempts++;
    if (correct) {
      performance.correct++;
    }
    
    if (answerTimeSeconds <= this._config.maxAnswerTimeToCount) {
      performance.answerTimes.push(answerTimeSeconds);
    }
    
    performance.lastAttemptTime = Date.now();

    this._checkAndUnlockNext();
  }

  // ============================================================================
  // Unlock Logic
  // ============================================================================

  private _checkUnlockCriteria(baseFret: number): boolean {
    const key = this._getPositionKey(6, baseFret);  // Using string 6 as base
    const performance = this._performance.get(key);
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

  private _allUnlockedNotesMeetCriteria(): boolean {
    for (let i = 0; i < this._unlockedCount; i++) {
      const baseFret = this._zonePositions[i].fret;
      if (!this._checkUnlockCriteria(baseFret)) {
        return false;
      }
    }
    return true;
  }

  private _checkAndUnlockNext(): void {
    // Only check if sliding hasn't started yet
    if (this._slidingEnabled) {
      return;
    }

    if (!this._allUnlockedNotesMeetCriteria()) {
      return;
    }

    if (this._unlockedCount < 12) {
      this._unlockedCount++;
    } else if (this._unlockedCount === 12) {
      // All 12 notes unlocked - enable sliding
      this._slidingEnabled = true;
    }
  }

  // ============================================================================
  // Zone Sliding
  // ============================================================================

  /**
   * Slide the zone by a random amount within the configured range.
   * Ensures all positions stay within 24 frets.
   */
  slideZone(): number {
    const maxSlide = this._config.maxSlideAmount;
    
    // Find valid slide range that keeps all positions within 24 frets
    let minValidSlide = -maxSlide;
    let maxValidSlide = maxSlide;

    // Check each position to find constraints
    for (const pos of this._zonePositions) {
      const baseFret = pos.fret;
      
      // Position at base + minSlide must be >= 0
      if (baseFret + minValidSlide < 0) {
        minValidSlide = -baseFret;
      }
      
      // Position at base + maxSlide must be <= 24
      if (baseFret + maxValidSlide > 24) {
        maxValidSlide = 24 - baseFret;
      }
    }

    // Pick a random slide within valid range
    const range = maxValidSlide - minValidSlide;
    if (range <= 0) {
      this._currentSlide = 0;
      return 0;
    }

    this._currentSlide = minValidSlide + Math.floor(Math.random() * (range + 1));
    return this._currentSlide;
  }

  /**
   * Get a random slide that keeps at least one unlocked note visible
   */
  slideZoneWithUnlockedCheck(): number {
    const maxAttempts = 10;
    
    for (let i = 0; i < maxAttempts; i++) {
      const slide = this.slideZone();
      const unlockedPositions = this.getUnlockedPositions();
      
      // Check if any unlocked position is still visible
      const hasVisibleUnlocked = unlockedPositions.some(pos => 
        this._isWithinFretboard(pos.fret)
      );
      
      if (hasVisibleUnlocked) {
        return slide;
      }
    }
    
    // Fallback: try to find a position with visible unlocked notes
    this._currentSlide = 0;
    return 0;
  }

  // ============================================================================
  // Question Generation
  // ============================================================================

  generateQuestionTarget(): NotePosition | null {
    const unlockedPositions = this.getUnlockedPositions();
    
    if (unlockedPositions.length === 0) {
      return null;
    }

    // Weighted selection based on performance
    const weights: number[] = [];
    let totalWeight = 0;

    for (let i = 0; i < unlockedPositions.length; i++) {
      const pos = unlockedPositions[i];
      const key = this._getPositionKey(pos.string, pos.fret);
      const perf = this._performance.get(key);
      
      let weight = 1;

      if (!perf || perf.attempts < this._config.minAttemptsForLearned) {
        weight *= this._config.unlearnedNoteWeight;
      } else {
        const accuracy = (perf.correct / perf.attempts) * 100;
        if (accuracy < this._config.strugglingAccuracyThreshold) {
          const struggleFactor = (this._config.strugglingAccuracyThreshold - accuracy) / this._config.strugglingAccuracyThreshold;
          weight *= 1 + (this._config.lowAccuracyWeight - 1) * struggleFactor;
        } else if (accuracy >= this._config.accuracyThreshold) {
          weight *= 0.5;
        }
      }

      weights.push(weight);
      totalWeight += weight;
    }

    // Weighted random selection
    let random = Math.random() * totalWeight;
    for (let i = 0; i < unlockedPositions.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return unlockedPositions[i];
      }
    }

    return unlockedPositions[unlockedPositions.length - 1];
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  getNoteStats(position: NotePosition): ZoneNoteStats {
    const baseFret = position.fret - this._currentSlide;
    const key = this._getPositionKey(position.string, baseFret);
    const perf = this._performance.get(key);
    
    const accuracy = perf && perf.attempts > 0
      ? (perf.correct / perf.attempts) * 100
      : 0;
    const averageTime = perf && perf.answerTimes.length > 0
      ? perf.answerTimes.reduce((a, b) => a + b, 0) / perf.answerTimes.length
      : null;

    // Check if this position index is unlocked
    const positionIndex = this._zonePositions.findIndex(
      p => p.string === position.string && p.fret === baseFret
    );
    const isUnlocked = positionIndex >= 0 && positionIndex < this._unlockedCount;

    return {
      position,
      pitchClass: 'C' as PitchClass,  // Would need to calculate from string/fret
      accuracy,
      averageTime,
      attempts: perf?.attempts || 0,
      correct: perf?.correct || 0,
      isUnlocked,
      meetsUnlockCriteria: isUnlocked && this._checkUnlockCriteria(baseFret),
    };
  }

  getAllStats(): ZoneNoteStats[] {
    const shifted = this.getShiftedPositions();
    return shifted.map(pos => this.getNoteStats(pos));
  }

  getPerformanceData(string: number, fret: number): NotePerformanceData | undefined {
    const baseFret = fret - this._currentSlide;
    return this._performance.get(this._getPositionKey(string, baseFret));
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  updateConfig(config: Partial<ZoneQuizConfig>): void {
    this._config = { ...this._config, ...config };
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  toJSON() {
    const perfObj: Record<string, NotePerformanceData> = {};
    for (const [key, data] of this._performance) {
      perfObj[key] = { ...data };
    }

    return {
      config: { ...this._config },
      performance: perfObj,
      zonePositions: this._zonePositions,
      unlockedCount: this._unlockedCount,
      currentSlide: this._currentSlide,
      slidingEnabled: this._slidingEnabled,
    };
  }

  static fromJSON(data: ReturnType<ZoneQuizState['toJSON']>): ZoneQuizState {
    const performance = new Map<string, NotePerformanceData>();
    for (const [key, perfData] of Object.entries(data.performance || {})) {
      performance.set(key, { ...perfData });
    }

    return new ZoneQuizState(
      data.config,
      data.zonePositions || [],
      performance,
      data.unlockedCount,
      data.currentSlide,
      data.slidingEnabled
    );
  }

  // ============================================================================
  // Reset
  // ============================================================================

  reset(): void {
    this._unlockedCount = 1;
    this._currentSlide = 0;
    this._slidingEnabled = false;

    for (const [, perf] of this._performance) {
      perf.attempts = 0;
      perf.correct = 0;
      perf.answerTimes = [];
      perf.lastAttemptTime = 0;
    }
  }

  // Force unlock for testing
  forceUnlock(count: number): void {
    this._unlockedCount = Math.max(1, Math.min(12, count));
  }

  // Force enable sliding for testing
  forceSlidingEnabled(enabled: boolean): void {
    this._slidingEnabled = enabled;
  }
}
