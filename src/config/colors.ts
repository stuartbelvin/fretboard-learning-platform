/**
 * Color Configuration System
 * 
 * Defines color palettes with 7 color roles for the fretboard application.
 * Each palette provides a consistent set of colors for all UI elements.
 */

/**
 * The 7 color roles used throughout the application.
 * Each role serves a specific purpose in the UI.
 */
export interface ColorPalette {
  /** Unique identifier for the palette */
  id: string;
  /** Human-readable name for display */
  name: string;
  /** Optional description of the palette */
  description?: string;
  
  /** Color roles */
  colors: {
    /** Background color for the fretboard wood */
    fretboardBg: string;
    /** Color for fret wire/separators */
    fretWire: string;
    /** Color for guitar strings */
    string: string;
    /** Color for the nut (0th fret) */
    nut: string;
    /** Color for fret position markers (dots) */
    fretMarker: string;
    /** Background color when hovering over a note */
    noteHover: string;
    /** Background color when a note is active/pressed */
    noteActive: string;
    
    /** Global site theme colors */
    /** Page background gradient start color */
    pageBgStart: string;
    /** Page background gradient end color */
    pageBgEnd: string;
    /** Primary text color */
    textPrimary: string;
    /** Secondary/muted text color */
    textSecondary: string;
    /** Controls panel background */
    controlBg: string;
    /** Controls panel border color */
    controlBorder: string;
    /** Accent color for buttons and highlights */
    accent: string;
    /** Header gradient start color */
    headerGradientStart: string;
    /** Header gradient end color */
    headerGradientEnd: string;
  };
}

/**
 * Default color palette - Modern dark theme with blue accents
 * Based on Catppuccin Mocha color scheme
 */
export const DEFAULT_PALETTE: ColorPalette = {
  id: 'default',
  name: 'Midnight Blue',
  description: 'Modern dark theme with blue accents',
  colors: {
    fretboardBg: '#1e1e2e',
    fretWire: '#6c7086',
    string: '#cdd6f4',
    nut: '#a6adc8',
    fretMarker: '#89b4fa',
    noteHover: 'rgba(137, 180, 250, 0.25)',
    noteActive: 'rgba(137, 180, 250, 0.4)',
    // Global site colors
    pageBgStart: '#1a1a2e',
    pageBgEnd: '#16213e',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    controlBg: 'rgba(255, 255, 255, 0.05)',
    controlBorder: 'rgba(255, 255, 255, 0.1)',
    accent: '#89b4fa',
    headerGradientStart: '#89b4fa',
    headerGradientEnd: '#b4befe',
  },
};

/**
 * High contrast palette for accessibility
 */
export const HIGH_CONTRAST_PALETTE: ColorPalette = {
  id: 'high-contrast',
  name: 'High Contrast',
  description: 'Maximum contrast for accessibility',
  colors: {
    fretboardBg: '#000000',
    fretWire: '#ffffff',
    string: '#ffffff',
    nut: '#ffff00',
    fretMarker: '#00ffff',
    noteHover: 'rgba(255, 255, 0, 0.4)',
    noteActive: 'rgba(0, 255, 255, 0.5)',
    // Global site colors
    pageBgStart: '#000000',
    pageBgEnd: '#0a0a0a',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.9)',
    controlBg: 'rgba(255, 255, 255, 0.1)',
    controlBorder: '#ffffff',
    accent: '#ffff00',
    headerGradientStart: '#00ffff',
    headerGradientEnd: '#ffff00',
  },
};

/**
 * Warm wood palette - Classic acoustic guitar feel
 */
export const WARM_PALETTE: ColorPalette = {
  id: 'warm',
  name: 'Warm Rosewood',
  description: 'Classic acoustic guitar warm tones',
  colors: {
    fretboardBg: '#3d2914',
    fretWire: '#b8860b',
    string: '#d4a574',
    nut: '#f5deb3',
    fretMarker: '#ffd700',
    noteHover: 'rgba(255, 215, 0, 0.3)',
    noteActive: 'rgba(255, 215, 0, 0.5)',
    // Global site colors
    pageBgStart: '#2d1a0d',
    pageBgEnd: '#1a0f08',
    textPrimary: '#f5deb3',
    textSecondary: 'rgba(245, 222, 179, 0.7)',
    controlBg: 'rgba(245, 222, 179, 0.08)',
    controlBorder: 'rgba(245, 222, 179, 0.2)',
    accent: '#ffd700',
    headerGradientStart: '#ffd700',
    headerGradientEnd: '#d4a574',
  },
};

