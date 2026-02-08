import { describe, it, expect, beforeEach } from 'vitest';
import { HighlightZone, NotePosition } from '../../core/zones/HighlightZone';
import { Note } from '../../core/music-theory/Note';

describe('HighlightZone', () => {
  let zone: HighlightZone;

  beforeEach(() => {
    zone = new HighlightZone();
  });

  describe('constructor', () => {
    it('should create an empty zone', () => {
      expect(zone.isEmpty()).toBe(true);
      expect(zone.size()).toBe(0);
    });

    it('should create a zone with a name', () => {
      const namedZone = new HighlightZone('Test Zone');
      expect(namedZone.name).toBe('Test Zone');
    });

    it('should create a zone without a name', () => {
      expect(zone.name).toBeUndefined();
    });
  });

  describe('addNote', () => {
    it('should add a valid note position', () => {
      const result = zone.addNote(1, 5);
      expect(result).toBe(true);
      expect(zone.size()).toBe(1);
    });

    it('should return false when adding duplicate position', () => {
      zone.addNote(1, 5);
      const result = zone.addNote(1, 5);
      expect(result).toBe(false);
      expect(zone.size()).toBe(1);
    });

    it('should add multiple different positions', () => {
      zone.addNote(1, 0);
      zone.addNote(2, 3);
      zone.addNote(6, 24);
      expect(zone.size()).toBe(3);
    });

    it('should reject invalid string number (0)', () => {
      const result = zone.addNote(0, 5);
      expect(result).toBe(false);
      expect(zone.size()).toBe(0);
    });

    it('should reject invalid string number (7)', () => {
      const result = zone.addNote(7, 5);
      expect(result).toBe(false);
      expect(zone.size()).toBe(0);
    });

    it('should reject negative string number', () => {
      const result = zone.addNote(-1, 5);
      expect(result).toBe(false);
      expect(zone.size()).toBe(0);
    });

    it('should reject invalid fret number (negative)', () => {
      const result = zone.addNote(1, -1);
      expect(result).toBe(false);
      expect(zone.size()).toBe(0);
    });

    it('should reject invalid fret number (25)', () => {
      const result = zone.addNote(1, 25);
      expect(result).toBe(false);
      expect(zone.size()).toBe(0);
    });

    it('should accept fret 0 (open string)', () => {
      const result = zone.addNote(1, 0);
      expect(result).toBe(true);
      expect(zone.containsNote(1, 0)).toBe(true);
    });

    it('should accept fret 24', () => {
      const result = zone.addNote(1, 24);
      expect(result).toBe(true);
      expect(zone.containsNote(1, 24)).toBe(true);
    });

    it('should accept all valid strings (1-6)', () => {
      for (let s = 1; s <= 6; s++) {
        const result = zone.addNote(s, 0);
        expect(result).toBe(true);
      }
      expect(zone.size()).toBe(6);
    });

    it('should reject non-integer string', () => {
      const result = zone.addNote(1.5, 5);
      expect(result).toBe(false);
    });

    it('should reject non-integer fret', () => {
      const result = zone.addNote(1, 5.5);
      expect(result).toBe(false);
    });
  });

  describe('addNoteFromNote', () => {
    it('should add a note using Note object', () => {
      const note = new Note('C', 4, 2, 5);
      const result = zone.addNoteFromNote(note);
      expect(result).toBe(true);
      expect(zone.containsNote(2, 5)).toBe(true);
    });

    it('should return false for duplicate Note', () => {
      const note = new Note('C', 4, 2, 5);
      zone.addNoteFromNote(note);
      const result = zone.addNoteFromNote(note);
      expect(result).toBe(false);
    });
  });

  describe('removeNote', () => {
    it('should remove an existing note', () => {
      zone.addNote(1, 5);
      const result = zone.removeNote(1, 5);
      expect(result).toBe(true);
      expect(zone.size()).toBe(0);
    });

    it('should return false when removing non-existent note', () => {
      const result = zone.removeNote(1, 5);
      expect(result).toBe(false);
    });

    it('should remove only the specified note', () => {
      zone.addNote(1, 5);
      zone.addNote(2, 3);
      zone.removeNote(1, 5);
      expect(zone.size()).toBe(1);
      expect(zone.containsNote(2, 3)).toBe(true);
    });
  });

  describe('removeNoteFromNote', () => {
    it('should remove a note using Note object', () => {
      const note = new Note('C', 4, 2, 5);
      zone.addNoteFromNote(note);
      const result = zone.removeNoteFromNote(note);
      expect(result).toBe(true);
      expect(zone.isEmpty()).toBe(true);
    });

    it('should return false for non-existent Note', () => {
      const note = new Note('C', 4, 2, 5);
      const result = zone.removeNoteFromNote(note);
      expect(result).toBe(false);
    });
  });

  describe('containsNote', () => {
    it('should return true for existing note', () => {
      zone.addNote(1, 5);
      expect(zone.containsNote(1, 5)).toBe(true);
    });

    it('should return false for non-existent note', () => {
      expect(zone.containsNote(1, 5)).toBe(false);
    });

    it('should return false after note is removed', () => {
      zone.addNote(1, 5);
      zone.removeNote(1, 5);
      expect(zone.containsNote(1, 5)).toBe(false);
    });

    it('should distinguish between different positions', () => {
      zone.addNote(1, 5);
      expect(zone.containsNote(1, 5)).toBe(true);
      expect(zone.containsNote(1, 6)).toBe(false);
      expect(zone.containsNote(2, 5)).toBe(false);
    });
  });

  describe('containsNoteFromNote', () => {
    it('should return true for existing Note', () => {
      const note = new Note('C', 4, 2, 5);
      zone.addNoteFromNote(note);
      expect(zone.containsNoteFromNote(note)).toBe(true);
    });

    it('should return true for Note at same position', () => {
      const note1 = new Note('C', 4, 2, 5);
      const note2 = new Note('D', 5, 2, 5); // Different pitch, same position
      zone.addNoteFromNote(note1);
      expect(zone.containsNoteFromNote(note2)).toBe(true);
    });

    it('should return false for Note at different position', () => {
      const note1 = new Note('C', 4, 2, 5);
      const note2 = new Note('C', 4, 3, 5); // Same pitch class, different string
      zone.addNoteFromNote(note1);
      expect(zone.containsNoteFromNote(note2)).toBe(false);
    });
  });

  describe('getAllNotes', () => {
    it('should return empty array for empty zone', () => {
      expect(zone.getAllNotes()).toEqual([]);
    });

    it('should return all added positions', () => {
      zone.addNote(1, 0);
      zone.addNote(3, 5);
      zone.addNote(6, 12);
      
      const notes = zone.getAllNotes();
      expect(notes.length).toBe(3);
    });

    it('should return positions sorted by string then fret', () => {
      zone.addNote(3, 5);
      zone.addNote(1, 12);
      zone.addNote(1, 0);
      zone.addNote(3, 2);
      
      const notes = zone.getAllNotes();
      expect(notes).toEqual([
        { string: 1, fret: 0 },
        { string: 1, fret: 12 },
        { string: 3, fret: 2 },
        { string: 3, fret: 5 }
      ]);
    });

    it('should return correct NotePosition objects', () => {
      zone.addNote(2, 7);
      const notes = zone.getAllNotes();
      expect(notes[0]).toHaveProperty('string', 2);
      expect(notes[0]).toHaveProperty('fret', 7);
    });
  });

  describe('getAllPositionIds', () => {
    it('should return empty array for empty zone', () => {
      expect(zone.getAllPositionIds()).toEqual([]);
    });

    it('should return all position IDs', () => {
      zone.addNote(1, 5);
      zone.addNote(2, 3);
      
      const ids = zone.getAllPositionIds();
      expect(ids).toContain('s1f5');
      expect(ids).toContain('s2f3');
    });

    it('should return sorted position IDs', () => {
      zone.addNote(2, 3);
      zone.addNote(1, 5);
      
      const ids = zone.getAllPositionIds();
      expect(ids[0]).toBe('s1f5');
      expect(ids[1]).toBe('s2f3');
    });
  });

  describe('size', () => {
    it('should return 0 for empty zone', () => {
      expect(zone.size()).toBe(0);
    });

    it('should return correct count after adds', () => {
      zone.addNote(1, 0);
      zone.addNote(2, 3);
      zone.addNote(3, 5);
      expect(zone.size()).toBe(3);
    });

    it('should return correct count after remove', () => {
      zone.addNote(1, 0);
      zone.addNote(2, 3);
      zone.removeNote(1, 0);
      expect(zone.size()).toBe(1);
    });
  });

  describe('isEmpty', () => {
    it('should return true for new zone', () => {
      expect(zone.isEmpty()).toBe(true);
    });

    it('should return false after adding note', () => {
      zone.addNote(1, 0);
      expect(zone.isEmpty()).toBe(false);
    });

    it('should return true after removing all notes', () => {
      zone.addNote(1, 0);
      zone.removeNote(1, 0);
      expect(zone.isEmpty()).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all notes', () => {
      zone.addNote(1, 0);
      zone.addNote(2, 3);
      zone.addNote(3, 5);
      
      zone.clear();
      expect(zone.isEmpty()).toBe(true);
      expect(zone.size()).toBe(0);
    });

    it('should not throw on empty zone', () => {
      expect(() => zone.clear()).not.toThrow();
    });
  });

  describe('clone', () => {
    it('should create independent copy', () => {
      zone.addNote(1, 5);
      zone.addNote(2, 3);
      
      const cloned = zone.clone();
      expect(cloned.size()).toBe(2);
      expect(cloned.containsNote(1, 5)).toBe(true);
      expect(cloned.containsNote(2, 3)).toBe(true);
    });

    it('should not affect original when modifying clone', () => {
      zone.addNote(1, 5);
      const cloned = zone.clone();
      
      cloned.addNote(3, 7);
      cloned.removeNote(1, 5);
      
      expect(zone.size()).toBe(1);
      expect(zone.containsNote(1, 5)).toBe(true);
      expect(zone.containsNote(3, 7)).toBe(false);
    });

    it('should preserve zone name', () => {
      const namedZone = new HighlightZone('Original');
      namedZone.addNote(1, 0);
      const cloned = namedZone.clone();
      expect(cloned.name).toBe('Original');
    });
  });

  describe('merge', () => {
    it('should add all notes from another zone', () => {
      zone.addNote(1, 0);
      
      const other = new HighlightZone();
      other.addNote(2, 3);
      other.addNote(3, 5);
      
      zone.merge(other);
      expect(zone.size()).toBe(3);
      expect(zone.containsNote(1, 0)).toBe(true);
      expect(zone.containsNote(2, 3)).toBe(true);
      expect(zone.containsNote(3, 5)).toBe(true);
    });

    it('should handle duplicate positions gracefully', () => {
      zone.addNote(1, 0);
      zone.addNote(2, 3);
      
      const other = new HighlightZone();
      other.addNote(2, 3); // Duplicate
      other.addNote(3, 5);
      
      zone.merge(other);
      expect(zone.size()).toBe(3);
    });

    it('should not modify the source zone', () => {
      const other = new HighlightZone();
      other.addNote(2, 3);
      
      zone.merge(other);
      zone.addNote(4, 7);
      
      expect(other.size()).toBe(1);
      expect(other.containsNote(4, 7)).toBe(false);
    });
  });

  describe('intersection', () => {
    it('should return common positions', () => {
      zone.addNote(1, 0);
      zone.addNote(2, 3);
      zone.addNote(3, 5);
      
      const other = new HighlightZone();
      other.addNote(2, 3);
      other.addNote(3, 5);
      other.addNote(4, 7);
      
      const result = zone.intersection(other);
      expect(result.size()).toBe(2);
      expect(result.containsNote(2, 3)).toBe(true);
      expect(result.containsNote(3, 5)).toBe(true);
    });

    it('should return empty zone when no common positions', () => {
      zone.addNote(1, 0);
      
      const other = new HighlightZone();
      other.addNote(2, 3);
      
      const result = zone.intersection(other);
      expect(result.isEmpty()).toBe(true);
    });

    it('should not modify original zones', () => {
      zone.addNote(1, 0);
      zone.addNote(2, 3);
      
      const other = new HighlightZone();
      other.addNote(2, 3);
      
      const result = zone.intersection(other);
      
      expect(zone.size()).toBe(2);
      expect(other.size()).toBe(1);
    });
  });

  describe('equals', () => {
    it('should return true for zones with same positions', () => {
      zone.addNote(1, 0);
      zone.addNote(2, 3);
      
      const other = new HighlightZone();
      other.addNote(1, 0);
      other.addNote(2, 3);
      
      expect(zone.equals(other)).toBe(true);
    });

    it('should return true for both empty zones', () => {
      const other = new HighlightZone();
      expect(zone.equals(other)).toBe(true);
    });

    it('should return false for zones with different sizes', () => {
      zone.addNote(1, 0);
      zone.addNote(2, 3);
      
      const other = new HighlightZone();
      other.addNote(1, 0);
      
      expect(zone.equals(other)).toBe(false);
    });

    it('should return false for zones with different positions', () => {
      zone.addNote(1, 0);
      
      const other = new HighlightZone();
      other.addNote(2, 3);
      
      expect(zone.equals(other)).toBe(false);
    });

    it('should ignore zone names when comparing', () => {
      const zone1 = new HighlightZone('Zone 1');
      zone1.addNote(1, 0);
      
      const zone2 = new HighlightZone('Zone 2');
      zone2.addNote(1, 0);
      
      expect(zone1.equals(zone2)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle all fret positions on all strings', () => {
      // Add all 150 positions (6 strings × 25 frets including open)
      for (let s = 1; s <= 6; s++) {
        for (let f = 0; f <= 24; f++) {
          zone.addNote(s, f);
        }
      }
      expect(zone.size()).toBe(150);
    });

    it('should handle rapid add/remove cycles', () => {
      for (let i = 0; i < 100; i++) {
        zone.addNote(1, 5);
        zone.removeNote(1, 5);
      }
      expect(zone.isEmpty()).toBe(true);
    });

    it('should maintain consistency after many operations', () => {
      // Add notes
      zone.addNote(1, 0);
      zone.addNote(2, 3);
      zone.addNote(3, 5);
      
      // Remove one
      zone.removeNote(2, 3);
      
      // Add more
      zone.addNote(4, 7);
      zone.addNote(5, 9);
      
      // Clear and rebuild
      zone.clear();
      zone.addNote(6, 12);
      
      expect(zone.size()).toBe(1);
      expect(zone.containsNote(6, 12)).toBe(true);
      expect(zone.containsNote(1, 0)).toBe(false);
    });
  });
});
