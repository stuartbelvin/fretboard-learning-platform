/**
 * Unit tests for Configuration Manager (APP-002)
 * 
 * Tests configuration validation, defaults, and utilities.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Types
  type AppConfig,
  type ColorConfig,
  type ThresholdConfig,
  type DefaultsConfig,
  type QuizConfig,
  type ConfigValidationError,
  type ConfigValidationResult,
  
  // Defaults
  DEFAULT_APP_CONFIG,
  DEFAULT_THRESHOLDS,
  DEFAULT_COLOR_CONFIG,
  DEFAULT_DEFAULTS_CONFIG,
  DEFAULT_QUIZ_CONFIG,
  
  // Validation functions
  validateAppConfig,
  validateColorConfig,
  validateThresholdConfig,
  validateDefaultsConfig,
  validateQuizConfig,
  
  // Utilities
  mergeConfig,
  validateAndMergeConfig,
  getDefaultConfig,
  clampToThreshold,
  validateIntervalNames,
  VALID_INTERVAL_NAMES,
} from '../../config/appConfig';

import { COLOR_PALETTES } from '../../config/colors';
import { STANDARD_TUNING } from '../../core/instruments/Fretboard';

// ============================================================================
// Default Configuration Tests
// ============================================================================

describe('Default Configuration', () => {
  describe('DEFAULT_APP_CONFIG', () => {
    it('should have a version string', () => {
      expect(DEFAULT_APP_CONFIG.version).toBeDefined();
      expect(typeof DEFAULT_APP_CONFIG.version).toBe('string');
      expect(DEFAULT_APP_CONFIG.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have all four main sections', () => {
      expect(DEFAULT_APP_CONFIG.colors).toBeDefined();
      expect(DEFAULT_APP_CONFIG.thresholds).toBeDefined();
      expect(DEFAULT_APP_CONFIG.defaults).toBeDefined();
      expect(DEFAULT_APP_CONFIG.quiz).toBeDefined();
    });

    it('should pass full validation', () => {
      const result = validateAppConfig(DEFAULT_APP_CONFIG);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('DEFAULT_THRESHOLDS', () => {
    it('should define quiz thresholds', () => {
      expect(DEFAULT_THRESHOLDS.quiz.minQuestions).toBe(1);
      expect(DEFAULT_THRESHOLDS.quiz.maxQuestions).toBe(100);
      expect(DEFAULT_THRESHOLDS.quiz.minAttempts).toBe(1);
      expect(DEFAULT_THRESHOLDS.quiz.maxAttempts).toBe(10);
    });

    it('should define feedback thresholds', () => {
      expect(DEFAULT_THRESHOLDS.feedback.correctFlashDuration).toBe(500);
      expect(DEFAULT_THRESHOLDS.feedback.incorrectFlashDuration).toBe(500);
      expect(DEFAULT_THRESHOLDS.feedback.hintPulseDuration).toBe(300);
      expect(DEFAULT_THRESHOLDS.feedback.hintPulseCount).toBe(3);
    });

    it('should define instrument thresholds', () => {
      expect(DEFAULT_THRESHOLDS.instrument.minFrets).toBe(12);
      expect(DEFAULT_THRESHOLDS.instrument.maxFrets).toBe(24);
      expect(DEFAULT_THRESHOLDS.instrument.minStrings).toBe(4);
      expect(DEFAULT_THRESHOLDS.instrument.maxStrings).toBe(12);
    });

    it('should define animation thresholds', () => {
      expect(DEFAULT_THRESHOLDS.animation.minSpeed).toBe(0.5);
      expect(DEFAULT_THRESHOLDS.animation.maxSpeed).toBe(2);
    });

    it('should define viewport thresholds', () => {
      expect(DEFAULT_THRESHOLDS.viewport.minVisibleFrets).toBe(1);
      expect(DEFAULT_THRESHOLDS.viewport.maxVisibleFrets).toBe(24);
      expect(DEFAULT_THRESHOLDS.viewport.minMobileFrets).toBe(1);
      expect(DEFAULT_THRESHOLDS.viewport.maxMobileFrets).toBe(12);
    });

    it('should have min <= max for all threshold pairs', () => {
      expect(DEFAULT_THRESHOLDS.quiz.minQuestions).toBeLessThanOrEqual(DEFAULT_THRESHOLDS.quiz.maxQuestions);
      expect(DEFAULT_THRESHOLDS.quiz.minAttempts).toBeLessThanOrEqual(DEFAULT_THRESHOLDS.quiz.maxAttempts);
      expect(DEFAULT_THRESHOLDS.instrument.minFrets).toBeLessThanOrEqual(DEFAULT_THRESHOLDS.instrument.maxFrets);
      expect(DEFAULT_THRESHOLDS.instrument.minStrings).toBeLessThanOrEqual(DEFAULT_THRESHOLDS.instrument.maxStrings);
      expect(DEFAULT_THRESHOLDS.animation.minSpeed).toBeLessThanOrEqual(DEFAULT_THRESHOLDS.animation.maxSpeed);
      expect(DEFAULT_THRESHOLDS.viewport.minVisibleFrets).toBeLessThanOrEqual(DEFAULT_THRESHOLDS.viewport.maxVisibleFrets);
    });
  });

  describe('DEFAULT_COLOR_CONFIG', () => {
    it('should have a valid palette ID', () => {
      expect(DEFAULT_COLOR_CONFIG.paletteId).toBe('default');
      const palette = COLOR_PALETTES.find(p => p.id === DEFAULT_COLOR_CONFIG.paletteId);
      expect(palette).toBeDefined();
    });

    it('should have no custom overrides by default', () => {
      expect(DEFAULT_COLOR_CONFIG.customOverrides).toBeUndefined();
    });
  });

  describe('DEFAULT_DEFAULTS_CONFIG', () => {
    it('should define instrument defaults', () => {
      expect(DEFAULT_DEFAULTS_CONFIG.instrument.stringCount).toBe(6);
      expect(DEFAULT_DEFAULTS_CONFIG.instrument.fretCount).toBe(24);
      expect(DEFAULT_DEFAULTS_CONFIG.instrument.tuning).toEqual(STANDARD_TUNING);
      expect(DEFAULT_DEFAULTS_CONFIG.instrument.tuningPreset).toBe('standard');
    });

    it('should define viewport defaults', () => {
      expect(DEFAULT_DEFAULTS_CONFIG.viewport.visibleFrets).toBe(12);
      expect(DEFAULT_DEFAULTS_CONFIG.viewport.startFret).toBe(0);
      expect(DEFAULT_DEFAULTS_CONFIG.viewport.desktopFretCount).toBe(12);
      expect(DEFAULT_DEFAULTS_CONFIG.viewport.tabletFretCount).toBe(8);
      expect(DEFAULT_DEFAULTS_CONFIG.viewport.mobileFretCount).toBe(4);
    });

    it('should define user defaults', () => {
      expect(DEFAULT_DEFAULTS_CONFIG.user.colorPaletteId).toBe('default');
      expect(DEFAULT_DEFAULTS_CONFIG.user.noteDisplay).toBe('sharps');
      expect(DEFAULT_DEFAULTS_CONFIG.user.showNoteNames).toBe(false);
      expect(DEFAULT_DEFAULTS_CONFIG.user.markerStyle).toBe('dots');
      expect(DEFAULT_DEFAULTS_CONFIG.user.soundEnabled).toBe(true);
      expect(DEFAULT_DEFAULTS_CONFIG.user.animationSpeed).toBe(1);
    });
  });

  describe('DEFAULT_QUIZ_CONFIG', () => {
    it('should define note quiz defaults', () => {
      expect(DEFAULT_QUIZ_CONFIG.noteQuiz.defaultNoteSelection).toBe('both');
    });

    it('should define interval quiz defaults', () => {
      expect(Array.isArray(DEFAULT_QUIZ_CONFIG.intervalQuiz.defaultIntervals)).toBe(true);
      expect(DEFAULT_QUIZ_CONFIG.intervalQuiz.defaultIntervals.length).toBeGreaterThan(0);
      expect(DEFAULT_QUIZ_CONFIG.intervalQuiz.allowCompoundIntervals).toBe(false);
      expect(DEFAULT_QUIZ_CONFIG.intervalQuiz.allowRootOutsideZoneForCompound).toBe(true);
    });

    it('should define shared quiz settings', () => {
      expect(DEFAULT_QUIZ_CONFIG.shared.maxAttempts).toBe(3);
      expect(DEFAULT_QUIZ_CONFIG.shared.totalQuestions).toBe(10);
      expect(DEFAULT_QUIZ_CONFIG.shared.autoAdvance).toBe(true);
      expect(DEFAULT_QUIZ_CONFIG.shared.autoAdvanceDelay).toBe(1000);
    });
  });
});

// ============================================================================
// Color Configuration Validation Tests
// ============================================================================

describe('validateColorConfig', () => {
  it('should validate a valid color config', () => {
    const errors: ConfigValidationError[] = [];
    const valid = validateColorConfig(DEFAULT_COLOR_CONFIG, errors);
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it('should reject empty palette ID', () => {
    const errors: ConfigValidationError[] = [];
    const config: ColorConfig = { paletteId: '' };
    const valid = validateColorConfig(config, errors);
    expect(valid).toBe(false);
    expect(errors.some(e => e.path === 'colors.paletteId')).toBe(true);
  });

  it('should reject unknown palette ID', () => {
    const errors: ConfigValidationError[] = [];
    const config: ColorConfig = { paletteId: 'nonexistent-palette' };
    const valid = validateColorConfig(config, errors);
    expect(valid).toBe(false);
    expect(errors.some(e => e.path === 'colors.paletteId' && e.message.includes('not found'))).toBe(true);
  });

  it('should accept all valid palette IDs', () => {
    for (const palette of COLOR_PALETTES) {
      const errors: ConfigValidationError[] = [];
      const config: ColorConfig = { paletteId: palette.id };
      const valid = validateColorConfig(config, errors);
      expect(valid).toBe(true);
    }
  });

  it('should accept custom overrides object', () => {
    const errors: ConfigValidationError[] = [];
    const config: ColorConfig = {
      paletteId: 'default',
      customOverrides: { fretboardBg: '#ffffff' },
    };
    const valid = validateColorConfig(config, errors);
    expect(valid).toBe(true);
  });

  it('should accept undefined custom overrides', () => {
    const errors: ConfigValidationError[] = [];
    const config: ColorConfig = { paletteId: 'default', customOverrides: undefined };
    const valid = validateColorConfig(config, errors);
    expect(valid).toBe(true);
  });
});

// ============================================================================
// Threshold Configuration Validation Tests
// ============================================================================

describe('validateThresholdConfig', () => {
  it('should validate default thresholds', () => {
    const errors: ConfigValidationError[] = [];
    const valid = validateThresholdConfig(DEFAULT_THRESHOLDS, errors);
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  describe('quiz thresholds', () => {
    it('should reject minQuestions < 1', () => {
      const errors: ConfigValidationError[] = [];
      const config = { ...DEFAULT_THRESHOLDS, quiz: { ...DEFAULT_THRESHOLDS.quiz, minQuestions: 0 } };
      const valid = validateThresholdConfig(config, errors);
      expect(valid).toBe(false);
      expect(errors.some(e => e.path.includes('minQuestions'))).toBe(true);
    });

    it('should reject maxQuestions > 1000', () => {
      const errors: ConfigValidationError[] = [];
      const config = { ...DEFAULT_THRESHOLDS, quiz: { ...DEFAULT_THRESHOLDS.quiz, maxQuestions: 1001 } };
      const valid = validateThresholdConfig(config, errors);
      expect(valid).toBe(false);
      expect(errors.some(e => e.path.includes('maxQuestions'))).toBe(true);
    });

    it('should reject minQuestions > maxQuestions', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_THRESHOLDS,
        quiz: { ...DEFAULT_THRESHOLDS.quiz, minQuestions: 50, maxQuestions: 10 },
      };
      const valid = validateThresholdConfig(config, errors);
      expect(valid).toBe(false);
      expect(errors.some(e => e.message.includes('minQuestions must be'))).toBe(true);
    });

    it('should reject minAttempts > maxAttempts', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_THRESHOLDS,
        quiz: { ...DEFAULT_THRESHOLDS.quiz, minAttempts: 8, maxAttempts: 5 },
      };
      const valid = validateThresholdConfig(config, errors);
      expect(valid).toBe(false);
      expect(errors.some(e => e.message.includes('minAttempts must be'))).toBe(true);
    });
  });

  describe('feedback thresholds', () => {
    it('should reject flash duration < 100ms', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_THRESHOLDS,
        feedback: { ...DEFAULT_THRESHOLDS.feedback, correctFlashDuration: 50 },
      };
      const valid = validateThresholdConfig(config, errors);
      expect(valid).toBe(false);
    });

    it('should reject flash duration > 2000ms', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_THRESHOLDS,
        feedback: { ...DEFAULT_THRESHOLDS.feedback, incorrectFlashDuration: 3000 },
      };
      const valid = validateThresholdConfig(config, errors);
      expect(valid).toBe(false);
    });

    it('should reject pulse count < 1', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_THRESHOLDS,
        feedback: { ...DEFAULT_THRESHOLDS.feedback, hintPulseCount: 0 },
      };
      const valid = validateThresholdConfig(config, errors);
      expect(valid).toBe(false);
    });
  });

  describe('instrument thresholds', () => {
    it('should reject minFrets > maxFrets', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_THRESHOLDS,
        instrument: { ...DEFAULT_THRESHOLDS.instrument, minFrets: 20, maxFrets: 15 },
      };
      const valid = validateThresholdConfig(config, errors);
      expect(valid).toBe(false);
    });

    it('should reject minStrings > maxStrings', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_THRESHOLDS,
        instrument: { ...DEFAULT_THRESHOLDS.instrument, minStrings: 10, maxStrings: 5 },
      };
      const valid = validateThresholdConfig(config, errors);
      expect(valid).toBe(false);
    });
  });

  describe('animation thresholds', () => {
    it('should reject minSpeed < 0.1', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_THRESHOLDS,
        animation: { ...DEFAULT_THRESHOLDS.animation, minSpeed: 0.05 },
      };
      const valid = validateThresholdConfig(config, errors);
      expect(valid).toBe(false);
    });

    it('should reject maxSpeed > 5', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_THRESHOLDS,
        animation: { ...DEFAULT_THRESHOLDS.animation, maxSpeed: 6 },
      };
      const valid = validateThresholdConfig(config, errors);
      expect(valid).toBe(false);
    });
  });

  describe('viewport thresholds', () => {
    it('should reject minVisibleFrets > maxVisibleFrets', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_THRESHOLDS,
        viewport: { ...DEFAULT_THRESHOLDS.viewport, minVisibleFrets: 20, maxVisibleFrets: 10 },
      };
      const valid = validateThresholdConfig(config, errors);
      expect(valid).toBe(false);
    });

    it('should reject minMobileFrets > maxMobileFrets', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_THRESHOLDS,
        viewport: { ...DEFAULT_THRESHOLDS.viewport, minMobileFrets: 10, maxMobileFrets: 5 },
      };
      const valid = validateThresholdConfig(config, errors);
      expect(valid).toBe(false);
    });
  });
});

// ============================================================================
// Defaults Configuration Validation Tests
// ============================================================================

describe('validateDefaultsConfig', () => {
  it('should validate default defaults config', () => {
    const errors: ConfigValidationError[] = [];
    const valid = validateDefaultsConfig(DEFAULT_DEFAULTS_CONFIG, DEFAULT_THRESHOLDS, errors);
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  describe('instrument defaults', () => {
    it('should reject stringCount outside thresholds', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_DEFAULTS_CONFIG,
        instrument: { ...DEFAULT_DEFAULTS_CONFIG.instrument, stringCount: 20 },
      };
      const valid = validateDefaultsConfig(config, DEFAULT_THRESHOLDS, errors);
      expect(valid).toBe(false);
    });

    it('should reject fretCount outside thresholds', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_DEFAULTS_CONFIG,
        instrument: { ...DEFAULT_DEFAULTS_CONFIG.instrument, fretCount: 50 },
      };
      const valid = validateDefaultsConfig(config, DEFAULT_THRESHOLDS, errors);
      expect(valid).toBe(false);
    });

    it('should reject empty tuning array', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_DEFAULTS_CONFIG,
        instrument: { ...DEFAULT_DEFAULTS_CONFIG.instrument, tuning: [] },
      };
      const valid = validateDefaultsConfig(config, DEFAULT_THRESHOLDS, errors);
      expect(valid).toBe(false);
    });

    it('should reject invalid tuning preset', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_DEFAULTS_CONFIG,
        instrument: { ...DEFAULT_DEFAULTS_CONFIG.instrument, tuningPreset: 'invalid' as any },
      };
      const valid = validateDefaultsConfig(config, DEFAULT_THRESHOLDS, errors);
      expect(valid).toBe(false);
    });

    it('should accept all valid tuning presets', () => {
      const presets = ['standard', 'dropD', 'openG', 'custom'] as const;
      for (const preset of presets) {
        const errors: ConfigValidationError[] = [];
        const config = {
          ...DEFAULT_DEFAULTS_CONFIG,
          instrument: { ...DEFAULT_DEFAULTS_CONFIG.instrument, tuningPreset: preset },
        };
        const valid = validateDefaultsConfig(config, DEFAULT_THRESHOLDS, errors);
        expect(valid).toBe(true);
      }
    });
  });

  describe('viewport defaults', () => {
    it('should reject visibleFrets outside thresholds', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_DEFAULTS_CONFIG,
        viewport: { ...DEFAULT_DEFAULTS_CONFIG.viewport, visibleFrets: 30 },
      };
      const valid = validateDefaultsConfig(config, DEFAULT_THRESHOLDS, errors);
      expect(valid).toBe(false);
    });

    it('should reject startFret < 0', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_DEFAULTS_CONFIG,
        viewport: { ...DEFAULT_DEFAULTS_CONFIG.viewport, startFret: -1 },
      };
      const valid = validateDefaultsConfig(config, DEFAULT_THRESHOLDS, errors);
      expect(valid).toBe(false);
    });

    it('should reject mobileFretCount outside mobile thresholds', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_DEFAULTS_CONFIG,
        viewport: { ...DEFAULT_DEFAULTS_CONFIG.viewport, mobileFretCount: 20 },
      };
      const valid = validateDefaultsConfig(config, DEFAULT_THRESHOLDS, errors);
      expect(valid).toBe(false);
    });
  });

  describe('user defaults', () => {
    it('should reject empty colorPaletteId', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_DEFAULTS_CONFIG,
        user: { ...DEFAULT_DEFAULTS_CONFIG.user, colorPaletteId: '' },
      };
      const valid = validateDefaultsConfig(config, DEFAULT_THRESHOLDS, errors);
      expect(valid).toBe(false);
    });

    it('should reject invalid noteDisplay', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_DEFAULTS_CONFIG,
        user: { ...DEFAULT_DEFAULTS_CONFIG.user, noteDisplay: 'invalid' as any },
      };
      const valid = validateDefaultsConfig(config, DEFAULT_THRESHOLDS, errors);
      expect(valid).toBe(false);
    });

    it('should accept all valid noteDisplay options', () => {
      const options = ['sharps', 'flats', 'both'] as const;
      for (const opt of options) {
        const errors: ConfigValidationError[] = [];
        const config = {
          ...DEFAULT_DEFAULTS_CONFIG,
          user: { ...DEFAULT_DEFAULTS_CONFIG.user, noteDisplay: opt },
        };
        const valid = validateDefaultsConfig(config, DEFAULT_THRESHOLDS, errors);
        expect(valid).toBe(true);
      }
    });

    it('should reject invalid markerStyle', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_DEFAULTS_CONFIG,
        user: { ...DEFAULT_DEFAULTS_CONFIG.user, markerStyle: 'invalid' as any },
      };
      const valid = validateDefaultsConfig(config, DEFAULT_THRESHOLDS, errors);
      expect(valid).toBe(false);
    });

    it('should reject animationSpeed outside thresholds', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_DEFAULTS_CONFIG,
        user: { ...DEFAULT_DEFAULTS_CONFIG.user, animationSpeed: 5 },
      };
      const valid = validateDefaultsConfig(config, DEFAULT_THRESHOLDS, errors);
      expect(valid).toBe(false);
    });

    it('should reject non-boolean showNoteNames', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_DEFAULTS_CONFIG,
        user: { ...DEFAULT_DEFAULTS_CONFIG.user, showNoteNames: 'yes' as any },
      };
      const valid = validateDefaultsConfig(config, DEFAULT_THRESHOLDS, errors);
      expect(valid).toBe(false);
    });
  });
});

// ============================================================================
// Quiz Configuration Validation Tests
// ============================================================================

describe('validateQuizConfig', () => {
  it('should validate default quiz config', () => {
    const errors: ConfigValidationError[] = [];
    const valid = validateQuizConfig(DEFAULT_QUIZ_CONFIG, DEFAULT_THRESHOLDS, errors);
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  describe('note quiz config', () => {
    it('should reject invalid defaultNoteSelection', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_QUIZ_CONFIG,
        noteQuiz: { defaultNoteSelection: 'invalid' as any },
      };
      const valid = validateQuizConfig(config, DEFAULT_THRESHOLDS, errors);
      expect(valid).toBe(false);
    });
  });

  describe('interval quiz config', () => {
    it('should reject empty defaultIntervals', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_QUIZ_CONFIG,
        intervalQuiz: { ...DEFAULT_QUIZ_CONFIG.intervalQuiz, defaultIntervals: [] },
      };
      const valid = validateQuizConfig(config, DEFAULT_THRESHOLDS, errors);
      expect(valid).toBe(false);
    });

    it('should reject non-boolean allowCompoundIntervals', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_QUIZ_CONFIG,
        intervalQuiz: { ...DEFAULT_QUIZ_CONFIG.intervalQuiz, allowCompoundIntervals: 'yes' as any },
      };
      const valid = validateQuizConfig(config, DEFAULT_THRESHOLDS, errors);
      expect(valid).toBe(false);
    });
  });

  describe('shared quiz config', () => {
    it('should reject maxAttempts outside thresholds', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_QUIZ_CONFIG,
        shared: { ...DEFAULT_QUIZ_CONFIG.shared, maxAttempts: 20 },
      };
      const valid = validateQuizConfig(config, DEFAULT_THRESHOLDS, errors);
      expect(valid).toBe(false);
    });

    it('should reject totalQuestions outside thresholds', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_QUIZ_CONFIG,
        shared: { ...DEFAULT_QUIZ_CONFIG.shared, totalQuestions: 200 },
      };
      const valid = validateQuizConfig(config, DEFAULT_THRESHOLDS, errors);
      expect(valid).toBe(false);
    });

    it('should reject autoAdvanceDelay outside thresholds', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_QUIZ_CONFIG,
        shared: { ...DEFAULT_QUIZ_CONFIG.shared, autoAdvanceDelay: 50 },
      };
      const valid = validateQuizConfig(config, DEFAULT_THRESHOLDS, errors);
      expect(valid).toBe(false);
    });

    it('should reject non-boolean autoAdvance', () => {
      const errors: ConfigValidationError[] = [];
      const config = {
        ...DEFAULT_QUIZ_CONFIG,
        shared: { ...DEFAULT_QUIZ_CONFIG.shared, autoAdvance: 1 as any },
      };
      const valid = validateQuizConfig(config, DEFAULT_THRESHOLDS, errors);
      expect(valid).toBe(false);
    });
  });
});

// ============================================================================
// Full Config Validation Tests
// ============================================================================

describe('validateAppConfig', () => {
  it('should validate complete default config', () => {
    const result = validateAppConfig(DEFAULT_APP_CONFIG);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing version', () => {
    const config = { ...DEFAULT_APP_CONFIG, version: '' };
    const result = validateAppConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.path === 'version')).toBe(true);
  });

  it('should collect errors from all sections', () => {
    const config = {
      ...DEFAULT_APP_CONFIG,
      colors: { paletteId: '' },
      thresholds: { ...DEFAULT_THRESHOLDS, quiz: { ...DEFAULT_THRESHOLDS.quiz, minQuestions: 0 } },
      defaults: { ...DEFAULT_DEFAULTS_CONFIG, user: { ...DEFAULT_DEFAULTS_CONFIG.user, noteDisplay: 'invalid' as any } },
      quiz: { ...DEFAULT_QUIZ_CONFIG, shared: { ...DEFAULT_QUIZ_CONFIG.shared, maxAttempts: 100 } },
    };
    const result = validateAppConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });

  it('should return error details with path, message, value, expected', () => {
    const config = { ...DEFAULT_APP_CONFIG, colors: { paletteId: '' } };
    const result = validateAppConfig(config);
    expect(result.errors[0]).toHaveProperty('path');
    expect(result.errors[0]).toHaveProperty('message');
    expect(result.errors[0]).toHaveProperty('value');
    expect(result.errors[0]).toHaveProperty('expected');
  });
});

// ============================================================================
// Configuration Utility Tests
// ============================================================================

describe('mergeConfig', () => {
  it('should return default config when no override provided', () => {
    const merged = mergeConfig(DEFAULT_APP_CONFIG, {});
    expect(merged.version).toBe(DEFAULT_APP_CONFIG.version);
    expect(merged.colors.paletteId).toBe(DEFAULT_APP_CONFIG.colors.paletteId);
  });

  it('should override top-level properties', () => {
    const merged = mergeConfig(DEFAULT_APP_CONFIG, { version: '2.0.0' });
    expect(merged.version).toBe('2.0.0');
  });

  it('should override nested properties', () => {
    const merged = mergeConfig(DEFAULT_APP_CONFIG, {
      colors: { paletteId: 'warm' },
    });
    expect(merged.colors.paletteId).toBe('warm');
  });

  it('should deep merge threshold overrides', () => {
    const merged = mergeConfig(DEFAULT_APP_CONFIG, {
      thresholds: { quiz: { maxQuestions: 50 } },
    });
    expect(merged.thresholds.quiz.maxQuestions).toBe(50);
    expect(merged.thresholds.quiz.minQuestions).toBe(DEFAULT_THRESHOLDS.quiz.minQuestions);
  });

  it('should deep merge defaults overrides', () => {
    const merged = mergeConfig(DEFAULT_APP_CONFIG, {
      defaults: { user: { animationSpeed: 1.5 } },
    });
    expect(merged.defaults.user.animationSpeed).toBe(1.5);
    expect(merged.defaults.user.noteDisplay).toBe(DEFAULT_DEFAULTS_CONFIG.user.noteDisplay);
  });

  it('should deep merge quiz overrides', () => {
    const merged = mergeConfig(DEFAULT_APP_CONFIG, {
      quiz: { shared: { totalQuestions: 20 } },
    });
    expect(merged.quiz.shared.totalQuestions).toBe(20);
    expect(merged.quiz.shared.maxAttempts).toBe(DEFAULT_QUIZ_CONFIG.shared.maxAttempts);
  });

  it('should merge custom color overrides', () => {
    const merged = mergeConfig(DEFAULT_APP_CONFIG, {
      colors: { paletteId: 'default', customOverrides: { fretboardBg: '#ff0000' } },
    });
    expect(merged.colors.customOverrides?.fretboardBg).toBe('#ff0000');
  });
});

describe('validateAndMergeConfig', () => {
  it('should return valid result for valid override', () => {
    const result = validateAndMergeConfig({ version: '1.1.0' });
    expect(result.valid).toBe(true);
    expect(result.config).toBeDefined();
    expect(result.config?.version).toBe('1.1.0');
  });

  it('should throw on invalid config when throwOnError is true', () => {
    expect(() => {
      validateAndMergeConfig({ colors: { paletteId: '' } }, true);
    }).toThrow();
  });

  it('should not throw on invalid config when throwOnError is false', () => {
    const result = validateAndMergeConfig({ colors: { paletteId: '' } }, false);
    expect(result.valid).toBe(false);
    expect(result.config).toBeUndefined();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should include detailed error messages', () => {
    try {
      validateAndMergeConfig({ colors: { paletteId: '' } }, true);
    } catch (error: any) {
      expect(error.message).toContain('Configuration validation failed');
      expect(error.message).toContain('colors.paletteId');
    }
  });
});

describe('getDefaultConfig', () => {
  it('should return a copy of default config', () => {
    const config = getDefaultConfig();
    expect(config).toEqual(DEFAULT_APP_CONFIG);
    expect(config).not.toBe(DEFAULT_APP_CONFIG);
  });

  it('should return independent copies', () => {
    const config1 = getDefaultConfig();
    const config2 = getDefaultConfig();
    config1.version = '2.0.0';
    expect(config2.version).toBe(DEFAULT_APP_CONFIG.version);
  });
});

describe('clampToThreshold', () => {
  it('should clamp quiz attempts', () => {
    // The function looks for minAttempts/maxAttempts based on 'attempts' property
    expect(clampToThreshold(15, 'quiz', 'attempts')).toBe(10); // maxAttempts = 10
    expect(clampToThreshold(0, 'quiz', 'attempts')).toBe(1); // minAttempts = 1
    expect(clampToThreshold(5, 'quiz', 'attempts')).toBe(5);
  });

  it('should clamp animation speed', () => {
    expect(clampToThreshold(3, 'animation', 'speed')).toBe(2); // maxSpeed = 2
    expect(clampToThreshold(0.3, 'animation', 'speed')).toBe(0.5); // minSpeed = 0.5
    expect(clampToThreshold(1.5, 'animation', 'speed')).toBe(1.5);
  });

  it('should clamp viewport frets', () => {
    expect(clampToThreshold(30, 'viewport', 'visibleFrets')).toBe(24); // maxVisibleFrets = 24
    expect(clampToThreshold(0, 'viewport', 'visibleFrets')).toBe(1); // minVisibleFrets = 1
  });

  it('should clamp instrument values', () => {
    expect(clampToThreshold(30, 'instrument', 'frets')).toBe(24); // maxFrets = 24
    expect(clampToThreshold(10, 'instrument', 'frets')).toBe(12); // minFrets = 12
    expect(clampToThreshold(20, 'instrument', 'strings')).toBe(12); // maxStrings = 12
    expect(clampToThreshold(2, 'instrument', 'strings')).toBe(4); // minStrings = 4
  });

  it('should return value unchanged when no matching threshold', () => {
    expect(clampToThreshold(100, 'quiz', 'nonexistent')).toBe(100);
  });
});

// ============================================================================
// Interval Names Validation Tests
// ============================================================================

describe('validateIntervalNames', () => {
  it('should validate all default intervals', () => {
    const result = validateIntervalNames(DEFAULT_QUIZ_CONFIG.intervalQuiz.defaultIntervals);
    expect(result.valid).toBe(true);
    expect(result.invalid).toHaveLength(0);
  });

  it('should accept all valid interval names', () => {
    const result = validateIntervalNames([...VALID_INTERVAL_NAMES]);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid interval names', () => {
    const result = validateIntervalNames(['P1', 'invalid', 'X5']);
    expect(result.valid).toBe(false);
    expect(result.invalid).toContain('invalid');
    expect(result.invalid).toContain('X5');
  });

  it('should include all simple intervals', () => {
    const simpleIntervals = ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'A4', 'd5', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];
    for (const interval of simpleIntervals) {
      expect(VALID_INTERVAL_NAMES).toContain(interval);
    }
  });

  it('should include compound intervals', () => {
    const compoundIntervals = ['m9', 'M9', 'm10', 'M10', 'P11', 'A11', 'P12', 'm13', 'M13', 'm14', 'M14', 'P15'];
    for (const interval of compoundIntervals) {
      expect(VALID_INTERVAL_NAMES).toContain(interval);
    }
  });
});

// ============================================================================
// Edge Cases and Type Validation Tests
// ============================================================================

describe('Edge Cases', () => {
  it('should handle NaN values in number validation', () => {
    const errors: ConfigValidationError[] = [];
    const config = {
      ...DEFAULT_THRESHOLDS,
      quiz: { ...DEFAULT_THRESHOLDS.quiz, minQuestions: NaN },
    };
    const valid = validateThresholdConfig(config, errors);
    expect(valid).toBe(false);
  });

  it('should handle non-string palette ID', () => {
    const errors: ConfigValidationError[] = [];
    const config: ColorConfig = { paletteId: 123 as any };
    const valid = validateColorConfig(config, errors);
    expect(valid).toBe(false);
  });

  it('should handle non-array tuning', () => {
    const errors: ConfigValidationError[] = [];
    const config = {
      ...DEFAULT_DEFAULTS_CONFIG,
      instrument: { ...DEFAULT_DEFAULTS_CONFIG.instrument, tuning: 'not an array' as any },
    };
    const valid = validateDefaultsConfig(config, DEFAULT_THRESHOLDS, errors);
    expect(valid).toBe(false);
  });

  it('should handle non-array defaultIntervals', () => {
    const errors: ConfigValidationError[] = [];
    const config = {
      ...DEFAULT_QUIZ_CONFIG,
      intervalQuiz: { ...DEFAULT_QUIZ_CONFIG.intervalQuiz, defaultIntervals: 'not an array' as any },
    };
    const valid = validateQuizConfig(config, DEFAULT_THRESHOLDS, errors);
    expect(valid).toBe(false);
  });
});

describe('ConfigValidationResult', () => {
  it('should have correct structure for valid config', () => {
    const result = validateAppConfig(DEFAULT_APP_CONFIG);
    expect(result).toHaveProperty('valid', true);
    expect(result).toHaveProperty('errors');
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it('should have correct structure for invalid config', () => {
    const result = validateAppConfig({ ...DEFAULT_APP_CONFIG, version: '' });
    expect(result).toHaveProperty('valid', false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toHaveProperty('path');
    expect(result.errors[0]).toHaveProperty('message');
    expect(result.errors[0]).toHaveProperty('value');
    expect(result.errors[0]).toHaveProperty('expected');
  });
});

describe('Integration - Full Config Override', () => {
  it('should handle comprehensive config override', () => {
    const override: Partial<AppConfig> = {
      version: '1.1.0',
      colors: { paletteId: 'warm' },
      thresholds: {
        ...DEFAULT_THRESHOLDS,
        quiz: { ...DEFAULT_THRESHOLDS.quiz, maxQuestions: 50 },
        feedback: { ...DEFAULT_THRESHOLDS.feedback, correctFlashDuration: 600 },
      },
      defaults: {
        ...DEFAULT_DEFAULTS_CONFIG,
        viewport: { ...DEFAULT_DEFAULTS_CONFIG.viewport, mobileFretCount: 5 },
      },
      quiz: {
        ...DEFAULT_QUIZ_CONFIG,
        shared: { ...DEFAULT_QUIZ_CONFIG.shared, totalQuestions: 15 },
      },
    };

    const result = validateAndMergeConfig(override, false);
    expect(result.valid).toBe(true);
    expect(result.config?.version).toBe('1.1.0');
    expect(result.config?.colors.paletteId).toBe('warm');
    expect(result.config?.thresholds.quiz.maxQuestions).toBe(50);
    expect(result.config?.thresholds.feedback.correctFlashDuration).toBe(600);
    expect(result.config?.defaults.viewport.mobileFretCount).toBe(5);
    expect(result.config?.quiz.shared.totalQuestions).toBe(15);
  });

  it('should preserve unmodified values in override', () => {
    const override: Partial<AppConfig> = {
      quiz: { shared: { totalQuestions: 20 } } as any,
    };

    const result = validateAndMergeConfig(override, false);
    expect(result.valid).toBe(true);
    // Check that other quiz settings are preserved
    expect(result.config?.quiz.noteQuiz.defaultNoteSelection).toBe(DEFAULT_QUIZ_CONFIG.noteQuiz.defaultNoteSelection);
    expect(result.config?.quiz.intervalQuiz.allowCompoundIntervals).toBe(DEFAULT_QUIZ_CONFIG.intervalQuiz.allowCompoundIntervals);
    expect(result.config?.quiz.shared.maxAttempts).toBe(DEFAULT_QUIZ_CONFIG.shared.maxAttempts);
  });
});
