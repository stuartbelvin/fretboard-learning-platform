import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FretboardDisplay, ZoneConfig, ZONE_COLORS } from '../../components/fretboard/FretboardDisplay';
import { HighlightZone } from '../../core/zones/HighlightZone';
import '@testing-library/jest-dom';

describe('Zone Interaction Constraints (HLZ-003)', () => {
  let zone: HighlightZone;
  let zoneConfig: ZoneConfig;

  beforeEach(() => {
    zone = new HighlightZone('Test Zone');
    // Add some notes to the zone
    zone.addNote(1, 0);  // Open high E (E4)
    zone.addNote(1, 3);  // G on high E (G4)
    zone.addNote(2, 1);  // C on B string (C4)
    
    zoneConfig = {
      zone,
      color: ZONE_COLORS.blue,
      opacity: 0.3,
      label: 'Test Zone',
    };
    
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('zoneOnlyMode prop', () => {
    it('should allow clicking any note when zoneOnlyMode is false', () => {
      const handleClick = vi.fn();
      
      render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={false}
          onNoteClick={handleClick}
        />
      );
      
      // Click a note outside the zone (string 1, fret 2)
      const outsideNote = screen.getByRole('button', { name: /string 1, fret 2$/i });
      fireEvent.click(outsideNote);
      
      expect(handleClick).toHaveBeenCalled();
    });

    it('should allow clicking notes inside zone when zoneOnlyMode is true', () => {
      const handleClick = vi.fn();
      
      render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
          onNoteClick={handleClick}
        />
      );
      
      // Click a note inside the zone (string 1, fret 0)
      const zoneNote = screen.getByRole('button', { name: /string 1, fret 0.*in highlighted zone/i });
      fireEvent.click(zoneNote);
      
      expect(handleClick).toHaveBeenCalled();
    });

    it('should reject clicks on notes outside zone when zoneOnlyMode is true', () => {
      const handleClick = vi.fn();
      
      render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
          onNoteClick={handleClick}
        />
      );
      
      // Click a note outside the zone (string 1, fret 2)
      const outsideNote = screen.getByRole('button', { name: /string 1, fret 2.*outside active zone/i });
      fireEvent.click(outsideNote);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should allow all clicks when zoneOnlyMode is true but no zones defined', () => {
      const handleClick = vi.fn();
      
      render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[]}
          zoneOnlyMode={true}
          onNoteClick={handleClick}
        />
      );
      
      // Click any note
      const note = screen.getByRole('button', { name: /string 1, fret 2$/i });
      fireEvent.click(note);
      
      expect(handleClick).toHaveBeenCalled();
    });

    it('should default zoneOnlyMode to false', () => {
      const handleClick = vi.fn();
      
      render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          onNoteClick={handleClick}
        />
      );
      
      // Click a note outside the zone - should work since default is false
      const outsideNote = screen.getByRole('button', { name: /string 1, fret 2$/i });
      fireEvent.click(outsideNote);
      
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('onRejectedClick callback', () => {
    it('should call onRejectedClick when click is rejected', () => {
      const handleRejected = vi.fn();
      
      render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
          onRejectedClick={handleRejected}
        />
      );
      
      // Click a note outside the zone
      const outsideNote = screen.getByRole('button', { name: /string 1, fret 2.*outside active zone/i });
      fireEvent.click(outsideNote);
      
      expect(handleRejected).toHaveBeenCalledWith(
        expect.objectContaining({
          string: 1,
          fret: 2,
        }),
        'Note is outside highlight zone'
      );
    });

    it('should not call onRejectedClick when click is accepted', () => {
      const handleRejected = vi.fn();
      
      render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
          onRejectedClick={handleRejected}
        />
      );
      
      // Click a note inside the zone
      const zoneNote = screen.getByRole('button', { name: /string 1, fret 0.*in highlighted zone/i });
      fireEvent.click(zoneNote);
      
      expect(handleRejected).not.toHaveBeenCalled();
    });

    it('should pass correct note data to onRejectedClick', () => {
      const handleRejected = vi.fn();
      
      render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
          onRejectedClick={handleRejected}
        />
      );
      
      // Click string 3, fret 2 (outside zone)
      const outsideNote = screen.getByRole('button', { name: /string 3, fret 2.*outside active zone/i });
      fireEvent.click(outsideNote);
      
      expect(handleRejected).toHaveBeenCalledTimes(1);
      const [note, reason] = handleRejected.mock.calls[0];
      expect(note.string).toBe(3);
      expect(note.fret).toBe(2);
      expect(reason).toBe('Note is outside highlight zone');
    });
  });

  describe('Visual feedback for rejected clicks', () => {
    it('should add rejected class to note button when click is rejected', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
        />
      );
      
      // Click a note outside the zone
      const outsideNote = screen.getByRole('button', { name: /string 1, fret 2.*outside active zone/i });
      fireEvent.click(outsideNote);
      
      expect(outsideNote).toHaveClass('rejected');
    });

    it('should add rejected-cell class to note cell when click is rejected', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
        />
      );
      
      // Click a note outside the zone
      const outsideNote = screen.getByRole('button', { name: /string 1, fret 2.*outside active zone/i });
      fireEvent.click(outsideNote);
      
      const noteCell = container.querySelector('[data-string="1"][data-fret="2"]');
      expect(noteCell).toHaveClass('rejected-cell');
    });

    it('should clear rejected state after animation duration', async () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
        />
      );
      
      // Click a note outside the zone
      const outsideNote = screen.getByRole('button', { name: /string 1, fret 2.*outside active zone/i });
      fireEvent.click(outsideNote);
      
      expect(outsideNote).toHaveClass('rejected');
      
      // Advance timers past the animation duration (500ms) within act()
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      
      expect(outsideNote).not.toHaveClass('rejected');
    });

    it('should not add rejected class when click is accepted', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
        />
      );
      
      // Click a note inside the zone
      const zoneNote = screen.getByRole('button', { name: /string 1, fret 0.*in highlighted zone/i });
      fireEvent.click(zoneNote);
      
      expect(zoneNote).not.toHaveClass('rejected');
    });
  });

  describe('Disabled visual state for notes outside zone', () => {
    it('should add disabled-zone class to notes outside zone when zoneOnlyMode is true', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
        />
      );
      
      // Note outside zone should have disabled class
      const outsideNote = screen.getByRole('button', { name: /string 1, fret 2.*outside active zone/i });
      expect(outsideNote).toHaveClass('disabled-zone');
    });

    it('should not add disabled-zone class to notes inside zone', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
        />
      );
      
      // Note inside zone should not have disabled class
      const zoneNote = screen.getByRole('button', { name: /string 1, fret 0.*in highlighted zone/i });
      expect(zoneNote).not.toHaveClass('disabled-zone');
    });

    it('should not add disabled-zone class when zoneOnlyMode is false', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={false}
        />
      );
      
      // No notes should have disabled class
      const disabledNotes = container.querySelectorAll('.note-button.disabled-zone');
      expect(disabledNotes.length).toBe(0);
    });

    it('should not add disabled-zone class when no zones are defined', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[]}
          zoneOnlyMode={true}
        />
      );
      
      // No notes should have disabled class
      const disabledNotes = container.querySelectorAll('.note-button.disabled-zone');
      expect(disabledNotes.length).toBe(0);
    });
  });

  describe('Accessibility for zone constraints', () => {
    it('should set aria-disabled on notes outside zone when zoneOnlyMode is true', () => {
      render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
        />
      );
      
      const outsideNote = screen.getByRole('button', { name: /string 1, fret 2.*outside active zone/i });
      expect(outsideNote).toHaveAttribute('aria-disabled', 'true');
    });

    it('should not set aria-disabled on notes inside zone', () => {
      render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
        />
      );
      
      const zoneNote = screen.getByRole('button', { name: /string 1, fret 0.*in highlighted zone/i });
      expect(zoneNote).toHaveAttribute('aria-disabled', 'false');
    });

    it('should include zone status in aria-label for disabled notes', () => {
      render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
        />
      );
      
      // Disabled notes should mention "outside active zone"
      const disabledNotes = screen.getAllByRole('button', { name: /outside active zone/i });
      expect(disabledNotes.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple zones with zoneOnlyMode', () => {
    let zone2: HighlightZone;
    let zoneConfig2: ZoneConfig;

    beforeEach(() => {
      zone2 = new HighlightZone('Zone 2');
      zone2.addNote(3, 2);  // A on G string
      zone2.addNote(4, 0);  // Open D
      
      zoneConfig2 = {
        zone: zone2,
        color: ZONE_COLORS.green,
        opacity: 0.4,
      };
    });

    it('should allow clicks on notes in any of the multiple zones', () => {
      const handleClick = vi.fn();
      
      render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig, zoneConfig2]}
          zoneOnlyMode={true}
          onNoteClick={handleClick}
        />
      );
      
      // Click note in zone 1
      const zone1Note = screen.getByRole('button', { name: /string 1, fret 0.*in highlighted zone/i });
      fireEvent.click(zone1Note);
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // Click note in zone 2
      const zone2Note = screen.getByRole('button', { name: /string 3, fret 2.*in highlighted zone/i });
      fireEvent.click(zone2Note);
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should reject clicks on notes outside all zones', () => {
      const handleClick = vi.fn();
      
      render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig, zoneConfig2]}
          zoneOnlyMode={true}
          onNoteClick={handleClick}
        />
      );
      
      // Click note outside all zones (string 5, fret 4)
      const outsideNote = screen.getByRole('button', { name: /string 5, fret 4.*outside active zone/i });
      fireEvent.click(outsideNote);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid repeated clicks gracefully', () => {
      const handleClick = vi.fn();
      const handleRejected = vi.fn();
      
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
          onNoteClick={handleClick}
          onRejectedClick={handleRejected}
        />
      );
      
      const outsideNote = screen.getByRole('button', { name: /string 1, fret 2.*outside active zone/i });
      fireEvent.click(outsideNote);
      fireEvent.click(outsideNote);
      fireEvent.click(outsideNote);
      
      // All clicks should be rejected
      expect(handleRejected).toHaveBeenCalledTimes(3);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle empty zone in zoneOnlyMode', () => {
      const emptyZone = new HighlightZone('Empty');
      const handleClick = vi.fn();
      
      render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[{ zone: emptyZone }]}
          zoneOnlyMode={true}
          onNoteClick={handleClick}
        />
      );
      
      // All notes should be disabled/rejected since zone is empty
      const anyNote = screen.getByRole('button', { name: /string 1, fret 0.*outside active zone/i });
      fireEvent.click(anyNote);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle toggling zoneOnlyMode dynamically', () => {
      const handleClick = vi.fn();
      
      const { rerender } = render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={false}
          onNoteClick={handleClick}
        />
      );
      
      // Click outside zone - should work
      const outsideNote = screen.getByRole('button', { name: /string 1, fret 2$/i });
      fireEvent.click(outsideNote);
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // Enable zone-only mode
      rerender(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
          onNoteClick={handleClick}
        />
      );
      
      // Same click - should now be rejected
      fireEvent.click(outsideNote);
      expect(handleClick).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should handle zone changes while zoneOnlyMode is active', () => {
      const handleClick = vi.fn();
      
      const { rerender } = render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
          onNoteClick={handleClick}
        />
      );
      
      // Note outside original zone
      const note = screen.getByRole('button', { name: /string 1, fret 4.*outside active zone/i });
      fireEvent.click(note);
      expect(handleClick).not.toHaveBeenCalled();
      
      // Expand zone to include this note
      zone.addNote(1, 4);
      rerender(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
          onNoteClick={handleClick}
        />
      );
      
      // Same note - should now be clickable
      const expandedNote = screen.getByRole('button', { name: /string 1, fret 4.*in highlighted zone/i });
      fireEvent.click(expandedNote);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration with other features', () => {
    it('should work correctly with note selection', () => {
      const handleClick = vi.fn();
      
      render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
          onNoteClick={handleClick}
          selectedNote={null}
        />
      );
      
      // Click on zone note
      const zoneNote = screen.getByRole('button', { name: /string 1, fret 3.*in highlighted zone/i });
      fireEvent.click(zoneNote);
      
      expect(handleClick).toHaveBeenCalled();
    });

    it('should work correctly with showZoneNotesOnly', () => {
      const handleClick = vi.fn();
      
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
          showNoteNames={true}
          showZoneNotesOnly={true}
          onNoteClick={handleClick}
        />
      );
      
      // Zone notes should be clickable and show names
      const zoneNote = screen.getByRole('button', { name: /string 1, fret 0.*in highlighted zone/i });
      fireEvent.click(zoneNote);
      expect(handleClick).toHaveBeenCalled();
      
      // Outside notes should not show names and should be disabled
      const outsideNote = screen.getByRole('button', { name: /string 1, fret 2.*outside active zone/i });
      expect(outsideNote).toHaveClass('disabled-zone');
    });

    it('should preserve correct console logging behavior', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig]}
          zoneOnlyMode={true}
        />
      );
      
      // Click outside zone - should log rejection
      const outsideNote = screen.getByRole('button', { name: /string 1, fret 2.*outside active zone/i });
      fireEvent.click(outsideNote);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Click rejected:',
        expect.objectContaining({
          reason: 'Note is outside highlight zone',
        })
      );
      
      // Click inside zone - should log normal click
      const zoneNote = screen.getByRole('button', { name: /string 1, fret 0.*in highlighted zone/i });
      fireEvent.click(zoneNote);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Note clicked:',
        expect.objectContaining({
          string: 1,
          fret: 0,
        })
      );
      
      consoleSpy.mockRestore();
    });
  });
});
