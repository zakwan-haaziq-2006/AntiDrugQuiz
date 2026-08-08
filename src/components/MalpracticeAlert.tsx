'use client';

import React, { useEffect, useState } from 'react';

interface MalpracticeAlertProps {
  onMalpracticeDetected?: (eventType: string, incidentCount: number) => void;
  onDisqualified?: () => void;
}

export const MalpracticeAlert: React.FC<MalpracticeAlertProps> = ({
  onMalpracticeDetected,
  onDisqualified,
}) => {
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [incidentCount, setIncidentCount] = useState<number>(0);
  const [isDisqualified, setIsDisqualified] = useState<boolean>(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerMalpractice('TAB_SWITCH');
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const triggerMalpractice = async (eventType: string) => {
    try {
      const res = await fetch('/api/quiz/malpractice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, metadata: { time: new Date().toISOString() } }),
      });

      const data = await res.json();
      const count = data.incidentCount || incidentCount + 1;
      setIncidentCount(count);
      setShowAlert(true);

      if (data.disqualified || count > 2) {
        setIsDisqualified(true);
        if (onDisqualified) onDisqualified();
      }

      if (onMalpracticeDetected) {
        onMalpracticeDetected(eventType, count);
      }
    } catch (e) {
      console.error('Failed to log malpractice event:', e);
    }
  };

  if (!showAlert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-lg border border-red-800 bg-neutral-900 p-6 shadow-2xl text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-950/80 text-red-500 font-bold text-2xl border border-red-800/60 animate-bounce">
          {isDisqualified ? '❌' : '⚠'}
        </div>

        <h3 className="text-xl font-bold text-red-500 mb-2">
          {isDisqualified ? 'DISQUALIFIED FROM COMPETITION' : 'MALPRACTICE WARNING'}
        </h3>

        <p className="text-sm text-neutral-300 leading-relaxed mb-4">
          {isDisqualified ? (
            <span className="text-red-300 font-medium">
              You exceeded the maximum limit of 2 malpractice warnings. Your quiz attempt has been terminated and marked as disqualified.
            </span>
          ) : (
            <span>
              You navigated away from the quiz window. This activity has been recorded.
            </span>
          )}
        </p>

        <div className="mb-5 rounded border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-400 font-mono flex items-center justify-between">
          <span>Malpractice Status:</span>
          <span className={`font-bold ${isDisqualified ? 'text-red-500' : 'text-amber-400'}`}>
            {isDisqualified ? 'DISQUALIFIED (>2)' : `Warning ${incidentCount} of 2`}
          </span>
        </div>

        {isDisqualified ? (
          <div className="p-3 rounded bg-red-950/50 border border-red-900/60 text-xs text-red-300 font-medium leading-relaxed">
            You cannot continue this attempt or re-register for this event.
          </div>
        ) : (
          <button
            onClick={() => setShowAlert(false)}
            className="w-full rounded bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Acknowledge & Return to Quiz
          </button>
        )}
      </div>
    </div>
  );
};
