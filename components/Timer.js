'use client';

import styles from './Timer.module.css';

// Display elapsed seconds in MM:SS format.
export default function Timer({ elapsedSeconds }) {
  const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
  const seconds = String(elapsedSeconds % 60).padStart(2, '0');

  return <div className={styles.timer}>{minutes}:{seconds}</div>;
}
