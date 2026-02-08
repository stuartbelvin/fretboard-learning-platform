# Fretboard Mastery Pro - Technical Context

This document summarizes the MVP implementation details for reference during Phase 2 development.

---

## Project Overview

**Purpose:** Progressive web application helping guitarists master fretboard knowledge through interactive quizzes.

**Tech Stack:**
- **Framework:** React 18 + TypeScript 5
- **State Management:** Zustand with localStorage persistence
- **Routing:** React Router v7 (HashRouter for static hosting)
- **Styling:** CSS with custom properties for theming
- **Testing:** Vitest with 1522 unit tests
- **Build:** Vite

---

## Architecture Summary

```
src/
├── core/                    # Business logic (framework-agnostic)
│   ├── music-theory/        # Note, Interval classes
│   ├── instruments/         # Instrument, Fretboard classes
│   ├── quiz/               # Quiz engines, question generators
│   └── zones/              # HighlightZone, ZoneShapeUtilities
├── components/              # React components
│   ├── fretboard/          # FretboardDisplay, ViewportControls
│   ├── quiz/               # NoteQuizTest, IntervalQuizTest
│   └── settings/           # SettingsPanel, ColorPaletteSwitcher
├── hooks/                   # useResponsiveViewport
├── config/                  # appConfig, colors
├── context/                 # ColorContext
├── store/                   # Zustand appStore
├── pages/                   # Route page components
├── router/                  # AppRouter, AppLayout
└── tests/
    ├── unit/               # 1522 unit tests
    └── manual/             # Manual test documentation
```

---

## Core Classes Reference

### Note (`src/core/music-theory/Note.ts`)
Represents a single note on the fretboard.

**Key Properties:**
- `pitchClass: PitchClass` - C, C#, D, etc.
- `octave: number` - Scientific octave (2-6)
- `string: number` - Guitar string (1-6)
- `fret: number` - Fret position (0-24)
- `midiNumber: number` - MIDI note number

**Key Methods:**
- `getSharpName() / getFlatName()` - Accidental display
- `isEnharmonicWith(noteName)` - Enharmonic comparison
- `getPositionId()` - Unique ID "s{string}f{fret}"
- `isSamePitchClass(other)` - Pitch class comparison

### Interval (`src/core/music-theory/Interval.ts`)
Represents a musical interval.

**Key Properties:**
- `quality: IntervalQuality` - perfect, major, minor, diminished, augmented
- `number: IntervalNumber` - 1-15
- `semitones: number` - Semitone distance
- `isCompound: boolean` - Greater than octave

**Key Methods:**
- `getFullName()` - "minor third", "perfect fifth"
- `getShortName()` - "m3", "P5"
- `fromShortName(shortName)` - Parse "m3" → Interval
- `fromSemitones(semitones)` - Create from distance

### Fretboard (`src/core/instruments/Fretboard.ts`)
Generates all notes for a given tuning.

**Configuration:**
- Default: 6 strings, 24 frets, standard tuning
- Supports: Custom tuning, variable string/fret count

**Key Methods:**
- `getNoteAt(string, fret)` - Single note lookup
- `getNotesByPitchClass(pitchClass)` - All occurrences
- `getNotesInFretRange(start, end)` - Range query
- `getRegion(startStr, endStr, startFret, endFret)` - Rectangle

### Instrument (`src/core/instruments/Instrument.ts`)
Manages instrument configuration with tuning presets.

**Supported Types:**
- guitar-6, guitar-7, guitar-8
- bass-4, bass-5, bass-6
- ukulele, custom

**Tuning Presets:** 16 presets (Standard, Drop D, Open G, etc.)

### HighlightZone (`src/core/zones/HighlightZone.ts`)
Set-based storage for note positions.

**Key Methods:**
- `addNote(string, fret) / removeNote()` - Modify zone
- `containsNote(string, fret)` - Membership check
- `getAllNotes()` - Get all NotePosition objects
- `merge(other) / intersection(other)` - Set operations
- `toURLString() / fromURLString()` - Serialization

### ZoneShapeUtilities (`src/core/zones/ZoneShapeUtilities.ts`)
Factory functions for common zone shapes.

**Functions:**
- `createRectangleZone(params)` - Rectangular region
- `createOctaveRangeZone(params)` - Notes in octave range
- `createPitchClassZone(pitchClass, fretboard)` - All occurrences of pitch
- `createPositionZone(position, fretRange)` - Guitar positions
- `CustomZoneBuilder` - Fluent builder class

---

## Quiz System Reference

### NoteQuizState (`src/core/quiz/NoteQuizState.ts`)
State machine: `idle → active → answering → hint → complete`

**Events:** stateChange, questionGenerated, answerAttempt, correctAnswer, incorrectAnswer, hintShown, quizComplete

### NoteQuestionGenerator (`src/core/quiz/NoteQuestionGenerator.ts`)
**Config Options:**
- `pitchClassFilter`: 'natural' | 'sharps' | 'flats' | 'both' | 'custom'
- `displayPreference`: 'sharps' | 'flats' | 'both'
- `avoidConsecutiveRepeats`: boolean

### IntervalQuestionGenerator (`src/core/quiz/IntervalQuestionGenerator.ts`)
**Config Options:**
- `intervals`: 'common' | 'all' | IntervalShortName[]
- `allowCompoundIntervals`: boolean
- `allowRootOutsideZoneForCompound`: boolean

