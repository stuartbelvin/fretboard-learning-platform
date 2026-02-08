import { Note } from '../music-theory/Note';

/**
 * Represents a position on the fretboard using string and fret numbers.
 */
export interface NotePosition {
  /** String number (1-6, where 1 is the high E string) */
  string: number;
  /** Fret number (0-24, where 0 is the open string) */
  fret: number;
}

/**
 * HighlightZone manages a set of note positions that can be highlighted
 * on the fretboard. Used for quiz constraints and visual highlighting.
 * 
 * Positions are stored as unique position IDs in the format "s{string}f{fret}".
 */
export class HighlightZone {
  /**
   * Internal storage for note positions using position IDs.
   * Uses Set for O(1) lookup, add, and remove operations.
   */
  private positions: Set<string>;

  /**
   * Optional name for the zone (useful for UI and serialization).
   */
  public readonly name?: string;

  constructor(name?: string) {
    this.positions = new Set();
    this.name = name;
  }

  /**
   * Generates a position ID from string and fret numbers.
   */
  private static getPositionId(string: number, fret: number): string {
    return `s${string}f${fret}`;
  }

  /**
   * Parses a position ID back to string and fret numbers.
   */
  private static parsePositionId(positionId: string): NotePosition | null {
    const match = positionId.match(/^s(\d+)f(\d+)$/);
    if (!match) {
      return null;
    }
    return {
      string: parseInt(match[1], 10),
      fret: parseInt(match[2], 10)
    };
  }

  /**
   * Validates that a position is within valid fretboard bounds.
   * @param string String number (1-6)
   * @param fret Fret number (0-24)
   */
  private static isValidPosition(string: number, fret: number): boolean {
    return (
      Number.isInteger(string) &&
      Number.isInteger(fret) &&
      string >= 1 &&
      string <= 6 &&
      fret >= 0 &&
      fret <= 24
    );
  }

  /**
   * Adds a note to the zone by its position.
   * @param string String number (1-6)
   * @param fret Fret number (0-24)
   * @returns true if the note was added, false if already present or invalid
   */
  public addNote(string: number, fret: number): boolean {
    if (!HighlightZone.isValidPosition(string, fret)) {
      return false;
    }
    
    const positionId = HighlightZone.getPositionId(string, fret);
    if (this.positions.has(positionId)) {
      return false;
    }
    
    this.positions.add(positionId);
    return true;
  }

  /**
   * Adds a note to the zone using a Note object.
   * @param note The Note object to add
   * @returns true if the note was added, false if already present or invalid
   */
  public addNoteFromNote(note: Note): boolean {
    return this.addNote(note.string, note.fret);
  }

  /**
   * Removes a note from the zone by its position.
   * @param string String number (1-6)
   * @param fret Fret number (0-24)
   * @returns true if the note was removed, false if not present
   */
  public removeNote(string: number, fret: number): boolean {
    const positionId = HighlightZone.getPositionId(string, fret);
    return this.positions.delete(positionId);
  }

  /**
   * Removes a note from the zone using a Note object.
   * @param note The Note object to remove
   * @returns true if the note was removed, false if not present
   */
  public removeNoteFromNote(note: Note): boolean {
    return this.removeNote(note.string, note.fret);
  }

  /**
   * Checks if a note position is in the zone.
   * @param string String number (1-6)
   * @param fret Fret number (0-24)
   * @returns true if the position is in the zone
   */
  public containsNote(string: number, fret: number): boolean {
    const positionId = HighlightZone.getPositionId(string, fret);
    return this.positions.has(positionId);
  }

  /**
   * Checks if a Note object is in the zone.
   * @param note The Note object to check
   * @returns true if the note position is in the zone
   */
  public containsNoteFromNote(note: Note): boolean {
    return this.containsNote(note.string, note.fret);
  }

  /**
   * Gets all note positions in the zone.
   * @returns Array of NotePosition objects
   */
  public getAllNotes(): NotePosition[] {
    const positions: NotePosition[] = [];
    
    for (const positionId of this.positions) {
      const position = HighlightZone.parsePositionId(positionId);
      if (position) {
        positions.push(position);
      }
    }
    
    // Sort by string, then by fret for consistent ordering
    return positions.sort((a, b) => {
      if (a.string !== b.string) {
        return a.string - b.string;
      }
      return a.fret - b.fret;
    });
  }

