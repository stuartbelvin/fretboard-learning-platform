/**
 * Interval qualities in music theory.
 * - perfect: unison, 4th, 5th, octave (and compounds)
 * - major/minor: 2nd, 3rd, 6th, 7th (and compounds)
 * - diminished: one semitone smaller than perfect or minor
 * - augmented: one semitone larger than perfect or major
 */
export type IntervalQuality = 'perfect' | 'major' | 'minor' | 'diminished' | 'augmented';

/**
 * Interval numbers (scale degrees).
 * Simple intervals: 1-8 (unison through octave)
 * Compound intervals: 9-15 (beyond one octave)
 */
export type IntervalNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

/**
 * Short notation for intervals (e.g., 'P5' for perfect fifth, 'm3' for minor third).
 */
export type IntervalShortName = 
  | 'P1' | 'd2' | 'm2' | 'M2' | 'A2' | 'd3' | 'm3' | 'M3' | 'A3' 
  | 'd4' | 'P4' | 'A4' | 'd5' | 'P5' | 'A5' | 'd6' | 'm6' | 'M6' | 'A6'
  | 'd7' | 'm7' | 'M7' | 'A7' | 'd8' | 'P8' | 'A8'
  // Compound intervals
  | 'P9' | 'm9' | 'M9' | 'A9' | 'd10' | 'm10' | 'M10' | 'A10'
  | 'd11' | 'P11' | 'A11' | 'd12' | 'P12' | 'A12'
  | 'd13' | 'm13' | 'M13' | 'A13' | 'd14' | 'm14' | 'M14' | 'A14'
  | 'd15' | 'P15' | 'A15';

/**
 * Defines which interval numbers can have which qualities.
 */
export const PERFECT_INTERVALS = [1, 4, 5, 8, 11, 12, 15] as const;
export const IMPERFECT_INTERVALS = [2, 3, 6, 7, 9, 10, 13, 14] as const;

/**
 * Base semitone values for each interval number (using major/perfect as reference).
 */
export const BASE_SEMITONES: Record<IntervalNumber, number> = {
  1: 0,   // Perfect unison
  2: 2,   // Major second
  3: 4,   // Major third
  4: 5,   // Perfect fourth
  5: 7,   // Perfect fifth
  6: 9,   // Major sixth
  7: 11,  // Major seventh
  8: 12,  // Perfect octave
  9: 14,  // Major ninth
  10: 16, // Major tenth
  11: 17, // Perfect eleventh
  12: 19, // Perfect twelfth
  13: 21, // Major thirteenth
  14: 23, // Major fourteenth
  15: 24  // Perfect fifteenth (double octave)
};

/**
 * Quality modifiers in semitones from the base (major/perfect).
 */
export const QUALITY_MODIFIERS: Record<IntervalQuality, (isPerfect: boolean) => number> = {
  perfect: () => 0,
  major: () => 0,
  minor: () => -1,
  diminished: (isPerfect) => isPerfect ? -1 : -2,
  augmented: () => 1
};

/**
 * Full names for each interval number (singular).
 */
export const INTERVAL_NUMBER_NAMES: Record<IntervalNumber, string> = {
  1: 'unison',
  2: 'second',
  3: 'third',
  4: 'fourth',
  5: 'fifth',
  6: 'sixth',
  7: 'seventh',
  8: 'octave',
  9: 'ninth',
  10: 'tenth',
  11: 'eleventh',
  12: 'twelfth',
  13: 'thirteenth',
  14: 'fourteenth',
  15: 'fifteenth'
};

/**
 * Full names for each quality.
 */
export const QUALITY_NAMES: Record<IntervalQuality, string> = {
  perfect: 'perfect',
  major: 'major',
  minor: 'minor',
  diminished: 'diminished',
  augmented: 'augmented'
};

/**
 * Quality abbreviations for short notation.
 */
export const QUALITY_ABBREVIATIONS: Record<IntervalQuality, string> = {
  perfect: 'P',
  major: 'M',
  minor: 'm',
  diminished: 'd',
  augmented: 'A'
};

/**
 * Reverse mapping from abbreviation to quality.
 */
