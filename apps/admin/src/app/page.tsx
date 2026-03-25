import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          ConnectGHIN Admin
        </h1>
        <p className="mt-2 text-slate-400">Where Golfers Connect — operations</p>
      </div>
      <Link
        href="/login"
        className="rounded-lg bg-fairway px-5 py-2.5 text-sm font-medium text-white hover:bg-fairway-light"
      >
        Admin sign in
      </Link>
    </main>
  );
}
