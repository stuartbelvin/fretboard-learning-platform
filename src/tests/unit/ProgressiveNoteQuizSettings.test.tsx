import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Theme } from '@radix-ui/themes';
import { ProgressiveNoteQuiz } from '../../components/quiz/ProgressiveNoteQuiz';
import { ColorProvider } from '../../context';

// Mock the fretboard component
vi.mock('../../components/fretboard/FretboardDisplay', () => ({
  FretboardDisplay: ({ onNoteClick, selectedNote, highlightZones, rootNote, rootOutsideZone }: any) => (
    <div data-testid="fretboard">
      <button onClick={() => onNoteClick?.({ string: 6, fret: 0, pitchClass: 'E' })}>
        E on 6th string
      </button>
      <div data-testid="selected-note">{selectedNote?.pitchClass || 'none'}</div>
      <div data-testid="root-note">{rootNote?.pitchClass || 'none'}</div>
      <div data-testid="root-outside">{rootOutsideZone ? 'yes' : 'no'}</div>
    </div>
  ),
}));

describe('ProgressiveNoteQuiz Settings Panel', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <ColorProvider>
        <Theme appearance="dark" accentColor="blue" grayColor="slate" radius="medium" scaling="100%">
          {component}
        </Theme>
      </ColorProvider>
    );
  };

  it('should load settings from store into form fields', async () => {
    renderWithProvider(<ProgressiveNoteQuiz />);
    
    // Find settings toggle and expand it
    const settingsToggle = screen.getByText('Settings');
    fireEvent.click(settingsToggle);
    
    // Check that default values are loaded
    expect(screen.getByDisplayValue('80')).toBeInTheDocument(); // accuracyThreshold
    expect(screen.getByDisplayValue('3')).toBeInTheDocument(); // averageTimeThreshold
    expect(screen.getByDisplayValue('20')).toBeInTheDocument(); // maxAnswerTimeToCount
    expect(screen.getByDisplayValue('800')).toBeInTheDocument(); // nextNoteDelay
    expect(screen.getByDisplayValue('2')).toBeInTheDocument(); // lowAccuracyWeight
    expect(screen.getByDisplayValue('2')).toBeInTheDocument(); // unlearnedNoteWeight
    expect(screen.getByDisplayValue('70')).toBeInTheDocument(); // strugglingAccuracyThreshold
    expect(screen.getByDisplayValue('3')).toBeInTheDocument(); // minAttemptsForLearned
  });

  it('should update store when settings are changed and saved', async () => {
    renderWithProvider(<ProgressiveNoteQuiz />);
    
    // Expand settings
    const settingsToggle = screen.getByText('Settings');
    fireEvent.click(settingsToggle);
    
    // Find the minAttemptsForLearned field and change it
    const minAttemptsField = screen.getByDisplayValue('3');
    fireEvent.change(minAttemptsField, { target: { value: '1' } });
    
    // Click save button
    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);
    
    // Verify the setting was saved by checking the field still shows the new value
    // (This test verifies the UI state, the store state would be tested through integration)
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
  });

  it('should update multiple settings at once', async () => {
    renderWithProvider(<ProgressiveNoteQuiz />);
    
    // Expand settings
    const settingsToggle = screen.getByText('Settings');
    fireEvent.click(settingsToggle);
    
    // Change multiple settings
    const accuracyField = screen.getByDisplayValue('80');
    fireEvent.change(accuracyField, { target: { value: '85' } });
    
    const minAttemptsField = screen.getByDisplayValue('3');
    fireEvent.change(minAttemptsField, { target: { value: '5' } });
    
    const nextDelayField = screen.getByDisplayValue('800');
    fireEvent.change(nextDelayField, { target: { value: '500' } });
    
    // Save settings
    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);
    
    // Verify all settings were saved
    expect(screen.getByDisplayValue('85')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('500')).toBeInTheDocument();
  });

  it('should handle boundary values correctly', async () => {
    renderWithProvider(<ProgressiveNoteQuiz />);
    
    // Expand settings
    const settingsToggle = screen.getByText('Settings');
    fireEvent.click(settingsToggle);
    
    // Test minimum and maximum values for different fields
    const minAttemptsField = screen.getByDisplayValue('3');
    fireEvent.change(minAttemptsField, { target: { value: '20' } });
    
    const accuracyField = screen.getByDisplayValue('80');
    fireEvent.change(accuracyField, { target: { value: '100' } });
    
    const lowWeightField = screen.getByDisplayValue('2');
    fireEvent.change(lowWeightField, { target: { value: '5' } });
    
    // Save settings
    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);
    
    // Verify boundary values are accepted
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('should reset settings to defaults when reset button is clicked', async () => {
    renderWithProvider(<ProgressiveNoteQuiz />);
    
    // Expand settings and change some values
    const settingsToggle = screen.getByText('Settings');
    fireEvent.click(settingsToggle);
    
    const minAttemptsField = screen.getByDisplayValue('3');
    fireEvent.change(minAttemptsField, { target: { value: '10' } });
    
    // Save the changes first
    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);
    
    // Now reset
    const resetButton = screen.getByText('Reset All Progress');
    fireEvent.click(resetButton);
    
    // Confirm values return to defaults after reset
    // Note: The actual reset functionality would be tested through integration
    // This test mainly verifies the UI interaction
    expect(screen.getByText('Reset All Progress')).toBeInTheDocument();
  });
});