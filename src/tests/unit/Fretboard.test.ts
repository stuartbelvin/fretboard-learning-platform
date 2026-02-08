import { describe, it, expect } from 'vitest';
import { 
  Fretboard, 
  STANDARD_TUNING, 
  DROP_D_TUNING,
  STANDARD_FRET_MARKERS,
} from '../../core/instruments/Fretboard';
import type { PitchClass } from '../../core/music-theory/Note';

describe('Fretboard', () => {
  describe('constructor', () => {
    it('should create fretboard with default config', () => {
      const fretboard = new Fretboard();
      expect(fretboard.config.fretCount).toBe(24);
      expect(fretboard.config.stringCount).toBe(6);
      expect(fretboard.config.tuning).toEqual(STANDARD_TUNING);
    });

    it('should accept custom config', () => {
      const fretboard = new Fretboard({ fretCount: 22 });
      expect(fretboard.config.fretCount).toBe(22);
    });
  });

  describe('note generation - Standard Tuning EADGBE', () => {
    const fretboard = new Fretboard();

    it('should generate exactly 150 notes (25 frets × 6 strings)', () => {
      // 0-24 frets = 25 positions per string × 6 strings = 150 notes
      expect(fretboard.getTotalNoteCount()).toBe(150);
    });

    it('should generate correct open string notes', () => {
      const openStrings = fretboard.getOpenStrings();
      
      // String 1 (high E): E4
      expect(openStrings[0].pitchClass).toBe('E');
      expect(openStrings[0].octave).toBe(4);
      
      // String 2: B3
      expect(openStrings[1].pitchClass).toBe('B');
      expect(openStrings[1].octave).toBe(3);
      
      // String 3: G3
      expect(openStrings[2].pitchClass).toBe('G');
      expect(openStrings[2].octave).toBe(3);
      
      // String 4: D3
      expect(openStrings[3].pitchClass).toBe('D');
      expect(openStrings[3].octave).toBe(3);
      
      // String 5: A2
      expect(openStrings[4].pitchClass).toBe('A');
      expect(openStrings[4].octave).toBe(2);
      
      // String 6 (low E): E2
      expect(openStrings[5].pitchClass).toBe('E');
      expect(openStrings[5].octave).toBe(2);
    });

    it('should generate correct 12th fret notes (one octave higher)', () => {
      // 12th fret should be one octave higher than open string
      const string1Fret12 = fretboard.getNoteAt(1, 12);
      expect(string1Fret12?.pitchClass).toBe('E');
      expect(string1Fret12?.octave).toBe(5);

      const string6Fret12 = fretboard.getNoteAt(6, 12);
      expect(string6Fret12?.pitchClass).toBe('E');
      expect(string6Fret12?.octave).toBe(3);
    });

    it('should generate correct chromatic progression on string 6', () => {
      const expectedNotes: PitchClass[] = ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E'];
      
      for (let fret = 0; fret <= 12; fret++) {
        const note = fretboard.getNoteAt(6, fret);
        expect(note?.pitchClass).toBe(expectedNotes[fret]);
      }
    });

    it('should generate correct notes for first 5 frets (manual test verification)', () => {
      // This tests the requirement: "Manual test: Console log shows correct note names for first 5 frets"
      
      // String 1 (high E): E4, F4, F#4, G4, G#4, A4
      const string1 = fretboard.getNotesOnString(1).slice(0, 6);
      expect(string1.map(n => n.getFullName())).toEqual(['E4', 'F4', 'F#4', 'G4', 'G#4', 'A4']);
      
      // String 2 (B): B3, C4, C#4, D4, D#4, E4
      const string2 = fretboard.getNotesOnString(2).slice(0, 6);
      expect(string2.map(n => n.getFullName())).toEqual(['B3', 'C4', 'C#4', 'D4', 'D#4', 'E4']);
      
      // String 3 (G): G3, G#3, A3, A#3, B3, C4
      const string3 = fretboard.getNotesOnString(3).slice(0, 6);
      expect(string3.map(n => n.getFullName())).toEqual(['G3', 'G#3', 'A3', 'A#3', 'B3', 'C4']);
      
      // String 4 (D): D3, D#3, E3, F3, F#3, G3
      const string4 = fretboard.getNotesOnString(4).slice(0, 6);
      expect(string4.map(n => n.getFullName())).toEqual(['D3', 'D#3', 'E3', 'F3', 'F#3', 'G3']);
      
      // String 5 (A): A2, A#2, B2, C3, C#3, D3
      const string5 = fretboard.getNotesOnString(5).slice(0, 6);
      expect(string5.map(n => n.getFullName())).toEqual(['A2', 'A#2', 'B2', 'C3', 'C#3', 'D3']);
      
      // String 6 (low E): E2, F2, F#2, G2, G#2, A2
      const string6 = fretboard.getNotesOnString(6).slice(0, 6);
      expect(string6.map(n => n.getFullName())).toEqual(['E2', 'F2', 'F#2', 'G2', 'G#2', 'A2']);
    });
  });

  describe('getNoteAt', () => {
    const fretboard = new Fretboard();

    it('should return correct note for valid position', () => {
      const note = fretboard.getNoteAt(1, 0);
      expect(note).toBeDefined();
      expect(note?.pitchClass).toBe('E');
      expect(note?.string).toBe(1);
      expect(note?.fret).toBe(0);
    });

    it('should return undefined for invalid position', () => {
      const note = fretboard.getNoteAt(7, 0); // Invalid string
      expect(note).toBeUndefined();
    });
  });

  describe('getNotesOnString', () => {
    const fretboard = new Fretboard();

    it('should return all notes on a string', () => {
      const notes = fretboard.getNotesOnString(1);
      expect(notes.length).toBe(25); // 0-24 frets
      expect(notes.every(n => n.string === 1)).toBe(true);
    });

    it('should return empty array for invalid string', () => {
      const notes = fretboard.getNotesOnString(7);
      expect(notes.length).toBe(0);
    });
  });

  describe('getNotesByPitchClass', () => {
    const fretboard = new Fretboard();

    it('should return all occurrences of a pitch class', () => {
      const eNotes = fretboard.getNotesByPitchClass('E');
      expect(eNotes.length).toBeGreaterThan(0);
      expect(eNotes.every(n => n.pitchClass === 'E')).toBe(true);
    });

    it('should find E notes in multiple positions', () => {
      const eNotes = fretboard.getNotesByPitchClass('E');
      // There should be multiple E notes across the fretboard
      const strings = new Set(eNotes.map(n => n.string));
      expect(strings.size).toBe(6); // E should appear on all strings
    });
  });

  describe('getNotesInFretRange', () => {
    const fretboard = new Fretboard();

    it('should return notes within fret range', () => {
      const notes = fretboard.getNotesInFretRange(0, 4);
      expect(notes.length).toBe(30); // 5 frets × 6 strings
      expect(notes.every(n => n.fret >= 0 && n.fret <= 4)).toBe(true);
    });
  });

  describe('getRegion', () => {
    const fretboard = new Fretboard();

    it('should return notes in rectangular region', () => {
      const notes = fretboard.getRegion(1, 3, 0, 4);
      expect(notes.length).toBe(15); // 3 strings × 5 frets
      expect(notes.every(n => 
        n.string >= 1 && n.string <= 3 && n.fret >= 0 && n.fret <= 4
      )).toBe(true);
    });
  });

  describe('fret markers', () => {
    const fretboard = new Fretboard();

    it('should identify single dot fret markers', () => {
      expect(fretboard.hasFretMarker(3)).toBe(true);
      expect(fretboard.hasFretMarker(5)).toBe(true);
      expect(fretboard.hasFretMarker(7)).toBe(true);
      expect(fretboard.hasFretMarker(9)).toBe(true);
      expect(fretboard.hasFretMarker(12)).toBe(true);
      expect(fretboard.hasFretMarker(4)).toBe(false);
    });

    it('should identify double dot fret markers', () => {
      expect(fretboard.hasDoubleFretMarker(12)).toBe(true);
      expect(fretboard.hasDoubleFretMarker(24)).toBe(true);
      expect(fretboard.hasDoubleFretMarker(5)).toBe(false);
    });
  });

  describe('findPitchClassInRange', () => {
    const fretboard = new Fretboard();

    it('should find all occurrences of pitch class in fret range', () => {
      const cNotes = fretboard.findPitchClassInRange('C', 0, 5);
      expect(cNotes.length).toBeGreaterThan(0);
      expect(cNotes.every(n => n.pitchClass === 'C' && n.fret <= 5)).toBe(true);
    });
  });

  describe('alternate tunings', () => {
    it('should generate correct notes for Drop D tuning', () => {
      const fretboard = new Fretboard({ tuning: DROP_D_TUNING });
      
      const string6Open = fretboard.getOpenString(6);
      expect(string6Open?.pitchClass).toBe('D');
      expect(string6Open?.octave).toBe(2);
    });
  });

  describe('custom fret count', () => {
    it('should respect custom fret count', () => {
      const fretboard = new Fretboard({ fretCount: 12 });
      expect(fretboard.getTotalNoteCount()).toBe(78); // 13 positions × 6 strings
    });
  });
});

