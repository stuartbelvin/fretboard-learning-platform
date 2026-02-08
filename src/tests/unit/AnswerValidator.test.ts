import { describe, it, expect, beforeEach } from 'vitest';
import {
  AnswerValidator,
  ValidationResult,
  AttemptConfig,
  AttemptState,
  DEFAULT_ATTEMPT_CONFIG,
  PITCH_CLASS_VALIDATION_MAP
} from '../../core/quiz/AnswerValidator';
import { Note, PitchClass, CHROMATIC_SCALE_SHARPS, FlatPitchClass } from '../../core/music-theory/Note';

describe('AnswerValidator', () => {
  let validator: AnswerValidator;

  beforeEach(() => {
    validator = new AnswerValidator();
  });

  // ============================================================
  // Static Method Tests: normalizeToPitchClass
  // ============================================================

  describe('normalizeToPitchClass', () => {
    it('should return sharp pitch classes unchanged', () => {
      for (const pitchClass of CHROMATIC_SCALE_SHARPS) {
        expect(AnswerValidator.normalizeToPitchClass(pitchClass)).toBe(pitchClass);
      }
    });

    it('should convert Db to C#', () => {
      expect(AnswerValidator.normalizeToPitchClass('Db')).toBe('C#');
    });

    it('should convert Eb to D#', () => {
      expect(AnswerValidator.normalizeToPitchClass('Eb')).toBe('D#');
    });

    it('should convert Gb to F#', () => {
      expect(AnswerValidator.normalizeToPitchClass('Gb')).toBe('F#');
    });

    it('should convert Ab to G#', () => {
      expect(AnswerValidator.normalizeToPitchClass('Ab')).toBe('G#');
    });

    it('should convert Bb to A#', () => {
      expect(AnswerValidator.normalizeToPitchClass('Bb')).toBe('A#');
    });

    it('should keep natural notes unchanged (flats)', () => {
      const naturalFlats: FlatPitchClass[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      for (const note of naturalFlats) {
        expect(AnswerValidator.normalizeToPitchClass(note)).toBe(note);
      }
    });
  });

  // ============================================================
  // Static Method Tests: areEnharmonicEquivalent
  // ============================================================

  describe('areEnharmonicEquivalent', () => {
    it('should return true for C# and Db', () => {
      expect(AnswerValidator.areEnharmonicEquivalent('C#', 'Db')).toBe(true);
    });

    it('should return true for D# and Eb', () => {
      expect(AnswerValidator.areEnharmonicEquivalent('D#', 'Eb')).toBe(true);
    });

    it('should return true for F# and Gb', () => {
      expect(AnswerValidator.areEnharmonicEquivalent('F#', 'Gb')).toBe(true);
    });

    it('should return true for G# and Ab', () => {
      expect(AnswerValidator.areEnharmonicEquivalent('G#', 'Ab')).toBe(true);
    });

    it('should return true for A# and Bb', () => {
      expect(AnswerValidator.areEnharmonicEquivalent('A#', 'Bb')).toBe(true);
    });

    it('should return true for identical sharp notes', () => {
      expect(AnswerValidator.areEnharmonicEquivalent('C#', 'C#')).toBe(true);
    });

    it('should return true for identical natural notes', () => {
      expect(AnswerValidator.areEnharmonicEquivalent('C', 'C')).toBe(true);
    });

    it('should return false for non-equivalent notes', () => {
      expect(AnswerValidator.areEnharmonicEquivalent('C', 'D')).toBe(false);
      expect(AnswerValidator.areEnharmonicEquivalent('C#', 'D')).toBe(false);
      expect(AnswerValidator.areEnharmonicEquivalent('F#', 'G')).toBe(false);
    });

    it('should return false for adjacent semitones', () => {
      expect(AnswerValidator.areEnharmonicEquivalent('C', 'C#')).toBe(false);
      expect(AnswerValidator.areEnharmonicEquivalent('E', 'F')).toBe(false);
    });
  });

  // ============================================================
  // Static Method Tests: getEnharmonicSpellings
  // ============================================================

  describe('getEnharmonicSpellings', () => {
    it('should return only one spelling for natural notes', () => {
      expect(AnswerValidator.getEnharmonicSpellings('C')).toEqual(['C']);
      expect(AnswerValidator.getEnharmonicSpellings('D')).toEqual(['D']);
      expect(AnswerValidator.getEnharmonicSpellings('E')).toEqual(['E']);
      expect(AnswerValidator.getEnharmonicSpellings('F')).toEqual(['F']);
      expect(AnswerValidator.getEnharmonicSpellings('G')).toEqual(['G']);
      expect(AnswerValidator.getEnharmonicSpellings('A')).toEqual(['A']);
      expect(AnswerValidator.getEnharmonicSpellings('B')).toEqual(['B']);
    });

    it('should return both spellings for accidental notes', () => {
      expect(AnswerValidator.getEnharmonicSpellings('C#')).toContain('C#');
      expect(AnswerValidator.getEnharmonicSpellings('C#')).toContain('Db');
      expect(AnswerValidator.getEnharmonicSpellings('D#')).toContain('D#');
      expect(AnswerValidator.getEnharmonicSpellings('D#')).toContain('Eb');
      expect(AnswerValidator.getEnharmonicSpellings('F#')).toContain('F#');
      expect(AnswerValidator.getEnharmonicSpellings('F#')).toContain('Gb');
      expect(AnswerValidator.getEnharmonicSpellings('G#')).toContain('G#');
      expect(AnswerValidator.getEnharmonicSpellings('G#')).toContain('Ab');
      expect(AnswerValidator.getEnharmonicSpellings('A#')).toContain('A#');
      expect(AnswerValidator.getEnharmonicSpellings('A#')).toContain('Bb');
    });

    it('should return exactly 2 spellings for accidentals', () => {
      expect(AnswerValidator.getEnharmonicSpellings('C#')).toHaveLength(2);
      expect(AnswerValidator.getEnharmonicSpellings('F#')).toHaveLength(2);
    });
  });

  // ============================================================
  // Static Method Tests: validateAnswer (All 12 Pitch Classes)
  // ============================================================

  describe('validateAnswer', () => {
    describe('validates all 12 pitch classes correctly', () => {
      // Test each pitch class
      for (const pitchClass of CHROMATIC_SCALE_SHARPS) {
        it(`should validate ${pitchClass} correctly when clicked matches`, () => {
          const clickedNote = new Note(pitchClass, 4, 1, 5);
          const result = AnswerValidator.validateAnswer(clickedNote, pitchClass);
          
          expect(result.isCorrect).toBe(true);
          expect(result.clickedPitchClass).toBe(pitchClass);
          expect(result.targetPitchClass).toBe(pitchClass);
        });

        it(`should validate ${pitchClass} correctly when clicked does not match`, () => {
          // Get a different pitch class
          const wrongIndex = (CHROMATIC_SCALE_SHARPS.indexOf(pitchClass) + 1) % 12;
          const wrongPitchClass = CHROMATIC_SCALE_SHARPS[wrongIndex];
          const clickedNote = new Note(wrongPitchClass, 4, 1, 5);
          const result = AnswerValidator.validateAnswer(clickedNote, pitchClass);
          
          expect(result.isCorrect).toBe(false);
          expect(result.clickedPitchClass).toBe(wrongPitchClass);
          expect(result.targetPitchClass).toBe(pitchClass);
        });
      }
    });

    it('should return correct ValidationResult structure', () => {
      const clickedNote = new Note('C', 4, 1, 5);
      const result = AnswerValidator.validateAnswer(clickedNote, 'C');
      
      expect(result).toHaveProperty('isCorrect');
      expect(result).toHaveProperty('clickedPitchClass');
      expect(result).toHaveProperty('targetPitchClass');
      expect(result).toHaveProperty('wasEnharmonicMatch');
      expect(result).toHaveProperty('isExactPitchMatch');
      expect(result).toHaveProperty('feedbackMessage');
    });

    it('should generate correct feedback for correct answer', () => {
      const clickedNote = new Note('G', 3, 3, 5);
      const result = AnswerValidator.validateAnswer(clickedNote, 'G');
      
      expect(result.feedbackMessage).toContain('Correct');
      expect(result.feedbackMessage).toContain('G');
    });

    it('should generate correct feedback for incorrect answer', () => {
      const clickedNote = new Note('A', 3, 3, 7);
      const result = AnswerValidator.validateAnswer(clickedNote, 'G');
      
      expect(result.feedbackMessage).toContain('Incorrect');
      expect(result.feedbackMessage).toContain('A');
      expect(result.feedbackMessage).toContain('G');
    });

    it('should handle notes in different octaves with same pitch class', () => {
      const lowNote = new Note('C', 2, 5, 3);
      const result = AnswerValidator.validateAnswer(lowNote, 'C');
      
      expect(result.isCorrect).toBe(true);
    });

    it('should handle notes on different strings with same pitch class', () => {
      const noteOnString1 = new Note('E', 4, 1, 0);
      const noteOnString6 = new Note('E', 2, 6, 0);
      
      expect(AnswerValidator.validateAnswer(noteOnString1, 'E').isCorrect).toBe(true);
      expect(AnswerValidator.validateAnswer(noteOnString6, 'E').isCorrect).toBe(true);
    });
  });

  // ============================================================
  // Static Method Tests: validateExactNote
  // ============================================================

  describe('validateExactNote', () => {
    it('should return isCorrect=true when pitch class matches', () => {
      const clicked = new Note('C', 4, 2, 1);
      const target = new Note('C', 5, 1, 8); // Different octave, same pitch class
      const result = AnswerValidator.validateExactNote(clicked, target);
      
      expect(result.isCorrect).toBe(true);
      expect(result.isExactPitchMatch).toBe(false);
    });

    it('should return isExactPitchMatch=true when MIDI numbers match', () => {
      const clicked = new Note('C', 4, 2, 1);
      const target = new Note('C', 4, 2, 1); // Same note
      const result = AnswerValidator.validateExactNote(clicked, target);
      
      expect(result.isCorrect).toBe(true);
      expect(result.isExactPitchMatch).toBe(true);
    });

    it('should return isCorrect=false when pitch classes differ', () => {
      const clicked = new Note('C', 4, 2, 1);
      const target = new Note('D', 4, 2, 3);
      const result = AnswerValidator.validateExactNote(clicked, target);
      
      expect(result.isCorrect).toBe(false);
      expect(result.isExactPitchMatch).toBe(false);
    });

    it('should provide feedback for same pitch class different octave', () => {
      const clicked = new Note('A', 2, 5, 0);
      const target = new Note('A', 4, 1, 5);
      const result = AnswerValidator.validateExactNote(clicked, target);
      
      expect(result.feedbackMessage).toContain('different octave');
    });
  });

  // ============================================================
  // Constructor and Config Tests
  // ============================================================

  describe('constructor', () => {
    it('should use default config when none provided', () => {
      const v = new AnswerValidator();
      expect(v.getConfig()).toEqual(DEFAULT_ATTEMPT_CONFIG);
    });

    it('should merge partial config with defaults', () => {
      const v = new AnswerValidator({ maxAttempts: 5 });
      expect(v.getConfig().maxAttempts).toBe(5);
      expect(v.getConfig().unlimitedAttempts).toBe(DEFAULT_ATTEMPT_CONFIG.unlimitedAttempts);
    });

    it('should accept full custom config', () => {
      const customConfig: AttemptConfig = { maxAttempts: 10, unlimitedAttempts: true };
      const v = new AnswerValidator(customConfig);
      expect(v.getConfig()).toEqual(customConfig);
    });
  });

  describe('DEFAULT_ATTEMPT_CONFIG', () => {
    it('should have maxAttempts of 3', () => {
      expect(DEFAULT_ATTEMPT_CONFIG.maxAttempts).toBe(3);
    });

    it('should have unlimitedAttempts as false', () => {
      expect(DEFAULT_ATTEMPT_CONFIG.unlimitedAttempts).toBe(false);
    });
  });

  // ============================================================
  // Config Update Tests
  // ============================================================

  describe('updateConfig', () => {
    it('should update maxAttempts', () => {
      validator.updateConfig({ maxAttempts: 7 });
      expect(validator.getConfig().maxAttempts).toBe(7);
    });

    it('should update unlimitedAttempts', () => {
      validator.updateConfig({ unlimitedAttempts: true });
      expect(validator.getConfig().unlimitedAttempts).toBe(true);
    });

    it('should preserve other config values when partially updating', () => {
      validator.updateConfig({ maxAttempts: 5 });
      expect(validator.getConfig().unlimitedAttempts).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('should return immutable copy', () => {
      const config = validator.getConfig();
      (config as AttemptConfig).maxAttempts = 999;
      expect(validator.getConfig().maxAttempts).toBe(3);
    });
  });

  // ============================================================
  // Attempt Tracking Tests
  // ============================================================

  describe('resetAttempts', () => {
    it('should reset attempt counter to zero', () => {
      validator.recordAttempt(false, 'C');
      validator.recordAttempt(false, 'D');
      validator.resetAttempts();
      
      expect(validator.getAttemptState().attempts).toBe(0);
    });

    it('should clear incorrect attempts history', () => {
      validator.recordAttempt(false, 'C');
      validator.recordAttempt(false, 'D');
      validator.resetAttempts();
      
      expect(validator.getAttemptState().incorrectAttempts).toEqual([]);
    });
  });

  describe('recordAttempt', () => {
    it('should increment attempt counter', () => {
      validator.recordAttempt(false, 'C');
      expect(validator.getAttemptState().attempts).toBe(1);
      
      validator.recordAttempt(false, 'D');
      expect(validator.getAttemptState().attempts).toBe(2);
    });

    it('should track incorrect pitch classes', () => {
      validator.recordAttempt(false, 'C');
      validator.recordAttempt(false, 'D');
      
      const state = validator.getAttemptState();
      expect(state.incorrectAttempts).toContain('C');
      expect(state.incorrectAttempts).toContain('D');
    });

    it('should not track pitch class for correct attempts', () => {
      validator.recordAttempt(true, 'E');
      
      expect(validator.getAttemptState().incorrectAttempts).not.toContain('E');
    });

    it('should return current attempt state', () => {
      const state = validator.recordAttempt(false, 'F');
      
      expect(state.attempts).toBe(1);
      expect(state.incorrectAttempts).toContain('F');
    });
  });

  describe('getAttemptState', () => {
    it('should return correct initial state', () => {
      const state = validator.getAttemptState();
      
      expect(state.attempts).toBe(0);
      expect(state.maxAttemptsReached).toBe(false);
      expect(state.shouldShowHint).toBe(false);
      expect(state.remainingAttempts).toBe(3);
      expect(state.incorrectAttempts).toEqual([]);
    });

    it('should indicate max attempts reached after 3 attempts', () => {
      validator.recordAttempt(false, 'C');
      validator.recordAttempt(false, 'D');
      validator.recordAttempt(false, 'E');
      
      const state = validator.getAttemptState();
      expect(state.maxAttemptsReached).toBe(true);
      expect(state.shouldShowHint).toBe(true);
      expect(state.remainingAttempts).toBe(0);
    });

    it('should return immutable incorrectAttempts array', () => {
      validator.recordAttempt(false, 'C');
      const state = validator.getAttemptState();
      state.incorrectAttempts.push('X' as PitchClass);
      
      expect(validator.getAttemptState().incorrectAttempts).not.toContain('X');
    });

    it('should show unlimited remaining when unlimitedAttempts is true', () => {
      validator.updateConfig({ unlimitedAttempts: true });
      
      const state = validator.getAttemptState();
      expect(state.remainingAttempts).toBe(Infinity);
    });

    it('should never reach max attempts when unlimited', () => {
      validator.updateConfig({ unlimitedAttempts: true });
      
      for (let i = 0; i < 100; i++) {
        validator.recordAttempt(false, 'C');
      }
      
      const state = validator.getAttemptState();
      expect(state.maxAttemptsReached).toBe(false);
      expect(state.shouldShowHint).toBe(false);
    });
  });

  describe('canAttempt', () => {
    it('should return true when attempts remaining', () => {
      expect(validator.canAttempt()).toBe(true);
      
      validator.recordAttempt(false, 'C');
      expect(validator.canAttempt()).toBe(true);
      
      validator.recordAttempt(false, 'D');
      expect(validator.canAttempt()).toBe(true);
    });

    it('should return false after max attempts', () => {
      validator.recordAttempt(false, 'C');
      validator.recordAttempt(false, 'D');
      validator.recordAttempt(false, 'E');
      
      expect(validator.canAttempt()).toBe(false);
    });

    it('should always return true when unlimited', () => {
      validator.updateConfig({ unlimitedAttempts: true });
      
      for (let i = 0; i < 10; i++) {
        validator.recordAttempt(false, 'C');
      }
      
      expect(validator.canAttempt()).toBe(true);
    });
  });

  describe('getRemainingAttempts', () => {
    it('should return correct remaining count', () => {
      expect(validator.getRemainingAttempts()).toBe(3);
      
      validator.recordAttempt(false, 'C');
      expect(validator.getRemainingAttempts()).toBe(2);
      
      validator.recordAttempt(false, 'D');
      expect(validator.getRemainingAttempts()).toBe(1);
      
      validator.recordAttempt(false, 'E');
      expect(validator.getRemainingAttempts()).toBe(0);
    });

    it('should not go below zero', () => {
      validator.recordAttempt(false, 'C');
      validator.recordAttempt(false, 'D');
      validator.recordAttempt(false, 'E');
      validator.recordAttempt(false, 'F'); // Extra attempt
      
      expect(validator.getRemainingAttempts()).toBe(0);
    });

    it('should return Infinity when unlimited', () => {
      validator.updateConfig({ unlimitedAttempts: true });
      expect(validator.getRemainingAttempts()).toBe(Infinity);
    });
  });

  // ============================================================
  // Combined Validation and Tracking Tests
  // ============================================================

  describe('validateAndTrack', () => {
    it('should return both validation result and attempt state', () => {
      const clickedNote = new Note('C', 4, 2, 1);
      const { validation, attemptState } = validator.validateAndTrack(clickedNote, 'C');
      
      expect(validation).toBeDefined();
      expect(validation.isCorrect).toBe(true);
      expect(attemptState).toBeDefined();
      expect(attemptState.attempts).toBe(1);
    });

    it('should track correct answers properly', () => {
      const clickedNote = new Note('G', 3, 3, 5);
      const { validation, attemptState } = validator.validateAndTrack(clickedNote, 'G');
      
      expect(validation.isCorrect).toBe(true);
      expect(attemptState.incorrectAttempts).toEqual([]);
    });

    it('should track incorrect answers properly', () => {
      const clickedNote = new Note('A', 3, 3, 7);
      const { validation, attemptState } = validator.validateAndTrack(clickedNote, 'G');
      
      expect(validation.isCorrect).toBe(false);
      expect(attemptState.incorrectAttempts).toContain('A');
    });

    it('should trigger hint after max attempts', () => {
      const wrongNote = new Note('F', 4, 1, 1);
      
      validator.validateAndTrack(wrongNote, 'C');
      validator.validateAndTrack(wrongNote, 'C');
      const { attemptState } = validator.validateAndTrack(wrongNote, 'C');
      
      expect(attemptState.shouldShowHint).toBe(true);
      expect(attemptState.maxAttemptsReached).toBe(true);
    });
  });

  // ============================================================
  // PITCH_CLASS_VALIDATION_MAP Tests
  // ============================================================

  describe('PITCH_CLASS_VALIDATION_MAP', () => {
    it('should have entries for all 12 pitch classes', () => {
      expect(Object.keys(PITCH_CLASS_VALIDATION_MAP)).toHaveLength(12);
      for (const pitchClass of CHROMATIC_SCALE_SHARPS) {
        expect(PITCH_CLASS_VALIDATION_MAP).toHaveProperty(pitchClass);
      }
    });

    it('should correctly identify natural notes', () => {
      expect(PITCH_CLASS_VALIDATION_MAP['C'].isNatural).toBe(true);
      expect(PITCH_CLASS_VALIDATION_MAP['D'].isNatural).toBe(true);
      expect(PITCH_CLASS_VALIDATION_MAP['E'].isNatural).toBe(true);
      expect(PITCH_CLASS_VALIDATION_MAP['F'].isNatural).toBe(true);
      expect(PITCH_CLASS_VALIDATION_MAP['G'].isNatural).toBe(true);
      expect(PITCH_CLASS_VALIDATION_MAP['A'].isNatural).toBe(true);
      expect(PITCH_CLASS_VALIDATION_MAP['B'].isNatural).toBe(true);
    });

    it('should correctly identify accidental notes', () => {
      expect(PITCH_CLASS_VALIDATION_MAP['C#'].isNatural).toBe(false);
      expect(PITCH_CLASS_VALIDATION_MAP['D#'].isNatural).toBe(false);
      expect(PITCH_CLASS_VALIDATION_MAP['F#'].isNatural).toBe(false);
      expect(PITCH_CLASS_VALIDATION_MAP['G#'].isNatural).toBe(false);
      expect(PITCH_CLASS_VALIDATION_MAP['A#'].isNatural).toBe(false);
    });

    it('should have correct sharp/flat mappings', () => {
      expect(PITCH_CLASS_VALIDATION_MAP['C#'].flat).toBe('Db');
      expect(PITCH_CLASS_VALIDATION_MAP['D#'].flat).toBe('Eb');
      expect(PITCH_CLASS_VALIDATION_MAP['F#'].flat).toBe('Gb');
      expect(PITCH_CLASS_VALIDATION_MAP['G#'].flat).toBe('Ab');
      expect(PITCH_CLASS_VALIDATION_MAP['A#'].flat).toBe('Bb');
    });
  });

  // ============================================================
  // Edge Cases
  // ============================================================

  describe('edge cases', () => {
    it('should handle validation with open string (fret 0)', () => {
      const openE = new Note('E', 4, 1, 0);
      const result = AnswerValidator.validateAnswer(openE, 'E');
      expect(result.isCorrect).toBe(true);
    });

    it('should handle validation at high frets', () => {
      const highNote = new Note('E', 6, 1, 24);
      const result = AnswerValidator.validateAnswer(highNote, 'E');
      expect(result.isCorrect).toBe(true);
    });

    it('should handle validation on all 6 strings', () => {
      for (let string = 1; string <= 6; string++) {
        const note = new Note('A', 3, string, 5);
        const result = AnswerValidator.validateAnswer(note, 'A');
        expect(result.isCorrect).toBe(true);
      }
    });

    it('should handle custom maxAttempts of 1', () => {
      const strictValidator = new AnswerValidator({ maxAttempts: 1 });
      strictValidator.recordAttempt(false, 'C');
      
      expect(strictValidator.getAttemptState().maxAttemptsReached).toBe(true);
      expect(strictValidator.canAttempt()).toBe(false);
    });

    it('should handle custom maxAttempts of 10', () => {
      const lenientValidator = new AnswerValidator({ maxAttempts: 10 });
      
      for (let i = 0; i < 9; i++) {
        lenientValidator.recordAttempt(false, 'C');
      }
      
      expect(lenientValidator.canAttempt()).toBe(true);
      lenientValidator.recordAttempt(false, 'C');
      expect(lenientValidator.canAttempt()).toBe(false);
    });

    it('should reset properly after multiple uses', () => {
      // First round
      validator.recordAttempt(false, 'C');
      validator.recordAttempt(false, 'D');
      validator.recordAttempt(false, 'E');
      
      // Reset
      validator.resetAttempts();
      
      // Second round
      expect(validator.canAttempt()).toBe(true);
      expect(validator.getAttemptState().attempts).toBe(0);
      
      validator.recordAttempt(true);
      expect(validator.getAttemptState().attempts).toBe(1);
    });
  });

  // ============================================================
  // Integration-style Tests
  // ============================================================

  describe('quiz flow simulation', () => {
    it('should handle typical correct answer flow', () => {
      const targetPitchClass: PitchClass = 'G';
      const correctNote = new Note('G', 4, 3, 5);
      
      const { validation, attemptState } = validator.validateAndTrack(correctNote, targetPitchClass);
      
      expect(validation.isCorrect).toBe(true);
      expect(attemptState.attempts).toBe(1);
      expect(attemptState.shouldShowHint).toBe(false);
    });

    it('should handle finding correct answer after two wrong guesses', () => {
      const targetPitchClass: PitchClass = 'F#';
      
      // First wrong guess
      const wrong1 = new Note('E', 4, 1, 0);
      validator.validateAndTrack(wrong1, targetPitchClass);
      
      // Second wrong guess  
      const wrong2 = new Note('G', 4, 3, 5);
      validator.validateAndTrack(wrong2, targetPitchClass);
      
      // Correct guess
      const correct = new Note('F#', 4, 1, 2);
      const { validation, attemptState } = validator.validateAndTrack(correct, targetPitchClass);
      
      expect(validation.isCorrect).toBe(true);
      expect(attemptState.attempts).toBe(3);
      expect(attemptState.shouldShowHint).toBe(true); // Max attempts reached even though correct
      expect(attemptState.incorrectAttempts).toHaveLength(2);
    });

    it('should handle hint trigger after three wrong guesses', () => {
      const targetPitchClass: PitchClass = 'Bb' as PitchClass;
      
      const wrong1 = new Note('A', 4, 1, 5);
      const wrong2 = new Note('B', 4, 1, 7);
      const wrong3 = new Note('C', 5, 1, 8);
      
      validator.validateAndTrack(wrong1, 'A#'); // A# is same as Bb
      validator.validateAndTrack(wrong2, 'A#');
      const { attemptState } = validator.validateAndTrack(wrong3, 'A#');
      
      expect(attemptState.shouldShowHint).toBe(true);
      expect(attemptState.remainingAttempts).toBe(0);
    });

    it('should properly track multiple questions', () => {
      // Question 1: Correct on first try
      const q1Note = new Note('C', 4, 2, 1);
      validator.validateAndTrack(q1Note, 'C');
      validator.resetAttempts();
      
      // Question 2: Correct on second try
      const q2Wrong = new Note('D', 4, 2, 3);
      const q2Correct = new Note('E', 4, 1, 0);
      validator.validateAndTrack(q2Wrong, 'E');
      validator.validateAndTrack(q2Correct, 'E');
      validator.resetAttempts();
      
      // Question 3: Fresh start
      expect(validator.getAttemptState().attempts).toBe(0);
      expect(validator.canAttempt()).toBe(true);
    });
  });
});
