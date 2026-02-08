/**
 * Represents the 12 pitch classes in Western music.
 * Using sharps as the canonical representation internally.
 */
export type PitchClass = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

/**
 * Pitch class with flat notation for display purposes.
 */
export type FlatPitchClass = 'C' | 'Db' | 'D' | 'Eb' | 'E' | 'F' | 'Gb' | 'G' | 'Ab' | 'A' | 'Bb' | 'B';

/**
 * All possible note representations (sharps and flats).
 */
export type NoteName = PitchClass | FlatPitchClass;

/**
 * The chromatic scale using sharps.
 */
export const CHROMATIC_SCALE_SHARPS: PitchClass[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

/**
 * The chromatic scale using flats.
 */
export const CHROMATIC_SCALE_FLATS: FlatPitchClass[] = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'
];

/**
 * Mapping from sharp notes to their flat enharmonic equivalents.
 */
export const ENHARMONIC_MAP: Record<PitchClass, FlatPitchClass> = {
  'C': 'C',
  'C#': 'Db',
  'D': 'D',
  'D#': 'Eb',
  'E': 'E',
  'F': 'F',
  'F#': 'Gb',
  'G': 'G',
  'G#': 'Ab',
  'A': 'A',
  'A#': 'Bb',
  'B': 'B'
};

/**
 * Mapping from flat notes to their sharp enharmonic equivalents.
 */
export const FLAT_TO_SHARP_MAP: Record<FlatPitchClass, PitchClass> = {
  'C': 'C',
  'Db': 'C#',
  'D': 'D',
  'Eb': 'D#',
  'E': 'E',
  'F': 'F',
  'Gb': 'F#',
  'G': 'G',
  'Ab': 'G#',
  'A': 'A',
  'Bb': 'A#',
  'B': 'B'
};

/**
 * Configuration for how notes should be displayed.
 */
export type NoteDisplayPreference = 'sharps' | 'flats' | 'both';

/**
 * Represents a musical note with its position on the fretboard.
 */
export class Note {
  /**
   * The pitch class of the note (e.g., 'C', 'C#', 'D').
   * Internally stored as sharp notation.
   */
  public readonly pitchClass: PitchClass;

  /**
   * The octave number (scientific pitch notation, e.g., C4 = middle C).
   */
  public readonly octave: number;

  /**
   * The string number (1-6, where 1 is the high E string).
   */
  public readonly string: number;

  /**
   * The fret number (0-24, where 0 is the open string).
   */
  public readonly fret: number;

  /**
   * MIDI note number (0-127, where middle C is 60).
   */
  public readonly midiNumber: number;

  constructor(pitchClass: PitchClass, octave: number, string: number, fret: number) {
    this.pitchClass = pitchClass;
    this.octave = octave;
    this.string = string;
    this.fret = fret;
    this.midiNumber = this.calculateMidiNumber();
  }

  /**
   * Calculates the MIDI note number for this note.
   */
  private calculateMidiNumber(): number {
    const pitchClassIndex = CHROMATIC_SCALE_SHARPS.indexOf(this.pitchClass);
    // MIDI note number: (octave + 1) * 12 + pitch class index
    // C4 (middle C) = 60
    return (this.octave + 1) * 12 + pitchClassIndex;
  }

  /**
   * Gets the note name in sharp notation.
   */
  public getSharpName(): PitchClass {
    return this.pitchClass;
  }

  /**
   * Gets the note name in flat notation.
   */
  public getFlatName(): FlatPitchClass {
    return ENHARMONIC_MAP[this.pitchClass];
  }

  /**
   * Gets the full note name with octave (e.g., "C#4").
   */
  public getFullName(preference: NoteDisplayPreference = 'sharps'): string {
    const name = preference === 'flats' ? this.getFlatName() : this.getSharpName();
    return `${name}${this.octave}`;
  }

  /**
   * Returns the display name based on preference.
   */
  public getDisplayName(preference: NoteDisplayPreference = 'sharps'): string {
    if (preference === 'flats') {
      return this.getFlatName();
    }
    return this.getSharpName();
  }

  /**
   * Checks if this note is enharmonically equivalent to another note name.
   */
  public isEnharmonicWith(noteName: NoteName): boolean {
    // Normalize to sharp notation for comparison
    const normalizedInput = this.normalizeToSharp(noteName);
    return this.pitchClass === normalizedInput;
  }

  /**
   * Normalizes any note name to sharp notation.
   */
  private normalizeToSharp(noteName: NoteName): PitchClass {
    if (CHROMATIC_SCALE_SHARPS.includes(noteName as PitchClass)) {
      return noteName as PitchClass;
    }
    return FLAT_TO_SHARP_MAP[noteName as FlatPitchClass];
  }

  /**
   * Creates a unique identifier for this note position on the fretboard.
   */
  public getPositionId(): string {
    return `s${this.string}f${this.fret}`;
  }

  /**
   * Checks if this note is at the same position as another note.
   */
  public isSamePosition(other: Note): boolean {
    return this.string === other.string && this.fret === other.fret;
  }

  /**
   * Checks if this note has the same pitch as another note (same MIDI number).
   */
  public isSamePitch(other: Note): boolean {
    return this.midiNumber === other.midiNumber;
  }

  /**
   * Checks if this note has the same pitch class (ignoring octave).
   */
  public isSamePitchClass(other: Note): boolean {
    return this.pitchClass === other.pitchClass;
  }

  /**
   * Returns a string representation of the note for debugging.
   */
  public toString(): string {
    return `Note(${this.getFullName()}, string: ${this.string}, fret: ${this.fret})`;
  }

  /**
   * Creates a Note from a MIDI number and fretboard position.
   */
  public static fromMidiNumber(midiNumber: number, string: number, fret: number): Note {
    const octave = Math.floor(midiNumber / 12) - 1;
    const pitchClassIndex = midiNumber % 12;
    const pitchClass = CHROMATIC_SCALE_SHARPS[pitchClassIndex];
    return new Note(pitchClass, octave, string, fret);
  }

  /**
   * Calculates the pitch class at a given number of semitones from this note.
   */
  public transposeBy(semitones: number): { pitchClass: PitchClass; octave: number } {
    const newMidi = this.midiNumber + semitones;
    const newOctave = Math.floor(newMidi / 12) - 1;
    const newPitchClassIndex = ((newMidi % 12) + 12) % 12; // Handle negative
    return {
      pitchClass: CHROMATIC_SCALE_SHARPS[newPitchClassIndex],
      octave: newOctave
    };
  }
}

/**
 * Utility function to get the pitch class index (0-11).
 */
export function getPitchClassIndex(pitchClass: PitchClass): number {
  return CHROMATIC_SCALE_SHARPS.indexOf(pitchClass);
}

/**
 * Utility function to get a pitch class from its index.
 */
export function getPitchClassFromIndex(index: number): PitchClass {
  const normalizedIndex = ((index % 12) + 12) % 12;
  return CHROMATIC_SCALE_SHARPS[normalizedIndex];
}
