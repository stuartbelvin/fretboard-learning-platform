import { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Flex, Text, Heading, Button, Card, Badge, Select, Checkbox } from '@radix-ui/themes';
import * as Slider from '@radix-ui/react-slider';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { Note } from '../../core/music-theory/Note';
import { COMMON_INTERVALS, ALL_INTERVALS } from '../../core/music-theory/Interval';
import type { IntervalShortName } from '../../core/music-theory/Interval';
import { IntervalQuestionGenerator } from '../../core/quiz';
import type { IntervalQuizQuestion, IntervalGeneratorConfig } from '../../core/quiz';
import type { FeedbackState } from '../../core/quiz/QuizFeedbackManager';
import { createRectangleZone } from '../../core/zones';
import { Fretboard } from '../../core/instruments/Fretboard';
import { FretboardDisplay, ZONE_COLORS } from '../fretboard';
import type { ZoneConfig } from '../fretboard';
import './IntervalQuizTest.css';

/**
 * Interval Quiz Manual Test Component
 * Manual test for Feature 4: Interval/Chord Tone Quiz Mode
 * 
 * Tests per PRD:
 * - INT-001: Interval Data Model
 * - INT-002: Interval Question Generation
 * - INT-003: Root Note Highlighting
 * - INT-004: Interval Question Text (reads naturally)
 * - INT-005: Octave Range Handling (root inside/outside zone)
 */
