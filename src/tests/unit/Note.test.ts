import { describe, it, expect } from 'vitest';
import { 
  Note, 
  CHROMATIC_SCALE_SHARPS, 
  ENHARMONIC_MAP,
  getPitchClassIndex,
  getPitchClassFromIndex
} from '../../core/music-theory/Note';

describe('Note', () => {
  describe('constructor', () => {
    it('should create a note with correct properties', () => {
      const note = new Note('C', 4, 2, 1);
      expect(note.pitchClass).toBe('C');
      expect(note.octave).toBe(4);
      expect(note.string).toBe(2);
      expect(note.fret).toBe(1);
    });

    it('should calculate correct MIDI number for middle C (C4)', () => {
      const note = new Note('C', 4, 1, 0);
      expect(note.midiNumber).toBe(60); // Middle C is MIDI 60
    });

    it('should calculate correct MIDI number for A4 (440Hz)', () => {
      const note = new Note('A', 4, 1, 0);
      expect(note.midiNumber).toBe(69); // A4 is MIDI 69
    });
  });

  describe('getSharpName', () => {
    it('should return sharp notation', () => {
      const note = new Note('C#', 4, 1, 1);
      expect(note.getSharpName()).toBe('C#');
    });
  });

  describe('getFlatName', () => {
    it('should return flat equivalent for sharp notes', () => {
      const noteCs = new Note('C#', 4, 1, 1);
      expect(noteCs.getFlatName()).toBe('Db');

      const noteDs = new Note('D#', 4, 1, 1);
      expect(noteDs.getFlatName()).toBe('Eb');
    });

    it('should return same note for natural notes', () => {
      const noteC = new Note('C', 4, 1, 0);
      expect(noteC.getFlatName()).toBe('C');
    });
  });

  describe('getFullName', () => {
    it('should include octave in name', () => {
      const note = new Note('C', 4, 1, 0);
      expect(note.getFullName()).toBe('C4');
    });

    it('should use flats when preference is flats', () => {
      const note = new Note('C#', 4, 1, 1);
      expect(note.getFullName('flats')).toBe('Db4');
    });
  });

  describe('isEnharmonicWith', () => {
    it('should recognize sharp/flat equivalents', () => {
      const note = new Note('C#', 4, 1, 1);
      expect(note.isEnharmonicWith('C#')).toBe(true);
      expect(note.isEnharmonicWith('Db')).toBe(true);
    });

    it('should not match different pitch classes', () => {
      const note = new Note('C', 4, 1, 0);
      expect(note.isEnharmonicWith('C#')).toBe(false);
      expect(note.isEnharmonicWith('D')).toBe(false);
    });
  });

  describe('getPositionId', () => {
    it('should create unique position identifier', () => {
      const note1 = new Note('C', 4, 1, 5);
      expect(note1.getPositionId()).toBe('s1f5');

      const note2 = new Note('E', 2, 6, 0);
      expect(note2.getPositionId()).toBe('s6f0');
    });
  });

  describe('isSamePosition', () => {
    it('should return true for same string and fret', () => {
      const note1 = new Note('C', 4, 2, 5);
      const note2 = new Note('C', 4, 2, 5);
      expect(note1.isSamePosition(note2)).toBe(true);
    });

    it('should return false for different positions', () => {
      const note1 = new Note('C', 4, 2, 5);
      const note2 = new Note('C', 4, 3, 5);
      expect(note1.isSamePosition(note2)).toBe(false);
    });
  });

  describe('isSamePitch', () => {
    it('should return true for notes with same MIDI number', () => {
      const note1 = new Note('C', 4, 2, 1);
      const note2 = new Note('C', 4, 3, 5);
      expect(note1.isSamePitch(note2)).toBe(true);
    });

    it('should return false for notes with different MIDI numbers', () => {
      const note1 = new Note('C', 4, 2, 1);
      const note2 = new Note('D', 4, 2, 3);
      expect(note1.isSamePitch(note2)).toBe(false);
    });
  });

  describe('isSamePitchClass', () => {
    it('should return true for same pitch class in different octaves', () => {
      const note1 = new Note('C', 3, 5, 3);
      const note2 = new Note('C', 4, 2, 1);
      expect(note1.isSamePitchClass(note2)).toBe(true);
    });
  });

  describe('fromMidiNumber', () => {
    it('should create correct note from MIDI number', () => {
      const note = Note.fromMidiNumber(60, 2, 1); // Middle C
      expect(note.pitchClass).toBe('C');
      expect(note.octave).toBe(4);
      expect(note.string).toBe(2);
      expect(note.fret).toBe(1);
    });

    it('should handle all 12 pitch classes', () => {
      for (let i = 0; i < 12; i++) {
        const note = Note.fromMidiNumber(60 + i, 1, i);
        expect(note.pitchClass).toBe(CHROMATIC_SCALE_SHARPS[i]);
      }
    });
  });

  describe('transposeBy', () => {
    it('should transpose up correctly', () => {
      const note = new Note('C', 4, 1, 0);
      const transposed = note.transposeBy(2);
      expect(transposed.pitchClass).toBe('D');
      expect(transposed.octave).toBe(4);
    });

    it('should handle octave boundaries', () => {
      const note = new Note('B', 4, 1, 0);
      const transposed = note.transposeBy(1);
      expect(transposed.pitchClass).toBe('C');
      expect(transposed.octave).toBe(5);
    });

    it('should transpose down correctly', () => {
      const note = new Note('C', 4, 1, 0);
      const transposed = note.transposeBy(-1);
      expect(transposed.pitchClass).toBe('B');
      expect(transposed.octave).toBe(3);
    });
  });
});

describe('Utility Functions', () => {
  describe('getPitchClassIndex', () => {
    it('should return correct indices', () => {
      expect(getPitchClassIndex('C')).toBe(0);
      expect(getPitchClassIndex('C#')).toBe(1);
      expect(getPitchClassIndex('B')).toBe(11);
    });
  });

  describe('getPitchClassFromIndex', () => {
    it('should return correct pitch class', () => {
      expect(getPitchClassFromIndex(0)).toBe('C');
      expect(getPitchClassFromIndex(1)).toBe('C#');
      expect(getPitchClassFromIndex(11)).toBe('B');
    });

    it('should handle wraparound', () => {
      expect(getPitchClassFromIndex(12)).toBe('C');
      expect(getPitchClassFromIndex(-1)).toBe('B');
    });
  });
});

describe('ENHARMONIC_MAP', () => {
  it('should map all sharps to flats correctly', () => {
    expect(ENHARMONIC_MAP['C#']).toBe('Db');
    expect(ENHARMONIC_MAP['D#']).toBe('Eb');
    expect(ENHARMONIC_MAP['F#']).toBe('Gb');
    expect(ENHARMONIC_MAP['G#']).toBe('Ab');
    expect(ENHARMONIC_MAP['A#']).toBe('Bb');
  });

  it('should map natural notes to themselves', () => {
    expect(ENHARMONIC_MAP['C']).toBe('C');
    expect(ENHARMONIC_MAP['D']).toBe('D');
    expect(ENHARMONIC_MAP['E']).toBe('E');
    expect(ENHARMONIC_MAP['F']).toBe('F');
    expect(ENHARMONIC_MAP['G']).toBe('G');
    expect(ENHARMONIC_MAP['A']).toBe('A');
    expect(ENHARMONIC_MAP['B']).toBe('B');
  });
});
