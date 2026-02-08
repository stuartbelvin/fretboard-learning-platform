/**
 * Configuration Manager (APP-002)
 * 
 * Centralized configuration system with all tunable parameters.
 * Organized by category: colors, thresholds, defaults, quiz settings.
 * Includes comprehensive validation for all configuration values.
 */

import type { ColorPalette } from './colors';
import { COLOR_PALETTES, DEFAULT_PALETTE, getPaletteById } from './colors';
import type { NoteDisplayPreference, MarkerStyle, TuningPreset } from '../store/appStore';
import {
  DEFAULT_QUIZ_SETTINGS,
  DEFAULT_INSTRUMENT_CONFIG,
  DEFAULT_USER_SETTINGS,
  DEFAULT_VIEWPORT_CONFIG,
} from '../store/appStore';
import type { StringTuning } from '../core/instruments/Fretboard';
import { STANDARD_TUNING } from '../core/instruments/Fretboard';

// ============================================================================
// Configuration Interfaces
// ============================================================================

/**
 * Color configuration - defines which palette and custom color overrides
 */
export interface ColorConfig {
  /** ID of the active color palette */
  paletteId: string;
  /** Custom color overrides (optional) */
  customOverrides?: Partial<ColorPalette['colors']>;
}

/**
 * Threshold configuration - timing, limits, and bounds
 */
export interface ThresholdConfig {
  /** Quiz settings thresholds */
  quiz: {
    /** Minimum questions per quiz session */
    minQuestions: number;
    /** Maximum questions per quiz session */
    maxQuestions: number;
    /** Minimum attempts before hint */
    minAttempts: number;
    /** Maximum attempts before hint */
    maxAttempts: number;
    /** Minimum auto-advance delay (ms) */
    minAutoAdvanceDelay: number;
    /** Maximum auto-advance delay (ms) */
    maxAutoAdvanceDelay: number;
  };
  /** Feedback duration thresholds */
  feedback: {
    /** Correct answer flash duration (ms) */
    correctFlashDuration: number;
    /** Incorrect answer flash duration (ms) */
    incorrectFlashDuration: number;
    /** Hint pulse duration (ms) */
    hintPulseDuration: number;
    /** Number of hint pulses */
    hintPulseCount: number;
  };
  /** Instrument thresholds */
  instrument: {
    /** Minimum fret count */
    minFrets: number;
    /** Maximum fret count */
    maxFrets: number;
    /** Minimum string count */
    minStrings: number;
    /** Maximum string count */
    maxStrings: number;
  };
  /** Animation thresholds */
  animation: {
    /** Minimum animation speed multiplier */
    minSpeed: number;
    /** Maximum animation speed multiplier */
    maxSpeed: number;
  };
  /** Viewport thresholds */
  viewport: {
    /** Minimum visible frets */
    minVisibleFrets: number;
    /** Maximum visible frets */
    maxVisibleFrets: number;
    /** Minimum mobile fret count */
    minMobileFrets: number;
    /** Maximum mobile fret count */
    maxMobileFrets: number;
  };
}

/**
 * Default values configuration - initial settings
 */
export interface DefaultsConfig {
  /** Default instrument settings */
  instrument: {
    stringCount: number;
    fretCount: number;
    tuning: StringTuning[];
    tuningPreset: TuningPreset;
  };
  /** Default viewport settings */
  viewport: {
    visibleFrets: number;
    startFret: number;
    desktopFretCount: number;
    tabletFretCount: number;
    mobileFretCount: number;
  };
  /** Default user preferences */
  user: {
    colorPaletteId: string;
    noteDisplay: NoteDisplayPreference;
    showNoteNames: boolean;
    markerStyle: MarkerStyle;
    soundEnabled: boolean;
    animationSpeed: number;
  };
}

/**
 * Quiz-specific configuration
 */
