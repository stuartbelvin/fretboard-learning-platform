import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, Flex, Text, Heading, Button, Card, Badge, TextField, Select } from '@radix-ui/themes';
import { PlayIcon, PauseIcon, ResumeIcon, ResetIcon } from '@radix-ui/react-icons';
import { Note } from '../../core/music-theory/Note';
import type { PitchClass } from '../../core/music-theory/Note';
import { HighlightZone } from '../../core/zones/HighlightZone';
import { FretboardDisplay } from '../fretboard';
import type { ZoneConfig } from '../fretboard';
import { NoteProgressDisplay } from './NoteProgressDisplay';
import type { NotePerformance } from './NoteProgressDisplay';
import { ColorPaletteSwitcher } from '../settings';
import { NumberField } from '../ui/NumberField';
import { useAppStore, useUserSettings, useSavedZones, useEnabledZones } from '../../store/appStore';
import { useColorPalette } from '../../context/ColorContext';
import './ZoneNoteQuiz.css';

const CHROMATIC: PitchClass[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function getNoteName(string: number, fret: number): PitchClass {
  const openNotes: Record<number, PitchClass> = { 6: 'E', 5: 'A', 4: 'D', 3: 'G', 2: 'B', 1: 'E' };
  const startIndex = CHROMATIC.indexOf(openNotes[string]);
  return CHROMATIC[(startIndex + fret) % 12];
}

export function ZoneNoteQuiz() {
  const { currentPalette } = useColorPalette();
  const userSettings = useUserSettings();
  const { setMarkerStyle } = useAppStore();
  
  const zoneQuiz = useAppStore((state) => state.zoneQuiz);
  const recordAttempt = useAppStore((state) => state.recordZoneAttempt);
  const resetProgress = useAppStore((state) => state.resetZoneQuiz);
  const updateConfig = useAppStore((state) => state.updateZoneConfig);
  const setZonePositions = useAppStore((state) => state.setZonePositions);
  const slideZone = useAppStore((state) => state.slideZone);
  const forceUnlock = useAppStore((state) => state.forceZoneUnlock);
  const forceSliding = useAppStore((state) => state.forceZoneSliding);
  
  const [quizState, setQuizState] = useState<'idle' | 'active' | 'paused'>('idle');
  const [currentTargetPosition, setCurrentTargetPosition] = useState<{ string: number; fret: number } | null>(null);
  const [currentTargetNote, setCurrentTargetNote] = useState<PitchClass | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'incorrect' | 'outside'; message: string } | null>(null);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  
  const [accuracyThreshold, setAccuracyThreshold] = useState(zoneQuiz.config.accuracyThreshold);
  const [timeThreshold, setTimeThreshold] = useState(zoneQuiz.config.averageTimeThreshold);
  const [maxTimeToCount, setMaxTimeToCount] = useState(zoneQuiz.config.maxAnswerTimeToCount);
  const [nextNoteDelay, setNextNoteDelay] = useState(zoneQuiz.config.nextNoteDelay);
  const [lowAccuracyWeight, setLowAccuracyWeight] = useState(zoneQuiz.config.lowAccuracyWeight);
  const [unlearnedNoteWeight, setUnlearnedNoteWeight] = useState(zoneQuiz.config.unlearnedNoteWeight);
  const [strugglingThreshold, setStrugglingThreshold] = useState(zoneQuiz.config.strugglingAccuracyThreshold);
  const [minAttemptsForLearned, setMinAttemptsForLearned] = useState(zoneQuiz.config.minAttemptsForLearned);
  const [maxSlideAmount, setMaxSlideAmount] = useState(zoneQuiz.config.maxSlideAmount);
  
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  
  useEffect(() => {
    const config = zoneQuiz.config;
    setAccuracyThreshold(config.accuracyThreshold);
    setTimeThreshold(config.averageTimeThreshold);
    setMaxTimeToCount(config.maxAnswerTimeToCount);
    setNextNoteDelay(config.nextNoteDelay);
    setLowAccuracyWeight(config.lowAccuracyWeight);
    setUnlearnedNoteWeight(config.unlearnedNoteWeight);
    setStrugglingThreshold(config.strugglingAccuracyThreshold);
    setMinAttemptsForLearned(config.minAttemptsForLearned);
    setMaxSlideAmount(config.maxSlideAmount);
  }, [zoneQuiz.config]);
  
  const currentSlide = zoneQuiz.currentSlide;
  const unlockedCount = zoneQuiz.unlockedCount;
  const slidingEnabled = zoneQuiz.slidingEnabled;
  const zonePositions = zoneQuiz.zonePositions;
  
  const shiftedPositions = useMemo(() => {
    return zonePositions.map(pos => ({
      string: pos.string,
      fret: pos.fret + currentSlide,
    })).filter(pos => pos.fret >= 0 && pos.fret <= 24);
  }, [zonePositions, currentSlide]);
  
  const unlockedPositions = useMemo(() => {
    return shiftedPositions.slice(0, unlockedCount);
  }, [shiftedPositions, unlockedCount]);
  
  const unlockedNotes = useMemo(() => {
    const notes = new Set<PitchClass>();
    for (const pos of unlockedPositions) {
      notes.add(getNoteName(pos.string, pos.fret));
    }
    return notes;
  }, [unlockedPositions]);
  
  const notePerformance = useMemo(() => {
    const perfMap = new Map<PitchClass, NotePerformance>();
    // Use base zonePositions for performance lookup (performance is stored with base fret keys)
    // but calculate note name from shifted positions
    const unlockedBasePositions = zonePositions.slice(0, unlockedCount);
    for (let i = 0; i < unlockedBasePositions.length; i++) {
      const basePos = unlockedBasePositions[i];
      const key = `s${basePos.string}f${basePos.fret}`;
      const perf = zoneQuiz.performance[key];
      if (perf && perf.attempts > 0) {
        // Calculate note name from shifted position
        const shiftedFret = basePos.fret + currentSlide;
        const noteName = getNoteName(basePos.string, shiftedFret);
        perfMap.set(noteName, {
          attempts: perf.attempts,
          correct: perf.correct,
          accuracy: (perf.correct / perf.attempts) * 100,
        });
      }
    }
    return perfMap;
  }, [zonePositions, unlockedCount, currentSlide, zoneQuiz.performance]);
  
  const orderedNotes = useMemo(() => {
    return shiftedPositions.map(pos => getNoteName(pos.string, pos.fret));
  }, [shiftedPositions]);
  
  const zoneConfigs: ZoneConfig[] = useMemo(() => {
    if (zonePositions.length === 0) return [];
    
    const highlightZone = new HighlightZone('Quiz Zone');
    for (const pos of unlockedPositions) {
      highlightZone.addNote(pos.string, pos.fret);
    }
    
    return [{
      zone: highlightZone,
      color: currentPalette.colors.accent,
      label: 'Quiz Zone',
    }];
  }, [zonePositions, unlockedPositions, currentPalette.colors.accent]);
  
  const viewportConfig = useMemo(() => {
    if (shiftedPositions.length === 0) {
      return { startFret: 0, visibleFrets: 12 };
    }
    const frets = shiftedPositions.map(p => p.fret);
    const minFret = Math.min(...frets);
    const maxFret = Math.max(...frets);
    const range = maxFret - minFret;
    const visibleFrets = Math.max(range + 3, 7);
    return { startFret: Math.max(0, minFret - 1), visibleFrets: Math.min(visibleFrets, 15) };
  }, [shiftedPositions]);
  
  const initializeZone = useCallback(() => {
    const defaultPositions = [
      { string: 6, fret: 0 },
      { string: 6, fret: 1 },
      { string: 6, fret: 2 },
      { string: 6, fret: 3 },
      { string: 6, fret: 4 },
      { string: 6, fret: 5 },
      { string: 6, fret: 6 },
      { string: 6, fret: 7 },
      { string: 6, fret: 8 },
      { string: 6, fret: 9 },
      { string: 6, fret: 10 },
      { string: 6, fret: 11 },
    ];
    setZonePositions(defaultPositions);
  }, [setZonePositions]);
  
  useEffect(() => {
    if (zonePositions.length === 0) {
      initializeZone();
    }
  }, [zonePositions.length, initializeZone]);
  
  const generateQuestion = useCallback(() => {
    if (unlockedPositions.length === 0) return;
    
    const weights: number[] = [];
    let totalWeight = 0;
    
    for (const pos of unlockedPositions) {
      // Use base position for performance lookup (performance is stored with base fret keys)
      const baseFret = pos.fret - currentSlide;
      const key = `s${pos.string}f${baseFret}`;
      const perf = zoneQuiz.performance[key];
      let weight = 1;
      
      if (!perf || perf.attempts < zoneQuiz.config.minAttemptsForLearned) {
        weight *= zoneQuiz.config.unlearnedNoteWeight;
      } else {
        const accuracy = (perf.correct / perf.attempts) * 100;
        if (accuracy < zoneQuiz.config.strugglingAccuracyThreshold) {
          const struggleFactor = (zoneQuiz.config.strugglingAccuracyThreshold - accuracy) / zoneQuiz.config.strugglingAccuracyThreshold;
          weight *= 1 + (zoneQuiz.config.lowAccuracyWeight - 1) * struggleFactor;
        } else if (accuracy >= zoneQuiz.config.accuracyThreshold) {
          weight *= 0.5;
        }
      }
      
      weights.push(weight);
      totalWeight += weight;
    }
    
    let random = Math.random() * totalWeight;
    let selectedPos = unlockedPositions[0];
    for (let i = 0; i < unlockedPositions.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        selectedPos = unlockedPositions[i];
        break;
      }
    }
    
    const targetNote = getNoteName(selectedPos.string, selectedPos.fret);
    setCurrentTargetPosition(selectedPos);
    setCurrentTargetNote(targetNote);
    setQuestionStartTime(Date.now());
    setFeedback(null);
  }, [unlockedPositions, currentSlide, zoneQuiz.performance, zoneQuiz.config]);
  
  const startQuiz = useCallback(() => {
    if (slidingEnabled) {
      slideZone();
    }
    setQuizState('active');
    setSessionStats({ correct: 0, total: 0 });
    generateQuestion();
  }, [slidingEnabled, slideZone, generateQuestion]);
  
  const pauseQuiz = useCallback(() => {
    setQuizState('paused');
    setCurrentTargetPosition(null);
    setCurrentTargetNote(null);
    setFeedback(null);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);
  
  const resumeQuiz = useCallback(() => {
    if (slidingEnabled) {
      slideZone();
    }
    setQuizState('active');
    generateQuestion();
  }, [slidingEnabled, slideZone, generateQuestion]);
  
  const resetQuiz = useCallback(() => {
    setQuizState('idle');
    setCurrentTargetPosition(null);
    setCurrentTargetNote(null);
    setFeedback(null);
    setSessionStats({ correct: 0, total: 0 });
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);
  
  const handleNoteClick = useCallback((note: Note) => {
    if (quizState !== 'active' || !currentTargetPosition) return;
    
    const clickedNoteName = getNoteName(note.string, note.fret);
    const isCorrectPosition = note.string === currentTargetPosition.string && note.fret === currentTargetPosition.fret;
    const isCorrectNote = clickedNoteName === currentTargetNote;
    const isCorrect = isCorrectPosition || isCorrectNote;
    
    const answerTime = (Date.now() - questionStartTime) / 1000;
    recordAttempt(note.string, note.fret, isCorrect, answerTime);
    
    setSessionStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    
    if (isCorrect) {
      const timeMessage = answerTime > zoneQuiz.config.maxAnswerTimeToCount
        ? ' (too slow - time not counted)'
        : ` in ${answerTime.toFixed(1)}s`;
      const octaveMsg = isCorrectNote && !isCorrectPosition ? ' (octave)' : '';
      setFeedback({ type: 'correct', message: `Correct!${timeMessage}${octaveMsg}` });
      
      feedbackTimerRef.current = setTimeout(() => {
        if (slidingEnabled) {
          slideZone();
        }
        generateQuestion();
      }, Math.max(zoneQuiz.config.nextNoteDelay, 800));
    } else {
      const clickedNote = getNoteName(note.string, note.fret);
      setFeedback({ type: 'incorrect', message: `Wrong! You clicked ${clickedNote}` });
    }
  }, [quizState, currentTargetPosition, currentTargetNote, questionStartTime, recordAttempt, zoneQuiz.config, slidingEnabled, slideZone, generateQuestion]);
  
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
      maxSlideAmount,
    });
  }, [updateConfig, accuracyThreshold, timeThreshold, maxTimeToCount, nextNoteDelay, 
      lowAccuracyWeight, unlearnedNoteWeight, strugglingThreshold, minAttemptsForLearned, maxSlideAmount]);
  
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);
  
  return (
    <Box className="zone-note-quiz">
      <Box className="quiz-header" mb="4">
        <Heading as="h2" size="5" mb="2">Zone Note Quiz</Heading>
        <Text as="p" size="2" color="gray">
          Master notes within a sliding zone on the fretboard
        </Text>
      </Box>

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

      <Box className="quiz-top-section" mb="4">
        <Flex justify="center" mb="3" gap="2" align="center" className="zone-indicator">
          <Text size="2" color="gray">Zone:</Text>
          <Badge variant="soft" color="blue">{unlockedCount}/12 notes</Badge>
          {slidingEnabled && (
            <Badge variant="outline" color="amber" ml="2">
              Slide: {currentSlide > 0 ? `+${currentSlide}` : currentSlide}
            </Badge>
          )}
        </Flex>

        {quizState === 'active' && currentTargetNote && currentTargetPosition && (
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

        <Box className="progress-display-wrapper">
          <NoteProgressDisplay
            notePerformance={notePerformance}
            unlockedNotes={unlockedNotes}
            focusedNote={currentTargetNote || undefined}
            minAttemptsForLearned={minAttemptsForLearned}
            orderedNotes={orderedNotes}
          />
        </Box>
      </Box>

      <Box className="fretboard-scroll-container">
        <Box className="fretboard-scroll-inner">
          <FretboardDisplay
            startFret={viewportConfig.startFret}
            visibleFrets={viewportConfig.visibleFrets}
            showNoteNames={userSettings.showNoteNames}
            noteDisplay={userSettings.noteDisplay === 'both' ? 'sharps' : userSettings.noteDisplay}
            markerStyle={userSettings.markerStyle}
            highlightZones={zoneConfigs}
            zoneOnlyMode={quizState === 'active'}
            onNoteClick={quizState === 'active' ? handleNoteClick : undefined}
          />
        </Box>
      </Box>

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
              <Text color="gray">Notes Unlocked:</Text>
              <Text weight="bold">{unlockedCount}/12</Text>
            </Flex>
            <Flex justify="between">
              <Text color="gray">Sliding:</Text>
              <Text weight="bold">{slidingEnabled ? 'Enabled' : 'Disabled'}</Text>
            </Flex>
          </Flex>
        </Card>
      )}

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
            
            <Flex direction="column" gap="1" style={{ minWidth: '140px' }}>
              <Text size="2">Max slide amount</Text>
              <NumberField
                min={0}
                max={12}
                step={1}
                value={maxSlideAmount}
                onChange={setMaxSlideAmount}
              />
            </Flex>
          </Flex>
          
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
          
          <details className="debug-section">
            <summary>Debug Options</summary>
            <Flex direction="column" gap="2" mt="2">
              <Text size="2">Current slide: {currentSlide}</Text>
              <Flex gap="2" align="center">
                <Text size="2">Unlock count:</Text>
                <TextField.Root
                  type="number"
                  min={1}
                  max={12}
                  step={1}
                  value={unlockedCount.toString()}
                  onChange={(e) => forceUnlock(Number(e.target.value) || 1)}
                />
              </Flex>
              <Flex gap="2" align="center">
                <Button variant="soft" size="1" onClick={() => forceSliding(true)}>
                  Enable Sliding
                </Button>
                <Button variant="soft" size="1" onClick={() => slideZone()}>
                  Slide Zone
                </Button>
              </Flex>
            </Flex>
          </details>
          </Box>
          )}
        </Card>
      )}

      <Box mt="4" className="note-detail-section">
        <Heading as="h3" size="3" mb="3">Note Statistics</Heading>
        <Flex wrap="wrap" gap="2" className="note-stats-grid">
          {shiftedPositions.slice(0, unlockedCount).map((pos) => {
            // Use base position for performance lookup
            const baseFret = pos.fret - currentSlide;
            const key = `s${pos.string}f${baseFret}`;
            const perf = zoneQuiz.performance[key];
            const noteName = getNoteName(pos.string, pos.fret);
            const accuracy = perf && perf.attempts > 0 
              ? ((perf.correct / perf.attempts) * 100).toFixed(0) 
              : '-';
            const avgTime = perf && perf.answerTimes.length > 0
              ? (perf.answerTimes.reduce((a, b) => a + b, 0) / perf.answerTimes.length).toFixed(1)
              : '-';
            
            return (
              <Card key={key} size="1" className="note-stat-card">
                <Text weight="bold">{noteName}</Text>
                <Flex gap="1">
                  <Text size="1" color="gray">{accuracy}%</Text>
                  <Text size="1" color="gray">{avgTime}s</Text>
                  <Text size="1" color="gray">{perf?.attempts || 0} tries</Text>
                </Flex>
              </Card>
            );
          })}
          
          {unlockedCount < 12 && (
            <Card size="1" className="note-stat-card locked">
              <Text weight="bold">{shiftedPositions[unlockedCount] ? getNoteName(shiftedPositions[unlockedCount].string, shiftedPositions[unlockedCount].fret) : '-'}</Text>
              <Badge size="1" color="gray">Next</Badge>
            </Card>
          )}
        </Flex>
      </Box>
    </Box>
  );
}

export default ZoneNoteQuiz;
