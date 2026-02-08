import { useState } from 'react';
import { DEFAULT_FRET_COUNTS } from '../../hooks/useResponsiveViewport';
import './ViewportControls.css';

/**
 * Props for the ViewportControls component.
 */
export interface ViewportControlsProps {
  /** Current number of visible frets */
  visibleFrets: number;
  /** Callback to update visible frets count */
  onVisibleFretsChange: (count: number) => void;
  /** Current starting fret position */
  startFret: number;
  /** Callback to update starting fret */
  onStartFretChange: (fret: number) => void;
  /** Maximum fret count available */
  maxFrets?: number;
  /** Current device type for responsive defaults */
  deviceType: 'mobile' | 'tablet' | 'desktop';
  /** Callback to reset to default values */
  onReset?: () => void;
  /** Initial collapsed state (default: true) */
  defaultCollapsed?: boolean;
}

/** Preset fret count options */
const FRET_PRESETS = [4, 8, 12, 24] as const;

/**
 * ViewportControls component for managing fretboard viewport.
 * Provides sliders for fret count and start position, plus preset buttons.
 */
export function ViewportControls({
  visibleFrets,
  onVisibleFretsChange,
  startFret,
  onStartFretChange,
  maxFrets = 24,
  deviceType,
  onReset,
  defaultCollapsed = true,
}: ViewportControlsProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  // Calculate max start fret to prevent viewport overflow
  const maxStartFret = Math.max(0, maxFrets - visibleFrets);
  
  // Calculate end fret for display
  const endFret = Math.min(startFret + visibleFrets, maxFrets);

  /**
   * Handles visible frets slider change.
   * Adjusts start fret if needed to keep viewport in bounds.
   */
  const handleVisibleFretsChange = (newCount: number) => {
    onVisibleFretsChange(newCount);
    // Adjust start fret if viewport would overflow
    if (startFret + newCount > maxFrets) {
      onStartFretChange(Math.max(0, maxFrets - newCount));
    }
  };

  /**
   * Handles preset button click.
   */
  const handlePresetClick = (preset: number) => {
    onVisibleFretsChange(preset);
    // Reset start fret to 0 when using presets for cleaner UX
    onStartFretChange(0);
  };

  /**
   * Handles reset to device defaults.
   */
  const handleReset = () => {
    onVisibleFretsChange(DEFAULT_FRET_COUNTS[deviceType]);
    onStartFretChange(0);
    onReset?.();
  };

  return (
    <div className={`viewport-controls ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="viewport-controls-header">
        <button
          className="viewport-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-expanded={!isCollapsed}
          aria-controls="viewport-controls-body"
        >
          <span className="viewport-toggle-icon">{isCollapsed ? '▶' : '▼'}</span>
          <span className="viewport-title">Viewport Settings</span>
        </button>
        <span className="viewport-range">
          Frets {startFret === 0 ? 'Open' : startFret} - {endFret}
        </span>
      </div>

      <div className="viewport-controls-body" id="viewport-controls-body">
        {/* Visible Frets Control */}
        <div className="control-row">
          <label htmlFor="visible-frets" className="control-label">
            Visible Frets:
            <span className="control-value">{visibleFrets}</span>
          </label>
          <input
            id="visible-frets"
            type="range"
            min="1"
            max={maxFrets}
            value={visibleFrets}
            onChange={(e) => handleVisibleFretsChange(Number(e.target.value))}
            className="control-slider"
          />
        </div>

        {/* Start Fret Control (Panning) */}
        <div className="control-row">
          <label htmlFor="start-fret" className="control-label">
            Start Position:
            <span className="control-value">{startFret === 0 ? 'Open' : `Fret ${startFret}`}</span>
          </label>
          <input
            id="start-fret"
            type="range"
            min="0"
            max={maxStartFret}
            value={startFret}
            onChange={(e) => onStartFretChange(Number(e.target.value))}
            className="control-slider"
            disabled={maxStartFret === 0}
          />
        </div>

        {/* Preset Buttons */}
        <div className="preset-buttons">
          <span className="preset-label">Quick Select:</span>
          <div className="preset-button-group">
            {FRET_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className={`preset-button ${visibleFrets === preset && startFret === 0 ? 'active' : ''}`}
                aria-pressed={visibleFrets === preset && startFret === 0}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="reset-button"
          title={`Reset to ${DEFAULT_FRET_COUNTS[deviceType]} frets (${deviceType} default)`}
        >
          Reset to Default ({DEFAULT_FRET_COUNTS[deviceType]} frets)
        </button>
      </div>
    </div>
  );
}

export default ViewportControls;
