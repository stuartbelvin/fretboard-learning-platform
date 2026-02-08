import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Note } from '../../core/music-theory/Note';
import {
  QuizFeedbackManager,
  FeedbackType,
  FeedbackState,
  FeedbackConfig,
  DEFAULT_FEEDBACK_CONFIG,
  FeedbackEventType,
  FeedbackEvent,
} from '../../core/quiz/QuizFeedbackManager';

describe('QuizFeedbackManager', () => {
  let manager: QuizFeedbackManager;
  let testNote: Note;
  
  beforeEach(() => {
    vi.useFakeTimers();
    manager = new QuizFeedbackManager();
    testNote = new Note('C', 4, 1, 3); // C4 on string 1, fret 3
  });
  
  afterEach(() => {
    manager.dispose();
    vi.useRealTimers();
  });

  describe('DEFAULT_FEEDBACK_CONFIG', () => {
    it('has correct default values', () => {
      expect(DEFAULT_FEEDBACK_CONFIG.correctDuration).toBe(500);
      expect(DEFAULT_FEEDBACK_CONFIG.incorrectDuration).toBe(500);
      expect(DEFAULT_FEEDBACK_CONFIG.hintPulseDuration).toBe(500);
      expect(DEFAULT_FEEDBACK_CONFIG.hintPulseCount).toBe(3);
    });
  });

  describe('Constructor', () => {
    it('creates manager with default config', () => {
      const mgr = new QuizFeedbackManager();
      expect(mgr.config).toEqual(DEFAULT_FEEDBACK_CONFIG);
    });

    it('accepts partial config', () => {
      const mgr = new QuizFeedbackManager({ correctDuration: 1000 });
      expect(mgr.config.correctDuration).toBe(1000);
      expect(mgr.config.incorrectDuration).toBe(500); // default
    });

    it('starts with no active feedback', () => {
      expect(manager.activeFeedbackCount).toBe(0);
      expect(manager.hasFeedback).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('returns immutable config copy', () => {
      const config1 = manager.config;
      const config2 = manager.config;
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });

    it('updateConfig merges with existing config', () => {
      manager.updateConfig({ hintPulseCount: 5 });
      expect(manager.config.hintPulseCount).toBe(5);
      expect(manager.config.correctDuration).toBe(500); // unchanged
    });

    it('supports onFeedbackComplete callback', () => {
      const callback = vi.fn();
      manager.updateConfig({ onFeedbackComplete: callback });
      
      manager.showCorrectFeedback(testNote);
      vi.advanceTimersByTime(500);
      
      expect(callback).toHaveBeenCalledWith('correct', testNote.getPositionId());
    });
  });

  describe('showCorrectFeedback', () => {
    it('creates feedback state with correct type', () => {
      const state = manager.showCorrectFeedback(testNote);
      
      expect(state.type).toBe('correct');
      expect(state.positionId).toBe(testNote.getPositionId());
      expect(state.duration).toBe(500);
    });

    it('records start time', () => {
      const now = Date.now();
      const state = manager.showCorrectFeedback(testNote);
      
      expect(state.startTime).toBeGreaterThanOrEqual(now);
      expect(state.startTime).toBeLessThanOrEqual(now + 10);
    });

    it('adds to active feedback', () => {
      manager.showCorrectFeedback(testNote);
      
      expect(manager.activeFeedbackCount).toBe(1);
      expect(manager.hasFeedback).toBe(true);
    });

    it('auto-clears after duration', () => {
      manager.showCorrectFeedback(testNote);
      
      expect(manager.hasFeedback).toBe(true);
      
      vi.advanceTimersByTime(500);
      
      expect(manager.hasFeedback).toBe(false);
      expect(manager.activeFeedbackCount).toBe(0);
    });

    it('uses custom duration from config', () => {
      manager.updateConfig({ correctDuration: 1000 });
      manager.showCorrectFeedback(testNote);
      
      vi.advanceTimersByTime(500);
      expect(manager.hasFeedback).toBe(true);
      
      vi.advanceTimersByTime(500);
      expect(manager.hasFeedback).toBe(false);
    });
  });

  describe('showIncorrectFeedback', () => {
    it('creates feedback state with incorrect type', () => {
      const state = manager.showIncorrectFeedback(testNote);
      
      expect(state.type).toBe('incorrect');
      expect(state.positionId).toBe(testNote.getPositionId());
      expect(state.duration).toBe(500);
    });

    it('auto-clears after duration', () => {
      manager.showIncorrectFeedback(testNote);
      
      vi.advanceTimersByTime(500);
      
      expect(manager.hasFeedback).toBe(false);
    });

    it('uses custom duration from config', () => {
      manager.updateConfig({ incorrectDuration: 750 });
      manager.showIncorrectFeedback(testNote);
      
      vi.advanceTimersByTime(500);
      expect(manager.hasFeedback).toBe(true);
      
      vi.advanceTimersByTime(250);
      expect(manager.hasFeedback).toBe(false);
    });
  });

  describe('showHintFeedback', () => {
    it('creates feedback state with hint type', () => {
      const state = manager.showHintFeedback(testNote);
      
      expect(state.type).toBe('hint');
      expect(state.positionId).toBe(testNote.getPositionId());
    });

    it('includes pulse count', () => {
      const state = manager.showHintFeedback(testNote);
      
      expect(state.pulseCount).toBe(3);
    });

    it('calculates total duration from pulseCount * pulseDuration', () => {
      const state = manager.showHintFeedback(testNote);
      
      // 3 pulses * 500ms = 1500ms
      expect(state.duration).toBe(1500);
    });

    it('auto-clears after total pulse duration', () => {
      manager.showHintFeedback(testNote);
      
      vi.advanceTimersByTime(1000);
      expect(manager.hasFeedback).toBe(true);
      
      vi.advanceTimersByTime(500);
      expect(manager.hasFeedback).toBe(false);
    });

    it('uses custom pulse count from config', () => {
      manager.updateConfig({ hintPulseCount: 5, hintPulseDuration: 300 });
      const state = manager.showHintFeedback(testNote);
      
      expect(state.pulseCount).toBe(5);
      expect(state.duration).toBe(1500); // 5 * 300
    });
  });

  describe('showFeedback', () => {
    it('shows correct feedback for type "correct"', () => {
      const state = manager.showFeedback(testNote, 'correct');
      
      expect(state?.type).toBe('correct');
    });

    it('shows incorrect feedback for type "incorrect"', () => {
      const state = manager.showFeedback(testNote, 'incorrect');
      
      expect(state?.type).toBe('incorrect');
    });

    it('shows hint feedback for type "hint"', () => {
      const state = manager.showFeedback(testNote, 'hint');
      
      expect(state?.type).toBe('hint');
    });

    it('returns null for type "none"', () => {
      const state = manager.showFeedback(testNote, 'none');
      
      expect(state).toBeNull();
    });
  });

  describe('getFeedbackState', () => {
    it('returns undefined for position without feedback', () => {
      expect(manager.getFeedbackState('s1f3')).toBeUndefined();
    });

    it('returns feedback state for active position', () => {
      manager.showCorrectFeedback(testNote);
      
      const state = manager.getFeedbackState(testNote.getPositionId());
      expect(state?.type).toBe('correct');
    });
  });

  describe('getFeedbackForNote', () => {
    it('returns undefined for note without feedback', () => {
      expect(manager.getFeedbackForNote(testNote)).toBeUndefined();
    });

    it('returns feedback state for note with active feedback', () => {
      manager.showCorrectFeedback(testNote);
      
      const state = manager.getFeedbackForNote(testNote);
      expect(state?.type).toBe('correct');
    });
  });

  describe('getFeedbackType', () => {
    it('returns "none" for position without feedback', () => {
      expect(manager.getFeedbackType('s1f3')).toBe('none');
    });

    it('returns correct type for active feedback', () => {
      manager.showCorrectFeedback(testNote);
      expect(manager.getFeedbackType(testNote.getPositionId())).toBe('correct');
      
      manager.clearAllFeedback();
      
      manager.showIncorrectFeedback(testNote);
      expect(manager.getFeedbackType(testNote.getPositionId())).toBe('incorrect');
    });
  });

  describe('hasFeedbackAt', () => {
    it('returns false for position without feedback', () => {
      expect(manager.hasFeedbackAt('s1f3')).toBe(false);
    });

    it('returns true for position with active feedback', () => {
      manager.showCorrectFeedback(testNote);
      expect(manager.hasFeedbackAt(testNote.getPositionId())).toBe(true);
    });
  });

  describe('hasNoteActiveFeedback', () => {
    it('returns false for note without feedback', () => {
      expect(manager.hasNoteActiveFeedback(testNote)).toBe(false);
    });

    it('returns true for note with active feedback', () => {
      manager.showCorrectFeedback(testNote);
      expect(manager.hasNoteActiveFeedback(testNote)).toBe(true);
    });
  });

  describe('getAllActiveFeedback', () => {
    it('returns empty array when no feedback', () => {
      expect(manager.getAllActiveFeedback()).toEqual([]);
    });

    it('returns all active feedback states', () => {
      const note2 = new Note('D', 4, 2, 5);
      
      manager.showCorrectFeedback(testNote);
      manager.showIncorrectFeedback(note2);
      
      const states = manager.getAllActiveFeedback();
      expect(states).toHaveLength(2);
      expect(states.map(s => s.type)).toContain('correct');
      expect(states.map(s => s.type)).toContain('incorrect');
    });
  });

  describe('getActiveFeedbackPositions', () => {
    it('returns empty array when no feedback', () => {
      expect(manager.getActiveFeedbackPositions()).toEqual([]);
    });

    it('returns all position IDs with active feedback', () => {
      const note2 = new Note('D', 4, 2, 5);
      
      manager.showCorrectFeedback(testNote);
      manager.showIncorrectFeedback(note2);
      
      const positions = manager.getActiveFeedbackPositions();
      expect(positions).toContain(testNote.getPositionId());
      expect(positions).toContain(note2.getPositionId());
    });
  });

  describe('getRemainingDuration', () => {
    it('returns 0 for position without feedback', () => {
      expect(manager.getRemainingDuration('s1f3')).toBe(0);
    });

    it('returns remaining duration for active feedback', () => {
      manager.showCorrectFeedback(testNote);
      
      vi.advanceTimersByTime(200);
      
      const remaining = manager.getRemainingDuration(testNote.getPositionId());
      expect(remaining).toBeGreaterThanOrEqual(290);
      expect(remaining).toBeLessThanOrEqual(300);
    });

    it('returns 0 after feedback completes', () => {
      manager.showCorrectFeedback(testNote);
      
      vi.advanceTimersByTime(600);
      
      expect(manager.getRemainingDuration(testNote.getPositionId())).toBe(0);
    });
  });

  describe('clearFeedback', () => {
    it('returns false for position without feedback', () => {
      expect(manager.clearFeedback('s1f3')).toBe(false);
    });

    it('clears feedback and returns true', () => {
      manager.showCorrectFeedback(testNote);
      
      expect(manager.clearFeedback(testNote.getPositionId())).toBe(true);
      expect(manager.hasFeedback).toBe(false);
    });

    it('cancels pending timeout', () => {
      const callback = vi.fn();
      manager.updateConfig({ onFeedbackComplete: callback });
      
      manager.showCorrectFeedback(testNote);
      manager.clearFeedback(testNote.getPositionId());
      
      vi.advanceTimersByTime(1000);
      
      // Callback should not be called since we cleared manually
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('clearFeedbackForNote', () => {
    it('clears feedback for note', () => {
      manager.showCorrectFeedback(testNote);
      
      expect(manager.clearFeedbackForNote(testNote)).toBe(true);
      expect(manager.hasFeedback).toBe(false);
    });
  });

  describe('clearAllFeedback', () => {
    it('clears all active feedback', () => {
      const note2 = new Note('D', 4, 2, 5);
      const note3 = new Note('E', 4, 3, 7);
      
      manager.showCorrectFeedback(testNote);
      manager.showIncorrectFeedback(note2);
      manager.showHintFeedback(note3);
      
      expect(manager.activeFeedbackCount).toBe(3);
      
      manager.clearAllFeedback();
      
      expect(manager.activeFeedbackCount).toBe(0);
      expect(manager.hasFeedback).toBe(false);
    });

    it('cancels all pending timeouts', () => {
      const callback = vi.fn();
      manager.updateConfig({ onFeedbackComplete: callback });
      
      manager.showCorrectFeedback(testNote);
      manager.showIncorrectFeedback(new Note('D', 4, 2, 5));
      
      manager.clearAllFeedback();
      
      vi.advanceTimersByTime(2000);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Replacing existing feedback', () => {
    it('replaces existing feedback at same position', () => {
      manager.showCorrectFeedback(testNote);
      expect(manager.getFeedbackType(testNote.getPositionId())).toBe('correct');
      
      manager.showIncorrectFeedback(testNote);
      expect(manager.getFeedbackType(testNote.getPositionId())).toBe('incorrect');
      expect(manager.activeFeedbackCount).toBe(1);
    });

    it('cancels old timeout when replacing', () => {
      const callback = vi.fn();
      manager.updateConfig({ onFeedbackComplete: callback });
      
      manager.showCorrectFeedback(testNote);
      
      vi.advanceTimersByTime(200);
      
      manager.showIncorrectFeedback(testNote);
      
      vi.advanceTimersByTime(300);
      
      // First callback should not fire (was replaced)
      expect(callback).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(200);
      
      // Now the incorrect feedback completes
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('incorrect', testNote.getPositionId());
    });
  });

  describe('Event System', () => {
    describe('feedbackStart event', () => {
      it('emits when feedback starts', () => {
        const listener = vi.fn();
        manager.on('feedbackStart', listener);
        
        manager.showCorrectFeedback(testNote);
        
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
          type: 'feedbackStart',
          feedbackType: 'correct',
          positionId: testNote.getPositionId(),
        }));
      });

      it('includes note in event', () => {
        const listener = vi.fn();
        manager.on('feedbackStart', listener);
        
        manager.showCorrectFeedback(testNote);
        
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
          note: testNote,
        }));
      });
    });

    describe('feedbackComplete event', () => {
      it('emits when feedback completes', () => {
        const listener = vi.fn();
        manager.on('feedbackComplete', listener);
        
        manager.showCorrectFeedback(testNote);
        
        vi.advanceTimersByTime(500);
        
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
          type: 'feedbackComplete',
          feedbackType: 'correct',
          positionId: testNote.getPositionId(),
        }));
      });
    });

    describe('feedbackClear event', () => {
      it('emits when feedback is manually cleared', () => {
        const listener = vi.fn();
        manager.on('feedbackClear', listener);
        
        manager.showCorrectFeedback(testNote);
        manager.clearFeedback(testNote.getPositionId());
        
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
          type: 'feedbackClear',
          feedbackType: 'correct',
          positionId: testNote.getPositionId(),
        }));
      });

      it('emits for each feedback when clearAllFeedback is called', () => {
        const listener = vi.fn();
        manager.on('feedbackClear', listener);
        
        manager.showCorrectFeedback(testNote);
        manager.showIncorrectFeedback(new Note('D', 4, 2, 5));
        
        manager.clearAllFeedback();
        
        expect(listener).toHaveBeenCalledTimes(2);
      });
    });

    describe('on/off', () => {
      it('returns unsubscribe function', () => {
        const listener = vi.fn();
        const unsubscribe = manager.on('feedbackStart', listener);
        
        manager.showCorrectFeedback(testNote);
        expect(listener).toHaveBeenCalledTimes(1);
        
        unsubscribe();
        
        manager.showIncorrectFeedback(new Note('D', 4, 2, 5));
        expect(listener).toHaveBeenCalledTimes(1);
      });

      it('off removes specific listener', () => {
        const listener = vi.fn();
        manager.on('feedbackStart', listener);
        
        manager.off('feedbackStart', listener);
        
        manager.showCorrectFeedback(testNote);
        expect(listener).not.toHaveBeenCalled();
      });
    });

    describe('removeAllListeners', () => {
      it('removes all listeners for specific event type', () => {
        const startListener = vi.fn();
        const completeListener = vi.fn();
        
        manager.on('feedbackStart', startListener);
        manager.on('feedbackComplete', completeListener);
        
        manager.removeAllListeners('feedbackStart');
        
        manager.showCorrectFeedback(testNote);
        expect(startListener).not.toHaveBeenCalled();
        
        vi.advanceTimersByTime(500);
        expect(completeListener).toHaveBeenCalled();
      });

      it('removes all listeners when no type specified', () => {
        const startListener = vi.fn();
        const completeListener = vi.fn();
        
        manager.on('feedbackStart', startListener);
        manager.on('feedbackComplete', completeListener);
        
        manager.removeAllListeners();
        
        manager.showCorrectFeedback(testNote);
        vi.advanceTimersByTime(500);
        
        expect(startListener).not.toHaveBeenCalled();
        expect(completeListener).not.toHaveBeenCalled();
      });
    });

    describe('Error handling', () => {
      it('catches and logs errors in listeners', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const errorListener = vi.fn(() => { throw new Error('Test error'); });
        const normalListener = vi.fn();
        
        manager.on('feedbackStart', errorListener);
        manager.on('feedbackStart', normalListener);
        
        manager.showCorrectFeedback(testNote);
        
        expect(consoleError).toHaveBeenCalled();
        expect(normalListener).toHaveBeenCalled(); // Still called despite error
        
        consoleError.mockRestore();
      });
    });
  });

  describe('dispose', () => {
    it('clears all feedback', () => {
      manager.showCorrectFeedback(testNote);
      manager.showIncorrectFeedback(new Note('D', 4, 2, 5));
      
      manager.dispose();
      
      expect(manager.hasFeedback).toBe(false);
    });

    it('removes all listeners', () => {
      const listener = vi.fn();
      manager.on('feedbackStart', listener);
      
      manager.dispose();
      
      manager.showCorrectFeedback(testNote);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Multiple notes feedback', () => {
    it('handles feedback on multiple notes simultaneously', () => {
      const note2 = new Note('D', 4, 2, 5);
      const note3 = new Note('E', 4, 3, 7);
      
      manager.showCorrectFeedback(testNote);
      manager.showIncorrectFeedback(note2);
      manager.showHintFeedback(note3);
      
      expect(manager.activeFeedbackCount).toBe(3);
      expect(manager.getFeedbackType(testNote.getPositionId())).toBe('correct');
      expect(manager.getFeedbackType(note2.getPositionId())).toBe('incorrect');
      expect(manager.getFeedbackType(note3.getPositionId())).toBe('hint');
    });

    it('clears each note independently based on duration', () => {
      const note2 = new Note('D', 4, 2, 5);
      
      manager.updateConfig({ correctDuration: 300, incorrectDuration: 600 });
      
      manager.showCorrectFeedback(testNote);
      manager.showIncorrectFeedback(note2);
      
      expect(manager.activeFeedbackCount).toBe(2);
      
      vi.advanceTimersByTime(300);
      
      expect(manager.activeFeedbackCount).toBe(1);
      expect(manager.hasFeedbackAt(testNote.getPositionId())).toBe(false);
      expect(manager.hasFeedbackAt(note2.getPositionId())).toBe(true);
      
      vi.advanceTimersByTime(300);
      
      expect(manager.activeFeedbackCount).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('handles notes on same fret different strings', () => {
      const note1 = new Note('C', 4, 1, 3);
      const note2 = new Note('F', 3, 2, 3);
      
      manager.showCorrectFeedback(note1);
      manager.showIncorrectFeedback(note2);
      
      expect(manager.activeFeedbackCount).toBe(2);
      expect(manager.getFeedbackType(note1.getPositionId())).toBe('correct');
      expect(manager.getFeedbackType(note2.getPositionId())).toBe('incorrect');
    });

    it('handles open string notes', () => {
      const openE = new Note('E', 4, 1, 0);
      
      manager.showCorrectFeedback(openE);
      
      expect(manager.hasFeedbackAt('s1f0')).toBe(true);
    });

    it('handles high fret notes', () => {
      const highNote = new Note('G', 6, 1, 24);
      
      manager.showCorrectFeedback(highNote);
      
      expect(manager.hasFeedbackAt('s1f24')).toBe(true);
    });

    it('handles all strings', () => {
      const notes = [
        new Note('E', 4, 1, 0),
        new Note('B', 3, 2, 0),
        new Note('G', 3, 3, 0),
        new Note('D', 3, 4, 0),
        new Note('A', 2, 5, 0),
        new Note('E', 2, 6, 0),
      ];
      
      notes.forEach(note => manager.showCorrectFeedback(note));
      
      expect(manager.activeFeedbackCount).toBe(6);
    });
  });

  describe('Integration with quiz flow', () => {
    it('simulates correct answer flow', () => {
      const startListener = vi.fn();
      const completeListener = vi.fn();
      
      manager.on('feedbackStart', startListener);
      manager.on('feedbackComplete', completeListener);
      
      // User clicks correct answer
      manager.showCorrectFeedback(testNote);
      
      expect(startListener).toHaveBeenCalledWith(expect.objectContaining({
        feedbackType: 'correct',
      }));
      
      // Green flash for 500ms
      expect(manager.hasFeedback).toBe(true);
      
      vi.advanceTimersByTime(500);
      
      // Feedback completes
      expect(completeListener).toHaveBeenCalledWith(expect.objectContaining({
        feedbackType: 'correct',
      }));
      expect(manager.hasFeedback).toBe(false);
    });

    it('simulates incorrect answer flow', () => {
      const startListener = vi.fn();
      const completeListener = vi.fn();
      
      manager.on('feedbackStart', startListener);
      manager.on('feedbackComplete', completeListener);
      
      // User clicks incorrect answer
      manager.showIncorrectFeedback(testNote);
      
      expect(startListener).toHaveBeenCalledWith(expect.objectContaining({
        feedbackType: 'incorrect',
      }));
      
      // Red flash for 500ms
      expect(manager.hasFeedback).toBe(true);
      
      vi.advanceTimersByTime(500);
      
      // Feedback completes
      expect(completeListener).toHaveBeenCalledWith(expect.objectContaining({
        feedbackType: 'incorrect',
      }));
      expect(manager.hasFeedback).toBe(false);
    });

    it('simulates hint flow after max attempts', () => {
      const hintNote = new Note('G', 4, 3, 5); // The correct answer
      
      // Show hint after 3 incorrect attempts
      manager.showHintFeedback(hintNote);
      
      // Hint pulses 3 times (3 * 500ms = 1500ms)
      expect(manager.hasFeedback).toBe(true);
      expect(manager.getFeedbackType(hintNote.getPositionId())).toBe('hint');
      
      vi.advanceTimersByTime(500);
      expect(manager.hasFeedback).toBe(true); // Still pulsing
      
      vi.advanceTimersByTime(500);
      expect(manager.hasFeedback).toBe(true); // Still pulsing
      
      vi.advanceTimersByTime(500);
      expect(manager.hasFeedback).toBe(false); // Done pulsing
    });

    it('simulates rapid answer changes', () => {
      // User clicks incorrect
      manager.showIncorrectFeedback(testNote);
      
      vi.advanceTimersByTime(200);
      
      // User quickly clicks again (correct this time)
      manager.showCorrectFeedback(testNote);
      
      // Only one feedback active
      expect(manager.activeFeedbackCount).toBe(1);
      expect(manager.getFeedbackType(testNote.getPositionId())).toBe('correct');
      
      vi.advanceTimersByTime(500);
      
      expect(manager.hasFeedback).toBe(false);
    });
  });
});

describe('FeedbackState interface', () => {
  it('contains required properties', () => {
    const manager = new QuizFeedbackManager();
    const note = new Note('C', 4, 1, 3);
    
    const state = manager.showCorrectFeedback(note);
    
    // Type checking ensures these properties exist
    expect(typeof state.positionId).toBe('string');
    expect(['correct', 'incorrect', 'hint', 'none']).toContain(state.type);
    expect(typeof state.startTime).toBe('number');
    expect(typeof state.duration).toBe('number');
    
    manager.dispose();
  });

  it('includes pulseCount for hint feedback', () => {
    const manager = new QuizFeedbackManager();
    const note = new Note('C', 4, 1, 3);
    
    const state = manager.showHintFeedback(note);
    
    expect(state.pulseCount).toBeDefined();
    expect(typeof state.pulseCount).toBe('number');
    
    manager.dispose();
  });
});
