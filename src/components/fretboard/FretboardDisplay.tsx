import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Fretboard, STANDARD_FRET_MARKERS, DOUBLE_FRET_MARKERS } from '../../core/instruments/Fretboard';
import type { FretboardConfig } from '../../core/instruments/Fretboard';
import { Note } from '../../core/music-theory/Note';
import { HighlightZone } from '../../core/zones/HighlightZone';
import type { FeedbackState, FeedbackType } from '../../core/quiz/QuizFeedbackManager';
import './FretboardDisplay.css';

/**
 * Configuration for a highlight zone's visual appearance.
 */
export interface ZoneConfig {
  /** The highlight zone containing note positions */
  zone: HighlightZone;
  /** CSS color for the zone highlight (supports any valid CSS color) */
  color?: string;
  /** Opacity for the highlight (0-1, default: 0.3) */
  opacity?: number;
  /** Optional label for the zone */
  label?: string;
}

/**
 * Predefined zone highlight colors for easy use.
 */
export const ZONE_COLORS = {
  blue: 'rgba(59, 130, 246, 0.35)',      // Primary zone color
  green: 'rgba(34, 197, 94, 0.35)',      // Answer zone / correct
  red: 'rgba(239, 68, 68, 0.35)',        // Warning / incorrect
  purple: 'rgba(168, 85, 247, 0.35)',    // Secondary zone
  orange: 'rgba(249, 115, 22, 0.35)',    // Accent zone
  yellow: 'rgba(234, 179, 8, 0.35)',     // Root note highlight
  cyan: 'rgba(6, 182, 212, 0.35)',       // Alternative highlight
  pink: 'rgba(236, 72, 153, 0.35)',      // Special zone
} as const;

/**
 * Props for the FretboardDisplay component.
 */
export interface FretboardDisplayProps {
  /** Custom fretboard configuration (optional, uses standard guitar if not provided) */
  config?: Partial<FretboardConfig>;
  /** Number of frets to display (viewport) */
  visibleFrets?: number;
  /** Starting fret for the viewport (default: 0) */
  startFret?: number;
  /** Callback when a note is clicked */
  onNoteClick?: (note: Note) => void;
  /** Display preference for note names */
  noteDisplay?: 'sharps' | 'flats' | 'none';
  /** Show note names on the fretboard */
  showNoteNames?: boolean;
  /** Currently selected note (for visual highlighting) */
  selectedNote?: Note | null;
  /** Style for fret markers: 'dots' (standard) or 'trapezoid' (Gibson-style) */
  markerStyle?: 'dots' | 'trapezoid';
  /** Highlight zones to display on the fretboard */
  highlightZones?: ZoneConfig[];
  /** Show note names only for notes within highlight zones */
  showZoneNotesOnly?: boolean;
  /** When enabled, only notes within highlight zones are clickable */
  zoneOnlyMode?: boolean;
  /** Callback when a click is rejected (outside zone in zoneOnlyMode) */
  onRejectedClick?: (note: Note, reason: string) => void;
  /** Active feedback states for quiz visual feedback (correct, incorrect, hint) */
  feedbackStates?: FeedbackState[];
  /** Root note for interval quiz mode - highlighted distinctly from answer zone */
  rootNote?: Note | null;
  /** Color for root note highlight (default: yellow/gold) */
  rootNoteColor?: string;
  /** Whether to show the root note name as a label */
  showRootNoteLabel?: boolean;
  /** 
   * Indicates that the root note is outside the answer zone (for compound intervals).
   * When true, shows a visual indicator (dashed border + "outside zone" badge).
   */
  rootOutsideZone?: boolean;
  /** Maximum fret count available (for viewport controls) */
  maxFrets?: number;
  /** Callback to update visible frets count (for resize handles) */
  onVisibleFretsChange?: (count: number) => void;
  /** Callback to update starting fret (for position slider) */
  onStartFretChange?: (fret: number) => void;
}

/**
 * Interactive fretboard visualization component.
 * Uses CSS Grid for layout with visual string differentiation and fret markers.
 */
/**
 * Default color for root note highlighting (gold/yellow).
 */
