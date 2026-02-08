/**
 * SettingsPanel Component (APP-004)
 * 
 * Comprehensive settings panel for the Fretboard Mastery Pro application.
 * Uses Radix UI components for consistent styling.
 * Includes:
 * - Color/appearance settings with color pickers
 * - Note display selection (sharps/flats/both)
 * - Interval selection checkboxes for quiz configuration
 * - Instrument and viewport settings
 */

import { useState, useCallback, useMemo } from 'react';
import { Box, Card, Flex, Text, Heading, Button, Switch, Select, Slider, RadioGroup, Checkbox, Separator, IconButton, Badge } from '@radix-ui/themes';
import * as Collapsible from '@radix-ui/react-collapsible';
import { 
  useAppStore,
  useUserSettings,
  useQuizSettings,
  useViewport,
  useInstrumentConfig,
  type NoteDisplayPreference,
  type MarkerStyle,
  type TuningPreset,
} from '../../store/appStore';
import { useColorPalette } from '../../context/ColorContext';
import { SIMPLE_INTERVALS, COMPOUND_INTERVALS, Interval } from '../../core/music-theory/Interval';
import type { IntervalShortName } from '../../core/music-theory/Interval';
import './SettingsPanel.css';

// ============================================================================
// Types
// ============================================================================

export interface SettingsPanelProps {
  /** Whether the panel is open/visible */
  isOpen?: boolean;
  /** Callback when panel is closed */
  onClose?: () => void;
  /** Additional CSS class name */
  className?: string;
  /** Which sections to show */
  sections?: SettingsSection[];
  /** Whether to show in compact mode */
  compact?: boolean;
}

export type SettingsSection = 
  | 'appearance' 
  | 'display' 
  | 'quiz' 
  | 'intervals' 
  | 'viewport' 
  | 'instrument' 
  | 'all';

// ============================================================================
// Interval Groupings for Display
// ============================================================================

interface IntervalGroup {
  name: string;
  description: string;
  intervals: Interval[];
}

const INTERVAL_GROUPS: IntervalGroup[] = [
  {
    name: 'Unison & Octave',
    description: 'Perfect unison and octave',
    intervals: SIMPLE_INTERVALS.filter(i => i.number === 1 || i.number === 8),
  },
  {
    name: 'Seconds',
    description: 'Minor and major seconds',
    intervals: SIMPLE_INTERVALS.filter(i => i.number === 2),
  },
  {
    name: 'Thirds',
    description: 'Minor and major thirds',
    intervals: SIMPLE_INTERVALS.filter(i => i.number === 3),
  },
  {
    name: 'Fourths',
    description: 'Perfect and augmented fourths',
    intervals: SIMPLE_INTERVALS.filter(i => i.number === 4),
  },
  {
    name: 'Fifths',
    description: 'Diminished, perfect, and augmented fifths',
    intervals: SIMPLE_INTERVALS.filter(i => i.number === 5),
  },
  {
    name: 'Sixths',
    description: 'Minor and major sixths',
    intervals: SIMPLE_INTERVALS.filter(i => i.number === 6),
  },
  {
    name: 'Sevenths',
    description: 'Minor and major sevenths',
    intervals: SIMPLE_INTERVALS.filter(i => i.number === 7),
  },
];

const COMPOUND_INTERVAL_GROUPS: IntervalGroup[] = [
  {
    name: 'Ninths',
    description: 'Minor, major, and augmented ninths',
    intervals: COMPOUND_INTERVALS.filter(i => i.number === 9),
  },
  {
    name: 'Tenths',
    description: 'Minor and major tenths',
    intervals: COMPOUND_INTERVALS.filter(i => i.number === 10),
  },
  {
    name: 'Elevenths',
    description: 'Perfect and augmented elevenths',
    intervals: COMPOUND_INTERVALS.filter(i => i.number === 11),
  },
  {
    name: 'Twelfths',
    description: 'Perfect twelfths',
    intervals: COMPOUND_INTERVALS.filter(i => i.number === 12),
  },
  {
    name: 'Thirteenths',
    description: 'Minor and major thirteenths',
    intervals: COMPOUND_INTERVALS.filter(i => i.number === 13),
  },
];

