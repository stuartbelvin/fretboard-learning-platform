import { describe, it, expect, beforeEach } from 'vitest';
import { Interval, COMMON_INTERVALS, SIMPLE_INTERVALS, COMPOUND_INTERVALS } from '../../core/music-theory/Interval';
import { IntervalQuestionGenerator } from '../../core/quiz/IntervalQuestionGenerator';
import { Fretboard } from '../../core/instruments/Fretboard';
import type { PitchClass } from '../../core/music-theory/Note';

/**
 * INT-004: Interval Question Text
 * 
 * PRD Requirements:
 * - Format: "Find the [spelled interval] of [root note]"
 * - Spell intervals fully: "minor third", "augmented fifth"
 * - Support compound intervals: "major tenth"
 * - Manual test: Question text reads naturally
 * 
 * This test file validates all PRD requirements for interval question text formatting.
 */
describe('INT-004: Interval Question Text', () => {
  let generator: IntervalQuestionGenerator;
  let fretboard: Fretboard;

  beforeEach(() => {
    fretboard = new Fretboard();
    generator = new IntervalQuestionGenerator(fretboard);
  });

  describe('Question text format', () => {
    it('should follow format "Find the [spelled interval] of [root note]"', () => {
      const text = generator.formatQuestionText(new Interval('perfect', 5), 'C');
      expect(text).toMatch(/^Find the .+ of .+$/);
    });

    it('should start with "Find the"', () => {
      const text = generator.formatQuestionText(new Interval('minor', 3), 'G');
      expect(text.startsWith('Find the ')).toBe(true);
    });

    it('should contain "of" separator', () => {
      const text = generator.formatQuestionText(new Interval('major', 7), 'A');
      expect(text).toContain(' of ');
    });

    it('should end with the root note name', () => {
      const text = generator.formatQuestionText(new Interval('perfect', 4), 'E');
      expect(text.endsWith('E')).toBe(true);
    });
  });

  describe('Fully spelled interval names', () => {
    describe('Simple intervals', () => {
      it('should spell "minor second"', () => {
        const text = generator.formatQuestionText(new Interval('minor', 2), 'C');
        expect(text).toBe('Find the minor second of C');
      });

      it('should spell "major second"', () => {
        const text = generator.formatQuestionText(new Interval('major', 2), 'D');
        expect(text).toBe('Find the major second of D');
      });

      it('should spell "minor third"', () => {
        const text = generator.formatQuestionText(new Interval('minor', 3), 'E');
        expect(text).toBe('Find the minor third of E');
      });

      it('should spell "major third"', () => {
        const text = generator.formatQuestionText(new Interval('major', 3), 'F');
        expect(text).toBe('Find the major third of F');
      });

      it('should spell "perfect fourth"', () => {
        const text = generator.formatQuestionText(new Interval('perfect', 4), 'G');
        expect(text).toBe('Find the perfect fourth of G');
      });

      it('should spell "augmented fourth" (tritone)', () => {
        const text = generator.formatQuestionText(new Interval('augmented', 4), 'A');
        expect(text).toBe('Find the augmented fourth of A');
      });

      it('should spell "diminished fifth" (tritone)', () => {
        const text = generator.formatQuestionText(new Interval('diminished', 5), 'B');
        expect(text).toBe('Find the diminished fifth of B');
      });

      it('should spell "perfect fifth"', () => {
        const text = generator.formatQuestionText(new Interval('perfect', 5), 'C');
        expect(text).toBe('Find the perfect fifth of C');
      });

      it('should spell "minor sixth"', () => {
        const text = generator.formatQuestionText(new Interval('minor', 6), 'D');
        expect(text).toBe('Find the minor sixth of D');
      });

      it('should spell "major sixth"', () => {
        const text = generator.formatQuestionText(new Interval('major', 6), 'E');
        expect(text).toBe('Find the major sixth of E');
      });

      it('should spell "minor seventh"', () => {
        const text = generator.formatQuestionText(new Interval('minor', 7), 'F');
        expect(text).toBe('Find the minor seventh of F');
      });

      it('should spell "major seventh"', () => {
        const text = generator.formatQuestionText(new Interval('major', 7), 'G');
        expect(text).toBe('Find the major seventh of G');
      });

      it('should spell "perfect octave"', () => {
        const text = generator.formatQuestionText(new Interval('perfect', 8), 'A');
        expect(text).toBe('Find the perfect octave of A');
      });
    });

    describe('Augmented intervals', () => {
      it('should spell "augmented unison"', () => {
        const text = generator.formatQuestionText(new Interval('augmented', 1), 'C');
        expect(text).toBe('Find the augmented unison of C');
      });

      it('should spell "augmented second"', () => {
        const text = generator.formatQuestionText(new Interval('augmented', 2), 'D');
        expect(text).toBe('Find the augmented second of D');
      });

      it('should spell "augmented third"', () => {
        const text = generator.formatQuestionText(new Interval('augmented', 3), 'E');
        expect(text).toBe('Find the augmented third of E');
      });

      it('should spell "augmented fifth"', () => {
        const text = generator.formatQuestionText(new Interval('augmented', 5), 'F');
        expect(text).toBe('Find the augmented fifth of F');
      });

      it('should spell "augmented sixth"', () => {
        const text = generator.formatQuestionText(new Interval('augmented', 6), 'G');
        expect(text).toBe('Find the augmented sixth of G');
      });
    });

    describe('Diminished intervals', () => {
      it('should spell "diminished second"', () => {
        const text = generator.formatQuestionText(new Interval('diminished', 2), 'C');
        expect(text).toBe('Find the diminished second of C');
      });

      it('should spell "diminished third"', () => {
        const text = generator.formatQuestionText(new Interval('diminished', 3), 'D');
        expect(text).toBe('Find the diminished third of D');
      });

      it('should spell "diminished fourth"', () => {
        const text = generator.formatQuestionText(new Interval('diminished', 4), 'E');
        expect(text).toBe('Find the diminished fourth of E');
      });

      it('should spell "diminished sixth"', () => {
        const text = generator.formatQuestionText(new Interval('diminished', 6), 'F');
        expect(text).toBe('Find the diminished sixth of F');
      });

      it('should spell "diminished seventh"', () => {
        const text = generator.formatQuestionText(new Interval('diminished', 7), 'G');
        expect(text).toBe('Find the diminished seventh of G');
      });

      it('should spell "diminished octave"', () => {
        const text = generator.formatQuestionText(new Interval('diminished', 8), 'A');
        expect(text).toBe('Find the diminished octave of A');
      });
    });
  });

  describe('Compound interval support', () => {
    it('should spell "minor ninth"', () => {
      const text = generator.formatQuestionText(new Interval('minor', 9), 'C');
      expect(text).toBe('Find the minor ninth of C');
    });

    it('should spell "major ninth"', () => {
      const text = generator.formatQuestionText(new Interval('major', 9), 'D');
      expect(text).toBe('Find the major ninth of D');
    });

    it('should spell "minor tenth"', () => {
      const text = generator.formatQuestionText(new Interval('minor', 10), 'E');
      expect(text).toBe('Find the minor tenth of E');
    });

    it('should spell "major tenth"', () => {
      const text = generator.formatQuestionText(new Interval('major', 10), 'F');
      expect(text).toBe('Find the major tenth of F');
    });

    it('should spell "perfect eleventh"', () => {
      const text = generator.formatQuestionText(new Interval('perfect', 11), 'G');
      expect(text).toBe('Find the perfect eleventh of G');
    });

    it('should spell "augmented eleventh"', () => {
      const text = generator.formatQuestionText(new Interval('augmented', 11), 'A');
      expect(text).toBe('Find the augmented eleventh of A');
    });

    it('should spell "perfect twelfth"', () => {
      const text = generator.formatQuestionText(new Interval('perfect', 12), 'B');
      expect(text).toBe('Find the perfect twelfth of B');
    });

    it('should spell "minor thirteenth"', () => {
      const text = generator.formatQuestionText(new Interval('minor', 13), 'C');
      expect(text).toBe('Find the minor thirteenth of C');
    });

    it('should spell "major thirteenth"', () => {
      const text = generator.formatQuestionText(new Interval('major', 13), 'D');
      expect(text).toBe('Find the major thirteenth of D');
    });

    it('should spell "minor fourteenth"', () => {
      const text = generator.formatQuestionText(new Interval('minor', 14), 'E');
      expect(text).toBe('Find the minor fourteenth of E');
    });

    it('should spell "major fourteenth"', () => {
      const text = generator.formatQuestionText(new Interval('major', 14), 'F');
      expect(text).toBe('Find the major fourteenth of F');
    });

    it('should spell "perfect fifteenth" (double octave)', () => {
      const text = generator.formatQuestionText(new Interval('perfect', 15), 'G');
      expect(text).toBe('Find the perfect fifteenth of G');
    });
  });

  describe('Root note display with sharps preference', () => {
    beforeEach(() => {
      generator.updateConfig({ displayPreference: 'sharps' });
    });

    it('should display natural root notes correctly', () => {
      const naturalNotes: PitchClass[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      for (const note of naturalNotes) {
        const text = generator.formatQuestionText(new Interval('perfect', 5), note);
        expect(text).toBe(`Find the perfect fifth of ${note}`);
      }
    });

    it('should display C# as sharp', () => {
      const text = generator.formatQuestionText(new Interval('minor', 3), 'C#');
      expect(text).toBe('Find the minor third of C#');
    });

    it('should display F# as sharp', () => {
      const text = generator.formatQuestionText(new Interval('major', 7), 'F#');
      expect(text).toBe('Find the major seventh of F#');
    });

    it('should display all sharps correctly', () => {
      const sharpNotes: PitchClass[] = ['C#', 'D#', 'F#', 'G#', 'A#'];
      for (const note of sharpNotes) {
        const text = generator.formatQuestionText(new Interval('perfect', 4), note);
        expect(text).toContain(note);
      }
    });
  });

  describe('Root note display with flats preference', () => {
    beforeEach(() => {
      generator.updateConfig({ displayPreference: 'flats' });
    });

    it('should display natural root notes correctly', () => {
      const text = generator.formatQuestionText(new Interval('perfect', 5), 'C');
      expect(text).toBe('Find the perfect fifth of C');
    });

    it('should display C# as Db', () => {
      const text = generator.formatQuestionText(new Interval('minor', 3), 'C#');
      expect(text).toBe('Find the minor third of Db');
    });

    it('should display D# as Eb', () => {
      const text = generator.formatQuestionText(new Interval('major', 2), 'D#');
      expect(text).toBe('Find the major second of Eb');
    });

    it('should display F# as Gb', () => {
      const text = generator.formatQuestionText(new Interval('perfect', 4), 'F#');
      expect(text).toBe('Find the perfect fourth of Gb');
    });

    it('should display G# as Ab', () => {
      const text = generator.formatQuestionText(new Interval('minor', 6), 'G#');
      expect(text).toBe('Find the minor sixth of Ab');
    });

    it('should display A# as Bb', () => {
      const text = generator.formatQuestionText(new Interval('minor', 7), 'A#');
      expect(text).toBe('Find the minor seventh of Bb');
    });
  });

  describe('Natural language quality (reads naturally)', () => {
    it('should use lowercase for interval qualities', () => {
      const text = generator.formatQuestionText(new Interval('minor', 3), 'C');
      expect(text).not.toMatch(/Minor/);
      expect(text).toMatch(/minor/);
    });

    it('should use lowercase for interval numbers', () => {
      const text = generator.formatQuestionText(new Interval('perfect', 5), 'G');
      expect(text).not.toMatch(/Fifth/);
      expect(text).toMatch(/fifth/);
    });

    it('should not use abbreviations in question text', () => {
      // Should be "minor third" not "m3"
      const text = generator.formatQuestionText(new Interval('minor', 3), 'A');
      expect(text).not.toContain('m3');
      expect(text).toContain('minor third');
    });

    it('should not use abbreviations for perfect intervals', () => {
      // Should be "perfect fifth" not "P5"
      const text = generator.formatQuestionText(new Interval('perfect', 5), 'C');
      expect(text).not.toContain('P5');
      expect(text).toContain('perfect fifth');
    });

    it('should use proper article "the" before interval', () => {
      const text = generator.formatQuestionText(new Interval('major', 7), 'D');
      expect(text).toContain('the major seventh');
    });

    it('should not include technical notation', () => {
      const text = generator.formatQuestionText(new Interval('augmented', 4), 'F');
      // Should not have abbreviated notation like "A4" or "Aug4"
      expect(text).not.toMatch(/A4|Aug4|aug4/i);
      // Should have full spelled out text
      expect(text).toContain('augmented fourth');
    });
  });

  describe('All common intervals read naturally', () => {
    const naturalRoots: PitchClass[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

    it('should format all common intervals correctly', () => {
      for (const interval of COMMON_INTERVALS) {
        const root = naturalRoots[Math.floor(Math.random() * naturalRoots.length)];
        const text = generator.formatQuestionText(interval, root);
        
        // Check format
        expect(text).toMatch(/^Find the .+ of [A-G]#?$/);
        
        // Check no abbreviations
        expect(text).not.toMatch(/[mMPdA]\d/);
      }
    });

    it('should format all simple intervals correctly', () => {
      for (const interval of SIMPLE_INTERVALS) {
        const root = 'C';
        const text = generator.formatQuestionText(interval, root);
        
        expect(text).toMatch(/^Find the .+ of C$/);
      }
    });

    it('should format all compound intervals correctly', () => {
      for (const interval of COMPOUND_INTERVALS) {
        const root = 'D';
        const text = generator.formatQuestionText(interval, root);
        
        expect(text).toMatch(/^Find the .+ of D$/);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle perfect unison', () => {
      const text = generator.formatQuestionText(new Interval('perfect', 1), 'C');
      expect(text).toBe('Find the perfect unison of C');
    });

    it('should handle intervals with all 12 pitch classes as roots', () => {
      const allRoots: PitchClass[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const interval = new Interval('perfect', 5);
      
      for (const root of allRoots) {
        const text = generator.formatQuestionText(interval, root);
        expect(text).toMatch(/^Find the perfect fifth of /);
      }
    });

    it('should handle the widest compound interval (P15)', () => {
      const text = generator.formatQuestionText(new Interval('perfect', 15), 'C');
      expect(text).toBe('Find the perfect fifteenth of C');
    });
  });

  describe('Interval class getFullName validation', () => {
    it('should return correctly spelled quality names', () => {
      expect(new Interval('perfect', 5).getFullName()).toBe('perfect fifth');
      expect(new Interval('major', 3).getFullName()).toBe('major third');
      expect(new Interval('minor', 3).getFullName()).toBe('minor third');
      expect(new Interval('augmented', 4).getFullName()).toBe('augmented fourth');
      expect(new Interval('diminished', 5).getFullName()).toBe('diminished fifth');
    });

    it('should return correctly spelled number names for simple intervals', () => {
      expect(new Interval('perfect', 1).getFullName()).toBe('perfect unison');
      expect(new Interval('major', 2).getFullName()).toBe('major second');
      expect(new Interval('minor', 3).getFullName()).toBe('minor third');
      expect(new Interval('perfect', 4).getFullName()).toBe('perfect fourth');
      expect(new Interval('perfect', 5).getFullName()).toBe('perfect fifth');
      expect(new Interval('major', 6).getFullName()).toBe('major sixth');
      expect(new Interval('major', 7).getFullName()).toBe('major seventh');
      expect(new Interval('perfect', 8).getFullName()).toBe('perfect octave');
    });

    it('should return correctly spelled number names for compound intervals', () => {
      expect(new Interval('major', 9).getFullName()).toBe('major ninth');
      expect(new Interval('major', 10).getFullName()).toBe('major tenth');
      expect(new Interval('perfect', 11).getFullName()).toBe('perfect eleventh');
      expect(new Interval('perfect', 12).getFullName()).toBe('perfect twelfth');
      expect(new Interval('major', 13).getFullName()).toBe('major thirteenth');
      expect(new Interval('major', 14).getFullName()).toBe('major fourteenth');
      expect(new Interval('perfect', 15).getFullName()).toBe('perfect fifteenth');
    });
  });
});
