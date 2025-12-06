'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Share2, MessageCircle, Users, Volume2, Maximize, ArrowLeft, Send, Mic, MicOff, Clock } from 'lucide-react';
import { getLivestream, endLivestream } from '@/services/livestream-service';
import { postLivestreamComment, subscribeLivestreamComments } from '@/services/comment-service';
import { streamService } from '@/services/stream-service';
import { webrtcService } from '@/services/webrtc-service';
import { Livestream, LivestreamComment } from '@/types';

export default function LiveStreamPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [livestream, setLivestream] = useState<Livestream | null>(null);
    const [isLiked, setIsLiked] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState<LivestreamComment[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const handleEndStream = async () => {
        if (!livestream || !user) return;

        if (confirm('Are you sure you want to end this stream?')) {
            try {
                await endLivestream(livestream.id);
                // Update local state immediately
                setLivestream(prev => prev ? { ...prev, status: 'ended' } : null);
            } catch (err) {
                console.error('Error ending stream:', err);
                alert('Failed to end stream');
            }
        }
    };

    // Initialize camera/video stream and WebRTC
    useEffect(() => {
        if (!livestream || !user) return;

        // Don't initialize if stream is ended
        if (livestream.status === 'ended') {
            console.log('⏹️ Stream is ended, skipping WebRTC initialization');
            return;
        }

        let cleanupFn: (() => void) | undefined;
        let isMounted = true;

        const initialize = async () => {
            console.log('🔄 Initializing stream...');
            console.log('👤 User ID:', user.uid);
            console.log('🎥 Creator ID:', livestream.creatorId);

            const isCreator = user.uid === livestream.creatorId;
            console.log('🎭 Role:', isCreator ? 'CREATOR' : 'VIEWER');

            if (isCreator) {
                // CREATOR MODE: Initialize Camera & Start Hosting
                try {
                    if (videoRef.current) {
                        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                            throw new Error('Camera access not supported');
                        }

                        console.log('📷 Requesting camera access...');
                        const stream = await navigator.mediaDevices.getUserMedia({
                            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
                            audio: true,
                        });

                        if (!isMounted) {
                            console.log('🛑 Component unmounted during camera init, stopping tracks');
                            stream.getTracks().forEach(track => track.stop());
                            return;
                        }

                        console.log('✅ Camera stream obtained:', stream.id);
                        videoRef.current.srcObject = stream;
                        videoRef.current.muted = true; // Mute self to avoid feedback

                        // Explicitly play
                        try {
                            await videoRef.current.play();
                            console.log('▶️ Local video playing');
                        } catch (playErr) {
                            console.error('❌ Error playing local video:', playErr);
                        }

                        // Start WebRTC Hosting
                        const cleanup = webrtcService.startHosting(livestream.id, stream);
                        if (isMounted) {
                            cleanupFn = cleanup;
                            console.log('📡 Started hosting stream');
                        } else {
                            cleanup();
                        }
                    } else {
                        console.error('❌ videoRef is null');
                    }
                } catch (err: any) {
                    console.error('❌ Camera/Hosting error:', err.message);
                    alert(`Camera Error: ${err.message}`);
                }
            } else {
                // VIEWER MODE: Join Stream
                try {
                    console.log('👀 Joining stream as viewer...');

                    // Force muted initially for autoplay policy
                    if (videoRef.current) {
                        videoRef.current.muted = true;
                        setIsMuted(true);
                    }

                    const cleanup = await webrtcService.joinStream(livestream.id, user.uid, (remoteStream) => {
                        if (videoRef.current) {
                            console.log('🎥 Remote stream received:', remoteStream.id);
                            console.log('🎥 Audio tracks:', remoteStream.getAudioTracks().length);
                            console.log('🎥 Video tracks:', remoteStream.getVideoTracks().length);

                            videoRef.current.srcObject = remoteStream;

                            // Attempt to play
                            videoRef.current.play().then(() => {
                                console.log('▶️ Remote video playing');
                            }).catch(e => {
                                console.error('❌ Autoplay failed:', e);
                            });
                        }
                    });

                    if (isMounted) {
                        cleanupFn = cleanup;
                    } else {
                        cleanup();
                    }
                } catch (err: any) {
                    console.error('❌ Error joining stream:', err.message);
                }
            }
        };

        initialize();

        return () => {
            console.log('🧹 Cleanup triggered');
            isMounted = false;
            if (cleanupFn) cleanupFn();

            // Stop local tracks if creator
            if (videoRef.current?.srcObject instanceof MediaStream) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                console.log('🛑 Local tracks stopped');
            }
        };
    }, [livestream?.id, livestream?.creatorId, user?.uid, livestream?.status]);

    // Fetch livestream and comments, track viewers
    useEffect(() => {
        let unsubscribeComments: () => void;

        const fetchData = async () => {
            if (!params.id) return;

            try {
                setIsLoading(true);
                setError(null);

                // Fetch livestream
                const streamData = await getLivestream(params.id as string);
                setLivestream(streamData);

                // Only add viewer if stream is live
                if (streamData?.status === 'live') {
                    await streamService.addViewer(params.id as string);
                    console.log('Viewer added to stream');
                }

                // Subscribe to comments
                unsubscribeComments = subscribeLivestreamComments(params.id as string, (newComments) => {
                    setComments(newComments);
                });
            } catch (err: any) {
                setError(err.message || 'Failed to load livestream');
                console.error('Error fetching livestream:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        // Cleanup: remove viewer when leaving and unsubscribe
        return () => {
            if (params.id) {
                streamService.removeViewer(params.id as string).catch((err) => {
                    console.warn('Failed to remove viewer:', err);
                });
            }
            if (unsubscribeComments) {
                unsubscribeComments();
            }
        };
    }, [params.id]);

    // Poll for updated viewer count every 5 seconds
    useEffect(() => {
        if (!params.id || !livestream || livestream.status !== 'live') return;

        const pollInterval = setInterval(async () => {
            try {
                const viewerCount = await streamService.pollViewerCount(params.id as string);
                setLivestream((prev) => {
                    if (prev) {
                        return { ...prev, viewerCount };
                    }
                    return prev;
                });
            } catch (err) {
                console.warn('Error polling viewer count:', err);
            }
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [params.id, livestream?.status]);

    const handleAddComment = async () => {
        if (!commentText.trim() || !user || !livestream) return;

        try {
            await postLivestreamComment(
                livestream.id,
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

    const handleShare = async () => {
        if (!livestream) return;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: livestream.title,
                    text: livestream.description,
                    url: window.location.href,
                });
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing:', error);
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
                        <Link href="/live" className="text-2xl font-bold gradient-text">
                            ReelTalk
                        </Link>
                    </div>

                    {user && livestream && user.uid === livestream.creatorId && livestream.status === 'live' && (
                        <button
                            onClick={handleEndStream}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            End Stream
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Video Player Section */}
                    <div className="lg:col-span-2">
                        {/* Video Player */}
                        <div className={`relative bg-black rounded-xl overflow-hidden mb-6 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
                            {livestream?.status === 'ended' ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white z-10">
                                    <Clock className="w-16 h-16 mb-4 text-[hsl(var(--foreground-muted))]" />
                                    <h2 className="text-2xl font-bold mb-2">Stream Ended</h2>
                                    <p className="text-[hsl(var(--foreground-muted))]">This livestream has finished.</p>
                                    <p className="text-sm text-[hsl(var(--foreground-subtle))] mt-4">
                                        (Video recording is not available in this demo)
                                    </p>
                                </div>
                            ) : (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted={isMuted}
                                    controls={false}
                                    className="w-full h-full aspect-video object-cover bg-black"
                                    onLoadedMetadata={() => console.log('🎬 Video metadata loaded')}
                                    onPlay={() => console.log('▶️ Video playing event')}
                                    onPause={() => console.log('⏸️ Video pause event')}
                                    onError={(e) => console.error('❌ Video error event:', e)}
                                />
                            )}

                            {/* Video Controls (Only show if live) */}
                            {livestream?.status === 'live' && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setIsMuted(!isMuted)}
                                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                        >
                                            {isMuted ? (
                                                <MicOff className="w-5 h-5 text-white" />
                                            ) : (
                                                <Volume2 className="w-5 h-5 text-white" />
                                            )}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setIsFullscreen(!isFullscreen)}
                                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <Maximize className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            )}

                            {/* Live Badge */}
                            {livestream?.status === 'live' && (
                                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full animate-pulse">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                    LIVE
                                </div>
                            )}

                            {/* Viewer Count */}
                            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1 rounded-full">
                                <Users className="w-4 h-4" />
                                {livestream?.viewerCount.toLocaleString() || 0}
                            </div>
                        </div>

                        {/* Stream Info */}
                        <div className="glass-card p-6 mb-6">
                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[hsl(var(--primary))]"></div>
                                </div>
                            ) : error ? (
                                <div className="text-red-500 text-center py-8">{error}</div>
                            ) : livestream ? (
                                <>
                                    <h1 className="text-3xl font-bold mb-4">{livestream.title}</h1>

                                    {/* Creator Info */}
                                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-[hsl(var(--border))]">
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={livestream.creatorPhoto}
                                                alt={livestream.creatorName}
                                                className="w-12 h-12 rounded-full"
                                            />
                                            <div>
                                                <p className="font-bold">{livestream.creatorName}</p>
                                                <p className="text-sm text-[hsl(var(--foreground-muted))]">Creator</p>
                                            </div>
                                        </div>
                                        <button className="btn btn-primary">Follow</button>
                                    </div>

                                    {/* Description */}
                                    <p className="text-[hsl(var(--foreground-muted))] mb-6">
                                        {livestream.description}
                                    </p>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {livestream.tags.map((tag: string) => (
                                            <span
                                                key={tag}
                                                className="text-sm bg-[hsl(var(--surface))] text-[hsl(var(--foreground-muted))] px-3 py-1 rounded-full"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setIsLiked(!isLiked)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isLiked
                                                ? 'bg-red-500/20 text-red-500'
                                                : 'bg-[hsl(var(--surface))] text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-hover))]'
                                                }`}
                                        >
                                            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                                            Like
                                        </button>
                                        <button
                                            onClick={handleShare}
                                            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--surface))] text-[hsl(var(--foreground-muted))] rounded-lg hover:bg-[hsl(var(--surface-hover))] transition-all"
                                        >
                                            <Share2 className="w-5 h-5" />
                                            Share
                                        </button>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>

                    {/* Chat Section */}
                    <div className="lg:col-span-1">
                        <div className="glass-card h-full flex flex-col">
                            {/* Chat Header */}
                            <div className="p-4 border-b border-[hsl(var(--border))] flex items-center gap-2">
                                <MessageCircle className="w-5 h-5" />
                                <h3 className="font-bold">Live Chat</h3>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={comment.userPhoto}
                                                alt={comment.userName}
                                                className="w-8 h-8 rounded-full"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{comment.userName}</p>
                                                <p className="text-xs text-[hsl(var(--foreground-subtle))]">
                                                    {Math.floor((Date.now() - new Date(comment.createdAt).getTime()) / 60000)}m ago
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-[hsl(var(--foreground-muted))] ml-10">
                                            {comment.content}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 border-t border-[hsl(var(--border))]">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Send a message..."
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
