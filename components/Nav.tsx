"use client";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import Image from "next/image";
import { brand } from "@/lib/brand";

const tabs = [
  { href: "/chat", label: "Chat" },
  { href: "/signup", label: "Sign up" },
  { href: "/signin", label: "Sign in" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-gradient-to-r from-slate-900/90 to-slate-800/90 border-b border-white/10 shadow-xl">
      <div className="mx-auto max-w-8xl h-20 px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-4 font-bold tracking-tight group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl group-hover:shadow-green-500/30 transition-all duration-300">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">{brand.name}</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-3 text-base">
            {tabs.map(t => (
              <Link
                key={t.href}
                href={t.href}
                className={clsx(
                  "px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2",
                  pathname.startsWith(t.href) 
                    ? "bg-green-500/20 text-green-400 border border-green-500/30 shadow-lg" 
                    : "hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10 hover:shadow-lg"
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
