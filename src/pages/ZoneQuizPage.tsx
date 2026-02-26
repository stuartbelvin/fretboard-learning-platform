import { ZoneNoteQuiz } from '../components/quiz';

/**
 * Zone Quiz Page
 * 
 * A quiz mode that uses zones that can slide up/down the fretboard.
 * Users progress through notes within the zone, with zone sliding enabled
 * after all notes in the zone are mastered.
 */
export function ZoneQuizPage() {
  return (
    <div className="page zone-quiz-page">
      <ZoneNoteQuiz />
    </div>
  );
}

export default ZoneQuizPage;
