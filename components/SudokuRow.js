'use client';

import SudokuCell from './SudokuCell';
import styles from './SudokuBoard.module.css';

// Renders one row of Sudoku cells while keeping the board layout focused on row composition.
export default function SudokuRow({
  row,
  rowIndex,
  prefilled,
  hinted,
  notes,
  selectedCell,
  onCellSelect,
  isRelatedCell,
  isSameNumberCell,
  incorrectCells,
  conflictCells,
  onCellChange,
}) {
  return (
    <div className={styles.row}>
      {row.map((cellValue, colIndex) => {
        const cellKey = `${rowIndex}-${colIndex}`;
          const isPrefilled = prefilled[rowIndex][colIndex];
          const isHinted = hinted[rowIndex][colIndex];
          const isIncorrect = incorrectCells.includes(cellKey);
          const isConflict = conflictCells.includes(cellKey);
          const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
          const isRelated = isRelatedCell(rowIndex, colIndex);
          const isSameNumber = isSameNumberCell(rowIndex, colIndex);

        return (
          <SudokuCell
            key={cellKey}
            row={rowIndex}
            col={colIndex}
            value={cellValue}
            notes={notes[rowIndex][colIndex]}
            isPrefilled={isPrefilled}
            isHinted={isHinted}
            isIncorrect={isIncorrect}
            isConflict={isConflict}
            isSelected={isSelected}
            isRelated={isRelated}
            isSameNumber={isSameNumber}
            onCellSelect={onCellSelect}
            onCellChange={onCellChange}
          />
        );
      })}
    </div>
  );
}
