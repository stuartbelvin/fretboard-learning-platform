/**
 * Instrument Configuration (APP-003)
 * 
 * Defines the Instrument class and supporting types for managing
 * different stringed instruments with configurable tunings and fret counts.
 * Designed for future extensibility to support multiple instrument types.
 */

import type { StringTuning } from './Fretboard';
import { 
  Fretboard, 
  STANDARD_TUNING, 
  DROP_D_TUNING, 
  OPEN_G_TUNING
} from './Fretboard';
import type { PitchClass } from '../music-theory/Note';

// ============================================================================
// Instrument Type Definitions
// ============================================================================

/**
 * Supported instrument types
 */
export type InstrumentType = 
  | 'guitar-6'      // 6-string guitar
  | 'guitar-7'      // 7-string guitar
  | 'guitar-8'      // 8-string guitar
  | 'bass-4'        // 4-string bass
  | 'bass-5'        // 5-string bass
  | 'bass-6'        // 6-string bass
  | 'ukulele'       // Standard ukulele
  | 'custom';       // Custom configuration

/**
 * Tuning preset identifiers
 */
export type TuningPresetId = 
  // Guitar tunings
  | 'guitar-standard'
  | 'guitar-drop-d'
  | 'guitar-open-g'
  | 'guitar-drop-c'
  | 'guitar-dadgad'
  | 'guitar-open-d'
  // 7-string guitar
  | 'guitar-7-standard'
  | 'guitar-7-drop-a'
  // 8-string guitar
  | 'guitar-8-standard'
  // Bass tunings
  | 'bass-4-standard'
  | 'bass-4-drop-d'
  | 'bass-5-standard'
  | 'bass-6-standard'
  // Ukulele tunings
  | 'ukulele-standard'
  | 'ukulele-baritone'
  // Custom
  | 'custom';

/**
 * Tuning preset definition
 */
export interface TuningPreset {
  /** Unique identifier for the preset */
  id: TuningPresetId;
  /** Human-readable name */
  name: string;
  /** Short description */
  description: string;
  /** Compatible instrument type */
  instrumentType: InstrumentType;
  /** String tunings from highest to lowest (string 1 to string N) */
  tuning: StringTuning[];
}

/**
 * Instrument definition
 */
export interface InstrumentDefinition {
  /** Instrument type identifier */
  type: InstrumentType;
  /** Human-readable name */
  name: string;
  /** Number of strings */
  stringCount: number;
  /** Number of frets (standard for this instrument) */
  fretCount: number;
  /** Default tuning preset ID */
  defaultTuning: TuningPresetId;
  /** Minimum supported fret count */
  minFrets: number;
  /** Maximum supported fret count */
  maxFrets: number;
}

/**
 * Instrument configuration options
 */
export interface InstrumentConfig {
  /** Instrument type */
  type: InstrumentType;
  /** Current tuning */
  tuning: StringTuning[];
  /** Active tuning preset (or 'custom') */
  tuningPresetId: TuningPresetId;
  /** Number of frets */
  fretCount: number;
}

// ============================================================================
// Tuning Presets
// ============================================================================

/**
 * Drop C tuning (CGCFAD)
 */
export const DROP_C_TUNING: StringTuning[] = [
  { pitchClass: 'D', octave: 4 },  // String 1
  { pitchClass: 'A', octave: 3 },  // String 2
  { pitchClass: 'F', octave: 3 },  // String 3
  { pitchClass: 'C', octave: 3 },  // String 4
  { pitchClass: 'G', octave: 2 },  // String 5
  { pitchClass: 'C', octave: 2 },  // String 6 (dropped to C)
];

/**
 * DADGAD tuning
 */
export const DADGAD_TUNING: StringTuning[] = [
  { pitchClass: 'D', octave: 4 },  // String 1
  { pitchClass: 'A', octave: 3 },  // String 2
  { pitchClass: 'G', octave: 3 },  // String 3
  { pitchClass: 'D', octave: 3 },  // String 4
  { pitchClass: 'A', octave: 2 },  // String 5
  { pitchClass: 'D', octave: 2 },  // String 6
];

/**
 * Open D tuning (DADF#AD)
 */
