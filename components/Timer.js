'use client';

import styles from './Timer.module.css';

// Display elapsed seconds in MM:SS format and pause state.
export default function Timer({ elapsedSeconds, isPaused }) {
  const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
  const seconds = String(elapsedSeconds % 60).padStart(2, '0');

  return (
    <div className={styles.timer}>
      {isPaused ? 'Paused — ' : ''}
      {minutes}:{seconds}
    </div>
  );
}
