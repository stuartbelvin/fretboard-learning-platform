import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, Flex, Text, Heading, Button, Card, Badge, Select } from '@radix-ui/themes';
import * as Slider from '@radix-ui/react-slider';
import { Note } from '../../core/music-theory/Note';
import type { PitchClass } from '../../core/music-theory/Note';
import { QuizFlowController } from '../../core/quiz';
import type { 
  FlowControllerConfig,
  ScoreData,
  ProgressData,
  PauseState,
  FlowEvent
} from '../../core/quiz';
import type { FeedbackState } from '../../core/quiz/QuizFeedbackManager';
import { createRectangleZone, shiftZone, getRandomShiftOffset } from '../../core/zones';
import { HighlightZone } from '../../core/zones/HighlightZone';
import { FretboardDisplay, ZONE_COLORS } from '../fretboard';
import type { ZoneConfig } from '../fretboard';
import { NoteProgressDisplay } from './NoteProgressDisplay';
import type { NotePerformance } from './NoteProgressDisplay';
import { useAppStore } from '../../store/appStore';
import './NoteQuizTest.css';

/**
 * NQI-005 Manual Test Component
 * Manual test requirement: Complete 10 questions, verify flow works
 * 
 * Tests:
 * - Next question auto-advances after correct answer
 * - Quiz pause/resume
 * - Display current score (correct/total)
 * - Zone-based quiz: Random zone selection, random shift, zone-constrained answers
 */
