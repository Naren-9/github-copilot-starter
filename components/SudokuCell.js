'use client';

import styles from './SudokuBoard.module.css';

// A single interactive Sudoku cell with styling that reflects whether it is prefilled, incorrect, or in conflict.
export default function SudokuCell({ row, col, value, notes, isPrefilled, isHinted, isIncorrect, isConflict, onCellChange }) {
  const classNames = [styles.cell];
  if (isPrefilled) classNames.push(styles.prefilled);
  if (isHinted) classNames.push(styles.hinted);
  if (isIncorrect) classNames.push(styles.incorrect);
  if (isConflict) classNames.push(styles.conflict);

  return (
    <div className={styles.cellWrapper}>
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
      {value === 0 && notes.length > 0 && (
        <div className={styles.noteGrid}>
          {Array.from({ length: 9 }, (_, index) => {
            const noteValue = index + 1;
            return (
              <span
                key={noteValue}
                className={notes.includes(noteValue) ? styles.noteValue : styles.noteEmpty}
              >
                {notes.includes(noteValue) ? noteValue : ''}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
