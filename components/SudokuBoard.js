'use client';

import SudokuRow from './SudokuRow';
import styles from './SudokuBoard.module.css';

// Presentational component that renders the full 9x9 board from smaller row components.
export default function SudokuBoard({
  board,
  prefilled,
  hinted,
  notes,
  incorrectCells,
  conflictCells,
  selectedCell,
  onCellSelect,
  isRelatedCell,
  isSameNumberCell,
  isPaused,
  isGameOver,
  boardRef,
  onBoardKeyDown,
  onCellChange,
}) {
  return (
    <div className={styles.boardWrapper}>
      <div
        className={styles.board}
        aria-hidden={isPaused || isGameOver}
        tabIndex={0}
        ref={boardRef}
        onKeyDown={onBoardKeyDown}
      >
        {board.map((row, rowIndex) => (
          <SudokuRow
            key={rowIndex}
            row={row}
            rowIndex={rowIndex}
            prefilled={prefilled}
            hinted={hinted}
            notes={notes}
            selectedCell={selectedCell}
            onCellSelect={onCellSelect}
            isRelatedCell={isRelatedCell}
            isSameNumberCell={isSameNumberCell}
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
