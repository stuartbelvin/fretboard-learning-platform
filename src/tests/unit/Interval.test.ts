import { describe, it, expect } from 'vitest';
import {
  Interval,
  BASE_SEMITONES,
} from '../../core/music-theory/Interval';
import type {
  IntervalQuality,
  IntervalNumber,
} from '../../core/music-theory/Interval';
import {
  PERFECT_INTERVALS,
  IMPERFECT_INTERVALS,
  QUALITY_NAMES,
  QUALITY_ABBREVIATIONS,
  INTERVAL_NUMBER_NAMES,
  SIMPLE_INTERVALS,
  COMPOUND_INTERVALS,
  ALL_INTERVALS,
  COMMON_INTERVALS,
  SEMITONE_TO_COMMON_INTERVAL,
  getIntervalBySemitones,
  getSemitonesBetween,
} from '../../core/music-theory/Interval';

describe('Interval', () => {
  describe('constructor', () => {
    it('should create a valid perfect interval', () => {
      const interval = new Interval('perfect', 5);
      expect(interval.quality).toBe('perfect');
      expect(interval.number).toBe(5);
      expect(interval.semitones).toBe(7);
    });

    it('should create a valid major interval', () => {
      const interval = new Interval('major', 3);
      expect(interval.quality).toBe('major');
      expect(interval.number).toBe(3);
      expect(interval.semitones).toBe(4);
    });

    it('should create a valid minor interval', () => {
      const interval = new Interval('minor', 3);
      expect(interval.quality).toBe('minor');
      expect(interval.number).toBe(3);
      expect(interval.semitones).toBe(3);
    });

    it('should create a valid diminished interval', () => {
      const interval = new Interval('diminished', 5);
      expect(interval.quality).toBe('diminished');
      expect(interval.number).toBe(5);
      expect(interval.semitones).toBe(6);
    });

    it('should create a valid augmented interval', () => {
      const interval = new Interval('augmented', 4);
      expect(interval.quality).toBe('augmented');
      expect(interval.number).toBe(4);
      expect(interval.semitones).toBe(6);
    });

    it('should throw for invalid perfect interval with major quality', () => {
      expect(() => new Interval('major', 5)).toThrow(/Invalid interval/);
    });

    it('should throw for invalid perfect interval with minor quality', () => {
      expect(() => new Interval('minor', 4)).toThrow(/Invalid interval/);
    });

    it('should throw for imperfect interval with perfect quality', () => {
      expect(() => new Interval('perfect', 3)).toThrow(/Invalid interval/);
    });

    it('should correctly identify compound intervals', () => {
      const simple = new Interval('major', 3);
      const compound = new Interval('major', 10);
      expect(simple.isCompound).toBe(false);
      expect(compound.isCompound).toBe(true);
    });

    it('should calculate simple number for compound intervals', () => {
      const ninth = new Interval('major', 9);
      expect(ninth.simpleNumber).toBe(2);
      
      const tenth = new Interval('major', 10);
      expect(tenth.simpleNumber).toBe(3);
      
      const eleventh = new Interval('perfect', 11);
      expect(eleventh.simpleNumber).toBe(4);
    });
  });

  describe('isPerfectInterval', () => {
    it('should return true for unison', () => {
      expect(Interval.isPerfectInterval(1)).toBe(true);
    });

    it('should return true for fourth', () => {
      expect(Interval.isPerfectInterval(4)).toBe(true);
    });

    it('should return true for fifth', () => {
      expect(Interval.isPerfectInterval(5)).toBe(true);
    });

    it('should return true for octave', () => {
      expect(Interval.isPerfectInterval(8)).toBe(true);
    });

    it('should return true for compound perfect intervals', () => {
      expect(Interval.isPerfectInterval(11)).toBe(true);
      expect(Interval.isPerfectInterval(12)).toBe(true);
      expect(Interval.isPerfectInterval(15)).toBe(true);
    });

    it('should return false for imperfect intervals', () => {
      expect(Interval.isPerfectInterval(2)).toBe(false);
      expect(Interval.isPerfectInterval(3)).toBe(false);
      expect(Interval.isPerfectInterval(6)).toBe(false);
      expect(Interval.isPerfectInterval(7)).toBe(false);
    });
  });

  describe('isValidCombination', () => {
    it('should allow perfect quality for perfect intervals', () => {
      expect(Interval.isValidCombination('perfect', 1)).toBe(true);
      expect(Interval.isValidCombination('perfect', 4)).toBe(true);
      expect(Interval.isValidCombination('perfect', 5)).toBe(true);
      expect(Interval.isValidCombination('perfect', 8)).toBe(true);
    });

    it('should not allow major/minor for perfect intervals', () => {
      expect(Interval.isValidCombination('major', 5)).toBe(false);
      expect(Interval.isValidCombination('minor', 4)).toBe(false);
    });

    it('should allow major/minor for imperfect intervals', () => {
      expect(Interval.isValidCombination('major', 2)).toBe(true);
      expect(Interval.isValidCombination('minor', 3)).toBe(true);
      expect(Interval.isValidCombination('major', 6)).toBe(true);
      expect(Interval.isValidCombination('minor', 7)).toBe(true);
    });

    it('should not allow perfect quality for imperfect intervals', () => {
      expect(Interval.isValidCombination('perfect', 2)).toBe(false);
      expect(Interval.isValidCombination('perfect', 3)).toBe(false);
    });

    it('should allow diminished/augmented for all intervals', () => {
      expect(Interval.isValidCombination('diminished', 3)).toBe(true);
      expect(Interval.isValidCombination('augmented', 3)).toBe(true);
      expect(Interval.isValidCombination('diminished', 5)).toBe(true);
      expect(Interval.isValidCombination('augmented', 5)).toBe(true);
    });
  });

  describe('getSimpleNumber', () => {
    it('should return same number for simple intervals', () => {
      expect(Interval.getSimpleNumber(1)).toBe(1);
      expect(Interval.getSimpleNumber(5)).toBe(5);
      expect(Interval.getSimpleNumber(8)).toBe(8);
    });

    it('should reduce compound intervals', () => {
      expect(Interval.getSimpleNumber(9)).toBe(2);
      expect(Interval.getSimpleNumber(10)).toBe(3);
      expect(Interval.getSimpleNumber(11)).toBe(4);
      expect(Interval.getSimpleNumber(12)).toBe(5);
      expect(Interval.getSimpleNumber(13)).toBe(6);
      expect(Interval.getSimpleNumber(14)).toBe(7);
      expect(Interval.getSimpleNumber(15)).toBe(8);
    });
  });

  describe('semitone calculations', () => {
    describe('simple intervals', () => {
      it('should calculate perfect unison as 0 semitones', () => {
        expect(new Interval('perfect', 1).semitones).toBe(0);
      });

      it('should calculate minor second as 1 semitone', () => {
        expect(new Interval('minor', 2).semitones).toBe(1);
      });

      it('should calculate major second as 2 semitones', () => {
        expect(new Interval('major', 2).semitones).toBe(2);
      });

      it('should calculate minor third as 3 semitones', () => {
        expect(new Interval('minor', 3).semitones).toBe(3);
      });

      it('should calculate major third as 4 semitones', () => {
        expect(new Interval('major', 3).semitones).toBe(4);
      });

      it('should calculate perfect fourth as 5 semitones', () => {
        expect(new Interval('perfect', 4).semitones).toBe(5);
      });

      it('should calculate tritone (augmented fourth) as 6 semitones', () => {
        expect(new Interval('augmented', 4).semitones).toBe(6);
      });

      it('should calculate tritone (diminished fifth) as 6 semitones', () => {
        expect(new Interval('diminished', 5).semitones).toBe(6);
      });

      it('should calculate perfect fifth as 7 semitones', () => {
        expect(new Interval('perfect', 5).semitones).toBe(7);
      });

      it('should calculate minor sixth as 8 semitones', () => {
        expect(new Interval('minor', 6).semitones).toBe(8);
      });

      it('should calculate major sixth as 9 semitones', () => {
        expect(new Interval('major', 6).semitones).toBe(9);
      });

      it('should calculate minor seventh as 10 semitones', () => {
        expect(new Interval('minor', 7).semitones).toBe(10);
      });

      it('should calculate major seventh as 11 semitones', () => {
        expect(new Interval('major', 7).semitones).toBe(11);
      });

      it('should calculate perfect octave as 12 semitones', () => {
        expect(new Interval('perfect', 8).semitones).toBe(12);
      });
    });

    describe('compound intervals', () => {
      it('should calculate minor ninth as 13 semitones', () => {
        expect(new Interval('minor', 9).semitones).toBe(13);
      });

      it('should calculate major ninth as 14 semitones', () => {
        expect(new Interval('major', 9).semitones).toBe(14);
      });

      it('should calculate major tenth as 16 semitones', () => {
        expect(new Interval('major', 10).semitones).toBe(16);
      });

      it('should calculate perfect eleventh as 17 semitones', () => {
        expect(new Interval('perfect', 11).semitones).toBe(17);
      });

      it('should calculate perfect twelfth as 19 semitones', () => {
        expect(new Interval('perfect', 12).semitones).toBe(19);
      });

      it('should calculate major thirteenth as 21 semitones', () => {
        expect(new Interval('major', 13).semitones).toBe(21);
      });

      it('should calculate perfect fifteenth (double octave) as 24 semitones', () => {
        expect(new Interval('perfect', 15).semitones).toBe(24);
      });
    });

    describe('diminished intervals', () => {
      it('should calculate diminished third as 2 semitones (enharmonic to M2)', () => {
        expect(new Interval('diminished', 3).semitones).toBe(2);
      });

      it('should calculate diminished fifth as 6 semitones', () => {
        expect(new Interval('diminished', 5).semitones).toBe(6);
      });

      it('should calculate diminished seventh as 9 semitones (enharmonic to M6)', () => {
        expect(new Interval('diminished', 7).semitones).toBe(9);
      });

      it('should calculate diminished octave as 11 semitones', () => {
        expect(new Interval('diminished', 8).semitones).toBe(11);
      });
    });

    describe('augmented intervals', () => {
      it('should calculate augmented second as 3 semitones (enharmonic to m3)', () => {
        expect(new Interval('augmented', 2).semitones).toBe(3);
      });

      it('should calculate augmented fourth as 6 semitones (tritone)', () => {
        expect(new Interval('augmented', 4).semitones).toBe(6);
      });

      it('should calculate augmented fifth as 8 semitones (enharmonic to m6)', () => {
        expect(new Interval('augmented', 5).semitones).toBe(8);
      });

      it('should calculate augmented sixth as 10 semitones (enharmonic to m7)', () => {
        expect(new Interval('augmented', 6).semitones).toBe(10);
      });
    });
  });

  describe('getFullName', () => {
    it('should return spelled out name for simple intervals', () => {
      expect(new Interval('perfect', 1).getFullName()).toBe('perfect unison');
      expect(new Interval('minor', 2).getFullName()).toBe('minor second');
      expect(new Interval('major', 3).getFullName()).toBe('major third');
      expect(new Interval('perfect', 4).getFullName()).toBe('perfect fourth');
      expect(new Interval('perfect', 5).getFullName()).toBe('perfect fifth');
      expect(new Interval('minor', 6).getFullName()).toBe('minor sixth');
      expect(new Interval('major', 7).getFullName()).toBe('major seventh');
      expect(new Interval('perfect', 8).getFullName()).toBe('perfect octave');
    });

    it('should return spelled out name for compound intervals', () => {
      expect(new Interval('major', 9).getFullName()).toBe('major ninth');
      expect(new Interval('major', 10).getFullName()).toBe('major tenth');
      expect(new Interval('perfect', 11).getFullName()).toBe('perfect eleventh');
      expect(new Interval('perfect', 12).getFullName()).toBe('perfect twelfth');
      expect(new Interval('major', 13).getFullName()).toBe('major thirteenth');
    });

    it('should return spelled out name for diminished/augmented intervals', () => {
      expect(new Interval('diminished', 5).getFullName()).toBe('diminished fifth');
      expect(new Interval('augmented', 4).getFullName()).toBe('augmented fourth');
      expect(new Interval('augmented', 5).getFullName()).toBe('augmented fifth');
    });
  });

  describe('getShortName', () => {
    it('should return short notation for intervals', () => {
      expect(new Interval('perfect', 1).getShortName()).toBe('P1');
      expect(new Interval('minor', 2).getShortName()).toBe('m2');
      expect(new Interval('major', 3).getShortName()).toBe('M3');
      expect(new Interval('perfect', 4).getShortName()).toBe('P4');
      expect(new Interval('diminished', 5).getShortName()).toBe('d5');
      expect(new Interval('augmented', 4).getShortName()).toBe('A4');
      expect(new Interval('perfect', 5).getShortName()).toBe('P5');
      expect(new Interval('major', 9).getShortName()).toBe('M9');
    });
  });

  describe('equals', () => {
    it('should return true for identical intervals', () => {
      const interval1 = new Interval('major', 3);
      const interval2 = new Interval('major', 3);
      expect(interval1.equals(interval2)).toBe(true);
    });

    it('should return false for different quality', () => {
      const major = new Interval('major', 3);
      const minor = new Interval('minor', 3);
      expect(major.equals(minor)).toBe(false);
    });

    it('should return false for different number', () => {
      const third = new Interval('major', 3);
      const sixth = new Interval('major', 6);
      expect(third.equals(sixth)).toBe(false);
    });
  });

  describe('isSameSemitones', () => {
    it('should return true for enharmonic intervals', () => {
      const augFourth = new Interval('augmented', 4);
      const dimFifth = new Interval('diminished', 5);
      expect(augFourth.isSameSemitones(dimFifth)).toBe(true);
    });

    it('should return true for augmented second and minor third', () => {
      const augSecond = new Interval('augmented', 2);
      const minThird = new Interval('minor', 3);
      expect(augSecond.isSameSemitones(minThird)).toBe(true);
    });

    it('should return false for different semitone distances', () => {
      const major = new Interval('major', 3);
      const minor = new Interval('minor', 3);
      expect(major.isSameSemitones(minor)).toBe(false);
    });
  });

  describe('getInversion', () => {
    it('should invert major to minor', () => {
      const major3 = new Interval('major', 3);
      const inversion = major3.getInversion();
      expect(inversion.quality).toBe('minor');
      expect(inversion.number).toBe(6);
    });

    it('should invert minor to major', () => {
      const minor3 = new Interval('minor', 3);
      const inversion = minor3.getInversion();
      expect(inversion.quality).toBe('major');
      expect(inversion.number).toBe(6);
    });

    it('should keep perfect as perfect', () => {
      const perfect5 = new Interval('perfect', 5);
      const inversion = perfect5.getInversion();
      expect(inversion.quality).toBe('perfect');
      expect(inversion.number).toBe(4);
    });

    it('should invert augmented to diminished', () => {
      const aug4 = new Interval('augmented', 4);
      const inversion = aug4.getInversion();
      expect(inversion.quality).toBe('diminished');
      expect(inversion.number).toBe(5);
    });

    it('should invert diminished to augmented', () => {
      const dim5 = new Interval('diminished', 5);
      const inversion = dim5.getInversion();
      expect(inversion.quality).toBe('augmented');
      expect(inversion.number).toBe(4);
    });

    it('should sum to octave (12 semitones)', () => {
      const intervals: Array<[IntervalQuality, IntervalNumber]> = [
        ['minor', 2], ['major', 2],
        ['minor', 3], ['major', 3],
        ['perfect', 4], ['augmented', 4],
        ['diminished', 5], ['perfect', 5],
        ['minor', 6], ['major', 6],
        ['minor', 7], ['major', 7]
      ];

      for (const [quality, number] of intervals) {
        const interval = new Interval(quality, number);
        const inversion = interval.getInversion();
        expect(interval.semitones + inversion.semitones).toBe(12);
      }
    });
  });

  describe('getCompound', () => {
    it('should create compound from simple interval', () => {
      const major3 = new Interval('major', 3);
      const compound = major3.getCompound();
      expect(compound.number).toBe(10);
      expect(compound.quality).toBe('major');
      expect(compound.isCompound).toBe(true);
    });

    it('should add 12 semitones', () => {
      const simple = new Interval('perfect', 5);
      const compound = simple.getCompound();
      expect(compound.semitones).toBe(simple.semitones + 12);
    });

    it('should throw for already compound intervals', () => {
      const compound = new Interval('major', 10);
      expect(() => compound.getCompound()).toThrow();
    });

    it('should throw for octave', () => {
      const octave = new Interval('perfect', 8);
      expect(() => octave.getCompound()).toThrow();
    });
  });

  describe('getSimple', () => {
    it('should return simple equivalent of compound interval', () => {
      const compound = new Interval('major', 10);
      const simple = compound.getSimple();
      expect(simple.number).toBe(3);
      expect(simple.quality).toBe('major');
      expect(simple.isCompound).toBe(false);
    });

    it('should return same interval for simple intervals', () => {
      const simple = new Interval('major', 3);
      const result = simple.getSimple();
      expect(result.equals(simple)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return debug-friendly string', () => {
      const interval = new Interval('major', 3);
      expect(interval.toString()).toContain('M3');
      expect(interval.toString()).toContain('major third');
      expect(interval.toString()).toContain('4 semitones');
    });
  });

  describe('fromShortName', () => {
    it('should parse perfect intervals', () => {
      const p5 = Interval.fromShortName('P5');
      expect(p5.quality).toBe('perfect');
      expect(p5.number).toBe(5);
    });

    it('should parse major intervals', () => {
      const M3 = Interval.fromShortName('M3');
      expect(M3.quality).toBe('major');
      expect(M3.number).toBe(3);
    });

    it('should parse minor intervals', () => {
      const m3 = Interval.fromShortName('m3');
      expect(m3.quality).toBe('minor');
      expect(m3.number).toBe(3);
    });

    it('should parse diminished intervals', () => {
      const d5 = Interval.fromShortName('d5');
      expect(d5.quality).toBe('diminished');
      expect(d5.number).toBe(5);
    });

    it('should parse augmented intervals', () => {
      const A4 = Interval.fromShortName('A4');
      expect(A4.quality).toBe('augmented');
      expect(A4.number).toBe(4);
    });

    it('should parse compound intervals', () => {
      const M9 = Interval.fromShortName('M9');
      expect(M9.quality).toBe('major');
      expect(M9.number).toBe(9);
      expect(M9.isCompound).toBe(true);
    });

    it('should throw for invalid format', () => {
      expect(() => Interval.fromShortName('X5')).toThrow();
      expect(() => Interval.fromShortName('5P')).toThrow();
      expect(() => Interval.fromShortName('')).toThrow();
    });

    it('should throw for out of range numbers', () => {
      expect(() => Interval.fromShortName('P0')).toThrow();
      expect(() => Interval.fromShortName('M16')).toThrow();
    });
  });

  describe('fromSemitones', () => {
    it('should find interval for all semitone values 0-12', () => {
      for (let i = 0; i <= 12; i++) {
        expect(() => Interval.fromSemitones(i)).not.toThrow();
      }
    });

    it('should find interval for compound semitone values 13-24', () => {
      for (let i = 13; i <= 24; i++) {
        expect(() => Interval.fromSemitones(i)).not.toThrow();
      }
    });

    it('should return correct intervals for common semitone values', () => {
      expect(Interval.fromSemitones(0).getShortName()).toMatch(/P1/);
      expect(Interval.fromSemitones(7).getShortName()).toMatch(/P5/);
      expect(Interval.fromSemitones(12).getShortName()).toMatch(/P8/);
    });

    it('should throw for negative semitones', () => {
      expect(() => Interval.fromSemitones(-1)).toThrow();
    });

    it('should throw for semitones > 24', () => {
      expect(() => Interval.fromSemitones(25)).toThrow();
    });
  });

  describe('pre-calculated intervals', () => {
    describe('SIMPLE_INTERVALS', () => {
      it('should contain all valid simple interval combinations', () => {
        expect(SIMPLE_INTERVALS.length).toBeGreaterThan(20);
        expect(SIMPLE_INTERVALS.every(i => i.number <= 8)).toBe(true);
      });

      it('should not contain invalid combinations', () => {
        const qualities = SIMPLE_INTERVALS.map(i => `${i.quality}-${i.number}`);
        // Perfect intervals should not have major/minor
        expect(qualities).not.toContain('major-5');
        expect(qualities).not.toContain('minor-4');
        // Imperfect intervals should not have perfect
        expect(qualities).not.toContain('perfect-3');
      });
    });

    describe('COMPOUND_INTERVALS', () => {
      it('should contain compound intervals only', () => {
        expect(COMPOUND_INTERVALS.every(i => i.number > 8)).toBe(true);
      });

      it('should have valid quality/number combinations', () => {
        for (const interval of COMPOUND_INTERVALS) {
          expect(() => new Interval(interval.quality, interval.number)).not.toThrow();
        }
      });
    });

    describe('ALL_INTERVALS', () => {
      it('should combine simple and compound intervals', () => {
        expect(ALL_INTERVALS.length).toBe(SIMPLE_INTERVALS.length + COMPOUND_INTERVALS.length);
      });
    });

    describe('COMMON_INTERVALS', () => {
      it('should contain the most used intervals', () => {
        const shortNames = COMMON_INTERVALS.map(i => i.getShortName());
        expect(shortNames).toContain('P1');
        expect(shortNames).toContain('m3');
        expect(shortNames).toContain('M3');
        expect(shortNames).toContain('P4');
        expect(shortNames).toContain('P5');
        expect(shortNames).toContain('P8');
      });

      it('should include tritone', () => {
        const semitones = COMMON_INTERVALS.map(i => i.semitones);
        expect(semitones).toContain(6);
      });
    });
  });

  describe('getIntervalBySemitones', () => {
    it('should return correct interval for all semitone values', () => {
      expect(getIntervalBySemitones(0).getShortName()).toBe('P1');
      expect(getIntervalBySemitones(1).getShortName()).toBe('m2');
      expect(getIntervalBySemitones(2).getShortName()).toBe('M2');
      expect(getIntervalBySemitones(3).getShortName()).toBe('m3');
      expect(getIntervalBySemitones(4).getShortName()).toBe('M3');
      expect(getIntervalBySemitones(5).getShortName()).toBe('P4');
      expect(getIntervalBySemitones(6).getShortName()).toBe('A4'); // tritone
      expect(getIntervalBySemitones(7).getShortName()).toBe('P5');
      expect(getIntervalBySemitones(8).getShortName()).toBe('m6');
      expect(getIntervalBySemitones(9).getShortName()).toBe('M6');
      expect(getIntervalBySemitones(10).getShortName()).toBe('m7');
      expect(getIntervalBySemitones(11).getShortName()).toBe('M7');
      expect(getIntervalBySemitones(12).getShortName()).toBe('P8');
    });

    it('should return compound intervals for semitones > 12', () => {
      expect(getIntervalBySemitones(14).getShortName()).toBe('M9');
      expect(getIntervalBySemitones(17).getShortName()).toBe('P11');
      expect(getIntervalBySemitones(19).getShortName()).toBe('P12');
      expect(getIntervalBySemitones(24).getShortName()).toBe('P15');
    });

    it('should throw for out of range values', () => {
      expect(() => getIntervalBySemitones(-1)).toThrow();
      expect(() => getIntervalBySemitones(25)).toThrow();
    });
  });

  describe('getSemitonesBetween', () => {
    it('should calculate ascending interval', () => {
      expect(getSemitonesBetween(0, 7)).toBe(7); // C to G
    });

    it('should handle wrap-around', () => {
      expect(getSemitonesBetween(10, 2)).toBe(4); // A# to D
    });

    it('should return 0 for same note', () => {
      expect(getSemitonesBetween(5, 5)).toBe(0);
    });

    it('should always return positive value', () => {
      for (let i = 0; i < 12; i++) {
        for (let j = 0; j < 12; j++) {
          expect(getSemitonesBetween(i, j)).toBeGreaterThanOrEqual(0);
          expect(getSemitonesBetween(i, j)).toBeLessThan(12);
        }
      }
    });
  });

  describe('constants', () => {
    describe('BASE_SEMITONES', () => {
      it('should have correct values for all 15 interval numbers', () => {
        expect(BASE_SEMITONES[1]).toBe(0);
        expect(BASE_SEMITONES[2]).toBe(2);
        expect(BASE_SEMITONES[3]).toBe(4);
        expect(BASE_SEMITONES[4]).toBe(5);
        expect(BASE_SEMITONES[5]).toBe(7);
        expect(BASE_SEMITONES[6]).toBe(9);
        expect(BASE_SEMITONES[7]).toBe(11);
        expect(BASE_SEMITONES[8]).toBe(12);
        expect(BASE_SEMITONES[9]).toBe(14);
        expect(BASE_SEMITONES[15]).toBe(24);
      });
    });

    describe('PERFECT_INTERVALS', () => {
      it('should contain 1, 4, 5, 8, 11, 12, 15', () => {
        expect(PERFECT_INTERVALS).toContain(1);
        expect(PERFECT_INTERVALS).toContain(4);
        expect(PERFECT_INTERVALS).toContain(5);
        expect(PERFECT_INTERVALS).toContain(8);
        expect(PERFECT_INTERVALS).toContain(11);
        expect(PERFECT_INTERVALS).toContain(12);
        expect(PERFECT_INTERVALS).toContain(15);
      });
    });

    describe('IMPERFECT_INTERVALS', () => {
      it('should contain 2, 3, 6, 7, 9, 10, 13, 14', () => {
        expect(IMPERFECT_INTERVALS).toContain(2);
        expect(IMPERFECT_INTERVALS).toContain(3);
        expect(IMPERFECT_INTERVALS).toContain(6);
        expect(IMPERFECT_INTERVALS).toContain(7);
        expect(IMPERFECT_INTERVALS).toContain(9);
        expect(IMPERFECT_INTERVALS).toContain(10);
        expect(IMPERFECT_INTERVALS).toContain(13);
        expect(IMPERFECT_INTERVALS).toContain(14);
      });
    });

    describe('QUALITY_NAMES', () => {
      it('should have all quality names', () => {
        expect(QUALITY_NAMES.perfect).toBe('perfect');
        expect(QUALITY_NAMES.major).toBe('major');
        expect(QUALITY_NAMES.minor).toBe('minor');
        expect(QUALITY_NAMES.diminished).toBe('diminished');
        expect(QUALITY_NAMES.augmented).toBe('augmented');
      });
    });

    describe('QUALITY_ABBREVIATIONS', () => {
      it('should have correct abbreviations', () => {
        expect(QUALITY_ABBREVIATIONS.perfect).toBe('P');
        expect(QUALITY_ABBREVIATIONS.major).toBe('M');
        expect(QUALITY_ABBREVIATIONS.minor).toBe('m');
        expect(QUALITY_ABBREVIATIONS.diminished).toBe('d');
        expect(QUALITY_ABBREVIATIONS.augmented).toBe('A');
      });
    });

    describe('INTERVAL_NUMBER_NAMES', () => {
      it('should have names for all 15 numbers', () => {
        expect(INTERVAL_NUMBER_NAMES[1]).toBe('unison');
        expect(INTERVAL_NUMBER_NAMES[8]).toBe('octave');
        expect(INTERVAL_NUMBER_NAMES[15]).toBe('fifteenth');
      });
    });

    describe('SEMITONE_TO_COMMON_INTERVAL', () => {
      it('should map all semitone values 0-24', () => {
        for (let i = 0; i <= 24; i++) {
          expect(SEMITONE_TO_COMMON_INTERVAL[i]).toBeDefined();
        }
      });
    });
  });

  describe('music theory validation', () => {
    it('should match standard interval semitone chart', () => {
      // Standard reference intervals
      const referenceIntervals: Array<[string, number]> = [
        ['P1', 0], ['m2', 1], ['M2', 2], ['m3', 3], ['M3', 4],
        ['P4', 5], ['A4', 6], ['d5', 6], ['P5', 7], ['m6', 8],
        ['M6', 9], ['m7', 10], ['M7', 11], ['P8', 12]
      ];

      for (const [shortName, expectedSemitones] of referenceIntervals) {
        const interval = Interval.fromShortName(shortName);
        expect(interval.semitones).toBe(expectedSemitones);
      }
    });

    it('should satisfy interval inversion rules', () => {
      // P1+P8=12, m2+M7=12, M2+m7=12, m3+M6=12, M3+m6=12, P4+P5=12
      expect(new Interval('perfect', 1).semitones + new Interval('perfect', 8).semitones).toBe(12);
      expect(new Interval('minor', 2).semitones + new Interval('major', 7).semitones).toBe(12);
      expect(new Interval('major', 2).semitones + new Interval('minor', 7).semitones).toBe(12);
      expect(new Interval('minor', 3).semitones + new Interval('major', 6).semitones).toBe(12);
      expect(new Interval('major', 3).semitones + new Interval('minor', 6).semitones).toBe(12);
      expect(new Interval('perfect', 4).semitones + new Interval('perfect', 5).semitones).toBe(12);
    });

    it('should correctly identify tritone as 6 semitones', () => {
      const a4 = new Interval('augmented', 4);
      const d5 = new Interval('diminished', 5);
      expect(a4.semitones).toBe(6);
      expect(d5.semitones).toBe(6);
      expect(a4.isSameSemitones(d5)).toBe(true);
    });

    it('should calculate all 12 chromatic intervals from any root', () => {
      // Starting from any note, all 12 chromatic notes within an octave
      // should be reachable via standard intervals
      const chromaticSemitones = new Set<number>();
      for (let i = 0; i <= 12; i++) {
        chromaticSemitones.add(i);
      }

      const reachableSemitones = new Set(
        SIMPLE_INTERVALS.map(i => i.semitones).filter(s => s <= 12)
      );

      for (let i = 0; i <= 12; i++) {
        expect(reachableSemitones.has(i)).toBe(true);
      }
    });
  });
});
