'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Share2, MessageCircle, Eye, ArrowLeft, Send, ThumbsUp, Volume2, VolumeX, Maximize, Minimize, Play, Pause, SkipBack, SkipForward, UserPlus, UserCheck } from 'lucide-react';
import { getVideo, incrementVideoViews, likeVideo } from '@/services/video-service';
import { postVideoComment, subscribeVideoComments } from '@/services/comment-service';
import { canAccessVideo } from '@/services/subscription-service';
import { followCreator, unfollowCreator, isFollowing as checkIsFollowing } from '@/services/follow-service';
import { Video, VideoComment } from '@/types';

export default function VideoPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [video, setVideo] = useState<Video | null>(null);
    const [isLiked, setIsLiked] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState<VideoComment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isProcessingFollow, setIsProcessingFollow] = useState(false);

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

                // Check if user can access this video
                const hasAccess = await canAccessVideo(user?.uid, videoData);
                if (!hasAccess) {
                    setError('You do not have permission to view this video. Subscribe to the creator to access subscriber-only content.');
                    return;
                }

                setVideo(videoData);

                // Check following status
                if (user && videoData.creatorId !== user.uid) {
                    const following = await checkIsFollowing(user.uid, videoData.creatorId);
                    setIsFollowing(following);
                }

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
    }, [params.id, user]);

    const handleFollowToggle = async () => {
        if (!user || !video) return;

        setIsProcessingFollow(true);
        try {
            if (isFollowing) {
                await unfollowCreator(user.uid, video.creatorId);
                setIsFollowing(false);
            } else {
                await followCreator(user.uid, video.creatorId);
                setIsFollowing(true);
            }
        } catch (error: any) {
            console.error('Error toggling follow:', error);
            alert(error.message || 'Failed to update follow status');
        } finally {
            setIsProcessingFollow(false);
        }
    };

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
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
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

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = parseFloat(e.target.value);
        setVolume(vol);
        if (videoRef.current) {
            videoRef.current.volume = vol;
            if (vol > 0) setIsMuted(false);
        }
    };

    const handleFullscreen = () => {
        if (videoRef.current?.parentElement) {
            if (!isFullscreen) {
                videoRef.current.parentElement.requestFullscreen?.();
            } else {
                document.exitFullscreen?.();
            }
            setIsFullscreen(!isFullscreen);
        }
    };

    const handleSkip = (seconds: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
        }
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
                                {/* Enhanced Video Player */}
                                <div 
                                    className={`relative bg-black rounded-xl overflow-hidden mb-6 group ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
                                    onMouseEnter={() => setShowControls(true)}
                                    onMouseLeave={() => setShowControls(false)}
                                >
                                    <video
                                        ref={videoRef}
                                        src={video.videoUrl}
                                        className="w-full aspect-video object-contain bg-black"
                                        poster={video.thumbnailUrl}
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => setIsPlaying(false)}
                                        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                                        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                                        onVolumeChange={(e) => setVolume(e.currentTarget.volume)}
                                    />

                                    {/* Play Button Overlay */}
                                    {!isPlaying && (
                                        <button
                                            onClick={handlePlayPause}
                                            className="absolute inset-0 flex items-center justify-center hover:bg-black/30 transition-colors"
                                        >
                                            <Play className="w-20 h-20 text-white opacity-80 hover:opacity-100" fill="white" />
                                        </button>
                                    )}

                                    {/* Custom Controls */}
                                    <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                                        {/* Progress Bar */}
                                        <div className="mb-3">
                                            <input
                                                type="range"
                                                min="0"
                                                max={duration || 0}
                                                value={currentTime}
                                                onChange={(e) => {
                                                    const time = parseFloat(e.target.value);
                                                    if (videoRef.current) {
                                                        videoRef.current.currentTime = time;
                                                        setCurrentTime(time);
                                                    }
                                                }}
                                                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[hsl(var(--primary))]"
                                            />
                                        </div>

                                        {/* Control Buttons */}
                                        <div className="flex items-center justify-between text-white">
                                            <div className="flex items-center gap-2">
                                                {/* Play/Pause */}
                                                <button
                                                    onClick={handlePlayPause}
                                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                                >
                                                    {isPlaying ? (
                                                        <Pause className="w-5 h-5" fill="white" />
                                                    ) : (
                                                        <Play className="w-5 h-5" fill="white" />
                                                    )}
                                                </button>

                                                {/* Skip Back */}
                                                <button
                                                    onClick={() => handleSkip(-10)}
                                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                                    title="Skip back 10s"
                                                >
                                                    <SkipBack className="w-5 h-5" />
                                                </button>

                                                {/* Skip Forward */}
                                                <button
                                                    onClick={() => handleSkip(10)}
                                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                                    title="Skip forward 10s"
                                                >
                                                    <SkipForward className="w-5 h-5" />
                                                </button>

                                                {/* Volume Control */}
                                                <div className="flex items-center gap-2 ml-2">
                                                    <button
                                                        onClick={handleMute}
                                                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                                    >
                                                        {isMuted || volume === 0 ? (
                                                            <VolumeX className="w-5 h-5" />
                                                        ) : (
                                                            <Volume2 className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="1"
                                                        step="0.1"
                                                        value={isMuted ? 0 : volume}
                                                        onChange={handleVolumeChange}
                                                        className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[hsl(var(--primary))]"
                                                    />
                                                </div>

                                                {/* Time Display */}
                                                <span className="text-sm font-mono ml-auto px-2 py-1 bg-black/40 rounded">
                                                    {formatDuration(currentTime)} / {formatDuration(duration)}
                                                </span>
                                            </div>

                                            {/* Fullscreen Button */}
                                            <button
                                                onClick={handleFullscreen}
                                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                            >
                                                {isFullscreen ? (
                                                    <Minimize className="w-5 h-5" />
                                                ) : (
                                                    <Maximize className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
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
                                        {user?.uid !== video.creatorId && (
                                            <button
                                                onClick={handleFollowToggle}
                                                disabled={isProcessingFollow}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 ${isFollowing
                                                    ? 'bg-[hsl(var(--surface))] text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-elevated))]'
                                                    : 'bg-[hsl(var(--primary))] text-white hover:opacity-90'
                                                    }`}
                                            >
                                                {isFollowing ? (
                                                    <>
                                                        <UserCheck className="w-4 h-4" />
                                                        Following
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus className="w-4 h-4" />
                                                        Follow
                                                    </>
                                                )}
                                            </button>
                                        )}
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
