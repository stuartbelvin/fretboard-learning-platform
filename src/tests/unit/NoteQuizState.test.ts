import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  NoteQuizState,
  QuizState,
  AnswerResult,
  NoteQuizConfig,
  DEFAULT_QUIZ_CONFIG,
  QuizQuestion,
  QuizEvent,
  QuizEventListener
} from '../../core/quiz/NoteQuizState';
import { HighlightZone } from '../../core/zones/HighlightZone';
import { Note } from '../../core/music-theory/Note';

describe('NoteQuizState', () => {
  let quizState: NoteQuizState;
  let zone: HighlightZone;
  let testNote: Note;
  let testQuestion: QuizQuestion;

  beforeEach(() => {
    quizState = new NoteQuizState();
    zone = new HighlightZone('Test Zone');
    // Add some notes to the zone
    zone.addNote(1, 5);  // A note at string 1, fret 5
    zone.addNote(2, 3);  // A note at string 2, fret 3
    zone.addNote(3, 7);  // A note at string 3, fret 7
    
    // Create a test note (C4 at string 2, fret 1)
    testNote = new Note('C', 4, 2, 1);
    
    // Create a test question
    testQuestion = {
      targetNote: testNote,
      targetPitchClass: 'C',
      questionNumber: 1,
      questionText: 'Find C'
    };
  });

  // ============================================================
  // Constructor Tests
  // ============================================================
  
  describe('constructor', () => {
    it('should initialize with idle state', () => {
      expect(quizState.state).toBe('idle');
    });

    it('should initialize with no current question', () => {
      expect(quizState.currentQuestion).toBeNull();
    });

    it('should initialize with zero scores', () => {
      expect(quizState.questionsAnswered).toBe(0);
      expect(quizState.correctAnswers).toBe(0);
      expect(quizState.hintsUsed).toBe(0);
      expect(quizState.totalAttempts).toBe(0);
    });

    it('should use default config when none provided', () => {
      expect(quizState.config).toEqual(DEFAULT_QUIZ_CONFIG);
    });

    it('should merge partial config with defaults', () => {
      const customQuiz = new NoteQuizState({ maxAttempts: 5 });
      expect(customQuiz.config.maxAttempts).toBe(5);
      expect(customQuiz.config.totalQuestions).toBe(DEFAULT_QUIZ_CONFIG.totalQuestions);
    });

    it('should allow full custom config', () => {
      const customConfig: NoteQuizConfig = {
        maxAttempts: 5,
        totalQuestions: 20,
        autoAdvance: false,
        autoAdvanceDelay: 2000
      };
      const customQuiz = new NoteQuizState(customConfig);
      expect(customQuiz.config).toEqual(customConfig);
    });
  });

  // ============================================================
  // Default Config Tests
  // ============================================================

  describe('DEFAULT_QUIZ_CONFIG', () => {
    it('should have maxAttempts of 3', () => {
      expect(DEFAULT_QUIZ_CONFIG.maxAttempts).toBe(3);
    });

    it('should have totalQuestions of 10', () => {
      expect(DEFAULT_QUIZ_CONFIG.totalQuestions).toBe(10);
    });

    it('should have autoAdvance enabled', () => {
      expect(DEFAULT_QUIZ_CONFIG.autoAdvance).toBe(true);
    });

    it('should have autoAdvanceDelay of 1000ms', () => {
      expect(DEFAULT_QUIZ_CONFIG.autoAdvanceDelay).toBe(1000);
    });
  });

  // ============================================================
  // State Getter Tests
  // ============================================================

  describe('getters', () => {
    it('canStart should be true when idle', () => {
      expect(quizState.canStart).toBe(true);
    });

    it('canStart should be false when active', () => {
      quizState.start(zone);
      expect(quizState.canStart).toBe(false);
    });

    it('canAnswer should be false when idle', () => {
      expect(quizState.canAnswer).toBe(false);
    });

    it('canAnswer should be true when active with question', () => {
      quizState.start(zone);
      quizState.setQuestion(testQuestion);
      expect(quizState.canAnswer).toBe(true);
    });

    it('isActive should be false when idle', () => {
      expect(quizState.isActive).toBe(false);
    });

    it('isActive should be true when active', () => {
      quizState.start(zone);
      expect(quizState.isActive).toBe(true);
    });

    it('scoreDisplay should show correct format', () => {
      quizState.start(zone);
      expect(quizState.scoreDisplay).toBe('0/0');
    });

    it('progressDisplay should show correct format', () => {
      quizState.start(zone);
      expect(quizState.progressDisplay).toBe('Question 1 of 10');
    });

    it('activeZone should return the zone after start', () => {
      quizState.start(zone);
      expect(quizState.activeZone).toBe(zone);
    });

    it('questionStats should return current stats', () => {
      quizState.start(zone);
      quizState.setQuestion(testQuestion);
      const stats = quizState.questionStats;
      expect(stats.attempts).toBe(0);
      expect(stats.hintShown).toBe(false);
      expect(stats.answeredCorrectly).toBe(false);
    });
  });

  // ============================================================
  // Start Quiz Tests
  // ============================================================

  describe('start()', () => {
    it('should transition from idle to active', () => {
      const result = quizState.start(zone);
      expect(result).toBe(true);
      expect(quizState.state).toBe('active');
    });

    it('should fail if not in idle state', () => {
      quizState.start(zone);
      const result = quizState.start(zone);
      expect(result).toBe(false);
    });

    it('should fail with empty zone', () => {
      const emptyZone = new HighlightZone();
      const result = quizState.start(emptyZone);
      expect(result).toBe(false);
      expect(quizState.state).toBe('idle');
    });

    it('should reset all stats on start', () => {
      // First quiz
      quizState.start(zone);
      quizState.setQuestion(testQuestion);
      quizState.submitAnswer(testNote);
      quizState.reset();
      
      // Start again
      quizState.start(zone);
      expect(quizState.questionsAnswered).toBe(0);
      expect(quizState.correctAnswers).toBe(0);
      expect(quizState.hintsUsed).toBe(0);
      expect(quizState.totalAttempts).toBe(0);
    });

    it('should store the active zone', () => {
      quizState.start(zone);
      expect(quizState.activeZone).toBe(zone);
    });

    it('should emit stateChange event', () => {
      const listener = vi.fn();
      quizState.on('stateChange', listener);
      
      quizState.start(zone);
      
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'stateChange',
        state: 'active',
        previousState: 'idle'
      }));
    });
  });

  // ============================================================
  // Set Question Tests
  // ============================================================

  describe('setQuestion()', () => {
    beforeEach(() => {
      quizState.start(zone);
    });

    it('should set the current question', () => {
      const result = quizState.setQuestion(testQuestion);
      expect(result).toBe(true);
      expect(quizState.currentQuestion).toEqual(testQuestion);
    });

    it('should reset question stats', () => {
      // Set up a question with some attempts
      quizState.setQuestion(testQuestion);
      const wrongNote = new Note('D', 4, 1, 5);
      quizState.submitAnswer(wrongNote);
      
      // Set new question
      const newQuestion: QuizQuestion = {
        ...testQuestion,
        questionNumber: 2,
        targetPitchClass: 'G'
      };
      quizState.setQuestion(newQuestion);
      
      expect(quizState.questionStats.attempts).toBe(0);
      expect(quizState.questionStats.hintShown).toBe(false);
    });

    it('should fail when not in active state', () => {
      quizState.reset();
      const result = quizState.setQuestion(testQuestion);
      expect(result).toBe(false);
    });

    it('should emit questionGenerated event', () => {
      const listener = vi.fn();
      quizState.on('questionGenerated', listener);
      
      quizState.setQuestion(testQuestion);
      
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'questionGenerated',
        state: 'active',
        question: testQuestion
      }));
    });
  });

  // ============================================================
  // Submit Answer Tests - Correct Answers
  // ============================================================

  describe('submitAnswer() - correct answers', () => {
    beforeEach(() => {
      quizState.start(zone);
      quizState.setQuestion(testQuestion);
    });

    it('should return correct when answer is right', () => {
      const result = quizState.submitAnswer(testNote);
      expect(result).toBe('correct');
    });

    it('should increment correctAnswers', () => {
      quizState.submitAnswer(testNote);
      expect(quizState.correctAnswers).toBe(1);
    });

    it('should increment questionsAnswered', () => {
      quizState.submitAnswer(testNote);
      expect(quizState.questionsAnswered).toBe(1);
    });

    it('should increment totalAttempts', () => {
      quizState.submitAnswer(testNote);
      expect(quizState.totalAttempts).toBe(1);
    });

    it('should clear current question after correct answer', () => {
      quizState.submitAnswer(testNote);
      expect(quizState.currentQuestion).toBeNull();
    });

    it('should return to active state after correct answer', () => {
      quizState.submitAnswer(testNote);
      expect(quizState.state).toBe('active');
    });

    it('should match by pitch class regardless of octave', () => {
      const sameClassDifferentOctave = new Note('C', 5, 1, 8);
      const result = quizState.submitAnswer(sameClassDifferentOctave);
      expect(result).toBe('correct');
    });

    it('should emit correctAnswer event', () => {
      const listener = vi.fn();
      quizState.on('correctAnswer', listener);
      
      quizState.submitAnswer(testNote);
      
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'correctAnswer',
        clickedNote: testNote,
        attemptNumber: 1
      }));
    });

    it('should emit answerAttempt event before correctAnswer', () => {
      const events: string[] = [];
      quizState.on('answerAttempt', () => events.push('answerAttempt'));
      quizState.on('correctAnswer', () => events.push('correctAnswer'));
      
      quizState.submitAnswer(testNote);
      
      expect(events).toEqual(['answerAttempt', 'correctAnswer']);
    });
  });

  // ============================================================
  // Submit Answer Tests - Incorrect Answers
  // ============================================================

  describe('submitAnswer() - incorrect answers', () => {
    let wrongNote: Note;

    beforeEach(() => {
      quizState.start(zone);
      quizState.setQuestion(testQuestion);
      wrongNote = new Note('D', 4, 1, 5);
    });

    it('should return incorrect when answer is wrong', () => {
      const result = quizState.submitAnswer(wrongNote);
      expect(result).toBe('incorrect');
    });

    it('should increment totalAttempts', () => {
      quizState.submitAnswer(wrongNote);
      expect(quizState.totalAttempts).toBe(1);
    });

    it('should increment question attempts', () => {
      quizState.submitAnswer(wrongNote);
      expect(quizState.questionStats.attempts).toBe(1);
    });

    it('should NOT increment correctAnswers', () => {
      quizState.submitAnswer(wrongNote);
      expect(quizState.correctAnswers).toBe(0);
    });

    it('should NOT increment questionsAnswered', () => {
      quizState.submitAnswer(wrongNote);
      expect(quizState.questionsAnswered).toBe(0);
    });

    it('should keep current question after incorrect answer', () => {
      quizState.submitAnswer(wrongNote);
      expect(quizState.currentQuestion).toBe(testQuestion);
    });

    it('should return to active state after incorrect answer (attempts < max)', () => {
      quizState.submitAnswer(wrongNote);
      expect(quizState.state).toBe('active');
    });

    it('should emit incorrectAnswer event', () => {
      const listener = vi.fn();
      quizState.on('incorrectAnswer', listener);
      
      quizState.submitAnswer(wrongNote);
      
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'incorrectAnswer',
        clickedNote: wrongNote,
        attemptNumber: 1
      }));
    });

    it('should allow multiple attempts', () => {
      quizState.submitAnswer(wrongNote);
      quizState.submitAnswer(wrongNote);
      expect(quizState.questionStats.attempts).toBe(2);
      expect(quizState.totalAttempts).toBe(2);
    });
  });

  // ============================================================
  // Hint System Tests
  // ============================================================

  describe('hint system', () => {
    let wrongNote: Note;

    beforeEach(() => {
      quizState.start(zone);
      quizState.setQuestion(testQuestion);
      wrongNote = new Note('D', 4, 1, 5);
    });

    it('should transition to hint state after max attempts', () => {
      // Submit maxAttempts wrong answers
      for (let i = 0; i < DEFAULT_QUIZ_CONFIG.maxAttempts; i++) {
        quizState.submitAnswer(wrongNote);
      }
      expect(quizState.state).toBe('hint');
    });

    it('should set hintShown flag after max attempts', () => {
      for (let i = 0; i < DEFAULT_QUIZ_CONFIG.maxAttempts; i++) {
        quizState.submitAnswer(wrongNote);
      }
      expect(quizState.questionStats.hintShown).toBe(true);
    });

    it('should increment hintsUsed after max attempts', () => {
      for (let i = 0; i < DEFAULT_QUIZ_CONFIG.maxAttempts; i++) {
        quizState.submitAnswer(wrongNote);
      }
      expect(quizState.hintsUsed).toBe(1);
    });

    it('should emit hintShown event', () => {
      const listener = vi.fn();
      quizState.on('hintShown', listener);
      
      for (let i = 0; i < DEFAULT_QUIZ_CONFIG.maxAttempts; i++) {
        quizState.submitAnswer(wrongNote);
      }
      
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'hintShown',
        state: 'hint',
        previousState: 'answering'
      }));
    });

    it('should work with custom maxAttempts', () => {
      const customQuiz = new NoteQuizState({ maxAttempts: 5 });
      customQuiz.start(zone);
      customQuiz.setQuestion(testQuestion);
      
      // Submit 4 wrong answers (should still be active)
      for (let i = 0; i < 4; i++) {
        customQuiz.submitAnswer(wrongNote);
      }
      expect(customQuiz.state).toBe('active');
      
      // 5th wrong answer triggers hint
      customQuiz.submitAnswer(wrongNote);
      expect(customQuiz.state).toBe('hint');
    });
  });

  // ============================================================
  // Acknowledge Hint Tests
  // ============================================================

  describe('acknowledgeHint()', () => {
    let wrongNote: Note;

    beforeEach(() => {
      quizState.start(zone);
      quizState.setQuestion(testQuestion);
      wrongNote = new Note('D', 4, 1, 5);
      
      // Trigger hint state
      for (let i = 0; i < DEFAULT_QUIZ_CONFIG.maxAttempts; i++) {
        quizState.submitAnswer(wrongNote);
      }
    });

    it('should return true when in hint state', () => {
      expect(quizState.state).toBe('hint');
      const result = quizState.acknowledgeHint();
      expect(result).toBe(true);
    });

    it('should increment questionsAnswered', () => {
      quizState.acknowledgeHint();
      expect(quizState.questionsAnswered).toBe(1);
    });

    it('should transition to active state (if not last question)', () => {
      quizState.acknowledgeHint();
      expect(quizState.state).toBe('active');
    });

    it('should clear current question', () => {
      quizState.acknowledgeHint();
      expect(quizState.currentQuestion).toBeNull();
    });

    it('should return false when not in hint state', () => {
      quizState.acknowledgeHint(); // Exit hint state
      const result = quizState.acknowledgeHint(); // Try again
      expect(result).toBe(false);
    });

    it('should emit stateChange event', () => {
      const listener = vi.fn();
      quizState.on('stateChange', listener);
      
      quizState.acknowledgeHint();
      
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'stateChange',
        state: 'active',
        previousState: 'hint'
      }));
    });
  });

  // ============================================================
  // Quiz Completion Tests
  // ============================================================

  describe('quiz completion', () => {
    beforeEach(() => {
      // Use a shorter quiz for testing
      quizState = new NoteQuizState({ totalQuestions: 3 });
      quizState.start(zone);
    });

    it('should complete quiz after last correct answer', () => {
      for (let i = 0; i < 3; i++) {
        const question: QuizQuestion = {
          targetNote: testNote,
          targetPitchClass: 'C',
          questionNumber: i + 1,
          questionText: 'Find C'
        };
        quizState.setQuestion(question);
        quizState.submitAnswer(testNote);
      }
      
      expect(quizState.state).toBe('complete');
    });

    it('should complete quiz after last hint acknowledgment', () => {
      const wrongNote = new Note('D', 4, 1, 5);
      
      for (let i = 0; i < 3; i++) {
        const question: QuizQuestion = {
          targetNote: testNote,
          targetPitchClass: 'C',
          questionNumber: i + 1,
          questionText: 'Find C'
        };
        quizState.setQuestion(question);
        
        // Exhaust all attempts
        for (let j = 0; j < DEFAULT_QUIZ_CONFIG.maxAttempts; j++) {
          quizState.submitAnswer(wrongNote);
        }
        quizState.acknowledgeHint();
      }
      
      expect(quizState.state).toBe('complete');
    });

    it('should emit quizComplete event', () => {
      const listener = vi.fn();
      quizState.on('quizComplete', listener);
      
      for (let i = 0; i < 3; i++) {
        quizState.setQuestion({
          ...testQuestion,
          questionNumber: i + 1
        });
        quizState.submitAnswer(testNote);
      }
      
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'quizComplete',
        state: 'complete'
      }));
    });

    it('should include result in quizComplete event', () => {
      const listener = vi.fn();
      quizState.on('quizComplete', listener);
      
      for (let i = 0; i < 3; i++) {
        quizState.setQuestion({
          ...testQuestion,
          questionNumber: i + 1
        });
        quizState.submitAnswer(testNote);
      }
      
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        result: expect.objectContaining({
          totalQuestions: 3,
          correctAnswers: 3
        })
      }));
    });
  });

  // ============================================================
  // Quiz Result Tests
  // ============================================================

  describe('getResult()', () => {
    beforeEach(() => {
      quizState = new NoteQuizState({ totalQuestions: 3 });
      quizState.start(zone);
    });

    it('should return null when quiz not complete', () => {
      expect(quizState.getResult()).toBeNull();
    });

    it('should return correct result after completion', () => {
      // Answer all questions correctly
      for (let i = 0; i < 3; i++) {
        quizState.setQuestion({
          ...testQuestion,
          questionNumber: i + 1
        });
        quizState.submitAnswer(testNote);
      }
      
      const result = quizState.getResult();
      expect(result).not.toBeNull();
      expect(result!.totalQuestions).toBe(3);
      expect(result!.correctAnswers).toBe(3);
      expect(result!.hintsUsed).toBe(0);
      expect(result!.accuracy).toBe(100);
    });

    it('should calculate correct accuracy', () => {
      const wrongNote = new Note('D', 4, 1, 5);
      
      // 2 correct, 1 with hint
      quizState.setQuestion({ ...testQuestion, questionNumber: 1 });
      quizState.submitAnswer(testNote);
      
      quizState.setQuestion({ ...testQuestion, questionNumber: 2 });
      quizState.submitAnswer(testNote);
      
      quizState.setQuestion({ ...testQuestion, questionNumber: 3 });
      for (let j = 0; j < DEFAULT_QUIZ_CONFIG.maxAttempts; j++) {
        quizState.submitAnswer(wrongNote);
      }
      quizState.acknowledgeHint();
      
      const result = quizState.getResult();
      expect(result!.correctAnswers).toBe(2);
      expect(result!.accuracy).toBe(67); // 2/3 rounded
    });

    it('should track hints used correctly', () => {
      const wrongNote = new Note('D', 4, 1, 5);
      
      for (let i = 0; i < 3; i++) {
        quizState.setQuestion({ ...testQuestion, questionNumber: i + 1 });
        for (let j = 0; j < DEFAULT_QUIZ_CONFIG.maxAttempts; j++) {
          quizState.submitAnswer(wrongNote);
        }
        quizState.acknowledgeHint();
      }
      
      const result = quizState.getResult();
      expect(result!.hintsUsed).toBe(3);
    });

    it('should calculate average attempts correctly', () => {
      const wrongNote = new Note('D', 4, 1, 5);
      
      // Question 1: 2 wrong + 1 correct = 3 attempts
      quizState.setQuestion({ ...testQuestion, questionNumber: 1 });
      quizState.submitAnswer(wrongNote);
      quizState.submitAnswer(wrongNote);
      quizState.submitAnswer(testNote);
      
      // Question 2: 1 correct = 1 attempt
      quizState.setQuestion({ ...testQuestion, questionNumber: 2 });
      quizState.submitAnswer(testNote);
      
      // Question 3: 1 correct = 1 attempt
      quizState.setQuestion({ ...testQuestion, questionNumber: 3 });
      quizState.submitAnswer(testNote);
      
      const result = quizState.getResult();
      // 5 total attempts / 3 correct = 1.67
      expect(result!.averageAttempts).toBe(1.67);
    });
  });

  // ============================================================
  // Reset Tests
  // ============================================================

  describe('reset()', () => {
    beforeEach(() => {
      quizState.start(zone);
      quizState.setQuestion(testQuestion);
      quizState.submitAnswer(testNote);
    });

    it('should return to idle state', () => {
      quizState.reset();
      expect(quizState.state).toBe('idle');
    });

    it('should clear current question', () => {
      quizState.reset();
      expect(quizState.currentQuestion).toBeNull();
    });

    it('should reset all scores', () => {
      quizState.reset();
      expect(quizState.questionsAnswered).toBe(0);
      expect(quizState.correctAnswers).toBe(0);
      expect(quizState.hintsUsed).toBe(0);
      expect(quizState.totalAttempts).toBe(0);
    });

    it('should clear active zone', () => {
      quizState.reset();
      expect(quizState.activeZone).toBeNull();
    });

    it('should reset question stats', () => {
      quizState.reset();
      expect(quizState.questionStats.attempts).toBe(0);
      expect(quizState.questionStats.hintShown).toBe(false);
      expect(quizState.questionStats.answeredCorrectly).toBe(false);
    });

    it('should emit stateChange event', () => {
      const listener = vi.fn();
      quizState.on('stateChange', listener);
      
      quizState.reset();
      
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        type: 'stateChange',
        state: 'idle',
        previousState: 'active'
      }));
    });

    it('should not emit event if already idle', () => {
      quizState.reset();
      const listener = vi.fn();
      quizState.on('stateChange', listener);
      
      quizState.reset();
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should reset from any state', () => {
      // Reset from complete state
      quizState = new NoteQuizState({ totalQuestions: 1 });
      quizState.start(zone);
      quizState.setQuestion(testQuestion);
      quizState.submitAnswer(testNote);
      expect(quizState.state).toBe('complete');
      
      quizState.reset();
      expect(quizState.state).toBe('idle');
    });
  });

  // ============================================================
  // Update Config Tests
  // ============================================================

  describe('updateConfig()', () => {
    it('should update config when idle', () => {
      const result = quizState.updateConfig({ maxAttempts: 5 });
      expect(result).toBe(true);
      expect(quizState.config.maxAttempts).toBe(5);
    });

    it('should merge with existing config', () => {
      quizState.updateConfig({ maxAttempts: 5 });
      expect(quizState.config.totalQuestions).toBe(DEFAULT_QUIZ_CONFIG.totalQuestions);
    });

    it('should fail when quiz is active', () => {
      quizState.start(zone);
      const result = quizState.updateConfig({ maxAttempts: 5 });
      expect(result).toBe(false);
      expect(quizState.config.maxAttempts).toBe(DEFAULT_QUIZ_CONFIG.maxAttempts);
    });
  });

  // ============================================================
  // Pause/Resume Tests
  // ============================================================

  describe('pause() and resume()', () => {
    it('pause should return true when active', () => {
      quizState.start(zone);
      expect(quizState.pause()).toBe(true);
    });

    it('pause should return false when idle', () => {
      expect(quizState.pause()).toBe(false);
    });

    it('resume should return true when active', () => {
      quizState.start(zone);
      quizState.pause();
      expect(quizState.resume()).toBe(true);
    });

    it('resume should return false when idle', () => {
      expect(quizState.resume()).toBe(false);
    });
  });

  // ============================================================
  // Invalid State Transition Tests
  // ============================================================

  describe('invalid state transitions', () => {
    it('submitAnswer should return invalid when idle', () => {
      const result = quizState.submitAnswer(testNote);
      expect(result).toBe('invalid');
    });

    it('submitAnswer should return invalid when no question set', () => {
      quizState.start(zone);
      const result = quizState.submitAnswer(testNote);
      expect(result).toBe('invalid');
    });

    it('submitAnswer should return invalid when in hint state', () => {
      const wrongNote = new Note('D', 4, 1, 5);
      quizState.start(zone);
      quizState.setQuestion(testQuestion);
      
      // Trigger hint state
      for (let i = 0; i < DEFAULT_QUIZ_CONFIG.maxAttempts; i++) {
        quizState.submitAnswer(wrongNote);
      }
      
      const result = quizState.submitAnswer(testNote);
      expect(result).toBe('invalid');
    });

    it('submitAnswer should return invalid when complete', () => {
      quizState = new NoteQuizState({ totalQuestions: 1 });
      quizState.start(zone);
      quizState.setQuestion(testQuestion);
      quizState.submitAnswer(testNote);
      
      const result = quizState.submitAnswer(testNote);
      expect(result).toBe('invalid');
    });
  });

  // ============================================================
  // Event System Tests
  // ============================================================

  describe('event system', () => {
    it('on() should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = quizState.on('stateChange', listener);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('unsubscribe should remove listener', () => {
      const listener = vi.fn();
      const unsubscribe = quizState.on('stateChange', listener);
      
      unsubscribe();
      quizState.start(zone);
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('off() should remove specific listener', () => {
      const listener = vi.fn();
      quizState.on('stateChange', listener);
      quizState.off('stateChange', listener);
      
      quizState.start(zone);
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('removeAllListeners() should remove all listeners for event type', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      quizState.on('stateChange', listener1);
      quizState.on('stateChange', listener2);
      
      quizState.removeAllListeners('stateChange');
      quizState.start(zone);
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('removeAllListeners() without type should remove all listeners', () => {
      const stateListener = vi.fn();
      const questionListener = vi.fn();
      quizState.on('stateChange', stateListener);
      quizState.on('questionGenerated', questionListener);
      
      quizState.removeAllListeners();
      quizState.start(zone);
      quizState.setQuestion(testQuestion);
      
      expect(stateListener).not.toHaveBeenCalled();
      expect(questionListener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => { throw new Error('Test error'); });
      const normalListener = vi.fn();
      
      quizState.on('stateChange', errorListener);
      quizState.on('stateChange', normalListener);
      
      // Should not throw
      expect(() => quizState.start(zone)).not.toThrow();
      
      // Other listeners should still be called
      expect(normalListener).toHaveBeenCalled();
    });

    it('should support multiple listeners for same event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      quizState.on('stateChange', listener1);
      quizState.on('stateChange', listener2);
      quizState.start(zone);
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  // ============================================================
  // Edge Cases Tests
  // ============================================================

  describe('edge cases', () => {
    it('should handle quiz with single question', () => {
      quizState = new NoteQuizState({ totalQuestions: 1 });
      quizState.start(zone);
      quizState.setQuestion(testQuestion);
      quizState.submitAnswer(testNote);
      
      expect(quizState.state).toBe('complete');
      expect(quizState.getResult()!.totalQuestions).toBe(1);
    });

    it('should handle maxAttempts of 1', () => {
      quizState = new NoteQuizState({ maxAttempts: 1 });
      quizState.start(zone);
      quizState.setQuestion(testQuestion);
      
      const wrongNote = new Note('D', 4, 1, 5);
      quizState.submitAnswer(wrongNote);
      
      expect(quizState.state).toBe('hint');
    });

    it('should handle correct answer on max attempt', () => {
      quizState.start(zone);
      quizState.setQuestion(testQuestion);
      
      const wrongNote = new Note('D', 4, 1, 5);
      // Submit max-1 wrong answers
      for (let i = 0; i < DEFAULT_QUIZ_CONFIG.maxAttempts - 1; i++) {
        quizState.submitAnswer(wrongNote);
      }
      
      // Correct on last attempt
      const result = quizState.submitAnswer(testNote);
      expect(result).toBe('correct');
      expect(quizState.state).toBe('active');
    });

    it('should handle all questions needing hints', () => {
      quizState = new NoteQuizState({ totalQuestions: 2 });
      quizState.start(zone);
      
      const wrongNote = new Note('D', 4, 1, 5);
      
      for (let q = 0; q < 2; q++) {
        quizState.setQuestion({ ...testQuestion, questionNumber: q + 1 });
        for (let a = 0; a < DEFAULT_QUIZ_CONFIG.maxAttempts; a++) {
          quizState.submitAnswer(wrongNote);
        }
        quizState.acknowledgeHint();
      }
      
      expect(quizState.state).toBe('complete');
      const result = quizState.getResult();
      expect(result!.hintsUsed).toBe(2);
      expect(result!.correctAnswers).toBe(0);
      expect(result!.accuracy).toBe(0);
    });

    it('questionStats should be immutable copy', () => {
      quizState.start(zone);
      quizState.setQuestion(testQuestion);
      
      const stats = quizState.questionStats;
      // @ts-expect-error - Testing immutability
      stats.attempts = 99;
      
      expect(quizState.questionStats.attempts).toBe(0);
    });

    it('config should be immutable copy', () => {
      const config = quizState.config;
      // @ts-expect-error - Testing immutability
      config.maxAttempts = 99;
      
      expect(quizState.config.maxAttempts).toBe(DEFAULT_QUIZ_CONFIG.maxAttempts);
    });
  });
});
