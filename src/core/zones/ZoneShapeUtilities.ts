import { HighlightZone } from './HighlightZone';
import type { NotePosition } from './HighlightZone';
import { Fretboard, DEFAULT_FRETBOARD_CONFIG } from '../instruments/Fretboard';
import { Note, CHROMATIC_SCALE_SHARPS, getPitchClassIndex } from '../music-theory/Note';
import type { PitchClass } from '../music-theory/Note';

/**
 * Parameters for creating a rectangular zone on the fretboard.
 */
export interface RectangleZoneParams {
  /** Starting string number (1-6, 1 = high E) */
  startString: number;
  /** Ending string number (1-6, 6 = low E) */
  endString: number;
  /** Starting fret number (0-24, 0 = open string) */
  startFret: number;
  /** Ending fret number (0-24) */
  endFret: number;
  /** Optional name for the zone */
  name?: string;
}

/**
 * Parameters for creating an octave range zone.
 */
export interface OctaveRangeParams {
  /** The root pitch class for the octave range */
  rootPitchClass: PitchClass;
  /** The starting octave number */
  startOctave: number;
  /** The number of octaves to include (default: 1) */
  octaveCount?: number;
  /** Optional: Limit to specific fret range */
  fretRange?: { start: number; end: number };
  /** Optional: Limit to specific string range */
  stringRange?: { start: number; end: number };
  /** Optional name for the zone */
  name?: string;
  /** Optional: Custom fretboard to use (defaults to standard tuning) */
  fretboard?: Fretboard;
}

/**
 * Creates a rectangular zone containing all note positions within the specified
 * string and fret bounds.
 * 
 * @param params - Rectangle zone parameters
 * @returns A new HighlightZone containing the rectangular area
 * @throws Error if parameters are invalid
 * 
 * @example
 * // Create a zone from frets 5-8 on strings 1-4
 * const zone = createRectangleZone({
 *   startString: 1,
 *   endString: 4,
 *   startFret: 5,
 *   endFret: 8
 * });
 */
export function createRectangleZone(params: RectangleZoneParams): HighlightZone {
  const { startString, endString, startFret, endFret, name } = params;

  // Validate parameters
  if (!Number.isInteger(startString) || !Number.isInteger(endString)) {
    throw new Error('String numbers must be integers');
  }
  if (!Number.isInteger(startFret) || !Number.isInteger(endFret)) {
    throw new Error('Fret numbers must be integers');
  }
  if (startString < 1 || startString > 6 || endString < 1 || endString > 6) {
    throw new Error('String numbers must be between 1 and 6');
  }
  if (startFret < 0 || startFret > 24 || endFret < 0 || endFret > 24) {
    throw new Error('Fret numbers must be between 0 and 24');
  }

  // Normalize order (allow reverse ranges)
  const minString = Math.min(startString, endString);
  const maxString = Math.max(startString, endString);
  const minFret = Math.min(startFret, endFret);
  const maxFret = Math.max(startFret, endFret);

  const zone = new HighlightZone(name);

  for (let string = minString; string <= maxString; string++) {
    for (let fret = minFret; fret <= maxFret; fret++) {
      zone.addNote(string, fret);
    }
  }

  return zone;
}

/**
 * Builder class for creating custom zones by adding or removing individual notes.
 * Provides a fluent interface for zone construction.
 * 
 * @example
 * const zone = new CustomZoneBuilder('My Zone')
 *   .add(1, 5)
 *   .add(2, 5)
 *   .add(3, 5)
 *   .remove(2, 5)
 *   .addRange(1, 3, 7, 7)  // Add fret 7 on strings 1-3
 *   .build();
 */
export class CustomZoneBuilder {
  private zone: HighlightZone;

  /**
   * Creates a new CustomZoneBuilder.
   * @param name - Optional name for the zone
   */
  constructor(name?: string) {
    this.zone = new HighlightZone(name);
  }

  /**
   * Adds a single note position to the zone.
   * @param string - String number (1-6)
   * @param fret - Fret number (0-24)
   * @returns This builder for chaining
   */
  public add(string: number, fret: number): CustomZoneBuilder {
    this.zone.addNote(string, fret);
    return this;
  }

