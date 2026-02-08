/**
 * Instrument Configuration Tests (APP-003)
 * 
 * Comprehensive unit tests for the Instrument class and related utilities.
 * Tests cover:
 * - Instrument construction and configuration
 * - Tuning presets and custom tunings
 * - Dynamic instrument switching
 * - Different tunings generate correct notes
 * - Serialization/deserialization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Instrument,
  TUNING_PRESETS,
  INSTRUMENT_DEFINITIONS,
  getTuningPreset,
  getTuningPresetsForInstrument,
  getInstrumentDefinition,
  validateTuning,
  validateFretCount,
  createCustomTuning,
  createDefaultInstrument,
  // Tuning constants from Instrument module
  DROP_C_TUNING,
  DADGAD_TUNING,
  OPEN_D_TUNING,
  GUITAR_7_STANDARD_TUNING,
  GUITAR_7_DROP_A_TUNING,
  GUITAR_8_STANDARD_TUNING,
  BASS_4_STANDARD_TUNING,
  BASS_4_DROP_D_TUNING,
  BASS_5_STANDARD_TUNING,
  BASS_6_STANDARD_TUNING,
  UKULELE_STANDARD_TUNING,
  UKULELE_BARITONE_TUNING,
} from '../../core/instruments/Instrument';
import type {
  InstrumentType,
  TuningPresetId,
} from '../../core/instruments/Instrument';
import { 
  STANDARD_TUNING, 
  DROP_D_TUNING, 
  OPEN_G_TUNING 
} from '../../core/instruments/Fretboard';

// ============================================================================
// Tuning Constants Tests
// ============================================================================

describe('Tuning Constants', () => {
  describe('STANDARD_TUNING (imported from Fretboard)', () => {
    it('should have 6 strings', () => {
      expect(STANDARD_TUNING).toHaveLength(6);
    });
  });

  describe('6-String Guitar Tunings', () => {
    it('should define DROP_D_TUNING correctly', () => {
      expect(DROP_D_TUNING).toHaveLength(6);
      expect(DROP_D_TUNING[5].pitchClass).toBe('D'); // Low D
      expect(DROP_D_TUNING[5].octave).toBe(2);
    });

    it('should define OPEN_G_TUNING correctly', () => {
      expect(OPEN_G_TUNING).toHaveLength(6);
      expect(OPEN_G_TUNING[0].pitchClass).toBe('D'); // High D
      expect(OPEN_G_TUNING[5].pitchClass).toBe('D'); // Low D
    });

    it('should define DROP_C_TUNING correctly', () => {
      expect(DROP_C_TUNING).toHaveLength(6);
      expect(DROP_C_TUNING[5].pitchClass).toBe('C'); // Low C
      expect(DROP_C_TUNING[5].octave).toBe(2);
    });

    it('should define DADGAD_TUNING correctly', () => {
      expect(DADGAD_TUNING).toHaveLength(6);
      expect(DADGAD_TUNING[0].pitchClass).toBe('D'); // High D
      expect(DADGAD_TUNING[5].pitchClass).toBe('D'); // Low D
    });

    it('should define OPEN_D_TUNING correctly', () => {
      expect(OPEN_D_TUNING).toHaveLength(6);
      expect(OPEN_D_TUNING[2].pitchClass).toBe('F#'); // F# on string 3
    });
  });

  describe('7-String Guitar Tunings', () => {
    it('should define GUITAR_7_STANDARD_TUNING with 7 strings', () => {
      expect(GUITAR_7_STANDARD_TUNING).toHaveLength(7);
      expect(GUITAR_7_STANDARD_TUNING[6].pitchClass).toBe('B'); // Low B
      expect(GUITAR_7_STANDARD_TUNING[6].octave).toBe(1);
    });

    it('should define GUITAR_7_DROP_A_TUNING with dropped low A', () => {
      expect(GUITAR_7_DROP_A_TUNING).toHaveLength(7);
      expect(GUITAR_7_DROP_A_TUNING[6].pitchClass).toBe('A'); // Dropped A
      expect(GUITAR_7_DROP_A_TUNING[6].octave).toBe(1);
    });
  });

  describe('8-String Guitar Tunings', () => {
    it('should define GUITAR_8_STANDARD_TUNING with 8 strings', () => {
      expect(GUITAR_8_STANDARD_TUNING).toHaveLength(8);
      expect(GUITAR_8_STANDARD_TUNING[7].pitchClass).toBe('F#'); // Low F#
      expect(GUITAR_8_STANDARD_TUNING[7].octave).toBe(1);
    });
  });

  describe('Bass Tunings', () => {
    it('should define BASS_4_STANDARD_TUNING with 4 strings', () => {
      expect(BASS_4_STANDARD_TUNING).toHaveLength(4);
      expect(BASS_4_STANDARD_TUNING[0].pitchClass).toBe('G'); // High G
      expect(BASS_4_STANDARD_TUNING[3].pitchClass).toBe('E'); // Low E
    });

    it('should define BASS_4_DROP_D_TUNING with dropped D', () => {
      expect(BASS_4_DROP_D_TUNING).toHaveLength(4);
      expect(BASS_4_DROP_D_TUNING[3].pitchClass).toBe('D'); // Dropped D
    });

    it('should define BASS_5_STANDARD_TUNING with 5 strings', () => {
      expect(BASS_5_STANDARD_TUNING).toHaveLength(5);
      expect(BASS_5_STANDARD_TUNING[4].pitchClass).toBe('B'); // Low B
      expect(BASS_5_STANDARD_TUNING[4].octave).toBe(0);
    });

    it('should define BASS_6_STANDARD_TUNING with 6 strings', () => {
      expect(BASS_6_STANDARD_TUNING).toHaveLength(6);
      expect(BASS_6_STANDARD_TUNING[0].pitchClass).toBe('C'); // High C
      expect(BASS_6_STANDARD_TUNING[5].pitchClass).toBe('B'); // Low B
    });
  });

  describe('Ukulele Tunings', () => {
    it('should define UKULELE_STANDARD_TUNING with 4 strings', () => {
      expect(UKULELE_STANDARD_TUNING).toHaveLength(4);
      expect(UKULELE_STANDARD_TUNING[0].pitchClass).toBe('A'); // High A
      expect(UKULELE_STANDARD_TUNING[3].pitchClass).toBe('G'); // Reentrant G
    });

    it('should define UKULELE_BARITONE_TUNING like guitar top 4', () => {
      expect(UKULELE_BARITONE_TUNING).toHaveLength(4);
      expect(UKULELE_BARITONE_TUNING[0].pitchClass).toBe('E');
      expect(UKULELE_BARITONE_TUNING[1].pitchClass).toBe('B');
      expect(UKULELE_BARITONE_TUNING[2].pitchClass).toBe('G');
      expect(UKULELE_BARITONE_TUNING[3].pitchClass).toBe('D');
    });
  });
});

// ============================================================================
// Tuning Presets Tests
// ============================================================================

describe('TUNING_PRESETS', () => {
  it('should have all expected presets', () => {
    const expectedPresets: TuningPresetId[] = [
      'guitar-standard',
      'guitar-drop-d',
      'guitar-open-g',
      'guitar-drop-c',
      'guitar-dadgad',
      'guitar-open-d',
      'guitar-7-standard',
      'guitar-7-drop-a',
      'guitar-8-standard',
      'bass-4-standard',
      'bass-4-drop-d',
      'bass-5-standard',
      'bass-6-standard',
      'ukulele-standard',
      'ukulele-baritone',
      'custom',
    ];

    for (const presetId of expectedPresets) {
      expect(TUNING_PRESETS.find(p => p.id === presetId)).toBeDefined();
    }
  });

  it('should have unique IDs', () => {
    const ids = TUNING_PRESETS.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have non-empty names and descriptions', () => {
    for (const preset of TUNING_PRESETS) {
      expect(preset.name.length).toBeGreaterThan(0);
      expect(preset.description.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// Instrument Definitions Tests
// ============================================================================

describe('INSTRUMENT_DEFINITIONS', () => {
  it('should have all expected instrument types', () => {
    const expectedTypes: InstrumentType[] = [
      'guitar-6',
      'guitar-7',
      'guitar-8',
      'bass-4',
      'bass-5',
      'bass-6',
      'ukulele',
      'custom',
    ];

    for (const type of expectedTypes) {
      expect(INSTRUMENT_DEFINITIONS.find(d => d.type === type)).toBeDefined();
    }
  });

  it('should have valid fret ranges', () => {
    for (const def of INSTRUMENT_DEFINITIONS) {
      expect(def.minFrets).toBeLessThanOrEqual(def.maxFrets);
      expect(def.minFrets).toBeGreaterThan(0);
    }
  });

  it('should have default fret count within range', () => {
    for (const def of INSTRUMENT_DEFINITIONS) {
      expect(def.fretCount).toBeGreaterThanOrEqual(def.minFrets);
      expect(def.fretCount).toBeLessThanOrEqual(def.maxFrets);
    }
  });

  it('should have valid string counts', () => {
    expect(getInstrumentDefinition('guitar-6')?.stringCount).toBe(6);
    expect(getInstrumentDefinition('guitar-7')?.stringCount).toBe(7);
    expect(getInstrumentDefinition('guitar-8')?.stringCount).toBe(8);
    expect(getInstrumentDefinition('bass-4')?.stringCount).toBe(4);
    expect(getInstrumentDefinition('bass-5')?.stringCount).toBe(5);
    expect(getInstrumentDefinition('bass-6')?.stringCount).toBe(6);
    expect(getInstrumentDefinition('ukulele')?.stringCount).toBe(4);
  });
});

// ============================================================================
// Utility Functions Tests
// ============================================================================

describe('Utility Functions', () => {
  describe('getTuningPreset', () => {
    it('should return preset for valid ID', () => {
      const preset = getTuningPreset('guitar-standard');
      expect(preset).toBeDefined();
      expect(preset?.name).toBe('Standard');
    });

    it('should return undefined for invalid ID', () => {
      const preset = getTuningPreset('invalid' as TuningPresetId);
      expect(preset).toBeUndefined();
    });
  });

  describe('getTuningPresetsForInstrument', () => {
    it('should return guitar presets for guitar-6', () => {
      const presets = getTuningPresetsForInstrument('guitar-6');
      expect(presets.length).toBeGreaterThan(0);
      expect(presets.some(p => p.id === 'guitar-standard')).toBe(true);
      expect(presets.some(p => p.id === 'guitar-drop-d')).toBe(true);
    });

    it('should return bass presets for bass-4', () => {
      const presets = getTuningPresetsForInstrument('bass-4');
      expect(presets.length).toBeGreaterThan(0);
      expect(presets.some(p => p.id === 'bass-4-standard')).toBe(true);
    });

    it('should always include custom preset', () => {
      const presets = getTuningPresetsForInstrument('guitar-6');
      expect(presets.some(p => p.id === 'custom')).toBe(true);
    });
  });

  describe('getInstrumentDefinition', () => {
    it('should return definition for valid type', () => {
      const def = getInstrumentDefinition('guitar-6');
      expect(def).toBeDefined();
      expect(def?.stringCount).toBe(6);
    });

    it('should return undefined for invalid type', () => {
      const def = getInstrumentDefinition('invalid' as InstrumentType);
      expect(def).toBeUndefined();
    });
  });

  describe('validateTuning', () => {
    it('should return true for matching string count', () => {
      expect(validateTuning(STANDARD_TUNING, 6)).toBe(true);
    });

    it('should return false for mismatched string count', () => {
      expect(validateTuning(STANDARD_TUNING, 7)).toBe(false);
    });
  });

  describe('validateFretCount', () => {
    it('should return true for valid fret count', () => {
      expect(validateFretCount(24, 'guitar-6')).toBe(true);
      expect(validateFretCount(12, 'guitar-6')).toBe(true);
    });

    it('should return false for fret count below minimum', () => {
      expect(validateFretCount(5, 'guitar-6')).toBe(false);
    });

    it('should return false for fret count above maximum', () => {
      expect(validateFretCount(30, 'guitar-6')).toBe(false);
    });

    it('should return false for invalid instrument type', () => {
      expect(validateFretCount(24, 'invalid' as InstrumentType)).toBe(false);
    });
  });

  describe('createCustomTuning', () => {
    it('should create tuning from note strings', () => {
      const tuning = createCustomTuning(['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);
      expect(tuning).toHaveLength(6);
      expect(tuning[0].pitchClass).toBe('E');
      expect(tuning[0].octave).toBe(4);
    });

    it('should handle sharp notes', () => {
      const tuning = createCustomTuning(['F#3']);
      expect(tuning[0].pitchClass).toBe('F#');
      expect(tuning[0].octave).toBe(3);
    });

    it('should handle flat notes', () => {
      const tuning = createCustomTuning(['Bb2']);
      expect(tuning[0].pitchClass).toBe('Bb');
      expect(tuning[0].octave).toBe(2);
    });

    it('should throw for invalid note strings', () => {
      expect(() => createCustomTuning(['X4'])).toThrow('Invalid note string');
      expect(() => createCustomTuning(['E'])).toThrow('Invalid note string');
    });
  });

  describe('createDefaultInstrument', () => {
    it('should create a 6-string guitar in standard tuning', () => {
      const instrument = createDefaultInstrument();
      expect(instrument.type).toBe('guitar-6');
      expect(instrument.stringCount).toBe(6);
      expect(instrument.tuningPresetId).toBe('guitar-standard');
    });
  });
});

// ============================================================================
// Instrument Class - Construction Tests
// ============================================================================

describe('Instrument Class', () => {
  describe('constructor', () => {
    it('should create default 6-string guitar', () => {
      const instrument = new Instrument();
      expect(instrument.type).toBe('guitar-6');
      expect(instrument.stringCount).toBe(6);
      expect(instrument.fretCount).toBe(24);
      expect(instrument.tuningPresetId).toBe('guitar-standard');
    });

    it('should create instrument with specified type', () => {
      const instrument = new Instrument('bass-4');
      expect(instrument.type).toBe('bass-4');
      expect(instrument.stringCount).toBe(4);
    });

    it('should create instrument with specified tuning preset', () => {
      const instrument = new Instrument('guitar-6', 'guitar-drop-d');
      expect(instrument.tuningPresetId).toBe('guitar-drop-d');
      expect(instrument.tuning[5].pitchClass).toBe('D');
    });

    it('should create instrument with specified fret count', () => {
      const instrument = new Instrument('guitar-6', undefined, 22);
      expect(instrument.fretCount).toBe(22);
    });

    it('should clamp fret count to valid range', () => {
      const instrument = new Instrument('guitar-6', undefined, 100);
      expect(instrument.fretCount).toBe(24); // Max for guitar
    });

    it('should throw for unknown instrument type', () => {
      expect(() => new Instrument('invalid' as InstrumentType)).toThrow('Unknown instrument type');
    });
  });

  describe('getters', () => {
    let instrument: Instrument;

    beforeEach(() => {
      instrument = new Instrument('guitar-6', 'guitar-standard', 22);
    });

    it('should return correct type', () => {
      expect(instrument.type).toBe('guitar-6');
    });

    it('should return correct definition', () => {
      expect(instrument.definition.name).toBe('6-String Guitar');
    });

    it('should return correct string count', () => {
      expect(instrument.stringCount).toBe(6);
    });

    it('should return correct fret count', () => {
      expect(instrument.fretCount).toBe(22);
    });

    it('should return copy of tuning', () => {
      const tuning = instrument.tuning;
      tuning[0] = { pitchClass: 'A', octave: 5 };
      expect(instrument.tuning[0].pitchClass).toBe('E'); // Unchanged
    });

    it('should return correct tuning preset ID', () => {
      expect(instrument.tuningPresetId).toBe('guitar-standard');
    });

    it('should return tuning preset object', () => {
      const preset = instrument.tuningPreset;
      expect(preset?.id).toBe('guitar-standard');
    });

    it('should return correct name', () => {
      expect(instrument.name).toBe('6-String Guitar');
    });

    it('should return complete configuration', () => {
      const config = instrument.configuration;
      expect(config.type).toBe('guitar-6');
      expect(config.tuningPresetId).toBe('guitar-standard');
      expect(config.fretCount).toBe(22);
    });
  });
});

// ============================================================================
// Instrument Class - Fretboard Management Tests
// ============================================================================

describe('Instrument Fretboard Management', () => {
  it('should lazily create fretboard', () => {
    const instrument = new Instrument();
    const fretboard = instrument.fretboard;
    expect(fretboard.getTotalNoteCount()).toBeGreaterThan(0);
  });

  it('should cache fretboard instance', () => {
    const instrument = new Instrument();
    const fretboard1 = instrument.fretboard;
    const fretboard2 = instrument.fretboard;
    expect(fretboard1).toBe(fretboard2);
  });

  it('should create fretboard with correct configuration', () => {
    const instrument = new Instrument('guitar-6', 'guitar-standard', 22);
    const fretboard = instrument.fretboard;
    expect(fretboard.config.fretCount).toBe(22);
    expect(fretboard.config.stringCount).toBe(6);
  });

  it('should invalidate fretboard on tuning change', () => {
    const instrument = new Instrument();
    const fretboard1 = instrument.fretboard;
    instrument.setTuningPreset('guitar-drop-d');
    const fretboard2 = instrument.fretboard;
    expect(fretboard1).not.toBe(fretboard2);
  });

  it('should invalidate fretboard on fret count change', () => {
    const instrument = new Instrument();
    const fretboard1 = instrument.fretboard;
    instrument.setFretCount(20);
    const fretboard2 = instrument.fretboard;
    expect(fretboard1).not.toBe(fretboard2);
  });
});

// ============================================================================
// Instrument Class - Tuning Configuration Tests
// ============================================================================

describe('Instrument Tuning Configuration', () => {
  describe('setTuningPreset', () => {
    it('should apply valid preset', () => {
      const instrument = new Instrument();
      const result = instrument.setTuningPreset('guitar-drop-d');
      expect(result).toBe(true);
      expect(instrument.tuningPresetId).toBe('guitar-drop-d');
    });

    it('should return false for invalid preset', () => {
      const instrument = new Instrument();
      const result = instrument.setTuningPreset('invalid' as TuningPresetId);
      expect(result).toBe(false);
    });

    it('should return false for incompatible preset', () => {
      const instrument = new Instrument('guitar-6');
      const result = instrument.setTuningPreset('bass-4-standard');
      expect(result).toBe(false);
    });
  });

  describe('setCustomTuning', () => {
    it('should apply valid custom tuning', () => {
      const instrument = new Instrument();
      const customTuning = createCustomTuning(['D4', 'A3', 'F3', 'C3', 'G2', 'C2']);
      const result = instrument.setCustomTuning(customTuning);
      expect(result).toBe(true);
      expect(instrument.tuningPresetId).toBe('custom');
      expect(instrument.tuning[0].pitchClass).toBe('D');
    });

    it('should return false for wrong string count', () => {
      const instrument = new Instrument('guitar-6');
      const wrongTuning = createCustomTuning(['E4', 'B3', 'G3', 'D3']); // Only 4 strings
      const result = instrument.setCustomTuning(wrongTuning);
      expect(result).toBe(false);
    });
  });
});

// ============================================================================
// Instrument Class - Fret Count Configuration Tests
// ============================================================================

describe('Instrument Fret Count Configuration', () => {
  describe('setFretCount', () => {
    it('should apply valid fret count', () => {
      const instrument = new Instrument();
      const result = instrument.setFretCount(20);
      expect(result).toBe(true);
      expect(instrument.fretCount).toBe(20);
    });

    it('should return false for invalid fret count', () => {
      const instrument = new Instrument('guitar-6');
      const result = instrument.setFretCount(5);
      expect(result).toBe(false);
      expect(instrument.fretCount).not.toBe(5);
    });
  });
});

// ============================================================================
// Instrument Class - Dynamic Instrument Switching Tests
// ============================================================================

describe('Instrument Dynamic Switching', () => {
  describe('switchInstrument', () => {
    it('should switch to different instrument type', () => {
      const instrument = new Instrument('guitar-6');
      const result = instrument.switchInstrument('bass-4');
      expect(result).toBe(true);
      expect(instrument.type).toBe('bass-4');
      expect(instrument.stringCount).toBe(4);
    });

    it('should reset tuning to new instrument default', () => {
      const instrument = new Instrument('guitar-6', 'guitar-drop-d');
      instrument.switchInstrument('bass-4');
      expect(instrument.tuningPresetId).toBe('bass-4-standard');
    });

    it('should preserve compatible tuning if requested', () => {
      const instrument = new Instrument('bass-4');
      instrument.switchInstrument('ukulele', true);
      // Both have 4 strings, tuning should be marked as custom
      expect(instrument.tuningPresetId).toBe('custom');
    });

    it('should not preserve incompatible tuning', () => {
      const instrument = new Instrument('guitar-6');
      instrument.switchInstrument('bass-4', true);
      // Different string count, should use default
      expect(instrument.tuningPresetId).toBe('bass-4-standard');
    });

    it('should clamp fret count to new instrument limits', () => {
      const instrument = new Instrument('custom', undefined, 30);
      instrument.switchInstrument('ukulele');
      expect(instrument.fretCount).toBeLessThanOrEqual(20); // Ukulele max
    });

    it('should return false for invalid instrument type', () => {
      const instrument = new Instrument();
      const result = instrument.switchInstrument('invalid' as InstrumentType);
      expect(result).toBe(false);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset to instrument defaults', () => {
      const instrument = new Instrument('guitar-6');
      instrument.setTuningPreset('guitar-drop-d');
      instrument.setFretCount(20);
      instrument.resetToDefaults();
      expect(instrument.tuningPresetId).toBe('guitar-standard');
      expect(instrument.fretCount).toBe(24);
    });
  });
});

// ============================================================================
// Instrument Class - Query Methods Tests
// ============================================================================

describe('Instrument Query Methods', () => {
  it('should return compatible tuning presets', () => {
    const instrument = new Instrument('guitar-6');
    const presets = instrument.getCompatibleTuningPresets();
    expect(presets.length).toBeGreaterThan(0);
    expect(presets.some(p => p.id === 'guitar-standard')).toBe(true);
  });

  it('should validate tuning compatibility', () => {
    const instrument = new Instrument('guitar-6');
    expect(instrument.isTuningCompatible(STANDARD_TUNING)).toBe(true);
    expect(instrument.isTuningCompatible(BASS_4_STANDARD_TUNING)).toBe(false);
  });

  it('should validate fret count', () => {
    const instrument = new Instrument('guitar-6');
    expect(instrument.isFretCountValid(24)).toBe(true);
    expect(instrument.isFretCountValid(5)).toBe(false);
  });

  it('should return tuning string', () => {
    const instrument = new Instrument('guitar-6', 'guitar-standard');
    const tuningString = instrument.getTuningString();
    expect(tuningString).toBe('E-A-D-G-B-E');
  });
});

// ============================================================================
// Instrument Class - Serialization Tests
// ============================================================================

describe('Instrument Serialization', () => {
  describe('toJSON', () => {
    it('should serialize to config object', () => {
      const instrument = new Instrument('guitar-6', 'guitar-drop-d', 22);
      const json = instrument.toJSON();
      expect(json.type).toBe('guitar-6');
      expect(json.tuningPresetId).toBe('guitar-drop-d');
      expect(json.fretCount).toBe(22);
    });
  });

  describe('fromJSON', () => {
    it('should deserialize from config object', () => {
      const original = new Instrument('bass-5', 'bass-5-standard', 20);
      const json = original.toJSON();
      const restored = Instrument.fromJSON(json);
      expect(restored.type).toBe('bass-5');
      expect(restored.tuningPresetId).toBe('bass-5-standard');
      expect(restored.fretCount).toBe(20);
    });

    it('should restore custom tuning', () => {
      const instrument = new Instrument('guitar-6');
      const customTuning = createCustomTuning(['D4', 'A3', 'F3', 'C3', 'G2', 'C2']);
      instrument.setCustomTuning(customTuning);
      
      const json = instrument.toJSON();
      const restored = Instrument.fromJSON(json);
      expect(restored.tuningPresetId).toBe('custom');
      expect(restored.tuning[0].pitchClass).toBe('D');
    });
  });

  describe('clone', () => {
    it('should create independent copy', () => {
      const original = new Instrument('guitar-7');
      const clone = original.clone();
      
      clone.setTuningPreset('guitar-7-drop-a');
      expect(original.tuningPresetId).toBe('guitar-7-standard');
      expect(clone.tuningPresetId).toBe('guitar-7-drop-a');
    });
  });
});

// ============================================================================
// Instrument Class - Static Factory Methods Tests
// ============================================================================

describe('Instrument Static Factory Methods', () => {
  it('should create guitar-6 with guitar6()', () => {
    const instrument = Instrument.guitar6();
    expect(instrument.type).toBe('guitar-6');
  });

  it('should create guitar-7 with guitar7()', () => {
    const instrument = Instrument.guitar7();
    expect(instrument.type).toBe('guitar-7');
    expect(instrument.stringCount).toBe(7);
  });

  it('should create guitar-8 with guitar8()', () => {
    const instrument = Instrument.guitar8();
    expect(instrument.type).toBe('guitar-8');
    expect(instrument.stringCount).toBe(8);
  });

  it('should create bass-4 with bass4()', () => {
    const instrument = Instrument.bass4();
    expect(instrument.type).toBe('bass-4');
    expect(instrument.stringCount).toBe(4);
  });

  it('should create bass-5 with bass5()', () => {
    const instrument = Instrument.bass5();
    expect(instrument.type).toBe('bass-5');
    expect(instrument.stringCount).toBe(5);
  });

  it('should create bass-6 with bass6()', () => {
    const instrument = Instrument.bass6();
    expect(instrument.type).toBe('bass-6');
    expect(instrument.stringCount).toBe(6);
  });

  it('should create ukulele with ukulele()', () => {
    const instrument = Instrument.ukulele();
    expect(instrument.type).toBe('ukulele');
    expect(instrument.stringCount).toBe(4);
    expect(instrument.fretCount).toBe(15);
  });
});

// ============================================================================
// Different Tunings Generate Correct Notes Tests (PRD Requirement)
// ============================================================================

describe('Different Tunings Generate Correct Notes', () => {
  describe('Standard Guitar Tuning', () => {
    it('should generate correct open string notes', () => {
      const instrument = new Instrument('guitar-6', 'guitar-standard');
      const fretboard = instrument.fretboard;
      const openStrings = fretboard.getOpenStrings();
      
      expect(openStrings[0].pitchClass).toBe('E');
      expect(openStrings[0].octave).toBe(4);
      expect(openStrings[5].pitchClass).toBe('E');
      expect(openStrings[5].octave).toBe(2);
    });
  });

  describe('Drop D Tuning', () => {
    it('should generate dropped 6th string', () => {
      const instrument = new Instrument('guitar-6', 'guitar-drop-d');
      const fretboard = instrument.fretboard;
      const openStrings = fretboard.getOpenStrings();
      
      expect(openStrings[5].pitchClass).toBe('D');
      expect(openStrings[5].octave).toBe(2);
    });

    it('should generate correct notes on 6th string', () => {
      const instrument = new Instrument('guitar-6', 'guitar-drop-d');
      const fretboard = instrument.fretboard;
      
      // 6th string: D2, D#2, E2, F2, F#2, G2...
      expect(fretboard.getNoteAt(6, 0)?.pitchClass).toBe('D');
      expect(fretboard.getNoteAt(6, 2)?.pitchClass).toBe('E');
      expect(fretboard.getNoteAt(6, 12)?.pitchClass).toBe('D'); // Octave
      expect(fretboard.getNoteAt(6, 12)?.octave).toBe(3);
    });
  });

  describe('Open G Tuning', () => {
    it('should generate Open G chord on open strings', () => {
      const instrument = new Instrument('guitar-6', 'guitar-open-g');
      const fretboard = instrument.fretboard;
      const openStrings = fretboard.getOpenStrings();
      
      // Open G: D4, B3, G3, D3, G2, D2
      expect(openStrings[0].pitchClass).toBe('D');
      expect(openStrings[1].pitchClass).toBe('B');
      expect(openStrings[2].pitchClass).toBe('G');
      expect(openStrings[3].pitchClass).toBe('D');
      expect(openStrings[4].pitchClass).toBe('G');
      expect(openStrings[5].pitchClass).toBe('D');
    });
  });

  describe('7-String Guitar Tuning', () => {
    it('should generate 7 strings with low B', () => {
      const instrument = new Instrument('guitar-7', 'guitar-7-standard');
      const fretboard = instrument.fretboard;
      
      expect(fretboard.config.stringCount).toBe(7);
      
      const openStrings = fretboard.getOpenStrings();
      expect(openStrings).toHaveLength(7);
      expect(openStrings[6].pitchClass).toBe('B');
      expect(openStrings[6].octave).toBe(1);
    });
  });

  describe('8-String Guitar Tuning', () => {
    it('should generate 8 strings with low F#', () => {
      const instrument = new Instrument('guitar-8', 'guitar-8-standard');
      const fretboard = instrument.fretboard;
      
      expect(fretboard.config.stringCount).toBe(8);
      
      const openStrings = fretboard.getOpenStrings();
      expect(openStrings).toHaveLength(8);
      expect(openStrings[7].pitchClass).toBe('F#');
      expect(openStrings[7].octave).toBe(1);
    });
  });

  describe('4-String Bass Tuning', () => {
    it('should generate bass notes in correct octave', () => {
      const instrument = new Instrument('bass-4', 'bass-4-standard');
      const fretboard = instrument.fretboard;
      const openStrings = fretboard.getOpenStrings();
      
      // Bass is one octave lower than guitar
      expect(openStrings[3].pitchClass).toBe('E');
      expect(openStrings[3].octave).toBe(1);
      expect(openStrings[0].pitchClass).toBe('G');
      expect(openStrings[0].octave).toBe(2);
    });
  });

  describe('5-String Bass Tuning', () => {
    it('should include low B string', () => {
      const instrument = new Instrument('bass-5', 'bass-5-standard');
      const fretboard = instrument.fretboard;
      const openStrings = fretboard.getOpenStrings();
      
      expect(openStrings).toHaveLength(5);
      expect(openStrings[4].pitchClass).toBe('B');
      expect(openStrings[4].octave).toBe(0);
    });
  });

  describe('Ukulele Tuning', () => {
    it('should generate reentrant tuning correctly', () => {
      const instrument = new Instrument('ukulele', 'ukulele-standard');
      const fretboard = instrument.fretboard;
      const openStrings = fretboard.getOpenStrings();
      
      // Ukulele: A4, E4, C4, G4 (reentrant - G is high)
      expect(openStrings).toHaveLength(4);
      expect(openStrings[0].pitchClass).toBe('A');
      expect(openStrings[0].octave).toBe(4);
      expect(openStrings[3].pitchClass).toBe('G');
      expect(openStrings[3].octave).toBe(4); // High G (reentrant)
    });

    it('should generate correct fret count', () => {
      const instrument = new Instrument('ukulele');
      expect(instrument.fretCount).toBe(15);
      expect(instrument.fretboard.config.fretCount).toBe(15);
    });
  });

  describe('DADGAD Tuning', () => {
    it('should generate DADGAD open strings', () => {
      const instrument = new Instrument('guitar-6', 'guitar-dadgad');
      const fretboard = instrument.fretboard;
      const openStrings = fretboard.getOpenStrings();
      
      expect(openStrings[0].pitchClass).toBe('D');
      expect(openStrings[1].pitchClass).toBe('A');
      expect(openStrings[2].pitchClass).toBe('G');
      expect(openStrings[3].pitchClass).toBe('D');
      expect(openStrings[4].pitchClass).toBe('A');
      expect(openStrings[5].pitchClass).toBe('D');
    });
  });

  describe('Open D Tuning', () => {
    it('should include F# on string 3', () => {
      const instrument = new Instrument('guitar-6', 'guitar-open-d');
      const fretboard = instrument.fretboard;
      const openStrings = fretboard.getOpenStrings();
      
      expect(openStrings[2].pitchClass).toBe('F#');
    });
  });

  describe('Custom Tuning', () => {
    it('should generate correct notes for custom tuning', () => {
      const instrument = new Instrument('guitar-6');
      const customTuning = createCustomTuning(['D4', 'A3', 'F3', 'C3', 'G2', 'C2']);
      instrument.setCustomTuning(customTuning);
      
      const fretboard = instrument.fretboard;
      const openStrings = fretboard.getOpenStrings();
      
      expect(openStrings[0].pitchClass).toBe('D');
      expect(openStrings[5].pitchClass).toBe('C');
    });
  });
});

// ============================================================================
// Total Note Count Verification Tests
// ============================================================================

describe('Total Note Count Verification', () => {
  it('should generate correct note count for 6-string guitar with 24 frets', () => {
    const instrument = new Instrument('guitar-6', 'guitar-standard', 24);
    // 6 strings × 25 positions (0-24) = 150 notes
    expect(instrument.fretboard.getTotalNoteCount()).toBe(150);
  });

  it('should generate correct note count for 7-string guitar with 24 frets', () => {
    const instrument = new Instrument('guitar-7', 'guitar-7-standard', 24);
    // 7 strings × 25 positions (0-24) = 175 notes
    expect(instrument.fretboard.getTotalNoteCount()).toBe(175);
  });

  it('should generate correct note count for 4-string bass with 24 frets', () => {
    const instrument = new Instrument('bass-4', 'bass-4-standard', 24);
    // 4 strings × 25 positions (0-24) = 100 notes
    expect(instrument.fretboard.getTotalNoteCount()).toBe(100);
  });

  it('should generate correct note count for ukulele with 15 frets', () => {
    const instrument = new Instrument('ukulele', 'ukulele-standard', 15);
    // 4 strings × 16 positions (0-15) = 64 notes
    expect(instrument.fretboard.getTotalNoteCount()).toBe(64);
  });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe('Edge Cases', () => {
  it('should handle switching between very different instruments', () => {
    const instrument = new Instrument('guitar-8');
    instrument.switchInstrument('ukulele');
    instrument.switchInstrument('bass-6');
    instrument.switchInstrument('guitar-6');
    
    expect(instrument.type).toBe('guitar-6');
    expect(instrument.fretboard.getTotalNoteCount()).toBeGreaterThan(0);
  });

  it('should handle rapid configuration changes', () => {
    const instrument = new Instrument();
    
    for (let i = 0; i < 10; i++) {
      instrument.setTuningPreset('guitar-drop-d');
      instrument.setFretCount(20);
      instrument.setTuningPreset('guitar-standard');
      instrument.setFretCount(24);
    }
    
    expect(instrument.fretboard.getTotalNoteCount()).toBe(150);
  });

  it('should handle minimum fret count', () => {
    const instrument = new Instrument('guitar-6', undefined, 12);
    expect(instrument.fretCount).toBe(12);
    expect(instrument.fretboard.config.fretCount).toBe(12);
  });

  it('should handle tuning with all same notes', () => {
    const instrument = new Instrument('guitar-6');
    const allETuning = createCustomTuning(['E4', 'E3', 'E3', 'E2', 'E2', 'E1']);
    instrument.setCustomTuning(allETuning);
    
    const fretboard = instrument.fretboard;
    const openStrings = fretboard.getOpenStrings();
    expect(openStrings.every(n => n.pitchClass === 'E')).toBe(true);
  });
});