export const ABBREVIATION_TO_QUALITY: Record<string, IntervalQuality> = {
  'P': 'perfect',
  'M': 'major',
  'm': 'minor',
  'd': 'diminished',
  'A': 'augmented'
};

/**
 * Represents a musical interval with quality, number, and semitone distance.
 */
export class Interval {
  /**
   * The quality of the interval (perfect, major, minor, diminished, augmented).
   */
  public readonly quality: IntervalQuality;

  /**
   * The interval number (1-15, where 1 is unison, 8 is octave, etc.).
   */
  public readonly number: IntervalNumber;

  /**
   * The distance in semitones from the root note.
   */
  public readonly semitones: number;

  /**
   * Whether this is a compound interval (greater than an octave).
   */
  public readonly isCompound: boolean;

  /**
   * The simple interval equivalent (for compound intervals).
   */
  public readonly simpleNumber: IntervalNumber;

  constructor(quality: IntervalQuality, number: IntervalNumber) {
    // Validate the combination of quality and number
    if (!Interval.isValidCombination(quality, number)) {
      throw new Error(
        `Invalid interval: ${quality} ${INTERVAL_NUMBER_NAMES[number]}. ` +
        `${Interval.isPerfectInterval(number) ? 'Perfect' : 'Imperfect'} intervals cannot have ` +
        `${quality} quality.`
      );
    }

    this.quality = quality;
    this.number = number;
    this.isCompound = number > 8;
    this.simpleNumber = Interval.getSimpleNumber(number);
    this.semitones = this.calculateSemitones();
  }

  /**
   * Checks if a given interval number belongs to the perfect interval category.
   */
  public static isPerfectInterval(number: IntervalNumber): boolean {
    return (PERFECT_INTERVALS as readonly number[]).includes(number);
  }

  /**
   * Checks if a quality/number combination is valid in music theory.
   */
  public static isValidCombination(quality: IntervalQuality, number: IntervalNumber): boolean {
    const isPerfect = Interval.isPerfectInterval(number);
    
    if (isPerfect) {
      // Perfect intervals can be: perfect, diminished, augmented
      return quality === 'perfect' || quality === 'diminished' || quality === 'augmented';
    } else {
      // Imperfect intervals can be: major, minor, diminished, augmented
      return quality !== 'perfect';
    }
  }

  /**
   * Gets the simple interval number (reduces compound intervals to their simple form).
   */
  public static getSimpleNumber(number: IntervalNumber): IntervalNumber {
    if (number <= 8) return number;
    // For compound intervals, subtract 7 to get the simple equivalent
    // 9 -> 2, 10 -> 3, 11 -> 4, 12 -> 5, 13 -> 6, 14 -> 7, 15 -> 8
    const simple = ((number - 1) % 7) + 1;
    // Special case: 15 should map to 8 (double octave -> octave), not 1
    return (simple === 1 && number > 8 ? 8 : simple) as IntervalNumber;
  }

  /**
   * Calculates the semitone distance for this interval.
   */
  private calculateSemitones(): number {
    const baseSemitones = BASE_SEMITONES[this.number];
    const isPerfect = Interval.isPerfectInterval(this.number);
    const modifier = QUALITY_MODIFIERS[this.quality](isPerfect);
    return baseSemitones + modifier;
  }

  /**
   * Gets the full spelled-out name (e.g., "minor third", "perfect fifth").
   */
  public getFullName(): string {
    return `${QUALITY_NAMES[this.quality]} ${INTERVAL_NUMBER_NAMES[this.number]}`;
  }

  /**
   * Gets the short notation (e.g., "m3", "P5", "M10").
   */
  public getShortName(): IntervalShortName {
    return `${QUALITY_ABBREVIATIONS[this.quality]}${this.number}` as IntervalShortName;
  }

  /**
   * Checks if this interval is the same as another (same quality and number).
   */
  public equals(other: Interval): boolean {
    return this.quality === other.quality && this.number === other.number;
  }

  /**
   * Checks if this interval has the same semitone distance as another.
   * (Enharmonically equivalent intervals)
   */
  public isSameSemitones(other: Interval): boolean {
    return this.semitones === other.semitones;
  }