  /**
   * Adds a note position using a Note object.
   * @param note - The Note object to add
   * @returns This builder for chaining
   */
  public addNote(note: Note): CustomZoneBuilder {
    this.zone.addNoteFromNote(note);
    return this;
  }

  /**
   * Removes a single note position from the zone.
   * @param string - String number (1-6)
   * @param fret - Fret number (0-24)
   * @returns This builder for chaining
   */
  public remove(string: number, fret: number): CustomZoneBuilder {
    this.zone.removeNote(string, fret);
    return this;
  }

  /**
   * Removes a note position using a Note object.
   * @param note - The Note object to remove
   * @returns This builder for chaining
   */
  public removeNote(note: Note): CustomZoneBuilder {
    this.zone.removeNoteFromNote(note);
    return this;
  }

  /**
   * Adds a rectangular range of positions to the zone.
   * @param startString - Starting string (1-6)
   * @param endString - Ending string (1-6)
   * @param startFret - Starting fret (0-24)
   * @param endFret - Ending fret (0-24)
   * @returns This builder for chaining
   */
  public addRange(
    startString: number,
    endString: number,
    startFret: number,
    endFret: number
  ): CustomZoneBuilder {
    const minString = Math.min(startString, endString);
    const maxString = Math.max(startString, endString);
    const minFret = Math.min(startFret, endFret);
    const maxFret = Math.max(startFret, endFret);

    for (let string = minString; string <= maxString; string++) {
      for (let fret = minFret; fret <= maxFret; fret++) {
        this.zone.addNote(string, fret);
      }
    }
    return this;
  }

  /**
   * Removes a rectangular range of positions from the zone.
   * @param startString - Starting string (1-6)
   * @param endString - Ending string (1-6)
   * @param startFret - Starting fret (0-24)
   * @param endFret - Ending fret (0-24)
   * @returns This builder for chaining
   */
  public removeRange(
    startString: number,
    endString: number,
    startFret: number,
    endFret: number
  ): CustomZoneBuilder {
    const minString = Math.min(startString, endString);
    const maxString = Math.max(startString, endString);
    const minFret = Math.min(startFret, endFret);
    const maxFret = Math.max(startFret, endFret);

    for (let string = minString; string <= maxString; string++) {
      for (let fret = minFret; fret <= maxFret; fret++) {
        this.zone.removeNote(string, fret);
      }
    }
    return this;
  }

  /**
   * Adds all positions from another zone to this builder.
   * @param other - The zone to merge in
   * @returns This builder for chaining
   */
  public addFromZone(other: HighlightZone): CustomZoneBuilder {
    for (const position of other.getAllNotes()) {
      this.zone.addNote(position.string, position.fret);
    }
    return this;
  }

  /**
   * Removes all positions that exist in another zone.
   * @param other - The zone containing positions to remove
   * @returns This builder for chaining
   */
  public removeFromZone(other: HighlightZone): CustomZoneBuilder {
    for (const position of other.getAllNotes()) {
      this.zone.removeNote(position.string, position.fret);
    }
    return this;
  }

  /**
   * Adds positions for all notes matching a specific pitch class.
   * @param pitchClass - The pitch class to add
   * @param fretboard - Optional fretboard to use (defaults to standard)
   * @param fretRange - Optional fret range to limit
   * @param stringRange - Optional string range to limit
   * @returns This builder for chaining
   */
  public addPitchClass(
    pitchClass: PitchClass,
    fretboard?: Fretboard,
    fretRange?: { start: number; end: number },
    stringRange?: { start: number; end: number }
  ): CustomZoneBuilder {
    const fb = fretboard || new Fretboard(DEFAULT_FRETBOARD_CONFIG);
    const notes = fb.getNotesByPitchClass(pitchClass);

    for (const note of notes) {
      // Apply fret range filter
      if (fretRange && (note.fret < fretRange.start || note.fret > fretRange.end)) {
        continue;
      }
      // Apply string range filter
      if (stringRange && (note.string < stringRange.start || note.string > stringRange.end)) {
        continue;
      }
      this.zone.addNote(note.string, note.fret);
    }
    return this;
  }

