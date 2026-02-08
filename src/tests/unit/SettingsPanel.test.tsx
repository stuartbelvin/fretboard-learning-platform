/**
 * SettingsPanel Unit Tests (APP-004)
 * 
 * Tests for the Settings UI component including:
 * - Color/appearance settings
 * - Note selection (sharps/flats/both)
 * - Interval selection checkboxes
 * - Settings persistence via store
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsPanel } from '../../components/settings/SettingsPanel';
import type { SettingsSection } from '../../components/settings/SettingsPanel';
import { ColorProvider } from '../../context/ColorContext';
import { useAppStore, DEFAULT_USER_SETTINGS, DEFAULT_QUIZ_SETTINGS } from '../../store/appStore';
import { SIMPLE_INTERVALS, COMPOUND_INTERVALS } from '../../core/music-theory/Interval';

// Wrapper to provide color context
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <ColorProvider>{children}</ColorProvider>;
}

// Helper to render with context
function renderWithProviders(ui: React.ReactElement) {
  return render(ui, { wrapper: TestWrapper });
}

describe('SettingsPanel', () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    useAppStore.getState().resetToDefaults();
  });

  afterEach(() => {
    cleanup();
  });

  // ============================================================
  // Rendering Tests
  // ============================================================

  describe('rendering', () => {
    it('should render when isOpen is true', () => {
      renderWithProviders(<SettingsPanel isOpen={true} />);
      expect(screen.getByText('⚙️ Settings')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      renderWithProviders(<SettingsPanel isOpen={false} />);
      expect(screen.queryByText('⚙️ Settings')).not.toBeInTheDocument();
    });

    it('should default isOpen to true', () => {
      renderWithProviders(<SettingsPanel />);
      expect(screen.getByText('⚙️ Settings')).toBeInTheDocument();
    });

    it('should show close button when onClose is provided', () => {
      const onClose = vi.fn();
      renderWithProviders(<SettingsPanel onClose={onClose} />);
      expect(screen.getByLabelText('Close settings')).toBeInTheDocument();
    });

    it('should call onClose when close button clicked', () => {
      const onClose = vi.fn();
      renderWithProviders(<SettingsPanel onClose={onClose} />);
      fireEvent.click(screen.getByLabelText('Close settings'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should apply custom className', () => {
      const { container } = renderWithProviders(
        <SettingsPanel className="custom-class" />
      );
      expect(container.querySelector('.settings-panel.custom-class')).toBeInTheDocument();
    });

    it('should apply compact mode class', () => {
      const { container } = renderWithProviders(
        <SettingsPanel compact={true} />
      );
      expect(container.querySelector('.settings-panel--compact')).toBeInTheDocument();
    });
  });

  // ============================================================
  // Section Visibility Tests
  // ============================================================

  describe('section visibility', () => {
    it('should show all sections by default', () => {
      renderWithProviders(<SettingsPanel />);
      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getByText('Fretboard Display')).toBeInTheDocument();
      expect(screen.getByText('Quiz Settings')).toBeInTheDocument();
      expect(screen.getByText(/Interval Selection/)).toBeInTheDocument();
      expect(screen.getByText('Viewport')).toBeInTheDocument();
      expect(screen.getByText('Instrument')).toBeInTheDocument();
    });

    it('should show only specified sections', () => {
      renderWithProviders(
        <SettingsPanel sections={['appearance', 'quiz'] as SettingsSection[]} />
      );
      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getByText('Quiz Settings')).toBeInTheDocument();
      expect(screen.queryByText('Fretboard Display')).not.toBeInTheDocument();
      expect(screen.queryByText(/Interval Selection/)).not.toBeInTheDocument();
    });

    it('should show all sections when sections includes "all"', () => {
      renderWithProviders(<SettingsPanel sections={['all']} />);
      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getByText('Fretboard Display')).toBeInTheDocument();
    });
  });

  // ============================================================
  // Accordion Behavior Tests
  // ============================================================

  describe('accordion behavior', () => {
    it('should expand section when header clicked', () => {
      renderWithProviders(<SettingsPanel />);
      
      // Find and click the Display section header
      const displayHeader = screen.getByRole('button', { name: /Fretboard Display/i });
      fireEvent.click(displayHeader);
      
      // Should be expanded and show content
      expect(displayHeader).toHaveAttribute('aria-expanded', 'true');
    });

    it('should collapse section when clicked again', () => {
      renderWithProviders(<SettingsPanel />);
      
      // Appearance section is expanded by default
      // Use getAllByRole and find the section header specifically
      const allButtons = screen.getAllByRole('button');
      const appearanceHeader = allButtons.find(btn => 
        btn.classList.contains('settings-section__header') && 
        btn.textContent?.includes('Appearance')
      );
      expect(appearanceHeader).toBeDefined();
      expect(appearanceHeader).toHaveAttribute('aria-expanded', 'true');
      
      // Click to collapse
      fireEvent.click(appearanceHeader!);
      expect(appearanceHeader).toHaveAttribute('aria-expanded', 'false');
    });
  });

  // ============================================================
  // Appearance Section Tests
  // ============================================================

  describe('appearance section', () => {
    it('should have color theme selector', () => {
      renderWithProviders(<SettingsPanel sections={['appearance']} />);
      expect(screen.getByLabelText('Select color theme')).toBeInTheDocument();
    });

    it('should have color swatches preview', () => {
      renderWithProviders(<SettingsPanel sections={['appearance']} />);
      expect(screen.getByTitle('Fretboard Background')).toBeInTheDocument();
      expect(screen.getByTitle('Fret Wire')).toBeInTheDocument();
      expect(screen.getByTitle('String')).toBeInTheDocument();
    });

    it('should have animation speed slider', () => {
      renderWithProviders(<SettingsPanel sections={['appearance']} />);
      expect(screen.getByLabelText('Animation speed')).toBeInTheDocument();
    });

    it('should have sound toggle', () => {
      renderWithProviders(<SettingsPanel sections={['appearance']} />);
      expect(screen.getByText('Sound Effects')).toBeInTheDocument();
    });

    it('should update animation speed when slider changed', () => {
      renderWithProviders(<SettingsPanel sections={['appearance']} />);
      const slider = screen.getByLabelText('Animation speed');
      
      fireEvent.change(slider, { target: { value: '1.5' } });
      
      const { userSettings } = useAppStore.getState();
      expect(userSettings.animationSpeed).toBe(1.5);
    });

    it('should toggle sound enabled', () => {
      renderWithProviders(<SettingsPanel sections={['appearance']} />);
      const checkbox = screen.getByText('Sound Effects').previousElementSibling?.previousElementSibling as HTMLInputElement;
      
      expect(checkbox).toBeChecked(); // Default is true
      fireEvent.click(checkbox);
      
      const { userSettings } = useAppStore.getState();
      expect(userSettings.soundEnabled).toBe(false);
    });
  });

  // ============================================================
  // Display Section Tests (Note Selection)
  // ============================================================

  describe('display section - note selection', () => {
    beforeEach(() => {
      renderWithProviders(<SettingsPanel sections={['display']} />);
      // Expand the display section
      fireEvent.click(screen.getByRole('button', { name: /Fretboard Display/i }));
    });

    it('should have note display radio buttons', () => {
      expect(screen.getByText('Sharps (C#, D#...)')).toBeInTheDocument();
      expect(screen.getByText('Flats (Db, Eb...)')).toBeInTheDocument();
      expect(screen.getByText('Both')).toBeInTheDocument();
    });

    it('should update note display preference to sharps', () => {
      const sharpsRadio = screen.getByLabelText(/Sharps/);
      fireEvent.click(sharpsRadio);
      
      const { userSettings } = useAppStore.getState();
      expect(userSettings.noteDisplay).toBe('sharps');
    });

    it('should update note display preference to flats', () => {
      const flatsRadio = screen.getByLabelText(/Flats/);
      fireEvent.click(flatsRadio);
      
      const { userSettings } = useAppStore.getState();
      expect(userSettings.noteDisplay).toBe('flats');
    });

    it('should update note display preference to both', () => {
      const bothRadio = screen.getByLabelText('Both');
      fireEvent.click(bothRadio);
      
      const { userSettings } = useAppStore.getState();
      expect(userSettings.noteDisplay).toBe('both');
    });

    it('should have show note names checkbox', () => {
      expect(screen.getByText('Show Note Names')).toBeInTheDocument();
    });

    it('should toggle show note names', () => {
      const checkbox = screen.getByText('Show Note Names').previousElementSibling?.previousElementSibling as HTMLInputElement;
      
      expect(checkbox).not.toBeChecked(); // Default is false
      fireEvent.click(checkbox);
      
      const { userSettings } = useAppStore.getState();
      expect(userSettings.showNoteNames).toBe(true);
    });

    it('should have marker style selector', () => {
      expect(screen.getByLabelText('Fret marker style')).toBeInTheDocument();
    });

    it('should update marker style', () => {
      const select = screen.getByLabelText('Fret marker style');
      fireEvent.change(select, { target: { value: 'trapezoid' } });
      
      const { userSettings } = useAppStore.getState();
      expect(userSettings.markerStyle).toBe('trapezoid');
    });
  });

  // ============================================================
  // Quiz Settings Section Tests
  // ============================================================

  describe('quiz settings section', () => {
    beforeEach(() => {
      renderWithProviders(<SettingsPanel sections={['quiz']} />);
      // Expand the quiz section
      fireEvent.click(screen.getByRole('button', { name: /Quiz Settings/i }));
    });

    it('should have questions per quiz slider', () => {
      expect(screen.getByLabelText('Questions per quiz')).toBeInTheDocument();
    });

    it('should update total questions', () => {
      const slider = screen.getByLabelText('Questions per quiz');
      fireEvent.change(slider, { target: { value: '20' } });
      
      const { currentQuiz } = useAppStore.getState();
      expect(currentQuiz.settings.totalQuestions).toBe(20);
    });

    it('should have attempts before hint slider', () => {
      expect(screen.getByLabelText('Attempts before hint')).toBeInTheDocument();
    });

    it('should update max attempts', () => {
      const slider = screen.getByLabelText('Attempts before hint');
      fireEvent.change(slider, { target: { value: '5' } });
      
      const { currentQuiz } = useAppStore.getState();
      expect(currentQuiz.settings.maxAttempts).toBe(5);
    });

    it('should have quiz note selection radio buttons', () => {
      expect(screen.getByText('Sharps Only')).toBeInTheDocument();
      expect(screen.getByText('Flats Only')).toBeInTheDocument();
      // Note: 'Both' appears twice - once in display, once in quiz
    });

    it('should have auto-advance checkbox', () => {
      expect(screen.getByText('Auto-advance to next question')).toBeInTheDocument();
    });

    it('should toggle auto-advance', () => {
      const checkbox = screen.getByText('Auto-advance to next question').previousElementSibling?.previousElementSibling as HTMLInputElement;
      
      expect(checkbox).toBeChecked(); // Default is true
      fireEvent.click(checkbox);
      
      const { currentQuiz } = useAppStore.getState();
      expect(currentQuiz.settings.autoAdvance).toBe(false);
    });

    it('should show auto-advance delay when enabled', () => {
      expect(screen.getByLabelText('Auto-advance delay')).toBeInTheDocument();
    });

    it('should have compound intervals checkbox', () => {
      expect(screen.getByText('Include Compound Intervals (9th, 10th...)')).toBeInTheDocument();
    });

    it('should toggle compound intervals', () => {
      const checkbox = screen.getByText('Include Compound Intervals (9th, 10th...)').previousElementSibling?.previousElementSibling as HTMLInputElement;
      
      expect(checkbox).not.toBeChecked(); // Default is false
      fireEvent.click(checkbox);
      
      const { currentQuiz } = useAppStore.getState();
      expect(currentQuiz.settings.allowCompoundIntervals).toBe(true);
    });
  });

  // ============================================================
  // Interval Selection Tests
  // ============================================================

  describe('interval selection', () => {
    beforeEach(() => {
      renderWithProviders(<SettingsPanel sections={['intervals']} />);
      // Intervals section is expanded by default
    });

    it('should show selected interval count in badge', () => {
      expect(screen.getByText(/selected/)).toBeInTheDocument();
    });

    it('should have quick preset buttons', () => {
      expect(screen.getByText('Basic (6)')).toBeInTheDocument();
      expect(screen.getByText('Common (13)')).toBeInTheDocument();
      expect(screen.getByText(`All Simple (${SIMPLE_INTERVALS.length})`)).toBeInTheDocument();
    });

    it('should have interval group headers', () => {
      expect(screen.getByText('Unison & Octave')).toBeInTheDocument();
      expect(screen.getByText('Seconds')).toBeInTheDocument();
      expect(screen.getByText('Thirds')).toBeInTheDocument();
      expect(screen.getByText('Fourths')).toBeInTheDocument();
      expect(screen.getByText('Fifths')).toBeInTheDocument();
      expect(screen.getByText('Sixths')).toBeInTheDocument();
      expect(screen.getByText('Sevenths')).toBeInTheDocument();
    });

    it('should apply basic preset when clicked', () => {
      fireEvent.click(screen.getByText('Basic (6)'));
      
      const { currentQuiz } = useAppStore.getState();
      expect(currentQuiz.settings.selectedIntervals).toEqual(['P1', 'm3', 'M3', 'P4', 'P5', 'P8']);
    });

    it('should apply common preset when clicked', () => {
      fireEvent.click(screen.getByText('Common (13)'));
      
      const { currentQuiz } = useAppStore.getState();
      expect(currentQuiz.settings.selectedIntervals).toHaveLength(13);
      expect(currentQuiz.settings.selectedIntervals).toContain('m2');
      expect(currentQuiz.settings.selectedIntervals).toContain('M7');
    });

    it('should toggle individual interval', () => {
      // First clear intervals
      useAppStore.getState().updateQuizSettings({ selectedIntervals: [] });
      
      // Re-render with empty selection
      cleanup();
      renderWithProviders(<SettingsPanel sections={['intervals']} />);
      
      // Find and click P5 checkbox
      const p5Checkbox = screen.getByTitle('perfect fifth');
      fireEvent.click(p5Checkbox);
      
      const { currentQuiz } = useAppStore.getState();
      expect(currentQuiz.settings.selectedIntervals).toContain('P5');
    });

    it('should show compound intervals when enabled', () => {
      // Enable compound intervals in quiz settings
      useAppStore.getState().updateQuizSettings({ allowCompoundIntervals: true });
      
      // Re-render
      cleanup();
      renderWithProviders(<SettingsPanel sections={['intervals']} />);
      
      expect(screen.getByText('Compound Intervals')).toBeInTheDocument();
      expect(screen.getByText('Ninths')).toBeInTheDocument();
    });

    it('should not show compound intervals when disabled', () => {
      // Compound intervals disabled by default
      expect(screen.queryByText('Compound Intervals')).not.toBeInTheDocument();
      expect(screen.queryByText('Ninths')).not.toBeInTheDocument();
    });

    it('should show all intervals preset when compound enabled', () => {
      useAppStore.getState().updateQuizSettings({ allowCompoundIntervals: true });
      
      cleanup();
      renderWithProviders(<SettingsPanel sections={['intervals']} />);
      
      expect(screen.getByText(`All (${SIMPLE_INTERVALS.length + COMPOUND_INTERVALS.length})`)).toBeInTheDocument();
    });
  });

  // ============================================================
  // Viewport Section Tests
  // ============================================================

  describe('viewport section', () => {
    beforeEach(() => {
      renderWithProviders(<SettingsPanel sections={['viewport']} />);
      // Expand viewport section
      fireEvent.click(screen.getByRole('button', { name: /Viewport/i }));
    });

    it('should have visible frets slider', () => {
      expect(screen.getByLabelText('Visible frets')).toBeInTheDocument();
    });

    it('should have start fret slider', () => {
      expect(screen.getByLabelText('Start fret')).toBeInTheDocument();
    });

    it('should have desktop default slider', () => {
      expect(screen.getByLabelText('Desktop default frets')).toBeInTheDocument();
    });

    it('should have mobile default slider', () => {
      expect(screen.getByLabelText('Mobile default frets')).toBeInTheDocument();
    });

    it('should update visible frets', () => {
      const slider = screen.getByLabelText('Visible frets');
      fireEvent.change(slider, { target: { value: '8' } });
      
      const { viewport } = useAppStore.getState();
      expect(viewport.visibleFrets).toBe(8);
    });
  });

  // ============================================================
  // Instrument Section Tests
  // ============================================================

  describe('instrument section', () => {
    beforeEach(() => {
      renderWithProviders(<SettingsPanel sections={['instrument']} />);
      // Expand instrument section
      fireEvent.click(screen.getByRole('button', { name: /Instrument/i }));
    });

    it('should have tuning selector', () => {
      expect(screen.getByLabelText('Tuning preset')).toBeInTheDocument();
    });

    it('should have tuning options', () => {
      const select = screen.getByLabelText('Tuning preset');
      expect(within(select).getByText('Standard (EADGBE)')).toBeInTheDocument();
      expect(within(select).getByText('Drop D')).toBeInTheDocument();
      expect(within(select).getByText('Open G')).toBeInTheDocument();
    });

    it('should have total frets slider', () => {
      expect(screen.getByLabelText('Total frets')).toBeInTheDocument();
    });

    it('should update fret count', () => {
      const slider = screen.getByLabelText('Total frets');
      fireEvent.change(slider, { target: { value: '22' } });
      
      const { instrumentConfig } = useAppStore.getState();
      expect(instrumentConfig.fretCount).toBe(22);
    });
  });

  // ============================================================
  // Reset Buttons Tests
  // ============================================================

  describe('reset buttons', () => {
    it('should have reset quiz button', () => {
      renderWithProviders(<SettingsPanel />);
      expect(screen.getByText('Reset Quiz')).toBeInTheDocument();
    });

    it('should have reset appearance button', () => {
      renderWithProviders(<SettingsPanel />);
      expect(screen.getByText('Reset Appearance')).toBeInTheDocument();
    });

    it('should have reset all button', () => {
      renderWithProviders(<SettingsPanel />);
      expect(screen.getByText('Reset All')).toBeInTheDocument();
    });

    it('should reset quiz settings when clicked', () => {
      // Change a setting first
      useAppStore.getState().updateQuizSettings({ maxAttempts: 7 });
      
      renderWithProviders(<SettingsPanel />);
      fireEvent.click(screen.getByText('Reset Quiz'));
      
      const { currentQuiz } = useAppStore.getState();
      expect(currentQuiz.settings.maxAttempts).toBe(DEFAULT_QUIZ_SETTINGS.maxAttempts);
    });

    it('should reset user settings when clicked', () => {
      // Change a setting first
      useAppStore.getState().setAnimationSpeed(1.8);
      
      renderWithProviders(<SettingsPanel />);
      fireEvent.click(screen.getByText('Reset Appearance'));
      
      const { userSettings } = useAppStore.getState();
      expect(userSettings.animationSpeed).toBe(DEFAULT_USER_SETTINGS.animationSpeed);
    });

    it('should reset all settings when clicked', () => {
      // Change settings
      useAppStore.getState().updateQuizSettings({ maxAttempts: 7 });
      useAppStore.getState().setAnimationSpeed(1.8);
      
      renderWithProviders(<SettingsPanel />);
      fireEvent.click(screen.getByText('Reset All'));
      
      const state = useAppStore.getState();
      expect(state.currentQuiz.settings.maxAttempts).toBe(DEFAULT_QUIZ_SETTINGS.maxAttempts);
      expect(state.userSettings.animationSpeed).toBe(DEFAULT_USER_SETTINGS.animationSpeed);
    });
  });

  // ============================================================
  // Settings Persistence Tests
  // ============================================================

  describe('settings persistence', () => {
    it('should persist settings to store when changed', () => {
      renderWithProviders(<SettingsPanel sections={['appearance']} />);
      
      // Change animation speed
      const slider = screen.getByLabelText('Animation speed');
      fireEvent.change(slider, { target: { value: '1.2' } });
      
      // Verify store was updated
      const { userSettings } = useAppStore.getState();
      expect(userSettings.animationSpeed).toBe(1.2);
    });

    it('should reflect store state on render', () => {
      // Set a value in store first
      useAppStore.getState().setAnimationSpeed(0.7);
      
      renderWithProviders(<SettingsPanel sections={['appearance']} />);
      
      // Check the label shows the correct value
      expect(screen.getByText(/Animation Speed: 0.7x/)).toBeInTheDocument();
    });
  });

  // ============================================================
  // Accessibility Tests
  // ============================================================

  describe('accessibility', () => {
    it('should have accessible section headers', () => {
      renderWithProviders(<SettingsPanel />);
      
      // Get all buttons and filter for section headers (they have the specific class)
      const allButtons = screen.getAllByRole('button');
      const sectionHeaders = allButtons.filter(btn => 
        btn.classList.contains('settings-section__header')
      );
      
      // All section headers should have aria-expanded
      sectionHeaders.forEach(header => {
        expect(header).toHaveAttribute('aria-expanded');
      });
      
      // Should have at least 6 section headers
      expect(sectionHeaders.length).toBeGreaterThanOrEqual(6);
    });

    it('should have labeled form controls', () => {
      renderWithProviders(<SettingsPanel sections={['appearance']} />);
      
      expect(screen.getByLabelText('Select color theme')).toBeInTheDocument();
      expect(screen.getByLabelText('Animation speed')).toBeInTheDocument();
    });

    it('should have labeled close button', () => {
      const onClose = vi.fn();
      renderWithProviders(<SettingsPanel onClose={onClose} />);
      
      expect(screen.getByLabelText('Close settings')).toBeInTheDocument();
    });
  });

  // ============================================================
  // Edge Cases
  // ============================================================

  describe('edge cases', () => {
    it('should handle rapid setting changes', () => {
      renderWithProviders(<SettingsPanel sections={['appearance']} />);
      const slider = screen.getByLabelText('Animation speed');
      
      // Rapid changes
      for (let i = 5; i <= 20; i++) {
        fireEvent.change(slider, { target: { value: (i / 10).toString() } });
      }
      
      const { userSettings } = useAppStore.getState();
      expect(userSettings.animationSpeed).toBe(2); // Clamped to max
    });

    it('should handle empty sections array', () => {
      renderWithProviders(<SettingsPanel sections={[]} />);
      
      // Should still render panel header and footer
      expect(screen.getByText('⚙️ Settings')).toBeInTheDocument();
      expect(screen.getByText('Reset All')).toBeInTheDocument();
      
      // But no section content
      expect(screen.queryByText('Appearance')).not.toBeInTheDocument();
    });

    it('should handle interval selection with empty array', () => {
      useAppStore.getState().updateQuizSettings({ selectedIntervals: [] });
      
      renderWithProviders(<SettingsPanel sections={['intervals']} />);
      
      expect(screen.getByText('0 selected')).toBeInTheDocument();
    });
  });
});
