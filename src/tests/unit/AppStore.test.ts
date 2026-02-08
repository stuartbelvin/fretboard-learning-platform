/**
 * Unit Tests for Global State Store (APP-001)
 * 
 * Tests for Zustand store functionality including:
 * - State initialization
 * - Quiz state management
 * - Instrument configuration
 * - User settings
 * - Viewport configuration
 * - localStorage persistence
 * - State updates triggering re-renders
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useAppStore,
  useCurrentQuiz,
  useInstrumentConfig,
  useUserSettings,
  useViewport,
  useQuizSettings,
  useQuizScore,
  useIsQuizActive,
  useQuizType,
  DEFAULT_QUIZ_SETTINGS,
  DEFAULT_CURRENT_QUIZ,
  DEFAULT_INSTRUMENT_CONFIG,
  DEFAULT_USER_SETTINGS,
  DEFAULT_VIEWPORT_CONFIG,
  STORAGE_KEY,
  getTuningFromPreset,
  type QuizType,
  type NoteDisplayPreference,
  type MarkerStyle,
  type TuningPreset,
  type AppState,
} from '../../store';
import { STANDARD_TUNING, DROP_D_TUNING, OPEN_G_TUNING } from '../../core/instruments/Fretboard';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Global State Store (APP-001)', () => {
  beforeEach(() => {
    // Clear localStorage and reset store before each test
    localStorageMock.clear();
    useAppStore.setState({
      currentQuiz: DEFAULT_CURRENT_QUIZ,
      instrumentConfig: DEFAULT_INSTRUMENT_CONFIG,
      userSettings: DEFAULT_USER_SETTINGS,
      viewport: DEFAULT_VIEWPORT_CONFIG,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Default Constants Tests
  // ==========================================================================
  describe('Default Constants', () => {
    it('DEFAULT_QUIZ_SETTINGS has correct values', () => {
      expect(DEFAULT_QUIZ_SETTINGS.maxAttempts).toBe(3);
      expect(DEFAULT_QUIZ_SETTINGS.totalQuestions).toBe(10);
      expect(DEFAULT_QUIZ_SETTINGS.autoAdvance).toBe(true);
      expect(DEFAULT_QUIZ_SETTINGS.autoAdvanceDelay).toBe(1000);
      expect(DEFAULT_QUIZ_SETTINGS.noteSelection).toBe('both');
      expect(DEFAULT_QUIZ_SETTINGS.selectedIntervals).toContain('P5');
      expect(DEFAULT_QUIZ_SETTINGS.allowCompoundIntervals).toBe(false);
    });

    it('DEFAULT_CURRENT_QUIZ has correct initial state', () => {
      expect(DEFAULT_CURRENT_QUIZ.type).toBeNull();
      expect(DEFAULT_CURRENT_QUIZ.isActive).toBe(false);
      expect(DEFAULT_CURRENT_QUIZ.isPaused).toBe(false);
      expect(DEFAULT_CURRENT_QUIZ.currentQuestion).toBe(0);
      expect(DEFAULT_CURRENT_QUIZ.score.correct).toBe(0);
      expect(DEFAULT_CURRENT_QUIZ.score.total).toBe(0);
      expect(DEFAULT_CURRENT_QUIZ.score.hintsUsed).toBe(0);
    });

    it('DEFAULT_INSTRUMENT_CONFIG has correct values', () => {
      expect(DEFAULT_INSTRUMENT_CONFIG.stringCount).toBe(6);
      expect(DEFAULT_INSTRUMENT_CONFIG.fretCount).toBe(24);
      expect(DEFAULT_INSTRUMENT_CONFIG.tuning).toBe(STANDARD_TUNING);
      expect(DEFAULT_INSTRUMENT_CONFIG.tuningPreset).toBe('standard');
    });

    it('DEFAULT_USER_SETTINGS has correct values', () => {
      expect(DEFAULT_USER_SETTINGS.colorPaletteId).toBe('default');
      expect(DEFAULT_USER_SETTINGS.noteDisplay).toBe('sharps');
      expect(DEFAULT_USER_SETTINGS.showNoteNames).toBe(false);
      expect(DEFAULT_USER_SETTINGS.markerStyle).toBe('dots');
      expect(DEFAULT_USER_SETTINGS.soundEnabled).toBe(true);
      expect(DEFAULT_USER_SETTINGS.animationSpeed).toBe(1);
    });

    it('DEFAULT_VIEWPORT_CONFIG has correct values', () => {
      expect(DEFAULT_VIEWPORT_CONFIG.visibleFrets).toBe(12);
      expect(DEFAULT_VIEWPORT_CONFIG.startFret).toBe(0);
      expect(DEFAULT_VIEWPORT_CONFIG.desktopFretCount).toBe(12);
      expect(DEFAULT_VIEWPORT_CONFIG.tabletFretCount).toBe(8);
      expect(DEFAULT_VIEWPORT_CONFIG.mobileFretCount).toBe(4);
    });

    it('STORAGE_KEY is defined', () => {
      expect(STORAGE_KEY).toBe('fretboard-app-state');
    });
  });

  // ==========================================================================
  // Store Initialization Tests
  // ==========================================================================
  describe('Store Initialization', () => {
    it('store initializes with default state', () => {
      const state = useAppStore.getState();
      
      expect(state.currentQuiz).toEqual(DEFAULT_CURRENT_QUIZ);
      expect(state.instrumentConfig).toEqual(DEFAULT_INSTRUMENT_CONFIG);
      expect(state.userSettings).toEqual(DEFAULT_USER_SETTINGS);
      expect(state.viewport).toEqual(DEFAULT_VIEWPORT_CONFIG);
    });

    it('store includes all required state slices', () => {
      const state = useAppStore.getState();
      
      expect(state).toHaveProperty('currentQuiz');
      expect(state).toHaveProperty('instrumentConfig');
      expect(state).toHaveProperty('userSettings');
      expect(state).toHaveProperty('viewport');
    });

    it('store includes all quiz actions', () => {
      const state = useAppStore.getState();
      
      expect(typeof state.startQuiz).toBe('function');
      expect(typeof state.endQuiz).toBe('function');
      expect(typeof state.pauseQuiz).toBe('function');
      expect(typeof state.resumeQuiz).toBe('function');
      expect(typeof state.updateQuizScore).toBe('function');
      expect(typeof state.setCurrentQuestion).toBe('function');
      expect(typeof state.updateQuizSettings).toBe('function');
    });

    it('store includes all instrument actions', () => {
      const state = useAppStore.getState();
      
      expect(typeof state.setTuning).toBe('function');
      expect(typeof state.setTuningPreset).toBe('function');
      expect(typeof state.setFretCount).toBe('function');
      expect(typeof state.setStringCount).toBe('function');
    });

    it('store includes all user settings actions', () => {
      const state = useAppStore.getState();
      
      expect(typeof state.setColorPalette).toBe('function');
      expect(typeof state.setNoteDisplay).toBe('function');
      expect(typeof state.setShowNoteNames).toBe('function');
      expect(typeof state.setMarkerStyle).toBe('function');
      expect(typeof state.setSoundEnabled).toBe('function');
      expect(typeof state.setAnimationSpeed).toBe('function');
    });

    it('store includes all viewport actions', () => {
      const state = useAppStore.getState();
      
      expect(typeof state.setVisibleFrets).toBe('function');
      expect(typeof state.setStartFret).toBe('function');
      expect(typeof state.setDesktopFretCount).toBe('function');
      expect(typeof state.setTabletFretCount).toBe('function');
      expect(typeof state.setMobileFretCount).toBe('function');
    });

    it('store includes global reset actions', () => {
      const state = useAppStore.getState();
      
      expect(typeof state.resetToDefaults).toBe('function');
      expect(typeof state.resetQuizSettings).toBe('function');
      expect(typeof state.resetUserSettings).toBe('function');
      expect(typeof state.resetViewport).toBe('function');
    });
  });

  // ==========================================================================
  // Quiz State Management Tests
  // ==========================================================================
  describe('Quiz State Management', () => {
    describe('startQuiz', () => {
      it('starts a note quiz', () => {
        const { startQuiz } = useAppStore.getState();
        
        act(() => {
          startQuiz('note');
        });
        
        const state = useAppStore.getState();
        expect(state.currentQuiz.type).toBe('note');
        expect(state.currentQuiz.isActive).toBe(true);
        expect(state.currentQuiz.isPaused).toBe(false);
        expect(state.currentQuiz.currentQuestion).toBe(1);
      });

      it('starts an interval quiz', () => {
        const { startQuiz } = useAppStore.getState();
        
        act(() => {
          startQuiz('interval');
        });
        
        const state = useAppStore.getState();
        expect(state.currentQuiz.type).toBe('interval');
        expect(state.currentQuiz.isActive).toBe(true);
      });

      it('resets score when starting quiz', () => {
        useAppStore.setState((state) => ({
          currentQuiz: {
            ...state.currentQuiz,
            score: { correct: 5, total: 10, hintsUsed: 2 },
          },
        }));
        
        const { startQuiz } = useAppStore.getState();
        
        act(() => {
          startQuiz('note');
        });
        
        const state = useAppStore.getState();
        expect(state.currentQuiz.score.correct).toBe(0);
        expect(state.currentQuiz.score.total).toBe(0);
        expect(state.currentQuiz.score.hintsUsed).toBe(0);
      });
    });

    describe('endQuiz', () => {
      it('ends the quiz and resets state', () => {
        const { startQuiz, endQuiz } = useAppStore.getState();
        
        act(() => {
          startQuiz('note');
        });
        
        act(() => {
          endQuiz();
        });
        
        const state = useAppStore.getState();
        expect(state.currentQuiz.type).toBeNull();
        expect(state.currentQuiz.isActive).toBe(false);
        expect(state.currentQuiz.currentQuestion).toBe(0);
      });

      it('clears score when ending quiz', () => {
        const { startQuiz, updateQuizScore, endQuiz } = useAppStore.getState();
        
        act(() => {
          startQuiz('note');
          updateQuizScore(5, 8, 1);
        });
        
        act(() => {
          endQuiz();
        });
        
        const state = useAppStore.getState();
        expect(state.currentQuiz.score.correct).toBe(0);
        expect(state.currentQuiz.score.total).toBe(0);
      });
    });

    describe('pauseQuiz and resumeQuiz', () => {
      it('pauses the quiz', () => {
        const { startQuiz, pauseQuiz } = useAppStore.getState();
        
        act(() => {
          startQuiz('note');
          pauseQuiz();
        });
        
        const state = useAppStore.getState();
        expect(state.currentQuiz.isPaused).toBe(true);
        expect(state.currentQuiz.isActive).toBe(true);
      });

      it('resumes the quiz', () => {
        const { startQuiz, pauseQuiz, resumeQuiz } = useAppStore.getState();
        
        act(() => {
          startQuiz('note');
          pauseQuiz();
          resumeQuiz();
        });
        
        const state = useAppStore.getState();
        expect(state.currentQuiz.isPaused).toBe(false);
        expect(state.currentQuiz.isActive).toBe(true);
      });
    });

    describe('updateQuizScore', () => {
      it('updates the quiz score', () => {
        const { startQuiz, updateQuizScore } = useAppStore.getState();
        
        act(() => {
          startQuiz('note');
          updateQuizScore(3, 5, 1);
        });
        
        const state = useAppStore.getState();
        expect(state.currentQuiz.score.correct).toBe(3);
        expect(state.currentQuiz.score.total).toBe(5);
        expect(state.currentQuiz.score.hintsUsed).toBe(1);
      });
    });

    describe('setCurrentQuestion', () => {
      it('sets the current question number', () => {
        const { startQuiz, setCurrentQuestion } = useAppStore.getState();
        
        act(() => {
          startQuiz('note');
          setCurrentQuestion(5);
        });
        
        const state = useAppStore.getState();
        expect(state.currentQuiz.currentQuestion).toBe(5);
      });
    });

    describe('updateQuizSettings', () => {
      it('updates partial quiz settings', () => {
        const { updateQuizSettings } = useAppStore.getState();
        
        act(() => {
          updateQuizSettings({ maxAttempts: 5 });
        });
        
        const state = useAppStore.getState();
        expect(state.currentQuiz.settings.maxAttempts).toBe(5);
        expect(state.currentQuiz.settings.totalQuestions).toBe(DEFAULT_QUIZ_SETTINGS.totalQuestions);
      });

      it('updates multiple quiz settings', () => {
        const { updateQuizSettings } = useAppStore.getState();
        
        act(() => {
          updateQuizSettings({
            maxAttempts: 5,
            totalQuestions: 20,
            noteSelection: 'flats',
          });
        });
        
        const state = useAppStore.getState();
        expect(state.currentQuiz.settings.maxAttempts).toBe(5);
        expect(state.currentQuiz.settings.totalQuestions).toBe(20);
        expect(state.currentQuiz.settings.noteSelection).toBe('flats');
      });

      it('updates interval settings', () => {
        const { updateQuizSettings } = useAppStore.getState();
        
        act(() => {
          updateQuizSettings({
            selectedIntervals: ['P5', 'P4', 'm3'],
            allowCompoundIntervals: true,
          });
        });
        
        const state = useAppStore.getState();
        expect(state.currentQuiz.settings.selectedIntervals).toEqual(['P5', 'P4', 'm3']);
        expect(state.currentQuiz.settings.allowCompoundIntervals).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Instrument Configuration Tests
  // ==========================================================================
  describe('Instrument Configuration', () => {
    describe('setTuning', () => {
      it('sets custom tuning', () => {
        const { setTuning } = useAppStore.getState();
        
        act(() => {
          setTuning(DROP_D_TUNING);
        });
        
        const state = useAppStore.getState();
        expect(state.instrumentConfig.tuning).toBe(DROP_D_TUNING);
        expect(state.instrumentConfig.tuningPreset).toBe('custom');
      });

      it('sets tuning with preset name', () => {
        const { setTuning } = useAppStore.getState();
        
        act(() => {
          setTuning(DROP_D_TUNING, 'dropD');
        });
        
        const state = useAppStore.getState();
        expect(state.instrumentConfig.tuning).toBe(DROP_D_TUNING);
        expect(state.instrumentConfig.tuningPreset).toBe('dropD');
      });
    });

    describe('setTuningPreset', () => {
      it('sets standard tuning preset', () => {
        const { setTuningPreset, setTuning } = useAppStore.getState();
        
        act(() => {
          setTuning(DROP_D_TUNING, 'dropD');
          setTuningPreset('standard');
        });
        
        const state = useAppStore.getState();
        expect(state.instrumentConfig.tuning).toBe(STANDARD_TUNING);
        expect(state.instrumentConfig.tuningPreset).toBe('standard');
      });

      it('sets drop D tuning preset', () => {
        const { setTuningPreset } = useAppStore.getState();
        
        act(() => {
          setTuningPreset('dropD');
        });
        
        const state = useAppStore.getState();
        expect(state.instrumentConfig.tuning).toBe(DROP_D_TUNING);
        expect(state.instrumentConfig.tuningPreset).toBe('dropD');
      });

      it('sets open G tuning preset', () => {
        const { setTuningPreset } = useAppStore.getState();
        
        act(() => {
          setTuningPreset('openG');
        });
        
        const state = useAppStore.getState();
        expect(state.instrumentConfig.tuning).toBe(OPEN_G_TUNING);
        expect(state.instrumentConfig.tuningPreset).toBe('openG');
      });
    });

    describe('setFretCount', () => {
      it('sets fret count within valid range', () => {
        const { setFretCount } = useAppStore.getState();
        
        act(() => {
          setFretCount(22);
        });
        
        const state = useAppStore.getState();
        expect(state.instrumentConfig.fretCount).toBe(22);
      });

      it('clamps fret count to minimum', () => {
        const { setFretCount } = useAppStore.getState();
        
        act(() => {
          setFretCount(5);
        });
        
        const state = useAppStore.getState();
        expect(state.instrumentConfig.fretCount).toBe(12);
      });

      it('clamps fret count to maximum', () => {
        const { setFretCount } = useAppStore.getState();
        
        act(() => {
          setFretCount(30);
        });
        
        const state = useAppStore.getState();
        expect(state.instrumentConfig.fretCount).toBe(24);
      });
    });

    describe('setStringCount', () => {
      it('sets string count within valid range', () => {
        const { setStringCount } = useAppStore.getState();
        
        act(() => {
          setStringCount(7);
        });
        
        const state = useAppStore.getState();
        expect(state.instrumentConfig.stringCount).toBe(7);
      });

      it('clamps string count to minimum', () => {
        const { setStringCount } = useAppStore.getState();
        
        act(() => {
          setStringCount(2);
        });
        
        const state = useAppStore.getState();
        expect(state.instrumentConfig.stringCount).toBe(4);
      });

      it('clamps string count to maximum', () => {
        const { setStringCount } = useAppStore.getState();
        
        act(() => {
          setStringCount(15);
        });
        
        const state = useAppStore.getState();
        expect(state.instrumentConfig.stringCount).toBe(12);
      });
    });
  });

  // ==========================================================================
  // User Settings Tests
  // ==========================================================================
  describe('User Settings', () => {
    describe('setColorPalette', () => {
      it('sets color palette ID', () => {
        const { setColorPalette } = useAppStore.getState();
        
        act(() => {
          setColorPalette('high-contrast');
        });
        
        const state = useAppStore.getState();
        expect(state.userSettings.colorPaletteId).toBe('high-contrast');
      });
    });

    describe('setNoteDisplay', () => {
      it('sets note display to sharps', () => {
        const { setNoteDisplay } = useAppStore.getState();
        
        act(() => {
          setNoteDisplay('sharps');
        });
        
        const state = useAppStore.getState();
        expect(state.userSettings.noteDisplay).toBe('sharps');
      });

      it('sets note display to flats', () => {
        const { setNoteDisplay } = useAppStore.getState();
        
        act(() => {
          setNoteDisplay('flats');
        });
        
        const state = useAppStore.getState();
        expect(state.userSettings.noteDisplay).toBe('flats');
      });

      it('sets note display to both', () => {
        const { setNoteDisplay } = useAppStore.getState();
        
        act(() => {
          setNoteDisplay('both');
        });
        
        const state = useAppStore.getState();
        expect(state.userSettings.noteDisplay).toBe('both');
      });
    });

    describe('setShowNoteNames', () => {
      it('enables showing note names', () => {
        const { setShowNoteNames } = useAppStore.getState();
        
        act(() => {
          setShowNoteNames(true);
        });
        
        const state = useAppStore.getState();
        expect(state.userSettings.showNoteNames).toBe(true);
      });

      it('disables showing note names', () => {
        const { setShowNoteNames } = useAppStore.getState();
        
        act(() => {
          setShowNoteNames(true);
          setShowNoteNames(false);
        });
        
        const state = useAppStore.getState();
        expect(state.userSettings.showNoteNames).toBe(false);
      });
    });

    describe('setMarkerStyle', () => {
      it('sets marker style to dots', () => {
        const { setMarkerStyle } = useAppStore.getState();
        
        act(() => {
          setMarkerStyle('dots');
        });
        
        const state = useAppStore.getState();
        expect(state.userSettings.markerStyle).toBe('dots');
      });

      it('sets marker style to trapezoid', () => {
        const { setMarkerStyle } = useAppStore.getState();
        
        act(() => {
          setMarkerStyle('trapezoid');
        });
        
        const state = useAppStore.getState();
        expect(state.userSettings.markerStyle).toBe('trapezoid');
      });
    });

    describe('setSoundEnabled', () => {
      it('enables sound', () => {
        const { setSoundEnabled } = useAppStore.getState();
        
        act(() => {
          setSoundEnabled(true);
        });
        
        const state = useAppStore.getState();
        expect(state.userSettings.soundEnabled).toBe(true);
      });

      it('disables sound', () => {
        const { setSoundEnabled } = useAppStore.getState();
        
        act(() => {
          setSoundEnabled(false);
        });
        
        const state = useAppStore.getState();
        expect(state.userSettings.soundEnabled).toBe(false);
      });
    });

    describe('setAnimationSpeed', () => {
      it('sets animation speed', () => {
        const { setAnimationSpeed } = useAppStore.getState();
        
        act(() => {
          setAnimationSpeed(1.5);
        });
        
        const state = useAppStore.getState();
        expect(state.userSettings.animationSpeed).toBe(1.5);
      });

      it('clamps animation speed to minimum', () => {
        const { setAnimationSpeed } = useAppStore.getState();
        
        act(() => {
          setAnimationSpeed(0.1);
        });
        
        const state = useAppStore.getState();
        expect(state.userSettings.animationSpeed).toBe(0.5);
      });

      it('clamps animation speed to maximum', () => {
        const { setAnimationSpeed } = useAppStore.getState();
        
        act(() => {
          setAnimationSpeed(5);
        });
        
        const state = useAppStore.getState();
        expect(state.userSettings.animationSpeed).toBe(2);
      });
    });
  });

  // ==========================================================================
  // Viewport Configuration Tests
  // ==========================================================================
  describe('Viewport Configuration', () => {
    describe('setVisibleFrets', () => {
      it('sets visible frets count', () => {
        const { setVisibleFrets } = useAppStore.getState();
        
        act(() => {
          setVisibleFrets(8);
        });
        
        const state = useAppStore.getState();
        expect(state.viewport.visibleFrets).toBe(8);
      });

      it('clamps visible frets to minimum', () => {
        const { setVisibleFrets } = useAppStore.getState();
        
        act(() => {
          setVisibleFrets(0);
        });
        
        const state = useAppStore.getState();
        expect(state.viewport.visibleFrets).toBe(1);
      });

      it('clamps visible frets to maximum', () => {
        const { setVisibleFrets } = useAppStore.getState();
        
        act(() => {
          setVisibleFrets(30);
        });
        
        const state = useAppStore.getState();
        expect(state.viewport.visibleFrets).toBe(24);
      });
    });

    describe('setStartFret', () => {
      it('sets start fret', () => {
        const { setStartFret } = useAppStore.getState();
        
        act(() => {
          setStartFret(5);
        });
        
        const state = useAppStore.getState();
        expect(state.viewport.startFret).toBe(5);
      });

      it('clamps start fret to minimum', () => {
        const { setStartFret } = useAppStore.getState();
        
        act(() => {
          setStartFret(-5);
        });
        
        const state = useAppStore.getState();
        expect(state.viewport.startFret).toBe(0);
      });

      it('clamps start fret to maximum', () => {
        const { setStartFret } = useAppStore.getState();
        
        act(() => {
          setStartFret(25);
        });
        
        const state = useAppStore.getState();
        expect(state.viewport.startFret).toBe(23);
      });
    });

    describe('setDesktopFretCount', () => {
      it('sets desktop fret count', () => {
        const { setDesktopFretCount } = useAppStore.getState();
        
        act(() => {
          setDesktopFretCount(16);
        });
        
        const state = useAppStore.getState();
        expect(state.viewport.desktopFretCount).toBe(16);
      });
    });

    describe('setTabletFretCount', () => {
      it('sets tablet fret count', () => {
        const { setTabletFretCount } = useAppStore.getState();
        
        act(() => {
          setTabletFretCount(10);
        });
        
        const state = useAppStore.getState();
        expect(state.viewport.tabletFretCount).toBe(10);
      });
    });

    describe('setMobileFretCount', () => {
      it('sets mobile fret count', () => {
        const { setMobileFretCount } = useAppStore.getState();
        
        act(() => {
          setMobileFretCount(6);
        });
        
        const state = useAppStore.getState();
        expect(state.viewport.mobileFretCount).toBe(6);
      });

      it('clamps mobile fret count to maximum of 12', () => {
        const { setMobileFretCount } = useAppStore.getState();
        
        act(() => {
          setMobileFretCount(20);
        });
        
        const state = useAppStore.getState();
        expect(state.viewport.mobileFretCount).toBe(12);
      });
    });
  });

  // ==========================================================================
  // Global Reset Actions Tests
  // ==========================================================================
  describe('Global Reset Actions', () => {
    describe('resetToDefaults', () => {
      it('resets all state to defaults', () => {
        const { setColorPalette, setVisibleFrets, startQuiz, resetToDefaults } = useAppStore.getState();
        
        act(() => {
          setColorPalette('high-contrast');
          setVisibleFrets(8);
          startQuiz('note');
        });
        
        act(() => {
          resetToDefaults();
        });
        
        const state = useAppStore.getState();
        expect(state.currentQuiz).toEqual(DEFAULT_CURRENT_QUIZ);
        expect(state.instrumentConfig).toEqual(DEFAULT_INSTRUMENT_CONFIG);
        expect(state.userSettings).toEqual(DEFAULT_USER_SETTINGS);
        expect(state.viewport).toEqual(DEFAULT_VIEWPORT_CONFIG);
      });
    });

    describe('resetQuizSettings', () => {
      it('resets only quiz settings to defaults', () => {
        const { updateQuizSettings, setColorPalette, resetQuizSettings } = useAppStore.getState();
        
        act(() => {
          updateQuizSettings({ maxAttempts: 5, totalQuestions: 20 });
          setColorPalette('high-contrast');
        });
        
        act(() => {
          resetQuizSettings();
        });
        
        const state = useAppStore.getState();
        expect(state.currentQuiz.settings).toEqual(DEFAULT_QUIZ_SETTINGS);
        expect(state.userSettings.colorPaletteId).toBe('high-contrast');
      });
    });

    describe('resetUserSettings', () => {
      it('resets only user settings to defaults', () => {
        const { setColorPalette, setVisibleFrets, resetUserSettings } = useAppStore.getState();
        
        act(() => {
          setColorPalette('high-contrast');
          setVisibleFrets(8);
        });
        
        act(() => {
          resetUserSettings();
        });
        
        const state = useAppStore.getState();
        expect(state.userSettings).toEqual(DEFAULT_USER_SETTINGS);
        expect(state.viewport.visibleFrets).toBe(8);
      });
    });

    describe('resetViewport', () => {
      it('resets only viewport to defaults', () => {
        const { setVisibleFrets, setColorPalette, resetViewport } = useAppStore.getState();
        
        act(() => {
          setVisibleFrets(8);
          setColorPalette('high-contrast');
        });
        
        act(() => {
          resetViewport();
        });
        
        const state = useAppStore.getState();
        expect(state.viewport).toEqual(DEFAULT_VIEWPORT_CONFIG);
        expect(state.userSettings.colorPaletteId).toBe('high-contrast');
      });
    });
  });

  // ==========================================================================
  // Selector Hooks Tests
  // ==========================================================================
  describe('Selector Hooks', () => {
    describe('useCurrentQuiz', () => {
      it('returns current quiz state', () => {
        const { result } = renderHook(() => useCurrentQuiz());
        
        expect(result.current).toEqual(DEFAULT_CURRENT_QUIZ);
      });

      it('updates when quiz state changes', () => {
        const { result } = renderHook(() => useCurrentQuiz());
        
        act(() => {
          useAppStore.getState().startQuiz('note');
        });
        
        expect(result.current.type).toBe('note');
        expect(result.current.isActive).toBe(true);
      });
    });

    describe('useInstrumentConfig', () => {
      it('returns instrument configuration', () => {
        const { result } = renderHook(() => useInstrumentConfig());
        
        expect(result.current).toEqual(DEFAULT_INSTRUMENT_CONFIG);
      });

      it('updates when instrument config changes', () => {
        const { result } = renderHook(() => useInstrumentConfig());
        
        act(() => {
          useAppStore.getState().setTuningPreset('dropD');
        });
        
        expect(result.current.tuningPreset).toBe('dropD');
      });
    });

    describe('useUserSettings', () => {
      it('returns user settings', () => {
        const { result } = renderHook(() => useUserSettings());
        
        expect(result.current).toEqual(DEFAULT_USER_SETTINGS);
      });

      it('updates when user settings change', () => {
        const { result } = renderHook(() => useUserSettings());
        
        act(() => {
          useAppStore.getState().setColorPalette('warm');
        });
        
        expect(result.current.colorPaletteId).toBe('warm');
      });
    });

    describe('useViewport', () => {
      it('returns viewport configuration', () => {
        const { result } = renderHook(() => useViewport());
        
        expect(result.current).toEqual(DEFAULT_VIEWPORT_CONFIG);
      });

      it('updates when viewport changes', () => {
        const { result } = renderHook(() => useViewport());
        
        act(() => {
          useAppStore.getState().setVisibleFrets(8);
        });
        
        expect(result.current.visibleFrets).toBe(8);
      });
    });

    describe('useQuizSettings', () => {
      it('returns quiz settings', () => {
        const { result } = renderHook(() => useQuizSettings());
        
        expect(result.current).toEqual(DEFAULT_QUIZ_SETTINGS);
      });
    });

    describe('useQuizScore', () => {
      it('returns quiz score', () => {
        const { result } = renderHook(() => useQuizScore());
        
        expect(result.current).toEqual({ correct: 0, total: 0, hintsUsed: 0 });
      });

      it('updates when score changes', () => {
        const { result } = renderHook(() => useQuizScore());
        
        act(() => {
          useAppStore.getState().startQuiz('note');
          useAppStore.getState().updateQuizScore(3, 5, 1);
        });
        
        expect(result.current.correct).toBe(3);
        expect(result.current.total).toBe(5);
      });
    });

    describe('useIsQuizActive', () => {
      it('returns false when quiz is not active', () => {
        const { result } = renderHook(() => useIsQuizActive());
        
        expect(result.current).toBe(false);
      });

      it('returns true when quiz is active', () => {
        const { result } = renderHook(() => useIsQuizActive());
        
        act(() => {
          useAppStore.getState().startQuiz('note');
        });
        
        expect(result.current).toBe(true);
      });
    });

    describe('useQuizType', () => {
      it('returns null when no quiz is active', () => {
        const { result } = renderHook(() => useQuizType());
        
        expect(result.current).toBeNull();
      });

      it('returns quiz type when quiz is active', () => {
        const { result } = renderHook(() => useQuizType());
        
        act(() => {
          useAppStore.getState().startQuiz('interval');
        });
        
        expect(result.current).toBe('interval');
      });
    });
  });

  // ==========================================================================
  // Tuning Preset Helper Tests
  // ==========================================================================
  describe('getTuningFromPreset', () => {
    it('returns standard tuning for standard preset', () => {
      expect(getTuningFromPreset('standard')).toBe(STANDARD_TUNING);
    });

    it('returns drop D tuning for dropD preset', () => {
      expect(getTuningFromPreset('dropD')).toBe(DROP_D_TUNING);
    });

    it('returns open G tuning for openG preset', () => {
      expect(getTuningFromPreset('openG')).toBe(OPEN_G_TUNING);
    });

    it('returns standard tuning for custom preset', () => {
      expect(getTuningFromPreset('custom')).toBe(STANDARD_TUNING);
    });

    it('returns standard tuning for unknown preset', () => {
      expect(getTuningFromPreset('unknown' as TuningPreset)).toBe(STANDARD_TUNING);
    });
  });

  // ==========================================================================
  // localStorage Persistence Tests
  // ==========================================================================
  describe('localStorage Persistence', () => {
    it('store has persist middleware configured', () => {
      // Verify the store is configured with persistence
      const store = useAppStore;
      expect(store.persist).toBeDefined();
      expect(store.persist.getOptions().name).toBe(STORAGE_KEY);
    });

    it('partialize function excludes runtime quiz state', () => {
      const options = useAppStore.persist.getOptions();
      const partialize = options.partialize;
      
      // Create a mock state with active quiz
      const fullState = {
        currentQuiz: {
          type: 'note' as const,
          isActive: true,
          isPaused: false,
          currentQuestion: 5,
          score: { correct: 3, total: 5, hintsUsed: 1 },
          settings: { ...DEFAULT_QUIZ_SETTINGS, maxAttempts: 5 },
        },
        instrumentConfig: DEFAULT_INSTRUMENT_CONFIG,
        userSettings: { ...DEFAULT_USER_SETTINGS, colorPaletteId: 'warm' },
        viewport: { ...DEFAULT_VIEWPORT_CONFIG, visibleFrets: 16 },
      } as AppState;
      
      const partializedState = partialize!(fullState);
      
      // Quiz settings should be preserved
      expect(partializedState.currentQuiz?.settings.maxAttempts).toBe(5);
      
      // Runtime state should be reset to defaults
      expect(partializedState.currentQuiz?.isActive).toBe(false);
      expect(partializedState.currentQuiz?.score.correct).toBe(0);
      expect(partializedState.currentQuiz?.currentQuestion).toBe(0);
      
      // Other settings should be preserved
      expect(partializedState.userSettings?.colorPaletteId).toBe('warm');
      expect(partializedState.viewport?.visibleFrets).toBe(16);
    });

    it('persist storage is localStorage', () => {
      const options = useAppStore.persist.getOptions();
      // Storage is using createJSONStorage(() => localStorage)
      expect(options.storage).toBeDefined();
    });

    it('user settings changes are captured for persistence', () => {
      const { setColorPalette } = useAppStore.getState();
      
      act(() => {
        setColorPalette('warm');
      });
      
      const state = useAppStore.getState();
      const options = useAppStore.persist.getOptions();
      const partialize = options.partialize;
      
      const partializedState = partialize!(state);
      expect(partializedState.userSettings?.colorPaletteId).toBe('warm');
    });

    it('viewport changes are captured for persistence', () => {
      const { setVisibleFrets } = useAppStore.getState();
      
      act(() => {
        setVisibleFrets(16);
      });
      
      const state = useAppStore.getState();
      const options = useAppStore.persist.getOptions();
      const partialize = options.partialize;
      
      const partializedState = partialize!(state);
      expect(partializedState.viewport?.visibleFrets).toBe(16);
    });

    it('instrument config changes are captured for persistence', () => {
      const { setTuningPreset } = useAppStore.getState();
      
      act(() => {
        setTuningPreset('dropD');
      });
      
      const state = useAppStore.getState();
      const options = useAppStore.persist.getOptions();
      const partialize = options.partialize;
      
      const partializedState = partialize!(state);
      expect(partializedState.instrumentConfig?.tuningPreset).toBe('dropD');
    });
  });

  // ==========================================================================
  // State Update Re-render Tests
  // ==========================================================================
  describe('State Updates Trigger Re-renders', () => {
    it('component re-renders when quiz state changes', () => {
      const renderCount = { count: 0 };
      
      const { result } = renderHook(() => {
        renderCount.count++;
        return useCurrentQuiz();
      });
      
      const initialCount = renderCount.count;
      
      act(() => {
        useAppStore.getState().startQuiz('note');
      });
      
      // Component should have re-rendered
      expect(renderCount.count).toBeGreaterThan(initialCount);
      expect(result.current.type).toBe('note');
    });

    it('component re-renders when user settings change', () => {
      const renderCount = { count: 0 };
      
      const { result } = renderHook(() => {
        renderCount.count++;
        return useUserSettings();
      });
      
      const initialCount = renderCount.count;
      
      act(() => {
        useAppStore.getState().setColorPalette('warm');
      });
      
      expect(renderCount.count).toBeGreaterThan(initialCount);
      expect(result.current.colorPaletteId).toBe('warm');
    });

    it('component does not re-render when unrelated state changes', () => {
      const renderCount = { count: 0 };
      
      renderHook(() => {
        renderCount.count++;
        return useUserSettings();
      });
      
      const initialCount = renderCount.count;
      
      act(() => {
        useAppStore.getState().setVisibleFrets(8); // Viewport change, not user settings
      });
      
      // Should not re-render because viewport is different from user settings
      expect(renderCount.count).toBe(initialCount);
    });
  });

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================
  describe('Edge Cases', () => {
    it('handles rapid state updates', () => {
      const { setVisibleFrets } = useAppStore.getState();
      
      act(() => {
        for (let i = 1; i <= 24; i++) {
          setVisibleFrets(i);
        }
      });
      
      const state = useAppStore.getState();
      expect(state.viewport.visibleFrets).toBe(24);
    });

    it('handles concurrent quiz and settings updates', () => {
      const { startQuiz, updateQuizSettings, setColorPalette } = useAppStore.getState();
      
      act(() => {
        startQuiz('interval');
        updateQuizSettings({ maxAttempts: 5 });
        setColorPalette('warm');
      });
      
      const state = useAppStore.getState();
      expect(state.currentQuiz.type).toBe('interval');
      expect(state.currentQuiz.settings.maxAttempts).toBe(5);
      expect(state.userSettings.colorPaletteId).toBe('warm');
    });

    it('handles starting new quiz while one is active', () => {
      const { startQuiz, updateQuizScore } = useAppStore.getState();
      
      act(() => {
        startQuiz('note');
        updateQuizScore(5, 10, 2);
        startQuiz('interval'); // Start new quiz
      });
      
      const state = useAppStore.getState();
      expect(state.currentQuiz.type).toBe('interval');
      expect(state.currentQuiz.score.correct).toBe(0); // Score should be reset
    });

    it('handles null quiz type', () => {
      const { startQuiz, endQuiz } = useAppStore.getState();
      
      act(() => {
        startQuiz('note');
        endQuiz();
      });
      
      const state = useAppStore.getState();
      expect(state.currentQuiz.type).toBeNull();
      expect(state.currentQuiz.isActive).toBe(false);
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================
  describe('Integration Tests', () => {
    it('full quiz workflow', () => {
      const store = useAppStore.getState();
      
      act(() => {
        // Configure settings
        store.updateQuizSettings({ totalQuestions: 5, maxAttempts: 2 });
        store.setNoteDisplay('flats');
        
        // Start quiz
        store.startQuiz('note');
        
        // Progress through questions
        store.setCurrentQuestion(1);
        store.updateQuizScore(1, 1, 0);
        
        store.setCurrentQuestion(2);
        store.updateQuizScore(2, 2, 0);
        
        // Pause and resume
        store.pauseQuiz();
        store.resumeQuiz();
        
        // Continue
        store.setCurrentQuestion(3);
        store.updateQuizScore(2, 3, 1);
        
        // End quiz
        store.endQuiz();
      });
      
      const state = useAppStore.getState();
      expect(state.currentQuiz.isActive).toBe(false);
      expect(state.userSettings.noteDisplay).toBe('flats');
    });

    it('switching between quiz types preserves settings', () => {
      const store = useAppStore.getState();
      
      act(() => {
        store.updateQuizSettings({ maxAttempts: 5 });
        store.startQuiz('note');
        store.endQuiz();
        store.startQuiz('interval');
      });
      
      const state = useAppStore.getState();
      expect(state.currentQuiz.type).toBe('interval');
      expect(state.currentQuiz.settings.maxAttempts).toBe(5);
    });

    it('viewport adjustments with instrument changes', () => {
      const store = useAppStore.getState();
      
      act(() => {
        store.setFretCount(22);
        store.setVisibleFrets(22);
        store.setStartFret(5);
      });
      
      const state = useAppStore.getState();
      expect(state.instrumentConfig.fretCount).toBe(22);
      expect(state.viewport.visibleFrets).toBe(22);
      expect(state.viewport.startFret).toBe(5);
    });
  });
});
