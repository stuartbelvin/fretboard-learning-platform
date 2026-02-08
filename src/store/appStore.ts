/**
 * Global State Store (APP-001)
 * 
 * Zustand store for centralized application state management.
 * Includes: currentQuiz, instrumentConfig, userSettings, viewport, savedZones, progressiveQuiz
 * Implements localStorage persistence for user preferences.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StringTuning } from '../core/instruments/Fretboard';
import { STANDARD_TUNING, DROP_D_TUNING, OPEN_G_TUNING } from '../core/instruments/Fretboard';
import type { HighlightZoneJSON } from '../core/zones/HighlightZone';
import { DEFAULT_PROGRESSIVE_CONFIG } from '../core/quiz/ProgressiveQuizState';
import type { ProgressiveQuizConfig, NotePerformanceData } from '../core/quiz/ProgressiveQuizState';
// Note types imported for documentation purposes only

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Quiz types available in the application
 */
export type QuizType = 'note' | 'interval' | null;

/**
 * Note display preference for accidentals
 */
export type NoteDisplayPreference = 'sharps' | 'flats' | 'both';

/**
 * Marker style for fret position markers
 */
export type MarkerStyle = 'dots' | 'trapezoid';

/**
 * Quiz-specific settings
 */
export interface QuizSettings {
  /** Maximum attempts before showing hint */
  maxAttempts: number;
  /** Total questions per quiz session */
  totalQuestions: number;
  /** Auto-advance to next question after correct answer */
  autoAdvance: boolean;
  /** Delay (ms) before auto-advancing */
  autoAdvanceDelay: number;
  /** Which notes to include in quiz (sharps/flats/both) */
  noteSelection: NoteDisplayPreference;
  /** Which intervals to include (for interval quiz) */
  selectedIntervals: string[];
  /** Allow compound intervals in interval quiz */
  allowCompoundIntervals: boolean;
}

/**
 * Default quiz settings
 */
export const DEFAULT_QUIZ_SETTINGS: QuizSettings = {
  maxAttempts: 3,
  totalQuestions: 10,
  autoAdvance: true,
  autoAdvanceDelay: 1000,
  noteSelection: 'both',
  selectedIntervals: ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'],
  allowCompoundIntervals: false,
};

/**
 * Current quiz state
 */
export interface CurrentQuizState {
  /** Type of quiz currently active */
  type: QuizType;
  /** Whether a quiz is currently in progress */
  isActive: boolean;
  /** Whether the quiz is paused */
  isPaused: boolean;
  /** Current question number */
  currentQuestion: number;
  /** Score data */
  score: {
    correct: number;
    total: number;
    hintsUsed: number;
  };
  /** Quiz-specific settings */
  settings: QuizSettings;
}

/**
 * Default current quiz state
 */
export const DEFAULT_CURRENT_QUIZ: CurrentQuizState = {
  type: null,
  isActive: false,
  isPaused: false,
  currentQuestion: 0,
  score: {
    correct: 0,
    total: 0,
    hintsUsed: 0,
  },
  settings: DEFAULT_QUIZ_SETTINGS,
};

/**
 * Supported tuning presets
 */
export type TuningPreset = 'standard' | 'dropD' | 'openG' | 'custom';

/**
 * Instrument configuration
 */
export interface InstrumentConfig {
  /** Number of strings */
  stringCount: number;
  /** Number of frets */
  fretCount: number;
  /** Current tuning */
  tuning: StringTuning[];
  /** Active tuning preset name */
  tuningPreset: TuningPreset;
}

/**
 * Default instrument configuration
 */
export const DEFAULT_INSTRUMENT_CONFIG: InstrumentConfig = {
  stringCount: 6,
  fretCount: 24,
  tuning: STANDARD_TUNING,
  tuningPreset: 'standard',
};

/**
 * User settings/preferences
 */
export interface UserSettings {
  /** Active color palette ID */
  colorPaletteId: string;
  /** Note display preference (sharps/flats/both) */
  noteDisplay: NoteDisplayPreference;
  /** Whether to show note names on fretboard */
  showNoteNames: boolean;
  /** Fret marker style */
  markerStyle: MarkerStyle;
  /** Sound effects enabled */
  soundEnabled: boolean;
  /** Animation speed multiplier (1 = normal) */
  animationSpeed: number;
}

