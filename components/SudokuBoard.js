'use client';

import SudokuRow from './SudokuRow';
import styles from './SudokuBoard.module.css';

// Presentational component that renders the full 9x9 board from smaller row components.
export default function SudokuBoard({ board, prefilled, hinted, incorrectCells, conflictCells, isPaused, onCellChange }) {
  return (
    <div className={styles.boardWrapper}>
      <div className={styles.board} aria-hidden={isPaused}>
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
      {isPaused && <div className={styles.pausedOverlay}>Paused</div>}
    </div>
  );
}
