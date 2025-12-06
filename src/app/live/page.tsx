'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Play, Radio, Eye, Calendar } from 'lucide-react';
import { getAllLivestreams } from '@/services/livestream-service';
import { Livestream } from '@/types';

export default function LivePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'scheduled'>('all');
    const [livestreams, setLivestreams] = useState<Livestream[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Fetch livestreams
    useEffect(() => {
        const fetchLivestreams = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getAllLivestreams(filterStatus, searchQuery);
                setLivestreams(data);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch livestreams');
                console.error('Error fetching livestreams:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLivestreams();
    }, [filterStatus, searchQuery]);

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

    const formatDuration = (startedAt: Date, endedAt?: Date) => {
        const start = new Date(startedAt);
        const end = endedAt ? new Date(endedAt) : new Date();
        const diffMs = end.getTime() - start.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 60) {
            return `${diffMins}m`;
        }
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m`;
    };

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
                                <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2">Live Streams</h1>
                                <p className="text-[hsl(var(--foreground-muted))]">Watch creators share their knowledge and expertise</p>
                            </div>
                            <Link href="/live/create" className="btn btn-primary">
                                Create Stream
                            </Link>
                        </div>

                        {/* Search and Filter */}
                        <div className="mb-8 space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Filter */}
                                <div className="flex gap-2">
                                    {(['all', 'live', 'scheduled'] as const).map((status) => (
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
                        ) : livestreams.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {livestreams.map((stream) => (
                                    <div
                                        key={stream.id}
                                        className="cursor-pointer group"
                                        onClick={() => router.push(`/live/${stream.id}`)}
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] h-56 overflow-hidden rounded-lg mb-3">
                                            {stream.thumbnailUrl ? (
                                                <img
                                                    src={stream.thumbnailUrl}
                                                    alt={stream.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Play className="w-12 h-12 text-white opacity-50 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            )}

                                            {/* Status Badge */}
                                            <div className="absolute top-2 right-2">
                                                {stream.status === 'live' ? (
                                                    <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                                                        <Radio className="w-3 h-3" />
                                                        LIVE
                                                    </div>
                                                ) : stream.status === 'ended' ? (
                                                    <div className="flex items-center gap-1 bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                                        ENDED
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] px-2 py-1 rounded-full text-xs font-medium">
                                                        <Calendar className="w-3 h-3" />
                                                        SCHEDULED
                                                    </div>
                                                )}
                                            </div>

                                            {/* Premium Badge */}
                                            {stream.isPremium && (
                                                <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                                                    PRO
                                                </div>
                                            )}

                                            {/* Viewer Count Overlay */}
                                            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white px-2 py-1 rounded text-xs">
                                                <Eye className="w-3 h-3" />
                                                {stream.status === 'ended' ? (
                                                    formatDuration(stream.startedAt, stream.endedAt)
                                                ) : stream.viewerCount > 0 ? (
                                                    stream.viewerCount.toLocaleString()
                                                ) : (
                                                    'Not started'
                                                )}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="space-y-2">
                                            {/* Creator Info */}
                                            <div className="flex items-start gap-3">
                                                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))]">
                                                    {stream.creatorPhoto ? (
                                                        <Image
                                                            src={stream.creatorPhoto}
                                                            alt={stream.creatorName}
                                                            width={36}
                                                            height={36}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                                                            {stream.creatorName.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-sm line-clamp-2 group-hover:text-[hsl(var(--primary))] transition-colors">
                                                        {stream.title}
                                                    </h3>
                                                    <p className="text-xs text-[hsl(var(--foreground-muted))] truncate">
                                                        {stream.creatorName}
                                                    </p>
                                                    <p className="text-xs text-[hsl(var(--foreground-subtle))]">
                                                        {stream.tags.slice(0, 1).map(tag => `#${tag}`).join(' ')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Radio className="w-12 h-12 text-[hsl(var(--foreground-subtle))] mx-auto mb-4 opacity-50" />
                                <p className="text-[hsl(var(--foreground-muted))] text-lg">No streams found</p>
                                <p className="text-[hsl(var(--foreground-subtle))] text-sm mt-2">Try adjusting your search or filters</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