  /**
   * Gets the inversion of this interval (within an octave).
   */
  public getInversion(): Interval {
    // Inversions: 1↔8, 2↔7, 3↔6, 4↔5
    // Quality inversions: M↔m, P↔P, d↔A
    const invertedNumber = (9 - this.simpleNumber) as IntervalNumber;
    
    let invertedQuality: IntervalQuality;
    switch (this.quality) {
      case 'major': invertedQuality = 'minor'; break;
      case 'minor': invertedQuality = 'major'; break;
      case 'augmented': invertedQuality = 'diminished'; break;
      case 'diminished': invertedQuality = 'augmented'; break;
      case 'perfect': invertedQuality = 'perfect'; break;
    }

    return new Interval(invertedQuality, invertedNumber);
  }

  /**
   * Returns the compound version of this interval (adds an octave).
   * Only valid for simple intervals.
   */
  public getCompound(): Interval {
    if (this.isCompound || this.number === 8) {
      throw new Error('Cannot get compound of an already compound interval or octave');
    }
    const compoundNumber = (this.number + 7) as IntervalNumber;
    return new Interval(this.quality, compoundNumber);
  }

  /**
   * Returns the simple version of this interval (removes octaves).
   */
  public getSimple(): Interval {
    if (!this.isCompound) return this;
    return new Interval(this.quality, this.simpleNumber);
  }

  /**
   * Returns a string representation for debugging.
   */
  public toString(): string {
    return `Interval(${this.getShortName()}: ${this.getFullName()}, ${this.semitones} semitones)`;
  }

  /**
   * Creates an interval from short notation (e.g., "m3", "P5").
   */
  public static fromShortName(shortName: string): Interval {
    const match = shortName.match(/^([PMmAd])(\d+)$/);
    if (!match) {
      throw new Error(`Invalid interval short name: ${shortName}`);
    }

    const [, qualityAbbr, numberStr] = match;
    const quality = ABBREVIATION_TO_QUALITY[qualityAbbr];
    const number = parseInt(numberStr, 10) as IntervalNumber;

    if (number < 1 || number > 15) {
      throw new Error(`Interval number out of range: ${number}`);
    }

    return new Interval(quality, number);
  }

  /**
   * Creates an interval from semitone distance.
   * Returns the most common enharmonic spelling.
   * @param semitones - The number of semitones (0-24)
   * @param preferCompound - Whether to prefer compound intervals for distances > 12
   */
  public static fromSemitones(semitones: number, preferCompound = true): Interval {
    if (semitones < 0 || semitones > 24) {
      throw new Error(`Semitones out of range (0-24): ${semitones}`);
    }

    // Use the common interval mapping for standard spellings
    const shortName = SEMITONE_TO_COMMON_INTERVAL[semitones];
    if (shortName) {
      const interval = Interval.fromShortName(shortName);
      // Check if we need to convert between simple/compound
      if (!preferCompound && interval.isCompound && semitones <= 12) {
        return interval.getSimple();
      }
      return interval;
    }

    // This shouldn't happen with a complete mapping, but just in case
    throw new Error(`No interval found for ${semitones} semitones`);
  }
}

/**
 * Pre-calculated simple intervals (within one octave).
 */
export const SIMPLE_INTERVALS: Interval[] = [
  // Unison
  new Interval('perfect', 1),
  
  // Seconds
  new Interval('minor', 2),
  new Interval('major', 2),
  new Interval('augmented', 2),
  
  // Thirds
  new Interval('diminished', 3),
  new Interval('minor', 3),
  new Interval('major', 3),
  new Interval('augmented', 3),
  
  // Fourths
  new Interval('diminished', 4),
  new Interval('perfect', 4),
  new Interval('augmented', 4),
  
  // Fifths
  new Interval('diminished', 5),
  new Interval('perfect', 5),
  new Interval('augmented', 5),
  
  // Sixths
  new Interval('diminished', 6),
  new Interval('minor', 6),
  new Interval('major', 6),
  new Interval('augmented', 6),
  
  // Sevenths
  new Interval('diminished', 7),
  new Interval('minor', 7),
  new Interval('major', 7),
  new Interval('augmented', 7),
  
  // Octave
  new Interval('diminished', 8),
  new Interval('perfect', 8),
  new Interval('augmented', 8),
];