export interface QuizConfig {
  /** Note quiz defaults */
  noteQuiz: {
    /** Default note selection */
    defaultNoteSelection: NoteDisplayPreference;
  };
  /** Interval quiz defaults */
  intervalQuiz: {
    /** Default selected intervals */
    defaultIntervals: string[];
    /** Allow compound intervals by default */
    allowCompoundIntervals: boolean;
    /** Allow root outside zone for compound intervals */
    allowRootOutsideZoneForCompound: boolean;
  };
  /** Shared quiz settings */
  shared: {
    /** Default max attempts before hint */
    maxAttempts: number;
    /** Default total questions */
    totalQuestions: number;
    /** Auto-advance enabled by default */
    autoAdvance: boolean;
    /** Auto-advance delay (ms) */
    autoAdvanceDelay: number;
  };
}

/**
 * Complete application configuration
 */
export interface AppConfig {
  /** Version of the config schema */
  version: string;
  /** Color configuration */
  colors: ColorConfig;
  /** Threshold values */
  thresholds: ThresholdConfig;
  /** Default values */
  defaults: DefaultsConfig;
  /** Quiz configuration */
  quiz: QuizConfig;
}

// ============================================================================
// Validation Error Types
// ============================================================================

/**
 * Configuration validation error
 */
export interface ConfigValidationError {
  /** Path to the invalid property (e.g., "thresholds.quiz.maxAttempts") */
  path: string;
  /** Error message */
  message: string;
  /** The invalid value */
  value: unknown;
  /** Expected constraint or type */
  expected: string;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  /** Whether the configuration is valid */
  valid: boolean;
  /** List of validation errors (empty if valid) */
  errors: ConfigValidationError[];
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default threshold configuration
 */
export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  quiz: {
    minQuestions: 1,
    maxQuestions: 100,
    minAttempts: 1,
    maxAttempts: 10,
    minAutoAdvanceDelay: 100,
    maxAutoAdvanceDelay: 5000,
  },
  feedback: {
    correctFlashDuration: 500,
    incorrectFlashDuration: 500,
    hintPulseDuration: 300,
    hintPulseCount: 3,
  },
  instrument: {
    minFrets: 12,
    maxFrets: 24,
    minStrings: 4,
    maxStrings: 12,
  },
  animation: {
    minSpeed: 0.5,
    maxSpeed: 2,
  },
  viewport: {
    minVisibleFrets: 1,
    maxVisibleFrets: 24,
    minMobileFrets: 1,
    maxMobileFrets: 12,
  },
};

/**
 * Default color configuration
 */
export const DEFAULT_COLOR_CONFIG: ColorConfig = {
  paletteId: 'default',
  customOverrides: undefined,
};

/**
 * Default defaults configuration (derived from appStore defaults)
 */
export const DEFAULT_DEFAULTS_CONFIG: DefaultsConfig = {
  instrument: {
    stringCount: DEFAULT_INSTRUMENT_CONFIG.stringCount,
    fretCount: DEFAULT_INSTRUMENT_CONFIG.fretCount,
    tuning: DEFAULT_INSTRUMENT_CONFIG.tuning,
    tuningPreset: DEFAULT_INSTRUMENT_CONFIG.tuningPreset,
  },
  viewport: {
    visibleFrets: DEFAULT_VIEWPORT_CONFIG.visibleFrets,
    startFret: DEFAULT_VIEWPORT_CONFIG.startFret,
    desktopFretCount: DEFAULT_VIEWPORT_CONFIG.desktopFretCount,
    tabletFretCount: DEFAULT_VIEWPORT_CONFIG.tabletFretCount,
    mobileFretCount: DEFAULT_VIEWPORT_CONFIG.mobileFretCount,
  },
  user: {
    colorPaletteId: DEFAULT_USER_SETTINGS.colorPaletteId,
    noteDisplay: DEFAULT_USER_SETTINGS.noteDisplay,
    showNoteNames: DEFAULT_USER_SETTINGS.showNoteNames,
    markerStyle: DEFAULT_USER_SETTINGS.markerStyle,
    soundEnabled: DEFAULT_USER_SETTINGS.soundEnabled,
    animationSpeed: DEFAULT_USER_SETTINGS.animationSpeed,
  },
};

/**
 * Default quiz configuration
 */
