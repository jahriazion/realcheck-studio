"use client";
import { useState } from "react";

export default function SignUp() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/register", { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({ email, password })});
    const j = await r.json();
    if (j.ok) window.location.href = "/signin";
    else alert(j.error || "Failed");
  }
  return (
    <main className="min-h-dvh grid place-items-center">
      <form onSubmit={onSubmit} className="w-80 rounded-xl border border-white/10 bg-panel p-6 shadow-soft">
        <h1 className="text-xl font-semibold mb-4">Create account</h1>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full mb-2 px-3 py-2 rounded bg-black/20 border border-white/10 outline-none" />
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" className="w-full mb-4 px-3 py-2 rounded bg-black/20 border border-white/10 outline-none" />
        <button className="w-full px-3 py-2 rounded bg-white/10 hover:bg-white/20 border border-white/10">Create</button>
        <p className="text-xs text-white/50 mt-4">Have an account? <a href="/signin" className="underline">Sign in</a></p>
      </form>
    </main>
  );
}
