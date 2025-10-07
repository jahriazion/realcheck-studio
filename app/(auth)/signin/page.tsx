"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        alert("Sign in failed: " + result.error);
      } else if (result?.ok) {
        window.location.href = "/chat";
      }
    } catch (error) {
      alert("Sign in failed");
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <main className="min-h-dvh grid place-items-center">
      <form onSubmit={onSubmit} className="w-80 rounded-xl border border-white/10 bg-panel p-6 shadow-soft">
        <h1 className="text-xl font-semibold mb-4">Sign in</h1>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full mb-2 px-3 py-2 rounded bg-black/20 border border-white/10 outline-none" />
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" className="w-full mb-4 px-3 py-2 rounded bg-black/20 border border-white/10 outline-none" />
        <button disabled={isLoading} className="w-full px-3 py-2 rounded bg-white/10 hover:bg-white/20 border border-white/10 disabled:opacity-50">
          {isLoading ? "Signing in..." : "Continue"}
        </button>
        <p className="text-xs text-white/50 mt-4">No account? <a href="/signup" className="underline">Sign up</a></p>
      </form>
    </main>
  );
}
