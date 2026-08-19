import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

/**
 * Shows a dismissible banner on first page load warning that the Render free
 * tier may take ~50s to wake from sleep. Disappears automatically once the
 * first API response arrives (keyed off a custom event from the axios client),
 * or after 90s, or when the user dismisses it.
 */
export function ColdStartBanner() {
  const [visible, setVisible] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // Only show if the first API call takes more than 4 seconds —
    // avoids a flash on a warm server.
    const showTimer = setTimeout(() => setVisible(true), 4000);

    const interval = setInterval(() => setElapsed(s => s + 1), 1000);

    const dismiss = () => { setVisible(false); clearInterval(interval); };

    // Listen for a custom event fired by the axios client on first response
    window.addEventListener('nexora:api-ready', dismiss);

    // Auto-dismiss after 90s regardless
    const autoHide = setTimeout(dismiss, 90_000);

    return () => {
      clearTimeout(showTimer);
      clearInterval(interval);
      clearTimeout(autoHide);
      window.removeEventListener('nexora:api-ready', dismiss);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="bg-ink text-white rounded-card shadow-card-md px-4 py-3 flex items-start gap-3">
        <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-warning animate-pulse" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold">Backend waking up ({elapsed}s)</p>
          <p className="text-[11px] text-white/60 mt-0.5">
            The free tier sleeps after 15 min of inactivity. First request takes ~50s.
            Everything is loading in the background.
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-white/40 hover:text-white text-lg leading-none flex-shrink-0 ml-1"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