// Common interval presets for quick selection
const INTERVAL_PRESETS = {
  basic: ['P1', 'm3', 'M3', 'P4', 'P5', 'P8'] as IntervalShortName[],
  common: ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'] as IntervalShortName[],
  all: SIMPLE_INTERVALS.map(i => i.getShortName()),
  allWithCompound: [...SIMPLE_INTERVALS, ...COMPOUND_INTERVALS].map(i => i.getShortName()),
};

// ============================================================================
// Component
// ============================================================================

export function SettingsPanel({
  isOpen = true,
  onClose,
  className = '',
  sections = ['all'],
  compact = false,
}: SettingsPanelProps): React.ReactElement | null {
  // Store hooks
  const userSettings = useUserSettings();
  const quizSettings = useQuizSettings();
  const viewport = useViewport();
  const instrumentConfig = useInstrumentConfig();
  
  // Store actions
  const {
    setColorPalette,
    setNoteDisplay,
    setShowNoteNames,
    setMarkerStyle,
    setSoundEnabled,
    setAnimationSpeed,
    updateQuizSettings,
    setVisibleFrets,
    setStartFret,
    setDesktopFretCount,
    setMobileFretCount,
    setFretCount,
    setTuningPreset,
    resetUserSettings,
    resetQuizSettings,
    resetViewport,
    resetToDefaults,
  } = useAppStore();
  
  // Color palette context
  const { currentPalette, availablePalettes, setPalette, resetToDefault: resetPalette } = useColorPalette();
  
  // Local state for accordion sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['appearance', 'intervals']));
  
  // Determine which sections to show
  const showSection = useCallback((section: SettingsSection): boolean => {
    return sections.includes('all') || sections.includes(section);
  }, [sections]);
  
  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);
  
  // Selected intervals as a Set for easy lookup
  const selectedIntervalsSet = useMemo(() => 
    new Set(quizSettings.selectedIntervals), 
  [quizSettings.selectedIntervals]);
  
  // Handle interval checkbox toggle
  const handleIntervalToggle = useCallback((shortName: IntervalShortName) => {
    const newIntervals = selectedIntervalsSet.has(shortName)
      ? quizSettings.selectedIntervals.filter(i => i !== shortName)
      : [...quizSettings.selectedIntervals, shortName];
    updateQuizSettings({ selectedIntervals: newIntervals });
  }, [selectedIntervalsSet, quizSettings.selectedIntervals, updateQuizSettings]);
  
  // Handle preset selection
  const handlePresetSelect = useCallback((preset: keyof typeof INTERVAL_PRESETS) => {
    updateQuizSettings({ 
      selectedIntervals: INTERVAL_PRESETS[preset],
      allowCompoundIntervals: preset === 'allWithCompound',
    });
  }, [updateQuizSettings]);
  
  // Handle select all in group
  const handleSelectGroup = useCallback((intervals: Interval[], select: boolean) => {
    const groupNames = intervals.map(i => i.getShortName());
    let newIntervals: string[];
    
    if (select) {
      // Add all from group that aren't already selected
      const toAdd = groupNames.filter(n => !selectedIntervalsSet.has(n));
      newIntervals = [...quizSettings.selectedIntervals, ...toAdd];
    } else {
      // Remove all from group
      newIntervals = quizSettings.selectedIntervals.filter(i => !groupNames.includes(i as IntervalShortName));
    }
    
    updateQuizSettings({ selectedIntervals: newIntervals });
  }, [selectedIntervalsSet, quizSettings.selectedIntervals, updateQuizSettings]);
  
  // Check if all in group are selected
  const isGroupSelected = useCallback((intervals: Interval[]): boolean => {
    return intervals.every(i => selectedIntervalsSet.has(i.getShortName()));
  }, [selectedIntervalsSet]);
  
  // Check if some in group are selected
  const isGroupPartiallySelected = useCallback((intervals: Interval[]): boolean => {
    const selected = intervals.filter(i => selectedIntervalsSet.has(i.getShortName()));
    return selected.length > 0 && selected.length < intervals.length;
  }, [selectedIntervalsSet]);
  
  // Reset all settings
  const handleResetAll = useCallback(() => {
    resetToDefaults();
    resetPalette();
  }, [resetToDefaults, resetPalette]);
  
  if (!isOpen) return null;
  
  return (
    <Card className={`settings-panel ${compact ? 'settings-panel--compact' : ''} ${className}`} size="3">
      <Flex justify="between" align="center" mb="3">
        <Heading size="4">⚙️ Settings</Heading>
        {onClose && (
          <IconButton 
            variant="ghost" 
            onClick={onClose}
            aria-label="Close settings"
          >
            ✕
          </IconButton>
        )}
      </Flex>
      
      <Box className="settings-panel__content">
        {/* Appearance Section */}
        {showSection('appearance') && (
          <Collapsible.Root open={expandedSections.has('appearance')} onOpenChange={() => toggleSection('appearance')}>
            <Collapsible.Trigger asChild>
              <Button variant="ghost" className="settings-section__header" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <Text>🎨 Appearance</Text>
                <Text ml="auto">{expandedSections.has('appearance') ? '▼' : '▶'}</Text>
              </Button>
            </Collapsible.Trigger>
            
            <Collapsible.Content>
              <Box p="3" className="settings-section__body">
                {/* Color Palette */}
                <Flex direction="column" gap="2" mb="4">
                  <Text as="label" size="2" weight="medium">Color Theme</Text>
                  <Flex gap="2" align="center">
                    <Select.Root value={currentPalette.id} onValueChange={(value) => { setPalette(value); setColorPalette(value); }}>
                      <Select.Trigger placeholder="Select theme" style={{ flex: 1 }} />
                      <Select.Content>
                        {availablePalettes.map((palette) => (
                          <Select.Item key={palette.id} value={palette.id}>
                            {palette.name}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                    <IconButton
                      variant="soft"
                      onClick={() => { resetPalette(); setColorPalette('default'); }}
                      title="Reset to default theme"
                    >
                      ↺
                    </IconButton>
                  </Flex>
                  {/* Color swatches preview */}
                  <Flex gap="1" mt="2">
                    <Box className="color-swatch" style={{ backgroundColor: currentPalette.colors.fretboardBg }} title="Fretboard Background" />
                    <Box className="color-swatch" style={{ backgroundColor: currentPalette.colors.fretWire }} title="Fret Wire" />
                    <Box className="color-swatch" style={{ backgroundColor: currentPalette.colors.string }} title="String" />
                    <Box className="color-swatch" style={{ backgroundColor: currentPalette.colors.nut }} title="Nut" />
                    <Box className="color-swatch" style={{ backgroundColor: currentPalette.colors.fretMarker }} title="Fret Marker" />
                    <Box className="color-swatch" style={{ backgroundColor: currentPalette.colors.noteHover }} title="Note Hover" />
                    <Box className="color-swatch" style={{ backgroundColor: currentPalette.colors.noteActive }} title="Note Active" />
                  </Flex>
                </Flex>
                
                {/* Animation Speed */}
                <Flex direction="column" gap="2" mb="4">
                  <Text as="label" size="2" weight="medium">Animation Speed: {userSettings.animationSpeed.toFixed(1)}x</Text>
                  <Slider
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={[userSettings.animationSpeed]}
                    onValueChange={([value]) => setAnimationSpeed(value)}
                  />
                </Flex>
                
                {/* Sound Toggle */}
                <Flex align="center" gap="2" mb="3">
                  <Switch
                    checked={userSettings.soundEnabled}
                    onCheckedChange={setSoundEnabled}
                  />
                  <Text as="label" size="2">Sound Effects</Text>
                </Flex>
              </Box>
            </Collapsible.Content>
          </Collapsible.Root>
        )}
        
        <Separator size="4" my="2" />
        
        {/* Display Section */}
        {showSection('display') && (
          <Collapsible.Root open={expandedSections.has('display')} onOpenChange={() => toggleSection('display')}>
            <Collapsible.Trigger asChild>
              <Button variant="ghost" className="settings-section__header" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <Text>🎸 Fretboard Display</Text>
                <Text ml="auto">{expandedSections.has('display') ? '▼' : '▶'}</Text>
              </Button>
            </Collapsible.Trigger>
            
            <Collapsible.Content>
              <Box p="3" className="settings-section__body">
                {/* Note Display Preference */}
                <Flex direction="column" gap="2" mb="4">
                  <Text as="label" size="2" weight="medium">Note Display</Text>
                  <RadioGroup.Root value={userSettings.noteDisplay} onValueChange={(value) => setNoteDisplay(value as NoteDisplayPreference)}>
                    <Flex direction="column" gap="2">
                      <Flex align="center" gap="2">
                        <RadioGroup.Item value="sharps" id="sharps" />
                        <Text as="label" htmlFor="sharps" size="2">Sharps (C#, D#...)</Text>
                      </Flex>
                      <Flex align="center" gap="2">
                        <RadioGroup.Item value="flats" id="flats" />
                        <Text as="label" htmlFor="flats" size="2">Flats (Db, Eb...)</Text>
                      </Flex>
                      <Flex align="center" gap="2">
                        <RadioGroup.Item value="both" id="both" />
                        <Text as="label" htmlFor="both" size="2">Both</Text>
                      </Flex>
                    </Flex>
                  </RadioGroup.Root>
                </Flex>
                
                {/* Show Note Names */}
                <Flex align="center" gap="2" mb="3">
                  <Switch
                    checked={userSettings.showNoteNames}
                    onCheckedChange={setShowNoteNames}
                  />
                  <Text as="label" size="2">Show Note Names</Text>
                </Flex>
                
                {/* Fret Marker Style */}
                <Flex direction="column" gap="2" mb="4">
                  <Text as="label" size="2" weight="medium">Fret Marker Style</Text>
                  <Select.Root value={userSettings.markerStyle} onValueChange={(value) => setMarkerStyle(value as MarkerStyle)}>
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="dots">Standard Dots</Select.Item>
                      <Select.Item value="trapezoid">Gibson Trapezoid</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Flex>
              </Box>
            </Collapsible.Content>
          </Collapsible.Root>
        )}
        
        <Separator size="4" my="2" />
        
        <Separator size="4" my="2" />
        
        {/* Quiz Settings Section */}
        {showSection('quiz') && (
          <Collapsible.Root open={expandedSections.has('quiz')} onOpenChange={() => toggleSection('quiz')}>
            <Collapsible.Trigger asChild>
              <Button variant="ghost" className="settings-section__header" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <Text>🎯 Quiz Settings</Text>
                <Text ml="auto">{expandedSections.has('quiz') ? '▼' : '▶'}</Text>
              </Button>
            </Collapsible.Trigger>
            
            <Collapsible.Content>
              <Box p="3" className="settings-section__body">
                {/* Total Questions */}
                <Flex direction="column" gap="2" mb="4">
                  <Text as="label" size="2" weight="medium">Questions Per Quiz: {quizSettings.totalQuestions}</Text>
                  <Slider
                    min={5}
                    max={50}
                    step={5}
                    value={[quizSettings.totalQuestions]}
                    onValueChange={([value]) => updateQuizSettings({ totalQuestions: value })}
                  />
                </Flex>
                
                {/* Max Attempts Before Hint */}
                <Flex direction="column" gap="2" mb="4">
                  <Text as="label" size="2" weight="medium">Attempts Before Hint: {quizSettings.maxAttempts}</Text>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[quizSettings.maxAttempts]}
                    onValueChange={([value]) => updateQuizSettings({ maxAttempts: value })}
                  />
                </Flex>
                
                {/* Note Selection for Quiz */}
                <Flex direction="column" gap="2" mb="4">
                  <Text as="label" size="2" weight="medium">Quiz Note Display</Text>
                  <RadioGroup.Root value={quizSettings.noteSelection} onValueChange={(value) => updateQuizSettings({ noteSelection: value as NoteDisplayPreference })}>
                    <Flex direction="column" gap="2">
                      <Flex align="center" gap="2">
                        <RadioGroup.Item value="sharps" id="quiz-sharps" />
                        <Text as="label" htmlFor="quiz-sharps" size="2">Sharps Only</Text>
                      </Flex>
                      <Flex align="center" gap="2">
                        <RadioGroup.Item value="flats" id="quiz-flats" />
                        <Text as="label" htmlFor="quiz-flats" size="2">Flats Only</Text>
                      </Flex>
                      <Flex align="center" gap="2">
                        <RadioGroup.Item value="both" id="quiz-both" />
                        <Text as="label" htmlFor="quiz-both" size="2">Both</Text>
                      </Flex>
                    </Flex>
                  </RadioGroup.Root>
                </Flex>
                
                {/* Auto-Advance */}
                <Flex align="center" gap="2" mb="3">
                  <Switch
                    checked={quizSettings.autoAdvance}
                    onCheckedChange={(checked) => updateQuizSettings({ autoAdvance: checked })}
                  />
                  <Text as="label" size="2">Auto-advance to next question</Text>
                </Flex>
                
                {/* Auto-Advance Delay */}
                {quizSettings.autoAdvance && (
                  <Flex direction="column" gap="2" mb="4">
                    <Text as="label" size="2" weight="medium">Auto-advance Delay: {quizSettings.autoAdvanceDelay}ms</Text>
                    <Slider
                      min={500}
                      max={3000}
                      step={100}
                      value={[quizSettings.autoAdvanceDelay]}
                      onValueChange={([value]) => updateQuizSettings({ autoAdvanceDelay: value })}
                    />
                  </Flex>
                )}
                
                {/* Allow Compound Intervals */}
                <Flex align="center" gap="2" mb="3">
                  <Switch
                    checked={quizSettings.allowCompoundIntervals}
                    onCheckedChange={(checked) => updateQuizSettings({ allowCompoundIntervals: checked })}
                  />
                  <Text as="label" size="2">Include Compound Intervals (9th, 10th...)</Text>
                </Flex>
              </Box>
            </Collapsible.Content>
          </Collapsible.Root>
        )}
        
        <Separator size="4" my="2" />
        
        {/* Interval Selection Section */}
        {showSection('intervals') && (
          <Collapsible.Root open={expandedSections.has('intervals')} onOpenChange={() => toggleSection('intervals')}>
            <Collapsible.Trigger asChild>
              <Button variant="ghost" className="settings-section__header" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <Text>🎵 Interval Selection</Text>
                <Badge ml="2">{quizSettings.selectedIntervals.length} selected</Badge>
                <Text ml="auto">{expandedSections.has('intervals') ? '▼' : '▶'}</Text>
              </Button>
            </Collapsible.Trigger>
            
            <Collapsible.Content>
              <Box p="3" className="settings-section__body">
                {/* Quick Presets */}
                <Flex direction="column" gap="2" mb="4">
                  <Text as="label" size="2" weight="medium">Quick Presets</Text>
                  <Flex gap="2" wrap="wrap">
                    <Button size="1" variant="soft" onClick={() => handlePresetSelect('basic')} title="Basic intervals: P1, m3, M3, P4, P5, P8">
                      Basic (6)
                    </Button>
                    <Button size="1" variant="soft" onClick={() => handlePresetSelect('common')} title="Common intervals used in most music">
                      Common (13)
                    </Button>
                    <Button size="1" variant="soft" onClick={() => handlePresetSelect('all')} title="All simple intervals">
                      All Simple ({SIMPLE_INTERVALS.length})
                    </Button>
                    {quizSettings.allowCompoundIntervals && (
                      <Button size="1" variant="soft" onClick={() => handlePresetSelect('allWithCompound')} title="All intervals including compound">
                        All ({SIMPLE_INTERVALS.length + COMPOUND_INTERVALS.length})
                      </Button>
                    )}
                  </Flex>
                </Flex>
                
                {/* Simple Interval Groups */}
                <Box className="interval-groups">
                  <Text as="label" size="2" weight="medium" mb="2">Simple Intervals</Text>
                  {INTERVAL_GROUPS.map((group) => (
                    <Box key={group.name} className="interval-group" mb="3">
                      <Flex align="center" gap="2" mb="1">
                        <Checkbox
                          checked={isGroupSelected(group.intervals) ? true : isGroupPartiallySelected(group.intervals) ? 'indeterminate' : false}
                          onCheckedChange={(checked) => handleSelectGroup(group.intervals, checked === true)}
                        />
                        <Text size="2" weight="medium">{group.name}</Text>
                      </Flex>
                      <Flex gap="2" wrap="wrap" pl="5">
                        {group.intervals.map((interval) => (
                          <Flex key={interval.getShortName()} align="center" gap="1" title={interval.getFullName()}>
                            <Checkbox
                              size="1"
                              checked={selectedIntervalsSet.has(interval.getShortName())}
                              onCheckedChange={() => handleIntervalToggle(interval.getShortName())}
                            />
                            <Text size="1">{interval.getShortName()}</Text>
                          </Flex>
                        ))}
                      </Flex>
                    </Box>
                  ))}
                </Box>
                
                {/* Compound Interval Groups (only shown if enabled) */}
                {quizSettings.allowCompoundIntervals && (
                  <Box className="interval-groups interval-groups--compound" mt="4">
                    <Text as="label" size="2" weight="medium" mb="2">Compound Intervals</Text>
                    {COMPOUND_INTERVAL_GROUPS.map((group) => (
                      <Box key={group.name} className="interval-group" mb="3">
                        <Flex align="center" gap="2" mb="1">
                          <Checkbox
                            checked={isGroupSelected(group.intervals) ? true : isGroupPartiallySelected(group.intervals) ? 'indeterminate' : false}
                            onCheckedChange={(checked) => handleSelectGroup(group.intervals, checked === true)}
                          />
                          <Text size="2" weight="medium">{group.name}</Text>
                        </Flex>
                        <Flex gap="2" wrap="wrap" pl="5">
                          {group.intervals.map((interval) => (
                            <Flex key={interval.getShortName()} align="center" gap="1" title={interval.getFullName()}>
                              <Checkbox
                                size="1"
                                checked={selectedIntervalsSet.has(interval.getShortName())}
                                onCheckedChange={() => handleIntervalToggle(interval.getShortName())}
                              />
                              <Text size="1">{interval.getShortName()}</Text>
                            </Flex>
                          ))}
                        </Flex>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Collapsible.Content>
          </Collapsible.Root>
        )}
        
        <Separator size="4" my="2" />
        
        {/* Viewport Section */}
        {showSection('viewport') && (
          <Collapsible.Root open={expandedSections.has('viewport')} onOpenChange={() => toggleSection('viewport')}>
            <Collapsible.Trigger asChild>
              <Button variant="ghost" className="settings-section__header" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <Text>📐 Viewport</Text>
                <Text ml="auto">{expandedSections.has('viewport') ? '▼' : '▶'}</Text>
              </Button>
            </Collapsible.Trigger>
            
            <Collapsible.Content>
              <Box p="3" className="settings-section__body">
                {/* Visible Frets */}
                <Flex direction="column" gap="2" mb="4">
                  <Text as="label" size="2" weight="medium">Visible Frets: {viewport.visibleFrets}</Text>
                  <Slider
                    min={4}
                    max={24}
                    step={1}
                    value={[viewport.visibleFrets]}
                    onValueChange={([value]) => setVisibleFrets(value)}
                  />
                </Flex>
                
                {/* Start Fret */}
                <Flex direction="column" gap="2" mb="4">
                  <Text as="label" size="2" weight="medium">Start Fret: {viewport.startFret}</Text>
                  <Slider
                    min={0}
                    max={20}
                    step={1}
                    value={[viewport.startFret]}
                    onValueChange={([value]) => setStartFret(value)}
                  />
                </Flex>
                
                {/* Desktop Default */}
                <Flex direction="column" gap="2" mb="4">
                  <Text as="label" size="2" weight="medium">Desktop Default: {viewport.desktopFretCount} frets</Text>
                  <Slider
                    min={8}
                    max={24}
                    step={1}
                    value={[viewport.desktopFretCount]}
                    onValueChange={([value]) => setDesktopFretCount(value)}
                  />
                </Flex>
                
                {/* Mobile Default */}
                <Flex direction="column" gap="2" mb="4">
                  <Text as="label" size="2" weight="medium">Mobile Default: {viewport.mobileFretCount} frets</Text>
                  <Slider
                    min={3}
                    max={12}
                    step={1}
                    value={[viewport.mobileFretCount]}
                    onValueChange={([value]) => setMobileFretCount(value)}
                  />
                </Flex>
              </Box>
            </Collapsible.Content>
          </Collapsible.Root>
        )}
        
        <Separator size="4" my="2" />
        
        {/* Instrument Section */}
        {showSection('instrument') && (
          <Collapsible.Root open={expandedSections.has('instrument')} onOpenChange={() => toggleSection('instrument')}>
            <Collapsible.Trigger asChild>
              <Button variant="ghost" className="settings-section__header" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <Text>🎻 Instrument</Text>
                <Text ml="auto">{expandedSections.has('instrument') ? '▼' : '▶'}</Text>
              </Button>
            </Collapsible.Trigger>
            
            <Collapsible.Content>
              <Box p="3" className="settings-section__body">
                {/* Tuning Preset */}
                <Flex direction="column" gap="2" mb="4">
                  <Text as="label" size="2" weight="medium">Tuning</Text>
                  <Select.Root value={instrumentConfig.tuningPreset} onValueChange={(value) => setTuningPreset(value as TuningPreset)}>
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="standard">Standard (EADGBE)</Select.Item>
                      <Select.Item value="dropD">Drop D</Select.Item>
                      <Select.Item value="openG">Open G</Select.Item>
                      <Select.Item value="custom">Custom</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Flex>
                
                {/* Total Frets */}
                <Flex direction="column" gap="2" mb="4">
                  <Text as="label" size="2" weight="medium">Total Frets: {instrumentConfig.fretCount}</Text>
                  <Slider
                    min={12}
                    max={24}
                    step={1}
                    value={[instrumentConfig.fretCount]}
                    onValueChange={([value]) => setFretCount(value)}
                  />
                </Flex>
              </Box>
            </Collapsible.Content>
          </Collapsible.Root>
        )}
      </Box>
      
      {/* Footer with Reset */}
      <Separator size="4" my="3" />
      <Flex gap="2" justify="center" p="3">
        <Button variant="soft" size="2" onClick={resetQuizSettings} title="Reset quiz settings to defaults">
          Reset Quiz
        </Button>
        <Button variant="soft" size="2" onClick={resetUserSettings} title="Reset appearance settings to defaults">
          Reset Appearance
        </Button>
        <Button variant="soft" color="red" size="2" onClick={handleResetAll} title="Reset all settings to factory defaults">
          Reset All
        </Button>
      </Flex>
    </Card>
  );
}

export default SettingsPanel;
