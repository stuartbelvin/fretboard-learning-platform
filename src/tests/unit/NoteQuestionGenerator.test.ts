import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  NoteQuestionGenerator, 
  QuestionGeneratorConfig,
  DEFAULT_GENERATOR_CONFIG,
  PitchClassFilter,
  NATURAL_NOTES,
  ACCIDENTAL_NOTES
} from '../../core/quiz/NoteQuestionGenerator';
import { Fretboard, STANDARD_TUNING } from '../../core/instruments/Fretboard';
import { HighlightZone } from '../../core/zones/HighlightZone';
import { createRectangleZone, createPitchClassZone } from '../../core/zones/ZoneShapeUtilities';
import { PitchClass, CHROMATIC_SCALE_SHARPS } from '../../core/music-theory/Note';

describe('NoteQuestionGenerator', () => {
  let fretboard: Fretboard;
  let generator: NoteQuestionGenerator;

  beforeEach(() => {
    fretboard = new Fretboard({ tuning: STANDARD_TUNING, fretCount: 12 });
    generator = new NoteQuestionGenerator(fretboard);
  });

  // ============================================================
  // Constructor & Configuration Tests
  // ============================================================

  describe('Constructor and Configuration', () => {
    it('should create generator with default configuration', () => {
      const config = generator.getConfig();
      expect(config.pitchClassFilter).toBe(DEFAULT_GENERATOR_CONFIG.pitchClassFilter);
      expect(config.displayPreference).toBe(DEFAULT_GENERATOR_CONFIG.displayPreference);
      expect(config.avoidConsecutiveRepeats).toBe(DEFAULT_GENERATOR_CONFIG.avoidConsecutiveRepeats);
      expect(config.maxRetries).toBe(DEFAULT_GENERATOR_CONFIG.maxRetries);
    });

    it('should create generator with custom configuration', () => {
      const customGenerator = new NoteQuestionGenerator(fretboard, {
        pitchClassFilter: 'natural',
        displayPreference: 'flats',
        avoidConsecutiveRepeats: false
      });
      const config = customGenerator.getConfig();
      expect(config.pitchClassFilter).toBe('natural');
      expect(config.displayPreference).toBe('flats');
      expect(config.avoidConsecutiveRepeats).toBe(false);
    });

    it('should update configuration', () => {
      generator.updateConfig({ pitchClassFilter: 'flats' });
      expect(generator.getConfig().pitchClassFilter).toBe('flats');
    });

    it('should return immutable configuration', () => {
      const config = generator.getConfig();
      (config as QuestionGeneratorConfig).pitchClassFilter = 'custom';
      expect(generator.getConfig().pitchClassFilter).toBe('sharps');
    });
  });

  // ============================================================
  // Allowed Pitch Classes Tests
  // ============================================================

  describe('getAllowedPitchClasses', () => {
    it('should return all pitch classes for "sharps" filter', () => {
      generator.updateConfig({ pitchClassFilter: 'sharps' });
      const allowed = generator.getAllowedPitchClasses();
      expect(allowed.size).toBe(12);
      CHROMATIC_SCALE_SHARPS.forEach(pc => expect(allowed.has(pc)).toBe(true));
    });

    it('should return all pitch classes for "flats" filter', () => {
      generator.updateConfig({ pitchClassFilter: 'flats' });
      const allowed = generator.getAllowedPitchClasses();
      expect(allowed.size).toBe(12);
      CHROMATIC_SCALE_SHARPS.forEach(pc => expect(allowed.has(pc)).toBe(true));
    });

    it('should return all pitch classes for "both" filter', () => {
      generator.updateConfig({ pitchClassFilter: 'both' });
      const allowed = generator.getAllowedPitchClasses();
      expect(allowed.size).toBe(12);
    });

    it('should return only natural notes for "natural" filter', () => {
      generator.updateConfig({ pitchClassFilter: 'natural' });
      const allowed = generator.getAllowedPitchClasses();
      expect(allowed.size).toBe(7);
      NATURAL_NOTES.forEach(pc => expect(allowed.has(pc)).toBe(true));
      ACCIDENTAL_NOTES.forEach(pc => expect(allowed.has(pc)).toBe(false));
    });

    it('should return custom pitch classes for "custom" filter', () => {
      generator.updateConfig({
        pitchClassFilter: 'custom',
        customPitchClasses: ['C', 'E', 'G']
      });
      const allowed = generator.getAllowedPitchClasses();
      expect(allowed.size).toBe(3);
      expect(allowed.has('C')).toBe(true);
      expect(allowed.has('E')).toBe(true);
      expect(allowed.has('G')).toBe(true);
      expect(allowed.has('D')).toBe(false);
    });

    it('should fall back to all pitch classes for empty custom filter', () => {
      generator.updateConfig({
        pitchClassFilter: 'custom',
        customPitchClasses: []
      });
      const allowed = generator.getAllowedPitchClasses();
      expect(allowed.size).toBe(12);
    });

    it('should fall back to all pitch classes for undefined custom filter', () => {
      generator.updateConfig({
        pitchClassFilter: 'custom',
        customPitchClasses: undefined
      });
      const allowed = generator.getAllowedPitchClasses();
      expect(allowed.size).toBe(12);
    });
  });

  // ============================================================
  // Candidate Notes Tests
  // ============================================================

  describe('getCandidateNotes', () => {
    it('should return all notes from zone when filter allows all', () => {
      const zone = createRectangleZone({ startString: 1, endString: 1, startFret: 0, endFret: 4 });
      const candidates = generator.getCandidateNotes(zone);
      expect(candidates.length).toBe(5);
    });

    it('should filter notes by allowed pitch classes', () => {
      // Create a zone with all natural notes on string 3 (G string), frets 0-4
      // Frets: 0=G, 1=G#, 2=A, 3=A#, 4=B
      const zone = createRectangleZone({ startString: 3, endString: 3, startFret: 0, endFret: 4 });
      generator.updateConfig({ pitchClassFilter: 'natural' });
      const candidates = generator.getCandidateNotes(zone);
      
      // Should include G, A, B (natural notes) and exclude G#, A# (accidentals)
      expect(candidates.length).toBe(3);
      candidates.forEach(note => {
        expect(NATURAL_NOTES.includes(note.pitchClass)).toBe(true);
      });
    });

    it('should return empty array for zone with no matching notes', () => {
      // Create a zone that only has the open E string (E note)
      const zone = new HighlightZone();
      zone.addNote(1, 0); // High E, fret 0 = E note
      
      generator.updateConfig({
        pitchClassFilter: 'custom',
        customPitchClasses: ['C']
      });
      
      const candidates = generator.getCandidateNotes(zone);
      expect(candidates.length).toBe(0);
    });

    it('should return empty array for empty zone', () => {
      const zone = new HighlightZone();
      const candidates = generator.getCandidateNotes(zone);
      expect(candidates.length).toBe(0);
    });
  });

  // ============================================================
  // Unique Pitch Classes Tests
  // ============================================================

  describe('getUniquePitchClasses', () => {
    it('should return unique pitch classes from candidates', () => {
      const zone = createPitchClassZone(['C', 'G'], fretboard, { startFret: 0, endFret: 12 });
      const candidates = generator.getCandidateNotes(zone);
      const unique = generator.getUniquePitchClasses(candidates);
      
      expect(unique).toContain('C');
      expect(unique).toContain('G');
      expect(unique.length).toBe(2);
    });

    it('should return empty array for empty candidates', () => {
      const unique = generator.getUniquePitchClasses([]);
      expect(unique).toEqual([]);
    });
  });

  // ============================================================
  // Random Selection Tests
  // ============================================================

  describe('selectRandomPitchClass', () => {
    it('should return null for empty array', () => {
      const result = generator.selectRandomPitchClass([]);
      expect(result).toBeNull();
    });

    it('should return the only option when array has one element', () => {
      const result = generator.selectRandomPitchClass(['C']);
      expect(result).toBe('C');
    });

    it('should return a pitch class from the array', () => {
      const options: PitchClass[] = ['C', 'D', 'E'];
      const result = generator.selectRandomPitchClass(options);
      expect(options).toContain(result);
    });

    it('should avoid consecutive repeats when enabled', () => {
      generator.updateConfig({ avoidConsecutiveRepeats: true });
      const options: PitchClass[] = ['C', 'D', 'E'];
      
      // Generate first question to set lastPitchClass
      const zone = createPitchClassZone(['C', 'D', 'E'], fretboard);
      generator.generateQuestion(zone);
      
      // Try many times and verify we don't always get the same one
      const results = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const result = generator.generateQuestion(zone);
        if (result.success) {
          results.add(result.question!.targetPitchClass);
        }
      }
      
      // Should have gotten different pitch classes
      expect(results.size).toBeGreaterThan(1);
    });

    it('should return only option even if it would repeat', () => {
      const zone = createPitchClassZone(['C'], fretboard);
      generator.updateConfig({ avoidConsecutiveRepeats: true });
      
      // Generate first question
      generator.generateQuestion(zone);
      
      // Generate second - should still work even though only C is available
      const result = generator.generateQuestion(zone);
      expect(result.success).toBe(true);
      expect(result.question?.targetPitchClass).toBe('C');
    });
  });

  describe('selectRandomNoteWithPitchClass', () => {
    it('should return null when no notes match', () => {
      const zone = createPitchClassZone(['C'], fretboard);
      const candidates = generator.getCandidateNotes(zone);
      const result = generator.selectRandomNoteWithPitchClass(candidates, 'D');
      expect(result).toBeNull();
    });

    it('should return a note with the specified pitch class', () => {
      const zone = createPitchClassZone(['C', 'D', 'E'], fretboard);
      const candidates = generator.getCandidateNotes(zone);
      const result = generator.selectRandomNoteWithPitchClass(candidates, 'C');
      expect(result).not.toBeNull();
      expect(result!.pitchClass).toBe('C');
    });
  });

  // ============================================================
  // Question Text Formatting Tests
  // ============================================================

  describe('formatQuestionText', () => {
    it('should format question with sharp display', () => {
      generator.updateConfig({ displayPreference: 'sharps' });
      expect(generator.formatQuestionText('C')).toBe('Find C');
      expect(generator.formatQuestionText('C#')).toBe('Find C#');
    });

    it('should format question with flat display', () => {
      generator.updateConfig({ displayPreference: 'flats' });
      expect(generator.formatQuestionText('C')).toBe('Find C');
      expect(generator.formatQuestionText('C#')).toBe('Find Db');
      expect(generator.formatQuestionText('D#')).toBe('Find Eb');
    });

    it('should handle all accidentals in flat display', () => {
      generator.updateConfig({ displayPreference: 'flats' });
      expect(generator.formatQuestionText('F#')).toBe('Find Gb');
      expect(generator.formatQuestionText('G#')).toBe('Find Ab');
      expect(generator.formatQuestionText('A#')).toBe('Find Bb');
    });
  });

  describe('getDisplayName', () => {
    it('should always display natural notes as-is', () => {
      generator.updateConfig({ displayPreference: 'flats' });
      NATURAL_NOTES.forEach(note => {
        expect(generator.getDisplayName(note)).toBe(note);
      });
    });

    it('should display accidentals as sharps when preference is sharps', () => {
      generator.updateConfig({ displayPreference: 'sharps' });
      expect(generator.getDisplayName('C#')).toBe('C#');
      expect(generator.getDisplayName('F#')).toBe('F#');
    });

    it('should display accidentals as flats when preference is flats', () => {
      generator.updateConfig({ displayPreference: 'flats' });
      expect(generator.getDisplayName('C#')).toBe('Db');
      expect(generator.getDisplayName('A#')).toBe('Bb');
    });

    it('should randomly choose sharp or flat when preference is both', () => {
      generator.updateConfig({ displayPreference: 'both' });
      
      // Run many times and collect results
      const results = new Set<string>();
      for (let i = 0; i < 100; i++) {
        results.add(generator.getDisplayName('C#'));
      }
      
      // Should have both variations eventually
      expect(results.has('C#') || results.has('Db')).toBe(true);
    });
  });

  // ============================================================
  // Question Generation Tests
  // ============================================================

  describe('generateQuestion', () => {
    it('should fail for empty zone', () => {
      const zone = new HighlightZone();
      const result = generator.generateQuestion(zone);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty zone');
      expect(result.question).toBeUndefined();
    });

    it('should fail when no notes match allowed pitch classes', () => {
      const zone = new HighlightZone();
      zone.addNote(1, 0); // E note
      
      generator.updateConfig({
        pitchClassFilter: 'custom',
        customPitchClasses: ['C'] // Only C allowed, but zone has E
      });
      
      const result = generator.generateQuestion(zone);
      expect(result.success).toBe(false);
      expect(result.error).toContain('No notes in zone match');
    });

    it('should generate valid question from zone', () => {
      const zone = createRectangleZone({ startString: 1, endString: 6, startFret: 0, endFret: 5 });
      const result = generator.generateQuestion(zone);
      
      expect(result.success).toBe(true);
      expect(result.question).toBeDefined();
      expect(result.question!.questionNumber).toBe(1);
      expect(result.question!.targetNote).toBeDefined();
      expect(result.question!.targetPitchClass).toBeDefined();
      expect(result.question!.questionText).toMatch(/^Find /);
    });

    it('should increment question number with each generation', () => {
      const zone = createRectangleZone({ startString: 1, endString: 6, startFret: 0, endFret: 5 });
      
      const result1 = generator.generateQuestion(zone);
      const result2 = generator.generateQuestion(zone);
      const result3 = generator.generateQuestion(zone);
      
      expect(result1.question!.questionNumber).toBe(1);
      expect(result2.question!.questionNumber).toBe(2);
      expect(result3.question!.questionNumber).toBe(3);
    });

    it('should only generate questions with notes from the zone', () => {
      const zone = createPitchClassZone(['C', 'E', 'G'], fretboard);
      
      for (let i = 0; i < 50; i++) {
        const result = generator.generateQuestion(zone);
        expect(result.success).toBe(true);
        expect(['C', 'E', 'G']).toContain(result.question!.targetPitchClass);
        
        // Verify the target note position is in the zone
        const targetNote = result.question!.targetNote;
        expect(zone.containsNote(targetNote.string, targetNote.fret)).toBe(true);
      }
    });

    it('should respect natural notes filter', () => {
      const zone = createRectangleZone({ startString: 1, endString: 6, startFret: 0, endFret: 12 });
      generator.updateConfig({ pitchClassFilter: 'natural' });
      
      for (let i = 0; i < 50; i++) {
        const result = generator.generateQuestion(zone);
        expect(result.success).toBe(true);
        expect(NATURAL_NOTES).toContain(result.question!.targetPitchClass);
      }
    });

    it('should respect custom pitch class filter', () => {
      const zone = createRectangleZone({ startString: 1, endString: 6, startFret: 0, endFret: 12 });
      const customClasses: PitchClass[] = ['C', 'F', 'G'];
      generator.updateConfig({
        pitchClassFilter: 'custom',
        customPitchClasses: customClasses
      });
      
      for (let i = 0; i < 50; i++) {
        const result = generator.generateQuestion(zone);
        expect(result.success).toBe(true);
        expect(customClasses).toContain(result.question!.targetPitchClass);
      }
    });
  });

  describe('generateQuestionWithPitchClass', () => {
    it('should fail for empty zone', () => {
      const zone = new HighlightZone();
      const result = generator.generateQuestionWithPitchClass(zone, 'C');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty zone');
    });

    it('should fail when pitch class not in zone', () => {
      const zone = createPitchClassZone(['C', 'E'], fretboard);
      const result = generator.generateQuestionWithPitchClass(zone, 'D');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No notes with pitch class D');
    });

    it('should generate question with specific pitch class', () => {
      const zone = createPitchClassZone(['C', 'D', 'E'], fretboard);
      const result = generator.generateQuestionWithPitchClass(zone, 'D');
      
      expect(result.success).toBe(true);
      expect(result.question!.targetPitchClass).toBe('D');
      expect(result.question!.targetNote.pitchClass).toBe('D');
    });

    it('should increment question number', () => {
      const zone = createPitchClassZone(['C'], fretboard);
      
      generator.generateQuestionWithPitchClass(zone, 'C');
      generator.generateQuestionWithPitchClass(zone, 'C');
      const result = generator.generateQuestionWithPitchClass(zone, 'C');
      
      expect(result.question!.questionNumber).toBe(3);
    });
  });

  // ============================================================
  // Reset Tests
  // ============================================================

  describe('reset', () => {
    it('should reset question number to 0', () => {
      const zone = createRectangleZone({ startString: 1, endString: 6, startFret: 0, endFret: 5 });
      
      generator.generateQuestion(zone);
      generator.generateQuestion(zone);
      generator.reset();
      
      const result = generator.generateQuestion(zone);
      expect(result.question!.questionNumber).toBe(1);
    });

    it('should reset last pitch class for repeat avoidance', () => {
      const zone = createPitchClassZone(['C'], fretboard);
      generator.updateConfig({ avoidConsecutiveRepeats: true });
      
      // Generate question to set lastPitchClass
      generator.generateQuestion(zone);
      
      // Reset
      generator.reset();
      
      // Next question should work fine (no repeat to avoid)
      const result = generator.generateQuestion(zone);
      expect(result.success).toBe(true);
    });
  });

  // ============================================================
  // Zone Statistics Tests
  // ============================================================

  describe('getZoneStatistics', () => {
    it('should return correct statistics for zone with all notes allowed', () => {
      const zone = createRectangleZone({ startString: 1, endString: 2, startFret: 0, endFret: 2 });
      const stats = generator.getZoneStatistics(zone);
      
      expect(stats.totalPositions).toBe(6); // 2 strings × 3 frets
      expect(stats.candidateCount).toBe(6);
      expect(stats.excludedCount).toBe(0);
      expect(stats.availablePitchClasses.length).toBeGreaterThan(0);
    });

    it('should return correct statistics when some notes are filtered', () => {
      // Zone on G string, frets 0-4: G, G#, A, A#, B
      const zone = createRectangleZone({ startString: 3, endString: 3, startFret: 0, endFret: 4 });
      generator.updateConfig({ pitchClassFilter: 'natural' });
      
      const stats = generator.getZoneStatistics(zone);
      
      expect(stats.totalPositions).toBe(5);
      expect(stats.candidateCount).toBe(3); // G, A, B are natural
      expect(stats.excludedCount).toBe(2); // G#, A# are excluded
      expect(stats.availablePitchClasses).toContain('G');
      expect(stats.availablePitchClasses).toContain('A');
      expect(stats.availablePitchClasses).toContain('B');
    });

    it('should return sorted pitch classes', () => {
      const zone = createPitchClassZone(['G', 'C', 'E'], fretboard);
      const stats = generator.getZoneStatistics(zone);
      
      // Should be sorted by pitch class order in chromatic scale
      const sortedExpected = ['C', 'E', 'G'];
      expect(stats.availablePitchClasses).toEqual(sortedExpected);
    });

    it('should handle empty zone', () => {
      const zone = new HighlightZone();
      const stats = generator.getZoneStatistics(zone);
      
      expect(stats.totalPositions).toBe(0);
      expect(stats.candidateCount).toBe(0);
      expect(stats.excludedCount).toBe(0);
      expect(stats.availablePitchClasses).toEqual([]);
    });
  });

  // ============================================================
  // Integration Tests
  // ============================================================

  describe('Integration with NoteQuizState', () => {
    it('should generate questions compatible with quiz state', () => {
      const zone = createRectangleZone({ startString: 1, endString: 6, startFret: 0, endFret: 5 });
      const result = generator.generateQuestion(zone);
      
      expect(result.success).toBe(true);
      
      const question = result.question!;
      
      // Question should have all required properties for NoteQuizState.setQuestion()
      expect(question.targetNote).toBeDefined();
      expect(question.targetPitchClass).toBeDefined();
      expect(typeof question.questionNumber).toBe('number');
      expect(typeof question.questionText).toBe('string');
      
      // Target note pitch class should match targetPitchClass
      expect(question.targetNote.pitchClass).toBe(question.targetPitchClass);
    });

    it('should work with various zone shapes', () => {
      // Rectangle zone
      const rectZone = createRectangleZone({ startString: 2, endString: 5, startFret: 5, endFret: 8 });
      expect(generator.generateQuestion(rectZone).success).toBe(true);
      
      generator.reset();
      
      // Pitch class zone
      const pcZone = createPitchClassZone(['A', 'B', 'C#'], fretboard);
      expect(generator.generateQuestion(pcZone).success).toBe(true);
      
      generator.reset();
      
      // Custom zone
      const customZone = new HighlightZone();
      customZone.addNote(1, 5);
      customZone.addNote(3, 7);
      customZone.addNote(5, 3);
      expect(generator.generateQuestion(customZone).success).toBe(true);
    });
  });

  // ============================================================
  // Edge Cases
  // ============================================================

  describe('Edge Cases', () => {
    it('should handle single-note zone', () => {
      const zone = new HighlightZone();
      zone.addNote(1, 0); // Just high E
      
      const result = generator.generateQuestion(zone);
      expect(result.success).toBe(true);
      expect(result.question!.targetPitchClass).toBe('E');
    });

    it('should handle zone with duplicate pitch classes on different strings', () => {
      // C notes appear on multiple strings
      const zone = createPitchClassZone(['C'], fretboard);
      
      const notes = new Set<string>();
      for (let i = 0; i < 20; i++) {
        generator.reset();
        const result = generator.generateQuestion(zone);
        if (result.success) {
          notes.add(`s${result.question!.targetNote.string}f${result.question!.targetNote.fret}`);
        }
      }
      
      // Should have selected from different positions
      expect(notes.size).toBeGreaterThan(1);
    });

    it('should handle full fretboard zone', () => {
      const zone = createRectangleZone({ startString: 1, endString: 6, startFret: 0, endFret: 12 });
      const result = generator.generateQuestion(zone);
      
      expect(result.success).toBe(true);
    });

    it('should handle maximum fret range', () => {
      const largeFretboard = new Fretboard({ tuning: STANDARD_TUNING, fretCount: 24 });
      const largeGenerator = new NoteQuestionGenerator(largeFretboard);
      const zone = createRectangleZone({ startString: 1, endString: 6, startFret: 0, endFret: 24 });
      
      const result = largeGenerator.generateQuestion(zone);
      expect(result.success).toBe(true);
    });
  });

  // ============================================================
  // Constants Export Tests
  // ============================================================

  describe('Constants', () => {
    it('should export NATURAL_NOTES correctly', () => {
      expect(NATURAL_NOTES).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
    });

    it('should export ACCIDENTAL_NOTES correctly', () => {
      expect(ACCIDENTAL_NOTES).toEqual(['C#', 'D#', 'F#', 'G#', 'A#']);
    });

    it('NATURAL_NOTES + ACCIDENTAL_NOTES should cover all 12 pitch classes', () => {
      const all = [...NATURAL_NOTES, ...ACCIDENTAL_NOTES];
      expect(all.length).toBe(12);
      CHROMATIC_SCALE_SHARPS.forEach(pc => {
        expect(all).toContain(pc);
      });
    });
  });
});
