/**
 * Store Module Exports
 * 
 * Central export point for all state management functionality.
 */

export {
  // Store hook
  useAppStore,
  
  // Selector hooks
  useCurrentQuiz,
  useInstrumentConfig,
  useUserSettings,
  useViewport,
  useQuizSettings,
  useQuizScore,
  useIsQuizActive,
  useQuizType,
  
  // Types
  type QuizType,
  type NoteDisplayPreference,
  type MarkerStyle,
  type QuizSettings,
  type CurrentQuizState,
  type TuningPreset,
  type InstrumentConfig,
  type UserSettings,
  type ViewportConfig,
  type AppState,
  
  // Defaults
  DEFAULT_QUIZ_SETTINGS,
  DEFAULT_CURRENT_QUIZ,
  DEFAULT_INSTRUMENT_CONFIG,
  DEFAULT_USER_SETTINGS,
  DEFAULT_VIEWPORT_CONFIG,
  STORAGE_KEY,
  
  // Utilities
  getTuningFromPreset,
} from './appStore';
