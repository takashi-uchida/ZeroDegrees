'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
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
      </body>
    </html>
  );
}
