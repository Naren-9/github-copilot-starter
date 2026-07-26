'use client';

import { useEffect, useState } from 'react';
import SudokuBoard from './SudokuBoard';
import GameControls from './GameControls';

const SIZE = 9;
const EMPTY = 0;
const STARTING_CLUES = 35;

function createEmptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
}

function deepCopy(board) {
  return board.map((row) => row.slice());
}

function isSafe(board, row, col, num) {
  for (let x = 0; x < SIZE; x += 1) {
    if (board[row][x] === num || board[x][col] === num) {
      return false;
    }
  }

  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      if (board[startRow + i][startCol + j] === num) {
        return false;
      }
    }
  }

  return true;
}

function shuffleArray(array) {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }
  return shuffled;
}

function fillBoard(board) {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (board[row][col] === EMPTY) {
        const candidates = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
          const candidate = candidates[candidateIndex];
          if (isSafe(board, row, col, candidate)) {
            board[row][col] = candidate;
            if (fillBoard(board)) {
              return true;
            }
            board[row][col] = EMPTY;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function removeCells(board, clues) {
  let attempts = SIZE * SIZE - clues;
  while (attempts > 0) {
    const row = Math.floor(Math.random() * SIZE);
    const col = Math.floor(Math.random() * SIZE);
    if (board[row][col] !== EMPTY) {
      board[row][col] = EMPTY;
      attempts -= 1;
    }
  }
}

// Stateful container that owns the Sudoku board, solution, and game feedback.
export default function SudokuGame() {
  const [board, setBoard] = useState(createEmptyBoard());
  const [solution, setSolution] = useState(createEmptyBoard());
  const [prefilled, setPrefilled] = useState(createEmptyBoard());
  const [incorrectCells, setIncorrectCells] = useState([]);
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('#d32f2f');

  const initializeGame = () => {
    const newBoard = createEmptyBoard();
    fillBoard(newBoard);
    const solvedBoard = deepCopy(newBoard);
    const puzzleBoard = deepCopy(newBoard);
    removeCells(puzzleBoard, STARTING_CLUES);

    const prefilledBoard = puzzleBoard.map((row) => row.map((cell) => cell !== EMPTY));
    setBoard(deepCopy(puzzleBoard));
    setSolution(solvedBoard);
    setPrefilled(prefilledBoard);
    setIncorrectCells([]);
    setMessage('');
  };

  useEffect(() => {
    initializeGame();
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

  const checkSolution = () => {
    const incorrect = [];
    let correct = true;

    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
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
        onNewGame={initializeGame}
        onCheckSolution={checkSolution}
        message={message}
        messageColor={messageColor}
      />
    </div>
  );
}
