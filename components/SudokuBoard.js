'use client';

import SudokuRow from './SudokuRow';
import styles from './SudokuBoard.module.css';

// Presentational component that renders the full 9x9 board from smaller row components.
export default function SudokuBoard({ board, prefilled, incorrectCells, conflictCells, onCellChange }) {
  return (
    <div className={styles.board}>
      {board.map((row, rowIndex) => (
        <SudokuRow
          key={rowIndex}
          row={row}
          rowIndex={rowIndex}
          prefilled={prefilled}
          incorrectCells={incorrectCells}
          conflictCells={conflictCells}
          onCellChange={onCellChange}
        />
      ))}
    </div>
  );
}
