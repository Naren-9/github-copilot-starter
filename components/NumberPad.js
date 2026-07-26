'use client';

import styles from './NumberPad.module.css';

export default function NumberPad({ onNumber, disabled = false }) {
  return (
    <div className={styles.pad} role="group" aria-label="Number pad">
      {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          className={styles.key}
          onClick={() => onNumber(n)}
          disabled={disabled}
          aria-label={`Number ${n}`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