export function NoteQuizTest() {
  // Quiz controller
  const [controller, setController] = useState<QuizFlowController | null>(null);
  
  // Quiz state
  const [quizState, setQuizState] = useState<'idle' | 'active' | 'paused' | 'complete'>('idle');
  const [pauseState, setPauseState] = useState<PauseState>('running');
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [score, setScore] = useState<ScoreData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [feedbackStates, setFeedbackStates] = useState<FeedbackState[]>([]);
  const [eventLog, setEventLog] = useState<string[]>([]);
  
  // Quiz configuration
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [autoAdvanceDelay, setAutoAdvanceDelay] = useState(1000);
  const [noteFilter, setNoteFilter] = useState<'both' | 'natural' | 'sharps' | 'flats'>('both');
  
  // Zone mode settings
  const [zoneMode, setZoneMode] = useState<'default' | 'saved'>('default');
  const [maxShiftAmount, setMaxShiftAmount] = useState(12);
  const savedZones = useAppStore((state) => state.savedZones);
  const enabledZones = useMemo(() => savedZones.filter(z => z.enabled), [savedZones]);
  
  // Currently active zone (shifted if using saved zones)
  const [activeZone, setActiveZone] = useState<HighlightZone | null>(null);
  const [selectedZoneInfo, setSelectedZoneInfo] = useState<{ name: string; shiftAmount: number } | null>(null);
  
  // Static mock data for note progress display (will be replaced by real tracking later)
  const mockNotePerformance = useMemo(() => {
    const map = new Map<PitchClass, NotePerformance>();
    // Mastered notes (high accuracy)
    map.set('E', { attempts: 12, correct: 11, accuracy: 92 });
    map.set('A', { attempts: 10, correct: 9, accuracy: 90 });
    map.set('D', { attempts: 8, correct: 7, accuracy: 87.5 });
    map.set('G', { attempts: 15, correct: 13, accuracy: 86.7 });
    map.set('B', { attempts: 6, correct: 5, accuracy: 83.3 });
    // Practiced notes (medium accuracy)
    map.set('C', { attempts: 10, correct: 6, accuracy: 60 });
    map.set('F', { attempts: 8, correct: 5, accuracy: 62.5 });
    // Learning notes (low accuracy)  
    map.set('C#', { attempts: 5, correct: 2, accuracy: 40 });
    map.set('F#', { attempts: 4, correct: 1, accuracy: 25 });
    // No data yet for D#, G#, A# (unlocked but no attempts)
    return map;
  }, []);
  
  // For now, all natural notes are unlocked; sharps/flats depend on filter
  const unlockedNotes = useMemo(() => {
    const unlocked = new Set<PitchClass>(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
    // If note filter includes sharps, unlock those too
    if (noteFilter === 'both' || noteFilter === 'sharps') {
      unlocked.add('C#');
      unlocked.add('D#');
      unlocked.add('F#');
      unlocked.add('G#');
      unlocked.add('A#');
    }
    return unlocked;
  }, [noteFilter]);
  
  // Default zone (fallback)
  const defaultZone = useMemo(() => 
    createRectangleZone({
      startString: 1,
      endString: 6,
      startFret: 0,
      endFret: 12,
      name: 'Default Quiz Zone'
    }), 
  []);
  
  // Prepare the active zone based on mode
  const prepareActiveZone = useCallback(() => {
    if (zoneMode === 'saved' && enabledZones.length > 0) {
      // Randomly select one of the enabled saved zones
      const randomIndex = Math.floor(Math.random() * enabledZones.length);
      const selectedSavedZone = enabledZones[randomIndex];
      
      // Deserialize the zone
      const baseZone = HighlightZone.fromJSON(selectedSavedZone.zoneData);
      
      // Get a random shift amount
      const shiftAmount = getRandomShiftOffset(baseZone, maxShiftAmount);
      
      // Shift the zone
      const shiftedZone = shiftZone(baseZone, shiftAmount, `${selectedSavedZone.name} (shifted ${shiftAmount >= 0 ? '+' : ''}${shiftAmount})`);
      
      setSelectedZoneInfo({
        name: selectedSavedZone.name,
        shiftAmount: shiftAmount
      });
      
      return shiftedZone;
    } else {
      setSelectedZoneInfo(null);
      return defaultZone;
    }
  }, [zoneMode, enabledZones, maxShiftAmount, defaultZone]);

  const zoneConfigs: ZoneConfig[] = useMemo(() => {
    if (!activeZone) return [];
    return [{
      zone: activeZone,
      color: ZONE_COLORS.blue,
      label: activeZone.name || 'Quiz Zone'
    }];
  }, [activeZone]);

  // Calculate viewport settings to show the active zone
  const calculateViewportForZone = useCallback((zone: HighlightZone): { startFret: number; visibleFrets: number } => {
    const positions = zone.getAllNotes();
    if (positions.length === 0) {
      return { startFret: 0, visibleFrets: 13 };
    }
    
    // Find the fret range of the zone
    let minFret = 24;
    let maxFret = 0;
    for (const pos of positions) {
      minFret = Math.min(minFret, pos.fret);
      maxFret = Math.max(maxFret, pos.fret);
    }
    
    // Add padding and calculate visible frets
    const zoneSpan = maxFret - minFret + 1;
    const padding = 2; // Extra frets on each side for context
    const visibleFrets = Math.min(Math.max(zoneSpan + padding * 2, 8), 17);
    
    // Calculate start fret to center the zone
    const startFret = Math.max(0, minFret - padding);
    
    return { startFret, visibleFrets };
  }, []);

  // Prepare a new zone for the next question (called before each question)
  const prepareZoneForQuestion = useCallback((ctrl: QuizFlowController): HighlightZone => {
    const zone = prepareActiveZone();
    setActiveZone(zone);
    ctrl.setZone(zone);
    return zone;
  }, [prepareActiveZone]);

  // Auto-advance timer ref
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear auto-advance timer
  const clearAutoAdvanceTimer = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }, []);

  // Initialize controller - disable its internal auto-advance so we can manage it ourselves
  useEffect(() => {
    const config: FlowControllerConfig = {
      quizConfig: {
        totalQuestions,
      },
      generatorConfig: {
        pitchClassFilter: noteFilter,
      },
      autoAdvance: false, // Disable internal auto-advance - we'll handle it ourselves
      autoAdvanceDelay,
      autoShowHint: true,
    };
    
    const newController = new QuizFlowController(config);
    setController(newController);
    
    // Subscribe to events
    newController.on('quizStarted', (event) => {
      logEvent('quizStarted', event);
      setQuizState('active');
      setPauseState('running');
    });
    
    newController.on('questionReady', (event) => {
      logEvent('questionReady', event);
      setCurrentQuestion(event.question?.questionText || null);
      updateQuizDisplay(newController);
    });
    
    newController.on('answerProcessed', (event) => {
      logEvent('answerProcessed', event);
      updateQuizDisplay(newController);
      setFeedbackStates(newController.activeFeedback);
      
      // If answer was correct, schedule our own auto-advance with new zone
      if (event.quizState === 'active') {
        // Check if the answer was correct by looking at feedback
        const correctFeedback = newController.activeFeedback.find(f => f.type === 'correct');
        if (correctFeedback) {
          setPauseState('auto-advance-pending');
          clearAutoAdvanceTimer();
          autoAdvanceTimerRef.current = setTimeout(() => {
            // Prepare new zone and advance
            if (zoneMode === 'saved' && enabledZones.length > 0) {
              const newZone = prepareActiveZone();
              setActiveZone(newZone);
              newController.setZone(newZone);
            }
            newController.advanceToNextQuestion();
            updateQuizDisplay(newController);
            setPauseState('running');
          }, autoAdvanceDelay);
        }
      }
    });
    
    newController.on('autoAdvanceScheduled', (event) => {
      logEvent('autoAdvanceScheduled', event);
      // We handle auto-advance ourselves now, so this shouldn't fire
    });
    
    newController.on('autoAdvanceCancelled', (event) => {
      logEvent('autoAdvanceCancelled', event);
    });
    
    newController.on('paused', (event) => {
      logEvent('paused', event);
      setQuizState('paused');
      setPauseState('paused');
      clearAutoAdvanceTimer();
    });
    
    newController.on('resumed', (event) => {
      logEvent('resumed', event);
      setQuizState('active');
      setPauseState(newController.pauseState);
    });
    
    newController.on('quizCompleted', (event) => {
      logEvent('quizCompleted', event);
      setQuizState('complete');
      updateQuizDisplay(newController);
      clearAutoAdvanceTimer();
    });
    
    return () => {
      clearAutoAdvanceTimer();
      newController.dispose();
    };
  }, [totalQuestions, autoAdvanceDelay, noteFilter, zoneMode, enabledZones.length, prepareActiveZone, clearAutoAdvanceTimer]);
  
  const logEvent = (type: string, event: FlowEvent) => {
    const message = `${new Date().toLocaleTimeString()}: ${type} ${event.question ? `- "${event.question.questionText}"` : ''}`;
    setEventLog(prev => [...prev.slice(-9), message]);
  };
  
  const updateQuizDisplay = (ctrl: QuizFlowController) => {
    setScore(ctrl.getScore());
    setProgress(ctrl.getProgress());
    setCurrentQuestion(ctrl.currentQuestion?.questionText || null);
    setFeedbackStates(ctrl.activeFeedback);
  };

  // Custom advance function that prepares a new zone before advancing
  const advanceWithNewZone = useCallback(() => {
    if (!controller) return;
    
    // Clear any pending auto-advance timer
    clearAutoAdvanceTimer();
    setPauseState('running');
    
    // Prepare a new zone for the next question (if in saved zone mode)
    if (zoneMode === 'saved' && enabledZones.length > 0) {
      const newZone = prepareActiveZone();
      setActiveZone(newZone);
      controller.setZone(newZone);
    }
    
    // Now advance to next question (will use the new zone)
    controller.advanceToNextQuestion();
    updateQuizDisplay(controller);
  }, [controller, zoneMode, enabledZones.length, prepareActiveZone, clearAutoAdvanceTimer]);

  // Quiz actions
  const startQuiz = useCallback(() => {
    if (controller) {
      // Prepare the active zone (with random selection and shift if in saved zone mode)
      const zone = prepareActiveZone();
      setActiveZone(zone);
      
      setEventLog([]);
      controller.start(zone);
      updateQuizDisplay(controller);
    }
  }, [controller, prepareActiveZone]);
  
  const pauseQuiz = useCallback(() => {
    if (controller) {
      controller.pause();
    }
  }, [controller]);
  
  const resumeQuiz = useCallback(() => {
    if (controller) {
      controller.resume();
    }
  }, [controller]);
  
  const resetQuiz = useCallback(() => {
    if (controller) {
      controller.reset();
      setQuizState('idle');
      setPauseState('running');
      setCurrentQuestion(null);
      setScore(null);
      setProgress(null);
      setFeedbackStates([]);
      setEventLog([]);
      setActiveZone(null);
      setSelectedZoneInfo(null);
    }
  }, [controller]);
  
  const handleNoteClick = useCallback((note: Note) => {
    if (controller && quizState === 'active' && activeZone) {
      // Check if note is within the active zone
      if (!activeZone.containsNote(note.string, note.fret)) {
        // Note is outside the zone - provide feedback but don't count as attempt
        const message = `${new Date().toLocaleTimeString()}: outsideZone - Note at string ${note.string}, fret ${note.fret} is outside the zone`;
        setEventLog(prev => [...prev.slice(-9), message]);
        return;
      }
      controller.submitAnswer(note);
      updateQuizDisplay(controller);
    }
  }, [controller, quizState, activeZone]);
  
  const acknowledgeHint = useCallback(() => {
    if (controller) {
      controller.acknowledgeHint();
      updateQuizDisplay(controller);
    }
  }, [controller]);
  
  const manualAdvance = useCallback(() => {
    // Use our custom advance that prepares a new zone
    advanceWithNewZone();
  }, [advanceWithNewZone]);

  return (
    <Box className="note-quiz-test" p="4">
      <Flex direction="column" gap="3" className="quiz-header">
        <Heading as="h2" size="5">🎯 Note Quiz with Zone Testing</Heading>
        <Text size="2" color="gray">
          <Text weight="bold">Zone Quiz Mode:</Text> Test zones with random selection and shifting.
          The zone is randomly selected from saved zones, shifted along the fretboard, and only notes within the zone are valid answers.
        </Text>
      </Flex>
      
      {/* Quiz Configuration (only when idle) */}
      {quizState === 'idle' && (
        <Card mt="4" className="quiz-config">
          <Heading as="h3" size="3" mb="3">⚙️ Quiz Configuration</Heading>
          <Flex direction="column" gap="3" className="config-row">
            <Flex gap="4" wrap="wrap" align="center">
              <Flex direction="column" gap="1">
                <Text size="2" weight="medium">Total Questions: {totalQuestions}</Text>
                <Slider.Root
                  className="slider-root"
                  value={[totalQuestions]}
                  onValueChange={(values) => setTotalQuestions(values[0])}
                  min={1}
                  max={50}
                  step={1}
                  style={{ width: '150px' }}
                >
                  <Slider.Track className="slider-track">
                    <Slider.Range className="slider-range" />
                  </Slider.Track>
                  <Slider.Thumb className="slider-thumb" />
                </Slider.Root>
              </Flex>
              
              <Flex direction="column" gap="1">
                <Text size="2" weight="medium">Auto-Advance Delay: {autoAdvanceDelay}ms</Text>
                <Slider.Root
                  className="slider-root"
                  value={[autoAdvanceDelay]}
                  onValueChange={(values) => setAutoAdvanceDelay(values[0])}
                  min={500}
                  max={5000}
                  step={100}
                  style={{ width: '150px' }}
                >
                  <Slider.Track className="slider-track">
                    <Slider.Range className="slider-range" />
                  </Slider.Track>
                  <Slider.Thumb className="slider-thumb" />
                </Slider.Root>
              </Flex>
              
              <Flex direction="column" gap="1">
                <Text size="2" weight="medium">Note Filter</Text>
                <Select.Root value={noteFilter} onValueChange={(value) => setNoteFilter(value as 'both' | 'natural' | 'sharps' | 'flats')}>
                  <Select.Trigger placeholder="Select filter" />
                  <Select.Content>
                    <Select.Item value="both">All Notes</Select.Item>
                    <Select.Item value="natural">Natural Notes Only</Select.Item>
                    <Select.Item value="sharps">Sharps Only</Select.Item>
                    <Select.Item value="flats">Flats Only</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Flex>
            </Flex>
          </Flex>
          
          {/* Zone Mode Configuration */}
          <Heading as="h4" size="2" mt="4" mb="2">📐 Zone Settings</Heading>
          <Flex gap="4" wrap="wrap" align="center" className="config-row">
            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">Zone Mode</Text>
              <Select.Root value={zoneMode} onValueChange={(value) => setZoneMode(value as 'default' | 'saved')}>
                <Select.Trigger placeholder="Select zone mode" />
                <Select.Content>
                  <Select.Item value="default">Default Zone (Frets 0-12)</Select.Item>
                  <Select.Item value="saved">Use Saved Zones (Random Selection + Shift)</Select.Item>
                </Select.Content>
              </Select.Root>
            </Flex>
            
            {zoneMode === 'saved' && (
              <Flex direction="column" gap="1">
                <Text size="2" weight="medium">Max Shift Amount: {maxShiftAmount}</Text>
                <Slider.Root
                  className="slider-root"
                  value={[maxShiftAmount]}
                  onValueChange={(values) => setMaxShiftAmount(values[0])}
                  min={0}
                  max={24}
                  step={1}
                  style={{ width: '150px' }}
                >
                  <Slider.Track className="slider-track">
                    <Slider.Range className="slider-range" />
                  </Slider.Track>
                  <Slider.Thumb className="slider-thumb" />
                </Slider.Root>
              </Flex>
            )}
          </Flex>
          
          {zoneMode === 'saved' && (
            <Box mt="2" className="zone-info">
              {enabledZones.length === 0 ? (
                <Text size="2" color="orange">⚠️ No enabled saved zones. Go to <a href="/zone-admin">Zone Admin</a> to create and enable zones.</Text>
              ) : (
                <Text size="2" color="green">✅ {enabledZones.length} enabled zone(s) available: {enabledZones.map(z => z.name).join(', ')}</Text>
              )}
            </Box>
          )}
        </Card>
      )}
      
      {/* Active Zone Info (when quiz is running) */}
      {quizState !== 'idle' && selectedZoneInfo && (
        <Flex gap="2" align="center" mt="3" className="active-zone-info">
          <Text size="2" weight="medium">🎯 Active Zone:</Text>
          <Badge color="blue">{selectedZoneInfo.name}</Badge>
          <Text size="2" color="gray">
            (Shifted {selectedZoneInfo.shiftAmount >= 0 ? '+' : ''}{selectedZoneInfo.shiftAmount} frets)
          </Text>
        </Flex>
      )}
      
      {/* Quiz Controls */}
      <Flex gap="2" mt="3" className="quiz-controls">
        {quizState === 'idle' && (
          <Button color="green" onClick={startQuiz}>▶️ Start Quiz</Button>
        )}
        
        {quizState === 'active' && pauseState !== 'paused' && (
          <Button color="yellow" onClick={pauseQuiz}>⏸️ Pause Quiz</Button>
        )}
        
        {quizState === 'paused' && (
          <Button color="green" onClick={resumeQuiz}>▶️ Resume Quiz</Button>
        )}
        
        {quizState !== 'idle' && (
          <Button color="gray" variant="outline" onClick={resetQuiz}>🔄 Reset Quiz</Button>
        )}
        
        {quizState === 'active' && pauseState === 'auto-advance-pending' && (
          <Button color="blue" onClick={manualAdvance}>⏭️ Skip Wait</Button>
        )}
      </Flex>
      
      {/* Quiz Status Bar */}
      {quizState !== 'idle' && (
        <Flex gap="4" mt="3" wrap="wrap" className="quiz-status">
          <Flex gap="2" align="center">
            <Text size="2" color="gray">State:</Text>
            <Badge color={quizState === 'complete' ? 'green' : quizState === 'paused' ? 'yellow' : 'blue'}>
              {quizState.toUpperCase()}
              {pauseState === 'auto-advance-pending' && ' (auto-advancing...)'}
            </Badge>
          </Flex>
          
          {progress && (
            <Flex gap="2" align="center">
              <Text size="2" color="gray">Progress:</Text>
              <Text size="2" weight="bold">{progress.display}</Text>
            </Flex>
          )}
          
          {score && (
            <Flex gap="2" align="center">
              <Text size="2" color="gray">Score:</Text>
              <Text size="2" weight="bold">{score.display}</Text>
              <Text size="2" color="gray">({score.accuracy.toFixed(0)}% accuracy)</Text>
            </Flex>
          )}
          
          {score && score.hintsUsed > 0 && (
            <Flex gap="2" align="center">
              <Text size="2" color="gray">Hints Used:</Text>
              <Text size="2" weight="bold">{score.hintsUsed}</Text>
            </Flex>
          )}
        </Flex>
      )}
      
      {/* Current Question */}
      {quizState === 'active' && currentQuestion && (
        <Card mt="4" className="question-display">
          <Heading as="h3" size="4">{currentQuestion}</Heading>
          <Text size="2" color="gray">Click the correct note on the fretboard</Text>
        </Card>
      )}
      
      {/* Quiz Complete */}
      {quizState === 'complete' && score && (
        <Card mt="4" className="quiz-complete">
          <Heading as="h3" size="4">🎉 Quiz Complete!</Heading>
          <Flex direction="column" align="center" gap="2" mt="3">
            <Text size="6" weight="bold">{score.correct}/{score.total}</Text>
            <Text size="3" color="gray">{score.accuracy.toFixed(1)}% Accuracy</Text>
            <Flex gap="4" mt="2">
              <Text size="2">Total Attempts: {score.totalAttempts}</Text>
              <Text size="2">Hints Used: {score.hintsUsed}</Text>
            </Flex>
          </Flex>
        </Card>
      )}
      
      {/* Note Progress Display - shows mastery of each pitch class */}
      {quizState !== 'idle' && (
        <NoteProgressDisplay
          notePerformance={mockNotePerformance}
          unlockedNotes={unlockedNotes}
          useFlats={noteFilter === 'flats'}
        />
      )}
      
      {/* Fretboard */}
      <Box mt="4" className="quiz-fretboard">
        <FretboardDisplay
          visibleFrets={activeZone ? calculateViewportForZone(activeZone).visibleFrets : 13}
          startFret={activeZone ? calculateViewportForZone(activeZone).startFret : 0}
          showNoteNames={false}
          noteDisplay="sharps"
          onNoteClick={handleNoteClick}
          highlightZones={zoneConfigs}
          zoneOnlyMode={quizState === 'active'}
          feedbackStates={feedbackStates}
        />
      </Box>
      
      {/* Hint Acknowledgement */}
      {quizState === 'active' && controller?.quizState === 'hint' && (
        <Card mt="4" className="hint-overlay">
          <Flex direction="column" align="center" gap="3">
            <Text size="3">💡 The correct note is now highlighted!</Text>
            <Button onClick={acknowledgeHint}>Got it! Next Question →</Button>
          </Flex>
        </Card>
      )}
      
      {/* Event Log */}
      <Card mt="4" className="event-log">
        <Heading as="h4" size="2" mb="2">📝 Event Log (Last 10)</Heading>
        <Box className="log-entries">
          {eventLog.length === 0 ? (
            <Text size="2" color="gray">No events yet. Start the quiz to see events.</Text>
          ) : (
            eventLog.map((entry, i) => (
              <Text key={i} as="div" size="1" className="log-entry">{entry}</Text>
            ))
          )}
        </Box>
      </Card>
      
      {/* Test Checklist */}
      <Card mt="4" className="test-checklist">
        <Heading as="h4" size="2" mb="2">✅ Manual Test Checklist for NQI-005</Heading>
        <Flex direction="column" gap="1">
          <Flex gap="2" align="center">
            <input type="checkbox" id="check1" />
            <Text as="label" htmlFor="check1" size="2">Start quiz - first question appears</Text>
          </Flex>
          <Flex gap="2" align="center">
            <input type="checkbox" id="check2" />
            <Text as="label" htmlFor="check2" size="2">Click correct note - green flash appears</Text>
          </Flex>
          <Flex gap="2" align="center">
            <input type="checkbox" id="check3" />
            <Text as="label" htmlFor="check3" size="2">Auto-advance works - next question appears after delay</Text>
          </Flex>
          <Flex gap="2" align="center">
            <input type="checkbox" id="check4" />
            <Text as="label" htmlFor="check4" size="2">Click wrong note - red flash appears</Text>
          </Flex>
          <Flex gap="2" align="center">
            <input type="checkbox" id="check5" />
            <Text as="label" htmlFor="check5" size="2">Score updates correctly (correct/total)</Text>
          </Flex>
          <Flex gap="2" align="center">
            <input type="checkbox" id="check6" />
            <Text as="label" htmlFor="check6" size="2">Pause quiz - quiz pauses, fretboard inactive</Text>
          </Flex>
          <Flex gap="2" align="center">
            <input type="checkbox" id="check7" />
            <Text as="label" htmlFor="check7" size="2">Resume quiz - quiz continues from paused state</Text>
          </Flex>
          <Flex gap="2" align="center">
            <input type="checkbox" id="check8" />
            <Text as="label" htmlFor="check8" size="2">3 wrong attempts - hint appears (green pulse)</Text>
          </Flex>
          <Flex gap="2" align="center">
            <input type="checkbox" id="check9" />
            <Text as="label" htmlFor="check9" size="2">Complete 10 questions - quiz complete screen shows</Text>
          </Flex>
          <Flex gap="2" align="center">
            <input type="checkbox" id="check10" />
            <Text as="label" htmlFor="check10" size="2">Reset quiz - returns to idle state</Text>
          </Flex>
        </Flex>
      </Card>
    </Box>
  );
}

export default NoteQuizTest;
