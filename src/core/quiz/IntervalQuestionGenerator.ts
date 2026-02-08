import { Note, getPitchClassIndex, getPitchClassFromIndex } from '../music-theory/Note';
import type { PitchClass, NoteDisplayPreference } from '../music-theory/Note';
import { Interval, COMMON_INTERVALS, ALL_INTERVALS } from '../music-theory/Interval';
import type { IntervalShortName } from '../music-theory/Interval';
import { HighlightZone } from '../zones/HighlightZone';
import { Fretboard } from '../instruments/Fretboard';

/**
 * Represents a single interval quiz question.
 */
export interface IntervalQuizQuestion {
  /** The root note from which the interval is calculated */
  rootNote: Note;
  /** The pitch class of the root note */
  rootPitchClass: PitchClass;
  /** The target interval to find */
  interval: Interval;
  /** All valid target notes on the fretboard */
  allTargetNotes: Note[];
  /** Target notes filtered to those within the answer zone */
  targetNotesInZone: Note[];
  /** The target pitch class (result of root + interval) */
  targetPitchClass: PitchClass;
  /** Question number (1-based) */
  questionNumber: number;
  /** Formatted question text */
  questionText: string;
  /** Whether the root note is inside the answer zone */
  rootInZone: boolean;
}

/**
 * Configuration for the interval question generator.
 */
export interface IntervalGeneratorConfig {
  /**
   * Which intervals to include in questions.
   * Can be an array of specific interval short names (e.g., ['m3', 'P5', 'M7'])
   * or 'common' for standard intervals, or 'all' for all valid intervals.
   * Default: 'common'
   */
  intervals: 'common' | 'all' | IntervalShortName[];

  /**
   * Display preference for note names in question text.
   * Default: 'sharps'
   */
  displayPreference: NoteDisplayPreference;

  /**
   * Whether to avoid repeating the same interval consecutively.
   * Default: true
   */
  avoidConsecutiveRepeats: boolean;

  /**
   * Maximum attempts to find a non-repeating interval before giving up.
   * Default: 10
   */
  maxRetries: number;

  /**
   * Whether to allow compound intervals (intervals > octave).
   * Default: false
   */
  allowCompoundIntervals: boolean;

  /**
   * For compound intervals, whether the root must be inside the answer zone.
   * When true, root can be outside zone only for compound intervals.
   * When false, root must always be in zone.
   * Default: true (per PRD INT-005)
   */
  allowRootOutsideZoneForCompound: boolean;
}

/**
 * Default interval generator configuration.
 */
export const DEFAULT_INTERVAL_GENERATOR_CONFIG: IntervalGeneratorConfig = {
  intervals: 'common',
  displayPreference: 'sharps',
  avoidConsecutiveRepeats: true,
  maxRetries: 10,
  allowCompoundIntervals: false,
  allowRootOutsideZoneForCompound: true
};

/**
 * Result of interval question generation attempt.
 */
export interface IntervalGenerationResult {
  /** Whether generation was successful */
  success: boolean;
  /** The generated question (if successful) */
  question?: IntervalQuizQuestion;
  /** Error message (if unsuccessful) */
  error?: string;
}

/**
 * IntervalQuestionGenerator creates quiz questions for interval identification.
 * Users must find the specified interval relative to a highlighted root note.
 */
export class IntervalQuestionGenerator {
  private config: IntervalGeneratorConfig;
  private fretboard: Fretboard;
  private lastInterval: Interval | null = null;
  private lastRootPitchClass: PitchClass | null = null;
  private questionNumber: number = 0;

  constructor(fretboard: Fretboard, config: Partial<IntervalGeneratorConfig> = {}) {
    this.fretboard = fretboard;
    this.config = { ...DEFAULT_INTERVAL_GENERATOR_CONFIG, ...config };
  }

