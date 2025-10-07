"use client";
import { useEffect, useState } from "react";

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function upgrade() {
    setLoading(true); setError(null);
    const r = await fetch("/api/billing/checkout", { method: "POST" });
    const j = await r.json();
    setLoading(false);
    if (j.ok && j.url) window.location.href = j.url;
    else setError(j.error || "Unable to start checkout");
  }
  return (
    <main className="min-h-dvh p-6">
      <h1 className="text-2xl font-semibold mb-2">Settings</h1>
      <div className="card p-6 max-w-xl">
        <h2 className="font-semibold mb-2">Plan</h2>
        <p className="text-white/70 mb-4">Upgrade to RealCheck Pro for higher limits and priority models.</p>
        <button disabled={loading} onClick={upgrade} className="px-4 py-2 rounded bg-emerald-500/20 border border-emerald-400/30 hover:bg-emerald-500/30">
          {loading ? "Starting Checkout..." : "Upgrade to Pro"}
        </button>
        {error && <div className="text-red-400 mt-3 text-sm">{error}</div>}
        <p className="text-xs text-white/40 mt-4">For local dev without Stripe, set <code>RC_DEV_ALL_PRO=true</code> in .env and restart.</p>
      </div>
    </main>
  );
}
