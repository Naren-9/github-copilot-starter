'use client';

import { useEffect, useState } from 'react';
import SudokuBoard from './SudokuBoard';
import GameControls from './GameControls';
import Timer from './Timer';
import Scoreboard from './Scoreboard';
import { createEmptyBoard, generatePuzzle, deepCopy, EMPTY } from '../lib/sudoku.mjs';

const DEFAULT_DIFFICULTY = 'medium';
const SCORE_STORAGE_KEY = 'sudokuTopScores';
const MAX_SCORE_ENTRIES = 10;
const MAX_MISTAKES = 3;
const DIFFICULTY_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};
const DIFFICULTY_RANK = {
  hard: 1,
  medium: 2,
  easy: 3,
};

const loadSavedScores = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(SCORE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load saved scores', error);
    return [];
  }
};

const saveScoresToStorage = (scores) => {
  try {
    window.localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(scores));
  } catch (error) {
    console.error('Failed to save scores', error);
  }
};

const compareScores = (a, b) => {
  if (DIFFICULTY_RANK[a.difficulty] !== DIFFICULTY_RANK[b.difficulty]) {
    return DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty];
  }

  return a.completionTime - b.completionTime;
};

const sortScores = (scores) => [...scores].sort(compareScores);

const buildScoreEntry = (completionTime, difficulty) => {
  const dateCompleted = new Date().toISOString();
  return {
    id: `${difficulty}-${completionTime}-${dateCompleted}`,
    completionTime,
    difficulty,
    difficultyLabel: DIFFICULTY_LABELS[difficulty] || difficulty,
    dateCompleted,
  };
};

