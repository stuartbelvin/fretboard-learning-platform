import { useState, useMemo, useCallback, useRef } from 'react';
import { Box, Flex, Text, Heading, Button, Card, TextField } from '@radix-ui/themes';
import { FretboardDisplay, ZONE_COLORS } from '../components/fretboard';
import type { ZoneConfig } from '../components/fretboard';
import { useResponsiveViewport } from '../hooks';
import { useAppStore, useSavedZones } from '../store/appStore';
import type { SavedZone } from '../store/appStore';
import { HighlightZone } from '../core/zones/HighlightZone';
import type { HighlightZoneJSON } from '../core/zones/HighlightZone';
import { Note } from '../core/music-theory/Note';
import './ZoneAdminPage.css';

/**
 * Available zone colors for selection
 */
const ZONE_COLOR_OPTIONS = [
  { id: 'blue', label: 'Blue', color: ZONE_COLORS.blue },
  { id: 'green', label: 'Green', color: ZONE_COLORS.green },
  { id: 'purple', label: 'Purple', color: ZONE_COLORS.purple },
  { id: 'orange', label: 'Orange', color: ZONE_COLORS.orange },
  { id: 'cyan', label: 'Cyan', color: ZONE_COLORS.cyan },
  { id: 'pink', label: 'Pink', color: ZONE_COLORS.pink },
] as const;

/**
 * ZoneAdminPage - Admin interface for creating and managing custom zones
 * 
 * Allows users to:
 * - Create custom zones by clicking individual notes on the fretboard
 * - Preview zones in real-time as they build
 * - Save zones for use in quizzes
 * - Enable/disable and delete saved zones
 */
