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
    <div className="text-xs flex items-center gap-1 border border-white/10 rounded-md overflow-hidden">
      {["light","system","dark"].map(t => (
        <button key={t} onClick={()=>setTheme(t)}
          className={"px-2 py-1 hover:bg-white/10 " + (theme===t?"bg-white/10":"")}>
          {t}
        </button>
      ))}
    </div>
  );
}
