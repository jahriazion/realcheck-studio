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
    <header className="sticky top-0 z-40 backdrop-blur bg-[color:var(--bg)]/70 border-b border-white/10">
      <div className="mx-auto max-w-6xl h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Image src="/logo.svg" alt="logo" width={20} height={20} />
            <span>{brand.name}</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            {tabs.map(t => (
              <Link
                key={t.href}
                href={t.href}
                className={clsx(
                  "px-3 py-1.5 rounded-md border border-transparent hover:border-white/10 hover:bg-white/5",
                  pathname.startsWith(t.href) && "bg-white/10 border-white/10"
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
