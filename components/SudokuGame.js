'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import SudokuBoard from './SudokuBoard';
import GameControls from './GameControls';
import Timer from './Timer';
import Scoreboard from './Scoreboard';
import GameHeader from './GameHeader';
import GameStats from './GameStats';
import NumberPad from './NumberPad';
import styles from './SudokuGame.module.css';
import ConfirmationModal from './ConfirmationModal';
import { createEmptyBoard, generatePuzzle, deepCopy, EMPTY } from '../lib/sudoku.mjs';

const DEFAULT_DIFFICULTY = 'medium';
const SCORE_STORAGE_KEY = 'sudokuTopScores';
const ACTIVE_GAME_STORAGE_KEY = 'sudokuActiveGame';
const SAVE_VERSION = 1;
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

/*
Save format (version 1):
{
  version: 1,
  board: number[9][9],
  solution: number[9][9],
  prefilled: boolean[9][9],
  hinted: boolean[9][9],
  notes: number[][][9][9],
  difficulty: string,
  elapsedSeconds: number,
  mistakes: number,
  undoHistory: Array<{board,notes,mistakes,row,col,value,notesCell}>,
  redoHistory: Array<...>,
  notesMode: boolean,
  isPaused: boolean,
  selectedCell: {row,col} | null
}

We version the saved object so future changes can be ignored safely.
*/

const loadActiveGameFromStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_GAME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== SAVE_VERSION) {
      // Unsupported or missing version; remove and ignore
      window.localStorage.removeItem(ACTIVE_GAME_STORAGE_KEY);
      return null;
    }

    // Basic validation of required fields
    const okArrayGrid = (g, check) => Array.isArray(g) && g.length === 9 && g.every((r) => Array.isArray(r) && r.length === 9 && r.every(check));
    if (!okArrayGrid(parsed.board, (v) => typeof v === 'number')) return null;
    if (!okArrayGrid(parsed.solution, (v) => typeof v === 'number')) return null;
    if (!okArrayGrid(parsed.prefilled, (v) => typeof v === 'boolean')) return null;
    if (!okArrayGrid(parsed.hinted, (v) => typeof v === 'boolean')) return null;
    if (!Array.isArray(parsed.notes) || parsed.notes.length !== 9) return null;

    // notes deep validation (each cell array of numbers)
    for (let r = 0; r < 9; r += 1) {
      if (!Array.isArray(parsed.notes[r]) || parsed.notes[r].length !== 9) return null;
      for (let c = 0; c < 9; c += 1) {
        if (!Array.isArray(parsed.notes[r][c])) return null;
        if (!parsed.notes[r][c].every((n) => typeof n === 'number')) return null;
      }
    }

    // undo/redo optional but if present must be arrays
    if (parsed.undoHistory && !Array.isArray(parsed.undoHistory)) return null;
    if (parsed.redoHistory && !Array.isArray(parsed.redoHistory)) return null;

    return parsed;
  } catch (error) {
    console.error('Failed to parse saved active game', error);
    try {
      window.localStorage.removeItem(ACTIVE_GAME_STORAGE_KEY);
    } catch (e) {
      // ignore
    }
    return null;
  }
};

const saveActiveGameToStorage = (payload) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACTIVE_GAME_STORAGE_KEY, JSON.stringify({ version: SAVE_VERSION, ...payload }));
  } catch (error) {
    console.error('Failed to save active game', error);
  }
};

const removeActiveGameFromStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ACTIVE_GAME_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to remove active game', error);
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
  const createEmptyNotes = () => Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []));

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
  const [notesMode, setNotesMode] = useState(false);
  const [notes, setNotes] = useState(createEmptyNotes());
  const [mistakes, setMistakes] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [undoHistory, setUndoHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const boardRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const [originalPuzzle, setOriginalPuzzle] = useState(createEmptyBoard());
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'restart'|'newGame', open: true }
  const prevPauseRef = useRef({ wasPaused: false, wasRunning: false });

  const buildActiveGamePayload = () => ({
    board,
    solution,
    prefilled,
    hinted,
    notes,
    originalPuzzle,
    difficulty,
    elapsedSeconds,
    mistakes,
    undoHistory,
    redoHistory,
    notesMode,
    isPaused,
    selectedCell,
  });

  const scheduleSaveActiveGame = () => {
    // debounce writes to avoid saving too often (avoid saving every timer tick)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      try {
        saveActiveGameToStorage(buildActiveGamePayload());
      } catch (err) {
        console.error('Error scheduling save', err);
      }
    }, 600);
  };

  const isReadOnlyCell = (row, col, prefilledGrid, hintedGrid) => prefilledGrid[row][col] || hintedGrid[row][col];

  // Determine which user-entered cells conflict in row, column, or 3x3 box.
  // Prefilled and hinted cells are excluded from conflict styling.
  const findConflictCells = useCallback((boardToCheck, prefilledGrid, hintedGrid) => {
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
  }, []);

  const recordAction = ({ boardSnapshot, notesSnapshot, mistakesSnapshot, row, col, value, notesCell }) => {
    setUndoHistory((currentHistory) => [
      ...currentHistory,
      {
        board: boardSnapshot,
        notes: notesSnapshot,
        mistakes: mistakesSnapshot,
        row,
        col,
        value,
        notesCell,
      },
    ]);
    // A new edit clears redo history because redo is only valid for undone actions.
    setRedoHistory([]);
  };

  const restoreFromHistory = (historyEntry) => {
    setBoard(historyEntry.board);
    setNotes(historyEntry.notes);
    setMistakes(historyEntry.mistakes);
    setConflictCells(findConflictCells(historyEntry.board, prefilled, hinted));
    setIncorrectCells([]);
    setMessage('');
  };

  const clearNotesForCell = (currentNotes, row, col) => {
    const nextNotes = currentNotes.map((rowValues) => rowValues.map((noteValues) => noteValues.slice()));
    nextNotes[row][col] = [];
    return nextNotes;
  };

  const removeNoteFromPeers = (currentNotes, candidate, row, col) => {
    const nextNotes = currentNotes.map((rowValues) => rowValues.map((noteValues) => noteValues.slice()));

    for (let c = 0; c < 9; c += 1) {
      if (c !== col) {
        nextNotes[row][c] = nextNotes[row][c].filter((value) => value !== candidate);
      }
    }

    for (let r = 0; r < 9; r += 1) {
      if (r !== row) {
        nextNotes[r][col] = nextNotes[r][col].filter((value) => value !== candidate);
      }
    }

    const boxRowStart = Math.floor(row / 3) * 3;
    const boxColStart = Math.floor(col / 3) * 3;

    for (let r = boxRowStart; r < boxRowStart + 3; r += 1) {
      for (let c = boxColStart; c < boxColStart + 3; c += 1) {
        if (r !== row || c !== col) {
          nextNotes[r][c] = nextNotes[r][c].filter((value) => value !== candidate);
        }
      }
    }

    return nextNotes;
  };

  const updateNotesForCell = (currentNotes, row, col, candidate) => {
    const nextNotes = currentNotes.map((rowValues) => rowValues.map((noteValues) => noteValues.slice()));
    const existingNotes = nextNotes[row][col];
    const hasCandidate = existingNotes.includes(candidate);

    if (hasCandidate) {
      nextNotes[row][col] = existingNotes.filter((value) => value !== candidate);
    } else {
      nextNotes[row][col] = [...existingNotes, candidate].sort((a, b) => a - b);
    }

    return nextNotes;
  };

  const clearNotesForValuePlacement = (currentNotes, candidate, row, col) => {
    let nextNotes = clearNotesForCell(currentNotes, row, col);
    nextNotes = removeNoteFromPeers(nextNotes, candidate, row, col);
    return nextNotes;
  };

  const toggleNoteForCell = (currentNotes, row, col, candidate) => {
    const nextNotes = currentNotes.map((rowValues) => rowValues.map((noteValues) => noteValues.slice()));
    const existingNotes = nextNotes[row][col];
    if (existingNotes.includes(candidate)) {
      nextNotes[row][col] = existingNotes.filter((value) => value !== candidate);
    } else {
      nextNotes[row][col] = [...existingNotes, candidate].sort((a, b) => a - b);
    }
    return nextNotes;
  };

  const isRelatedCell = (row, col) => {
    if (!selectedCell) {
      return false;
    }

    const sameRow = selectedCell.row === row;
    const sameCol = selectedCell.col === col;
    const sameBox =
      Math.floor(selectedCell.row / 3) === Math.floor(row / 3) &&
      Math.floor(selectedCell.col / 3) === Math.floor(col / 3);

    return sameRow || sameCol || sameBox;
  };

  const selectedValue = selectedCell ? board[selectedCell.row][selectedCell.col] : null;
  const selectedNumber = selectedValue && selectedValue !== EMPTY ? selectedValue : null;
  const isSameNumberCell = (row, col) => selectedNumber !== null && board[row][col] === selectedNumber;

  const handleCellSelect = (row, col) => {
    setSelectedCell({ row, col });
    if (boardRef.current) {
      boardRef.current.focus();
    }
  };

  const hasMeaningfulProgress = () => {
    // Check user-entered values differ from original puzzle
    for (let r = 0; r < 9; r += 1) {
      for (let c = 0; c < 9; c += 1) {
        if (board[r][c] !== (originalPuzzle[r][c] || 0)) {
          // If it's a user-entered value (original was empty) or changed prefilled (shouldn't happen)
          if (board[r][c] !== originalPuzzle[r][c]) return true;
        }
      }
    }

    // Check notes
    for (let r = 0; r < 9; r += 1) {
      for (let c = 0; c < 9; c += 1) {
        if (notes[r][c] && notes[r][c].length > 0) return true;
      }
    }

    // Check hints
    for (let r = 0; r < 9; r += 1) {
      for (let c = 0; c < 9; c += 1) {
        if (hinted[r][c]) return true;
      }
    }

    // Mistakes
    if (mistakes > 0) return true;

    return false;
  };

  const moveSelectedCell = (deltaRow, deltaCol) => {
    if (!selectedCell) {
      return;
    }

    const nextRow = Math.min(8, Math.max(0, selectedCell.row + deltaRow));
    const nextCol = Math.min(8, Math.max(0, selectedCell.col + deltaCol));
    setSelectedCell({ row: nextRow, col: nextCol });
  };

  const handleBoardKeyDown = (event) => {
    if (!selectedCell || isPaused || isGameOver || scoreRecordedForCurrentPuzzle || (confirmModal && confirmModal.open)) {
      return;
    }

    const { row, col } = selectedCell;

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveSelectedCell(-1, 0);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveSelectedCell(1, 0);
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveSelectedCell(0, -1);
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveSelectedCell(0, 1);
      return;
    }

    if (/^[1-9]$/.test(event.key)) {
      event.preventDefault();
      handleCellChange(row, col, event.key);
      return;
    }

    if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
      event.preventDefault();
      handleCellChange(row, col, '');
    }
  };

  const handleNumberPadInput = (n) => {
    if (isPaused || isGameOver || scoreRecordedForCurrentPuzzle) return;
    if (!selectedCell) return;
    handleCellChange(selectedCell.row, selectedCell.col, String(n));
    if (boardRef.current) boardRef.current.focus();
  };

  const initializeGame = (selectedDifficulty = difficulty) => {
    const { puzzle, solution: solvedBoard, prefilled: prefilledCells } = generatePuzzle(selectedDifficulty);
    setBoard(deepCopy(puzzle));
    setOriginalPuzzle(deepCopy(puzzle));
    setSolution(deepCopy(solvedBoard));
    setPrefilled(prefilledCells);
    setHinted(createBooleanGrid());
    setConflictCells([]);
    setIncorrectCells([]);
    setNotes(createEmptyNotes());
    setNotesMode(false);
    setSelectedCell(null);
    setUndoHistory([]);
    setRedoHistory([]);
    setElapsedSeconds(0);
    setIsTimerRunning(true);
    setIsPaused(false);
    setMistakes(0);
    setIsGameOver(false);
    setMessage('');
    setMessageColor('#d32f2f');
    setScoreRecordedForCurrentPuzzle(false);

    // Persist the newly initialized game replacing any prior saved game
    try {
      saveActiveGameToStorage({
        board: deepCopy(puzzle),
        solution: deepCopy(solvedBoard),
        prefilled: prefilledCells,
        hinted: createBooleanGrid(),
        notes: createEmptyNotes(),
        difficulty: selectedDifficulty,
        elapsedSeconds: 0,
        mistakes: 0,
        undoHistory: [],
        redoHistory: [],
        notesMode: false,
        isPaused: false,
        selectedCell: null,
        originalPuzzle: deepCopy(puzzle),
      });
    } catch (err) {
      // ignore storage errors
    }
  };

  // Attempt to restore game on first client render.
  useEffect(() => {
    const storedScores = loadSavedScores();
    setScores(sortScores(storedScores));
    // Try to restore an active unfinished game from storage. If none found, start a new puzzle.
    const saved = loadActiveGameFromStorage();
    if (saved) {
      // Restore full game state from saved payload
      setBoard(saved.board);
      setSolution(saved.solution);
      setPrefilled(saved.prefilled);
      setHinted(saved.hinted);
      setNotes(saved.notes);
      setDifficulty(saved.difficulty || DEFAULT_DIFFICULTY);
      setElapsedSeconds(saved.elapsedSeconds || 0);
      setMistakes(saved.mistakes || 0);
      setUndoHistory(saved.undoHistory || []);
      setRedoHistory(saved.redoHistory || []);
      setNotesMode(Boolean(saved.notesMode));
      setIsPaused(Boolean(saved.isPaused));
      setIsTimerRunning(!saved.isPaused);
      setSelectedCell(saved.selectedCell || null);
      setOriginalPuzzle(saved.originalPuzzle || saved.board || createEmptyBoard());
      setConflictCells(findConflictCells(saved.board, saved.prefilled, saved.hinted));
      setIncorrectCells([]);
      setMessage('');
      setMessageColor('#d32f2f');
      setScoreRecordedForCurrentPuzzle(false);
    } else {
      const startGame = () => {
        const { puzzle, solution: solvedBoard, prefilled: prefilledCells } = generatePuzzle(DEFAULT_DIFFICULTY);
        setBoard(deepCopy(puzzle));
        setSolution(deepCopy(solvedBoard));
        setPrefilled(prefilledCells);
        setHinted(createBooleanGrid());
        setConflictCells([]);
        setIncorrectCells([]);
        setNotes(createEmptyNotes());
        setNotesMode(false);
        setSelectedCell(null);
        setUndoHistory([]);
        setRedoHistory([]);
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
    }
  }, [findConflictCells]);

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

  // Persist active game when meaningful gameplay state changes, but avoid saving every timer tick.
  useEffect(() => {
    // If the game has completed or is recorded to scoreboard, remove any saved unfinished game.
    if (isGameOver || scoreRecordedForCurrentPuzzle) {
      removeActiveGameFromStorage();
      return;
    }

    // Otherwise schedule a save of the current active game state.
    scheduleSaveActiveGame();

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, notes, hinted, mistakes, undoHistory, redoHistory, notesMode, isPaused, difficulty, selectedCell, isGameOver, scoreRecordedForCurrentPuzzle]);

  const handleNotesToggle = () => {
    setNotesMode((current) => !current);
    setMessage('');
  };

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

  const handleUndo = () => {
    if (isPaused || isGameOver || scoreRecordedForCurrentPuzzle || undoHistory.length === 0) {
      return;
    }

    const previousHistory = undoHistory[undoHistory.length - 1];
    const nextUndoHistory = undoHistory.slice(0, -1);
    const currentSnapshot = {
      board: deepCopy(board),
      notes: notes.map((rowValues) => rowValues.map((noteValues) => noteValues.slice())),
      mistakes,
    };

    setUndoHistory(nextUndoHistory);
    setRedoHistory((history) => [...history, currentSnapshot]);
    restoreFromHistory(previousHistory);
  };

  const handleRedo = () => {
    if (isPaused || isGameOver || scoreRecordedForCurrentPuzzle || redoHistory.length === 0) {
      return;
    }

    const lastRedo = redoHistory[redoHistory.length - 1];
    const nextRedoHistory = redoHistory.slice(0, -1);
    const currentSnapshot = {
      board: deepCopy(board),
      notes: notes.map((rowValues) => rowValues.map((noteValues) => noteValues.slice())),
      mistakes,
    };

    setRedoHistory(nextRedoHistory);
    setUndoHistory((history) => [...history, currentSnapshot]);
    restoreFromHistory(lastRedo);
  };

  const handleCellChange = (row, col, value) => {
    if (isPaused || isGameOver || scoreRecordedForCurrentPuzzle) {
      return;
    }

    if (isReadOnlyCell(row, col, prefilled, hinted)) {
      return;
    }

    if (notesMode && board[row][col] === EMPTY) {
      const candidate = Number(value.replace(/[^1-9]/g, '').slice(0, 1));
      if (!candidate) {
        return;
      }

      recordAction({
        boardSnapshot: deepCopy(board),
        notesSnapshot: notes.map((rowValues) => rowValues.map((noteValues) => noteValues.slice())),
        mistakesSnapshot: mistakes,
        row,
        col,
        value: board[row][col],
        notesCell: notes[row][col],
      });

      setNotes((currentNotes) => toggleNoteForCell(currentNotes, row, col, candidate));
      setMessage('');
      return;
    }

    const cleaned = value.replace(/[^1-9]/g, '').slice(0, 1);
    const nextBoard = deepCopy(board);
    const previousValue = board[row][col];
    const nextValue = cleaned ? Number(cleaned) : EMPTY;

    if (nextValue === previousValue) {
      return;
    }

    recordAction({
      boardSnapshot: deepCopy(board),
      notesSnapshot: notes.map((rowValues) => rowValues.map((noteValues) => noteValues.slice())),
      mistakesSnapshot: mistakes,
      row,
      col,
      value: previousValue,
      notesCell: notes[row][col],
    });

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
        // Clear saved active game on game over
        removeActiveGameFromStorage();
      } else {
        setMessage('Incorrect entry.');
      }
    } else {
      setMessage('');
    }

    if (nextValue !== EMPTY) {
      setNotes((currentNotes) => clearNotesForValuePlacement(currentNotes, nextValue, row, col));
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

  const performRestart = () => {
    // Reset board to original puzzle values and clear transient gameplay state
    setBoard(deepCopy(originalPuzzle));
    setNotes(createEmptyNotes());
    setHinted(createBooleanGrid());
    setMistakes(0);
    setElapsedSeconds(0);
    setIsTimerRunning(true);
    setIsPaused(false);
    setUndoHistory([]);
    setRedoHistory([]);
    setNotesMode(false);
    setSelectedCell(null);
    setConflictCells([]);
    setIncorrectCells([]);
    setMessage('');
    setMessageColor('#d32f2f');
    setIsGameOver(false);
    setScoreRecordedForCurrentPuzzle(false);

    // Persist restarted state
    try {
      saveActiveGameToStorage({
        board: deepCopy(originalPuzzle),
        solution,
        prefilled,
        hinted: createBooleanGrid(),
        notes: createEmptyNotes(),
        originalPuzzle,
        difficulty,
        elapsedSeconds: 0,
        mistakes: 0,
        undoHistory: [],
        redoHistory: [],
        notesMode: false,
        isPaused: false,
        selectedCell: null,
      });
    } catch (err) {
      // ignore
    }
  };

  const handleRestartClick = () => {
    if (isGameOver || scoreRecordedForCurrentPuzzle) {
      // allow restart without confirmation in terminal states
      performRestart();
      return;
    }

    if (!hasMeaningfulProgress()) {
      performRestart();
      return;
    }

    // show confirmation modal and pause
    prevPauseRef.current = { wasPaused: isPaused, wasRunning: isTimerRunning };
    setIsPaused(true);
    setIsTimerRunning(false);
    setConfirmModal({ type: 'restart', open: true });
  };

  const handleNewGameClick = () => {
    if (isGameOver || scoreRecordedForCurrentPuzzle) {
      // allow immediate new game after completion or game over
      initializeGame(difficulty);
      return;
    }

    if (!hasMeaningfulProgress()) {
      initializeGame(difficulty);
      return;
    }

    prevPauseRef.current = { wasPaused: isPaused, wasRunning: isTimerRunning };
    setIsPaused(true);
    setIsTimerRunning(false);
    setConfirmModal({ type: 'newGame', open: true });
  };

  const handleConfirmCancel = () => {
    // restore previous paused/running state
    setConfirmModal(null);
    const { wasPaused, wasRunning } = prevPauseRef.current || { wasPaused: false, wasRunning: false };
    setIsPaused(wasPaused);
    setIsTimerRunning(wasRunning);
  };

  const handleConfirmProceed = () => {
    if (!confirmModal) return;
    const { type } = confirmModal;
    setConfirmModal(null);
    if (type === 'restart') {
      performRestart();
    } else if (type === 'newGame') {
      initializeGame(difficulty);
    }
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
        // Remove any saved unfinished game when puzzle is completed
        removeActiveGameFromStorage();
      }
    } else {
      setMessageColor('#d32f2f');
      setMessage('Some cells are incorrect.');
    }
  };

  return (
    <div className={styles.root}>
      <div className="appContainer">
        <GameHeader theme={theme} onThemeToggle={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))} />

        <div className={styles.topArea}>
          <GameStats difficulty={difficulty} elapsedSeconds={elapsedSeconds} mistakes={mistakes} maxMistakes={MAX_MISTAKES} />
        </div>

        <div className={styles.gameGrid}>
  <div className={styles.boardCard}>
    <SudokuBoard
      board={board}
      prefilled={prefilled}
      hinted={hinted}
      notes={notes}
      incorrectCells={incorrectCells}
      conflictCells={conflictCells}
      selectedCell={selectedCell}
      onCellSelect={handleCellSelect}
      isRelatedCell={isRelatedCell}
      isSameNumberCell={isSameNumberCell}
      boardRef={boardRef}
      onBoardKeyDown={handleBoardKeyDown}
      isPaused={isPaused}
      isGameOver={isGameOver}
      onCellChange={handleCellChange}
    />
  </div>

  <aside className={styles.controlsCard}>
    <GameControls
      selectedDifficulty={difficulty}
      onDifficultyChange={handleDifficultyChange}
      onNewGame={handleNewGameClick}
      onRestart={handleRestartClick}
      onCheckSolution={checkSolution}
      onHint={handleHint}
      onUndo={handleUndo}
      onRedo={handleRedo}
      canUndo={undoHistory.length > 0}
      canRedo={redoHistory.length > 0}
      notesMode={notesMode}
      onNotesToggle={handleNotesToggle}
      isPaused={isPaused}
      isGameOver={isGameOver}
      onPauseToggle={handlePauseToggle}
      theme={theme}
      onThemeToggle={() =>
        setTheme((current) =>
          current === 'light' ? 'dark' : 'light'
        )
      }
      message={message}
      messageColor={messageColor}
    />

    <NumberPad
      onNumber={handleNumberPadInput}
      disabled={isPaused || isGameOver}
    />
  </aside>
</div>

        <div className={styles.scoreboardWrapper}>
          <Scoreboard scores={scores} />
        </div>

        <ConfirmationModal
          open={Boolean(confirmModal && confirmModal.open)}
          title={confirmModal?.type === 'restart' ? 'Restart Puzzle' : 'Start New Game'}
          message={
            confirmModal?.type === 'restart'
              ? 'Restart this puzzle? Your current progress will be lost.'
              : 'Start a new game? Your current progress will be lost.'
          }
          confirmLabel={confirmModal?.type === 'restart' ? 'Restart' : 'New Game'}
          cancelLabel="Cancel"
          onConfirm={handleConfirmProceed}
          onCancel={handleConfirmCancel}
        />
      </div>
    </div>
  );
}
