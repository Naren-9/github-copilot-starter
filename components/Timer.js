'use client';

import styles from './Timer.module.css';

// Display elapsed seconds in MM:SS format, pause state, and mistake count.
export default function Timer({ elapsedSeconds, isPaused, mistakes, maxMistakes }) {
  const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
  const seconds = String(elapsedSeconds % 60).padStart(2, '0');

  return (
    <div className={styles.timerRow}>
      <div className={styles.timer}>
        {isPaused ? 'Paused — ' : ''}
        {minutes}:{seconds}
      </div>
      <div className={styles.mistakes}>
        Mistakes: {mistakes}/{maxMistakes}
      </div>
    </div>
  );
}
