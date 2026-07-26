import { generatePuzzle, countSolutions } from './lib/sudoku.mjs';
const difficulties = ['easy','medium','hard'];
let passed = true;
for (const diff of difficulties) {
  const { puzzle } = generatePuzzle(diff);
  const clues = puzzle.flat().filter((x) => x !== 0).length;
  const unique = countSolutions(puzzle, 2);
  console.log(`${diff}: clues=${clues}, uniqueSolutions=${unique}`);
  if (unique !== 1) {
    console.error('FAILED', diff);
    passed = false;
  }
}
if (!passed) process.exit(1);
