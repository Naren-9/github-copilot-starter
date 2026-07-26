'use client';

import styles from './SudokuBoard.module.css';

// A single interactive Sudoku cell with styling that reflects whether it is prefilled, incorrect, or in conflict.
export default function SudokuCell({ row, col, value, isPrefilled, isHinted, isIncorrect, isConflict, onCellChange }) {
  const classNames = [styles.cell];
  if (isPrefilled) classNames.push(styles.prefilled);
  if (isHinted) classNames.push(styles.hinted);
  if (isIncorrect) classNames.push(styles.incorrect);
  if (isConflict) classNames.push(styles.conflict);

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[1-9]"
      maxLength={1}
      value={value === 0 ? '' : value}
      disabled={isPrefilled || isHinted}
      className={classNames.join(' ')}
      onChange={(event) => onCellChange(row, col, event.target.value)}
    />
  );
}
