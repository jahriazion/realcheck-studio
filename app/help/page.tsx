"use client";
import { useState } from "react";

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState("getting-started");

  const sections = [
    { id: "getting-started", title: "Getting Started", icon: "🚀" },
    { id: "features", title: "Features", icon: "✨" },
    { id: "troubleshooting", title: "Troubleshooting", icon: "🔧" },
    { id: "api", title: "API Reference", icon: "📚" },
    { id: "contact", title: "Contact Support", icon: "💬" },
  ];

  const faqs = [
    {
      question: "How do I start a new chat?",
      answer: "Click on the 'New Chat' button in the sidebar or simply start typing in the input field at the bottom of the screen. Your conversation will be automatically saved.",
    },
    {
      question: "What AI models are available?",
      answer: "RealCheck offers two models: RC-Mini (faster, cost-effective) and RC-Pro (more advanced, higher quality responses). Pro users have access to both models.",
    },
    {
      question: "How do I manage my subscription?",
      answer: "Go to your profile page and click on 'Subscription Status' to manage your plan, billing, and payment methods.",
    },
    {
      question: "Is my data secure?",
      answer: "Yes, all your conversations are encrypted and stored securely. We never share your data with third parties and you can delete your data at any time.",
    },
    {
      question: "How do I use keyboard shortcuts?",
      answer: "Press Enter to send a message, Shift+Enter for a new line. Use Ctrl+K (or Cmd+K on Mac) to open the command palette.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Help Center</h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Find answers to common questions and learn how to get the most out of RealCheck
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-4">Topics</h2>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${
                      activeSection === section.id
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="text-lg">{section.icon}</span>
                    <span className="font-medium">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
              {activeSection === "getting-started" && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Getting Started</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">1. Create Your Account</h3>
                      <p className="text-white/70 mb-4">
                        Sign up for a free account to start using RealCheck. You can upgrade to Pro anytime for advanced features.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">2. Start Your First Chat</h3>
                      <p className="text-white/70 mb-4">
                        Click "New Chat" or start typing in the input field. RealCheck will respond to your questions and help with various tasks.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">3. Explore Features</h3>
                      <p className="text-white/70 mb-4">
                        Try different prompts, use voice input, and explore the various AI models available to find what works best for you.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "features" && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Features</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-3">AI Chat</h3>
                      <p className="text-white/70">
                        Advanced AI conversations with multiple models to choose from, including GPT-4 and GPT-4 Mini.
                      </p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-3">Voice Input</h3>
                      <p className="text-white/70">
                        Speak your questions using the microphone button for hands-free interaction.
                      </p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-3">Chat History</h3>
                      <p className="text-white/70">
                        All your conversations are automatically saved and organized for easy access.
                      </p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-3">Pro Features</h3>
                      <p className="text-white/70">
                        Advanced models, priority support, and extended usage limits for Pro subscribers.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "troubleshooting" && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
                  <div className="space-y-4">
                    {faqs.map((faq, index) => (
                      <div key={index} className="p-6 bg-white/5 rounded-xl border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-3">{faq.question}</h3>
                        <p className="text-white/70">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "api" && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">API Reference</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Authentication</h3>
                      <p className="text-white/70 mb-4">
                        Use your API key to authenticate requests. You can find your API key in your profile settings.
                      </p>
                      <div className="bg-slate-900/50 p-4 rounded-lg border border-white/10">
                        <code className="text-green-400 text-sm">
                          Authorization: Bearer YOUR_API_KEY
                        </code>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Endpoints</h3>
                      <div className="space-y-3">
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-white/10">
                          <code className="text-blue-400 text-sm">POST /api/chat</code>
                          <p className="text-white/60 text-sm mt-1">Send a message to the AI</p>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-white/10">
                          <code className="text-blue-400 text-sm">GET /api/chats</code>
                          <p className="text-white/60 text-sm mt-1">Retrieve your chat history</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "contact" && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Contact Support</h2>
                  <div className="space-y-6">
                    <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-3">Email Support</h3>
                      <p className="text-white/70 mb-4">
                        For technical issues, billing questions, or feature requests, email us at:
                      </p>
                      <a
                        href="mailto:support@realcheck.ai"
                        className="text-green-400 hover:text-green-300 font-medium"
                      >
                        support@realcheck.ai
                      </a>
                    </div>
                    <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-3">Response Time</h3>
                      <p className="text-white/70">
                        We typically respond within 24 hours. Pro users receive priority support with faster response times.
                      </p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-3">Community</h3>
                      <p className="text-white/70">
                        Join our community Discord server for discussions, tips, and updates from other users.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
