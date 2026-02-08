import { useState, useEffect, useMemo } from 'react';
import { FretboardDisplay, ViewportControls, ZONE_COLORS } from './components/fretboard';
import type { ZoneConfig } from './components/fretboard';
import { ColorPaletteSwitcher, SettingsPanel } from './components/settings';
import { NoteQuizTest, IntervalQuizTest } from './components/quiz';
import { useResponsiveViewport } from './hooks';
import { useUserSettings, useAppStore } from './store/appStore';
import { Note } from './core/music-theory/Note';
import { 
  createRectangleZone, 
  CustomZoneBuilder, 
  createPitchClassZone,
  createPositionZone,
  createOctaveRangeZone
} from './core/zones';
import { HighlightZone } from './core/zones/HighlightZone';
import './App.css';

// Zone preset types
type ZonePreset = 'none' | 'rectangle' | 'custom' | 'multiple' | 'pitchClass' | 'position' | 'octave' | 'empty';

// App view modes
type ViewMode = 'fretboard' | 'quiz-test' | 'interval-quiz-test' | 'settings';

function App() {
  const { defaultFretCount, deviceType } = useResponsiveViewport();
  
  // Global settings from store
  const userSettings = useUserSettings();
  const { setShowNoteNames, setNoteDisplay, setMarkerStyle } = useAppStore();
  
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('fretboard');
  
  const [visibleFrets, setVisibleFrets] = useState(defaultFretCount);
  const [startFret, setStartFret] = useState(0);
  const [lastClickedNote, setLastClickedNote] = useState<Note | null>(null);
  
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
        // Create a rectangular zone (frets 3-7, strings 2-5)
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
        // Create a custom zone using the builder (diagonal pattern)
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
        // Create multiple zones displayed simultaneously
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
        // Create a zone with all G notes
        return [{
          zone: createPitchClassZone(['G'], {
            fretRange: { start: 0, end: 12 },
            name: 'G Notes'
          }),
          color: ZONE_COLORS.orange,
          label: 'All G Notes'
        }];
      
      case 'position':
        // Create a guitar position zone
        return [{
          zone: createPositionZone(5, 4),
          color: ZONE_COLORS.cyan,
          label: 'Position 5'
        }];
      
      case 'octave':
        // Create an octave range zone (C3 to B3)
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
        // Create an empty zone for edge case testing
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
    setVisibleFrets(count);
    setHasUserAdjusted(true);
  };

  const handleStartFretChange = (fret: number) => {
    setStartFret(fret);
    setHasUserAdjusted(true);
  };

  const handleReset = () => {
    setHasUserAdjusted(false);
  };

  const handleNoteClick = (note: Note) => {
    setLastClickedNote(note);
  };

  const handleRejectedClick = (note: Note, reason: string) => {
    setRejectedClickCount(prev => prev + 1);
    // Use userSettings.noteDisplay which is 'sharps' | 'flats' | 'both'
    const displayPref = userSettings.noteDisplay === 'both' ? 'sharps' : userSettings.noteDisplay;
    setLastRejectedNote(`${note.getFullName(displayPref)} - ${reason}`);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Fretboard Mastery Pro</h1>
        <p>Interactive Guitar Fretboard Visualization</p>
        
        {/* View Mode Navigation */}
        <nav className="view-nav">
          <button 
            className={`nav-btn ${viewMode === 'fretboard' ? 'active' : ''}`}
            onClick={() => setViewMode('fretboard')}
          >
            🎸 Fretboard
          </button>
          <button 
            className={`nav-btn ${viewMode === 'quiz-test' ? 'active' : ''}`}
            onClick={() => setViewMode('quiz-test')}
          >
            🎯 Note Quiz (NQI-005)
          </button>
          <button 
            className={`nav-btn ${viewMode === 'interval-quiz-test' ? 'active' : ''}`}
            onClick={() => setViewMode('interval-quiz-test')}
          >
            🎵 Interval Quiz (INT)
          </button>
          <button 
            className={`nav-btn ${viewMode === 'settings' ? 'active' : ''}`}
            onClick={() => setViewMode('settings')}
          >
            ⚙️ Settings (APP-004)
          </button>
        </nav>
      </header>

      {/* Settings Mode */}
      {viewMode === 'settings' && (
        <main className="app-main settings-view">
          <SettingsPanel 
            sections={['all']}
            onClose={() => setViewMode('fretboard')}
          />
        </main>
      )}

      {/* Quiz Test Mode */}
      {viewMode === 'quiz-test' && (
        <main className="app-main">
          <NoteQuizTest />
        </main>
      )}

      {/* Interval Quiz Test Mode */}
      {viewMode === 'interval-quiz-test' && (
        <main className="app-main">
          <IntervalQuizTest />
        </main>
      )}

      {/* Fretboard Mode */}
      {viewMode === 'fretboard' && (
      <main className="app-main">
        {/* Viewport Controls */}
        <ViewportControls
          visibleFrets={visibleFrets}
          onVisibleFretsChange={handleVisibleFretsChange}
          startFret={startFret}
          onStartFretChange={handleStartFretChange}
          deviceType={deviceType}
          onReset={handleReset}
        />

        {/* Display Controls */}
        <div className="controls">
          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={userSettings.showNoteNames}
                onChange={(e) => setShowNoteNames(e.target.checked)}
              />
              Show Note Names
            </label>
          </div>
          
          <div className="control-group">
            <label>Note Display:</label>
            <select
              value={userSettings.noteDisplay === 'both' ? 'sharps' : userSettings.noteDisplay}
              onChange={(e) => setNoteDisplay(e.target.value as 'sharps' | 'flats' | 'both')}
            >
              <option value="sharps">Sharps (C#, D#, F#...)</option>
              <option value="flats">Flats (Db, Eb, Gb...)</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>Fret Markers:</label>
            <select
              value={userSettings.markerStyle}
              onChange={(e) => setMarkerStyle(e.target.value as 'dots' | 'trapezoid')}
            >
              <option value="dots">Standard Dots</option>
              <option value="trapezoid">Gibson Trapezoid</option>
            </select>
          </div>
          
          <div className="control-group color-control">
            <ColorPaletteSwitcher />
          </div>
        </div>

        {/* Zone Testing Controls */}
        <div className="controls zone-controls">
          <h3>🎯 Zone Testing (HLZ Feature)</h3>
          
          <div className="control-group">
            <label>Zone Preset:</label>
            <select
              value={zonePreset}
              onChange={(e) => setZonePreset(e.target.value as ZonePreset)}
            >
              <option value="none">None (No Zones)</option>
              <option value="rectangle">Rectangle Zone (Frets 3-7, Strings 2-5)</option>
              <option value="custom">Custom Zone (Individual Notes)</option>
              <option value="multiple">Multiple Zones (3 overlapping)</option>
              <option value="pitchClass">Pitch Class Zone (All G Notes)</option>
              <option value="position">Position Zone (Position 5)</option>
              <option value="octave">Octave Range (C3-B3)</option>
              <option value="empty">Empty Zone (Edge Case)</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={zoneOnlyMode}
                onChange={(e) => setZoneOnlyMode(e.target.checked)}
              />
              Zone-Only Mode (reject clicks outside zone)
            </label>
          </div>
          
          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={showZoneNotesOnly}
                onChange={(e) => setShowZoneNotesOnly(e.target.checked)}
              />
              Show Zone Notes Only
            </label>
          </div>
          
          {zonePreset !== 'none' && (
            <div className="zone-info">
              <strong>Active Zones:</strong>
              <ul>
                {highlightZones.map((zc, i) => (
                  <li key={i}>
                    {zc.label || `Zone ${i + 1}`} ({zc.zone.size()} notes)
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {zoneOnlyMode && (
            <div className="zone-stats">
              <span>Rejected clicks: <strong>{rejectedClickCount}</strong></span>
              {lastRejectedNote && (
                <span className="rejected-info">Last rejected: {lastRejectedNote}</span>
              )}
            </div>
          )}
        </div>

        {/* Fretboard */}
        <div className="fretboard-wrapper">
          <FretboardDisplay
            visibleFrets={visibleFrets}
            startFret={startFret}
            showNoteNames={userSettings.showNoteNames}
            noteDisplay={userSettings.noteDisplay === 'both' ? 'sharps' : userSettings.noteDisplay}
            onNoteClick={handleNoteClick}
            selectedNote={lastClickedNote}
            markerStyle={userSettings.markerStyle}
            highlightZones={highlightZones}
            zoneOnlyMode={zoneOnlyMode}
            showZoneNotesOnly={showZoneNotesOnly}
            onRejectedClick={handleRejectedClick}
          />
        </div>


        {/* Click Feedback */}
        {lastClickedNote && (
          <div className="click-feedback">
            <div className="click-feedback-title">
              <strong>Selected Note</strong>
            </div>
            <div className="click-feedback-details">
              <span className="note-info">
                <span className="label">Note:</span>
                <span className="value">{lastClickedNote.getFullName(userSettings.noteDisplay === 'both' ? 'sharps' : userSettings.noteDisplay)}</span>
              </span>
              <span className="note-info">
                <span className="label">Position:</span>
                <span className="value">String {lastClickedNote.string}, Fret {lastClickedNote.fret}</span>
              </span>
              <span className="note-info">
                <span className="label">MIDI:</span>
                <span className="value">{lastClickedNote.midiNumber}</span>
              </span>
              {userSettings.noteDisplay === 'sharps' && lastClickedNote.pitchClass.includes('#') && (
                <span className="note-info">
                  <span className="label">Enharmonic:</span>
                  <span className="value">{lastClickedNote.getFlatName()}{lastClickedNote.octave}</span>
                </span>
              )}
              {userSettings.noteDisplay === 'flats' && lastClickedNote.getFlatName() !== lastClickedNote.getSharpName() && (
                <span className="note-info">
                  <span className="label">Enharmonic:</span>
                  <span className="value">{lastClickedNote.getSharpName()}{lastClickedNote.octave}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </main>
      )}
    </div>
  );
}

export default App;