export const DEFAULT_QUIZ_CONFIG: QuizConfig = {
  noteQuiz: {
    defaultNoteSelection: DEFAULT_QUIZ_SETTINGS.noteSelection,
  },
  intervalQuiz: {
    defaultIntervals: DEFAULT_QUIZ_SETTINGS.selectedIntervals,
    allowCompoundIntervals: DEFAULT_QUIZ_SETTINGS.allowCompoundIntervals,
    allowRootOutsideZoneForCompound: true,
  },
  shared: {
    maxAttempts: DEFAULT_QUIZ_SETTINGS.maxAttempts,
    totalQuestions: DEFAULT_QUIZ_SETTINGS.totalQuestions,
    autoAdvance: DEFAULT_QUIZ_SETTINGS.autoAdvance,
    autoAdvanceDelay: DEFAULT_QUIZ_SETTINGS.autoAdvanceDelay,
  },
};

/**
 * Default application configuration
 */
export const DEFAULT_APP_CONFIG: AppConfig = {
  version: '1.0.0',
  colors: DEFAULT_COLOR_CONFIG,
  thresholds: DEFAULT_THRESHOLDS,
  defaults: DEFAULT_DEFAULTS_CONFIG,
  quiz: DEFAULT_QUIZ_CONFIG,
};

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate a number is within a range
 */
function validateRange(
  value: number,
  min: number,
  max: number,
  path: string,
  errors: ConfigValidationError[]
): boolean {
  if (typeof value !== 'number' || isNaN(value)) {
    errors.push({
      path,
      message: `Must be a number`,
      value,
      expected: 'number',
    });
    return false;
  }
  if (value < min || value > max) {
    errors.push({
      path,
      message: `Must be between ${min} and ${max}`,
      value,
      expected: `${min}-${max}`,
    });
    return false;
  }
  return true;
}

/**
 * Validate a string is not empty
 */
function validateNonEmptyString(
  value: string,
  path: string,
  errors: ConfigValidationError[]
): boolean {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push({
      path,
      message: `Must be a non-empty string`,
      value,
      expected: 'non-empty string',
    });
    return false;
  }
  return true;
}

/**
 * Validate a value is one of allowed values
 */
function validateEnum<T>(
  value: T,
  allowed: readonly T[],
  path: string,
  errors: ConfigValidationError[]
): boolean {
  if (!allowed.includes(value)) {
    errors.push({
      path,
      message: `Must be one of: ${allowed.join(', ')}`,
      value,
      expected: allowed.join(' | '),
    });
    return false;
  }
  return true;
}

/**
 * Validate a boolean value
 */
function validateBoolean(
  value: boolean,
  path: string,
  errors: ConfigValidationError[]
): boolean {
  if (typeof value !== 'boolean') {
    errors.push({
      path,
      message: `Must be a boolean`,
      value,
      expected: 'boolean',
    });
    return false;
  }
  return true;
}

/**
 * Validate an array is not empty
 */
function validateNonEmptyArray(
  value: unknown[],
  path: string,
  errors: ConfigValidationError[]
): boolean {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push({
      path,
      message: `Must be a non-empty array`,
      value,
      expected: 'non-empty array',
    });
    return false;
  }
  return true;
}

/**
 * Validate color configuration
 */
export function validateColorConfig(
  config: ColorConfig,
  errors: ConfigValidationError[]
): boolean {
  const basePath = 'colors';
  let valid = true;

  // Validate palette ID
  if (!validateNonEmptyString(config.paletteId, `${basePath}.paletteId`, errors)) {
    valid = false;
  } else {
    // Check if palette exists
    const palette = getPaletteById(config.paletteId);
    if (!palette) {
      errors.push({
        path: `${basePath}.paletteId`,
        message: `Palette "${config.paletteId}" not found. Available: ${COLOR_PALETTES.map(p => p.id).join(', ')}`,
        value: config.paletteId,
        expected: COLOR_PALETTES.map(p => p.id).join(' | '),
      });
      valid = false;
    }
  }

  // Validate custom overrides if present
  if (config.customOverrides !== undefined && config.customOverrides !== null) {
    if (typeof config.customOverrides !== 'object') {
      errors.push({
        path: `${basePath}.customOverrides`,
        message: `Must be an object or undefined`,
        value: config.customOverrides,
        expected: 'object | undefined',
      });
      valid = false;
    }
  }

  return valid;
}