### AnswerValidator (`src/core/quiz/AnswerValidator.ts`)
**Features:**
- Enharmonic equivalence (C# === Db)
- Attempt tracking with configurable max
- Combined `validateAndTrack()` method

### QuizFeedbackManager (`src/core/quiz/QuizFeedbackManager.ts`)
**Feedback Types:**
- Correct: Green flash (500ms)
- Incorrect: Red flash (500ms)
- Hint: Green pulse (3x)

### QuizFlowController (`src/core/quiz/QuizFlowController.ts`)
Master orchestrator integrating all quiz components.

**Features:**
- Auto-advance after correct answer
- Pause/resume with timer preservation
- Score and progress tracking
- Event system for UI updates

---

## State Management

### Zustand Store (`src/store/appStore.ts`)

**State Slices:**
1. `currentQuiz` - Quiz type, active state, score, settings
2. `instrumentConfig` - String count, fret count, tuning
3. `userSettings` - Color palette, note display, sound, animation
4. `viewport` - Visible frets, start fret, device defaults

**Persistence:** localStorage via `zustand/persist` middleware
- Persisted: instrumentConfig, userSettings, viewport, quizSettings
- Not persisted: Runtime quiz state

**Selector Hooks:**
- `useCurrentQuiz()`, `useInstrumentConfig()`, `useUserSettings()`, `useViewport()`
- `useQuizSettings()`, `useQuizScore()`, `useIsQuizActive()`, `useQuizType()`

---

## Configuration System

### AppConfig (`src/config/appConfig.ts`)

**Categories:**
- `colors` - Palette ID, custom overrides
- `thresholds` - Quiz limits, feedback timing, instrument bounds
- `defaults` - Instrument, viewport, user settings
- `quiz` - Note quiz, interval quiz, shared settings

**Validation:** Full validation with error paths and messages

### Color Palettes (`src/config/colors.ts`)

**7 Color Roles:**
- fretboardBg, fretWire, string, nut, fretMarker, noteHover, noteActive

**5 Built-in Palettes:**
- Midnight Blue (default), High Contrast, Warm Rosewood, Electric Neon, Deep Ocean

---

## Component Reference

### FretboardDisplay (`src/components/fretboard/FretboardDisplay.tsx`)

**Key Props:**
```typescript
config?: FretboardConfig       // Tuning/frets
visibleFrets?: number          // Viewport size
startFret?: number             // Viewport start
onNoteClick?: (note) => void
noteDisplay?: 'sharps' | 'flats' | 'none'
showNoteNames?: boolean
highlightZones?: ZoneConfig[]  // Zone highlighting
zoneOnlyMode?: boolean         // Restrict clicks to zones
feedbackStates?: FeedbackState[] // Quiz feedback
rootNote?: Note                // Interval quiz root
rootOutsideZone?: boolean      // Root outside zone indicator
selectedNote?: Note            // Selected note highlight
```

### SettingsPanel (`src/components/settings/SettingsPanel.tsx`)

**Sections:** appearance, display, quiz, intervals, viewport, instrument

**Features:**
- Accordion sections with expand/collapse
- Color theme selector
- Interval selection with presets
- All settings persist via Zustand store

---

## Routing

### Routes (`src/router/AppRouter.tsx`)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | HomePage | Interactive fretboard |
| `/note-quiz` | NoteQuizPage | Note identification quiz |
| `/interval-quiz` | IntervalQuizPage | Interval recognition quiz |
| `/settings` | SettingsPage | App settings |

**Persistence:** Last visited route saved to localStorage

---

## Testing Summary

### Test Distribution
| Area | Tests |
|------|-------|
| Music Theory (Note, Interval) | ~160 |
| Instruments (Fretboard, Instrument) | ~160 |
| Zones (HighlightZone, Utilities) | ~130 |
| Quiz System (State, Generators, Validators) | ~400 |
| Configuration (AppConfig, Colors) | ~100 |
| Store (Zustand) | ~100 |
| Components (Fretboard, Settings, Routing) | ~200 |
| Integration & Edge Cases | ~270 |
| **Total** | **1522** |

### Test Commands
```bash
npx vitest run        # Run all tests
npx vitest run --ui   # Interactive test UI
npx tsc --noEmit      # Type checking
```

---

## Key Implementation Decisions

1. **Position IDs:** Format "s{string}f{fret}" (e.g., "s1f5") for unique note identification

2. **Enharmonic Handling:** All pitch classes normalized to sharp representation internally

3. **Zone Constraints:**
   - Simple intervals (P1-P8): Root must be in answer zone
   - Compound intervals (m9-P15): Root may be outside zone (configurable)

4. **Quiz Flow:**
   - Auto-advance configurable (default 1000ms delay)
   - Hint shown after max attempts (default 3)
   - Score tracks correct, total, hints used

5. **Responsive Defaults:**
   - Desktop: 12 frets visible
   - Tablet: 8 frets visible
   - Mobile: 4 frets visible

---

## MVP Completion Summary

**Development Period:** January 22-29, 2026

**Final Statistics:**
- 25 tasks completed
- 1522 unit tests passing
- 0 TypeScript errors
- All manual tests verified

**Key Files Created:**
- 45+ source files in `src/`
- 25+ test files in `src/tests/unit/`

The codebase is clean, well-tested, and ready for Phase 2 development.
