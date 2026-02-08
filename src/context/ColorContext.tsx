/**
 * Color Context
 * 
 * React context for managing the active color palette throughout the application.
 * Provides theme switching capabilities and persists selection to localStorage.
 * Integrates with Radix UI theme system for consistent component styling.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { 
  type ColorPalette, 
  COLOR_PALETTES, 
  DEFAULT_PALETTE, 
  getPaletteById, 
  applyPalette 
} from '../config/colors';

const STORAGE_KEY = 'fretboard-color-palette';

/**
 * Radix UI accent color type
 */
export type RadixAccentColor = 
  | 'gray' | 'gold' | 'bronze' | 'brown' 
  | 'yellow' | 'amber' | 'orange' | 'tomato' 
  | 'red' | 'ruby' | 'crimson' | 'pink' 
  | 'plum' | 'purple' | 'violet' | 'iris' 
  | 'indigo' | 'blue' | 'cyan' | 'teal' 
  | 'jade' | 'green' | 'grass' | 'lime' 
  | 'mint' | 'sky';

/**
 * Maps palette IDs to Radix accent colors
 */
const PALETTE_TO_RADIX_ACCENT: Record<string, RadixAccentColor> = {
  'default': 'blue',      // Midnight Blue -> blue
  'high-contrast': 'yellow', // High Contrast -> yellow
  'warm': 'amber',        // Warm Rosewood -> amber (gold tones)
  'cool': 'pink',         // Electric Neon -> pink (magenta-like)
  'ocean': 'teal',        // Deep Ocean -> teal
};

/**
 * Color context value interface
 */
interface ColorContextValue {
  /** Currently active color palette */
  currentPalette: ColorPalette;
  /** All available color palettes */
  availablePalettes: ColorPalette[];
  /** Switch to a different palette by ID */
  setPalette: (paletteId: string) => void;
  /** Reset to the default palette */
  resetToDefault: () => void;
  /** Get the Radix accent color for the current palette */
  radixAccentColor: RadixAccentColor;
}

/**
 * Create the context with undefined default
 */
const ColorContext = createContext<ColorContextValue | undefined>(undefined);

/**
 * Props for the ColorProvider component
 */
interface ColorProviderProps {
  children: ReactNode;
  /** Optional initial palette ID to use instead of localStorage/default */
  initialPaletteId?: string;
}

/**
 * Color Provider Component
 * 
 * Wraps the application to provide color palette context.
 * Automatically persists palette selection to localStorage.
 */
export function ColorProvider({ children, initialPaletteId }: ColorProviderProps): React.ReactElement {
  // Initialize palette from localStorage, props, or default
  const [currentPalette, setCurrentPalette] = useState<ColorPalette>(() => {
    // First check for an initial palette from props
    if (initialPaletteId) {
      const palette = getPaletteById(initialPaletteId);
      if (palette) return palette;
    }
    
    // Then check localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const palette = getPaletteById(stored);
        if (palette) return palette;
      }
    }
    
    // Fall back to default
    return DEFAULT_PALETTE;
  });

  // Apply palette to CSS custom properties when it changes
  useEffect(() => {
    applyPalette(currentPalette);
  }, [currentPalette]);

  // Persist to localStorage when palette changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, currentPalette.id);
    }
  }, [currentPalette]);

  /**
   * Set the active palette by ID
   */
  const setPalette = useCallback((paletteId: string) => {
    const palette = getPaletteById(paletteId);
    if (palette) {
      setCurrentPalette(palette);
    } else {
      console.warn(`Color palette "${paletteId}" not found. Available palettes:`, 
        COLOR_PALETTES.map(p => p.id));
    }
  }, []);

  /**
   * Reset to the default palette
   */
  const resetToDefault = useCallback(() => {
    setCurrentPalette(DEFAULT_PALETTE);
  }, []);

  /**
   * Get the Radix accent color for the current palette
   */
  const radixAccentColor: RadixAccentColor = PALETTE_TO_RADIX_ACCENT[currentPalette.id] || 'blue';

  const value: ColorContextValue = {
    currentPalette,
    availablePalettes: COLOR_PALETTES,
    setPalette,
    resetToDefault,
    radixAccentColor,
  };

  return (
    <ColorContext.Provider value={value}>
      {children}
    </ColorContext.Provider>
  );
}

/**
 * Hook to access the color context
 * 
 * @throws Error if used outside of ColorProvider
 */
export function useColorPalette(): ColorContextValue {
  const context = useContext(ColorContext);
  if (context === undefined) {
    throw new Error('useColorPalette must be used within a ColorProvider');
  }
  return context;
}

/**
 * Export the context for advanced use cases
 */
export { ColorContext };
