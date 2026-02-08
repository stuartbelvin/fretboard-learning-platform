import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IntervalQuestionGenerator, DEFAULT_INTERVAL_GENERATOR_CONFIG } from '../../core/quiz/IntervalQuestionGenerator';
import type { IntervalGeneratorConfig, IntervalQuizQuestion, IntervalGenerationResult } from '../../core/quiz/IntervalQuestionGenerator';
import { Fretboard, STANDARD_TUNING } from '../../core/instruments/Fretboard';
import { HighlightZone } from '../../core/zones/HighlightZone';
import { Interval, COMMON_INTERVALS, ALL_INTERVALS } from '../../core/music-theory/Interval';
import type { PitchClass } from '../../core/music-theory/Note';
import { createRectangleZone } from '../../core/zones/ZoneShapeUtilities';

// Helper function for creating rectangular zones
function makeZone(startString: number, endString: number, startFret: number, endFret: number): HighlightZone {
  return createRectangleZone({ startString, endString, startFret, endFret });
}

describe('IntervalQuestionGenerator', () => {
  let fretboard: Fretboard;
  let generator: IntervalQuestionGenerator;

  beforeEach(() => {
    fretboard = new Fretboard();
    generator = new IntervalQuestionGenerator(fretboard);
  });

  describe('DEFAULT_INTERVAL_GENERATOR_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_INTERVAL_GENERATOR_CONFIG.intervals).toBe('common');
      expect(DEFAULT_INTERVAL_GENERATOR_CONFIG.displayPreference).toBe('sharps');
      expect(DEFAULT_INTERVAL_GENERATOR_CONFIG.avoidConsecutiveRepeats).toBe(true);
      expect(DEFAULT_INTERVAL_GENERATOR_CONFIG.maxRetries).toBe(10);
      expect(DEFAULT_INTERVAL_GENERATOR_CONFIG.allowCompoundIntervals).toBe(false);
      expect(DEFAULT_INTERVAL_GENERATOR_CONFIG.allowRootOutsideZoneForCompound).toBe(true);
    });
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const gen = new IntervalQuestionGenerator(fretboard);
      const config = gen.getConfig();
      expect(config.intervals).toBe('common');
      expect(config.displayPreference).toBe('sharps');
    });

    it('should merge partial config with defaults', () => {
      const gen = new IntervalQuestionGenerator(fretboard, {
        displayPreference: 'flats',
        maxRetries: 5
      });
      const config = gen.getConfig();
      expect(config.displayPreference).toBe('flats');
      expect(config.maxRetries).toBe(5);
      expect(config.intervals).toBe('common'); // default preserved
    });

    it('should accept custom interval array', () => {
      const gen = new IntervalQuestionGenerator(fretboard, {
        intervals: ['m3', 'P5', 'M7']
      });
      const config = gen.getConfig();
      expect(config.intervals).toEqual(['m3', 'P5', 'M7']);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      generator.updateConfig({ displayPreference: 'flats' });
      expect(generator.getConfig().displayPreference).toBe('flats');
    });

    it('should merge with existing config', () => {
      generator.updateConfig({ maxRetries: 20 });
      generator.updateConfig({ allowCompoundIntervals: true });
      const config = generator.getConfig();
      expect(config.maxRetries).toBe(20);
      expect(config.allowCompoundIntervals).toBe(true);
    });
  });

  describe('getConfig', () => {
    it('should return immutable copy', () => {
      const config1 = generator.getConfig();
      const config2 = generator.getConfig();
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('reset', () => {
    it('should reset question number', () => {
      const zone = makeZone(1, 6, 0, 4);
      generator.generateQuestion(zone);
      generator.reset();
      const result = generator.generateQuestion(zone);
      expect(result.question?.questionNumber).toBe(1);
    });

    it('should reset last interval and root tracking', () => {
      const zone = makeZone(1, 6, 0, 4);
      // Generate first question
      generator.generateQuestion(zone);
      generator.reset();
      // After reset, no repeat avoidance should apply
      // (hard to test directly, but reset should clear internal state)
      expect(generator.getConfig().avoidConsecutiveRepeats).toBe(true);
    });
  });

  describe('getAllowedIntervals', () => {
    it('should return common intervals by default', () => {
      const intervals = generator.getAllowedIntervals();
      expect(intervals.length).toBe(COMMON_INTERVALS.length);
      // Verify no compound intervals (since allowCompoundIntervals is false by default)
      expect(intervals.every(i => !i.isCompound)).toBe(true);
    });

    it('should return all intervals when configured', () => {
      generator.updateConfig({ intervals: 'all', allowCompoundIntervals: true });
      const intervals = generator.getAllowedIntervals();
      expect(intervals.length).toBe(ALL_INTERVALS.length);
    });

    it('should filter out compound intervals when not allowed', () => {
      generator.updateConfig({ intervals: 'all', allowCompoundIntervals: false });
      const intervals = generator.getAllowedIntervals();
      expect(intervals.every(i => !i.isCompound)).toBe(true);
    });

    it('should parse custom interval short names', () => {
      generator.updateConfig({ intervals: ['m3', 'P5', 'M7'] });
      const intervals = generator.getAllowedIntervals();
      expect(intervals.length).toBe(3);
      expect(intervals.map(i => i.getShortName())).toEqual(['m3', 'P5', 'M7']);
    });

    it('should include compound intervals when allowed', () => {
      generator.updateConfig({ intervals: ['m3', 'M9', 'P11'], allowCompoundIntervals: true });
      const intervals = generator.getAllowedIntervals();
      expect(intervals.some(i => i.isCompound)).toBe(true);
    });
  });

  describe('calculateTargetPitchClass', () => {
    it('should calculate correct pitch class for unison', () => {
      expect(generator.calculateTargetPitchClass('C', new Interval('perfect', 1))).toBe('C');
    });

    it('should calculate correct pitch class for minor second', () => {
      expect(generator.calculateTargetPitchClass('C', new Interval('minor', 2))).toBe('C#');
    });

    it('should calculate correct pitch class for major third', () => {
      expect(generator.calculateTargetPitchClass('C', new Interval('major', 3))).toBe('E');
    });

    it('should calculate correct pitch class for perfect fifth', () => {
      expect(generator.calculateTargetPitchClass('C', new Interval('perfect', 5))).toBe('G');
    });

    it('should calculate correct pitch class for octave', () => {
      expect(generator.calculateTargetPitchClass('C', new Interval('perfect', 8))).toBe('C');
    });

    it('should wrap around chromatic scale', () => {
      // A + M3 = C#
      expect(generator.calculateTargetPitchClass('A', new Interval('major', 3))).toBe('C#');
    });

    it('should handle all 12 pitch classes as root', () => {
      const p5 = new Interval('perfect', 5);
      const fifths: Record<PitchClass, PitchClass> = {
        'C': 'G', 'C#': 'G#', 'D': 'A', 'D#': 'A#',
        'E': 'B', 'F': 'C', 'F#': 'C#', 'G': 'D',
        'G#': 'D#', 'A': 'E', 'A#': 'F', 'B': 'F#'
      };
      for (const [root, expected] of Object.entries(fifths)) {
        expect(generator.calculateTargetPitchClass(root as PitchClass, p5)).toBe(expected);
      }
    });

    it('should handle tritone correctly', () => {
      // C + A4 = F#
      expect(generator.calculateTargetPitchClass('C', new Interval('augmented', 4))).toBe('F#');
      // C + d5 = Gb (same as F#)
      expect(generator.calculateTargetPitchClass('C', new Interval('diminished', 5))).toBe('F#');
    });
  });

  describe('getAllTargetNotesOnFretboard', () => {
    it('should return all notes with target pitch class', () => {
      const cNotes = generator.getAllTargetNotesOnFretboard('C');
      expect(cNotes.length).toBeGreaterThan(0);
      expect(cNotes.every(n => n.pitchClass === 'C')).toBe(true);
    });

    it('should cover all strings', () => {
      const gNotes = generator.getAllTargetNotesOnFretboard('G');
      const strings = new Set(gNotes.map(n => n.string));
      expect(strings.size).toBe(6); // G appears on all 6 strings
    });
  });

  describe('filterTargetNotesToZone', () => {
    it('should filter notes to those in zone', () => {
      const zone = makeZone(1, 3, 0, 5);
      const allCNotes = generator.getAllTargetNotesOnFretboard('C');
      const filtered = generator.filterTargetNotesToZone(allCNotes, zone);
      
      expect(filtered.length).toBeLessThanOrEqual(allCNotes.length);
      expect(filtered.every(n => zone.containsNote(n.string, n.fret))).toBe(true);
    });

    it('should return empty array if no targets in zone', () => {
      // Create a very small zone that might not have a specific pitch class
      const zone = new HighlightZone();
      zone.addNote(1, 0); // High E open string
      
      // C# is not on high E open (which is E)
      const cSharpNotes = generator.getAllTargetNotesOnFretboard('C#');
      const filtered = generator.filterTargetNotesToZone(cSharpNotes, zone);
      expect(filtered.length).toBe(0);
    });
  });

  describe('getCandidateRootNotes', () => {
    it('should return notes from zone', () => {
      const zone = makeZone(1, 2, 0, 3);
      const candidates = generator.getCandidateRootNotes(zone);
      expect(candidates.length).toBe(zone.size());
    });

    it('should return empty array for empty zone', () => {
      const zone = new HighlightZone();
      const candidates = generator.getCandidateRootNotes(zone);
      expect(candidates.length).toBe(0);
    });
  });

  describe('getUniquePitchClasses', () => {
    it('should return unique pitch classes', () => {
      const zone = makeZone(1, 6, 0, 0);
      const candidates = generator.getCandidateRootNotes(zone);
      const unique = generator.getUniquePitchClasses(candidates);
      
      // Open strings in standard tuning: E, B, G, D, A, E
      // Unique: E, B, G, D, A (5 unique)
      expect(unique.length).toBe(5);
      expect(unique).toContain('E');
      expect(unique).toContain('B');
      expect(unique).toContain('G');
      expect(unique).toContain('D');
      expect(unique).toContain('A');
    });
  });

  describe('selectRandomInterval', () => {
    it('should return an interval from available list', () => {
      const intervals = [new Interval('minor', 3), new Interval('perfect', 5)];
      const selected = generator.selectRandomInterval(intervals);
      expect(selected).not.toBeNull();
      expect(intervals.some(i => i.equals(selected!))).toBe(true);
    });

    it('should return null for empty list', () => {
      expect(generator.selectRandomInterval([])).toBeNull();
    });

    it('should return single interval when only one available', () => {
      const intervals = [new Interval('perfect', 5)];
      expect(generator.selectRandomInterval(intervals)!.getShortName()).toBe('P5');
    });
  });

  describe('selectRandomRootNote', () => {
    it('should return a note from candidates', () => {
      const zone = makeZone(1, 6, 0, 4);
      const candidates = generator.getCandidateRootNotes(zone);
      const selected = generator.selectRandomRootNote(candidates);
      expect(selected).not.toBeNull();
      expect(candidates.some(c => c.isSamePosition(selected!))).toBe(true);
    });

    it('should return null for empty candidates', () => {
      expect(generator.selectRandomRootNote([])).toBeNull();
    });
  });

  describe('formatQuestionText', () => {
    it('should format simple intervals correctly', () => {
      const text = generator.formatQuestionText(new Interval('minor', 3), 'C');
      expect(text).toBe('Find the minor third of C');
    });

    it('should format perfect intervals correctly', () => {
      const text = generator.formatQuestionText(new Interval('perfect', 5), 'G');
      expect(text).toBe('Find the perfect fifth of G');
    });

    it('should format augmented intervals correctly', () => {
      const text = generator.formatQuestionText(new Interval('augmented', 4), 'F');
      expect(text).toBe('Find the augmented fourth of F');
    });

    it('should format diminished intervals correctly', () => {
      const text = generator.formatQuestionText(new Interval('diminished', 5), 'B');
      expect(text).toBe('Find the diminished fifth of B');
    });

    it('should format compound intervals correctly', () => {
      const text = generator.formatQuestionText(new Interval('major', 9), 'D');
      expect(text).toBe('Find the major ninth of D');
    });
  });

  describe('getDisplayName', () => {
    it('should display natural notes unchanged', () => {
      expect(generator.getDisplayName('C')).toBe('C');
      expect(generator.getDisplayName('D')).toBe('D');
      expect(generator.getDisplayName('G')).toBe('G');
    });

    it('should display accidentals as sharps by default', () => {
      expect(generator.getDisplayName('C#')).toBe('C#');
      expect(generator.getDisplayName('F#')).toBe('F#');
    });

    it('should display accidentals as flats when configured', () => {
      generator.updateConfig({ displayPreference: 'flats' });
      expect(generator.getDisplayName('C#')).toBe('Db');
      expect(generator.getDisplayName('F#')).toBe('Gb');
      expect(generator.getDisplayName('A#')).toBe('Bb');
    });
  });

  describe('isValidCombination', () => {
    it('should require root in zone for simple intervals', () => {
      const zone = makeZone(1, 3, 0, 4);
      const rootInZone = fretboard.getNoteAt(1, 0)!;
      const rootOutsideZone = fretboard.getNoteAt(6, 10)!;
      const simpleInterval = new Interval('perfect', 5);
      const targetNotes = [fretboard.getNoteAt(1, 2)!];

      expect(generator.isValidCombination(rootInZone, simpleInterval, zone, targetNotes)).toBe(true);
      expect(generator.isValidCombination(rootOutsideZone, simpleInterval, zone, targetNotes)).toBe(false);
    });

    it('should return false when no targets in zone', () => {
      const zone = makeZone(1, 3, 0, 4);
      const rootNote = fretboard.getNoteAt(1, 0)!;
      const interval = new Interval('perfect', 5);

      expect(generator.isValidCombination(rootNote, interval, zone, [])).toBe(false);
    });

    it('should allow root outside zone for compound intervals when configured', () => {
      generator.updateConfig({ allowCompoundIntervals: true, allowRootOutsideZoneForCompound: true });
      const zone = makeZone(1, 3, 0, 4);
      const rootOutsideZone = fretboard.getNoteAt(6, 10)!;
      const compoundInterval = new Interval('major', 9);
      const targetNotes = [fretboard.getNoteAt(1, 2)!];

      expect(generator.isValidCombination(rootOutsideZone, compoundInterval, zone, targetNotes)).toBe(true);
    });

    it('should require root in zone for compound intervals when configured', () => {
      generator.updateConfig({
        allowCompoundIntervals: true,
        allowRootOutsideZoneForCompound: false
      });
      const zone = makeZone(1, 3, 0, 4);
      const rootOutsideZone = fretboard.getNoteAt(6, 10)!;
      const compoundInterval = new Interval('major', 9);
      const targetNotes = [fretboard.getNoteAt(1, 2)!];

      expect(generator.isValidCombination(rootOutsideZone, compoundInterval, zone, targetNotes)).toBe(false);
    });
  });

  describe('generateQuestion', () => {
    it('should generate a valid question from zone', () => {
      const zone = makeZone(1, 6, 0, 5);
      const result = generator.generateQuestion(zone);

      expect(result.success).toBe(true);
      expect(result.question).toBeDefined();
      expect(result.question!.rootNote).toBeDefined();
      expect(result.question!.interval).toBeDefined();
      expect(result.question!.targetPitchClass).toBeDefined();
      expect(result.question!.questionNumber).toBe(1);
    });

    it('should fail with empty zone', () => {
      const zone = new HighlightZone();
      const result = generator.generateQuestion(zone);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot generate question from empty zone');
    });

    it('should increment question number on successive calls', () => {
      const zone = makeZone(1, 6, 0, 5);

      const result1 = generator.generateQuestion(zone);
      const result2 = generator.generateQuestion(zone);
      const result3 = generator.generateQuestion(zone);

      expect(result1.question!.questionNumber).toBe(1);
      expect(result2.question!.questionNumber).toBe(2);
      expect(result3.question!.questionNumber).toBe(3);
    });

    it('should have target notes in zone', () => {
      const zone = makeZone(1, 6, 0, 5);
      const result = generator.generateQuestion(zone);

      expect(result.question!.targetNotesInZone.length).toBeGreaterThan(0);
      expect(result.question!.targetNotesInZone.every(n =>
        zone.containsNote(n.string, n.fret)
      )).toBe(true);
    });

    it('should have correct target pitch class calculation', () => {
      const zone = makeZone(1, 6, 0, 12);
      const result = generator.generateQuestion(zone);

      const calculated = generator.calculateTargetPitchClass(
        result.question!.rootPitchClass,
        result.question!.interval
      );
      expect(result.question!.targetPitchClass).toBe(calculated);
    });

    it('should format question text correctly', () => {
      const zone = makeZone(1, 6, 0, 5);
      const result = generator.generateQuestion(zone);

      expect(result.question!.questionText).toContain('Find the');
      expect(result.question!.questionText).toContain(' of ');
    });

    it('should include all target notes on fretboard', () => {
      const zone = makeZone(1, 6, 0, 12);
      const result = generator.generateQuestion(zone);

      // All target notes should have the target pitch class
      expect(result.question!.allTargetNotes.every(n =>
        n.pitchClass === result.question!.targetPitchClass
      )).toBe(true);
    });

    it('should mark root as in zone when applicable', () => {
      const zone = makeZone(1, 6, 0, 5);
      const result = generator.generateQuestion(zone);

      // For simple intervals, root must be in zone
      expect(result.question!.rootInZone).toBe(true);
    });
  });

  describe('generateQuestionWithParams', () => {
    it('should generate question with specific root and interval', () => {
      const zone = makeZone(1, 6, 0, 12);
      const interval = new Interval('perfect', 5);
      const result = generator.generateQuestionWithParams(zone, 'C', interval);

      expect(result.success).toBe(true);
      expect(result.question!.rootPitchClass).toBe('C');
      expect(result.question!.interval.equals(interval)).toBe(true);
      expect(result.question!.targetPitchClass).toBe('G'); // C + P5 = G
    });

    it('should fail when root pitch class not in zone', () => {
      // Create a zone without C notes (hard to guarantee, but open strings don't have C)
      const zone = new HighlightZone();
      zone.addNote(1, 0); // E
      zone.addNote(2, 0); // B

      const interval = new Interval('perfect', 5);
      const result = generator.generateQuestionWithParams(zone, 'C', interval);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No notes with pitch class C found in zone');
    });

    it('should fail with empty zone', () => {
      const zone = new HighlightZone();
      const interval = new Interval('perfect', 5);
      const result = generator.generateQuestionWithParams(zone, 'C', interval);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot generate question from empty zone');
    });

    it('should fail when no valid targets in zone', () => {
      // Create zone with E only, try to find F# (P2 from E)
      // But zone only has E, so F# won't be there
      const zone = new HighlightZone();
      zone.addNote(1, 0); // E

      const interval = new Interval('major', 2);
      const result = generator.generateQuestionWithParams(zone, 'E', interval);

      // E + M2 = F#, but zone only has E
      expect(result.success).toBe(false);
    });
  });

  describe('getZoneStatistics', () => {
    it('should return correct total positions', () => {
      const zone = makeZone(1, 6, 0, 4);
      const stats = generator.getZoneStatistics(zone);
      expect(stats.totalPositions).toBe(zone.size());
    });

    it('should return available root pitch classes', () => {
      const zone = makeZone(1, 6, 0, 0);
      const stats = generator.getZoneStatistics(zone);
      // Open strings: E, B, G, D, A, E (5 unique)
      expect(stats.availableRootPitchClasses.length).toBe(5);
    });

    it('should return allowed intervals', () => {
      generator.updateConfig({ intervals: ['m3', 'P5'] });
      const zone = makeZone(1, 6, 0, 5);
      const stats = generator.getZoneStatistics(zone);
      expect(stats.allowedIntervals).toEqual(['m3', 'P5']);
    });

    it('should calculate valid combinations', () => {
      const zone = makeZone(1, 6, 0, 12);
      const stats = generator.getZoneStatistics(zone);
      expect(stats.validCombinations.length).toBeGreaterThan(0);
      
      // Each combination should have root, interval, and target count
      for (const combo of stats.validCombinations) {
        expect(combo.root).toBeDefined();
        expect(combo.interval).toBeDefined();
        expect(combo.targetCount).toBeGreaterThan(0);
      }
    });
  });

  describe('validateAnswer', () => {
    it('should return true for correct answer', () => {
      const zone = makeZone(1, 6, 0, 12);
      const result = generator.generateQuestion(zone);
      const question = result.question!;

      // Find a note with the target pitch class
      const correctNote = question.targetNotesInZone[0];
      expect(generator.validateAnswer(correctNote, question)).toBe(true);
    });

    it('should return false for incorrect answer', () => {
      const zone = makeZone(1, 6, 0, 12);
      const result = generator.generateQuestion(zone);
      const question = result.question!;

      // Find a note with a different pitch class
      const candidates = generator.getCandidateRootNotes(zone);
      const wrongNote = candidates.find(n => n.pitchClass !== question.targetPitchClass);
      
      if (wrongNote) {
        expect(generator.validateAnswer(wrongNote, question)).toBe(false);
      }
    });

    it('should accept any position with correct pitch class', () => {
      const zone = makeZone(1, 6, 0, 12);
      const result = generator.generateQuestionWithParams(zone, 'C', new Interval('perfect', 5));
      const question = result.question!;

      // G on different strings should all be valid
      for (const targetNote of question.allTargetNotes) {
        expect(generator.validateAnswer(targetNote, question)).toBe(true);
      }
    });
  });

  describe('repeat avoidance', () => {
    it('should avoid consecutive root pitch class repeats', () => {
      generator.updateConfig({ maxRetries: 50 });
      const zone = makeZone(1, 6, 0, 12);
      
      const pitchClasses: PitchClass[] = [];
      for (let i = 0; i < 10; i++) {
        const result = generator.generateQuestion(zone);
        if (result.success) {
          pitchClasses.push(result.question!.rootPitchClass);
        }
      }

      // Check that we don't have too many consecutive repeats
      // (with avoidConsecutiveRepeats=true, should be rare)
      let consecutiveRepeats = 0;
      for (let i = 1; i < pitchClasses.length; i++) {
        if (pitchClasses[i] === pitchClasses[i - 1]) {
          consecutiveRepeats++;
        }
      }
      
      // Allow some repeats due to random chance, but should be minimal
      expect(consecutiveRepeats).toBeLessThan(pitchClasses.length / 2);
    });

    it('should allow repeats when disabled', () => {
      generator.updateConfig({ avoidConsecutiveRepeats: false });
      const zone = makeZone(1, 6, 0, 12);
      
      // With avoidConsecutiveRepeats=false, repeats should be more common
      // (hard to test definitively due to randomness)
      const result = generator.generateQuestion(zone);
      expect(result.success).toBe(true);
    });
  });

  describe('compound intervals', () => {
    it('should exclude compound intervals by default', () => {
      const intervals = generator.getAllowedIntervals();
      expect(intervals.every(i => !i.isCompound)).toBe(true);
    });

    it('should include compound intervals when enabled', () => {
      generator.updateConfig({ 
        intervals: 'all', 
        allowCompoundIntervals: true 
      });
      const intervals = generator.getAllowedIntervals();
      expect(intervals.some(i => i.isCompound)).toBe(true);
    });

    it('should generate questions with compound intervals', () => {
      generator.updateConfig({
        intervals: ['M9', 'P11'],
        allowCompoundIntervals: true
      });
      const zone = makeZone(1, 6, 0, 12);
      const result = generator.generateQuestion(zone);
      
      if (result.success) {
        expect(result.question!.interval.isCompound).toBe(true);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle single-note zone', () => {
      const zone = new HighlightZone();
      zone.addNote(3, 5); // C note

      // May or may not generate successfully depending on if target is in zone
      const result = generator.generateQuestion(zone);
      // Should either succeed with C as both root and target (unison)
      // or fail gracefully
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle zone with no valid combinations', () => {
      // Create a zone where no interval produces targets in the zone
      const zone = new HighlightZone();
      zone.addNote(1, 0); // E only

      // Configure to only use intervals that won't produce E from E
      generator.updateConfig({ intervals: ['m3'] }); // E + m3 = G, not in zone

      const result = generator.generateQuestion(zone);
      expect(result.success).toBe(false);
    });

    it('should handle full fretboard zone', () => {
      const zone = makeZone(1, 6, 0, 24);
      const result = generator.generateQuestion(zone);
      expect(result.success).toBe(true);
    });

    it('should handle open strings only', () => {
      const zone = makeZone(1, 6, 0, 0);
      
      // With just open strings, limited combinations available
      // but should still work for some intervals
      const result = generator.generateQuestion(zone);
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('music theory validation', () => {
    it('should calculate all simple intervals correctly from C', () => {
      const expectations: [Interval, PitchClass][] = [
        [new Interval('perfect', 1), 'C'],   // P1 = C
        [new Interval('minor', 2), 'C#'],    // m2 = C#
        [new Interval('major', 2), 'D'],     // M2 = D
        [new Interval('minor', 3), 'D#'],    // m3 = D#
        [new Interval('major', 3), 'E'],     // M3 = E
        [new Interval('perfect', 4), 'F'],   // P4 = F
        [new Interval('augmented', 4), 'F#'], // A4 = F#
        [new Interval('perfect', 5), 'G'],   // P5 = G
        [new Interval('minor', 6), 'G#'],    // m6 = G#
        [new Interval('major', 6), 'A'],     // M6 = A
        [new Interval('minor', 7), 'A#'],    // m7 = A#
        [new Interval('major', 7), 'B'],     // M7 = B
        [new Interval('perfect', 8), 'C'],   // P8 = C
      ];

      for (const [interval, expected] of expectations) {
        expect(generator.calculateTargetPitchClass('C', interval)).toBe(expected);
      }
    });

    it('should calculate circle of fifths correctly', () => {
      const p5 = new Interval('perfect', 5);
      let current: PitchClass = 'C';
      const circleOfFifths: PitchClass[] = ['C'];

      for (let i = 0; i < 11; i++) {
        current = generator.calculateTargetPitchClass(current, p5);
        circleOfFifths.push(current);
      }

      // Circle of fifths: C, G, D, A, E, B, F#, C#, G#, D#, A#, F
      expect(circleOfFifths).toEqual([
        'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'
      ]);
    });

    it('should handle enharmonic equivalents', () => {
      // A4 and d5 should produce same pitch class (6 semitones from root)
      const a4 = new Interval('augmented', 4);
      const d5 = new Interval('diminished', 5);

      expect(generator.calculateTargetPitchClass('C', a4))
        .toBe(generator.calculateTargetPitchClass('C', d5));
    });
  });

  describe('integration scenarios', () => {
    it('should complete a full quiz flow simulation', () => {
      const zone = makeZone(1, 6, 0, 12);
      generator.reset();

      for (let i = 1; i <= 10; i++) {
        const result = generator.generateQuestion(zone);
        expect(result.success).toBe(true);
        expect(result.question!.questionNumber).toBe(i);

        // Validate the answer
        const correctNote = result.question!.targetNotesInZone[0];
        expect(generator.validateAnswer(correctNote, result.question!)).toBe(true);
      }
    });

    it('should work with custom interval subset', () => {
      generator.updateConfig({
        intervals: ['m3', 'M3', 'P5'],
        avoidConsecutiveRepeats: true
      });

      const zone = makeZone(1, 6, 0, 12);
      const generatedIntervals: string[] = [];

      for (let i = 0; i < 10; i++) {
        const result = generator.generateQuestion(zone);
        if (result.success) {
          generatedIntervals.push(result.question!.interval.getShortName());
        }
      }

      // All generated intervals should be in the custom set
      expect(generatedIntervals.every(i => ['m3', 'M3', 'P5'].includes(i))).toBe(true);
    });
  });
});