/**
 * Validate threshold configuration
 */
export function validateThresholdConfig(
  config: ThresholdConfig,
  errors: ConfigValidationError[]
): boolean {
  const basePath = 'thresholds';
  let valid = true;

  // Quiz thresholds
  const quizPath = `${basePath}.quiz`;
  if (!validateRange(config.quiz.minQuestions, 1, 100, `${quizPath}.minQuestions`, errors)) valid = false;
  if (!validateRange(config.quiz.maxQuestions, 1, 1000, `${quizPath}.maxQuestions`, errors)) valid = false;
  if (!validateRange(config.quiz.minAttempts, 1, 10, `${quizPath}.minAttempts`, errors)) valid = false;
  if (!validateRange(config.quiz.maxAttempts, 1, 20, `${quizPath}.maxAttempts`, errors)) valid = false;
  if (!validateRange(config.quiz.minAutoAdvanceDelay, 0, 10000, `${quizPath}.minAutoAdvanceDelay`, errors)) valid = false;
  if (!validateRange(config.quiz.maxAutoAdvanceDelay, 100, 30000, `${quizPath}.maxAutoAdvanceDelay`, errors)) valid = false;

  // Validate min <= max relationships
  if (config.quiz.minQuestions > config.quiz.maxQuestions) {
    errors.push({
      path: `${quizPath}.minQuestions`,
      message: `minQuestions must be <= maxQuestions`,
      value: config.quiz.minQuestions,
      expected: `<= ${config.quiz.maxQuestions}`,
    });
    valid = false;
  }
  if (config.quiz.minAttempts > config.quiz.maxAttempts) {
    errors.push({
      path: `${quizPath}.minAttempts`,
      message: `minAttempts must be <= maxAttempts`,
      value: config.quiz.minAttempts,
      expected: `<= ${config.quiz.maxAttempts}`,
    });
    valid = false;
  }
  if (config.quiz.minAutoAdvanceDelay > config.quiz.maxAutoAdvanceDelay) {
    errors.push({
      path: `${quizPath}.minAutoAdvanceDelay`,
      message: `minAutoAdvanceDelay must be <= maxAutoAdvanceDelay`,
      value: config.quiz.minAutoAdvanceDelay,
      expected: `<= ${config.quiz.maxAutoAdvanceDelay}`,
    });
    valid = false;
  }

  // Feedback thresholds
  const feedbackPath = `${basePath}.feedback`;
  if (!validateRange(config.feedback.correctFlashDuration, 100, 2000, `${feedbackPath}.correctFlashDuration`, errors)) valid = false;
  if (!validateRange(config.feedback.incorrectFlashDuration, 100, 2000, `${feedbackPath}.incorrectFlashDuration`, errors)) valid = false;
  if (!validateRange(config.feedback.hintPulseDuration, 100, 1000, `${feedbackPath}.hintPulseDuration`, errors)) valid = false;
  if (!validateRange(config.feedback.hintPulseCount, 1, 10, `${feedbackPath}.hintPulseCount`, errors)) valid = false;

  // Instrument thresholds
  const instrumentPath = `${basePath}.instrument`;
  if (!validateRange(config.instrument.minFrets, 1, 24, `${instrumentPath}.minFrets`, errors)) valid = false;
  if (!validateRange(config.instrument.maxFrets, 12, 36, `${instrumentPath}.maxFrets`, errors)) valid = false;
  if (!validateRange(config.instrument.minStrings, 1, 12, `${instrumentPath}.minStrings`, errors)) valid = false;
  if (!validateRange(config.instrument.maxStrings, 4, 24, `${instrumentPath}.maxStrings`, errors)) valid = false;

  if (config.instrument.minFrets > config.instrument.maxFrets) {
    errors.push({
      path: `${instrumentPath}.minFrets`,
      message: `minFrets must be <= maxFrets`,
      value: config.instrument.minFrets,
      expected: `<= ${config.instrument.maxFrets}`,
    });
    valid = false;
  }
  if (config.instrument.minStrings > config.instrument.maxStrings) {
    errors.push({
      path: `${instrumentPath}.minStrings`,
      message: `minStrings must be <= maxStrings`,
      value: config.instrument.minStrings,
      expected: `<= ${config.instrument.maxStrings}`,
    });
    valid = false;
  }

  // Animation thresholds
  const animationPath = `${basePath}.animation`;
  if (!validateRange(config.animation.minSpeed, 0.1, 1, `${animationPath}.minSpeed`, errors)) valid = false;
  if (!validateRange(config.animation.maxSpeed, 1, 5, `${animationPath}.maxSpeed`, errors)) valid = false;

  if (config.animation.minSpeed > config.animation.maxSpeed) {
    errors.push({
      path: `${animationPath}.minSpeed`,
      message: `minSpeed must be <= maxSpeed`,
      value: config.animation.minSpeed,
      expected: `<= ${config.animation.maxSpeed}`,
    });
    valid = false;
  }

  // Viewport thresholds
  const viewportPath = `${basePath}.viewport`;
  if (!validateRange(config.viewport.minVisibleFrets, 1, 24, `${viewportPath}.minVisibleFrets`, errors)) valid = false;
  if (!validateRange(config.viewport.maxVisibleFrets, 1, 36, `${viewportPath}.maxVisibleFrets`, errors)) valid = false;
  if (!validateRange(config.viewport.minMobileFrets, 1, 12, `${viewportPath}.minMobileFrets`, errors)) valid = false;
  if (!validateRange(config.viewport.maxMobileFrets, 1, 24, `${viewportPath}.maxMobileFrets`, errors)) valid = false;

  if (config.viewport.minVisibleFrets > config.viewport.maxVisibleFrets) {
    errors.push({
      path: `${viewportPath}.minVisibleFrets`,
      message: `minVisibleFrets must be <= maxVisibleFrets`,
      value: config.viewport.minVisibleFrets,
      expected: `<= ${config.viewport.maxVisibleFrets}`,
    });
    valid = false;
  }
  if (config.viewport.minMobileFrets > config.viewport.maxMobileFrets) {
    errors.push({
      path: `${viewportPath}.minMobileFrets`,
      message: `minMobileFrets must be <= maxMobileFrets`,
      value: config.viewport.minMobileFrets,
      expected: `<= ${config.viewport.maxMobileFrets}`,
    });
    valid = false;
  }

  return valid;
}

