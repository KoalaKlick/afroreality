import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight">fextiva</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Scalable Event Management, Ticketing, and Community Infrastructure
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white transition hover:bg-emerald-700"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-neutral-300 px-6 py-2.5 font-medium transition hover:bg-neutral-50"
        >
          Register
        </Link>
      </div>
    </main>
  );
}
