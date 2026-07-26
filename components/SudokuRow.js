'use client';

import SudokuCell from './SudokuCell';
import styles from './SudokuBoard.module.css';

// Renders one row of Sudoku cells while keeping the board layout focused on row composition.
export default function SudokuRow({ row, rowIndex, prefilled, incorrectCells, onCellChange }) {
  return (
    <div className={styles.row}>
      {row.map((cellValue, colIndex) => {
        const cellKey = `${rowIndex}-${colIndex}`;
        const isPrefilled = prefilled[rowIndex][colIndex];
        const isIncorrect = incorrectCells.includes(cellKey);

        return (
          <SudokuCell
            key={cellKey}
            row={rowIndex}
            col={colIndex}
            value={cellValue}
            isPrefilled={isPrefilled}
            isIncorrect={isIncorrect}
            onCellChange={onCellChange}
          />
        );
      })}
    </div>
  );
}
