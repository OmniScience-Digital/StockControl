"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6 text-center">
      <h2 className="text-red-600 font-semibold">Something went wrong</h2>
      <p className="text-gray-500 text-sm mt-2">{error.message}</p>
      <button
        onClick={() => reset()}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
      >
        Try Again
      </button>
    </div>
  );
}