export const OPEN_D_TUNING: StringTuning[] = [
  { pitchClass: 'D', octave: 4 },  // String 1
  { pitchClass: 'A', octave: 3 },  // String 2
  { pitchClass: 'F#', octave: 3 }, // String 3
  { pitchClass: 'D', octave: 3 },  // String 4
  { pitchClass: 'A', octave: 2 },  // String 5
  { pitchClass: 'D', octave: 2 },  // String 6
];

/**
 * 7-string guitar standard tuning (B-E-A-D-G-B-E)
 */
export const GUITAR_7_STANDARD_TUNING: StringTuning[] = [
  { pitchClass: 'E', octave: 4 },  // String 1
  { pitchClass: 'B', octave: 3 },  // String 2
  { pitchClass: 'G', octave: 3 },  // String 3
  { pitchClass: 'D', octave: 3 },  // String 4
  { pitchClass: 'A', octave: 2 },  // String 5
  { pitchClass: 'E', octave: 2 },  // String 6
  { pitchClass: 'B', octave: 1 },  // String 7 (low B)
];

/**
 * 7-string guitar drop A tuning
 */
export const GUITAR_7_DROP_A_TUNING: StringTuning[] = [
  { pitchClass: 'E', octave: 4 },  // String 1
  { pitchClass: 'B', octave: 3 },  // String 2
  { pitchClass: 'G', octave: 3 },  // String 3
  { pitchClass: 'D', octave: 3 },  // String 4
  { pitchClass: 'A', octave: 2 },  // String 5
  { pitchClass: 'E', octave: 2 },  // String 6
  { pitchClass: 'A', octave: 1 },  // String 7 (dropped to A)
];

/**
 * 8-string guitar standard tuning (F#-B-E-A-D-G-B-E)
 */
export const GUITAR_8_STANDARD_TUNING: StringTuning[] = [
  { pitchClass: 'E', octave: 4 },  // String 1
  { pitchClass: 'B', octave: 3 },  // String 2
  { pitchClass: 'G', octave: 3 },  // String 3
  { pitchClass: 'D', octave: 3 },  // String 4
  { pitchClass: 'A', octave: 2 },  // String 5
  { pitchClass: 'E', octave: 2 },  // String 6
  { pitchClass: 'B', octave: 1 },  // String 7
  { pitchClass: 'F#', octave: 1 }, // String 8 (low F#)
];

/**
 * 4-string bass standard tuning (E-A-D-G)
 */
export const BASS_4_STANDARD_TUNING: StringTuning[] = [
  { pitchClass: 'G', octave: 2 },  // String 1
  { pitchClass: 'D', octave: 2 },  // String 2
  { pitchClass: 'A', octave: 1 },  // String 3
  { pitchClass: 'E', octave: 1 },  // String 4 (low E)
];

/**
 * 4-string bass drop D tuning
 */
export const BASS_4_DROP_D_TUNING: StringTuning[] = [
  { pitchClass: 'G', octave: 2 },  // String 1
  { pitchClass: 'D', octave: 2 },  // String 2
  { pitchClass: 'A', octave: 1 },  // String 3
  { pitchClass: 'D', octave: 1 },  // String 4 (dropped to D)
];

/**
 * 5-string bass standard tuning (B-E-A-D-G)
 */
export const BASS_5_STANDARD_TUNING: StringTuning[] = [
  { pitchClass: 'G', octave: 2 },  // String 1
  { pitchClass: 'D', octave: 2 },  // String 2
  { pitchClass: 'A', octave: 1 },  // String 3
  { pitchClass: 'E', octave: 1 },  // String 4
  { pitchClass: 'B', octave: 0 },  // String 5 (low B)
];

/**
 * 6-string bass standard tuning (B-E-A-D-G-C)
 */
export const BASS_6_STANDARD_TUNING: StringTuning[] = [
  { pitchClass: 'C', octave: 3 },  // String 1 (high C)
  { pitchClass: 'G', octave: 2 },  // String 2
  { pitchClass: 'D', octave: 2 },  // String 3
  { pitchClass: 'A', octave: 1 },  // String 4
  { pitchClass: 'E', octave: 1 },  // String 5
  { pitchClass: 'B', octave: 0 },  // String 6 (low B)
];

/**
 * Standard ukulele tuning (G-C-E-A) - reentrant
 */
export const UKULELE_STANDARD_TUNING: StringTuning[] = [
  { pitchClass: 'A', octave: 4 },  // String 1
  { pitchClass: 'E', octave: 4 },  // String 2
  { pitchClass: 'C', octave: 4 },  // String 3
  { pitchClass: 'G', octave: 4 },  // String 4 (high G - reentrant)
];

