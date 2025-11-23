export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div
          className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4"
          style={{ borderColor: 'var(--color-primary)' }}
        ></div>
        <p className="mt-4 text-lg text-white">Loading...</p>
      </div>
    </div>
  );
}
