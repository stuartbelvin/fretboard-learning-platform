import { describe, it, expect, beforeEach } from 'vitest';
import {
  ProgressiveQuizState,
  DEFAULT_PROGRESSIVE_CONFIG,
  E_STRING_NOTES,
  getPitchClassForFret,
  getFretForPitchClass,
} from '../../core/quiz/ProgressiveQuizState';
import type { ProgressiveQuizConfig } from '../../core/quiz/ProgressiveQuizState';

describe('ProgressiveQuizState', () => {
  let quizState: ProgressiveQuizState;

  beforeEach(() => {
    quizState = new ProgressiveQuizState();
  });

  describe('E_STRING_NOTES constants', () => {
    it('should have 12 notes for frets 0-11', () => {
      expect(E_STRING_NOTES).toHaveLength(12);
    });

    it('should start with E (open string)', () => {
      expect(E_STRING_NOTES[0]).toBe('E');
    });

    it('should end with D# (fret 11)', () => {
      expect(E_STRING_NOTES[11]).toBe('D#');
    });

    it('should have correct chromatic sequence', () => {
      const expected = ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#'];
      expect(E_STRING_NOTES).toEqual(expected);
    });
  });

  describe('getPitchClassForFret', () => {
    it('should return E for fret 0', () => {
      expect(getPitchClassForFret(0)).toBe('E');
    });

    it('should return F for fret 1', () => {
      expect(getPitchClassForFret(1)).toBe('F');
    });

    it('should return D# for fret 11', () => {
      expect(getPitchClassForFret(11)).toBe('D#');
    });

    it('should throw for fret < 0', () => {
      expect(() => getPitchClassForFret(-1)).toThrow();
    });

    it('should throw for fret > 11', () => {
      expect(() => getPitchClassForFret(12)).toThrow();
    });
  });

  describe('getFretForPitchClass', () => {
    it('should return 0 for E', () => {
      expect(getFretForPitchClass('E')).toBe(0);
    });

    it('should return 5 for A', () => {
      expect(getFretForPitchClass('A')).toBe(5);
    });

    it('should return 11 for D#', () => {
      expect(getFretForPitchClass('D#')).toBe(11);
    });
  });

  describe('DEFAULT_PROGRESSIVE_CONFIG', () => {
    it('should have 80% accuracy threshold', () => {
      expect(DEFAULT_PROGRESSIVE_CONFIG.accuracyThreshold).toBe(80);
    });

    it('should have 3 second average time threshold', () => {
      expect(DEFAULT_PROGRESSIVE_CONFIG.averageTimeThreshold).toBe(3);
    });

    it('should ignore times over 20 seconds', () => {
      expect(DEFAULT_PROGRESSIVE_CONFIG.maxAnswerTimeToCount).toBe(20);
    });

    it('should require 3 minimum attempts to unlock', () => {
      expect(DEFAULT_PROGRESSIVE_CONFIG.minAttemptsToUnlock).toBe(3);
    });
  });

  describe('Initial State', () => {
    it('should start with 1 fret unlocked', () => {
      expect(quizState.unlockedFrets).toBe(1);
    });

    it('should have highest unlocked fret of 0', () => {
      expect(quizState.highestUnlockedFret).toBe(0);
    });

    it('should not have all notes unlocked', () => {
      expect(quizState.currentStringComplete).toBe(false);
    });

    it('should have default config', () => {
      expect(quizState.config).toEqual(DEFAULT_PROGRESSIVE_CONFIG);
    });

    it('should only have E unlocked', () => {
      const unlocked = quizState.unlockedPitchClasses;
      expect(unlocked.size).toBe(1);
      expect(unlocked.has('E')).toBe(true);
    });

    it('should initialize performance data for all 12 frets', () => {
      for (let fret = 0; fret <= 11; fret++) {
        const perf = quizState.getPerformanceData(6, fret);
        expect(perf).toBeDefined();
        expect(perf!.attempts).toBe(0);
        expect(perf!.correct).toBe(0);
        expect(perf!.answerTimes).toEqual([]);
      }
    });
  });

  describe('Custom Config', () => {
    it('should accept custom accuracy threshold', () => {
      const custom = new ProgressiveQuizState({ accuracyThreshold: 90 });
      expect(custom.config.accuracyThreshold).toBe(90);
    });

    it('should accept custom time threshold', () => {
      const custom = new ProgressiveQuizState({ averageTimeThreshold: 5 });
      expect(custom.config.averageTimeThreshold).toBe(5);
    });

    it('should merge custom config with defaults', () => {
      const custom = new ProgressiveQuizState({ accuracyThreshold: 70 });
      expect(custom.config.averageTimeThreshold).toBe(3); // default preserved
      expect(custom.config.accuracyThreshold).toBe(70);   // custom applied
    });
  });

  describe('Recording Attempts', () => {
    it('should increment attempts count', () => {
      quizState.recordAttempt(6, 0, true, 2);
      expect(quizState.getPerformanceData(6, 0)!.attempts).toBe(1);
    });

    it('should increment correct count on correct answer', () => {
      quizState.recordAttempt(6, 0, true, 2);
      expect(quizState.getPerformanceData(6, 0)!.correct).toBe(1);
    });

    it('should not increment correct count on incorrect answer', () => {
      quizState.recordAttempt(6, 0, false, 2);
      expect(quizState.getPerformanceData(6, 0)!.correct).toBe(0);
    });

    it('should record answer time when under threshold', () => {
      quizState.recordAttempt(6, 0, true, 2.5);
      expect(quizState.getPerformanceData(6, 0)!.answerTimes).toEqual([2.5]);
    });

    it('should NOT record answer time when over threshold', () => {
      quizState.recordAttempt(6, 0, true, 25); // 25 > 20 second threshold
      expect(quizState.getPerformanceData(6, 0)!.answerTimes).toEqual([]);
    });

    it('should record answer time exactly at threshold', () => {
      quizState.recordAttempt(6, 0, true, 20); // exactly at threshold
      expect(quizState.getPerformanceData(6, 0)!.answerTimes).toEqual([20]);
    });

    it('should update lastAttemptTime', () => {
      const before = Date.now();
      quizState.recordAttempt(6, 0, true, 2);
      const after = Date.now();
      const lastAttempt = quizState.getPerformanceData(6, 0)!.lastAttemptTime;
      expect(lastAttempt).toBeGreaterThanOrEqual(before);
      expect(lastAttempt).toBeLessThanOrEqual(after);
    });

    it('should throw for invalid fret number', () => {
      expect(() => quizState.recordAttempt(6, -1, true, 2)).toThrow();
      expect(() => quizState.recordAttempt(6, 12, true, 2)).toThrow();
    });
  });

  describe('Note Statistics', () => {
    it('should calculate accuracy correctly', () => {
      quizState.recordAttempt(6, 0, true, 2);
      quizState.recordAttempt(6, 0, true, 2);
      quizState.recordAttempt(6, 0, false, 2);
      const stats = quizState.getNoteStats(6, 0);
      expect(stats.accuracy).toBeCloseTo(66.67, 1);
    });

    it('should calculate average time correctly', () => {
      quizState.recordAttempt(6, 0, true, 2);
      quizState.recordAttempt(6, 0, true, 3);
      quizState.recordAttempt(6, 0, true, 4);
      const stats = quizState.getNoteStats(6, 0);
      expect(stats.averageTime).toBe(3);
    });

    it('should return null average time with no valid times', () => {
      quizState.recordAttempt(6, 0, true, 25); // ignored
      const stats = quizState.getNoteStats(6, 0);
      expect(stats.averageTime).toBeNull();
    });

    it('should indicate if note is unlocked', () => {
      expect(quizState.getNoteStats(6, 0).isUnlocked).toBe(true);
      expect(quizState.getNoteStats(6, 1).isUnlocked).toBe(false);
    });

    it('should include correct pitch class', () => {
      expect(quizState.getNoteStats(6, 0).pitchClass).toBe('E');
      expect(quizState.getNoteStats(6, 5).pitchClass).toBe('A');
    });
  });

  describe('Overall Statistics', () => {
    it('should calculate totals across unlocked notes', () => {
      // Record attempts on fret 0
      quizState.recordAttempt(6, 0, true, 2);
      quizState.recordAttempt(6, 0, false, 2);
      
      const overall = quizState.getOverallStats();
      expect(overall.totalAttempts).toBe(2);
      expect(overall.totalCorrect).toBe(1);
      expect(overall.overallAccuracy).toBe(50);
    });

    it('should track unlocked/total notes', () => {
      const overall = quizState.getOverallStats();
      expect(overall.unlockedNotes).toBe(1);
      expect(overall.totalNotes).toBe(12);
    });
  });

  describe('Unlock Criteria', () => {
    it('should not unlock without minimum attempts', () => {
      // Only 2 attempts (need 3)
      quizState.recordAttempt(6, 0, true, 1);
      quizState.recordAttempt(6, 0, true, 1);
      expect(quizState.unlockedFrets).toBe(1);
    });

    it('should not unlock with low accuracy', () => {
      // 66% accuracy (need 80%)
      quizState.recordAttempt(6, 0, true, 1);
      quizState.recordAttempt(6, 0, true, 1);
      quizState.recordAttempt(6, 0, false, 1);
      expect(quizState.unlockedFrets).toBe(1);
    });

    it('should not unlock with slow times', () => {
      // 5 second average (need under 3)
      quizState.recordAttempt(6, 0, true, 5);
      quizState.recordAttempt(6, 0, true, 5);
      quizState.recordAttempt(6, 0, true, 5);
      expect(quizState.unlockedFrets).toBe(1);
    });

    it('should not unlock without valid times', () => {
      // All times over threshold
      quizState.recordAttempt(6, 0, true, 25);
      quizState.recordAttempt(6, 0, true, 25);
      quizState.recordAttempt(6, 0, true, 25);
      expect(quizState.unlockedFrets).toBe(1);
    });

    it('should unlock when all criteria met', () => {
      // 100% accuracy, 2 second average, 3 attempts
      quizState.recordAttempt(6, 0, true, 2);
      quizState.recordAttempt(6, 0, true, 2);
      quizState.recordAttempt(6, 0, true, 2);
      expect(quizState.unlockedFrets).toBe(2);
    });

    it('should unlock at exactly 80% accuracy', () => {
      // 80% accuracy (4/5 correct)
      quizState.recordAttempt(6, 0, true, 2);
      quizState.recordAttempt(6, 0, true, 2);
      quizState.recordAttempt(6, 0, true, 2);
      quizState.recordAttempt(6, 0, true, 2);
      quizState.recordAttempt(6, 0, false, 2);
      expect(quizState.unlockedFrets).toBe(2);
    });

    it('should unlock at exactly 3 second average', () => {
      quizState.recordAttempt(6, 0, true, 3);
      quizState.recordAttempt(6, 0, true, 3);
      quizState.recordAttempt(6, 0, true, 3);
      expect(quizState.unlockedFrets).toBe(2);
    });
  });

  describe('Progressive Unlocking', () => {
    it('should require ALL unlocked notes to meet criteria', () => {
      // Unlock fret 1 first
      quizState.recordAttempt(6, 0, true, 2);
      quizState.recordAttempt(6, 0, true, 2);
      quizState.recordAttempt(6, 0, true, 2);
      expect(quizState.unlockedFrets).toBe(2);

      // Now fret 1 needs to meet criteria too
      // Just practicing fret 1 shouldn't unlock fret 2 yet if fret 0 drops below
      quizState.recordAttempt(6, 0, false, 2); // drop fret 0 below 80%
      quizState.recordAttempt(6, 1, true, 2);
      quizState.recordAttempt(6, 1, true, 2);
      quizState.recordAttempt(6, 1, true, 2);
      expect(quizState.unlockedFrets).toBe(2); // Still 2, not 3
    });

    it('should unlock fret 2 when frets 0 and 1 both meet criteria', () => {
      // Perfect performance on fret 0
      quizState.recordAttempt(6, 0, true, 2);
      quizState.recordAttempt(6, 0, true, 2);
      quizState.recordAttempt(6, 0, true, 2);
      expect(quizState.unlockedFrets).toBe(2);

      // Perfect performance on fret 1
      quizState.recordAttempt(6, 1, true, 2);
      quizState.recordAttempt(6, 1, true, 2);
      quizState.recordAttempt(6, 1, true, 2);
      expect(quizState.unlockedFrets).toBe(3);
    });

    it('should eventually unlock all 12 notes', () => {
      // Unlock all notes with perfect performance
      // Each round: practice all unlocked frets, ensuring each gets 3+ attempts
      while (quizState.unlockedFrets < 12) {
        const unlocked = quizState.unlockedFrets;
        // Give all currently unlocked frets enough attempts to meet criteria
        for (let fret = 0; fret < unlocked; fret++) {
          // Ensure at least minAttemptsToUnlock (3) attempts per fret
          const perf = quizState.getPerformanceData(6, fret)!;
          const attemptsNeeded = Math.max(0, 3 - perf.attempts);
          for (let i = 0; i < attemptsNeeded; i++) {
            quizState.recordAttempt(6, fret, true, 2);
          }
        }
      }
      expect(quizState.unlockedFrets).toBe(12);
      expect(quizState.currentStringComplete).toBe(true);
    });
  });

  describe('isFretUnlocked', () => {
    it('should return true for fret 0', () => {
      expect(quizState.isFretUnlocked(0)).toBe(true);
    });

    it('should return false for fret 1 initially', () => {
      expect(quizState.isFretUnlocked(1)).toBe(false);
    });

    it('should return false for negative frets', () => {
      expect(quizState.isFretUnlocked(-1)).toBe(false);
    });
  });

  describe('Force Unlock', () => {
    it('should force unlock specified number of frets', () => {
      quizState.forceUnlock(5);
      expect(quizState.unlockedFrets).toBe(5);
    });

    it('should clamp to minimum of 1', () => {
      quizState.forceUnlock(0);
      expect(quizState.unlockedFrets).toBe(1);
    });

    it('should clamp to maximum of 12', () => {
      quizState.forceUnlock(15);
      expect(quizState.unlockedFrets).toBe(12);
    });
  });

  describe('Config Update', () => {
    it('should update accuracy threshold', () => {
      quizState.updateConfig({ accuracyThreshold: 70 });
      expect(quizState.config.accuracyThreshold).toBe(70);
    });

    it('should preserve other config values', () => {
      quizState.updateConfig({ accuracyThreshold: 70 });
      expect(quizState.config.averageTimeThreshold).toBe(3);
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON', () => {
      quizState.recordAttempt(6, 0, true, 2);
      const json = quizState.toJSON();
      
      expect(json.config).toEqual(quizState.config);
      expect(json.unlockedFrets).toBe(quizState.unlockedFrets);
      expect(json.performance[6]).toBeDefined();
      expect(json.performance[6][0].attempts).toBe(1);
    });

    it('should deserialize from JSON', () => {
      quizState.recordAttempt(6, 0, true, 2);
      quizState.recordAttempt(6, 0, true, 2);
      quizState.recordAttempt(6, 0, true, 2);
      
      const json = quizState.toJSON();
      const restored = ProgressiveQuizState.fromJSON(json);
      
      expect(restored.unlockedFrets).toBe(quizState.unlockedFrets);
      expect(restored.config).toEqual(quizState.config);
      expect(restored.getPerformanceData(6, 0)!.attempts).toBe(3);
    });

    it('should round-trip preserve unlocked frets', () => {
      // Unlock a few frets
      for (let fret = 0; fret < 3; fret++) {
        quizState.recordAttempt(6, fret, true, 2);
        quizState.recordAttempt(6, fret, true, 2);
        quizState.recordAttempt(6, fret, true, 2);
      }
      
      const json = quizState.toJSON();
      const restored = ProgressiveQuizState.fromJSON(json);
      
      expect(restored.unlockedFrets).toBe(4);
    });
  });

  describe('Reset', () => {
    it('should reset unlocked frets to 1', () => {
      quizState.forceUnlock(5);
      quizState.reset();
      expect(quizState.unlockedFrets).toBe(1);
    });

    it('should clear all performance data', () => {
      quizState.recordAttempt(6, 0, true, 2);
      quizState.reset();
      
      const perf = quizState.getPerformanceData(6, 0);
      expect(perf!.attempts).toBe(0);
      expect(perf!.correct).toBe(0);
      expect(perf!.answerTimes).toEqual([]);
    });
  });

  describe('getAllNoteStats', () => {
    it('should return stats for all 12 notes', () => {
      const allStats = quizState.getAllNoteStats();
      expect(allStats).toHaveLength(12);
    });

    it('should have correct pitch classes in order', () => {
      const allStats = quizState.getAllNoteStats();
      for (let i = 0; i < 12; i++) {
        expect(allStats[i].pitchClass).toBe(E_STRING_NOTES[i]);
        expect(allStats[i].fret).toBe(i);
      }
    });
  });
});
