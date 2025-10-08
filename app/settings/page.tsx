"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type SettingsCategory = 'general' | 'notifications' | 'personalization' | 'connectors' | 'schedules' | 'data-controls' | 'security' | 'account' | 'plan';

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  // Check for success/cancel from Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    if (status === 'success') {
      setSuccess('Subscription activated successfully!');
    } else if (status === 'cancel') {
      setError('Payment was cancelled');
    }
  }, []);

  async function upgrade() {
    setLoading(true); 
    setError(null);
    setSuccess(null);
    
    const r = await fetch("/api/billing/checkout", { method: "POST" });
    const j = await r.json();
    setLoading(false);
    
    if (j.ok && j.url) {
      window.location.href = j.url;
    } else {
      setError(j.error || "Unable to start checkout");
    }
  }

  const settingsCategories = [
    { id: 'general' as SettingsCategory, name: 'General', icon: '⚙️' },
    { id: 'notifications' as SettingsCategory, name: 'Notifications', icon: '🔔' },
    { id: 'personalization' as SettingsCategory, name: 'Personalization', icon: '🎨' },
    { id: 'connectors' as SettingsCategory, name: 'Connectors', icon: '🔗' },
    { id: 'schedules' as SettingsCategory, name: 'Schedules', icon: '⏰' },
    { id: 'data-controls' as SettingsCategory, name: 'Data controls', icon: '🗄️' },
    { id: 'security' as SettingsCategory, name: 'Security', icon: '🔐' },
    { id: 'account' as SettingsCategory, name: 'Account', icon: '👤' },
    { id: 'plan' as SettingsCategory, name: 'Plan', icon: '💳' },
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold text-white">Settings</h1>
                <button 
                  onClick={() => router.back()}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <nav className="space-y-2">
                {settingsCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 ${
                      activeCategory === category.id
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="text-lg">{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
              {activeCategory === 'general' && (
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-6">General</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                      <div>
                        <h3 className="font-medium text-white">Theme</h3>
                        <p className="text-sm text-white/60">Choose your preferred theme</p>
                      </div>
                      <select className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white">
                        <option value="system">System</option>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                      <div>
                        <h3 className="font-medium text-white">Language</h3>
                        <p className="text-sm text-white/60">Select your preferred language</p>
                      </div>
                      <select className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white">
                        <option value="auto">Auto-detect</option>
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                      <div>
                        <h3 className="font-medium text-white">Voice</h3>
                        <p className="text-sm text-white/60">Choose your preferred voice</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button className="p-2 bg-white/5 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </button>
                        <select className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white">
                          <option value="cove">Cove</option>
                          <option value="nova">Nova</option>
                          <option value="shimmer">Shimmer</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeCategory === 'plan' && (
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-6">Plan</h2>
                  
                  <div className="space-y-6">
                    {success && (
                      <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
                        {success}
                      </div>
                    )}
                    
                    {error && (
                      <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                        {error}
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Free Plan */}
                      <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold text-white">RealCheck Free</h3>
                          <span className="px-3 py-1 bg-white/10 text-white text-sm font-medium rounded-full">
                            Current
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div className="text-3xl font-bold text-white">$0<span className="text-lg font-normal text-white/60">/month</span></div>
                          <ul className="space-y-2 text-white/80">
                            <li className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                              Basic AI assistance
                            </li>
                            <li className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                              10 messages per day
                            </li>
                            <li className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                              Standard response time
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Pro Plan */}
                      <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl relative">
                        <div className="absolute -top-3 left-6">
                          <span className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full">
                            Recommended
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-4 mt-2">
                          <h3 className="text-xl font-semibold text-white">RealCheck Pro</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="text-3xl font-bold text-white">$20<span className="text-lg font-normal text-white/60">/month</span></div>
                          <ul className="space-y-2 text-white/80">
                            <li className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                              Advanced AI models
                            </li>
                            <li className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                              Unlimited messages
                            </li>
                            <li className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                              Priority processing
                            </li>
                            <li className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                              File upload support
                            </li>
                            <li className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                              API access
                            </li>
                          </ul>
                          <button 
                            disabled={loading} 
                            onClick={upgrade} 
                            className="w-full mt-6 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-white/10 disabled:text-white/40 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                          >
                            {loading ? "Starting Checkout..." : "Upgrade to Pro"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-lg">
                      <h4 className="font-medium text-white mb-2">Development Mode</h4>
                      <p className="text-sm text-white/60 mb-2">
                        For local development without Stripe, set <code className="bg-white/10 px-2 py-1 rounded">RC_DEV_ALL_PRO=true</code> in your .env file and restart the server.
                      </p>
                      <p className="text-xs text-white/40">
                        This will enable all Pro features without requiring payment.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeCategory === 'account' && (
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-6">Account</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                      <div>
                        <h3 className="font-medium text-white">Profile Information</h3>
                        <p className="text-sm text-white/60">Manage your personal details</p>
                      </div>
                      <button className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors">
                        Edit Profile
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                      <div>
                        <h3 className="font-medium text-white">Change Password</h3>
                        <p className="text-sm text-white/60">Update your account password</p>
                      </div>
                      <button className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors">
                        Change
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                      <div>
                        <h3 className="font-medium text-white">Delete Account</h3>
                        <p className="text-sm text-white/60">Permanently delete your account</p>
                      </div>
                      <button className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Placeholder for other categories */}
              {!['general', 'plan', 'account'].includes(activeCategory) && (
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-6">
                    {settingsCategories.find(c => c.id === activeCategory)?.name}
                  </h2>
                  <div className="text-white/60">
                    <p>This section is coming soon...</p>
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
