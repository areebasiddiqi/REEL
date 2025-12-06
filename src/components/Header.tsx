'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Search, Menu, X, Bell, Upload, LogOut, Settings, User } from 'lucide-react';

interface HeaderProps {
    onMenuToggle?: (isOpen: boolean) => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/live?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
        onMenuToggle?.(!isSidebarOpen);
    };

    return (
        <header className="sticky top-0 z-50 bg-[hsl(var(--background))] border-b border-[hsl(var(--border))]">
            <div className="px-4 py-3 flex items-center justify-between gap-4">
                {/* Left Section: Logo & Sidebar Toggle */}
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 hover:bg-[hsl(var(--surface))] rounded-lg transition-colors"
                        aria-label="Toggle sidebar"
                    >
                        {isSidebarOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Menu className="w-6 h-6" />
                        )}
                    </button>
                    <Link href="/live" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">R</span>
                        </div>
                        <span className="font-bold text-lg hidden sm:inline">ReelTalk</span>
                    </Link>
                </div>

                {/* Center Section: Search */}
                <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="Search streams, creators..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-full text-sm focus:outline-none focus:border-[hsl(var(--primary))] transition-colors"
                        />
                        <button
                            type="submit"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] transition-colors"
                        >
                            <Search className="w-4 h-4" />
                        </button>
                    </div>
                </form>

                {/* Right Section: Actions & User Menu */}
                <div className="flex items-center gap-2">
                    {/* Mobile Search */}
                    <button
                        onClick={() => router.push('/live')}
                        className="md:hidden p-2 hover:bg-[hsl(var(--surface))] rounded-lg transition-colors"
                        aria-label="Search"
                    >
                        <Search className="w-5 h-5" />
                    </button>

                    {/* Create Button */}
                    {user && (
                        <Link
                            href="/live/create"
                            className="hidden sm:flex items-center gap-2 px-4 py-2 hover:bg-[hsl(var(--surface))] rounded-lg transition-colors"
                            title="Create livestream"
                        >
                            <Upload className="w-5 h-5" />
                            <span className="hidden md:inline text-sm font-medium">Create</span>
                        </Link>
                    )}

                    {/* Notifications */}
                    <button className="p-2 hover:bg-[hsl(var(--surface))] rounded-lg transition-colors relative" title="Notifications">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* User Menu */}
                    {user ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-2 p-1 hover:bg-[hsl(var(--surface))] rounded-lg transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] flex items-center justify-center">
                                    {user.photoURL ? (
                                        <Image
                                            src={user.photoURL}
                                            alt={user.displayName}
                                            width={32}
                                            height={32}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-white font-bold text-sm">
                                            {user.displayName.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--border))] rounded-lg shadow-lg overflow-hidden">
                                    <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
                                        <p className="font-medium text-sm">{user.displayName}</p>
                                        <p className="text-xs text-[hsl(var(--foreground-muted))]">{user.email}</p>
                                    </div>
                                    <nav className="py-2">
                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-3 px-4 py-2 hover:bg-[hsl(var(--surface))] transition-colors text-sm"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <User className="w-4 h-4" />
                                            Your Profile
                                        </Link>
                                        <Link
                                            href="/settings"
                                            className="flex items-center gap-3 px-4 py-2 hover:bg-[hsl(var(--surface))] transition-colors text-sm"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <Settings className="w-4 h-4" />
                                            Settings
                                        </Link>
                                    </nav>
                                    <div className="border-t border-[hsl(var(--border))] py-2">
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                handleSignOut();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[hsl(var(--surface))] transition-colors text-sm text-red-400"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/login" className="px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
