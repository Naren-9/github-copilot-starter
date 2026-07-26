'use client';

import { useEffect, useState } from 'react';
import SudokuBoard from './SudokuBoard';
import GameControls from './GameControls';
import { createEmptyBoard, generatePuzzle, deepCopy, EMPTY } from '../lib/sudoku.mjs';

const DEFAULT_DIFFICULTY = 'medium';

// Stateful container that owns the Sudoku board, difficulty, solution, and game feedback.
export default function SudokuGame() {
  const [board, setBoard] = useState(createEmptyBoard());
  const [solution, setSolution] = useState(createEmptyBoard());
  const [prefilled, setPrefilled] = useState(createEmptyBoard());
  const [incorrectCells, setIncorrectCells] = useState([]);
  const [conflictCells, setConflictCells] = useState([]);
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('#d32f2f');
  const [difficulty, setDifficulty] = useState(DEFAULT_DIFFICULTY);

  // Determine which user-entered cells conflict in row, column, or 3x3 box.
  // Prefilled cells are never marked as user errors even if they are part of a duplicate.
  const findConflictCells = (boardToCheck, prefilledGrid) => {
    const conflictSet = new Set();

    const markConflict = (row, col) => {
      if (!prefilledGrid[row][col]) {
        conflictSet.add(`${row}-${col}`);
      }
    };

    const addDuplicates = (positions, rowIndex, isRow) => {
      if (positions.length <= 1) {
        return;
      }
      positions.forEach((pos) => {
        const row = isRow ? rowIndex : pos;
        const col = isRow ? pos : rowIndex;
        markConflict(row, col);
      });
    };

    // Row conflict detection.
    for (let row = 0; row < boardToCheck.length; row += 1) {
      const rowValues = {};
      for (let col = 0; col < boardToCheck[row].length; col += 1) {
        const value = boardToCheck[row][col];
        if (value === EMPTY) {
          continue;
        }
        if (!rowValues[value]) {
          rowValues[value] = [];
        }
        rowValues[value].push(col);
      }
      Object.values(rowValues).forEach((positions) => addDuplicates(positions, row, true));
    }

    // Column conflict detection.
    for (let col = 0; col < boardToCheck[0].length; col += 1) {
      const colValues = {};
      for (let row = 0; row < boardToCheck.length; row += 1) {
        const value = boardToCheck[row][col];
        if (value === EMPTY) {
          continue;
        }
        if (!colValues[value]) {
          colValues[value] = [];
        }
        colValues[value].push(row);
      }
      Object.values(colValues).forEach((positions) => addDuplicates(positions, col, false));
    }

    // Box conflict detection.
    for (let boxRow = 0; boxRow < 3; boxRow += 1) {
      for (let boxCol = 0; boxCol < 3; boxCol += 1) {
        const boxValues = {};
        for (let r = 0; r < 3; r += 1) {
          for (let c = 0; c < 3; c += 1) {
            const row = boxRow * 3 + r;
            const col = boxCol * 3 + c;
            const value = boardToCheck[row][col];
            if (value === EMPTY) {
              continue;
            }
            if (!boxValues[value]) {
              boxValues[value] = [];
            }
            boxValues[value].push({ row, col });
          }
        }
        Object.values(boxValues).forEach((positions) => {
          if (positions.length > 1) {
            positions.forEach(({ row, col }) => markConflict(row, col));
          }
        });
      }
    }

    return Array.from(conflictSet);
  };

  const initializeGame = (selectedDifficulty = difficulty) => {
    const { puzzle, solution: solvedBoard, prefilled: prefilledCells } = generatePuzzle(selectedDifficulty);
    setBoard(deepCopy(puzzle));
    setSolution(deepCopy(solvedBoard));
    setPrefilled(prefilledCells);
    setConflictCells([]);
    setIncorrectCells([]);
    setMessage('');
    setMessageColor('#d32f2f');
  };

  useEffect(() => {
    const startGame = () => {
      const { puzzle, solution: solvedBoard, prefilled: prefilledCells } = generatePuzzle(DEFAULT_DIFFICULTY);
      setBoard(deepCopy(puzzle));
      setSolution(deepCopy(solvedBoard));
      setPrefilled(prefilledCells);
      setConflictCells([]);
      setIncorrectCells([]);
      setMessage('');
      setMessageColor('#d32f2f');
      setDifficulty(DEFAULT_DIFFICULTY);
    };

    startGame();
  }, []);

  const handleCellChange = (row, col, value) => {
    const cleaned = value.replace(/[^1-9]/g, '').slice(0, 1);
    const nextBoard = deepCopy(board);
    nextBoard[row][col] = cleaned ? Number(cleaned) : EMPTY;
    setBoard(nextBoard);
    setConflictCells(findConflictCells(nextBoard, prefilled));
    setIncorrectCells([]);
    setMessage('');
  };

  const handleDifficultyChange = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
  };

  const checkSolution = () => {
    const incorrect = [];
    let correct = true;

    for (let row = 0; row < board.length; row += 1) {
      for (let col = 0; col < board[row].length; col += 1) {
        if (board[row][col] !== solution[row][col]) {
          correct = false;
          if (!prefilled[row][col]) {
            incorrect.push(`${row}-${col}`);
          }
        }
      }
    }

    setIncorrectCells(incorrect);

    if (correct) {
      setMessageColor('#388e3c');
      setMessage('Congratulations! You solved it!');
    } else {
      setMessageColor('#d32f2f');
      setMessage('Some cells are incorrect.');
    }
  };

  return (
    <div>
      <SudokuBoard
        board={board}
        prefilled={prefilled}
        incorrectCells={incorrectCells}
        conflictCells={conflictCells}
        onCellChange={handleCellChange}
      />
      <GameControls
        selectedDifficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
        onNewGame={() => initializeGame(difficulty)}
        onCheckSolution={checkSolution}
        message={message}
        messageColor={messageColor}
      />
    </div>
  );
}
