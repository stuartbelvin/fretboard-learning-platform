import { Note, CHROMATIC_SCALE_SHARPS } from '../music-theory/Note';
import type { PitchClass, NoteDisplayPreference } from '../music-theory/Note';
import { HighlightZone } from '../zones/HighlightZone';
import { Fretboard } from '../instruments/Fretboard';
import type { QuizQuestion } from './NoteQuizState';

/**
 * Pitch class filter options for question generation.
 * - 'natural': Only natural notes (no sharps/flats)
 * - 'sharps': All notes displayed as sharps
 * - 'flats': All notes displayed as flats
 * - 'both': All notes, randomly displayed as sharp or flat
 * - 'custom': User-specified subset of pitch classes
 */
export type PitchClassFilter = 'natural' | 'sharps' | 'flats' | 'both' | 'custom';

/**
 * Natural notes (no sharps or flats).
 */
export const NATURAL_NOTES: PitchClass[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/**
 * Accidental notes (sharps/flats).
 */
export const ACCIDENTAL_NOTES: PitchClass[] = ['C#', 'D#', 'F#', 'G#', 'A#'];

/**
 * Configuration for the question generator.
 */
export interface QuestionGeneratorConfig {
  /**
   * How to filter/display pitch classes in questions.
   * Default: 'sharps'
   */
  pitchClassFilter: PitchClassFilter;

  /**
   * When pitchClassFilter is 'custom', this specifies which pitch classes to include.
   * Must be a non-empty array of valid PitchClass values.
   */
  customPitchClasses?: PitchClass[];

  /**
   * Display preference for note names in question text.
   * Default: 'sharps'
   */
  displayPreference: NoteDisplayPreference;

  /**
   * Whether to avoid repeating the same pitch class consecutively.
   * Default: true
   */
  avoidConsecutiveRepeats: boolean;

  /**
   * Maximum attempts to find a non-repeating note before giving up.
   * Default: 10
   */
  maxRetries: number;
}

/**
 * Default question generator configuration.
 */
export const DEFAULT_GENERATOR_CONFIG: QuestionGeneratorConfig = {
  pitchClassFilter: 'sharps',
  displayPreference: 'sharps',
  avoidConsecutiveRepeats: true,
  maxRetries: 10
};

/**
 * Result of question generation attempt.
 */
export interface GenerationResult {
  /** Whether generation was successful */
  success: boolean;
  /** The generated question (if successful) */
  question?: QuizQuestion;
  /** Error message (if unsuccessful) */
  error?: string;
}

/**
 * NoteQuestionGenerator creates quiz questions by selecting random notes
 * from a highlight zone, filtered by user preferences.
 */
export class NoteQuestionGenerator {
  private config: QuestionGeneratorConfig;
  private fretboard: Fretboard;
  private lastPitchClass: PitchClass | null = null;
  private questionNumber: number = 0;

  constructor(fretboard: Fretboard, config: Partial<QuestionGeneratorConfig> = {}) {
    this.fretboard = fretboard;
    this.config = { ...DEFAULT_GENERATOR_CONFIG, ...config };
  }

  /**
   * Updates the generator configuration.
   * @param config Partial configuration to merge
   */
  public updateConfig(config: Partial<QuestionGeneratorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Gets the current configuration.
   */
  public getConfig(): Readonly<QuestionGeneratorConfig> {
    return { ...this.config };
  }

  /**
   * Resets the generator state (question number, last pitch class).
   */
  public reset(): void {
    this.lastPitchClass = null;
    this.questionNumber = 0;
  }

  /**
   * Gets the set of allowed pitch classes based on current configuration.
   */
  public getAllowedPitchClasses(): Set<PitchClass> {
    switch (this.config.pitchClassFilter) {
      case 'natural':
        return new Set(NATURAL_NOTES);
      
      case 'sharps':
      case 'flats':
      case 'both':
        return new Set(CHROMATIC_SCALE_SHARPS);
      
      case 'custom':
        if (!this.config.customPitchClasses || this.config.customPitchClasses.length === 0) {
          // Fall back to all pitch classes if custom is empty
          return new Set(CHROMATIC_SCALE_SHARPS);
        }
        return new Set(this.config.customPitchClasses);
      
      default:
        return new Set(CHROMATIC_SCALE_SHARPS);
    }
  }

  /**
   * Gets candidate notes from the zone that match the allowed pitch classes.
   * @param zone The highlight zone to get candidates from
   * @returns Array of notes from the zone that have allowed pitch classes
   */
  public getCandidateNotes(zone: HighlightZone): Note[] {
    const allowedPitchClasses = this.getAllowedPitchClasses();
    const candidates: Note[] = [];
    const positions = zone.getAllNotes();

    for (const position of positions) {
      const note = this.fretboard.getNoteAt(position.string, position.fret);
      if (note && allowedPitchClasses.has(note.pitchClass)) {
        candidates.push(note);
      }
    }

    return candidates;
  }

  /**
   * Gets unique pitch classes from candidate notes.
   * @param candidates Array of candidate notes
   * @returns Array of unique pitch classes present in candidates
   */
  public getUniquePitchClasses(candidates: Note[]): PitchClass[] {
    const pitchClasses = new Set<PitchClass>();
    for (const note of candidates) {
      pitchClasses.add(note.pitchClass);
    }
    return Array.from(pitchClasses);
  }

  /**
   * Selects a random pitch class from available options, avoiding repeats if configured.
   * @param availablePitchClasses Array of pitch classes to choose from
   * @returns Selected pitch class or null if none available
   */
  public selectRandomPitchClass(availablePitchClasses: PitchClass[]): PitchClass | null {
    if (availablePitchClasses.length === 0) {
      return null;
    }

    // If only one option, must use it regardless of repeat avoidance
    if (availablePitchClasses.length === 1) {
      return availablePitchClasses[0];
    }

    // Try to avoid consecutive repeats
    if (this.config.avoidConsecutiveRepeats && this.lastPitchClass !== null) {
      const nonRepeating = availablePitchClasses.filter(pc => pc !== this.lastPitchClass);
      
      if (nonRepeating.length > 0) {
        const index = Math.floor(Math.random() * nonRepeating.length);
        return nonRepeating[index];
      }
    }

    // Random selection from all available
    const index = Math.floor(Math.random() * availablePitchClasses.length);
    return availablePitchClasses[index];
  }

  /**
   * Selects a random note with the given pitch class from candidates.
   * @param candidates Array of candidate notes
   * @param pitchClass The pitch class to filter by
   * @returns A random note with the given pitch class, or null if none found
   */
  public selectRandomNoteWithPitchClass(candidates: Note[], pitchClass: PitchClass): Note | null {
    const matching = candidates.filter(n => n.pitchClass === pitchClass);
    if (matching.length === 0) {
      return null;
    }
    const index = Math.floor(Math.random() * matching.length);
    return matching[index];
  }

  /**
   * Formats the question text based on configuration.
   * @param pitchClass The target pitch class
   * @returns Formatted question text
   */
  public formatQuestionText(pitchClass: PitchClass): string {
    const displayName = this.getDisplayName(pitchClass);
    return `Find ${displayName}`;
  }

  /**
   * Gets the display name for a pitch class based on configuration.
   * @param pitchClass The pitch class to display
   * @returns The formatted display name
   */
  public getDisplayName(pitchClass: PitchClass): string {
    // Natural notes are always displayed the same
    if (NATURAL_NOTES.includes(pitchClass)) {
      return pitchClass;
    }

    // For accidentals, use the display preference
    switch (this.config.displayPreference) {
      case 'flats':
        return this.toFlatNotation(pitchClass);
      
      case 'both':
        // Randomly choose sharp or flat
        return Math.random() < 0.5 ? pitchClass : this.toFlatNotation(pitchClass);
      
      case 'sharps':
      default:
        return pitchClass;
    }
  }

  /**
   * Converts a sharp pitch class to flat notation.
   */
  private toFlatNotation(pitchClass: PitchClass): string {
    const flatMap: Record<string, string> = {
      'C#': 'Db',
      'D#': 'Eb',
      'F#': 'Gb',
      'G#': 'Ab',
      'A#': 'Bb'
    };
    return flatMap[pitchClass] || pitchClass;
  }

  /**
   * Generates the next question from the given zone.
   * @param zone The highlight zone to generate a question from
   * @returns GenerationResult indicating success/failure and the question if successful
   */
  public generateQuestion(zone: HighlightZone): GenerationResult {
    // Validate zone
    if (zone.isEmpty()) {
      return {
        success: false,
        error: 'Cannot generate question from empty zone'
      };
    }

    // Get candidate notes from zone that match allowed pitch classes
    const candidates = this.getCandidateNotes(zone);
    
    if (candidates.length === 0) {
      return {
        success: false,
        error: 'No notes in zone match the allowed pitch classes'
      };
    }

    // Get unique pitch classes from candidates
    const uniquePitchClasses = this.getUniquePitchClasses(candidates);

    // Select a pitch class (with repeat avoidance)
    const selectedPitchClass = this.selectRandomPitchClass(uniquePitchClasses);
    
    if (!selectedPitchClass) {
      return {
        success: false,
        error: 'Failed to select a pitch class'
      };
    }

    // Select a random note with this pitch class for the target
    const targetNote = this.selectRandomNoteWithPitchClass(candidates, selectedPitchClass);
    
    if (!targetNote) {
      return {
        success: false,
        error: 'Failed to select target note'
      };
    }

    // Update state
    this.lastPitchClass = selectedPitchClass;
    this.questionNumber++;

    // Create the question
    const question: QuizQuestion = {
      targetNote: targetNote,
      targetPitchClass: selectedPitchClass,
      questionNumber: this.questionNumber,
      questionText: this.formatQuestionText(selectedPitchClass)
    };

    return {
      success: true,
      question
    };
  }

  /**
   * Generates a question with a specific pitch class (for testing/debugging).
   * @param zone The highlight zone
   * @param pitchClass The specific pitch class to use
   * @returns GenerationResult
   */
  public generateQuestionWithPitchClass(zone: HighlightZone, pitchClass: PitchClass): GenerationResult {
    // Validate zone
    if (zone.isEmpty()) {
      return {
        success: false,
        error: 'Cannot generate question from empty zone'
      };
    }

    // Get candidate notes
    const candidates = this.getCandidateNotes(zone);
    const matching = candidates.filter(n => n.pitchClass === pitchClass);
    
    if (matching.length === 0) {
      return {
        success: false,
        error: `No notes with pitch class ${pitchClass} found in zone`
      };
    }

    // Select a random matching note
    const index = Math.floor(Math.random() * matching.length);
    const targetNote = matching[index];

    // Update state
    this.lastPitchClass = pitchClass;
    this.questionNumber++;

    const question: QuizQuestion = {
      targetNote: targetNote,
      targetPitchClass: pitchClass,
      questionNumber: this.questionNumber,
      questionText: this.formatQuestionText(pitchClass)
    };

    return {
      success: true,
      question
    };
  }

  /**
   * Gets statistics about what notes are available in a zone.
   * Useful for UI to show users what notes will be included.
   * @param zone The highlight zone to analyze
   * @returns Object with available pitch classes and total candidate count
   */
  public getZoneStatistics(zone: HighlightZone): {
    totalPositions: number;
    candidateCount: number;
    availablePitchClasses: PitchClass[];
    excludedCount: number;
  } {
    const totalPositions = zone.size();
    const candidates = this.getCandidateNotes(zone);
    const uniquePitchClasses = this.getUniquePitchClasses(candidates);
    
    return {
      totalPositions,
      candidateCount: candidates.length,
      availablePitchClasses: uniquePitchClasses.sort(),
      excludedCount: totalPositions - candidates.length
    };
  }
}