/**
 * Baritone ukulele tuning (D-G-B-E) - same as guitar top 4
 */
export const UKULELE_BARITONE_TUNING: StringTuning[] = [
  { pitchClass: 'E', octave: 4 },  // String 1
  { pitchClass: 'B', octave: 3 },  // String 2
  { pitchClass: 'G', octave: 3 },  // String 3
  { pitchClass: 'D', octave: 3 },  // String 4
];

/**
 * All tuning presets
 */
export const TUNING_PRESETS: TuningPreset[] = [
  // 6-string guitar
  {
    id: 'guitar-standard',
    name: 'Standard',
    description: 'E-A-D-G-B-E',
    instrumentType: 'guitar-6',
    tuning: STANDARD_TUNING,
  },
  {
    id: 'guitar-drop-d',
    name: 'Drop D',
    description: 'D-A-D-G-B-E',
    instrumentType: 'guitar-6',
    tuning: DROP_D_TUNING,
  },
  {
    id: 'guitar-open-g',
    name: 'Open G',
    description: 'D-G-D-G-B-D',
    instrumentType: 'guitar-6',
    tuning: OPEN_G_TUNING,
  },
  {
    id: 'guitar-drop-c',
    name: 'Drop C',
    description: 'C-G-C-F-A-D',
    instrumentType: 'guitar-6',
    tuning: DROP_C_TUNING,
  },
  {
    id: 'guitar-dadgad',
    name: 'DADGAD',
    description: 'D-A-D-G-A-D',
    instrumentType: 'guitar-6',
    tuning: DADGAD_TUNING,
  },
  {
    id: 'guitar-open-d',
    name: 'Open D',
    description: 'D-A-D-F#-A-D',
    instrumentType: 'guitar-6',
    tuning: OPEN_D_TUNING,
  },
  // 7-string guitar
  {
    id: 'guitar-7-standard',
    name: 'Standard 7',
    description: 'B-E-A-D-G-B-E',
    instrumentType: 'guitar-7',
    tuning: GUITAR_7_STANDARD_TUNING,
  },
  {
    id: 'guitar-7-drop-a',
    name: 'Drop A',
    description: 'A-E-A-D-G-B-E',
    instrumentType: 'guitar-7',
    tuning: GUITAR_7_DROP_A_TUNING,
  },
  // 8-string guitar
  {
    id: 'guitar-8-standard',
    name: 'Standard 8',
    description: 'F#-B-E-A-D-G-B-E',
    instrumentType: 'guitar-8',
    tuning: GUITAR_8_STANDARD_TUNING,
  },
  // 4-string bass
  {
    id: 'bass-4-standard',
    name: 'Standard Bass',
    description: 'E-A-D-G',
    instrumentType: 'bass-4',
    tuning: BASS_4_STANDARD_TUNING,
  },
  {
    id: 'bass-4-drop-d',
    name: 'Drop D Bass',
    description: 'D-A-D-G',
    instrumentType: 'bass-4',
    tuning: BASS_4_DROP_D_TUNING,
  },
  // 5-string bass
  {
    id: 'bass-5-standard',
    name: 'Standard 5-String',
    description: 'B-E-A-D-G',
    instrumentType: 'bass-5',
    tuning: BASS_5_STANDARD_TUNING,
  },
  // 6-string bass
  {
    id: 'bass-6-standard',
    name: 'Standard 6-String',
    description: 'B-E-A-D-G-C',
    instrumentType: 'bass-6',
    tuning: BASS_6_STANDARD_TUNING,
  },
  // Ukulele
  {
    id: 'ukulele-standard',
    name: 'Standard Ukulele',
    description: 'G-C-E-A',
    instrumentType: 'ukulele',
    tuning: UKULELE_STANDARD_TUNING,
  },
  {
    id: 'ukulele-baritone',
    name: 'Baritone Ukulele',
    description: 'D-G-B-E',
    instrumentType: 'ukulele',
    tuning: UKULELE_BARITONE_TUNING,
  },
  // Custom placeholder
  {
    id: 'custom',
    name: 'Custom',
    description: 'Custom tuning',
    instrumentType: 'custom',
    tuning: STANDARD_TUNING,
  },
];