/**
 * Validate defaults configuration
 */
export function validateDefaultsConfig(
  config: DefaultsConfig,
  thresholds: ThresholdConfig,
  errors: ConfigValidationError[]
): boolean {
  const basePath = 'defaults';
  let valid = true;

  // Instrument defaults
  const instrumentPath = `${basePath}.instrument`;
  if (!validateRange(
    config.instrument.stringCount,
    thresholds.instrument.minStrings,
    thresholds.instrument.maxStrings,
    `${instrumentPath}.stringCount`,
    errors
  )) valid = false;
  if (!validateRange(
    config.instrument.fretCount,
    thresholds.instrument.minFrets,
    thresholds.instrument.maxFrets,
    `${instrumentPath}.fretCount`,
    errors
  )) valid = false;
  if (!validateNonEmptyArray(config.instrument.tuning, `${instrumentPath}.tuning`, errors)) valid = false;
  if (!validateEnum(
    config.instrument.tuningPreset,
    ['standard', 'dropD', 'openG', 'custom'] as const,
    `${instrumentPath}.tuningPreset`,
    errors
  )) valid = false;

  // Viewport defaults
  const viewportPath = `${basePath}.viewport`;
  if (!validateRange(
    config.viewport.visibleFrets,
    thresholds.viewport.minVisibleFrets,
    thresholds.viewport.maxVisibleFrets,
    `${viewportPath}.visibleFrets`,
    errors
  )) valid = false;
  if (!validateRange(config.viewport.startFret, 0, 23, `${viewportPath}.startFret`, errors)) valid = false;
  if (!validateRange(
    config.viewport.desktopFretCount,
    thresholds.viewport.minVisibleFrets,
    thresholds.viewport.maxVisibleFrets,
    `${viewportPath}.desktopFretCount`,
    errors
  )) valid = false;
  if (!validateRange(
    config.viewport.tabletFretCount,
    thresholds.viewport.minVisibleFrets,
    thresholds.viewport.maxVisibleFrets,
    `${viewportPath}.tabletFretCount`,
    errors
  )) valid = false;
  if (!validateRange(
    config.viewport.mobileFretCount,
    thresholds.viewport.minMobileFrets,
    thresholds.viewport.maxMobileFrets,
    `${viewportPath}.mobileFretCount`,
    errors
  )) valid = false;

  // User defaults
  const userPath = `${basePath}.user`;
  if (!validateNonEmptyString(config.user.colorPaletteId, `${userPath}.colorPaletteId`, errors)) valid = false;
  if (!validateEnum(
    config.user.noteDisplay,
    ['sharps', 'flats', 'both'] as const,
    `${userPath}.noteDisplay`,
    errors
  )) valid = false;
  if (!validateBoolean(config.user.showNoteNames, `${userPath}.showNoteNames`, errors)) valid = false;
  if (!validateEnum(
    config.user.markerStyle,
    ['dots', 'trapezoid'] as const,
    `${userPath}.markerStyle`,
    errors
  )) valid = false;
  if (!validateBoolean(config.user.soundEnabled, `${userPath}.soundEnabled`, errors)) valid = false;
  if (!validateRange(
    config.user.animationSpeed,
    thresholds.animation.minSpeed,
    thresholds.animation.maxSpeed,
    `${userPath}.animationSpeed`,
    errors
  )) valid = false;

  return valid;
}

