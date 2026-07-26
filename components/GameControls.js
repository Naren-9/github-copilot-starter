'use client';

import styles from './GameControls.module.css';

// Keeps the action buttons and status message separate from the board state logic.
export default function GameControls({ onNewGame, onCheckSolution, message, messageColor }) {
  return (
    <div className={styles.controls}>
      <button type="button" className={styles.button} onClick={onNewGame}>
        New Game
      </button>
      <button type="button" className={styles.button} onClick={onCheckSolution}>
        Check Solution
      </button>
      <span className={styles.message} style={{ color: messageColor }}>
        {message}
      </span>
    </div>
  );
}
