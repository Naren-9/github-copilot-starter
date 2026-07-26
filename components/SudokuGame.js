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
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('#d32f2f');
  const [difficulty, setDifficulty] = useState(DEFAULT_DIFFICULTY);

  const initializeGame = (selectedDifficulty = difficulty) => {
    const { puzzle, solution: solvedBoard, prefilled: prefilledCells } = generatePuzzle(selectedDifficulty);
    setBoard(deepCopy(puzzle));
    setSolution(deepCopy(solvedBoard));
    setPrefilled(prefilledCells);
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
      setIncorrectCells([]);
      setMessage('');
      setMessageColor('#d32f2f');
      setDifficulty(DEFAULT_DIFFICULTY);
    };

    startGame();
  }, []);

  const handleCellChange = (row, col, value) => {
    const cleaned = value.replace(/[^1-9]/g, '').slice(0, 1);
    setBoard((prevBoard) => {
      const nextBoard = deepCopy(prevBoard);
      nextBoard[row][col] = cleaned ? Number(cleaned) : EMPTY;
      return nextBoard;
    });
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