  /**
   * Gets all position IDs in the zone.
   * @returns Array of position ID strings
   */
  public getAllPositionIds(): string[] {
    return Array.from(this.positions).sort();
  }

  /**
   * Returns the number of notes in the zone.
   */
  public size(): number {
    return this.positions.size;
  }

  /**
   * Checks if the zone is empty.
   */
  public isEmpty(): boolean {
    return this.positions.size === 0;
  }

  /**
   * Clears all notes from the zone.
   */
  public clear(): void {
    this.positions.clear();
  }

  /**
   * Creates a copy of this zone.
   */
  public clone(): HighlightZone {
    const clone = new HighlightZone(this.name);
    for (const positionId of this.positions) {
      clone.positions.add(positionId);
    }
    return clone;
  }

  /**
   * Merges another zone into this zone.
   * @param other The zone to merge in
   */
  public merge(other: HighlightZone): void {
    for (const positionId of other.positions) {
      this.positions.add(positionId);
    }
  }

  /**
   * Returns the intersection of this zone with another zone.
   * @param other The zone to intersect with
   * @returns A new zone containing only positions present in both zones
   */
  public intersection(other: HighlightZone): HighlightZone {
    const result = new HighlightZone();
    for (const positionId of this.positions) {
      if (other.positions.has(positionId)) {
        result.positions.add(positionId);
      }
    }
    return result;
  }

  /**
   * Checks if this zone equals another zone (same positions).
   */
  public equals(other: HighlightZone): boolean {
    if (this.positions.size !== other.positions.size) {
      return false;
    }
    for (const positionId of this.positions) {
      if (!other.positions.has(positionId)) {
        return false;
      }
    }
    return true;
  }

  // ============================================================
  // Serialization Methods (HLZ-005)
  // ============================================================

  /**
   * Serializable representation of a HighlightZone.
   */
  public static readonly SERIALIZATION_VERSION = 1;

  /**
   * Converts the zone to a JSON-serializable object.
   * @returns A plain object that can be serialized with JSON.stringify()
   */
  public toJSON(): HighlightZoneJSON {
    return {
      version: HighlightZone.SERIALIZATION_VERSION,
      name: this.name,
      positions: this.getAllNotes()
    };
  }

  /**
   * Creates a HighlightZone from a JSON object.
   * @param json The JSON object (parsed from JSON string or created programmatically)
   * @returns A new HighlightZone with the deserialized positions
   * @throws Error if the JSON structure is invalid
   */
  public static fromJSON(json: unknown): HighlightZone {
    if (!json || typeof json !== 'object') {
      throw new Error('Invalid zone JSON: expected an object');
    }

    const data = json as Record<string, unknown>;

    // Validate version
    if (typeof data.version !== 'number' || data.version < 1) {
      throw new Error('Invalid zone JSON: missing or invalid version');
    }

    // Support future versions gracefully
    if (data.version > HighlightZone.SERIALIZATION_VERSION) {
      console.warn(`Zone JSON version ${data.version} is newer than supported version ${HighlightZone.SERIALIZATION_VERSION}. Some features may not work correctly.`);
    }

    // Validate positions array
    if (!Array.isArray(data.positions)) {
      throw new Error('Invalid zone JSON: positions must be an array');
    }

    // Extract name (optional)
    const name = typeof data.name === 'string' ? data.name : undefined;

    // Create zone and add positions
    const zone = new HighlightZone(name);

    for (const pos of data.positions) {
      if (!pos || typeof pos !== 'object') {
        throw new Error('Invalid zone JSON: position must be an object');
      }
      
      const position = pos as Record<string, unknown>;
      
      if (typeof position.string !== 'number' || typeof position.fret !== 'number') {
        throw new Error('Invalid zone JSON: position must have numeric string and fret properties');
      }

      // addNote will validate the position bounds
      const added = zone.addNote(position.string, position.fret);
      if (!added && HighlightZone.isValidPosition(position.string, position.fret)) {
        // Position was duplicate, which is okay
      } else if (!added) {
        throw new Error(`Invalid zone JSON: position (${position.string}, ${position.fret}) is out of bounds`);
      }
    }

    return zone;
  }

  /**
   * Converts the zone to a JSON string.
   * @param pretty If true, formats the JSON with indentation
   * @returns JSON string representation of the zone
   */
  public toJSONString(pretty: boolean = false): string {
    return pretty 
      ? JSON.stringify(this.toJSON(), null, 2)
      : JSON.stringify(this.toJSON());
  }

