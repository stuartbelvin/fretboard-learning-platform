import { useState, useEffect, useMemo } from 'react';
import { Box, Flex, Text, Heading, Select, Checkbox, Card } from '@radix-ui/themes';
import { FretboardDisplay, ZONE_COLORS } from '../components/fretboard';
import type { ZoneConfig } from '../components/fretboard';
import { ColorPaletteSwitcher } from '../components/settings';
import { useResponsiveViewport } from '../hooks';
import { useUserSettings, useAppStore } from '../store/appStore';
import { Note } from '../core/music-theory/Note';
import { 
  createRectangleZone, 
  CustomZoneBuilder, 
  createPitchClassZone,
  createPositionZone,
  createOctaveRangeZone
} from '../core/zones';
import { HighlightZone } from '../core/zones/HighlightZone';

// Zone preset types
type ZonePreset = 'none' | 'rectangle' | 'custom' | 'multiple' | 'pitchClass' | 'position' | 'octave' | 'empty';

/**
 * HomePage - Main fretboard visualization page
 * 
 * Provides interactive fretboard with zone testing capabilities
 * and display settings. Viewport controls are now integrated
 * directly into the fretboard via resize handles and position slider.
 */
export function HomePage() {
  const { defaultFretCount } = useResponsiveViewport();
  
  // Global settings from store
  const userSettings = useUserSettings();
  const { setShowNoteNames, setNoteDisplay, setMarkerStyle } = useAppStore();
  
  const [visibleFrets, setVisibleFrets] = useState(defaultFretCount);
  const [startFret, setStartFret] = useState(0);
  
  // Zone testing state
  const [zonePreset, setZonePreset] = useState<ZonePreset>('none');
  const [zoneOnlyMode, setZoneOnlyMode] = useState(false);
  const [showZoneNotesOnly, setShowZoneNotesOnly] = useState(false);
  const [rejectedClickCount, setRejectedClickCount] = useState(0);
  const [lastRejectedNote, setLastRejectedNote] = useState<string | null>(null);

  // Update visible frets when device type changes (only if user hasn't manually adjusted)
  const [hasUserAdjusted, setHasUserAdjusted] = useState(false);
  
  useEffect(() => {
    if (!hasUserAdjusted) {
      setVisibleFrets(defaultFretCount);
    }
  }, [defaultFretCount, hasUserAdjusted]);

  // Generate highlight zones based on preset
  const highlightZones: ZoneConfig[] = useMemo(() => {
    switch (zonePreset) {
      case 'rectangle':
        return [{
          zone: createRectangleZone({
            startString: 2,
            endString: 5,
            startFret: 3,
            endFret: 7,
            name: 'Rectangle Zone'
          }),
          color: ZONE_COLORS.blue,
          label: 'Rectangle Zone (Frets 3-7, Strings 2-5)'
        }];
      
      case 'custom':
        return [{
          zone: new CustomZoneBuilder('Custom Zone')
            .add(1, 5)
            .add(2, 5)
            .add(2, 7)
            .add(3, 4)
            .add(3, 5)
            .add(3, 7)
            .add(4, 5)
            .add(4, 7)
            .add(5, 5)
            .add(6, 5)
            .build(),
          color: ZONE_COLORS.green,
          label: 'Custom Zone (Individual Notes)'
        }];
      
      case 'multiple':
        return [
          {
            zone: createRectangleZone({
              startString: 1,
              endString: 3,
              startFret: 0,
              endFret: 3,
              name: 'Zone A'
            }),
            color: ZONE_COLORS.blue,
            label: 'Zone A (Blue)'
          },
          {
            zone: createRectangleZone({
              startString: 4,
              endString: 6,
              startFret: 5,
              endFret: 8,
              name: 'Zone B'
            }),
            color: ZONE_COLORS.purple,
            label: 'Zone B (Purple)'
          },
          {
            zone: createPitchClassZone(['C'], {
              fretRange: { start: 0, end: 12 },
              name: 'All C Notes'
            }),
            color: ZONE_COLORS.yellow,
            label: 'All C Notes (Yellow)'
          }
        ];
      
      case 'pitchClass':
        return [{
          zone: createPitchClassZone(['G'], {
            fretRange: { start: 0, end: 12 },
            name: 'G Notes'
          }),
          color: ZONE_COLORS.orange,
          label: 'All G Notes'
        }];
      
      case 'position':
        return [{
          zone: createPositionZone(5, 4),
          color: ZONE_COLORS.cyan,
          label: 'Position 5'
        }];
      
      case 'octave':
        return [{
          zone: createOctaveRangeZone({
            rootPitchClass: 'C',
            startOctave: 3,
            octaveCount: 1,
            name: 'C3-B3 Range'
          }),
          color: ZONE_COLORS.pink,
          label: 'Octave Range (C3-B3)'
        }];
      
      case 'empty':
        return [{
          zone: new HighlightZone('Empty Zone'),
          color: ZONE_COLORS.red,
          label: 'Empty Zone'
        }];
      
      default:
        return [];
    }
  }, [zonePreset]);

  const handleVisibleFretsChange = (count: number) => {
    console.log('Resizing: visibleFrets changing to', count);
    setVisibleFrets(count);
    setHasUserAdjusted(true);
  };

  const handleStartFretChange = (fret: number) => {
    console.log('Panning (slider): startFret changing to', fret);
    setStartFret(fret);
    setHasUserAdjusted(true);
  };

  const handleRejectedClick = (note: Note, reason: string) => {
    setRejectedClickCount(prev => prev + 1);
    const displayPref = userSettings.noteDisplay === 'both' ? 'sharps' : userSettings.noteDisplay;
    setLastRejectedNote(`${note.getFullName(displayPref)} - ${reason}`);
  };

  return (
    <Box className="app-main" p="4">
      {/* Display Controls */}
      <Card mb="4" className="controls">
        <Flex gap="4" wrap="wrap" align="end">
          <Flex gap="2" align="center" className="control-group">
            <Checkbox
              checked={userSettings.showNoteNames}
              onCheckedChange={(checked) => setShowNoteNames(checked === true)}
            />
            <Text size="2">Show Note Names</Text>
          </Flex>
          
          <Flex direction="column" gap="1" className="control-group">
            <Text size="2" weight="medium">Note Display</Text>
            <Select.Root
              value={userSettings.noteDisplay === 'both' ? 'sharps' : userSettings.noteDisplay}
              onValueChange={(value) => setNoteDisplay(value as 'sharps' | 'flats' | 'both')}
            >
              <Select.Trigger placeholder="Select display" />
              <Select.Content>
                <Select.Item value="sharps">Sharps (C#, D#, F#...)</Select.Item>
                <Select.Item value="flats">Flats (Db, Eb, Gb...)</Select.Item>
              </Select.Content>
            </Select.Root>
          </Flex>
          
          <Flex direction="column" gap="1" className="control-group">
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
          
          <Box className="control-group color-control">
            <ColorPaletteSwitcher />
          </Box>
        </Flex>
      </Card>

      {/* Zone Testing Controls */}
      <Card mb="4" className="controls zone-controls">
        <Heading as="h3" size="3" mb="3">🎯 Zone Testing (HLZ Feature)</Heading>
        
        <Flex gap="4" wrap="wrap" align="end">
          <Flex direction="column" gap="1" className="control-group">
            <Text size="2" weight="medium">Zone Preset</Text>
            <Select.Root
              value={zonePreset}
              onValueChange={(value) => setZonePreset(value as ZonePreset)}
            >
              <Select.Trigger placeholder="Select preset" style={{ minWidth: '200px' }} />
              <Select.Content>
                <Select.Item value="none">None (No Zones)</Select.Item>
                <Select.Item value="rectangle">Rectangle Zone (Frets 3-7, Strings 2-5)</Select.Item>
                <Select.Item value="custom">Custom Zone (Individual Notes)</Select.Item>
                <Select.Item value="multiple">Multiple Zones (3 overlapping)</Select.Item>
                <Select.Item value="pitchClass">Pitch Class Zone (All G Notes)</Select.Item>
                <Select.Item value="position">Position Zone (Position 5)</Select.Item>
                <Select.Item value="octave">Octave Range (C3-B3)</Select.Item>
                <Select.Item value="empty">Empty Zone (Edge Case)</Select.Item>
              </Select.Content>
            </Select.Root>
          </Flex>
          
          <Flex gap="2" align="center" className="control-group">
            <Checkbox
              checked={zoneOnlyMode}
              onCheckedChange={(checked) => setZoneOnlyMode(checked === true)}
            />
            <Text size="2">Zone-Only Mode (reject clicks outside zone)</Text>
          </Flex>
          
          <Flex gap="2" align="center" className="control-group">
            <Checkbox
              checked={showZoneNotesOnly}
              onCheckedChange={(checked) => setShowZoneNotesOnly(checked === true)}
            />
            <Text size="2">Show Zone Notes Only</Text>
          </Flex>
        </Flex>
        
        {zonePreset !== 'none' && (
          <Box mt="3" className="zone-info">
            <Text size="2" weight="bold">Active Zones:</Text>
            <Box mt="1" style={{ paddingLeft: '20px' }}>
              {highlightZones.map((zc, i) => (
                <Text key={i} size="2" as="div">
                  • {zc.label || `Zone ${i + 1}`} ({zc.zone.size()} notes)
                </Text>
              ))}
            </Box>
          </Box>
        )}
        
        {zoneOnlyMode && (
          <Flex gap="3" mt="3" className="zone-stats">
            <Text size="2">Rejected clicks: <Text weight="bold">{rejectedClickCount}</Text></Text>
            {lastRejectedNote && (
              <Text size="2" color="orange">Last rejected: {lastRejectedNote}</Text>
            )}
          </Flex>
        )}
      </Card>

      {/* Fretboard with integrated viewport controls */}
      <FretboardDisplay
        visibleFrets={visibleFrets}
        startFret={startFret}
        showNoteNames={userSettings.showNoteNames}
        noteDisplay={userSettings.noteDisplay === 'both' ? 'sharps' : userSettings.noteDisplay}
        markerStyle={userSettings.markerStyle}
        highlightZones={highlightZones}
        zoneOnlyMode={zoneOnlyMode}
        showZoneNotesOnly={showZoneNotesOnly}
        onRejectedClick={handleRejectedClick}
        onVisibleFretsChange={handleVisibleFretsChange}
        onStartFretChange={handleStartFretChange}
      />
    </Box>
  );
}
