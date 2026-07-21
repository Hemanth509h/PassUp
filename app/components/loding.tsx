"use client";
import { useEffect, useState } from 'react';
import './css/Loading.css';

export const Spinner = ({ size = 'md', label = 'Loading' }) => (
  <span className={`spinner spinner-${size}`} role="status" aria-label={label} />
);


export default function LodingCard() {
  const [seconds, setSeconds] = useState<number>(0);
  const [showSlowNote, setShowSlowNote] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    const timeout = setTimeout(() => setShowSlowNote(true), 5000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);
  return (
    <div className="splash-screen">
      <div className="splash-card">
        <img src="/logo.png" alt="PassUp" className="splash-logo" />
        <h1 className="splash-title">PassUp</h1>
        <Spinner size="lg" />
        <p className="splash-status">
          {showSlowNote
            ? `Starting up… ${seconds}s (first load can take up to 50 seconds)`
            : 'Loading your dashboard…'}
        </p>
        {showSlowNote && (
          <p className="splash-note">
            The server wakes up on first visit. Please wait a moment.
          </p>
        )}
      </div>
    </div>
  );
}