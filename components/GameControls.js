'use client';

import styles from './GameControls.module.css';

// Keeps the action buttons, difficulty selector, and status message separate from the board state logic.
export default function GameControls({
  selectedDifficulty,
  onDifficultyChange,
  onNewGame,
  onRestart,
  onCheckSolution,
  onHint,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  notesMode,
  onNotesToggle,
  isPaused,
  isGameOver,
  onPauseToggle,
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
      <button type="button" className={styles.button} onClick={onRestart}>
        Restart
      </button>
      <button type="button" className={styles.button} onClick={onUndo} disabled={!canUndo || isPaused || isGameOver}>
        Undo
      </button>
      <button type="button" className={styles.button} onClick={onRedo} disabled={!canRedo || isPaused || isGameOver}>
        Redo
      </button>
      <button type="button" className={styles.button} onClick={onHint} disabled={isPaused || isGameOver}>
        Hint
      </button>
      <button type="button" className={styles.button} onClick={onCheckSolution} disabled={isPaused || isGameOver}>
        Check Solution
      </button>
      <button type="button" className={styles.button} onClick={onNotesToggle} disabled={isPaused || isGameOver}>
        Notes: {notesMode ? 'ON' : 'OFF'}
      </button>
      <button type="button" className={styles.button} onClick={onPauseToggle} disabled={isGameOver}>
        {isPaused ? 'Resume' : 'Pause'}
      </button>
      <span className={styles.message} style={{ color: messageColor }}>
        {message}
      </span>
    </div>
  );
}
