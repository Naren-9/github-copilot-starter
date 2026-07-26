'use client';

import styles from './GameHeader.module.css';

export default function GameHeader({ theme, onThemeToggle }) {
  return (
    <header className={styles.header}>
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>Sudoku</h1>
        <p className={styles.subtitle}>Focus • Think • Solve</p>
      </div>
      <div className={styles.actions}>
        <button className={styles.themeButton} type="button" onClick={onThemeToggle} aria-label="Toggle theme">
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </div>
    </header>
  );
}