export function ZoneAdminPage() {
  const { defaultFretCount } = useResponsiveViewport();
  const savedZones = useSavedZones();
  const { addSavedZone, deleteSavedZone, toggleZoneEnabled } = useAppStore();
  
  // Viewport state
  const [visibleFrets, setVisibleFrets] = useState(defaultFretCount);
  const [startFret, setStartFret] = useState(0);
  
  // Zone creation state
  const [zoneName, setZoneName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(ZONE_COLOR_OPTIONS[0].id);
  const [editingZone, setEditingZone] = useState<HighlightZone>(new HighlightZone());
  const [isEditing, setIsEditing] = useState(false);
  
  // Preview saved zone state
  const [selectedSavedZoneId, setSelectedSavedZoneId] = useState<string | null>(null);
  const [previewZone, setPreviewZone] = useState<HighlightZone | null>(null);
  
  // Handle note click - add/remove from zone being edited
  const handleNoteClick = useCallback((note: Note) => {
    if (!isEditing) return;
    
    const newZone = editingZone.clone();
    if (newZone.containsNote(note.string, note.fret)) {
      newZone.removeNote(note.string, note.fret);
    } else {
      newZone.addNote(note.string, note.fret);
    }
    setEditingZone(newZone);
    setSelectedSavedZoneId(null);
    setPreviewZone(null);
  }, [isEditing, editingZone]);
  
  // Start creating a new zone
  const startNewZone = useCallback(() => {
    setEditingZone(new HighlightZone());
    setIsEditing(true);
    setSelectedSavedZoneId(null);
    setPreviewZone(null);
    setZoneName('');
  }, []);
  
  // Clear the current zone being edited
  const clearZone = useCallback(() => {
    setEditingZone(new HighlightZone());
  }, []);
  
  // Cancel editing
  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditingZone(new HighlightZone());
    setZoneName('');
  }, []);
  
  // Save current zone
  const saveZone = useCallback(() => {
    if (editingZone.isEmpty()) return;
    
    const name = zoneName.trim() || `Zone ${savedZones.length + 1}`;
    
    addSavedZone({
      name,
      zoneData: editingZone.toJSON(),
      enabled: true,
    });
    
    // Reset editing state
    setIsEditing(false);
    setEditingZone(new HighlightZone());
    setZoneName('');
  }, [editingZone, zoneName, savedZones.length, addSavedZone]);
  
  // View a saved zone (preview only)
  const viewSavedZone = useCallback((savedZone: SavedZone) => {
    const zone = HighlightZone.fromJSON(savedZone.zoneData);
    setPreviewZone(zone);
    setSelectedSavedZoneId(savedZone.id);
    setIsEditing(false);
    setEditingZone(new HighlightZone());
  }, []);
  
  // Edit an existing saved zone
  const editSavedZone = useCallback((savedZone: SavedZone) => {
    const zone = HighlightZone.fromJSON(savedZone.zoneData);
    setEditingZone(zone);
    setZoneName(savedZone.name);
    setIsEditing(true);
    setSelectedSavedZoneId(null);
    setPreviewZone(null);
    // Delete the old one (will be replaced when saved)
    deleteSavedZone(savedZone.id);
  }, [deleteSavedZone]);
  
  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Export all zones to JSON file
  const exportZones = useCallback(() => {
    if (savedZones.length === 0) return;
    
    const exportData = {
      version: 1,
      exportDate: new Date().toISOString(),
      zones: savedZones.map(zone => ({
        name: zone.name,
        enabled: zone.enabled,
        zoneData: zone.zoneData,
      })),
    };
    
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `fretboard-zones-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [savedZones]);
  
  // Import zones from JSON file
  const importZones = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const data = JSON.parse(json);
        
        // Validate structure
        if (!data.zones || !Array.isArray(data.zones)) {
          alert('Invalid zone file format');
          return;
        }
        
        // Import each zone
        let imported = 0;
        for (const zoneEntry of data.zones) {
          if (zoneEntry.name && zoneEntry.zoneData) {
            try {
              // Validate the zone data by parsing it
              HighlightZone.fromJSON(zoneEntry.zoneData as HighlightZoneJSON);
              
              addSavedZone({
                name: zoneEntry.name,
                zoneData: zoneEntry.zoneData as HighlightZoneJSON,
                enabled: zoneEntry.enabled ?? true,
              });
              imported++;
            } catch {
              console.warn(`Skipped invalid zone: ${zoneEntry.name}`);
            }
          }
        }
        
        alert(`Successfully imported ${imported} zone(s)`);
      } catch (error) {
        alert('Failed to parse zone file. Please check the file format.');
        console.error('Import error:', error);
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  }, [addSavedZone]);
  
  // Get color for display
  const getZoneColor = useCallback(() => {
    const colorOption = ZONE_COLOR_OPTIONS.find(c => c.id === selectedColor);
    return colorOption?.color || ZONE_COLORS.blue;
  }, [selectedColor]);
  
  // Build highlight zones for display
  const highlightZones: ZoneConfig[] = useMemo(() => {
    // Show editing zone if editing
    if (isEditing && !editingZone.isEmpty()) {
      return [{
        zone: editingZone,
        color: getZoneColor(),
        label: zoneName || 'New Zone',
      }];
    }
    // Show preview zone if viewing saved
    if (previewZone) {
      return [{
        zone: previewZone,
        color: getZoneColor(),
        label: 'Preview',
      }];
    }
    return [];
  }, [isEditing, editingZone, previewZone, getZoneColor, zoneName]);

  // Determine the zone being displayed for stats
  const displayedZone = isEditing ? editingZone : previewZone;

  return (
    <Box className="zone-admin-page" p="4">
      <Flex direction="column" gap="2" className="zone-admin-header">
        <Heading as="h2" size="5">📐 Zone Admin</Heading>
        <Text size="2" color="gray">Create custom zones by clicking notes on the fretboard</Text>
      </Flex>
      
      <Flex gap="4" mt="4" wrap="wrap" className="zone-admin-content">
        {/* Zone Creation Panel */}
        <Card className="zone-creation-panel" style={{ flex: 1, minWidth: '280px' }}>
          <Heading as="h3" size="3" mb="3">Create Zone</Heading>
          
          {!isEditing ? (
            <Flex direction="column" gap="3" className="start-editing">
              <Text size="2">Click the button below to start creating a new zone, then click notes on the fretboard to add them.</Text>
              <Button size="3" color="blue" onClick={startNewZone}>
                + New Zone
              </Button>
            </Flex>
          ) : (
            <Flex direction="column" gap="3">
              <Box className="editing-instructions">
                <Text size="2">👆 Click notes on the fretboard to add/remove them from the zone</Text>
              </Box>
              
              <Box className="form-group">
                <Text as="label" htmlFor="zone-name" size="2" weight="medium">Zone Name</Text>
                <TextField.Root
                  id="zone-name"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="e.g., Position 1, Low Notes, etc."
                  mt="1"
                />
              </Box>
              
              <Box className="form-group">
                <Text size="2" weight="medium" mb="2">Zone Color</Text>
                <Flex gap="2" wrap="wrap" className="color-options">
                  {ZONE_COLOR_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      className={`color-option ${selectedColor === option.id ? 'selected' : ''}`}
                      style={{ 
                        backgroundColor: option.color,
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: selectedColor === option.id ? '3px solid white' : '2px solid transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedColor(option.id)}
                      title={option.label}
                      aria-label={`Select ${option.label} color`}
                    />
                  ))}
                </Flex>
              </Box>
              
              <Box className="zone-stats">
                <Text size="2"><Text weight="bold">Notes selected:</Text> {editingZone.size()}</Text>
              </Box>
              
              <Flex gap="2" className="form-actions">
                <Button variant="outline" color="gray" onClick={clearZone}>
                  Clear
                </Button>
                <Button variant="outline" color="gray" onClick={cancelEditing}>
                  Cancel
                </Button>
                <Button 
                  color="green" 
                  onClick={saveZone}
                  disabled={editingZone.isEmpty()}
                >
                  Save Zone
                </Button>
              </Flex>
            </Flex>
          )}
        </Card>
        
        {/* Saved Zones Panel */}
        <Card className="saved-zones-panel" style={{ flex: 1, minWidth: '280px' }}>
          <Flex justify="between" align="center" className="saved-zones-header" mb="3">
            <Heading as="h3" size="3">Saved Zones ({savedZones.length})</Heading>
            <Flex gap="2" className="import-export-buttons">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={importZones}
                style={{ display: 'none' }}
                aria-label="Import zones from file"
              />
              <Button
                size="1"
                variant="soft"
                color="gray"
                onClick={() => fileInputRef.current?.click()}
                title="Import zones from file"
              >
                📥 Import
              </Button>
              <Button
                size="1"
                variant="soft"
                color="gray"
                onClick={exportZones}
                disabled={savedZones.length === 0}
                title="Export zones to file"
              >
                📤 Export
              </Button>
            </Flex>
          </Flex>
          
          {savedZones.length === 0 ? (
            <Text size="2" color="gray" className="no-zones">No saved zones yet. Create one to get started!</Text>
          ) : (
            <Flex direction="column" gap="2" className="saved-zones-list">
              {savedZones.map((savedZone) => (
                <Card 
                  key={savedZone.id} 
                  size="1"
                  className={`saved-zone-item ${selectedSavedZoneId === savedZone.id ? 'selected' : ''} ${!savedZone.enabled ? 'disabled' : ''}`}
                  style={{ opacity: savedZone.enabled ? 1 : 0.6 }}
                >
                  <Flex justify="between" align="center">
                    <Flex direction="column" gap="1" className="zone-info">
                      <Text size="2" weight="medium" className="zone-name">{savedZone.name}</Text>
                      <Text size="1" color="gray" className="zone-notes">{savedZone.zoneData.positions.length} notes</Text>
                    </Flex>
                    <Flex gap="1" className="zone-actions">
                      <Button
                        size="1"
                        variant="ghost"
                        onClick={() => viewSavedZone(savedZone)}
                        title="Preview zone"
                      >
                        👁️
                      </Button>
                      <Button
                        size="1"
                        variant="ghost"
                        onClick={() => editSavedZone(savedZone)}
                        title="Edit zone"
                      >
                        ✏️
                      </Button>
                      <Button
                        size="1"
                        variant="ghost"
                        color={savedZone.enabled ? 'green' : 'gray'}
                        onClick={() => toggleZoneEnabled(savedZone.id)}
                        title={savedZone.enabled ? 'Disable zone' : 'Enable zone'}
                      >
                        {savedZone.enabled ? '✓' : '○'}
                      </Button>
                      <Button
                        size="1"
                        variant="ghost"
                        color="red"
                        onClick={() => deleteSavedZone(savedZone.id)}
                        title="Delete zone"
                      >
                        🗑️
                      </Button>
                    </Flex>
                  </Flex>
                </Card>
              ))}
            </Flex>
          )}
        </Card>
      </Flex>
      
      {/* Fretboard for zone creation */}
      <Box mt="4" className="fretboard-preview">
        <FretboardDisplay
          visibleFrets={visibleFrets}
          startFret={startFret}
          showNoteNames={true}
          noteDisplay="sharps"
          highlightZones={highlightZones}
          showZoneNotesOnly={false}
          onNoteClick={isEditing ? handleNoteClick : undefined}
          onVisibleFretsChange={setVisibleFrets}
          onStartFretChange={setStartFret}
        />
      </Box>
      
      {/* Zone info footer */}
      {displayedZone && !displayedZone.isEmpty() && (
        <Flex gap="2" mt="3" justify="center" className="zone-info-footer">
          <Text size="2"><Text weight="bold">{displayedZone.size()}</Text> notes in zone</Text>
          {displayedZone.name && <Text size="2"> • {displayedZone.name}</Text>}
        </Flex>
      )}
    </Box>
  );
}