/**
 * Default user settings
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  colorPaletteId: 'default',
  noteDisplay: 'sharps',
  showNoteNames: false,
  markerStyle: 'dots',
  soundEnabled: true,
  animationSpeed: 1,
};

/**
 * Viewport configuration
 */
export interface ViewportConfig {
  /** Number of frets visible in viewport */
  visibleFrets: number;
  /** Starting fret position */
  startFret: number;
  /** Default fret count for desktop */
  desktopFretCount: number;
  /** Default fret count for tablet */
  tabletFretCount: number;
  /** Default fret count for mobile */
  mobileFretCount: number;
}

/**
 * Default viewport configuration
 */
export const DEFAULT_VIEWPORT_CONFIG: ViewportConfig = {
  visibleFrets: 12,
  startFret: 0,
  desktopFretCount: 12,
  tabletFretCount: 8,
  mobileFretCount: 4,
};

/**
 * Saved zone with metadata for the admin system
 */
export interface SavedZone {
  /** Unique ID for the zone */
  id: string;
  /** User-defined name */
  name: string;
  /** The serialized zone data */
  zoneData: HighlightZoneJSON;
  /** When the zone was created */
  createdAt: number;
  /** Whether this zone is enabled for quiz use */
  enabled: boolean;
}

/**
 * Progressive quiz performance state (persisted)
 */
export interface ProgressiveQuizPerformance {
  /** Configuration for progressive difficulty thresholds */
  config: ProgressiveQuizConfig;
  /** Performance data per fret (0-11 on E string) */
  performance: Record<number, NotePerformanceData>;
  /** Number of frets currently unlocked (1-12) */
  unlockedFrets: number;
}

/**
 * Default progressive quiz performance
 */
export const DEFAULT_PROGRESSIVE_QUIZ_PERFORMANCE: ProgressiveQuizPerformance = {
  config: DEFAULT_PROGRESSIVE_CONFIG,
  performance: {},
  unlockedFrets: 1,
};

/**
 * Complete app state interface
 */
export interface AppState {
  // State slices
  currentQuiz: CurrentQuizState;
  instrumentConfig: InstrumentConfig;
  userSettings: UserSettings;
  viewport: ViewportConfig;
  savedZones: SavedZone[];
  progressiveQuiz: ProgressiveQuizPerformance;
  
  // Quiz actions
  startQuiz: (type: QuizType) => void;
  endQuiz: () => void;
  pauseQuiz: () => void;
  resumeQuiz: () => void;
  updateQuizScore: (correct: number, total: number, hintsUsed: number) => void;
  setCurrentQuestion: (questionNumber: number) => void;
  updateQuizSettings: (settings: Partial<QuizSettings>) => void;
  
  // Instrument actions
  setTuning: (tuning: StringTuning[], preset?: TuningPreset) => void;
  setTuningPreset: (preset: TuningPreset) => void;
  setFretCount: (count: number) => void;
  setStringCount: (count: number) => void;
  
  // User settings actions
  setColorPalette: (paletteId: string) => void;
  setNoteDisplay: (display: NoteDisplayPreference) => void;
  setShowNoteNames: (show: boolean) => void;
  setMarkerStyle: (style: MarkerStyle) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setAnimationSpeed: (speed: number) => void;
  
  // Viewport actions
  setVisibleFrets: (count: number) => void;
  setStartFret: (fret: number) => void;
  setDesktopFretCount: (count: number) => void;
  setTabletFretCount: (count: number) => void;
  setMobileFretCount: (count: number) => void;
  
  // Saved zone actions
  addSavedZone: (zone: Omit<SavedZone, 'id' | 'createdAt'>) => string;
  updateSavedZone: (id: string, updates: Partial<Omit<SavedZone, 'id' | 'createdAt'>>) => void;
  deleteSavedZone: (id: string) => void;
  toggleZoneEnabled: (id: string) => void;
  
  // Progressive quiz actions
  recordProgressiveAttempt: (fret: number, correct: boolean, answerTimeSeconds: number) => void;
  updateProgressiveConfig: (config: Partial<ProgressiveQuizConfig>) => void;
  resetProgressiveQuiz: () => void;
  forceUnlockFrets: (numFrets: number) => void;
  
  // Global actions
  resetToDefaults: () => void;
  resetQuizSettings: () => void;
  resetUserSettings: () => void;
  resetViewport: () => void;
}

