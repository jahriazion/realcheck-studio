"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<string>("system");
  useEffect(() => {
    const saved = localStorage.getItem("rc-theme");
    if (saved) setTheme(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem("rc-theme", theme);
    const root = document.documentElement;
    if (theme === "light") root.classList.remove("dark");
    else if (theme === "dark") root.classList.add("dark");
    else {
      // system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }
  }, [theme]);
  return (
    <div className="text-sm flex items-center gap-1 border border-white/20 rounded-xl overflow-hidden bg-white/5">
      {["light","system","dark"].map(t => (
        <button key={t} onClick={()=>setTheme(t)}
          className={"px-4 py-2 hover:bg-white/10 transition-colors font-medium " + (theme===t?"bg-white/10 text-green-400":"text-white/70")}>
          {t}
        </button>
      ))}
    </div>
  );
}