  /**
   * Creates a HighlightZone from a JSON string.
   * @param jsonString The JSON string to parse
   * @returns A new HighlightZone with the deserialized positions
   * @throws Error if the JSON string is invalid or the structure is wrong
   */
  public static fromJSONString(jsonString: string): HighlightZone {
    try {
      const json = JSON.parse(jsonString);
      return HighlightZone.fromJSON(json);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid zone JSON string: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Helper to encode a string to Base64, handling Unicode characters.
   * Uses TextEncoder for proper UTF-8 handling.
   */
  private static encodeBase64(str: string): string {
    // Convert string to UTF-8 bytes, then to Base64
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
    return btoa(binary);
  }

  /**
   * Helper to decode a Base64 string, handling Unicode characters.
   * Uses TextDecoder for proper UTF-8 handling.
   */
  private static decodeBase64(base64: string): string {
    // Decode Base64 to bytes, then convert from UTF-8
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }

  /**
   * Converts the zone to a URL-safe string.
   * Uses Base64 encoding of the JSON representation.
   * @returns A URL-safe string that can be used in query parameters
   */
  public toURLString(): string {
    const json = this.toJSONString();
    return HighlightZone.encodeBase64(json);
  }

  /**
   * Creates a HighlightZone from a URL-safe string.
   * @param urlString The URL-safe string (Base64 encoded JSON)
   * @returns A new HighlightZone with the deserialized positions
   * @throws Error if the string is invalid
   */
  public static fromURLString(urlString: string): HighlightZone {
    try {
      const json = HighlightZone.decodeBase64(urlString);
      return HighlightZone.fromJSONString(json);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid zone')) {
        throw error;
      }
      throw new Error(`Invalid URL-encoded zone string: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  /**
   * Creates a compact URL-safe string representation.
   * Uses a more efficient encoding for smaller URL sizes.
   * Format: "v{version}:{name?}:{positions as comma-separated s{n}f{n}}"
   * @returns A compact URL-safe string
   */
  public toCompactURLString(): string {
    const positions = this.getAllPositionIds().join(',');
    const namePart = this.name ? encodeURIComponent(this.name) : '';
    return `v${HighlightZone.SERIALIZATION_VERSION}:${namePart}:${positions}`;
  }

  /**
   * Creates a HighlightZone from a compact URL string.
   * @param compactString The compact URL string
   * @returns A new HighlightZone with the deserialized positions
   * @throws Error if the string is invalid
   */
  public static fromCompactURLString(compactString: string): HighlightZone {
    // Parse format: "v{version}:{name?}:{positions}"
    const match = compactString.match(/^v(\d+):([^:]*):(.*)$/);
    if (!match) {
      throw new Error('Invalid compact zone string: wrong format');
    }

    const version = parseInt(match[1], 10);
    if (version < 1) {
      throw new Error('Invalid compact zone string: invalid version');
    }
    if (version > HighlightZone.SERIALIZATION_VERSION) {
      console.warn(`Compact zone string version ${version} is newer than supported version ${HighlightZone.SERIALIZATION_VERSION}. Some features may not work correctly.`);
    }

    const name = match[2] ? decodeURIComponent(match[2]) : undefined;
    const positionsStr = match[3];

    const zone = new HighlightZone(name);

    if (positionsStr) {
      const positionIds = positionsStr.split(',');
      for (const posId of positionIds) {
        const posMatch = posId.match(/^s(\d+)f(\d+)$/);
        if (!posMatch) {
          throw new Error(`Invalid compact zone string: invalid position format "${posId}"`);
        }
        const string = parseInt(posMatch[1], 10);
        const fret = parseInt(posMatch[2], 10);
        
        if (!zone.addNote(string, fret)) {
          if (!HighlightZone.isValidPosition(string, fret)) {
            throw new Error(`Invalid compact zone string: position (${string}, ${fret}) is out of bounds`);
          }
          // Duplicate position, ignore
        }
      }
    }

    return zone;
  }
}

/**
 * JSON representation of a HighlightZone for serialization.
 */
export interface HighlightZoneJSON {
  /** Serialization format version for forward compatibility */
  version: number;
  /** Optional zone name */
  name?: string;
  /** Array of note positions in the zone */
  positions: NotePosition[];
}