// ============================================================================
// Tuning Preset Helpers
// ============================================================================

/**
 * Get tuning array from preset name
 */
export function getTuningFromPreset(preset: TuningPreset): StringTuning[] {
  switch (preset) {
    case 'standard':
      return STANDARD_TUNING;
    case 'dropD':
      return DROP_D_TUNING;
    case 'openG':
      return OPEN_G_TUNING;
    case 'custom':
      return STANDARD_TUNING; // Custom starts from standard
    default:
      return STANDARD_TUNING;
  }
}

// ============================================================================
// Store Creation
// ============================================================================

/**
 * Storage key for persisted state
 */
export const STORAGE_KEY = 'fretboard-app-state';

/**
 * Global app state store
 * 
 * Uses Zustand for state management with localStorage persistence.
 * Only persists user preferences, not runtime quiz state.
 */
export const useAppStore = create<AppState>()(
  persist(
    (set, _get) => ({
      // ====================================================================
      // Initial State
      // ====================================================================
      currentQuiz: DEFAULT_CURRENT_QUIZ,
      instrumentConfig: DEFAULT_INSTRUMENT_CONFIG,
      userSettings: DEFAULT_USER_SETTINGS,
      viewport: DEFAULT_VIEWPORT_CONFIG,
      savedZones: [],
      progressiveQuiz: DEFAULT_PROGRESSIVE_QUIZ_PERFORMANCE,
      
      // ====================================================================
      // Quiz Actions
      // ====================================================================
      
      startQuiz: (type: QuizType) => set((state) => ({
        currentQuiz: {
          ...state.currentQuiz,
          type,
          isActive: true,
          isPaused: false,
          currentQuestion: 1,
          score: { correct: 0, total: 0, hintsUsed: 0 },
        },
      })),
      
      endQuiz: () => set((state) => ({
        currentQuiz: {
          ...state.currentQuiz,
          type: null,
          isActive: false,
          isPaused: false,
          currentQuestion: 0,
          score: { correct: 0, total: 0, hintsUsed: 0 },
        },
      })),
      
      pauseQuiz: () => set((state) => ({
        currentQuiz: {
          ...state.currentQuiz,
          isPaused: true,
        },
      })),
      
      resumeQuiz: () => set((state) => ({
        currentQuiz: {
          ...state.currentQuiz,
          isPaused: false,
        },
      })),
      
      updateQuizScore: (correct: number, total: number, hintsUsed: number) => set((state) => ({
        currentQuiz: {
          ...state.currentQuiz,
          score: { correct, total, hintsUsed },
        },
      })),
      
      setCurrentQuestion: (questionNumber: number) => set((state) => ({
        currentQuiz: {
          ...state.currentQuiz,
          currentQuestion: questionNumber,
        },
      })),
      
      updateQuizSettings: (settings: Partial<QuizSettings>) => set((state) => ({
        currentQuiz: {
          ...state.currentQuiz,
          settings: { ...state.currentQuiz.settings, ...settings },
        },
      })),
      
      // ====================================================================
      // Instrument Actions
      // ====================================================================
      
      setTuning: (tuning: StringTuning[], preset: TuningPreset = 'custom') => set((state) => ({
        instrumentConfig: {
          ...state.instrumentConfig,
          tuning,
          tuningPreset: preset,
        },
      })),
      
      setTuningPreset: (preset: TuningPreset) => set((state) => ({
        instrumentConfig: {
          ...state.instrumentConfig,
          tuning: getTuningFromPreset(preset),
          tuningPreset: preset,
        },
      })),
      
      setFretCount: (count: number) => set((state) => ({
        instrumentConfig: {
          ...state.instrumentConfig,
          fretCount: Math.max(12, Math.min(24, count)),
        },
      })),
      
      setStringCount: (count: number) => set((state) => ({
        instrumentConfig: {
          ...state.instrumentConfig,
          stringCount: Math.max(4, Math.min(12, count)),
        },
      })),
      
      // ====================================================================
      // User Settings Actions
      // ====================================================================
      
      setColorPalette: (paletteId: string) => set((state) => ({
        userSettings: {
          ...state.userSettings,
          colorPaletteId: paletteId,
        },
      })),
      
      setNoteDisplay: (display: NoteDisplayPreference) => set((state) => ({
        userSettings: {
          ...state.userSettings,
          noteDisplay: display,
        },
      })),
      
      setShowNoteNames: (show: boolean) => set((state) => ({
        userSettings: {
          ...state.userSettings,
          showNoteNames: show,
        },
      })),
      
      setMarkerStyle: (style: MarkerStyle) => set((state) => ({
        userSettings: {
          ...state.userSettings,
          markerStyle: style,
        },
      })),
      
      setSoundEnabled: (enabled: boolean) => set((state) => ({
        userSettings: {
          ...state.userSettings,
          soundEnabled: enabled,
        },
      })),
      
      setAnimationSpeed: (speed: number) => set((state) => ({
        userSettings: {
          ...state.userSettings,
          animationSpeed: Math.max(0.5, Math.min(2, speed)),
        },
      })),
      
      // ====================================================================
      // Viewport Actions
      // ====================================================================
      
      setVisibleFrets: (count: number) => set((state) => ({
        viewport: {
          ...state.viewport,
          visibleFrets: Math.max(1, Math.min(24, count)),
        },
      })),
      
      setStartFret: (fret: number) => set((state) => ({
        viewport: {
          ...state.viewport,
          startFret: Math.max(0, Math.min(23, fret)),
        },
      })),
      
      setDesktopFretCount: (count: number) => set((state) => ({
        viewport: {
          ...state.viewport,
          desktopFretCount: Math.max(1, Math.min(24, count)),
        },
      })),
      
      setTabletFretCount: (count: number) => set((state) => ({
        viewport: {
          ...state.viewport,
          tabletFretCount: Math.max(1, Math.min(24, count)),
        },
      })),
      
      setMobileFretCount: (count: number) => set((state) => ({
        viewport: {
          ...state.viewport,
          mobileFretCount: Math.max(1, Math.min(12, count)),
        },
      })),
      
      // ====================================================================
      // Saved Zone Actions
      // ====================================================================
      
      addSavedZone: (zone) => {
        const id = `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        set((state) => ({
          savedZones: [
            ...state.savedZones,
            {
              ...zone,
              id,
              createdAt: Date.now(),
            },
          ],
        }));
        return id;
      },
      
      updateSavedZone: (id, updates) => set((state) => ({
        savedZones: state.savedZones.map((zone) =>
          zone.id === id ? { ...zone, ...updates } : zone
        ),
      })),
      
      deleteSavedZone: (id) => set((state) => ({
        savedZones: state.savedZones.filter((zone) => zone.id !== id),
      })),
      
      toggleZoneEnabled: (id) => set((state) => ({
        savedZones: state.savedZones.map((zone) =>
          zone.id === id ? { ...zone, enabled: !zone.enabled } : zone
        ),
      })),
      
      // ====================================================================
      // Progressive Quiz Actions
      // ====================================================================
      
      recordProgressiveAttempt: (fret: number, correct: boolean, answerTimeSeconds: number) => 
        set((state) => {
          const { config, performance, unlockedFrets } = state.progressiveQuiz;
          
          // Get or initialize performance data for this fret
          const fretPerf = performance[fret] || {
            attempts: 0,
            correct: 0,
            answerTimes: [],
            lastAttemptTime: 0,
          };
          
          // Update performance
          const newPerf = {
            ...fretPerf,
            attempts: fretPerf.attempts + 1,
            correct: fretPerf.correct + (correct ? 1 : 0),
            answerTimes: answerTimeSeconds <= config.maxAnswerTimeToCount
              ? [...fretPerf.answerTimes, answerTimeSeconds]
              : fretPerf.answerTimes,
            lastAttemptTime: Date.now(),
          };
          
          const newPerformance = { ...performance, [fret]: newPerf };
          
          // Check if we should unlock the next fret
          let newUnlockedFrets = unlockedFrets;
          if (unlockedFrets < 12) {
            // Check if ALL currently unlocked frets meet criteria
            let allMeetCriteria = true;
            for (let f = 0; f < unlockedFrets; f++) {
              const p = newPerformance[f];
              if (!p || p.attempts < config.minAttemptsToUnlock) {
                allMeetCriteria = false;
                break;
              }
              const accuracy = (p.correct / p.attempts) * 100;
              if (accuracy < config.accuracyThreshold) {
                allMeetCriteria = false;
                break;
              }
              if (p.answerTimes.length === 0) {
                allMeetCriteria = false;
                break;
              }
              const avgTime = p.answerTimes.reduce((a, b) => a + b, 0) / p.answerTimes.length;
              if (avgTime > config.averageTimeThreshold) {
                allMeetCriteria = false;
                break;
              }
            }
            if (allMeetCriteria) {
              newUnlockedFrets = unlockedFrets + 1;
            }
          }
          
          return {
            progressiveQuiz: {
              ...state.progressiveQuiz,
              performance: newPerformance,
              unlockedFrets: newUnlockedFrets,
            },
          };
        }),
      
      updateProgressiveConfig: (config: Partial<ProgressiveQuizConfig>) => 
        set((state) => ({
          progressiveQuiz: {
            ...state.progressiveQuiz,
            config: { ...state.progressiveQuiz.config, ...config },
          },
        })),
      
      resetProgressiveQuiz: () => set({
        progressiveQuiz: DEFAULT_PROGRESSIVE_QUIZ_PERFORMANCE,
      }),
      
      forceUnlockFrets: (numFrets: number) => set((state) => ({
        progressiveQuiz: {
          ...state.progressiveQuiz,
          unlockedFrets: Math.max(1, Math.min(12, numFrets)),
        },
      })),
      
      // ====================================================================
      // Global Actions
      // ====================================================================
      
      resetToDefaults: () => set({
        currentQuiz: DEFAULT_CURRENT_QUIZ,
        instrumentConfig: DEFAULT_INSTRUMENT_CONFIG,
        userSettings: DEFAULT_USER_SETTINGS,
        viewport: DEFAULT_VIEWPORT_CONFIG,
      }),
      
      resetQuizSettings: () => set((state) => ({
        currentQuiz: {
          ...state.currentQuiz,
          settings: DEFAULT_QUIZ_SETTINGS,
        },
      })),
      
      resetUserSettings: () => set({
        userSettings: DEFAULT_USER_SETTINGS,
      }),
      
      resetViewport: () => set({
        viewport: DEFAULT_VIEWPORT_CONFIG,
      }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist user preferences, not runtime state
      partialize: (state) => ({
        instrumentConfig: state.instrumentConfig,
        userSettings: state.userSettings,
        viewport: state.viewport,
        savedZones: state.savedZones,
        // Persist progressive quiz progress
        progressiveQuiz: state.progressiveQuiz,
        // Persist quiz settings but not quiz state
        currentQuiz: {
          ...DEFAULT_CURRENT_QUIZ,
          settings: state.currentQuiz.settings,
        },
      }),
    }
  )
);

// ============================================================================
// Selector Hooks (for optimized re-renders)
// ============================================================================

/**
 * Select current quiz state
 */
export const useCurrentQuiz = () => useAppStore((state) => state.currentQuiz);

/**
 * Select instrument configuration
 */
export const useInstrumentConfig = () => useAppStore((state) => state.instrumentConfig);

/**
 * Select user settings
 */
export const useUserSettings = () => useAppStore((state) => state.userSettings);

/**
 * Select viewport configuration
 */
export const useViewport = () => useAppStore((state) => state.viewport);

/**
 * Select quiz settings only
 */
export const useQuizSettings = () => useAppStore((state) => state.currentQuiz.settings);

/**
 * Select quiz score
 */
export const useQuizScore = () => useAppStore((state) => state.currentQuiz.score);

/**
 * Check if quiz is active
 */
export const useIsQuizActive = () => useAppStore((state) => state.currentQuiz.isActive);

/**
 * Get current quiz type
 */
export const useQuizType = () => useAppStore((state) => state.currentQuiz.type);

/**
 * Select saved zones
 */
export const useSavedZones = () => useAppStore((state) => state.savedZones);

/**
 * Select enabled saved zones only
 */
export const useEnabledZones = () => useAppStore((state) => 
  state.savedZones.filter((zone) => zone.enabled)
);

/**
 * Select progressive quiz state
 */
export const useProgressiveQuiz = () => useAppStore((state) => state.progressiveQuiz);

/**
 * Select number of unlocked frets
 */
export const useUnlockedFrets = () => useAppStore((state) => state.progressiveQuiz.unlockedFrets);

/**
 * Select progressive quiz config
 */
export const useProgressiveConfig = () => useAppStore((state) => state.progressiveQuiz.config);
