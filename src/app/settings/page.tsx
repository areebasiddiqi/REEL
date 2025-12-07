'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { User, Lock, Palette, Globe, HelpCircle, Shield, Trash2, Save, Bell } from 'lucide-react';
import Link from 'next/link';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase.config';

export default function SettingsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);

    // Profile settings
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [photoURL, setPhotoURL] = useState('');


    // Privacy settings
    const [profileVisibility, setProfileVisibility] = useState<'public' | 'private'>('public');
    const [showEmail, setShowEmail] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }

        if (user) {
            setDisplayName(user.displayName || '');
            setPhotoURL(user.photoURL || '');
        }
    }, [user, loading, router]);

    const handleSaveProfile = async () => {
        if (!user || !auth.currentUser) return;

        setIsSaving(true);
        try {
            // Update Firebase Auth profile
            await updateProfile(auth.currentUser, {
                displayName,
                photoURL,
            });

            // Update Firestore user document
            await updateDoc(doc(db, 'users', user.uid), {
                displayName,
                photoURL,
                bio,
            });

            alert('Profile updated successfully!');
        } catch (error: any) {
            console.error('Error updating profile:', error);
            alert(error.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };


    const handleSavePrivacy = async () => {
        if (!user) return;

        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                privacy: {
                    profileVisibility,
                    showEmail,
                },
            });

            alert('Privacy settings updated!');
        } catch (error: any) {
            console.error('Error updating privacy:', error);
            alert(error.message || 'Failed to update privacy settings');
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'privacy', label: 'Privacy & Security', icon: Lock },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'help', label: 'Help & Support', icon: HelpCircle },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(var(--primary))]"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[hsl(var(--background))]">
            <Header onMenuToggle={setIsSidebarOpen} />
            <div className="flex">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    <div className="max-w-6xl mx-auto px-4 py-8">
                        {/* Page Title */}
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2">Settings</h1>
                            <p className="text-[hsl(var(--foreground-muted))]">Manage your account settings and preferences</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Tabs Sidebar */}
                            <div className="lg:col-span-1">
                                <div className="glass-card p-2">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${activeTab === tab.id
                                                        ? 'bg-[hsl(var(--primary))] text-white'
                                                        : 'text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface))]'
                                                    }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <span className="text-sm font-medium">{tab.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="lg:col-span-3">
                                <div className="glass-card p-6">
                                    {/* Profile Tab */}
                                    {activeTab === 'profile' && (
                                        <div className="space-y-6">
                                            <h2 className="text-2xl font-bold mb-4">Profile Settings</h2>

                                            <div>
                                                <label className="block text-sm font-medium mb-2">Display Name</label>
                                                <input
                                                    type="text"
                                                    value={displayName}
                                                    onChange={(e) => setDisplayName(e.target.value)}
                                                    className="input w-full"
                                                    placeholder="Your display name"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-2">Bio</label>
                                                <textarea
                                                    value={bio}
                                                    onChange={(e) => setBio(e.target.value)}
                                                    className="input w-full min-h-[100px]"
                                                    placeholder="Tell us about yourself..."
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-2">Profile Photo URL</label>
                                                <input
                                                    type="url"
                                                    value={photoURL}
                                                    onChange={(e) => setPhotoURL(e.target.value)}
                                                    className="input w-full"
                                                    placeholder="https://example.com/photo.jpg"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-2">Email</label>
                                                <input
                                                    type="email"
                                                    value={user.email || ''}
                                                    disabled
                                                    className="input w-full opacity-50 cursor-not-allowed"
                                                />
                                                <p className="text-xs text-[hsl(var(--foreground-subtle))] mt-1">
                                                    Email cannot be changed
                                                </p>
                                            </div>

                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={isSaving}
                                                className="btn btn-primary disabled:opacity-50"
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    )}


                                    {/* Notifications Tab */}
                                    {activeTab === 'notifications' && (
                                        <div className="space-y-6">
                                            <h2 className="text-2xl font-bold mb-4">Notification Settings</h2>
                                            <p className="text-[hsl(var(--foreground-muted))] mb-6">
                                                Manage your notification preferences and choose what notifications you want to receive.
                                            </p>
                                            <Link
                                                href="/settings/notifications"
                                                className="btn btn-primary inline-block"
                                            >
                                                <Bell className="w-4 h-4 mr-2" />
                                                Go to Notification Settings
                                            </Link>
                                        </div>
                                    )}

                                    {/* Privacy Tab */}
                                    {activeTab === 'privacy' && (
                                        <div className="space-y-6">
                                            <h2 className="text-2xl font-bold mb-4">Privacy & Security</h2>

                                            <div>
                                                <label className="block text-sm font-medium mb-2">Profile Visibility</label>
                                                <select
                                                    value={profileVisibility}
                                                    onChange={(e) => setProfileVisibility(e.target.value as 'public' | 'private')}
                                                    className="input w-full"
                                                >
                                                    <option value="public">Public</option>
                                                    <option value="private">Private</option>
                                                </select>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-[hsl(var(--surface))] rounded-lg">
                                                <div>
                                                    <p className="font-medium">Show Email on Profile</p>
                                                    <p className="text-sm text-[hsl(var(--foreground-muted))]">
                                                        Display your email address publicly
                                                    </p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={showEmail}
                                                        onChange={(e) => setShowEmail(e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(var(--primary))]"></div>
                                                </label>
                                            </div>

                                            <button
                                                onClick={handleSavePrivacy}
                                                disabled={isSaving}
                                                className="btn btn-primary disabled:opacity-50"
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </button>

                                            <div className="border-t border-[hsl(var(--border))] pt-6 mt-6">
                                                <h3 className="text-lg font-bold mb-4 text-red-500">Danger Zone</h3>
                                                <button className="btn bg-red-500 hover:bg-red-600 text-white">
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete Account
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Appearance Tab */}
                                    {activeTab === 'appearance' && (
                                        <div className="space-y-6">
                                            <h2 className="text-2xl font-bold mb-4">Appearance</h2>
                                            <p className="text-[hsl(var(--foreground-muted))]">
                                                Theme customization coming soon...
                                            </p>
                                        </div>
                                    )}

                                    {/* Help Tab */}
                                    {activeTab === 'help' && (
                                        <div className="space-y-6">
                                            <h2 className="text-2xl font-bold mb-4">Help & Support</h2>
                                            <div className="space-y-4">
                                                <a
                                                    href="#"
                                                    className="block p-4 bg-[hsl(var(--surface))] rounded-lg hover:bg-[hsl(var(--surface-elevated))] transition-colors"
                                                >
                                                    <p className="font-medium">Documentation</p>
                                                    <p className="text-sm text-[hsl(var(--foreground-muted))]">
                                                        Learn how to use ReelTalk
                                                    </p>
                                                </a>
                                                <a
                                                    href="#"
                                                    className="block p-4 bg-[hsl(var(--surface))] rounded-lg hover:bg-[hsl(var(--surface-elevated))] transition-colors"
                                                >
                                                    <p className="font-medium">Contact Support</p>
                                                    <p className="text-sm text-[hsl(var(--foreground-muted))]">
                                                        Get help from our team
                                                    </p>
                                                </a>
                                                <a
                                                    href="#"
                                                    className="block p-4 bg-[hsl(var(--surface))] rounded-lg hover:bg-[hsl(var(--surface-elevated))] transition-colors"
                                                >
                                                    <p className="font-medium">Report a Bug</p>
                                                    <p className="text-sm text-[hsl(var(--foreground-muted))]">
                                                        Help us improve ReelTalk
                                                    </p>
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
