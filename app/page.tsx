import Link from "next/link";

export default function Home() {
  return (
    <main className="h-dvh grid place-items-center">
      <div className="text-center">
        <h1 className="text-3xl font-semibold mb-2">RealCheck</h1>
        <p className="text-muted">Your private AI studio</p>
        <div className="mt-6">
          <Link href="/chat" className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 border border-white/10">
            Open Chat
          </Link>
        </div>
      </div>
    </main>
  );
}
