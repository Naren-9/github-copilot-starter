'use client';

import styles from './SudokuBoard.module.css';

// A single interactive Sudoku cell with styling that reflects whether it is prefilled or incorrect.
export default function SudokuCell({ row, col, value, isPrefilled, isIncorrect, onCellChange }) {
  const classNames = [styles.cell];
  if (isPrefilled) classNames.push(styles.prefilled);
  if (isIncorrect) classNames.push(styles.incorrect);

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[1-9]"
      maxLength={1}
      value={value === 0 ? '' : value}
      disabled={isPrefilled}
      className={classNames.join(' ')}
      onChange={(event) => onCellChange(row, col, event.target.value)}
    />
  );
}
