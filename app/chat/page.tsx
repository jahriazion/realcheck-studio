"use client";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import Toast from "@/components/Toast";
import { useSession } from "next-auth/react";

type Chat = { id: string; title: string };
type Message = { id: string; role: "user" | "assistant"; content: string; index: number };

export default function ChatPage() {
  const { data: session, status } = useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState<"rc-mini" | "rc-pro">("rc-mini");
  const listRef = useRef<HTMLDivElement>(null);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/signin";
    }
  }, [status]);

  useEffect(() => { 
    if (status === "authenticated") {
      refresh(); 
    }
  }, [status]);

  async function refresh() {
    try {
      const r = await fetch("/api/studio/chats", { headers: { Accept: "application/json" } });
      if (!r.ok) return;
      const text = await r.text(); if (!text) return;
      const j = JSON.parse(text);
      if (j?.ok) setChats(j.chats);
    } catch {}
  }

  async function openChat(id: string) {
    setActiveId(id);
    const r = await fetch(`/api/studio/chats/${id}`);
    const j = await r.json();
    if (j.ok) { setMessages(j.messages); setTimeout(() => listRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }), 0); }
  }

  async function newChat() {
    const r = await fetch('/api/studio/chats', { method: 'POST' });
    const j = await r.json();
    if (j.ok) { setChats([j.chat, ...chats]); openChat(j.chat.id); }
  }

  async function delChat(id: string) {
    await fetch(`/api/studio/chats/${id}`, { method: 'DELETE' });
    if (activeId === id) { setActiveId(null); setMessages([]); }
    refresh();
  }

  async function send() {
    const content = input.trim(); if (!content) return;
    let id = activeId;
    if (!id) {
      // auto-create chat
      const r0 = await fetch('/api/studio/chats', { method: 'POST' });
      const j0 = await r0.json();
      if (!j0?.ok) { alert('Please sign in first.'); return; }
      id = j0.chat.id;
      setActiveId(id);
      // Update chat title immediately with the user's message
      const newChat = { ...j0.chat, title: content.slice(0, 50) };
      setChats((cs: Chat[]) => [newChat, ...cs]);
    }
    setInput("");
    const myIndex = messages.length;
    setMessages((ms: Message[]) => [...ms, { id: 'tmp'+Date.now(), role: "user", content, index: myIndex }]);
    // Create assistant placeholder
    setMessages((ms: Message[]) => [...ms, { id: 'tmp'+(Date.now()+1), role: "assistant", content: "", index: myIndex + 1 }]);

    // streaming request
    const res = await fetch(`/api/studio/chats/${id}/stream`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content, model }),
    });
    if (!res.ok) {
      if (res.status === 401) alert('Please sign in first.');
      else if (res.status === 402) alert('Upgrade to Pro to use this model.');
      else if (res.status === 500) {
        const errorData = await res.json().catch(() => ({}));
        alert(`AI Error: ${errorData.error || 'AI service is not configured. Please check your OpenAI API key.'}`);
      }
      // Remove the placeholder message on error
      setMessages((ms: Message[]) => ms.filter(m => m.id !== 'tmp'+(Date.now()+1)));
      return;
    }
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      acc += chunk;
      setMessages((ms: Message[]) => {
        const copy = ms.slice();
        const idx = copy.findIndex((m: Message) => m.role === 'assistant' && m.index === myIndex + 1);
        if (idx !== -1) copy[idx] = { ...copy[idx], content: acc };
        return copy;
      });
      setTimeout(() => listRef.current?.scrollTo({ top: 1e9 }), 0);
      // Refresh chat list to show updated title
      setTimeout(() => refresh(), 1000);
    }
  }

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-dvh grid place-items-center">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Loading...</div>
          <div className="text-sm text-white/50">Checking authentication</div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-dvh grid grid-cols-[320px,1fr]">
      {/* Sidebar */}
      <aside className="bg-gradient-to-b from-slate-900/95 to-slate-800/95 border-r border-white/10 p-6">
        <button onClick={newChat} className="w-full mb-6 px-6 py-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 text-base font-semibold transition-all duration-200 flex items-center gap-3 group">
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New chat
        </button>
        
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input placeholder="Search conversations..." className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none text-base focus:border-green-500/50 transition-colors placeholder:text-white/40" />
        </div>
        
        <div className="space-y-2 overflow-auto max-h-[calc(100dvh-280px)] pr-3">
          {chats.length===0 && <div className="text-base text-white/40 px-4 py-8 text-center">No conversations yet</div>}
          {chats.map(c => (
            <div key={c.id} className={clsx("group rounded-xl border px-4 py-4 text-base cursor-pointer flex items-center justify-between transition-all duration-200", activeId===c.id ? "bg-green-500/10 border-green-500/30":"hover:bg-white/5 border-white/10")} onClick={()=>openChat(c.id)}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <svg className="w-5 h-5 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <div className="truncate font-medium">{c.title}</div>
              </div>
              <button onClick={(e: React.MouseEvent)=>{e.stopPropagation(); delChat(c.id);}} className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-red-400 text-lg transition-all p-1 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-sm text-white/50">
          <div className="font-medium">{session?.user?.email ? `Signed in as ${session.user.email}` : "Not signed in"}</div>
          <a href="/billing" className="underline hover:text-green-400 transition-colors text-sm">Billing</a>
        </div>
      </aside>

      {/* Main */}
      <main className="grid grid-rows-[100px,1fr,auto]">
        <div className="h-24 border-b border-white/10 flex items-center justify-between px-8 text-base text-white/70 backdrop-blur bg-gradient-to-r from-slate-900/90 to-slate-800/90">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <div>
                <span className="font-bold text-xl">RealCheck</span>
                <span className="text-white/40 ml-3 text-base">• {activeId ? "Conversation" : "Home"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <select value={model} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>setModel(e.target.value as "rc-mini" | "rc-pro")} className="bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-base outline-none focus:border-green-500/50 transition-colors">
              <option value="rc-mini">RC Mini</option>
              <option value="rc-pro">RC Pro</option>
            </select>
            <a className="text-base border border-white/20 rounded-xl px-4 py-3 hover:bg-white/10 transition-colors flex items-center gap-2" href="/settings">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </a>
          </div>
        </div>

        <div ref={listRef} className="overflow-auto p-8 space-y-6">
          {messages.length===0 ? (
            <div className="h-full grid place-items-center text-center">
              <div>
                <div className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">What can I help with?</div>
                <div className="text-white/60 text-lg">Start a new chat or pick one from the left.</div>
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={clsx("max-w-4xl", m.role==="assistant"?"":"ml-auto")}>
                <div className={clsx("rounded-2xl px-6 py-4 border shadow-lg", m.role==="assistant" ? "bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-green-500/30":"bg-gradient-to-br from-slate-700/50 to-slate-600/50 border-white/20")}>
                  <div className="text-xs mb-2 text-white/50 font-medium uppercase tracking-wide">{m.role}</div>
                  <div className="whitespace-pre-wrap leading-relaxed text-base">{m.content}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-8 bg-gradient-to-t from-slate-900/80 to-transparent border-t border-white/10">
          <div className="max-w-5xl mx-auto">
            <div className="relative flex items-end gap-4">
              <textarea value={input} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>)=>setInput(e.target.value)} onKeyDown={(e: React.KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();send();}}} placeholder={activeId ? "Message RealCheck..." : "Start a new conversation"} rows={4}
                className="flex-1 resize-none rounded-2xl bg-white/5 border border-white/20 outline-none px-6 py-4 text-lg focus:border-green-500/50 transition-all duration-200 placeholder:text-white/50 shadow-lg backdrop-blur-sm" />
              <button onClick={send} className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-green-500/25 flex items-center justify-center group">
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className="text-center mt-4 text-sm text-white/40">
              RealCheck can make mistakes. Consider checking important information.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