/**
 * Pre-calculated compound intervals (beyond one octave, up to 2 octaves).
 */
export const COMPOUND_INTERVALS: Interval[] = [
  // Ninths (octave + 2nd)
  new Interval('minor', 9),
  new Interval('major', 9),
  new Interval('augmented', 9),
  
  // Tenths (octave + 3rd)
  new Interval('diminished', 10),
  new Interval('minor', 10),
  new Interval('major', 10),
  new Interval('augmented', 10),
  
  // Elevenths (octave + 4th)
  new Interval('diminished', 11),
  new Interval('perfect', 11),
  new Interval('augmented', 11),
  
  // Twelfths (octave + 5th)
  new Interval('diminished', 12),
  new Interval('perfect', 12),
  new Interval('augmented', 12),
  
  // Thirteenths (octave + 6th)
  new Interval('diminished', 13),
  new Interval('minor', 13),
  new Interval('major', 13),
  new Interval('augmented', 13),
  
  // Fourteenths (octave + 7th)
  new Interval('diminished', 14),
  new Interval('minor', 14),
  new Interval('major', 14),
  new Interval('augmented', 14),
  
  // Fifteenths (double octave)
  new Interval('diminished', 15),
  new Interval('perfect', 15),
  new Interval('augmented', 15),
];

/**
 * All pre-calculated intervals (simple and compound).
 */
export const ALL_INTERVALS: Interval[] = [...SIMPLE_INTERVALS, ...COMPOUND_INTERVALS];

/**
 * Common intervals used in music (most frequently used in quizzes).
 */
export const COMMON_INTERVALS: Interval[] = [
  new Interval('perfect', 1),   // P1 - Unison
  new Interval('minor', 2),     // m2 - Minor second
  new Interval('major', 2),     // M2 - Major second
  new Interval('minor', 3),     // m3 - Minor third
  new Interval('major', 3),     // M3 - Major third
  new Interval('perfect', 4),   // P4 - Perfect fourth
  new Interval('augmented', 4), // A4 - Tritone
  new Interval('diminished', 5),// d5 - Tritone (enharmonic)
  new Interval('perfect', 5),   // P5 - Perfect fifth
  new Interval('minor', 6),     // m6 - Minor sixth
  new Interval('major', 6),     // M6 - Major sixth
  new Interval('minor', 7),     // m7 - Minor seventh
  new Interval('major', 7),     // M7 - Major seventh
  new Interval('perfect', 8),   // P8 - Octave
];

/**
 * Semitone to common interval short name mapping for quick lookup.
 */
export const SEMITONE_TO_COMMON_INTERVAL: Record<number, IntervalShortName> = {
  0: 'P1',
  1: 'm2',
  2: 'M2',
  3: 'm3',
  4: 'M3',
  5: 'P4',
  6: 'A4', // or d5 (tritone)
  7: 'P5',
  8: 'm6',
  9: 'M6',
  10: 'm7',
  11: 'M7',
  12: 'P8',
  13: 'm9',
  14: 'M9',
  15: 'm10',
  16: 'M10',
  17: 'P11',
  18: 'A11', // or d12
  19: 'P12',
  20: 'm13',
  21: 'M13',
  22: 'm14',
  23: 'M14',
  24: 'P15',
};

/**
 * Gets an interval by semitone distance using common spellings.
 * @param semitones - Number of semitones (0-24)
 * @returns The most commonly used interval for that distance
 */
export function getIntervalBySemitones(semitones: number): Interval {
  const shortName = SEMITONE_TO_COMMON_INTERVAL[semitones];
  if (!shortName) {
    throw new Error(`No common interval for ${semitones} semitones`);
  }
  return Interval.fromShortName(shortName);
}

/**
 * Calculates the interval between two pitch class indices.
 * @param fromIndex - Starting pitch class index (0-11)
 * @param toIndex - Target pitch class index (0-11)
 * @returns The interval in semitones (0-11)
 */
export function getSemitonesBetween(fromIndex: number, toIndex: number): number {
  return ((toIndex - fromIndex) % 12 + 12) % 12;
}
