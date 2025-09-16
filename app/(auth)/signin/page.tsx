"use client";
import { useState } from "react";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ email, password }).toString(),
      redirect: "manual",
    });
    if (r.status === 0 || r.status === 302) window.location.href = "/chat";
    else alert("Sign in failed");
  }
  return (
    <main className="min-h-dvh grid place-items-center">
      <form onSubmit={onSubmit} className="w-80 rounded-xl border border-white/10 bg-panel p-6 shadow-soft">
        <h1 className="text-xl font-semibold mb-4">Sign in</h1>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full mb-2 px-3 py-2 rounded bg-black/20 border border-white/10 outline-none" />
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" className="w-full mb-4 px-3 py-2 rounded bg-black/20 border border-white/10 outline-none" />
        <button className="w-full px-3 py-2 rounded bg-white/10 hover:bg-white/20 border border-white/10">Continue</button>
        <p className="text-xs text-white/50 mt-4">No account? <a href="/signup" className="underline">Sign up</a></p>
      </form>
    </main>
  );
}