/**
 * Validate quiz configuration
 */
export function validateQuizConfig(
  config: QuizConfig,
  thresholds: ThresholdConfig,
  errors: ConfigValidationError[]
): boolean {
  const basePath = 'quiz';
  let valid = true;

  // Note quiz
  const notePath = `${basePath}.noteQuiz`;
  if (!validateEnum(
    config.noteQuiz.defaultNoteSelection,
    ['sharps', 'flats', 'both'] as const,
    `${notePath}.defaultNoteSelection`,
    errors
  )) valid = false;

  // Interval quiz
  const intervalPath = `${basePath}.intervalQuiz`;
  if (!validateNonEmptyArray(config.intervalQuiz.defaultIntervals, `${intervalPath}.defaultIntervals`, errors)) valid = false;
  if (!validateBoolean(config.intervalQuiz.allowCompoundIntervals, `${intervalPath}.allowCompoundIntervals`, errors)) valid = false;
  if (!validateBoolean(config.intervalQuiz.allowRootOutsideZoneForCompound, `${intervalPath}.allowRootOutsideZoneForCompound`, errors)) valid = false;

  // Shared quiz settings
  const sharedPath = `${basePath}.shared`;
  if (!validateRange(
    config.shared.maxAttempts,
    thresholds.quiz.minAttempts,
    thresholds.quiz.maxAttempts,
    `${sharedPath}.maxAttempts`,
    errors
  )) valid = false;
  if (!validateRange(
    config.shared.totalQuestions,
    thresholds.quiz.minQuestions,
    thresholds.quiz.maxQuestions,
    `${sharedPath}.totalQuestions`,
    errors
  )) valid = false;
  if (!validateBoolean(config.shared.autoAdvance, `${sharedPath}.autoAdvance`, errors)) valid = false;
  if (!validateRange(
    config.shared.autoAdvanceDelay,
    thresholds.quiz.minAutoAdvanceDelay,
    thresholds.quiz.maxAutoAdvanceDelay,
    `${sharedPath}.autoAdvanceDelay`,
    errors
  )) valid = false;

  return valid;
}

/**
 * Validate complete application configuration
 */
