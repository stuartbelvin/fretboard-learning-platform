import React from 'react';
import type { PitchClass } from '../../core/music-theory/Note';
import './NoteProgressDisplay.css';

/**
 * Status of a note in the progress display
 */
export type NoteStatus = 'locked' | 'no-data' | 'learning' | 'practiced' | 'mastered';

/**
 * Performance data for a single note
 */
export interface NotePerformance {
  /** Total number of attempts for this note */
  attempts: number;
  /** Number of correct answers */
  correct: number;
  /** Current accuracy percentage (0-100) */
  accuracy: number;
}

/**
 * Props for the NoteProgressDisplay component
 */
export interface NoteProgressDisplayProps {
  /** Performance data keyed by pitch class */
  notePerformance: Map<PitchClass, NotePerformance>;
  /** Set of notes that are currently unlocked/available */
  unlockedNotes: Set<PitchClass>;
  /** Currently focused note (optional) */
  focusedNote?: PitchClass;
  /** Whether to show flats instead of sharps */
  useFlats?: boolean;
  /** Minimum attempts needed to consider a note "learned" (for color progression) */
  minAttemptsForLearned?: number;
  /** Optional: ordered list of notes to display (defaults to chromatic C-B) */
  orderedNotes?: PitchClass[];
  /** Optional: label for the string (e.g., "Low E", "A") */
  stringLabel?: string;
}

/**
 * All 12 pitch classes in chromatic order (sharps)
 */
const ALL_PITCH_CLASSES: PitchClass[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

/**
 * Flat equivalents for display
 */
const FLAT_NAMES: Record<PitchClass, string> = {
  'C': 'C', 'C#': 'Db', 'D': 'D', 'D#': 'Eb', 'E': 'E', 'F': 'F',
  'F#': 'Gb', 'G': 'G', 'G#': 'Ab', 'A': 'A', 'A#': 'Bb', 'B': 'B'
};

/**
 * Get the status of a note based on its performance and unlock state
 */
function getNoteStatus(
  _pitchClass: PitchClass,
  performance: NotePerformance | undefined,
  isUnlocked: boolean
): NoteStatus {
  if (!isUnlocked) {
    return 'locked';
  }
  
  if (!performance || performance.attempts === 0) {
    return 'no-data';
  }
  
  // Determine status based on accuracy
  // mastered: >= 80% accuracy with at least 5 attempts
  // practiced: >= 50% accuracy
  // learning: < 50% accuracy
  if (performance.accuracy >= 80 && performance.attempts >= 5) {
    return 'mastered';
  } else if (performance.accuracy >= 50) {
    return 'practiced';
  } else {
    return 'learning';
  }
}

/**
 * Get the background color for a note based on its accuracy and attempt progress
 * Returns an HSL color that transitions from red (0) through yellow (50) to teal/cyan (100)
 * Color intensity is blended with grey based on how many attempts vs minAttemptsForLearned
 */
function getAccuracyColor(accuracy: number, attempts: number, minAttemptsForLearned: number): string {
  // Clamp accuracy to 0-100
  const clampedAccuracy = Math.max(0, Math.min(100, accuracy));
  
  // Calculate progress towards "learned" (0 to 1)
  const progressRatio = Math.min(1, attempts / minAttemptsForLearned);
  
  // Map accuracy to hue: 0 = red (0°), 50 = yellow (60°), 100 = teal (160°)
  const hue = (clampedAccuracy / 100) * 160;
  
  // Saturation starts low (grey) and increases with progress
  // Start at 15% saturation (almost grey), increase to 60% when fully learned
  const saturation = 15 + (progressRatio * 45);
  
  // Lightness also adjusts slightly - starts more muted
  const lightness = 30 + (progressRatio * 10);
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * NoteProgressDisplay Component
 * 
 * Displays a horizontal row of boxes representing notes on a string.
 * Each box shows the note name and indicates the user's progress:
 * - Locked (crossed out): Note not yet available
 * - No data (grey): Unlocked but no attempts yet
 * - Learning (red-ish): Low accuracy (< 50%)
 * - Practiced (yellow-ish): Medium accuracy (50-79%)
 * - Mastered (green): High accuracy (>= 80% with 5+ attempts)
 */
export function NoteProgressDisplay({
  notePerformance,
  unlockedNotes,
  focusedNote,
  useFlats = false,
  minAttemptsForLearned = 5,
  orderedNotes,
  stringLabel,
}: NoteProgressDisplayProps) {
  // Use provided order or default to chromatic order
  const notesToDisplay = orderedNotes ?? ALL_PITCH_CLASSES;
  
  return (
    <div className="note-progress-display">
      {stringLabel && (
        <div className="note-progress-label">{stringLabel}</div>
      )}
      <div className="note-progress-boxes">
        {notesToDisplay.map((pitchClass, index) => {
          const performance = notePerformance.get(pitchClass);
          const isUnlocked = unlockedNotes.has(pitchClass);
          const status = getNoteStatus(pitchClass, performance, isUnlocked);
          const isFocused = focusedNote === pitchClass;
          
          // Determine display name
          const displayName = useFlats ? FLAT_NAMES[pitchClass] : pitchClass;
          
          // Build class names
          const classNames = [
            'note-box',
            `note-box--${status}`,
            isFocused && 'note-box--focused',
          ].filter(Boolean).join(' ');
          
          // Build inline style for accuracy-based coloring (with gradual progression)
          const style: React.CSSProperties = {};
          if (status !== 'locked' && status !== 'no-data' && performance) {
            style.backgroundColor = getAccuracyColor(
              performance.accuracy, 
              performance.attempts, 
              minAttemptsForLearned
            );
          }
          
          return (
            <div
              key={orderedNotes ? `${index}-${pitchClass}` : pitchClass}
              className={classNames}
              style={style}
              title={getTooltip(pitchClass, performance, isUnlocked)}
              data-pitch-class={pitchClass}
              data-fret={orderedNotes ? index : undefined}
            >
              <span className="note-box__name">{displayName}</span>
              {status === 'locked' && (
                <svg className="note-box__strikethrough" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line x1="0" y1="100" x2="100" y2="0" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Generate tooltip text for a note box
 */
function getTooltip(
  pitchClass: PitchClass,
  performance: NotePerformance | undefined,
  isUnlocked: boolean
): string {
  if (!isUnlocked) {
    return `${pitchClass}: Locked - Keep practicing to unlock!`;
  }
  
  if (!performance || performance.attempts === 0) {
    return `${pitchClass}: No attempts yet`;
  }
  
  return `${pitchClass}: ${performance.correct}/${performance.attempts} (${performance.accuracy.toFixed(0)}% accuracy)`;
}

export default NoteProgressDisplay;
