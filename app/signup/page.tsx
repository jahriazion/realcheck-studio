"use client";
import { useState } from "react";

export default function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const r = await fetch("/api/register", { 
      method: "POST", 
      headers: {"content-type":"application/json"}, 
      body: JSON.stringify({ 
        email, 
        password, 
        name: fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim()
      })
    });
    const j = await r.json();
    if (j.ok) window.location.href = "/signin";
    else alert(j.error || "Failed");
  }

  return (
    <main className="min-h-dvh grid place-items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <form onSubmit={onSubmit} className="w-96 rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur-xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-white/60">Join RealCheck and start chatting with AI</p>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">First Name</label>
              <input 
                value={firstName} 
                onChange={e => setFirstName(e.target.value)} 
                placeholder="Enter your first name" 
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/50 focus:border-green-500/50 focus:outline-none transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Last Name</label>
              <input 
                value={lastName} 
                onChange={e => setLastName(e.target.value)} 
                placeholder="Enter your last name" 
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/50 focus:border-green-500/50 focus:outline-none transition-colors" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Email Address</label>
            <input 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              type="email"
              placeholder="Enter your email address" 
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/50 focus:border-green-500/50 focus:outline-none transition-colors" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Password</label>
            <input 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              type="password" 
              placeholder="Create a secure password" 
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/50 focus:border-green-500/50 focus:outline-none transition-colors" 
            />
          </div>
        </div>
        
        <button 
          type="submit"
          className="w-full mt-6 px-6 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors shadow-lg hover:shadow-green-500/25"
        >
          Create Account
        </button>
        
        <p className="text-center text-sm text-white/60 mt-6">
          Already have an account?{" "}
          <a href="/signin" className="text-green-400 hover:text-green-300 font-medium underline">
            Sign in
          </a>
        </p>
      </form>
    </main>
  );
}
