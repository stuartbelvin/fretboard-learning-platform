/**
 * Manual test script to verify fretboard data model
 * Run with: npx tsx src/tests/manual/fretboard-manual-test.ts
 */

import { Fretboard } from '../../core/instruments/Fretboard';

console.log('='.repeat(60));
console.log('FRT-001: Fretboard Data Model - Manual Test');
console.log('='.repeat(60));

const fretboard = new Fretboard();

// Print basic info
console.log('\n📊 Fretboard Info:');
console.log(fretboard.toString());

// Print first 5 frets
fretboard.printFrets(5);

// Verify open strings match EADGBE
console.log('\n🎸 Open String Verification (should be E4, B3, G3, D3, A2, E2):');
const openStrings = fretboard.getOpenStrings();
openStrings.forEach((note, index) => {
  const stringNum = index + 1;
  console.log(`  String ${stringNum}: ${note.getFullName()}`);
});

// Verify 12th fret harmonics
console.log('\n🎵 12th Fret Verification (one octave higher):');
for (let string = 1; string <= 6; string++) {
  const openNote = fretboard.getNoteAt(string, 0);
  const fret12Note = fretboard.getNoteAt(string, 12);
  console.log(`  String ${string}: Open=${openNote?.getFullName()}, 12th=${fret12Note?.getFullName()}`);
}

// Total note count
console.log(`\n📝 Total Notes Generated: ${fretboard.getTotalNoteCount()}`);
console.log('   Expected: 150 (25 fret positions × 6 strings)');

// Verify all E notes
const eNotes = fretboard.getNotesByPitchClass('E');
console.log(`\n🔍 All E notes on fretboard (${eNotes.length} total):`);
eNotes.forEach(note => {
  console.log(`  ${note.getFullName()} at String ${note.string}, Fret ${note.fret}`);
});

console.log('\n✅ Manual test complete!');
