import { describe, it, expect, beforeEach } from 'vitest';
import { HighlightZone, HighlightZoneJSON } from '../../core/zones/HighlightZone';
import { createRectangleZone, CustomZoneBuilder } from '../../core/zones/ZoneShapeUtilities';

describe('Zone Serialization (HLZ-005)', () => {
  let zone: HighlightZone;

  beforeEach(() => {
    zone = new HighlightZone('Test Zone');
    zone.addNote(1, 5);
    zone.addNote(2, 7);
    zone.addNote(3, 3);
  });

  // ============================================================
  // toJSON / fromJSON Tests
  // ============================================================
  describe('toJSON', () => {
    it('should return a valid JSON object', () => {
      const json = zone.toJSON();
      expect(json).toHaveProperty('version');
      expect(json).toHaveProperty('name');
      expect(json).toHaveProperty('positions');
    });

    it('should include the serialization version', () => {
      const json = zone.toJSON();
      expect(json.version).toBe(HighlightZone.SERIALIZATION_VERSION);
      expect(json.version).toBe(1);
    });

    it('should include the zone name', () => {
      const json = zone.toJSON();
      expect(json.name).toBe('Test Zone');
    });

    it('should handle undefined name', () => {
      const unnamedZone = new HighlightZone();
      unnamedZone.addNote(1, 0);
      const json = unnamedZone.toJSON();
      expect(json.name).toBeUndefined();
    });

    it('should include all positions as NotePosition objects', () => {
      const json = zone.toJSON();
      expect(json.positions).toHaveLength(3);
      expect(json.positions).toContainEqual({ string: 1, fret: 5 });
      expect(json.positions).toContainEqual({ string: 2, fret: 7 });
      expect(json.positions).toContainEqual({ string: 3, fret: 3 });
    });

    it('should return positions in sorted order', () => {
      const json = zone.toJSON();
      expect(json.positions[0]).toEqual({ string: 1, fret: 5 });
      expect(json.positions[1]).toEqual({ string: 2, fret: 7 });
      expect(json.positions[2]).toEqual({ string: 3, fret: 3 });
    });

    it('should handle empty zone', () => {
      const emptyZone = new HighlightZone('Empty');
      const json = emptyZone.toJSON();
      expect(json.positions).toEqual([]);
      expect(json.name).toBe('Empty');
    });
  });

  describe('fromJSON', () => {
    it('should recreate a zone from JSON object', () => {
      const json = zone.toJSON();
      const restored = HighlightZone.fromJSON(json);
      expect(restored.equals(zone)).toBe(true);
    });

    it('should preserve the zone name', () => {
      const json = zone.toJSON();
      const restored = HighlightZone.fromJSON(json);
      expect(restored.name).toBe('Test Zone');
    });

    it('should handle undefined name', () => {
      const json: HighlightZoneJSON = {
        version: 1,
        positions: [{ string: 1, fret: 0 }]
      };
      const restored = HighlightZone.fromJSON(json);
      expect(restored.name).toBeUndefined();
    });

    it('should throw error for null input', () => {
      expect(() => HighlightZone.fromJSON(null)).toThrow('Invalid zone JSON: expected an object');
    });

    it('should throw error for non-object input', () => {
      expect(() => HighlightZone.fromJSON('string')).toThrow('Invalid zone JSON: expected an object');
      expect(() => HighlightZone.fromJSON(123)).toThrow('Invalid zone JSON: expected an object');
    });

    it('should throw error for missing version', () => {
      expect(() => HighlightZone.fromJSON({ positions: [] })).toThrow('Invalid zone JSON: missing or invalid version');
    });

    it('should throw error for invalid version', () => {
      expect(() => HighlightZone.fromJSON({ version: 0, positions: [] })).toThrow('Invalid zone JSON: missing or invalid version');
      expect(() => HighlightZone.fromJSON({ version: -1, positions: [] })).toThrow('Invalid zone JSON: missing or invalid version');
    });

    it('should throw error for missing positions', () => {
      expect(() => HighlightZone.fromJSON({ version: 1 })).toThrow('Invalid zone JSON: positions must be an array');
    });

    it('should throw error for non-array positions', () => {
      expect(() => HighlightZone.fromJSON({ version: 1, positions: 'not array' })).toThrow('Invalid zone JSON: positions must be an array');
    });

    it('should throw error for invalid position object', () => {
      expect(() => HighlightZone.fromJSON({ version: 1, positions: [null] })).toThrow('Invalid zone JSON: position must be an object');
      expect(() => HighlightZone.fromJSON({ version: 1, positions: ['string'] })).toThrow('Invalid zone JSON: position must be an object');
    });

    it('should throw error for position missing string property', () => {
      expect(() => HighlightZone.fromJSON({ version: 1, positions: [{ fret: 5 }] })).toThrow('Invalid zone JSON: position must have numeric string and fret properties');
    });

    it('should throw error for position missing fret property', () => {
      expect(() => HighlightZone.fromJSON({ version: 1, positions: [{ string: 1 }] })).toThrow('Invalid zone JSON: position must have numeric string and fret properties');
    });

    it('should throw error for out-of-bounds position', () => {
      expect(() => HighlightZone.fromJSON({ version: 1, positions: [{ string: 0, fret: 5 }] })).toThrow('out of bounds');
      expect(() => HighlightZone.fromJSON({ version: 1, positions: [{ string: 1, fret: 25 }] })).toThrow('out of bounds');
    });

    it('should handle duplicate positions gracefully', () => {
      const json: HighlightZoneJSON = {
        version: 1,
        name: 'Duplicates',
        positions: [
          { string: 1, fret: 5 },
          { string: 1, fret: 5 },
          { string: 2, fret: 3 }
        ]
      };
      const restored = HighlightZone.fromJSON(json);
      expect(restored.size()).toBe(2); // Duplicates are removed
    });

    it('should warn but not throw for future version', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const json = { version: 999, positions: [{ string: 1, fret: 5 }] };
      const restored = HighlightZone.fromJSON(json);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('newer than supported'));
      expect(restored.size()).toBe(1);
      consoleSpy.mockRestore();
    });
  });

  // ============================================================
  // toJSONString / fromJSONString Tests
  // ============================================================
  describe('toJSONString', () => {
    it('should return a valid JSON string', () => {
      const jsonString = zone.toJSONString();
      expect(() => JSON.parse(jsonString)).not.toThrow();
    });

    it('should produce parseable JSON that matches toJSON', () => {
      const jsonString = zone.toJSONString();
      const parsed = JSON.parse(jsonString);
      expect(parsed).toEqual(zone.toJSON());
    });

    it('should support pretty formatting', () => {
      const compact = zone.toJSONString(false);
      const pretty = zone.toJSONString(true);
      expect(pretty.length).toBeGreaterThan(compact.length);
      expect(pretty).toContain('\n');
    });
  });

  describe('fromJSONString', () => {
    it('should recreate a zone from JSON string', () => {
      const jsonString = zone.toJSONString();
      const restored = HighlightZone.fromJSONString(jsonString);
      expect(restored.equals(zone)).toBe(true);
    });

    it('should throw error for invalid JSON string', () => {
      expect(() => HighlightZone.fromJSONString('not json')).toThrow('Invalid zone JSON string');
      expect(() => HighlightZone.fromJSONString('{invalid}')).toThrow('Invalid zone JSON string');
    });

    it('should throw error for valid JSON but invalid structure', () => {
      expect(() => HighlightZone.fromJSONString('{"foo": "bar"}')).toThrow('Invalid zone JSON');
    });
  });

  // ============================================================
  // Round-trip Serialization Tests
  // ============================================================
  describe('round-trip serialization', () => {
    it('should preserve exact zone through JSON round-trip', () => {
      const jsonString = zone.toJSONString();
      const restored = HighlightZone.fromJSONString(jsonString);
      
      expect(restored.name).toBe(zone.name);
      expect(restored.size()).toBe(zone.size());
      expect(restored.equals(zone)).toBe(true);
    });

    it('should preserve large zone through round-trip', () => {
      const largeZone = createRectangleZone({
        startString: 1,
        endString: 6,
        startFret: 0,
        endFret: 12,
        name: 'Large Zone'
      });
      
      const jsonString = largeZone.toJSONString();
      const restored = HighlightZone.fromJSONString(jsonString);
      
      expect(restored.size()).toBe(78); // 6 strings × 13 frets
      expect(restored.equals(largeZone)).toBe(true);
    });

    it('should preserve custom zone with non-contiguous positions', () => {
      const customZone = new CustomZoneBuilder('Custom')
        .add(1, 0)
        .add(3, 5)
        .add(5, 12)
        .add(6, 24)
        .build();

      const jsonString = customZone.toJSONString();
      const restored = HighlightZone.fromJSONString(jsonString);
      
      expect(restored.equals(customZone)).toBe(true);
      expect(restored.containsNote(1, 0)).toBe(true);
      expect(restored.containsNote(3, 5)).toBe(true);
      expect(restored.containsNote(5, 12)).toBe(true);
      expect(restored.containsNote(6, 24)).toBe(true);
    });

    it('should preserve empty zone through round-trip', () => {
      const emptyZone = new HighlightZone('Empty');
      const jsonString = emptyZone.toJSONString();
      const restored = HighlightZone.fromJSONString(jsonString);
      
      expect(restored.name).toBe('Empty');
      expect(restored.isEmpty()).toBe(true);
    });
  });

  // ============================================================
  // URL Encoding Tests (Base64)
  // ============================================================
  describe('toURLString', () => {
    it('should return a URL-safe Base64 string', () => {
      const urlString = zone.toURLString();
      // Base64 strings contain only alphanumeric, +, /, and =
      expect(urlString).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('should be decodable back to JSON', () => {
      const urlString = zone.toURLString();
      const decoded = atob(urlString);
      expect(() => JSON.parse(decoded)).not.toThrow();
    });
  });

  describe('fromURLString', () => {
    it('should recreate zone from URL string', () => {
      const urlString = zone.toURLString();
      const restored = HighlightZone.fromURLString(urlString);
      expect(restored.equals(zone)).toBe(true);
    });

    it('should throw error for invalid Base64', () => {
      expect(() => HighlightZone.fromURLString('not-valid-base64!!!')).toThrow();
    });

    it('should throw error for valid Base64 but invalid JSON', () => {
      const invalidBase64 = btoa('not json');
      expect(() => HighlightZone.fromURLString(invalidBase64)).toThrow();
    });
  });

  describe('URL round-trip', () => {
    it('should preserve exact zone through URL round-trip', () => {
      const urlString = zone.toURLString();
      const restored = HighlightZone.fromURLString(urlString);
      
      expect(restored.name).toBe(zone.name);
      expect(restored.size()).toBe(zone.size());
      expect(restored.equals(zone)).toBe(true);
    });

    it('should work with special characters in zone name', () => {
      const specialZone = new HighlightZone('Test & Zone <with> "special" chars');
      specialZone.addNote(1, 5);
      
      const urlString = specialZone.toURLString();
      const restored = HighlightZone.fromURLString(urlString);
      
      expect(restored.name).toBe('Test & Zone <with> "special" chars');
    });

    it('should work with unicode in zone name', () => {
      const unicodeZone = new HighlightZone('Zone 🎸 Guitar');
      unicodeZone.addNote(2, 3);
      
      const urlString = unicodeZone.toURLString();
      const restored = HighlightZone.fromURLString(urlString);
      
      expect(restored.name).toBe('Zone 🎸 Guitar');
    });
  });

  // ============================================================
  // Compact URL Encoding Tests
  // ============================================================
  describe('toCompactURLString', () => {
    it('should return a URL-safe compact string', () => {
      const compact = zone.toCompactURLString();
      // Should not contain characters that need URL encoding (except what we explicitly encode)
      expect(compact).toMatch(/^v\d+:[^:]*:[a-z0-9,f]*$/i);
    });

    it('should include version prefix', () => {
      const compact = zone.toCompactURLString();
      expect(compact.startsWith('v1:')).toBe(true);
    });

    it('should include URL-encoded name', () => {
      const compact = zone.toCompactURLString();
      expect(compact).toContain('Test%20Zone');
    });

    it('should include positions as comma-separated IDs', () => {
      const compact = zone.toCompactURLString();
      expect(compact).toContain('s1f5');
      expect(compact).toContain('s2f7');
      expect(compact).toContain('s3f3');
    });

    it('should handle empty name', () => {
      const unnamedZone = new HighlightZone();
      unnamedZone.addNote(1, 0);
      const compact = unnamedZone.toCompactURLString();
      expect(compact).toMatch(/^v1::s1f0$/);
    });

    it('should handle empty positions', () => {
      const emptyZone = new HighlightZone('Empty');
      const compact = emptyZone.toCompactURLString();
      expect(compact).toBe('v1:Empty:');
    });

    it('should be more compact than Base64 for small zones', () => {
      const smallZone = new HighlightZone('Z');
      smallZone.addNote(1, 0);
      
      const compact = smallZone.toCompactURLString();
      const base64 = smallZone.toURLString();
      
      expect(compact.length).toBeLessThan(base64.length);
    });
  });

  describe('fromCompactURLString', () => {
    it('should recreate zone from compact string', () => {
      const compact = zone.toCompactURLString();
      const restored = HighlightZone.fromCompactURLString(compact);
      expect(restored.equals(zone)).toBe(true);
    });

    it('should preserve the zone name', () => {
      const compact = zone.toCompactURLString();
      const restored = HighlightZone.fromCompactURLString(compact);
      expect(restored.name).toBe('Test Zone');
    });

    it('should handle undefined name', () => {
      const unnamedZone = new HighlightZone();
      unnamedZone.addNote(1, 0);
      const compact = unnamedZone.toCompactURLString();
      const restored = HighlightZone.fromCompactURLString(compact);
      expect(restored.name).toBeUndefined();
    });

    it('should throw error for invalid format', () => {
      expect(() => HighlightZone.fromCompactURLString('invalid')).toThrow('wrong format');
      expect(() => HighlightZone.fromCompactURLString('v1')).toThrow('wrong format');
      expect(() => HighlightZone.fromCompactURLString('v1:')).toThrow('wrong format');
    });

    it('should throw error for invalid version', () => {
      expect(() => HighlightZone.fromCompactURLString('v0::s1f5')).toThrow('invalid version');
      expect(() => HighlightZone.fromCompactURLString('v-1::s1f5')).toThrow('wrong format');
    });

    it('should throw error for invalid position format', () => {
      expect(() => HighlightZone.fromCompactURLString('v1::abc')).toThrow('invalid position format');
      expect(() => HighlightZone.fromCompactURLString('v1::1f5')).toThrow('invalid position format');
    });

    it('should throw error for out-of-bounds position', () => {
      expect(() => HighlightZone.fromCompactURLString('v1::s0f5')).toThrow('out of bounds');
      expect(() => HighlightZone.fromCompactURLString('v1::s1f25')).toThrow('out of bounds');
    });

    it('should warn but not throw for future version', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const restored = HighlightZone.fromCompactURLString('v999:Test:s1f5');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('newer than supported'));
      expect(restored.size()).toBe(1);
      consoleSpy.mockRestore();
    });
  });

  describe('compact URL round-trip', () => {
    it('should preserve exact zone through compact URL round-trip', () => {
      const compact = zone.toCompactURLString();
      const restored = HighlightZone.fromCompactURLString(compact);
      
      expect(restored.name).toBe(zone.name);
      expect(restored.size()).toBe(zone.size());
      expect(restored.equals(zone)).toBe(true);
    });

    it('should work with special characters in zone name', () => {
      const specialZone = new HighlightZone('Test & Zone');
      specialZone.addNote(1, 5);
      
      const compact = specialZone.toCompactURLString();
      const restored = HighlightZone.fromCompactURLString(compact);
      
      expect(restored.name).toBe('Test & Zone');
    });

    it('should preserve large zone through compact round-trip', () => {
      const largeZone = createRectangleZone({
        startString: 1,
        endString: 6,
        startFret: 0,
        endFret: 12,
        name: 'Large Zone'
      });
      
      const compact = largeZone.toCompactURLString();
      const restored = HighlightZone.fromCompactURLString(compact);
      
      expect(restored.size()).toBe(78);
      expect(restored.equals(largeZone)).toBe(true);
    });
  });

  // ============================================================
  // Edge Cases
  // ============================================================
  describe('edge cases', () => {
    it('should handle zone with all frets on one string', () => {
      const stringZone = new HighlightZone('String 1');
      for (let fret = 0; fret <= 24; fret++) {
        stringZone.addNote(1, fret);
      }
      
      const restored = HighlightZone.fromJSONString(stringZone.toJSONString());
      expect(restored.size()).toBe(25);
      expect(restored.equals(stringZone)).toBe(true);
    });

    it('should handle zone with all strings on one fret', () => {
      const fretZone = new HighlightZone('Fret 5');
      for (let string = 1; string <= 6; string++) {
        fretZone.addNote(string, 5);
      }
      
      const restored = HighlightZone.fromJSONString(fretZone.toJSONString());
      expect(restored.size()).toBe(6);
      expect(restored.equals(fretZone)).toBe(true);
    });

    it('should handle maximum size zone (all positions)', () => {
      const fullZone = createRectangleZone({
        startString: 1,
        endString: 6,
        startFret: 0,
        endFret: 24,
        name: 'Full Fretboard'
      });
      
      expect(fullZone.size()).toBe(150); // 6 × 25

      // Test JSON round-trip
      const jsonRestored = HighlightZone.fromJSONString(fullZone.toJSONString());
      expect(jsonRestored.size()).toBe(150);
      expect(jsonRestored.equals(fullZone)).toBe(true);

      // Test compact URL round-trip
      const compactRestored = HighlightZone.fromCompactURLString(fullZone.toCompactURLString());
      expect(compactRestored.size()).toBe(150);
      expect(compactRestored.equals(fullZone)).toBe(true);
    });

    it('should handle single position zone', () => {
      const singleZone = new HighlightZone('Single');
      singleZone.addNote(3, 7);
      
      const restored = HighlightZone.fromJSONString(singleZone.toJSONString());
      expect(restored.size()).toBe(1);
      expect(restored.containsNote(3, 7)).toBe(true);
    });

    it('should handle boundary positions', () => {
      const boundaryZone = new HighlightZone('Boundaries');
      boundaryZone.addNote(1, 0);   // Min string, min fret
      boundaryZone.addNote(6, 24);  // Max string, max fret
      boundaryZone.addNote(1, 24);  // Min string, max fret
      boundaryZone.addNote(6, 0);   // Max string, min fret
      
      const restored = HighlightZone.fromJSONString(boundaryZone.toJSONString());
      expect(restored.containsNote(1, 0)).toBe(true);
      expect(restored.containsNote(6, 24)).toBe(true);
      expect(restored.containsNote(1, 24)).toBe(true);
      expect(restored.containsNote(6, 0)).toBe(true);
    });
  });

  // ============================================================
  // Serialization Version Tests
  // ============================================================
  describe('serialization version', () => {
    it('should have a version constant', () => {
      expect(HighlightZone.SERIALIZATION_VERSION).toBeDefined();
      expect(typeof HighlightZone.SERIALIZATION_VERSION).toBe('number');
    });

    it('should include version in toJSON output', () => {
      const json = zone.toJSON();
      expect(json.version).toBe(HighlightZone.SERIALIZATION_VERSION);
    });

    it('should include version in compact string', () => {
      const compact = zone.toCompactURLString();
      expect(compact.startsWith(`v${HighlightZone.SERIALIZATION_VERSION}:`)).toBe(true);
    });
  });
});

// Import vi for mocking
import { vi } from 'vitest';
