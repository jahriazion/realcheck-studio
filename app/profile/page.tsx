"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    firstName: session?.user?.firstName || "",
    lastName: session?.user?.lastName || "",
    email: session?.user?.email || "",
  });

  // Update form data when session changes
  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        firstName: session.user.firstName || "",
        lastName: session.user.lastName || "",
        email: session.user.email || "",
      });
    }
  }, [session]);

  const handleSave = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      const result = await response.json();
      
      if (result.ok) {
        // Force session refresh by updating the session
        if (session) {
          await update({
            ...session,
            user: {
              ...session.user,
              name: formData.name,
              firstName: formData.firstName,
              lastName: formData.lastName,
            }
          });
        }
        setIsEditing(false);
        alert('Profile updated successfully!');
        // Force a page refresh to ensure the session is updated
        window.location.reload();
      } else {
        alert('Failed to update profile: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please sign in to view your profile</h1>
          <a href="/signin" className="text-green-400 hover:text-green-300">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  const user = session.user;
  
  // Create display name from first and last name, fallback to name, then email
  const displayName = (() => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.name) {
      return user.name;
    } else {
      return user.email?.split('@')[0] || "User";
    }
  })();
  
  const initials = (() => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    } else if (user.firstName) {
      return user.firstName[0].toUpperCase();
    } else if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    } else {
      return user.email?.[0]?.toUpperCase() || "U";
    }
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-2xl">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "User"}
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              ) : (
                initials
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {displayName || "User Profile"}
              </h1>
              <p className="text-white/60 text-lg">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full border border-green-500/30">
                  Pro Account
                </span>
                {user.isAdmin && (
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm font-medium rounded-full border border-red-500/30">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Personal Information</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">First Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-green-500/50 focus:outline-none"
                        placeholder="Enter your first name"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white">
                        {user.firstName || "Not provided"}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Last Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-green-500/50 focus:outline-none"
                        placeholder="Enter your last name"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white">
                        {user.lastName || "Not provided"}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Email Address</label>
                  <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white/60">
                    {user.email}
                  </div>
                  <p className="text-xs text-white/40 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Institution</label>
                  <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white">
                    Not specified
                  </div>
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Account Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/20 rounded-xl">
                  <div>
                    <h3 className="font-medium text-white">Subscription Status</h3>
                    <p className="text-sm text-white/60">Manage your subscription</p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full border border-green-500/30">
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/20 rounded-xl">
                  <div>
                    <h3 className="font-medium text-white">Data & Privacy</h3>
                    <p className="text-sm text-white/60">Control your data settings</p>
                  </div>
                  <button className="text-green-400 hover:text-green-300 text-sm font-medium">
                    Manage
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/20 rounded-xl">
                  <div>
                    <h3 className="font-medium text-white">API Access</h3>
                    <p className="text-sm text-white/60">View API keys and usage</p>
                  </div>
                  <button className="text-green-400 hover:text-green-300 text-sm font-medium">
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/10">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: session?.user?.name || "",
                      firstName: session?.user?.firstName || "",
                      lastName: session?.user?.lastName || "",
                      email: session?.user?.email || "",
                    });
                  }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
