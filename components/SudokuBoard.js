'use client';

import SudokuRow from './SudokuRow';
import styles from './SudokuBoard.module.css';

// Presentational component that renders the full 9x9 board from smaller row components.
export default function SudokuBoard({ board, prefilled, hinted, incorrectCells, conflictCells, isPaused, isGameOver, onCellChange }) {
  return (
    <div className={styles.boardWrapper}>
      <div className={styles.board} aria-hidden={isPaused || isGameOver}>
        {board.map((row, rowIndex) => (
          <SudokuRow
            key={rowIndex}
            row={row}
            rowIndex={rowIndex}
            prefilled={prefilled}
            hinted={hinted}
            incorrectCells={incorrectCells}
            conflictCells={conflictCells}
            onCellChange={onCellChange}
          />
        ))}
      </div>
      {(isPaused || isGameOver) && (
        <div className={styles.pausedOverlay}>{isGameOver ? 'Game Over' : 'Paused'}</div>
      )}
    </div>
  );
}
