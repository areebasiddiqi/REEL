'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Trophy, Calendar, Users, Play } from 'lucide-react';
import { getAllChallenges } from '@/services/challenge-service';
import { Challenge } from '@/types';

export default function ChallengesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'ended'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Fetch challenges
    useEffect(() => {
        const fetchChallenges = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getAllChallenges(filterStatus);
                setChallenges(data);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch challenges');
                console.error('Error fetching challenges:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchChallenges();
    }, [filterStatus]);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
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
        <div className="min-h-screen bg-[hsl(var(--background))]">
            <Header onMenuToggle={setIsSidebarOpen} />
            <div className="flex">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    <div className="max-w-7xl mx-auto px-4 py-8">
                        {/* Page Title */}
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2">Challenges</h1>
                                <p className="text-[hsl(var(--foreground-muted))]">Complete challenges and earn points</p>
                            </div>
                            <Link href="/challenges/create" className="btn btn-primary">
                                Create Challenge
                            </Link>
                        </div>

                        {/* Filters */}
                        <div className="mb-8">
                            <div className="flex gap-2">
                                {(['all', 'active', 'ended'] as const).map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all ${filterStatus === status
                                                ? 'bg-[hsl(var(--primary))] text-white'
                                                : 'bg-[hsl(var(--surface))] text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-elevated))]'
                                            }`}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Loading State */}
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(var(--primary))]"></div>
                            </div>
                        ) : error ? (
                            <div className="text-center py-12">
                                <p className="text-red-500 text-lg">{error}</p>
                            </div>
                        ) : challenges.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {challenges.map((challenge) => (
                                    <div
                                        key={challenge.id}
                                        className="cursor-pointer group glass-card overflow-hidden hover:shadow-lg transition-all"
                                        onClick={() => router.push(`/challenges/${challenge.id}`)}
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] h-48 overflow-hidden">
                                            {challenge.thumbnailUrl ? (
                                                <img
                                                    src={challenge.thumbnailUrl}
                                                    alt={challenge.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Trophy className="w-16 h-16 text-white opacity-50" />
                                                </div>
                                            )}

                                            {/* Status Badge */}
                                            <div className="absolute top-2 right-2">
                                                <div
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${challenge.status === 'active'
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-gray-500 text-white'
                                                        }`}
                                                >
                                                    {challenge.status.toUpperCase()}
                                                </div>
                                            </div>

                                            {/* Points Badge */}
                                            <div className="absolute top-2 left-2 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                                                <Trophy className="w-4 h-4" />
                                                {challenge.pointsReward}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-[hsl(var(--primary))] transition-colors">
                                                {challenge.title}
                                            </h3>

                                            <p className="text-sm text-[hsl(var(--foreground-muted))] mb-4 line-clamp-2">
                                                {challenge.description}
                                            </p>

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 text-xs text-[hsl(var(--foreground-subtle))] mb-3">
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {challenge.participants}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Play className="w-3 h-3" />
                                                    {challenge.completions}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(challenge.endDate)}
                                                </div>
                                            </div>

                                            {/* Tags */}
                                            <div className="flex flex-wrap gap-1">
                                                {challenge.tags.slice(0, 2).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="text-xs bg-[hsl(var(--surface))] text-[hsl(var(--foreground-muted))] px-2 py-1 rounded-full"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Trophy className="w-12 h-12 text-[hsl(var(--foreground-subtle))] mx-auto mb-4 opacity-50" />
                                <p className="text-[hsl(var(--foreground-muted))] text-lg">No challenges found</p>
                                <p className="text-[hsl(var(--foreground-subtle))] text-sm mt-2">
                                    Be the first to create one!
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
