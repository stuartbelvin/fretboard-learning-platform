import { ProgressiveNoteQuiz } from '../components/quiz';

/**
 * Progressive Quiz Page
 * 
 * A quiz mode that progressively unlocks notes on the E string as the user
 * demonstrates mastery through accuracy and speed.
 */
export function ProgressiveQuizPage() {
  return (
    <div className="page progressive-quiz-page">
      <ProgressiveNoteQuiz />
    </div>
  );
}

export default ProgressiveQuizPage;
