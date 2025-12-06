'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Play, Search, Filter, Eye, Heart, Calendar, Upload } from 'lucide-react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { getAccessibleVideos } from '@/services/video-service';
import { Video } from '@/types';

export default function VideosPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPrivacy, setFilterPrivacy] = useState<'all' | 'public' | 'subscribers' | 'members'>('all');
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Fetch videos
    useEffect(() => {
        const fetchVideos = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getAccessibleVideos(user?.uid);
                setVideos(data);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch videos');
                console.error('Error fetching videos:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (!loading) {
            fetchVideos();
        }
    }, [user?.uid, loading]);

    // Filter videos based on search query
    useEffect(() => {
        let filtered = videos;

        if (searchQuery) {
            filtered = filtered.filter(
                (video) =>
                    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    video.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    video.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        if (filterPrivacy !== 'all') {
            filtered = filtered.filter((video) => video.privacy === filterPrivacy);
        }

        setFilteredVideos(filtered);
    }, [videos, searchQuery, filterPrivacy]);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatViews = (views: number) => {
        if (views >= 1000000) {
            return (views / 1000000).toFixed(1) + 'M';
        } else if (views >= 1000) {
            return (views / 1000).toFixed(1) + 'K';
        }
        return views.toString();
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
                        <h1 className="text-4xl font-bold mb-2">Videos</h1>
                        <p className="text-[hsl(var(--foreground-muted))]">Discover amazing videos from creators</p>
                    </div>
                    <Link href="/upload" className="btn btn-primary flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Upload Video
                    </Link>
                </div>

                {/* Search and Filter */}
                <div className="mb-8 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--foreground-subtle))]" />
                            <input
                                type="text"
                                placeholder="Search videos, creators, or tags..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input pl-11 w-full"
                            />
                        </div>

                        {/* Filter */}
                        <div className="flex gap-2">
                            {(['all', 'public', 'subscribers', 'members'] as const).map((privacy) => (
                                <button
                                    key={privacy}
                                    onClick={() => setFilterPrivacy(privacy)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                                        filterPrivacy === privacy
                                            ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                                            : 'bg-[hsl(var(--surface))] text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-hover))]'
                                    }`}
                                >
                                    {privacy === 'all' && 'All Videos'}
                                    {privacy === 'public' && 'Public'}
                                    {privacy === 'subscribers' && '👑 Subscribers'}
                                    {privacy === 'members' && '⭐ Members'}
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
                ) : filteredVideos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVideos.map((video) => (
                            <div
                                key={video.id}
                                className="glass-card overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                                onClick={() => router.push(`/videos/${video.id}`)}
                            >
                                {/* Thumbnail */}
                                <div className="relative bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] h-40 overflow-hidden">
                                    {video.thumbnailUrl ? (
                                        <img
                                            src={video.thumbnailUrl}
                                            alt={video.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Play className="w-12 h-12 text-white opacity-50 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    )}

                                    {/* Duration Badge */}
                                    <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium">
                                        {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                                    </div>

                                    {/* Privacy Badge */}
                                    <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                                        video.privacy === 'subscribers'
                                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                                            : video.privacy === 'members'
                                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                                            : 'bg-[hsl(var(--surface))] text-[hsl(var(--foreground))]'
                                    }`}>
                                        {video.privacy === 'subscribers' && (
                                            <>
                                                <span>👑</span>
                                                <span>Subscribers Only</span>
                                            </>
                                        )}
                                        {video.privacy === 'members' && (
                                            <>
                                                <span>⭐</span>
                                                <span>Members Only</span>
                                            </>
                                        )}
                                        {video.privacy === 'public' && (
                                            <span>Public</span>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    {/* Creator Info */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <img
                                            src={video.creatorPhoto || 'https://via.placeholder.com/40'}
                                            alt={video.creatorName}
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{video.creatorName}</p>
                                            <p className="text-xs text-[hsl(var(--foreground-subtle))]">Creator</p>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="font-bold text-base mb-2 line-clamp-2 group-hover:text-[hsl(var(--primary))] transition-colors">
                                        {video.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-sm text-[hsl(var(--foreground-muted))] mb-3 line-clamp-2">
                                        {video.description}
                                    </p>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {video.tags.slice(0, 2).map((tag) => (
                                            <span
                                                key={tag}
                                                className="text-xs bg-[hsl(var(--surface))] text-[hsl(var(--foreground-muted))] px-2 py-1 rounded"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                        {video.tags.length > 2 && (
                                            <span className="text-xs text-[hsl(var(--foreground-subtle))]">
                                                +{video.tags.length - 2}
                                            </span>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between text-sm text-[hsl(var(--foreground-muted))] border-t border-[hsl(var(--border))] pt-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1">
                                                <Eye className="w-4 h-4" />
                                                {formatViews(video.views)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Heart className="w-4 h-4" />
                                                {formatViews(video.likes)}
                                            </div>
                                        </div>
                                        <span className="text-xs text-[hsl(var(--foreground-subtle))]">
                                            {formatDate(video.uploadedAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Play className="w-12 h-12 text-[hsl(var(--foreground-subtle))] mx-auto mb-4 opacity-50" />
                        <p className="text-[hsl(var(--foreground-muted))] text-lg">No videos found</p>
                        <p className="text-[hsl(var(--foreground-subtle))] text-sm mt-2">Try adjusting your search or filters</p>
                    </div>
                )}
                    </div>
                </main>
            </div>
        </div>
    );
}
