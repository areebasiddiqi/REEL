'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    Home,
    Radio,
    Compass,
    Bookmark,
    Clock,
    ThumbsUp,
    Settings,
    HelpCircle,
    TrendingUp,
    Users,
    Trophy,
    Crown,
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { user } = useAuth();

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

    const navItems = [
        { id: 'home', label: 'Home', href: '/live', icon: Home },
        { id: 'explore', label: 'Explore', href: '/live', icon: Compass },
        { id: 'creators', label: 'Creators', href: '/creators', icon: Users },
    ];

    const creatorItems = [
        { id: 'go-live', label: 'Go Live', href: '/live/create', icon: Radio },
        { id: 'videos', label: 'Videos', href: '/videos', icon: TrendingUp },
        { id: 'upload', label: 'Upload', href: '/upload', icon: Bookmark },
        { id: 'challenges', label: 'Challenges', href: '/challenges', icon: Trophy },
        { id: 'leaderboard', label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    ];

    const libraryItems = [
        { id: 'profile', label: 'Profile', href: user ? `/profile/${user.uid}` : '/profile', icon: Users },
        { id: 'friends', label: 'Friends', href: '/friends', icon: Users },
        { id: 'messages', label: 'Messages', href: '/messages', icon: Users },
        { id: 'subscriptions', label: 'Subscriptions', href: '/subscriptions', icon: Crown },
    ];

    const settingsItems = [
        { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
        { id: 'help', label: 'Help & Feedback', href: '/help', icon: HelpCircle },
    ];

    const NavLink = ({ label, href, icon: Icon }: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }) => {
        const active = isActive(href);
        return (
            <Link
                href={href}
                onClick={onClose}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${active
                    ? 'bg-[hsl(var(--surface-elevated))] text-[hsl(var(--primary))]'
                    : 'text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface))]'
                    }`}
            >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{label}</span>
            </Link>
        );
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed md:sticky top-[61px] left-0 h-[calc(100vh-61px)] w-64 bg-[hsl(var(--background))] border-r border-[hsl(var(--border))] overflow-y-auto transition-transform duration-300 z-40 md:z-0 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
            >
                <nav className="p-4 space-y-1 pb-24">
                    {/* Main Navigation */}
                    <div className="space-y-1 mb-6">
                        {navItems.map((item) => (
                            <NavLink key={item.id} {...item} />
                        ))}
                    </div>

                    {/* Creator Section */}
                    {user && (
                        <>
                            <div className="px-4 py-2">
                                <p className="text-xs font-semibold text-[hsl(var(--foreground-subtle))] uppercase tracking-wider">
                                    Creator Tools
                                </p>
                            </div>
                            <div className="space-y-1 mb-6">
                                {creatorItems.map((item) => (
                                    <NavLink key={item.id} {...item} />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Library Section */}
                    <div className="px-4 py-2">
                        <p className="text-xs font-semibold text-[hsl(var(--foreground-subtle))] uppercase tracking-wider">
                            Library
                        </p>
                    </div>
                    <div className="space-y-1 mb-6">
                        {libraryItems.map((item) => (
                            <NavLink key={item.id} {...item} />
                        ))}
                    </div>

                    {/* Settings Section */}
                    <div className="px-4 py-2">
                        <p className="text-xs font-semibold text-[hsl(var(--foreground-subtle))] uppercase tracking-wider">
                            Settings
                        </p>
                    </div>
                    <div className="space-y-1">
                        {settingsItems.map((item) => (
                            <NavLink key={item.id} {...item} />
                        ))}
                    </div>
                </nav>

                {/* Footer Info */}
                <div className="sticky bottom-0 p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--surface))] z-50">
                    <p className="text-xs text-[hsl(var(--foreground-subtle))] text-center">
                        © 2026 ReelTalk. All rights reserved.
                    </p>
                </div>
            </aside>
        </>
    );
}
