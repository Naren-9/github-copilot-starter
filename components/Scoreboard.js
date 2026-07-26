'use client';

import styles from './Scoreboard.module.css';

// Format seconds as MM:SS for leaderboard display.
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
};

// Display a readable completed date.
const formatDate = (isoDate) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(isoDate));

export default function Scoreboard({ scores }) {
  return (
    <section className={styles.scoreboardSection}>
      <h2 className={styles.heading}>Top 10 Scores</h2>
      {scores.length === 0 ? (
        <p className={styles.empty}>No completed games yet. Solve a puzzle to add a score.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.scoreboard}>
            <thead>
              <tr>
                <th>#</th>
                <th>Difficulty</th>
                <th>Time</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score, index) => (
                <tr key={score.id}>
                  <td>{index + 1}</td>
                  <td>{score.difficultyLabel}</td>
                  <td>{formatTime(score.completionTime)}</td>
                  <td>{formatDate(score.dateCompleted)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