// Stateful container that owns the Sudoku board, difficulty, solution, hint state, and game feedback.
export default function SudokuGame() {
  const createBooleanGrid = () => Array.from({ length: 9 }, () => Array(9).fill(false));

  const [board, setBoard] = useState(createEmptyBoard());
  const [solution, setSolution] = useState(createEmptyBoard());
  const [prefilled, setPrefilled] = useState(createEmptyBoard());
  const [hinted, setHinted] = useState(createBooleanGrid());
  const [incorrectCells, setIncorrectCells] = useState([]);
  const [conflictCells, setConflictCells] = useState([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [theme, setTheme] = useState('light');
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('#d32f2f');
  const [difficulty, setDifficulty] = useState(DEFAULT_DIFFICULTY);
  const [scores, setScores] = useState([]);
  const [scoreRecordedForCurrentPuzzle, setScoreRecordedForCurrentPuzzle] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const isReadOnlyCell = (row, col, prefilledGrid, hintedGrid) => prefilledGrid[row][col] || hintedGrid[row][col];

  // Determine which user-entered cells conflict in row, column, or 3x3 box.
  // Prefilled and hinted cells are excluded from conflict styling.
  const findConflictCells = (boardToCheck, prefilledGrid, hintedGrid) => {
    const conflictSet = new Set();

    const markConflict = (row, col) => {
      if (!isReadOnlyCell(row, col, prefilledGrid, hintedGrid)) {
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
    setHinted(createBooleanGrid());
    setConflictCells([]);
    setIncorrectCells([]);
    setElapsedSeconds(0);
    setIsTimerRunning(true);
    setIsPaused(false);
    setMistakes(0);
    setIsGameOver(false);
    setMessage('');
    setMessageColor('#d32f2f');
    setScoreRecordedForCurrentPuzzle(false);
  };

  useEffect(() => {
    const storedScores = loadSavedScores();
    setScores(sortScores(storedScores));

    const startGame = () => {
      const { puzzle, solution: solvedBoard, prefilled: prefilledCells } = generatePuzzle(DEFAULT_DIFFICULTY);
      setBoard(deepCopy(puzzle));
      setSolution(deepCopy(solvedBoard));
      setPrefilled(prefilledCells);
      setHinted(createBooleanGrid());
      setConflictCells([]);
      setIncorrectCells([]);
      setElapsedSeconds(0);
      setIsTimerRunning(true);
      setIsPaused(false);
      setMistakes(0);
      setIsGameOver(false);
      setMessage('');
      setMessageColor('#d32f2f');
      setDifficulty(DEFAULT_DIFFICULTY);
      setScoreRecordedForCurrentPuzzle(false);
    };

    startGame();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    document.body.classList.toggle('light-theme', theme === 'light');
  }, [theme]);

  useEffect(() => {
    if (!isTimerRunning) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isTimerRunning]);

  const handlePauseToggle = () => {
    if (isGameOver || scoreRecordedForCurrentPuzzle) {
      return;
    }

    if (isPaused) {
      setIsPaused(false);
      setIsTimerRunning(true);
    } else {
      setIsPaused(true);
      setIsTimerRunning(false);
    }
  };

  const handleCellChange = (row, col, value) => {
    if (isPaused || isGameOver || scoreRecordedForCurrentPuzzle) {
      return;
    }

    const cleaned = value.replace(/[^1-9]/g, '').slice(0, 1);
    const nextBoard = deepCopy(board);
    const previousValue = board[row][col];
    const nextValue = cleaned ? Number(cleaned) : EMPTY;
    nextBoard[row][col] = nextValue;

    const isNewMistake =
      cleaned &&
      nextValue !== solution[row][col] &&
      nextValue !== previousValue;

    if (isNewMistake) {
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      setMessageColor('#d32f2f');

      if (nextMistakes >= MAX_MISTAKES) {
        setIsGameOver(true);
        setIsTimerRunning(false);
        setIsPaused(false);
        setMessage('Game Over. Too many mistakes.');
      } else {
        setMessage('Incorrect entry.');
      }
    } else {
      setMessage('');
    }

    setBoard(nextBoard);
    setConflictCells(findConflictCells(nextBoard, prefilled, hinted));
    setIncorrectCells([]);
  };

  const handleHint = () => {
    if (isPaused || isGameOver || scoreRecordedForCurrentPuzzle) {
      return;
    }

    const emptyCells = [];

    for (let row = 0; row < board.length; row += 1) {
      for (let col = 0; col < board[row].length; col += 1) {
        if (board[row][col] === EMPTY && !prefilled[row][col] && !hinted[row][col]) {
          emptyCells.push({ row, col });
        }
      }
    }

    if (emptyCells.length === 0) {
      setMessageColor('#d32f2f');
      setMessage('No empty cells remain for a hint.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const { row, col } = emptyCells[randomIndex];
    const nextBoard = deepCopy(board);
    nextBoard[row][col] = solution[row][col];

    const nextHinted = hinted.map((rowValues) => rowValues.slice());
    nextHinted[row][col] = true;

    setBoard(nextBoard);
    setHinted(nextHinted);
    setConflictCells(findConflictCells(nextBoard, prefilled, nextHinted));
    setIncorrectCells([]);
    setMessageColor('#388e3c');
    setMessage('A hint has been added.');
  };

  const handleDifficultyChange = (selectedDifficulty) => {
    setDifficulty(selectedDifficulty);
  };

  const checkSolution = () => {
    if (isPaused || isGameOver || scoreRecordedForCurrentPuzzle) {
      return;
    }

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
      setIsTimerRunning(false);
      setMessageColor('#388e3c');
      setMessage('Congratulations! You solved it!');

      if (!scoreRecordedForCurrentPuzzle) {
        const newScore = buildScoreEntry(elapsedSeconds, difficulty);
        const updatedScores = sortScores([...scores, newScore]).slice(0, MAX_SCORE_ENTRIES);
        setScores(updatedScores);
        saveScoresToStorage(updatedScores);
        setScoreRecordedForCurrentPuzzle(true);
      }
    } else {
      setMessageColor('#d32f2f');
      setMessage('Some cells are incorrect.');
    }
  };

  return (
    <div>
      <Timer
        elapsedSeconds={elapsedSeconds}
        isPaused={isPaused}
        mistakes={mistakes}
        maxMistakes={MAX_MISTAKES}
      />
      <SudokuBoard
        board={board}
        prefilled={prefilled}
        hinted={hinted}
        incorrectCells={incorrectCells}
        conflictCells={conflictCells}
        isPaused={isPaused}
        isGameOver={isGameOver}
        onCellChange={handleCellChange}
      />
      <GameControls
        selectedDifficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
        onNewGame={() => initializeGame(difficulty)}
        onCheckSolution={checkSolution}
        onHint={handleHint}
        isPaused={isPaused}
        isGameOver={isGameOver}
        onPauseToggle={handlePauseToggle}
        theme={theme}
        onThemeToggle={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
        message={message}
        messageColor={messageColor}
      />
      <Scoreboard scores={scores} />
    </div>
  );
}
