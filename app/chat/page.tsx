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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/signin";
    }
  }, [status]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowDropdown(false);
        setShowMoreOptions(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  useEffect(() => { 
    if (status === "authenticated") {
      refresh(); 
    }
  }, [status]);

  // No auto-scroll needed since we removed main scrolling

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
    if (j.ok) { 
      setMessages(j.messages); 
    }
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

  function handleFileUpload() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
    // Reset the input value so the same file can be selected again
    event.target.value = '';
  }

  function removeFile(index: number) {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }

  function closeActiveTool() {
    setActiveTool(null);
    setInput("");
  }

  function handleDropdownOption(option: string) {
    setShowDropdown(false);
    setShowMoreOptions(false);
    setActiveTool(option);
    
    // Set default input text for each tool
    switch (option) {
      case 'files':
        setInput("Upload files to analyze: ");
        inputRef.current?.focus();
        break;
      case 'study':
        setInput("Help me study and learn about ");
        inputRef.current?.focus();
        break;
      case 'image':
        setInput("Create an image of ");
        inputRef.current?.focus();
        break;
      case 'research':
        setInput("Conduct deep research on ");
        inputRef.current?.focus();
        break;
      case 'connectors':
        setInput("Use connectors to help with ");
        inputRef.current?.focus();
        break;
      case 'websearch':
        setInput("Search the web for ");
        inputRef.current?.focus();
        break;
      case 'canvas':
        setInput("Create a canvas for ");
        inputRef.current?.focus();
        break;
    }
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
    <div className="h-[calc(100vh-5rem)] grid grid-cols-[320px,1fr]">
      {/* Sidebar */}
      <aside className="bg-gradient-to-b from-slate-900/95 to-slate-800/95 border-r border-white/10 p-6 flex flex-col h-full">
        <div className="mb-6">
          <button onClick={newChat} className="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-base font-medium transition-all duration-200 flex items-center gap-3 group">
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New chat
          </button>
        </div>
        
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input placeholder="Search chats" className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 outline-none text-sm focus:border-green-500/50 transition-colors placeholder:text-white/40" />
        </div>
        
        <div className="flex-1 overflow-auto min-h-0">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">Recent</h3>
            <div className="space-y-1">
              {chats.length===0 && <div className="text-sm text-white/40 px-3 py-4 text-center">No conversations yet</div>}
              {chats.map(c => (
                <div key={c.id} className={clsx("group rounded-lg px-3 py-2 text-sm cursor-pointer flex items-center justify-between transition-all duration-200", activeId===c.id ? "bg-green-500/10":"hover:bg-white/5")} onClick={()=>openChat(c.id)}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <svg className="w-4 h-4 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <div className="truncate font-medium text-white/90">{c.title}</div>
                  </div>
                  <button onClick={(e: React.MouseEvent)=>{e.stopPropagation(); delChat(c.id);}} className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-red-400 text-sm transition-all p-1 rounded">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3 text-sm text-white/60">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {(() => {
                  if (session?.user?.firstName && session?.user?.lastName) {
                    return `${session.user.firstName[0]}${session.user.lastName[0]}`.toUpperCase();
                  } else if (session?.user?.firstName) {
                    return session.user.firstName[0].toUpperCase();
                  } else if (session?.user?.name) {
                    return session.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);
                  } else {
                    return session?.user?.email?.[0]?.toUpperCase() || "U";
                  }
                })()}
              </span>
            </div>
            <div>
              <div className="font-medium text-white/90">
                {(() => {
                  if (session?.user?.firstName && session?.user?.lastName) {
                    return `${session.user.firstName} ${session.user.lastName}`;
                  } else if (session?.user?.firstName) {
                    return session.user.firstName;
                  } else if (session?.user?.name) {
                    return session.user.name;
                  } else {
                    return session?.user?.email?.split('@')[0] || "User";
                  }
                })()}
              </div>
              <div className="text-xs text-white/50">RealCheck User</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-col h-full">
        {/* Header - Fixed */}
        <div className="h-20 border-b border-white/10 flex items-center justify-between px-6 text-base text-white/70 backdrop-blur bg-gradient-to-r from-slate-900/90 to-slate-800/90 flex-shrink-0">
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
          </div>
        </div>

        {/* Messages Area - ChatGPT Style */}
        <div ref={listRef} className="flex-1 p-6 space-y-6 min-h-0 overflow-hidden">
          {messages.length===0 ? (
            <div className="h-full grid place-items-center text-center">
              <div className="max-w-2xl">
                <div className="text-5xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">What can I help with?</div>
                <div className="text-white/60 text-xl mb-8">Start a new chat or pick one from the left.</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  <div 
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => {
                      setInput("Help me brainstorm creative ideas for ");
                      inputRef.current?.focus();
                    }}
                  >
                    <div className="text-sm font-medium text-white/90 mb-2">💡 Get creative ideas</div>
                    <div className="text-xs text-white/60">Brainstorm content, stories, or solutions</div>
                  </div>
                  <div 
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => {
                      setInput("Help me write and edit ");
                      inputRef.current?.focus();
                    }}
                  >
                    <div className="text-sm font-medium text-white/90 mb-2">📝 Write & edit</div>
                    <div className="text-xs text-white/60">Drafts, emails, essays, and more</div>
                  </div>
                  <div 
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => {
                      setInput("Help me analyze this data: ");
                      inputRef.current?.focus();
                    }}
                  >
                    <div className="text-sm font-medium text-white/90 mb-2">🔍 Analyze data</div>
                    <div className="text-xs text-white/60">Understand complex information</div>
                  </div>
                  <div 
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => {
                      setInput("Let's chat about ");
                      inputRef.current?.focus();
                    }}
                  >
                    <div className="text-sm font-medium text-white/90 mb-2">💬 Chat about anything</div>
                    <div className="text-xs text-white/60">Have a conversation on any topic</div>
                  </div>
                  <div 
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => {
                      setInput("Search the web for ");
                      inputRef.current?.focus();
                    }}
                  >
                    <div className="text-sm font-medium text-white/90 mb-2">🌐 Web search</div>
                    <div className="text-xs text-white/60">Find information on the internet</div>
                  </div>
                  <div 
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => {
                      setInput("Help me create a visual diagram or canvas for ");
                      inputRef.current?.focus();
                    }}
                  >
                    <div className="text-sm font-medium text-white/90 mb-2">🎨 Canvas</div>
                    <div className="text-xs text-white/60">Create visual diagrams and drawings</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <div key={i} className={clsx("max-w-4xl mx-auto", m.role==="assistant"?"":"ml-auto")}>
                  <div className={clsx("rounded-2xl px-6 py-4", m.role==="assistant" ? "bg-transparent":"bg-white/5 border border-white/10")}>
                    <div className="flex items-start gap-4">
                      <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", m.role==="assistant" ? "bg-gradient-to-br from-green-400 to-emerald-500":"bg-white/10")}>
                        {m.role==="assistant" ? (
                          <span className="text-white font-bold text-sm">C</span>
                        ) : (
                          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white/90 mb-2">{m.role === "assistant" ? "RealCheck" : "You"}</div>
                        <div className={clsx(
                          "whitespace-pre-wrap leading-relaxed text-base text-white/90",
                          m.role === "assistant" && m.content.length > 500 
                            ? "max-h-96 overflow-y-auto pr-2" 
                            : ""
                        )}>
                          {m.content}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Active Tool Display Area */}
        {activeTool && (
          <div className="border-t border-white/10 bg-slate-900/50 backdrop-blur-sm">
            <div className="p-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {activeTool === 'files' && (
                    <>
                      <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <h3 className="text-lg font-semibold text-white">File Upload Tool</h3>
                    </>
                  )}
                  {activeTool === 'study' && (
                    <>
                      <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <h3 className="text-lg font-semibold text-white">Study & Learn Tool</h3>
                    </>
                  )}
                  {activeTool === 'image' && (
                    <>
                      <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-white">Image Creation Tool</h3>
                    </>
                  )}
                  {activeTool === 'research' && (
                    <>
                      <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-white">Deep Research Tool</h3>
                    </>
                  )}
                  {activeTool === 'connectors' && (
                    <>
                      <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <h3 className="text-lg font-semibold text-white">Connectors Tool</h3>
                    </>
                  )}
                  {activeTool === 'websearch' && (
                    <>
                      <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                      </svg>
                      <h3 className="text-lg font-semibold text-white">Web Search Tool</h3>
                    </>
                  )}
                  {activeTool === 'canvas' && (
                    <>
                      <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-white">Canvas Tool</h3>
                    </>
                  )}
                </div>
                <button
                  onClick={closeActiveTool}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tool-specific content */}
              {activeTool === 'files' && (
                <div className="space-y-4">
                  <p className="text-white/80">Upload files to analyze and discuss with AI assistance.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <h4 className="font-medium text-white">Documents</h4>
                          <p className="text-sm text-white/60">PDF, Word, Text files</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <h4 className="font-medium text-white">Images</h4>
                          <p className="text-sm text-white/60">Photos, diagrams, charts</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <div>
                          <h4 className="font-medium text-white">Data</h4>
                          <p className="text-sm text-white/60">CSV, Excel, JSON files</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTool === 'study' && (
                <div className="space-y-4">
                  <p className="text-white/80">Get personalized learning assistance and study materials.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <div>
                          <h4 className="font-medium text-white">Study Plans</h4>
                          <p className="text-sm text-white/60">Create structured learning paths</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <div>
                          <h4 className="font-medium text-white">Practice Tests</h4>
                          <p className="text-sm text-white/60">Generate quizzes and exercises</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h4 className="font-medium text-white">Explanations</h4>
                          <p className="text-sm text-white/60">Get detailed topic explanations</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <div>
                          <h4 className="font-medium text-white">Notes</h4>
                          <p className="text-sm text-white/60">Generate study notes and summaries</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTool === 'image' && (
                <div className="space-y-4">
                  <p className="text-white/80">Create stunning images with AI-powered generation.</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {['Cyberpunk', 'Anime', 'Dramatic Headshot', 'Coloring Book', 'Photo Shoot', 'Retro Cartoon'].map((style) => (
                      <div key={style} className="p-3 rounded-lg bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 mx-auto mb-2 flex items-center justify-center">
                          {style === 'Cyberpunk' && <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}
                          {style === 'Anime' && <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}
                          {style === 'Dramatic Headshot' && <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}
                          {style === 'Coloring Book' && <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}
                          {style === 'Photo Shoot' && <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}
                          {style === 'Retro Cartoon' && <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}
                        </div>
                        <p className="text-xs text-white/80">{style}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <h4 className="font-medium text-white mb-2">Quick Prompts</h4>
                    <div className="space-y-2">
                      {[
                        "Create a magazine cover of cute animals",
                        "Design a garden party invitation",
                        "Illustrate an astronaut on Mars",
                        "Make a cooking tutorial diagram"
                      ].map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => setInput(prompt)}
                          className="block w-full p-3 text-left rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTool === 'research' && (
                <div className="space-y-4">
                  <p className="text-white/80">Conduct comprehensive research with AI assistance.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <div>
                          <h4 className="font-medium text-white">Web Research</h4>
                          <p className="text-sm text-white/60">Search and analyze online sources</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <div>
                          <h4 className="font-medium text-white">Data Analysis</h4>
                          <p className="text-sm text-white/60">Analyze research data and trends</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <h4 className="font-medium text-white">Report Generation</h4>
                          <p className="text-sm text-white/60">Create comprehensive reports</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h4 className="font-medium text-white">Focus Areas</h4>
                          <p className="text-sm text-white/60">Academic, business, technical</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTool === 'connectors' && (
                <div className="space-y-4">
                  <p className="text-white/80">Connect to external services and data sources.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                          <span className="text-white text-sm font-bold">GH</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white">GitHub</h4>
                          <p className="text-xs text-white/60">Connect repositories</p>
                        </div>
                        <button className="px-3 py-1 text-xs bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">Connect</button>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                          <span className="text-white text-sm font-bold">GM</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white">Gmail</h4>
                          <p className="text-xs text-white/60">Access emails</p>
                        </div>
                        <button className="px-3 py-1 text-xs bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors">Connect</button>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-sm font-bold">GC</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white">Google Calendar</h4>
                          <p className="text-xs text-white/60">Sync events</p>
                        </div>
                        <button className="px-3 py-1 text-xs bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors">Connect</button>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center">
                          <span className="text-white text-sm font-bold">+</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white">Connect More</h4>
                          <p className="text-xs text-white/60">Add more services</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTool === 'websearch' && (
                <div className="space-y-4">
                  <p className="text-white/80">Search the web for real-time information and updates.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                        </svg>
                        <div>
                          <h4 className="font-medium text-white">General Search</h4>
                          <p className="text-sm text-white/60">Search across the web</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        <div>
                          <h4 className="font-medium text-white">News</h4>
                          <p className="text-sm text-white/60">Latest news and updates</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <div>
                          <h4 className="font-medium text-white">Academic</h4>
                          <p className="text-sm text-white/60">Scholarly articles and papers</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <div>
                          <h4 className="font-medium text-white">Real-time Data</h4>
                          <p className="text-sm text-white/60">Current statistics and data</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-medium text-white mb-2">Trending Searches</h4>
                    <div className="flex flex-wrap gap-2">
                      {['AI Technology', 'Climate Change', 'Space Exploration', 'Health Research'].map((topic, index) => (
                        <button
                          key={index}
                          onClick={() => setInput(`Search for latest updates on ${topic}`)}
                          className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTool === 'canvas' && (
                <div className="space-y-4">
                  <p className="text-white/80">Create, write, and code in a collaborative canvas workspace.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-white">🎮 Make Apps & Games</h4>
                      <p className="text-sm text-white/60">Just explain your idea and watch AI build it for you. Create an AI-powered app or multiplayer game, then share it with friends.</p>
                      <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                        Start Creating
                      </button>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium text-white">✍️ Go from First to Final Draft</h4>
                      <p className="text-sm text-white/60">Share your work-in-progress and ask AI to suggest edits or rewrite it, then export your work to various formats.</p>
                      <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                        Start Writing
                      </button>
                    </div>
                  </div>
                  <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">⚡</span>
                      </div>
                      <h4 className="font-medium text-white">Canvas Features</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      {['Code Editor', 'Visual Design', 'Real-time Collab', 'Export Options'].map((feature, index) => (
                        <div key={index} className="text-center">
                          <div className="w-10 h-10 bg-white/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
                            {feature === 'Code Editor' && <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
                            {feature === 'Visual Design' && <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" /></svg>}
                            {feature === 'Real-time Collab' && <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                            {feature === 'Export Options' && <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                          </div>
                          <p className="text-xs text-white/80">{feature}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Input Area - ChatGPT Style */}
        <div className="p-6 bg-gradient-to-t from-slate-900/80 to-transparent border-t border-white/10 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            {/* File Upload Area */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="*/*"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {/* Uploaded Files Display */}
            {uploadedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/20">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-white/80 truncate max-w-32">{file.name}</span>
                      <span className="text-xs text-white/60">({(file.size / 1024).toFixed(1)}KB)</span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="ml-1 p-1 rounded hover:bg-white/20 transition-colors"
                    >
                      <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative dropdown-container">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/20 hover:border-white/30 transition-all duration-200 focus-within:border-green-500/50">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-5 h-5 text-white/40 flex-shrink-0 hover:text-white/60 transition-colors cursor-pointer"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <textarea 
                  ref={inputRef}
                  value={input} 
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>)=>setInput(e.target.value)} 
                  onKeyDown={(e: React.KeyboardEvent)=>{
                    if(e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }} 
                  placeholder={activeId ? "Message RealCheck..." : "Ask anything"} 
                  rows={1}
                  className="flex-1 resize-none bg-transparent outline-none text-lg placeholder:text-white/50 text-white min-h-[24px] max-h-32"
                  style={{ height: 'auto' }}
                  onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                  }}
                />
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                  <button onClick={send} disabled={!input.trim() && uploadedFiles.length === 0} className="p-2 rounded-lg bg-green-500 hover:bg-green-600 disabled:bg-white/10 disabled:text-white/40 text-white transition-all duration-200 disabled:cursor-not-allowed">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="py-2">
                    {/* Add photos & files */}
                    <button
                      onClick={() => handleDropdownOption('files')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors text-white"
                    >
                      <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-sm">Add photos & files</span>
                    </button>
                    
                    {/* Study and learn */}
                    <button
                      onClick={() => handleDropdownOption('study')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors text-white"
                    >
                      <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="text-sm">Study and learn</span>
                    </button>
                    
                    {/* Create image */}
                    <button
                      onClick={() => handleDropdownOption('image')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors text-white"
                    >
                      <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">Create image</span>
                    </button>
                    
                    {/* Deep research */}
                    <button
                      onClick={() => handleDropdownOption('research')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors text-white"
                    >
                      <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-sm">Deep research</span>
                    </button>
                    
                    {/* Use Connectors */}
                    <button
                      onClick={() => handleDropdownOption('connectors')}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors text-white"
                    >
                      <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="text-sm">Use Connectors</span>
                    </button>
                    
                    {/* More */}
                    <button
                      onClick={() => setShowMoreOptions(!showMoreOptions)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/10 transition-colors text-white"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">More</span>
                      </div>
                      <svg className={`w-4 h-4 text-white/60 transition-transform ${showMoreOptions ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    {/* More Options Submenu */}
                    {showMoreOptions && (
                      <div className="bg-slate-700/50">
                        <button
                          onClick={() => handleDropdownOption('websearch')}
                          className="w-full flex items-center gap-3 px-8 py-3 text-left hover:bg-white/10 transition-colors text-white"
                        >
                          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                          </svg>
                          <span className="text-sm">Web search</span>
                        </button>
                        
                        <button
                          onClick={() => handleDropdownOption('canvas')}
                          className="w-full flex items-center gap-3 px-8 py-3 text-left hover:bg-white/10 transition-colors text-white"
                        >
                          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <span className="text-sm">Canvas</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="text-center mt-3 text-sm text-white/40">
              RealCheck can make mistakes. Consider checking important information.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