  /**
   * Clears all positions from the builder.
   * @returns This builder for chaining
   */
  public clear(): CustomZoneBuilder {
    this.zone.clear();
    return this;
  }

  /**
   * Returns the current size of the zone being built.
   */
  public size(): number {
    return this.zone.size();
  }

  /**
   * Builds and returns the final HighlightZone.
   * The builder can continue to be used after calling build().
   * @returns A clone of the built zone
   */
  public build(): HighlightZone {
    return this.zone.clone();
  }
}

/**
 * Creates a zone containing all positions of notes within a specific octave range.
 * This is useful for limiting quizzes to notes within a certain pitch range.
 * 
 * @param params - Octave range parameters
 * @returns A new HighlightZone containing notes within the octave range
 * 
 * @example
 * // Create a zone with all C4 to B4 notes (middle octave)
 * const zone = createOctaveRangeZone({
 *   rootPitchClass: 'C',
 *   startOctave: 4,
 *   octaveCount: 1
 * });
 * 
 * @example
 * // Create a zone with 2 octaves of G notes starting from G2
 * const zone = createOctaveRangeZone({
 *   rootPitchClass: 'G',
 *   startOctave: 2,
 *   octaveCount: 2,
 *   fretRange: { start: 0, end: 12 }
 * });
 */
export function createOctaveRangeZone(params: OctaveRangeParams): HighlightZone {
  const {
    rootPitchClass,
    startOctave,
    octaveCount = 1,
    fretRange,
    stringRange,
    name,
    fretboard
  } = params;

  // Validate parameters
  if (!CHROMATIC_SCALE_SHARPS.includes(rootPitchClass)) {
    throw new Error(`Invalid pitch class: ${rootPitchClass}`);
  }
  if (!Number.isInteger(startOctave) || startOctave < 0 || startOctave > 9) {
    throw new Error('Start octave must be an integer between 0 and 9');
  }
  if (!Number.isInteger(octaveCount) || octaveCount < 1) {
    throw new Error('Octave count must be a positive integer');
  }
  if (fretRange) {
    if (!Number.isInteger(fretRange.start) || !Number.isInteger(fretRange.end)) {
      throw new Error('Fret range values must be integers');
    }
    if (fretRange.start < 0 || fretRange.end > 24) {
      throw new Error('Fret range must be between 0 and 24');
    }
  }
  if (stringRange) {
    if (!Number.isInteger(stringRange.start) || !Number.isInteger(stringRange.end)) {
      throw new Error('String range values must be integers');
    }
    if (stringRange.start < 1 || stringRange.end > 6) {
      throw new Error('String range must be between 1 and 6');
    }
  }

  const zone = new HighlightZone(name);
  const fb = fretboard || new Fretboard(DEFAULT_FRETBOARD_CONFIG);

  // Calculate the MIDI number range for the octave range
  // Each octave spans 12 semitones
  const rootPitchClassIndex = getPitchClassIndex(rootPitchClass);
  const startMidi = (startOctave + 1) * 12 + rootPitchClassIndex;
  const endMidi = startMidi + (octaveCount * 12) - 1; // -1 because we want up to but not including next octave root

  // Get all notes from the fretboard and filter by MIDI range
  const allNotes = fb.getAllNotes();

  for (const note of allNotes) {
    // Check MIDI range
    if (note.midiNumber < startMidi || note.midiNumber > endMidi) {
      continue;
    }

    // Apply fret range filter
    if (fretRange && (note.fret < fretRange.start || note.fret > fretRange.end)) {
      continue;
    }

    // Apply string range filter
    if (stringRange && (note.string < stringRange.start || note.string > stringRange.end)) {
      continue;
    }

    zone.addNote(note.string, note.fret);
  }

  return zone;
}

