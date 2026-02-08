import { Note, CHROMATIC_SCALE_SHARPS, getPitchClassIndex } from '../music-theory/Note';
import type { PitchClass } from '../music-theory/Note';

/**
 * Represents a string tuning with pitch class and octave.
 */
export interface StringTuning {
  pitchClass: PitchClass;
  octave: number;
}

/**
 * Standard guitar tuning (EADGBE from low to high).
 * String numbers: 6 (low E) to 1 (high E)
 */
export const STANDARD_TUNING: StringTuning[] = [
  { pitchClass: 'E', octave: 4 },  // String 1 (high E)
  { pitchClass: 'B', octave: 3 },  // String 2
  { pitchClass: 'G', octave: 3 },  // String 3
  { pitchClass: 'D', octave: 3 },  // String 4
  { pitchClass: 'A', octave: 2 },  // String 5
  { pitchClass: 'E', octave: 2 },  // String 6 (low E)
];

/**
 * Drop D tuning.
 */
export const DROP_D_TUNING: StringTuning[] = [
  { pitchClass: 'E', octave: 4 },  // String 1
  { pitchClass: 'B', octave: 3 },  // String 2
  { pitchClass: 'G', octave: 3 },  // String 3
  { pitchClass: 'D', octave: 3 },  // String 4
  { pitchClass: 'A', octave: 2 },  // String 5
  { pitchClass: 'D', octave: 2 },  // String 6 (dropped to D)
];

/**
 * Open G tuning.
 */
export const OPEN_G_TUNING: StringTuning[] = [
  { pitchClass: 'D', octave: 4 },  // String 1
  { pitchClass: 'B', octave: 3 },  // String 2
  { pitchClass: 'G', octave: 3 },  // String 3
  { pitchClass: 'D', octave: 3 },  // String 4
  { pitchClass: 'G', octave: 2 },  // String 5
  { pitchClass: 'D', octave: 2 },  // String 6
];

/**
 * Configuration for creating a fretboard.
 */
export interface FretboardConfig {
  /** The tuning for each string (from string 1 to string 6) */
  tuning: StringTuning[];
  /** Number of frets on the fretboard (default: 24) */
  fretCount: number;
  /** Number of strings (default: 6) */
  stringCount: number;
}

/**
 * Default fretboard configuration for a standard 6-string guitar.
 */
export const DEFAULT_FRETBOARD_CONFIG: FretboardConfig = {
  tuning: STANDARD_TUNING,
  fretCount: 24,
  stringCount: 6,
};

/**
 * Fret marker positions for standard guitar.
 */
export const STANDARD_FRET_MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

/**
 * Double fret marker positions (octave markers).
 */
export const DOUBLE_FRET_MARKERS = [12, 24];

/**
 * Represents a guitar fretboard and generates all note positions.
 */
export class Fretboard {
  /** The configuration for this fretboard */
  public readonly config: FretboardConfig;

  /** All notes on the fretboard, indexed by position ID */
  private notesByPosition: Map<string, Note>;

  /** All notes on the fretboard, grouped by string */
  private notesByString: Map<number, Note[]>;

  /** All notes on the fretboard, grouped by pitch class */
  private notesByPitchClass: Map<PitchClass, Note[]>;

  constructor(config: Partial<FretboardConfig> = {}) {
    this.config = { ...DEFAULT_FRETBOARD_CONFIG, ...config };
    this.notesByPosition = new Map();
    this.notesByString = new Map();
    this.notesByPitchClass = new Map();
    
    // Initialize the pitch class map
    for (const pitchClass of CHROMATIC_SCALE_SHARPS) {
      this.notesByPitchClass.set(pitchClass, []);
    }
    
    this.generateAllNotes();
  }

  /**
   * Generates all notes for the fretboard based on the tuning.
   */
  private generateAllNotes(): void {
    for (let stringNum = 1; stringNum <= this.config.stringCount; stringNum++) {
      const stringNotes: Note[] = [];
      const openStringTuning = this.config.tuning[stringNum - 1];
      
      // Calculate the MIDI number for the open string
      const openStringMidi = this.calculateMidiNumber(
        openStringTuning.pitchClass,
        openStringTuning.octave
      );

      for (let fret = 0; fret <= this.config.fretCount; fret++) {
        const noteMidi = openStringMidi + fret;
        const note = Note.fromMidiNumber(noteMidi, stringNum, fret);
        
        // Store by position
        this.notesByPosition.set(note.getPositionId(), note);
        
        // Store by string
        stringNotes.push(note);
        
        // Store by pitch class
        this.notesByPitchClass.get(note.pitchClass)!.push(note);
      }
      
      this.notesByString.set(stringNum, stringNotes);
    }
  }

  /**
   * Calculates MIDI number from pitch class and octave.
   */
  private calculateMidiNumber(pitchClass: PitchClass, octave: number): number {
    const pitchClassIndex = getPitchClassIndex(pitchClass);
    return (octave + 1) * 12 + pitchClassIndex;
  }

