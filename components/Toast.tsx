"use client";
import { useEffect, useState } from "react";

export default function Toast({ text }: { text: string }) {
  const [show, setShow] = useState(true);
  useEffect(() => { const t = setTimeout(() => setShow(false), 2500); return ()=>clearTimeout(t); }, []);
  if (!show) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60]">
      <div className="px-4 py-2 rounded-lg bg-black/70 border border-white/10 text-sm shadow-lg">{text}</div>
    </div>
  );
}