  /**
   * Updates the generator configuration.
   * @param config Partial configuration to merge
   */
  public updateConfig(config: Partial<IntervalGeneratorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Gets the current configuration.
   */
  public getConfig(): Readonly<IntervalGeneratorConfig> {
    return { ...this.config };
  }

  /**
   * Resets the generator state (question number, last interval/root).
   */
  public reset(): void {
    this.lastInterval = null;
    this.lastRootPitchClass = null;
    this.questionNumber = 0;
  }

  /**
   * Gets the array of allowed intervals based on current configuration.
   */
  public getAllowedIntervals(): Interval[] {
    const { intervals, allowCompoundIntervals } = this.config;

    let availableIntervals: Interval[];

    if (intervals === 'common') {
      availableIntervals = [...COMMON_INTERVALS];
    } else if (intervals === 'all') {
      availableIntervals = [...ALL_INTERVALS];
    } else {
      // Custom array of interval short names
      availableIntervals = intervals.map(shortName => Interval.fromShortName(shortName));
    }

    // Filter out compound intervals if not allowed
    if (!allowCompoundIntervals) {
      availableIntervals = availableIntervals.filter(i => !i.isCompound);
    }

    return availableIntervals;
  }

  /**
   * Calculates the target pitch class for a given root and interval.
   * @param rootPitchClass The root pitch class
   * @param interval The interval to apply
   * @returns The target pitch class
   */
  public calculateTargetPitchClass(rootPitchClass: PitchClass, interval: Interval): PitchClass {
    const rootIndex = getPitchClassIndex(rootPitchClass);
    const targetIndex = (rootIndex + interval.semitones) % 12;
    return getPitchClassFromIndex(targetIndex);
  }

  /**
   * Gets all notes on the fretboard with the target pitch class.
   * @param targetPitchClass The pitch class to find
   * @returns Array of notes with the target pitch class
   */
  public getAllTargetNotesOnFretboard(targetPitchClass: PitchClass): Note[] {
    return this.fretboard.getNotesByPitchClass(targetPitchClass);
  }

  /**
   * Filters target notes to those within the answer zone.
   * @param targetNotes All target notes
   * @param zone The answer zone
   * @returns Notes that are within the zone
   */
  public filterTargetNotesToZone(targetNotes: Note[], zone: HighlightZone): Note[] {
    return targetNotes.filter(note => zone.containsNote(note.string, note.fret));
  }

  /**
   * Gets candidate root notes from the zone.
   * @param zone The highlight zone
   * @returns Array of notes from the zone that can serve as roots
   */
  public getCandidateRootNotes(zone: HighlightZone): Note[] {
    const positions = zone.getAllNotes();
    const notes: Note[] = [];

    for (const position of positions) {
      const note = this.fretboard.getNoteAt(position.string, position.fret);
      if (note) {
        notes.push(note);
      }
    }

    return notes;
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
   * Selects a random interval from available options, avoiding repeats if configured.
   * @param availableIntervals Array of intervals to choose from
   * @returns Selected interval or null if none available
   */
  public selectRandomInterval(availableIntervals: Interval[]): Interval | null {
    if (availableIntervals.length === 0) {
      return null;
    }

    // If only one option, must use it regardless of repeat avoidance
    if (availableIntervals.length === 1) {
      return availableIntervals[0];
    }

    // Try to avoid consecutive repeats
    if (this.config.avoidConsecutiveRepeats && this.lastInterval !== null) {
      const nonRepeating = availableIntervals.filter(i => !i.equals(this.lastInterval!));
      
      if (nonRepeating.length > 0) {
        const index = Math.floor(Math.random() * nonRepeating.length);
        return nonRepeating[index];
      }
    }

    // Random selection from all available
    const index = Math.floor(Math.random() * availableIntervals.length);
    return availableIntervals[index];
  }

  /**
   * Selects a random root note, avoiding repeating the same pitch class if configured.
   * @param candidates Array of candidate root notes
   * @returns Selected note or null if none available
   */
  public selectRandomRootNote(candidates: Note[]): Note | null {
    if (candidates.length === 0) {
      return null;
    }

    const uniquePitchClasses = this.getUniquePitchClasses(candidates);

    // If only one pitch class, must use it
    if (uniquePitchClasses.length === 1) {
      const index = Math.floor(Math.random() * candidates.length);
      return candidates[index];
    }

    // Try to avoid consecutive repeats of pitch class
    if (this.config.avoidConsecutiveRepeats && this.lastRootPitchClass !== null) {
      const nonRepeatingCandidates = candidates.filter(n => n.pitchClass !== this.lastRootPitchClass);
      
      if (nonRepeatingCandidates.length > 0) {
        const index = Math.floor(Math.random() * nonRepeatingCandidates.length);
        return nonRepeatingCandidates[index];
      }
    }

    // Random selection from all candidates
    const index = Math.floor(Math.random() * candidates.length);
    return candidates[index];
  }

  /**
   * Formats the question text based on configuration.
   * Format: "Find the [spelled interval] of [root note]"
   * @param interval The target interval
   * @param rootPitchClass The root pitch class
   * @returns Formatted question text
   */
  public formatQuestionText(interval: Interval, rootPitchClass: PitchClass): string {
    const intervalName = interval.getFullName();
    const rootDisplay = this.getDisplayName(rootPitchClass);
    return `Find the ${intervalName} of ${rootDisplay}`;
  }

  /**
   * Gets the display name for a pitch class based on configuration.
   * @param pitchClass The pitch class to display
   * @returns The formatted display name
   */
  public getDisplayName(pitchClass: PitchClass): string {
    // Natural notes are always displayed the same
    const naturalNotes: PitchClass[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    if (naturalNotes.includes(pitchClass)) {
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
   * Checks if a root/interval combination is valid for the zone.
   * For simple intervals: root must be in zone
   * For compound intervals (if allowed): root can be outside zone if config permits
   * @param rootNote The root note
   * @param interval The interval
   * @param zone The answer zone
   * @param targetNotesInZone Target notes within the zone
   * @returns Whether this combination is valid
   */
  public isValidCombination(
    rootNote: Note,
    interval: Interval,
    zone: HighlightZone,
    targetNotesInZone: Note[]
  ): boolean {
    const rootInZone = zone.containsNote(rootNote.string, rootNote.fret);
    
    // Must have at least one target note in zone
    if (targetNotesInZone.length === 0) {
      return false;
    }

    // For simple intervals, root must be in zone
    if (!interval.isCompound) {
      return rootInZone;
    }

    // For compound intervals, check config
    if (this.config.allowRootOutsideZoneForCompound) {
      return true; // Root can be anywhere
    }

    return rootInZone;
  }

  /**
   * Generates the next interval question from the given zone.
   * @param zone The highlight zone (both root notes and answer area)
   * @returns IntervalGenerationResult indicating success/failure and the question if successful
   */
  public generateQuestion(zone: HighlightZone): IntervalGenerationResult {
    // Validate zone
    if (zone.isEmpty()) {
      return {
        success: false,
        error: 'Cannot generate question from empty zone'
      };
    }

    // Get allowed intervals
    const allowedIntervals = this.getAllowedIntervals();
    if (allowedIntervals.length === 0) {
      return {
        success: false,
        error: 'No intervals configured for question generation'
      };
    }

    // Get candidate root notes from zone
    const candidateRoots = this.getCandidateRootNotes(zone);
    if (candidateRoots.length === 0) {
      return {
        success: false,
        error: 'No valid root notes found in zone'
      };
    }

    // Try to find a valid combination (root + interval with targets in zone)
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      // Select interval
      const selectedInterval = this.selectRandomInterval(allowedIntervals);
      if (!selectedInterval) {
        continue;
      }

      // Select root note
      const rootNote = this.selectRandomRootNote(candidateRoots);
      if (!rootNote) {
        continue;
      }

      // Calculate target pitch class
      const targetPitchClass = this.calculateTargetPitchClass(rootNote.pitchClass, selectedInterval);

      // Get all target notes on fretboard
      const allTargetNotes = this.getAllTargetNotesOnFretboard(targetPitchClass);

      // Filter to notes in zone
      const targetNotesInZone = this.filterTargetNotesToZone(allTargetNotes, zone);

      // Check if this combination is valid
      const rootInZone = zone.containsNote(rootNote.string, rootNote.fret);
      if (this.isValidCombination(rootNote, selectedInterval, zone, targetNotesInZone)) {
        // Update state
        this.lastInterval = selectedInterval;
        this.lastRootPitchClass = rootNote.pitchClass;
        this.questionNumber++;

        // Create the question
        const question: IntervalQuizQuestion = {
          rootNote,
          rootPitchClass: rootNote.pitchClass,
          interval: selectedInterval,
          allTargetNotes,
          targetNotesInZone,
          targetPitchClass,
          questionNumber: this.questionNumber,
          questionText: this.formatQuestionText(selectedInterval, rootNote.pitchClass),
          rootInZone
        };

        return {
          success: true,
          question
        };
      }
    }

    return {
      success: false,
      error: 'Failed to generate valid question after maximum retries'
    };
  }

  /**
   * Generates a question with specific root pitch class and interval.
   * Useful for testing and debugging.
   * @param zone The highlight zone
   * @param rootPitchClass The specific root pitch class
   * @param interval The specific interval
   * @returns IntervalGenerationResult
   */
  public generateQuestionWithParams(
    zone: HighlightZone,
    rootPitchClass: PitchClass,
    interval: Interval
  ): IntervalGenerationResult {
    // Validate zone
    if (zone.isEmpty()) {
      return {
        success: false,
        error: 'Cannot generate question from empty zone'
      };
    }

    // Find a root note with the specified pitch class in the zone
    const candidateRoots = this.getCandidateRootNotes(zone);
    const matchingRoots = candidateRoots.filter(n => n.pitchClass === rootPitchClass);

    if (matchingRoots.length === 0) {
      return {
        success: false,
        error: `No notes with pitch class ${rootPitchClass} found in zone`
      };
    }

    // Select a random matching root
    const index = Math.floor(Math.random() * matchingRoots.length);
    const rootNote = matchingRoots[index];

    // Calculate target pitch class
    const targetPitchClass = this.calculateTargetPitchClass(rootPitchClass, interval);

    // Get all target notes on fretboard
    const allTargetNotes = this.getAllTargetNotesOnFretboard(targetPitchClass);

    // Filter to notes in zone
    const targetNotesInZone = this.filterTargetNotesToZone(allTargetNotes, zone);

    const rootInZone = zone.containsNote(rootNote.string, rootNote.fret);

    if (!this.isValidCombination(rootNote, interval, zone, targetNotesInZone)) {
      return {
        success: false,
        error: 'No valid target notes in zone for this root/interval combination'
      };
    }

    // Update state
    this.lastInterval = interval;
    this.lastRootPitchClass = rootPitchClass;
    this.questionNumber++;

    const question: IntervalQuizQuestion = {
      rootNote,
      rootPitchClass,
      interval,
      allTargetNotes,
      targetNotesInZone,
      targetPitchClass,
      questionNumber: this.questionNumber,
      questionText: this.formatQuestionText(interval, rootPitchClass),
      rootInZone
    };

    return {
      success: true,
      question
    };
  }

  /**
   * Gets statistics about what intervals and roots are available in a zone.
   * @param zone The highlight zone to analyze
   * @returns Object with available intervals, roots, and combinations
   */
  public getZoneStatistics(zone: HighlightZone): {
    totalPositions: number;
    availableRootPitchClasses: PitchClass[];
    allowedIntervals: IntervalShortName[];
    validCombinations: Array<{ root: PitchClass; interval: IntervalShortName; targetCount: number }>;
  } {
    const totalPositions = zone.size();
    const candidateRoots = this.getCandidateRootNotes(zone);
    const availableRootPitchClasses = this.getUniquePitchClasses(candidateRoots).sort();
    const allowedIntervals = this.getAllowedIntervals().map(i => i.getShortName());

    // Calculate valid combinations
    const validCombinations: Array<{ root: PitchClass; interval: IntervalShortName; targetCount: number }> = [];

    for (const rootPitchClass of availableRootPitchClasses) {
      const rootNote = candidateRoots.find(n => n.pitchClass === rootPitchClass);
      if (!rootNote) continue;

      for (const interval of this.getAllowedIntervals()) {
        const targetPitchClass = this.calculateTargetPitchClass(rootPitchClass, interval);
        const allTargetNotes = this.getAllTargetNotesOnFretboard(targetPitchClass);
        const targetNotesInZone = this.filterTargetNotesToZone(allTargetNotes, zone);

        if (this.isValidCombination(rootNote, interval, zone, targetNotesInZone)) {
          validCombinations.push({
            root: rootPitchClass,
            interval: interval.getShortName(),
            targetCount: targetNotesInZone.length
          });
        }
      }
    }

    return {
      totalPositions,
      availableRootPitchClasses,
      allowedIntervals,
      validCombinations
    };
  }

  /**
   * Validates that a clicked note is a correct answer for the given question.
   * @param clickedNote The note the user clicked
   * @param question The current question
   * @returns Whether the clicked note is correct
   */
  public validateAnswer(clickedNote: Note, question: IntervalQuizQuestion): boolean {
    return clickedNote.pitchClass === question.targetPitchClass;
  }
}