  /**
   * Gets a note at a specific position.
   */
  public getNoteAt(string: number, fret: number): Note | undefined {
    const positionId = `s${string}f${fret}`;
    return this.notesByPosition.get(positionId);
  }

  /**
   * Gets all notes on a specific string.
   */
  public getNotesOnString(string: number): Note[] {
    return this.notesByString.get(string) || [];
  }

  /**
   * Gets all notes with a specific pitch class.
   */
  public getNotesByPitchClass(pitchClass: PitchClass): Note[] {
    return this.notesByPitchClass.get(pitchClass) || [];
  }

  /**
   * Gets all notes on the fretboard.
   */
  public getAllNotes(): Note[] {
    return Array.from(this.notesByPosition.values());
  }

  /**
   * Gets all notes within a fret range.
   */
  public getNotesInFretRange(startFret: number, endFret: number): Note[] {
    const notes: Note[] = [];
    for (let string = 1; string <= this.config.stringCount; string++) {
      const stringNotes = this.getNotesOnString(string);
      for (const note of stringNotes) {
        if (note.fret >= startFret && note.fret <= endFret) {
          notes.push(note);
        }
      }
    }
    return notes;
  }

  /**
   * Gets all notes within a string range.
   */
  public getNotesInStringRange(startString: number, endString: number): Note[] {
    const notes: Note[] = [];
    for (let string = startString; string <= endString; string++) {
      notes.push(...this.getNotesOnString(string));
    }
    return notes;
  }

  /**
   * Gets the total number of notes on the fretboard.
   */
  public getTotalNoteCount(): number {
    return this.notesByPosition.size;
  }

  /**
   * Checks if a fret should have a marker.
   */
  public hasFretMarker(fret: number): boolean {
    return STANDARD_FRET_MARKERS.includes(fret);
  }

  /**
   * Checks if a fret should have a double marker (12th, 24th).
   */
  public hasDoubleFretMarker(fret: number): boolean {
    return DOUBLE_FRET_MARKERS.includes(fret);
  }

  /**
   * Gets the open string note for a given string.
   */
  public getOpenString(string: number): Note | undefined {
    return this.getNoteAt(string, 0);
  }

  /**
   * Gets all open string notes.
   */
  public getOpenStrings(): Note[] {
    const openStrings: Note[] = [];
    for (let string = 1; string <= this.config.stringCount; string++) {
      const note = this.getOpenString(string);
      if (note) {
        openStrings.push(note);
      }
    }
    return openStrings;
  }

  /**
   * Finds all positions of a given pitch class within a fret range.
   */
  public findPitchClassInRange(
    pitchClass: PitchClass,
    startFret: number,
    endFret: number
  ): Note[] {
    const notes = this.getNotesByPitchClass(pitchClass);
    return notes.filter(note => note.fret >= startFret && note.fret <= endFret);
  }

  /**
   * Gets a rectangular region of notes.
   */
  public getRegion(
    startString: number,
    endString: number,
    startFret: number,
    endFret: number
  ): Note[] {
    const notes: Note[] = [];
    for (let string = startString; string <= endString; string++) {
      const stringNotes = this.getNotesOnString(string);
      for (const note of stringNotes) {
        if (note.fret >= startFret && note.fret <= endFret) {
          notes.push(note);
        }
      }
    }
    return notes;
  }

  /**
   * Creates a string representation of the fretboard for debugging.
   */
  public toString(): string {
    const lines: string[] = [];
    lines.push(`Fretboard: ${this.config.stringCount} strings, ${this.config.fretCount} frets`);
    lines.push(`Tuning: ${this.config.tuning.map((t, i) => 
      `String ${i + 1}: ${t.pitchClass}${t.octave}`
    ).join(', ')}`);
    lines.push(`Total notes: ${this.getTotalNoteCount()}`);
    return lines.join('\n');
  }

  /**
   * Prints the first N frets to console for manual testing.
   */
  public printFrets(fretCount: number = 5): void {
    console.log('\nFretboard Notes (first ' + fretCount + ' frets):');
    console.log('═'.repeat(60));
    
    // Print fret numbers header
    let header = 'String │ ';
    for (let fret = 0; fret <= fretCount; fret++) {
      header += `${fret.toString().padStart(3)} │ `;
    }
    console.log(header);
    console.log('─'.repeat(60));
    
    // Print each string
    for (let string = 1; string <= this.config.stringCount; string++) {
      let row = `  ${string}    │ `;
      for (let fret = 0; fret <= fretCount; fret++) {
        const note = this.getNoteAt(string, fret);
        if (note) {
          row += `${note.pitchClass.padStart(2)}${note.octave} │ `;
        }
      }
      console.log(row);
    }
    console.log('═'.repeat(60));
  }
}
