import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, Flex, Text, Heading, Button, Card, Badge, TextField, Select } from '@radix-ui/themes';
import { PlayIcon, PauseIcon, ResumeIcon, ResetIcon } from '@radix-ui/react-icons';
import { Note } from '../../core/music-theory/Note';
import type { PitchClass } from '../../core/music-theory/Note';
import { 
  STRING_PROGRESSION, 
  STRING_NAMES, 
  STRING_NOTES, 
  getPitchClassForPosition 
} from '../../core/quiz/ProgressiveQuizState';
import { HighlightZone } from '../../core/zones/HighlightZone';
import { FretboardDisplay } from '../fretboard';
import type { ZoneConfig } from '../fretboard';
import { NoteProgressDisplay } from './NoteProgressDisplay';
import type { NotePerformance } from './NoteProgressDisplay';
import { ColorPaletteSwitcher } from '../settings';
import { NumberField } from '../ui/NumberField';
import { useAppStore, useUserSettings } from '../../store/appStore';
import { useColorPalette } from '../../context/ColorContext';
import './ProgressiveNoteQuiz.css';

/**
 * Progressive Note Quiz Component
 * 
 * A quiz mode that progressively unlocks notes on the E string as the user
 * demonstrates mastery. Starts with only the open E (fret 0), then unlocks
 * F, F#, G, etc. as the user achieves the required accuracy and speed.
 */