export const ROOT_NOTE_COLOR = 'rgba(234, 179, 8, 0.7)';

export function FretboardDisplay({
  config,
  visibleFrets = 12,
  startFret = 0,
  onNoteClick,
  noteDisplay = 'sharps',
  showNoteNames = false,
  selectedNote = null,
  markerStyle = 'dots',
  highlightZones = [],
  showZoneNotesOnly = false,
  zoneOnlyMode = false,
  onRejectedClick,
  feedbackStates = [],
  rootNote = null,
  rootNoteColor = ROOT_NOTE_COLOR,
  showRootNoteLabel = true,
  rootOutsideZone = false,
  maxFrets = 24,
  onVisibleFretsChange,
  onStartFretChange,
}: FretboardDisplayProps) {
  // Create fretboard instance
  const fretboard = useMemo(() => new Fretboard(config), [config]);
  
  // Track rejected note for visual feedback
  const [rejectedNote, setRejectedNote] = useState<string | null>(null);
  
  // Track resize dragging state
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);
  
  const fretRange = Array.from({ length: visibleFrets }, (_, i) => startFret + i);
  const stringRange = Array.from({ length: fretboard.config.stringCount }, (_, i) => i + 1);
  
  // Calculate max start fret to prevent viewport overflow
  // +1 ensures the last fret (24) can be the final visible fret
  const maxStartFret = Math.max(0, maxFrets - visibleFrets + 1);

  /**
   * Clears the rejected note state after animation completes.
   */
  const clearRejectedNote = useCallback(() => {
    setRejectedNote(null);
  }, []);

  /**
   * Handles click on a note position.
   * In zoneOnlyMode, rejects clicks on notes outside highlight zones.
   */
  const handleNoteClick = (note: Note) => {
    // Check if zone-only mode is active and there are zones defined
    if (zoneOnlyMode && highlightZones.length > 0) {
      const inAnyZone = highlightZones.some(zc => zc.zone.containsNote(note.string, note.fret));
      
      if (!inAnyZone) {
        // Reject the click - note is outside all zones
        const positionId = note.getPositionId();
        setRejectedNote(positionId);
        
        // Clear rejected state after animation duration (500ms)
        setTimeout(clearRejectedNote, 500);
        
        console.log('Click rejected:', {
          position: positionId,
          note: note.getFullName(noteDisplay === 'flats' ? 'flats' : 'sharps'),
          reason: 'Note is outside highlight zone',
        });
        
        onRejectedClick?.(note, 'Note is outside highlight zone');
        return;
      }
    }
    
    console.log('Note clicked:', {
      position: note.getPositionId(),
      note: note.getFullName(noteDisplay === 'flats' ? 'flats' : 'sharps'),
      string: note.string,
      fret: note.fret,
      midiNumber: note.midiNumber,
    });
    onNoteClick?.(note);
  };

  /**
   * Gets the display name for a note based on preference.
   */
  const getNoteDisplayName = (note: Note): string => {
    if (noteDisplay === 'none') return '';
    return note.getDisplayName(noteDisplay);
  };

  /**
   * Determines if a fret has a single dot marker.
   */
  const hasSingleMarker = (fret: number): boolean => {
    return STANDARD_FRET_MARKERS.includes(fret) && !DOUBLE_FRET_MARKERS.includes(fret);
  };

  /**
   * Determines if a fret has a double dot marker.
   */
  const hasDoubleMarker = (fret: number): boolean => {
    return DOUBLE_FRET_MARKERS.includes(fret);
  };

  /**
   * Gets the string thickness class based on string number.
   * Higher string numbers (bass strings) are thicker.
   */
  const getStringThicknessClass = (stringNum: number): string => {
    if (stringNum <= 2) return 'string-thin';      // High E, B
    if (stringNum <= 4) return 'string-medium';    // G, D
    return 'string-thick';                          // A, Low E
  };

  /**
   * Checks if a note is currently selected.
   */
  const isNoteSelected = (note: Note): boolean => {
    if (!selectedNote) return false;
    return note.isSamePosition(selectedNote);
  };

  /**
   * Gets all zone configurations that contain a given note.
   * Returns array of zone configs for notes that may be in multiple zones.
   */
  const getZonesForNote = (note: Note): ZoneConfig[] => {
    return highlightZones.filter(zoneConfig => 
      zoneConfig.zone.containsNote(note.string, note.fret)
    );
  };

  /**
   * Checks if a note is in any highlight zone.
   */
  const isNoteInAnyZone = (note: Note): boolean => {
    return highlightZones.some(zoneConfig => 
      zoneConfig.zone.containsNote(note.string, note.fret)
    );
  };

  /**
   * Gets the CSS style for a note's zone highlight.
   * If the note is in multiple zones, returns the first zone's style.
   */
  const getZoneHighlightStyle = (note: Note): React.CSSProperties | undefined => {
    const zones = getZonesForNote(note);
    if (zones.length === 0) return undefined;
    
    const zoneConfig = zones[0];
    const color = zoneConfig.color || ZONE_COLORS.blue;
    const opacity = zoneConfig.opacity ?? 0.3;
    
    return {
      '--zone-highlight-color': color,
      '--zone-highlight-opacity': opacity,
    } as React.CSSProperties;
  };

  /**
   * Determines if note name should be shown based on zone settings.
   */
  const shouldShowNoteName = (note: Note): boolean => {
    if (!showNoteNames) return false;
    if (showZoneNotesOnly) {
      return isNoteInAnyZone(note);
    }
    return true;
  };

  /**
   * Checks if a note was just rejected (for visual feedback).
   */
  const isNoteRejected = (note: Note): boolean => {
    return rejectedNote === note.getPositionId();
  };

  /**
   * Checks if a note should be disabled (in zoneOnlyMode and outside zones).
   */
  const isNoteDisabled = (note: Note): boolean => {
    if (!zoneOnlyMode || highlightZones.length === 0) return false;
    return !isNoteInAnyZone(note);
  };

  /**
   * Gets the feedback type for a note from the active feedback states.
   * @param note The note to check
   * @returns The feedback type ('correct', 'incorrect', 'hint', or 'none')
   */
  const getNoteFeedbackType = (note: Note): FeedbackType => {
    const positionId = note.getPositionId();
    const feedback = feedbackStates.find(f => f.positionId === positionId);
    return feedback?.type ?? 'none';
  };

  /**
   * Checks if a note is the designated root note (for interval quizzes).
   */
  const isRootNote = (note: Note): boolean => {
    if (!rootNote) return false;
    return note.isSamePosition(rootNote);
  };

  /**
   * Gets the display name for the root note.
   */
  const getRootNoteDisplayName = (note: Note): string => {
    return note.getDisplayName(noteDisplay === 'flats' ? 'flats' : 'sharps');
  };

  // ============================================================================
  // Viewport Control Handlers
  // ============================================================================

  const fretboardRef = useRef<HTMLDivElement>(null);

  /**
   * Handles left resize handle drag start.
   * Dragging left handle adjusts visible fret count (inverted: drag left = fewer frets).
   */
  const handleLeftDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!onVisibleFretsChange) return;
    e.preventDefault();
    setIsDraggingLeft(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
    setDragStartValue(visibleFrets);
  }, [onVisibleFretsChange, visibleFrets]);

  /**
   * Handles right resize handle drag start.
   * Dragging right handle adjusts visible fret count.
   */
  const handleRightDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!onVisibleFretsChange) return;
    e.preventDefault();
    setIsDraggingRight(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
    setDragStartValue(visibleFrets);
  }, [onVisibleFretsChange, visibleFrets]);

  /**
   * Handles mouse/touch move during drag.
   */
  useEffect(() => {
    if (!isDraggingLeft && !isDraggingRight) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - dragStartX;
      
      // Use a fixed pixel-to-fret ratio for responsive movement
      // 30px per fret change feels natural
      const fretDelta = Math.round(deltaX / 30);

      if (isDraggingLeft && onVisibleFretsChange) {
        // Left handle: dragging left decreases visible frets, right increases (inverted)
        const newVisibleFrets = Math.max(4, Math.min(maxFrets, dragStartValue - fretDelta));
        onVisibleFretsChange(newVisibleFrets);
        // Auto-adjust startFret if needed to fit the new visible range
        if (onStartFretChange && startFret + newVisibleFrets > maxFrets) {
          onStartFretChange(Math.max(0, maxFrets - newVisibleFrets));
        }
      } else if (isDraggingRight && onVisibleFretsChange) {
        // Right handle: dragging right increases visible frets, left decreases
        const newVisibleFrets = Math.max(4, Math.min(maxFrets, dragStartValue + fretDelta));
        onVisibleFretsChange(newVisibleFrets);
        // Auto-adjust startFret if needed to fit the new visible range
        if (onStartFretChange && startFret + newVisibleFrets > maxFrets) {
          onStartFretChange(Math.max(0, maxFrets - newVisibleFrets));
        }
      }
    };

    const handleEnd = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDraggingLeft, isDraggingRight, dragStartX, dragStartValue, maxStartFret, maxFrets, startFret, onStartFretChange, onVisibleFretsChange, fretRange.length]);

  // Calculate slider thumb width for visual representation
  // Thumb width represents the visible portion of the fretboard
  const sliderThumbWidth = (visibleFrets / maxFrets) * 100;

  // Determine if viewport controls should be shown
  const showViewportControls = onVisibleFretsChange || onStartFretChange;

  return (
    <div className="fretboard-wrapper">
      <div 
        className={`fretboard-container marker-style-${markerStyle} ${isDraggingLeft || isDraggingRight ? 'is-dragging' : ''}`}
        style={{
          '--fret-count': fretRange.length,
          '--string-count': fretboard.config.stringCount,
        } as React.CSSProperties}
      >
        {/* Left resize handle */}
        {showViewportControls && (
          <div 
            className="viewport-handle viewport-handle-left"
            onMouseDown={handleLeftDragStart}
            onTouchStart={handleLeftDragStart}
            aria-label="Drag to adjust viewport start position"
            role="slider"
            aria-valuemin={0}
            aria-valuemax={maxStartFret}
            aria-valuenow={startFret}
          >
            <div className="handle-grip" />
          </div>
        )}

        {/* Fret numbers header */}
        <div className="fret-numbers">
          {fretRange.map((fret) => (
            <div key={`fret-num-${fret}`} className="fret-number">
              {fret}
            </div>
          ))}
        </div>

        {/* Main fretboard grid */}
        <div className="fretboard" ref={fretboardRef}>
          {/* Nut (fret 0 separator) */}
          {startFret === 0 && <div className="nut" />}
          
          {/* Fret markers layer */}
          <div className="fret-markers-layer">
            {fretRange.map((fret) => {
              // For trapezoid style, 12th and 24th frets get a single large marker instead of double
              const useDoubleMarker = hasDoubleMarker(fret) && markerStyle !== 'trapezoid';
              const useSingleMarker = hasSingleMarker(fret) || (hasDoubleMarker(fret) && markerStyle === 'trapezoid');
              
              return (
                <div key={`marker-${fret}`} className="fret-marker-cell">
                  {useSingleMarker && (
                    <div className={`fret-marker fret-marker-single ${hasDoubleMarker(fret) ? 'fret-marker-octave' : ''}`} />
                  )}
                  {useDoubleMarker && (
                    <>
                      <div className="fret-marker fret-marker-double-top" />
                      <div className="fret-marker fret-marker-double-bottom" />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Strings and notes */}
          {stringRange.map((stringNum) => (
            <div key={`string-${stringNum}`} className="string-row">
              {/* String line */}
              <div className={`string-line ${getStringThicknessClass(stringNum)}`} />
              
              {/* Notes on this string */}
              {fretRange.map((fret) => {
                const note = fretboard.getNoteAt(stringNum, fret);
                if (!note) return null;
                
                const inZone = isNoteInAnyZone(note);
                const zones = getZonesForNote(note);
                const zoneStyle = getZoneHighlightStyle(note);
                
                const rejected = isNoteRejected(note);
                const disabled = isNoteDisabled(note);
                const feedbackType = getNoteFeedbackType(note);
                const isRoot = isRootNote(note);
                const isRootAndOutsideZone = isRoot && rootOutsideZone;
                
                // Build class names for the note button
                const buttonClasses = [
                  'note-button',
                  isNoteSelected(note) ? 'selected' : '',
                  inZone ? 'in-zone' : '',
                  zones.length > 1 ? 'multi-zone' : '',
                  rejected ? 'rejected' : '',
                  disabled ? 'disabled-zone' : '',
                  feedbackType !== 'none' ? feedbackType : '',
                  isRoot ? 'root-note' : '',
                  isRootAndOutsideZone ? 'root-outside-zone' : '',
                ].filter(Boolean).join(' ');
                
                // Combine zone style with root note color if applicable
                const cellStyle: React.CSSProperties = {
                  ...zoneStyle,
                  ...(isRoot ? { '--root-note-color': rootNoteColor } as React.CSSProperties : {}),
                };
                
                return (
                  <div
                    key={note.getPositionId()}
                    className={`note-cell ${fret === 0 ? 'open-string' : ''} ${inZone ? 'zone-highlight' : ''} ${rejected ? 'rejected-cell' : ''} ${isRoot ? 'root-note-cell' : ''} ${isRootAndOutsideZone ? 'root-outside-zone-cell' : ''}`}
                    data-string={stringNum}
                    data-fret={fret}
                    data-zone-count={zones.length}
                    data-is-root={isRoot ? 'true' : undefined}
                    data-root-outside-zone={isRootAndOutsideZone ? 'true' : undefined}
                    style={cellStyle}
                  >
                    <button
                      className={buttonClasses}
                      onClick={() => handleNoteClick(note)}
                      aria-label={`${note.getFullName()} on string ${stringNum}, fret ${fret}${isRoot ? ', root note' : ''}${isRootAndOutsideZone ? ', outside answer zone' : ''}${inZone ? ', in highlighted zone' : ''}${disabled ? ', outside active zone' : ''}`}
                      aria-pressed={isNoteSelected(note)}
                      aria-disabled={disabled}
                    >
                      {isRoot && showRootNoteLabel && (
                        <span className="root-note-label">{getRootNoteDisplayName(note)}</span>
                      )}
                      {isRootAndOutsideZone && (
                        <span className="root-outside-zone-indicator" aria-hidden="true">↗</span>
                      )}
                      {!isRoot && shouldShowNoteName(note) && (
                        <span className="note-name">{getNoteDisplayName(note)}</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Fret wires */}
          <div className="fret-wires">
            {/* When viewing from fret 0, skip the first fret (nut handles it).
                When viewing from any other fret, show all fret wires including the first. */}
            {(startFret === 0 ? fretRange.slice(1) : fretRange).map((fret) => (
              <div 
                key={`fret-wire-${fret}`} 
                className="fret-wire"
                style={{ gridColumn: fret - startFret + 1 }}
              />
            ))}
          </div>
        </div>

        {/* Right resize handle */}
        {showViewportControls && (
          <div 
            className="viewport-handle viewport-handle-right"
            onMouseDown={handleRightDragStart}
            onTouchStart={handleRightDragStart}
            aria-label="Drag to adjust number of visible frets"
            role="slider"
            aria-valuemin={4}
            aria-valuemax={maxFrets}
            aria-valuenow={visibleFrets}
          >
            <div className="handle-grip" />
          </div>
        )}
      </div>

      {/* Position slider - outside fretboard container */}
      {showViewportControls && maxStartFret > 0 && (
        <div className="viewport-position-slider">
          <Slider.Root
            className="slider-root"
            value={[startFret]}
            min={0}
            max={maxStartFret}
            step={1}
            onValueChange={(value) => onStartFretChange?.(value[0])}
            aria-label="Viewport position"
          >
            <Slider.Track className="slider-track">
              <Slider.Range className="slider-range" />
            </Slider.Track>
            <Slider.Thumb 
              className="slider-thumb" 
              style={{
                width: `${sliderThumbWidth}%`,
                minWidth: '16px',
              }}
            />
          </Slider.Root>
        </div>
      )}

    </div>
  );
}

export default FretboardDisplay;
