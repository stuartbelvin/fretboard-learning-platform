import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FretboardDisplay, ZoneConfig, ZONE_COLORS } from '../../components/fretboard/FretboardDisplay';
import { HighlightZone } from '../../core/zones/HighlightZone';
import '@testing-library/jest-dom';

describe('Zone Visual Rendering (HLZ-002)', () => {
  let zone: HighlightZone;
  let zoneConfig: ZoneConfig;

  beforeEach(() => {
    zone = new HighlightZone('Test Zone');
    // Add some notes to the zone
    zone.addNote(1, 0);  // Open high E
    zone.addNote(1, 3);  // G on high E
    zone.addNote(2, 1);  // C on B string
    
    zoneConfig = {
      zone,
      color: ZONE_COLORS.blue,
      opacity: 0.3,
      label: 'Test Zone',
    };
  });

  describe('ZONE_COLORS constant', () => {
    it('should define all 8 predefined zone colors', () => {
      expect(ZONE_COLORS).toHaveProperty('blue');
      expect(ZONE_COLORS).toHaveProperty('green');
      expect(ZONE_COLORS).toHaveProperty('red');
      expect(ZONE_COLORS).toHaveProperty('purple');
      expect(ZONE_COLORS).toHaveProperty('orange');
      expect(ZONE_COLORS).toHaveProperty('yellow');
      expect(ZONE_COLORS).toHaveProperty('cyan');
      expect(ZONE_COLORS).toHaveProperty('pink');
    });

    it('should have valid RGBA color strings for all colors', () => {
      Object.values(ZONE_COLORS).forEach((color) => {
        expect(color).toMatch(/^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/);
      });
    });
  });

  describe('ZoneConfig interface', () => {
    it('should accept a HighlightZone', () => {
      const config: ZoneConfig = { zone };
      expect(config.zone).toBe(zone);
    });

    it('should accept optional color', () => {
      const config: ZoneConfig = { zone, color: ZONE_COLORS.green };
      expect(config.color).toBe(ZONE_COLORS.green);
    });

    it('should accept optional opacity', () => {
      const config: ZoneConfig = { zone, opacity: 0.5 };
      expect(config.opacity).toBe(0.5);
    });

    it('should accept optional label', () => {
      const config: ZoneConfig = { zone, label: 'My Zone' };
      expect(config.label).toBe('My Zone');
    });
  });

  describe('FretboardDisplay with highlightZones prop', () => {
    it('should render without highlight zones', () => {
      render(<FretboardDisplay visibleFrets={5} />);
      expect(screen.getByRole('button', { name: /string 1, fret 0/i })).toBeInTheDocument();
    });

    it('should render with an empty highlight zones array', () => {
      render(<FretboardDisplay visibleFrets={5} highlightZones={[]} />);
      expect(screen.getByRole('button', { name: /string 1, fret 0/i })).toBeInTheDocument();
    });

    it('should render with a single highlight zone', () => {
      render(<FretboardDisplay visibleFrets={5} highlightZones={[zoneConfig]} />);
      
      // Check that notes in the zone have the 'in highlighted zone' aria label
      const zoneNote = screen.getByRole('button', { name: /string 1, fret 0.*in highlighted zone/i });
      expect(zoneNote).toBeInTheDocument();
    });

    it('should add zone-highlight class to note cells in zone', () => {
      const { container } = render(
        <FretboardDisplay visibleFrets={5} highlightZones={[zoneConfig]} />
      );
      
      // Check that the note cell has the zone-highlight class
      const zoneCells = container.querySelectorAll('.note-cell.zone-highlight');
      expect(zoneCells.length).toBe(3); // We added 3 notes to the zone
    });

    it('should add in-zone class to note buttons in zone', () => {
      const { container } = render(
        <FretboardDisplay visibleFrets={5} highlightZones={[zoneConfig]} />
      );
      
      const zoneButtons = container.querySelectorAll('.note-button.in-zone');
      expect(zoneButtons.length).toBe(3);
    });

    it('should not add zone classes to notes outside zone', () => {
      const { container } = render(
        <FretboardDisplay visibleFrets={5} highlightZones={[zoneConfig]} />
      );
      
      // String 1, fret 1 is NOT in the zone
      const noteCell = container.querySelector('[data-string="1"][data-fret="1"]');
      expect(noteCell).not.toHaveClass('zone-highlight');
    });
  });

  describe('Multiple highlight zones', () => {
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

    it('should render multiple zones simultaneously', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig, zoneConfig2]} 
        />
      );
      
      const zoneCells = container.querySelectorAll('.note-cell.zone-highlight');
      // 3 from zone1 + 2 from zone2 = 5 total
      expect(zoneCells.length).toBe(5);
    });

    it('should mark notes in multiple zones with multi-zone class', () => {
      // Create overlapping zones
      zone2.addNote(1, 0); // This note is also in zone1
      
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig, zoneConfig2]} 
        />
      );
      
      const multiZoneButtons = container.querySelectorAll('.note-button.multi-zone');
      expect(multiZoneButtons.length).toBe(1); // Only the overlapping note
    });

    it('should set data-zone-count attribute', () => {
      // Create overlapping zones
      zone2.addNote(1, 0); // This note is also in zone1
      
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={5} 
          highlightZones={[zoneConfig, zoneConfig2]} 
        />
      );
      
      const overlappingCell = container.querySelector('[data-string="1"][data-fret="0"]');
      expect(overlappingCell).toHaveAttribute('data-zone-count', '2');
    });
  });

  describe('Zone note display filtering', () => {
    it('should show all note names when showNoteNames=true and showZoneNotesOnly=false', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={5} 
          showNoteNames={true}
          showZoneNotesOnly={false}
          highlightZones={[zoneConfig]} 
        />
      );
      
      // All notes should have names, not just zone notes
      const noteNames = container.querySelectorAll('.note-name');
      expect(noteNames.length).toBeGreaterThan(3); // More than just zone notes
    });

    it('should show only zone note names when showZoneNotesOnly=true', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={5} 
          showNoteNames={true}
          showZoneNotesOnly={true}
          highlightZones={[zoneConfig]} 
        />
      );
      
      // Only zone notes should have names
      const noteNames = container.querySelectorAll('.note-name');
      expect(noteNames.length).toBe(3); // Only the 3 zone notes
    });

    it('should not show any note names when showNoteNames=false', () => {
      const { container } = render(
        <FretboardDisplay 
          visibleFrets={5} 
          showNoteNames={false}
          showZoneNotesOnly={true}
          highlightZones={[zoneConfig]} 
        />
      );
      
      const noteNames = container.querySelectorAll('.note-name');
      expect(noteNames.length).toBe(0);
    });
  });

  describe('Zone styling via CSS custom properties', () => {
    it('should apply zone-highlight-color CSS custom property', () => {
      const customConfig: ZoneConfig = {
        zone,
        color: 'rgba(255, 0, 0, 0.5)',
      };
      
      const { container } = render(
        <FretboardDisplay visibleFrets={5} highlightZones={[customConfig]} />
      );
      
      const zoneCell = container.querySelector('.note-cell.zone-highlight') as HTMLElement;
      expect(zoneCell.style.getPropertyValue('--zone-highlight-color')).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('should apply zone-highlight-opacity CSS custom property', () => {
      const customConfig: ZoneConfig = {
        zone,
        opacity: 0.7,
      };
      
      const { container } = render(
        <FretboardDisplay visibleFrets={5} highlightZones={[customConfig]} />
      );
      
      const zoneCell = container.querySelector('.note-cell.zone-highlight') as HTMLElement;
      expect(zoneCell.style.getPropertyValue('--zone-highlight-opacity')).toBe('0.7');
    });

    it('should use default blue color when no color specified', () => {
      const minimalConfig: ZoneConfig = { zone };
      
      const { container } = render(
        <FretboardDisplay visibleFrets={5} highlightZones={[minimalConfig]} />
      );
      
      const zoneCell = container.querySelector('.note-cell.zone-highlight') as HTMLElement;
      expect(zoneCell.style.getPropertyValue('--zone-highlight-color')).toBe(ZONE_COLORS.blue);
    });

    it('should use default 0.3 opacity when no opacity specified', () => {
      const minimalConfig: ZoneConfig = { zone };
      
      const { container } = render(
        <FretboardDisplay visibleFrets={5} highlightZones={[minimalConfig]} />
      );
      
      const zoneCell = container.querySelector('.note-cell.zone-highlight') as HTMLElement;
      expect(zoneCell.style.getPropertyValue('--zone-highlight-opacity')).toBe('0.3');
    });
  });

  describe('Accessibility', () => {
    it('should include zone status in aria-label', () => {
      render(<FretboardDisplay visibleFrets={5} highlightZones={[zoneConfig]} />);
      
      // All notes in zone should mention "in highlighted zone"
      const zoneNotes = screen.getAllByRole('button', { name: /in highlighted zone/i });
      expect(zoneNotes.length).toBe(3); // We have 3 notes in the zone
    });

    it('should not include zone status for notes outside zone', () => {
      render(<FretboardDisplay visibleFrets={5} highlightZones={[zoneConfig]} />);
      
      // String 1, fret 2 is not in the zone
      const outsideNote = screen.getByRole('button', { name: /string 1, fret 2$/i });
      expect(outsideNote).toBeInTheDocument();
      expect(outsideNote.getAttribute('aria-label')).not.toContain('in highlighted zone');
    });
  });

  describe('Zone visibility within viewport', () => {
    it('should only highlight visible zone notes within viewport', () => {
      const wideZone = new HighlightZone();
      // Add notes across the full fretboard
      wideZone.addNote(1, 0);
      wideZone.addNote(1, 5);
      wideZone.addNote(1, 10);
      wideZone.addNote(1, 15);
      wideZone.addNote(1, 20);
      
      const { container } = render(
        <FretboardDisplay 
          startFret={5} 
          visibleFrets={7} // Shows frets 5-11
          highlightZones={[{ zone: wideZone }]} 
        />
      );
      
      // Only frets 5 and 10 should be visible and highlighted
      const zoneCells = container.querySelectorAll('.note-cell.zone-highlight');
      expect(zoneCells.length).toBe(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty zone gracefully', () => {
      const emptyZone = new HighlightZone('Empty');
      
      const { container } = render(
        <FretboardDisplay visibleFrets={5} highlightZones={[{ zone: emptyZone }]} />
      );
      
      const zoneCells = container.querySelectorAll('.note-cell.zone-highlight');
      expect(zoneCells.length).toBe(0);
    });

    it('should handle zone with notes outside visible viewport', () => {
      const farZone = new HighlightZone();
      farZone.addNote(1, 20);
      farZone.addNote(1, 21);
      
      const { container } = render(
        <FretboardDisplay 
          startFret={0} 
          visibleFrets={5} // Only shows frets 0-4
          highlightZones={[{ zone: farZone }]} 
        />
      );
      
      const zoneCells = container.querySelectorAll('.note-cell.zone-highlight');
      expect(zoneCells.length).toBe(0);
    });
  });
});