export function ProgressiveNoteQuiz() {
  // Color palette
  const { currentPalette } = useColorPalette();
  
  // Global user settings from store
  const userSettings = useUserSettings();
  const { setMarkerStyle } = useAppStore();
  
  // Store state
  const progressiveQuiz = useAppStore((state) => state.progressiveQuiz);
  const recordAttempt = useAppStore((state) => state.recordProgressiveAttempt);
  const resetProgress = useAppStore((state) => state.resetProgressiveQuiz);
  const updateConfig = useAppStore((state) => state.updateProgressiveConfig);
  const forceUnlock = useAppStore((state) => state.forceUnlockFrets);
  const forceString = useAppStore((state) => state.forceStringIndex);
  
  // Quiz state
  const [quizState, setQuizState] = useState<'idle' | 'active' | 'paused'>('idle');
  const [currentTargetString, setCurrentTargetString] = useState<number | null>(null);
  const [currentTargetFret, setCurrentTargetFret] = useState<number | null>(null);
  const [currentTargetNote, setCurrentTargetNote] = useState<PitchClass | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'incorrect' | 'outside'; message: string } | null>(null);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  
  // Config tuning (display values)
  const [accuracyThreshold, setAccuracyThreshold] = useState(progressiveQuiz.config.accuracyThreshold);
  const [timeThreshold, setTimeThreshold] = useState(progressiveQuiz.config.averageTimeThreshold);
  const [maxTimeToCount, setMaxTimeToCount] = useState(progressiveQuiz.config.maxAnswerTimeToCount);
  const [nextNoteDelay, setNextNoteDelay] = useState(progressiveQuiz.config.nextNoteDelay);
  const [lowAccuracyWeight, setLowAccuracyWeight] = useState(progressiveQuiz.config.lowAccuracyWeight);
  const [unlearnedNoteWeight, setUnlearnedNoteWeight] = useState(progressiveQuiz.config.unlearnedNoteWeight);
  const [strugglingThreshold, setStrugglingThreshold] = useState(progressiveQuiz.config.strugglingAccuracyThreshold);
  const [minAttemptsForLearned, setMinAttemptsForLearned] = useState(progressiveQuiz.config.minAttemptsForLearned);
  
  // Auto-advance timer
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Settings collapsed state - defaults to collapsed
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  // Derive current string info and notes for that string
  // Handle legacy store state that may not have unlockedFretsPerString or currentStringIndex
  const currentStringIndex = progressiveQuiz.currentStringIndex ?? 0;
  const currentString = STRING_PROGRESSION[currentStringIndex];
  const currentStringNotes = STRING_NOTES[currentString];
  const unlockedFretsPerString = progressiveQuiz.unlockedFretsPerString ?? { 6: 1 };
  const currentStringUnlockedFrets = unlockedFretsPerString[currentString] ?? 1;

  // Get list of mastered strings (all frets unlocked)
  const masteredStrings = useMemo(() => {
    const mastered: number[] = [];
    for (let i = 0; i < currentStringIndex; i++) {
      mastered.push(STRING_PROGRESSION[i]);
    }
    return mastered;
  }, [currentStringIndex]);

  // Derive notes/performance for the target string (used when quiz is active)
  // Falls back to current learning string when no question is active
  const { targetStringUnlockedNotes, targetStringNotePerformance, targetStringOrderedNotes } = useMemo(() => {
    const targetString = currentTargetString !== null ? currentTargetString : currentString;
    const targetStringNotes = STRING_NOTES[targetString];
    const targetUnlockedFrets = targetString === currentString 
      ? currentStringUnlockedFrets 
      : 12; // Mastered strings have all 12 frets
    
    const unlocked = new Set<PitchClass>();
    const perfMap = new Map<PitchClass, NotePerformance>();
    
    for (let fret = 0; fret < 12; fret++) {
      const pitchClass = targetStringNotes[fret];
      
      if (fret < targetUnlockedFrets) {
        unlocked.add(pitchClass);
      }
      
      const stringPerf = progressiveQuiz.performance[targetString];
      const perfData = stringPerf?.[fret];
      if (perfData && perfData.attempts > 0) {
        perfMap.set(pitchClass, {
          attempts: perfData.attempts,
          correct: perfData.correct,
          accuracy: (perfData.correct / perfData.attempts) * 100,
        });
      }
    }
    
    return { 
      targetStringUnlockedNotes: unlocked, 
      targetStringNotePerformance: perfMap,
      targetStringOrderedNotes: targetStringNotes
    };
  }, [currentTargetString, currentString, currentStringUnlockedFrets, progressiveQuiz.performance]);

  // Create zone for target string only (full opacity) - highlights which string to click
  const zoneConfigs: ZoneConfig[] = useMemo(() => {
    const configs: ZoneConfig[] = [];
    
    // When quiz is active, only highlight the target string's unlocked notes
    const targetString = currentTargetString !== null ? currentTargetString : currentString;
    const targetStringUnlockedFrets = targetString === currentString 
      ? currentStringUnlockedFrets 
      : 12; // Mastered strings have all 12 frets
    
    const targetZone = new HighlightZone(`${STRING_NAMES[targetString]} String Zone`);
    for (let fret = 0; fret < targetStringUnlockedFrets; fret++) {
      targetZone.addNote(targetString, fret);
    }
    configs.push({
      zone: targetZone,
      color: currentPalette.colors.accent,  // Full opacity
      label: `${STRING_NAMES[targetString]}`
    });
    
    return configs;
  }, [currentTargetString, currentString, currentStringUnlockedFrets, currentPalette.colors.accent]);

  // Calculate viewport to show relevant frets based on target string (always start from 0)
  const viewportConfig = useMemo(() => {
    // Use target string's unlocked frets to determine viewport
    const targetString = currentTargetString !== null ? currentTargetString : currentString;
    const targetUnlockedFrets = targetString === currentString 
      ? currentStringUnlockedFrets 
      : 12; // Mastered strings have all 12 frets
    
    const visibleFrets = Math.max(targetUnlockedFrets + 2, 7);
    return { startFret: 0, visibleFrets: Math.min(visibleFrets, 13) };
  }, [currentTargetString, currentString, currentStringUnlockedFrets]);

  // Generate next question with 80/20 split between current and mastered strings
  const generateQuestion = useCallback(() => {
    const config = progressiveQuiz.config;
    const currentStringProbability = config.currentStringProbability ?? 0.8;
    
    // Helper to select a weighted fret from a string
    const selectWeightedFret = (stringNum: number, maxFret: number): number => {
      const stringPerf = progressiveQuiz.performance[stringNum] || {};
      const weights: number[] = [];
      let totalWeight = 0;
      
      for (let fret = 0; fret < maxFret; fret++) {
        const perf = stringPerf[fret];
        let weight = 1; // Base weight
        
        if (!perf || perf.attempts < config.minAttemptsForLearned) {
          // Unlearned/new note - boost weight
          weight *= config.unlearnedNoteWeight;
        } else {
          // Calculate accuracy
          const accuracy = (perf.correct / perf.attempts) * 100;
          if (accuracy < config.strugglingAccuracyThreshold) {
            // Struggling note - boost weight based on how far below threshold
            const struggleFactor = (config.strugglingAccuracyThreshold - accuracy) / config.strugglingAccuracyThreshold;
            weight *= 1 + (config.lowAccuracyWeight - 1) * struggleFactor;
          } else if (accuracy >= config.accuracyThreshold) {
            // Mastered note - reduce weight (but keep it in rotation)
            weight *= 0.5;
          }
        }
        
        weights.push(weight);
        totalWeight += weight;
      }
      
      // Weighted random selection
      let random = Math.random() * totalWeight;
      for (let fret = 0; fret < maxFret; fret++) {
        random -= weights[fret];
        if (random <= 0) {
          return fret;
        }
      }
      return maxFret - 1;
    };
    
    let targetString: number;
    let targetFret: number;
    
    // 80% from current string, 20% from mastered strings (if any)
    if (masteredStrings.length === 0 || Math.random() < currentStringProbability) {
      // Question from current learning string
      targetString = currentString;
      targetFret = selectWeightedFret(currentString, currentStringUnlockedFrets);
    } else {
      // Question from a random mastered string (20% of the time)
      targetString = masteredStrings[Math.floor(Math.random() * masteredStrings.length)];
      targetFret = selectWeightedFret(targetString, 12); // Mastered strings have all 12 frets
    }
    
    const targetNote = getPitchClassForPosition(targetString, targetFret);
    
    setCurrentTargetString(targetString);
    setCurrentTargetFret(targetFret);
    setCurrentTargetNote(targetNote);
    setQuestionStartTime(Date.now());
    setFeedback(null);
  }, [progressiveQuiz.config, progressiveQuiz.performance, currentString, currentStringUnlockedFrets, masteredStrings]);

  // Start quiz
  const startQuiz = useCallback(() => {
    setQuizState('active');
    setSessionStats({ correct: 0, total: 0 });
    generateQuestion();
  }, [generateQuestion]);

  // Pause quiz
  const pauseQuiz = useCallback(() => {
    setQuizState('paused');
    setCurrentTargetString(null);
    setCurrentTargetFret(null);
    setCurrentTargetNote(null);
    setFeedback(null);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);

  // Resume quiz with a new question
  const resumeQuiz = useCallback(() => {
    setQuizState('active');
    generateQuestion();
  }, [generateQuestion]);

  // Reset to idle
  const resetQuiz = useCallback(() => {
    setQuizState('idle');
    setCurrentTargetString(null);
    setCurrentTargetFret(null);
    setCurrentTargetNote(null);
    setFeedback(null);
    setSessionStats({ correct: 0, total: 0 });
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);

  // Handle note click
  const handleNoteClick = useCallback((note: Note) => {
    if (quizState !== 'active' || currentTargetFret === null || currentTargetString === null) return;

    // Only allow clicks on the target string (the highlighted one)
    if (note.string !== currentTargetString) {
      setFeedback({ type: 'outside', message: `Click on the ${STRING_NAMES[currentTargetString]} string!` });
      return;
    }

    // Check if click is within unlocked frets for the target string
    const targetUnlockedFrets = currentTargetString === currentString 
      ? currentStringUnlockedFrets 
      : 12; // Mastered strings have all 12 frets
    if (note.fret >= targetUnlockedFrets) {
      setFeedback({ type: 'outside', message: 'This note is locked!' });
      return;
    }

    // Calculate answer time
    const answerTime = (Date.now() - questionStartTime) / 1000;
    
    // Check if correct (must match the target fret)
    const isCorrect = note.fret === currentTargetFret;
    
    // Record the attempt on the target string/fret
    recordAttempt(currentTargetString, currentTargetFret, isCorrect, answerTime);
    
    // Update session stats
    setSessionStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    if (isCorrect) {
      const timeMessage = answerTime > progressiveQuiz.config.maxAnswerTimeToCount 
        ? ' (too slow - time not counted)'
        : ` in ${answerTime.toFixed(1)}s`;
      setFeedback({ type: 'correct', message: `Correct!${timeMessage}` });
      
      // Auto-advance to next question after configurable delay (infinite quiz)
      // Use longer delay for correct feedback so user can see it
      feedbackTimerRef.current = setTimeout(() => {
        generateQuestion();
      }, Math.max(progressiveQuiz.config.nextNoteDelay, 800));
    } else {
      const clickedNote = getPitchClassForPosition(note.string, note.fret);
      setFeedback({ type: 'incorrect', message: `Wrong! You clicked ${clickedNote}` });
      
      // Don't auto-advance on incorrect - let them try again
      // But we still count it as an attempt
    }
  }, [quizState, currentTargetFret, currentTargetString, currentString, currentStringUnlockedFrets, progressiveQuiz.config, questionStartTime, recordAttempt, generateQuestion]);

  // Apply config changes
  const applyConfigChanges = useCallback(() => {
    updateConfig({
      accuracyThreshold,
      averageTimeThreshold: timeThreshold,
      maxAnswerTimeToCount: maxTimeToCount,
      nextNoteDelay,
      lowAccuracyWeight,
      unlearnedNoteWeight,
      strugglingAccuracyThreshold: strugglingThreshold,
      minAttemptsForLearned,
    });
  }, [updateConfig, accuracyThreshold, timeThreshold, maxTimeToCount, nextNoteDelay, 
      lowAccuracyWeight, unlearnedNoteWeight, strugglingThreshold, minAttemptsForLearned]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  return (
    <Box className="progressive-note-quiz">
      <Box className="quiz-header" mb="4">
        <Heading as="h2" size="5" mb="2">Note Intuition</Heading>
        <Text as="p" size="2" color="gray">
          Master the fretboard one note at a time
        </Text>
      </Box>

      {/* Quiz Controls (when not active) */}
      {quizState === 'idle' && (
        <Flex justify="center" mb="4">
          <Button size="3" color="green" onClick={startQuiz}>
            <PlayIcon /> Start Quiz
          </Button>
        </Flex>
      )}
      
      {quizState === 'paused' && (
        <Flex justify="center" gap="3" mb="4">
          <Button color="green" onClick={resumeQuiz}>
            <ResumeIcon /> Resume Quiz
          </Button>
          <Button variant="soft" color="red" onClick={resetQuiz}>
            <ResetIcon /> End Session
          </Button>
        </Flex>
      )}

      {/* Mobile-friendly combined target note + progress display */}
      <Box className="quiz-top-section" mb="4">
        {/* Current string indicator */}
        <Flex justify="center" mb="3" gap="2" align="center" className="string-indicator">
          <Text size="2" color="gray">Learning:</Text>
          <Badge variant="soft" color="blue">{STRING_NAMES[currentString]}</Badge>
          <Text size="2" color="gray">({currentStringUnlockedFrets}/12 notes)</Text>
          {masteredStrings.length > 0 && (
            <Badge variant="outline" color="green" ml="2">
              {masteredStrings.length} string{masteredStrings.length > 1 ? 's' : ''} mastered
            </Badge>
          )}
        </Flex>

        {/* Question Display + Pause Button (inline) - shown when active */}
        {quizState === 'active' && currentTargetNote && currentTargetString && (
          <Flex justify="center" align="center" gap="4" className="question-display-active">
            <Flex align="center" gap="3" className="target-note-display">
              <Text size="4" weight="medium" className="find-label">Find:</Text>
              <Badge size="3" variant="solid" className="target-note-badge">
                {currentTargetNote}
              </Badge>
            </Flex>
            <Button variant="soft" color="amber" onClick={pauseQuiz} className="pause-btn">
              <PauseIcon /> Pause
            </Button>
          </Flex>
        )}

        {/* Progress Display - Note boxes for current question's string */}
        <Box className="progress-display-wrapper">
          <NoteProgressDisplay
            notePerformance={targetStringNotePerformance}
            unlockedNotes={targetStringUnlockedNotes}
            focusedNote={currentTargetNote || undefined}
            minAttemptsForLearned={minAttemptsForLearned}
            orderedNotes={targetStringOrderedNotes}
          />
        </Box>
      </Box>

      {/* Fretboard - scrollable container for mobile portrait */}
      <Box className="fretboard-scroll-container">
        <Box className="fretboard-scroll-inner">
          <FretboardDisplay
            startFret={viewportConfig.startFret}
            visibleFrets={viewportConfig.visibleFrets}
            showNoteNames={userSettings.showNoteNames}
            noteDisplay={userSettings.noteDisplay === 'both' ? 'sharps' : userSettings.noteDisplay}
            markerStyle={userSettings.markerStyle}
            highlightZones={zoneConfigs}
            onNoteClick={quizState === 'active' ? handleNoteClick : undefined}
          />
        </Box>
      </Box>

      {/* Feedback below fretboard */}
      {quizState === 'active' && (
        <Flex justify="center" className="feedback-container">
          {feedback ? (
            <Badge 
              size="2" 
              variant="soft" 
              color={feedback.type === 'correct' ? 'green' : feedback.type === 'incorrect' ? 'red' : 'gray'}
            >
              {feedback.message}
            </Badge>
          ) : (
            <Badge size="2" variant="soft" color="gray" style={{ visibility: 'hidden' }}>
              Placeholder
            </Badge>
          )}
        </Flex>
      )}

      {/* Session Stats - visible only during active quiz */}
      {quizState === 'active' && (
        <Flex justify="center" gap="5" mt="4" mb="4" className="stats-bar">
          <Flex align="center" gap="2">
            <Text size="2" color="gray">Session:</Text>
            <Text size="2" weight="bold">{sessionStats.correct}/{sessionStats.total}</Text>
          </Flex>
          <Flex align="center" gap="2">
            <Text size="2" color="gray">Accuracy:</Text>
            <Text size="2" weight="bold">
              {sessionStats.total > 0 
                ? ((sessionStats.correct / sessionStats.total) * 100).toFixed(0) 
                : 0}%
            </Text>
          </Flex>
        </Flex>
      )}

      {/* Display Controls - Fret Markers and Color Theme (below fretboard, when idle or paused) */}
      {(quizState === 'idle' || quizState === 'paused') && (
        <Flex justify="center" mt="4" className="display-controls-row">
          <Flex gap="5" align="center" wrap="wrap" justify="center">
            <Flex align="center" gap="2">
              <Text size="2" weight="medium">Fret Markers</Text>
              <Select.Root
                value={userSettings.markerStyle}
                onValueChange={(value) => setMarkerStyle(value as 'dots' | 'trapezoid')}
              >
                <Select.Trigger placeholder="Select style" />
                <Select.Content>
                  <Select.Item value="dots">Standard Dots</Select.Item>
                  <Select.Item value="trapezoid">Gibson Trapezoid</Select.Item>
                </Select.Content>
              </Select.Root>
            </Flex>
            
            <Box className="color-control-inline">
              <ColorPaletteSwitcher showSwatches={false} />
            </Box>
          </Flex>
        </Flex>
      )}

      {/* Paused Summary */}
      {quizState === 'paused' && (
        <Card mt="4" className="paused-summary">
          <Heading as="h3" size="3" mb="3">Quiz Paused</Heading>
          <Flex direction="column" gap="2">
            <Flex justify="between">
              <Text color="gray">Session Score:</Text>
              <Text weight="bold">{sessionStats.correct}/{sessionStats.total}</Text>
            </Flex>
            <Flex justify="between">
              <Text color="gray">Session Accuracy:</Text>
              <Text weight="bold">
                {sessionStats.total > 0 
                  ? ((sessionStats.correct / sessionStats.total) * 100).toFixed(0) 
                  : 0}%
              </Text>
            </Flex>
            <Flex justify="between">
              <Text color="gray">Current String:</Text>
              <Text weight="bold">{STRING_NAMES[currentString]}</Text>
            </Flex>
            <Flex justify="between">
              <Text color="gray">Notes Unlocked:</Text>
              <Text weight="bold">{currentStringUnlockedFrets}/12</Text>
            </Flex>
            <Flex justify="between">
              <Text color="gray">Strings Mastered:</Text>
              <Text weight="bold">{masteredStrings.length}/6</Text>
            </Flex>
          </Flex>
        </Card>
      )}

      {/* Configuration (only when idle or paused) - NOW BELOW FRETBOARD */}
      {(quizState === 'idle' || quizState === 'paused') && (
        <Card mt="4" className="config-section" style={{ padding: 'var(--space-4)' }}>
          <Flex 
            align="center" 
            justify="between" 
            onClick={() => setSettingsExpanded(!settingsExpanded)}
            style={{ cursor: 'pointer' }}
          >
            <Heading as="h3" size="3">Settings</Heading>
            <Text size="2" color="gray">{settingsExpanded ? '▼' : '▶'}</Text>
          </Flex>
          
          {settingsExpanded && (
          <Box mt="3">
          {/* Unlock Thresholds */}
          <Text size="2" weight="bold" color="gray" mb="2">Unlock Thresholds</Text>
          <Flex wrap="wrap" gap="3" mb="4">
            <Flex direction="column" gap="1" style={{ minWidth: '140px' }}>
              <Text size="2">Accuracy threshold (%)</Text>
              <NumberField
                min={50}
                max={100}
                step={5}
                value={accuracyThreshold}
                onChange={setAccuracyThreshold}
              />
            </Flex>
            
            <Flex direction="column" gap="1" style={{ minWidth: '140px' }}>
              <Text size="2">Max avg time (s)</Text>
              <NumberField
                min={1}
                max={10}
                step={0.5}
                value={timeThreshold}
                onChange={setTimeThreshold}
              />
            </Flex>
            
            <Flex direction="column" gap="1" style={{ minWidth: '140px' }}>
              <Text size="2">Ignore times over (s)</Text>
              <NumberField
                min={5}
                max={60}
                step={5}
                value={maxTimeToCount}
                onChange={setMaxTimeToCount}
              />
            </Flex>
          </Flex>
          
          {/* Quiz Flow */}
          <Text size="2" weight="bold" color="gray" mb="2">Quiz Flow</Text>
          <Flex wrap="wrap" gap="3" mb="4">
            <Flex direction="column" gap="1" style={{ minWidth: '140px' }}>
              <Text size="2">Next note delay (ms)</Text>
              <NumberField
                min={100}
                max={2000}
                step={100}
                value={nextNoteDelay}
                onChange={setNextNoteDelay}
              />
            </Flex>
          </Flex>
          
          {/* Question Selection Weights */}
          <Text size="2" weight="bold" color="gray" mb="1">Question Priority</Text>
          <Text size="1" color="gray" mb="2">Higher weights = note appears more often</Text>
          <Flex wrap="wrap" gap="3" mb="4">
            <Flex direction="column" gap="1" style={{ minWidth: '140px' }}>
              <Text size="2">Struggling weight</Text>
              <NumberField
                min={1}
                max={5}
                step={0.5}
                value={lowAccuracyWeight}
                onChange={setLowAccuracyWeight}
              />
            </Flex>
            
            <Flex direction="column" gap="1" style={{ minWidth: '140px' }}>
              <Text size="2">Unlearned weight</Text>
              <NumberField
                min={1}
                max={5}
                step={0.5}
                value={unlearnedNoteWeight}
                onChange={setUnlearnedNoteWeight}
              />
            </Flex>
            
            <Flex direction="column" gap="1" style={{ minWidth: '140px' }}>
              <Text size="2">Struggling threshold (%)</Text>
              <NumberField
                min={30}
                max={90}
                step={5}
                value={strugglingThreshold}
                onChange={setStrugglingThreshold}
              />
            </Flex>
            
            <Flex direction="column" gap="1" style={{ minWidth: '140px' }}>
              <Text size="2">Min attempts for "learned"</Text>
              <NumberField
                min={1}
                max={20}
                step={1}
                value={minAttemptsForLearned}
                onChange={setMinAttemptsForLearned}
              />
            </Flex>
          </Flex>
          
          <Flex gap="3" mt="4">
            <Button variant="soft" onClick={applyConfigChanges}>
              Save Settings
            </Button>
            <Button variant="soft" color="red" onClick={resetProgress}>
              Reset All Progress
            </Button>
          </Flex>
          
          {/* Debug: Force unlock */}
          <details className="debug-section">
            <summary>Debug Options</summary>
            <Flex direction="column" gap="2" mt="2">
              <Text size="2">Current string: {STRING_NAMES[currentString]}</Text>
              <Flex gap="2" align="center">
                <Text size="2">String index:</Text>
                <TextField.Root
                  type="number"
                  min={0}
                  max={5}
                  step={1}
                  value={currentStringIndex.toString()}
                  onChange={(e) => forceString(Number(e.target.value) || 0)}
                />
              </Flex>
              <Flex gap="2" align="center">
                <Text size="2">Unlock frets:</Text>
                <TextField.Root
                  type="number"
                  min={1}
                  max={12}
                  step={1}
                  value={currentStringUnlockedFrets.toString()}
                  onChange={(e) => forceUnlock(Number(e.target.value) || 1)}
                />
              </Flex>
            </Flex>
          </details>
          </Box>
          )}
        </Card>
      )}

      {/* Note Detail Stats */}
      <Box mt="4" className="note-detail-section">
        <Heading as="h3" size="3" mb="3">Note Statistics - {STRING_NAMES[currentString]}</Heading>
        <Flex wrap="wrap" gap="2" className="note-stats-grid">
          {currentStringNotes.slice(0, currentStringUnlockedFrets).map((note, fret) => {
            const stringPerf = progressiveQuiz.performance[currentString];
            const perf = stringPerf?.[fret];
            const accuracy = perf && perf.attempts > 0 
              ? ((perf.correct / perf.attempts) * 100).toFixed(0) 
              : '-';
            const avgTime = perf && perf.answerTimes.length > 0
              ? (perf.answerTimes.reduce((a, b) => a + b, 0) / perf.answerTimes.length).toFixed(1)
              : '-';
            
            return (
              <Card key={`${currentString}-${fret}`} size="1" className="note-stat-card">
                <Text weight="bold">{note}</Text>
                <Text size="1" color="gray">{accuracy}%</Text>
                <Text size="1" color="gray">{avgTime}s</Text>
                <Text size="1" color="gray">{perf?.attempts || 0} tries</Text>
              </Card>
            );
          })}
          
          {currentStringUnlockedFrets < 12 && (
            <Card size="1" className="note-stat-card locked">
              <Text weight="bold">{currentStringNotes[currentStringUnlockedFrets]}</Text>
              <Badge size="1" color="gray">Next</Badge>
            </Card>
          )}
        </Flex>
      </Box>
    </Box>
  );
}

export default ProgressiveNoteQuiz;
