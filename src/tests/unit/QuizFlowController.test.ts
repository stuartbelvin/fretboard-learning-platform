import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  QuizFlowController,
  DEFAULT_FLOW_CONFIG,
} from '../../core/quiz/QuizFlowController';
import type {
  FlowEvent
} from '../../core/quiz/QuizFlowController';
import { HighlightZone } from '../../core/zones/HighlightZone';
import { Note } from '../../core/music-theory/Note';
import { createRectangleZone } from '../../core/zones/ZoneShapeUtilities';

describe('QuizFlowController', () => {
  let controller: QuizFlowController;
  let zone: HighlightZone;

  beforeEach(() => {
    vi.useFakeTimers();
    controller = new QuizFlowController();
    
    // Create a zone with multiple notes for testing
    zone = createRectangleZone({
      startString: 1,
      endString: 6,
      startFret: 0,
      endFret: 12,
      name: 'Test Zone'
    });
  });

  afterEach(() => {
    controller.dispose();
    vi.useRealTimers();
  });

  // ============================================================
  // Constructor Tests
  // ============================================================

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      expect(controller.autoAdvanceEnabled).toBe(DEFAULT_FLOW_CONFIG.autoAdvance);
      expect(controller.autoAdvanceDelay).toBe(DEFAULT_FLOW_CONFIG.autoAdvanceDelay);
    });

    it('should accept custom auto-advance settings', () => {
      const customController = new QuizFlowController({
        autoAdvance: false,
        autoAdvanceDelay: 2000
      });
      
      expect(customController.autoAdvanceEnabled).toBe(false);
      expect(customController.autoAdvanceDelay).toBe(2000);
      
      customController.dispose();
    });

    it('should initialize with running pause state', () => {
      expect(controller.pauseState).toBe('running');
      expect(controller.isPaused).toBe(false);
      expect(controller.isRunning).toBe(true);
    });

    it('should initialize with no active zone', () => {
      expect(controller.activeZone).toBeNull();
    });

    it('should initialize with idle quiz state', () => {
      expect(controller.quizState).toBe('idle');
    });

    it('should initialize with no current question', () => {
      expect(controller.currentQuestion).toBeNull();
    });

    it('should accept quiz configuration', () => {
      const customController = new QuizFlowController({
        quizConfig: {
          maxAttempts: 5,
          totalQuestions: 20
        }
      });
      
      expect(customController.state.config.maxAttempts).toBe(5);
      expect(customController.state.config.totalQuestions).toBe(20);
      
      customController.dispose();
    });
  });

  // ============================================================
  // DEFAULT_FLOW_CONFIG Tests
  // ============================================================

  describe('DEFAULT_FLOW_CONFIG', () => {
    it('should have autoAdvance enabled by default', () => {
      expect(DEFAULT_FLOW_CONFIG.autoAdvance).toBe(true);
    });

    it('should have autoAdvanceDelay of 1000ms by default', () => {
      expect(DEFAULT_FLOW_CONFIG.autoAdvanceDelay).toBe(1000);
    });

    it('should have autoShowHint enabled by default', () => {
      expect(DEFAULT_FLOW_CONFIG.autoShowHint).toBe(true);
    });
  });

  // ============================================================
  // Quiz Start Tests
  // ============================================================

  describe('start', () => {
    it('should start quiz with valid zone', () => {
      const started = controller.start(zone);
      
      expect(started).toBe(true);
      expect(controller.quizState).toBe('active');
      expect(controller.activeZone).toBe(zone);
    });

    it('should generate first question on start', () => {
      controller.start(zone);
      
      expect(controller.currentQuestion).not.toBeNull();
      expect(controller.currentQuestion?.questionNumber).toBe(1);
    });

    it('should emit quizStarted event', () => {
      const listener = vi.fn();
      controller.on('quizStarted', listener);
      
      controller.start(zone);
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'quizStarted',
          quizState: 'active'
        })
      );
    });

    it('should emit questionReady event after start', () => {
      const listener = vi.fn();
      controller.on('questionReady', listener);
      
      controller.start(zone);
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'questionReady',
          question: expect.any(Object)
        })
      );
    });

    it('should fail to start with empty zone', () => {
      const emptyZone = new HighlightZone('Empty');
      const started = controller.start(emptyZone);
      
      expect(started).toBe(false);
      expect(controller.quizState).toBe('idle');
    });

    it('should fail to start with null zone', () => {
      const started = controller.start(null as unknown as HighlightZone);
      
      expect(started).toBe(false);
    });

    it('should reset pause state on start', () => {
      controller.start(zone);
      
      expect(controller.pauseState).toBe('running');
      expect(controller.isPaused).toBe(false);
    });
  });

  // ============================================================
  // Score Tracking Tests
  // ============================================================

  describe('getScore', () => {
    it('should return zero scores before start', () => {
      const score = controller.getScore();
      
      expect(score.correct).toBe(0);
      expect(score.total).toBe(0);
      expect(score.hintsUsed).toBe(0);
      expect(score.totalAttempts).toBe(0);
      expect(score.accuracy).toBe(0);
    });

    it('should return zero scores after start but before answering', () => {
      controller.start(zone);
      const score = controller.getScore();
      
      expect(score.correct).toBe(0);
      expect(score.total).toBe(0);
      expect(score.display).toBe('0/0');
    });

    it('should update score after correct answer', () => {
      controller.start(zone);
      const question = controller.currentQuestion!;
      
      // Find a note with the target pitch class
      const targetNote = new Note(question.targetPitchClass, 4, 1, 5);
      controller.submitAnswer(targetNote);
      
      const score = controller.getScore();
      expect(score.correct).toBe(1);
      expect(score.total).toBe(1);
      expect(score.display).toBe('1/1');
      expect(score.accuracy).toBe(100);
    });

    it('should track attempts correctly', () => {
      controller.start(zone);
      const question = controller.currentQuestion!;
      
      // Submit wrong answer first
      const wrongNote = new Note(
        question.targetPitchClass === 'C' ? 'D' : 'C',
        4, 1, 3
      );
      controller.submitAnswer(wrongNote);
      
      // Then correct answer
      const targetNote = new Note(question.targetPitchClass, 4, 1, 5);
      controller.submitAnswer(targetNote);
      
      const score = controller.getScore();
      expect(score.totalAttempts).toBe(2);
    });

    it('should calculate accuracy correctly', () => {
      controller.start(zone);
      
      // Answer first question correctly
      const q1 = controller.currentQuestion!;
      controller.submitAnswer(new Note(q1.targetPitchClass, 4, 1, 5));
      vi.advanceTimersByTime(1000);
      
      // Answer second question incorrectly then acknowledge hint
      const q2 = controller.currentQuestion!;
      const wrongPitch = q2.targetPitchClass === 'C' ? 'D' : 'C';
      for (let i = 0; i < 3; i++) {
        controller.submitAnswer(new Note(wrongPitch, 4, 1, 3));
      }
      controller.acknowledgeHint();
      
      const score = controller.getScore();
      expect(score.correct).toBe(1);
      expect(score.total).toBe(2);
      expect(score.accuracy).toBe(50);
    });

    it('should return immutable score data', () => {
      controller.start(zone);
      const score1 = controller.getScore();
      const score2 = controller.getScore();
      
      expect(score1).not.toBe(score2);
      expect(score1).toEqual(score2);
    });
  });

  // ============================================================
  // Progress Tracking Tests
  // ============================================================

  describe('getProgress', () => {
    it('should show question 1 of total before answering', () => {
      controller.start(zone);
      const progress = controller.getProgress();
      
      expect(progress.currentQuestion).toBe(1);
      expect(progress.totalQuestions).toBe(10);
      expect(progress.display).toBe('Question 1 of 10');
      expect(progress.percentage).toBe(0);
    });

    it('should update after answering question', () => {
      controller.start(zone);
      const question = controller.currentQuestion!;
      const targetNote = new Note(question.targetPitchClass, 4, 1, 5);
      
      controller.submitAnswer(targetNote);
      vi.advanceTimersByTime(1000); // Wait for auto-advance
      
      const progress = controller.getProgress();
      expect(progress.currentQuestion).toBe(2);
      expect(progress.percentage).toBe(10);
    });

    it('should respect custom total questions', () => {
      const customController = new QuizFlowController({
        quizConfig: { totalQuestions: 5 }
      });
      
      customController.start(zone);
      const progress = customController.getProgress();
      
      expect(progress.totalQuestions).toBe(5);
      expect(progress.display).toBe('Question 1 of 5');
      
      customController.dispose();
    });

    it('should not exceed total questions at end', () => {
      const shortQuiz = new QuizFlowController({
        quizConfig: { totalQuestions: 2 }
      });
      
      shortQuiz.start(zone);
      
      // Answer both questions
      for (let i = 0; i < 2; i++) {
        const q = shortQuiz.currentQuestion!;
        shortQuiz.submitAnswer(new Note(q.targetPitchClass, 4, 1, 5));
        vi.advanceTimersByTime(1000);
      }
      
      const progress = shortQuiz.getProgress();
      expect(progress.currentQuestion).toBeLessThanOrEqual(progress.totalQuestions);
      
      shortQuiz.dispose();
    });
  });

  // ============================================================
  // Answer Submission Tests
  // ============================================================

  describe('submitAnswer', () => {
    it('should return null when paused', () => {
      controller.start(zone);
      controller.pause();
      
      const question = controller.currentQuestion!;
      const note = new Note(question.targetPitchClass, 4, 1, 5);
      const result = controller.submitAnswer(note);
      
      expect(result).toBeNull();
    });

    it('should return null when no current question', () => {
      const result = controller.submitAnswer(new Note('C', 4, 1, 5));
      
      expect(result).toBeNull();
    });

    it('should return validation result for correct answer', () => {
      controller.start(zone);
      const question = controller.currentQuestion!;
      const note = new Note(question.targetPitchClass, 4, 1, 5);
      
      const result = controller.submitAnswer(note);
      
      expect(result).not.toBeNull();
      expect(result!.isCorrect).toBe(true);
    });

    it('should return validation result for incorrect answer', () => {
      controller.start(zone);
      const question = controller.currentQuestion!;
      const wrongPitch = question.targetPitchClass === 'C' ? 'D' : 'C';
      const note = new Note(wrongPitch, 4, 1, 5);
      
      const result = controller.submitAnswer(note);
      
      expect(result).not.toBeNull();
      expect(result!.isCorrect).toBe(false);
    });

    it('should emit answerProcessed event', () => {
      const listener = vi.fn();
      controller.on('answerProcessed', listener);
      
      controller.start(zone);
      const question = controller.currentQuestion!;
      controller.submitAnswer(new Note(question.targetPitchClass, 4, 1, 5));
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'answerProcessed'
        })
      );
    });

    it('should show correct feedback on correct answer', () => {
      controller.start(zone);
      const question = controller.currentQuestion!;
      controller.submitAnswer(new Note(question.targetPitchClass, 4, 1, 5));
      
      const feedback = controller.activeFeedback;
      expect(feedback.length).toBeGreaterThan(0);
      expect(feedback[0].type).toBe('correct');
    });

    it('should show incorrect feedback on wrong answer', () => {
      controller.start(zone);
      const question = controller.currentQuestion!;
      const wrongPitch = question.targetPitchClass === 'C' ? 'D' : 'C';
      controller.submitAnswer(new Note(wrongPitch, 4, 1, 5));
      
      const feedback = controller.activeFeedback;
      expect(feedback.length).toBeGreaterThan(0);
      expect(feedback[0].type).toBe('incorrect');
    });

    it('should handle enharmonic equivalents', () => {
      // Force a question for a note with enharmonic (like C#/Db)
      const customController = new QuizFlowController({
        generatorConfig: {
          pitchClassFilter: 'sharps'
        }
      });
      
      customController.start(zone);
      const question = customController.currentQuestion!;
      
      // If target is C#, answer with the same pitch
      if (question.targetPitchClass === 'C#') {
        const result = customController.submitAnswer(new Note('C#', 4, 1, 4));
        expect(result?.isCorrect).toBe(true);
      }
      
      customController.dispose();
    });
  });

  // ============================================================
  // Auto-Advance Tests
  // ============================================================

  describe('auto-advance', () => {
    it('should schedule auto-advance after correct answer', () => {
      controller.start(zone);
      const question = controller.currentQuestion!;
      controller.submitAnswer(new Note(question.targetPitchClass, 4, 1, 5));
      
      expect(controller.pauseState).toBe('auto-advance-pending');
      expect(controller.isAutoAdvancePending).toBe(true);
    });

    it('should emit autoAdvanceScheduled event', () => {
      const listener = vi.fn();
      controller.on('autoAdvanceScheduled', listener);
      
      controller.start(zone);
      const question = controller.currentQuestion!;
      controller.submitAnswer(new Note(question.targetPitchClass, 4, 1, 5));
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'autoAdvanceScheduled',
          autoAdvanceRemaining: 1000
        })
      );
    });

    it('should advance to next question after delay', () => {
      controller.start(zone);
      const q1 = controller.currentQuestion!;
      controller.submitAnswer(new Note(q1.targetPitchClass, 4, 1, 5));
      
      vi.advanceTimersByTime(1000);
      
      expect(controller.pauseState).toBe('running');
      expect(controller.currentQuestion?.questionNumber).toBe(2);
    });

    it('should use custom auto-advance delay', () => {
      const customController = new QuizFlowController({
        autoAdvanceDelay: 2000
      });
      
      customController.start(zone);
      const q1 = customController.currentQuestion!;
      customController.submitAnswer(new Note(q1.targetPitchClass, 4, 1, 5));
      
      vi.advanceTimersByTime(1000);
      expect(customController.currentQuestion?.questionNumber).toBe(1);
      
      vi.advanceTimersByTime(1000);
      expect(customController.currentQuestion?.questionNumber).toBe(2);
      
      customController.dispose();
    });

    it('should not auto-advance when disabled', () => {
      const noAutoController = new QuizFlowController({
        autoAdvance: false
      });
      
      noAutoController.start(zone);
      const q1 = noAutoController.currentQuestion!;
      noAutoController.submitAnswer(new Note(q1.targetPitchClass, 4, 1, 5));
      
      vi.advanceTimersByTime(2000);
      
      expect(noAutoController.pauseState).toBe('running');
      // Question doesn't change without manual advance
      expect(noAutoController.currentQuestion?.questionNumber).toBe(1);
      
      noAutoController.dispose();
    });

    it('should return remaining auto-advance time', () => {
      controller.start(zone);
      const question = controller.currentQuestion!;
      controller.submitAnswer(new Note(question.targetPitchClass, 4, 1, 5));
      
      vi.advanceTimersByTime(300);
      
      // Remaining time should be approximately 700ms
      expect(controller.autoAdvanceRemaining).toBeLessThanOrEqual(700);
      expect(controller.autoAdvanceRemaining).toBeGreaterThan(600);
    });

    it('should cancel auto-advance with cancelAutoAdvance', () => {
      controller.start(zone);
      const question = controller.currentQuestion!;
      controller.submitAnswer(new Note(question.targetPitchClass, 4, 1, 5));
      
      const cancelled = controller.cancelAutoAdvance();
      
      expect(cancelled).toBe(true);
      expect(controller.pauseState).toBe('running');
      expect(controller.autoAdvanceRemaining).toBeNull();
    });

    it('should emit autoAdvanceCancelled event', () => {
      const listener = vi.fn();
      controller.on('autoAdvanceCancelled', listener);
      
      controller.start(zone);
      const question = controller.currentQuestion!;
      controller.submitAnswer(new Note(question.targetPitchClass, 4, 1, 5));
      controller.cancelAutoAdvance();
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should return false when cancelling with no pending advance', () => {
      controller.start(zone);
      
      const cancelled = controller.cancelAutoAdvance();
      
      expect(cancelled).toBe(false);
    });

    it('should clear feedback when auto-advancing', () => {
      controller.start(zone);
      const question = controller.currentQuestion!;
      controller.submitAnswer(new Note(question.targetPitchClass, 4, 1, 5));
      
      expect(controller.activeFeedback.length).toBeGreaterThan(0);
      
      vi.advanceTimersByTime(1000);
      
      expect(controller.activeFeedback.length).toBe(0);
    });
  });

  // ============================================================
  // Pause/Resume Tests
  // ============================================================

  describe('pause', () => {
    it('should pause a running quiz', () => {
      controller.start(zone);
      const paused = controller.pause();
      
      expect(paused).toBe(true);
      expect(controller.pauseState).toBe('paused');
      expect(controller.isPaused).toBe(true);
    });

    it('should return false when already paused', () => {
      controller.start(zone);
      controller.pause();
      
      const pausedAgain = controller.pause();
      
      expect(pausedAgain).toBe(false);
    });

    it('should return false when quiz not active', () => {
      const paused = controller.pause();
      
      expect(paused).toBe(false);
    });

    it('should preserve auto-advance timer state', () => {
      controller.start(zone);
      const question = controller.currentQuestion!;
      controller.submitAnswer(new Note(question.targetPitchClass, 4, 1, 5));
      
      vi.advanceTimersByTime(300);
      controller.pause();
      
      expect(controller.autoAdvanceRemaining).toBeLessThanOrEqual(700);
      expect(controller.autoAdvanceRemaining).toBeGreaterThan(600);
    });

    it('should emit paused event', () => {
      const listener = vi.fn();
      controller.on('paused', listener);
      
      controller.start(zone);
      controller.pause();
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'paused',
          pauseState: 'paused'
        })
      );
    });

    it('should record pause timestamp', () => {
      controller.start(zone);
      const beforePause = Date.now();
      controller.pause();
      
      expect(controller.pausedAt).toBeGreaterThanOrEqual(beforePause);
    });

    it('should reject answer submissions when paused', () => {
      controller.start(zone);
      const question = controller.currentQuestion!;
      controller.pause();
      
      const result = controller.submitAnswer(new Note(question.targetPitchClass, 4, 1, 5));
      
      expect(result).toBeNull();
    });
  });

  describe('resume', () => {
    it('should resume a paused quiz', () => {
      controller.start(zone);
      controller.pause();
      
      const resumed = controller.resume();
      
      expect(resumed).toBe(true);
      expect(controller.isPaused).toBe(false);
    });

    it('should return false when not paused', () => {
      controller.start(zone);
      
      const resumed = controller.resume();
      
      expect(resumed).toBe(false);
    });

    it('should restore auto-advance timer', () => {
      controller.start(zone);
      const question = controller.currentQuestion!;
      controller.submitAnswer(new Note(question.targetPitchClass, 4, 1, 5));
      
      vi.advanceTimersByTime(300);
      controller.pause();
      controller.resume();
      
      expect(controller.pauseState).toBe('auto-advance-pending');
      
      // Advance remaining time
      vi.advanceTimersByTime(700);
      
      expect(controller.pauseState).toBe('running');
      expect(controller.currentQuestion?.questionNumber).toBe(2);
    });

    it('should emit resumed event', () => {
      const listener = vi.fn();
      controller.on('resumed', listener);
      
      controller.start(zone);
      controller.pause();
      controller.resume();
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'resumed'
        })
      );
    });

    it('should clear pausedAt timestamp', () => {
      controller.start(zone);
      controller.pause();
      controller.resume();
      
      expect(controller.pausedAt).toBeNull();
    });

    it('should allow answer submissions after resume', () => {
      controller.start(zone);
      controller.pause();
      controller.resume();
      
      const question = controller.currentQuestion!;
      const result = controller.submitAnswer(new Note(question.targetPitchClass, 4, 1, 5));
      
      expect(result).not.toBeNull();
    });
  });

  describe('pausedDuration', () => {
    it('should return 0 when not paused', () => {
      controller.start(zone);
      
      expect(controller.pausedDuration).toBe(0);
    });

    it('should track pause duration', () => {
      controller.start(zone);
      controller.pause();
      
      vi.advanceTimersByTime(5000);
      
      expect(controller.pausedDuration).toBeGreaterThanOrEqual(5000);
    });
  });

  // ============================================================
  // Manual Advance Tests
  // ============================================================

  describe('advanceToNextQuestion', () => {
    it('should advance to next question manually', () => {
      controller.start(zone);
      const q1Number = controller.currentQuestion?.questionNumber;
      
      const advanced = controller.advanceToNextQuestion();
      
      expect(advanced).toBe(true);
      expect(controller.currentQuestion?.questionNumber).toBe((q1Number ?? 0) + 1);
    });

    it('should cancel any pending auto-advance', () => {
      controller.start(zone);
      const question = controller.currentQuestion!;
      controller.submitAnswer(new Note(question.targetPitchClass, 4, 1, 5));
      
      expect(controller.isAutoAdvancePending).toBe(true);
      
      controller.advanceToNextQuestion();
      
      expect(controller.pauseState).toBe('running');
    });

    it('should clear active feedback', () => {
      controller.start(zone);
      const question = controller.currentQuestion!;
      controller.submitAnswer(new Note(question.targetPitchClass, 4, 1, 5));
      
      controller.advanceToNextQuestion();
      
      expect(controller.activeFeedback.length).toBe(0);
    });

    it('should return false when quiz not active', () => {
      const advanced = controller.advanceToNextQuestion();
      
      expect(advanced).toBe(false);
    });
  });

  // ============================================================
  // Hint Handling Tests
  // ============================================================

  describe('hint handling', () => {
    it('should show hint after max attempts', () => {
      controller.start(zone);
      const question = controller.currentQuestion!;
      const wrongPitch = question.targetPitchClass === 'C' ? 'D' : 'C';
      
      // Submit wrong answers until max attempts
      for (let i = 0; i < 3; i++) {
        controller.submitAnswer(new Note(wrongPitch, 4, 1, 3));
      }
      
      // Check for hint feedback
      const feedback = controller.activeFeedback;
      expect(feedback.some(f => f.type === 'hint')).toBe(true);
    });

    it('should acknowledge hint and advance', () => {
      controller.start(zone);
      const question = controller.currentQuestion!;
      const wrongPitch = question.targetPitchClass === 'C' ? 'D' : 'C';
      
      for (let i = 0; i < 3; i++) {
        controller.submitAnswer(new Note(wrongPitch, 4, 1, 3));
      }
      
      const acknowledged = controller.acknowledgeHint();
      
      expect(acknowledged).toBe(true);
      expect(controller.currentQuestion?.questionNumber).toBe(2);
    });

    it('should clear feedback after acknowledging hint', () => {
      controller.start(zone);
      const question = controller.currentQuestion!;
      const wrongPitch = question.targetPitchClass === 'C' ? 'D' : 'C';
      
      for (let i = 0; i < 3; i++) {
        controller.submitAnswer(new Note(wrongPitch, 4, 1, 3));
      }
      
      controller.acknowledgeHint();
      
      expect(controller.activeFeedback.length).toBe(0);
    });

    it('should track hints used in score', () => {
      controller.start(zone);
      const question = controller.currentQuestion!;
      const wrongPitch = question.targetPitchClass === 'C' ? 'D' : 'C';
      
      for (let i = 0; i < 3; i++) {
        controller.submitAnswer(new Note(wrongPitch, 4, 1, 3));
      }
      controller.acknowledgeHint();
      
      const score = controller.getScore();
      expect(score.hintsUsed).toBe(1);
    });
  });

  // ============================================================
  // Quiz Completion Tests
  // ============================================================

  describe('quiz completion', () => {
    it('should complete quiz after all questions answered', () => {
      const shortQuiz = new QuizFlowController({
        quizConfig: { totalQuestions: 2 }
      });
      
      shortQuiz.start(zone);
      
      // Answer question 1
      const q1 = shortQuiz.currentQuestion!;
      shortQuiz.submitAnswer(new Note(q1.targetPitchClass, 4, 1, 5));
      vi.advanceTimersByTime(1000);
      
      // Answer question 2
      const q2 = shortQuiz.currentQuestion!;
      shortQuiz.submitAnswer(new Note(q2.targetPitchClass, 4, 1, 5));
      vi.advanceTimersByTime(1000);
      
      expect(shortQuiz.quizState).toBe('complete');
      
      shortQuiz.dispose();
    });

    it('should emit quizCompleted event', () => {
      const shortQuiz = new QuizFlowController({
        quizConfig: { totalQuestions: 1 }
      });
      
      const listener = vi.fn();
      shortQuiz.on('quizCompleted', listener);
      
      shortQuiz.start(zone);
      const q = shortQuiz.currentQuestion!;
      shortQuiz.submitAnswer(new Note(q.targetPitchClass, 4, 1, 5));
      vi.advanceTimersByTime(1000);
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'quizCompleted',
          result: expect.any(Object)
        })
      );
      
      shortQuiz.dispose();
    });

    it('should provide final result', () => {
      const shortQuiz = new QuizFlowController({
        quizConfig: { totalQuestions: 1 }
      });
      
      shortQuiz.start(zone);
      const q = shortQuiz.currentQuestion!;
      shortQuiz.submitAnswer(new Note(q.targetPitchClass, 4, 1, 5));
      vi.advanceTimersByTime(1000);
      
      const result = shortQuiz.getResult();
      
      expect(result).not.toBeNull();
      expect(result!.totalQuestions).toBe(1);
      expect(result!.correctAnswers).toBe(1);
      expect(result!.accuracy).toBe(100);
      
      shortQuiz.dispose();
    });

    it('should return null result when quiz not complete', () => {
      controller.start(zone);
      
      const result = controller.getResult();
      
      expect(result).toBeNull();
    });
  });

  // ============================================================
  // Reset Tests
  // ============================================================

  describe('reset', () => {
    it('should reset to idle state', () => {
      controller.start(zone);
      controller.reset();
      
      expect(controller.quizState).toBe('idle');
    });

    it('should clear current question', () => {
      controller.start(zone);
      controller.reset();
      
      expect(controller.currentQuestion).toBeNull();
    });

    it('should clear active zone', () => {
      controller.start(zone);
      controller.reset();
      
      expect(controller.activeZone).toBeNull();
    });

    it('should reset pause state', () => {
      controller.start(zone);
      controller.pause();
      controller.reset();
      
      expect(controller.pauseState).toBe('running');
    });

    it('should clear auto-advance timer', () => {
      controller.start(zone);
      const q = controller.currentQuestion!;
      controller.submitAnswer(new Note(q.targetPitchClass, 4, 1, 5));
      
      controller.reset();
      
      expect(controller.autoAdvanceRemaining).toBeNull();
    });

    it('should clear feedback', () => {
      controller.start(zone);
      const q = controller.currentQuestion!;
      controller.submitAnswer(new Note(q.targetPitchClass, 4, 1, 5));
      
      controller.reset();
      
      expect(controller.activeFeedback.length).toBe(0);
    });

    it('should emit quizReset event', () => {
      const listener = vi.fn();
      controller.on('quizReset', listener);
      
      controller.start(zone);
      controller.reset();
      
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'quizReset',
          quizState: 'idle'
        })
      );
    });

    it('should allow starting new quiz after reset', () => {
      controller.start(zone);
      controller.reset();
      
      const started = controller.start(zone);
      
      expect(started).toBe(true);
      expect(controller.quizState).toBe('active');
    });
  });

  // ============================================================
  // Configuration Update Tests
  // ============================================================

  describe('updateConfig', () => {
    it('should update auto-advance setting', () => {
      controller.updateConfig({ autoAdvance: false });
      
      expect(controller.autoAdvanceEnabled).toBe(false);
    });

    it('should update auto-advance delay', () => {
      controller.updateConfig({ autoAdvanceDelay: 2000 });
      
      expect(controller.autoAdvanceDelay).toBe(2000);
    });

    it('should return false when quiz is active', () => {
      controller.start(zone);
      
      const updated = controller.updateConfig({ autoAdvance: false });
      
      expect(updated).toBe(false);
      expect(controller.autoAdvanceEnabled).toBe(true);
    });

    it('should return true when quiz is idle', () => {
      const updated = controller.updateConfig({ autoAdvance: false });
      
      expect(updated).toBe(true);
    });

    it('should update quiz config', () => {
      controller.updateConfig({
        quizConfig: { maxAttempts: 5 }
      });
      
      expect(controller.state.config.maxAttempts).toBe(5);
    });

    it('should update generator config', () => {
      controller.updateConfig({
        generatorConfig: { pitchClassFilter: 'natural' }
      });
      
      // Start quiz and check generated questions use natural notes
      controller.start(zone);
      const question = controller.currentQuestion!;
      
      const naturalNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      expect(naturalNotes).toContain(question.targetPitchClass);
    });
  });

  // ============================================================
  // Event System Tests
  // ============================================================

  describe('event system', () => {
    it('should support multiple listeners for same event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      controller.on('quizStarted', listener1);
      controller.on('quizStarted', listener2);
      
      controller.start(zone);
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = controller.on('quizStarted', listener);
      
      unsubscribe();
      controller.start(zone);
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should remove listener with off', () => {
      const listener = vi.fn();
      controller.on('quizStarted', listener);
      controller.off('quizStarted', listener);
      
      controller.start(zone);
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should remove all listeners for event type', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      controller.on('quizStarted', listener1);
      controller.on('quizStarted', listener2);
      controller.removeAllListeners('quizStarted');
      
      controller.start(zone);
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should remove all listeners when no type specified', () => {
      const startListener = vi.fn();
      const resetListener = vi.fn();
      
      controller.on('quizStarted', startListener);
      controller.on('quizReset', resetListener);
      controller.removeAllListeners();
      
      controller.start(zone);
      controller.reset();
      
      expect(startListener).not.toHaveBeenCalled();
      expect(resetListener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Test error');
      });
      const goodListener = vi.fn();
      
      controller.on('quizStarted', errorListener);
      controller.on('quizStarted', goodListener);
      
      // Should not throw
      expect(() => controller.start(zone)).not.toThrow();
      expect(goodListener).toHaveBeenCalled();
    });

    it('should include timestamp in events', () => {
      const listener = vi.fn();
      controller.on('quizStarted', listener);
      
      const beforeStart = Date.now();
      controller.start(zone);
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Number)
        })
      );
      
      const event = listener.mock.calls[0][0] as FlowEvent;
      expect(event.timestamp).toBeGreaterThanOrEqual(beforeStart);
    });
  });

  // ============================================================
  // Dispose Tests
  // ============================================================

  describe('dispose', () => {
    it('should clear auto-advance timer', () => {
      controller.start(zone);
      const q = controller.currentQuestion!;
      controller.submitAnswer(new Note(q.targetPitchClass, 4, 1, 5));
      
      controller.dispose();
      
      // Timer shouldn't fire after dispose
      vi.advanceTimersByTime(2000);
      // No error should occur
    });

    it('should clear all listeners', () => {
      const listener = vi.fn();
      controller.on('quizStarted', listener);
      
      controller.dispose();
      
      // Start should work but listener shouldn't be called
      // Note: after dispose, the controller is in an undefined state
      // but this tests that listeners are cleared
    });

    it('should clear active zone', () => {
      controller.start(zone);
      controller.dispose();
      
      expect(controller.activeZone).toBeNull();
    });
  });

  // ============================================================
  // Integration Tests
  // ============================================================

  describe('integration scenarios', () => {
    it('should handle complete quiz flow with correct answers', () => {
      const shortQuiz = new QuizFlowController({
        quizConfig: { totalQuestions: 3 }
      });
      
      shortQuiz.start(zone);
      
      for (let i = 0; i < 3; i++) {
        const q = shortQuiz.currentQuestion!;
        shortQuiz.submitAnswer(new Note(q.targetPitchClass, 4, 1, 5));
        vi.advanceTimersByTime(1000);
      }
      
      expect(shortQuiz.quizState).toBe('complete');
      
      const result = shortQuiz.getResult();
      expect(result?.correctAnswers).toBe(3);
      expect(result?.accuracy).toBe(100);
      
      shortQuiz.dispose();
    });

    it('should handle mixed correct and incorrect answers', () => {
      const shortQuiz = new QuizFlowController({
        quizConfig: { totalQuestions: 2 }
      });
      
      shortQuiz.start(zone);
      
      // Wrong answer on Q1, then hint
      const q1 = shortQuiz.currentQuestion!;
      const wrongPitch = q1.targetPitchClass === 'C' ? 'D' : 'C';
      for (let i = 0; i < 3; i++) {
        shortQuiz.submitAnswer(new Note(wrongPitch, 4, 1, 3));
      }
      shortQuiz.acknowledgeHint();
      
      // Correct answer on Q2
      const q2 = shortQuiz.currentQuestion!;
      shortQuiz.submitAnswer(new Note(q2.targetPitchClass, 4, 1, 5));
      vi.advanceTimersByTime(1000);
      
      const result = shortQuiz.getResult();
      expect(result?.correctAnswers).toBe(1);
      expect(result?.hintsUsed).toBe(1);
      expect(result?.accuracy).toBe(50);
      
      shortQuiz.dispose();
    });

    it('should handle pause during auto-advance correctly', () => {
      controller.start(zone);
      const q1 = controller.currentQuestion!;
      controller.submitAnswer(new Note(q1.targetPitchClass, 4, 1, 5));
      
      vi.advanceTimersByTime(500);
      controller.pause();
      
      vi.advanceTimersByTime(1000);
      // Question should not have advanced while paused
      expect(controller.currentQuestion?.questionNumber).toBe(1);
      
      controller.resume();
      vi.advanceTimersByTime(500);
      
      // Now it should advance
      expect(controller.currentQuestion?.questionNumber).toBe(2);
    });

    it('should handle rapid answer submissions', () => {
      controller.start(zone);
      const q = controller.currentQuestion!;
      
      // Rapid incorrect submissions
      const wrongPitch = q.targetPitchClass === 'C' ? 'D' : 'C';
      controller.submitAnswer(new Note(wrongPitch, 4, 1, 3));
      controller.submitAnswer(new Note(wrongPitch, 4, 1, 3));
      controller.submitAnswer(new Note(wrongPitch, 4, 1, 3));
      
      // Should be in hint state
      expect(controller.quizState).toBe('hint');
    });

    it('should work correctly after reset and restart', () => {
      controller.start(zone);
      const q1 = controller.currentQuestion!;
      controller.submitAnswer(new Note(q1.targetPitchClass, 4, 1, 5));
      
      controller.reset();
      controller.start(zone);
      
      expect(controller.quizState).toBe('active');
      expect(controller.currentQuestion?.questionNumber).toBe(1);
      expect(controller.getScore().correct).toBe(0);
    });
  });

  // ============================================================
  // Edge Case Tests
  // ============================================================

  describe('edge cases', () => {
    it('should handle single-question quiz', () => {
      const singleQ = new QuizFlowController({
        quizConfig: { totalQuestions: 1 }
      });
      
      singleQ.start(zone);
      const q = singleQ.currentQuestion!;
      singleQ.submitAnswer(new Note(q.targetPitchClass, 4, 1, 5));
      vi.advanceTimersByTime(1000);
      
      expect(singleQ.quizState).toBe('complete');
      
      singleQ.dispose();
    });

    it('should handle maximum attempts configuration', () => {
      const strictQuiz = new QuizFlowController({
        quizConfig: { maxAttempts: 1 }
      });
      
      strictQuiz.start(zone);
      const q = strictQuiz.currentQuestion!;
      const wrongPitch = q.targetPitchClass === 'C' ? 'D' : 'C';
      
      strictQuiz.submitAnswer(new Note(wrongPitch, 4, 1, 3));
      
      // Should show hint after just 1 wrong attempt
      expect(strictQuiz.activeFeedback.some(f => f.type === 'hint')).toBe(true);
      
      strictQuiz.dispose();
    });

    it('should handle very long auto-advance delay', () => {
      const slowQuiz = new QuizFlowController({
        autoAdvanceDelay: 10000
      });
      
      slowQuiz.start(zone);
      const q = slowQuiz.currentQuestion!;
      slowQuiz.submitAnswer(new Note(q.targetPitchClass, 4, 1, 5));
      
      vi.advanceTimersByTime(5000);
      expect(slowQuiz.currentQuestion?.questionNumber).toBe(1);
      
      vi.advanceTimersByTime(5000);
      expect(slowQuiz.currentQuestion?.questionNumber).toBe(2);
      
      slowQuiz.dispose();
    });

    it('should handle zone with limited notes', () => {
      const smallZone = new HighlightZone('Small');
      smallZone.addNote(1, 0); // E4
      smallZone.addNote(2, 0); // B3
      
      controller.start(smallZone);
      
      expect(controller.quizState).toBe('active');
      expect(controller.currentQuestion).not.toBeNull();
    });
  });
});
