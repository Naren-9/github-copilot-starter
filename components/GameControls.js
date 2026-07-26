'use client';

import styles from './GameControls.module.css';

// Keeps the action buttons, difficulty selector, and status message separate from the board state logic.
export default function GameControls({
  selectedDifficulty,
  onDifficultyChange,
  onNewGame,
  onCheckSolution,
  onHint,
  theme,
  onThemeToggle,
  message,
  messageColor,
}) {
  return (
    <div className={styles.controls}>
      <label className={styles.label}>
        Difficulty
        <select
          className={styles.select}
          value={selectedDifficulty}
          onChange={(event) => onDifficultyChange(event.target.value)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </label>
      <button type="button" className={styles.button} onClick={onNewGame}>
        New Game
      </button>
      <button type="button" className={styles.button} onClick={onHint}>
        Hint
      </button>
      <button type="button" className={styles.button} onClick={onCheckSolution}>
        Check Solution
      </button>
      <button type="button" className={styles.button} onClick={onThemeToggle}>
        {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
      </button>
      <span className={styles.message} style={{ color: messageColor }}>
        {message}
      </span>
    </div>
  );
}
