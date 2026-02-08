/**
 * ColorPaletteSwitcher Component
 * 
 * UI component for switching between color palettes.
 * Displays available palettes with color preview swatches.
 */

import { useColorPalette } from '../../context/ColorContext';
import './ColorPaletteSwitcher.css';

/**
 * ColorPaletteSwitcher props
 */
interface ColorPaletteSwitcherProps {
  /** Whether to show color swatches preview */
  showSwatches?: boolean;
  /** Additional CSS class name */
  className?: string;
}

/**
 * ColorPaletteSwitcher Component
 */
export function ColorPaletteSwitcher({ 
  showSwatches = true,
  className = ''
}: ColorPaletteSwitcherProps): React.ReactElement {
  const { currentPalette, availablePalettes, setPalette, resetToDefault } = useColorPalette();

  return (
    <div className={`color-palette-switcher ${className}`}>
      <div className="palette-header">
        <label className="palette-label">Color Theme:</label>
        <select
          value={currentPalette.id}
          onChange={(e) => setPalette(e.target.value)}
          className="palette-select"
          aria-label="Select color theme"
        >
          {availablePalettes.map((palette) => (
            <option key={palette.id} value={palette.id}>
              {palette.name}
            </option>
          ))}
        </select>
        <button
          onClick={resetToDefault}
          className="reset-button"
          title="Reset to default theme"
          aria-label="Reset to default theme"
        >
          ↺
        </button>
      </div>
      
      {showSwatches && (
        <div className="palette-preview">
          <div 
            className="swatch" 
            style={{ backgroundColor: currentPalette.colors.fretboardBg }}
            title="Fretboard Background"
          />
          <div 
            className="swatch" 
            style={{ backgroundColor: currentPalette.colors.fretWire }}
            title="Fret Wire"
          />
          <div 
            className="swatch" 
            style={{ backgroundColor: currentPalette.colors.string }}
            title="String"
          />
          <div 
            className="swatch" 
            style={{ backgroundColor: currentPalette.colors.nut }}
            title="Nut"
          />
          <div 
            className="swatch" 
            style={{ backgroundColor: currentPalette.colors.fretMarker }}
            title="Fret Marker"
          />
          <div 
            className="swatch swatch-hover" 
            style={{ backgroundColor: currentPalette.colors.noteHover }}
            title="Note Hover"
          />
          <div 
            className="swatch swatch-active" 
            style={{ backgroundColor: currentPalette.colors.noteActive }}
            title="Note Active"
          />
        </div>
      )}
      
      {currentPalette.description && (
        <p className="palette-description">{currentPalette.description}</p>
      )}
    </div>
  );
}

export default ColorPaletteSwitcher;