export function validateAppConfig(config: AppConfig): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];

  // Validate version
  if (!config.version || typeof config.version !== 'string') {
    errors.push({
      path: 'version',
      message: 'Configuration version is required',
      value: config.version,
      expected: 'string (semver)',
    });
  }

  // Validate each section
  validateColorConfig(config.colors, errors);
  validateThresholdConfig(config.thresholds, errors);
  validateDefaultsConfig(config.defaults, config.thresholds, errors);
  validateQuizConfig(config.quiz, config.thresholds, errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Configuration Utilities
// ============================================================================

/**
 * Deep merge two configuration objects
 */
export function mergeConfig(base: AppConfig, override: Partial<AppConfig>): AppConfig {
  return {
    version: override.version ?? base.version,
    colors: {
      ...base.colors,
      ...override.colors,
      customOverrides: override.colors?.customOverrides !== undefined
        ? { ...base.colors.customOverrides, ...override.colors.customOverrides }
        : base.colors.customOverrides,
    },
    thresholds: {
      quiz: { ...base.thresholds.quiz, ...override.thresholds?.quiz },
      feedback: { ...base.thresholds.feedback, ...override.thresholds?.feedback },
      instrument: { ...base.thresholds.instrument, ...override.thresholds?.instrument },
      animation: { ...base.thresholds.animation, ...override.thresholds?.animation },
      viewport: { ...base.thresholds.viewport, ...override.thresholds?.viewport },
    },
    defaults: {
      instrument: { ...base.defaults.instrument, ...override.defaults?.instrument },
      viewport: { ...base.defaults.viewport, ...override.defaults?.viewport },
      user: { ...base.defaults.user, ...override.defaults?.user },
    },
    quiz: {
      noteQuiz: { ...base.quiz.noteQuiz, ...override.quiz?.noteQuiz },
      intervalQuiz: { ...base.quiz.intervalQuiz, ...override.quiz?.intervalQuiz },
      shared: { ...base.quiz.shared, ...override.quiz?.shared },
    },
  };
}

/**
 * Validate and merge configuration with defaults
 * Returns merged config if valid, throws error if invalid
 */
export function validateAndMergeConfig(
  override: Partial<AppConfig>,
  throwOnError: boolean = true
): ConfigValidationResult & { config?: AppConfig } {
  const merged = mergeConfig(DEFAULT_APP_CONFIG, override);
  const result = validateAppConfig(merged);

  if (!result.valid && throwOnError) {
    const errorMessages = result.errors
      .map(e => `  - ${e.path}: ${e.message} (got: ${JSON.stringify(e.value)})`)
      .join('\n');
    throw new Error(`Configuration validation failed:\n${errorMessages}`);
  }

  return {
    ...result,
    config: result.valid ? merged : undefined,
  };
}

/**
 * Get a copy of the default configuration
 */
export function getDefaultConfig(): AppConfig {
  return JSON.parse(JSON.stringify(DEFAULT_APP_CONFIG));
}

/**
 * Clamp a value within configured thresholds
 */
export function clampToThreshold(
  value: number,
  category: 'quiz' | 'feedback' | 'instrument' | 'animation' | 'viewport',
  property: string,
  config: AppConfig = DEFAULT_APP_CONFIG
): number {
  const thresholds = config.thresholds[category] as Record<string, number>;
  
  // Find min/max properties
  const minKey = `min${property.charAt(0).toUpperCase() + property.slice(1)}`;
  const maxKey = `max${property.charAt(0).toUpperCase() + property.slice(1)}`;
  
  const min = thresholds[minKey];
  const max = thresholds[maxKey];
  
  if (min !== undefined && max !== undefined) {
    return Math.max(min, Math.min(max, value));
  }
  
  return value;
}

/**
 * Get all available interval shorthand names for configuration
 */
export const VALID_INTERVAL_NAMES = [
  // Simple intervals
  'P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'A4', 'd5', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8',
  // Augmented/diminished
  'A1', 'A2', 'A3', 'A5', 'A6', 'A7',
  'd2', 'd3', 'd4', 'd6', 'd7', 'd8',
  // Compound intervals
  'm9', 'M9', 'm10', 'M10', 'P11', 'A11', 'P12', 'm13', 'M13', 'm14', 'M14', 'P15',
] as const;

export type ValidIntervalName = typeof VALID_INTERVAL_NAMES[number];

/**
 * Validate interval names in configuration
 */
export function validateIntervalNames(intervals: string[]): { valid: boolean; invalid: string[] } {
  const invalid = intervals.filter(i => !VALID_INTERVAL_NAMES.includes(i as ValidIntervalName));
  return {
    valid: invalid.length === 0,
    invalid,
  };
}
