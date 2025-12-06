'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Radio, Video, Trophy, CreditCard, User as UserIcon, LogOut } from 'lucide-react';

export default function DashboardPage() {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

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
        <div className="min-h-screen">
            {/* Header */}
            <header className="glass-card sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/dashboard" className="text-2xl font-bold gradient-text">
                        ReelTalk
                    </Link>

                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/live" className="text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] transition-colors">
                            Live
                        </Link>
                        <Link href="/videos" className="text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] transition-colors">
                            Videos
                        </Link>
                        <Link href="/challenges" className="text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] transition-colors">
                            Challenges
                        </Link>
                        <Link href="/subscriptions" className="text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] transition-colors">
                            Subscriptions
                        </Link>
                    </nav>

                    <div className="flex items-center gap-3">
                        <Link href="/profile" className="btn btn-ghost">
                            <UserIcon className="w-5 h-5" />
                        </Link>
                        <button onClick={handleSignOut} className="btn btn-ghost">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Welcome Section */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-2">
                        Welcome back, <span className="gradient-text">{user.displayName}</span>!
                    </h1>
                    <p className="text-[hsl(var(--foreground-muted))]">
                        {user.role === 'creator' ? 'Manage your content and engage with your audience' : 'Discover amazing content and join challenges'}
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <Link href="/live/create" className="card-hover group">
                        <Radio className="w-12 h-12 text-[hsl(var(--primary))] mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-semibold mb-2">Go Live</h3>
                        <p className="text-sm text-[hsl(var(--foreground-muted))]">
                            Start a livestream instantly
                        </p>
                    </Link>

                    <Link href="/upload" className="card-hover group">
                        <Video className="w-12 h-12 text-[hsl(var(--secondary))] mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-semibold mb-2">Upload Video</h3>
                        <p className="text-sm text-[hsl(var(--foreground-muted))]">
                            Share your content
                        </p>
                    </Link>

                    <Link href="/challenges" className="card-hover group">
                        <Trophy className="w-12 h-12 text-[hsl(var(--accent))] mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-semibold mb-2">Challenges</h3>
                        <p className="text-sm text-[hsl(var(--foreground-muted))]">
                            Join and compete
                        </p>
                    </Link>

                    <Link href="/subscriptions" className="card-hover group">
                        <CreditCard className="w-12 h-12 text-[hsl(var(--success))] mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-semibold mb-2">Subscriptions</h3>
                        <p className="text-sm text-[hsl(var(--foreground-muted))]">
                            Manage your plans
                        </p>
                    </Link>
                </div>

                {/* Content Sections */}
                <div className="space-y-8">
                    {/* Live Now */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Live Now</h2>
                            <Link href="/live" className="text-[hsl(var(--primary))] hover:underline">
                                View all
                            </Link>
                        </div>
                        <div className="glass-card p-8 text-center">
                            <Radio className="w-16 h-16 text-[hsl(var(--foreground-subtle))] mx-auto mb-4" />
                            <p className="text-[hsl(var(--foreground-muted))]">
                                No live streams at the moment
                            </p>
                            <Link href="/live/create" className="btn btn-primary mt-4">
                                Start Streaming
                            </Link>
                        </div>
                    </section>

                    {/* Trending Videos */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Trending Videos</h2>
                            <Link href="/videos" className="text-[hsl(var(--primary))] hover:underline">
                                View all
                            </Link>
                        </div>
                        <div className="glass-card p-8 text-center">
                            <Video className="w-16 h-16 text-[hsl(var(--foreground-subtle))] mx-auto mb-4" />
                            <p className="text-[hsl(var(--foreground-muted))]">
                                No videos yet
                            </p>
                            <Link href="/upload" className="btn btn-primary mt-4">
                                Upload Video
                            </Link>
                        </div>
                    </section>

                    {/* Active Challenges */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Active Challenges</h2>
                            <Link href="/challenges" className="text-[hsl(var(--primary))] hover:underline">
                                View all
                            </Link>
                        </div>
                        <div className="glass-card p-8 text-center">
                            <Trophy className="w-16 h-16 text-[hsl(var(--foreground-subtle))] mx-auto mb-4" />
                            <p className="text-[hsl(var(--foreground-muted))]">
                                No active challenges
                            </p>
                            {user.role === 'creator' && (
                                <Link href="/challenges/create" className="btn btn-primary mt-4">
                                    Create Challenge
                                </Link>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
