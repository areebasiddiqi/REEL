'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Share2, MessageCircle, Eye, ArrowLeft, Send, ThumbsUp } from 'lucide-react';
import { getVideo, incrementVideoViews, likeVideo } from '@/services/video-service';
import { postVideoComment, subscribeVideoComments } from '@/services/comment-service';
import { Video, VideoComment } from '@/types';

export default function VideoPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [video, setVideo] = useState<Video | null>(null);
    const [isLiked, setIsLiked] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState<VideoComment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Fetch video and comments
    useEffect(() => {
        let unsubscribeComments: () => void;

        const fetchData = async () => {
            if (!params.id) return;

            try {
                setIsLoading(true);
                setError(null);

                // Fetch video
                const videoData = await getVideo(params.id as string);
                if (!videoData) {
                    setError('Video not found');
                    return;
                }
                setVideo(videoData);

                // Increment views
                await incrementVideoViews(params.id as string);

                // Subscribe to comments
                unsubscribeComments = subscribeVideoComments(params.id as string, (newComments) => {
                    setComments(newComments);
                });
            } catch (err: any) {
                setError(err.message || 'Failed to load video');
                console.error('Error fetching video:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        return () => {
            if (unsubscribeComments) {
                unsubscribeComments();
            }
        };
    }, [params.id]);

    const handleAddComment = async () => {
        if (!commentText.trim() || !user || !video) return;

        try {
            await postVideoComment(
                video.id,
                user.uid,
                user.displayName || 'User',
                user.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
                commentText
            );

            setCommentText('');
        } catch (err: any) {
            console.error('Error adding comment:', err);
            alert('Failed to add comment');
        }
    };

    const handleLike = async () => {
        if (!video) return;

        try {
            await likeVideo(video.id);
            setIsLiked(true);
            setVideo(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
        } catch (err: any) {
            console.error('Error liking video:', err);
        }
    };

    const handleShare = async () => {
        if (!video) return;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: video.title,
                    text: video.description,
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatViews = (views: number) => {
        if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
        if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
        return views.toString();
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
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
        <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--surface))] to-[hsl(var(--background))]">
            {/* Header */}
            <header className="glass-card sticky top-0 z-50 border-b border-[hsl(var(--border))]">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-[hsl(var(--surface))] rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <Link href="/" className="text-2xl font-bold gradient-text">
                            ReelTalk
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Video Player Section */}
                    <div className="lg:col-span-2">
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(var(--primary))]"></div>
                            </div>
                        ) : error ? (
                            <div className="text-center py-12">
                                <p className="text-red-500 text-lg">{error}</p>
                            </div>
                        ) : video ? (
                            <>
                                {/* Video Player */}
                                <div className="relative bg-black rounded-xl overflow-hidden mb-6">
                                    <video
                                        src={video.videoUrl}
                                        controls
                                        className="w-full aspect-video object-contain bg-black"
                                        poster={video.thumbnailUrl}
                                    />
                                </div>

                                {/* Video Info */}
                                <div className="glass-card p-6 mb-6">
                                    <h1 className="text-3xl font-bold mb-4">{video.title}</h1>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 mb-6 text-[hsl(var(--foreground-muted))]">
                                        <div className="flex items-center gap-1">
                                            <Eye className="w-4 h-4" />
                                            <span>{formatViews(video.views)} views</span>
                                        </div>
                                        <span>•</span>
                                        <span>{formatDate(video.uploadedAt)}</span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 mb-6 pb-6 border-b border-[hsl(var(--border))]">
                                        <button
                                            onClick={handleLike}
                                            disabled={isLiked}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isLiked
                                                    ? 'bg-red-500/20 text-red-500'
                                                    : 'bg-[hsl(var(--surface))] text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-hover))]'
                                                }`}
                                        >
                                            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                                            {video.likes.toLocaleString()}
                                        </button>
                                        <button
                                            onClick={handleShare}
                                            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--surface))] text-[hsl(var(--foreground-muted))] rounded-lg hover:bg-[hsl(var(--surface-hover))] transition-all"
                                        >
                                            <Share2 className="w-5 h-5" />
                                            Share
                                        </button>
                                    </div>

                                    {/* Creator Info */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={video.creatorPhoto || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                                alt={video.creatorName}
                                                className="w-12 h-12 rounded-full"
                                            />
                                            <div>
                                                <p className="font-bold">{video.creatorName}</p>
                                                <p className="text-sm text-[hsl(var(--foreground-muted))]">Creator</p>
                                            </div>
                                        </div>
                                        <button className="btn btn-primary">Follow</button>
                                    </div>

                                    {/* Description */}
                                    <p className="text-[hsl(var(--foreground-muted))] mb-6">
                                        {video.description}
                                    </p>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2">
                                        {video.tags.map((tag: string) => (
                                            <span
                                                key={tag}
                                                className="text-sm bg-[hsl(var(--surface))] text-[hsl(var(--foreground-muted))] px-3 py-1 rounded-full"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>

                    {/* Comments Section */}
                    <div className="lg:col-span-1">
                        <div className="glass-card h-full flex flex-col">
                            {/* Comments Header */}
                            <div className="p-4 border-b border-[hsl(var(--border))] flex items-center gap-2">
                                <MessageCircle className="w-5 h-5" />
                                <h3 className="font-bold">Comments ({comments.length})</h3>
                            </div>

                            {/* Comments List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <img
                                                src={comment.userPhoto || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                                alt={comment.userName}
                                                className="w-8 h-8 rounded-full flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-sm truncate">{comment.userName}</p>
                                                    <p className="text-xs text-[hsl(var(--foreground-subtle))]">
                                                        {Math.floor((Date.now() - new Date(comment.createdAt).getTime()) / 60000)}m ago
                                                    </p>
                                                </div>
                                                <p className="text-sm text-[hsl(var(--foreground-muted))] mt-1">
                                                    {comment.content}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Comment Input */}
                            <div className="p-4 border-t border-[hsl(var(--border))]">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add a comment..."
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleAddComment();
                                            }
                                        }}
                                        className="input flex-1"
                                    />
                                    <button
                                        onClick={handleAddComment}
                                        disabled={!commentText.trim()}
                                        className="btn btn-primary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