describe('STANDARD_TUNING', () => {
  it('should define correct tuning for standard guitar', () => {
    expect(STANDARD_TUNING.length).toBe(6);
    
    // String 1 (high E)
    expect(STANDARD_TUNING[0].pitchClass).toBe('E');
    expect(STANDARD_TUNING[0].octave).toBe(4);
    
    // String 6 (low E)
    expect(STANDARD_TUNING[5].pitchClass).toBe('E');
    expect(STANDARD_TUNING[5].octave).toBe(2);
  });
});

describe('STANDARD_FRET_MARKERS', () => {
  it('should include all standard fret marker positions', () => {
    expect(STANDARD_FRET_MARKERS).toContain(3);
    expect(STANDARD_FRET_MARKERS).toContain(5);
    expect(STANDARD_FRET_MARKERS).toContain(7);
    expect(STANDARD_FRET_MARKERS).toContain(9);
    expect(STANDARD_FRET_MARKERS).toContain(12);
    expect(STANDARD_FRET_MARKERS).toContain(15);
    expect(STANDARD_FRET_MARKERS).toContain(17);
    expect(STANDARD_FRET_MARKERS).toContain(19);
    expect(STANDARD_FRET_MARKERS).toContain(21);
    expect(STANDARD_FRET_MARKERS).toContain(24);
  });
});