/**
 * Creates a zone containing all occurrences of specific pitch classes on the fretboard.
 * Useful for creating zones that highlight all instances of certain notes.
 * 
 * @param pitchClasses - Array of pitch classes to include
 * @param options - Optional configuration
 * @returns A new HighlightZone containing all matching positions
 * 
 * @example
 * // Create a zone with all C and G notes
 * const zone = createPitchClassZone(['C', 'G']);
 * 
 * @example
 * // Create a zone with all notes in the C major triad (C, E, G) within frets 0-5
 * const zone = createPitchClassZone(['C', 'E', 'G'], {
 *   fretRange: { start: 0, end: 5 }
 * });
 */
export function createPitchClassZone(
  pitchClasses: PitchClass[],
  options?: {
    fretRange?: { start: number; end: number };
    stringRange?: { start: number; end: number };
    name?: string;
    fretboard?: Fretboard;
  }
): HighlightZone {
  const { fretRange, stringRange, name, fretboard } = options || {};

  // Validate pitch classes
  for (const pc of pitchClasses) {
    if (!CHROMATIC_SCALE_SHARPS.includes(pc)) {
      throw new Error(`Invalid pitch class: ${pc}`);
    }
  }

  const zone = new HighlightZone(name);
  const fb = fretboard || new Fretboard(DEFAULT_FRETBOARD_CONFIG);

  for (const pitchClass of pitchClasses) {
    const notes = fb.getNotesByPitchClass(pitchClass);

    for (const note of notes) {
      // Apply fret range filter
      if (fretRange && (note.fret < fretRange.start || note.fret > fretRange.end)) {
        continue;
      }
      // Apply string range filter
      if (stringRange && (note.string < stringRange.start || note.string > stringRange.end)) {
        continue;
      }
      zone.addNote(note.string, note.fret);
    }
  }

  return zone;
}

/**
 * Creates a zone representing a guitar position/box shape.
 * A position is typically a 4-5 fret span where the hand stays stationary.
 * 
 * @param positionNumber - The position number (1-12, representing fret positions)
 * @param fretSpan - Number of frets in the position (default: 4)
 * @param options - Optional configuration
 * @returns A new HighlightZone representing the position
 * 
 * @example
 * // Create first position (frets 0-4)
 * const zone = createPositionZone(1);
 * 
 * @example
 * // Create fifth position (frets 5-8) with only strings 1-4
 * const zone = createPositionZone(5, 4, { stringRange: { start: 1, end: 4 } });
 */
export function createPositionZone(
  positionNumber: number,
  fretSpan: number = 4,
  options?: {
    stringRange?: { start: number; end: number };
    name?: string;
  }
): HighlightZone {
  if (!Number.isInteger(positionNumber) || positionNumber < 1 || positionNumber > 24) {
    throw new Error('Position number must be an integer between 1 and 24');
  }
  if (!Number.isInteger(fretSpan) || fretSpan < 1 || fretSpan > 24) {
    throw new Error('Fret span must be a positive integer up to 24');
  }

  // Position 1 typically includes the open string (fret 0)
  // Position N starts at fret (N-1) for positions 1-12
  const startFret = positionNumber === 1 ? 0 : positionNumber;
  const endFret = Math.min(startFret + fretSpan, 24);

  const { stringRange, name } = options || {};
  const startString = stringRange?.start || 1;
  const endString = stringRange?.end || 6;

  return createRectangleZone({
    startString,
    endString,
    startFret,
    endFret,
    name: name || `Position ${positionNumber}`
  });
}

/**
 * Creates a single-string zone across a fret range.
 * Useful for linear exercises on a single string.
 * 
 * @param stringNumber - The string number (1-6)
 * @param startFret - Starting fret (default: 0)
 * @param endFret - Ending fret (default: 12)
 * @param name - Optional zone name
 * @returns A new HighlightZone for the single string
 */
export function createSingleStringZone(
  stringNumber: number,
  startFret: number = 0,
  endFret: number = 12,
  name?: string
): HighlightZone {
  if (!Number.isInteger(stringNumber) || stringNumber < 1 || stringNumber > 6) {
    throw new Error('String number must be an integer between 1 and 6');
  }

  return createRectangleZone({
    startString: stringNumber,
    endString: stringNumber,
    startFret,
    endFret,
    name: name || `String ${stringNumber}`
  });
}

