import { describe, it, expect, beforeEach } from 'vitest';
import {
  createRectangleZone,
  CustomZoneBuilder,
  createOctaveRangeZone,
  createPitchClassZone,
  createPositionZone,
  createSingleStringZone,
  createDiagonalZone,
  shiftZone,
  getZoneShiftRange,
  getRandomShiftOffset,
  RectangleZoneParams,
  OctaveRangeParams
} from '../../core/zones/ZoneShapeUtilities';
import { HighlightZone } from '../../core/zones/HighlightZone';
import { Fretboard, STANDARD_TUNING, DROP_D_TUNING } from '../../core/instruments/Fretboard';
import { Note } from '../../core/music-theory/Note';

describe('ZoneShapeUtilities', () => {
  describe('createRectangleZone', () => {
    it('creates a zone with correct number of positions', () => {
      const zone = createRectangleZone({
        startString: 1,
        endString: 3,
        startFret: 5,
        endFret: 8
      });
      
      // 3 strings × 4 frets = 12 positions
      expect(zone.size()).toBe(12);
    });

    it('includes all positions within bounds', () => {
      const zone = createRectangleZone({
        startString: 2,
        endString: 4,
        startFret: 3,
        endFret: 5
      });
      
      // Check all expected positions
      for (let s = 2; s <= 4; s++) {
        for (let f = 3; f <= 5; f++) {
          expect(zone.containsNote(s, f)).toBe(true);
        }
      }
      
      // Check boundary exclusions
      expect(zone.containsNote(1, 4)).toBe(false);
      expect(zone.containsNote(5, 4)).toBe(false);
      expect(zone.containsNote(3, 2)).toBe(false);
      expect(zone.containsNote(3, 6)).toBe(false);
    });

    it('handles reversed ranges (auto-normalizes)', () => {
      const zone1 = createRectangleZone({
        startString: 1,
        endString: 3,
        startFret: 5,
        endFret: 8
      });
      
      const zone2 = createRectangleZone({
        startString: 3,
        endString: 1,
        startFret: 8,
        endFret: 5
      });
      
      expect(zone1.equals(zone2)).toBe(true);
    });

    it('creates single fret zone correctly', () => {
      const zone = createRectangleZone({
        startString: 1,
        endString: 6,
        startFret: 5,
        endFret: 5
      });
      
      expect(zone.size()).toBe(6);
      for (let s = 1; s <= 6; s++) {
        expect(zone.containsNote(s, 5)).toBe(true);
      }
    });

    it('creates single string zone correctly', () => {
      const zone = createRectangleZone({
        startString: 3,
        endString: 3,
        startFret: 0,
        endFret: 5
      });
      
      expect(zone.size()).toBe(6);
      for (let f = 0; f <= 5; f++) {
        expect(zone.containsNote(3, f)).toBe(true);
      }
    });

    it('includes open string (fret 0)', () => {
      const zone = createRectangleZone({
        startString: 1,
        endString: 6,
        startFret: 0,
        endFret: 2
      });
      
      for (let s = 1; s <= 6; s++) {
        expect(zone.containsNote(s, 0)).toBe(true);
      }
    });

    it('includes fret 24 (highest fret)', () => {
      const zone = createRectangleZone({
        startString: 1,
        endString: 6,
        startFret: 22,
        endFret: 24
      });
      
      for (let s = 1; s <= 6; s++) {
        expect(zone.containsNote(s, 24)).toBe(true);
      }
    });

    it('sets zone name correctly', () => {
      const zone = createRectangleZone({
        startString: 1,
        endString: 3,
        startFret: 5,
        endFret: 8,
        name: 'My Zone'
      });
      
      expect(zone.name).toBe('My Zone');
    });

    it('throws error for non-integer string numbers', () => {
      expect(() => createRectangleZone({
        startString: 1.5,
        endString: 3,
        startFret: 5,
        endFret: 8
      })).toThrow('String numbers must be integers');
    });

    it('throws error for non-integer fret numbers', () => {
      expect(() => createRectangleZone({
        startString: 1,
        endString: 3,
        startFret: 5.5,
        endFret: 8
      })).toThrow('Fret numbers must be integers');
    });

    it('throws error for out-of-range string numbers', () => {
      expect(() => createRectangleZone({
        startString: 0,
        endString: 3,
        startFret: 5,
        endFret: 8
      })).toThrow('String numbers must be between 1 and 6');
      
      expect(() => createRectangleZone({
        startString: 1,
        endString: 7,
        startFret: 5,
        endFret: 8
      })).toThrow('String numbers must be between 1 and 6');
    });

    it('throws error for out-of-range fret numbers', () => {
      expect(() => createRectangleZone({
        startString: 1,
        endString: 3,
        startFret: -1,
        endFret: 8
      })).toThrow('Fret numbers must be between 0 and 24');
      
      expect(() => createRectangleZone({
        startString: 1,
        endString: 3,
        startFret: 5,
        endFret: 25
      })).toThrow('Fret numbers must be between 0 and 24');
    });
  });

  describe('CustomZoneBuilder', () => {
    let builder: CustomZoneBuilder;

    beforeEach(() => {
      builder = new CustomZoneBuilder();
    });

    it('creates empty zone initially', () => {
      const zone = builder.build();
      expect(zone.isEmpty()).toBe(true);
    });

    it('adds single notes correctly', () => {
      const zone = builder
        .add(1, 5)
        .add(2, 7)
        .add(3, 9)
        .build();
      
      expect(zone.size()).toBe(3);
      expect(zone.containsNote(1, 5)).toBe(true);
      expect(zone.containsNote(2, 7)).toBe(true);
      expect(zone.containsNote(3, 9)).toBe(true);
    });

    it('adds notes from Note objects', () => {
      const note = new Note('C', 4, 1, 5);
      const zone = builder.addNote(note).build();
      
      expect(zone.containsNote(1, 5)).toBe(true);
    });

    it('removes single notes correctly', () => {
      const zone = builder
        .add(1, 5)
        .add(2, 5)
        .add(3, 5)
        .remove(2, 5)
        .build();
      
      expect(zone.size()).toBe(2);
      expect(zone.containsNote(1, 5)).toBe(true);
      expect(zone.containsNote(2, 5)).toBe(false);
      expect(zone.containsNote(3, 5)).toBe(true);
    });

    it('removes notes from Note objects', () => {
      const note = new Note('C', 4, 2, 5);
      const zone = builder
        .add(1, 5)
        .add(2, 5)
        .add(3, 5)
        .removeNote(note)
        .build();
      
      expect(zone.containsNote(2, 5)).toBe(false);
    });

    it('adds rectangular range correctly', () => {
      const zone = builder
        .addRange(1, 3, 5, 7)
        .build();
      
      // 3 strings × 3 frets = 9 positions
      expect(zone.size()).toBe(9);
      for (let s = 1; s <= 3; s++) {
        for (let f = 5; f <= 7; f++) {
          expect(zone.containsNote(s, f)).toBe(true);
        }
      }
    });

    it('removes rectangular range correctly', () => {
      const zone = builder
        .addRange(1, 4, 5, 8)  // 4×4 = 16 positions
        .removeRange(2, 3, 6, 7)  // Remove center 2×2 = 4 positions
        .build();
      
      expect(zone.size()).toBe(12);
      expect(zone.containsNote(2, 6)).toBe(false);
      expect(zone.containsNote(2, 7)).toBe(false);
      expect(zone.containsNote(3, 6)).toBe(false);
      expect(zone.containsNote(3, 7)).toBe(false);
    });

    it('adds from another zone correctly', () => {
      const otherZone = new HighlightZone();
      otherZone.addNote(1, 1);
      otherZone.addNote(2, 2);
      
      const zone = builder
        .add(3, 3)
        .addFromZone(otherZone)
        .build();
      
      expect(zone.size()).toBe(3);
      expect(zone.containsNote(1, 1)).toBe(true);
      expect(zone.containsNote(2, 2)).toBe(true);
      expect(zone.containsNote(3, 3)).toBe(true);
    });

    it('removes from another zone correctly', () => {
      const toRemove = new HighlightZone();
      toRemove.addNote(2, 2);
      
      const zone = builder
        .add(1, 1)
        .add(2, 2)
        .add(3, 3)
        .removeFromZone(toRemove)
        .build();
      
      expect(zone.size()).toBe(2);
      expect(zone.containsNote(2, 2)).toBe(false);
    });

    it('adds pitch class correctly with default fretboard', () => {
      const zone = builder
        .addPitchClass('C')
        .build();
      
      // Standard tuning has multiple C notes
      expect(zone.size()).toBeGreaterThan(0);
    });

    it('adds pitch class with fret range filter', () => {
      const zone = builder
        .addPitchClass('C', undefined, { start: 0, end: 5 })
        .build();
      
      // All notes should be within fret range
      for (const pos of zone.getAllNotes()) {
        expect(pos.fret).toBeGreaterThanOrEqual(0);
        expect(pos.fret).toBeLessThanOrEqual(5);
      }
    });

    it('adds pitch class with string range filter', () => {
      const zone = builder
        .addPitchClass('C', undefined, undefined, { start: 1, end: 3 })
        .build();
      
      // All notes should be within string range
      for (const pos of zone.getAllNotes()) {
        expect(pos.string).toBeGreaterThanOrEqual(1);
        expect(pos.string).toBeLessThanOrEqual(3);
      }
    });

    it('clears all positions', () => {
      const zone = builder
        .add(1, 5)
        .add(2, 5)
        .clear()
        .build();
      
      expect(zone.isEmpty()).toBe(true);
    });

    it('reports size correctly', () => {
      builder.add(1, 5).add(2, 5);
      expect(builder.size()).toBe(2);
    });

    it('returns cloned zone from build()', () => {
      builder.add(1, 5);
      const zone1 = builder.build();
      builder.add(2, 5);
      const zone2 = builder.build();
      
      expect(zone1.size()).toBe(1);
      expect(zone2.size()).toBe(2);
    });

    it('supports chaining for fluent API', () => {
      const zone = new CustomZoneBuilder('Fluent Zone')
        .add(1, 5)
        .add(2, 5)
        .addRange(3, 4, 7, 8)
        .remove(1, 5)
        .build();
      
      expect(zone.name).toBe('Fluent Zone');
      expect(zone.containsNote(1, 5)).toBe(false);
      expect(zone.containsNote(2, 5)).toBe(true);
    });
  });

  describe('createOctaveRangeZone', () => {
    it('creates zone with notes in correct octave', () => {
      const zone = createOctaveRangeZone({
        rootPitchClass: 'C',
        startOctave: 4,
        octaveCount: 1
      });
      
      expect(zone.size()).toBeGreaterThan(0);
      
      // Verify using fretboard
      const fb = new Fretboard();
      for (const pos of zone.getAllNotes()) {
        const note = fb.getNoteAt(pos.string, pos.fret);
        expect(note).toBeDefined();
        // C4 = MIDI 60, B4 = MIDI 71
        expect(note!.midiNumber).toBeGreaterThanOrEqual(60);
        expect(note!.midiNumber).toBeLessThanOrEqual(71);
      }
    });

    it('creates zone spanning multiple octaves', () => {
      const singleOctave = createOctaveRangeZone({
        rootPitchClass: 'C',
        startOctave: 3,
        octaveCount: 1
      });
      
      const twoOctaves = createOctaveRangeZone({
        rootPitchClass: 'C',
        startOctave: 3,
        octaveCount: 2
      });
      
      expect(twoOctaves.size()).toBeGreaterThan(singleOctave.size());
    });

    it('respects fret range filter', () => {
      const zone = createOctaveRangeZone({
        rootPitchClass: 'C',
        startOctave: 3,
        octaveCount: 2,
        fretRange: { start: 0, end: 5 }
      });
      
      for (const pos of zone.getAllNotes()) {
        expect(pos.fret).toBeGreaterThanOrEqual(0);
        expect(pos.fret).toBeLessThanOrEqual(5);
      }
    });

    it('respects string range filter', () => {
      const zone = createOctaveRangeZone({
        rootPitchClass: 'C',
        startOctave: 3,
        octaveCount: 2,
        stringRange: { start: 1, end: 3 }
      });
      
      for (const pos of zone.getAllNotes()) {
        expect(pos.string).toBeGreaterThanOrEqual(1);
        expect(pos.string).toBeLessThanOrEqual(3);
      }
    });

    it('sets zone name correctly', () => {
      const zone = createOctaveRangeZone({
        rootPitchClass: 'G',
        startOctave: 2,
        name: 'G Range'
      });
      
      expect(zone.name).toBe('G Range');
    });

    it('works with custom fretboard', () => {
      const dropDFretboard = new Fretboard({ tuning: DROP_D_TUNING });
      
      const standardZone = createOctaveRangeZone({
        rootPitchClass: 'D',
        startOctave: 2,
        octaveCount: 1
      });
      
      const dropDZone = createOctaveRangeZone({
        rootPitchClass: 'D',
        startOctave: 2,
        octaveCount: 1,
        fretboard: dropDFretboard
      });
      
      // Drop D tuning should have D2 on open 6th string
      expect(dropDZone.containsNote(6, 0)).toBe(true);
    });

    it('throws error for invalid pitch class', () => {
      expect(() => createOctaveRangeZone({
        rootPitchClass: 'H' as any,
        startOctave: 4
      })).toThrow('Invalid pitch class');
    });

    it('throws error for invalid octave', () => {
      expect(() => createOctaveRangeZone({
        rootPitchClass: 'C',
        startOctave: -1
      })).toThrow('Start octave must be an integer between 0 and 9');
      
      expect(() => createOctaveRangeZone({
        rootPitchClass: 'C',
        startOctave: 10
      })).toThrow('Start octave must be an integer between 0 and 9');
    });

    it('throws error for invalid octave count', () => {
      expect(() => createOctaveRangeZone({
        rootPitchClass: 'C',
        startOctave: 4,
        octaveCount: 0
      })).toThrow('Octave count must be a positive integer');
    });

    it('throws error for invalid fret range', () => {
      expect(() => createOctaveRangeZone({
        rootPitchClass: 'C',
        startOctave: 4,
        fretRange: { start: -1, end: 12 }
      })).toThrow('Fret range must be between 0 and 24');
    });

    it('throws error for invalid string range', () => {
      expect(() => createOctaveRangeZone({
        rootPitchClass: 'C',
        startOctave: 4,
        stringRange: { start: 0, end: 6 }
      })).toThrow('String range must be between 1 and 6');
    });
  });

  describe('createPitchClassZone', () => {
    it('creates zone with all occurrences of pitch class', () => {
      const zone = createPitchClassZone(['C']);
      const fb = new Fretboard();
      
      // Verify all C notes are included
      const cNotes = fb.getNotesByPitchClass('C');
      for (const note of cNotes) {
        expect(zone.containsNote(note.string, note.fret)).toBe(true);
      }
    });

    it('creates zone with multiple pitch classes', () => {
      const zone = createPitchClassZone(['C', 'E', 'G']);
      const fb = new Fretboard();
      
      const allNotes = [
        ...fb.getNotesByPitchClass('C'),
        ...fb.getNotesByPitchClass('E'),
        ...fb.getNotesByPitchClass('G')
      ];
      
      expect(zone.size()).toBe(allNotes.length);
    });

    it('respects fret range filter', () => {
      const zone = createPitchClassZone(['C'], {
        fretRange: { start: 0, end: 5 }
      });
      
      for (const pos of zone.getAllNotes()) {
        expect(pos.fret).toBeLessThanOrEqual(5);
      }
    });

    it('respects string range filter', () => {
      const zone = createPitchClassZone(['C'], {
        stringRange: { start: 3, end: 6 }
      });
      
      for (const pos of zone.getAllNotes()) {
        expect(pos.string).toBeGreaterThanOrEqual(3);
      }
    });

    it('sets zone name correctly', () => {
      const zone = createPitchClassZone(['C', 'E', 'G'], {
        name: 'C Major Triad'
      });
      
      expect(zone.name).toBe('C Major Triad');
    });

    it('throws error for invalid pitch class', () => {
      expect(() => createPitchClassZone(['X' as any])).toThrow('Invalid pitch class');
    });
  });

  describe('createPositionZone', () => {
    it('creates first position zone (includes open string)', () => {
      const zone = createPositionZone(1);
      
      // First position should include fret 0
      expect(zone.containsNote(1, 0)).toBe(true);
    });

    it('creates zone at correct fret position', () => {
      const zone = createPositionZone(5);
      
      // Position 5 should start at fret 5
      expect(zone.containsNote(1, 5)).toBe(true);
      expect(zone.containsNote(1, 4)).toBe(false);
    });

    it('creates zone with correct fret span', () => {
      const zone = createPositionZone(5, 4);
      
      // Should span 5 frets (5, 6, 7, 8, 9)
      for (let f = 5; f <= 9; f++) {
        expect(zone.containsNote(1, f)).toBe(true);
      }
    });

    it('respects string range', () => {
      const zone = createPositionZone(5, 4, {
        stringRange: { start: 1, end: 4 }
      });
      
      expect(zone.containsNote(1, 5)).toBe(true);
      expect(zone.containsNote(4, 5)).toBe(true);
      expect(zone.containsNote(5, 5)).toBe(false);
      expect(zone.containsNote(6, 5)).toBe(false);
    });

    it('sets zone name correctly', () => {
      const zone = createPositionZone(5, 4, { name: 'Custom Position' });
      expect(zone.name).toBe('Custom Position');
    });

    it('generates default name', () => {
      const zone = createPositionZone(5);
      expect(zone.name).toBe('Position 5');
    });

    it('throws error for invalid position number', () => {
      expect(() => createPositionZone(0)).toThrow('Position number must be an integer between 1 and 24');
      expect(() => createPositionZone(25)).toThrow('Position number must be an integer between 1 and 24');
    });

    it('throws error for invalid fret span', () => {
      expect(() => createPositionZone(5, 0)).toThrow('Fret span must be a positive integer up to 24');
    });
  });

  describe('createSingleStringZone', () => {
    it('creates zone on single string', () => {
      const zone = createSingleStringZone(3, 0, 12);
      
      // All positions should be on string 3
      for (const pos of zone.getAllNotes()) {
        expect(pos.string).toBe(3);
      }
    });

    it('creates zone with correct fret range', () => {
      const zone = createSingleStringZone(1, 5, 10);
      
      expect(zone.size()).toBe(6); // Frets 5, 6, 7, 8, 9, 10
      expect(zone.containsNote(1, 4)).toBe(false);
      expect(zone.containsNote(1, 5)).toBe(true);
      expect(zone.containsNote(1, 10)).toBe(true);
      expect(zone.containsNote(1, 11)).toBe(false);
    });

    it('uses default fret range (0-12)', () => {
      const zone = createSingleStringZone(1);
      
      expect(zone.size()).toBe(13); // Frets 0-12
      expect(zone.containsNote(1, 0)).toBe(true);
      expect(zone.containsNote(1, 12)).toBe(true);
    });

    it('sets zone name correctly', () => {
      const zone = createSingleStringZone(2, 0, 12, 'B String');
      expect(zone.name).toBe('B String');
    });

    it('generates default name', () => {
      const zone = createSingleStringZone(3);
      expect(zone.name).toBe('String 3');
    });

    it('throws error for invalid string number', () => {
      expect(() => createSingleStringZone(0)).toThrow('String number must be an integer between 1 and 6');
      expect(() => createSingleStringZone(7)).toThrow('String number must be an integer between 1 and 6');
    });
  });

  describe('createDiagonalZone', () => {
    it('creates zone with specified positions', () => {
      const positions = [
        { string: 6, fret: 5 },
        { string: 5, fret: 7 },
        { string: 4, fret: 7 },
        { string: 3, fret: 6 },
        { string: 2, fret: 5 },
        { string: 1, fret: 5 }
      ];
      
      const zone = createDiagonalZone(positions);
      
      expect(zone.size()).toBe(6);
      for (const pos of positions) {
        expect(zone.containsNote(pos.string, pos.fret)).toBe(true);
      }
    });

    it('creates empty zone for empty positions array', () => {
      const zone = createDiagonalZone([]);
      expect(zone.isEmpty()).toBe(true);
    });

    it('sets zone name correctly', () => {
      const zone = createDiagonalZone([{ string: 1, fret: 5 }], 'Diagonal Pattern');
      expect(zone.name).toBe('Diagonal Pattern');
    });

    it('handles duplicate positions', () => {
      const positions = [
        { string: 1, fret: 5 },
        { string: 1, fret: 5 },
        { string: 2, fret: 7 }
      ];
      
      const zone = createDiagonalZone(positions);
      
      // Duplicates should be ignored
      expect(zone.size()).toBe(2);
    });
  });

  describe('Integration tests', () => {
    it('creates complex zone using multiple utilities', () => {
      // Start with a position zone
      const positionZone = createPositionZone(5, 4);
      
      // Add specific pitch classes within fret range
      const pitchClassZone = createPitchClassZone(['C', 'G'], {
        fretRange: { start: 5, end: 9 }
      });
      
      // Combine using builder
      const combined = new CustomZoneBuilder('Combined Zone')
        .addFromZone(positionZone)
        .addFromZone(pitchClassZone)
        .build();
      
      // Combined zone should have all position zone notes
      for (const pos of positionZone.getAllNotes()) {
        expect(combined.containsNote(pos.string, pos.fret)).toBe(true);
      }
    });

    it('creates scale pattern zone', () => {
      // Create a C major pentatonic pattern in position 5
      const pattern = [
        { string: 6, fret: 5 }, // C
        { string: 6, fret: 8 }, // E
        { string: 5, fret: 5 }, // D
        { string: 5, fret: 7 }, // E
        { string: 4, fret: 5 }, // G
        { string: 4, fret: 7 }, // A
        { string: 3, fret: 5 }, // C
        { string: 3, fret: 7 }, // D
        { string: 2, fret: 5 }, // E
        { string: 2, fret: 8 }, // G
        { string: 1, fret: 5 }, // A
        { string: 1, fret: 8 }, // C
      ];
      
      const zone = createDiagonalZone(pattern, 'C Major Pentatonic - Position 5');
      
      expect(zone.size()).toBe(12);
      expect(zone.name).toBe('C Major Pentatonic - Position 5');
    });

    it('builder can be used to create zones matching other utilities', () => {
      const rectZone = createRectangleZone({
        startString: 1,
        endString: 4,
        startFret: 5,
        endFret: 8
      });
      
      const builderZone = new CustomZoneBuilder()
        .addRange(1, 4, 5, 8)
        .build();
      
      expect(rectZone.equals(builderZone)).toBe(true);
    });
  });

  describe('shiftZone', () => {
    it('shifts zone positions by positive offset', () => {
      const zone = createRectangleZone({
        startString: 1,
        endString: 2,
        startFret: 5,
        endFret: 7
      });
      
      const shifted = shiftZone(zone, 3);
      
      // Original positions at frets 5, 6, 7 should now be at 8, 9, 10
      expect(shifted.containsNote(1, 8)).toBe(true);
      expect(shifted.containsNote(1, 9)).toBe(true);
      expect(shifted.containsNote(1, 10)).toBe(true);
      expect(shifted.containsNote(2, 8)).toBe(true);
      expect(shifted.containsNote(2, 9)).toBe(true);
      expect(shifted.containsNote(2, 10)).toBe(true);
      
      // Original positions should not be in shifted zone
      expect(shifted.containsNote(1, 5)).toBe(false);
      expect(shifted.containsNote(1, 6)).toBe(false);
      expect(shifted.containsNote(1, 7)).toBe(false);
    });

    it('shifts zone positions by negative offset', () => {
      const zone = createRectangleZone({
        startString: 1,
        endString: 2,
        startFret: 5,
        endFret: 7
      });
      
      const shifted = shiftZone(zone, -3);
      
      // Original positions at frets 5, 6, 7 should now be at 2, 3, 4
      expect(shifted.containsNote(1, 2)).toBe(true);
      expect(shifted.containsNote(1, 3)).toBe(true);
      expect(shifted.containsNote(1, 4)).toBe(true);
    });

    it('drops notes that would go below fret 0', () => {
      const zone = createRectangleZone({
        startString: 1,
        endString: 2,
        startFret: 2,
        endFret: 4
      });
      
      const shifted = shiftZone(zone, -3);
      
      // Only fret 4-3=1 should remain (frets 2 and 3 would go to -1 and 0)
      // Actually fret 2 -> -1 (dropped), fret 3 -> 0 (kept), fret 4 -> 1 (kept)
      expect(shifted.size()).toBe(4); // 2 strings × 2 frets (0 and 1)
      expect(shifted.containsNote(1, 0)).toBe(true);
      expect(shifted.containsNote(1, 1)).toBe(true);
      expect(shifted.containsNote(2, 0)).toBe(true);
      expect(shifted.containsNote(2, 1)).toBe(true);
    });

    it('drops notes that would go above fret 24', () => {
      const zone = createRectangleZone({
        startString: 1,
        endString: 2,
        startFret: 22,
        endFret: 24
      });
      
      const shifted = shiftZone(zone, 3);
      
      // Only fret 22+3=25 (dropped), 23+3=26 (dropped), 24+3=27 (dropped)
      // Wait, all would be dropped. Let me check:
      // fret 22 -> 25 (dropped), fret 23 -> 26 (dropped), fret 24 -> 27 (dropped)
      expect(shifted.size()).toBe(0);
    });

    it('preserves zone size when shift keeps all notes in bounds', () => {
      const zone = createRectangleZone({
        startString: 1,
        endString: 3,
        startFret: 5,
        endFret: 10
      });
      
      const shifted = shiftZone(zone, 5);
      
      expect(shifted.size()).toBe(zone.size());
    });

    it('adds shift info to zone name', () => {
      const zone = createRectangleZone({
        startString: 1,
        endString: 2,
        startFret: 5,
        endFret: 7,
        name: 'Test Zone'
      });
      
      const shifted = shiftZone(zone, 3);
      
      expect(shifted.name).toContain('Test Zone');
      expect(shifted.name).toContain('+3');
    });

    it('allows custom name override', () => {
      const zone = createRectangleZone({
        startString: 1,
        endString: 2,
        startFret: 5,
        endFret: 7,
        name: 'Test Zone'
      });
      
      const shifted = shiftZone(zone, 3, 'Custom Shifted Zone');
      
      expect(shifted.name).toBe('Custom Shifted Zone');
    });

    it('handles zero offset (returns copy)', () => {
      const zone = createRectangleZone({
        startString: 1,
        endString: 2,
        startFret: 5,
        endFret: 7
      });
      
      const shifted = shiftZone(zone, 0);
      
      expect(shifted.equals(zone)).toBe(true);
      expect(shifted).not.toBe(zone); // Should be a new instance
    });
  });

  describe('getZoneShiftRange', () => {
    it('returns correct range for zone in middle of fretboard', () => {
      const zone = createRectangleZone({
        startString: 1,
        endString: 2,
        startFret: 10,
        endFret: 14
      });
      
      const range = getZoneShiftRange(zone);
      
      // Can shift down until max fret (14) reaches 0: -14
      // Can shift up until min fret (10) reaches 24: +14
      expect(range.minOffset).toBe(-14);
      expect(range.maxOffset).toBe(14);
    });

    it('returns correct range for zone at fret 0', () => {
      const zone = createRectangleZone({
        startString: 1,
        endString: 2,
        startFret: 0,
        endFret: 5
      });
      
      const range = getZoneShiftRange(zone);
      
      // Can shift down until max fret (5) reaches 0: -5
      // Can shift up until min fret (0) reaches 24: +24
      expect(range.minOffset).toBe(-5);
      expect(range.maxOffset).toBe(24);
    });

    it('returns correct range for zone at fret 24', () => {
      const zone = createRectangleZone({
        startString: 1,
        endString: 2,
        startFret: 20,
        endFret: 24
      });
      
      const range = getZoneShiftRange(zone);
      
      // Can shift down until max fret (24) reaches 0: -24
      // Can shift up until min fret (20) reaches 24: +4
      expect(range.minOffset).toBe(-24);
      expect(range.maxOffset).toBe(4);
    });

    it('returns zero range for empty zone', () => {
      const zone = new HighlightZone();
      
      const range = getZoneShiftRange(zone);
      
      expect(range.minOffset).toBe(0);
      expect(range.maxOffset).toBe(0);
    });
  });

  describe('getRandomShiftOffset', () => {
    it('returns offset within valid range', () => {
      const zone = createRectangleZone({
        startString: 1,
        endString: 2,
        startFret: 10,
        endFret: 14
      });
      
      const range = getZoneShiftRange(zone);
      
      // Test multiple times to check randomness stays in bounds
      for (let i = 0; i < 50; i++) {
        const offset = getRandomShiftOffset(zone);
        expect(offset).toBeGreaterThanOrEqual(range.minOffset);
        expect(offset).toBeLessThanOrEqual(range.maxOffset);
      }
    });

    it('respects maxShiftAmount parameter', () => {
      const zone = createRectangleZone({
        startString: 1,
        endString: 2,
        startFret: 10,
        endFret: 14
      });
      
      const maxShift = 5;
      
      for (let i = 0; i < 50; i++) {
        const offset = getRandomShiftOffset(zone, maxShift);
        expect(Math.abs(offset)).toBeLessThanOrEqual(maxShift);
      }
    });

    it('uses valid range when maxShiftAmount exceeds it', () => {
      const zone = createRectangleZone({
        startString: 1,
        endString: 2,
        startFret: 22,
        endFret: 24
      });
      
      const range = getZoneShiftRange(zone);
      
      // maxOffset is only 2 (24-22), so even with maxShiftAmount=10,
      // should still be limited to valid range
      for (let i = 0; i < 50; i++) {
        const offset = getRandomShiftOffset(zone, 10);
        expect(offset).toBeGreaterThanOrEqual(range.minOffset);
        expect(offset).toBeLessThanOrEqual(range.maxOffset);
      }
    });
  });

  describe('Zone shift integration', () => {
    it('shifted zone can be used for quiz generation', () => {
      // Create a small zone
      const originalZone = createRectangleZone({
        startString: 1,
        endString: 3,
        startFret: 5,
        endFret: 8,
        name: 'Original Position'
      });
      
      // Get a random shift
      const shiftAmount = getRandomShiftOffset(originalZone, 10);
      
      // Apply shift
      const shiftedZone = shiftZone(originalZone, shiftAmount);
      
      // Verify the zone is still valid (not empty)
      expect(shiftedZone.size()).toBeGreaterThan(0);
      
      // Verify positions are correctly shifted
      const originalPositions = originalZone.getAllNotes();
      const shiftedPositions = shiftedZone.getAllNotes();
      
      for (const shiftedPos of shiftedPositions) {
        // The shifted position minus offset should have been in the original
        const originalFret = shiftedPos.fret - shiftAmount;
        if (originalFret >= 0 && originalFret <= 24) {
          expect(originalZone.containsNote(shiftedPos.string, originalFret)).toBe(true);
        }
      }
    });

    it('zone constraint verification works with shifted zones', () => {
      const zone = createRectangleZone({
        startString: 1,
        endString: 6,
        startFret: 5,
        endFret: 9
      });
      
      const shifted = shiftZone(zone, 5);
      
      // Simulate a note click at fret 12 (should be in shifted zone)
      const noteInZone = { string: 3, fret: 12 }; // 5+5=10 to 9+5=14
      expect(shifted.containsNote(noteInZone.string, noteInZone.fret)).toBe(true);
      
      // Simulate a note click at fret 5 (should NOT be in shifted zone)
      const noteOutsideZone = { string: 3, fret: 5 };
      expect(shifted.containsNote(noteOutsideZone.string, noteOutsideZone.fret)).toBe(false);
    });
  });
});
