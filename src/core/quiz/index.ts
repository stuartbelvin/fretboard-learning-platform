// Quiz module exports

// NoteQuizState - values
export { NoteQuizState, DEFAULT_QUIZ_CONFIG } from './NoteQuizState';
// NoteQuizState - types
export type {
  QuizState,
  AnswerResult,
  NoteQuizConfig,
  QuizQuestion,
  QuizResult,
  QuestionStats,
  QuizEventType,
  QuizEvent,
  QuizEventListener
} from './NoteQuizState';

// NoteQuestionGenerator - values
export { NoteQuestionGenerator, DEFAULT_GENERATOR_CONFIG, NATURAL_NOTES, ACCIDENTAL_NOTES } from './NoteQuestionGenerator';
// NoteQuestionGenerator - types
export type {
  PitchClassFilter,
  QuestionGeneratorConfig,
  GenerationResult
} from './NoteQuestionGenerator';

// AnswerValidator - values
export { AnswerValidator, DEFAULT_ATTEMPT_CONFIG, PITCH_CLASS_VALIDATION_MAP } from './AnswerValidator';
// AnswerValidator - types
export type {
  ValidationResult,
  AttemptConfig,
  AttemptState
} from './AnswerValidator';

// QuizFeedbackManager - values
export { QuizFeedbackManager, DEFAULT_FEEDBACK_CONFIG } from './QuizFeedbackManager';
// QuizFeedbackManager - types
export type {
  FeedbackType,
  FeedbackState,
  FeedbackConfig,
  FeedbackEventType,
  FeedbackEvent,
  FeedbackEventListener
} from './QuizFeedbackManager';

// QuizFlowController - values
export { QuizFlowController, DEFAULT_FLOW_CONFIG } from './QuizFlowController';
// QuizFlowController - types
export type {
  PauseState,
  FlowControllerConfig,
  ScoreData,
  ProgressData,
  FlowEventType,
  FlowEvent,
  FlowEventListener
} from './QuizFlowController';

// IntervalQuestionGenerator - values
export { IntervalQuestionGenerator, DEFAULT_INTERVAL_GENERATOR_CONFIG } from './IntervalQuestionGenerator';
// IntervalQuestionGenerator - types
export type {
  IntervalQuizQuestion,
  IntervalGeneratorConfig,
  IntervalGenerationResult
} from './IntervalQuestionGenerator';

// ProgressiveQuizState - values
export { ProgressiveQuizState, DEFAULT_PROGRESSIVE_CONFIG, E_STRING_NOTES, getPitchClassForFret, getFretForPitchClass } from './ProgressiveQuizState';
// ProgressiveQuizState - types
export type {
  ProgressiveQuizConfig,
  NotePerformanceData,
  EStringPerformance,
  NoteStats
} from './ProgressiveQuizState';
