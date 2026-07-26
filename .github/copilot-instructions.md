# GitHub Copilot Instructions

## Project Overview

This project refactors a legacy JavaScript Sudoku game into a modern
React and Next.js application.

Follow these instructions whenever generating or modifying code.

## Technology Requirements

- Use Next.js with the App Router.
- Use React functional components.
- Use JavaScript ES6 or later.
- Use ESLint.
- Never use `var`.
- Prefer `const` and `let`.
- Use modern JavaScript syntax.
- Use CSS Modules for component styling.

## React Architecture

Split the application into small, reusable React components.

At minimum, create components for:

- SudokuBoard
- SudokuCell
- GameControls
- DifficultySelector
- Timer
- ScoreBoard
- ThemeToggle

Use React hooks where appropriate.

## Sudoku Requirements

The application must:

- Use a 9x9 Sudoku board.
- Generate valid Sudoku puzzles.
- Generate puzzles with exactly one unique solution.
- Support Easy, Medium, and Hard difficulties.
- Use fewer prefilled cells for harder difficulties.
- Allow user input only from 1 through 9.
- Prevent users from modifying prefilled cells.
- Detect row, column, and 3x3 box conflicts immediately.
- Highlight the entered cell and other conflicting cells.
- Remove conflict highlighting when the conflict is fixed.
- Automatically detect a correctly completed puzzle.
- Display a congratulations message after completion.

## Game Features

Implement:

- New Game button
- Easy, Medium, and Hard difficulty selector
- Check button
- Hint button
- Game timer
- Light/dark mode toggle
- Top 10 fastest-times scoreboard

A cell filled by the Hint button must have a distinct appearance and
become read-only for the remainder of the game.

## Scoreboard

Use localStorage to store the Top 10 fastest completion times.

Each score must contain:

- Player name
- Completion time
- Difficulty level
- Number of hints used

Sort scores from fastest to slowest and keep only the fastest 10.

## Styling

- Support accessible light and dark themes.
- Make the application responsive for desktop and mobile.
- Alternate background colors between 3x3 Sudoku regions.
- Zebra stripe the Top 10 scoreboard.
- Avoid visible layout shifts when cells are selected or highlighted.
- Use accessible color contrast and controls.

## Error Handling

Use try/catch where appropriate.

Handle errors gracefully and show user-friendly messages instead of
technical errors.

## Code Quality

- Use ES6+ JavaScript.
- Add useful comments explaining important functions and logic.
- Use descriptive variable and function names.
- Avoid unnecessary code duplication.
- Keep React components small and reusable.
- Follow ESLint recommendations.