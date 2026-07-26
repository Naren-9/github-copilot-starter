const SIZE = 9;
export const EMPTY = 0;

// Create a fresh 9x9 Sudoku board filled with empty cells (0).
export function createEmptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
}

// Deep copy a board so the original is never mutated by solver routines.
export function deepCopy(board) {
  return board.map((row) => row.slice());
}

// Check whether a value is valid at the given position based on Sudoku rules.
export function isSafe(board, row, col, value) {
  for (let x = 0; x < SIZE; x += 1) {
    if (board[row][x] === value || board[x][col] === value) {
      return false;
    }
  }

  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      if (board[startRow + r][startCol + c] === value) {
        return false;
      }
    }
  }

  return true;
}

// Return a shuffled copy of an array using Fisher-Yates.
export function shuffleArray(array) {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Fill a board completely with a valid Sudoku solution using backtracking.
function fillBoard(board) {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (board[row][col] === EMPTY) {
        const candidates = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (let index = 0; index < candidates.length; index += 1) {
          const candidate = candidates[index];
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

// Generate a full valid Sudoku solution board.
export function generateFullSolution() {
  const board = createEmptyBoard();
  if (!fillBoard(board)) {
    throw new Error('Failed to generate a full Sudoku solution');
  }
  return board;
}

// Recursively count how many solutions the given board has.
// Stops as soon as the count reaches maxSolutions for efficiency.
export function countSolutions(board, maxSolutions = 2) {
  let solutions = 0;

  function solveRecursive(currentBoard) {
    if (solutions >= maxSolutions) {
      return;
    }

    let emptyRow = -1;
    let emptyCol = -1;
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        if (currentBoard[row][col] === EMPTY) {
          emptyRow = row;
          emptyCol = col;
          break;
        }
      }
      if (emptyRow !== -1) {
        break;
      }
    }

    if (emptyRow === -1) {
      solutions += 1;
      return;
    }

    for (let value = 1; value <= SIZE; value += 1) {
      if (isSafe(currentBoard, emptyRow, emptyCol, value)) {
        currentBoard[emptyRow][emptyCol] = value;
        solveRecursive(currentBoard);
        currentBoard[emptyRow][emptyCol] = EMPTY;
        if (solutions >= maxSolutions) {
          return;
        }
      }
    }
  }

  solveRecursive(deepCopy(board));
  return solutions;
}

const difficultyClues = {
  easy: 40,
  medium: 34,
  hard: 28,
};

// Generate a puzzle with the requested number of clues.
// Each removed cell is validated so the resulting puzzle has exactly one solution.
export function generatePuzzle(difficulty) {
  const clues = difficultyClues[difficulty] ?? difficultyClues.medium;
  const solution = generateFullSolution();
  const puzzle = deepCopy(solution);

  const allCells = [];
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      allCells.push({ row, col });
    }
  }

  const removalOrder = shuffleArray(allCells);
  let currentClues = SIZE * SIZE;

  for (let index = 0; index < removalOrder.length && currentClues > clues; index += 1) {
    const { row, col } = removalOrder[index];
    const removedValue = puzzle[row][col];
    puzzle[row][col] = EMPTY;

    const remainingSolutions = countSolutions(puzzle, 2);
    if (remainingSolutions !== 1) {
      puzzle[row][col] = removedValue;
    } else {
      currentClues -= 1;
    }
  }

  const prefilled = puzzle.map((row) => row.map((cell) => cell !== EMPTY));
  return { puzzle, solution, prefilled };
}