export function IntervalQuizTest() {
  // Fretboard and generator instances
  const fretboard = useMemo(() => new Fretboard(), []);
  const [generator, setGenerator] = useState<IntervalQuestionGenerator | null>(null);
  
  // Quiz state
  const [quizState, setQuizState] = useState<'idle' | 'active' | 'complete'>('idle');
  const [currentQuestion, setCurrentQuestion] = useState<IntervalQuizQuestion | null>(null);
  const [feedbackStates, setFeedbackStates] = useState<FeedbackState[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [eventLog, setEventLog] = useState<string[]>([]);
  
  // Quiz configuration
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [intervalSelection, setIntervalSelection] = useState<'common' | 'all' | 'custom'>('common');
  const [selectedIntervals, setSelectedIntervals] = useState<IntervalShortName[]>(['m3', 'M3', 'P4', 'P5']);
  const [displayPreference, setDisplayPreference] = useState<'sharps' | 'flats'>('sharps');
  const [allowCompound, setAllowCompound] = useState(false);
  const [allowRootOutside, setAllowRootOutside] = useState(true);
  const [showHintAfterAttempts, setShowHintAfterAttempts] = useState(3);
  
  // Active zone configuration
  const [zoneStartFret, setZoneStartFret] = useState(0);
  const [zoneEndFret, setZoneEndFret] = useState(12);
  
  const activeZone = useMemo(() => 
    createRectangleZone({
      startString: 1,
      endString: 6,
      startFret: zoneStartFret,
      endFret: zoneEndFret,
      name: 'Interval Quiz Zone'
    }), 
  [zoneStartFret, zoneEndFret]);

  const zoneConfigs: ZoneConfig[] = useMemo(() => [{
    zone: activeZone,
    color: ZONE_COLORS.blue,
    label: 'Answer Zone'
  }], [activeZone]);

  // Initialize generator when config changes
  useEffect(() => {
    const config: Partial<IntervalGeneratorConfig> = {
      intervals: intervalSelection === 'custom' ? selectedIntervals : intervalSelection,
      displayPreference,
      allowCompoundIntervals: allowCompound,
      allowRootOutsideZoneForCompound: allowRootOutside,
      avoidConsecutiveRepeats: true,
    };
    
    const newGenerator = new IntervalQuestionGenerator(fretboard, config);
    setGenerator(newGenerator);
  }, [fretboard, intervalSelection, selectedIntervals, displayPreference, allowCompound, allowRootOutside]);

  const logEvent = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setEventLog(prev => [...prev.slice(-14), `${timestamp}: ${message}`]);
  };

  // Generate next question
  const generateNextQuestion = useCallback(() => {
    if (!generator) return;
    
    const result = generator.generateQuestion(activeZone);
    
    if (result.success && result.question) {
      setCurrentQuestion(result.question);
      setAttempts(0);
      setFeedbackStates([]);
      logEvent(`Question ${result.question.questionNumber}: ${result.question.questionText}`);
      logEvent(`Root: ${result.question.rootNote.getFullName(displayPreference)} at S${result.question.rootNote.string}F${result.question.rootNote.fret}, Root in zone: ${result.question.rootInZone}`);
      logEvent(`Target pitch class: ${result.question.targetPitchClass}, ${result.question.targetNotesInZone.length} valid targets in zone`);
    } else {
      logEvent(`ERROR: ${result.error || 'Failed to generate question'}`);
      setQuizState('complete');
    }
  }, [generator, activeZone, displayPreference]);

  // Quiz actions
  const startQuiz = useCallback(() => {
    if (generator) {
      generator.reset();
      setScore({ correct: 0, total: 0 });
      setEventLog([]);
      setQuizState('active');
      logEvent('Quiz started!');
      generateNextQuestion();
    }
  }, [generator, generateNextQuestion]);

  const resetQuiz = useCallback(() => {
    if (generator) {
      generator.reset();
    }
    setQuizState('idle');
    setCurrentQuestion(null);
    setFeedbackStates([]);
    setAttempts(0);
    setScore({ correct: 0, total: 0 });
    setEventLog([]);
  }, [generator]);

  // Handle note click
  const handleNoteClick = useCallback((clickedNote: Note) => {
    if (quizState !== 'active' || !currentQuestion || !generator) return;
    
    const isCorrect = generator.validateAnswer(clickedNote, currentQuestion);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    logEvent(`Clicked: ${clickedNote.getFullName(displayPreference)} at S${clickedNote.string}F${clickedNote.fret} - ${isCorrect ? '✅ CORRECT!' : '❌ Wrong'}`);
    
    // Show feedback
    const feedbackType: FeedbackState['type'] = isCorrect ? 'correct' : 'incorrect';
    const positionId = `s${clickedNote.string}f${clickedNote.fret}`;
    setFeedbackStates([{
      positionId,
      type: feedbackType,
      startTime: Date.now(),
      duration: 500
    }]);
    
    if (isCorrect) {
      setScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
      
      // Auto-advance after delay
      setTimeout(() => {
        setFeedbackStates([]);
        if (score.total + 1 >= totalQuestions) {
          setQuizState('complete');
          logEvent(`🎉 Quiz complete! Final score: ${score.correct + 1}/${totalQuestions}`);
        } else {
          generateNextQuestion();
        }
      }, 1000);
    } else {
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
      
      // Clear feedback after delay
      setTimeout(() => {
        setFeedbackStates([]);
        
        // Show hint after max attempts
        if (newAttempts >= showHintAfterAttempts) {
          logEvent(`💡 Hint: Showing correct answer(s)`);
          const hintFeedback: FeedbackState[] = currentQuestion.targetNotesInZone.map((note) => ({
            positionId: `s${note.string}f${note.fret}`,
            type: 'hint' as const,
            startTime: Date.now(),
            duration: 1500
          }));
          setFeedbackStates(hintFeedback);
        }
      }, 500);
    }
  }, [quizState, currentQuestion, generator, attempts, displayPreference, showHintAfterAttempts, score, totalQuestions, generateNextQuestion]);

  // Acknowledge hint and move on
  const acknowledgeHint = useCallback(() => {
    setFeedbackStates([]);
    if (score.total >= totalQuestions) {
      setQuizState('complete');
      logEvent(`🎉 Quiz complete! Final score: ${score.correct}/${totalQuestions}`);
    } else {
      generateNextQuestion();
    }
  }, [score, totalQuestions, generateNextQuestion]);

  // Toggle interval in custom selection
  const toggleInterval = (shortName: IntervalShortName) => {
    setSelectedIntervals(prev => {
      if (prev.includes(shortName)) {
        return prev.filter(s => s !== shortName);
      } else {
        return [...prev, shortName];
      }
    });
  };

  // Get available intervals based on compound setting
  const availableIntervals = useMemo(() => {
    let intervals = [...ALL_INTERVALS];
    if (!allowCompound) {
      intervals = intervals.filter(i => !i.isCompound);
    }
    return intervals;
  }, [allowCompound]);

  return (
    <Box className="interval-quiz-test" p="4">
      <Flex direction="column" gap="3" className="quiz-header">
        <Heading as="h2" size="5">🎵 Interval Quiz Manual Test (Feature 4)</Heading>
        <Text size="2" color="gray">
          <Text weight="bold">Testing:</Text> INT-001 through INT-005 - Interval identification quiz.
          Find the specified interval relative to the highlighted root note.
        </Text>
      </Flex>
      
      {/* Quiz Configuration (only when idle) */}
      {quizState === 'idle' && (
        <Card mt="4" className="quiz-config">
          <Heading as="h3" size="3" mb="3">⚙️ Quiz Configuration</Heading>
          
          <Box className="config-section">
            <Heading as="h4" size="2" mb="2">General Settings</Heading>
            <Flex gap="4" wrap="wrap" align="end" className="config-row">
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
                <Text size="2" weight="medium">Note Display</Text>
                <Select.Root value={displayPreference} onValueChange={(value) => setDisplayPreference(value as 'sharps' | 'flats')}>
                  <Select.Trigger placeholder="Select display" />
                  <Select.Content>
                    <Select.Item value="sharps">Sharps (C#, D#...)</Select.Item>
                    <Select.Item value="flats">Flats (Db, Eb...)</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Flex>
              
              <Flex direction="column" gap="1">
                <Text size="2" weight="medium">Hint After Attempts: {showHintAfterAttempts}</Text>
                <Slider.Root
                  className="slider-root"
                  value={[showHintAfterAttempts]}
                  onValueChange={(values) => setShowHintAfterAttempts(values[0])}
                  min={1}
                  max={10}
                  step={1}
                  style={{ width: '150px' }}
                >
                  <Slider.Track className="slider-track">
                    <Slider.Range className="slider-range" />
                  </Slider.Track>
                  <Slider.Thumb className="slider-thumb" />
                </Slider.Root>
              </Flex>
            </Flex>
          </Box>
          
          <Box mt="4" className="config-section">
            <Heading as="h4" size="2" mb="2">Zone Settings</Heading>
            <Flex gap="4" wrap="wrap" align="end" className="config-row">
              <Flex direction="column" gap="1">
                <Text size="2" weight="medium">Start Fret: {zoneStartFret}</Text>
                <Slider.Root
                  className="slider-root"
                  value={[zoneStartFret]}
                  onValueChange={(values) => setZoneStartFret(values[0])}
                  min={0}
                  max={23}
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
                <Text size="2" weight="medium">End Fret: {zoneEndFret}</Text>
                <Slider.Root
                  className="slider-root"
                  value={[zoneEndFret]}
                  onValueChange={(values) => setZoneEndFret(values[0])}
                  min={1}
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
            </Flex>
          </Box>
          
          <Box mt="4" className="config-section">
            <Heading as="h4" size="2" mb="2">Interval Selection (INT-001, INT-002)</Heading>
            <RadioGroup.Root value={intervalSelection} onValueChange={(value) => setIntervalSelection(value as 'common' | 'all' | 'custom')}>
              <Flex gap="4" wrap="wrap" className="config-row">
                <Flex gap="2" align="center">
                  <RadioGroup.Item value="common" id="interval-common" className="radio-item">
                    <RadioGroup.Indicator className="radio-indicator" />
                  </RadioGroup.Item>
                  <Text as="label" htmlFor="interval-common" size="2">Common Intervals ({COMMON_INTERVALS.length})</Text>
                </Flex>
                
                <Flex gap="2" align="center">
                  <RadioGroup.Item value="all" id="interval-all" className="radio-item">
                    <RadioGroup.Indicator className="radio-indicator" />
                  </RadioGroup.Item>
                  <Text as="label" htmlFor="interval-all" size="2">All Intervals ({allowCompound ? ALL_INTERVALS.length : ALL_INTERVALS.filter(i => !i.isCompound).length})</Text>
                </Flex>
                
                <Flex gap="2" align="center">
                  <RadioGroup.Item value="custom" id="interval-custom" className="radio-item">
                    <RadioGroup.Indicator className="radio-indicator" />
                  </RadioGroup.Item>
                  <Text as="label" htmlFor="interval-custom" size="2">Custom Selection</Text>
                </Flex>
              </Flex>
            </RadioGroup.Root>
            
            {intervalSelection === 'custom' && (
              <Flex wrap="wrap" gap="2" mt="3" className="interval-checkboxes">
                {availableIntervals.map(interval => (
                  <Flex key={interval.getShortName()} gap="1" align="center" className="interval-checkbox">
                    <Checkbox
                      checked={selectedIntervals.includes(interval.getShortName() as IntervalShortName)}
                      onCheckedChange={() => toggleInterval(interval.getShortName() as IntervalShortName)}
                    />
                    <Text size="2" weight="medium">{interval.getShortName()}</Text>
                    <Text size="1" color="gray">({interval.getFullName()})</Text>
                  </Flex>
                ))}
              </Flex>
            )}
          </Box>
          
          <Box mt="4" className="config-section">
            <Heading as="h4" size="2" mb="2">Compound Intervals (INT-005: Octave Range Handling)</Heading>
            <Flex gap="4" wrap="wrap" className="config-row">
              <Flex gap="2" align="center">
                <Checkbox
                  checked={allowCompound}
                  onCheckedChange={(checked) => setAllowCompound(checked === true)}
                />
                <Text size="2">Allow Compound Intervals (9th, 10th, 11th, etc.)</Text>
              </Flex>
              
              <Flex gap="2" align="center">
                <Checkbox
                  checked={allowRootOutside}
                  onCheckedChange={(checked) => setAllowRootOutside(checked === true)}
                  disabled={!allowCompound}
                />
                <Text size="2" color={!allowCompound ? 'gray' : undefined}>Allow Root Outside Zone (for compound intervals)</Text>
              </Flex>
            </Flex>
            <Text size="1" color="gray" mt="2">
              Per PRD INT-005: For simple intervals, root must be in zone. 
              For compound intervals, root can be outside zone when enabled.
            </Text>
          </Box>
        </Card>
      )}
      
      {/* Quiz Controls */}
      <Flex gap="2" mt="3" className="quiz-controls">
        {quizState === 'idle' && (
          <Button color="green" onClick={startQuiz}>▶️ Start Interval Quiz</Button>
        )}
        
        {quizState !== 'idle' && (
          <Button color="gray" variant="outline" onClick={resetQuiz}>🔄 Reset Quiz</Button>
        )}
        
        {quizState === 'active' && attempts >= showHintAfterAttempts && feedbackStates.length > 0 && (
          <Button color="blue" onClick={acknowledgeHint}>⏭️ Next Question</Button>
        )}
      </Flex>
      
      {/* Quiz Status Bar */}
      {quizState !== 'idle' && (
        <Flex gap="4" mt="3" wrap="wrap" className="quiz-status">
          <Flex gap="2" align="center">
            <Text size="2" color="gray">State:</Text>
            <Badge color={quizState === 'complete' ? 'green' : 'blue'}>
              {quizState.toUpperCase()}
            </Badge>
          </Flex>
          
          <Flex gap="2" align="center">
            <Text size="2" color="gray">Question:</Text>
            <Text size="2" weight="bold">{currentQuestion?.questionNumber || 0} / {totalQuestions}</Text>
          </Flex>
          
          <Flex gap="2" align="center">
            <Text size="2" color="gray">Score:</Text>
            <Text size="2" weight="bold">{score.correct} / {score.total}</Text>
          </Flex>
          
          <Flex gap="2" align="center">
            <Text size="2" color="gray">Attempts:</Text>
            <Text size="2" weight="bold">{attempts}</Text>
          </Flex>
        </Flex>
      )}
      
      {/* Current Question (INT-004: Question Text) */}
      {quizState === 'active' && currentQuestion && (
        <Card mt="4" className="question-display">
          <Heading as="h3" size="4">{currentQuestion.questionText}</Heading>
          <Flex gap="2" align="center" mt="2">
            <Text size="2" color="gray">Root:</Text>
            <Text size="2" weight="bold">{currentQuestion.rootNote.getFullName(displayPreference)}</Text>
            <Text size="2" color="gray">(yellow note)</Text>
            {!currentQuestion.rootInZone && (
              <Badge color="orange">⚠️ Root outside zone</Badge>
            )}
          </Flex>
          <Flex gap="2" align="center" mt="1">
            <Text size="2" color="gray">Interval:</Text>
            <Text size="2" weight="bold">{currentQuestion.interval.getFullName()}</Text>
            <Text size="2" color="gray">({currentQuestion.interval.getShortName()}, {currentQuestion.interval.semitones} semitones)</Text>
            {currentQuestion.interval.isCompound && <Badge color="purple">(Compound)</Badge>}
          </Flex>
        </Card>
      )}
      
      {/* Quiz Complete */}
      {quizState === 'complete' && (
        <Card mt="4" className="quiz-complete">
          <Heading as="h3" size="4">🎉 Quiz Complete!</Heading>
          <Flex direction="column" align="center" gap="2" mt="3">
            <Text size="6" weight="bold">{score.correct}/{totalQuestions}</Text>
            <Text size="3" color="gray">
              {totalQuestions > 0 ? ((score.correct / totalQuestions) * 100).toFixed(1) : 0}% Accuracy
            </Text>
          </Flex>
        </Card>
      )}
      
      {/* Fretboard with Root Note Highlighting (INT-003) */}
      <Box mt="4" className="quiz-fretboard">
        <FretboardDisplay
          visibleFrets={Math.min(24, zoneEndFret + 1)}
          startFret={Math.max(0, zoneStartFret - 1)}
          showNoteNames={false}
          noteDisplay={displayPreference}
          onNoteClick={handleNoteClick}
          highlightZones={zoneConfigs}
          zoneOnlyMode={quizState === 'active'}
          feedbackStates={feedbackStates}
          rootNote={currentQuestion?.rootNote || null}
          rootOutsideZone={currentQuestion ? !currentQuestion.rootInZone : false}
          showRootNoteLabel={true}
        />
      </Box>
      
      {/* Event Log */}
      <Card mt="4" className="event-log">
        <Heading as="h4" size="2" mb="2">📝 Event Log (Last 15)</Heading>
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
        <Heading as="h4" size="2" mb="2">✅ Manual Test Checklist for Feature 4</Heading>
        <Flex direction="column" gap="1">
          <Flex gap="2" align="center">
            <input type="checkbox" id="int-check1" />
            <Text as="label" htmlFor="int-check1" size="2"><Text weight="bold">INT-001:</Text> Interval calculations correct (check semitones in log)</Text>
          </Flex>
          <Flex gap="2" align="center">
            <input type="checkbox" id="int-check2" />
            <Text as="label" htmlFor="int-check2" size="2"><Text weight="bold">INT-002:</Text> Questions generated from zone, targets in zone</Text>
          </Flex>
          <Flex gap="2" align="center">
            <input type="checkbox" id="int-check3" />
            <Text as="label" htmlFor="int-check3" size="2"><Text weight="bold">INT-003:</Text> Root note highlighted in yellow, clearly visible</Text>
          </Flex>
          <Flex gap="2" align="center">
            <input type="checkbox" id="int-check4" />
            <Text as="label" htmlFor="int-check4" size="2"><Text weight="bold">INT-004:</Text> Question text reads naturally ("Find the minor third of C")</Text>
          </Flex>
          <Flex gap="2" align="center">
            <input type="checkbox" id="int-check5a" />
            <Text as="label" htmlFor="int-check5a" size="2"><Text weight="bold">INT-005a:</Text> Simple intervals - root is always in zone</Text>
          </Flex>
          <Flex gap="2" align="center">
            <input type="checkbox" id="int-check5b" />
            <Text as="label" htmlFor="int-check5b" size="2"><Text weight="bold">INT-005b:</Text> Compound intervals - root can be outside zone (enable setting)</Text>
          </Flex>
          <Flex gap="2" align="center">
            <input type="checkbox" id="int-check5c" />
            <Text as="label" htmlFor="int-check5c" size="2"><Text weight="bold">INT-005c:</Text> Visual indicator when root outside zone (dashed border)</Text>
          </Flex>
          <Flex gap="2" align="center">
            <input type="checkbox" id="int-check6" />
            <Text as="label" htmlFor="int-check6" size="2">Correct answer shows green flash</Text>
          </Flex>
          <Flex gap="2" align="center">
            <input type="checkbox" id="int-check7" />
            <Text as="label" htmlFor="int-check7" size="2">Incorrect answer shows red flash</Text>
          </Flex>
          <Flex gap="2" align="center">
            <input type="checkbox" id="int-check8" />
            <Text as="label" htmlFor="int-check8" size="2">Hint appears after max attempts (green pulse on targets)</Text>
          </Flex>
          <Flex gap="2" align="center">
            <input type="checkbox" id="int-check9" />
            <Text as="label" htmlFor="int-check9" size="2">Score updates correctly</Text>
          </Flex>
          <Flex gap="2" align="center">
            <input type="checkbox" id="int-check10" />
            <Text as="label" htmlFor="int-check10" size="2">Complete quiz - final score shown</Text>
          </Flex>
        </Flex>
      </Card>
    </Box>
  );
}

export default IntervalQuizTest;
