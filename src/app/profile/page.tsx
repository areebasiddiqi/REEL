'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/services/auth-service';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Edit2, Mail, Calendar, Users, Award } from 'lucide-react';

export default function ProfilePage() {
    const router = useRouter();
    const { user, loading, signOut } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [formData, setFormData] = useState({
        displayName: user?.displayName || '',
        bio: user?.bio || '',
        photoURL: user?.photoURL || '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                displayName: user.displayName,
                bio: user.bio || '',
                photoURL: user.photoURL || '',
            });
        }
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--primary))]"></div>
                    <p className="text-[hsl(var(--foreground))] mt-4">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4">Access Denied</h1>
                    <p className="text-[hsl(var(--foreground-muted))] mb-6">Please sign in to view your profile.</p>
                    <Link
                        href="/login"
                        className="inline-block bg-[hsl(var(--primary))] hover:opacity-90 text-white font-semibold py-2 px-6 rounded-lg transition"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSaveProfile = async () => {
        setError('');
        setSuccess('');
        setIsSaving(true);

        try {
            await updateUserProfile(user.uid, {
                displayName: formData.displayName,
                bio: formData.bio,
                photoURL: formData.photoURL,
            });
            setSuccess('Profile updated successfully!');
            setIsEditing(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Failed to sign out');
        }
    };

    return (
        <div className="min-h-screen bg-[hsl(var(--background))]">
            <Header onMenuToggle={setIsSidebarOpen} />
            <div className="flex">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                
                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    {/* Banner */}
                    <div className="h-48 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] relative">
                        <div className="absolute inset-0 opacity-20 bg-pattern"></div>
                    </div>

                    <div className="max-w-4xl mx-auto px-4 pb-12">
                        {/* Profile Header */}
                        <div className="flex flex-col md:flex-row gap-6 -mt-20 mb-8 relative z-10">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                <div className="w-40 h-40 rounded-full overflow-hidden bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] flex items-center justify-center border-4 border-[hsl(var(--background))]">
                                    {user.photoURL ? (
                                        <Image
                                            src={user.photoURL}
                                            alt={user.displayName}
                                            width={160}
                                            height={160}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-6xl font-bold text-white">
                                            {user.displayName.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="flex-1 flex flex-col justify-end pb-4">
                                <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2">
                                    {user.displayName}
                                </h1>
                                <p className="text-[hsl(var(--foreground-muted))] mb-4">
                                    @{user.displayName.toLowerCase().replace(/\s+/g, '')}
                                </p>
                                {user.bio && (
                                    <p className="text-[hsl(var(--foreground))] mb-4 max-w-2xl">
                                        {user.bio}
                                    </p>
                                )}
                                <div className="flex gap-8 mb-6">
                                    <div>
                                        <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                                            {user.followers}
                                        </p>
                                        <p className="text-sm text-[hsl(var(--foreground-muted))]">Followers</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                                            {user.following}
                                        </p>
                                        <p className="text-sm text-[hsl(var(--foreground-muted))]">Following</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    {!isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="flex items-center gap-2 px-6 py-2 bg-[hsl(var(--primary))] hover:opacity-90 text-white rounded-full font-medium transition"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Edit Profile
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Alert Messages */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-900/30 border border-red-600 rounded-lg text-red-300">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-6 p-4 bg-green-900/30 border border-green-600 rounded-lg text-green-300">
                                {success}
                            </div>
                        )}

                        {/* Edit Form */}
                        {isEditing && (
                            <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-8 mb-8">
                                <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-6">Edit Profile</h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                                            Display Name
                                        </label>
                                        <input
                                            type="text"
                                            name="displayName"
                                            value={formData.displayName}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-[hsl(var(--foreground))] placeholder-[hsl(var(--foreground-subtle))] focus:outline-none focus:border-[hsl(var(--primary))] transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                                            Bio
                                        </label>
                                        <textarea
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleInputChange}
                                            placeholder="Tell us about yourself..."
                                            rows={4}
                                            className="w-full px-4 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-[hsl(var(--foreground))] placeholder-[hsl(var(--foreground-subtle))] focus:outline-none focus:border-[hsl(var(--primary))] transition resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                                            Photo URL
                                        </label>
                                        <input
                                            type="text"
                                            name="photoURL"
                                            value={formData.photoURL}
                                            onChange={handleInputChange}
                                            placeholder="https://example.com/photo.jpg"
                                            className="w-full px-4 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-[hsl(var(--foreground))] placeholder-[hsl(var(--foreground-subtle))] focus:outline-none focus:border-[hsl(var(--primary))] transition"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={isSaving}
                                            className="px-6 py-2 bg-[hsl(var(--primary))] hover:opacity-90 disabled:opacity-50 text-white rounded-lg font-medium transition"
                                        >
                                            {isSaving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setFormData({
                                                    displayName: user.displayName,
                                                    bio: user.bio || '',
                                                    photoURL: user.photoURL || '',
                                                });
                                            }}
                                            className="px-6 py-2 bg-[hsl(var(--surface-elevated))] hover:bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] rounded-lg font-medium transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Account Details */}
                        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-8 mb-8">
                            <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-6">Account Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-start gap-4">
                                    <Mail className="w-5 h-5 text-[hsl(var(--primary))] flex-shrink-0 mt-1" />
                                    <div>
                                        <p className="text-sm text-[hsl(var(--foreground-muted))]">Email</p>
                                        <p className="text-[hsl(var(--foreground))] font-medium">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <Calendar className="w-5 h-5 text-[hsl(var(--primary))] flex-shrink-0 mt-1" />
                                    <div>
                                        <p className="text-sm text-[hsl(var(--foreground-muted))]">Member Since</p>
                                        <p className="text-[hsl(var(--foreground))] font-medium">
                                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <Award className="w-5 h-5 text-[hsl(var(--primary))] flex-shrink-0 mt-1" />
                                    <div>
                                        <p className="text-sm text-[hsl(var(--foreground-muted))]">Role</p>
                                        <p className="text-[hsl(var(--foreground))] font-medium capitalize">{user.role}</p>
                                    </div>
                                </div>
                                {user.subscriptionTier && (
                                    <div className="flex items-start gap-4">
                                        <Users className="w-5 h-5 text-[hsl(var(--primary))] flex-shrink-0 mt-1" />
                                        <div>
                                            <p className="text-sm text-[hsl(var(--foreground-muted))]">Subscription</p>
                                            <p className="text-[hsl(var(--foreground))] font-medium capitalize">{user.subscriptionTier}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sign Out */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleSignOut}
                                className="px-6 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition border border-red-600/30"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
