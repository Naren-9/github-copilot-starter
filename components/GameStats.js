'use client';

import styles from './GameStats.module.css';

export default function GameStats({ difficulty, elapsedSeconds, mistakes, maxMistakes }) {
  const formatTime = (s) => {
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  return (
    <div className={styles.stats}>
      <div className={styles.pill}>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</div>
      <div className={styles.pill}>{formatTime(elapsedSeconds)}</div>
      <div className={styles.pill} aria-live="polite">
        Mistakes {mistakes}/{maxMistakes}
      </div>
    </div>
  );
}
