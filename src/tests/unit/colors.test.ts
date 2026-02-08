/**
 * Unit tests for Color Configuration System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  COLOR_PALETTES,
  DEFAULT_PALETTE,
  HIGH_CONTRAST_PALETTE,
  WARM_PALETTE,
  COOL_PALETTE,
  OCEAN_PALETTE,
  getPaletteById,
  applyPalette,
  resetToDefaultPalette,
} from '../../config/colors';

describe('Color Configuration System', () => {
  describe('ColorPalette Interface', () => {
    it('should have all required color roles defined', () => {
      const requiredColorRoles = [
        // Fretboard colors
        'fretboardBg',
        'fretWire',
        'string',
        'nut',
        'fretMarker',
        'noteHover',
        'noteActive',
        // Global site colors
        'pageBgStart',
        'pageBgEnd',
        'textPrimary',
        'textSecondary',
        'controlBg',
        'controlBorder',
        'accent',
        'headerGradientStart',
        'headerGradientEnd',
      ];

      COLOR_PALETTES.forEach((palette) => {
        requiredColorRoles.forEach((role) => {
          expect(palette.colors).toHaveProperty(role);
          expect(palette.colors[role as keyof typeof palette.colors]).toBeTruthy();
        });
      });
    });

    it('should have unique IDs for all palettes', () => {
      const ids = COLOR_PALETTES.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have human-readable names for all palettes', () => {
      COLOR_PALETTES.forEach((palette) => {
        expect(palette.name).toBeTruthy();
        expect(typeof palette.name).toBe('string');
        expect(palette.name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Predefined Palettes', () => {
    it('should have exactly 5 predefined palettes', () => {
      expect(COLOR_PALETTES.length).toBe(5);
    });

    it('should include DEFAULT_PALETTE in COLOR_PALETTES', () => {
      expect(COLOR_PALETTES).toContain(DEFAULT_PALETTE);
    });

    it('should include HIGH_CONTRAST_PALETTE for accessibility', () => {
      expect(COLOR_PALETTES).toContain(HIGH_CONTRAST_PALETTE);
      expect(HIGH_CONTRAST_PALETTE.id).toBe('high-contrast');
    });

    it('should include WARM_PALETTE', () => {
      expect(COLOR_PALETTES).toContain(WARM_PALETTE);
      expect(WARM_PALETTE.id).toBe('warm');
    });

    it('should include COOL_PALETTE', () => {
      expect(COLOR_PALETTES).toContain(COOL_PALETTE);
      expect(COOL_PALETTE.id).toBe('cool');
    });

    it('should include OCEAN_PALETTE', () => {
      expect(COLOR_PALETTES).toContain(OCEAN_PALETTE);
      expect(OCEAN_PALETTE.id).toBe('ocean');
    });
  });

  describe('getPaletteById', () => {
    it('should return correct palette for valid ID', () => {
      expect(getPaletteById('default')).toBe(DEFAULT_PALETTE);
      expect(getPaletteById('high-contrast')).toBe(HIGH_CONTRAST_PALETTE);
      expect(getPaletteById('warm')).toBe(WARM_PALETTE);
      expect(getPaletteById('cool')).toBe(COOL_PALETTE);
      expect(getPaletteById('ocean')).toBe(OCEAN_PALETTE);
    });

    it('should return undefined for invalid ID', () => {
      expect(getPaletteById('nonexistent')).toBeUndefined();
      expect(getPaletteById('')).toBeUndefined();
    });
  });

  describe('applyPalette', () => {
    let originalSetProperty: typeof document.documentElement.style.setProperty;

    beforeEach(() => {
      // Mock document.documentElement.style.setProperty
      originalSetProperty = document.documentElement.style.setProperty;
      document.documentElement.style.setProperty = vi.fn();
    });

    afterEach(() => {
      document.documentElement.style.setProperty = originalSetProperty;
    });

    it('should set all CSS custom properties', () => {
      applyPalette(DEFAULT_PALETTE);

      const setProperty = document.documentElement.style.setProperty as ReturnType<typeof vi.fn>;
      
      // Fretboard colors
      expect(setProperty).toHaveBeenCalledWith('--fretboard-bg', DEFAULT_PALETTE.colors.fretboardBg);
      expect(setProperty).toHaveBeenCalledWith('--fret-wire-color', DEFAULT_PALETTE.colors.fretWire);
      expect(setProperty).toHaveBeenCalledWith('--string-color', DEFAULT_PALETTE.colors.string);
      expect(setProperty).toHaveBeenCalledWith('--nut-color', DEFAULT_PALETTE.colors.nut);
      expect(setProperty).toHaveBeenCalledWith('--fret-marker-color', DEFAULT_PALETTE.colors.fretMarker);
      expect(setProperty).toHaveBeenCalledWith('--note-hover-bg', DEFAULT_PALETTE.colors.noteHover);
      expect(setProperty).toHaveBeenCalledWith('--note-active-bg', DEFAULT_PALETTE.colors.noteActive);
      
      // Global site colors
      expect(setProperty).toHaveBeenCalledWith('--page-bg-start', DEFAULT_PALETTE.colors.pageBgStart);
      expect(setProperty).toHaveBeenCalledWith('--page-bg-end', DEFAULT_PALETTE.colors.pageBgEnd);
      expect(setProperty).toHaveBeenCalledWith('--text-primary', DEFAULT_PALETTE.colors.textPrimary);
      expect(setProperty).toHaveBeenCalledWith('--text-secondary', DEFAULT_PALETTE.colors.textSecondary);
      expect(setProperty).toHaveBeenCalledWith('--control-bg', DEFAULT_PALETTE.colors.controlBg);
      expect(setProperty).toHaveBeenCalledWith('--control-border', DEFAULT_PALETTE.colors.controlBorder);
      expect(setProperty).toHaveBeenCalledWith('--accent', DEFAULT_PALETTE.colors.accent);
      expect(setProperty).toHaveBeenCalledWith('--header-gradient-start', DEFAULT_PALETTE.colors.headerGradientStart);
      expect(setProperty).toHaveBeenCalledWith('--header-gradient-end', DEFAULT_PALETTE.colors.headerGradientEnd);
    });

    it('should set exactly 16 CSS properties (7 fretboard + 9 global)', () => {
      applyPalette(DEFAULT_PALETTE);

      const setProperty = document.documentElement.style.setProperty as ReturnType<typeof vi.fn>;
      expect(setProperty).toHaveBeenCalledTimes(16);
    });
  });

  describe('resetToDefaultPalette', () => {
    let originalSetProperty: typeof document.documentElement.style.setProperty;

    beforeEach(() => {
      originalSetProperty = document.documentElement.style.setProperty;
      document.documentElement.style.setProperty = vi.fn();
    });

    afterEach(() => {
      document.documentElement.style.setProperty = originalSetProperty;
    });

    it('should apply default palette colors', () => {
      resetToDefaultPalette();

      const setProperty = document.documentElement.style.setProperty as ReturnType<typeof vi.fn>;
      expect(setProperty).toHaveBeenCalledWith('--fretboard-bg', DEFAULT_PALETTE.colors.fretboardBg);
    });
  });

  describe('Color Format Validation', () => {
    it('should have valid hex colors for solid colors', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
      
      COLOR_PALETTES.forEach((palette) => {
        expect(palette.colors.fretboardBg).toMatch(hexColorRegex);
        expect(palette.colors.fretWire).toMatch(hexColorRegex);
        expect(palette.colors.string).toMatch(hexColorRegex);
        expect(palette.colors.nut).toMatch(hexColorRegex);
        expect(palette.colors.fretMarker).toMatch(hexColorRegex);
      });
    });

    it('should have valid rgba colors for hover/active states', () => {
      const rgbaColorRegex = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/;
      
      COLOR_PALETTES.forEach((palette) => {
        expect(palette.colors.noteHover).toMatch(rgbaColorRegex);
        expect(palette.colors.noteActive).toMatch(rgbaColorRegex);
      });
    });
  });

  describe('High Contrast Palette Accessibility', () => {
    it('should use black background for maximum contrast', () => {
      expect(HIGH_CONTRAST_PALETTE.colors.fretboardBg).toBe('#000000');
    });

    it('should use white for primary elements', () => {
      expect(HIGH_CONTRAST_PALETTE.colors.fretWire).toBe('#ffffff');
      expect(HIGH_CONTRAST_PALETTE.colors.string).toBe('#ffffff');
    });

    it('should use bright colors for markers', () => {
      // Yellow and cyan are high-visibility colors
      expect(HIGH_CONTRAST_PALETTE.colors.nut).toBe('#ffff00');
      expect(HIGH_CONTRAST_PALETTE.colors.fretMarker).toBe('#00ffff');
    });
  });
});