/**
 * Cool modern palette - Electric guitar inspired
 */
export const COOL_PALETTE: ColorPalette = {
  id: 'cool',
  name: 'Electric Neon',
  description: 'Modern electric guitar with neon accents',
  colors: {
    fretboardBg: '#0f0f1a',
    fretWire: '#4a5568',
    string: '#a0aec0',
    nut: '#e2e8f0',
    fretMarker: '#ff00ff',
    noteHover: 'rgba(255, 0, 255, 0.3)',
    noteActive: 'rgba(255, 0, 255, 0.5)',
    // Global site colors
    pageBgStart: '#0a0a12',
    pageBgEnd: '#12121f',
    textPrimary: '#e2e8f0',
    textSecondary: 'rgba(226, 232, 240, 0.7)',
    controlBg: 'rgba(255, 0, 255, 0.08)',
    controlBorder: 'rgba(255, 0, 255, 0.3)',
    accent: '#ff00ff',
    headerGradientStart: '#ff00ff',
    headerGradientEnd: '#00ffff',
  },
};

/**
 * Ocean palette - Calming blue-green tones
 */
export const OCEAN_PALETTE: ColorPalette = {
  id: 'ocean',
  name: 'Deep Ocean',
  description: 'Calming ocean-inspired blue-green tones',
  colors: {
    fretboardBg: '#0d2137',
    fretWire: '#4a7c8c',
    string: '#88c0d0',
    nut: '#e5e9f0',
    fretMarker: '#5eead4',
    noteHover: 'rgba(94, 234, 212, 0.3)',
    noteActive: 'rgba(94, 234, 212, 0.5)',
    // Global site colors
    pageBgStart: '#0a1929',
    pageBgEnd: '#061220',
    textPrimary: '#e5e9f0',
    textSecondary: 'rgba(229, 233, 240, 0.7)',
    controlBg: 'rgba(94, 234, 212, 0.08)',
    controlBorder: 'rgba(94, 234, 212, 0.2)',
    accent: '#5eead4',
    headerGradientStart: '#5eead4',
    headerGradientEnd: '#88c0d0',
  },
};

/**
 * All available palettes
 */
export const COLOR_PALETTES: ColorPalette[] = [
  DEFAULT_PALETTE,
  HIGH_CONTRAST_PALETTE,
  WARM_PALETTE,
  COOL_PALETTE,
  OCEAN_PALETTE,
];

/**
 * Get a palette by its ID
 */
export function getPaletteById(id: string): ColorPalette | undefined {
  return COLOR_PALETTES.find(palette => palette.id === id);
}

/**
 * Apply a color palette to the document by setting CSS custom properties
 */
export function applyPalette(palette: ColorPalette): void {
  const root = document.documentElement;
  
  // Fretboard colors
  root.style.setProperty('--fretboard-bg', palette.colors.fretboardBg);
  root.style.setProperty('--fret-wire-color', palette.colors.fretWire);
  root.style.setProperty('--string-color', palette.colors.string);
  root.style.setProperty('--nut-color', palette.colors.nut);
  root.style.setProperty('--fret-marker-color', palette.colors.fretMarker);
  root.style.setProperty('--note-hover-bg', palette.colors.noteHover);
  root.style.setProperty('--note-active-bg', palette.colors.noteActive);
  
  // Global site colors
  root.style.setProperty('--page-bg-start', palette.colors.pageBgStart);
  root.style.setProperty('--page-bg-end', palette.colors.pageBgEnd);
  root.style.setProperty('--text-primary', palette.colors.textPrimary);
  root.style.setProperty('--text-secondary', palette.colors.textSecondary);
  root.style.setProperty('--control-bg', palette.colors.controlBg);
  root.style.setProperty('--control-border', palette.colors.controlBorder);
  root.style.setProperty('--accent', palette.colors.accent);
  root.style.setProperty('--header-gradient-start', palette.colors.headerGradientStart);
  root.style.setProperty('--header-gradient-end', palette.colors.headerGradientEnd);
}

/**
 * Reset colors to default palette
 */
export function resetToDefaultPalette(): void {
  applyPalette(DEFAULT_PALETTE);
}
