'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold text-white">
          Something went wrong!
        </h2>
        <p className="mb-6 text-slate-400">{error.message}</p>
        <button
          onClick={reset}
          className="rounded-lg bg-sky-500 px-6 py-3 text-white hover:bg-sky-600"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
