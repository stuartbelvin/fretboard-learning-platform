import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FretboardDisplay, ZONE_COLORS, ROOT_NOTE_COLOR } from '../../components/fretboard/FretboardDisplay';
import { HighlightZone } from '../../core/zones/HighlightZone';
import { Fretboard } from '../../core/instruments/Fretboard';
import { Note } from '../../core/music-theory/Note';
import type { ZoneConfig } from '../../components/fretboard/FretboardDisplay';
import '@testing-library/jest-dom';

describe('Root Note Highlighting (INT-003)', () => {
  let fretboard: Fretboard;
  let zone: HighlightZone;
  let zoneConfig: ZoneConfig;
  let rootNote: Note;

  beforeEach(() => {
    fretboard = new Fretboard();
    zone = new HighlightZone('Answer Zone');
    // Add notes to the answer zone (frets 0-5 on all strings)
    for (let string = 1; string <= 6; string++) {
      for (let fret = 0; fret <= 5; fret++) {
        zone.addNote(string, fret);
      }
    }
    
    zoneConfig = {
      zone,
      color: ZONE_COLORS.blue,
      label: 'Answer Zone',
    };
    
    // Root note: C on string 2, fret 1
    rootNote = fretboard.getNoteAt(2, 1)!;
  });

  describe('ROOT_NOTE_COLOR constant', () => {
    it('should be defined', () => {
      expect(ROOT_NOTE_COLOR).toBeDefined();
    });

    it('should be a valid RGBA color string', () => {
      expect(ROOT_NOTE_COLOR).toMatch(/^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/);
    });

    it('should be a yellow/gold color (234, 179, 8)', () => {
      expect(ROOT_NOTE_COLOR).toContain('234');
      expect(ROOT_NOTE_COLOR).toContain('179');
      expect(ROOT_NOTE_COLOR).toContain('8');
    });
  });

  describe('FretboardDisplay rootNote prop', () => {
    it('should render without rootNote prop', () => {
      render(<FretboardDisplay visibleFrets={6} />);
      const noteButton = screen.getByRole('button', { name: /string 1, fret 0/i });
      expect(noteButton).toBeInTheDocument();
    });

    it('should render with rootNote prop set to null', () => {
      render(<FretboardDisplay visibleFrets={6} rootNote={null} />);
      const { container } = render(<FretboardDisplay visibleFrets={6} rootNote={null} />);
      const rootNoteCell = container.querySelector('.root-note-cell');
      expect(rootNoteCell).toBeNull();
    });

    it('should render with a valid rootNote', () => {
      render(<FretboardDisplay visibleFrets={6} rootNote={rootNote} />);
      // Should render without errors
      const noteButton = screen.getByRole('button', { name: /string 2, fret 1.*root note/i });
      expect(noteButton).toBeInTheDocument();
    });
  });

  describe('Root note visual classes', () => {
    it('should add root-note-cell class to the note cell', () => {
      const { container } = render(
        <FretboardDisplay visibleFrets={6} rootNote={rootNote} />
      );
      
      const rootCell = container.querySelector('[data-string="2"][data-fret="1"]');
      expect(rootCell).toHaveClass('root-note-cell');
    });

    it('should add root-note class to the note button', () => {
      const { container } = render(
        <FretboardDisplay visibleFrets={6} rootNote={rootNote} />
      );
      
      const rootButton = container.querySelector('[data-string="2"][data-fret="1"] .note-button');
      expect(rootButton).toHaveClass('root-note');
    });

    it('should set data-is-root attribute on the root note cell', () => {
      const { container } = render(
        <FretboardDisplay visibleFrets={6} rootNote={rootNote} />
      );
      
      const rootCell = container.querySelector('[data-string="2"][data-fret="1"]');
      expect(rootCell).toHaveAttribute('data-is-root', 'true');
    });

    it('should not add root-note classes to non-root notes', () => {
      const { container } = render(
        <FretboardDisplay visibleFrets={6} rootNote={rootNote} />
      );
      
      // String 1, fret 0 is NOT the root note
      const otherCell = container.querySelector('[data-string="1"][data-fret="0"]');
      expect(otherCell).not.toHaveClass('root-note-cell');
      
      const otherButton = container.querySelector('[data-string="1"][data-fret="0"] .note-button');
      expect(otherButton).not.toHaveClass('root-note');
    });
  });

  describe('Root note label display', () => {
    it('should show root note label by default (showRootNoteLabel=true)', () => {
      const { container } = render(
        <FretboardDisplay visibleFrets={6} rootNote={rootNote} />
      );
      
      const rootLabel = container.querySelector('.root-note-label');
      expect(rootLabel).toBeInTheDocument();
      // C note should be displayed
      expect(rootLabel?.textContent).toBe('C');
    });

    it('should not show root note label when showRootNoteLabel=false', () => {
      const { container } = render(
        <FretboardDisplay visibleFrets={6} rootNote={rootNote} showRootNoteLabel={false} />
      );
      
      const rootLabel = container.querySelector('.root-note-label');
      expect(rootLabel).toBeNull();
    });

    it('should show sharp notation for root note with noteDisplay=sharps', () => {
      // F# note on string 1, fret 2
      const fSharpNote = fretboard.getNoteAt(1, 2)!;
      
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          rootNote={fSharpNote} 
          noteDisplay="sharps"
        />
      );
      
      const rootLabel = container.querySelector('.root-note-label');
      expect(rootLabel?.textContent).toBe('F#');
    });

    it('should show flat notation for root note with noteDisplay=flats', () => {
      // F# (Gb) note on string 1, fret 2
      const fSharpNote = fretboard.getNoteAt(1, 2)!;
      
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          rootNote={fSharpNote} 
          noteDisplay="flats"
        />
      );
      
      const rootLabel = container.querySelector('.root-note-label');
      expect(rootLabel?.textContent).toBe('Gb');
    });
  });

  describe('Root note accessibility', () => {
    it('should include "root note" in aria-label', () => {
      render(<FretboardDisplay visibleFrets={6} rootNote={rootNote} />);
      
      const rootButton = screen.getByRole('button', { name: /root note/i });
      expect(rootButton).toBeInTheDocument();
    });

    it('should have complete aria-label with position and root note indicator', () => {
      render(<FretboardDisplay visibleFrets={6} rootNote={rootNote} />);
      
      // Check for the full aria-label format
      const rootButton = screen.getByRole('button', { 
        name: /C\d? on string 2, fret 1, root note/i 
      });
      expect(rootButton).toBeInTheDocument();
    });
  });

  describe('Root note with highlight zones', () => {
    it('should distinguish root note from answer zone', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          highlightZones={[zoneConfig]} 
          rootNote={rootNote}
        />
      );
      
      // Root note should have both zone and root classes
      const rootCell = container.querySelector('[data-string="2"][data-fret="1"]');
      expect(rootCell).toHaveClass('root-note-cell');
      expect(rootCell).toHaveClass('zone-highlight');
    });

    it('should show root note clearly distinguishable when inside zone', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          highlightZones={[zoneConfig]} 
          rootNote={rootNote}
        />
      );
      
      const rootButton = container.querySelector('[data-string="2"][data-fret="1"] .note-button');
      expect(rootButton).toHaveClass('root-note');
      expect(rootButton).toHaveClass('in-zone');
    });

    it('should handle root note outside zone (compound intervals)', () => {
      // Create a smaller zone that doesn't include the root
      const smallZone = new HighlightZone('Small Zone');
      smallZone.addNote(1, 0);
      smallZone.addNote(1, 1);
      
      const smallZoneConfig: ZoneConfig = {
        zone: smallZone,
        color: ZONE_COLORS.blue,
      };
      
      // Root note is on string 2, fret 1 (outside smallZone)
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          highlightZones={[smallZoneConfig]} 
          rootNote={rootNote}
        />
      );
      
      const rootCell = container.querySelector('[data-string="2"][data-fret="1"]');
      expect(rootCell).toHaveClass('root-note-cell');
      expect(rootCell).not.toHaveClass('zone-highlight');
    });
  });

  describe('Custom root note color', () => {
    it('should use default ROOT_NOTE_COLOR when no custom color provided', () => {
      const { container } = render(
        <FretboardDisplay visibleFrets={6} rootNote={rootNote} />
      );
      
      const rootCell = container.querySelector('[data-string="2"][data-fret="1"]');
      // CSS custom property should be set
      const style = rootCell?.getAttribute('style');
      expect(style).toContain('--root-note-color');
    });

    it('should accept custom rootNoteColor prop', () => {
      const customColor = 'rgba(255, 0, 0, 0.8)';
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          rootNote={rootNote} 
          rootNoteColor={customColor}
        />
      );
      
      const rootCell = container.querySelector('[data-string="2"][data-fret="1"]');
      const style = rootCell?.getAttribute('style');
      expect(style).toContain(customColor);
    });
  });

  describe('Root note interaction with other features', () => {
    it('should work with zoneOnlyMode', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          highlightZones={[zoneConfig]} 
          rootNote={rootNote}
          zoneOnlyMode={true}
        />
      );
      
      // Root note in zone should be clickable
      const rootButton = container.querySelector('[data-string="2"][data-fret="1"] .note-button');
      expect(rootButton).toHaveClass('root-note');
      expect(rootButton).not.toHaveClass('disabled-zone');
    });

    it('should work with feedbackStates', () => {
      const feedbackStates = [{
        positionId: 's2f1',
        type: 'correct' as const,
        startTime: Date.now(),
        duration: 500,
      }];
      
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          rootNote={rootNote}
          feedbackStates={feedbackStates}
        />
      );
      
      const rootButton = container.querySelector('[data-string="2"][data-fret="1"] .note-button');
      expect(rootButton).toHaveClass('root-note');
      expect(rootButton).toHaveClass('correct');
    });

    it('should work with selectedNote', () => {
      const selectedNote = fretboard.getNoteAt(1, 0)!;
      
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          rootNote={rootNote}
          selectedNote={selectedNote}
        />
      );
      
      // Root note should still be highlighted
      const rootButton = container.querySelector('[data-string="2"][data-fret="1"] .note-button');
      expect(rootButton).toHaveClass('root-note');
      
      // Selected note should be separate
      const selectedButton = container.querySelector('[data-string="1"][data-fret="0"] .note-button');
      expect(selectedButton).toHaveClass('selected');
    });
  });

  describe('Root note position matching', () => {
    it('should highlight only the exact note position', () => {
      const { container } = render(
        <FretboardDisplay visibleFrets={12} rootNote={rootNote} />
      );
      
      // Only one note should be the root
      const rootCells = container.querySelectorAll('.root-note-cell');
      expect(rootCells.length).toBe(1);
    });

    it('should not highlight same pitch class on different positions', () => {
      // C on string 2, fret 1 is the root
      // C also appears on string 3, fret 5
      const { container } = render(
        <FretboardDisplay visibleFrets={12} rootNote={rootNote} />
      );
      
      // String 3, fret 5 should NOT be highlighted as root
      const otherCCell = container.querySelector('[data-string="3"][data-fret="5"]');
      expect(otherCCell).not.toHaveClass('root-note-cell');
    });

    it('should handle open string as root note', () => {
      const openENote = fretboard.getNoteAt(1, 0)!;
      
      const { container } = render(
        <FretboardDisplay visibleFrets={6} rootNote={openENote} />
      );
      
      const rootCell = container.querySelector('[data-string="1"][data-fret="0"]');
      expect(rootCell).toHaveClass('root-note-cell');
      expect(rootCell).toHaveClass('open-string');
    });

    it('should handle root note at higher frets', () => {
      const highFretNote = fretboard.getNoteAt(1, 12)!;
      
      const { container } = render(
        <FretboardDisplay visibleFrets={13} rootNote={highFretNote} />
      );
      
      const rootCell = container.querySelector('[data-string="1"][data-fret="12"]');
      expect(rootCell).toHaveClass('root-note-cell');
    });
  });

  describe('Root note visibility in viewport', () => {
    it('should highlight root note when visible in viewport', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          startFret={0} 
          rootNote={rootNote} 
        />
      );
      
      const rootCell = container.querySelector('[data-string="2"][data-fret="1"]');
      expect(rootCell).toHaveClass('root-note-cell');
    });

    it('should not render root note cell when outside viewport', () => {
      // Root is at fret 1, but viewport starts at fret 10
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={5} 
          startFret={10} 
          rootNote={rootNote} 
        />
      );
      
      // Fret 1 should not be rendered at all
      const rootCell = container.querySelector('[data-string="2"][data-fret="1"]');
      expect(rootCell).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle root note on all 6 strings', () => {
      for (let string = 1; string <= 6; string++) {
        const note = fretboard.getNoteAt(string, 3)!;
        const { container } = render(
          <FretboardDisplay visibleFrets={6} rootNote={note} />
        );
        
        const rootCell = container.querySelector(`[data-string="${string}"][data-fret="3"]`);
        expect(rootCell).toHaveClass('root-note-cell');
      }
    });

    it('should handle switching root notes', () => {
      const { container, rerender } = render(
        <FretboardDisplay visibleFrets={6} rootNote={rootNote} />
      );
      
      // Initial root note
      let rootCell = container.querySelector('[data-string="2"][data-fret="1"]');
      expect(rootCell).toHaveClass('root-note-cell');
      
      // Switch to different root note
      const newRootNote = fretboard.getNoteAt(3, 2)!;
      rerender(<FretboardDisplay visibleFrets={6} rootNote={newRootNote} />);
      
      // Old root should no longer be highlighted
      rootCell = container.querySelector('[data-string="2"][data-fret="1"]');
      expect(rootCell).not.toHaveClass('root-note-cell');
      
      // New root should be highlighted
      const newRootCell = container.querySelector('[data-string="3"][data-fret="2"]');
      expect(newRootCell).toHaveClass('root-note-cell');
    });

    it('should handle removing root note', () => {
      const { container, rerender } = render(
        <FretboardDisplay visibleFrets={6} rootNote={rootNote} />
      );
      
      // Initial root note
      let rootCell = container.querySelector('[data-string="2"][data-fret="1"]');
      expect(rootCell).toHaveClass('root-note-cell');
      
      // Remove root note
      rerender(<FretboardDisplay visibleFrets={6} rootNote={null} />);
      
      // Should no longer have root note cell
      rootCell = container.querySelector('.root-note-cell');
      expect(rootCell).toBeNull();
    });
  });

  // INT-005: Root Outside Zone Indicator Tests
  describe('Root note outside zone indicator (INT-005)', () => {
    it('should not show outside zone indicator when rootOutsideZone is false', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          rootNote={rootNote}
          rootOutsideZone={false}
        />
      );
      
      const indicator = container.querySelector('.root-outside-zone-indicator');
      expect(indicator).toBeNull();
    });

    it('should show outside zone indicator when rootOutsideZone is true', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          rootNote={rootNote}
          rootOutsideZone={true}
        />
      );
      
      const indicator = container.querySelector('.root-outside-zone-indicator');
      expect(indicator).not.toBeNull();
    });

    it('should add root-outside-zone class to button when rootOutsideZone is true', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          rootNote={rootNote}
          rootOutsideZone={true}
        />
      );
      
      const rootButton = container.querySelector('[data-string="2"][data-fret="1"] .note-button');
      expect(rootButton).toHaveClass('root-outside-zone');
    });

    it('should add root-outside-zone-cell class to cell when rootOutsideZone is true', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          rootNote={rootNote}
          rootOutsideZone={true}
        />
      );
      
      const rootCell = container.querySelector('[data-string="2"][data-fret="1"]');
      expect(rootCell).toHaveClass('root-outside-zone-cell');
    });

    it('should set data-root-outside-zone attribute when rootOutsideZone is true', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          rootNote={rootNote}
          rootOutsideZone={true}
        />
      );
      
      const rootCell = container.querySelector('[data-string="2"][data-fret="1"]');
      expect(rootCell?.getAttribute('data-root-outside-zone')).toBe('true');
    });

    it('should not set data-root-outside-zone attribute when rootOutsideZone is false', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          rootNote={rootNote}
          rootOutsideZone={false}
        />
      );
      
      const rootCell = container.querySelector('[data-string="2"][data-fret="1"]');
      expect(rootCell?.getAttribute('data-root-outside-zone')).toBeNull();
    });

    it('should include "outside answer zone" in aria-label when rootOutsideZone is true', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          rootNote={rootNote}
          rootOutsideZone={true}
        />
      );
      
      const rootButton = container.querySelector('[data-string="2"][data-fret="1"] .note-button');
      const ariaLabel = rootButton?.getAttribute('aria-label');
      expect(ariaLabel).toContain('outside answer zone');
    });

    it('should not include "outside answer zone" in aria-label when rootOutsideZone is false', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          rootNote={rootNote}
          rootOutsideZone={false}
        />
      );
      
      const rootButton = container.querySelector('[data-string="2"][data-fret="1"] .note-button');
      const ariaLabel = rootButton?.getAttribute('aria-label');
      expect(ariaLabel).not.toContain('outside answer zone');
    });

    it('should show indicator with correct content (arrow symbol)', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          rootNote={rootNote}
          rootOutsideZone={true}
        />
      );
      
      const indicator = container.querySelector('.root-outside-zone-indicator');
      expect(indicator?.textContent).toBe('↗');
    });

    it('should have aria-hidden on indicator', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          rootNote={rootNote}
          rootOutsideZone={true}
        />
      );
      
      const indicator = container.querySelector('.root-outside-zone-indicator');
      expect(indicator?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should show both root note label and outside zone indicator', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          rootNote={rootNote}
          rootOutsideZone={true}
          showRootNoteLabel={true}
        />
      );
      
      const rootButton = container.querySelector('[data-string="2"][data-fret="1"] .note-button');
      const label = rootButton?.querySelector('.root-note-label');
      const indicator = rootButton?.querySelector('.root-outside-zone-indicator');
      
      expect(label).not.toBeNull();
      expect(indicator).not.toBeNull();
    });

    it('should work with highlight zones present', () => {
      const smallZone = new HighlightZone('Answer Zone');
      smallZone.addNote(1, 0);
      smallZone.addNote(1, 1);
      
      const smallZoneConfig: ZoneConfig = {
        zone: smallZone,
        color: ZONE_COLORS.blue,
      };

      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          highlightZones={[smallZoneConfig]}
          rootNote={rootNote}
          rootOutsideZone={true}
        />
      );
      
      // Root note should be outside the small zone
      const rootCell = container.querySelector('[data-string="2"][data-fret="1"]');
      expect(rootCell).toHaveClass('root-note-cell');
      expect(rootCell).toHaveClass('root-outside-zone-cell');
      expect(rootCell).not.toHaveClass('zone-highlight');
      
      const indicator = container.querySelector('.root-outside-zone-indicator');
      expect(indicator).not.toBeNull();
    });

    it('should default rootOutsideZone to false', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          rootNote={rootNote}
        />
      );
      
      const rootCell = container.querySelector('[data-string="2"][data-fret="1"]');
      expect(rootCell).not.toHaveClass('root-outside-zone-cell');
      expect(container.querySelector('.root-outside-zone-indicator')).toBeNull();
    });

    it('should not show indicator when no root note is set', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={6} 
          rootNote={null}
          rootOutsideZone={true}
        />
      );
      
      const indicator = container.querySelector('.root-outside-zone-indicator');
      expect(indicator).toBeNull();
    });
  });
});