/**
 * Creates a zone for a diagonal pattern across the fretboard.
 * Useful for scale patterns that move diagonally.
 * 
 * @param positions - Array of {string, fret} positions defining the diagonal
 * @param name - Optional zone name
 * @returns A new HighlightZone with the diagonal pattern
 */
export function createDiagonalZone(
  positions: NotePosition[],
  name?: string
): HighlightZone {
  const zone = new HighlightZone(name);
  
  for (const pos of positions) {
    zone.addNote(pos.string, pos.fret);
  }
  
  return zone;
}

/**
 * Shifts a zone along the fretboard by a given fret offset.
 * Notes that would go out of bounds (< 0 or > 24) are dropped.
 * 
 * @param zone - The zone to shift
 * @param fretOffset - Number of frets to shift (positive = up, negative = down)
 * @param name - Optional name for the new zone (defaults to original name + offset)
 * @returns A new HighlightZone with shifted positions
 * 
 * @example
 * // Shift a zone up 5 frets
 * const shifted = shiftZone(originalZone, 5);
 * 
 * @example
 * // Shift a zone down 3 frets
 * const shifted = shiftZone(originalZone, -3);
 */
export function shiftZone(
  zone: HighlightZone,
  fretOffset: number,
  name?: string
): HighlightZone {
  const positions = zone.getAllNotes();
  const zoneName = name || (zone.name ? `${zone.name} (+${fretOffset})` : undefined);
  const shiftedZone = new HighlightZone(zoneName);
  
  for (const pos of positions) {
    const newFret = pos.fret + fretOffset;
    // Only add if within valid fret range (0-24)
    if (newFret >= 0 && newFret <= 24) {
      shiftedZone.addNote(pos.string, newFret);
    }
  }
  
  return shiftedZone;
}

/**
 * Calculates the valid shift range for a zone.
 * Returns the minimum and maximum fret offsets that keep at least one note in bounds.
 * 
 * @param zone - The zone to analyze
 * @returns Object with minOffset and maxOffset values
 */
export function getZoneShiftRange(zone: HighlightZone): { minOffset: number; maxOffset: number } {
  const positions = zone.getAllNotes();
  
  if (positions.length === 0) {
    return { minOffset: 0, maxOffset: 0 };
  }
  
  // Find the min and max frets in the zone
  let minFret = 24;
  let maxFret = 0;
  
  for (const pos of positions) {
    minFret = Math.min(minFret, pos.fret);
    maxFret = Math.max(maxFret, pos.fret);
  }
  
  // Calculate how far we can shift
  // To keep at least one note in bounds:
  // - Minimum offset: When maxFret shifts to 0 (or beyond, losing notes)
  // - Maximum offset: When minFret shifts to 24 (or beyond, losing notes)
  const minOffset = -maxFret; // Shift down so highest fret becomes 0
  const maxOffset = 24 - minFret; // Shift up so lowest fret becomes 24
  
  return { minOffset, maxOffset };
}

/**
 * Gets a random valid shift offset for a zone.
 * The shift will keep at least one note within fret bounds.
 * 
 * @param zone - The zone to shift
 * @param maxShiftAmount - Maximum shift in either direction (optional, limits randomness)
 * @returns A random valid fret offset
 */
export function getRandomShiftOffset(
  zone: HighlightZone,
  maxShiftAmount?: number
): number {
  const { minOffset, maxOffset } = getZoneShiftRange(zone);
  
  let effectiveMin = minOffset;
  let effectiveMax = maxOffset;
  
  if (maxShiftAmount !== undefined) {
    effectiveMin = Math.max(minOffset, -maxShiftAmount);
    effectiveMax = Math.min(maxOffset, maxShiftAmount);
  }
  
  // Generate random offset within range
  const range = effectiveMax - effectiveMin;
  return effectiveMin + Math.floor(Math.random() * (range + 1));
}