/**
 * All instrument definitions
 */
export const INSTRUMENT_DEFINITIONS: InstrumentDefinition[] = [
  {
    type: 'guitar-6',
    name: '6-String Guitar',
    stringCount: 6,
    fretCount: 24,
    defaultTuning: 'guitar-standard',
    minFrets: 12,
    maxFrets: 24,
  },
  {
    type: 'guitar-7',
    name: '7-String Guitar',
    stringCount: 7,
    fretCount: 24,
    defaultTuning: 'guitar-7-standard',
    minFrets: 12,
    maxFrets: 24,
  },
  {
    type: 'guitar-8',
    name: '8-String Guitar',
    stringCount: 8,
    fretCount: 24,
    defaultTuning: 'guitar-8-standard',
    minFrets: 12,
    maxFrets: 24,
  },
  {
    type: 'bass-4',
    name: '4-String Bass',
    stringCount: 4,
    fretCount: 24,
    defaultTuning: 'bass-4-standard',
    minFrets: 12,
    maxFrets: 24,
  },
  {
    type: 'bass-5',
    name: '5-String Bass',
    stringCount: 5,
    fretCount: 24,
    defaultTuning: 'bass-5-standard',
    minFrets: 12,
    maxFrets: 24,
  },
  {
    type: 'bass-6',
    name: '6-String Bass',
    stringCount: 6,
    fretCount: 24,
    defaultTuning: 'bass-6-standard',
    minFrets: 12,
    maxFrets: 24,
  },
  {
    type: 'ukulele',
    name: 'Ukulele',
    stringCount: 4,
    fretCount: 15,
    defaultTuning: 'ukulele-standard',
    minFrets: 10,
    maxFrets: 20,
  },
  {
    type: 'custom',
    name: 'Custom Instrument',
    stringCount: 6,
    fretCount: 24,
    defaultTuning: 'custom',
    minFrets: 1,
    maxFrets: 36,
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get a tuning preset by ID
 */
export function getTuningPreset(id: TuningPresetId): TuningPreset | undefined {
  return TUNING_PRESETS.find(preset => preset.id === id);
}

/**
 * Get all tuning presets for an instrument type
 */
export function getTuningPresetsForInstrument(type: InstrumentType): TuningPreset[] {
  return TUNING_PRESETS.filter(preset => preset.instrumentType === type || preset.id === 'custom');
}

/**
 * Get an instrument definition by type
 */
export function getInstrumentDefinition(type: InstrumentType): InstrumentDefinition | undefined {
  return INSTRUMENT_DEFINITIONS.find(def => def.type === type);
}

/**
 * Validate a tuning for an instrument
 */
export function validateTuning(tuning: StringTuning[], expectedStringCount: number): boolean {
  return tuning.length === expectedStringCount;
}

/**
 * Validate a fret count for an instrument
 */
export function validateFretCount(fretCount: number, instrumentType: InstrumentType): boolean {
  const definition = getInstrumentDefinition(instrumentType);
  if (!definition) return false;
  return fretCount >= definition.minFrets && fretCount <= definition.maxFrets;
}

/**
 * Create a custom tuning from pitch class strings
 * @param notes Array of pitch class strings with octave (e.g., ['E4', 'B3', 'G3'])
 */
export function createCustomTuning(notes: string[]): StringTuning[] {
  return notes.map(noteStr => {
    // Parse note string like "E4" or "F#3" or "Bb2"
    const match = noteStr.match(/^([A-G][#b]?)(\d+)$/);
    if (!match) {
      throw new Error(`Invalid note string: ${noteStr}`);
    }
    return {
      pitchClass: match[1] as PitchClass,
      octave: parseInt(match[2], 10),
    };
  });
}

// ============================================================================
// Instrument Class
// ============================================================================

/**
 * Instrument class for managing instrument configuration and fretboard generation.
 * 
 * Provides a high-level interface for:
 * - Switching between instrument types (guitar, bass, ukulele)
 * - Changing tunings with preset support
 * - Generating fretboard instances for the current configuration
 * - Validating instrument configurations
 */
export class Instrument {
  /** Current instrument configuration */
  private config: InstrumentConfig;

  /** Cached fretboard instance */
  private _fretboard: Fretboard | null = null;

  /** Instrument definition for current type */
  private _definition: InstrumentDefinition;

  /**
   * Create a new Instrument instance
   * @param type Instrument type (default: 'guitar-6')
   * @param tuningPresetId Optional tuning preset ID (defaults to instrument's default)
   * @param fretCount Optional fret count (defaults to instrument's standard)
   */
  constructor(
    type: InstrumentType = 'guitar-6',
    tuningPresetId?: TuningPresetId,
    fretCount?: number
  ) {
    const definition = getInstrumentDefinition(type);
    if (!definition) {
      throw new Error(`Unknown instrument type: ${type}`);
    }
    this._definition = definition;

    // Resolve tuning
    const presetId = tuningPresetId || definition.defaultTuning;
    const preset = getTuningPreset(presetId);
    const tuning = preset?.tuning || STANDARD_TUNING.slice(0, definition.stringCount);

    // Validate and clamp fret count
    const resolvedFretCount = fretCount ?? definition.fretCount;
    const clampedFretCount = Math.max(
      definition.minFrets,
      Math.min(definition.maxFrets, resolvedFretCount)
    );

    this.config = {
      type,
      tuning,
      tuningPresetId: presetId,
      fretCount: clampedFretCount,
    };
  }

  // ==========================================================================
  // Getters
  // ==========================================================================

  /** Get the current instrument type */
  get type(): InstrumentType {
    return this.config.type;
  }

  /** Get the instrument definition */
  get definition(): InstrumentDefinition {
    return this._definition;
  }

  /** Get the number of strings */
  get stringCount(): number {
    return this._definition.stringCount;
  }

  /** Get the number of frets */
  get fretCount(): number {
    return this.config.fretCount;
  }

  /** Get the current tuning */
  get tuning(): StringTuning[] {
    return [...this.config.tuning];
  }

  /** Get the current tuning preset ID */
  get tuningPresetId(): TuningPresetId {
    return this.config.tuningPresetId;
  }

  /** Get the current tuning preset (if not custom) */
  get tuningPreset(): TuningPreset | undefined {
    return getTuningPreset(this.config.tuningPresetId);
  }

  /** Get the instrument name */
  get name(): string {
    return this._definition.name;
  }

  /** Get the complete configuration */
  get configuration(): InstrumentConfig {
    return { ...this.config };
  }

  // ==========================================================================
  // Fretboard Management
  // ==========================================================================

  /**
   * Get the fretboard for this instrument.
   * Creates and caches a Fretboard instance based on current configuration.
   */
  get fretboard(): Fretboard {
    if (!this._fretboard) {
      this._fretboard = new Fretboard({
        tuning: this.config.tuning,
        fretCount: this.config.fretCount,
        stringCount: this._definition.stringCount,
      });
    }
    return this._fretboard;
  }

  /**
   * Force regeneration of the fretboard
   */
  private invalidateFretboard(): void {
    this._fretboard = null;
  }

  // ==========================================================================
  // Configuration Methods
  // ==========================================================================

  /**
   * Set the tuning using a preset
   * @param presetId The tuning preset ID
   * @returns true if the preset was applied, false if invalid
   */
  setTuningPreset(presetId: TuningPresetId): boolean {
    const preset = getTuningPreset(presetId);
    if (!preset) {
      return false;
    }

    // Validate preset compatibility with current instrument
    if (preset.tuning.length !== this._definition.stringCount && presetId !== 'custom') {
      return false;
    }

    this.config.tuning = [...preset.tuning];
    this.config.tuningPresetId = presetId;
    this.invalidateFretboard();
    return true;
  }

  /**
   * Set a custom tuning
   * @param tuning Array of StringTuning objects
   * @returns true if the tuning was applied, false if invalid
   */
  setCustomTuning(tuning: StringTuning[]): boolean {
    if (!validateTuning(tuning, this._definition.stringCount)) {
      return false;
    }

    this.config.tuning = [...tuning];
    this.config.tuningPresetId = 'custom';
    this.invalidateFretboard();
    return true;
  }

  /**
   * Set the fret count
   * @param count Number of frets
   * @returns true if the fret count was applied, false if invalid
   */
  setFretCount(count: number): boolean {
    if (!validateFretCount(count, this.config.type)) {
      return false;
    }

    this.config.fretCount = count;
    this.invalidateFretboard();
    return true;
  }

  /**
   * Switch to a different instrument type
   * @param type The new instrument type
   * @param preserveTuning Whether to try preserving the current tuning if compatible
   * @returns true if the switch was successful
   */
  switchInstrument(type: InstrumentType, preserveTuning: boolean = false): boolean {
    const definition = getInstrumentDefinition(type);
    if (!definition) {
      return false;
    }

    // Update definition
    this._definition = definition;
    this.config.type = type;

    // Handle tuning
    if (preserveTuning && this.config.tuning.length === definition.stringCount) {
      // Keep current tuning, mark as custom
      this.config.tuningPresetId = 'custom';
    } else {
      // Reset to default tuning for new instrument
      const defaultPreset = getTuningPreset(definition.defaultTuning);
      this.config.tuning = defaultPreset?.tuning || STANDARD_TUNING.slice(0, definition.stringCount);
      this.config.tuningPresetId = definition.defaultTuning;
    }

    // Clamp fret count to new instrument's limits
    this.config.fretCount = Math.max(
      definition.minFrets,
      Math.min(definition.maxFrets, this.config.fretCount)
    );

    this.invalidateFretboard();
    return true;
  }

  /**
   * Reset to default configuration for current instrument type
   */
  resetToDefaults(): void {
    const definition = this._definition;
    const defaultPreset = getTuningPreset(definition.defaultTuning);
    
    this.config.tuning = defaultPreset?.tuning || STANDARD_TUNING.slice(0, definition.stringCount);
    this.config.tuningPresetId = definition.defaultTuning;
    this.config.fretCount = definition.fretCount;
    
    this.invalidateFretboard();
  }

  // ==========================================================================
  // Query Methods
  // ==========================================================================

  /**
   * Get all tuning presets compatible with this instrument
   */
  getCompatibleTuningPresets(): TuningPreset[] {
    return getTuningPresetsForInstrument(this.config.type);
  }

  /**
   * Check if a tuning is compatible with this instrument
   */
  isTuningCompatible(tuning: StringTuning[]): boolean {
    return validateTuning(tuning, this._definition.stringCount);
  }

  /**
   * Check if a fret count is valid for this instrument
   */
  isFretCountValid(fretCount: number): boolean {
    return validateFretCount(fretCount, this.config.type);
  }

  /**
   * Get the tuning string representation (e.g., "E-A-D-G-B-E")
   */
  getTuningString(): string {
    return this.config.tuning
      .slice()
      .reverse() // Display from low to high
      .map(t => t.pitchClass)
      .join('-');
  }

  // ==========================================================================
  // Serialization
  // ==========================================================================

  /**
   * Serialize to JSON-compatible object
   */
  toJSON(): InstrumentConfig {
    return { ...this.config };
  }

  /**
   * Create an Instrument from a serialized configuration
   */
  static fromJSON(config: InstrumentConfig): Instrument {
    const instrument = new Instrument(config.type, config.tuningPresetId, config.fretCount);
    
    // Apply custom tuning if specified
    if (config.tuningPresetId === 'custom') {
      instrument.setCustomTuning(config.tuning);
    }
    
    return instrument;
  }

  /**
   * Create a clone of this instrument
   */
  clone(): Instrument {
    return Instrument.fromJSON(this.toJSON());
  }

  // ==========================================================================
  // Static Factory Methods
  // ==========================================================================

  /**
   * Create a standard 6-string guitar
   */
  static guitar6(): Instrument {
    return new Instrument('guitar-6');
  }

  /**
   * Create a 7-string guitar
   */
  static guitar7(): Instrument {
    return new Instrument('guitar-7');
  }

  /**
   * Create an 8-string guitar
   */
  static guitar8(): Instrument {
    return new Instrument('guitar-8');
  }

  /**
   * Create a 4-string bass
   */
  static bass4(): Instrument {
    return new Instrument('bass-4');
  }

  /**
   * Create a 5-string bass
   */
  static bass5(): Instrument {
    return new Instrument('bass-5');
  }

  /**
   * Create a 6-string bass
   */
  static bass6(): Instrument {
    return new Instrument('bass-6');
  }

  /**
   * Create a standard ukulele
   */
  static ukulele(): Instrument {
    return new Instrument('ukulele');
  }
}

// ============================================================================
// Default Export
// ============================================================================

/**
 * Create the default instrument (6-string guitar in standard tuning)
 */
export function createDefaultInstrument(): Instrument {
  return Instrument.guitar6();
}
